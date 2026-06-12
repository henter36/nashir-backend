# Nashir Backend Slice 0 — Product Route Handler Implementation Planning Gate

## 1. Gate Classification

Gate type: Documentation-only implementation planning gate.

This gate plans product route handler implementation for the next slice.

This gate does not authorize implementation.

This gate does not authorize route handler code.

This gate does not authorize middleware changes.

This gate does not authorize migrations, ORM, generated clients, OpenAPI mutation, validation script modification, package script modification, CI workflow modification, deployment, secrets, UI, or formatting baseline cleanup.

## 2. Inputs Reviewed

Files read before writing this gate:

- `docs/nashir_backend_slice_0_execution_decision_gate.md`
- `src/products/product-types.ts`
- `src/products/product-mapper.ts`
- `src/products/product-repository.ts`
- `src/idempotency/idempotency-types.ts`
- `src/idempotency/idempotency-mapper.ts`
- `src/idempotency/idempotency-repository.ts`
- `src/app.ts`
- `src/error-model.ts`
- `src/permission-guard.ts`
- `src/workspace-context-guard.ts`
- `src/request-context.ts`
- `../nashir/docs/nashir_v1_openapi.yaml` (authority copy, product paths extracted)

## 3. Planning Objective

This gate plans:

- which product endpoints to implement in the next slice;
- the handler flow for each endpoint;
- how each handler uses `ProductRepository`, `IdempotencyRepository`, `evaluatePermissionGuard`, and `workspaceContextGuardHook`;
- how `ErrorModel` maps to each response;
- idempotency behavior for `createProduct`;
- optimistic concurrency behavior for `updateProduct`;
- pagination and query validation for `listProducts`;
- the allowlist and blocklist for the implementation authorization gate;
- required tests;
- remaining risks.

This gate does not write handler code.

## 4. Accepted OpenAPI Authority

- Repository: `henter36/nashir`
- Pinned SHA: `36da9ed31903562bddfb7ffd669841956e334a51`
- Authority file: `docs/nashir_v1_openapi.yaml`
- CI checkout: `.github/workflows/ci.yml` checks out `henter36/nashir` at the pinned SHA. Floating `main` references are not permitted.

## 5. Product Endpoints from OpenAPI

The following four product endpoints are defined in `nashir_v1_openapi.yaml`. No additional endpoints are invented here.

### 5.1 `listProducts`

| Field | Value |
|---|---|
| Method + Path | `GET /workspaces/{workspaceId}/products` |
| operationId | `listProducts` |
| Required permission | `nashir.products.read` |
| Idempotency-Key header | Not required |
| If-Match / X-Resource-Version | Not required |
| Expected repository method | `ProductRepository.listProducts(ListProductsInput)` |
| Guard chain | `authGuard` → `workspaceContextGuard` (non-disclosing membership) → `permissionGuard` |

Query parameters (from OpenAPI `$ref` parameters):

- `limit` — positive integer, max 100 (normalized by `normalizeLimit` in repository)
- `cursor` — opaque pagination cursor (base64url encoded)
- `status` — optional `ProductStatus` filter
- `updatedAfter` — optional ISO 8601 timestamp filter
- `sort` — optional sort direction

Responses:

| Status | Condition |
|---:|---|
| 200 | Success — returns `ProductListResponse` |
| 400 | Malformed query parameters |
| 401 | Missing or invalid authentication |
| 403 | Active member lacks `nashir.products.read` |
| 404 | Workspace not found or non-disclosing membership denial |
| default | Unexpected error — `INTERNAL_SERVER_ERROR` |

Required tests:

- returns 401 when unauthenticated
- returns 404 when workspace not found
- returns 403 when permission missing
- returns 200 with empty list when no products
- returns 200 with products and pagination metadata
- returns 400 on invalid query parameters

---

### 5.2 `createProduct`

