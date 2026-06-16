import console from "node:console";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import yaml from "js-yaml";

import { buildApp } from "../src/app.ts";
import { toPublicProduct } from "../src/products/product-schema.ts";
import {
  ACTOR_ID_HEADER,
  WORKSPACE_ID_HEADER
} from "../src/request-context.ts";

const OPENAPI_RELATIVE_PATH = "docs/nashir_v1_openapi.yaml";
const REQUIRED_HEALTH_DATA_FIELDS = ["service", "status", "version"];
const REQUIRED_ERROR_MODEL_FIELDS = [
  "errorCode",
  "message",
  "requestId",
  "retryable",
  "status"
];
const REQUIRED_ERROR_CODES = [
  "internal.error",
  "service.unavailable",
  "unknown.error",
  "resource.not_found",
  "validation.failed",
  "permission.denied",
  "conflict.version_mismatch",
  "idempotency.conflict"
];
const NULLABLE_PRODUCT_REQUEST_FIELDS = [
  "category",
  "price",
  "sku",
  "imageUrl",
  "videoUrl",
  "description"
];
const IMPLEMENTED_PUBLIC_PRODUCT_ROUTES = [
  ["get", "/workspaces/{workspaceId}/products"],
  ["post", "/workspaces/{workspaceId}/products"],
  ["get", "/workspaces/{workspaceId}/products/{productId}"],
  ["put", "/workspaces/{workspaceId}/products/{productId}"]
];

const backendRepo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  failures.push(message);
  console.error(`FAIL: ${message}`);
}

function parseArguments(argv) {
  let authorityRepo = process.env.NASHIR_AUTHORITY_REPO ?? null;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--") {
      continue;
    }

    if (argument !== "--authority-repo") {
      throw new Error(`Unknown argument: ${argument}`);
    }

    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error("--authority-repo requires a path value");
    }

    authorityRepo = value;
    index += 1;
  }

  if (!authorityRepo) {
    throw new Error(
      "Authority repository path is required via --authority-repo or NASHIR_AUTHORITY_REPO"
    );
  }

  return { authorityRepo };
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value, label) {
  if (isRecord(value)) return value;
  fail(`${label} is missing or not an object`);
  return null;
}

function hasRequiredField(schema, field) {
  return Array.isArray(schema.required) && schema.required.includes(field);
}

function declaresType(schema, expectedType) {
  if (schema.type === expectedType) return true;
  return Array.isArray(schema.type) && schema.type.includes(expectedType);
}

function supportsNull(schema, seen = new Set()) {
  if (!isRecord(schema) || seen.has(schema)) return false;
  seen.add(schema);

  if (schema.nullable === true) return true;
  if (declaresType(schema, "null")) return true;

  for (const compositionKey of ["anyOf", "oneOf", "allOf"]) {
    const variants = schema[compositionKey];
    if (
      Array.isArray(variants) &&
      variants.some((variant) => supportsNull(variant, seen))
    ) {
      return true;
    }
  }

  return false;
}

function getSchemas(openapi) {
  return asRecord(openapi.components?.schemas, "OpenAPI components.schemas");
}

function getResponses(openapi) {
  return asRecord(
    openapi.components?.responses,
    "OpenAPI components.responses"
  );
}

function checkRequiredFields(schema, schemaName, fields) {
  for (const field of fields) {
    if (hasRequiredField(schema, field)) {
      pass(`${schemaName} requires ${field}`);
    } else {
      fail(`${schemaName} does not require ${field}`);
    }
  }
}

function checkHealthSchema(schemas) {
  const healthSchema = asRecord(
    schemas.HealthResponse,
    "HealthResponse schema"
  );
  if (!healthSchema) return;
  pass("HealthResponse schema exists");

  const data = asRecord(
    healthSchema.properties?.data,
    "HealthResponse.data property"
  );
  if (!data) return;

  for (const field of REQUIRED_HEALTH_DATA_FIELDS) {
    if (hasRequiredField(data, field)) {
      pass(`HealthResponse.data requires ${field}`);
    } else {
      fail(`HealthResponse.data does not require ${field}`);
    }
  }
}

