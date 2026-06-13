import { defineConfig } from "vitest/config";

const databaseTestsEnabled = process.env.TEST_DATABASE_URL !== undefined;

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: databaseTestsEnabled === false
  }
});
