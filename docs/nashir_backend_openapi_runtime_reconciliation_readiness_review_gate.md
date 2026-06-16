# Nashir Backend OpenAPI Runtime Reconciliation Readiness Review Gate

## Decision Summary

Decision: GO to a limited implementation reconciliation gate; NO-GO to direct runtime expansion.

This review is documentation-only. It confirms that the backend can proceed to a focused reconciliation gate whose purpose is to decide and authorize specific OpenAPI/runtime alignment work. It does not authorize new routes, OpenAPI edits, generated type regeneration, migrations, auth changes, RBAC changes, workspace behavior changes, or a new Slice.

## Current Verified Authority SHA

Authority repository:

```text
/Users/mohammedalqudairi/workspace/nashir
```

Verified HEAD:

```text
7962a35cec6f8372501b3a7b92062288e9b1d958
```

Backend authority pins reviewed:

| File | Finding |
|---|---|
| `scripts/validate-contracts.mjs` | `EXPECTED_AUTHORITY_COMMIT` is `7962a35cec6f8372501b3a7b92062288e9b1d958`. |
| `scripts/validate-contract-authority.mjs` | `PINNED_AUTHORITY_SHA` is `7962a35cec6f8372501b3a7b92062288e9b1d958`. |
| `.github/workflows/ci.yml` | Authority checkout and `validate:contract-authority --authority-ref` use `7962a35cec6f8372501b3a7b92062288e9b1d958`. |

## Scope Boundary

This gate reviewed:

- Existing backend docs under `docs/`.
- `scripts/validate-contracts.mjs`.
- `scripts/validate-contract-authority.mjs`.
- `.github/workflows/ci.yml`.
- Authority OpenAPI at `/Users/mohammedalqudairi/workspace/nashir/docs/nashir_v1_openapi.yaml`.
- Runtime route registration in `src/app.ts` and `src/products/product-route.ts`.
- Product handlers, schema, types, error model, idempotency, auth, workspace, and permission guard tests.
- Generated type usage scans across `src`, `tests`, package metadata, and contract docs.

This gate did not change runtime code, OpenAPI, generated types, migrations, routes, auth, RBAC, workspace behavior, CI, or package metadata.

## Runtime Routes Found

Runtime public routes currently found:

| Method | Runtime path | Source | Status |
|---|---|---|---|
| GET | `/health` | `src/app.ts` | Present. |
| GET | `/workspaces/:workspaceId/products` | `src/products/product-route.ts` | Present when product repositories are provided. |
| POST | `/workspaces/:workspaceId/products` | `src/products/product-route.ts` | Present when product repositories are provided. |
| GET | `/workspaces/:workspaceId/products/:productId` | `src/products/product-route.ts` | Present when product repositories are provided. |
| PUT | `/workspaces/:workspaceId/products/:productId` | `src/products/product-route.ts` | Present when product repositories are provided. |

Internal opt-in harness routes found:

| Method | Runtime path | Source | Exposure |
|---|---|---|---|
| GET | `/internal/workspace-route-harness/:workspaceId` | `src/app.ts` | Disabled by default. |
| GET | `/internal/permission-guard-harness/:requiredPermission` | `src/app.ts` | Disabled by default. |
| GET | `/internal/workspace-permission-guard-harness/:workspaceId/:requiredPermission` | `src/app.ts` | Disabled by default. |

The internal harness routes are not OpenAPI product surface and must not be treated as public contract implementation.

## OpenAPI Operations Found

Authority OpenAPI includes a much broader V1 surface than the current runtime:

- Health: `getHealth`.
- Products: `listProducts`, `createProduct`, `getProduct`, `updateProduct`.
- Assets: list/create/get/update/link product.
- Campaign content compatibility routes and review lifecycle routes.
- Readiness snapshot routes for workspace, workflows, steps, providers, model routes, and prompts.
- Creator Studio session, context draft, readiness assessment, transfer draft, and transfer lookup routes.
- Workspace identity and settings routes.
- Workspace membership management routes.
- Store profile routes.
- Data source routes.
- Channel connection routes.
- Integration credential routes.
- Campaign and campaign brief routes.
- Campaign content item and content draft routes.
- Publishing job and publishing status routes.
- Analytics snapshot routes.
- Audit event list route.

Only `/health` and the four product operations have corresponding runtime routes today.

## Product Route Reconciliation

Product route path and method coverage:

| OpenAPI operation | Runtime route | Preliminary status |
|---|---|---|
| `listProducts` | GET `/workspaces/:workspaceId/products` | Present. |
| `createProduct` | POST `/workspaces/:workspaceId/products` | Present. |
| `getProduct` | GET `/workspaces/:workspaceId/products/:productId` | Present. |
| `updateProduct` | PUT `/workspaces/:workspaceId/products/:productId` | Present. |

Preliminary alignment:

