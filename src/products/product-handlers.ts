import { createHash } from "node:crypto";

import type { FastifyReply, FastifyRequest } from "fastify";

import type { AuditRepository } from "../audit/audit-repository.js";
import { createHttpErrorResponse } from "../error-model.js";
import { evaluatePermissionGuard } from "../permission-guard.js";
import type { IdempotencyRepository } from "../idempotency/idempotency-repository.js";
import type { JsonValue } from "../idempotency/idempotency-types.js";
import type { ProductRepository } from "./product-repository.js";
import { toPublicProduct } from "./product-schema.js";
import type {
  ListProductsQuerystring,
  ProductItemRouteParams,
  ProductListResponse,
  ProductResponse,
  ProductRouteParams
} from "./product-schema.js";
import {
  PRODUCT_STATUSES,
  SORT_DIRECTIONS,
  STOCK_STATUSES,
  type CreateProductInput,
  type ProductStatus,
  type SortDirection,
  type StockStatus,
  type UpdateProductInput
} from "./product-types.js";

const PERMISSION_READ = "nashir.products.read";
const PERMISSION_MANAGE = "nashir.products.manage";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRODUCT_STATUS_SET = new Set<string>(PRODUCT_STATUSES);
const STOCK_STATUS_SET = new Set<string>(STOCK_STATUSES);
const SORT_DIRECTION_SET = new Set<string>(SORT_DIRECTIONS);
const STRING_OR_NULL_FIELDS = [
  "category",
  "sku",
  "imageUrl",
  "videoUrl",
  "description"
] as const;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function isProductStatus(value: unknown): value is ProductStatus {
  return typeof value === "string" && PRODUCT_STATUS_SET.has(value);
}

function isStockStatus(value: unknown): value is StockStatus {
  return typeof value === "string" && STOCK_STATUS_SET.has(value);
}

function isSortDirection(value: unknown): value is SortDirection {
  return typeof value === "string" && SORT_DIRECTION_SET.has(value);
}

function parsePositiveInteger(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function isInvalidCursorError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = "code" in err ? (err as { code?: unknown }).code : undefined;
  return (
    err.message === "Invalid product list cursor" ||
    code === "22007" ||
    code === "22P02"
  );
}

function firstHeaderValue(
  value: string | readonly string[] | undefined
): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  correlationId: string | undefined,
  details?: unknown
): void {
  const response = createHttpErrorResponse({
    code,
    message,
    statusCode,
    correlationId,
    details
  });
  reply.code(statusCode).send(response.body);
}

function sendBadRequest(
  reply: FastifyReply,
  message: string,
  correlationId: string | undefined,
  details?: unknown
): void {
  sendError(reply, 400, "BAD_REQUEST", message, correlationId, details);
}

function sendValidationFailed(
  reply: FastifyReply,
  message: string,
  correlationId: string | undefined
): void {
  sendError(reply, 422, "VALIDATION_FAILED", message, correlationId);
}

function sendNotFound(
  reply: FastifyReply,
  correlationId: string | undefined
): void {
  sendError(reply, 404, "NOT_FOUND", "Resource not found.", correlationId);
}

type ResolvedCtx = NonNullable<FastifyRequest["requestContext"]>;

function resolveContextAndPermission(
  request: FastifyRequest,
  reply: FastifyReply,
  requiredPermission: string
): { ok: true; ctx: ResolvedCtx } | { ok: false } {
  const ctx = request.requestContext;
  if (ctx === undefined) {
    sendError(
      reply,
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal server error.",
      request.correlationId
    );
    return { ok: false };
  }
  const decision = evaluatePermissionGuard({
    requiredPermission,
    grantedPermissions: ctx.grantedPermissions ?? [],
    requestContext: { workspaceId: ctx.workspaceId, actorId: ctx.actorId }
  });
  if (decision.ok === false) {
    sendError(
      reply,
      decision.statusCode,
      decision.code,
      decision.message,
      request.correlationId
    );
    return { ok: false };
  }
  return { ok: true, ctx };
}

type ValidateMode = "create" | "update";

