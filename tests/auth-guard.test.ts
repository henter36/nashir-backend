import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";

import type { AuthConfig } from "../src/auth-config.js";
import { buildApp } from "../src/app.js";
import type { JwksGetKey } from "../src/auth-guard.js";

// ---------------------------------------------------------------------------
// Test fixtures — generated once for the entire suite
// ---------------------------------------------------------------------------

const TEST_KID = "test-key-2048";
const TEST_ISSUER = "https://test.auth0.example.com/";
const TEST_AUDIENCE = "https://api.test.nashir.app";

let privateKey: CryptoKey;
let getKey: JwksGetKey;

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_AUTH_ROUTE = "/__test/auth-guard";
const apps: FastifyInstance[] = [];

function buildTestApp(configOverrides?: Partial<AuthConfig>) {
  const app = buildApp({
    logger: false,
    authConfig: { ...TEST_AUTH_CONFIG, ...configOverrides },
    jwksGetKey: getKey
  });

  app.get(TEST_AUTH_ROUTE, async (request) => ({
    ok: true,
    verifiedIdentityContext: request.verifiedIdentityContext ?? null,
    requestContextActorId: request.requestContext?.actorId ?? null
  }));

  apps.push(app);
  return app;
}

async function signToken(
  payload: Record<string, unknown>,
  {
    kid = TEST_KID,
    alg = "RS256",
    issuer = TEST_ISSUER,
    audience = TEST_AUDIENCE,
    expiresIn = "5m",
    signingKey = privateKey
  }: {
    kid?: string;
    alg?: string;
    issuer?: string;
    audience?: string | string[];
    expiresIn?: string;
    signingKey?: CryptoKey;
  } = {}
): Promise<string> {
  const builder = new SignJWT(payload)
    .setProtectedHeader({ alg, kid })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime(expiresIn);

  return builder.sign(signingKey);
}

afterEach(async () => {
  await Promise.all(apps.map((a) => a.close()));
  apps.length = 0;
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe("authGuard — valid token", () => {
  it("accepts a well-formed RS256 token and binds actorId", async () => {
    const app = buildTestApp();
    const token = await signToken({ sub: "auth0|user-abc-123" });

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.verifiedIdentityContext).toEqual({
      actorId: "auth0|user-abc-123"
    });
    expect(body.requestContextActorId).toBeNull();
  });

  it("does not expose workspaceId from authGuard (workspaceContextGuard responsibility)", async () => {
    const app = buildTestApp();
    const token = await signToken({ sub: "auth0|user-xyz" });

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: `Bearer ${token}` }
    });

    const body = res.json();
    expect(body.verifiedIdentityContext).not.toHaveProperty("workspaceId");
  });
});

// ---------------------------------------------------------------------------
// Token extraction failures
// ---------------------------------------------------------------------------

describe("authGuard — missing / malformed Authorization header", () => {
  it("returns 401 when Authorization header is absent", async () => {
    const app = buildTestApp();

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE
    });

    // No Authorization header → falls back to header-based path → 401 (missing headers)
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when Authorization header has wrong scheme", async () => {
    const app = buildTestApp();

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: "Basic dXNlcjpwYXNz" }
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.errorCode).toBe("permission.denied");
  });

  it("returns 401 when Bearer token value is blank", async () => {
    const app = buildTestApp();

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: "Bearer " }
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.errorCode).toBe("permission.denied");
  });
});

// ---------------------------------------------------------------------------
// Harness header boundary
// ---------------------------------------------------------------------------

describe("authGuard — harness header boundary", () => {
  it("rejects harness headers when authConfig is enabled and Authorization is absent", async () => {
    const app = buildTestApp();

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: {
        "x-nashir-actor-id": "actor-from-header",
        "x-nashir-workspace-id": "workspace-from-header"
      }
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.errorCode).toBe("permission.denied");
  });
});

// ---------------------------------------------------------------------------
// Structural / header failures
// ---------------------------------------------------------------------------

describe("authGuard — malformed token structure", () => {
  it("returns 401 for a non-JWT string", async () => {
    const app = buildTestApp();

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: "Bearer not.a.jwt.at.all" }
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.errorCode).toBe("permission.denied");
  });

  it("returns 401 when kid is absent from header", async () => {
    const app = buildTestApp();
    // Sign without kid
    const token = await new SignJWT({ sub: "auth0|user-123" })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuedAt()
      .setIssuer(TEST_ISSUER)
      .setAudience(TEST_AUDIENCE)
      .setExpirationTime("5m")
      .sign(privateKey);

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.errorCode).toBe("permission.denied");
  });
});

