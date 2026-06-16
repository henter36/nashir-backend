import { describe, expect, it } from "vitest";

import {
  evaluatePermissionGuard,
  type PermissionGuardRequestContext
} from "../src/permission-guard.js";

const REQUEST_CONTEXT: PermissionGuardRequestContext = {
  workspaceId: "workspace-123",
  actorId: "actor-456"
};

const REQUIRED_PERMISSION = "workspace:read";

describe("evaluatePermissionGuard", () => {
  it("allows when the required permission is present in granted permissions", () => {
    const result = evaluatePermissionGuard({
      requiredPermission: REQUIRED_PERMISSION,
      grantedPermissions: [REQUIRED_PERMISSION, "workspace:write"],
      requestContext: REQUEST_CONTEXT
    });

    expect(result).toEqual({
      ok: true,
      decision: "allowed",
      requestContext: REQUEST_CONTEXT,
      requiredPermission: REQUIRED_PERMISSION
    });
  });

  it("forbids with 403 when the permission is missing by default", () => {
    const result = evaluatePermissionGuard({
      requiredPermission: REQUIRED_PERMISSION,
      grantedPermissions: ["workspace:write"],
      requestContext: REQUEST_CONTEXT
    });

    expect(result).toEqual({
      ok: false,
      decision: "forbidden",
      statusCode: 403,
      code: "FORBIDDEN",
      message: "Forbidden.",
      requiredPermission: REQUIRED_PERMISSION
    });
  });

  it("returns a non-disclosing 404 when the permission is missing and disclosure mode is non_disclosing", () => {
    const result = evaluatePermissionGuard({
      requiredPermission: REQUIRED_PERMISSION,
      grantedPermissions: ["workspace:write"],
      requestContext: REQUEST_CONTEXT,
      disclosureMode: "non_disclosing"
    });

    expect(result).toEqual({
      ok: false,
      decision: "not_found",
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Resource not found.",
      requiredPermission: REQUIRED_PERMISSION
    });
  });

  it("returns 404 when resourceWorkspaceId differs from requestContext.workspaceId, even when the permission is granted", () => {
    const result = evaluatePermissionGuard({
      requiredPermission: REQUIRED_PERMISSION,
      grantedPermissions: [REQUIRED_PERMISSION],
      requestContext: REQUEST_CONTEXT,
      resourceWorkspaceId: "workspace-other"
    });

    expect(result).toEqual({
      ok: false,
      decision: "not_found",
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Resource not found.",
      requiredPermission: REQUIRED_PERMISSION
    });
  });

  it("does not leak grantedPermissions in a failure result", () => {
    const forbidden = evaluatePermissionGuard({
      requiredPermission: REQUIRED_PERMISSION,
      grantedPermissions: ["workspace:write", "secret:internal-permission"],
      requestContext: REQUEST_CONTEXT
    });

    const notFound = evaluatePermissionGuard({
      requiredPermission: REQUIRED_PERMISSION,
      grantedPermissions: ["workspace:write", "secret:internal-permission"],
      requestContext: REQUEST_CONTEXT,
      disclosureMode: "non_disclosing"
    });

    expect("grantedPermissions" in forbidden).toBe(false);
    expect("grantedPermissions" in notFound).toBe(false);
    expect(JSON.stringify(forbidden)).not.toContain(
      "secret:internal-permission"
    );
    expect(JSON.stringify(notFound)).not.toContain(
      "secret:internal-permission"
    );
  });

  it("preserves requiredPermission across allowed, forbidden, and not_found decisions", () => {
    const allowed = evaluatePermissionGuard({
      requiredPermission: REQUIRED_PERMISSION,
      grantedPermissions: [REQUIRED_PERMISSION],
      requestContext: REQUEST_CONTEXT
    });

    const forbidden = evaluatePermissionGuard({
      requiredPermission: REQUIRED_PERMISSION,
      grantedPermissions: [],
      requestContext: REQUEST_CONTEXT
    });

    const notFound = evaluatePermissionGuard({
      requiredPermission: REQUIRED_PERMISSION,
      grantedPermissions: [],
      requestContext: REQUEST_CONTEXT,
      resourceWorkspaceId: "workspace-other"
    });

    expect(allowed.requiredPermission).toBe(REQUIRED_PERMISSION);
    expect(forbidden.requiredPermission).toBe(REQUIRED_PERMISSION);
    expect(notFound.requiredPermission).toBe(REQUIRED_PERMISSION);
  });

  it("does not mutate the grantedPermissions input", () => {
    const grantedPermissions = [REQUIRED_PERMISSION, "workspace:write"];
    const snapshotBefore = [...grantedPermissions];

    evaluatePermissionGuard({
      requiredPermission: REQUIRED_PERMISSION,
      grantedPermissions,
      requestContext: REQUEST_CONTEXT
    });

    expect(grantedPermissions).toEqual(snapshotBefore);
  });

  it("handles readonly grantedPermissions arrays", () => {
    const grantedPermissions: readonly string[] = Object.freeze([
      REQUIRED_PERMISSION
    ]);

    const result = evaluatePermissionGuard({
      requiredPermission: REQUIRED_PERMISSION,
      grantedPermissions,
      requestContext: REQUEST_CONTEXT
    });

    expect(result.ok).toBe(true);
    expect(result.decision).toBe("allowed");
  });

  it("keeps failure messages generic and free of actorId", () => {
    const forbidden = evaluatePermissionGuard({
      requiredPermission: REQUIRED_PERMISSION,
      grantedPermissions: [],
      requestContext: REQUEST_CONTEXT
    });

    const notFound = evaluatePermissionGuard({
      requiredPermission: REQUIRED_PERMISSION,
      grantedPermissions: [],
      requestContext: REQUEST_CONTEXT,
      disclosureMode: "non_disclosing"
    });

    expect(forbidden).toMatchObject({ message: "Forbidden." });
    expect(notFound).toMatchObject({ message: "Resource not found." });

    if (forbidden.ok || notFound.ok) {
      throw new Error("expected both decisions to be failures");
    }

    expect(forbidden.message).not.toContain(REQUEST_CONTEXT.actorId);
    expect(notFound.message).not.toContain(REQUEST_CONTEXT.actorId);
    expect(JSON.stringify(forbidden)).not.toContain(REQUEST_CONTEXT.actorId);
    expect(JSON.stringify(notFound)).not.toContain(REQUEST_CONTEXT.actorId);
  });

  it("has no runtime side effects and returns a fresh, deterministic result for identical input", () => {
    const input = {
      requiredPermission: REQUIRED_PERMISSION,
      grantedPermissions: [REQUIRED_PERMISSION],
      requestContext: REQUEST_CONTEXT
    };

    const first = evaluatePermissionGuard(input);
    const second = evaluatePermissionGuard(input);

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });
  it("treats null resourceWorkspaceId as absent resource workspace boundary", () => {
    const result = evaluatePermissionGuard({
      requiredPermission: "workspace.products.read",
      grantedPermissions: ["workspace.products.read"],
      requestContext: {
        workspaceId: "workspace-123",
        actorId: "actor-456"
      },
      resourceWorkspaceId: null
    });

    expect(result).toMatchObject({
      ok: true,
      decision: "allowed",
      requiredPermission: "workspace.products.read"
    });
  });
});
