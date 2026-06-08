import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance, FastifyRequest, InjectOptions } from "fastify";

import { buildApp } from "../src/app.js";
import {
  ACTOR_ID_HEADER,
  CORRELATION_ID_HEADER,
  WORKSPACE_ID_HEADER
} from "../src/request-context.js";

const TEST_HARNESS_ROUTE = "/__test/request-context";

const apps: FastifyInstance[] = [];

function sortAlphabetically(values: string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

async function harnessHandler(request: FastifyRequest) {
  return {
    workspaceId: request.requestContext?.workspaceId ?? null,
    actorId: request.requestContext?.actorId ?? null,
    correlationId: request.correlationId ?? null
  };
}

function buildAppWithHarness(): FastifyInstance {
  const app = buildApp({ logger: false });

  // GET covers header-only assertions; POST lets the malformed/oversized
  // body tests prove gating happens before Fastify attempts to parse a body.
  app.get(TEST_HARNESS_ROUTE, harnessHandler);
  app.post(TEST_HARNESS_ROUTE, harnessHandler);

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

function expectRequestContextRequired(statusCode: number, body: Record<string, unknown>): void {
  expect(statusCode).toBe(401);
  expect(body.error).toBe("REQUEST_CONTEXT_REQUIRED");
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

    expectRequestContextRequired(statusCode, body);
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

    expectRequestContextRequired(statusCode, body);
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
});
