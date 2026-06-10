import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";

import type { AuthConfig } from "../src/auth-config.js";
import { buildApp, type BuildAppOptions } from "../src/app.js";
import type { JwksGetKey } from "../src/auth-guard.js";
import { WORKSPACE_ID_HEADER } from "../src/request-context.js";
import type {
  WorkspaceMembershipResolver,
  WorkspaceMembershipResolverInput,
  WorkspaceMembershipResolverResult
} from "../src/workspace-context-guard.js";

const kid = "workspace-app-wiring-key";
const issuer = "https://workspace-auth.example.com/";
const audience = "https://workspace-api.example.com";
const actorId = "auth0|workspace-actor";
const routeWorkspaceId = "workspace-route";
const harnessPath = `/internal/workspace-route-harness/${routeWorkspaceId}`;

let privateKey: CryptoKey;
let getKey: JwksGetKey;

const apps: FastifyInstance[] = [];

const authConfig: AuthConfig = {
  AUTH0_ISSUER_URL: issuer,
  AUTH0_AUDIENCE: audience,
  JWKS_CACHE_TTL_SECONDS: 600,
  JWKS_REFRESH_COOLDOWN_SECONDS: 30,
  TOKEN_LEEWAY_SECONDS: 0
};

beforeAll(async () => {
  const keys = await generateKeyPair("RS256", { modulusLength: 2048 });
  privateKey = keys.privateKey;

  const jwk = await exportJWK(keys.publicKey);
  Object.assign(jwk, { kid, alg: "RS256", use: "sig" });

  getKey = createLocalJWKSet({ keys: [jwk] });
});

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

async function token(): Promise<string> {
  return new SignJWT({ sub: actorId })
    .setProtectedHeader({ alg: "RS256", kid })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime("5m")
    .sign(privateKey);
}

function member(
  calls: WorkspaceMembershipResolverInput[] = []
): WorkspaceMembershipResolver {
  return (input) => {
    calls.push(input);
    return { outcome: "member" };
  };
}

function outcome(
  value: WorkspaceMembershipResolverResult["outcome"]
): WorkspaceMembershipResolver {
  return () => ({ outcome: value });
}

function appWith(options: BuildAppOptions): FastifyInstance {
  const app = buildApp({ logger: false, jwksGetKey: getKey, ...options });
  apps.push(app);
  return app;
}

function guarded(resolver: WorkspaceMembershipResolver = member()) {
  return appWith({
    authConfig,
    enableInternalHarnessRoutes: true,
    workspaceMembershipResolver: resolver
  });
}

async function get(app: FastifyInstance, path = harnessPath) {
  const bearer = await token();

  const response = await app.inject({
    method: "GET",
    url: path,
    headers: {
      authorization: `Bearer ${bearer}`,
      [WORKSPACE_ID_HEADER]: "workspace-header"
    }
  });

  return { response, body: response.json() };
}

describe("workspace context app wiring", () => {
  it("keeps health and disabled harness boundaries", async () => {
    const health = await guarded().inject({ method: "GET", url: "/health" });
    expect(health.statusCode).toBe(200);

    const disabled = await get(appWith({ authConfig }));
    expect(disabled.response.statusCode).toBe(404);
    expect(disabled.body.code).toBe("NOT_FOUND");
  });

  it("keeps harness unguarded without resolver", async () => {
    const { response, body } = await get(
      appWith({ authConfig, enableInternalHarnessRoutes: true })
    );

    expect(response.statusCode).toBe(200);
    expect(body.requestContext).toEqual({ workspaceId: null, actorId: null });
  });

  it("emits route workspace context after membership succeeds", async () => {
    const calls: WorkspaceMembershipResolverInput[] = [];
    const { response, body } = await get(guarded(member(calls)));

    expect(response.statusCode).toBe(200);
    expect(calls).toEqual([{ actorId, workspaceId: routeWorkspaceId }]);
    expect(body.requestContext).toEqual({
      actorId,
      workspaceId: routeWorkspaceId
    });
  });

  it.each([
    ["workspace_not_found", 404, "WORKSPACE_NOT_FOUND"],
    ["not_member", 404, "WORKSPACE_NOT_FOUND"],
    ["unavailable", 503, "WORKSPACE_MEMBERSHIP_UNAVAILABLE"]
  ] as const)("maps %s resolver result", async (result, status, code) => {
    const { response, body } = await get(guarded(outcome(result)));

    expect(response.statusCode).toBe(status);
    expect(body.code).toBe(code);
  });

  it("maps thrown resolver errors without leaking details", async () => {
    const resolver: WorkspaceMembershipResolver = () => {
      throw new Error("private membership failure");
    };

    const { response, body } = await get(guarded(resolver));

    expect(response.statusCode).toBe(503);
    expect(body.code).toBe("WORKSPACE_MEMBERSHIP_UNAVAILABLE");
    expect(JSON.stringify(body)).not.toContain("private membership failure");
  });

  it("requires auth before workspace context and rejects invalid route workspaceId", async () => {
    const missingAuth = await guarded().inject({
      method: "GET",
      url: harnessPath,
      headers: { [WORKSPACE_ID_HEADER]: "workspace-header" }
    });

    expect(missingAuth.statusCode).toBe(401);
    expect(missingAuth.json().code).toBe("MISSING_AUTHORIZATION_TOKEN");

    const invalid = await get(
      guarded(),
      "/internal/workspace-route-harness/%20%20%20"
    );

    expect(invalid.response.statusCode).toBe(400);
    expect(invalid.body.code).toBe("INVALID_WORKSPACE_ID");
  });

  it("does not attach roles or permissions to request context", async () => {
    const { body } = await get(guarded());
    const keys = Object.keys(body.requestContext).sort((left, right) =>
      left.localeCompare(right)
    );

    expect(keys).toEqual(["actorId", "workspaceId"]);
    expect(body.requestContext).not.toHaveProperty("permissions");
    expect(body.requestContext).not.toHaveProperty("roles");
    expect(body.requestContext).not.toHaveProperty("grantedPermissions");
  });

  it("keeps transitional header mode isolated when authConfig is absent", async () => {
    const app = appWith({
      enableInternalHarnessRoutes: true,
      workspaceMembershipResolver: member()
    });

    const response = await app.inject({
      method: "GET",
      url: harnessPath,
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-from-header",
        "x-nashir-actor-id": "actor-from-header"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().requestContext).toEqual({
      workspaceId: "workspace-from-header",
      actorId: "actor-from-header"
    });
  });
});
