import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance, FastifyRequest, InjectOptions } from "fastify";

import { buildApp } from "../src/app.js";
import {
  ACTOR_ID_HEADER,
  CORRELATION_ID_HEADER,
  GRANTED_PERMISSIONS_HEADER,
  WORKSPACE_ID_HEADER
} from "../src/request-context.js";

const TEST_HARNESS_ROUTE = "/__test/request-context";
const THROWING_HARNESS_ROUTE = "/__test/throw";
const THROWN_ERROR_MESSAGE = "internal-test-thrown-error-detail";

const BOTH_CONTEXT_HEADERS_MISSING_DETAILS = {
  missing: [WORKSPACE_ID_HEADER, ACTOR_ID_HEADER],
  issues: [
    { header: WORKSPACE_ID_HEADER, reason: "missing" },
    { header: ACTOR_ID_HEADER, reason: "missing" }
  ]
};

const BLANK_WORKSPACE_CONTEXT_DETAILS = {
  missing: [WORKSPACE_ID_HEADER],
  issues: [{ header: WORKSPACE_ID_HEADER, reason: "blank" }]
};

const MISSING_ACTOR_CONTEXT_DETAILS = {
  missing: [ACTOR_ID_HEADER],
  issues: [{ header: ACTOR_ID_HEADER, reason: "missing" }]
};

const apps: FastifyInstance[] = [];

function sortAlphabetically(values: string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

async function harnessHandler(request: FastifyRequest) {
  return {
    workspaceId: request.requestContext?.workspaceId ?? null,
    actorId: request.requestContext?.actorId ?? null,
    grantedPermissions: request.requestContext?.grantedPermissions ?? null,
    correlationId: request.correlationId ?? null
  };
}

async function throwingHandler(): Promise<never> {
  throw new Error(THROWN_ERROR_MESSAGE);
}

function buildAppWithHarness(
  options: { enableInternalHarnessRoutes?: boolean } = {}
): FastifyInstance {
  const app = buildApp({ logger: false, ...options });

  // GET covers header-only assertions; POST lets the malformed/oversized
  // body tests prove gating happens before Fastify attempts to parse a body.
  app.get(TEST_HARNESS_ROUTE, harnessHandler);
  app.post(TEST_HARNESS_ROUTE, harnessHandler);

  // Exercises the generic error handler: a route that always throws so the
  // 500 ErrorModel response can be asserted without relying on a real fault.
  app.get(THROWING_HARNESS_ROUTE, throwingHandler);

  apps.push(app);
  return app;
}

async function injectAndParse(app: FastifyInstance, options: InjectOptions) {
  const response = await app.inject(options);
  return { statusCode: response.statusCode, body: response.json() };
}

function expectHealthyBody(body: Record<string, unknown>): void {
  expect(body.status).toBe("ok");
  expect(body.service).toBe("nashir-backend");
  expect(body.runtime).toBe("node");
  expect(sortAlphabetically(Object.keys(body))).toEqual([
    "runtime",
    "service",
    "status",
    "uptimeSeconds"
  ]);
}

function expectInternalServerError(
  statusCode: number,
  body: Record<string, unknown>
): void {
  expect(statusCode).toBe(500);
  expect(body.code).toBe("INTERNAL_SERVER_ERROR");
  expect(body.message).toBe("Internal server error.");
  expect(body.statusCode).toBe(500);
  expect(typeof body.correlationId).toBe("string");
  expect(body.correlationId).not.toHaveLength(0);
  expect(body.error).toBeUndefined();
  expect(body.stack).toBeUndefined();
  expect(body.details).toBeUndefined();
  expect(JSON.stringify(body)).not.toContain(THROWN_ERROR_MESSAGE);
}

function expectNotFound(
  statusCode: number,
  body: Record<string, unknown>
): void {
  expect(statusCode).toBe(404);
  expect(body.code).toBe("NOT_FOUND");
  expect(body.message).toBe("Route not found.");
  expect(body.statusCode).toBe(404);
  expect(typeof body.correlationId).toBe("string");
  expect(body.correlationId).not.toHaveLength(0);
  expect(body.error).toBeUndefined();
  expect(body.stack).toBeUndefined();
}

function expectRequestContextRequired(
  statusCode: number,
  body: Record<string, unknown>,
  expectedDetails: unknown = BOTH_CONTEXT_HEADERS_MISSING_DETAILS
): void {
  expect(statusCode).toBe(401);
  expect(body.code).toBe("REQUEST_CONTEXT_REQUIRED");
  expect(body.statusCode).toBe(401);
  expect(typeof body.message).toBe("string");
  expect(typeof body.correlationId).toBe("string");
  expect(body.correlationId).not.toHaveLength(0);
  expect(body.error).toBeUndefined();
  expect(body.details).toEqual(expectedDetails);
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("/health route preservation under request-context plumbing", () => {
  it("remains ungated and responds identically without request-context headers", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: "/health"
    });

    expect(statusCode).toBe(200);
    expect(typeof body.uptimeSeconds).toBe("number");
    expectHealthyBody(body);
  });

  it("remains ungated and identical even when request-context headers are present", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: "/health",
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456",
        [CORRELATION_ID_HEADER]: "test-correlation-id"
      }
    });

    expect(statusCode).toBe(200);
    expectHealthyBody(body);
  });

  it("remains ungated when called with a query string", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: "/health?probe=1"
    });

    expect(statusCode).toBe(200);
    expectHealthyBody(body);
  });

  it("does not match the /health route (no trailing-slash normalization configured) and is therefore gated like any other unmatched path, not treated as /health", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: "/health/"
    });

    expectRequestContextRequired(statusCode, body);
  });
});