| Field | Value |
|---|---|
| Method + Path | `POST /workspaces/{workspaceId}/products` |
| operationId | `createProduct` |
| Required permission | `nashir.products.manage` |
| Idempotency-Key header | **Required** (per `$ref: "#/components/parameters/IdempotencyKeyHeader"`) |
| If-Match / X-Resource-Version | Not required |
| Expected repository method | `ProductRepository.createProduct({ workspaceId, input, productId? })` |
| Guard chain | `authGuard` → `workspaceContextGuard` (non-disclosing membership) → `permissionGuard` → `rejectBodyWorkspaceId` |
| Audit required | Yes (`x-audit-required: true`) |

Responses:

| Status | Condition |
|---:|---|
| 201 | Created — returns `ProductResponse` |
| 400 | Missing Idempotency-Key header, malformed request |
| 401 | Missing or invalid authentication |
| 403 | Active member lacks `nashir.products.manage` |
| 404 | Workspace not found or non-disclosing membership denial |
| 409 | Idempotency conflict (same key, different fingerprint) |
| 422 | Body includes `workspaceId` or `workspace_id`; invalid domain payload |
| default | Unexpected error |

Required tests:

- returns 401 when unauthenticated
- returns 404 when workspace not found
- returns 403 when permission missing
- returns 400 when Idempotency-Key header is missing
- returns 422 when body includes `workspaceId` or `workspace_id`
- returns 422 when payload is invalid
- returns 201 with created product
- returns 409 on idempotency conflict
- returns 201 with same body on idempotency replay

---

### 5.3 `getProduct`

| Field | Value |
|---|---|
| Method + Path | `GET /workspaces/{workspaceId}/products/{productId}` |
| operationId | `getProduct` |
| Required permission | `nashir.products.read` |
| Idempotency-Key header | Not required |
| If-Match / X-Resource-Version | Not required |
| Expected repository method | `ProductRepository.getProductById({ workspaceId, productId })` |
| Guard chain | `authGuard` → `workspaceContextGuard` (non-disclosing membership) → `permissionGuard` |

Responses:

| Status | Condition |
|---:|---|
| 200 | Success — returns `ProductResponse` |
| 401 | Missing or invalid authentication |
| 403 | Active member lacks `nashir.products.read` |
| 404 | Workspace not found, non-disclosing membership denial, or product not found / cross-workspace |
| default | Unexpected error |

Required tests:

- returns 401 when unauthenticated
- returns 404 when workspace not found
- returns 403 when permission missing
- returns 404 when product does not exist
- returns 404 when product belongs to another workspace
- returns 200 with product

---

### 5.4 `updateProduct`

| Field | Value |
|---|---|
| Method + Path | `PUT /workspaces/{workspaceId}/products/{productId}` |
| operationId | `updateProduct` |
| Required permission | `nashir.products.manage` |
| Idempotency-Key header | Not required for updates |
| If-Match / X-Resource-Version | **Required** — clients must send one of these for optimistic concurrency |
| Expected repository method | `ProductRepository.updateProduct({ workspaceId, productId, input, expectedVersion? })` |
| Guard chain | `authGuard` → `workspaceContextGuard` (non-disclosing membership) → `permissionGuard` → `rejectBodyWorkspaceId` |
| Audit required | Yes (`x-audit-required: true`) |

Responses:

| Status | Condition |
|---:|---|
| 200 | Updated — returns `ProductResponse` |
| 400 | Missing or invalid If-Match / X-Resource-Version header, malformed request |
| 401 | Missing or invalid authentication |
| 403 | Active member lacks `nashir.products.manage` |
| 404 | Workspace not found, non-disclosing membership denial, product not found, or cross-workspace |
| 409 | Optimistic concurrency conflict (`UpdateProductResult.status === "version_conflict"`) |
| 422 | Body includes `workspaceId` or `workspace_id`; invalid domain payload |
| default | Unexpected error |

Required tests:

- returns 401 when unauthenticated
- returns 404 when workspace not found
- returns 403 when permission missing
- returns 400 when If-Match / X-Resource-Version header is missing
- returns 422 when body includes `workspaceId` or `workspace_id`
- returns 404 when product does not exist
- returns 409 on version conflict
- returns 200 with updated product

