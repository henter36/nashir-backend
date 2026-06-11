# Nashir Backend Slice 0 — Product SQL Data Model and Migration Strategy Decision Gate

## 1. Gate Classification

Gate type: Documentation-only product SQL data model and migration strategy decision gate.

This gate decides the future SQL data model and migration strategy for product persistence planning.

This gate does not authorize implementation.

This gate does not authorize SQL file creation.

This gate does not authorize DB table creation.

This gate does not authorize migration creation.

This gate does not authorize migration execution.

This gate does not authorize repository implementation.

This gate does not authorize route implementation.

This gate does not authorize controller, service, ORM adoption, generated clients, OpenAPI mutation, validation script modification, package script modification, CI workflow modification, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #98: `docs: inventory product schema fields`.
- Merged PR #97: `docs: review product data model authority`.
- Merged PR #96: `docs: plan product data model and migrations`.
- Merged PR #95: `docs: decide product persistence strategy`.
- Merged PR #94: `docs: plan product route implementation boundary`.
- Accepted OpenAPI authority repository: `henter36/nashir`.
- Accepted CI-active Backend Slice 0 authority pin: `36da9ed31903562bddfb7ffd669841956e334a51`.
- Accepted OpenAPI authority file: `docs/nashir_v1_openapi.yaml`.
- Accepted direct `pg` persistence planning direction.
- Accepted product schema field inventory.
- Existing non-authorization of implementation.

## 3. Decision Objective

This gate must decide:

- product SQL table naming strategy;
- product SQL column mapping strategy;
- nullable field strategy;
- enum storage strategy;
- timestamp source strategy;
- product version strategy;
- migration style strategy;
- migration file location planning;
- local/test database lifecycle planning needs;
- whether route implementation becomes eligible after this gate.

This gate must not create SQL.

This gate must not create migration files.

This gate must not modify package scripts.

This gate must not modify CI workflows.

## 4. Product Table Strategy Decision

Decision: Future product persistence should use a single workspace-owned product table for the product catalog record.

Candidate future table name:

`products`

Status:

Candidate planning name only.

Rationale:

- The OpenAPI authority exposes a Product resource.
- Product records are workspace-scoped.
- Product writes and reads operate on product identity under workspace context.
- A single product table is sufficient for V1 product catalog metadata planning.
- Product assets, campaign content, audit events, idempotency records, and workspace membership are separate concerns.

This gate does not create a table.

This gate does not authorize the table name in SQL.

## 5. Product Column Mapping Strategy Decision

Decision: Future SQL planning should map the accepted product schema inventory to explicit product storage fields.

Candidate conceptual mapping:

| Authority field | Candidate SQL field | Strategy |
|---|---|---|
| `productId` | `product_id` | Product identity. |
| `workspaceId` | `workspace_id` | Workspace ownership. |
| `name` | `name` | Required display name. |
| `category` | `category` | Optional nullable text. |
| `price` | `price` | Optional nullable numeric. |
| `sku` | `sku` | Optional nullable text. |
| `stockStatus` | `stock_status` | Optional nullable enum/text strategy. |
| `imageUrl` | `image_url` | Optional nullable URI text. |
| `videoUrl` | `video_url` | Optional nullable URI text. |
| `description` | `description` | Optional nullable text. |
| `status` | `status` | Required ProductStatus. |
| `createdAt` | `created_at` | Required timestamp. |
| `updatedAt` | `updated_at` | Required timestamp. |
| `version` | `version` | Required optimistic concurrency token. |
| `readiness` | not stored in product table for this slice | Deferred advisory/system field. |

Status:

Planning only.

No SQL column names are authorized by this gate.

## 6. Readiness Field Decision

Decision: `readiness` should not be included in the first product SQL table plan for Backend Slice 0 product persistence.

Reason:

- `readiness` appears as an optional Product response field.
- `readiness` is not present in `CreateProductRequest`.
- `readiness` is not present in `UpdateProductRequest`.
- The Readiness description is advisory and does not execute publishing, connectors, or AI.
- Storing readiness requires separate readiness generation/source-of-truth decisions.

Future options:

- omit `readiness` from initial persisted product rows and return no readiness field where absent;
- compute or join readiness later after an explicit readiness persistence/source gate.

This gate does not implement readiness behavior.

## 7. Nullable Field Strategy Decision

Decision: Optional nullable response fields should be planned as nullable persistence fields where stored.

Applies to:

- `category`;
- `price`;
- `sku`;
- `imageUrl`;
- `videoUrl`;
- `description`;
- optionally `stockStatus`, if future SQL planning stores absent stock status as null.

Rationale:

The Product response schema allows null for several optional metadata fields.

Create and update requests use optional fields, not explicit null fields.

Unresolved:

- whether create/update should allow clearing optional fields with null;
- whether absent and null should be treated differently;
- whether patch-like update semantics are required for PUT behavior.

This gate does not decide request null-clearing behavior.

## 8. Enum Storage Strategy Decision

Decision: Product enum fields should be planned as constrained text values for V1, not PostgreSQL enum types.

Applies to:

- `ProductStatus`;
- `StockStatus`.

Rationale:

- Direct `pg` is the accepted planning direction.
- PostgreSQL enum types are harder to evolve across migrations.
- Text plus check constraints can preserve authority values while allowing future migration changes more simply.
- OpenAPI remains the authority for accepted values.

Candidate future constraints:

- `status` values limited to `draft`, `active`, `archived`.
- `stock_status` values limited to `available`, `limited`, `out_of_stock`, `unknown`, or null if absent.

This gate does not create constraints.

## 9. Price Storage Strategy Decision

Decision: Product `price` requires a decimal/numeric persistence strategy, not floating-point storage.

Rationale:

- OpenAPI declares `price` as number with minimum 0.
- Prices should not be stored using binary floating-point types.

Candidate future strategy:

- use a decimal/numeric type;
- preserve minimum 0 validation at application and/or database constraint level.

Unresolved:

- precision and scale;
- currency field absence;
- whether V1 product price is a simple metadata value only.

This gate does not define numeric precision.

## 10. Timestamp Source Strategy Decision

Decision: Future product persistence should use database-generated timestamps for `createdAt` and `updatedAt` where practical.

Rationale:

- `createdAt` and `updatedAt` are server-controlled response fields.
- `updatedAfter` query support depends on reliable persisted update timestamps.
- Database timestamps reduce application clock drift.

Candidate future behavior:

- `created_at` set on insert.
- `updated_at` set on insert and update.
- `updated_at` supports list filtering and sort planning.

Unresolved:

- trigger versus explicit SQL update expression;
- timezone type choice;
- serialization format in API responses.

This gate does not implement timestamp behavior.

## 11. Version Strategy Decision

Decision: Future product persistence requires a server-managed `version` field for optimistic concurrency.

Rationale:

- `Product` includes required `version`.
- `updateProduct` requires optimistic concurrency through `If-Match` or `X-Resource-Version`.
- Version must not be client-writable in request bodies.

Candidate future strategy:

- store a version token in the product row;
- initialize version on insert;
- change version on successful update;
- compare supplied header against stored version before update;
- return 409 on version mismatch.

Unresolved:

- integer revision versus opaque string token;
- ETag formatting;
- whether `If-Match` and `X-Resource-Version` accept the same token format.

This gate does not implement version behavior.

## 12. Product Identity Strategy Decision

Decision: Future product persistence should use server-generated product identity.

Rationale:

- `productId` is required in `Product`.
- `productId` is path identity for get/update.
- `productId` is absent from create/update request bodies.
- Product names are display-only and not identity.

Candidate future strategy:

- application-generated opaque ID, or database-generated opaque ID;
- stable string identity exposed as `productId`.

Unresolved:

- exact ID generator;
- ID prefix strategy, if any;
- UUID versus custom opaque string.