function checkErrorSchemas(schemas, responses) {
  const errorModel = asRecord(schemas.ErrorModel, "ErrorModel schema");
  if (errorModel) {
    pass("ErrorModel schema exists");
    checkRequiredFields(errorModel, "ErrorModel", REQUIRED_ERROR_MODEL_FIELDS);
  }

  const errorCode = asRecord(schemas.ErrorCode, "ErrorCode schema");
  if (errorCode) {
    pass("ErrorCode schema exists");
    const enumValues = new Set(
      Array.isArray(errorCode.enum) ? errorCode.enum : []
    );
    for (const value of REQUIRED_ERROR_CODES) {
      if (enumValues.has(value)) {
        pass(`ErrorCode enum contains ${value}`);
      } else {
        fail(`ErrorCode enum is missing ${value}`);
      }
    }
  }

  const defaultErrorRef =
    responses.DefaultError?.content?.["application/json"]?.schema?.$ref;
  if (defaultErrorRef === "#/components/schemas/ErrorModel") {
    pass("DefaultError response references ErrorModel");
  } else {
    fail("DefaultError response does not reference ErrorModel");
  }
}

function checkProductSchema(schemas) {
  const product = asRecord(schemas.Product, "Product schema");
  if (!product) return;
  pass("Product schema exists");

  const version = asRecord(
    product.properties?.version,
    "Product.version property"
  );
  if (!version) return;

  if (declaresType(version, "string")) {
    pass("Product.version is string in OpenAPI");
  } else {
    fail("Product.version is not string in OpenAPI");
  }

  const productResponseRef = schemas.ProductResponse?.properties?.product?.$ref;
  if (productResponseRef === "#/components/schemas/Product") {
    pass("ProductResponse.product references Product");
  } else {
    fail("ProductResponse.product does not reference Product");
  }
}

function checkRequestNullability(schemas, schemaName) {
  const schema = asRecord(schemas[schemaName], `${schemaName} schema`);
  if (!schema) return;
  pass(`${schemaName} schema exists`);

  for (const field of NULLABLE_PRODUCT_REQUEST_FIELDS) {
    const property = asRecord(
      schema.properties?.[field],
      `${schemaName}.${field} property`
    );
    if (!property) continue;

    if (supportsNull(property)) {
      pass(`${schemaName}.${field} allows null`);
    } else {
      fail(`${schemaName}.${field} does not allow null`);
    }
  }
}

function checkImplementedProductPaths(openapi) {
  const paths = asRecord(openapi.paths, "OpenAPI paths");
  if (!paths) return;

  if (paths["/health"]) {
    pass("OpenAPI path exists: /health");
  } else {
    fail("OpenAPI path is missing: /health");
  }

  for (const [method, path] of IMPLEMENTED_PUBLIC_PRODUCT_ROUTES) {
    const pathItem = asRecord(paths[path], `OpenAPI path ${path}`);
    if (!pathItem) continue;
    pass(`OpenAPI path exists: ${path}`);

    if (isRecord(pathItem[method])) {
      pass(`OpenAPI operation exists: ${method.toUpperCase()} ${path}`);
    } else {
      fail(`OpenAPI operation is missing: ${method.toUpperCase()} ${path}`);
    }
  }
}

function assertObject(value, label) {
  if (isRecord(value)) return value;
  fail(`${label} is not an object`);
  return null;
}

function parseJsonResponse(response, label) {
  try {
    return response.json();
  } catch {
    fail(`${label} response payload is not valid JSON`);
    return null;
  }
}

function checkRuntimeHealthShape(body) {
  const root = assertObject(body, "/health body");
  if (!root) return;

  const data = assertObject(root.data, "/health body.data");
  if (!data) return;

  for (const field of REQUIRED_HEALTH_DATA_FIELDS) {
    if (typeof data[field] === "string") {
      pass(`/health data.${field} is present as string`);
    } else {
      fail(`/health data.${field} is missing or not string`);
    }
  }
}

function checkRuntimeErrorShape(body) {
  const root = assertObject(body, "error body");
  if (!root) return;

  const expectedTypes = {
    errorCode: "string",
    message: "string",
    requestId: "string",
    retryable: "boolean",
    status: "number"
  };

  for (const [field, expectedType] of Object.entries(expectedTypes)) {
    if (typeof root[field] === expectedType) {
      pass(`error body.${field} is present as ${expectedType}`);
    } else {
      fail(`error body.${field} is missing or not ${expectedType}`);
    }
  }
}