// ---------------------------------------------------------------------------
// Claim validation failures
// ---------------------------------------------------------------------------

describe("authGuard — claim validation", () => {
  it("returns 401 for wrong issuer", async () => {
    const app = buildTestApp();
    const token = await signToken(
      { sub: "auth0|user-123" },
      { issuer: "https://evil.example.com/" }
    );

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.errorCode).toBe("permission.denied");
  });

  it("returns 401 for wrong audience", async () => {
    const app = buildTestApp();
    const token = await signToken(
      { sub: "auth0|user-123" },
      { audience: "https://other-api.example.com" }
    );

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.errorCode).toBe("permission.denied");
  });

  it("returns 401 for expired token (no leeway)", async () => {
    const app = buildTestApp({ TOKEN_LEEWAY_SECONDS: 0 });
    const token = await signToken(
      { sub: "auth0|user-123" },
      { expiresIn: "-1s" }
    );

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(res.statusCode).toBe(401);
  });

  it("accepts a token expired within TOKEN_LEEWAY_SECONDS", async () => {
    const app = buildTestApp({ TOKEN_LEEWAY_SECONDS: 60 });
    // Expired 30 seconds ago, within 60s leeway
    const token = await signToken(
      { sub: "auth0|user-123" },
      { expiresIn: "-30s" }
    );

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(res.statusCode).toBe(200);
  });

  it("returns 401 when sub is absent", async () => {
    const app = buildTestApp();
    // Build a token without sub — SignJWT allows omitting sub
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "RS256", kid: TEST_KID })
      .setIssuedAt()
      .setIssuer(TEST_ISSUER)
      .setAudience(TEST_AUDIENCE)
      .setExpirationTime("5m")
      .sign(privateKey);

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.errorCode).toBe("permission.denied");
  });

  it("returns 401 when iat is present but not numeric", async () => {
    const app = buildTestApp();

    const payload = {
      sub: "auth0|user-123",
      iss: TEST_ISSUER,
      aud: TEST_AUDIENCE,
      exp: Math.floor(Date.now() / 1000) + 300,
      iat: "not-a-number"
    };

    const protectedHeader = Buffer.from(
      JSON.stringify({ alg: "RS256", kid: TEST_KID })
    ).toString("base64url");

    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      "base64url"
    );

    const signingInput = `${protectedHeader}.${encodedPayload}`;
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      privateKey,
      Buffer.from(signingInput)
    );

    const token = `${signingInput}.${Buffer.from(signature).toString("base64url")}`;

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.errorCode).toBe("permission.denied");
  });

  it("returns 401 when iat is in the future beyond leeway", async () => {
    const app = buildTestApp({ TOKEN_LEEWAY_SECONDS: 0 });
    const futureIat = Math.floor(Date.now() / 1000) + 120;

    const token = await new SignJWT({ sub: "auth0|user-123", iat: futureIat })
      .setProtectedHeader({ alg: "RS256", kid: TEST_KID })
      .setIssuer(TEST_ISSUER)
      .setAudience(TEST_AUDIENCE)
      .setExpirationTime("5m")
      .sign(privateKey);

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.errorCode).toBe("permission.denied");
  });

  it("accepts iat in the future within TOKEN_LEEWAY_SECONDS", async () => {
    const app = buildTestApp({ TOKEN_LEEWAY_SECONDS: 60 });
    // iat 30s in the future — within 60s leeway
    const nearFutureIat = Math.floor(Date.now() / 1000) + 30;

    const token = await new SignJWT({
      sub: "auth0|user-123",
      iat: nearFutureIat
    })
      .setProtectedHeader({ alg: "RS256", kid: TEST_KID })
      .setIssuer(TEST_ISSUER)
      .setAudience(TEST_AUDIENCE)
      .setExpirationTime("5m")
      .sign(privateKey);

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(res.statusCode).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

describe("authGuard — signature verification", () => {
  it("returns 401 when signature is invalid (tampered payload)", async () => {
    const app = buildTestApp();
    const validToken = await signToken({ sub: "auth0|user-123" });

    // Replace the payload segment with a different base64url-encoded payload
    const parts = validToken.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        sub: "auth0|attacker",
        iss: TEST_ISSUER,
        aud: TEST_AUDIENCE
      })
    ).toString("base64url");
    const tampered = [parts[0], tamperedPayload, parts[2]].join(".");

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: `Bearer ${tampered}` }
    });

    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for unknown kid (key not in JWKS)", async () => {
    const app = buildTestApp();
    const token = await signToken(
      { sub: "auth0|user-123" },
      { kid: "unknown-kid-that-does-not-exist" }
    );

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for a token signed with a different key", async () => {
    const app = buildTestApp();
    const { privateKey: otherKey } = await generateKeyPair("RS256");
    const token = await signToken(
      { sub: "auth0|user-123" },
      { signingKey: otherKey }
    );

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(res.statusCode).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Algorithm enforcement
// ---------------------------------------------------------------------------

