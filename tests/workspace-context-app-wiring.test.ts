import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";

import type { AuthConfig } from "../src/auth-config.js";
import { buildApp } from "../src/app.js";
import type { JwksGetKey } from "../src/auth-guard.js";
import {
  CORRELATION_ID_HEADER,
  WORKSPACE_ID_HEADER
} from "../src/request-context.js";
import type {
  WorkspaceMembershipResolver,
  WorkspaceMembershipResolverInput,
  WorkspaceMembershipResolverResult
} from "../src/workspace-context-guard.js";

const TEST_KID = "workspace-app-wiring-test-key";
const TEST_ISSUER = "https://test.auth0.example.com/";
const TEST_AUDIENCE = "https://api.test.nashir.app";
const TEST_ACTOR_ID = "auth0|workspace-app-wiring-actor";
const ROUTE_WORKSPACE_ID = "workspace-route";
const HEADER_WORKSPACE_ID = "workspace-header";
const WORKSPACE_HARNESS_PATH = `/internal/workspace-route-harness/${ROUTE_WORKSPACE_ID}`;

let privateKey: CryptoKey;
let getKey: JwksGetKey;

const apps: FastifyInstance[] = [];

const TEST_AUTH_CONFIG: AuthConfig = {
  AUTH0_ISSUER_URL: TEST_ISSUER,
  AUTH0_AUDIENCE: TEST_AUDIENCE,
  JWKS_CACHE_TTL_SECONDS: 600,
  JWKS_REFRESH_COOLDOWN_SECONDS: 30,
  TOKEN_LEEWAY_SECONDS: 0
};

beforeAll(async () => {
  const pair = await generateKeyPair("RS256", { modulusLength: 2048 });
  privateKey = pair.privateKey;

  const jwk = await exportJWK(pair.publicKey);
  jwk.kid = TEST_KID;
  jwk.alg = "RS256";
  jwk.use = "sig";

  getKey = createLocalJWKSet({ keys: [jwk] });
});

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

async function signToken(sub = TEST_ACTOR_ID): Promise<string> {
  return new SignJWT({ sub })
    .setProtectedHeader({ alg: "RS256", kid: TEST_KID })
    .setIssuedAt()
    .setIssuer(TEST_ISSUER)
    .setAudience(TEST_AUDIENCE)
    .setExpirationTime("5m")
    .sign(privateKey);
}

function buildWorkspaceApp(
  input: {
    enableInternalHarnessRoutes?: boolean;
    resolver?: WorkspaceMembershipResolver;
    authConfig?: AuthConfig;
  } = {}
): FastifyInstance {
  const app = buildApp({
    logger: false,
    enableInternalHarnessRoutes: input.enableInternalHarnessRoutes,
    authConfig: input.authConfig ?? TEST_AUTH_CONFIG,
    jwksGetKey: getKey,
    workspaceMembershipResolver: input.resolver
  });

  apps.push(app);
  return app;
}

function memberResolver(
  calls: WorkspaceMembershipResolverInput[] = []
): WorkspaceMembershipResolver {
  return (input) => {
    calls.push(input);
    return { outcome: "member" };
  };
}

function outcomeResolver(
  outcome: WorkspaceMembershipResolverResult["outcome"]
): WorkspaceMembershipResolver {
  return () => ({ outcome });
}

async function injectWorkspaceHarness(
  app: FastifyInstance,
  input: {
    token?: string;
    url?: string;
    headers?: Record<string, string>;
  } = {}
) {
  const token = input.token ?? (await signToken());

  const response = await app.inject({
    method: "GET",
    url: input.url ?? WORKSPACE_HARNESS_PATH,
    headers: {
      authorization: `Bearer ${token}`,
      ...input.headers
    }
  });

  return { statusCode: response.statusCode, body: response.json() };
}

