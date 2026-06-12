import process from "node:process";
import pg from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { IdempotencyRepository } from "../../src/idempotency/idempotency-repository.js";
import {
  getRequiredTestDatabaseUrl,
  resetDatabase,
  runMigrationsForTestDatabase,
  truncateIdempotencyData
} from "../helpers/test-db.js";

const { Pool } = pg;

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeDb = testDatabaseUrl ? describe : describe.skip;

describeDb("IdempotencyRepository", () => {
  let pool: pg.Pool;
  let repository: IdempotencyRepository;

  beforeAll(async () => {
    const databaseUrl = getRequiredTestDatabaseUrl(
      "idempotency repository tests"
    );

    pool = new Pool({
      connectionString: databaseUrl
    });

    await resetDatabase(pool);
    runMigrationsForTestDatabase(databaseUrl);

    repository = new IdempotencyRepository(pool);
  });

  afterEach(async () => {
    await truncateIdempotencyData(pool);
  });

  afterAll(async () => {
    await resetDatabase(pool);
    await pool.end();
  });

  it("reserves a new idempotency record", async () => {
    const result = await repository.reserveIdempotencyRecord({
      workspaceId: "workspace-a",
      actorId: "actor-a",
      operationName: "product.create",
      idempotencyKey: "key-1",
      requestFingerprint: "fingerprint-1",
      expiresAt: "2030-01-01T00:00:00.000Z"
    });

    expect(result.status).toBe("created");
    expect(result.record.workspaceId).toBe("workspace-a");
    expect(result.record.actorId).toBe("actor-a");
    expect(result.record.operationName).toBe("product.create");
    expect(result.record.idempotencyKey).toBe("key-1");
    expect(result.record.requestFingerprint).toBe("fingerprint-1");
    expect(result.record.status).toBe("in_progress");
    expect(result.record.responseStatusCode).toBeNull();
    expect(result.record.responseBody).toBeNull();
    expect(result.record.resourceId).toBeNull();
    expect(result.record.expiresAt).not.toBeNull();
  });

  it("returns existing record for the same workspace actor operation and key", async () => {
    const first = await repository.reserveIdempotencyRecord({
      workspaceId: "workspace-a",
      actorId: "actor-a",
      operationName: "product.create",
      idempotencyKey: "same-key",
      requestFingerprint: "fingerprint-1"
    });

    const second = await repository.reserveIdempotencyRecord({
      workspaceId: "workspace-a",
      actorId: "actor-a",
      operationName: "product.create",
      idempotencyKey: "same-key",
      requestFingerprint: "fingerprint-2"
    });

    expect(first.status).toBe("created");
    expect(second.status).toBe("existing");
    expect(second.record.idempotencyRecordId).toBe(
      first.record.idempotencyRecordId
    );
    expect(second.record.requestFingerprint).toBe("fingerprint-1");
  });

  it("isolates records by workspace actor and operation", async () => {
    await repository.reserveIdempotencyRecord({
      workspaceId: "workspace-a",
      actorId: "actor-a",
      operationName: "product.create",
      idempotencyKey: "shared-key",
      requestFingerprint: "fingerprint-a"
    });

    const otherWorkspace = await repository.reserveIdempotencyRecord({
      workspaceId: "workspace-b",
      actorId: "actor-a",
      operationName: "product.create",
      idempotencyKey: "shared-key",
      requestFingerprint: "fingerprint-b"
    });

    const otherActor = await repository.reserveIdempotencyRecord({
      workspaceId: "workspace-a",
      actorId: "actor-b",
      operationName: "product.create",
      idempotencyKey: "shared-key",
      requestFingerprint: "fingerprint-c"
    });

    const otherOperation = await repository.reserveIdempotencyRecord({
      workspaceId: "workspace-a",
      actorId: "actor-a",
      operationName: "product.update",
      idempotencyKey: "shared-key",
      requestFingerprint: "fingerprint-d"
    });

    expect(otherWorkspace.status).toBe("created");
    expect(otherActor.status).toBe("created");
    expect(otherOperation.status).toBe("created");
  });

  it("reads an idempotency record by full scope", async () => {
    const reserved = await repository.reserveIdempotencyRecord({
      workspaceId: "workspace-a",
      actorId: "actor-a",
      operationName: "product.create",
      idempotencyKey: "key-read",
      requestFingerprint: "fingerprint-read"
    });

    const fetched = await repository.getIdempotencyRecord({
      workspaceId: "workspace-a",
      actorId: "actor-a",
      operationName: "product.create",
      idempotencyKey: "key-read"
    });

    expect(fetched).toEqual(reserved.record);
  });

  it("does not read a record with incomplete matching scope", async () => {
    await repository.reserveIdempotencyRecord({
      workspaceId: "workspace-a",
      actorId: "actor-a",
      operationName: "product.create",
      idempotencyKey: "key-scope",
      requestFingerprint: "fingerprint-scope"
    });

    const fetched = await repository.getIdempotencyRecord({
      workspaceId: "workspace-b",
      actorId: "actor-a",
      operationName: "product.create",
      idempotencyKey: "key-scope"
    });

    expect(fetched).toBeNull();
  });

  it("marks a record as completed with response body and resource id", async () => {
    await repository.reserveIdempotencyRecord({
      workspaceId: "workspace-a",
      actorId: "actor-a",
      operationName: "product.create",
      idempotencyKey: "key-complete",
      requestFingerprint: "fingerprint-complete"
    });

    const completed = await repository.markIdempotencyRecordCompleted({
      workspaceId: "workspace-a",
      actorId: "actor-a",
      operationName: "product.create",
      idempotencyKey: "key-complete",
      responseStatusCode: 201,
      responseBody: {
        data: {
          productId: "product-1"
        }
      },
      resourceId: "product-1"
    });

    expect(completed?.status).toBe("completed");
    expect(completed?.responseStatusCode).toBe(201);
    expect(completed?.responseBody).toEqual({
      data: {
        productId: "product-1"
      }
    });
    expect(completed?.resourceId).toBe("product-1");
  });

  it("marks a record as failed", async () => {
    await repository.reserveIdempotencyRecord({
      workspaceId: "workspace-a",
      actorId: "actor-a",
      operationName: "product.create",
      idempotencyKey: "key-failed",
      requestFingerprint: "fingerprint-failed"
    });

    const failed = await repository.markIdempotencyRecordFailed({
      workspaceId: "workspace-a",
      actorId: "actor-a",
      operationName: "product.create",
      idempotencyKey: "key-failed",
      responseStatusCode: 500,
      responseBody: {
        code: "INTERNAL_ERROR"
      }
    });

    expect(failed?.status).toBe("failed");
    expect(failed?.responseStatusCode).toBe(500);
    expect(failed?.responseBody).toEqual({
      code: "INTERNAL_ERROR"
    });
  });

  it("returns null when marking a missing record", async () => {
    const result = await repository.markIdempotencyRecordCompleted({
      workspaceId: "workspace-a",
      actorId: "actor-a",
      operationName: "product.create",
      idempotencyKey: "missing",
      responseStatusCode: 201,
      responseBody: {
        ok: true
      },
      resourceId: "product-1"
    });

    expect(result).toBeNull();
  });
});
