# Nashir Backend Slice 0 — Product Route Handler Implementation Authorization Gate

## 1. Gate Classification

Gate type: Implementation authorization gate.

This gate authorizes product route handler implementation for Slice 0 subject to the conditions stated in section 5.

This gate resolves all six pending decisions identified in the planning gate.

This gate does not write handler code.

This gate does not authorize migrations, ORM, generated clients, OpenAPI mutation, validation script modification, CI workflow modification, deployment, secrets, UI, or formatting baseline cleanup.

## 2. Input Gate

Planning gate: `docs/nashir_backend_slice_0_product_route_handler_implementation_planning_gate.md`

Planning gate decision: GO to authorization gate.

Pending decisions from planning gate:

| # | Decision | Planning gate status |
|---|---|---|
| 1 | `WorkspaceMembershipResolver` strategy | Pending |
| 2 | `grantedPermissions` source | Pending |
| 3 | `createProduct` fingerprint algorithm | Pending |
| 4 | `createProduct` idempotency TTL | Pending |
| 5 | Audit event strategy | Pending |
| 6 | `listProducts` sort parameter | Pending |

All six are resolved in section 4 of this gate.

## 3. Accepted OpenAPI Authority

- Repository: `henter36/nashir`
- Pinned SHA: `36da9ed31903562bddfb7ffd669841956e334a51`
- Authority file: `docs/nashir_v1_openapi.yaml`
- `SortQuery` parameter: `name: sort`, `in: query`, `required: false`, `schema.type: string`, description: "Stable sort expression such as updatedAt:desc."

## 4. Decision Resolution

### 4.1 Decision 1 — WorkspaceMembershipResolver

**Resolved. No blocker.**

Rule: No allow-all resolver or in-process stub is permitted in the runtime wiring of product routes.

Permitted mechanism: `buildApp(opts)` already accepts `opts.workspaceMembershipResolver`. Product routes wire `workspaceContextGuardHook` through this same `BuildAppOptions.workspaceMembershipResolver` injection point. No new injection mechanism is added.

Test resolver: In `tests/products/product-route-handler.test.ts`, a controlled test resolver is injected via `buildApp({ workspaceMembershipResolver: ... })`. The test resolver must respond to specific workspace and actor combinations only — it must not unconditionally return `member` for all inputs. A non-member test actor must return `not_member`, and an unknown workspace must return `workspace_not_found`.

Production resolver: The resolver injected in non-test runtime must be a live DB-backed implementation. Slice 0 route handler tests do not require production resolver wiring — tests inject their own controlled resolver. No production resolver exists today; wiring product routes in production server startup is deferred to the server-wiring gate. This is a documented Slice 0 gap, not a blocker for handler implementation and tests.

### 4.2 Decision 2 — `grantedPermissions` Source

**Resolved. PREREQUISITE GATE REQUIRED before implementation.**

Rule: Product route handlers call `evaluatePermissionGuard` only with `requestContext.grantedPermissions`. Handlers do not parse JWT claims directly. Any Auth0-to-permissions mapping is out of scope for Slice 0.

Gap: `RequestContext` in `src/request-context.ts` does not have a `grantedPermissions` field. `resolveRequestContextFromHeaders` (harness path) does not parse granted permissions from headers.

Required fix: A prerequisite gate `docs/nashir_backend_slice_0_product_route_handler_request_context_permissions_gate.md` must be written, reviewed, and merged before product route implementation starts. That gate must:

- Add `grantedPermissions: readonly string[]` to `RequestContext` and `FullyResolvedRequestContext` in `src/request-context.ts`.
- Add parsing of the `x-nashir-granted-permissions` header (comma-separated, trimmed, filtered to non-empty) in `resolveRequestContextFromHeaders` for the harness auth path.
- Leave `authGuardHook` unchanged: Auth0 mode sets `grantedPermissions: []` in Slice 0, making all permission checks fail. This is an explicit Slice 0 production gap — documented, not an implementation blocker for handler tests.

Product handlers: call `evaluatePermissionGuard({ grantedPermissions: requestContext.grantedPermissions, ... })`. No other source.

