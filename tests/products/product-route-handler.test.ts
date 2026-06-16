import process from "node:process";
import pg from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import type { FastifyInstance, InjectOptions } from "fastify";

import { buildApp } from "../../src/app.js";
import { AuditRepository } from "../../src/audit/audit-repository.js";
import type { AuthConfig } from "../../src/auth-config.js";
import type { JwksGetKey } from "../../src/auth-guard.js";
import type { WorkspaceMembershipResolver } from "../../src/workspace-context-guard.js";
import { IdempotencyRepository } from "../../src/idempotency/idempotency-repository.js";
import { ProductRepository } from "../../src/products/product-repository.js";
import {
  ACTOR_ID_HEADER,
  GRANTED_PERMISSIONS_HEADER,
  WORKSPACE_ID_HEADER
} from "../../src/request-context.js";
import {
  getRequiredTestDatabaseUrl,
  resetDatabase,
  runMigrationsForTestDatabase,
  truncateIdempotencyData,
  truncateProductData
} from "../helpers/test-db.js";

const { Pool } = pg;

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeDb = testDatabaseUrl ? describe : describe.skip;

const KNOWN_WORKSPACE = "workspace-route-test";
const KNOWN_ACTOR = "actor-route-test";
const UNKNOWN_WORKSPACE = "workspace-unknown";

const PRODUCTS_URL = `/workspaces/${KNOWN_WORKSPACE}/products`;
const UNKNOWN_WORKSPACE_PRODUCTS_URL = `/workspaces/${UNKNOWN_WORKSPACE}/products`;

const PERM_READ = "nashir.products.read";
const PERM_MANAGE = "nashir.products.manage";

const authConfig: AuthConfig = {
  AUTH0_ISSUER_URL: "https://test-product-routes.example.com/",
  AUTH0_AUDIENCE: "https://test-product-api.example.com",
  JWKS_CACHE_TTL_SECONDS: 600,
  JWKS_REFRESH_COOLDOWN_SECONDS: 30,
  TOKEN_LEEWAY_SECONDS: 0
};

