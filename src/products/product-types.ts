export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const SORT_DIRECTIONS = ["updatedAt:desc", "updatedAt:asc"] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const STOCK_STATUSES = [
  "available",
  "limited",
  "out_of_stock",
  "unknown"
] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export interface Product {
  productId: string;
  workspaceId: string;
  name: string;
  category: string | null;
  price: number | null;
  sku: string | null;
  stockStatus: StockStatus;
  imageUrl: string | null;
  videoUrl: string | null;
  description: string | null;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateProductInput {
  name: string;
  category?: string | null;
  price?: number | null;
  sku?: string | null;
  stockStatus?: StockStatus;
  imageUrl?: string | null;
  videoUrl?: string | null;
  description?: string | null;
  status?: ProductStatus;
}

export interface UpdateProductInput {
  name?: string;
  category?: string | null;
  price?: number | null;
  sku?: string | null;
  stockStatus?: StockStatus;
  imageUrl?: string | null;
  videoUrl?: string | null;
  description?: string | null;
  status?: ProductStatus;
}

export interface ListProductsInput {
  workspaceId: string;
  limit: number;
  cursor?: string | null;
  status?: ProductStatus;
  updatedAfter?: string;
  sort?: SortDirection;
}

export interface ListProductsResult {
  products: Product[];
  count: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export type UpdateProductResult =
  | {
      status: "updated";
      product: Product;
    }
  | {
      status: "not_found";
    }
  | {
      status: "version_conflict";
      currentVersion: number;
    };
