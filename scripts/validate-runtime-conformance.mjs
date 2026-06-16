import console from "node:console";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

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
  {
    method: "get",
    path: "/workspaces/{workspaceId}/products"
  },
  {
    method: "post",
    path: "/workspaces/{workspaceId}/products"
  },
  {
    method: "get",
    path: "/workspaces/{workspaceId}/products/{productId}"
  },
  {
    method: "put",
    path: "/workspaces/{workspaceId}/products/{productId}"
  }
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

function countIndent(line) {
  return line.match(/^ */)?.[0].length ?? 0;
}

function extractBlock(lines, key, indent) {
  const start = lines.findIndex(
    (line) => line === `${" ".repeat(indent)}${key}:`
  );
  if (start === -1) return null;

  const block = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim().length === 0) {
      block.push(line);
      continue;
    }

    if (countIndent(line) <= indent) break;
    block.push(line);
  }

  return block;
}

function blockHasKey(block, key, indent) {
  return block.some((line) => line === `${" ".repeat(indent)}${key}:`);
}

function extractListValues(block) {
  return block
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).replace(/^"|"$/g, ""));
}

function blockDeclaresType(block, expectedType) {
  const inlineType = block.find(
    (line) => line.trim() === `type: ${expectedType}`
  );
  if (inlineType) return true;

  return extractListValues(block).includes(expectedType);
}

function findPropertyBlock(schemaBlock, propertyName) {
  const propertiesBlock = extractBlock(schemaBlock, "properties", 6);
  if (!propertiesBlock) return null;

  return extractBlock(propertiesBlock, propertyName, 8);
}

function checkSchemaRequiredFields(schemaBlock, schemaName, fields) {
  const requiredBlock = extractBlock(schemaBlock, "required", 6);
  if (!requiredBlock) {
    fail(`${schemaName} schema is missing required list`);
    return;
  }

  const required = new Set(extractListValues(requiredBlock));
  for (const field of fields) {
    if (required.has(field)) {
      pass(`${schemaName} requires ${field}`);
    } else {
      fail(`${schemaName} does not require ${field}`);
    }
  }
}

function checkHealthSchema(schemasBlock) {
  const healthSchema = extractBlock(schemasBlock, "HealthResponse", 4);
  if (!healthSchema) {
    fail("HealthResponse schema is missing");
    return;
  }

  pass("HealthResponse schema exists");
  const dataBlock = findPropertyBlock(healthSchema, "data");
  if (!dataBlock) {
    fail("HealthResponse.data property is missing");
    return;
  }

  const dataRequiredBlock = extractBlock(dataBlock, "required", 10);
  if (!dataRequiredBlock) {
    fail("HealthResponse.data required list is missing");
    return;
  }

  const dataRequired = new Set(extractListValues(dataRequiredBlock));
  for (const field of REQUIRED_HEALTH_DATA_FIELDS) {
    if (dataRequired.has(field)) {
      pass(`HealthResponse.data requires ${field}`);
    } else {
      fail(`HealthResponse.data does not require ${field}`);
    }
  }
}

function checkErrorSchemas(schemasBlock) {
  const errorModel = extractBlock(schemasBlock, "ErrorModel", 4);
  if (!errorModel) {
    fail("ErrorModel schema is missing");
  } else {
    pass("ErrorModel schema exists");
    checkSchemaRequiredFields(
      errorModel,
      "ErrorModel",
      REQUIRED_ERROR_MODEL_FIELDS
    );
  }

  const errorCode = extractBlock(schemasBlock, "ErrorCode", 4);
  if (!errorCode) {
    fail("ErrorCode schema is missing");
    return;
  }

  pass("ErrorCode schema exists");
  const enumBlock = extractBlock(errorCode, "enum", 6);
  if (!enumBlock) {
    fail("ErrorCode enum is missing");
    return;
  }

  const enumValues = new Set(extractListValues(enumBlock));
  for (const value of REQUIRED_ERROR_CODES) {
    if (enumValues.has(value)) {
      pass(`ErrorCode enum contains ${value}`);
    } else {
      fail(`ErrorCode enum is missing ${value}`);
    }
  }
}

