import process from "node:process";

import pg from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { AuditRepository } from "../../src/audit/audit-repository.js";
import {
  getRequiredTestDatabaseUrl,
  resetDatabase,
  runMigrationsForTestDatabase
} from "../helpers/test-db.js";

const { Pool } = pg;

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeDb = testDatabaseUrl ? describe : describe.skip;

describeDb("AuditRepository", () => {
  let pool: pg.Pool;
  let repository: AuditRepository;

  beforeAll(async () => {
    const databaseUrl = getRequiredTestDatabaseUrl("audit repository tests");
    pool = new Pool({ connectionString: databaseUrl });
    await resetDatabase(pool);
    runMigrationsForTestDatabase(databaseUrl);
    repository = new AuditRepository(pool);
  });

  afterEach(async () => {
    await pool.query("TRUNCATE TABLE audit_events;");
  });

  afterAll(async () => {
    await resetDatabase(pool);
    await pool.end();
  });

  it("persists required fields and uses the database timestamp", async () => {
    const before = Date.now();
    const event = await repository.createAuditEvent({
      workspaceId: "workspace-a",
      actorId: "actor-a",
      action: "product.created",
      resourceType: "product",
      resourceId: "product-a",
      correlationId: "request-a",
      afterState: {
        productId: "product-a",
        status: "active",
        version: 1
      }
    });
    const after = Date.now();

    expect(event.auditEventId).toBeTruthy();
    expect(event.workspaceId).toBe("workspace-a");
    expect(event.actorId).toBe("actor-a");
    expect(event.action).toBe("product.created");
    expect(event.resourceType).toBe("product");
    expect(event.resourceId).toBe("product-a");
    expect(event.correlationId).toBe("request-a");
    expect(Date.parse(event.occurredAt)).toBeGreaterThanOrEqual(before);
    expect(Date.parse(event.occurredAt)).toBeLessThanOrEqual(after);
    expect(event.beforeState).toBeNull();
    expect(event.afterState).toEqual({
      productId: "product-a",
      status: "active",
      version: 1
    });
  });

  it("rolls back work when a transaction operation fails", async () => {
    await expect(
      repository.withTransaction(async (db) => {
        await repository.createAuditEvent(
          {
            workspaceId: "workspace-a",
            actorId: "actor-a",
            action: "product.created",
            resourceType: "product",
            resourceId: "product-a"
          },
          db
        );
        throw new Error("fail transaction");
      })
    ).rejects.toThrow("fail transaction");

    const result = await pool.query(
      "SELECT COUNT(*)::int AS count FROM audit_events;"
    );
    expect(result.rows[0]?.count).toBe(0);
  });
});
