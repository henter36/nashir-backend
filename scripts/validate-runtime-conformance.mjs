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
const SUPPORTED_LOCAL_REF_PREFIXES = [
  "#/components/schemas/",
  "#/components/responses/",
  "#/paths/"
];

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

function decodeJsonPointerSegment(segment) {
  return segment.replaceAll("~1", "/").replaceAll("~0", "~");
}

function createLocalRefResolver(openapi) {
  return function resolveLocalRef(ref, label) {
    if (typeof ref !== "string") {
      fail(`${label} $ref is not a string`);
      return undefined;
    }

    if (!ref.startsWith("#/")) {
      fail(`${label} external $ref is not supported in Phase 1: ${ref}`);
      return undefined;
    }

    if (
      !SUPPORTED_LOCAL_REF_PREFIXES.some((prefix) => ref.startsWith(prefix))
    ) {
      fail(`${label} local $ref is outside the Phase 1 resolver scope: ${ref}`);
      return undefined;
    }

    let current = openapi;
    for (const segment of ref
      .slice(2)
      .split("/")
      .map(decodeJsonPointerSegment)) {
      if (!isRecord(current) && !Array.isArray(current)) {
        fail(`${label} $ref could not be resolved: ${ref}`);
        return undefined;
      }
      current = current[segment];
    }

    if (current === undefined) {
      fail(`${label} $ref could not be resolved: ${ref}`);
    }
    return current;
  };
}

function dereference(value, resolveLocalRef, label, seenRefs, seenObjects) {
  if (!isRecord(value)) return value;

  if (seenObjects.has(value)) {
    fail(`${label} contains a circular schema object reference`);
    return undefined;
  }
  seenObjects.add(value);

  if (typeof value.$ref !== "string") return value;

  if (seenRefs.has(value.$ref)) {
    fail(`${label} contains a circular $ref: ${value.$ref}`);
    return undefined;
  }

  seenRefs.add(value.$ref);
  const resolved = resolveLocalRef(value.$ref, label);
  if (resolved === undefined) return undefined;

  return dereference(
    resolved,
    resolveLocalRef,
    `${label} ${value.$ref}`,
    seenRefs,
    seenObjects
  );
}

function resolveSchema(value, resolveLocalRef, label) {
  return dereference(value, resolveLocalRef, label, new Set(), new Set());
}

function asResolvedRecord(value, resolveLocalRef, label) {
  return asRecord(resolveSchema(value, resolveLocalRef, label), label);
}

function hasRequiredField(schema, resolveLocalRef, label, field) {
  const resolved = resolveSchema(schema, resolveLocalRef, label);
  return (
    isRecord(resolved) &&
    Array.isArray(resolved.required) &&
    resolved.required.includes(field)
  );
}

function declaresType(schema, resolveLocalRef, label, expectedType) {
  const resolved = resolveSchema(schema, resolveLocalRef, label);
  if (!isRecord(resolved)) return false;

  if (resolved.type === expectedType) return true;
  return Array.isArray(resolved.type) && resolved.type.includes(expectedType);
}

