import process from "node:process";
import pg from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it
} from "vitest";
import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT
} from "jose";
import type { FastifyInstance, InjectOptions } from "fastify";

import { buildApp } from "../../src/app.js";
import type { AuthConfig } from "../../src/auth-config.js";
import type { JwksGetKey } from "../../src/auth-guard.js";
import type {
  WorkspaceMembershipResolver
} from "../../src/workspace-context-guard.js";
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

    const keyPair = await generateKeyPair("RS256", { modulusLength: 2048 });
    privateKey = keyPair.privateKey;

    const publicJwk = await exportJWK(keyPair.publicKey);
    publicJwk.kid = "product-route-test-key";
    publicJwk.alg = "RS256";
    publicJwk.use = "sig";

    jwksGetKey = createLocalJWKSet({ keys: [publicJwk] });
  });

  afterEach(async () => {
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

  function buildHarnessApp(): FastifyInstance {
    const app = buildApp({
      logger: false,
      productRepository,
      idempotencyRepository
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
      idempotencyRepository
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
    const { actorId = KNOWN_ACTOR, headers: extraHeaders = {}, ...rest } = options;
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

  // ───────────────────────── listProducts ─────────────────────────

  describe("listProducts", () => {
    it("returns 401 when request context headers are missing", async () => {
      const app = buildHarnessApp();
      const response = await app.inject({
        method: "GET",
        url: `${PRODUCTS_URL}?limit=10`
      });
      expect(response.statusCode).toBe(401);
      expect(response.json().code).toBe("REQUEST_CONTEXT_REQUIRED");
    });

    it("returns 404 when workspace is not found", async () => {
      const app = buildAuth0App();
      const { response, body } = await auth0Inject(app, {
        method: "GET",
        url: `${UNKNOWN_WORKSPACE_PRODUCTS_URL}?limit=10`
      });
      expect(response.statusCode).toBe(404);
      expect(body.code).toBe("WORKSPACE_NOT_FOUND");
    });

    it("returns 403 when nashir.products.read is missing from grantedPermissions", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=10`,
        permissions: ""
      });
      expect(response.statusCode).toBe(403);
      expect(body.code).toBe("FORBIDDEN");
    });

    it("returns 400 when limit is absent", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: PRODUCTS_URL
      });
      expect(response.statusCode).toBe(400);
      expect(body.code).toBe("BAD_REQUEST");
    });

    it("returns 400 when limit is not a positive integer", async () => {
      const app = buildHarnessApp();

      const { response: r1 } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=0`
      });
      expect(r1.statusCode).toBe(400);

      const { response: r2 } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=-5`
      });
      expect(r2.statusCode).toBe(400);

      const { response: r3 } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=abc`
      });
      expect(r3.statusCode).toBe(400);

      const { response: r4 } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=1.5`
      });
      expect(r4.statusCode).toBe(400);
    });

    it("returns 400 when limit exceeds 100", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=101`
      });
      expect(response.statusCode).toBe(400);
      expect(body.code).toBe("BAD_REQUEST");
    });

    it("returns 400 when status is not a valid ProductStatus", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=10&status=invalid`
      });
      expect(response.statusCode).toBe(400);
      expect(body.code).toBe("BAD_REQUEST");
    });

    it("returns 400 when updatedAfter is not a valid date", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=10&updatedAfter=not-a-date`
      });
      expect(response.statusCode).toBe(400);
      expect(body.code).toBe("BAD_REQUEST");
    });

    it("returns 400 when sort is an unrecognized value", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}?limit=10&sort=name:asc`
      });
      expect(response.statusCode).toBe(400);
      expect(body.code).toBe("BAD_REQUEST");
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
      expect(response.json().code).toBe("REQUEST_CONTEXT_REQUIRED");
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
      expect(body.code).toBe("WORKSPACE_NOT_FOUND");
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
      expect(body.code).toBe("FORBIDDEN");
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
      expect(body.code).toBe("BAD_REQUEST");
    });

    it("returns 422 when body includes workspaceId", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "POST",
        url: PRODUCTS_URL,
        headers: {
          "content-type": "application/json",
          "idempotency-key": "key-ws-id"
        },
        payload: JSON.stringify({ name: "Test", workspaceId: "ws-123" })
      });
      expect(response.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_FAILED");
    });

    it("returns 422 when body includes workspace_id", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "POST",
        url: PRODUCTS_URL,
        headers: {
          "content-type": "application/json",
          "idempotency-key": "key-ws-id2"
        },
        payload: JSON.stringify({ name: "Test", workspace_id: "ws-123" })
      });
      expect(response.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_FAILED");
    });

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
      expect(body.code).toBe("VALIDATION_FAILED");
    });

    it("returns 201 with created product on first call", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "POST",
        url: PRODUCTS_URL,
        headers: {
          "content-type": "application/json",
          "idempotency-key": "key-first-create"
        },
        payload: JSON.stringify({ name: "New Product", status: "active" })
      });
      expect(response.statusCode).toBe(201);
      expect(body.product).toBeDefined();
      expect(body.product.name).toBe("New Product");
      expect(body.product.status).toBe("active");
      expect(body.product.workspaceId).toBe(KNOWN_WORKSPACE);
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
      expect(second.body.code).toBe("CONFLICT");
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
      expect(response.json().code).toBe("REQUEST_CONTEXT_REQUIRED");
    });

    it("returns 404 when workspace is not found", async () => {
      const app = buildAuth0App();
      const { response, body } = await auth0Inject(app, {
        method: "GET",
        url: `${UNKNOWN_WORKSPACE_PRODUCTS_URL}/some-product-id`
      });
      expect(response.statusCode).toBe(404);
      expect(body.code).toBe("WORKSPACE_NOT_FOUND");
    });

    it("returns 403 when nashir.products.read is missing from grantedPermissions", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}/any-product`,
        permissions: ""
      });
      expect(response.statusCode).toBe(403);
      expect(body.code).toBe("FORBIDDEN");
    });

    it("returns 404 when product does not exist", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "GET",
        url: `${PRODUCTS_URL}/nonexistent-product-id`,
        permissions: PERM_READ
      });
      expect(response.statusCode).toBe(404);
      expect(body.code).toBe("NOT_FOUND");
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
      expect(body.code).toBe("NOT_FOUND");
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
      expect(response.json().code).toBe("REQUEST_CONTEXT_REQUIRED");
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
      expect(body.code).toBe("WORKSPACE_NOT_FOUND");
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
      expect(body.code).toBe("FORBIDDEN");
    });

    it("returns 400 when neither If-Match nor X-Resource-Version is present", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "PUT",
        url: `${PRODUCTS_URL}/some-product`,
        headers: { "content-type": "application/json" },
        payload: JSON.stringify({ name: "Updated" })
      });
      expect(response.statusCode).toBe(400);
      expect(body.code).toBe("BAD_REQUEST");
    });

    it("returns 400 when If-Match contains a non-integer value", async () => {
      const app = buildHarnessApp();

      const { response: r1, body: b1 } = await harnessInject(app, {
        method: "PUT",
        url: `${PRODUCTS_URL}/some-product`,
        headers: {
          "content-type": "application/json",
          "if-match": '"not-a-number"'
        },
        payload: JSON.stringify({ name: "Updated" })
      });
      expect(r1.statusCode).toBe(400);
      expect(b1.code).toBe("BAD_REQUEST");

      const { response: r2, body: b2 } = await harnessInject(app, {
        method: "PUT",
        url: `${PRODUCTS_URL}/some-product`,
        headers: {
          "content-type": "application/json",
          "if-match": '"abc"'
        },
        payload: JSON.stringify({ name: "Updated" })
      });
      expect(r2.statusCode).toBe(400);
      expect(b2.code).toBe("BAD_REQUEST");
    });

    it("returns 400 when X-Resource-Version is zero or negative", async () => {
      const app = buildHarnessApp();

      const { response: r1 } = await harnessInject(app, {
        method: "PUT",
        url: `${PRODUCTS_URL}/some-product`,
        headers: {
          "content-type": "application/json",
          "x-resource-version": "0"
        },
        payload: JSON.stringify({ name: "Updated" })
      });
      expect(r1.statusCode).toBe(400);

      const { response: r2 } = await harnessInject(app, {
        method: "PUT",
        url: `${PRODUCTS_URL}/some-product`,
        headers: {
          "content-type": "application/json",
          "x-resource-version": "-1"
        },
        payload: JSON.stringify({ name: "Updated" })
      });
      expect(r2.statusCode).toBe(400);
    });

    it("returns 422 when body includes workspaceId", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "PUT",
        url: `${PRODUCTS_URL}/some-product`,
        headers: {
          "content-type": "application/json",
          "if-match": "1"
        },
        payload: JSON.stringify({ name: "Updated", workspaceId: "ws-123" })
      });
      expect(response.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_FAILED");
    });

    it("returns 422 when body includes workspace_id", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "PUT",
        url: `${PRODUCTS_URL}/some-product`,
        headers: {
          "content-type": "application/json",
          "if-match": "1"
        },
        payload: JSON.stringify({ name: "Updated", workspace_id: "ws-123" })
      });
      expect(response.statusCode).toBe(422);
      expect(body.code).toBe("VALIDATION_FAILED");
    });

    it("returns 404 when product does not exist", async () => {
      const app = buildHarnessApp();
      const { response, body } = await harnessInject(app, {
        method: "PUT",
        url: `${PRODUCTS_URL}/nonexistent-product`,
        headers: {
          "content-type": "application/json",
          "if-match": "1"
        },
        payload: JSON.stringify({ name: "Updated" })
      });
      expect(response.statusCode).toBe(404);
      expect(body.code).toBe("NOT_FOUND");
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
      expect(body.code).toBe("CONFLICT");
      expect(body.details?.currentVersion).toBe(created.version + 1);
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
      expect(body.product.version).toBe(created.version + 1);
    });
  });
});