function checkProductSchema(schemasBlock) {
  const product = extractBlock(schemasBlock, "Product", 4);
  if (!product) {
    fail("Product schema is missing");
    return;
  }

  pass("Product schema exists");
  const versionBlock = findPropertyBlock(product, "version");
  if (!versionBlock) {
    fail("Product.version property is missing");
    return;
  }

  if (blockDeclaresType(versionBlock, "string")) {
    pass("Product.version is string in OpenAPI");
  } else {
    fail("Product.version is not string in OpenAPI");
  }
}

function checkRequestNullability(schemasBlock, schemaName) {
  const schema = extractBlock(schemasBlock, schemaName, 4);
  if (!schema) {
    fail(`${schemaName} schema is missing`);
    return;
  }

  pass(`${schemaName} schema exists`);
  for (const field of NULLABLE_PRODUCT_REQUEST_FIELDS) {
    const propertyBlock = findPropertyBlock(schema, field);
    if (!propertyBlock) {
      fail(`${schemaName}.${field} property is missing`);
      continue;
    }

    if (blockDeclaresType(propertyBlock, "null")) {
      pass(`${schemaName}.${field} allows null`);
    } else {
      fail(`${schemaName}.${field} does not allow null`);
    }
  }
}

function checkImplementedProductPaths(pathsBlock) {
  for (const route of IMPLEMENTED_PUBLIC_PRODUCT_ROUTES) {
    const pathBlock = extractBlock(pathsBlock, route.path, 2);
    if (!pathBlock) {
      fail(`OpenAPI path is missing: ${route.path}`);
      continue;
    }

    pass(`OpenAPI path exists: ${route.path}`);
    if (blockHasKey(pathBlock, route.method, 4)) {
      pass(
        `OpenAPI operation exists: ${route.method.toUpperCase()} ${route.path}`
      );
    } else {
      fail(
        `OpenAPI operation is missing: ${route.method.toUpperCase()} ${route.path}`
      );
    }
  }
}

function assertObject(value, label) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(`${label} is not an object`);
    return null;
  }

  return value;
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
    } else {
      fail(`/health returned HTTP ${healthResponse.statusCode}; expected 200`);
    }
    checkRuntimeHealthShape(healthResponse.json());

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
    } else {
      fail(
        `safe missing route returned HTTP ${errorResponse.statusCode}; expected 404`
      );
    }
    checkRuntimeErrorShape(errorResponse.json());
  } finally {
    await app.close();
  }
}

let options;

try {
  options = parseArguments(process.argv.slice(2));
} catch (error) {
  fail(error.message);
}

if (options) {
  const authorityRepo = resolve(backendRepo, options.authorityRepo);
  const openApiPath = resolve(authorityRepo, OPENAPI_RELATIVE_PATH);

  if (!existsSync(authorityRepo) || !statSync(authorityRepo).isDirectory()) {
    fail(
      `Authority repository path is not a local directory: ${authorityRepo}`
    );
  } else if (!existsSync(openApiPath) || !statSync(openApiPath).isFile()) {
    fail(`OpenAPI file is missing: ${openApiPath}`);
  } else {
    pass(`OpenAPI file found: ${openApiPath}`);
    const lines = readFileSync(openApiPath, "utf8").split(/\r?\n/);
    const pathsBlock = extractBlock(lines, "paths", 0);
    const componentsBlock = extractBlock(lines, "components", 0);
    const schemasBlock = componentsBlock
      ? extractBlock(componentsBlock, "schemas", 2)
      : null;

    if (!pathsBlock) {
      fail("OpenAPI paths block is missing");
    } else {
      const healthPath = extractBlock(pathsBlock, "/health", 2);
      if (healthPath) {
        pass("OpenAPI path exists: /health");
      } else {
        fail("OpenAPI path is missing: /health");
      }
      checkImplementedProductPaths(pathsBlock);
    }

    if (!schemasBlock) {
      fail("OpenAPI components.schemas block is missing");
    } else {
      checkHealthSchema(schemasBlock);
      checkErrorSchemas(schemasBlock);
      checkProductSchema(schemasBlock);
      checkRequestNullability(schemasBlock, "CreateProductRequest");
      checkRequestNullability(schemasBlock, "UpdateProductRequest");
    }
  }
}

checkRuntimeProductDtoShape();
await checkRuntimeResponses();

if (failures.length > 0) {
  console.error(
    `FAIL: Runtime conformance validation failed with ${failures.length} error(s).`
  );
  process.exit(1);
}

console.log("PASS: Runtime conformance validation completed successfully.");
