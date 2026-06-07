export const WORKSPACE_ID_HEADER = "x-nashir-workspace-id";
export const ACTOR_ID_HEADER = "x-nashir-actor-id";

export interface RequestContext {
  workspaceId: string;
  actorId: string;
}

export type RequestContextResult =
  | { ok: true; context: RequestContext }
  | {
      ok: false;
      statusCode: 401;
      code: "REQUEST_CONTEXT_REQUIRED";
      message: string;
      missing: string[];
    };

export interface RequestContextError extends Error {
  statusCode: 401;
  code: "REQUEST_CONTEXT_REQUIRED";
}

type HeadersLike = Record<string, string | string[] | undefined>;

function readHeader(headers: HeadersLike, name: string): string | undefined {
  let raw: string | string[] | undefined = headers[name];

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
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function resolveRequestContextFromHeaders(
  headers: HeadersLike | null | undefined
): RequestContextResult {
  const safeHeaders = headers ?? {};
  const workspaceId = readHeader(safeHeaders, WORKSPACE_ID_HEADER);
  const actorId = readHeader(safeHeaders, ACTOR_ID_HEADER);

  const missing: string[] = [];
  if (!workspaceId) {
    missing.push(WORKSPACE_ID_HEADER);
  }
  if (!actorId) {
    missing.push(ACTOR_ID_HEADER);
  }

  if (missing.length > 0 || !workspaceId || !actorId) {
    return {
      ok: false,
      statusCode: 401,
      code: "REQUEST_CONTEXT_REQUIRED",
      message: `Missing required request context header(s): ${missing.join(", ")}`,
      missing
    };
  }

  return {
    ok: true,
    context: { workspaceId, actorId }
  };
}

export function requireRequestContext(result: RequestContextResult): RequestContext {
  if (result.ok) {
    return result.context;
  }

  const error = new Error(result.message) as RequestContextError;
  error.statusCode = result.statusCode;
  error.code = result.code;
  throw error;
}