function checkRuntimeProductDtoShape() {
  const publicProduct = toPublicProduct({
    productId: "product-1",
    workspaceId: "workspace-1",
    name: "Phase 1 Product",
    category: null,
    price: null,
    sku: null,
    stockStatus: "unknown",
    imageUrl: null,
    videoUrl: null,
    description: null,
    status: "draft",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    version: 7
  });

  const requiredFields = [
    "productId",
    "workspaceId",
    "name",
    "category",
    "price",
    "sku",
    "stockStatus",
    "imageUrl",
    "videoUrl",
    "description",
    "status",
    "createdAt",
    "updatedAt",
    "version"
  ];

  for (const field of requiredFields) {
    if (Object.hasOwn(publicProduct, field)) {
      pass(`public Product DTO includes ${field}`);
    } else {
      fail(`public Product DTO is missing ${field}`);
    }
  }

  if (typeof publicProduct.version === "string") {
    pass("public Product DTO version is string at runtime");
  } else {
    fail("public Product DTO version is not string at runtime");
  }
}

async function checkRuntimeResponses() {
  const app = buildApp({ logger: false });

  try {
    const healthResponse = await app.inject({
      method: "GET",
      url: "/health"
    });
    if (healthResponse.statusCode === 200) {
      pass("/health returns HTTP 200");
      const body = parseJsonResponse(healthResponse, "/health");
      if (body) checkRuntimeHealthShape(body);
    } else {
      fail(`/health returned HTTP ${healthResponse.statusCode}; expected 200`);
    }

    const errorResponse = await app.inject({
      method: "GET",
      url: "/__runtime_conformance_missing_route__",
      headers: {
        [WORKSPACE_ID_HEADER]: "runtime-conformance-workspace",
        [ACTOR_ID_HEADER]: "runtime-conformance-actor"
      }
    });
    if (errorResponse.statusCode === 404) {
      pass("safe missing route returns HTTP 404");
      const body = parseJsonResponse(errorResponse, "safe missing route");
      if (body) checkRuntimeErrorShape(body);
    } else {
      fail(
        `safe missing route returned HTTP ${errorResponse.statusCode}; expected 404`
      );
    }
  } finally {
    await app.close();
  }
}

function loadOpenApi(authorityRepo) {
  const openApiPath = resolve(authorityRepo, OPENAPI_RELATIVE_PATH);

  if (!existsSync(authorityRepo) || !statSync(authorityRepo).isDirectory()) {
    fail(
      `Authority repository path is not a local directory: ${authorityRepo}`
    );
    return null;
  }

  if (!existsSync(openApiPath) || !statSync(openApiPath).isFile()) {
    fail(`OpenAPI file is missing: ${openApiPath}`);
    return null;
  }

  pass(`OpenAPI file found: ${openApiPath}`);
  const parsed = yaml.load(readFileSync(openApiPath, "utf8"));
  return asRecord(parsed, "OpenAPI document");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const authorityRepo = resolve(backendRepo, options.authorityRepo);
  const openapi = loadOpenApi(authorityRepo);

  if (openapi) {
    const schemas = getSchemas(openapi);
    const responses = getResponses(openapi);

    checkImplementedProductPaths(openapi);

    if (schemas && responses) {
      checkHealthSchema(schemas);
      checkErrorSchemas(schemas, responses);
      checkProductSchema(schemas);
      checkRequestNullability(schemas, "CreateProductRequest");
      checkRequestNullability(schemas, "UpdateProductRequest");
    }
  }

  checkRuntimeProductDtoShape();
  await checkRuntimeResponses();

  if (failures.length > 0) {
    console.error(
      `FAIL: Runtime conformance validation failed with ${failures.length} error(s).`
    );
    process.exitCode = 1;
    return;
  }

  console.log("PASS: Runtime conformance validation completed successfully.");
}

try {
  await main();
} catch (error) {
  fail(
    `Unexpected error during validation: ${
      error instanceof Error ? error.message : String(error)
    }`
  );
  process.exitCode = 1;
}