type ValidateFail = {
  ok: false;
  statusCode: 400 | 422;
  code: "BAD_REQUEST" | "VALIDATION_FAILED";
  message: string;
};
type CreateValidationResult =
  | { ok: true; input: CreateProductInput }
  | ValidateFail;
type UpdateValidationResult =
  | { ok: true; input: UpdateProductInput }
  | ValidateFail;

function validationFailed(message: string): ValidateFail {
  return {
    ok: false,
    statusCode: 422,
    code: "VALIDATION_FAILED",
    message
  };
}

function validateName(
  body: Record<string, unknown>,
  mode: ValidateMode
): ValidateFail | null {
  const name = body.name;
  if (mode === "create") {
    if (typeof name !== "string" || name.trim().length === 0) {
      return validationFailed(
        "name is required and must be a non-empty string."
      );
    }
    return null;
  }
  if (
    "name" in body &&
    (typeof name !== "string" || name.trim().length === 0)
  ) {
    return validationFailed("name must be a non-empty string.");
  }
  return null;
}

function validateStringOrNullFields(
  body: Record<string, unknown>
): ValidateFail | null {
  for (const field of STRING_OR_NULL_FIELDS) {
    if (
      field in body &&
      body[field] !== null &&
      typeof body[field] !== "string"
    ) {
      return validationFailed(`${field} must be a string or null.`);
    }
  }
  return null;
}

function validateProductStatus(
  body: Record<string, unknown>
): ValidateFail | null {
  if ("status" in body && isProductStatus(body.status) !== true) {
    return validationFailed("status must be one of: draft, active, archived.");
  }
  return null;
}

function validateStockStatus(
  body: Record<string, unknown>
): ValidateFail | null {
  if ("stockStatus" in body && isStockStatus(body.stockStatus) !== true) {
    return validationFailed(
      "stockStatus must be one of: available, limited, out_of_stock, unknown."
    );
  }
  return null;
}

function validatePrice(body: Record<string, unknown>): ValidateFail | null {
  if (
    "price" in body &&
    body.price !== null &&
    (typeof body.price !== "number" ||
      Number.isFinite(body.price) !== true ||
      body.price < 0)
  ) {
    return validationFailed("price must be a non-negative number or null.");
  }
  return null;
}

function validateUpdateHasFields(
  input: UpdateProductInput
): ValidateFail | null {
  if (hasUpdateFields(input)) return null;
  return {
    ok: false,
    statusCode: 400,
    code: "BAD_REQUEST",
    message: "At least one product field is required for update."
  };
}

function validateSharedProductFields(
  body: Record<string, unknown>,
  mode: ValidateMode
): ValidateFail | null {
  let failure = validateName(body, mode);
  if (failure !== null) return failure;

  failure = validateStringOrNullFields(body);
  if (failure !== null) return failure;

  failure = validateProductStatus(body);
  if (failure !== null) return failure;

  failure = validateStockStatus(body);
  if (failure !== null) return failure;

  failure = validatePrice(body);
  if (failure !== null) return failure;

  return null;
}

function validateCreateProductBody(
  body: Record<string, unknown>
): CreateValidationResult {
  const failure = validateSharedProductFields(body, "create");
  if (failure !== null) return failure;

  return { ok: true, input: buildCreateInput(body) };
}

function validateUpdateProductBody(
  body: Record<string, unknown>
): UpdateValidationResult {
  const failure = validateSharedProductFields(body, "update");
  if (failure !== null) return failure;

  const input = buildUpdateInput(body);
  const updateFailure = validateUpdateHasFields(input);
  if (updateFailure !== null) return updateFailure;

  return { ok: true, input };
}

function buildCreateInput(body: Record<string, unknown>): CreateProductInput {
  return {
    name: body.name as string,
    category: "category" in body ? (body.category as string | null) : undefined,
    price: "price" in body ? (body.price as number | null) : undefined,
    sku: "sku" in body ? (body.sku as string | null) : undefined,
    stockStatus: isStockStatus(body.stockStatus) ? body.stockStatus : undefined,
    imageUrl: "imageUrl" in body ? (body.imageUrl as string | null) : undefined,
    videoUrl: "videoUrl" in body ? (body.videoUrl as string | null) : undefined,
    description:
      "description" in body ? (body.description as string | null) : undefined,
    status: isProductStatus(body.status) ? body.status : undefined
  };
}

