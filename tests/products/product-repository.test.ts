import process from "node:process";
import pg from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { ProductRepository } from "../../src/products/product-repository.js";
import {
  getRequiredTestDatabaseUrl,
  resetDatabase,
  runMigrationsForTestDatabase,
  truncateProductData
} from "../helpers/test-db.js";

const { Pool } = pg;

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeDb = testDatabaseUrl ? describe : describe.skip;

describeDb("ProductRepository", () => {
  let pool: pg.Pool;
  let repository: ProductRepository;

  beforeAll(async () => {
    const databaseUrl = getRequiredTestDatabaseUrl("product repository tests");

    pool = new Pool({
      connectionString: databaseUrl
    });

    await resetDatabase(pool);
    runMigrationsForTestDatabase(databaseUrl);

    repository = new ProductRepository(pool);
  });

  afterEach(async () => {
    await truncateProductData(pool);
  });

  afterAll(async () => {
    await resetDatabase(pool);
    await pool.end();
  });

  it("creates and reads a product within a workspace", async () => {
    const created = await repository.createProduct({
      workspaceId: "workspace-a",
      input: {
        name: "Coffee Beans",
        category: "Grocery",
        price: 19.95,
        sku: "COFFEE-001",
        stockStatus: "available",
        imageUrl: "https://example.invalid/coffee.png",
        videoUrl: null,
        description: "Arabic roast",
        status: "active"
      }
    });

    expect(created.workspaceId).toBe("workspace-a");
    expect(created.name).toBe("Coffee Beans");
    expect(created.price).toBe(19.95);
    expect(created.status).toBe("active");
    expect(created.stockStatus).toBe("available");
    expect(created.version).toBe(1);

    const fetched = await repository.getProductById({
      workspaceId: "workspace-a",
      productId: created.productId
    });

    expect(fetched).toEqual(created);
  });

  it("does not read products across workspaces", async () => {
    const created = await repository.createProduct({
      workspaceId: "workspace-a",
      input: {
        name: "Private Product"
      }
    });

    const fetchedFromOtherWorkspace = await repository.getProductById({
      workspaceId: "workspace-b",
      productId: created.productId
    });

    expect(fetchedFromOtherWorkspace).toBeNull();
  });

  it("lists products by workspace with status filter and deterministic order", async () => {
    await repository.createProduct({
      workspaceId: "workspace-a",
      input: {
        name: "Draft Product",
        status: "draft"
      }
    });

    const activeProduct = await repository.createProduct({
      workspaceId: "workspace-a",
      input: {
        name: "Active Product",
        status: "active"
      }
    });

    await repository.createProduct({
      workspaceId: "workspace-b",
      input: {
        name: "Other Workspace Product",
        status: "active"
      }
    });

    const firstList = await repository.listProducts({
      workspaceId: "workspace-a",
      status: "active",
      limit: 10
    });

    const secondList = await repository.listProducts({
      workspaceId: "workspace-a",
      status: "active",
      limit: 10
    });

    expect(firstList.products).toHaveLength(1);
    expect(firstList.products[0]?.productId).toBe(activeProduct.productId);
    expect(firstList.count).toBe(1);
    expect(firstList.hasMore).toBe(false);
    expect(firstList.nextCursor).toBeNull();
    expect(secondList.products.map((product) => product.productId)).toEqual(
      firstList.products.map((product) => product.productId)
    );
  });

  it("supports cursor pagination", async () => {
    await repository.createProduct({
      workspaceId: "workspace-a",
      input: {
        name: "First Product"
      }
    });

    await repository.createProduct({
      workspaceId: "workspace-a",
      input: {
        name: "Second Product"
      }
    });

    const firstPage = await repository.listProducts({
      workspaceId: "workspace-a",
      limit: 1
    });

    expect(firstPage.products).toHaveLength(1);
    expect(firstPage.hasMore).toBe(true);
    expect(firstPage.nextCursor).not.toBeNull();

    const secondPage = await repository.listProducts({
      workspaceId: "workspace-a",
      limit: 1,
      cursor: firstPage.nextCursor
    });

    expect(secondPage.products).toHaveLength(1);
    expect(secondPage.products[0]?.productId).not.toBe(
      firstPage.products[0]?.productId
    );
  });

  it("updates a product and increments version", async () => {
    const created = await repository.createProduct({
      workspaceId: "workspace-a",
      input: {
        name: "Old Name"
      }
    });

    const result = await repository.updateProduct({
      workspaceId: "workspace-a",
      productId: created.productId,
      expectedVersion: created.version,
      input: {
        name: "New Name",
        price: 25.5,
        stockStatus: "limited"
      }
    });

    expect(result.status).toBe("updated");

    if (result.status !== "updated") {
      throw new Error("Expected update to succeed");
    }

    expect(result.product.name).toBe("New Name");
    expect(result.product.price).toBe(25.5);
    expect(result.product.stockStatus).toBe("limited");
    expect(result.product.version).toBe(created.version + 1);
  });

  it("returns version_conflict when optimistic version check fails", async () => {
    const created = await repository.createProduct({
      workspaceId: "workspace-a",
      input: {
        name: "Versioned Product"
      }
    });

    await repository.updateProduct({
      workspaceId: "workspace-a",
      productId: created.productId,
      expectedVersion: created.version,
      input: {
        name: "Updated Product"
      }
    });

    const conflict = await repository.updateProduct({
      workspaceId: "workspace-a",
      productId: created.productId,
      expectedVersion: created.version,
      input: {
        name: "Stale Update"
      }
    });

    expect(conflict.status).toBe("version_conflict");

    if (conflict.status !== "version_conflict") {
      throw new Error("Expected version conflict");
    }

    expect(conflict.currentVersion).toBe(created.version + 1);
  });

  it("returns not_found when updating a missing product", async () => {
    const result = await repository.updateProduct({
      workspaceId: "workspace-a",
      productId: "missing-product",
      expectedVersion: 1,
      input: {
        name: "Missing"
      }
    });

    expect(result).toEqual({
      status: "not_found"
    });
  });
});
