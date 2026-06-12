import { createHash } from "node:crypto";

import type { FastifyReply, FastifyRequest } from "fastify";

import { createHttpErrorResponse } from "../error-model.js";
import { evaluatePermissionGuard } from "../permission-guard.js";
import type { IdempotencyRepository } from "../idempotency/idempotency-repository.js";
import type { JsonValue } from "../idempotency/idempotency-types.js";
import type { ProductRepository } from "./product-repository.js";
import type {
  ProductItemRouteParams,
  ProductListResponse,
  ProductResponse,
  ProductRouteParams,
  ListProductsQuerystring
} from "./product-schema.js";
import {
  PRODUCT_STATUSES,
  SORT_DIRECTIONS,
  type CreateProductInput,
  type ProductStatus,
  type SortDirection,
  type StockStatus,
  type UpdateProductInput
} from "./product-types.js";

const PERMISSION_READ = "nashir.products.read";
const PERMISSION_MANAGE = "nashir.products.manage";

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

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }
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
    const ctx = request.requestContext;
    if (!ctx) {
      sendError(
        reply,
        500,
        "INTERNAL_SERVER_ERROR",
        "Internal server error.",
        request.correlationId
      );
      return;
    }

    const decision = evaluatePermissionGuard({
      requiredPermission: PERMISSION_READ,
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
      return;
    }

    const q = request.query;

    if (q.limit === undefined || q.limit === "") {
      sendError(
        reply,
        400,
        "BAD_REQUEST",
        "limit is required.",
        request.correlationId
      );
      return;
    }

    const limitNum = Number(q.limit);
    if (!Number.isInteger(limitNum) || limitNum <= 0) {
      sendError(
        reply,
        400,
        "BAD_REQUEST",
        "limit must be a positive integer.",
        request.correlationId
      );
      return;
    }

    if (limitNum > 100) {
      sendError(
        reply,
        400,
        "BAD_REQUEST",
        "limit must not exceed 100.",
        request.correlationId
      );
      return;
    }

    if (
      q.status !== undefined &&
      !PRODUCT_STATUSES.includes(q.status as ProductStatus)
    ) {
      sendError(
        reply,
        400,
        "BAD_REQUEST",
        "status must be one of: draft, active, archived.",
        request.correlationId
      );
      return;
    }

    if (q.updatedAfter !== undefined) {
      const parsed = new Date(q.updatedAfter);
      if (isNaN(parsed.getTime())) {
        sendError(
          reply,
          400,
          "BAD_REQUEST",
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
      sendError(
        reply,
        400,
        "BAD_REQUEST",
        "sort must be one of: updatedAt:desc, updatedAt:asc.",
        request.correlationId
      );
      return;
    }

    const result = await deps.productRepository.listProducts({
      workspaceId: ctx.workspaceId,
      limit: limitNum,
      cursor: q.cursor ?? null,
      status: q.status as ProductStatus | undefined,
      updatedAfter: q.updatedAfter,
      sort: q.sort as SortDirection | undefined
    });

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
    const ctx = request.requestContext;
    if (!ctx) {
      sendError(
        reply,
        500,
        "INTERNAL_SERVER_ERROR",
        "Internal server error.",
        request.correlationId
      );
      return;
    }

    const decision = evaluatePermissionGuard({
      requiredPermission: PERMISSION_MANAGE,
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
      return;
    }

    const rawKey = request.headers["idempotency-key"];
    const idempotencyKey =
      typeof rawKey === "string"
        ? rawKey
        : Array.isArray(rawKey)
          ? rawKey[0]
          : undefined;

    if (!idempotencyKey || idempotencyKey.trim().length === 0) {
      sendError(
        reply,
        400,
        "BAD_REQUEST",
        "Idempotency-Key header is required.",
        request.correlationId
      );
      return;
    }

    const body = request.body ?? {};

    if ("workspaceId" in body || "workspace_id" in body) {
      sendError(
        reply,
        422,
        "VALIDATION_FAILED",
        "Request body must not include workspaceId or workspace_id.",
        request.correlationId
      );
      return;
    }

    if (!body.name || typeof body.name !== "string") {
      sendError(
        reply,
        422,
        "VALIDATION_FAILED",
        "name is required and must be a non-empty string.",
        request.correlationId
      );
      return;
    }

    const fingerprint = computeFingerprint({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      idempotencyKey: idempotencyKey.trim(),
      body
    });

    const expiresAt = new Date(Date.now() + 86_400_000).toISOString();

    const scope = {
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      operationName: "product.create",
      idempotencyKey: idempotencyKey.trim()
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
        input: buildCreateInput(body)
      });
    } catch (err) {
      await deps.idempotencyRepository
        .markIdempotencyRecordFailed({
          ...scope,
          responseStatusCode: 500
        })
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
    const ctx = request.requestContext;
    if (!ctx) {
      sendError(
        reply,
        500,
        "INTERNAL_SERVER_ERROR",
        "Internal server error.",
        request.correlationId
      );
      return;
    }

    const decision = evaluatePermissionGuard({
      requiredPermission: PERMISSION_READ,
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
      return;
    }

    const product = await deps.productRepository.getProductById({
      workspaceId: ctx.workspaceId,
      productId: request.params.productId
    });

    if (!product) {
      sendError(
        reply,
        404,
        "NOT_FOUND",
        "Resource not found.",
        request.correlationId
      );
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
    const ctx = request.requestContext;
    if (!ctx) {
      sendError(
        reply,
        500,
        "INTERNAL_SERVER_ERROR",
        "Internal server error.",
        request.correlationId
      );
      return;
    }

    const decision = evaluatePermissionGuard({
      requiredPermission: PERMISSION_MANAGE,
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
      return;
    }

    const ifMatch = request.headers["if-match"];
    const xResourceVersion = request.headers["x-resource-version"];

    let expectedVersion: number;

    if (ifMatch !== undefined) {
      const raw = Array.isArray(ifMatch) ? ifMatch[0] : ifMatch;
      const stripped = raw.replace(/^"(.*)"$/, "$1");
      const parsed = parseInt(stripped, 10);
      if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        sendError(
          reply,
          400,
          "BAD_REQUEST",
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
      const parsed = parseInt(raw, 10);
      if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        sendError(
          reply,
          400,
          "BAD_REQUEST",
          "X-Resource-Version must be a positive integer.",
          request.correlationId
        );
        return;
      }
      expectedVersion = parsed;
    } else {
      sendError(
        reply,
        400,
        "BAD_REQUEST",
        "If-Match or X-Resource-Version header is required.",
        request.correlationId
      );
      return;
    }

    const body = request.body ?? {};

    if ("workspaceId" in body || "workspace_id" in body) {
      sendError(
        reply,
        422,
        "VALIDATION_FAILED",
        "Request body must not include workspaceId or workspace_id.",
        request.correlationId
      );
      return;
    }

    const input = buildUpdateInput(body);

    const result = await deps.productRepository.updateProduct({
      workspaceId: ctx.workspaceId,
      productId: request.params.productId,
      input,
      expectedVersion
    });

    if (result.status === "not_found") {
      sendError(
        reply,
        404,
        "NOT_FOUND",
        "Resource not found.",
        request.correlationId
      );
      return;
    }

    if (result.status === "version_conflict") {
      sendError(
        reply,
        409,
        "CONFLICT",
        "Version conflict.",
        request.correlationId,
        { currentVersion: result.currentVersion }
      );
      return;
    }

    return { product: result.product };
  };
}