## 6. Handler Responsibilities

### 6.1 Read operations (`listProducts`, `getProduct`)

Expected handler flow:

1. `authGuard` — runs first via `onRequest` hook; validates Auth0 JWT or harness header.
2. `workspaceContextGuardHook` (via `preHandler`) — resolves `workspaceId` from route params, resolves verified identity, calls `workspaceMembershipResolver`; returns 404 (`WORKSPACE_NOT_FOUND`) for non-member and workspace-not-found outcomes (non-disclosing).
3. `permissionGuard` (`evaluatePermissionGuard`) — checks `nashir.products.read` against `requestContext.grantedPermissions`; returns 403 (disclosing) or 404 (non-disclosing) on failure.
4. Repository call — `listProducts` or `getProductById`.
5. 404 mapping — if `getProductById` returns `null`, return 404 `NOT_FOUND`.
6. Response — map repository result to `ProductResponse` or `ProductListResponse` shape.

### 6.2 Write operations (`createProduct`, `updateProduct`)

Expected handler flow:

1. `authGuard` — same as reads.
2. `workspaceContextGuardHook` (via `preHandler`) — same as reads.
3. `permissionGuard` — checks `nashir.products.manage`; fails before any product-specific lookup.
4. `rejectBodyWorkspaceId` — validates that request body does not include `workspaceId` or `workspace_id`; returns 422 if present.
5. Input validation — validates body against `CreateProductRequest` or `UpdateProductRequest` schema; returns 422 on failure.
6. Header validation:
   - `createProduct`: validates `Idempotency-Key` header is present; returns 400 if missing.
   - `updateProduct`: validates `If-Match` or `X-Resource-Version` header is present; returns 400 if missing.
7. Idempotency check (`createProduct` only):
   - Call `IdempotencyRepository.reserveIdempotencyRecord(...)`.
   - If `status === "existing"`, return the cached response (201 replay).
   - If `status === "created"`, proceed.
8. Repository call:
   - `createProduct`: `ProductRepository.createProduct({ workspaceId, input, productId? })`.
   - `updateProduct`: `ProductRepository.updateProduct({ workspaceId, productId, input, expectedVersion })`.
9. Result handling:
   - `updateProduct status === "not_found"`: return 404.
   - `updateProduct status === "version_conflict"`: return 409.
   - `createProduct` on success: call `IdempotencyRepository.markIdempotencyRecordCompleted(...)`.
   - `createProduct` on failure: call `IdempotencyRepository.markIdempotencyRecordFailed(...)`.
10. Response — 201 for create, 200 for update.

## 7. Repository Integration Plan

### ProductRepository methods

| Method | Signature | Used by |
|---|---|---|
| `createProduct` | `({ workspaceId, input, productId? })` → `Promise<Product>` | `createProduct` handler |
| `getProductById` | `({ workspaceId, productId })` → `Promise<Product \| null>` | `getProduct` handler |
| `listProducts` | `(ListProductsInput)` → `Promise<ListProductsResult>` | `listProducts` handler |
| `updateProduct` | `({ workspaceId, productId, input, expectedVersion? })` → `Promise<UpdateProductResult>` | `updateProduct` handler |

`workspaceId` for all calls comes from `request.requestContext.workspaceId` (set by `workspaceContextGuardHook`).

### UpdateProductResult status mapping

| Repository result status | HTTP status |
|---|---:|
| `"updated"` | 200 |
| `"not_found"` | 404 |
| `"version_conflict"` | 409 |

## 8. IdempotencyRepository Integration Plan

Only `createProduct` uses idempotency. `updateProduct`, `listProducts`, and `getProduct` do not.

### Reserve flow for `createProduct`

```
IdempotencyRepository.reserveIdempotencyRecord({
  workspaceId: requestContext.workspaceId,
  actorId: requestContext.actorId,
  operationName: "product.create",
  idempotencyKey: request.headers["idempotency-key"],
  requestFingerprint: <hash of normalized body>,
  expiresAt: <configurable TTL, e.g. now + 24h>
})
```

