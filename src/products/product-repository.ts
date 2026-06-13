import { randomUUID } from "node:crypto";
import type { QueryResult, QueryResultRow } from "pg";
import { mapProductRow, type ProductRow } from "./product-mapper.js";
import type {
  CreateProductInput,
  ListProductsInput,
  ListProductsResult,
  Product,
  SortDirection,
  UpdateProductInput,
  UpdateProductResult
} from "./product-types.js";

const SORT_ORDER_MAP: Record<SortDirection, string> = {
  "updatedAt:desc": "updated_at DESC, product_id DESC",
  "updatedAt:asc": "updated_at ASC, product_id ASC"
};

export interface PgQueryable {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[]
  ): Promise<QueryResult<T>>;
}

interface ProductListCursor {
  updatedAt: string;
  productId: string;
}

interface ProductListRow extends ProductRow {
  cursor_updated_at: string;
}

function encodeCursor(cursor: ProductListCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeCursor(cursor: string): ProductListCursor {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8")
    );

    if (
      typeof parsed?.updatedAt !== "string" ||
      typeof parsed?.productId !== "string"
    ) {
      throw new Error("Invalid product list cursor payload");
    }

    return {
      updatedAt: parsed.updatedAt,
      productId: parsed.productId
    };
  } catch {
    throw new Error("Invalid product list cursor");
  }
}

function normalizeLimit(limit: number): number {
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error("Product list limit must be a positive integer");
  }

  return Math.min(limit, 100);
}

function hasUpdateFields(input: UpdateProductInput): boolean {
  return Object.values(input).some((value) => value !== undefined);
}

export class ProductRepository {
  constructor(private readonly db: PgQueryable) {}

  async createProduct(params: {
    workspaceId: string;
    input: CreateProductInput;
    productId?: string;
    db?: PgQueryable;
  }): Promise<Product> {
    const productId = params.productId ?? randomUUID();
    const db = params.db ?? this.db;

    const result = await db.query<ProductRow>(
      `
        INSERT INTO products (
          product_id,
          workspace_id,
          name,
          category,
          price,
          sku,
          stock_status,
          image_url,
          video_url,
          description,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
      `,
      [
        productId,
        params.workspaceId,
        params.input.name,
        params.input.category ?? null,
        params.input.price ?? null,
        params.input.sku ?? null,
        params.input.stockStatus ?? "unknown",
        params.input.imageUrl ?? null,
        params.input.videoUrl ?? null,
        params.input.description ?? null,
        params.input.status ?? "draft"
      ]
    );

    return mapProductRow(result.rows[0]);
  }

  async getProductById(params: {
    workspaceId: string;
    productId: string;
  }): Promise<Product | null> {
    const result = await this.db.query<ProductRow>(
      `
        SELECT *
        FROM products
        WHERE workspace_id = $1
          AND product_id = $2;
      `,
      [params.workspaceId, params.productId]
    );

    const row = result.rows[0];

    return row ? mapProductRow(row) : null;
  }

  async listProducts(params: ListProductsInput): Promise<ListProductsResult> {
    const limit = normalizeLimit(params.limit);
    const values: unknown[] = [params.workspaceId];
    const whereClauses = ["workspace_id = $1"];

    if (params.status) {
      values.push(params.status);
      whereClauses.push(`status = $${values.length}`);
    }

    if (params.updatedAfter) {
      values.push(params.updatedAfter);
      whereClauses.push(`updated_at > $${values.length}::timestamptz`);
    }

    const sortDirection = params.sort ?? "updatedAt:desc";
    const sortOrder = SORT_ORDER_MAP[sortDirection];

    if (params.cursor) {
      const cursor = decodeCursor(params.cursor);
      values.push(cursor.updatedAt, cursor.productId);
      const comparisonOp = sortDirection === "updatedAt:asc" ? ">" : "<";
      whereClauses.push(
        `(updated_at, product_id) ${comparisonOp} ($${values.length - 1}::timestamptz, $${values.length})`
      );
    }

    values.push(limit + 1);

    const result = await this.db.query<ProductListRow>(
      `
        SELECT *, updated_at::text AS cursor_updated_at
        FROM products
        WHERE ${whereClauses.join(" AND ")}
        ORDER BY ${sortOrder}
        LIMIT $${values.length};
      `,
      values
    );

    const rows = result.rows.slice(0, limit);
    const products = rows.map(mapProductRow);
    const hasMore = result.rows.length > limit;
    const lastRow = rows.at(-1);

    return {
      products,
      count: products.length,
      hasMore,
      nextCursor:
        hasMore && lastRow
          ? encodeCursor({
              updatedAt: lastRow.cursor_updated_at,
              productId: lastRow.product_id
            })
          : null
    };
  }

  async updateProduct(params: {
    workspaceId: string;
    productId: string;
    input: UpdateProductInput;
    expectedVersion?: number;
    db?: PgQueryable;
  }): Promise<UpdateProductResult> {
    if (!hasUpdateFields(params.input)) {
      throw new Error("At least one product field is required for update");
    }

    const values: unknown[] = [];
    const setClauses: string[] = [];

    const addSetClause = (column: string, value: unknown) => {
      values.push(value);
      setClauses.push(`${column} = $${values.length}`);
    };

    if (params.input.name !== undefined) {
      addSetClause("name", params.input.name);
    }

    if (params.input.category !== undefined) {
      addSetClause("category", params.input.category);
    }

    if (params.input.price !== undefined) {
      addSetClause("price", params.input.price);
    }

    if (params.input.sku !== undefined) {
      addSetClause("sku", params.input.sku);
    }

    if (params.input.stockStatus !== undefined) {
      addSetClause("stock_status", params.input.stockStatus);
    }

    if (params.input.imageUrl !== undefined) {
      addSetClause("image_url", params.input.imageUrl);
    }

    if (params.input.videoUrl !== undefined) {
      addSetClause("video_url", params.input.videoUrl);
    }

    if (params.input.description !== undefined) {
      addSetClause("description", params.input.description);
    }

    if (params.input.status !== undefined) {
      addSetClause("status", params.input.status);
    }

    values.push(params.workspaceId);
    const workspaceIdParameter = values.length;

    values.push(params.productId);
    const productIdParameter = values.length;

    let versionPredicate = "";
    if (params.expectedVersion !== undefined) {
      values.push(params.expectedVersion);
      versionPredicate = `AND version = $${values.length}`;
    }

    const db = params.db ?? this.db;
    const result = await db.query<ProductRow>(
      `
        UPDATE products
        SET
          ${setClauses.join(", ")},
          version = version + 1
        WHERE workspace_id = $${workspaceIdParameter}
          AND product_id = $${productIdParameter}
          ${versionPredicate}
        RETURNING *;
      `,
      values
    );

    const updatedRow = result.rows[0];

    if (updatedRow) {
      return {
        status: "updated",
        product: mapProductRow(updatedRow)
      };
    }

    const existingResult = await db.query<ProductRow>(
      `
        SELECT *
        FROM products
        WHERE workspace_id = $1
          AND product_id = $2;
      `,
      [params.workspaceId, params.productId]
    );
    const existingRow = existingResult.rows[0];
    const existingProduct = existingRow ? mapProductRow(existingRow) : null;

    if (!existingProduct) {
      return {
        status: "not_found"
      };
    }

    return {
      status: "version_conflict",
      currentVersion: existingProduct.version
    };
  }
}