describeDb("Product Route Handlers", () => {
  let pool: pg.Pool;
  let productRepository: ProductRepository;
  let idempotencyRepository: IdempotencyRepository;
  let auditRepository: AuditRepository;

  let privateKey: CryptoKey;
  let jwksGetKey: JwksGetKey;

  const openApps: FastifyInstance[] = [];

  const workspaceMembershipResolver: WorkspaceMembershipResolver = ({
    workspaceId,
    actorId
  }) => {
    if (workspaceId === KNOWN_WORKSPACE && actorId === KNOWN_ACTOR) {
      return { outcome: "member" };
    }
    if (workspaceId === UNKNOWN_WORKSPACE) {
      return { outcome: "workspace_not_found" };
    }
    if (workspaceId === KNOWN_WORKSPACE && actorId !== KNOWN_ACTOR) {
      return { outcome: "not_member" };
    }
    return { outcome: "workspace_not_found" };
  };

  beforeAll(async () => {
    const databaseUrl = getRequiredTestDatabaseUrl(
      "product route handler tests"
    );

    pool = new Pool({ connectionString: databaseUrl });
    await resetDatabase(pool);
    runMigrationsForTestDatabase(databaseUrl);

    productRepository = new ProductRepository(pool);
    idempotencyRepository = new IdempotencyRepository(pool);
    auditRepository = new AuditRepository(pool);

    const keyPair = await generateKeyPair("RS256", { modulusLength: 2048 });
    privateKey = keyPair.privateKey;

    const publicJwk = await exportJWK(keyPair.publicKey);
    publicJwk.kid = "product-route-test-key";
    publicJwk.alg = "RS256";
    publicJwk.use = "sig";

    jwksGetKey = createLocalJWKSet({ keys: [publicJwk] });
  });

  afterEach(async () => {
    await pool.query("TRUNCATE TABLE audit_events;");
    await truncateProductData(pool);
    await truncateIdempotencyData(pool);
  });

  afterAll(async () => {
    await resetDatabase(pool);
    await pool.end();
    await Promise.all(openApps.splice(0).map((app) => app.close()));
  });

  async function bearerToken(actorId: string = KNOWN_ACTOR): Promise<string> {
    return new SignJWT({ sub: actorId })
      .setProtectedHeader({ alg: "RS256", kid: "product-route-test-key" })
      .setIssuedAt()
      .setIssuer(authConfig.AUTH0_ISSUER_URL)
      .setAudience(authConfig.AUTH0_AUDIENCE)
      .setExpirationTime("5m")
      .sign(privateKey);
  }

  function buildHarnessApp(
    auditRepositoryOverride: AuditRepository = auditRepository
  ): FastifyInstance {
    const app = buildApp({
      logger: false,
      productRepository,
      idempotencyRepository,
      auditRepository: auditRepositoryOverride
    });
    openApps.push(app);
    return app;
  }

  function buildAuth0App(
    resolver: WorkspaceMembershipResolver = workspaceMembershipResolver
  ): FastifyInstance {
    const app = buildApp({
      logger: false,
      authConfig,
      jwksGetKey,
      workspaceMembershipResolver: resolver,
      productRepository,
      idempotencyRepository,
      auditRepository
    });
    openApps.push(app);
    return app;
  }

  async function harnessInject(
    app: FastifyInstance,
    options: InjectOptions & {
      permissions?: string | null;
      workspaceId?: string;
      actorId?: string;
    }
  ) {
    const {
      permissions = `${PERM_READ},${PERM_MANAGE}`,
      workspaceId = KNOWN_WORKSPACE,
      actorId = KNOWN_ACTOR,
      headers: extraHeaders = {},
      ...rest
    } = options;

    const headers: Record<string, string> = {
      [WORKSPACE_ID_HEADER]: workspaceId,
      [ACTOR_ID_HEADER]: actorId,
      ...(extraHeaders as Record<string, string>)
    };

    if (permissions !== null) {
      headers[GRANTED_PERMISSIONS_HEADER] = permissions;
    }

    const response = await app.inject({ headers, ...rest });
    return { response, body: response.json() };
  }

  async function auth0Inject(
    app: FastifyInstance,
    options: InjectOptions & { actorId?: string }
  ) {
    const {
      actorId = KNOWN_ACTOR,
      headers: extraHeaders = {},
      ...rest
    } = options;
    const token = await bearerToken(actorId);
    const response = await app.inject({
      headers: {
        authorization: `Bearer ${token}`,
        ...(extraHeaders as Record<string, string>)
      },
      ...rest
    });
    return { response, body: response.json() };
  }

  async function auditEvents() {
    const result = await pool.query<{
      action_name: string;
      before_state: Record<string, unknown> | null;
      after_state: Record<string, unknown> | null;
    }>(
      "SELECT action_name, before_state, after_state FROM audit_events ORDER BY created_at;"
    );
    return result.rows;
  }

  // ───────────────────────── listProducts ─────────────────────────

  describe("listProducts", () => {
    it("returns 401 when request context headers are missing", async () => {
      const app = buildHarnessApp();
      const response = await app.inject({
        method: "GET",
        url: `${PRODUCTS_URL}?limit=10`
      });
      expect(response.statusCode).toBe(401);
      expect(response.json().errorCode).toBe("permission.denied");
    });

    it("returns 404 when workspace is not found", async () => {
      const app = buildAuth0App();
      const { response, body } = await auth0Inject(app, {
        method: "GET",
        url: `${UNKNOWN_WORKSPACE_PRODUCTS_URL}?limit=10`
      });
      expect(response.statusCode).toBe(404);
      expect(body.errorCode).toBe("workspace.not_found");
    });

    it("returns 403 when nashir.products.read is missing from grantedPermissions", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=10`,
        permissions: ""
      });
      expect(response.statusCode).toBe(403);
      expect(body.errorCode).toBe("permission.denied");
    });

    it("returns 400 when limit is absent", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: PRODUCTS_URL
      });
      expect(response.statusCode).toBe(400);
      expect(body.errorCode).toBe("validation.failed");
    });

    it.each(["0", "-5", "abc", "1.5"])(
      "returns 400 when limit is not a positive integer: %s",
      async (limit) => {
        const app = buildHarnessApp();
        const { response, body } = await harnessInject(app, {
          method: "GET",
          url: `${PRODUCTS_URL}?limit=${limit}`
        });
        expect(response.statusCode).toBe(400);
        expect(body.errorCode).toBe("validation.failed");
      }
    );

    it("returns 400 when limit exceeds 100", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=101`
      });
      expect(response.statusCode).toBe(400);
      expect(body.errorCode).toBe("validation.failed");
    });

    it("returns 400 when status is not a valid ProductStatus", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=10&status=invalid`
      });
      expect(response.statusCode).toBe(400);
      expect(body.errorCode).toBe("validation.failed");
    });

    it("returns 400 when updatedAfter is not a valid date", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=10&updatedAfter=not-a-date`
      });
      expect(response.statusCode).toBe(400);
      expect(body.errorCode).toBe("validation.failed");
    });

    it("returns 400 when sort is an unrecognized value", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=10&sort=name:asc`
      });
      expect(response.statusCode).toBe(400);
      expect(body.errorCode).toBe("validation.failed");
    });

    it("returns 400 when cursor is invalid", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=10&cursor=not-a-valid-cursor`,
        permissions: PERM_READ
      });
      expect(response.statusCode).toBe(400);
      expect(body.errorCode).toBe("validation.failed");
    });

    it("returns 200 with empty list when no products exist in workspace", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=10`,
        permissions: PERM_READ
      });
      expect(response.statusCode).toBe(200);
      expect(body.products).toEqual([]);
      expect(body.count).toBe(0);
      expect(body.hasMore).toBe(false);
      expect(body.nextCursor).toBeNull();
    });

    it("returns 200 with products and hasMore:false when all fit in one page", async () => {
      await productRepository.createProduct({
        workspaceId: KNOWN_WORKSPACE,
        input: { name: "Product One" }
      });
      await productRepository.createProduct({
        workspaceId: KNOWN_WORKSPACE,
        input: { name: "Product Two" }
      });

      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=10`,
        permissions: PERM_READ
      });
      expect(response.statusCode).toBe(200);
      expect(body.products).toHaveLength(2);
      expect(typeof body.products[0].version).toBe("string");
      expect(body.count).toBe(2);
      expect(body.hasMore).toBe(false);
      expect(body.nextCursor).toBeNull();
    });

    it("returns 200 with hasMore:true and nextCursor when products exceed limit", async () => {
      await productRepository.createProduct({
        workspaceId: KNOWN_WORKSPACE,
        input: { name: "Product A" }
      });
      await productRepository.createProduct({
        workspaceId: KNOWN_WORKSPACE,
        input: { name: "Product B" }
      });
      await productRepository.createProduct({
        workspaceId: KNOWN_WORKSPACE,
        input: { name: "Product C" }
      });

      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=2`,
        permissions: PERM_READ
      });
      expect(response.statusCode).toBe(200);
      expect(body.products).toHaveLength(2);
      expect(body.hasMore).toBe(true);
      expect(body.nextCursor).not.toBeNull();
    });

    it("returns 200 on subsequent page using nextCursor", async () => {
      await productRepository.createProduct({
        workspaceId: KNOWN_WORKSPACE,
        input: { name: "Product X" }
      });
      await productRepository.createProduct({
        workspaceId: KNOWN_WORKSPACE,
        input: { name: "Product Y" }
      });
      await productRepository.createProduct({
        workspaceId: KNOWN_WORKSPACE,
        input: { name: "Product Z" }
      });

      const app = buildHarnessApp();
      const firstPage = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=2`,
        permissions: PERM_READ
      });

      expect(firstPage.response.statusCode).toBe(200);
      const cursor = firstPage.body.nextCursor as string;

      const secondPage = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=2&cursor=${encodeURIComponent(cursor)}`,
        permissions: PERM_READ
      });

      expect(secondPage.response.statusCode).toBe(200);
      expect(secondPage.body.products).toHaveLength(1);
      expect(secondPage.body.hasMore).toBe(false);
    });

    it("returns 200 when sort is updatedAt:desc", async () => {
      await productRepository.createProduct({
        workspaceId: KNOWN_WORKSPACE,
        input: { name: "Sort Test" }
      });

      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=10&sort=updatedAt%3Adesc`,
        permissions: PERM_READ
      });
      expect(response.statusCode).toBe(200);
      expect(body.products).toHaveLength(1);
    });

    it("returns 200 when sort is updatedAt:asc", async () => {
      await productRepository.createProduct({
        workspaceId: KNOWN_WORKSPACE,
        input: { name: "Sort Test ASC" }
      });

      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=10&sort=updatedAt%3Aasc`,
        permissions: PERM_READ
      });
      expect(response.statusCode).toBe(200);
      expect(body.products).toHaveLength(1);
    });
  });

  // ───────────────────────── createProduct ─────────────────────────

  describe("createProduct", () => {
    it("returns 401 when request context headers are missing", async () => {
      const app = buildHarnessApp();
      const response = await app.inject({
        method: "POST",
        url: PRODUCTS_URL,
        headers: { "content-type": "application/json" },
        payload: JSON.stringify({ name: "Test" })
      });
      expect(response.statusCode).toBe(401);
      expect(response.json().errorCode).toBe("permission.denied");
    });

    it("returns 404 when workspace is not found", async () => {
      const app = buildAuth0App();
      const { response, body } = await auth0Inject(app, {
        method: "POST",
        url: UNKNOWN_WORKSPACE_PRODUCTS_URL,
        headers: {
          "content-type": "application/json",
          "idempotency-key": "key-ws-not-found"
        },
        payload: JSON.stringify({ name: "Test" })
      });
      expect(response.statusCode).toBe(404);
      expect(body.errorCode).toBe("workspace.not_found");
    });

    it("returns 403 when nashir.products.manage is missing from grantedPermissions", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "POST",
        url: PRODUCTS_URL,
        permissions: PERM_READ,
        headers: {
          "content-type": "application/json",
          "idempotency-key": "key-no-perm"
        },
        payload: JSON.stringify({ name: "Test" })
      });
      expect(response.statusCode).toBe(403);
      expect(body.errorCode).toBe("permission.denied");
    });

    it("returns 400 when Idempotency-Key header is missing", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "POST",
        url: PRODUCTS_URL,
        headers: { "content-type": "application/json" },
        payload: JSON.stringify({ name: "Test" })
      });
      expect(response.statusCode).toBe(400);
      expect(body.errorCode).toBe("validation.failed");
    });

    it.each(["workspaceId", "workspace_id"])(
      "returns 422 when body includes %s",
      async (field) => {
        const app = buildHarnessApp();
        const { response, body } = await harnessInject(app, {
          method: "POST",
          url: PRODUCTS_URL,
          headers: {
            "content-type": "application/json",
            "idempotency-key": `key-${field}`
          },
          payload: JSON.stringify({ name: "Test", [field]: "ws-123" })
        });
        expect(response.statusCode).toBe(422);
        expect(body.errorCode).toBe("validation.failed");
      }
    );

    it("returns 422 when name is missing from body", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "POST",
        url: PRODUCTS_URL,
        headers: {
          "content-type": "application/json",
          "idempotency-key": "key-no-name"
        },
        payload: JSON.stringify({ category: "Gadgets" })
      });
      expect(response.statusCode).toBe(422);
      expect(body.errorCode).toBe("validation.failed");
      expect(await auditEvents()).toHaveLength(0);
    });

    it.each([
      [
        "invalid status",
        { name: "Test", status: "published" },
        "key-inv-status"
      ],
      [
        "invalid stockStatus",
        { name: "Test", stockStatus: "plenty" },
        "key-inv-stock"
      ],
      ["negative price", { name: "Test", price: -1 }, "key-inv-price"],
      [
        "non-string nullable field (category)",
        { name: "Test", category: 99 },
        "key-inv-cat"
      ]
    ])("returns 422 when body has %s", async (_caseName, payload, idemKey) => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "POST",
        url: PRODUCTS_URL,
        headers: {
          "content-type": "application/json",
          "idempotency-key": idemKey
        },
        payload: JSON.stringify(payload)
      });
      expect(response.statusCode).toBe(422);
      expect(body.errorCode).toBe("validation.failed");
    });

    it("returns 201 with created product on first call", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "POST",
        url: PRODUCTS_URL,
        headers: {
          "content-type": "application/json",
          "idempotency-key": "key-first-create",
          authorization: "Bearer must-not-be-audited"
        },
        payload: JSON.stringify({
          name: "New Product",
          status: "active",
          occurredAt: "2000-01-01T00:00:00.000Z",
          secret: "must-not-be-audited",
          token: "must-not-be-audited"
        })
      });
      expect(response.statusCode).toBe(201);
      expect(body.product).toBeDefined();
      expect(body.product.name).toBe("New Product");
      expect(body.product.status).toBe("active");
      expect(body.product.workspaceId).toBe(KNOWN_WORKSPACE);
      expect(body.product.version).toBe("1");

      const events = await auditEvents();
      expect(events).toEqual([
        {
          action_name: "product.created",
          before_state: null,
          after_state: {
            productId: body.product.productId,
            status: "active",
            idempotencyKey: "key-first-create",
            version: 1
          }
        }
      ]);
      expect(JSON.stringify(events)).not.toContain("authorization");
      expect(JSON.stringify(events)).not.toContain("New Product");
      expect(JSON.stringify(events)).not.toContain("must-not-be-audited");
      expect(JSON.stringify(events)).not.toContain("2000-01-01");
    });

    it("returns 201 with identical body on idempotency replay", async () => {
      const app = buildHarnessApp();
      const payload = JSON.stringify({ name: "Idempotent Product" });
      const headers = {
        "content-type": "application/json",
        "idempotency-key": "key-replay-test"
      };

      const first = await harnessInject(app, {
        method: "POST",
        url: PRODUCTS_URL,
        headers,
        payload
      });

      expect(first.response.statusCode).toBe(201);

      const second = await harnessInject(app, {
        method: "POST",
        url: PRODUCTS_URL,
        headers,
        payload
      });

      expect(second.response.statusCode).toBe(201);
      expect(second.body.product.productId).toBe(first.body.product.productId);
      expect(await auditEvents()).toHaveLength(1);
    });

    it("rolls back product create when the required audit write fails", async () => {
      class FailingAuditRepository extends AuditRepository {
        override async createAuditEvent(): Promise<never> {
          throw new Error("audit write failed");
        }
      }

      const app = buildHarnessApp(new FailingAuditRepository(pool));
      const { response } = await harnessInject(app, {
        method: "POST",
        url: PRODUCTS_URL,
        headers: {
          "content-type": "application/json",
          "idempotency-key": "key-audit-failure"
        },
        payload: JSON.stringify({ name: "Must Roll Back" })
      });

      expect(response.statusCode).toBe(500);
      const products = await pool.query("SELECT product_id FROM products;");
      expect(products.rows).toHaveLength(0);
      expect(await auditEvents()).toHaveLength(0);
    });

    it("returns 409 when same key is replayed with different body", async () => {
      const app = buildHarnessApp();
      const idemKey = "key-conflict-test";

      const first = await harnessInject(app, {
        method: "POST",
        url: PRODUCTS_URL,
        headers: {
          "content-type": "application/json",
          "idempotency-key": idemKey
        },
        payload: JSON.stringify({ name: "Original Name" })
      });
      expect(first.response.statusCode).toBe(201);

      const second = await harnessInject(app, {
        method: "POST",
        url: PRODUCTS_URL,
        headers: {
          "content-type": "application/json",
          "idempotency-key": idemKey
        },
        payload: JSON.stringify({ name: "Different Name" })
      });
      expect(second.response.statusCode).toBe(409);
      expect(second.body.errorCode).toBe("idempotency.conflict");
    });
  });

  // ───────────────────────── getProduct ─────────────────────────

  describe("getProduct", () => {
    it("returns 401 when request context headers are missing", async () => {
      const app = buildHarnessApp();
      const response = await app.inject({
        method: "GET",
        url: `${PRODUCTS_URL}/some-product-id`
      });
      expect(response.statusCode).toBe(401);
      expect(response.json().errorCode).toBe("permission.denied");
    });

    it("returns 404 when workspace is not found", async () => {
      const app = buildAuth0App();
      const { response, body } = await auth0Inject(app, {
        method: "GET",
        url: `${UNKNOWN_WORKSPACE_PRODUCTS_URL}/some-product-id`
      });
      expect(response.statusCode).toBe(404);
      expect(body.errorCode).toBe("workspace.not_found");
    });

    it("returns 403 when nashir.products.read is missing from grantedPermissions", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}/any-product`,
        permissions: ""
      });
      expect(response.statusCode).toBe(403);
      expect(body.errorCode).toBe("permission.denied");
    });

    it("returns 404 when product does not exist", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}/nonexistent-product-id`,
        permissions: PERM_READ
      });
      expect(response.statusCode).toBe(404);
      expect(body.errorCode).toBe("resource.not_found");
    });

    it("returns 404 when productId is not a valid UUID", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}/not-a-uuid`,
        permissions: PERM_READ
      });
      expect(response.statusCode).toBe(404);
      expect(body.errorCode).toBe("resource.not_found");
    });

    it("returns 404 when product belongs to a different workspace", async () => {
      const created = await productRepository.createProduct({
        workspaceId: "other-workspace",
        input: { name: "Cross Workspace Product" }
      });

      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}/${created.productId}`,
        permissions: PERM_READ
      });
      expect(response.statusCode).toBe(404);
      expect(body.errorCode).toBe("resource.not_found");
    });

    it("returns 200 with product when found", async () => {
      const created = await productRepository.createProduct({
        workspaceId: KNOWN_WORKSPACE,
        input: { name: "My Product", status: "active" }
      });

      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}/${created.productId}`,
        permissions: PERM_READ
      });
      expect(response.statusCode).toBe(200);
      expect(body.product.productId).toBe(created.productId);
      expect(body.product.name).toBe("My Product");
      expect(body.product.workspaceId).toBe(KNOWN_WORKSPACE);
      expect(body.product.version).toBe(String(created.version));
    });
  });

  // ───────────────────────── updateProduct ─────────────────────────

  describe("updateProduct", () => {
    it("returns 401 when request context headers are missing", async () => {
      const app = buildHarnessApp();
      const response = await app.inject({
        method: "PUT",
        url: `${PRODUCTS_URL}/some-product-id`,
        headers: {
          "content-type": "application/json",
          "if-match": "1"
        },
        payload: JSON.stringify({ name: "Updated" })
      });
      expect(response.statusCode).toBe(401);
      expect(response.json().errorCode).toBe("permission.denied");
    });

    it("returns 404 when workspace is not found", async () => {
      const app = buildAuth0App();
      const { response, body } = await auth0Inject(app, {
        method: "PUT",
        url: `${UNKNOWN_WORKSPACE_PRODUCTS_URL}/some-product-id`,
        headers: {
          "content-type": "application/json",
          "if-match": "1"
        },
        payload: JSON.stringify({ name: "Updated" })
      });
      expect(response.statusCode).toBe(404);
      expect(body.errorCode).toBe("workspace.not_found");
    });

    it("returns 403 when nashir.products.manage is missing from grantedPermissions", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "PUT",
        url: `${PRODUCTS_URL}/any-product`,
        permissions: PERM_READ,
        headers: {
          "content-type": "application/json",
          "if-match": "1"
        },
        payload: JSON.stringify({ name: "Updated" })
      });
      expect(response.statusCode).toBe(403);
      expect(body.errorCode).toBe("permission.denied");
    });

    it("returns 404 when productId is not a valid UUID", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "PUT",
        url: `${PRODUCTS_URL}/not-a-uuid`,
        headers: {
          "content-type": "application/json",
          "if-match": "1"
        },
        payload: JSON.stringify({ name: "Updated" })
      });
      expect(response.statusCode).toBe(404);
      expect(body.errorCode).toBe("resource.not_found");
    });

    it("returns 400 when neither If-Match nor X-Resource-Version is present", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "PUT",
        url: `${PRODUCTS_URL}/00000000-0000-0000-0000-000000000001`,
        headers: { "content-type": "application/json" },
        payload: JSON.stringify({ name: "Updated" })
      });
      expect(response.statusCode).toBe(400);
      expect(body.errorCode).toBe("validation.failed");
    });

    it.each(['"not-a-number"', '"abc"', "1abc", ""])(
      "returns 400 when If-Match is invalid: %j",
      async (ifMatch) => {
        const app = buildHarnessApp();
        const { response, body } = await harnessInject(app, {
          method: "PUT",
          url: `${PRODUCTS_URL}/00000000-0000-0000-0000-000000000001`,
          headers: {
            "content-type": "application/json",
            "if-match": ifMatch
          },
          payload: JSON.stringify({ name: "Updated" })
        });
        expect(response.statusCode).toBe(400);
        expect(body.errorCode).toBe("validation.failed");
      }
    );

    it("returns 400 when If-Match is not a string", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "PUT",
        url: `${PRODUCTS_URL}/00000000-0000-0000-0000-000000000001`,
        headers: {
          "content-type": "application/json",
          "if-match": ["1", "2"] as unknown as string
        },
        payload: JSON.stringify({ name: "Updated" })
      });
      expect(response.statusCode).toBe(400);
      expect(body.errorCode).toBe("validation.failed");
    });

    it.each(["0", "-1", "1abc"])(
      "returns 400 when X-Resource-Version is invalid: %s",
      async (version) => {
        const app = buildHarnessApp();
        const { response, body } = await harnessInject(app, {
          method: "PUT",
          url: `${PRODUCTS_URL}/00000000-0000-0000-0000-000000000001`,
          headers: {
            "content-type": "application/json",
            "x-resource-version": version
          },
          payload: JSON.stringify({ name: "Updated" })
        });
        expect(response.statusCode).toBe(400);
        expect(body.errorCode).toBe("validation.failed");
      }
    );

    it.each(["workspaceId", "workspace_id"])(
      "returns 422 when body includes %s",
      async (field) => {
        const app = buildHarnessApp();
        const { response, body } = await harnessInject(app, {
          method: "PUT",
          url: `${PRODUCTS_URL}/00000000-0000-0000-0000-000000000001`,
          headers: {
            "content-type": "application/json",
            "if-match": "1"
          },
          payload: JSON.stringify({ name: "Updated", [field]: "ws-123" })
        });
        expect(response.statusCode).toBe(422);
        expect(body.errorCode).toBe("validation.failed");
      }
    );

    it.each([
      [
        422,
        "invalid status",
        "validation.failed",
        { name: "Valid", status: "published" }
      ],
      [
        422,
        "invalid stockStatus",
        "validation.failed",
        { name: "Valid", stockStatus: "plenty" }
      ],
      [
        422,
        "negative price",
        "validation.failed",
        { name: "Valid", price: -5 }
      ],
      [400, "no valid update fields", "validation.failed", {}]
    ])(
      "returns %i when body has %s",
      async (expectedStatus, _caseName, expectedCode, payload) => {
        const app = buildHarnessApp();
        const { response, body } = await harnessInject(app, {
          method: "PUT",
          url: `${PRODUCTS_URL}/00000000-0000-0000-0000-000000000001`,
          headers: {
            "content-type": "application/json",
            "if-match": "1"
          },
          payload: JSON.stringify(payload)
        });
        expect(response.statusCode).toBe(expectedStatus);
        expect(body.errorCode).toBe(expectedCode);
        expect(await auditEvents()).toHaveLength(0);
      }
    );

    it("returns 404 when product does not exist", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "PUT",
        url: `${PRODUCTS_URL}/00000000-0000-0000-0000-000000000001`,
        headers: {
          "content-type": "application/json",
          "if-match": "1"
        },
        payload: JSON.stringify({ name: "Updated" })
      });
      expect(response.statusCode).toBe(404);
      expect(body.errorCode).toBe("resource.not_found");
      expect(await auditEvents()).toHaveLength(0);
    });

    it("rolls back product update when the required audit write fails", async () => {
      class FailingAuditRepository extends AuditRepository {
        override async createAuditEvent(): Promise<never> {
          throw new Error("audit write failed");
        }
      }

      const created = await productRepository.createProduct({
        workspaceId: KNOWN_WORKSPACE,
        input: { name: "Original Name" }
      });
      const app = buildHarnessApp(new FailingAuditRepository(pool));
      const { response } = await harnessInject(app, {
        method: "PUT",
        url: `${PRODUCTS_URL}/${created.productId}`,
        headers: {
          "content-type": "application/json",
          "if-match": String(created.version)
        },
        payload: JSON.stringify({ name: "Must Roll Back" })
      });

      expect(response.statusCode).toBe(500);
      const product = await productRepository.getProductById({
        workspaceId: KNOWN_WORKSPACE,
        productId: created.productId
      });
      expect(product?.name).toBe("Original Name");
      expect(product?.version).toBe(created.version);
      expect(await auditEvents()).toHaveLength(0);
    });

    it("returns 409 on version conflict with stale expectedVersion", async () => {
      const created = await productRepository.createProduct({
        workspaceId: KNOWN_WORKSPACE,
        input: { name: "Version Product" }
      });

      await productRepository.updateProduct({
        workspaceId: KNOWN_WORKSPACE,
        productId: created.productId,
        input: { name: "Bumped Version" },
        expectedVersion: created.version
      });

      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "PUT",
        url: `${PRODUCTS_URL}/${created.productId}`,
        headers: {
          "content-type": "application/json",
          "if-match": String(created.version)
        },
        payload: JSON.stringify({ name: "Stale Update" })
      });
      expect(response.statusCode).toBe(409);
      expect(body.errorCode).toBe("conflict.version_mismatch");
      expect(body.details?.currentVersion).toBe(created.version + 1);
      expect(await auditEvents()).toHaveLength(0);
    });

    it("returns 200 with updated product when version matches", async () => {
      const created = await productRepository.createProduct({
        workspaceId: KNOWN_WORKSPACE,
        input: { name: "Update Me", status: "draft" }
      });

      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "PUT",
        url: `${PRODUCTS_URL}/${created.productId}`,
        headers: {
          "content-type": "application/json",
          "if-match": String(created.version)
        },
        payload: JSON.stringify({ name: "Updated Name", status: "active" })
      });
      expect(response.statusCode).toBe(200);
      expect(body.product.productId).toBe(created.productId);
      expect(body.product.name).toBe("Updated Name");
      expect(body.product.status).toBe("active");
      expect(body.product.version).toBe(String(created.version + 1));

      expect(await auditEvents()).toEqual([
        {
          action_name: "product.updated",
          before_state: {
            productId: created.productId,
            previousVersion: created.version
          },
          after_state: {
            productId: created.productId,
            newVersion: created.version + 1,
            changedFields: ["name", "status"]
          }
        }
      ]);
    });
  });
});