function supportsNull(
  schema,
  resolveLocalRef,
  label,
  seenRefs = new Set(),
  seenObjects = new Set()
) {
  if (!isRecord(schema)) return false;

  const resolved = dereference(
    schema,
    resolveLocalRef,
    label,
    seenRefs,
    seenObjects
  );
  if (!isRecord(resolved)) return false;

  if (resolved.nullable === true) return true;
  if (declaresType(resolved, resolveLocalRef, label, "null")) return true;

  for (const compositionKey of ["anyOf", "oneOf", "allOf"]) {
    const variants = resolved[compositionKey];
    if (
      Array.isArray(variants) &&
      variants.some((variant, index) =>
        supportsNull(
          variant,
          resolveLocalRef,
          `${label}.${compositionKey}[${index}]`,
          new Set(seenRefs),
          new Set(seenObjects)
        )
      )
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

function checkRequiredFields(schema, schemaName, fields, resolveLocalRef) {
  for (const field of fields) {
    if (hasRequiredField(schema, resolveLocalRef, schemaName, field)) {
      pass(`${schemaName} requires ${field}`);
    } else {
      fail(`${schemaName} does not require ${field}`);
    }
  }
}

function checkHealthSchema(schemas, resolveLocalRef) {
  const healthSchema = asResolvedRecord(
    schemas.HealthResponse,
    resolveLocalRef,
    "HealthResponse schema"
  );
  if (!healthSchema) return;
  pass("HealthResponse schema exists");

  const data = asResolvedRecord(
    healthSchema.properties?.data,
    resolveLocalRef,
    "HealthResponse.data property"
  );
  if (!data) return;

  for (const field of REQUIRED_HEALTH_DATA_FIELDS) {
    if (
      hasRequiredField(
        data,
        resolveLocalRef,
        "HealthResponse.data property",
        field
      )
    ) {
      pass(`HealthResponse.data requires ${field}`);
    } else {
      fail(`HealthResponse.data does not require ${field}`);
    }
  }
}

function checkErrorSchemas(schemas, responses, resolveLocalRef) {
  const errorModel = asResolvedRecord(
    schemas.ErrorModel,
    resolveLocalRef,
    "ErrorModel schema"
  );
  if (errorModel) {
    pass("ErrorModel schema exists");
    checkRequiredFields(
      errorModel,
      "ErrorModel",
      REQUIRED_ERROR_MODEL_FIELDS,
      resolveLocalRef
    );
  }

  const errorCode = asResolvedRecord(
    schemas.ErrorCode,
    resolveLocalRef,
    "ErrorCode schema"
  );
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

  const defaultError = asResolvedRecord(
    responses.DefaultError,
    resolveLocalRef,
    "DefaultError response"
  );
  const defaultErrorRef =
    defaultError?.content?.["application/json"]?.schema?.$ref;
  if (defaultErrorRef === "#/components/schemas/ErrorModel") {
    pass("DefaultError response references ErrorModel");
  } else {
    fail("DefaultError response does not reference ErrorModel");
  }
}

function checkProductSchema(schemas, resolveLocalRef) {
  const product = asResolvedRecord(
    schemas.Product,
    resolveLocalRef,
    "Product schema"
  );
  if (!product) return;
  pass("Product schema exists");

  const version = asResolvedRecord(
    product.properties?.version,
    resolveLocalRef,
    "Product.version property"
  );
  if (!version) return;

  if (
    declaresType(version, resolveLocalRef, "Product.version property", "string")
  ) {
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

function checkRequestNullability(schemas, schemaName, resolveLocalRef) {
  const schema = asResolvedRecord(
    schemas[schemaName],
    resolveLocalRef,
    `${schemaName} schema`
  );
  if (!schema) return;
  pass(`${schemaName} schema exists`);

  for (const field of NULLABLE_PRODUCT_REQUEST_FIELDS) {
    const property = asResolvedRecord(
      schema.properties?.[field],
      resolveLocalRef,
      `${schemaName}.${field} property`
    );
    if (!property) continue;

    if (supportsNull(property, resolveLocalRef, `${schemaName}.${field}`)) {
      pass(`${schemaName}.${field} allows null`);
    } else {
      fail(`${schemaName}.${field} does not allow null`);
    }
  }
}

function checkImplementedProductPaths(openapi, resolveLocalRef) {
  const paths = asRecord(openapi.paths, "OpenAPI paths");
  if (!paths) return;

  if (
    asResolvedRecord(paths["/health"], resolveLocalRef, "OpenAPI path /health")
  ) {
    pass("OpenAPI path exists: /health");
  } else {
    fail("OpenAPI path is missing: /health");
  }

  for (const [method, path] of IMPLEMENTED_PUBLIC_PRODUCT_ROUTES) {
    const pathItem = asResolvedRecord(
      paths[path],
      resolveLocalRef,
      `OpenAPI path ${path}`
    );
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
    const resolveLocalRef = createLocalRefResolver(openapi);
    const schemas = getSchemas(openapi);
    const responses = getResponses(openapi);

    checkImplementedProductPaths(openapi, resolveLocalRef);

    if (schemas && responses) {
      checkHealthSchema(schemas, resolveLocalRef);
      checkErrorSchemas(schemas, responses, resolveLocalRef);
      checkProductSchema(schemas, resolveLocalRef);
      checkRequestNullability(schemas, "CreateProductRequest", resolveLocalRef);
      checkRequestNullability(schemas, "UpdateProductRequest", resolveLocalRef);
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