describe("workspace context app wiring — route-scoped harness", () => {
  it("keeps /health ungated when auth and workspace resolver are configured", async () => {
    const app = buildWorkspaceApp({
      enableInternalHarnessRoutes: true,
      resolver: memberResolver()
    });

    const response = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "ok",
      service: "nashir-backend",
      runtime: "node"
    });
  });

  it("keeps the internal workspace harness disabled by default", async () => {
    const app = buildWorkspaceApp({
      resolver: memberResolver()
    });

    const { statusCode, body } = await injectWorkspaceHarness(app);

    expect(statusCode).toBe(404);
    expect(body.code).toBe("NOT_FOUND");
  });

  it("does not wire workspaceContextGuard when resolver is absent", async () => {
    const app = buildWorkspaceApp({
      enableInternalHarnessRoutes: true
    });

    const { statusCode, body } = await injectWorkspaceHarness(app);

    expect(statusCode).toBe(200);
    expect(body.requestContext).toEqual({
      workspaceId: null,
      actorId: null
    });
  });

  it("uses authGuard identity and route workspaceId when membership is valid", async () => {
    const calls: WorkspaceMembershipResolverInput[] = [];

    const app = buildWorkspaceApp({
      enableInternalHarnessRoutes: true,
      resolver: memberResolver(calls)
    });

    const { statusCode, body } = await injectWorkspaceHarness(app, {
      headers: {
        [WORKSPACE_ID_HEADER]: HEADER_WORKSPACE_ID,
        [CORRELATION_ID_HEADER]: "caller-correlation-id"
      }
    });

    expect(statusCode).toBe(200);
    expect(calls).toEqual([
      {
        actorId: TEST_ACTOR_ID,
        workspaceId: ROUTE_WORKSPACE_ID
      }
    ]);
    expect(body.workspaceId).toBe(ROUTE_WORKSPACE_ID);
    expect(body.requestContext).toEqual({
      actorId: TEST_ACTOR_ID,
      workspaceId: ROUTE_WORKSPACE_ID
    });
    expect(body.correlationId).toBe("caller-correlation-id");
  });

  it.each([
    ["workspace_not_found", "WORKSPACE_NOT_FOUND"],
    ["not_member", "WORKSPACE_NOT_FOUND"]
  ] as const)(
    "returns 404 when resolver outcome is %s",
    async (outcome, expectedCode) => {
      const app = buildWorkspaceApp({
        enableInternalHarnessRoutes: true,
        resolver: outcomeResolver(outcome)
      });

      const { statusCode, body } = await injectWorkspaceHarness(app);

      expect(statusCode).toBe(404);
      expect(body.code).toBe(expectedCode);
    }
  );

  it("returns 503 when membership resolver reports unavailable", async () => {
    const app = buildWorkspaceApp({
      enableInternalHarnessRoutes: true,
      resolver: outcomeResolver("unavailable")
    });

    const { statusCode, body } = await injectWorkspaceHarness(app);

    expect(statusCode).toBe(503);
    expect(body.code).toBe("WORKSPACE_MEMBERSHIP_UNAVAILABLE");
  });

  it("returns 503 when membership resolver throws", async () => {
    const app = buildWorkspaceApp({
      enableInternalHarnessRoutes: true,
      resolver: () => {
        throw new Error("membership lookup unavailable");
      }
    });

    const { statusCode, body } = await injectWorkspaceHarness(app);

    expect(statusCode).toBe(503);
    expect(body.code).toBe("WORKSPACE_MEMBERSHIP_UNAVAILABLE");
    expect(JSON.stringify(body)).not.toContain("membership lookup unavailable");
  });

  it("requires authGuard-produced verified identity before workspace resolution", async () => {
    const app = buildWorkspaceApp({
      enableInternalHarnessRoutes: true,
      resolver: memberResolver()
    });

    const response = await app.inject({
      method: "GET",
      url: WORKSPACE_HARNESS_PATH,
      headers: {
        [WORKSPACE_ID_HEADER]: HEADER_WORKSPACE_ID
      }
    });

    const body = response.json();

    expect(response.statusCode).toBe(401);
    expect(body.code).toBe("MISSING_AUTHORIZATION_TOKEN");
  });

  it("does not replace an invalid route workspaceId with header or query values", async () => {
    const app = buildWorkspaceApp({
      enableInternalHarnessRoutes: true,
      resolver: memberResolver()
    });

    const { statusCode, body } = await injectWorkspaceHarness(app, {
      url: "/internal/workspace-route-harness/%20%20%20",
      headers: {
        [WORKSPACE_ID_HEADER]: HEADER_WORKSPACE_ID
      }
    });

    expect(statusCode).toBe(400);
    expect(body.code).toBe("INVALID_WORKSPACE_ID");
  });

  it("does not attach permissions or roles to the emitted request context", async () => {
    const app = buildWorkspaceApp({
      enableInternalHarnessRoutes: true,
      resolver: memberResolver()
    });

    const { body } = await injectWorkspaceHarness(app);

    expect(Object.keys(body.requestContext).sort()).toEqual([
      "actorId",
      "workspaceId"
    ]);
    expect(body.requestContext).not.toHaveProperty("permissions");
    expect(body.requestContext).not.toHaveProperty("roles");
    expect(body.requestContext).not.toHaveProperty("grantedPermissions");
  });
});

describe("workspace context app wiring — transitional header mode isolation", () => {
  it("keeps no-authConfig transitional header behavior isolated from workspaceContextGuard", async () => {
    const app = buildApp({
      logger: false,
      enableInternalHarnessRoutes: true,
      workspaceMembershipResolver: memberResolver(),
      jwksGetKey: getKey
    });

    apps.push(app);

    const response = await app.inject({
      method: "GET",
      url: WORKSPACE_HARNESS_PATH,
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-from-header",
        "x-nashir-actor-id": "actor-from-header"
      }
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.requestContext).toEqual({
      workspaceId: "workspace-from-header",
      actorId: "actor-from-header"
    });
  });
});
