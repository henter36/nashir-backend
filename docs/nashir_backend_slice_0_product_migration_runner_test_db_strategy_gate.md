# Nashir Backend Slice 0 — Product Migration Runner and Test DB Strategy Gate

## 1. Gate Classification

Gate type: Documentation-only product migration runner and test database strategy gate.

This gate decides the future migration runner and test database strategy for product persistence.

This gate does not authorize implementation.

This gate does not authorize SQL file creation.

This gate does not authorize DB table creation.

This gate does not authorize migration creation.

This gate does not authorize migration execution.

This gate does not authorize migration runner implementation.

This gate does not authorize package script modification.

This gate does not authorize CI workflow modification.

This gate does not authorize repository implementation.

This gate does not authorize route implementation.

This gate does not authorize controller, service, ORM adoption, generated clients, OpenAPI mutation, validation script modification, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #99: `docs: decide product sql data model strategy`.
- Merged PR #98: `docs: inventory product schema fields`.
- Merged PR #97: `docs: review product data model authority`.
- Merged PR #96: `docs: plan product data model and migrations`.
- Merged PR #95: `docs: decide product persistence strategy`.
- Merged PR #94: `docs: plan product route implementation boundary`.
- Accepted OpenAPI authority repository: `henter36/nashir`.
- Accepted CI-active Backend Slice 0 authority pin: `36da9ed31903562bddfb7ffd669841956e334a51`.
- Accepted OpenAPI authority file: `docs/nashir_v1_openapi.yaml`.
- Accepted direct `pg` persistence planning direction.
- Accepted product SQL data model and migration strategy decision.
- Existing non-authorization of implementation.

## 3. Decision Objective

This gate must decide:

- whether a migration runner is needed;
- whether the migration runner should use existing `pg`;
- whether new migration dependencies are needed;
- future migration file location;
- future migration metadata tracking;
- future migration execution command shape;
- local database strategy;
- test database strategy;
- CI database strategy;
- what remains blocking before implementation.

This gate must not implement a migration runner.

This gate must not create SQL migration files.

This gate must not add package scripts.

This gate must not modify CI workflows.

## 4. Migration Runner Need Decision

Decision: A migration runner is required before product persistence implementation.

Rationale:

- Product persistence requires future DB schema changes.
- Manual ad-hoc SQL execution is not reviewable enough for the backend implementation path.
- A migration runner provides repeatable local, test, and future CI behavior.
- Direct `pg` is already the accepted persistence direction.
- No ORM is accepted for this slice.

This decision is planning-only.

This gate does not implement the migration runner.

## 5. Migration Runner Dependency Decision

Decision: Future migration runner implementation should use the existing `pg` dependency and plain SQL files.

Decision: No new migration framework dependency is selected for this slice.

Rejected for this slice unless separately authorized:

- Prisma migrations;
- Knex migrations;
- TypeORM migrations;
- Drizzle migrations;
- Sequelize migrations;
- ORM adoption through migration tooling.

Rationale:

- Direct `pg` was already selected as the V1 product persistence direction.
- Plain SQL migrations remain transparent and reviewable.
- Adding a migration framework would expand dependency and governance scope.
- Migration logic can be implemented later using existing runtime dependencies.

This gate does not add dependencies.

## 6. Migration File Strategy Decision

Decision: Future migration files should be plain SQL files.

Candidate future directory:

`migrations/`

Candidate future naming convention:

`YYYYMMDDHHMMSS_<short_description>.sql`

Candidate future product migration example:

`YYYYMMDDHHMMSS_create_products.sql`

Status:

Candidate only.

This gate does not create the `migrations/` directory.

This gate does not create migration files.

This gate does not authorize SQL implementation.

## 7. Migration Metadata Strategy Decision

Decision: Future migration execution requires a migration metadata table.

Candidate future table:

`schema_migrations`

Candidate conceptual fields:

- migration identifier;
- migration filename;
- checksum or content hash;
- applied timestamp;
- execution duration or status, if needed.

Status:

Planning only.

Rationale:

- The runner must know which migrations already ran.
- Repeatability requires tracking applied migrations.
- Checksum strategy helps detect edited migrations after application.

This gate does not create metadata tables.

## 8. Migration Direction Decision

Decision: Future V1 migration planning should start with forward-only migrations.

Rationale:

- Product persistence is not yet implemented.
- Forward-only migration policy is simpler and safer for early V1.
- Rollback strategy can be a later operational decision before production deployment.

Unresolved:

- whether down migrations are required before production;
- whether rollback is handled by restore/redeploy procedure;
- whether destructive migrations require separate approval.

This gate does not implement rollback behavior.

## 9. Migration Execution Command Planning

Decision: Future package scripts are likely needed, but not authorized by this gate.

Candidate future commands:

- `pnpm run migrate:status`
- `pnpm run migrate:up`
- `pnpm run migrate:test`

Status:

Candidate only.

This gate does not modify `package.json`.

This gate does not add scripts.

This gate does not add migration runner files.

## 10. Environment Variable Strategy Decision

Decision: Future migration execution should use explicit database connection environment variables.

