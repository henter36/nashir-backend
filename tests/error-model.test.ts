import { describe, expect, it } from "vitest";

import {
  createErrorModel,
  createHttpErrorResponse,
  type CreateErrorModelInput
} from "../src/error-model.js";

describe("createErrorModel", () => {
  it("creates an authority-shaped 401 error model", () => {
    const model = createErrorModel({
      code: "REQUEST_CONTEXT_REQUIRED",
      message: "Missing required request context header(s).",
      statusCode: 401,
      correlationId: "correlation-123"
    });

    expect(model).toEqual({
      errorCode: "permission.denied",
      message: "Missing required request context header(s).",
      requestId: "correlation-123",
      retryable: false,
      status: 401
    });
  });

  it("maps validation errors to the authority validation code", () => {
    const model = createErrorModel({
      code: "VALIDATION_FAILED",
      message: "The request body failed validation.",
      statusCode: 422,
      correlationId: "correlation-123"
    });

    expect(model.errorCode).toBe("validation.failed");
    expect(model.message).toBe("The request body failed validation.");
    expect(model.errorCode).not.toBe(model.message);
  });

  it("uses unknown requestId when no correlationId is provided", () => {
    const model = createErrorModel({
      code: "REQUEST_CONTEXT_REQUIRED",
      message: "Missing required request context header(s).",
      statusCode: 401
    });

    expect(model.requestId).toBe("unknown");
  });

  it("supports details when provided", () => {
    const details = { missing: ["x-nashir-workspace-id"] };

    const model = createErrorModel({
      code: "REQUEST_CONTEXT_REQUIRED",
      message: "Missing required request context header(s).",
      statusCode: 401,
      correlationId: "correlation-123",
      details
    });

    expect(model.details).toEqual({ missing: ["x-nashir-workspace-id"] });
  });

  it("does not include stack by default", () => {
    const model = createErrorModel({
      code: "INTERNAL_ERROR",
      message: "Something went wrong.",
      statusCode: 500,
      correlationId: "correlation-123"
    });

    expect("stack" in model).toBe(false);
    expect(model.errorCode).toBe("internal.error");
    expect(Object.keys(model)).toEqual([
      "errorCode",
      "message",
      "requestId",
      "retryable",
      "status"
    ]);
  });

  it("marks only retryable HTTP statuses as retryable", () => {
    expect(
      createErrorModel({
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error.",
        statusCode: 500
      })
    ).toMatchObject({ errorCode: "internal.error", retryable: true });
    expect(
      createErrorModel({
        code: "JWKS_UNAVAILABLE",
        message: "Key server is unavailable.",
        statusCode: 503
      })
    ).toMatchObject({ errorCode: "service.unavailable", retryable: true });
    expect(
      createErrorModel({
        code: "VALIDATION_FAILED",
        message: "The request body failed validation.",
        statusCode: 422
      }).retryable
    ).toBe(false);
  });

  it("maps conflict errors by idempotency vs version context", () => {
    expect(
      createErrorModel({
        code: "IDEMPOTENCY_CONFLICT",
        message: "Conflict without a distinguishing message.",
        statusCode: 409
      }).errorCode
    ).toBe("idempotency.conflict");
    expect(
      createErrorModel({
        code: "VERSION_CONFLICT",
        message: "Conflict without a distinguishing message.",
        statusCode: 409
      }).errorCode
    ).toBe("conflict.version_mismatch");
  });

  it("maps unknown internal codes to the authority fallback code", () => {
    const model = createErrorModel({
      code: "UNEXPECTED_RUNTIME_CODE",
      message: "Unexpected runtime code.",
      statusCode: 500
    });

    expect(model.errorCode).toBe("unknown.error");
    expect(model.status).toBe(500);
    expect(model.retryable).toBe(true);
  });

  it("does not mutate input", () => {
    const input: CreateErrorModelInput = Object.freeze({
      code: "REQUEST_CONTEXT_REQUIRED",
      message: "Missing required request context header(s).",
      statusCode: 401,
      correlationId: "correlation-123",
      details: Object.freeze({ missing: ["x-nashir-workspace-id"] })
    });

    const snapshotBefore = JSON.parse(JSON.stringify(input));

    createErrorModel(input);

    expect(input).toEqual(snapshotBefore);
  });

  it("clones details to prevent post-creation mutation side-effects", () => {
    const details = { missing: ["x-nashir-workspace-id"] };
    const model = createErrorModel({
      code: "REQUEST_CONTEXT_REQUIRED",
      message: "Missing required request context header(s).",
      statusCode: 401,
      details
    });

    details.missing.push("another-header");

    expect(model.details).toEqual({
      missing: ["x-nashir-workspace-id"]
    });
  });

  it("handles unknown/undefined details safely", () => {
    const omitted = createErrorModel({
      code: "REQUEST_CONTEXT_REQUIRED",
      message: "Missing required request context header(s).",
      statusCode: 401,
      details: undefined
    });
    expect("details" in omitted).toBe(false);

    const withNull = createErrorModel({
      code: "REQUEST_CONTEXT_REQUIRED",
      message: "Missing required request context header(s).",
      statusCode: 401,
      details: null
    });
    expect(withNull.details).toBeNull();

    const withPrimitive = createErrorModel({
      code: "REQUEST_CONTEXT_REQUIRED",
      message: "Missing required request context header(s).",
      statusCode: 401,
      details: "raw-detail-string"
    });
    expect(withPrimitive.details).toBe("raw-detail-string");

    const withArray = createErrorModel({
      code: "REQUEST_CONTEXT_REQUIRED",
      message: "Missing required request context header(s).",
      statusCode: 401,
      details: [1, 2, 3]
    });
    expect(withArray.details).toEqual([1, 2, 3]);
  });
});

describe("createHttpErrorResponse", () => {
  it("pairs the status code with the serialized error model body", () => {
    const response = createHttpErrorResponse({
      code: "REQUEST_CONTEXT_REQUIRED",
      message: "Missing required request context header(s).",
      statusCode: 401,
      correlationId: "correlation-123"
    });

    expect(response).toEqual({
      statusCode: 401,
      body: {
        errorCode: "permission.denied",
        message: "Missing required request context header(s).",
        requestId: "correlation-123",
        retryable: false,
        status: 401
      }
    });
  });

  it("does not mutate input", () => {
    const input: CreateErrorModelInput = Object.freeze({
      code: "REQUEST_CONTEXT_REQUIRED",
      message: "Missing required request context header(s).",
      statusCode: 401
    });

    const snapshotBefore = JSON.parse(JSON.stringify(input));

    createHttpErrorResponse(input);

    expect(input).toEqual(snapshotBefore);
  });
});
