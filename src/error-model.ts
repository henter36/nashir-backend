export interface ErrorModel {
  code: string;
  message: string;
  statusCode: number;
  correlationId?: string;
  details?: unknown;
}

export type CreateErrorModelInput = ErrorModel;

export interface HttpErrorResponse {
  statusCode: number;
  body: ErrorModel;
}

export function createErrorModel(input: CreateErrorModelInput): ErrorModel {
  const model: ErrorModel = {
    code: input.code,
    message: input.message,
    statusCode: input.statusCode
  };

  if (input.correlationId !== undefined) {
    model.correlationId = input.correlationId;
  }

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
    statusCode: body.statusCode,
    body
  };
}
