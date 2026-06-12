import { execFileSync } from "node:child_process";
import process from "node:process";
import pg from "pg";

export function getRequiredTestDatabaseUrl(testName: string): string {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL;

  if (!testDatabaseUrl) {
    throw new Error(`TEST_DATABASE_URL is required for ${testName}`);
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
      databaseName = match?.[1]?.replace(/^['"]|['"]$/gu, "") ?? "";
    }
  } catch {
    databaseName = "";
  }

  if (!databaseName || !databaseName.includes("test")) {
    throw new Error(
      `Refusing to use non-test database "${databaseName || "unknown"}" in ${testName}`
    );
  }

  return testDatabaseUrl;
}

export function runMigrationsForTestDatabase(testDatabaseUrl: string): void {
  execFileSync(process.execPath, ["scripts/migrate.mjs", "up"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      NODE_ENV: "test",
      TEST_DATABASE_URL: testDatabaseUrl
    }
  });
}

export async function resetDatabase(pool: pg.Pool): Promise<void> {
  await pool.query(`
    DROP TABLE IF EXISTS
      audit_events,
      idempotency_records,
      products,
      schema_migrations
    CASCADE;
  `);
}

export async function truncateProductData(pool: pg.Pool): Promise<void> {
  await pool.query("TRUNCATE TABLE products RESTART IDENTITY CASCADE;");
}

export async function truncateIdempotencyData(pool: pg.Pool): Promise<void> {
  await pool.query(
    "TRUNCATE TABLE idempotency_records RESTART IDENTITY CASCADE;"
  );
}