This decision is a **blocker**. Implementation MUST NOT begin until the prerequisite gate is merged to main.

### 4.3 Decision 3 — `createProduct` Request Fingerprint Algorithm

**Resolved. No blocker.**

Algorithm:

```
fingerprint = SHA-256(
  workspaceId + "\x00" +
  actorId + "\x00" +
  "product.create" + "\x00" +
  idempotencyKey + "\x00" +
  canonicalBody
)
```

`canonicalBody`: JSON.stringify of the request body with keys sorted recursively at every level, whitespace stripped, no trailing newline. Use a deterministic key-sort replacer. No timestamps, no request IDs, no headers included in the body hash.

Output: hex-encoded SHA-256 digest string.

Conflict behavior: If `reserveIdempotencyRecord` returns `status === "existing"` and the stored `requestFingerprint` differs from the computed fingerprint, return 409 `CONFLICT` via `createHttpErrorResponse({ code: "CONFLICT", statusCode: 409, ... })`.

No external dependency: SHA-256 is available from `node:crypto` (`createHash("sha256")`). No new package dependency required.

### 4.4 Decision 4 — `createProduct` Idempotency TTL

**Resolved. No blocker.**

TTL: 24 hours from the time the handler processes the request.

Implementation: Compute `expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()` inside the handler before calling `reserveIdempotencyRecord`. Hardcoded in Slice 0. No new config key added.

Documented Slice 0 decision: This TTL is hardcoded as a Slice 0 baseline. A future configuration gate may promote it to a runtime-configurable value injected via `BuildAppOptions` or an environment variable. That decision is explicitly deferred beyond Slice 0.

### 4.5 Decision 5 — Audit Event Strategy

**Resolved. No blocker. Explicit production gap.**

Decision: Audit event recording is deferred for Slice 0. No `AuditRepository` is created in this slice. Product route handlers for `createProduct` and `updateProduct` do not write to `audit_events`.

The `x-audit-required: true` marker on `createProduct` and `updateProduct` in the OpenAPI authority is acknowledged. The `audit_events` table exists in the migration schema. This creates a production gap: the contract declares audit is required, but the implementation does not fulfill it.

Condition for closing the gap: A future gate `docs/nashir_backend_slice_0_audit_repository_authorization_gate.md` must authorize and implement an `AuditRepository` before product routes can be considered fully contract-compliant for `createProduct` and `updateProduct`.

No handler code may write SQL to `audit_events` directly; all audit writes must go through a dedicated repository once that gate is opened.

### 4.6 Decision 6 — `listProducts` Sort Parameter

**Resolved. Requires `product-types.ts` and `product-repository.ts` changes. Both added to allowlist.**

Valid sort values (derived from OpenAPI `SortQuery` description "Stable sort expression such as updatedAt:desc" and the existing `(updated_at DESC, product_id DESC)` keyset index):

- `updatedAt:desc` — `ORDER BY updated_at DESC, product_id DESC` (default, matches index)
- `updatedAt:asc` — `ORDER BY updated_at ASC, product_id ASC`

No other values are accepted.

Handler behavior:
- `sort` query parameter absent or `undefined`: use `updatedAt:desc` as default.
- `sort` query parameter present with value `updatedAt:desc` or `updatedAt:asc`: pass to `ListProductsInput.sort`.
- `sort` query parameter present with any other value: return 400 `BAD_REQUEST` via `createHttpErrorResponse`.

Handler must not pass the raw query string value to the repository. It must validate against the allowed set and pass only the typed value.

Repository mapping (explicit SQL mapping only, no raw string interpolation):

```typescript
const SORT_ORDER_MAP: Record<SortDirection, string> = {
  "updatedAt:desc": "updated_at DESC, product_id DESC",
  "updatedAt:asc": "updated_at ASC, product_id ASC"
};
```

Permitted `product-types.ts` change:

Add to `product-types.ts`:

```typescript
export const SORT_DIRECTIONS = ["updatedAt:desc", "updatedAt:asc"] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];
```

