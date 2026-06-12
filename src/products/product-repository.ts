import { randomUUID } from "node:crypto";
import type { QueryResult, QueryResultRow } from "pg";
import { mapProductRow, type ProductRow } from "./product-mapper.js";
import type {
  CreateProductInput,
  ListProductsInput,
  ListProductsResult,
  Product,
  UpdateProductInput,
  UpdateProductResult
} from "./product-types.js";

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
  return Object.keys(input).length > 0;
}

export class ProductRepository {
  constructor(private readonly db: PgQueryable) {}

  async createProduct(params: {
    workspaceId: string;
    input: CreateProductInput;
    productId?: string;
  }): Promise<Product> {
    const productId = params.productId ?? randomUUID();

    const result = await this.db.query<ProductRow>(
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

    if (params.cursor) {
      const cursor = decodeCursor(params.cursor);
      values.push(cursor.updatedAt, cursor.productId);
      whereClauses.push(
        `(updated_at, product_id) < ($${values.length - 1}::timestamptz, $${values.length})`
      );
    }

    values.push(limit + 1);

    const result = await this.db.query<ProductRow>(
      `
        SELECT *
        FROM products
        WHERE ${whereClauses.join(" AND ")}
        ORDER BY updated_at DESC, product_id DESC
        LIMIT $${values.length};
      `,
      values
    );

    const rows = result.rows.slice(0, limit);
    const products = rows.map(mapProductRow);
    const hasMore = result.rows.length > limit;
    const lastProduct = products.at(-1);

    return {
      products,
      count: products.length,
      hasMore,
      nextCursor:
        hasMore && lastProduct
          ? encodeCursor({
              updatedAt: lastProduct.updatedAt,
              productId: lastProduct.productId
            })
          : null
    };
  }

  async updateProduct(params: {
    workspaceId: string;
    productId: string;
    input: UpdateProductInput;
    expectedVersion?: number;
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

    if ("name" in params.input) {
      addSetClause("name", params.input.name);
    }

    if ("category" in params.input) {
      addSetClause("category", params.input.category ?? null);
    }

    if ("price" in params.input) {
      addSetClause("price", params.input.price ?? null);
    }

    if ("sku" in params.input) {
      addSetClause("sku", params.input.sku ?? null);
    }

    if ("stockStatus" in params.input) {
      addSetClause("stock_status", params.input.stockStatus);
    }

    if ("imageUrl" in params.input) {
      addSetClause("image_url", params.input.imageUrl ?? null);
    }

    if ("videoUrl" in params.input) {
      addSetClause("video_url", params.input.videoUrl ?? null);
    }

    if ("description" in params.input) {
      addSetClause("description", params.input.description ?? null);
    }

    if ("status" in params.input) {
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

    const result = await this.db.query<ProductRow>(
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

    const existingProduct = await this.getProductById({
      workspaceId: params.workspaceId,
      productId: params.productId
    });

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
