# Nashir Backend Product Contract Reconciliation Decision Gate

## Decision summary

Decision type: Documentation-only decision gate.

This gate decides the product contract reconciliation strategy before any runtime, OpenAPI, generated type, migration, route, or test change.

Recommended decision: Prefer public DTO alignment rather than changing persistence semantics blindly.

The runtime numeric product `version` is currently used as an optimistic concurrency token. It should remain numeric inside persistence, repository, handler control flow, audit metadata, and conflict detection unless a separate human-approved implementation gate explicitly decides otherwise.

If the authority OpenAPI keeps `Product.version` as `string`, the preferred implementation path is to introduce an API response DTO mapping that serializes the public `Product.version` as a string while preserving the internal numeric version model.

Final gate result: GO for a follow-up implementation planning gate only. NO-GO for immediate runtime, OpenAPI, generated type, migration, route, auth/RBAC/workspace, or test changes from this document alone.

## Current verified authority SHA

Authority repository: `$NASHIR_AUTHORITY_REPO`

Verified authority SHA:

`1a30fb6a13bce5210a23ac8a5d1011187038609b`

Backend authority pins reviewed:

- `scripts/validate-contracts.mjs`
- `scripts/validate-contract-authority.mjs`
- `.github/workflows/ci.yml`

The pinned backend authority SHA matches the local authority repository HEAD at the time of this gate.

## Runtime Product shape

Runtime source files reviewed:

- `src/products/product-types.ts`
- `src/products/product-schema.ts`
- `src/products/product-mapper.ts`
- `src/products/product-repository.ts`
- `src/products/product-handlers.ts`
- `migrations/20260612000000_product_persistence_infrastructure.sql`
- `tests/products/product-repository.test.ts`
- `tests/products/product-route-handler.test.ts`

Runtime `Product` shape:

| Field | Runtime type | Notes |
|---|---:|---|
| `productId` | `string` | Server-generated product identity. |
| `workspaceId` | `string` | Route/workspace scoped. |
| `name` | `string` | Required display name. |
| `category` | `string \| null` | Nullable persistence field. |
| `price` | `number \| null` | Nullable numeric field; DB stores `numeric`. |
| `sku` | `string \| null` | Nullable persistence field. |
| `stockStatus` | `StockStatus` | Non-null runtime value, default `unknown`. |
| `imageUrl` | `string \| null` | Nullable persistence field. |
| `videoUrl` | `string \| null` | Nullable persistence field. |
| `description` | `string \| null` | Nullable persistence field. |
| `status` | `ProductStatus` | Non-null runtime value, default `draft`. |
| `createdAt` | `string` | ISO string mapped from DB timestamp. |
| `updatedAt` | `string` | ISO string mapped from DB timestamp. |
| `version` | `number` | Integer optimistic concurrency token. |

Runtime create/update input shape allows nullable values for `category`, `price`, `sku`, `imageUrl`, `videoUrl`, and `description`. Runtime validation currently accepts `null` for these nullable fields.

Runtime does not include a `readiness` field in the `Product` interface, repository result, mapper, persistence table, or route response.

## OpenAPI Product shape

Authority source reviewed:

- `$NASHIR_AUTHORITY_REPO/docs/nashir_v1_openapi.yaml`

Authority `Product` response shape:

| Field | OpenAPI type | Required | Notes |
|---|---|---:|---|
| `productId` | `string` | yes | Canonical identity. |
| `workspaceId` | `string` | yes | Workspace boundary. |
| `name` | `string` | yes | Display field only. |
| `category` | `string \| null` | no | Nullable in response. |
| `price` | `number \| null` | no | Nullable in response, minimum 0. |
| `sku` | `string \| null` | no | Nullable in response. |
| `stockStatus` | `StockStatus` | no | Optional response field. |
| `imageUrl` | `string \| null`, `uri` | no | Nullable in response. |
| `videoUrl` | `string \| null`, `uri` | no | Nullable in response. |
| `description` | `string \| null` | no | Nullable in response. |
| `readiness` | `Readiness` | no | Optional advisory field. |
| `status` | `ProductStatus` | yes | Required response field. |
| `createdAt` | `string`, `date-time` | yes | Server timestamp. |
| `updatedAt` | `string`, `date-time` | yes | Server timestamp. |
| `version` | `string` | yes | Public contract version token. |

