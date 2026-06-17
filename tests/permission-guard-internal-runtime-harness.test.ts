import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance, InjectOptions } from "fastify";

import { buildApp, type BuildAppOptions } from "../src/app.js";
import {
  ACTOR_ID_HEADER,
  WORKSPACE_ID_HEADER
} from "../src/request-context.js";

const ROUTE_BASE = "/internal/permission-guard-harness";

const WORKSPACE_ID = "workspace-123";
const ACTOR_ID = "actor-456";

const CONTEXT_HEADERS = {
  [WORKSPACE_ID_HEADER]: WORKSPACE_ID,
  [ACTOR_ID_HEADER]: ACTOR_ID
};

// In the static fixture (STATIC_HARNESS_GRANTED_PERMISSIONS in src/app.ts):
const GRANTED_PERMISSION = "harness.read";
// Not in the fixture — exercises forbidden / not_found paths:
const ABSENT_PERMISSION = "harness.admin";
// In the fixture but never requested — must not appear in any response:
const UNREQUESTED_FIXTURE_PERMISSION = "harness.write";

const apps: FastifyInstance[] = [];

function buildHarnessApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = buildApp({
    logger: false,
    enableTransitionalRequestContextHeaders: true,
    ...options
  });
  apps.push(app);
  return app;
}

async function injectAndParse(app: FastifyInstance, options: InjectOptions) {
  const response = await app.inject(options);
  return { statusCode: response.statusCode, body: response.json() };
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("permission guard internal runtime harness", () => {
  describe("opt-in flag", () => {
    it("is not registered by default and falls through to the existing 404 ErrorModel behavior", async () => {
      const app = buildHarnessApp();

      const { statusCode, body } = await injectAndParse(app, {
        method: "GET",
        url: `${ROUTE_BASE}/${GRANTED_PERMISSION}`,
        headers: CONTEXT_HEADERS
      });

      expect(statusCode).toBe(404);
      expect(body.errorCode).toBe("resource.not_found");
      expect(body.message).toBe("Route not found.");
    });

    it("enabling enableInternalHarnessRoutes alone does not expose the permission guard harness route", async () => {
      const app = buildHarnessApp({ enableInternalHarnessRoutes: true });

      const { statusCode, body } = await injectAndParse(app, {
        method: "GET",
        url: `${ROUTE_BASE}/${GRANTED_PERMISSION}`,
        headers: CONTEXT_HEADERS
      });

      expect(statusCode).toBe(404);
      expect(body.errorCode).toBe("resource.not_found");
    });

    it("is exposed when enableInternalPermissionGuardHarnessRoutes is true", async () => {
      const app = buildHarnessApp({
        enableInternalPermissionGuardHarnessRoutes: true
      });

      const { statusCode } = await injectAndParse(app, {
        method: "GET",
        url: `${ROUTE_BASE}/${GRANTED_PERMISSION}`,
        headers: CONTEXT_HEADERS
      });

      expect(statusCode).toBe(200);
    });
  });

  describe("request context gate", () => {
    it("rejects requests missing request-context headers with the existing 401 ErrorModel shape", async () => {
      const app = buildHarnessApp({
        enableInternalPermissionGuardHarnessRoutes: true
      });

      const { statusCode, body } = await injectAndParse(app, {
        method: "GET",
        url: `${ROUTE_BASE}/${GRANTED_PERMISSION}`
      });

      expect(statusCode).toBe(401);
      expect(body.errorCode).toBe("permission.denied");
      expect(body.status).toBe(401);
      expect(typeof body.requestId).toBe("string");
      expect(body.requestId).not.toHaveLength(0);
    });
  });

  describe("decision output — always 200 diagnostic JSON", () => {
    it("returns 200 with an allowed diagnostic decision when the permission is in the static fixture", async () => {
      const app = buildHarnessApp({
        enableInternalPermissionGuardHarnessRoutes: true
      });

      const { statusCode, body } = await injectAndParse(app, {
        method: "GET",
        url: `${ROUTE_BASE}/${GRANTED_PERMISSION}`,
        headers: CONTEXT_HEADERS
      });

      expect(statusCode).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.decision.ok).toBe(true);
      expect(body.decision.decision).toBe("allowed");
      expect(body.decision.requiredPermission).toBe(GRANTED_PERMISSION);
      expect(body.decision.requestContext).toEqual({
        workspaceId: WORKSPACE_ID,
        actorId: ACTOR_ID
      });
    });

    it("returns 200 with a forbidden diagnostic decision when the permission is absent (disclosing mode)", async () => {
      const app = buildHarnessApp({
        enableInternalPermissionGuardHarnessRoutes: true
      });

      const { statusCode, body } = await injectAndParse(app, {
        method: "GET",
        url: `${ROUTE_BASE}/${ABSENT_PERMISSION}`,
        headers: CONTEXT_HEADERS
      });

      expect(statusCode).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.decision.ok).toBe(false);
      expect(body.decision.decision).toBe("forbidden");
      expect(body.decision.statusCode).toBe(403);
      expect(body.decision.code).toBe("FORBIDDEN");
      expect(body.decision.requiredPermission).toBe(ABSENT_PERMISSION);
    });

    it("returns 200 with a not_found diagnostic decision when non_disclosing mode is requested", async () => {
      const app = buildHarnessApp({
        enableInternalPermissionGuardHarnessRoutes: true
      });

      const { statusCode, body } = await injectAndParse(app, {
        method: "GET",
        url: `${ROUTE_BASE}/${ABSENT_PERMISSION}?disclosureMode=non_disclosing`,
        headers: CONTEXT_HEADERS
      });

      expect(statusCode).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.decision.ok).toBe(false);
      expect(body.decision.decision).toBe("not_found");
      expect(body.decision.statusCode).toBe(404);
      expect(body.decision.code).toBe("NOT_FOUND");
      expect(body.decision.requiredPermission).toBe(ABSENT_PERMISSION);
    });
  });

  describe("non-leakage and diagnostic purity", () => {
    it("does not expose grantedPermissions in the diagnostic output", async () => {
      const app = buildHarnessApp({
        enableInternalPermissionGuardHarnessRoutes: true
      });

      const { body } = await injectAndParse(app, {
        method: "GET",
        url: `${ROUTE_BASE}/${GRANTED_PERMISSION}`,
        headers: CONTEXT_HEADERS
      });

      expect(body).not.toHaveProperty("grantedPermissions");
      expect(body.decision).toBeDefined();
      expect(body.decision).not.toHaveProperty("grantedPermissions");
      // The unrequested fixture permission must not appear anywhere in the response
      expect(JSON.stringify(body)).not.toContain(
        UNREQUESTED_FIXTURE_PERMISSION
      );
    });

    it("does not apply ErrorModel HTTP response mapping — the outer HTTP status is always 200 even for a forbidden decision", async () => {
      const app = buildHarnessApp({
        enableInternalPermissionGuardHarnessRoutes: true
      });

      const { statusCode, body } = await injectAndParse(app, {
        method: "GET",
        url: `${ROUTE_BASE}/${ABSENT_PERMISSION}`,
        headers: CONTEXT_HEADERS
      });

      // HTTP status must be 200 — not 403 from createHttpErrorResponse
      expect(statusCode).toBe(200);
      // Outer body is the diagnostic envelope, not an ErrorModel
      expect(body.ok).toBe(true);
      // No top-level ErrorModel fields at the outer response layer
      expect(body.code).toBeUndefined();
      expect(body.message).toBeUndefined();
    });
  });
});
