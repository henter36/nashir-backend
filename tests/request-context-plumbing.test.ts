import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildApp } from "../src/app.js";
import {
  ACTOR_ID_HEADER,
  CORRELATION_ID_HEADER,
  WORKSPACE_ID_HEADER
} from "../src/request-context.js";

const TEST_HARNESS_ROUTE = "/__test/request-context";

const apps: FastifyInstance[] = [];

function buildAppWithHarness(): FastifyInstance {
  const app = buildApp({ logger: false });

  app.get(TEST_HARNESS_ROUTE, async (request) => ({
    workspaceId: request.requestContext?.workspaceId ?? null,
    actorId: request.requestContext?.actorId ?? null,
    correlationId: request.correlationId ?? null
  }));

  apps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("/health route preservation under request-context plumbing", () => {
  it("remains ungated and responds identically without request-context headers", async () => {
    const app = buildAppWithHarness();

    const response = await app.inject({
      method: "GET",
      url: "/health"
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.service).toBe("nashir-backend");
    expect(body.runtime).toBe("node");
    expect(typeof body.uptimeSeconds).toBe("number");
    expect(Object.keys(body).sort()).toEqual([
      "runtime",
      "service",
      "status",
      "uptimeSeconds"
    ]);
  });

  it("remains ungated and identical even when request-context headers are present", async () => {
    const app = buildAppWithHarness();

    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456",
        [CORRELATION_ID_HEADER]: "test-correlation-id"
      }
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.service).toBe("nashir-backend");
    expect(body.runtime).toBe("node");
    expect(Object.keys(body).sort()).toEqual([
      "runtime",
      "service",
      "status",
      "uptimeSeconds"
    ]);
  });
});

describe("request-context plumbing on a gated non-health harness route", () => {
  it("rejects requests missing both request-context headers with the consistent error shape", async () => {
    const app = buildAppWithHarness();

    const response = await app.inject({
      method: "GET",
      url: TEST_HARNESS_ROUTE
    });

    const body = response.json();

    expect(response.statusCode).toBe(401);
    expect(body.error).toBe("REQUEST_CONTEXT_REQUIRED");
    expect(typeof body.message).toBe("string");
    expect(typeof body.correlationId).toBe("string");
    expect(body.correlationId.length).toBeGreaterThan(0);
  });

  it("rejects requests with a blank workspace-id header with the consistent error shape", async () => {
    const app = buildAppWithHarness();

    const response = await app.inject({
      method: "GET",
      url: TEST_HARNESS_ROUTE,
      headers: {
        [WORKSPACE_ID_HEADER]: "   ",
        [ACTOR_ID_HEADER]: "actor-456"
      }
    });

    const body = response.json();

    expect(response.statusCode).toBe(401);
    expect(body.error).toBe("REQUEST_CONTEXT_REQUIRED");
    expect(typeof body.correlationId).toBe("string");
  });

  it("rejects requests missing only the actor-id header with the consistent error shape", async () => {
    const app = buildAppWithHarness();

    const response = await app.inject({
      method: "GET",
      url: TEST_HARNESS_ROUTE,
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123"
      }
    });

    const body = response.json();

    expect(response.statusCode).toBe(401);
    expect(body.error).toBe("REQUEST_CONTEXT_REQUIRED");
  });

  it("echoes a caller-supplied correlation id back in the error response", async () => {
    const app = buildAppWithHarness();

    const response = await app.inject({
      method: "GET",
      url: TEST_HARNESS_ROUTE,
      headers: {
        [CORRELATION_ID_HEADER]: "caller-supplied-correlation-id"
      }
    });

    const body = response.json();

    expect(response.statusCode).toBe(401);
    expect(body.correlationId).toBe("caller-supplied-correlation-id");
  });

  it("succeeds and attaches the resolved request context when both headers are valid", async () => {
    const app = buildAppWithHarness();

    const response = await app.inject({
      method: "GET",
      url: TEST_HARNESS_ROUTE,
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456"
      }
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.workspaceId).toBe("workspace-123");
    expect(body.actorId).toBe("actor-456");
    expect(typeof body.correlationId).toBe("string");
    expect(body.correlationId.length).toBeGreaterThan(0);
  });

  it("propagates a caller-supplied correlation id through to a successful response", async () => {
    const app = buildAppWithHarness();

    const response = await app.inject({
      method: "GET",
      url: TEST_HARNESS_ROUTE,
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456",
        [CORRELATION_ID_HEADER]: "caller-supplied-correlation-id"
      }
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.correlationId).toBe("caller-supplied-correlation-id");
  });

  it("generates a correlation id when the caller does not supply one", async () => {
    const app = buildAppWithHarness();

    const response = await app.inject({
      method: "GET",
      url: TEST_HARNESS_ROUTE,
      headers: {
        [WORKSPACE_ID_HEADER]: "workspace-123",
        [ACTOR_ID_HEADER]: "actor-456"
      }
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(typeof body.correlationId).toBe("string");
    expect(body.correlationId.length).toBeGreaterThan(0);
  });
});
