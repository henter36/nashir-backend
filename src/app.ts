import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions
} from "fastify";

export function buildApp(opts: FastifyServerOptions = {}): FastifyInstance {
  const app = Fastify({ logger: true, ...opts });

  app.get("/health", async () => ({
    status: "ok",
    service: "nashir-backend",
    runtime: "node",
    uptimeSeconds: process.uptime()
  }));

  return app;
}