- `status === "created"`: proceed to `ProductRepository.createProduct`.
- `status === "existing"` with `responseStatusCode === 201`: replay the cached response body directly; skip repository call.
- `status === "existing"` with other status: return 409 (`IDEMPOTENCY_CONFLICT`).

### Complete / fail flow

After `ProductRepository.createProduct` succeeds:

```
IdempotencyRepository.markIdempotencyRecordCompleted({
  workspaceId, actorId, operationName, idempotencyKey,
  responseStatusCode: 201,
  responseBody: <ProductResponse>,
  resourceId: product.productId
})
```

After failure:

```
IdempotencyRepository.markIdempotencyRecordFailed({
  workspaceId, actorId, operationName, idempotencyKey,
  responseStatusCode: <error status>
})
```

## 9. ErrorModel Response Plan

All error responses use `createHttpErrorResponse` from `src/error-model.ts`. The `correlationId` comes from `request.correlationId`.

| Scenario | statusCode | code |
|---|---:|---|
| Missing / invalid / expired JWT | 401 | `UNAUTHORIZED` |
| Workspace not found or not member | 404 | `WORKSPACE_NOT_FOUND` |
| Permission denied (disclosing) | 403 | `FORBIDDEN` |
| Permission denied (non-disclosing) | 404 | `NOT_FOUND` |
| Product not found or cross-workspace | 404 | `NOT_FOUND` |
| Missing required header | 400 | `BAD_REQUEST` |
| Body includes `workspaceId` | 422 | `VALIDATION_FAILED` |
| Invalid domain payload | 422 | `VALIDATION_FAILED` |
| Idempotency conflict | 409 | `CONFLICT` |
| Optimistic concurrency conflict | 409 | `CONFLICT` |
| Unexpected error | 500 | `INTERNAL_SERVER_ERROR` |

Error body fields: `code`, `message`, `statusCode`, `correlationId`.

No stack traces, SQL errors, ORM errors, permission lists, role mappings, or internal details may appear in any error response.

## 10. Pagination and Query Validation Plan

`listProducts` accepts:

- `limit`: required integer, `1 ≤ limit ≤ 100`. Handler must parse from query string and pass to `normalizeLimit` (already enforced in repository).
- `cursor`: optional opaque string. Pass directly to `ListProductsInput.cursor`. Invalid cursors cause a 400 from `decodeCursor` inside the repository.
- `status`: optional `ProductStatus`. Must be validated against `PRODUCT_STATUSES` before passing. Invalid value → 400.
- `updatedAfter`: optional ISO 8601 string. Must be validated as a parseable date. Invalid value → 400.
- `sort`: optional. Currently `ListProductsInput` does not expose a sort field; handler must ignore or reject if present and unsupported.

Malformed query parameters return 400 `BAD_REQUEST` with a non-disclosing message.

## 11. Optimistic Concurrency Plan

`updateProduct` requires either `If-Match` or `X-Resource-Version` header.

Header resolution:

1. Read `If-Match` header. If present, parse as `ETag` value (strip quotes). Map to integer version.
2. If `If-Match` absent, read `X-Resource-Version` header. Parse as integer.
3. If neither is present, return 400 `BAD_REQUEST`.
4. Pass parsed version as `expectedVersion` to `ProductRepository.updateProduct`.

Version conflict mapping:

- `UpdateProductResult.status === "version_conflict"`: return 409 `CONFLICT` with `currentVersion` in details.

Cross-workspace check:

- `getProductById` is used inside the repository fallback in `updateProduct` to distinguish `not_found` from `version_conflict`. This is already implemented in the repository — handler does not need to add an extra lookup.

## 12. Allowlist (for next implementation authorization gate)

Files permitted to change in the upcoming implementation authorization gate:

| File or area | Permitted change |
|---|---|
| `src/app.ts` | Register product route plugin / prefix |
| `src/products/product-handlers.ts` | New file — route handler implementations |
| `src/products/product-route.ts` | New file — Fastify route registration |
| `src/products/product-schema.ts` | New file — request/response JSON Schema for Fastify validation |
| `src/products/product-types.ts` | Only if a gap is found and documented in a separate gate |
| `tests/products/product-route-handler.test.ts` | New file — route handler integration tests |
| `tests/helpers/test-db.ts` | Only minimal additions if needed for route test setup |

Files NOT permitted without a separate authorization gate:

- `src/products/product-repository.ts`
- `src/idempotency/idempotency-repository.ts`

## 13. Blocklist

The following files MUST NOT change in the implementation authorization gate:

- `docs/nashir_v1_openapi.yaml` (authority spec)
- `src/permission-guard.ts`
- `src/workspace-context-guard.ts`
- `src/auth-config.ts`
- `src/auth-guard.ts`
- `src/error-model.ts`
- `src/request-context.ts`
- `src/idempotency/idempotency-types.ts`
- `src/idempotency/idempotency-mapper.ts`
- `migrations/`
- `package.json`
- `package-lock.json`
- `.github/workflows/`
- Any CI workflow file
- Authority SHA in `ci.yml` (`36da9ed31903562bddfb7ffd669841956e334a51`)
- Any ORM or DB schema file

## 14. Risks

### 14.1 Contract Mismatch Risk

Runtime request/response shapes may drift from `nashir_v1_openapi.yaml`.

Mitigation: Validate against authority SHA in CI (`validate:contract-authority`). Do not invent response fields.

### 14.2 Idempotency Misuse Risk

Idempotency key may be applied to non-create operations, or the fingerprint algorithm may not cover the relevant request fields.

Mitigation: Idempotency is scoped to `createProduct` only. Fingerprint must cover the normalized request body. Document the fingerprint algorithm in the implementation gate.

### 14.3 Workspace Leakage Risk

A product from another workspace may be returned or modified if cross-workspace checks are incorrect.

Mitigation: `getProductById` and `updateProduct` already scope by `workspaceId`. Handler must never bypass workspace context. `evaluatePermissionGuard` checks `resourceWorkspaceId` against `requestContext.workspaceId`.

### 14.4 Permission Bypass Risk

Permission check may run after product lookup, allowing timing or status-based inference.

Mitigation: `permissionGuard` runs before any product repository call. For non-disclosing mode, 404 is returned before product lookup.

### 14.5 Inconsistent ErrorModel Risk

Handler may return raw errors or non-standard shapes.

Mitigation: All error paths must use `createHttpErrorResponse` with the accepted `code`/`message`/`statusCode`/`correlationId` fields.

### 14.6 Pagination Drift Risk

`nextCursor` may use JavaScript `Date.toISOString()` instead of the raw PostgreSQL timestamp, losing microsecond precision.

Mitigation: Already fixed — `ProductRepository.listProducts` uses `cursor_updated_at` (raw `updated_at::text` from PostgreSQL).

### 14.7 Optimistic Concurrency Drift Risk

Version parsing from `If-Match` or `X-Resource-Version` may produce NaN or negative values.

Mitigation: Handler must validate that parsed version is a positive integer before passing to repository. Invalid value → 400.

### 14.8 CI DB Test Reliance Risk

DB integration tests require `TEST_DATABASE_URL` and a live PostgreSQL instance. They skip locally without that variable.

Mitigation: CI provides the `postgres:16` service and sets `TEST_DATABASE_URL`. The skip guard is intentional. This is documented in the Execution Decision Gate.

## 15. Accepted Verification Commands

These commands must pass before any implementation authorization gate is merged:

```bash
pnpm run lint
pnpm run typecheck
pnpm test

# With authority checkout at pinned SHA:
pnpm run validate:contract-authority -- \
  --authority-repo ../nashir-authority \
  --authority-ref 36da9ed31903562bddfb7ffd669841956e334a51

pnpm run validate:contracts

# With TEST_DATABASE_URL set (CI or local postgres):
pnpm run test:db
pnpm exec vitest run tests/products/product-repository.test.ts --pool forks --maxWorkers=1
pnpm exec vitest run tests/idempotency/idempotency-repository.test.ts --pool forks --maxWorkers=1
# After route handlers are added:
pnpm exec vitest run tests/products/product-route-handler.test.ts --pool forks --maxWorkers=1
```

