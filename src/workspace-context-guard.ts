import type { FastifyReply, FastifyRequest } from "fastify";

import { createHttpErrorResponse } from "./error-model.js";
import type {
  FullyResolvedRequestContext,
  VerifiedIdentityContext
} from "./request-context.js";

export interface WorkspaceMembershipResolverInput {
  actorId: string;
  workspaceId: string;
}

export type WorkspaceMembershipResolverResult =
  | { outcome: "member" }
  | { outcome: "workspace_not_found" }
  | { outcome: "not_member" }
  | { outcome: "unavailable" };

export type WorkspaceMembershipResolver = (
  input: WorkspaceMembershipResolverInput
) =>
  | Promise<WorkspaceMembershipResolverResult>
  | WorkspaceMembershipResolverResult;

export interface WorkspaceContextGuardHookOptions {
  resolveMembership: WorkspaceMembershipResolver;
  workspaceIdParamName?: string;
}

type WorkspaceContextGuardRequest = FastifyRequest & {
  verifiedIdentityContext?: VerifiedIdentityContext;
  requestContext?: FullyResolvedRequestContext;
  correlationId?: string;
};

const DEFAULT_WORKSPACE_ID_PARAM = "workspaceId";
const SAFE_WORKSPACE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  correlationId: string | undefined
): void {
  const response = createHttpErrorResponse({
    code,
    message,
    statusCode,
    correlationId
  });

  reply.code(statusCode).send(response.body);
}

function readRouteParam(request: FastifyRequest, paramName: string): unknown {
  const params = request.params;

  if (
    params === null ||
    params === undefined ||
    typeof params !== "object" ||
    Array.isArray(params)
  ) {
    return undefined;
  }

  return (params as Record<string, unknown>)[paramName];
}

function resolveWorkspaceIdFromRouteParams(
  request: FastifyRequest,
  paramName: string
):
  | { ok: true; workspaceId: string }
  | { ok: false; reason: "missing" | "invalid" } {
  const rawWorkspaceId = readRouteParam(request, paramName);

  if (rawWorkspaceId === undefined || rawWorkspaceId === null) {
    return { ok: false, reason: "missing" };
  }

  if (typeof rawWorkspaceId !== "string") {
    return { ok: false, reason: "invalid" };
  }

  const workspaceId = rawWorkspaceId.trim();

  if (workspaceId.length === 0) {
    return { ok: false, reason: "invalid" };
  }

  if (!SAFE_WORKSPACE_ID_PATTERN.test(workspaceId)) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, workspaceId };
}

function resolveVerifiedIdentity(
  request: WorkspaceContextGuardRequest
): { ok: true; identity: VerifiedIdentityContext } | { ok: false } {
  const identity = request.verifiedIdentityContext;

  if (
    identity === undefined ||
    identity === null ||
    typeof identity.actorId !== "string" ||
    identity.actorId.trim().length === 0
  ) {
    return { ok: false };
  }

  return { ok: true, identity: { actorId: identity.actorId.trim() } };
}

export function createWorkspaceContextGuardHook(
  opts: WorkspaceContextGuardHookOptions
): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
  const workspaceIdParamName =
    opts.workspaceIdParamName ?? DEFAULT_WORKSPACE_ID_PARAM;

  return async function workspaceContextGuardHook(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const typedRequest = request as WorkspaceContextGuardRequest;
    const correlationId = typedRequest.correlationId;

    const identityResult = resolveVerifiedIdentity(typedRequest);
    if (!identityResult.ok) {
      sendError(
        reply,
        401,
        "VERIFIED_IDENTITY_REQUIRED",
        "Verified identity context is required before workspace context resolution.",
        correlationId
      );
      return;
    }

    const workspaceIdResult = resolveWorkspaceIdFromRouteParams(
      request,
      workspaceIdParamName
    );

    if (!workspaceIdResult.ok) {
      if (workspaceIdResult.reason === "missing") {
        sendError(
          reply,
          400,
          "WORKSPACE_ID_REQUIRED",
          "Missing required workspaceId route parameter.",
          correlationId
        );
        return;
      }

      sendError(
        reply,
        400,
        "INVALID_WORKSPACE_ID",
        "Invalid workspaceId route parameter.",
        correlationId
      );
      return;
    }

    let membershipResult: WorkspaceMembershipResolverResult;

    try {
      membershipResult = await opts.resolveMembership({
        actorId: identityResult.identity.actorId,
        workspaceId: workspaceIdResult.workspaceId
      });
    } catch {
      sendError(
        reply,
        503,
        "WORKSPACE_MEMBERSHIP_UNAVAILABLE",
        "Workspace membership lookup is unavailable.",
        correlationId
      );
      return;
    }

    if (membershipResult.outcome === "unavailable") {
      sendError(
        reply,
        503,
        "WORKSPACE_MEMBERSHIP_UNAVAILABLE",
        "Workspace membership lookup is unavailable.",
        correlationId
      );
      return;
    }

    if (
      membershipResult.outcome === "workspace_not_found" ||
      membershipResult.outcome === "not_member"
    ) {
      sendError(
        reply,
        404,
        "WORKSPACE_NOT_FOUND",
        "Workspace was not found.",
        correlationId
      );
      return;
    }

    typedRequest.requestContext = {
      actorId: identityResult.identity.actorId,
      workspaceId: workspaceIdResult.workspaceId
    };
  };
}
