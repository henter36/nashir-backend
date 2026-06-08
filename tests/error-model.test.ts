import { describe, expect, it } from "vitest";

import {
  createErrorModel,
  createHttpErrorResponse,
  type CreateErrorModelInput
} from "../src/error-model.js";

describe("createErrorModel", () => {
  it("creates a basic 401 error model", () => {
    const model = createErrorModel({
      code: "REQUEST_CONTEXT_REQUIRED",
      message: "Missing required request context header(s).",
      statusCode: 401
    });

    expect(model).toEqual({
      code: "REQUEST_CONTEXT_REQUIRED",
      message: "Missing required request context header(s).",
      statusCode: 401
    });
  });

  it("preserves code and message separately", () => {
    const model = createErrorModel({
      code: "VALIDATION_FAILED",
      message: "The request body failed validation.",
      statusCode: 422
    });

    expect(model.code).toBe("VALIDATION_FAILED");
    expect(model.message).toBe("The request body failed validation.");
    expect(model.code).not.toBe(model.message);
  });

  it("includes correlationId when provided", () => {
    const model = createErrorModel({
      code: "REQUEST_CONTEXT_REQUIRED",
      message: "Missing required request context header(s).",
      statusCode: 401,
      correlationId: "correlation-123"
    });

    expect(model.correlationId).toBe("correlation-123");
  });

  it("omits correlationId when not provided", () => {
    const model = createErrorModel({
      code: "REQUEST_CONTEXT_REQUIRED",
      message: "Missing required request context header(s).",
      statusCode: 401
    });

    expect("correlationId" in model).toBe(false);
    expect(model.correlationId).toBeUndefined();
  });

  it("supports details when provided", () => {
    const details = { missing: ["x-nashir-workspace-id"] };

    const model = createErrorModel({
      code: "REQUEST_CONTEXT_REQUIRED",
      message: "Missing required request context header(s).",
      statusCode: 401,
      details
    });

    expect(model.details).toEqual({ missing: ["x-nashir-workspace-id"] });
  });

  it("does not include stack by default", () => {
    const model = createErrorModel({
      code: "INTERNAL_ERROR",
      message: "Something went wrong.",
      statusCode: 500
    });

    expect("stack" in model).toBe(false);
    expect(Object.keys(model)).toEqual(["code", "message", "statusCode"]);
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
        code: "REQUEST_CONTEXT_REQUIRED",
        message: "Missing required request context header(s).",
        statusCode: 401,
        correlationId: "correlation-123"
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