describe("not-found handling via the internal ErrorModel serializer", () => {
  it("returns an ErrorModel 404 for an unknown route once request context is satisfied", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: "/this-route-does-not-exist",
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456"
      }
    });

    expectNotFound(statusCode, body);
  });

  it("propagates a caller-supplied correlation id through to the not-found response", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: "/this-route-does-not-exist",
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456",
        [CORRELATION_ID_HEADER]: "caller-supplied-correlation-id"
      }
    });

    expectNotFound(statusCode, body);
    expect(body.correlationId).toBe("caller-supplied-correlation-id");
  });

  it("returns an ErrorModel 404 for /health/ once request context is satisfied, since it does not match the /health route", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: "/health/",
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456"
      }
    });

    expectNotFound(statusCode, body);
  });
});

describe("internal server error handling via the internal ErrorModel serializer", () => {
  it("returns an ErrorModel 500 for a thrown error without leaking internal details", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: THROWING_HARNESS_ROUTE,
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456"
      }
    });

    expectInternalServerError(statusCode, body);
  });

  it("propagates a caller-supplied correlation id through to the 500 response", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: THROWING_HARNESS_ROUTE,
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456",
        [CORRELATION_ID_HEADER]: "caller-supplied-correlation-id"
      }
    });

    expectInternalServerError(statusCode, body);
    expect(body.correlationId).toBe("caller-supplied-correlation-id");
  });
});

describe("internal workspace route harness", () => {
  const WORKSPACE_ROUTE_HARNESS_PATH =
    "/internal/workspace-route-harness/workspace-123";

  it("is not registered by default and falls through to the existing 404 ErrorModel behavior", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: WORKSPACE_ROUTE_HARNESS_PATH,
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456"
      }
    });

    expectNotFound(statusCode, body);
  });

  it("rejects requests missing request-context headers with the existing 401 ErrorModel shape", async () => {
    const app = buildAppWithHarness({ enableInternalHarnessRoutes: true });

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: WORKSPACE_ROUTE_HARNESS_PATH
    });

    expectRequestContextRequired(statusCode, body);
  });

  it("succeeds with valid request-context headers", async () => {
    const app = buildAppWithHarness({ enableInternalHarnessRoutes: true });

    const { statusCode } = await injectAndParse(app, {
      method: "GET",
      url: WORKSPACE_ROUTE_HARNESS_PATH,
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456"
      }
    });

    expect(statusCode).toBe(200);
  });

  it("includes the route workspaceId, requestContext, and correlationId in the success response", async () => {
    const app = buildAppWithHarness({ enableInternalHarnessRoutes: true });

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: WORKSPACE_ROUTE_HARNESS_PATH,
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456"
      }
    });

    expect(statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.workspaceId).toBe("workspace-123");
    expect(body.requestContext).toEqual({
      workspaceId: "workspace-123",
      actorId: "actor-456"
    });
    expect(typeof body.correlationId).toBe("string");
    expect((body.correlationId as string).length).toBeGreaterThan(0);
  });

  it("propagates a caller-supplied correlation id through to the success response", async () => {
    const app = buildAppWithHarness({ enableInternalHarnessRoutes: true });

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: WORKSPACE_ROUTE_HARNESS_PATH,
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456",
        [CORRELATION_ID_HEADER]: "caller-supplied-correlation-id"
      }
    });

    expect(statusCode).toBe(200);
    expect(body.correlationId).toBe("caller-supplied-correlation-id");
  });
});

