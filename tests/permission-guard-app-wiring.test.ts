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

const kid = "permission-app-wiring-key";
const issuer = "https://permission-auth.example.com/";
const audience = "https://permission-api.example.com";
const actorId = "auth0|permission-actor";
const routeWorkspaceId = "workspace-route";
const allowedPermission = "harness.read";
const missingPermission = "harness.admin";

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

async function token(claims: Record<string, unknown> = {}): Promise<string> {
  return new SignJWT({ ...claims, sub: actorId })
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
    enableInternalPermissionGuardHarnessRoutes: true,
    workspaceMembershipResolver: resolver
  });
}

function harnessPath(
  requiredPermission = allowedPermission,
  workspaceId = routeWorkspaceId
) {
  return `/internal/workspace-permission-guard-harness/${workspaceId}/${requiredPermission}`;
}

interface InjectOptions {
  requiredPermission?: string;
  workspaceId?: string;
  query?: string;
  headerWorkspaceId?: string;
  claims?: Record<string, unknown>;
  payload?: unknown;
  headers?: Record<string, string>;
}

async function get(app: FastifyInstance, options: InjectOptions = {}) {
  const bearer = await token(options.claims);
  const query = options.query ? `?${options.query}` : "";

  const response = await app.inject({
    method: "GET",
    url: `${harnessPath(
      options.requiredPermission,
      options.workspaceId
    )}${query}`,
    headers: {
      authorization: `Bearer ${bearer}`,
      [WORKSPACE_ID_HEADER]: options.headerWorkspaceId ?? "workspace-header",
      ...options.headers
    },
    payload:
      options.payload === undefined
        ? undefined
        : JSON.stringify(options.payload)
  });

  return { response, body: response.json() };
}

describe("permission guard app wiring", () => {
  it("keeps health ungated and workspace permission harness disabled by default", async () => {
    const app = appWith({ authConfig, workspaceMembershipResolver: member() });

    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.statusCode).toBe(200);

    const bearer = await token();
    const disabled = await app.inject({
      method: "GET",
      url: harnessPath(),
      headers: {
        authorization: `Bearer ${bearer}`,
        [WORKSPACE_ID_HEADER]: "workspace-header"
      }
    });

    expect(disabled.statusCode).toBe(404);
    expect(disabled.json().code).toBe("NOT_FOUND");
  });

  it("requires successful Auth0 identity verification when authConfig exists", async () => {
    const response = await guarded().inject({
      method: "GET",
      url: harnessPath(),
      headers: { [WORKSPACE_ID_HEADER]: "workspace-header" }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe("MISSING_AUTHORIZATION_TOKEN");
  });

  it("requires successful workspace context resolution before permission enforcement", async () => {
    const { response, body } = await get(guarded(outcome("not_member")));

    expect(response.statusCode).toBe(404);
    expect(body.code).toBe("WORKSPACE_NOT_FOUND");
    expect(JSON.stringify(body)).not.toContain("FORBIDDEN");
  });

  it("allows after workspace membership succeeds and permission is granted", async () => {
    const calls: WorkspaceMembershipResolverInput[] = [];
    const { response, body } = await get(guarded(member(calls)));

    expect(response.statusCode).toBe(200);
    expect(calls).toEqual([{ actorId, workspaceId: routeWorkspaceId }]);
    expect(body).toMatchObject({
      ok: true,
      workspaceId: routeWorkspaceId,
      requiredPermission: allowedPermission,
      decision: "allowed",
      requestContext: {
        actorId,
        workspaceId: routeWorkspaceId
      }
    });
    expect(body).not.toHaveProperty("grantedPermissions");
  });

  it("returns 403 for missing permission in disclosing mode", async () => {
    const { response, body } = await get(guarded(), {
      requiredPermission: missingPermission
    });

    expect(response.statusCode).toBe(403);
    expect(body.code).toBe("FORBIDDEN");
    expect(body.requiredPermission).toBe(missingPermission);
    expect(JSON.stringify(body)).not.toContain(actorId);
    expect(body).not.toHaveProperty("grantedPermissions");
  });

  it("returns 404 for missing permission in non-disclosing mode", async () => {
    const { response, body } = await get(guarded(), {
      requiredPermission: missingPermission,
      query: "disclosureMode=non_disclosing"
    });

    expect(response.statusCode).toBe(404);
    expect(body.code).toBe("NOT_FOUND");
    expect(body.requiredPermission).toBe(missingPermission);
    expect(JSON.stringify(body)).not.toContain(actorId);
    expect(body).not.toHaveProperty("grantedPermissions");
  });

  it("returns 404 for cross-workspace resource mismatch even when permission is granted", async () => {
    const { response, body } = await get(guarded(), {
      requiredPermission: allowedPermission,
      query: "resourceWorkspaceId=workspace-other"
    });

    expect(response.statusCode).toBe(404);
    expect(body.code).toBe("NOT_FOUND");
    expect(body.requiredPermission).toBe(allowedPermission);
  });

  it("uses route workspaceId rather than header workspaceId for permission context", async () => {
    const calls: WorkspaceMembershipResolverInput[] = [];
    const { response, body } = await get(guarded(member(calls)), {
      headerWorkspaceId: "workspace-from-header"
    });

    expect(response.statusCode).toBe(200);
    expect(calls).toEqual([{ actorId, workspaceId: routeWorkspaceId }]);
    expect(body.requestContext.workspaceId).toBe(routeWorkspaceId);
  });

  it("does not read granted permissions from headers, body, or query string", async () => {
    const { response, body } = await get(guarded(), {
      requiredPermission: missingPermission,
      query: "grantedPermissions=harness.admin&permissions=harness.admin",
      headers: {
        "content-type": "application/json",
        "x-nashir-permissions": "harness.admin",
        "x-nashir-granted-permissions": "harness.admin"
      },
      payload: {
        permissions: ["harness.admin"],
        grantedPermissions: ["harness.admin"]
      }
    });

    expect(response.statusCode).toBe(403);
    expect(body.code).toBe("FORBIDDEN");
    expect(body.requiredPermission).toBe(missingPermission);
  });

  it("does not read granted permissions from Auth0 claims", async () => {
    const { response, body } = await get(guarded(), {
      requiredPermission: missingPermission,
      claims: {
        permissions: ["harness.admin"],
        scope: "harness.admin",
        "https://nashir.example.com/permissions": ["harness.admin"]
      }
    });

    expect(response.statusCode).toBe(403);
    expect(body.code).toBe("FORBIDDEN");
    expect(body.requiredPermission).toBe(missingPermission);
  });

  it("does not introduce public or product routes", async () => {
    const app = guarded();

    expect(
      app.hasRoute({
        method: "GET",
        url: "/internal/workspace-permission-guard-harness/:workspaceId/:requiredPermission"
      })
    ).toBe(true);
    expect(app.hasRoute({ method: "GET", url: "/products" })).toBe(false);
    expect(
      app.hasRoute({ method: "GET", url: "/workspaces/:workspaceId/products" })
    ).toBe(false);
  });
});
