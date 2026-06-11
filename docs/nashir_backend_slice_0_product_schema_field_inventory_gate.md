# Nashir Backend Slice 0 — Product Schema Field Inventory Gate

## 1. Gate Classification

Gate type: Documentation-only product schema field inventory gate.

This gate inventories product schema fields from the accepted OpenAPI authority.

This gate does not authorize implementation.

This gate does not authorize SQL implementation.

This gate does not authorize DB table creation.

This gate does not authorize migration creation.

This gate does not authorize migration execution.

This gate does not authorize repository implementation.

This gate does not authorize route implementation.

This gate does not authorize controller, service, ORM adoption, generated clients, OpenAPI mutation, validation script modification, package script modification, CI workflow modification, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #97: `docs: review product data model authority`.
- Merged PR #96: `docs: plan product data model and migrations`.
- Merged PR #95: `docs: decide product persistence strategy`.
- Merged PR #94: `docs: plan product route implementation boundary`.
- Merged PR #93: `docs: decide permission guard error disclosure mapping`.
- Merged PR #92: `docs: decide permission guard permission representation`.
- Merged PR #91: `docs: review permission guard product route inventory`.
- Accepted OpenAPI authority repository: `henter36/nashir`.
- Accepted CI-active Backend Slice 0 authority pin: `36da9ed31903562bddfb7ffd669841956e334a51`.
- Accepted OpenAPI authority file: `docs/nashir_v1_openapi.yaml`.
- Accepted product route authority review.
- Existing non-authorization of implementation.

## 3. Inventory Objective

This gate must inventory:

- product enum schemas;
- product response fields;
- product create request fields;
- product update request fields;
- product list response fields;
- required fields;
- optional fields;
- nullable fields;
- server-generated fields;
- client-writable fields;
- response-only fields;
- query/filter implications;
- schema gaps that block SQL and migration planning;
- next gate selection.

This gate must not define SQL columns.

This gate must not define table names.

This gate must not create migrations.

This gate must not modify OpenAPI.

## 4. Authority Source

Authority source:

- Repository: `henter36/nashir`
- File: `docs/nashir_v1_openapi.yaml`
- Accepted CI-active pin: `36da9ed31903562bddfb7ffd669841956e334a51`

This gate treats the accepted OpenAPI authority as the source of truth.

This gate does not introduce backend-local product fields.

## 5. Product Enum Inventory

### 5.1 ProductStatus

Authority schema:

`ProductStatus`

Allowed values:

| Value |
|---|
| `draft` |
| `active` |
| `archived` |

Decision:

Product lifecycle/status planning must use only these values unless a future OpenAPI authority change is explicitly authorized.

No additional status values are authorized.

### 5.2 StockStatus

Authority schema:

`StockStatus`

Allowed values:

| Value |
|---|
| `available` |
| `limited` |
| `out_of_stock` |
| `unknown` |

Decision:

Stock status planning must use only these values unless a future OpenAPI authority change is explicitly authorized.

No additional stock status values are authorized.

## 6. Product Schema Inventory

Authority schema:

`Product`

Description:

Product catalog record. `productId` is canonical identity. Product name is only a display field.

### 6.1 Required Product Fields

| Field | Type / Ref | Notes |
|---|---|---|
| `productId` | `string` | Canonical product identity. |
| `workspaceId` | `string` | Workspace ownership boundary. |
| `name` | `string` | Display field only; not identity. |
| `status` | `ProductStatus` | Required lifecycle/status field. |
| `createdAt` | `string`, `date-time` | Server-side timestamp. |
| `updatedAt` | `string`, `date-time` | Server-side timestamp; also supports updatedAfter query planning. |
| `version` | `string` | Version/concurrency field. |

### 6.2 Optional Product Fields

