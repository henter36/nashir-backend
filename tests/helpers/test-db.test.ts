import { describe, expect, it } from "vitest";

import { buildTestMigrationEnv } from "./test-db.js";

describe("buildTestMigrationEnv", () => {
  it("isolates migration database selection to TEST_DATABASE_URL", () => {
    const env = buildTestMigrationEnv("postgres://localhost/test_db", {
      DATABASE_URL: "postgres://localhost/runtime_db",
      MIGRATION_DATABASE_URL: "postgres://localhost/migration_db",
      PATH: "/usr/bin"
    });

    expect(env).not.toHaveProperty("DATABASE_URL");
    expect(env).not.toHaveProperty("MIGRATION_DATABASE_URL");
    expect(env).toMatchObject({
      NODE_ENV: "test",
      PATH: "/usr/bin",
      TEST_DATABASE_URL: "postgres://localhost/test_db"
    });
  });
});
