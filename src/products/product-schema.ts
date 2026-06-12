import type { Product } from "./product-types.js";

export interface ProductResponse {
  product: Product;
}

export interface ProductListResponse {
  products: Product[];
  count: number;
  hasMore: boolean;
  nextCursor: string | null;
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