| Field | Type / Ref | Nullable | Notes |
|---|---|---|---|
| `category` | `string` | yes | Optional display/category metadata. |
| `price` | `number` | yes | Minimum 0. |
| `sku` | `string` | yes | Optional SKU metadata. |
| `stockStatus` | `StockStatus` | not explicitly nullable | Optional stock status. |
| `imageUrl` | `string`, `uri` | yes | Optional URI metadata. |
| `videoUrl` | `string`, `uri` | yes | Optional URI metadata. |
| `description` | `string` | yes | Optional description. |
| `readiness` | `Readiness` | not explicitly nullable | Advisory readiness summary. |

### 6.3 Product Response-only Fields

The following fields appear in `Product` but are not present in `CreateProductRequest` or `UpdateProductRequest`:

| Field | Reason |
|---|---|
| `productId` | Server-generated or persistence-generated identity. |
| `workspaceId` | Path-derived workspace identity, not client body input. |
| `createdAt` | Server-generated timestamp. |
| `updatedAt` | Server-generated/update timestamp. |
| `version` | Server-managed concurrency token. |
| `readiness` | Advisory/system-computed field, not client writable in product create/update requests. |

Decision:

These fields must not be accepted from product create/update request bodies unless a future OpenAPI authority change explicitly authorizes them.

This gate does not implement rejection logic.

## 7. CreateProductRequest Inventory

Authority schema:

`CreateProductRequest`

### 7.1 Required Create Fields

| Field | Type / Ref | Notes |
|---|---|---|
| `name` | `string` | Required. `minLength: 1`. |

### 7.2 Optional Create Fields

| Field | Type / Ref | Notes |
|---|---|---|
| `category` | `string` | Optional. |
| `price` | `number` | Optional. Minimum 0. |
| `sku` | `string` | Optional. |
| `stockStatus` | `StockStatus` | Optional. |
| `imageUrl` | `string`, `uri` | Optional. |
| `videoUrl` | `string`, `uri` | Optional. |
| `description` | `string` | Optional. |
| `status` | `ProductStatus` | Optional. |

### 7.3 Fields Not Authorized in Create Body

The following fields are not part of `CreateProductRequest`:

| Field | Decision |
|---|---|
| `workspaceId` | Must remain route-derived. |
| `productId` | Must not be client supplied by this contract. |
| `createdAt` | Must not be client supplied. |
| `updatedAt` | Must not be client supplied. |
| `version` | Must not be client supplied. |
| `readiness` | Must not be client supplied. |

Decision:

Future implementation must reject or ignore unauthorized body fields according to the future validation decision.

This gate does not implement validation.

## 8. UpdateProductRequest Inventory

Authority schema:

`UpdateProductRequest`

Required behavior:

- Object has `minProperties: 1`.
- No individual field is required.
- At least one accepted update field must be present.

### 8.1 Optional Update Fields

| Field | Type / Ref | Notes |
|---|---|---|
| `name` | `string` | Optional. `minLength: 1`. |
| `category` | `string` | Optional. |
| `price` | `number` | Optional. Minimum 0. |
| `sku` | `string` | Optional. |
| `stockStatus` | `StockStatus` | Optional. |
| `imageUrl` | `string`, `uri` | Optional. |
| `videoUrl` | `string`, `uri` | Optional. |
| `description` | `string` | Optional. |
| `status` | `ProductStatus` | Optional. |

### 8.2 Fields Not Authorized in Update Body

The following fields are not part of `UpdateProductRequest`:

| Field | Decision |
|---|---|
| `workspaceId` | Must remain route-derived. |
| `productId` | Must remain path-derived. |
| `createdAt` | Must not be client supplied. |
| `updatedAt` | Must be server-managed. |
| `version` | Must be server-managed and controlled via headers/response. |
| `readiness` | Must not be client supplied. |

Decision:

Future implementation must enforce `minProperties: 1`.

This gate does not implement validation.

## 9. ProductResponse Inventory

Authority schema:

`ProductResponse`

Required fields:

| Field | Type / Ref | Notes |
|---|---|---|
| `data` | `Product` | Product payload. |
| `warnings` | `Warning[]` | Warning list. |

Decision:

Future route responses for `createProduct`, `getProduct`, and `updateProduct` must return the `ProductResponse` shape.

This gate does not implement responses.

## 10. ProductListResponse Inventory

Authority schema:

`ProductListResponse`

Required fields:

| Field | Type / Ref | Notes |
|---|---|---|
| `data` | `Product[]` | Product list payload. |
| `meta` | `PaginationMeta` | Pagination metadata. |
| `warnings` | `Warning[]` | Warning list. |

Decision:

Future `listProducts` implementation must return `ProductListResponse`.

This gate does not implement list responses.

## 11. PaginationMeta Inventory

Authority schema:

`PaginationMeta`

Required fields:

| Field | Type | Notes |
|---|---|---|
| `count` | `integer` | Minimum 0. |
| `hasMore` | `boolean` | Required. |

Optional fields:

| Field | Type | Notes |
|---|---|---|
| `nextCursor` | `string` or `null` | Optional cursor. |

Decision:

Future list behavior requires pagination planning before implementation.

This gate does not implement pagination.

## 12. Warning Inventory

Authority schema:

`Warning`

Required fields:

| Field | Type | Notes |
|---|---|---|
| `code` | `string` | Warning code. |
| `message` | `string` | Warning message. |
| `severity` | enum | `info`, `warning`, `critical`. |

Decision:

Future product responses must preserve `warnings` arrays.

This gate does not implement warning generation.

## 13. Readiness Inventory

Authority schema:

`Readiness`

Description:

Readiness summary for UI and API consumers. Advisory only. It does not execute publishing, connectors, or AI.

Required fields:

| Field | Type | Notes |
|---|---|---|
| `score` | `number` | Minimum 0, maximum 100. |
| `label` | `string` | Display label. |
| `issues` | `string[]` | Advisory issue list. |

Decision:

`readiness` is present on `Product` as an optional response field.

It is not present in create/update request schemas.

Therefore, readiness must be treated as response/system/advisory data, not as a client-writable product field.

This gate does not implement readiness.

## 14. Query and Header Implications

### 14.1 listProducts Query Parameters

Authority route includes:

| Parameter | Implication |
|---|---|
| `limit` | Pagination sizing. |
| `cursor` | Pagination cursor. |
| `status` | Status filter. |
| `updatedAfter` | Updated timestamp filter. |
| `sort` | Sorting expression such as `updatedAt:desc`. |

Decision:

Future data model and query planning must account for status and updatedAt.

This gate does not define indexes.

### 14.2 createProduct Headers

Authority route requires:

| Header | Implication |
|---|---|
| `Idempotency-Key` | Required for create operations. |
| `X-Request-Id` | Optional request tracking. |

Decision:

Future create implementation remains blocked until idempotency storage and request tracking boundaries are planned.

This gate does not implement idempotency.

### 14.3 updateProduct Headers

Authority route accepts:

| Header | Implication |
|---|---|
| `If-Match` | Optional concurrency token; one of `If-Match` or `X-Resource-Version` required by route behavior. |
| `X-Resource-Version` | Optional resource version; one of `If-Match` or `X-Resource-Version` required by route behavior. |
| `X-Request-Id` | Optional request tracking. |

Decision:

Future update implementation remains blocked until concurrency handling is planned.

This gate does not implement concurrency.

## 15. Data Model Mapping Implications

The schema inventory implies a future product persistence model must represent:

| Authority field | Persistence implication | Status |
|---|---|---|
| `productId` | Product identity | Required concept |
| `workspaceId` | Workspace ownership | Required concept |
| `name` | Display product name | Required concept |
| `category` | Optional product metadata | Candidate |
| `price` | Optional numeric metadata, min 0 | Candidate |
| `sku` | Optional product metadata | Candidate |
| `stockStatus` | Optional stock enum | Candidate |
| `imageUrl` | Optional URI metadata | Candidate |
| `videoUrl` | Optional URI metadata | Candidate |
| `description` | Optional text metadata | Candidate |
| `readiness` | Advisory response/system field | Not client writable |
| `status` | Product lifecycle enum | Required concept |
| `createdAt` | Server timestamp | Required concept |
| `updatedAt` | Server timestamp and query support | Required concept |
| `version` | Optimistic concurrency token | Required concept |

This table is a conceptual mapping only.

No SQL column names are authorized.

## 16. Contract Drift Findings

Findings:

- `workspaceId` is present in `Product` response but absent from create/update bodies.
- `productId` is present in `Product` response and path parameters but absent from create/update bodies.
- `version` is present in `Product` response but absent from create/update bodies.
- `readiness` is present in `Product` response but absent from create/update bodies.
- `createdAt` and `updatedAt` are present in `Product` response but absent from create/update bodies.
- `CreateProductRequest` requires only `name`.
- `UpdateProductRequest` requires at least one property but no specific field.
- `ProductStatus` and `StockStatus` have fixed enum values.
- `ProductResponse` and `ProductListResponse` both require `warnings`.

These findings are documentation-only.

## 17. Validation Planning Implications

Future validation planning must account for:

- create request required `name`;
- update request `minProperties: 1`;
- numeric `price` minimum 0;
- URI format for `imageUrl`;
- URI format for `videoUrl`;
- accepted `ProductStatus` values;
- accepted `StockStatus` values;
- rejection of body `workspaceId`;
- rejection or handling of fields outside accepted schemas.

This gate does not implement validation.

## 18. Persistence Planning Implications

Future persistence planning must account for:

- workspace-scoped product identity;
- response-only server fields;
- nullable response fields;
- optional request fields;
- enum persistence;
- timestamp persistence;
- version persistence;
- pagination/filter support;
- idempotency persistence for create;
- concurrency persistence for update;
- audit persistence for writes.

This gate does not implement persistence.

## 19. Product Route Eligibility Decision

Decision: Product route implementation remains NOT ELIGIBLE after this gate.

Reason:

The following remain unresolved:

- SQL data model decision;
- table naming;
- column naming;
- nullable column strategy;
- enum storage strategy;
- timestamp source;
- version generation strategy;
- migration strategy;
- repository API contract;
- transaction boundary;
- idempotency storage detail;
- audit storage detail;
- test database lifecycle;
- explicit implementation authorization.

## 20. Candidate Next Paths

### Option A — Product SQL Data Model and Migration Strategy Decision Gate

Decision: SELECTED.

Reason:

The exact product schema field inventory is now documented. The next step should decide the SQL data model and migration strategy without implementing SQL or migrations.

### Option B — Direct SQL Migration Implementation

Decision: NO-GO.

Reason:

Implementation remains unauthorized.

### Option C — Product Route Implementation

Decision: NO-GO.

Reason:

Routes remain blocked by SQL, migration, repository, idempotency, concurrency, audit, and test DB decisions.

### Option D — OpenAPI Mutation

Decision: NO-GO.

Reason:

No contract gap requiring OpenAPI mutation is identified in this gate.

## 21. Selected Next Path

Selected next path:

`Backend Slice 0 Product SQL Data Model and Migration Strategy Decision Gate`

This selected path is documentation-only.

It must decide:

- table naming strategy;
- column mapping strategy;
- enum storage strategy;
- nullable field strategy;
- timestamp source;
- version strategy;
- migration approach;
- test DB planning needs;
- whether a later implementation authorization gate can be proposed.

It must not implement SQL.

It must not create migrations.

It must not modify package scripts.

It must not modify CI workflow files.

It must not implement routes.

## 22. Risk Review

### 22.1 Schema Drift Risk

Risk:

Future SQL planning may introduce fields outside OpenAPI authority.

Mitigation:

Use this inventory as the input boundary for SQL data model planning.