## 16. Pending Decisions

The following decisions require explicit authorization before the implementation gate can proceed:

| Decision | Status |
|---|---|
| `WorkspaceMembershipResolver` implementation strategy for product routes (in-process stub vs. real DB query) | **Pending** — must be decided before `buildApp` wires product routes with a live resolver |
| `grantedPermissions` source for product routes (how Auth0 JWT claims map to `nashir.products.*` permissions) | **Pending** — must be decided before `evaluatePermissionGuard` can be called correctly in non-harness mode |
| Request fingerprint algorithm for `createProduct` idempotency | **Pending** — must be specified in implementation gate |
| Idempotency TTL for `createProduct` | **Pending** — must be specified in implementation gate |
| Audit event storage strategy (the migration has `audit_events` table but no audit repository exists yet) | **Pending** — `x-audit-required: true` on `createProduct` and `updateProduct`; must decide whether to implement or defer audit |
| Sort parameter support in `listProducts` (`sort` is in OpenAPI parameters but `ListProductsInput` has no sort field) | **Pending** — must align before handler validation |

## 17. Final Decision

Decision: GO to next implementation authorization gate.

This planning gate confirms that:

- all four product endpoints are identified from the accepted OpenAPI authority;
- existing primitives (`ProductRepository`, `IdempotencyRepository`, `evaluatePermissionGuard`, `workspaceContextGuardHook`, `createHttpErrorResponse`) are sufficient to build the handlers;
- no new infrastructure is required before the implementation authorization gate;
- six pending decisions must be resolved in or before the implementation authorization gate.

This gate does not authorize any implementation.

## 18. Recommended Next Gate

Recommended next gate:

`docs/nashir_backend_slice_0_product_route_handler_implementation_authorization_gate.md`

That gate must resolve all six pending decisions listed in section 16, define the exact file allowlist, and explicitly authorize handler implementation.

## 19. Explicit Non-Authorization

This product route handler implementation planning gate does not authorize:

- route handler implementation;
- Fastify route registration;
- request/response schema implementation;
- `WorkspaceMembershipResolver` implementation;
- permission source implementation;
- audit event recording;
- idempotency fingerprint implementation;
- OpenAPI mutation;
- validation script modification;
- package script modification;
- CI workflow modification;
- generated client changes;
- migrations;
- ORM changes;
- DB schema changes;
- deployment changes;
- secrets changes;
- UI changes;
- formatting baseline cleanup.

## 20. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Slice 0 Execution Decision Gate (GO).
- `ProductRepository` with `createProduct`, `getProductById`, `listProducts`, `updateProduct`.
- `IdempotencyRepository` with `reserveIdempotencyRecord`, `markIdempotencyRecordCompleted`, `markIdempotencyRecordFailed`.
- `evaluatePermissionGuard` with `disclosing` / `non_disclosing` modes.
- `createWorkspaceContextGuardHook` with non-disclosing membership semantics.
- `createHttpErrorResponse` and `createErrorModel`.
- OpenAPI authority at pinned SHA.

### Outputs

- Four product endpoints documented from OpenAPI.
- Handler flow for each endpoint.
- Repository integration plan.
- IdempotencyRepository integration plan.
- ErrorModel mapping.
- Pagination and query validation plan.
- Optimistic concurrency plan.
- Allowlist and blocklist.
- Six pending decisions identified.

### Gaps

- `WorkspaceMembershipResolver` production implementation.
- `grantedPermissions` source from Auth0 JWT claims.
- Idempotency fingerprint algorithm.
- Idempotency TTL.
- Audit event strategy.
- `sort` parameter alignment in `ListProductsInput`.

### Transition Decision

GO to `Backend Slice 0 Product Route Handler Implementation Authorization Gate`.

Do not implement handlers before that gate resolves the six pending decisions and explicitly authorizes implementation.