This gate does not select an ID generator.

## 13. Workspace Ownership Strategy Decision

Decision: Future product SQL planning must include workspace ownership at the persistence boundary.

Rationale:

- `workspaceId` is required in `Product`.
- `workspaceId` is path-derived.
- all product routes are workspace-scoped.
- product lookup must not rely on `productId` alone.

Candidate future strategy:

- every product row stores workspace ownership;
- all read and write queries require `workspace_id`;
- uniqueness and lookup strategy must preserve workspace isolation.

Unresolved:

- global uniqueness of `product_id` versus composite uniqueness under workspace;
- foreign key target for workspace when workspace persistence is later defined.

This gate does not create foreign keys.

## 14. Candidate Index Planning

Decision: Future implementation planning should consider indexes, but this gate does not authorize index creation.

Candidate future indexes:

- lookup by `workspace_id` and `product_id`;
- list by `workspace_id`;
- filter by `workspace_id` and `status`;
- filter/sort by `workspace_id` and `updated_at`;
- optional SKU lookup only if a future product policy requires it.

This gate does not create indexes.

## 15. Migration Style Strategy Decision

Decision: Future migration planning should use plain SQL migration files unless a later gate explicitly authorizes a migration tool.

Rationale:

- No ORM is accepted.
- No migration tool is accepted.
- Direct `pg` is the accepted persistence planning direction.
- Plain SQL is transparent for review.

Candidate future migration location:

`migrations/`

Candidate future naming pattern:

`YYYYMMDDHHMMSS_product_catalog.sql`

Status:

Candidate only.

This gate does not create a `migrations/` directory.

This gate does not create migration files.

## 16. Migration Execution Strategy Decision

Decision: Migration execution remains unresolved and not authorized.

Unresolved decisions:

- migration runner ownership;
- package script names;
- CI validation behavior;
- local DB setup;
- test DB setup;
- rollback policy;
- environment safety checks.

Therefore, implementation remains blocked.

This gate does not add package scripts.

This gate does not modify CI.

## 17. Idempotency Storage Strategy Dependency

Decision: Product SQL data model planning is not sufficient for `createProduct` implementation.

Reason:

`createProduct` requires `Idempotency-Key`.

Future idempotency planning must decide:

- idempotency table/storage;
- workspace scoping;
- request fingerprinting;
- replay behavior;
- conflict behavior;
- retention policy;
- transaction boundary with product insert.

This gate does not implement idempotency persistence.

## 18. Audit Storage Strategy Dependency

Decision: Product SQL data model planning is not sufficient for product write implementation.

Reason:

`createProduct` and `updateProduct` require audit behavior.

Future audit planning must decide:

- audit event storage;
- actor ID capture;
- workspace ID capture;
- product ID capture;
- action names;
- before/after state policy;
- failure policy;
- retention policy.

This gate does not implement audit persistence.

## 19. Test Database Strategy Dependency

Decision: Product SQL data model planning is not sufficient for implementation until test database strategy is decided.

Future test DB planning must decide:

- real PostgreSQL versus containerized PostgreSQL;
- local-only versus CI-supported DB;
- migration application in tests;
- test data reset strategy;
- secrets and environment handling.

This gate does not modify tests or CI.

## 20. Product Route Eligibility Decision

Decision: Product route implementation remains NOT ELIGIBLE after this gate.

Reason:

The following remain unresolved:

- migration runner strategy;
- migration execution command;
- actual migration file;
- product repository API contract;
- idempotency storage;
- audit storage;
- transaction boundary;
- test database lifecycle;
- implementation authorization.

## 21. Candidate Next Paths

### Option A — Product Migration Runner and Test DB Strategy Gate

Decision: SELECTED.

Reason:

Before implementation, the project must decide how migrations are executed and how persistence is tested.

### Option B — Direct SQL Migration Implementation

Decision: NO-GO.

Reason:

SQL and migration creation remain unauthorized.

