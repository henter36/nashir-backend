import { createHash } from "node:crypto";

import type { FastifyReply, FastifyRequest } from "fastify";

import { createHttpErrorResponse } from "../error-model.js";
import { evaluatePermissionGuard } from "../permission-guard.js";
import type { IdempotencyRepository } from "../idempotency/idempotency-repository.js";
import type { JsonValue } from "../idempotency/idempotency-types.js";
import type { ProductRepository } from "./product-repository.js";
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

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function parsePositiveInteger(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
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
  if (!ctx) {
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
  if (!decision.ok) {
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

type ValidateOk = { ok: true; input: CreateProductInput | UpdateProductInput };
type ValidateFail = {
  ok: false;
  statusCode: 400 | 422;
  code: "BAD_REQUEST" | "VALIDATION_FAILED";
  message: string;
};

function validateProductBody(
  body: Record<string, unknown>,
  mode: ValidateMode
): ValidateOk | ValidateFail {
  const validationFailed = (message: string): ValidateFail => ({
    ok: false,
    statusCode: 422,
    code: "VALIDATION_FAILED",
    message
  });

  if (mode === "create") {
    if (
      !body.name ||
      typeof body.name !== "string" ||
      body.name.trim().length === 0
    ) {
      return validationFailed(
        "name is required and must be a non-empty string."
      );
    }
  } else if ("name" in body) {
    if (
      typeof body.name !== "string" ||
      (body.name as string).trim().length === 0
    ) {
      return validationFailed("name must be a non-empty string.");
    }
  }

  for (const field of [
    "category",
    "sku",
    "imageUrl",
    "videoUrl",
    "description"
  ] as const) {
    if (
      field in body &&
      body[field] !== null &&
      typeof body[field] !== "string"
    ) {
      return validationFailed(`${field} must be a string or null.`);
    }
  }

  if (
    "status" in body &&
    !PRODUCT_STATUSES.includes(body.status as ProductStatus)
  ) {
    return validationFailed("status must be one of: draft, active, archived.");
  }

  if (
    "stockStatus" in body &&
    !STOCK_STATUSES.includes(body.stockStatus as StockStatus)
  ) {
    return validationFailed(
      "stockStatus must be one of: available, limited, out_of_stock, unknown."
    );
  }

  if ("price" in body && body.price !== null) {
    if (
      typeof body.price !== "number" ||
      !Number.isFinite(body.price) ||
      body.price < 0
    ) {
      return validationFailed("price must be a non-negative number or null.");
    }
  }

  if (mode === "update") {
    const input = buildUpdateInput(body);
    if (!hasUpdateFields(input)) {
      return {
        ok: false,
        statusCode: 400,
        code: "BAD_REQUEST",
        message: "At least one product field is required for update."
      };
    }
    return { ok: true, input };
  }

  return { ok: true, input: buildCreateInput(body) };
}

function buildCreateInput(body: Record<string, unknown>): CreateProductInput {
  return {
    name: body.name as string,
    category: "category" in body ? (body.category as string | null) : undefined,
    price: "price" in body ? (body.price as number | null) : undefined,
    sku: "sku" in body ? (body.sku as string | null) : undefined,
    stockStatus:
      "stockStatus" in body ? (body.stockStatus as StockStatus) : undefined,
    imageUrl: "imageUrl" in body ? (body.imageUrl as string | null) : undefined,
    videoUrl: "videoUrl" in body ? (body.videoUrl as string | null) : undefined,
    description:
      "description" in body ? (body.description as string | null) : undefined,
    status: "status" in body ? (body.status as ProductStatus) : undefined
  };
}

function buildUpdateInput(body: Record<string, unknown>): UpdateProductInput {
  const input: UpdateProductInput = {};
  if ("name" in body) input.name = body.name as string;
  if ("category" in body) input.category = body.category as string | null;
  if ("price" in body) input.price = body.price as number | null;
  if ("sku" in body) input.sku = body.sku as string | null;
  if ("stockStatus" in body)
    input.stockStatus = body.stockStatus as StockStatus;
  if ("imageUrl" in body) input.imageUrl = body.imageUrl as string | null;
  if ("videoUrl" in body) input.videoUrl = body.videoUrl as string | null;
  if ("description" in body)
    input.description = body.description as string | null;
  if ("status" in body) input.status = body.status as ProductStatus;
  return input;
}

function hasUpdateFields(input: UpdateProductInput): boolean {
  return Object.values(input).some((v) => v !== undefined);
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (value !== null && typeof value === "object") {
    return Object.keys(value as object)
      .sort()
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
    if (!check.ok) return;
    const { ctx } = check;

    const q = request.query;

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
    if (
      q.status !== undefined &&
      !PRODUCT_STATUSES.includes(q.status as ProductStatus)
    ) {
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
    if (
      q.sort !== undefined &&
      !SORT_DIRECTIONS.includes(q.sort as SortDirection)
    ) {
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
        status: q.status as ProductStatus | undefined,
        updatedAfter: q.updatedAfter,
        sort: q.sort as SortDirection | undefined
      });
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === "Invalid product list cursor"
      ) {
        sendBadRequest(reply, "Invalid cursor.", request.correlationId);
        return;
      }
      throw err;
    }

    return {
      products: result.products,
      count: result.count,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor
    };
  };
}

export function createCreateProductHandler(deps: {
  productRepository: ProductRepository;
  idempotencyRepository: IdempotencyRepository;
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
    if (!check.ok) return;
    const { ctx } = check;

    const rawKey = request.headers["idempotency-key"];
    const idempotencyKey =
      typeof rawKey === "string"
        ? rawKey
        : Array.isArray(rawKey)
          ? rawKey[0]
          : undefined;

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

    const validation = validateProductBody(body, "create");
    if (!validation.ok) {
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
          "CONFLICT",
          "Request body conflicts with the original request for this idempotency key.",
          request.correlationId
        );
        return;
      }
      if (record.responseStatusCode === 201) {
        return reply.code(201).send(record.responseBody) as unknown as void;
      }
      sendError(
        reply,
        409,
        "CONFLICT",
        "Idempotent request conflict.",
        request.correlationId
      );
      return;
    }

    let product;
    try {
      product = await deps.productRepository.createProduct({
        workspaceId: ctx.workspaceId,
        input: validation.input as CreateProductInput
      });
    } catch (err) {
      await deps.idempotencyRepository
        .markIdempotencyRecordFailed({ ...scope, responseStatusCode: 500 })
        .catch(() => undefined);
      throw err;
    }

    const productResponse: ProductResponse = { product };
    await deps.idempotencyRepository.markIdempotencyRecordCompleted({
      ...scope,
      responseStatusCode: 201,
      responseBody: productResponse as unknown as JsonValue,
      resourceId: product.productId
    });

    return reply.code(201).send(productResponse) as unknown as void;
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
    if (!check.ok) return;
    const { ctx } = check;

    if (!isUuid(request.params.productId)) {
      sendNotFound(reply, request.correlationId);
      return;
    }

    const product = await deps.productRepository.getProductById({
      workspaceId: ctx.workspaceId,
      productId: request.params.productId
    });

    if (!product) {
      sendNotFound(reply, request.correlationId);
      return;
    }

    return { product };
  };
}

export function createUpdateProductHandler(deps: {
  productRepository: ProductRepository;
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
    if (!check.ok) return;
    const { ctx } = check;

    if (!isUuid(request.params.productId)) {
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
    } else if (xResourceVersion !== undefined) {
      const raw = Array.isArray(xResourceVersion)
        ? xResourceVersion[0]
        : xResourceVersion;
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
    } else {
      sendBadRequest(
        reply,
        "If-Match or X-Resource-Version header is required.",
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

    const validation = validateProductBody(body, "update");
    if (!validation.ok) {
      sendError(
        reply,
        validation.statusCode,
        validation.code,
        validation.message,
        request.correlationId
      );
      return;
    }

    const result = await deps.productRepository.updateProduct({
      workspaceId: ctx.workspaceId,
      productId: request.params.productId,
      input: validation.input as UpdateProductInput,
      expectedVersion
    });

    if (result.status === "not_found") {
      sendNotFound(reply, request.correlationId);
      return;
    }

    if (result.status === "version_conflict") {
      sendError(
        reply,
        409,
        "CONFLICT",
        "Version conflict.",
        request.correlationId,
        {
          currentVersion: result.currentVersion
        }
      );
      return;
    }

    return { product: result.product };
  };
}
