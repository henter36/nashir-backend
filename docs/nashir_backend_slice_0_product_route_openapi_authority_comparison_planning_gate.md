# Nashir Backend Slice 0 — Product Route OpenAPI Authority Comparison Planning Gate

## 1. Gate Name

Backend Slice 0 Product Route OpenAPI Authority Comparison Planning Gate

## 2. Gate Type

Authority-backed comparison planning gate.

This gate is documentation-only.

It does not authorize runtime implementation, OpenAPI edits, generated client regeneration, SQL migrations, auth changes, permission guard changes, workspace context changes, request context parsing changes, package changes, CI workflow changes, UI work, or deployment work.

## 3. Purpose

This gate defines the exact plan for comparing the accepted product route runtime implementation against the external OpenAPI authority.

The comparison target is the pinned authority OpenAPI file:

- `docs/nashir_v1_openapi.yaml`

This gate does not perform OpenAPI edits.

This gate does not copy authority files into the backend repository.

This gate does not regenerate clients.

This gate does not expand runtime routes.

## 4. Inputs

### 4.1 Latest Accepted Reconciliation Gate

- `docs/nashir_backend_slice_0_product_route_openapi_runtime_reconciliation_review_gate.md`
- Decision: GO to Backend Slice 0 Product Route OpenAPI Authority Comparison Planning Gate.
- Effect: Runtime inventory is known, but final reconciliation remains incomplete until the pinned authority OpenAPI file is inspected from the external authority repository.

### 4.2 Backend Repository

Repository:

- `henter36/nashir-backend`

Branch baseline:

- `main`

### 4.3 Authority Validation Script

Backend authority validation script:

- `scripts/validate-contract-authority.mjs`

Accepted authority facts from the backend validator:

- Pinned authority SHA: `36da9ed31903562bddfb7ffd669841956e334a51`
- Authority OpenAPI file: `docs/nashir_v1_openapi.yaml`
- Authority files must not be copied into the backend repository.
- Generated client directories remain blocked unless explicitly authorized.

### 4.4 Runtime Product Route Files

Runtime files to compare against the authority contract:

- `src/products/product-route.ts`
- `src/products/product-handlers.ts`
- `src/products/product-schema.ts`
- `src/products/product-types.ts`
- `src/error-model.ts`
- `src/permission-guard.ts`
- `src/request-context.ts`
- `src/workspace-context-guard.ts`
- `tests/products/product-route-handler.test.ts`

Review basis:

- `src/error-model.ts` is reviewed only as the runtime ErrorModel response boundary.
- `src/permission-guard.ts` is reviewed only as the runtime permission decision boundary.
- `src/workspace-context-guard.ts` is reviewed only as the runtime workspace boundary.
- This gate does not authorize edits to any runtime file.

## 5. Runtime Product Route Inventory To Compare

The current accepted runtime product route inventory is:

| Method | Runtime Path | Runtime Handler |
| :--- | :--- | :--- |
| GET | `/workspaces/:workspaceId/products` | `createListProductsHandler` |
| POST | `/workspaces/:workspaceId/products` | `createCreateProductHandler` |
| GET | `/workspaces/:workspaceId/products/:productId` | `createGetProductHandler` |
| PUT | `/workspaces/:workspaceId/products/:productId` | `createUpdateProductHandler` |

No other product route is selected for this comparison.

Specifically excluded:

- DELETE product.
- Publish product.
- Import/export product.
- Search/index product.
- Bulk product operations.
- Product media/asset routes.
- Product analytics routes.
- Audit query routes.

## 6. Authority File Access Plan

The authority repository path must be supplied locally by the operator through one of:

- `NASHIR_AUTHORITY_REPO`
- `--authority-repo <path>`

Required local validation command:

```bash
node scripts/validate-contract-authority.mjs \
  --authority-repo "$NASHIR_AUTHORITY_REPO" \
  --authority-ref 36da9ed31903562bddfb7ffd669841956e334a51
```

Expected validation behavior:

- Authority repository path exists.
- Authority repository is a Git work tree.
- Authority ref resolves to pinned SHA.
- `docs/nashir_v1_openapi.yaml` exists at the pinned SHA.
- Backend repository does not contain copied authority files.
- Backend repository does not contain generated client directories.
- CI workflow boundary remains valid.

## 7. Planned OpenAPI Extraction

The comparison gate after this planning gate must extract the product route inventory from:

```text
docs/nashir_v1_openapi.yaml
```

at:

```text
36da9ed31903562bddfb7ffd669841956e334a51
```

Required extraction targets:

- Product paths.
- Methods under product paths.
- Path parameters.
- Query parameters.
- Required headers.
- Request bodies.
- Response bodies.
- ErrorModel references.
- Security/authorization metadata if present.
- Workspace scoping representation if present.

## 8. Planned Runtime Extraction

Runtime extraction must inspect the accepted backend implementation and record:

- Registered Fastify paths.
- Registered HTTP methods.
- Runtime path parameters.
- Querystring fields.
- Request body fields.
- Required headers.
- Runtime response shapes.
- Runtime error codes.
- Permission requirements.
- Workspace guard boundary.
- Idempotency behavior.
- Optimistic version behavior.
- Audit side effects.

## 9. Planned Comparison Matrix

### 9.1 Route Presence

| Runtime Method | Runtime Path | OpenAPI Presence | Decision |
| :--- | :--- | :--- | :--- |
| GET | `/workspaces/:workspaceId/products` | To be inspected | Pending |
| POST | `/workspaces/:workspaceId/products` | To be inspected | Pending |
| GET | `/workspaces/:workspaceId/products/:productId` | To be inspected | Pending |
| PUT | `/workspaces/:workspaceId/products/:productId` | To be inspected | Pending |

### 9.2 Parameters

Required comparison:

| Area | Runtime | OpenAPI | Decision |
| :--- | :--- | :--- | :--- |
| `workspaceId` path param | Present | To be inspected | Pending |
| `productId` path param | Present for item routes | To be inspected | Pending |
| `limit` query param | Required for list | To be inspected | Pending |
| `cursor` query param | Optional for list | To be inspected | Pending |
| `status` query param | Optional for list | To be inspected | Pending |
| `updatedAfter` query param | Optional for list | To be inspected | Pending |
| `sort` query param | Optional for list | To be inspected | Pending |

### 9.3 Headers

Required comparison:

| Header | Runtime Use | OpenAPI | Decision |
| :--- | :--- | :--- | :--- |
| `Idempotency-Key` | Required for create | To be inspected | Pending |
| `If-Match` | Accepted for update expected version | To be inspected | Pending |
| `X-Resource-Version` | Accepted fallback for update expected version | To be inspected | Pending |
| Correlation/request ID header | Runtime uses correlation boundary | To be inspected | Pending |
| Permission/granted permissions header | Runtime request context boundary | To be inspected | Pending |

### 9.4 Request Bodies

Required comparison:

| Operation | Runtime Body Behavior | OpenAPI | Decision |
| :--- | :--- | :--- | :--- |
| Create product | Requires `name`; rejects `workspaceId` / `workspace_id`; validates product fields | To be inspected | Pending |
| Update product | Requires at least one updatable field; rejects `workspaceId` / `workspace_id`; validates product fields | To be inspected | Pending |
| List product | No body | To be inspected | Pending |
| Get product | No body | To be inspected | Pending |

### 9.5 Response Bodies

Required comparison:

| Operation | Runtime Response Shape | OpenAPI | Decision |
| :--- | :--- | :--- | :--- |
| List products | `{ products, count, hasMore, nextCursor }` | To be inspected | Pending |
| Create product | `{ product }` with 201 | To be inspected | Pending |
| Get product | `{ product }` | To be inspected | Pending |
| Update product | `{ product }` | To be inspected | Pending |
| Errors | ErrorModel response body | To be inspected | Pending |

### 9.6 Runtime Behavior Semantics

Required comparison:

| Behavior | Runtime Status | OpenAPI Documentation | Decision |
| :--- | :--- | :--- | :--- |
| Workspace scoping | Enforced by workspace context guard | To be inspected | Pending |
| Read permission | `nashir.products.read` | To be inspected | Pending |
| Manage permission | `nashir.products.manage` | To be inspected | Pending |
| Idempotent create | Implemented | To be inspected | Pending |
| Optimistic update | Implemented | To be inspected | Pending |
| Audit side effects | Create/update only; not response payload | To be inspected | Pending |

## 10. Planned Drift Categories

The next comparison gate must classify findings as:

| Category | Meaning |
| :--- | :--- |
| No drift | Runtime and OpenAPI are aligned. |
| Documentation-only drift | OpenAPI description/notes need clarification but schemas/routes align. |
| Contract drift | Runtime request/response/route behavior differs from OpenAPI contract. |
| Runtime drift | Runtime should be adjusted to match an accepted authority contract. |
| Deferred gap | Difference is accepted as out-of-scope and must be captured for future planning. |

## 11. Decision Rules

The next comparison gate must decide one of:

### 11.1 GO to No-Change Acceptance

Use this only if:

- Runtime routes are represented in OpenAPI.
- Request/response schemas align.
- ErrorModel aligns.
- Header behavior aligns or is intentionally documented.
- No OpenAPI edit is required.
- Generated clients remain blocked or unchanged.

### 11.2 GO to OpenAPI Edit Authorization Planning

Use this if:

- Runtime behavior is accepted but OpenAPI authority needs an update.
- The update is contract-authority work and must be performed through an explicit OpenAPI authorization gate.

### 11.3 GO to Runtime Correction Planning

Use this if:

- Runtime behavior is wrong relative to the accepted authority contract.
- The correction requires a narrow runtime authorization gate.

### 11.4 NO-GO

Use this if:

- Authority repository cannot be verified.
- Pinned SHA cannot be resolved.
- `docs/nashir_v1_openapi.yaml` cannot be inspected.
- Findings are too incomplete to make a safe decision.

## 12. Generated Client Boundary

Generated client regeneration remains blocked.

This planning gate does not authorize generated client changes.

Generated clients may become eligible only after:

1. Authority comparison is completed.
2. Any required OpenAPI authority edit is separately authorized and merged.
3. A separate generated-client authorization gate approves regeneration.

## 13. Not Authorized

This gate does not authorize:

- OpenAPI edits.
- Runtime code changes.
- Generated client regeneration.
- SQL migrations.
- Product route expansion.
- Audit querying/reporting.
- Read/list audit logging.
- Deployment work.

## 14. Required Output of the Next Gate

The next gate must be:

Backend Slice 0 Product Route OpenAPI Authority Comparison Evidence Gate

Required output:

- Authority repository path used locally.
- Authority ref used.
- Confirmation that authority ref resolves to the pinned SHA.
- Confirmation that `docs/nashir_v1_openapi.yaml` exists at the pinned SHA.
- Product route inventory from OpenAPI.
- Product route inventory from runtime.
- Parameter comparison table.
- Header comparison table.
- Request body comparison table.
- Response body comparison table.
- ErrorModel comparison table.
- Behavior semantics comparison table.
- Drift findings.
- Final decision:
  - No-change acceptance, or
  - OpenAPI edit authorization planning, or
  - Runtime correction planning, or
  - NO-GO.

## 15. Risks

| Risk | Status | Control |
| :--- | :--- | :--- |
| Authority repo unavailable locally | Open | Next gate must record exact path/ref or NO-GO. |
| Wrong authority ref used | Controlled | Pinned SHA is mandatory. |
| Backend copies authority files | Controlled | Validator blocks copied authority files. |
| Generated client drift | Controlled | Regeneration remains blocked. |
| Runtime expansion before contract comparison | Controlled | This gate blocks runtime expansion. |
| Contract drift hidden by documentation-only review | Open | Next evidence gate must inspect actual OpenAPI. |

## 16. Transition Control

Decision: GO to Backend Slice 0 Product Route OpenAPI Authority Comparison Evidence Gate.

Do not edit OpenAPI.

Do not regenerate clients.

Do not change runtime code.

Do not add migrations.

Do not expand product routes.

A separate gate is required before any implementation or contract-authority change.