Add `sort?: SortDirection` to `ListProductsInput`.

Permitted `product-repository.ts` change:

Add `SORT_ORDER_MAP` constant and update the `listProducts` SQL `ORDER BY` clause to select from the map using the `sort` field. Default to `"updatedAt:desc"` if `sort` is absent. No raw string interpolation of the sort value into SQL.

## 5. Gate Decision

**Decision: GO WITH FIXES**

Implementation is authorized subject to the following conditions:

### Condition A — Blocking Prerequisite (must be merged before implementation begins)

`docs/nashir_backend_slice_0_product_route_handler_request_context_permissions_gate.md` must be written, reviewed, and merged to main.

That gate authorizes and implements:
- `grantedPermissions: readonly string[]` on `RequestContext` and `FullyResolvedRequestContext`.
- `x-nashir-granted-permissions` harness header parsing in `resolveRequestContextFromHeaders`.

No product route handler may be written or committed until Condition A is met.

### Condition B — Implementation Scope (part of the implementation work)

As part of the implementation work authorized by this gate:

- `src/products/product-types.ts`: add `SORT_DIRECTIONS`, `SortDirection`, and `sort?: SortDirection` to `ListProductsInput`.
- `src/products/product-repository.ts`: add explicit `SORT_ORDER_MAP` and use it in `listProducts`. Only this change is permitted in this file.

### Condition C — Documented Production Gaps (no blocker, acknowledged)

- Auth0 → `grantedPermissions` mapping is deferred. Product routes return 403/404 for all permission checks in Auth0 mode until a permissions mapping gate is opened.
- `WorkspaceMembershipResolver` production wiring is deferred to a server-wiring gate.
- `AuditRepository` is deferred. `createProduct` and `updateProduct` do not fulfill the `x-audit-required` contract obligation in Slice 0.

## 6. Authorized File Allowlist

The following files and areas are permitted to change during implementation. No other `src/` files may be modified.

| File | Permitted change |
|---|---|
| `src/app.ts` | Register product route Fastify plugin with prefix `/workspaces/:workspaceId/products`; wire `workspaceContextGuardHook` from existing `buildApp` options |
| `src/products/product-handlers.ts` | New file — handler functions for `listProducts`, `createProduct`, `getProduct`, `updateProduct` |
| `src/products/product-route.ts` | New file — Fastify plugin registering the four product routes |
| `src/products/product-schema.ts` | New file — JSON Schema objects for request/response Fastify validation |
| `src/products/product-types.ts` | Add `SORT_DIRECTIONS`, `SortDirection`, `sort?: SortDirection` to `ListProductsInput` only |
| `src/products/product-repository.ts` | Add `SORT_ORDER_MAP` and sort clause to `listProducts` only. No other changes. |
| `tests/products/product-route-handler.test.ts` | New file — route handler integration tests |
| `tests/helpers/test-db.ts` | Minimal additions only if required for route test fixture setup |

Files permitted to change in Condition A prerequisite gate only (not part of implementation work here):

| File | Permitted change |
|---|---|
| `src/request-context.ts` | Add `grantedPermissions` to `RequestContext` and `FullyResolvedRequestContext`; add harness header parsing |

## 7. Blocklist

The following files MUST NOT change in the implementation work authorized by this gate:

- `docs/nashir_v1_openapi.yaml` (authority spec — pinned)
- `src/permission-guard.ts`
- `src/workspace-context-guard.ts`
- `src/auth-config.ts`
- `src/auth-guard.ts`
- `src/error-model.ts`
- `src/idempotency/idempotency-types.ts`
- `src/idempotency/idempotency-mapper.ts`
- `src/idempotency/idempotency-repository.ts`
- `src/products/product-mapper.ts`
- `migrations/`
- `package.json`
- `pnpm-lock.yaml`
- `.github/workflows/`
- Authority SHA `36da9ed31903562bddfb7ffd669841956e334a51`

## 8. Authorized Endpoints

Exactly these four endpoints are authorized for implementation. No additional endpoints.

