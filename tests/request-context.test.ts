import { describe, expect, it } from "vitest";

import {
  ACTOR_ID_HEADER,
  GRANTED_PERMISSIONS_HEADER,
  WORKSPACE_ID_HEADER,
  requireRequestContext,
  resolveRequestContextFromHeaders,
  type RequestContextError
} from "../src/request-context.js";

type RawHeaders = Record<string, string | readonly string[] | undefined>;

describe("resolveRequestContextFromHeaders", () => {
  it("returns context when both headers are present", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: "workspace-123",
      [ACTOR_ID_HEADER]: "actor-456"
    });

    expect(result).toEqual({
      ok: true,
      context: {
        workspaceId: "workspace-123",
        actorId: "actor-456",
        grantedPermissions: []
      }
    });
  });

  it("trims whitespace from header values", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: "  workspace-123  ",
      [ACTOR_ID_HEADER]: "  actor-456  "
    });

    expect(result).toEqual({
      ok: true,
      context: {
        workspaceId: "workspace-123",
        actorId: "actor-456",
        grantedPermissions: []
      }
    });
  });

  it("reads required headers case-insensitively", () => {
    const result = resolveRequestContextFromHeaders({
      "X-Nashir-Workspace-Id": "workspace-123",
      "X-Nashir-Actor-Id": "actor-456"
    });

    expect(result).toEqual({
      ok: true,
      context: {
        workspaceId: "workspace-123",
        actorId: "actor-456",
        grantedPermissions: []
      }
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

  it("fails defensively when headers are nullish", () => {
    const result = resolveRequestContextFromHeaders(null);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.statusCode).toBe(401);
      expect(result.code).toBe("REQUEST_CONTEXT_REQUIRED");
      expect(result.missing).toEqual([WORKSPACE_ID_HEADER, ACTOR_ID_HEADER]);
      expect(result.issues).toEqual([
        { header: WORKSPACE_ID_HEADER, reason: "missing" },
        { header: ACTOR_ID_HEADER, reason: "missing" }
      ]);
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

  it("reports reason missing when the workspace header is absent", () => {
    const result = resolveRequestContextFromHeaders({
      [ACTOR_ID_HEADER]: "actor-456"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual({
        header: WORKSPACE_ID_HEADER,
        reason: "missing"
      });
    }
  });

  it("reports reason missing when the actor header is absent", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: "workspace-123"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual({
        header: ACTOR_ID_HEADER,
        reason: "missing"
      });
    }
  });

  it("reports reason blank when the workspace header is whitespace-only", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: "   ",
      [ACTOR_ID_HEADER]: "actor-456"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual({
        header: WORKSPACE_ID_HEADER,
        reason: "blank"
      });
    }
  });

  it("reports reason blank when the actor header is whitespace-only", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: "workspace-123",
      [ACTOR_ID_HEADER]: ""
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual({
        header: ACTOR_ID_HEADER,
        reason: "blank"
      });
    }
  });

  it("treats a blank first array value as blank without scanning later values", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: ["   ", "workspace-456"],
      [ACTOR_ID_HEADER]: "actor-456"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual({
        header: WORKSPACE_ID_HEADER,
        reason: "blank"
      });
    }
  });

  it("treats a non-string header value as missing", () => {
    const headers = {
      [WORKSPACE_ID_HEADER]: 12345,
      [ACTOR_ID_HEADER]: "actor-456"
    } as unknown as RawHeaders;

    const result = resolveRequestContextFromHeaders(headers);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual({
        header: WORKSPACE_ID_HEADER,
        reason: "missing"
      });
    }
  });

  it("accepts array header values by using the first value", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: ["workspace-first", "workspace-second"],
      [ACTOR_ID_HEADER]: ["actor-first", "actor-second"]
    });

    expect(result).toEqual({
      ok: true,
      context: {
        workspaceId: "workspace-first",
        actorId: "actor-first",
        grantedPermissions: []
      }
    });
  });
  it("returns grantedPermissions: [] when the permissions header is absent", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: "workspace-123",
      [ACTOR_ID_HEADER]: "actor-456"
    });

    expect(result).toEqual({
      ok: true,
      context: {
        workspaceId: "workspace-123",
        actorId: "actor-456",
        grantedPermissions: []
      }
    });
  });

  it("returns grantedPermissions: [] when the permissions header is blank", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: "workspace-123",
      [ACTOR_ID_HEADER]: "actor-456",
      [GRANTED_PERMISSIONS_HEADER]: ""
    });

    expect(result).toEqual({
      ok: true,
      context: {
        workspaceId: "workspace-123",
        actorId: "actor-456",
        grantedPermissions: []
      }
    });
  });

  it("returns grantedPermissions: [] when the permissions header is whitespace-only", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: "workspace-123",
      [ACTOR_ID_HEADER]: "actor-456",
      [GRANTED_PERMISSIONS_HEADER]: "   "
    });

    expect(result).toEqual({
      ok: true,
      context: {
        workspaceId: "workspace-123",
        actorId: "actor-456",
        grantedPermissions: []
      }
    });
  });

  it("returns a single permission value", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: "workspace-123",
      [ACTOR_ID_HEADER]: "actor-456",
      [GRANTED_PERMISSIONS_HEADER]: "nashir.products.read"
    });

    expect(result).toEqual({
      ok: true,
      context: {
        workspaceId: "workspace-123",
        actorId: "actor-456",
        grantedPermissions: ["nashir.products.read"]
      }
    });
  });

  it("returns multiple permissions from a comma-separated header", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: "workspace-123",
      [ACTOR_ID_HEADER]: "actor-456",
      [GRANTED_PERMISSIONS_HEADER]:
        "nashir.products.read,nashir.products.manage"
    });

    expect(result).toEqual({
      ok: true,
      context: {
        workspaceId: "workspace-123",
        actorId: "actor-456",
        grantedPermissions: ["nashir.products.read", "nashir.products.manage"]
      }
    });
  });

  it("trims whitespace from each permission entry", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: "workspace-123",
      [ACTOR_ID_HEADER]: "actor-456",
      [GRANTED_PERMISSIONS_HEADER]:
        " nashir.products.read , nashir.products.manage "
    });

    expect(result).toEqual({
      ok: true,
      context: {
        workspaceId: "workspace-123",
        actorId: "actor-456",
        grantedPermissions: ["nashir.products.read", "nashir.products.manage"]
      }
    });
  });

  it("filters out empty permission entries", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: "workspace-123",
      [ACTOR_ID_HEADER]: "actor-456",
      [GRANTED_PERMISSIONS_HEADER]:
        "nashir.products.read,, ,nashir.products.manage"
    });

    expect(result).toEqual({
      ok: true,
      context: {
        workspaceId: "workspace-123",
        actorId: "actor-456",
        grantedPermissions: ["nashir.products.read", "nashir.products.manage"]
      }
    });
  });

  it("deduplicates repeated permission values", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: "workspace-123",
      [ACTOR_ID_HEADER]: "actor-456",
      [GRANTED_PERMISSIONS_HEADER]:
        "nashir.products.read,nashir.products.read,nashir.products.manage"
    });

    expect(result).toEqual({
      ok: true,
      context: {
        workspaceId: "workspace-123",
        actorId: "actor-456",
        grantedPermissions: ["nashir.products.read", "nashir.products.manage"]
      }
    });
  });

  it("reads x-nashir-granted-permissions case-insensitively", () => {
    const result = resolveRequestContextFromHeaders({
      [WORKSPACE_ID_HEADER]: "workspace-123",
      [ACTOR_ID_HEADER]: "actor-456",
      "X-Nashir-Granted-Permissions": "nashir.products.read"
    });

    expect(result).toEqual({
      ok: true,
      context: {
        workspaceId: "workspace-123",
        actorId: "actor-456",
        grantedPermissions: ["nashir.products.read"]
      }
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
      actorId: "actor-456",
      grantedPermissions: []
    });
  });

  it("throws an error with statusCode 401 and code REQUEST_CONTEXT_REQUIRED on failure", () => {
    const result = resolveRequestContextFromHeaders({});

    expect(() => requireRequestContext(result)).toThrow(
      "Missing required request context header(s)"
    );

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
