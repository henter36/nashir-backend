import { describe, expect, it } from "vitest";

import {
  ACTOR_ID_HEADER,
  WORKSPACE_ID_HEADER,
  requireRequestContext,
  resolveRequestContextFromHeaders,
  type RequestContextError
} from "../src/request-context.js";

describe("resolveRequestContextFromHeaders", () => {
  it("returns context when both headers are present", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: "workspace-123",
      [ACTOR_ID_HEADER]: "actor-456"
    });

    expect(result).toEqual({
      ok: true,
      context: { workspaceId: "workspace-123", actorId: "actor-456" }
    });
  });

  it("trims whitespace from header values", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: "  workspace-123  ",
      [ACTOR_ID_HEADER]: "  actor-456  "
    });

    expect(result).toEqual({
      ok: true,
      context: { workspaceId: "workspace-123", actorId: "actor-456" }
    });
  });

  it("reads required headers case-insensitively", () => {
    const result = resolveRequestContextFromHeaders({
      "X-Nashir-Workspace-Id": "workspace-123",
      "X-Nashir-Actor-Id": "actor-456"
    });

    expect(result).toEqual({
      ok: true,
      context: { workspaceId: "workspace-123", actorId: "actor-456" }
    });
  });

  it("fails when the workspace header is missing", () => {
    const result = resolveRequestContextFromHeaders({
      [ACTOR_ID_HEADER]: "actor-456"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.statusCode).toBe(401);
      expect(result.code).toBe("REQUEST_CONTEXT_REQUIRED");
      expect(result.missing).toEqual([WORKSPACE_ID_HEADER]);
    }
  });

  it("fails when the actor header is missing", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: "workspace-123"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toEqual([ACTOR_ID_HEADER]);
    }
  });

  it("fails when both headers are missing", () => {
    const result = resolveRequestContextFromHeaders({});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toEqual([WORKSPACE_ID_HEADER, ACTOR_ID_HEADER]);
    }
  });

  it("fails when header values are blank", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: "   ",
      [ACTOR_ID_HEADER]: ""
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toEqual([WORKSPACE_ID_HEADER, ACTOR_ID_HEADER]);
    }
  });

  it("accepts array header values by using the first value", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: ["workspace-first", "workspace-second"],
      [ACTOR_ID_HEADER]: ["actor-first", "actor-second"]
    });

    expect(result).toEqual({
      ok: true,
      context: { workspaceId: "workspace-first", actorId: "actor-first" }
    });
  });
});

describe("requireRequestContext", () => {
  it("returns the context on success", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: "workspace-123",
      [ACTOR_ID_HEADER]: "actor-456"
    });

    expect(requireRequestContext(result)).toEqual({
      workspaceId: "workspace-123",
      actorId: "actor-456"
    });
  });

  it("throws an error with statusCode 401 and code REQUEST_CONTEXT_REQUIRED on failure", () => {
    const result = resolveRequestContextFromHeaders({});

    expect(() => requireRequestContext(result)).toThrow("REQUEST_CONTEXT_REQUIRED");

    try {
      requireRequestContext(result);
      expect.unreachable("expected requireRequestContext to throw");
    } catch (error) {
      const contextError = error as RequestContextError;
      expect(contextError).toBeInstanceOf(Error);
      expect(contextError.statusCode).toBe(401);
      expect(contextError.code).toBe("REQUEST_CONTEXT_REQUIRED");
    }
  });
});
