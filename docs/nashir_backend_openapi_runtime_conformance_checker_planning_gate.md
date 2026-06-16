# Nashir Backend OpenAPI Runtime Conformance Checker Planning Gate

## Decision summary

Decision: GO to a follow-up implementation PR for an OpenAPI runtime conformance checker.

The recommended checker is a hybrid static + runtime checker, implemented in phases. Phase 1 must cover only the public routes and response/request shapes currently implemented by the backend runtime. It must be blocking in CI only for that covered scope and must not require runtime implementation of OpenAPI paths that are not implemented yet.

This planning gate is documentation-only. It does not change runtime code, scripts, OpenAPI, generated types, tests, migrations, routes, CI workflows, or product behavior.

## Current authority SHA

Current OpenAPI authority repository SHA:

`e22c84fa0e2b6c01d4ee98383ef9fad2d0fa3337`

Observed authority file:

`../nashir/docs/nashir_v1_openapi.yaml`

Backend validation currently pins the same authority SHA in:

- `scripts/validate-contracts.mjs`
- `scripts/validate-contract-authority.mjs`
- `.github/workflows/ci.yml`

## Problem statement

The backend treats `../nashir/docs/nashir_v1_openapi.yaml` as the API authority, but runtime behavior is implemented separately in Fastify handlers. That creates a drift risk whenever route handlers, DTO mappers, error serialization, or validation rules evolve without a direct conformance check against the authority.

Existing tests prove local behavior, and existing contract validation proves the authority source is present and pinned. Neither class of validation proves that implemented runtime responses and request acceptance still match the OpenAPI contract for the implemented public surface.

The goal is to prevent repeat drift between OpenAPI authority and Fastify runtime without expanding backend implementation scope.

## What drift already happened and was fixed

Recent reconciliation work identified and resolved several contract/runtime alignment gaps:

- Public error responses now use the OpenAPI-aligned `ErrorModel` shape: `errorCode`, `message`, `requestId`, `retryable`, `status`, and optional `details`.
- Runtime error codes are mapped to public dotted `ErrorCode` values such as `validation.failed`, `permission.denied`, `resource.not_found`, `conflict.version_mismatch`, `idempotency.conflict`, `workspace.not_found`, `service.unavailable`, `internal.error`, and `unknown.error`.
- `/health` now returns the authority-aligned envelope `{ data: { service, status, version } }`.
- Public product response serialization now exposes `version` as a string while preserving numeric internal persistence/concurrency behavior.
- Product create/update request validation now accepts `null` for nullable optional fields that the authority allows to be cleared or omitted.
- Product route inventory was narrowed to the implemented public product routes rather than treating the full OpenAPI path inventory as implemented runtime surface.

These fixes reduced current drift, but the repo does not yet have an automated guard that prevents the same categories from regressing.

## Why existing validation is insufficient

`scripts/validate-contracts.mjs` verifies that the local authority checkout exists, includes required contract files, includes required planning gate markers, and warns if the authority HEAD differs from the expected commit.

`scripts/validate-contract-authority.mjs` verifies that the authority repository resolves to the pinned SHA, that required authority files exist at that SHA, that copied authority files and generated client directories are absent from the backend, and that only the allowed CI workflow file exists.

The current CI workflow runs authority validation, lint, format check, typecheck, tests, DB migration tests, and selected repository tests.

This is valuable but incomplete for runtime/OpenAPI conformance because it does not:

- inspect implemented Fastify route inventory against the authority route subset;
- compare `/health` runtime response shape to the authority schema;
- compare runtime `ErrorModel` shape and allowed public `errorCode` values to the authority schema;
- compare product public DTO shape to the authority `Product`, `ProductResponse`, and `ProductListResponse` schemas;
- compare product create/update request nullability behavior to the authority `CreateProductRequest` and `UpdateProductRequest` schemas;
- fail when a covered implemented route drifts from the authority while local tests still pass.

## Proposed checker goals

- Pin conformance checks to the current authority SHA and local authority file.
- Cover only implemented public runtime surface in each phase.
- Detect regressions in shapes that have already drifted before: health, error model, product DTOs, product write nullability, and product route inventory.
- Use Fastify `inject` where runtime behavior is the source of truth for emitted responses.
- Use static OpenAPI inspection where schema enum/property/nullability facts can be read directly.
- Produce clear failure messages that name the route, method, schema, property, and expected/observed mismatch.
- Be deterministic and local, with no network calls and no dependency on a live production service.
- Keep CI blocking limited to the explicit covered scope.

## Proposed checker non-goals

- It does not authorize route implementation.
- It does not implement missing OpenAPI paths.
- It does not regenerate generated clients or types.
- It does not rewrite OpenAPI.
- It does not modify product behavior.
- It does not validate every future endpoint automatically.
- It does not replace existing unit, integration, DB, lint, typecheck, or authority validation.
- It does not assert business calculations such as readiness scoring.

## Scope phase 1

