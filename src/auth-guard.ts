import {
  createRemoteJWKSet,
  decodeProtectedHeader,
  errors as joseErrors,
  jwtVerify,
  type FlattenedJWSInput,
  type GetKeyFunction,
  type JWTHeaderParameters
} from "jose";

import type { FastifyReply, FastifyRequest } from "fastify";

import type { AuthConfig } from "./auth-config.js";
import { createHttpErrorResponse } from "./error-model.js";

export type JwksGetKey = GetKeyFunction<JWTHeaderParameters, FlattenedJWSInput>;

const ALLOWED_ALGORITHMS = ["RS256", "ES256"] as const;

export function createRemoteJwksGetKey(config: AuthConfig): JwksGetKey {
  const uri = config.AUTH0_JWKS_URI
    ? new URL(config.AUTH0_JWKS_URI)
    : new URL(".well-known/jwks.json", config.AUTH0_ISSUER_URL);

  // cacheMaxAge enforces the JWKS TTL boundary.
  // cooldownDuration is a global rate limit across all unknown kid values,
  // preventing unbounded JWKS re-fetches from tokens with manufactured kids.
  return createRemoteJWKSet(uri, {
    cacheMaxAge: config.JWKS_CACHE_TTL_SECONDS * 1000,
    cooldownDuration: config.JWKS_REFRESH_COOLDOWN_SECONDS * 1000
  });
}

export interface AuthGuardHookOptions {
  config: AuthConfig;
  getKey?: JwksGetKey;
}

function isJwksUnavailable(err: unknown): boolean {
  if (err instanceof joseErrors.JWKSTimeout) return true;

  if (err instanceof joseErrors.JOSEError) {
    const clientErrorCodes = new Set([
      "ERR_JWT_EXPIRED",
      "ERR_JWT_CLAIM_VALIDATION_FAILED",
      "ERR_JWS_SIGNATURE_VERIFICATION_FAILED",
      "ERR_JWKS_NO_MATCHING_KEY",
      "ERR_JWS_INVALID",
      "ERR_JOSE_ALG_NOT_ALLOWED",
      "ERR_JWT_MALFORMED"
    ]);

    return !clientErrorCodes.has(err.code);
  }

  return true;
}

export function createAuthGuardHook(opts: AuthGuardHookOptions) {
  const getKey = opts.getKey ?? createRemoteJwksGetKey(opts.config);
  const { AUTH0_ISSUER_URL, AUTH0_AUDIENCE, TOKEN_LEEWAY_SECONDS } =
    opts.config;

  return async function authGuardHook(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const correlationId = request.correlationId;

    // Step 1: Extract Bearer token
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ") || authHeader.length <= "Bearer ".length) {
      const resp = createHttpErrorResponse({
        code: "MISSING_AUTHORIZATION_TOKEN",
        message: "Missing or malformed Authorization header.",
        statusCode: 401,
        correlationId
      });
      reply.code(401).send(resp.body);
      return;
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      const resp = createHttpErrorResponse({
        code: "MISSING_AUTHORIZATION_TOKEN",
        message: "Missing or malformed Authorization header.",
        statusCode: 401,
        correlationId
      });
      reply.code(401).send(resp.body);
      return;
    }

    // Step 2: Extract kid from JWS protected header only — no payload access
    let kid: string | undefined;
    try {
      const header = decodeProtectedHeader(token);
      kid = typeof header.kid === "string" ? header.kid : undefined;
    } catch {
      const resp = createHttpErrorResponse({
        code: "INVALID_TOKEN",
        message: "Token is malformed.",
        statusCode: 401,
        correlationId
      });
      reply.code(401).send(resp.body);
      return;
    }

    if (!kid) {
      const resp = createHttpErrorResponse({
        code: "INVALID_TOKEN",
        message: "Token is missing required kid header parameter.",
        statusCode: 401,
        correlationId
      });
      reply.code(401).send(resp.body);
      return;
    }

    // Steps 3-5: JWKS key retrieval, signature verification, claim validation
    try {
      const { payload } = await jwtVerify(token, getKey, {
        issuer: AUTH0_ISSUER_URL,
        audience: AUTH0_AUDIENCE,
        algorithms: [...ALLOWED_ALGORITHMS],
        clockTolerance: TOKEN_LEEWAY_SECONDS
      });

      // Validate sub (must be non-blank)
      if (typeof payload.sub !== "string" || payload.sub.trim() === "") {
        const resp = createHttpErrorResponse({
          code: "INVALID_TOKEN",
          message: "Token is missing required sub claim.",
          statusCode: 401,
          correlationId
        });
        reply.code(401).send(resp.body);
        return;
      }

      // iat future-drift check using the same TOKEN_LEEWAY_SECONDS.
      // If present, iat must be numeric.
      if (payload.iat !== undefined) {
        if (typeof payload.iat !== "number") {
          const resp = createHttpErrorResponse({
            code: "INVALID_TOKEN",
            message: "Token iat claim must be numeric.",
            statusCode: 401,
            correlationId
          });
          reply.code(401).send(resp.body);
          return;
        }

        const nowSeconds = Math.floor(Date.now() / 1000);
        if (payload.iat > nowSeconds + TOKEN_LEEWAY_SECONDS) {
          const resp = createHttpErrorResponse({
            code: "INVALID_TOKEN",
            message: "Token iat claim is too far in the future.",
            statusCode: 401,
            correlationId
          });
          reply.code(401).send(resp.body);
          return;
        }
      }

      // Step 6: Bind verified identity — actorId only; workspaceId is workspaceContextGuard's responsibility
      request.verifiedIdentityContext = { actorId: payload.sub };
    } catch (err) {
      if (isJwksUnavailable(err)) {
        const resp = createHttpErrorResponse({
          code: "JWKS_UNAVAILABLE",
          message: "Key server is unavailable.",
          statusCode: 503,
          correlationId
        });
        reply.code(503).send(resp.body);
        return;
      }

      const resp = createHttpErrorResponse({
        code: "INVALID_TOKEN",
        message: "Token verification failed.",
        statusCode: 401,
        correlationId
      });
      reply.code(401).send(resp.body);
    }
  };
}