| operationId | Method + Path | Permission | Required header |
|---|---|---|---|
| `listProducts` | `GET /workspaces/{workspaceId}/products` | `nashir.products.read` | — |
| `createProduct` | `POST /workspaces/{workspaceId}/products` | `nashir.products.manage` | `Idempotency-Key` |
| `getProduct` | `GET /workspaces/{workspaceId}/products/{productId}` | `nashir.products.read` | — |
| `updateProduct` | `PUT /workspaces/{workspaceId}/products/{productId}` | `nashir.products.manage` | `If-Match` or `X-Resource-Version` |

## 9. Handler Flow (authoritative)

### 9.1 Guard chain — all four endpoints

```
onRequest:  authGuard  (or harness header path)
preHandler: workspaceContextGuardHook   → sets requestContext
handler:    evaluatePermissionGuard     → uses requestContext.grantedPermissions
handler:    endpoint-specific logic
```

### 9.2 `listProducts`

1. Parse and validate query parameters: `limit` (1–100), `cursor`, `status` (against `PRODUCT_STATUSES`), `updatedAfter` (parseable date), `sort` (against `SORT_DIRECTIONS`).
2. Return 400 on any invalid query parameter.
3. Call `ProductRepository.listProducts({ workspaceId: requestContext.workspaceId, limit, cursor, status, updatedAfter, sort })`.
4. Return 200 with `ProductListResponse`.

### 9.3 `createProduct`

1. Validate `Idempotency-Key` header present → 400 if missing.
2. Validate body does not include `workspaceId` or `workspace_id` → 422 if present.
3. Validate `CreateProductInput` schema → 422 on failure.
4. Compute `fingerprint = SHA-256(workspaceId + "\x00" + actorId + "\x00" + "product.create" + "\x00" + idempotencyKey + "\x00" + canonicalBody)`.
5. Compute `expiresAt = new Date(Date.now() + 86_400_000).toISOString()`.
6. Call `IdempotencyRepository.reserveIdempotencyRecord({ workspaceId, actorId, operationName: "product.create", idempotencyKey, requestFingerprint: fingerprint, expiresAt })`.
7. If `status === "existing"` and `record.responseStatusCode === 201`: return 201 with stored `record.responseBody` (idempotency replay).
8. If `status === "existing"` and `record.responseStatusCode !== 201`: return 409 `CONFLICT`.
9. If `status === "created"`: call `ProductRepository.createProduct({ workspaceId: requestContext.workspaceId, input })`.
10. On success: call `IdempotencyRepository.markIdempotencyRecordCompleted({ ..., responseStatusCode: 201, responseBody: productResponse, resourceId: product.productId })`. Return 201.
11. On failure: call `IdempotencyRepository.markIdempotencyRecordFailed({ ..., responseStatusCode: errorStatus })`. Return error.

### 9.4 `getProduct`

1. Call `ProductRepository.getProductById({ workspaceId: requestContext.workspaceId, productId: request.params.productId })`.
2. If `null`: return 404 `NOT_FOUND`.
3. Return 200 with `ProductResponse`.

### 9.5 `updateProduct`

1. Validate `If-Match` or `X-Resource-Version` header present and parseable as positive integer → 400 if missing or non-integer or ≤ 0.
2. Validate body does not include `workspaceId` or `workspace_id` → 422 if present.
3. Validate `UpdateProductInput` schema → 422 on failure.
4. Parse `expectedVersion` from header (strip ETag quotes from `If-Match`; parse integer from `X-Resource-Version`).
5. Call `ProductRepository.updateProduct({ workspaceId: requestContext.workspaceId, productId: request.params.productId, input, expectedVersion })`.
6. `status === "not_found"`: return 404 `NOT_FOUND`.
7. `status === "version_conflict"`: return 409 `CONFLICT` with `{ currentVersion: result.currentVersion }` in details.
8. `status === "updated"`: return 200 with `ProductResponse`.

## 10. ErrorModel Mapping (authoritative)

All error responses use `createHttpErrorResponse` from `src/error-model.ts`. `correlationId` from `request.correlationId`.

