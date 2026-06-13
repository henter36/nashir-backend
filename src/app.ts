import { randomUUID } from "node:crypto";

import Fastify, {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
  type FastifyServerOptions
} from "fastify";

import type { AuditRepository } from "./audit/audit-repository.js";
import type { AuthConfig } from "./auth-config.js";
import { createAuthGuardHook, type JwksGetKey } from "./auth-guard.js";
import { createHttpErrorResponse } from "./error-model.js";
import { evaluatePermissionGuard } from "./permission-guard.js";
import {
  createWorkspaceContextGuardHook,
  type WorkspaceMembershipResolver
} from "./workspace-context-guard.js";
import {
  CORRELATION_ID_HEADER,
  resolveRequestContextFromHeaders,
  type RequestContext,
  type VerifiedIdentityContext
} from "./request-context.js";
import type { IdempotencyRepository } from "./idempotency/idempotency-repository.js";
import type { ProductRepository } from "./products/product-repository.js";
import { productPlugin } from "./products/product-route.js";

declare module "fastify" {
  interface FastifyRequest {
    requestContext?: RequestContext;
    verifiedIdentityContext?: VerifiedIdentityContext;
    correlationId?: string;
  }
}

const HEALTH_ROUTE = "/health";
const WORKSPACE_ROUTE_HARNESS_ROUTE =
  "/internal/workspace-route-harness/:workspaceId";
const PERMISSION_GUARD_HARNESS_ROUTE =
  "/internal/permission-guard-harness/:requiredPermission";
const WORKSPACE_PERMISSION_GUARD_HARNESS_ROUTE =
  "/internal/workspace-permission-guard-harness/:workspaceId/:requiredPermission";

const STATIC_HARNESS_GRANTED_PERMISSIONS = Object.freeze([
  "harness.read",
  "harness.write"
]);

interface WorkspaceRouteHarnessParams {
  workspaceId: string;
}

interface PermissionGuardHarnessQuery {
  disclosureMode?: string;
}

interface WorkspacePermissionGuardHarnessParams {
  workspaceId: string;
  requiredPermission: string;
}

interface WorkspacePermissionGuardHarnessQuery {
  disclosureMode?: string;
  resourceWorkspaceId?: string;
}

async function workspaceRouteHarnessHandler(
  request: FastifyRequest<{ Params: WorkspaceRouteHarnessParams }>
) {
  return {
    ok: true,
    workspaceId: request.params.workspaceId,
    requestContext: {
      workspaceId: request.requestContext?.workspaceId ?? null,
      actorId: request.requestContext?.actorId ?? null
    },
    correlationId: request.correlationId ?? null
  };
}

async function permissionGuardHarnessHandler(
  request: FastifyRequest<{
    Params: { requiredPermission: string };
    Querystring: PermissionGuardHarnessQuery;
  }>
) {
  const disclosureMode =
    request.query.disclosureMode === "non_disclosing"
      ? "non_disclosing"
      : "disclosing";

  const decision = evaluatePermissionGuard({
    requiredPermission: request.params.requiredPermission,
    grantedPermissions: STATIC_HARNESS_GRANTED_PERMISSIONS,
    requestContext: {
      workspaceId: request.requestContext?.workspaceId ?? "",
      actorId: request.requestContext?.actorId ?? ""
    },
    disclosureMode
  });

  return { ok: true, decision };
}

async function workspacePermissionGuardHarnessHandler(
  request: FastifyRequest<{
    Params: WorkspacePermissionGuardHarnessParams;
    Querystring: WorkspacePermissionGuardHarnessQuery;
  }>,
  reply: FastifyReply
) {
  const requestContext = request.requestContext;

  if (!requestContext?.actorId || !requestContext.workspaceId) {
    const errorResponse = createHttpErrorResponse({
      code: "REQUEST_CONTEXT_REQUIRED",
      message: "Resolved request context required.",
      statusCode: 500,
      correlationId:
        request.correlationId ?? resolveCorrelationId(request.headers)
    });

    return reply.code(errorResponse.statusCode).send(errorResponse.body);
  }

  const disclosureMode =
    request.query.disclosureMode === "non_disclosing"
      ? "non_disclosing"
      : "disclosing";

  const decision = evaluatePermissionGuard({
    requiredPermission: request.params.requiredPermission,
    grantedPermissions: STATIC_HARNESS_GRANTED_PERMISSIONS,
    requestContext,
    resourceWorkspaceId: request.query.resourceWorkspaceId,
    disclosureMode
  });

  if (!decision.ok) {
    return reply.code(decision.statusCode).send(decision);
  }

  return {
    ok: true,
    workspaceId: requestContext.workspaceId,
    requiredPermission: decision.requiredPermission,
    decision: decision.decision,
    requestContext: decision.requestContext,
    correlationId: request.correlationId ?? null
  };
}

function resolveCorrelationId(headers: FastifyRequest["headers"]): string {
  const raw = headers[CORRELATION_ID_HEADER];
  const value = Array.isArray(raw) ? raw[0] : raw;

  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return randomUUID();
}

export interface BuildAppOptions extends FastifyServerOptions {
  // Internal-only diagnostic routes (e.g. the workspace route harness) are
  // opt-in and disabled by default so they are never exposed by accident in
  // normal runtime use; callers must explicitly enable them.
  enableInternalHarnessRoutes?: boolean;
  enableInternalPermissionGuardHarnessRoutes?: boolean;
  authConfig?: AuthConfig;
  jwksGetKey?: JwksGetKey;
  workspaceMembershipResolver?: WorkspaceMembershipResolver;
  productRepository?: ProductRepository;
  idempotencyRepository?: IdempotencyRepository;
  auditRepository?: AuditRepository;
}

