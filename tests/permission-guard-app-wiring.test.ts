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

const identity = {
  kid: "permission-app-wiring-key",
  issuer: "https://permission-auth.example.com/",
  audience: "https://permission-api.example.com",
  actorId: "auth0|permission-actor"
} as const;

const workspace = {
  route: "workspace-route",
  header: "workspace-header",
  other: "workspace-other"
} as const;

const permission = {
  allowed: "harness.read",
  missing: "harness.admin"
} as const;

const authConfig: AuthConfig = {
  AUTH0_ISSUER_URL: identity.issuer,
  AUTH0_AUDIENCE: identity.audience,
  JWKS_CACHE_TTL_SECONDS: 600,
  JWKS_REFRESH_COOLDOWN_SECONDS: 30,
  TOKEN_LEEWAY_SECONDS: 0
};

let signingKey: CryptoKey;
let resolveJwksKey: JwksGetKey;

const openApps = new Set<FastifyInstance>();

interface HarnessRequestOptions {
  requiredPermission?: string;
  workspaceId?: string;
  query?: string;
  claims?: Record<string, unknown>;
  headers?: Record<string, string>;
  payload?: unknown;
}

beforeAll(async () => {
  const keyPair = await generateKeyPair("RS256", { modulusLength: 2048 });
  signingKey = keyPair.privateKey;

  const publicJwk = await exportJWK(keyPair.publicKey);
  publicJwk.kid = identity.kid;
  publicJwk.alg = "RS256";
  publicJwk.use = "sig";

  resolveJwksKey = createLocalJWKSet({ keys: [publicJwk] });
});

afterEach(async () => {
  await Promise.all([...openApps].map((app) => app.close()));
  openApps.clear();
});

function remember(app: FastifyInstance): FastifyInstance {
  openApps.add(app);
  return app;
}

function appWith(options: BuildAppOptions): FastifyInstance {
  return remember(
    buildApp({ logger: false, jwksGetKey: resolveJwksKey, ...options })
  );
}

function workspacePermissionPath(
  requiredPermission: string = permission.allowed,
  workspaceId: string = workspace.route
): string {
  return `/internal/workspace-permission-guard-harness/${workspaceId}/${requiredPermission}`;
}

function membership(
  calls: WorkspaceMembershipResolverInput[] = []
): WorkspaceMembershipResolver {
  return (input) => {
    calls.push(input);
    return { outcome: "member" };
  };
}

function membershipOutcome(
  outcome: WorkspaceMembershipResolverResult["outcome"]
): WorkspaceMembershipResolver {
  return () => ({ outcome });
}

function protectedApp(
  resolver: WorkspaceMembershipResolver = membership()
): FastifyInstance {
  return appWith({
    authConfig,
    enableInternalPermissionGuardHarnessRoutes: true,
    workspaceMembershipResolver: resolver
  });
}

async function bearerToken(
  claims: Record<string, unknown> = {}
): Promise<string> {
  const jwt = new SignJWT({ ...claims, sub: identity.actorId });

  return jwt
    .setProtectedHeader({ alg: "RS256", kid: identity.kid })
    .setIssuedAt()
    .setIssuer(identity.issuer)
    .setAudience(identity.audience)
    .setExpirationTime("5m")
    .sign(signingKey);
}

