import { createHash } from "node:crypto";
import console from "node:console";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDirectory = resolve(repositoryRoot, "migrations");
const migrationFilePattern = /^\d{14}_[a-z0-9_]+\.sql$/u;

function getDatabaseUrl() {
  const databaseUrl =
    process.env.MIGRATION_DATABASE_URL ??
    process.env.DATABASE_URL ??
    process.env.TEST_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "Missing database URL. Set MIGRATION_DATABASE_URL, DATABASE_URL, or TEST_DATABASE_URL."
    );
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.NASHIR_ALLOW_PRODUCTION_MIGRATIONS !== "true"
  ) {
    throw new Error(
      "Refusing to run migrations with NODE_ENV=production unless NASHIR_ALLOW_PRODUCTION_MIGRATIONS=true."
    );
  }

  return databaseUrl;
}

function listMigrationFiles() {
  if (!existsSync(migrationsDirectory)) {
    throw new Error(`Migrations directory not found: ${migrationsDirectory}`);
  }

  const filenames = readdirSync(migrationsDirectory)
    .filter((filename) => filename.endsWith(".sql"))
    .sort();

  const seenMigrationIds = new Set();

  return filenames.map((filename) => {
    if (!migrationFilePattern.test(filename)) {
      throw new Error(
        `Invalid migration filename "${filename}". Expected format: YYYYMMDDHHMMSS_description.sql`
      );
    }

    const migrationId = filename.replace(/\.sql$/u, "");

    if (seenMigrationIds.has(migrationId)) {
      throw new Error(`Duplicate migration identifier: ${migrationId}`);
    }

    seenMigrationIds.add(migrationId);

    const path = resolve(migrationsDirectory, filename);
    const sql = readFileSync(path, "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");

    return {
      migrationId,
      filename,
      checksum,
      sql
    };
  });
}

async function ensureSchemaMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_id text PRIMARY KEY,
      filename text NOT NULL UNIQUE,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function loadAppliedMigrations(client) {
  const result = await client.query(`
    SELECT migration_id, filename, checksum, applied_at
    FROM schema_migrations
    ORDER BY migration_id ASC;
  `);

  return new Map(
    result.rows.map((row) => [
      row.migration_id,
      {
        filename: row.filename,
        checksum: row.checksum,
        appliedAt: row.applied_at
      }
    ])
  );
}

function assertNoChecksumDrift(migration, appliedMigration) {
  if (appliedMigration.checksum !== migration.checksum) {
    throw new Error(
      `Checksum mismatch for already-applied migration ${migration.filename}`
    );
  }
}

async function printStatus(client) {
  await ensureSchemaMigrationsTable(client);

  const migrations = listMigrationFiles();
  const appliedMigrations = await loadAppliedMigrations(client);

  if (migrations.length === 0) {
    console.log("No migration files found.");
    return;
  }

  for (const migration of migrations) {
    const appliedMigration = appliedMigrations.get(migration.migrationId);

    if (appliedMigration) {
      assertNoChecksumDrift(migration, appliedMigration);
      console.log(`applied: ${migration.filename}`);
    } else {
      console.log(`pending: ${migration.filename}`);
    }
  }
}

async function applyMigrations(client) {
  await ensureSchemaMigrationsTable(client);

  const migrations = listMigrationFiles();
  const appliedMigrations = await loadAppliedMigrations(client);
  let appliedCount = 0;

  for (const migration of migrations) {
    const appliedMigration = appliedMigrations.get(migration.migrationId);

    if (appliedMigration) {
      assertNoChecksumDrift(migration, appliedMigration);
      continue;
    }

    await client.query("BEGIN");

    try {
      await client.query(migration.sql);
      await client.query(
        `
          INSERT INTO schema_migrations (migration_id, filename, checksum)
          VALUES ($1, $2, $3);
        `,
        [migration.migrationId, migration.filename, migration.checksum]
      );
      await client.query("COMMIT");
      appliedCount += 1;
      console.log(`Applied: ${migration.filename}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }

  if (appliedCount === 0) {
    console.log("No pending migrations.");
  }
}

async function main() {
  const command = process.argv[2];

  if (command !== "up" && command !== "status") {
    throw new Error("Usage: node scripts/migrate.mjs <up|status>");
  }

  const client = new Client({
    connectionString: getDatabaseUrl()
  });

  await client.connect();

  try {
    if (command === "status") {
      await printStatus(client);
    } else {
      await applyMigrations(client);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
