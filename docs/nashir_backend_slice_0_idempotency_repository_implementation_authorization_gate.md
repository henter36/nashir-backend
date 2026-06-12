# Nashir Backend Slice 0 — Idempotency Repository Implementation Authorization Gate

## 1. Gate Classification

Gate type: Documentation-only implementation authorization gate.

This gate authorizes a future narrow implementation PR for Idempotency Repository only.

This gate does not itself implement code.

This gate does not authorize product routes.

This gate does not authorize controllers.

This gate does not authorize services or use-case orchestration.

This gate does not authorize audit repository implementation.

This gate does not authorize OpenAPI mutation.

This gate does not authorize generated clients.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged Product Persistence Infrastructure Implementation Execution.
- Merged Product Repository Implementation Authorization Gate.
- Merged Product Repository Implementation Execution.
- Merged Product Idempotency and Audit Storage Strategy Gate.
- Merged Product Repository API and Transaction Boundary Planning Gate.
- Existing `idempotency_records` table.
- Existing migration runner.
- Existing PostgreSQL-backed CI validation.
- Existing direct `pg` dependency.
- Accepted OpenAPI authority repository: `henter36/nashir`.
- Accepted CI-active Backend Slice 0 authority pin: `36da9ed31903562bddfb7ffd669841956e334a51`.

## 3. Authorization Objective

This gate decides whether Idempotency Repository implementation may proceed.

The objective is to authorize data access only for the existing `idempotency_records` table.

This gate does not authorize product route behavior.

This gate does not authorize product service orchestration.

This gate does not authorize audit event writing.

This gate does not authorize response replay at HTTP layer.

## 4. Implementation Authorization Decision

Decision: GO to Backend Slice 0 Idempotency Repository Implementation Execution.

This authorization becomes valid only after this gate is merged.

The future implementation PR must remain limited to Idempotency Repository data access.

## 5. Authorized Future Implementation Scope

The future implementation PR may include:

- Idempotency repository interface;
- Idempotency repository implementation using existing `pg`;
- idempotency row mapper;
- idempotency types;
- create/reserve idempotency record operation;
- read idempotency record operation;
- mark idempotency record as completed operation;
- mark idempotency record as failed operation;
- workspace-scoped idempotency queries;
- actor-scoped idempotency queries;
- operation-scoped idempotency queries;
- DB-backed repository tests;
- small DB test helper updates if required;
- documentation directly tied to Idempotency Repository behavior.

No other runtime behavior is authorized.

## 6. Authorized Candidate Files

Candidate files that may be added or modified:

- `src/idempotency/idempotency-repository.ts`
- `src/idempotency/idempotency-mapper.ts`
- `src/idempotency/idempotency-types.ts`
- `tests/idempotency/idempotency-repository.test.ts`
- `tests/helpers/test-db.ts`
- `.github/workflows/ci.yml`

Exact filenames may differ if the implementation PR explains why.

The implementation PR must not modify unrelated files.

## 7. Idempotency Repository Method Boundary

The future repository may expose methods equivalent to:

- `reserveIdempotencyRecord`;
- `getIdempotencyRecord`;
- `markIdempotencyRecordCompleted`;
- `markIdempotencyRecordFailed`.

The repository must not expose HTTP handlers.

The repository must not know about Fastify request or response objects.

The repository must not evaluate permissions.

The repository must not resolve workspace membership.

The repository must not create or update products.

The repository must not write audit events.

The repository must not perform HTTP response serialization.

## 8. Idempotency Scope Requirement

All Idempotency Repository operations must be scoped by:

- `workspaceId`;
- `actorId`;
- `operationName`;
- `idempotencyKey`.

The repository must enforce the existing uniqueness boundary:

- `workspace_id`;
- `actor_id`;
- `operation_name`;
- `idempotency_key`.

The repository must not look up idempotency records by `idempotencyKey` alone.

The repository must not allow cross-workspace idempotency replay.

The repository must not allow cross-actor idempotency replay.

## 9. Existing Table Mapping Requirement

The repository must map to the existing `idempotency_records` table.

Expected columns:

- `idempotency_record_id`;
- `workspace_id`;
- `actor_id`;
- `operation_name`;
- `idempotency_key`;
- `request_fingerprint`;
- `status`;
- `response_status_code`;
- `response_body`;
- `resource_id`;
- `created_at`;
- `updated_at`;
- `expires_at`.

No migration is authorized by this gate unless strictly required to support repository tests and separately justified.

## 10. Status Boundary

Allowed idempotency statuses:

- `in_progress`;
- `completed`;
- `failed`.

The repository may map these statuses to typed results.

The repository must not invent additional statuses in this slice.

## 11. Reserve Operation Boundary

Authorized reserve behavior:

- insert a new idempotency record;
- preserve request fingerprint;
- set initial status to `in_progress`;
- support expiration timestamp if provided;
- detect an existing record by the unique scope;
- return a typed result distinguishing created vs existing.

Not authorized:

- HTTP `Idempotency-Key` header parsing;
- request body hashing at route layer;
- service-level replay decision;
- product creation;
- audit writing.

## 12. Read Operation Boundary

Authorized read behavior:

- read one idempotency record by workspace, actor, operation, and key;
- return null if absent;
- return stored status, fingerprint, response status code, response body, and resource id.

Not authorized:

- HTTP response replay;
- route response envelope creation;
- product lookup;
- audit lookup.

## 13. Mark Completed Boundary

Authorized mark-completed behavior:

- update an existing idempotency record to `completed`;
- persist response status code;
- persist response body as JSONB;
- persist resource id if provided;
- preserve workspace/actor/operation/key scoping.

Not authorized:

- product repository transaction orchestration;
- audit event creation;
- HTTP response generation.

## 14. Mark Failed Boundary

Authorized mark-failed behavior:

- update an existing idempotency record to `failed`;
- optionally persist response status code/body where appropriate;
- preserve workspace/actor/operation/key scoping.

Not authorized:

- retry policy;
- failure response serialization;
- alerting or monitoring.

## 15. Transaction Boundary

The Idempotency Repository may support transaction participation.

Allowed:

- accept a `pg` client or transaction client where needed;
- use a pool for standalone repository operations;
- participate in a caller-managed transaction.

Not authorized:

- service-level transaction orchestration;
- combining idempotency reservation with product creation;
- combining idempotency completion with audit writing.

Those require a later service/use-case authorization gate.

## 16. Product Repository Boundary

Product Repository is already implemented.

This gate does not authorize modifying Product Repository except if a very small type or test helper adjustment is required and clearly justified.

The Idempotency Repository must not:

- create products;
- update products;
- fetch products;
- import product route handlers;
- own Product Repository transaction orchestration.

## 17. Audit Boundary

Audit infrastructure exists, but Audit Repository implementation is not authorized by this gate.

The Idempotency Repository must not:

- insert audit events;
- update audit events;
- read audit events;
- compare before/after state;
- implement audit retention.

A later gate must authorize Audit Repository implementation.

## 18. OpenAPI Boundary

The Idempotency Repository implementation must not mutate OpenAPI files.

The Idempotency Repository implementation must not generate clients.

The Idempotency Repository implementation must not redefine contract authority.

## 19. Error Model Boundary

Repository-level errors may be represented as typed results or exceptions only for data access failure.

Not authorized:

- HTTP `ErrorModel` response implementation;
- route-level 400, 401, 403, 404, 409, or 422 mapping;
- response envelope implementation.

Route/service mapping remains later scope.

## 20. Test Authorization

The future implementation PR may add DB-backed tests for:

- reserving a new idempotency record;
- detecting an existing idempotency record;
- workspace isolation;
- actor isolation;
- operation isolation;
- request fingerprint persistence;
- mark completed;
- mark failed;
- response body persistence;
- resource id persistence;
- expiration timestamp persistence.

Tests must not require product routes.

Tests must not call HTTP endpoints.

Tests must not implement product service/use-case tests.

## 21. CI Authorization

The existing CI PostgreSQL service may be used.

Allowed CI changes:

- run idempotency repository DB tests;
- keep migration DB tests;
- keep product repository DB tests;
- keep contract authority validation;
- keep lint;
- keep typecheck;
- keep unit/integration tests.