Candidate future environment variables:

- `DATABASE_URL`
- `TEST_DATABASE_URL`

Status:

Candidate only.

Rules:

- secrets must not be committed;
- production URLs must not be used in local/test commands;
- test DB connection must be separate from development DB connection;
- CI DB secrets or service configuration require later authorization.

This gate does not add `.env` files.

This gate does not add secrets.

## 11. Local Database Strategy Decision

Decision: Future product persistence development requires a real local PostgreSQL database.

Rationale:

- Product persistence uses PostgreSQL through `pg`.
- SQL schema, constraints, timestamps, versioning, transactions, and future queries need real PostgreSQL behavior.
- Mock-only tests cannot validate migration behavior.

Candidate local strategy:

- developer-provided PostgreSQL instance;
- future documented local `DATABASE_URL`;
- future migration runner applies migrations to local DB;
- no local DB setup is implemented by this gate.

This gate does not add Docker Compose.

This gate does not add local database scripts.

## 12. Test Database Strategy Decision

Decision: Future persistence tests should run against a real PostgreSQL test database.

Rationale:

- Product SQL behavior must be verified against actual PostgreSQL semantics.
- Direct `pg` repository implementation must be testable with real queries.
- Transactions, uniqueness, nullable fields, timestamps, and version checks need database-backed tests.

Candidate test DB strategy:

- separate test database configured by `TEST_DATABASE_URL`;
- migrations applied before persistence tests;
- test data isolated per test file or per test transaction;
- cleanup strategy must be explicit before implementation.

This gate does not add test DB setup.

This gate does not add persistence tests.

## 13. CI Database Strategy Decision

Decision: CI database integration is required before merging future product persistence implementation.

Rationale:

- A repository implementation without CI-backed DB tests would be unsafe.
- Future migration runner and repository tests need repeatable CI validation.
- Current CI validates contract authority, lint, typecheck, and tests, but does not yet require a PostgreSQL service for product persistence.

Candidate future CI strategy:

- add PostgreSQL service to CI;
- set `TEST_DATABASE_URL` for test jobs;
- run migrations before DB-backed tests;
- keep contract authority validation unchanged.

Status:

Future authorization required.

This gate does not modify CI workflows.

## 14. Migration Runner Safety Decision

Decision: Future migration runner must include environment safety checks.

Future safety requirements:

- refuse empty database URL;
- identify target database before applying migrations;
- prevent accidental production migration execution from local commands;
- avoid logging secrets;
- fail on checksum mismatch;
- fail on partially applied migrations;
- fail on migration ordering conflicts.

This gate does not implement safety checks.

## 15. Test Isolation Strategy Decision

Decision: Future DB-backed tests require explicit isolation.

Candidate future approaches:

- transaction rollback per test;
- schema reset per test file;
- database truncation between tests;
- isolated test database per CI run.

Decision:

Do not select exact isolation mechanism yet.

Reason:

The repository API and transaction boundary are not yet planned.

This gate does not implement test isolation.

## 16. Product Migration Scope Decision

Decision: Future first product migration should be limited to product persistence prerequisites only.

Allowed conceptual future scope:

- product storage;
- product workspace ownership;
- product status and stock status values;
- product timestamps;
- product version;
- migration metadata tracking if runner implementation requires it.

Excluded from first product migration unless separately authorized:

- idempotency table;
- audit events table;
- workspace membership tables;
- route implementation;
- seed data;
- generated clients;
- UI changes.

This gate does not create the migration.

## 17. Idempotency Dependency Decision

Decision: Product migration runner and test DB strategy are not sufficient for `createProduct` implementation.

Reason:

`createProduct` requires idempotency behavior.

Future idempotency planning must decide:

- idempotency storage table;
- request fingerprint;
- replay behavior;
- conflict behavior;
- retention policy;
- transaction boundary with product creation.

This gate does not implement idempotency.

## 18. Audit Dependency Decision

Decision: Product migration runner and test DB strategy are not sufficient for product write implementation.

Reason:

`createProduct` and `updateProduct` require audit behavior.

Future audit planning must decide:

- audit storage;
- actor capture;
- workspace capture;
- product capture;
- event names;
- before/after state policy;
- failure audit behavior.

This gate does not implement audit storage.

## 19. Transaction Boundary Dependency Decision

Decision: Product persistence implementation remains blocked until transaction boundaries are planned.

Future transaction planning must cover:

- product create;
- product update;
- idempotency write/replay;
- audit event write;
- optimistic concurrency check;
- rollback behavior.

This gate does not implement transactions.

## 20. Repository API Dependency Decision

Decision: Product persistence implementation remains blocked until the repository API contract is planned.

Future repository planning must define:

- list products by workspace;
- get product by workspace and product ID;
- create product under workspace;
- update product under workspace with version check;
- return not-found without cross-workspace leakage;
- map database conflicts to approved error behavior;
- avoid exposing raw SQL/database errors.

This gate does not implement repositories.

## 21. Product Route Eligibility Decision

Decision: Product route implementation remains NOT ELIGIBLE after this gate.

Reason:

The following remain unresolved:

- migration runner implementation authorization;
- actual migration files;
- package script authorization;
- CI PostgreSQL service authorization;
- product repository API contract;
- idempotency storage;
- audit storage;
- transaction boundary;
- route/controller/service implementation authorization.

## 22. Candidate Next Paths

### Option A — Product Repository API and Transaction Boundary Planning Gate

Decision: SELECTED.

Reason:

After deciding migration runner and test DB strategy, the next non-implementation blocker is the repository API and transaction boundary needed by product persistence.

### Option B — Migration Runner Implementation

Decision: NO-GO.

Reason:

This gate does not authorize implementation, scripts, CI changes, or migration files.

### Option C — Product SQL Migration Implementation

Decision: NO-GO.

Reason:

Actual SQL migration creation remains unauthorized.

### Option D — Product Route Implementation

Decision: NO-GO.

Reason:

Routes remain blocked by repository API, transaction boundary, idempotency, audit, and implementation authorization.

## 23. Selected Next Path

Selected next path:

`Backend Slice 0 Product Repository API and Transaction Boundary Planning Gate`

This selected path is documentation-only.

It must decide:

- repository method boundaries;
- input/output shapes;
- transaction boundaries;
- error mapping expectations;
- workspace scoping requirements;
- how idempotency and audit dependencies are handed off.

It must not implement repositories.

It must not implement routes.

It must not create migrations.

It must not modify package scripts.

It must not modify CI workflow files.

## 24. Risk Review

### 24.1 Premature Migration Runner Risk

Risk:

The migration runner decision may be mistaken as authorization to create runner code.

Mitigation:

State explicit NO-GO for runner implementation.

### 24.2 Premature SQL Risk

Risk:

Plain SQL migration strategy may be mistaken as permission to create migration files.

Mitigation:

State explicit NO-GO for SQL file creation and migration creation.

### 24.3 Test Gap Risk

Risk:

Persistence implementation may start without a real PostgreSQL test lifecycle.

Mitigation:

Require test DB strategy and future CI DB authorization before implementation.

### 24.4 Dependency Drift Risk

Risk:

A migration framework or ORM may be introduced without approval.

Mitigation:

Reject new migration framework dependencies and ORM adoption unless separately authorized.

### 24.5 Secret Exposure Risk

Risk:

Database URLs or credentials may be committed.

Mitigation:

Require environment-only configuration and explicit secrets handling later.

## 25. Final Decision

Decision: GO to Backend Slice 0 Product Repository API and Transaction Boundary Planning Gate.

This decision accepts a documentation-only migration runner and test DB strategy.

This decision keeps migration runner implementation blocked.

This decision keeps SQL implementation blocked.

This decision keeps migration creation blocked.

This decision keeps package script changes blocked.

This decision keeps CI workflow changes blocked.

This decision keeps product route implementation blocked.

This decision does not authorize implementation.

This decision does not authorize route implementation.

This decision does not authorize controller implementation.

This decision does not authorize service implementation.

This decision does not authorize repository implementation.

This decision does not authorize SQL file creation.

This decision does not authorize DB table creation.

This decision does not authorize migration creation.

This decision does not authorize migration execution.

This decision does not authorize migration runner implementation.

This decision does not authorize ORM adoption.

This decision does not authorize package dependency changes.

This decision does not authorize package script changes.

This decision does not authorize CI workflow changes.

This decision does not authorize OpenAPI mutation.

This decision does not authorize generated client changes.

This decision does not authorize deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 26. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Product Repository API and Transaction Boundary Planning Gate`

That gate should decide repository boundaries and transaction behavior before any product persistence implementation authorization.

## 27. Explicit Non-Authorization

This product migration runner and test DB strategy gate does not authorize:

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
- migration runner implementation;
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

## 28. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged Product SQL Data Model and Migration Strategy Decision Gate.
- Merged Product Schema Field Inventory Gate.
- Merged Product Data Model Authority Review Gate.
- Merged Product Data Model and Migration Planning Gate.
- Merged Product Persistence Strategy Decision Gate.
- Merged Product Route Implementation Boundary Planning Gate.
- Existing direct `pg` planning direction.
- Existing non-authorization of implementation.

### Outputs

- Migration runner need decided.
- Existing `pg` dependency selected for future runner planning.
- New migration framework dependency rejected.
- Plain SQL migration file strategy selected.
- Migration metadata strategy selected.
- Forward-only migration direction selected for V1 planning.
- Local PostgreSQL strategy selected.
- Real PostgreSQL test DB strategy selected.
- Future CI PostgreSQL requirement identified.
- Migration execution remains unauthorized.
- Product Repository API and Transaction Boundary Planning Gate selected as next gate.

### Gaps

- Migration runner implementation unresolved.
- Actual migration files unresolved.
- Package scripts unresolved.
- CI PostgreSQL service unresolved.
- Product repository API contract unresolved.
- Transaction boundary unresolved.
- Idempotency storage unresolved.
- Audit storage unresolved.
- Explicit implementation authorization unresolved.

### Transition Decision

GO to `Backend Slice 0 Product Repository API and Transaction Boundary Planning Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