Phase 1 should cover the minimum implemented public surface where drift has already occurred or is easy to reintroduce.

### Health response shape

Covered route:

- `GET /health`

Checker assertions:

- Runtime status is `200`.
- Runtime body shape is `{ data: { service, status, version } }`.
- `data.service`, `data.status`, and `data.version` are strings.
- The shape matches the authority health response envelope.

### ErrorModel shape and allowed errorCode values

Covered sources:

- `src/error-model.ts`
- Fastify error responses reachable through existing runtime paths.
- Authority schemas `ErrorModel` and `ErrorCode`.

Checker assertions:

- Runtime error bodies expose required fields `errorCode`, `message`, `requestId`, `retryable`, and `status`.
- Runtime error bodies may expose `details`.
- Runtime error bodies do not regress to legacy/internal field names.
- Public `errorCode` values emitted by current mappings are present in authority `ErrorCode`.
- Status values are HTTP status integers from 100 through 599.

### Product public response DTO shape

Covered routes:

- `GET /workspaces/:workspaceId/products`
- `POST /workspaces/:workspaceId/products`
- `GET /workspaces/:workspaceId/products/:productId`
- `PUT /workspaces/:workspaceId/products/:productId`

Checker assertions:

- Product list response contains `products`, `count`, `hasMore`, and `nextCursor`.
- Product item/create/update response contains `product`.
- Public product fields align with the authority `Product` schema for implemented fields.
- `version` is emitted as a string.
- Nullable product fields are emitted as string or `null` where applicable.
- Optional `readiness` is not required by the checker in phase 1.

### Product create/update request nullability

Covered schemas:

- `CreateProductRequest`
- `UpdateProductRequest`

Covered nullable fields:

- `category`
- `price`
- `sku`
- `imageUrl`
- `videoUrl`
- `description`

Checker assertions:

- Create and update request bodies may send `null` for nullable optional fields.
- `name` remains required and non-empty for create.
- Update still requires at least one product field.
- `workspaceId` and `workspace_id` remain rejected in request bodies.
- Product enum fields remain limited to authority enum values.

### Public route inventory for implemented product routes only

Covered implemented public routes:

- `GET /health`
- `GET /workspaces/:workspaceId/products`
- `POST /workspaces/:workspaceId/products`
- `GET /workspaces/:workspaceId/products/:productId`
- `PUT /workspaces/:workspaceId/products/:productId`

Checker assertions:

- These implemented public routes have corresponding OpenAPI paths and methods.
- The checker does not fail because the authority includes assets, campaign content, readiness, creator studio, workspace management, publishing, analytics, audit, or other paths that are not implemented in this backend slice.
- Internal harness routes are excluded because they are opt-in diagnostic routes, not public contract routes.

## Explicit exclusions

This planning gate and the phase 1 checker explicitly exclude:

- Routes not implemented yet.
- `Product.readiness` calculation.
- DB migrations.
- Generated type regeneration.
- Full OpenAPI response validation for every future endpoint.
- OpenAPI edits.
- Runtime route expansion.
- Product persistence behavior changes.
- Auth0, RBAC, and workspace membership policy changes beyond the error shapes emitted through covered paths.
- CI workflow changes in this documentation-only PR.

## Candidate implementation approaches

### A) Static OpenAPI/schema inspection only

This approach reads `../nashir/docs/nashir_v1_openapi.yaml`, extracts selected schemas and paths, and compares them to a curated runtime inventory.

Benefits:

- Fast and deterministic.
- No database fixture setup required.
- Good for enum, required property, path, method, and nullability assertions.

Limitations:

- It cannot prove what Fastify actually emits.
- It can miss mapper/handler regressions such as `version` accidentally returning as a number.
- It may duplicate runtime expectations in static fixtures.

### B) Runtime smoke/conformance tests against Fastify inject

This approach builds the Fastify app in test mode, calls covered routes using `app.inject`, and validates observed bodies against selected authority-derived expectations.

Benefits:

- Proves actual runtime responses.
- Catches serializer, handler, mapper, and error-model regressions.
- Reuses existing Fastify app wiring patterns.

Limitations:

- Needs careful fixture setup for product routes.
- Can become too broad if it tries to validate every endpoint or every business branch.
- Runtime-only checks still need authority schema extraction to avoid hardcoded drift.

### C) Hybrid static + runtime

This approach reads selected OpenAPI schema facts statically, then validates observed Fastify responses and request behavior through `app.inject` for covered implemented routes.

Benefits:

- Verifies both the authority facts and actual runtime behavior.
- Keeps phase 1 narrow while still catching the drift categories that already occurred.
- Can remain blocking without requiring unimplemented routes.
- Provides a natural phased path as new routes are implemented.

Limitations:

- Slightly more implementation complexity than pure static or pure smoke tests.
- Requires strict scope control so it does not become full OpenAPI validation prematurely.

## Recommended approach

Recommendation: C) Hybrid static + runtime.