- Product permissions align by name: `nashir.products.read` for read operations and `nashir.products.manage` for create/update.
- `workspaceId` is path-derived at runtime through workspace context and is rejected when supplied in product write bodies.
- `Idempotency-Key` is required by runtime create behavior and appears in the OpenAPI create operation.
- `If-Match` or `X-Resource-Version` is required by runtime update behavior and both headers appear in the OpenAPI update operation.
- Product list query parameters broadly align: `limit`, `cursor`, `status`, `updatedAfter`, and `sort`.

Gaps requiring reconciliation:

- Runtime `Product.version` is a number, while authority `Product.version` is typed as string.
- Runtime product records do not include `readiness`; authority `Product` allows a `readiness` property.
- Runtime accepts null for nullable product write fields such as `category`, `sku`, `imageUrl`, `videoUrl`, and `description`; authority create/update schemas list those fields as strings, not nullable.
- Runtime list response is `{ products, count, hasMore, nextCursor }`, matching the current `ProductListResponse` shape, but the authority also defines `PaginationMeta`; future list resources may expect a shared pagination envelope decision.
- Runtime `GET /health` returns `{ status, service, runtime, uptimeSeconds }`, while authority `HealthResponse` requires `{ data: { service, status, version } }`.

## Workspace/Auth/RBAC Reconciliation

Preliminary alignment:

- Runtime auth guard can verify Auth0 Bearer tokens when configured.
- Runtime workspace context guard derives workspace identity from the route parameter, not request body, query string, token workspace claims, or transitional headers.
- Runtime permission guard supports disclosing and non-disclosing denial modes.
- Product route tests cover missing auth/request context, missing permissions, route workspace behavior, and workspace membership resolution.

Gaps requiring reconciliation:

- The OpenAPI authority uses `x-guard-chain` metadata including `authGuard`, `workspaceContextGuard`, `nonDisclosingMembershipCheck`, `permissionGuard`, and `rejectBodyWorkspaceId`; runtime behavior implements the concepts, but there is no generated or automated OpenAPI conformance check for these extensions.
- Runtime request-context fallback headers exist for unconfigured auth/test mode; human decision is required on whether that transitional behavior is acceptable for the reconciliation gate.
- Runtime error codes for auth/RBAC use internal uppercase codes such as `MISSING_AUTHORIZATION_TOKEN`, `FORBIDDEN`, and `NOT_FOUND`; authority `ErrorCode` uses dotted public codes such as `permission.denied` and `resource.not_found`.

## Error Model Reconciliation

Runtime error shape:

```text
{ code, message, statusCode, correlationId?, details? }
```

Authority error shape:

```text
{ errorCode, message, requestId, retryable, status, details? }
```

Status: not reconciled.

This is the highest-risk contract gap because it affects every route, not only products. Any runtime implementation reconciliation gate must decide whether to change runtime responses, propose OpenAPI edits, or introduce a compatibility mapping.

## Idempotency Reconciliation

Runtime create-product idempotency:

- Requires `Idempotency-Key`.
- Scopes records by workspace, actor, operation name, and idempotency key.
- Computes a request fingerprint from workspace, actor, operation, key, and canonical body.
- Replays completed 201 responses for identical create requests.
- Returns conflict on conflicting replay.
- Persists records with status and optional expiry.

Authority coverage:

- `IdempotencyKeyHeader` is present on product create and many future write operations.
- Conflict responses are documented on write operations.

Gaps requiring reconciliation:

- Runtime idempotency is implemented for create product only.
- Future OpenAPI write operations with `IdempotencyKeyHeader` have no backend route implementation yet.
- Human decision is required on the standard public error code and response body for idempotency conflicts.

## Pagination/List Contract Reconciliation

Runtime product list:

```text
{ products, count, hasMore, nextCursor }
```

Authority product list:

```text
{ products, count, hasMore, nextCursor }
```

Shared authority schema:

```text
PaginationMeta { count, hasMore, nextCursor? }
```

Status: product list is preliminarily aligned with `ProductListResponse`, but list contract strategy is not globally reconciled.

The next reconciliation gate should decide whether future list endpoints continue using flattened pagination fields or move toward a shared pagination object before implementing additional list routes.

## Generated Types Status

Generated type usage scan found no active generated OpenAPI client or generated type directory in backend runtime.

Relevant validation status:

- `scripts/validate-contract-authority.mjs` explicitly checks that `src/generated`, `generated`, and `openapi-generated` are absent.
- `docs/contract-reference.md` states generated clients remain blocked until a later generated-client gate.
- Product route types are hand-authored in `src/products/product-schema.ts` and `src/products/product-types.ts`.

Status: generated types remain blocked.

## CI/Validation Coverage

Current CI coverage reviewed:

- Checks out backend.
- Checks out `henter36/nashir` at `7962a35cec6f8372501b3a7b92062288e9b1d958`.
- Runs `validate:contract-authority` against that authority ref.
- Runs lint.
- Runs `format:check`.
- Runs typecheck.
- Runs unit tests.
- Runs DB migration tests and selected DB-backed repository tests in CI.

Local validators reviewed:

- `validate:contracts` confirms the authority repo path, required authority docs, Agent Runtime non-authorization markers, and expected authority HEAD.
- `validate:contract-authority` confirms the pinned authority SHA, selected authority files at that SHA, absence of copied authority docs, absence of generated clients, and allowed CI workflow files.

Coverage gap:

- No automated runtime-vs-OpenAPI conformance checker currently compares registered Fastify routes, response shapes, schemas, headers, and error bodies against the authority OpenAPI.

## Gaps Found

1. Runtime route coverage is much narrower than authority OpenAPI. Only health and product routes exist.
2. Health response shape differs from authority `HealthResponse`.
3. Runtime `ErrorModel` shape and error code naming differ from authority `ErrorModel` and `ErrorCode`.
4. Runtime product `version` is numeric; authority product `version` is string.
5. Runtime product nullable field behavior is broader than authority create/update schemas for several optional string fields.
6. Product `readiness` is present in authority `Product` but not in runtime product type.
7. Generated OpenAPI types are intentionally absent and blocked.
8. Runtime/OpenAPI conformance is reviewed manually; no automated checker enforces operation-level alignment.
9. OpenAPI `x-guard-chain` metadata is not automatically verified against Fastify hook wiring.
10. Idempotency is implemented for create product, while authority applies idempotency headers across many future writes that are not implemented.

## Risks If Implementation Continues Before Reconciliation

| Risk | Severity | Why it matters |
|---|---|---|
| Error response contract drift becomes permanent | High | Clients would depend on a shape that conflicts with authority. |
| New routes repeat unresolved product contract decisions | High | Product version, nullability, pagination, and error-code decisions would spread. |
| Generated clients cannot be safely introduced | High | Generated types would encode authority shapes that do not match runtime responses. |
| Auth/RBAC assumptions diverge from `x-guard-chain` metadata | High | Workspace and permission behavior could appear aligned by route name but differ in disclosure and error semantics. |
| Future write routes duplicate idempotency behavior inconsistently | Medium | Conflict handling and replay semantics need one public contract. |
| OpenAPI coverage is mistaken for runtime coverage | Medium | Authority lists many routes that the backend does not implement. |

## Required Human Decisions

1. Choose the source of truth for public error response shape: update runtime to authority, propose OpenAPI changes, or define an explicit compatibility translation.
2. Decide whether `Product.version` should be public string or number.
3. Decide whether product write fields may be null in the public contract.
4. Decide whether product responses should include `readiness`.
5. Decide whether health should change to the authority `{ data }` envelope or whether OpenAPI should be revised.
6. Decide the standard list pagination shape before adding more list routes.
7. Decide when generated OpenAPI types may be introduced and what conformance evidence is required first.
8. Decide whether transitional request-context headers remain acceptable outside test/unconfigured-auth contexts.
9. Decide whether the next gate may include runtime implementation edits or must first produce an OpenAPI edit proposal.

## Recommended Next PRs

1. `docs: authorize backend OpenAPI runtime reconciliation implementation`
   - Scope: planning/authorization only.
   - Must enumerate exact allowed files and choose which gaps are in scope.

2. `fix: reconcile backend error model with OpenAPI authority`
   - Scope: only if human decision chooses runtime alignment to authority.
   - Must include auth, permission, workspace, product, and not-found/error-handler tests.

3. `fix: reconcile product contract shape with OpenAPI authority`
   - Scope: product version, nullable fields, readiness, and list pagination decisions only.

4. `docs: plan generated type introduction gate`
   - Scope: generated types remain blocked until runtime/OpenAPI conformance is proven.

5. `test: add OpenAPI runtime conformance inventory`
   - Scope: route inventory and response/header/schema assertions, without generated client introduction unless separately authorized.

## Explicit Blocklist

This gate blocks:

- Runtime code changes.
- OpenAPI edits.
- Generated type creation or regeneration.
- `src/generated`, `generated`, or `openapi-generated` directories.
- SQL migrations.
- New routes.
- Auth behavior changes.
- RBAC behavior changes.
- Workspace behavior changes.
- Product route behavior changes.
- Error model behavior changes.
- Idempotency behavior changes.
- CI workflow changes.
- Package/dependency changes.
- A new Slice.
- Remote push.

## Final Recommendation: GO / NO-GO to Implementation Reconciliation Gate

GO to a limited implementation reconciliation gate.

NO-GO to any direct feature implementation, route expansion, generated type introduction, OpenAPI edit, migration, auth/RBAC/workspace change, or new Slice before that reconciliation gate explicitly authorizes scope and resolves the required human decisions above.
