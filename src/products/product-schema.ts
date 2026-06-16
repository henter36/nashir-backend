import type { Product } from "./product-types.js";

export type PublicProduct = Omit<Product, "version"> & {
  version: string;
};

export interface ProductResponse {
  product: PublicProduct;
}

export interface ProductListResponse {
  products: PublicProduct[];
  count: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export function toPublicProduct(product: Product): PublicProduct {
  return {
    ...product,
    version: String(product.version)
  };
}

export interface ProductRouteParams {
  workspaceId: string;
}

export interface ProductItemRouteParams {
  workspaceId: string;
  productId: string;
}

export interface ListProductsQuerystring {
  limit?: string;
  cursor?: string;
  status?: string;
  updatedAfter?: string;
  sort?: string;
}
