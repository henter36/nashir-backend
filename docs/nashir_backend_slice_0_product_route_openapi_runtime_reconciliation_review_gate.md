# Nashir Backend Slice 0 — Product Route OpenAPI Runtime Reconciliation Review Gate

## 1. Gate Name

Backend Slice 0 Product Route OpenAPI Runtime Reconciliation Review Gate

## 2. Gate Type

Contract/runtime reconciliation review gate.

This gate is documentation-only.

It does not authorize runtime implementation, OpenAPI edits, generated client regeneration, SQL migrations, auth changes, permission guard changes, workspace context changes, request context parsing changes, package changes, CI workflow changes, UI work, or deployment work.

## 3. Purpose

This gate reconciles the accepted product route runtime implementation against the OpenAPI authority boundary.

The goal is to identify whether the current runtime product route behavior is aligned with the authority contract, and to decide whether a future OpenAPI planning/authorization gate is required.

This gate does not edit the OpenAPI authority.

This gate does not copy OpenAPI authority files into the backend repository.

This gate does not regenerate clients.

## 4. Inputs

### 4.1 Latest Accepted Backlog Selection Gate

- `docs/nashir_backend_slice_0_remaining_backlog_reconciliation_next_slice_selection_gate.md`
- Decision: GO to Backend Slice 0 Product Route OpenAPI Runtime Reconciliation Review Gate.
- Effect: Runtime expansion, generated client regeneration, OpenAPI edits, migrations, and deployment readiness remain blocked until reconciliation is complete.

### 4.2 Authority Boundary

The backend repository validates contract authority externally through:

- `scripts/validate-contract-authority.mjs`

Accepted authority facts:

- Pinned authority SHA: `36da9ed31903562bddfb7ffd669841956e334a51`
- Authority OpenAPI file: `docs/nashir_v1_openapi.yaml`
- Backend repository must not copy authority files into itself.
- Generated client directories remain blocked unless explicitly authorized.

### 4.3 Runtime Files Reviewed

Runtime files reviewed by this gate:

- `src/products/product-route.ts`
- `src/products/product-handlers.ts`
- `src/products/product-schema.ts`
- `src/products/product-types.ts`
- `src/error-model.ts`
- `src/permission-guard.ts`
- `src/request-context.ts`
- `src/workspace-context.ts`
- `tests/products/product-route-handler.test.ts`

### 4.4 Accepted Runtime Foundation

The following runtime foundation was accepted before this gate:

- Product route handlers.
- ProductRepository.
- IdempotencyRepository.
- AuditRepository.
- Request context boundary.
- Permission boundary.
- Workspace boundary.
- DB-backed tests.

## 5. Runtime Product Route Inventory

The accepted runtime currently exposes the following product routes:

| Method | Runtime Path | Handler |
| :--- | :--- | :--- |
| GET | `/workspaces/:workspaceId/products` | `createListProductsHandler` |
| POST | `/workspaces/:workspaceId/products` | `createCreateProductHandler` |
| GET | `/workspaces/:workspaceId/products/:productId` | `createGetProductHandler` |
| PUT | `/workspaces/:workspaceId/products/:productId` | `createUpdateProductHandler` |

Runtime decision: PASS.

The runtime route inventory is narrow and matches the accepted V1 product-route foundation.

## 6. Runtime Behavior Inventory

### 6.1 List Products

Runtime behavior:

- Requires `nashir.products.read`.
- Requires resolved request context.
- Runs under workspace context boundary.
- Requires `limit`.
- Rejects non-positive limit.
- Rejects limit greater than 100.
- Supports optional `cursor`.
- Supports optional `status`.
- Supports optional `updatedAfter`.
- Supports optional `sort`.
- Returns `products`, `count`, `hasMore`, and `nextCursor`.

Runtime status: Accepted.

### 6.2 Create Product

Runtime behavior:

- Requires `nashir.products.manage`.
- Requires resolved request context.
- Runs under workspace context boundary.
- Requires `Idempotency-Key` header.
- Rejects request body workspace ownership fields: `workspaceId` and `workspace_id`.
- Validates product body.
- Computes idempotency fingerprint from workspace, actor, operation, key, and canonical body.
- Reserves idempotency record.
- Returns stored completed result on identical replay.
- Rejects conflicting replay.
- Creates product and writes `product.created` audit event in the same transaction.
- Marks idempotency record complete on success.
- Returns 201 on successful create.

Runtime status: Accepted.

### 6.3 Get Product

Runtime behavior:

- Requires `nashir.products.read`.
- Requires resolved request context.
- Runs under workspace context boundary.
- Requires UUID-like `productId`.
- Returns 404 for invalid or missing product.
- Returns `{ product }` on success.

Runtime status: Accepted.

### 6.4 Update Product

Runtime behavior:

- Requires `nashir.products.manage`.
- Requires resolved request context.
- Runs under workspace context boundary.
- Requires UUID-like `productId`.
- Requires either `If-Match` or `X-Resource-Version`.
- Rejects invalid expected version header values.
- Rejects request body workspace ownership fields: `workspaceId` and `workspace_id`.
- Requires at least one updatable product field.
- Updates product with optimistic version check.
- Writes `product.updated` audit event only on successful update.
- Returns 404 for not found.
- Returns 409 for version conflict.
- Returns `{ product }` on success.

Runtime status: Accepted.

## 7. Runtime Response Shape Inventory

Runtime product response shapes:

| Runtime Response | Shape |
| :--- | :--- |
| Product item response | `{ product }` |
| Product list response | `{ products, count, hasMore, nextCursor }` |
| Error response | ErrorModel body produced by `createHttpErrorResponse` |

Runtime response status: Accepted for current implementation.

## 8. Runtime ErrorModel Inventory

Runtime product route handlers use the shared error model helper.

Observed runtime error codes include:

- `BAD_REQUEST`
- `VALIDATION_FAILED`
- `NOT_FOUND`
- `CONFLICT`
- `FORBIDDEN`
- `INTERNAL_SERVER_ERROR`

Runtime error status: Accepted for current implementation.

## 9. Reconciliation Questions for Authority OpenAPI

The OpenAPI authority must be reviewed externally from the authority repository at the pinned SHA.

Required comparison points:

1. Does `docs/nashir_v1_openapi.yaml` include the four runtime product routes?
2. Are path parameters aligned?
   - `workspaceId`
   - `productId`
3. Are query parameters aligned for list?
   - `limit`
   - `cursor`
   - `status`
   - `updatedAfter`
   - `sort`
4. Is create request body aligned with runtime validation?
5. Is update request body aligned with runtime validation?
6. Are required headers aligned?
   - `Idempotency-Key` for create.
   - `If-Match` or `X-Resource-Version` for update.
7. Are response envelopes aligned?
   - `{ product }`
   - `{ products, count, hasMore, nextCursor }`
8. Are ErrorModel responses aligned?
9. Are permission expectations represented or documented?
   - `nashir.products.read`
   - `nashir.products.manage`
10. Are workspace scoping expectations represented?
11. Are idempotency semantics represented?
12. Are optimistic version semantics represented?
13. Are audit side effects intentionally omitted from public OpenAPI response shape?
14. Is generated client regeneration still blocked or eligible?

## 10. Initial Runtime-to-Contract Assessment

Because this gate does not fetch or edit the authority OpenAPI file directly, it records the current state as:

- Runtime inventory is known.
- Authority location is known.
- Authority file is externally pinned.
- Backend must not copy authority files.
- Contract comparison remains the required output of the next review step.

Initial assessment: INCOMPLETE until the authority OpenAPI file is compared from the authority repository at the pinned SHA.

## 11. Drift Findings

### 11.1 Confirmed Runtime Surface

Confirmed:

- Runtime has four product routes.
- Runtime supports product list/create/get/update only.
- Runtime does not include delete/publish/import/export/search/bulk/media/analytics routes.
- Runtime includes idempotency for create.
- Runtime includes optimistic version handling for update.
- Runtime includes audit side effects for create/update only.

### 11.2 Confirmed Authority Boundary

Confirmed:

- OpenAPI authority is external.
- Backend must not copy authority files.
- Generated clients are blocked unless explicitly authorized.
- Authority pinned SHA must be respected.

### 11.3 Open Drift

Open until authority file is inspected:

- Whether all runtime routes exist in OpenAPI.
- Whether request bodies align.
- Whether response bodies align.
- Whether ErrorModel responses align.
- Whether idempotency/versioning headers align.
- Whether generated clients remain blocked or become eligible after contract review.

## 12. Risk Review

| Risk | Status | Control |
| :--- | :--- | :--- |
| Runtime route exists but OpenAPI authority does not represent it | Open | Requires authority file comparison. |
| Runtime request body diverges from OpenAPI schema | Open | Requires request body comparison. |
| Runtime response body diverges from OpenAPI schema | Open | Requires response body comparison. |
| ErrorModel mismatch | Open | Requires ErrorModel comparison. |
| Generated client drift | Controlled | Regeneration remains blocked. |
| Unauthorized OpenAPI copy into backend | Controlled | Authority validation blocks copied authority files. |
| Runtime expansion before contract review | Controlled | This gate does not authorize expansion. |
| Audit behavior leaking into API response contract | Controlled | Audit is side effect only for create/update. |

## 13. Decision

Decision: GO to authority-backed OpenAPI comparison planning.

Selected next gate:

Backend Slice 0 Product Route OpenAPI Authority Comparison Planning Gate

## 14. Rationale

The runtime inventory is now clear, but final reconciliation cannot be completed without inspecting the pinned authority OpenAPI file from the authority repository.

The safest next step is a planning gate that defines exactly how to compare:

- Pinned authority OpenAPI.
- Current runtime route inventory.
- Product request/response schemas.
- ErrorModel responses.
- Idempotency/versioning headers.
- Generated client eligibility.

## 15. Not Authorized

This gate does not authorize:

- OpenAPI edits.
- Runtime code changes.
- Generated client regeneration.
- SQL migrations.
- Product route expansion.
- Audit querying/reporting.
- Read/list audit logging.
- Deployment work.

## 16. Required Output of the Next Gate

The next gate must produce:

- Exact authority repo path/ref used locally.
- Exact pinned OpenAPI file inspected.
- Product path inventory from OpenAPI.
- Product path inventory from runtime.
- Request body comparison table.
- Response body comparison table.
- ErrorModel comparison table.
- Header comparison table.
- Drift findings.
- Decision on whether OpenAPI edit authorization is needed.
- Decision on whether generated clients remain blocked.
- Decision on whether smoke tests or contract-safe test expansion can follow.

## 17. Transition Control

Do not edit OpenAPI until the next authority-backed comparison planning gate is merged.

Do not regenerate clients.

Do not expand runtime routes.

Do not add migrations.

A separate authorization gate is required for any of those actions.
