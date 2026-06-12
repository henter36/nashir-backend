export const WORKSPACE_ID_HEADER = "x-nashir-workspace-id";
export const ACTOR_ID_HEADER = "x-nashir-actor-id";
export const CORRELATION_ID_HEADER = "x-nashir-correlation-id";
export const GRANTED_PERMISSIONS_HEADER = "x-nashir-granted-permissions";

export interface RequestContext {
  workspaceId: string;
  actorId: string;
  grantedPermissions?: readonly string[];
}

export interface VerifiedIdentityContext {
  actorId: string;
}

export interface FullyResolvedRequestContext extends VerifiedIdentityContext {
  workspaceId: string;
  grantedPermissions?: readonly string[];
}

export interface RequestContextIssue {
  header: string;
  reason: "missing" | "blank";
}

export type RequestContextResult =
  | { ok: true; context: RequestContext }
  | {
      ok: false;
      statusCode: 401;
      code: "REQUEST_CONTEXT_REQUIRED";
      message: string;
      missing: string[];
      issues: RequestContextIssue[];
    };

export interface RequestContextError extends Error {
  statusCode: 401;
  code: "REQUEST_CONTEXT_REQUIRED";
}

type HeadersLike = Record<string, string | readonly string[] | undefined>;

type HeaderInspection =
  | { reason: "present"; value: string }
  | { reason: "missing" }
  | { reason: "blank" };

function parseGrantedPermissions(
  inspection: HeaderInspection
): readonly string[] {
  if (inspection.reason !== "present") {
    return [];
  }

  return [
    ...new Set(
      inspection.value
        .split(",")
        .map((permission) => permission.trim())
        .filter((permission) => permission.length > 0)
    )
  ];
}

function inspectHeader(headers: HeadersLike, name: string): HeaderInspection {
  let raw: string | readonly string[] | undefined = headers[name];

  if (raw === undefined) {
    const lowerName = name.toLowerCase();
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() === lowerName) {
        raw = headers[key];
        break;
      }
    }
  }

  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") {
    return { reason: "missing" };
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { reason: "blank" };
  }

  return { reason: "present", value: trimmed };
}

export function resolveRequestContextFromHeaders(
  headers: HeadersLike | null | undefined
): RequestContextResult {
  const safeHeaders = headers ?? {};
  const workspace = inspectHeader(safeHeaders, WORKSPACE_ID_HEADER);
  const actor = inspectHeader(safeHeaders, ACTOR_ID_HEADER);

  if (workspace.reason === "present" && actor.reason === "present") {
    const permissions = inspectHeader(safeHeaders, GRANTED_PERMISSIONS_HEADER);

    return {
      ok: true,
      context: {
        workspaceId: workspace.value,
        actorId: actor.value,
        grantedPermissions: parseGrantedPermissions(permissions)
      }
    };
  }

  const issues: RequestContextIssue[] = [];
  const missing: string[] = [];

  if (workspace.reason !== "present") {
    issues.push({ header: WORKSPACE_ID_HEADER, reason: workspace.reason });
    missing.push(WORKSPACE_ID_HEADER);
  }
  if (actor.reason !== "present") {
    issues.push({ header: ACTOR_ID_HEADER, reason: actor.reason });
    missing.push(ACTOR_ID_HEADER);
  }

  return {
    ok: false,
    statusCode: 401,
    code: "REQUEST_CONTEXT_REQUIRED",
    message: `Missing required request context header(s): ${missing.join(", ")}`,
    missing,
    issues
  };
}

export function requireRequestContext(
  result: RequestContextResult
): RequestContext {
  if (result.ok) {
    return result.context;
  }

  const error = new Error(result.message) as RequestContextError;
  error.statusCode = result.statusCode;
  error.code = result.code;
  throw error;
}
