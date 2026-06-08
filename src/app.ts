import { randomUUID } from "node:crypto";

import Fastify, {
  type FastifyInstance,
  type FastifyRequest,
  type FastifyServerOptions
} from "fastify";

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

  // Request-context plumbing applies to every route except /health, which
  // must remain ungated and respond identically regardless of this hook.
  app.addHook("preHandler", async (request, reply) => {
    const requestPath = request.url.split("?")[0];
    if (requestPath === HEALTH_ROUTE) {
      return;
    }

    const correlationId = resolveCorrelationId(request.headers);
    request.correlationId = correlationId;

    const result = resolveRequestContextFromHeaders(request.headers);
    if (!result.ok) {
      await reply.code(result.statusCode).send({
        error: result.code,
        message: result.message,
        correlationId
      });
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

  return app;
}
