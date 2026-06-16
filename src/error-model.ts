export interface ErrorModel {
  errorCode: string;
  message: string;
  requestId: string;
  retryable: boolean;
  status: number;
  details?: unknown;
}

export interface CreateErrorModelInput {
  code: string;
  message: string;
  statusCode: number;
  correlationId?: string;
  details?: unknown;
}

export interface HttpErrorResponse {
  statusCode: number;
  body: ErrorModel;
}

export function createErrorModel(input: CreateErrorModelInput): ErrorModel {
  const model: ErrorModel = {
    errorCode: mapErrorCode(input),
    message: input.message,
    requestId: input.correlationId ?? "unknown",
    retryable: isRetryableStatus(input.statusCode),
    status: input.statusCode
  };

  if (input.details !== undefined) {
    model.details =
      typeof input.details === "object" && input.details !== null
        ? structuredClone(input.details)
        : input.details;
  }

  return model;
}

export function createHttpErrorResponse(
  input: CreateErrorModelInput
): HttpErrorResponse {
  const body = createErrorModel(input);

  return {
    statusCode: body.status,
    body
  };
}

function isRetryableStatus(statusCode: number): boolean {
  return statusCode === 429 || statusCode === 500 || statusCode === 503;
}

function mapErrorCode(input: CreateErrorModelInput): string {
  if (input.code === "WORKSPACE_NOT_FOUND") {
    return "workspace.not_found";
  }

  if (input.code === "CONFLICT") {
    return input.message.toLowerCase().includes("idempot")
      ? "idempotency.conflict"
      : "conflict.version_mismatch";
  }

  const directMap: Record<string, string> = {
    BAD_REQUEST: "validation.failed",
    FORBIDDEN: "permission.denied",
    INTERNAL_ERROR: "resource.not_found",
    INTERNAL_SERVER_ERROR: "resource.not_found",
    INVALID_TOKEN: "permission.denied",
    INVALID_WORKSPACE_ID: "validation.failed",
    JWKS_UNAVAILABLE: "permission.denied",
    MISSING_AUTHORIZATION_TOKEN: "permission.denied",
    NOT_FOUND: "resource.not_found",
    REQUEST_CONTEXT_REQUIRED: "permission.denied",
    VALIDATION_FAILED: "validation.failed",
    VERIFIED_IDENTITY_REQUIRED: "permission.denied",
    WORKSPACE_ID_REQUIRED: "validation.failed",
    WORKSPACE_MEMBERSHIP_UNAVAILABLE: "permission.denied"
  };

  return directMap[input.code] ?? "resource.not_found";
}