| Scenario | statusCode | code |
|---|---:|---|
| Missing / invalid / expired JWT | 401 | `UNAUTHORIZED` |
| Workspace not found or not member | 404 | `WORKSPACE_NOT_FOUND` |
| Permission denied (disclosing) | 403 | `FORBIDDEN` |
| Permission denied (non-disclosing) | 404 | `NOT_FOUND` |
| Product not found or cross-workspace | 404 | `NOT_FOUND` |
| Missing required header | 400 | `BAD_REQUEST` |
| Header not parseable as positive integer | 400 | `BAD_REQUEST` |
| Invalid sort value | 400 | `BAD_REQUEST` |
| Body includes `workspaceId` / `workspace_id` | 422 | `VALIDATION_FAILED` |
| Invalid domain payload | 422 | `VALIDATION_FAILED` |
| Idempotency conflict (fingerprint mismatch) | 409 | `CONFLICT` |
| Optimistic concurrency conflict | 409 | `CONFLICT` |
| Unexpected error | 500 | `INTERNAL_SERVER_ERROR` |

No stack traces, SQL errors, ORM errors, permission lists, role details, or internal state may appear in any error response body.

## 11. Required Tests

### `listProducts`

- returns 401 when unauthenticated
- returns 404 when workspace not found
- returns 403 when `nashir.products.read` missing from `grantedPermissions`
- returns 200 with empty list when no products in workspace
- returns 200 with products and `hasMore: false` when all products fit in one page
- returns 200 with `hasMore: true` and `nextCursor` when products exceed limit
- returns 200 on subsequent page using `nextCursor`
- returns 400 when `limit` is absent
- returns 400 when `limit` is not a positive integer
- returns 400 when `limit` exceeds 100
- returns 400 when `status` is not a valid `ProductStatus`
- returns 400 when `updatedAfter` is not a valid ISO 8601 date
- returns 400 when `sort` is an unrecognized value
- returns 200 when `sort` is `updatedAt:desc`
- returns 200 when `sort` is `updatedAt:asc`

### `createProduct`

- returns 401 when unauthenticated
- returns 404 when workspace not found
- returns 403 when `nashir.products.manage` missing from `grantedPermissions`
- returns 400 when `Idempotency-Key` header is missing
- returns 422 when body includes `workspaceId`
- returns 422 when body includes `workspace_id`
- returns 422 when `name` is missing from body
- returns 201 with created product on first call
- returns 201 with identical body on idempotency replay (same key, same body)
- returns 409 when same key is replayed with different body (fingerprint conflict)

### `getProduct`

- returns 401 when unauthenticated
- returns 404 when workspace not found
- returns 403 when `nashir.products.read` missing from `grantedPermissions`
- returns 404 when product does not exist
- returns 404 when product belongs to a different workspace
- returns 200 with product when found

### `updateProduct`

- returns 401 when unauthenticated
- returns 404 when workspace not found
- returns 403 when `nashir.products.manage` missing from `grantedPermissions`
- returns 400 when neither `If-Match` nor `X-Resource-Version` header is present
- returns 400 when `If-Match` contains a non-integer value
- returns 400 when `X-Resource-Version` is zero or negative
- returns 422 when body includes `workspaceId`
- returns 422 when body includes `workspace_id`
- returns 404 when product does not exist
- returns 409 on version conflict (stale `expectedVersion`)
- returns 200 with updated product when version matches

## 12. Verification Commands

These commands must pass before any implementation PR is merged:

```bash
pnpm run lint
pnpm run typecheck
pnpm test

# With TEST_DATABASE_URL set (CI or local postgres):
pnpm run test:db
pnpm exec vitest run tests/products/product-repository.test.ts --pool forks --maxWorkers=1
pnpm exec vitest run tests/idempotency/idempotency-repository.test.ts --pool forks --maxWorkers=1
pnpm exec vitest run tests/products/product-route-handler.test.ts --pool forks --maxWorkers=1
```

Contract validation (CI, with authority checkout at pinned SHA):

