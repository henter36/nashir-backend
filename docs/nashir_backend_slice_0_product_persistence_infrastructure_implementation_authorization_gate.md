# Nashir Backend Slice 0 — Product Persistence Infrastructure Implementation Authorization Gate

## 1. Gate Classification

Gate type: Documentation-only implementation authorization gate.

This gate authorizes a future narrow implementation slice only after this gate is merged.

This gate does not itself implement code.

This gate does not itself create SQL files.

This gate does not itself modify package scripts.

This gate does not itself modify CI workflows.

This gate does not itself implement routes, controllers, services, repositories, idempotency repository, or audit repository.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged Product Persistence Implementation Authorization Readiness Gate.
- Merged Product Idempotency and Audit Storage Strategy Gate.
- Merged Product Repository API and Transaction Boundary Planning Gate.
- Merged Product Migration Runner and Test DB Strategy Gate.
- Merged Product SQL Data Model and Migration Strategy Decision Gate.
- Merged Product Schema Field Inventory Gate.
- Merged Product Data Model Authority Review Gate.
- Merged Product Data Model and Migration Planning Gate.
- Merged Product Persistence Strategy Decision Gate.
- Merged Product Route Implementation Boundary Planning Gate.
- Merged Permission Guard Error Disclosure Mapping Decision Gate.
- Merged Permission Representation Decision Gate.
- Merged Product Route Inventory Review Gate.
- Accepted OpenAPI authority repository: `henter36/nashir`.
- Accepted CI-active Backend Slice 0 authority pin: `36da9ed31903562bddfb7ffd669841956e334a51`.
- Existing direct `pg` planning direction.
- Existing backend runtime and guard harness state.
- Existing non-authorization of routes and repositories.

## 3. Authorization Objective

This gate must decide whether to authorize the first backend implementation slice for product persistence infrastructure.

This gate authorizes only infrastructure needed before repositories and routes.

This gate does not authorize product route implementation.

This gate does not authorize product repository implementation.

This gate does not authorize product service/use-case implementation.

## 4. Implementation Authorization Decision

Decision: GO to Product Persistence Infrastructure Implementation Execution.

This gate authorizes a future implementation PR limited to persistence infrastructure.

Authorized future implementation slice:

`Backend Slice 0 Product Persistence Infrastructure Implementation Execution`

This authorization becomes valid only after this gate is merged.

## 5. Authorized Implementation Scope

The future implementation PR may include only:

- migration runner implementation using existing `pg`;
- migration metadata tracking;
- plain SQL migration files;
- product table migration;
- idempotency records table migration;
- audit events table migration;
- migration status/up execution scripts;
- test database helper setup;
- DB-backed migration tests;
- package scripts directly required for migration execution/status/testing;
- CI PostgreSQL service and environment wiring required for DB-backed tests;
- documentation updates directly tied to this implementation slice.

No other implementation is authorized.

## 6. Authorized Candidate Files

The future implementation PR may add or modify only files within these categories:

### Migration runner and scripts

Candidate allowed files:

- `scripts/migrate.mjs`
- `scripts/run-migrations.mjs`
- `scripts/migration-status.mjs`

Only one runner naming path should be selected during execution.

### Migrations

Candidate allowed files:

- `migrations/*.sql`

### Test helpers and tests

Candidate allowed files:

- `tests/helpers/test-db.ts`
- `tests/migrations.test.ts`
- `tests/migration-runner.test.ts`

Exact filenames may differ if the implementation PR clearly explains the reason.

### Package configuration

Candidate allowed file:

- `package.json`

Allowed package.json changes:

- add migration-related scripts only;
- no unrelated dependency changes;
- no formatting baseline cleanup.

### CI workflow

Candidate allowed file:

- `.github/workflows/ci.yml`

Allowed CI changes:

- add PostgreSQL service;
- set `TEST_DATABASE_URL`;
- run DB-backed migration tests;
- preserve existing contract authority validation, lint, typecheck, and tests.

### Documentation

Candidate allowed files:

- docs directly explaining the implemented migration runner/test DB behavior.

## 7. Dependency Authorization Decision

Decision: Use existing `pg`.

No new migration framework is authorized.

Not authorized:

- Prisma;
- Knex;
- TypeORM;
- Drizzle;
- Sequelize;
- ORM adoption;
- new migration framework dependency.

A new dependency may not be added unless a later gate explicitly authorizes it.

## 8. Migration Runner Authorization

Authorized:

- implement a project-local migration runner;
- use existing `pg`;
- read SQL files in deterministic order;
- track applied migrations;
- fail on duplicate migration identifiers;
- fail on checksum mismatch;
- fail on failed migration execution;
- avoid logging secrets.

Not authorized:

- production deployment migration automation;
- external migration framework adoption;
- destructive migration automation beyond explicitly reviewed SQL;
- migration execution against unverified production targets.