describe("request-context plumbing on a gated non-health harness route", () => {
  it("rejects requests missing both request-context headers with the consistent error shape", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: TEST_HARNESS_ROUTE
    });

    expectRequestContextRequired(statusCode, body);
    expect(typeof body.message).toBe("string");
    expect(typeof body.correlationId).toBe("string");
    expect(body.correlationId.length).toBeGreaterThan(0);
  });

  it("rejects requests with a blank workspace-id header with the consistent error shape", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: TEST_HARNESS_ROUTE,
      headers: {
        [WORKSPACE_ID_HEADER]: "   ",
        [ACTOR_ID_HEADER]: "actor-456"
      }
    });

    expectRequestContextRequired(
      statusCode,
      body,
      BLANK_WORKSPACE_CONTEXT_DETAILS
    );
    expect(typeof body.correlationId).toBe("string");
  });

  it("rejects requests missing only the actor-id header with the consistent error shape", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: TEST_HARNESS_ROUTE,
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123"
      }
    });

    expectRequestContextRequired(
      statusCode,
      body,
      MISSING_ACTOR_CONTEXT_DETAILS
    );
  });

  it("echoes a caller-supplied correlation id back in the error response", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: TEST_HARNESS_ROUTE,
      headers: {
        [CORRELATION_ID_HEADER]: "caller-supplied-correlation-id"
      }
    });

    expect(statusCode).toBe(401);
    expect(body.correlationId).toBe("caller-supplied-correlation-id");
  });

  it("succeeds and attaches the resolved request context when both headers are valid", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: TEST_HARNESS_ROUTE,
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456"
      }
    });

    expect(statusCode).toBe(200);
    expect(body.workspaceId).toBe("workspace-123");
    expect(body.actorId).toBe("actor-456");
    expect(typeof body.correlationId).toBe("string");
    expect(body.correlationId.length).toBeGreaterThan(0);
  });

  it("propagates a caller-supplied correlation id through to a successful response", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: TEST_HARNESS_ROUTE,
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456",
        [CORRELATION_ID_HEADER]: "caller-supplied-correlation-id"
      }
    });

    expect(statusCode).toBe(200);
    expect(body.correlationId).toBe("caller-supplied-correlation-id");
  });

  it("rejects a gated request with a malformed JSON body before any parsing occurs", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "POST",
      url: TEST_HARNESS_ROUTE,
      payload: "{not-valid-json",
      headers: { "content-type": "application/json" }
    });

    expectRequestContextRequired(statusCode, body);
  });

  it("rejects a gated request with an oversized body before any parsing occurs", async () => {
    const app = buildAppWithHarness();
    const oversizedPayload = "x".repeat(2 * 1024 * 1024);

    const { statusCode, body } = await injectAndParse(app, {
      method: "POST",
      url: TEST_HARNESS_ROUTE,
      payload: oversizedPayload,
      headers: { "content-type": "text/plain" }
    });

    expectRequestContextRequired(statusCode, body);
  });

  it("generates a correlation id when the caller does not supply one", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: TEST_HARNESS_ROUTE,
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456"
      }
    });

    expect(statusCode).toBe(200);
    expect(typeof body.correlationId).toBe("string");
    expect(body.correlationId.length).toBeGreaterThan(0);
  });

  it("attaches grantedPermissions: [] when the permissions header is absent", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: TEST_HARNESS_ROUTE,
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456"
      }
    });

    expect(statusCode).toBe(200);
    expect(body.grantedPermissions).toEqual([]);
  });

  it("attaches parsed grantedPermissions when the permissions header is present", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: TEST_HARNESS_ROUTE,
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456",
        [GRANTED_PERMISSIONS_HEADER]:
          "nashir.products.read,nashir.products.manage"
      }
    });

    expect(statusCode).toBe(200);
    expect(body.grantedPermissions).toEqual([
      "nashir.products.read",
      "nashir.products.manage"
    ]);
  });

  it("trims and deduplicates entries from the permissions header", async () => {
    const app = buildAppWithHarness();

    const { statusCode, body } = await injectAndParse(app, {
      method: "GET",
      url: TEST_HARNESS_ROUTE,
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456",
        [GRANTED_PERMISSIONS_HEADER]:
          " nashir.products.read , nashir.products.read , nashir.products.manage "
      }
    });

    expect(statusCode).toBe(200);
    expect(body.grantedPermissions).toEqual([
      "nashir.products.read",
      "nashir.products.manage"
    ]);
  });
});