describe("authGuard — algorithm enforcement", () => {
  it("returns 401 for a token signed with HS256 (HMAC not in allowlist)", async () => {
    const app = buildTestApp();
    // Sign with HS256 using a symmetric key
    const secret = new TextEncoder().encode(
      "a-sufficiently-long-hmac-secret-key-32bytes"
    );
    const token = await new SignJWT({ sub: "auth0|user-123" })
      .setProtectedHeader({ alg: "HS256", kid: TEST_KID })
      .setIssuedAt()
      .setIssuer(TEST_ISSUER)
      .setAudience(TEST_AUDIENCE)
      .setExpirationTime("5m")
      .sign(secret);

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(res.statusCode).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// JWKS unavailable → 503
// ---------------------------------------------------------------------------

describe("authGuard — JWKS unavailable", () => {
  it("returns 503 when the JWKS getter throws a network error", async () => {
    const failingGetKey: JwksGetKey = async () => {
      throw new TypeError("fetch failed");
    };

    const app = buildApp({
      logger: false,
      authConfig: TEST_AUTH_CONFIG,
      jwksGetKey: failingGetKey
    });
    app.get(TEST_AUTH_ROUTE, async (request) => ({
      ok: true,
      verifiedIdentityContext: request.verifiedIdentityContext ?? null
    }));
    apps.push(app);

    const token = await signToken({ sub: "auth0|user-123" });

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(res.statusCode).toBe(503);
    const body = res.json();
    expect(body.errorCode).toBe("permission.denied");
  });
});

// ---------------------------------------------------------------------------
// Excluded Auth0 claims — default-deny on payload
// ---------------------------------------------------------------------------

describe("authGuard — excluded Auth0 claims not forwarded", () => {
  it("does not forward org_id, permissions, roles, or custom namespace claims", async () => {
    const app = buildTestApp();
    const token = await signToken({
      sub: "auth0|user-123",
      org_id: "org_secret",
      permissions: ["read:data"],
      roles: ["admin"],
      "https://nashir.app/custom": "should-not-appear"
    });

    app.get("/__test/context-dump", async (request) => ({
      verifiedIdentityContext: request.verifiedIdentityContext,
      requestContext: request.requestContext
    }));
    apps.push(app);

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    const ctx = body.verifiedIdentityContext;
    expect(ctx).not.toHaveProperty("org_id");
    expect(ctx).not.toHaveProperty("permissions");
    expect(ctx).not.toHaveProperty("roles");
    expect(Object.keys(ctx)).toEqual(["actorId"]);
  });
});

// ---------------------------------------------------------------------------
// Transitional headers ignored when token is present
// ---------------------------------------------------------------------------

describe("authGuard — transitional headers not consulted when token present", () => {
  it("ignores x-nashir-actor-id header when Authorization token is present", async () => {
    const app = buildTestApp();
    const token = await signToken({ sub: "auth0|jwt-user" });

    const res = await app.inject({
      method: "GET",
      url: TEST_AUTH_ROUTE,
      headers: {
        authorization: `Bearer ${token}`,
        "x-nashir-actor-id": "spoofed-actor",
        "x-nashir-workspace-id": "spoofed-workspace"
      }
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.verifiedIdentityContext.actorId).toBe("auth0|jwt-user");
    expect(body.verifiedIdentityContext.actorId).not.toBe("spoofed-actor");
  });
});