Implement the checker in phases. Phase 1 should extract only the relevant OpenAPI facts for health, `ErrorModel`, `ErrorCode`, product response schemas, product request nullability, and the implemented public product route inventory. It should then use Fastify `inject` to verify runtime behavior against those facts.

CI recommendation: blocking immediately for the covered phase 1 scope, because the scope is intentionally small and tied to already-implemented behavior. The checker must not fail for OpenAPI paths that are not implemented yet.

## Minimal implementation plan

1. Add a checker script or test entrypoint in a later implementation PR.
2. Read the authority YAML from `NASHIR_AUTHORITY_REPO` or an explicit `--authority-repo` argument.
3. Parse only the required OpenAPI path and component schema facts.
4. Build a Fastify app with test repositories/fixtures sufficient for covered product routes.
5. Use `app.inject` to exercise `/health`, product success responses, selected product validation failures, and selected error responses.
6. Compare observed runtime bodies to authority-derived expectations.
7. Print concise PASS/FAIL output with exact mismatches.
8. Add a package script for the checker.
9. Add CI execution after existing authority validation and before or near tests.
10. Keep the initial CI failure boundary limited to phase 1 covered routes/shapes.

## Files likely affected in later implementation PR

Likely implementation files:

- `package.json`
- a new checker under `scripts/` or a focused conformance test under `tests/`
- helper code for authority YAML parsing if needed
- test fixture/helper code if runtime product route injection requires shared setup
- `.github/workflows/ci.yml` only when integrating the checker into CI

Files that should remain out of scope unless a separate decision authorizes them:

- `../nashir/docs/nashir_v1_openapi.yaml`
- generated clients/types
- migrations
- product runtime behavior
- route registration beyond checker/test fixture needs

## CI integration recommendation: advisory first or blocking immediately

Recommendation: blocking immediately for phase 1 covered scope.

Rationale:

- The covered scope is already implemented.
- The checker is intentionally narrow.
- The targeted drift categories have already occurred.
- Blocking only the covered scope prevents regressions without forcing implementation of future OpenAPI paths.

Rejected alternative: advisory-only first. Advisory mode would reduce friction but would not prevent the exact drift recurrence this gate is intended to stop.

Guardrail: If the implementation PR cannot keep the checker deterministic and narrow, switch to advisory for one PR only, then make it blocking after the failure surface is stabilized.

## Risks if skipped

- Runtime handlers can drift again from OpenAPI while local unit tests still pass.
- Generated clients or UI consumers may rely on a contract shape the backend no longer emits.
- Error response regressions can leak internal codes or break client error handling.
- Product `version`, nullability, and DTO shape regressions can break optimistic concurrency and edit flows.
- Future route implementation may accidentally treat the whole OpenAPI inventory as runtime-complete or, conversely, never validate implemented slices.

## Risks if overbuilt

- The checker may become a full OpenAPI validator before the backend has implemented the full API.
- CI may fail for authority paths that are intentionally future scope.
- Test setup may become slow or database-heavy.
- Implementation PRs may be blocked by unrelated future contract surfaces.
- The checker may duplicate business tests instead of guarding contract shape.

## Acceptance criteria for implementation PR

- Adds an automated conformance checker for the phase 1 covered scope.
- Uses the pinned authority file from the local authority repository.
- Verifies `/health` runtime response shape.
- Verifies runtime `ErrorModel` shape and emitted public `errorCode` values against authority values.
- Verifies product list and product response DTO shapes for implemented product routes.
- Verifies product create/update request nullability behavior for covered nullable fields.
- Verifies implemented public product route inventory without requiring unimplemented OpenAPI paths.
- Excludes internal harness routes.
- Is blocking in CI only for the covered scope.
- Does not modify OpenAPI, generated types, migrations, product behavior, route implementation, or unrelated CI behavior.
- Provides clear failure output.
- Existing validation commands continue to pass.

## Validation commands

Commands for this documentation-only planning PR:

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm test
NASHIR_AUTHORITY_REPO=../nashir pnpm run validate:contracts
NASHIR_AUTHORITY_REPO=../nashir pnpm run validate:contract-authority
```

Expected later implementation PR validation should add the new checker command once authorized.

## Human decisions required

- Confirm that phase 1 should be blocking immediately for covered implemented scope.
- Confirm that unimplemented OpenAPI paths must remain excluded until their backend routes exist.
- Confirm that `Product.readiness` remains excluded from phase 1 runtime assertions.
- Confirm whether the implementation should live as a script, Vitest suite, or a small hybrid of both.
- Confirm whether product route runtime conformance may use existing DB-backed test fixtures or should use in-memory repository fakes.

## Final GO/NO-GO

Final decision: GO.

Authorized next step: implement a hybrid static + runtime conformance checker in a separate PR.

Required boundary: phase 1 covers only `/health`, `ErrorModel`, implemented product public DTOs, product create/update request nullability, and implemented product public route inventory. It must be blocking in CI only for that covered scope and must not require matching unimplemented OpenAPI paths.