## 9. Migration Metadata Authorization

Authorized:

- create migration metadata storage through SQL migration.

Candidate table:

`schema_migrations`

Candidate fields:

- migration identifier;
- migration filename;
- checksum;
- applied timestamp.

The implementation may adjust exact names if the PR explains the mapping.

Not authorized:

- unrelated metadata tables;
- workspace membership tables;
- seed data tables.

## 10. Product Table Migration Authorization

Authorized:

- create initial product persistence table.

Candidate table:

`products`

The migration may include fields required by accepted product schema planning:

- product identity;
- workspace identity;
- name;
- category;
- price;
- sku;
- stock status;
- image URL;
- video URL;
- description;
- status;
- created timestamp;
- updated timestamp;
- version.

Not authorized:

- readiness persistence;
- generated client types;
- route handlers;
- seed products.

## 11. Idempotency Table Migration Authorization

Authorized:

- create initial idempotency persistence table.

Candidate table:

`idempotency_records`

The migration may include fields needed to support future createProduct idempotency planning:

- workspace identity;
- actor identity;
- operation name;
- idempotency key;
- request fingerprint;
- status;
- response reference or replay data;
- timestamps;
- expiry concept if selected in execution.

Not authorized:

- idempotency repository implementation;
- HTTP idempotency middleware;
- route handler logic;
- idempotency cleanup job unless separately authorized.

## 12. Audit Table Migration Authorization

Authorized:

- create initial audit event persistence table.

Candidate table:

`audit_events`

The migration may include fields needed to support future product write audit planning:

- audit event identity;
- actor identity;
- workspace identity;
- resource type;
- product identity;
- action name;
- before state;
- after state;
- created timestamp;
- request correlation if already available in request context.

Not authorized:

- audit repository implementation;
- async audit pipeline;
- audit dashboards;
- audit export;
- audit retention jobs.

## 13. Package Script Authorization

Authorized package scripts must be limited to migration/test DB lifecycle.

Candidate scripts:

- `db:migrate`
- `db:migrate:status`
- `db:migrate:test`
- `test:db`

Exact script names may differ if justified.

Not authorized:

- broad formatting scripts;
- deployment scripts;
- production migration scripts;
- generated client scripts;
- unrelated build changes.

## 14. CI Authorization

Authorized:

- add PostgreSQL service to CI;
- set test database environment variables;
- run migration tests;
- preserve existing Validate backend behavior;
- preserve contract authority validation;
- preserve lint, typecheck, and unit test checks.

Not authorized:

- deployment workflows;
- secrets changes beyond test DB env values;
- production environment configuration;
- unrelated workflow restructuring.

## 15. Test Authorization

Authorized tests:

- migration runner unit tests;
- migration ordering tests;
- migration metadata tests;
- migration application tests against PostgreSQL;
- test DB connection validation;
- schema existence checks after migration.

Not authorized tests:

- product route tests;
- product repository tests;
- idempotency repository tests;
- audit repository tests;
- controller/service tests.

Those tests require later implementation authorization.

## 16. Environment Safety Requirements

The future implementation must include safeguards:

- refuse missing database URL;
- avoid logging full database URL;
- fail on checksum mismatch;
- fail on unknown migration state;
- fail on migration execution errors;
- separate test DB from local/dev DB;
- avoid committing secrets;
- document required local environment variables.

Production migration execution remains out of scope.

## 17. Transaction Requirements

The future migration runner should run each migration in a transaction where PostgreSQL permits.

If a migration cannot run transactionally, the implementation PR must explicitly document why.

This authorization does not cover product write transactions.

Product write transactions require later service/use-case implementation authorization.

## 18. Non-Authorized Runtime Scope

The future implementation PR must not include:

- product route handlers;
- Fastify route registration for product endpoints;
- product controllers;
- product services;
- product repositories;
- idempotency repositories;
- audit repositories;
- request validation wiring for product endpoints;
- permission guard changes;
- auth guard changes;
- workspace context guard changes;
- OpenAPI changes;
- generated clients.

## 19. Product Route Eligibility Decision

Decision: Product routes remain blocked after this infrastructure implementation authorization.

Routes may only become eligible after:

- persistence infrastructure is implemented and merged;
- product repository implementation is authorized and merged;
- idempotency repository implementation is authorized and merged;
- audit repository implementation is authorized and merged;
- product service/use-case boundary is authorized and merged;
- route implementation authorization is separately granted.

## 20. Product Repository Eligibility Decision

Decision: Product repositories are not authorized by this gate.

Repositories become the likely next implementation authorization target after persistence infrastructure implementation is accepted.

Candidate next post-implementation gate:

`Backend Slice 0 Product Repository Implementation Authorization Gate`

## 21. Required Verification for Future Implementation PR

The future implementation PR must provide evidence for:

- `git diff --stat`;
- `git diff --check`;
- targeted Prettier check for changed markdown files if any;
- `pnpm run typecheck`;
- `pnpm run lint`;
- `pnpm run test`;
- DB-backed migration test command if added;
- CI success with PostgreSQL service.

The future implementation PR must not rely only on local success.

## 22. Implementation Review Requirements

The future implementation PR must clearly separate:

- authorized files;
- non-authorized files;
- migration runner behavior;
- migration files added;
- package scripts added;
- CI workflow changes;
- DB-backed tests added;
- risks and rollback notes.

## 23. Risk Review

### 23.1 Over-Implementation Risk

Risk:

Infrastructure implementation may expand into repositories or routes.

Mitigation:

This authorization explicitly excludes repositories, services, controllers, and routes.

### 23.2 Database Safety Risk

Risk:

Migration runner may execute against the wrong database.

Mitigation:

Require explicit database URL handling, secret-safe logging, and test DB separation.

### 23.3 CI Drift Risk

Risk:

Local migration tests may pass without CI database validation.

Mitigation:

Authorize CI PostgreSQL service and DB-backed tests.

### 23.4 Schema Drift Risk

Risk:

SQL schema may drift from accepted OpenAPI schema planning.

Mitigation:

Limit product table fields to accepted Product schema planning and defer readiness persistence.

### 23.5 Dependency Creep Risk

Risk:

A migration framework or ORM may be introduced during execution.

Mitigation:

Use existing `pg`; reject new migration framework dependencies.

## 24. Final Decision

Decision: GO to Backend Slice 0 Product Persistence Infrastructure Implementation Execution.

This gate authorizes a future implementation PR limited to product persistence infrastructure.

This gate authorizes:

- migration runner implementation;
- migration metadata tracking;
- SQL migration files for products, idempotency records, and audit events;
- migration-related package scripts;
- PostgreSQL test DB setup;
- CI PostgreSQL service wiring;
- DB-backed migration tests.

This gate does not authorize:

- product routes;
- controllers;
- services;
- repositories;
- idempotency repository;
- audit repository;
- product service/use-case logic;
- OpenAPI mutation;
- generated clients;
- UI;
- deployment;
- secrets;
- formatting baseline cleanup.

## 25. Recommended Next Step

Recommended next step after this gate is merged:

`Backend Slice 0 Product Persistence Infrastructure Implementation Execution`

That next step may implement only the authorized infrastructure slice.

## 26. Explicit Non-Authorization

This gate does not authorize implementation inside this PR.

This gate does not authorize:

- route implementation;
- controller implementation;
- service implementation;
- repository implementation;
- product route implementation;
- product repository implementation;
- idempotency repository implementation;
- audit repository implementation;
- OpenAPI mutation;
- generated client changes;
- product seed data;
- workspace membership persistence;
- deployment changes;
- production secrets changes;
- UI changes;
- workflow features unrelated to DB-backed migration validation;
- formatting baseline cleanup.

## 27. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged Product Persistence Implementation Authorization Readiness Gate.
- Merged Product Idempotency and Audit Storage Strategy Gate.
- Merged Product Repository API and Transaction Boundary Planning Gate.
- Merged Product Migration Runner and Test DB Strategy Gate.
- Merged Product SQL Data Model and Migration Strategy Decision Gate.
- Merged Product Schema Field Inventory Gate.
- Merged Product Data Model Authority Review Gate.
- Merged Product Data Model and Migration Planning Gate.
- Merged Product Persistence Strategy Decision Gate.
- Merged Product Route Implementation Boundary Planning Gate.
- Merged Permission Guard Error Disclosure Mapping Decision Gate.
- Merged Permission Representation Decision Gate.
- Merged Product Route Inventory Review Gate.
- Accepted OpenAPI authority repository: `henter36/nashir`.
- Accepted CI-active Backend Slice 0 authority pin: `36da9ed31903562bddfb7ffd669841956e334a51`.
- Existing direct `pg` planning direction.
- Existing backend runtime and guard harness state.
- Existing non-authorization of routes and repositories.

### Outputs

- Narrow implementation authorization granted for a future infrastructure execution PR.
- Authorized infrastructure scope defined.
- Authorized candidate files defined.
- Non-authorized runtime scope defined.
- Verification requirements defined.
- Product routes remain blocked.
- Product repositories remain blocked.
- Next step selected as Product Persistence Infrastructure Implementation Execution.

### Gaps

- Actual implementation not yet done.
- Exact runner file name not yet selected.
- Exact SQL column names not yet implemented.
- Exact package script names not yet implemented.
- Exact CI PostgreSQL wiring not yet implemented.
- Repository implementation remains unresolved.
- Route implementation remains unresolved.

### Transition Decision

GO to `Backend Slice 0 Product Persistence Infrastructure Implementation Execution`.

Do not implement anything until this authorization gate is merged.
