import type { Product, ProductStatus, StockStatus } from "./product-types.js";

export interface ProductRow {
  product_id: string;
  workspace_id: string;
  name: string;
  category: string | null;
  price: string | number | null;
  sku: string | null;
  stock_status: StockStatus;
  image_url: string | null;
  video_url: string | null;
  description: string | null;
  status: ProductStatus;
  created_at: Date | string;
  updated_at: Date | string;
  version: number;
}

function toIsoString(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function toNullableNumber(value: string | number | null): number | null {
  if (value === null) {
    return null;
  }

  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue)) {
    throw new TypeError("Invalid numeric product price returned from database");
  }

  return numericValue;
}

export function mapProductRow(row: ProductRow): Product {
  return {
    productId: row.product_id,
    workspaceId: row.workspace_id,
    name: row.name,
    category: row.category,
    price: toNullableNumber(row.price),
    sku: row.sku,
    stockStatus: row.stock_status,
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    description: row.description,
    status: row.status,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    version: row.version
  };
}