async function injectHarness(
  app: FastifyInstance,
  options: HarnessRequestOptions = {}
) {
  const token = await bearerToken(options.claims);
  const query = options.query ? `?${options.query}` : "";

  const response = await app.inject({
    method: "GET",
    url: `${workspacePermissionPath(
      options.requiredPermission,
      options.workspaceId
    )}${query}`,
    headers: {
      authorization: `Bearer ${token}`,
      [WORKSPACE_ID_HEADER]: workspace.header,
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
  it("keeps health ungated and the workspace permission harness disabled by default", async () => {
    const app = appWith({
      authConfig,
      workspaceMembershipResolver: membership()
    });

    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.statusCode).toBe(200);

    const token = await bearerToken();
    const disabled = await app.inject({
      method: "GET",
      url: workspacePermissionPath(),
      headers: {
        authorization: `Bearer ${token}`,
        [WORKSPACE_ID_HEADER]: workspace.header
      }
    });

    expect(disabled.statusCode).toBe(404);
    expect(disabled.json().code).toBe("NOT_FOUND");
  });

  it("requires Auth0 identity verification before the workspace permission harness runs", async () => {
    const response = await protectedApp().inject({
      method: "GET",
      url: workspacePermissionPath(),
      headers: { [WORKSPACE_ID_HEADER]: workspace.header }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe("MISSING_AUTHORIZATION_TOKEN");
  });

  it("requires workspace context resolution before permission enforcement", async () => {
    const { response, body } = await injectHarness(
      protectedApp(membershipOutcome("not_member"))
    );

    expect(response.statusCode).toBe(404);
    expect(body.code).toBe("WORKSPACE_NOT_FOUND");
    expect(JSON.stringify(body)).not.toContain("FORBIDDEN");
  });

  it("allows a request only after membership and permission both succeed", async () => {
    const calls: WorkspaceMembershipResolverInput[] = [];
    const { response, body } = await injectHarness(
      protectedApp(membership(calls))
    );

    expect(response.statusCode).toBe(200);
    expect(calls).toEqual([
      { actorId: identity.actorId, workspaceId: workspace.route }
    ]);
    expect(body).toMatchObject({
      ok: true,
      workspaceId: workspace.route,
      requiredPermission: permission.allowed,
      decision: "allowed",
      requestContext: {
        actorId: identity.actorId,
        workspaceId: workspace.route
      }
    });
    expect(body).not.toHaveProperty("grantedPermissions");
  });

  it.each([
    ["disclosing", undefined, 403, "FORBIDDEN"],
    ["non-disclosing", "disclosureMode=non_disclosing", 404, "NOT_FOUND"]
  ] as const)(
    "maps missing permission through %s disclosure behavior",
    async (_label, query, statusCode, code) => {
      const { response, body } = await injectHarness(protectedApp(), {
        requiredPermission: permission.missing,
        query
      });

      expect(response.statusCode).toBe(statusCode);
      expect(body.code).toBe(code);
      expect(body.requiredPermission).toBe(permission.missing);
      expect(JSON.stringify(body)).not.toContain(identity.actorId);
      expect(body).not.toHaveProperty("grantedPermissions");
    }
  );

  it("returns 404 for cross-workspace resource mismatch even with a granted permission", async () => {
    const { response, body } = await injectHarness(protectedApp(), {
      query: `resourceWorkspaceId=${workspace.other}`
    });

    expect(response.statusCode).toBe(404);
    expect(body.code).toBe("NOT_FOUND");
    expect(body.requiredPermission).toBe(permission.allowed);
  });

  it("uses the route workspaceId rather than the transitional header workspaceId", async () => {
    const calls: WorkspaceMembershipResolverInput[] = [];
    const { response, body } = await injectHarness(
      protectedApp(membership(calls))
    );

    expect(response.statusCode).toBe(200);
    expect(calls).toEqual([
      { actorId: identity.actorId, workspaceId: workspace.route }
    ]);
    expect(body.requestContext.workspaceId).toBe(workspace.route);
  });

  it.each([
    [
      "client input",
      {
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
      }
    ],
    [
      "Auth0 claims",
      {
        claims: {
          permissions: ["harness.admin"],
          scope: "harness.admin",
          "https://nashir.example.com/permissions": ["harness.admin"]
        }
      }
    ]
  ] as Array<[string, HarnessRequestOptions]>)(
    "does not read granted permissions from %s",
    async (_source, options) => {
      const { response, body } = await injectHarness(protectedApp(), {
        ...options,
        requiredPermission: permission.missing
      });

      expect(response.statusCode).toBe(403);
      expect(body.code).toBe("FORBIDDEN");
      expect(body.requiredPermission).toBe(permission.missing);
    }
  );

  it("does not introduce public or product routes", async () => {
    const app = protectedApp();

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