### 22.2 Body Workspace Trust Risk

Risk:

Future create/update planning may accidentally accept `workspaceId` in body.

Mitigation:

Document that `workspaceId` is response/path context only and absent from create/update request schemas.

### 22.3 Version Drift Risk

Risk:

Future update planning may ignore `version`.

Mitigation:

Document `version` as response field and concurrency planning input.

### 22.4 Readiness Write Risk

Risk:

Future create/update planning may let clients write `readiness`.

Mitigation:

Document readiness as response/system/advisory only.

### 22.5 Premature Implementation Risk

Risk:

Schema inventory may be mistaken as authorization for SQL or routes.

Mitigation:

State explicit NO-GO for implementation, SQL, migrations, repositories, and routes.

## 23. Final Decision

Decision: GO to Backend Slice 0 Product SQL Data Model and Migration Strategy Decision Gate.

This decision accepts the product schema field inventory.

This decision confirms that SQL and migrations remain blocked.

This decision confirms that product route implementation remains blocked.

This decision does not authorize implementation.

This decision does not authorize route implementation.

This decision does not authorize controller implementation.

This decision does not authorize service implementation.

This decision does not authorize repository implementation.

This decision does not authorize SQL implementation.

This decision does not authorize DB table creation.

This decision does not authorize migration creation.

This decision does not authorize migration execution.

This decision does not authorize ORM adoption.

This decision does not authorize package dependency changes.

This decision does not authorize package script changes.

This decision does not authorize CI workflow changes.

This decision does not authorize OpenAPI mutation.

This decision does not authorize generated client changes.

This decision does not authorize deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 24. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Product SQL Data Model and Migration Strategy Decision Gate`

That gate should convert this schema inventory into a SQL data model and migration strategy decision without creating SQL or migrations.

## 25. Explicit Non-Authorization

This product schema field inventory gate does not authorize:

- runtime implementation;
- route implementation;
- controller implementation;
- service implementation;
- repository implementation;
- product route implementation;
- public route implementation;
- SQL implementation;
- DB table creation;
- DB migration creation;
- DB migration execution;
- ORM adoption;
- package dependency changes;
- package script changes;
- CI workflow changes;
- OpenAPI mutation;
- generated client changes;
- generated artifact regeneration;
- product seed data;
- idempotency persistence;
- optimistic concurrency persistence;
- audit persistence;
- workspace membership persistence;
- deployment changes;
- secrets changes;
- UI changes;
- workflow changes;
- formatting baseline cleanup.

## 26. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged Product Data Model Authority Review Gate.
- Merged Product Data Model and Migration Planning Gate.
- Merged Product Persistence Strategy Decision Gate.
- Accepted OpenAPI authority file.
- Accepted product routes.
- Accepted product schema references.
- Existing direct `pg` planning direction.
- Existing non-authorization of implementation.

### Outputs

- ProductStatus enum inventoried.
- StockStatus enum inventoried.
- Product schema inventoried.
- CreateProductRequest schema inventoried.
- UpdateProductRequest schema inventoried.
- ProductResponse schema inventoried.
- ProductListResponse schema inventoried.
- Response-only fields identified.
- Client-writable fields identified.
- Validation planning implications identified.
- Persistence planning implications identified.
- Product SQL Data Model and Migration Strategy Decision Gate selected as next gate.

### Gaps

- SQL table naming unresolved.
- SQL column mapping unresolved.
- Nullable column strategy unresolved.
- Enum storage strategy unresolved.
- Timestamp source unresolved.
- Version generation strategy unresolved.
- Migration approach unresolved.
- Repository API contract unresolved.
- Transaction boundary unresolved.
- Idempotency storage unresolved.
- Audit storage unresolved.
- Test database lifecycle unresolved.
- Explicit implementation authorization unresolved.

### Transition Decision

GO to `Backend Slice 0 Product SQL Data Model and Migration Strategy Decision Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