```bash
pnpm run validate:contract-authority -- \
  --authority-repo ../nashir-authority \
  --authority-ref 36da9ed31903562bddfb7ffd669841956e334a51

pnpm run validate:contracts
```

## 13. Remaining Risks

### 13.1 Prerequisite Gate Drift Risk

If the prerequisite gate for `request-context.ts` is merged without review, `grantedPermissions` may be populated incorrectly (e.g., accepting any header value without sanitization).

Mitigation: The prerequisite gate must validate the `x-nashir-granted-permissions` header values against a safe character set and filter empty entries.

### 13.2 Fingerprint Instability Risk

Key sort in `canonicalBody` may behave differently across JavaScript engines or JSON serializations for nested objects.

Mitigation: Use a recursive key-sort replacer function, tested in unit tests with nested body fixtures. Do not rely on `JSON.stringify(body)` without sorting.

### 13.3 Idempotency Replay Type Mismatch Risk

Replaying `record.responseBody` from the idempotency store may return a `JsonValue | null` shape that does not match the expected `ProductResponse` shape if the stored body was written with a different schema version.

Mitigation: For Slice 0, the schema is not versioned. Accept this risk as a Slice 0 constraint. Mark it as a future versioning concern.

### 13.4 Version Parsing Overflow Risk

`parseInt` on `X-Resource-Version` may silently overflow for very large integers.

Mitigation: After parsing, validate `Number.isSafeInteger(version)` and `version > 0`. Reject with 400 otherwise.

### 13.5 Sort SQL Injection Risk

If the sort value is used as a raw string in the SQL query, it creates an injection vector.

Mitigation: The `SORT_ORDER_MAP` is a closed map. Only map-resolved values are interpolated into SQL. The handler validates the input against `SORT_DIRECTIONS` before passing to the repository.

### 13.6 Auth0 Production Gap Risk

In Auth0 mode, `grantedPermissions: []` means all permission checks fail. Product routes deployed to production with Auth0 auth will always return 403/404.

Mitigation: This is an explicit Slice 0 constraint. Product routes are not production-wired until an Auth0-to-permissions gate is opened. Document prominently in the server-wiring gate.

### 13.7 Audit Production Gap Risk

`createProduct` and `updateProduct` do not record audit events. The OpenAPI marks both as `x-audit-required: true`.

Mitigation: Deferred to `AuditRepository` gate. Document as a known contract gap in any production-readiness checklist.

## 14. Explicit Non-Authorization

This authorization gate does not authorize:

- `WorkspaceMembershipResolver` production DB implementation
- Auth0 → `grantedPermissions` mapping
- `AuditRepository` or audit event recording
- Any route beyond the four listed in section 8
- OpenAPI mutation
- Migration changes
- `package.json` changes
- New npm/pnpm dependencies
- CI workflow changes
- Authority SHA changes
- Deployment or secrets changes
- Changes to `src/permission-guard.ts`, `src/workspace-context-guard.ts`, `src/auth-guard.ts`, `src/auth-config.ts`, `src/error-model.ts`, `src/idempotency/*`

## 15. Implementation Transition Decision

**GO WITH FIXES.**

Implementation proceeds in this order:

**Step 1 (blocking):** Write, review, and merge prerequisite gate `docs/nashir_backend_slice_0_product_route_handler_request_context_permissions_gate.md`.

Do not write any handler code before Step 1 is merged.

**Step 2 (implementation):** After Step 1 is merged, implement:

1. Add `SORT_DIRECTIONS`, `SortDirection`, `sort?` to `src/products/product-types.ts`.
2. Add `SORT_ORDER_MAP` and sort clause to `src/products/product-repository.ts`.
3. Create `src/products/product-schema.ts` (request/response JSON Schema).
4. Create `src/products/product-route.ts` (Fastify plugin).
5. Create `src/products/product-handlers.ts` (handler implementations).
6. Register plugin in `src/app.ts`.
7. Create `tests/products/product-route-handler.test.ts`.

All verification commands in section 12 must pass before the implementation PR is opened.

**Step 3:** Implementation PR reviewed and merged to main.
