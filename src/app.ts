import { randomUUID } from "node:crypto";

import Fastify, {
  type FastifyInstance,
  type FastifyRequest,
  type FastifyServerOptions
} from "fastify";

import { createHttpErrorResponse } from "./error-model.js";
import {
  CORRELATION_ID_HEADER,
  resolveRequestContextFromHeaders,
  type RequestContext
} from "./request-context.js";

declare module "fastify" {
  interface FastifyRequest {
    requestContext?: RequestContext;
    correlationId?: string;
  }
}

const HEALTH_ROUTE = "/health";

function resolveCorrelationId(headers: FastifyRequest["headers"]): string {
  const raw = headers[CORRELATION_ID_HEADER];
  const value = Array.isArray(raw) ? raw[0] : raw;

  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return randomUUID();
}

export function buildApp(opts: FastifyServerOptions = {}): FastifyInstance {
  const app = Fastify({ logger: true, ...opts });

  app.decorateRequest("requestContext", undefined);
  app.decorateRequest("correlationId", undefined);

  // Request-context plumbing runs at onRequest -- the earliest hook, before
  // body parsing -- so unauthorized or malformed requests are rejected
  // without the cost or risk of parsing their payload. /health is identified
  // via Fastify's own route metadata (routeOptions.url), which Fastify
  // resolves from the matched route during routing and exposes by the time
  // onRequest hooks run; this avoids fragile manual URL parsing and keeps
  // /health ungated and unaffected, responding identically to before.
  app.addHook("onRequest", async (request, reply) => {
    if (request.routeOptions?.url === HEALTH_ROUTE) {
      return;
    }

    const correlationId = resolveCorrelationId(request.headers);
    request.correlationId = correlationId;

    const result = resolveRequestContextFromHeaders(request.headers);
    if (!result.ok) {
      const errorResponse = createHttpErrorResponse({
        code: result.code,
        message: result.message,
        statusCode: result.statusCode,
        correlationId,
        details: {
          missing: result.missing,
          issues: result.issues
        }
      });

      reply.code(errorResponse.statusCode).send(errorResponse.body);
      return;
    }

    request.requestContext = result.context;
  });

  app.get(HEALTH_ROUTE, async () => ({
    status: "ok",
    service: "nashir-backend",
    runtime: "node",
    uptimeSeconds: process.uptime()
  }));

  app.setNotFoundHandler(async (request, reply) => {
    const errorResponse = createHttpErrorResponse({
      code: "NOT_FOUND",
      message: "Route not found.",
      statusCode: 404,
      correlationId: request.correlationId
    });

    reply.code(errorResponse.statusCode).send(errorResponse.body);
  });

  return app;
}
