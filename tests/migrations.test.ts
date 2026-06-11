import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const { Pool } = pg;

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeDb = testDatabaseUrl ? describe : describe.skip;
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function getTestDatabaseUrl(): string {
  if (!testDatabaseUrl) {
    throw new Error("TEST_DATABASE_URL is required for migration DB tests");
  }

  let databaseName = "";

  try {
    if (
      testDatabaseUrl.startsWith("postgres://") ||
      testDatabaseUrl.startsWith("postgresql://")
    ) {
      databaseName = new URL(testDatabaseUrl).pathname.replace(/^\//u, "");
    } else {
      const match = testDatabaseUrl.match(/(?:^|\s)dbname\s*=\s*([^\s]+)/u);
      if (match?.[1]) {
        databaseName = match[1].replace(/^['"]|['"]$/gu, "");
      }
    }
  } catch {
    databaseName = "";
  }

  if (!databaseName || !databaseName.includes("test")) {
    throw new Error(
      `Refusing to reset non-test database "${databaseName || "unknown"}" in migration tests`
    );
  }

  return testDatabaseUrl;
}

async function resetDatabase() {
  const pool = new Pool({
    connectionString: getTestDatabaseUrl()
  });

  try {
    await pool.query(`
      DROP TABLE IF EXISTS
        audit_events,
        idempotency_records,
        products,
        schema_migrations
      CASCADE;
    `);
  } finally {
    await pool.end();
  }
}

function runMigrationCommand(command: "status" | "up") {
  return execFileSync(process.execPath, ["scripts/migrate.mjs", command], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      NODE_ENV: "test",
      TEST_DATABASE_URL: getTestDatabaseUrl()
    }
  });
}

async function listPublicTables() {
  const pool = new Pool({
    connectionString: getTestDatabaseUrl()
  });

  try {
    const result = await pool.query<{ table_name: string }>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'schema_migrations',
          'products',
          'idempotency_records',
          'audit_events'
        )
      ORDER BY table_name ASC;
    `);

    return result.rows.map((row) => row.table_name);
  } finally {
    await pool.end();
  }
}

describeDb("product persistence infrastructure migrations", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await resetDatabase();
  });

  it("reports pending migrations before applying them", () => {
    const output = runMigrationCommand("status");

    expect(output).toContain(
      "pending: 20260612000000_product_persistence_infrastructure.sql"
    );
  });

  it("applies the product persistence infrastructure migration", async () => {
    const output = runMigrationCommand("up");

    expect(output).toContain(
      "Applied: 20260612000000_product_persistence_infrastructure.sql"
    );
    await expect(listPublicTables()).resolves.toEqual([
      "audit_events",
      "idempotency_records",
      "products",
      "schema_migrations"
    ]);
  });

  it("is safe to run again after migrations are applied", () => {
    runMigrationCommand("up");

    const output = runMigrationCommand("up");

    expect(output).toContain("No pending migrations.");
  });
});