### Option C — Product Repository Implementation

Decision: NO-GO.

Reason:

Repository implementation needs migration and test DB strategy first.

### Option D — Product Route Implementation

Decision: NO-GO.

Reason:

Routes remain blocked by persistence implementation, migrations, repository, idempotency, audit, and tests.

## 22. Selected Next Path

Selected next path:

`Backend Slice 0 Product Migration Runner and Test DB Strategy Gate`

This selected path is documentation-only.

It must decide:

- whether a migration runner is needed;
- whether package scripts can be proposed later;
- how local DB and test DB lifecycle should work;
- whether CI DB integration is required;
- what remains blocking before implementation.

It must not implement a migration runner.

It must not create migration files.

It must not modify package scripts.

It must not modify CI workflow files.

It must not implement repositories or routes.

## 23. Risk Review

### 23.1 Premature SQL Risk

Risk:

SQL planning may be mistaken as authorization to create SQL files.

Mitigation:

State explicit NO-GO for SQL implementation and migration files.

### 23.2 Schema Drift Risk

Risk:

Future SQL may include fields outside OpenAPI authority.

Mitigation:

Use the accepted Product Schema Field Inventory Gate as the source of mapping.

### 23.3 Enum Rigidity Risk

Risk:

PostgreSQL enum types may make future enum changes more costly.

Mitigation:

Prefer constrained text strategy for V1 planning.

### 23.4 Workspace Isolation Risk

Risk:

Product lookup may be implemented without workspace ownership.

Mitigation:

Require all product persistence access to include workspace ownership.

### 23.5 Test Coverage Risk

Risk:

Persistence implementation may start without a test database lifecycle.

Mitigation:

Require migration runner and test DB strategy gate before implementation.

## 24. Final Decision

Decision: GO to Backend Slice 0 Product Migration Runner and Test DB Strategy Gate.

This decision accepts a documentation-only SQL data model and migration strategy.

This decision keeps product route implementation blocked.

This decision keeps SQL implementation blocked.

This decision keeps migration creation blocked.

This decision does not authorize implementation.

This decision does not authorize route implementation.

This decision does not authorize controller implementation.

This decision does not authorize service implementation.

This decision does not authorize repository implementation.

This decision does not authorize SQL file creation.

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

## 25. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Product Migration Runner and Test DB Strategy Gate`

That gate should decide how migration execution and persistence testing will be handled before any implementation authorization gate.

## 26. Explicit Non-Authorization

This product SQL data model and migration strategy decision gate does not authorize:

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

## 27. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged Product Schema Field Inventory Gate.
- Merged Product Data Model Authority Review Gate.
- Merged Product Data Model and Migration Planning Gate.
- Merged Product Persistence Strategy Decision Gate.
- Merged Product Route Implementation Boundary Planning Gate.
- Accepted OpenAPI product schema inventory.
- Existing direct `pg` planning direction.
- Existing non-authorization of implementation.

### Outputs

- Candidate product table strategy selected.
- Candidate field mapping strategy selected.
- Readiness field deferred from initial product table plan.
- Nullable field strategy selected.
- Text/check enum strategy selected.
- Decimal/numeric price strategy selected.
- Database timestamp strategy selected.
- Server-managed version strategy selected.
- Server-generated product identity strategy selected.
- Workspace ownership persistence strategy selected.
- Plain SQL migration planning direction selected.
- Migration execution remains unresolved.
- Product Migration Runner and Test DB Strategy Gate selected as next gate.

### Gaps

- Actual SQL migration unresolved.
- Migration runner unresolved.
- Migration execution command unresolved.
- Test DB lifecycle unresolved.
- Product repository API contract unresolved.
- Idempotency storage unresolved.
- Audit storage unresolved.
- Transaction boundary unresolved.
- Explicit implementation authorization unresolved.

### Transition Decision

GO to `Backend Slice 0 Product Migration Runner and Test DB Strategy Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