Authority `CreateProductRequest` and `UpdateProductRequest` define optional scalar fields as non-null when present. They do not include `readiness`, `productId`, `workspaceId`, `createdAt`, `updatedAt`, or `version`.

## Product.version mismatch analysis

Verified mismatch:

- Runtime `Product.version` is `number`.
- DB `products.version` is `integer NOT NULL DEFAULT 1 CHECK (version > 0)`.
- Repository update uses `AND version = $expectedVersion`.
- Update handler parses `If-Match` or `X-Resource-Version` as a positive integer.
- Tests assert version increment behavior and conflict details using numbers.
- OpenAPI `Product.version` is `string`.

Risk assessment:

The numeric runtime version is not only a display field. It is active optimistic concurrency state. Converting persistence or repository version to string without a deliberate migration and concurrency decision would increase risk and provide no clear contract benefit.

Recommended interpretation:

Treat the numeric runtime value as the internal persistence/concurrency model and treat the OpenAPI string as the public wire representation. A follow-up implementation should add an explicit response DTO boundary if the authority contract remains unchanged.

## Nullability/readiness mismatch analysis

Verified nullability mismatch:

- OpenAPI response allows `null` for `category`, `price`, `sku`, `imageUrl`, `videoUrl`, and `description`.
- Runtime response also returns `null` for those fields.
- OpenAPI create/update request fields are optional but not nullable when present.
- Runtime create/update validation accepts `null` for the same nullable fields.

Required human decision:

Decide whether request-body `null` should remain accepted as a clear-field operation, or whether runtime should reject `null` in create/update to match the current authority request schemas.

Verified readiness mismatch:

- OpenAPI `Product.readiness` is an optional `Readiness` response field.
- Runtime `Product` has no `readiness` field.
- Persistence has no product readiness column.
- Product handlers do not compute or return readiness.
- Product tests do not assert readiness.

Required human decision:

Decide whether `readiness` should be omitted until computed readiness exists, returned as a static/default advisory value, or moved/clarified in OpenAPI through a separate authority PR. This document does not authorize any of those runtime or OpenAPI paths.

## Options

### A) Align runtime to OpenAPI

Summary:

Change runtime product responses and possibly internal types so they match authority OpenAPI directly.

Potential implementation:

- Change public product responses to emit `version` as `string`.
- Decide whether runtime request validation rejects nullable create/update fields.
- Add or compute optional `readiness` if accepted.

Risks:

- If applied directly to repository/persistence, it may weaken or obscure numeric optimistic concurrency.
- It may accidentally change audit metadata from numeric to string.
- It may require broad test changes and careful compatibility checks.
- Adding readiness without a real source could produce misleading advisory state.

### B) Align OpenAPI to runtime

Summary:

Change authority OpenAPI to match the existing runtime shape.

Potential implementation:

- Change `Product.version` from `string` to `number` or `integer` in authority.
- Permit nullable create/update fields where clear-field behavior is intended.
- Remove or defer `Product.readiness` from the public Product schema if product readiness is not yet supported.

Risks:

- Requires authority repo change and review before backend can rely on it.
- Could break public contract consumers that already generated string `version`.
- May conflict with broader contract conventions where version tokens are strings.
- Does not help if the desired public API intentionally abstracts concurrency tokens as strings.

### C) Split public DTO from internal persistence model

Summary:

Keep the internal repository/persistence `Product` numeric version model, and introduce explicit public DTO mapping at the HTTP boundary.

Potential implementation:

- Preserve `Product.version: number` internally.
- Add a response DTO type with `version: string`.
- Convert `String(product.version)` when sending product responses.
- Keep parsing `If-Match` and `X-Resource-Version` as positive integers unless a separate public token decision changes request semantics.
- Decide nullable request behavior separately.
- Decide readiness separately.

Risks:

- Adds another type boundary that must be consistently used by list/get/create/update responses.
- Tests must clearly distinguish internal repository model from public response DTO.
- Generated-type conformance checks must target the public DTO, not the persistence model.
- If readiness remains omitted, conformance must verify that omission is valid for an optional OpenAPI field.

## Recommended decision

Choose Option C: Split public DTO from internal persistence model.

Rationale:

- It preserves the known-good numeric optimistic concurrency model.
- It respects the current authority contract where public `Product.version` is a string.
- It avoids a blind migration or semantic change to persistence.
- It creates a clear future conformance target for generated types.
- It allows nullability and readiness to be decided explicitly rather than bundled into version reconciliation.

Product.version should remain numeric internally until a human-approved gate decides otherwise.

Public DTO likely needs string mapping for `version` if authority OpenAPI remains unchanged.

## Risks of each option

| Option | Primary risk |
|---|---|
| A) Align runtime to OpenAPI | Accidental persistence/concurrency semantic change if implemented below the HTTP DTO boundary. |
| B) Align OpenAPI to runtime | Authority contract churn and possible generated-client breakage. |
| C) Split public DTO from internal persistence model | Requires discipline around mapper coverage and conformance checks. |

## Required implementation scope if accepted

If Option C is accepted in a future implementation PR, expected scope is:

- Add public Product DTO types for HTTP responses.
- Add a product-to-public-DTO mapper.
- Convert response `version` from number to string at the HTTP boundary.
- Keep repository and persistence version numeric.
- Keep update precondition parsing numeric unless separately changed.
- Update product route response tests for public DTO shape.
- Add conformance checks once generated types are authorized.
- Decide request nullability behavior before changing validators.
- Decide readiness response behavior before adding or omitting any explicit runtime field.

Out of scope for this documentation gate:

- Runtime code changes.
- OpenAPI changes.
- Generated type changes.
- Migration changes.
- Route changes.
- Test changes.
- CI workflow changes.
- auth/RBAC/workspace behavior changes.

## Blocklist

This gate does not authorize:

- Changing `src/products/*`.
- Changing `src/app.ts`.
- Changing any runtime route, guard, repository, mapper, or handler.
- Changing `$NASHIR_AUTHORITY_REPO/docs/nashir_v1_openapi.yaml`.
- Changing backend OpenAPI copies or generated types.
- Adding or modifying migrations.
- Adding routes.
- Changing tests.
- Changing auth, RBAC, workspace, permission, idempotency, audit, or request-context behavior.
- Changing CI except in a separately authorized authority-pin PR.
- Pushing to remote.

## Acceptance criteria

This documentation gate is accepted when:

- The decision document exists at `docs/nashir_backend_product_contract_reconciliation_decision_gate.md`.
- The document records the verified authority SHA.
- The document compares runtime Product shape with OpenAPI Product shape.
- The document explicitly analyzes `Product.version`.
- The document explicitly analyzes nullability and readiness gaps.
- The document evaluates options A, B, and C.
- The document recommends preserving numeric internal version semantics and mapping public DTO version to string if compatible with authority.
- The document lists required human decisions.
- The change is docs-only.
- Required repository validation commands pass.

## Validation commands

Run from the nashir-backend repository root:

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm test
NASHIR_AUTHORITY_REPO=../nashir pnpm run validate:contracts
NASHIR_AUTHORITY_REPO=../nashir pnpm run validate:contract-authority
```

Expected result:

All commands pass with no runtime, OpenAPI, generated type, migration, route, test, auth/RBAC/workspace, or CI changes from this gate.

## Human decisions required

Before implementation, humans must decide:

- Whether authority OpenAPI keeps `Product.version` as `string`.
- Whether public Product DTOs should serialize numeric internal versions with `String(version)`.
- Whether request-body `null` is accepted as a clear-field operation for create/update.
- Whether the OpenAPI request schemas should be updated to permit nullable fields if clear-field behavior remains desired.
- Whether `Product.readiness` should be omitted, computed, defaulted, or changed in authority.
- Whether generated type conformance checks should be introduced before or during product DTO reconciliation.
- Whether conflict details such as `currentVersion` should remain numeric or receive a public DTO/token mapping in a separate contract decision.

## Final GO/NO-GO

GO:

- Create a follow-up implementation planning gate for Option C.
- Preserve internal numeric product version semantics unless explicitly changed by a later approved gate.
- Consider public DTO `version` string mapping to satisfy the current authority contract.

NO-GO:

- No runtime implementation is authorized by this document.
- No OpenAPI authority change is authorized by this document.
- No generated type, migration, route, test, CI, auth/RBAC/workspace, or persistence change is authorized by this document.
