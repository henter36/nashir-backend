export interface PermissionGuardRequestContext {
  workspaceId: string;
  actorId: string;
}

export type PermissionDisclosureMode = "disclosing" | "non_disclosing";

export interface EvaluatePermissionGuardInput {
  requiredPermission: string;
  grantedPermissions: readonly string[];
  requestContext: PermissionGuardRequestContext;
  resourceWorkspaceId?: string | null;
  disclosureMode?: PermissionDisclosureMode;
}

export interface PermissionGuardAllowedResult {
  ok: true;
  decision: "allowed";
  requestContext: PermissionGuardRequestContext;
  requiredPermission: string;
}

export interface PermissionGuardForbiddenResult {
  ok: false;
  decision: "forbidden";
  statusCode: 403;
  code: "FORBIDDEN";
  message: string;
  requiredPermission: string;
}

export interface PermissionGuardNotFoundResult {
  ok: false;
  decision: "not_found";
  statusCode: 404;
  code: "NOT_FOUND";
  message: string;
  requiredPermission: string;
}

export type PermissionGuardResult =
  | PermissionGuardAllowedResult
  | PermissionGuardForbiddenResult
  | PermissionGuardNotFoundResult;

const FORBIDDEN_MESSAGE = "Forbidden.";
const NOT_FOUND_MESSAGE = "Resource not found.";

function notFoundResult(
  requiredPermission: string
): PermissionGuardNotFoundResult {
  return {
    ok: false,
    decision: "not_found",
    statusCode: 404,
    code: "NOT_FOUND",
    message: NOT_FOUND_MESSAGE,
    requiredPermission
  };
}

// A workspace-boundary mismatch is checked ahead of the permission grant so
// that a resource belonging to a different workspace is reported as not found
// regardless of what the actor is otherwise permitted to do -- this prevents
// cross-workspace existence from being inferred via a 403-vs-404 distinction.
export function evaluatePermissionGuard(
  input: EvaluatePermissionGuardInput
): PermissionGuardResult {
  const {
    requiredPermission,
    grantedPermissions,
    requestContext,
    resourceWorkspaceId,
    disclosureMode = "disclosing"
  } = input;

  if (
    resourceWorkspaceId != null &&
    resourceWorkspaceId !== requestContext.workspaceId
  ) {
    return notFoundResult(requiredPermission);
  }

  if (grantedPermissions.includes(requiredPermission)) {
    return {
      ok: true,
      decision: "allowed",
      requestContext: {
        workspaceId: requestContext.workspaceId,
        actorId: requestContext.actorId
      },
      requiredPermission
    };
  }

  if (disclosureMode === "non_disclosing") {
    return notFoundResult(requiredPermission);
  }

  return {
    ok: false,
    decision: "forbidden",
    statusCode: 403,
    code: "FORBIDDEN",
    message: FORBIDDEN_MESSAGE,
    requiredPermission
  };
}
