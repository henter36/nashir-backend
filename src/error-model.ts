export interface ErrorModel {
  code: string;
  message: string;
  statusCode: number;
  correlationId?: string;
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
  return {
    code: input.code,
    message: input.message,
    statusCode: input.statusCode,
    ...(input.correlationId !== undefined
      ? { correlationId: input.correlationId }
      : {}),
    ...(input.details !== undefined ? { details: input.details } : {})
  };
}

export function createHttpErrorResponse(
  input: CreateErrorModelInput
): HttpErrorResponse {
  const body = createErrorModel(input);

  return {
    statusCode: body.statusCode,
    body
  };
}
