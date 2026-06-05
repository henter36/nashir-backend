import { buildApp } from "./app.js";

const app = buildApp();
const host = process.env.HOST ?? "127.0.0.1";
const rawPort = process.env.PORT ?? "3000";
const port = parseInt(rawPort, 10);

if (Number.isNaN(port) || port <= 0 || port > 65535) {
  app.log.error(`Invalid PORT environment variable: "${rawPort}"`);
  process.exit(1);
}

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