export function buildApp(opts: BuildAppOptions = {}): FastifyInstance {
  const {
    enableInternalHarnessRoutes,
    enableInternalPermissionGuardHarnessRoutes,
    authConfig,
    jwksGetKey,
    workspaceMembershipResolver,
    productRepository,
    idempotencyRepository,
    auditRepository,
    ...fastifyOpts
  } = opts;
  const app = Fastify({ logger: true, ...fastifyOpts });

  app.decorateRequest("requestContext", undefined);
  app.decorateRequest("verifiedIdentityContext", undefined);
  app.decorateRequest("correlationId", undefined);

  const authGuardHook = authConfig
    ? createAuthGuardHook({ config: authConfig, getKey: jwksGetKey })
    : null;

  let workspaceContextGuardHook = null;
  if (authGuardHook && workspaceMembershipResolver) {
    workspaceContextGuardHook = createWorkspaceContextGuardHook({
      resolveMembership: workspaceMembershipResolver
    });
  }

  // Request-context plumbing runs at onRequest -- the earliest hook, before
  // body parsing -- so unauthorized or malformed requests are rejected
  // without the cost or risk of parsing their payload. /health is identified
  // via Fastify's own route metadata (routeOptions.url), which Fastify
  // resolves from the matched route during routing and exposes by the time
  // onRequest hooks run; this avoids fragile manual URL parsing and keeps
  // /health ungated and unaffected, responding identically to before.
  app.addHook("onRequest", async (request, reply) => {
    if (request.routeOptions?.url === HEALTH_ROUTE) {
      return;
    }

    const correlationId = resolveCorrelationId(request.headers);
    request.correlationId = correlationId;

    // When Auth0 token verification is configured, all non-health requests
    // must pass through authGuard. Transitional harness headers are only
    // available in builds/tests that do not provide authConfig.
    if (authGuardHook) {
      await authGuardHook(request, reply);
      return;
    }

    const result = resolveRequestContextFromHeaders(request.headers);
    if (!result.ok) {
      const errorResponse = createHttpErrorResponse({
        code: result.code,
        message: result.message,
        statusCode: result.statusCode,
        correlationId,
        details: {
          missing: result.missing,
          issues: result.issues
        }
      });

      reply.code(errorResponse.statusCode).send(errorResponse.body);
      return;
    }

    request.requestContext = result.context;
  });

  app.get(HEALTH_ROUTE, async () => ({
    status: "ok",
    service: "nashir-backend",
    runtime: "node",
    uptimeSeconds: process.uptime()
  }));

  // Read-only harness proving request-context plumbing reaches a real route:
  // it echoes back the route param alongside the gated request context and
  // correlation id, without touching auth, permissions, or any data layer.
  // Opt-in only -- disabled by default so it is never exposed by accident.
  if (enableInternalHarnessRoutes === true) {
    const workspaceRouteHarnessOptions: {
      preHandler?: NonNullable<typeof workspaceContextGuardHook>;
    } = {};

    if (workspaceContextGuardHook) {
      workspaceRouteHarnessOptions.preHandler = workspaceContextGuardHook;
    }

    app.get<{ Params: WorkspaceRouteHarnessParams }>(
      WORKSPACE_ROUTE_HARNESS_ROUTE,
      workspaceRouteHarnessOptions,
      workspaceRouteHarnessHandler
    );
  }

  if (enableInternalPermissionGuardHarnessRoutes === true) {
    app.get(PERMISSION_GUARD_HARNESS_ROUTE, permissionGuardHarnessHandler);

    const workspacePermissionGuardHarnessOptions: {
      preHandler?: NonNullable<typeof workspaceContextGuardHook>;
    } = {};

    if (workspaceContextGuardHook) {
      workspacePermissionGuardHarnessOptions.preHandler =
        workspaceContextGuardHook;
    }

    app.get<{
      Params: WorkspacePermissionGuardHarnessParams;
      Querystring: WorkspacePermissionGuardHarnessQuery;
    }>(
      WORKSPACE_PERMISSION_GUARD_HARNESS_ROUTE,
      workspacePermissionGuardHarnessOptions,
      workspacePermissionGuardHarnessHandler
    );
  }

  if (productRepository && idempotencyRepository && auditRepository) {
    app.register(productPlugin, {
      productRepository,
      idempotencyRepository,
      auditRepository,
      workspaceContextGuardHook
    });
  }

  app.setNotFoundHandler(async (request, reply) => {
    const errorResponse = createHttpErrorResponse({
      code: "NOT_FOUND",
      message: "Route not found.",
      statusCode: 404,
      correlationId:
        request.correlationId ?? resolveCorrelationId(request.headers)
    });

    return reply.code(errorResponse.statusCode).send(errorResponse.body);
  });

  // Catches thrown/unexpected errors only -- the request-context 401 and
  // not-found 404 responses above are sent directly via reply.send and never
  // reach this handler. The thrown error's message and stack are deliberately
  // discarded so internal details are never leaked to the client.
  app.setErrorHandler(async (error, request, reply) => {
    request.log.error(error);

    const errorResponse = createHttpErrorResponse({
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error.",
      statusCode: 500,
      correlationId:
        request.correlationId ?? resolveCorrelationId(request.headers)
    });

    return reply.code(errorResponse.statusCode).send(errorResponse.body);
  });

  return app;
}