Not authorized:

- deployment workflow changes;
- production database migration execution;
- secrets changes;
- unrelated CI restructuring.

## 22. Dependency Authorization

No new runtime dependency is authorized.

Existing `pg` must be used.

Not authorized:

- ORM adoption;
- query builder adoption;
- Prisma;
- Knex;
- Drizzle;
- TypeORM;
- Sequelize;
- generated database clients.

A new dependency requires a separate gate.

## 23. Security Requirements

The future implementation PR must:

- avoid logging database URLs;
- avoid committing secrets;
- preserve test database isolation;
- fail closed for invalid DB config;
- scope all idempotency queries by workspace, actor, operation, and key;
- avoid broad SQL string interpolation for user-controlled values;
- use parameterized SQL for dynamic values.

## 24. Non-Authorized Files and Areas

The future implementation PR must not add or modify:

- product route files;
- Fastify route registration;
- controllers;
- services;
- use-case orchestration;
- audit repository files;
- OpenAPI files;
- generated clients;
- UI files;
- deployment files;
- production secrets;
- broad formatting changes.

## 25. Verification Requirements for Future Implementation PR

The future implementation PR must include evidence for:

- `git diff --stat`;
- `git diff --check`;
- targeted Prettier check for changed files;
- `pnpm run typecheck`;
- `pnpm run lint`;
- `pnpm run test`;
- DB-backed idempotency repository tests in CI;
- confirmation that no routes/controllers/services were added.

## 26. Risk Review

### 26.1 Scope Creep Risk

Risk:

Idempotency implementation may expand into service replay or route handling.

Mitigation:

This gate only authorizes repository data access.

### 26.2 Cross-Workspace Replay Risk

Risk:

Records may be fetched by key alone.

Mitigation:

All queries must include workspace, actor, operation, and key scope.

### 26.3 Transaction Boundary Risk

Risk:

Repository may prematurely own product/idempotency/audit combined transactions.

Mitigation:

This gate excludes product write orchestration and audit repository behavior.

### 26.4 Stored Response Risk

Risk:

Stored response body may become a route-level response contract.

Mitigation:

Repository may persist JSONB response data only; HTTP replay decision remains service/route scope.

### 26.5 Dependency Creep Risk

Risk:

Implementation may introduce ORM or query builder.

Mitigation:

Use existing `pg`; no new dependency authorized.

## 27. Final Decision

Decision: GO to Backend Slice 0 Idempotency Repository Implementation Execution.

This gate authorizes a future implementation PR limited to Idempotency Repository data access.

This gate authorizes:

- idempotency repository interface;
- idempotency repository implementation;
- idempotency row mapping;
- idempotency repository DB tests;
- minimal DB helper changes if needed.

This gate does not authorize:

- product routes;
- controllers;
- services;
- product repository changes beyond justified minor helper alignment;
- audit repository;
- OpenAPI mutation;
- generated clients;
- UI;
- deployment;
- secrets;
- formatting baseline cleanup.

## 28. Recommended Next Step

Recommended next step after this gate is merged:

`Backend Slice 0 Idempotency Repository Implementation Execution`

## 29. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged Product Persistence Infrastructure Implementation Execution.
- Merged Product Repository Implementation Authorization Gate.
- Merged Product Repository Implementation Execution.
- Existing `idempotency_records` table.
- Existing migration runner.
- Existing PostgreSQL-backed CI validation.
- Existing direct `pg` dependency.

### Outputs

- Idempotency Repository implementation authorization granted.
- Repository-only scope defined.
- Product route/service/audit exclusions preserved.
- Verification requirements defined.
- Next execution step selected.

### Gaps

- Idempotency Repository is not yet implemented.
- Audit Repository remains unauthorized.
- Product service/use-case remains unauthorized.
- Product routes remain unauthorized.
- HTTP idempotency replay remains unauthorized.
- HTTP error mapping remains unauthorized.

### Transition Decision

GO to `Backend Slice 0 Idempotency Repository Implementation Execution`.

Do not implement idempotency repository code until this gate is merged.
