import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import type { IdempotencyRepository } from "../idempotency/idempotency-repository.js";
import type { ProductRepository } from "./product-repository.js";
import {
  createCreateProductHandler,
  createGetProductHandler,
  createListProductsHandler,
  createUpdateProductHandler
} from "./product-handlers.js";
import type {
  ListProductsQuerystring,
  ProductItemRouteParams,
  ProductRouteParams
} from "./product-schema.js";

const PRODUCTS_ROUTE = "/workspaces/:workspaceId/products";
const PRODUCT_ITEM_ROUTE = "/workspaces/:workspaceId/products/:productId";

export interface ProductPluginOptions {
  productRepository: ProductRepository;
  idempotencyRepository: IdempotencyRepository;
  workspaceContextGuardHook?:
    | ((request: FastifyRequest, reply: FastifyReply) => Promise<void>)
    | null;
}

export const productPlugin: FastifyPluginAsync<ProductPluginOptions> =
  async function productPlugin(
    fastify: FastifyInstance,
    opts: ProductPluginOptions
  ): Promise<void> {
    const { productRepository, idempotencyRepository, workspaceContextGuardHook } =
      opts;

    const preHandler = workspaceContextGuardHook
      ? [workspaceContextGuardHook]
      : [];

    const routeOpts = preHandler.length > 0 ? { preHandler } : {};

    fastify.get<{
      Params: ProductRouteParams;
      Querystring: ListProductsQuerystring;
    }>(PRODUCTS_ROUTE, routeOpts, createListProductsHandler({ productRepository }));

    fastify.post<{
      Params: ProductRouteParams;
      Body: Record<string, unknown>;
    }>(
      PRODUCTS_ROUTE,
      routeOpts,
      createCreateProductHandler({ productRepository, idempotencyRepository })
    );

    fastify.get<{ Params: ProductItemRouteParams }>(
      PRODUCT_ITEM_ROUTE,
      routeOpts,
      createGetProductHandler({ productRepository })
    );

    fastify.put<{
      Params: ProductItemRouteParams;
      Body: Record<string, unknown>;
    }>(
      PRODUCT_ITEM_ROUTE,
      routeOpts,
      createUpdateProductHandler({ productRepository })
    );
  };