function buildUpdateInput(body: Record<string, unknown>): UpdateProductInput {
  const input: UpdateProductInput = {};
  if ("name" in body) input.name = body.name as string;
  if ("category" in body) input.category = body.category as string | null;
  if ("price" in body) input.price = body.price as number | null;
  if ("sku" in body) input.sku = body.sku as string | null;
  if (isStockStatus(body.stockStatus)) input.stockStatus = body.stockStatus;
  if ("imageUrl" in body) input.imageUrl = body.imageUrl as string | null;
  if ("videoUrl" in body) input.videoUrl = body.videoUrl as string | null;
  if ("description" in body)
    input.description = body.description as string | null;
  if (isProductStatus(body.status)) input.status = body.status;
  return input;
}

function hasUpdateFields(input: UpdateProductInput): boolean {
  return Object.values(input).some((v) => v !== undefined);
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (value !== null && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort((a, b) => a.localeCompare(b))
      .reduce(
        (acc, key) => {
          acc[key] = sortObjectKeys((value as Record<string, unknown>)[key]);
          return acc;
        },
        {} as Record<string, unknown>
      );
  }
  return value;
}

function computeFingerprint(params: {
  workspaceId: string;
  actorId: string;
  idempotencyKey: string;
  body: unknown;
}): string {
  const canonicalBody = JSON.stringify(sortObjectKeys(params.body));
  const input = [
    params.workspaceId,
    params.actorId,
    "product.create",
    params.idempotencyKey,
    canonicalBody
  ].join("\x00");
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function createListProductsHandler(deps: {
  productRepository: ProductRepository;
}) {
  return async function listProductsHandler(
    request: FastifyRequest<{
      Params: ProductRouteParams;
      Querystring: ListProductsQuerystring;
    }>,
    reply: FastifyReply
  ): Promise<ProductListResponse | void> {
    const check = resolveContextAndPermission(request, reply, PERMISSION_READ);
    if (check.ok === false) {
      return;
    }
    const { ctx } = check;

    const q = request.query;
    const status = q.status;
    const sort = q.sort;

    if (q.limit === undefined || q.limit === "") {
      sendBadRequest(reply, "limit is required.", request.correlationId);
      return;
    }
    const limitNum = Number(q.limit);
    if (!Number.isInteger(limitNum) || limitNum <= 0) {
      sendBadRequest(
        reply,
        "limit must be a positive integer.",
        request.correlationId
      );
      return;
    }
    if (limitNum > 100) {
      sendBadRequest(
        reply,
        "limit must not exceed 100.",
        request.correlationId
      );
      return;
    }
    if (status !== undefined && isProductStatus(status) !== true) {
      sendBadRequest(
        reply,
        "status must be one of: draft, active, archived.",
        request.correlationId
      );
      return;
    }
    if (q.updatedAfter !== undefined) {
      const parsed = new Date(q.updatedAfter);
      if (Number.isNaN(parsed.getTime())) {
        sendBadRequest(
          reply,
          "updatedAfter must be a valid date.",
          request.correlationId
        );
        return;
      }
    }
    if (sort !== undefined && isSortDirection(sort) !== true) {
      sendBadRequest(
        reply,
        "sort must be one of: updatedAt:desc, updatedAt:asc.",
        request.correlationId
      );
      return;
    }

    let result;
    try {
      result = await deps.productRepository.listProducts({
        workspaceId: ctx.workspaceId,
        limit: limitNum,
        cursor: q.cursor ?? null,
        status,
        updatedAfter: q.updatedAfter,
        sort
      });
    } catch (err) {
      if (isInvalidCursorError(err)) {
        sendBadRequest(reply, "Invalid cursor.", request.correlationId);
        return;
      }
      throw err;
    }

    return {
      products: result.products.map(toPublicProduct),
      count: result.count,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor
    };
  };
}

export function createCreateProductHandler(deps: {
  productRepository: ProductRepository;
  idempotencyRepository: IdempotencyRepository;
  auditRepository: AuditRepository;
}) {
  return async function createProductHandler(
    request: FastifyRequest<{
      Params: ProductRouteParams;
      Body: Record<string, unknown>;
    }>,
    reply: FastifyReply
  ): Promise<ProductResponse | void> {
    const check = resolveContextAndPermission(
      request,
      reply,
      PERMISSION_MANAGE
    );
    if (check.ok === false) {
      return;
    }
    const { ctx } = check;

    const idempotencyKey = firstHeaderValue(request.headers["idempotency-key"]);

    if (!idempotencyKey || idempotencyKey.trim().length === 0) {
      sendBadRequest(
        reply,
        "Idempotency-Key header is required.",
        request.correlationId
      );
      return;
    }

    const body = request.body ?? {};

    if ("workspaceId" in body || "workspace_id" in body) {
      sendValidationFailed(
        reply,
        "Request body must not include workspaceId or workspace_id.",
        request.correlationId
      );
      return;
    }

    const validation = validateCreateProductBody(body);
    if (validation.ok === false) {
      sendError(
        reply,
        validation.statusCode,
        validation.code,
        validation.message,
        request.correlationId
      );
      return;
    }

    const trimmedKey = idempotencyKey.trim();
    const fingerprint = computeFingerprint({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      idempotencyKey: trimmedKey,
      body
    });

    const expiresAt = new Date(Date.now() + 86_400_000).toISOString();
    const scope = {
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      operationName: "product.create",
      idempotencyKey: trimmedKey
    };

    const idempotencyResult =
      await deps.idempotencyRepository.reserveIdempotencyRecord({
        ...scope,
        requestFingerprint: fingerprint,
        expiresAt
      });

    if (idempotencyResult.status === "existing") {
      const record = idempotencyResult.record;
      if (record.requestFingerprint !== fingerprint) {
        sendError(
          reply,
          409,
          "IDEMPOTENCY_CONFLICT",
          "Request body conflicts with the original request for this idempotency key.",
          request.correlationId
        );
        return;
      }
      if (record.responseStatusCode === 201) {
        reply.code(201).send(record.responseBody);
        return;
      }
      sendError(
        reply,
        409,
        "IDEMPOTENCY_CONFLICT",
        "Idempotent request conflict.",
        request.correlationId
      );
      return;
    }

    let product;
    try {
      product = await deps.auditRepository.withTransaction(async (db) => {
        const createdProduct = await deps.productRepository.createProduct({
          workspaceId: ctx.workspaceId,
          input: validation.input,
          db
        });
        await deps.auditRepository.createAuditEvent(
          {
            workspaceId: ctx.workspaceId,
            actorId: ctx.actorId,
            action: "product.created",
            resourceType: "product",
            resourceId: createdProduct.productId,
            correlationId: request.correlationId,
            afterState: {
              productId: createdProduct.productId,
              status: createdProduct.status,
              idempotencyKey: trimmedKey,
              version: createdProduct.version
            }
          },
          db
        );
        return createdProduct;
      });
    } catch (err) {
      await deps.idempotencyRepository
        .markIdempotencyRecordFailed({ ...scope, responseStatusCode: 500 })
        .catch(() => undefined);
      throw err;
    }

    const productResponse: ProductResponse = {
      product: toPublicProduct(product)
    };
    await deps.idempotencyRepository.markIdempotencyRecordCompleted({
      ...scope,
      responseStatusCode: 201,
      responseBody: productResponse as unknown as JsonValue,
      resourceId: product.productId
    });

    reply.code(201).send(productResponse);
  };
}

export function createGetProductHandler(deps: {
  productRepository: ProductRepository;
}) {
  return async function getProductHandler(
    request: FastifyRequest<{ Params: ProductItemRouteParams }>,
    reply: FastifyReply
  ): Promise<ProductResponse | void> {
    const check = resolveContextAndPermission(request, reply, PERMISSION_READ);
    if (check.ok === false) {
      return;
    }
    const { ctx } = check;

    if (isUuid(request.params.productId) === false) {
      sendNotFound(reply, request.correlationId);
      return;
    }

    const product = await deps.productRepository.getProductById({
      workspaceId: ctx.workspaceId,
      productId: request.params.productId
    });

    if (product === null) {
      sendNotFound(reply, request.correlationId);
      return;
    }

    return { product: toPublicProduct(product) };
  };
}

export function createUpdateProductHandler(deps: {
  productRepository: ProductRepository;
  auditRepository: AuditRepository;
}) {
  return async function updateProductHandler(
    request: FastifyRequest<{
      Params: ProductItemRouteParams;
      Body: Record<string, unknown>;
    }>,
    reply: FastifyReply
  ): Promise<ProductResponse | void> {
    const check = resolveContextAndPermission(
      request,
      reply,
      PERMISSION_MANAGE
    );
    if (check.ok === false) {
      return;
    }
    const { ctx } = check;

    if (isUuid(request.params.productId) === false) {
      sendNotFound(reply, request.correlationId);
      return;
    }

    const ifMatch = request.headers["if-match"];
    const xResourceVersion = request.headers["x-resource-version"];
    let expectedVersion: number;

    if (ifMatch !== undefined) {
      if (typeof ifMatch !== "string") {
        sendBadRequest(
          reply,
          "If-Match must be a positive integer or quoted positive integer.",
          request.correlationId
        );
        return;
      }
      const stripped = ifMatch.replace(/^"(.*)"$/, "$1");
      const parsed = parsePositiveInteger(stripped);
      if (parsed === null) {
        sendBadRequest(
          reply,
          "If-Match must be a positive integer or quoted positive integer.",
          request.correlationId
        );
        return;
      }
      expectedVersion = parsed;
    } else if (xResourceVersion === undefined) {
      sendBadRequest(
        reply,
        "If-Match or X-Resource-Version header is required.",
        request.correlationId
      );
      return;
    } else {
      const raw = firstHeaderValue(xResourceVersion);
      const parsed = parsePositiveInteger(raw);
      if (parsed === null) {
        sendBadRequest(
          reply,
          "X-Resource-Version must be a positive integer.",
          request.correlationId
        );
        return;
      }
      expectedVersion = parsed;
    }

    const body = request.body ?? {};

    if ("workspaceId" in body || "workspace_id" in body) {
      sendValidationFailed(
        reply,
        "Request body must not include workspaceId or workspace_id.",
        request.correlationId
      );
      return;
    }

    const validation = validateUpdateProductBody(body);
    if (validation.ok === false) {
      sendError(
        reply,
        validation.statusCode,
        validation.code,
        validation.message,
        request.correlationId
      );
      return;
    }

    const result = await deps.auditRepository.withTransaction(async (db) => {
      const updateResult = await deps.productRepository.updateProduct({
        workspaceId: ctx.workspaceId,
        productId: request.params.productId,
        input: validation.input,
        expectedVersion,
        db
      });
      if (updateResult.status === "updated") {
        await deps.auditRepository.createAuditEvent(
          {
            workspaceId: ctx.workspaceId,
            actorId: ctx.actorId,
            action: "product.updated",
            resourceType: "product",
            resourceId: updateResult.product.productId,
            correlationId: request.correlationId,
            beforeState: {
              productId: updateResult.product.productId,
              previousVersion: expectedVersion
            },
            afterState: {
              productId: updateResult.product.productId,
              newVersion: updateResult.product.version,
              changedFields: Object.keys(validation.input)
            }
          },
          db
        );
      }
      return updateResult;
    });

    if (result.status === "not_found") {
      sendNotFound(reply, request.correlationId);
      return;
    }

    if (result.status === "version_conflict") {
      sendError(
        reply,
        409,
        "VERSION_CONFLICT",
        "Version conflict.",
        request.correlationId,
        {
          currentVersion: result.currentVersion
        }
      );
      return;
    }

    return { product: toPublicProduct(result.product) };
  };
}
