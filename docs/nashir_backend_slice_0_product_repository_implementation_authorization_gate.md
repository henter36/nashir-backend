# Nashir Backend Slice 0 — Product Repository Implementation Authorization Gate

## 1. Gate Classification

Gate type: Documentation-only implementation authorization gate.

This gate authorizes a future narrow implementation PR for Product Repository only.

This gate does not itself implement code.

This gate does not authorize product routes.

This gate does not authorize controllers.

This gate does not authorize services or use-case orchestration.

This gate does not authorize idempotency repository implementation.

This gate does not authorize audit repository implementation.

This gate does not authorize OpenAPI mutation.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged Product Persistence Infrastructure Implementation Execution.
- Merged Product Persistence Infrastructure Implementation Authorization Gate.
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
- Existing direct `pg` dependency.
- Existing migration runner.
- Existing `products` table migration.
- Existing CI PostgreSQL-backed migration test.
- Existing backend runtime and guard harness state.

## 3. Authorization Objective

This gate decides whether Product Repository implementation may proceed.

The objective is to authorize data access only for the accepted Product schema and the existing `products` table.

This gate does not authorize HTTP route behavior.

This gate does not authorize request validation wiring.

This gate does not authorize product service orchestration.

This gate does not authorize idempotency or audit write orchestration.

## 4. Implementation Authorization Decision

Decision: GO to Backend Slice 0 Product Repository Implementation Execution.

This authorization becomes valid only after this gate is merged.

The future implementation PR must remain limited to Product Repository data access.

## 5. Authorized Future Implementation Scope

The future implementation PR may include:

- Product repository interface;
- Product repository implementation using existing `pg`;
- Product row-to-domain mapper;
- Product create persistence operation;
- Product read-by-id persistence operation;
- Product list persistence operation;
- Product update persistence operation;
- optimistic version check support;
- workspace-scoped repository queries;
- DB-backed repository tests;
- small DB test helper updates if required;
- documentation directly tied to Product Repository behavior.

No other runtime behavior is authorized.

## 6. Authorized Candidate Files

Candidate files that may be added or modified:

- `src/products/product-repository.ts`
- `src/products/product-mapper.ts`
- `src/products/product-types.ts`
- `src/db.ts`
- `src/database.ts`
- `tests/products/product-repository.test.ts`
- `tests/helpers/test-db.ts`

Exact filenames may differ if the implementation PR explains why.

The implementation PR must not modify unrelated files.

## 7. Product Repository Method Boundary

The future repository may expose methods equivalent to:

- `listProducts`
- `createProduct`
- `getProductById`
- `updateProduct`

The repository must not expose HTTP handlers.

The repository must not know about Fastify request or response objects.

The repository must not evaluate permissions.

The repository must not resolve workspace membership.

The repository must not implement idempotency replay.

The repository must not write audit events.

## 8. Workspace Scope Requirement

All Product Repository operations must be workspace-scoped.

Required behavior:

- list products by `workspaceId`;
- read a product by `workspaceId` and `productId`;
- update a product by `workspaceId` and `productId`;
- create a product with server-provided `workspaceId`;
- never accept `workspaceId` from request body shape;
- never return a product from a different workspace.

Cross-workspace access remains forbidden.

## 9. Product Schema Mapping Requirement

The repository must map between database columns and accepted Product schema fields.

Required Product response fields:

- `productId`;
- `workspaceId`;
- `name`;
- `status`;
- `createdAt`;
- `updatedAt`;
- `version`.

Optional Product response fields:

- `category`;
- `price`;
- `sku`;
- `stockStatus`;
- `imageUrl`;
- `videoUrl`;
- `description`.

The repository must not persist or return `readiness` from the product table in this slice.

Readiness remains deferred.

## 10. Create Product Boundary

Authorized create behavior:

- accept server-provided `workspaceId`;
- accept validated product creation input from a future service layer;
- persist accepted writable fields only;
- generate or accept server-generated `productId` only if the generator is provided within authorized repository scope;
- return the persisted Product.

Not authorized:

- HTTP body validation;
- route-level required header validation;
- idempotency-key handling;
- audit logging;
- permission checks.

## 11. Update Product Boundary

Authorized update behavior:

- update by `workspaceId` and `productId`;
- update only accepted writable fields;
- support optimistic version check;
- increment `version` on successful update;
- return updated Product;
- distinguish not-found vs version-conflict at repository result level.

Not authorized:

- HTTP status mapping;
- route-level `If-Match` or `X-Resource-Version` parsing;
- audit logging;
- idempotency handling;
- permission checks.

## 12. List Product Boundary

Authorized list behavior:

- list products by `workspaceId`;
- support limit;
- support cursor if implemented within repository scope;
- support status filter;
- support updated-after filter;
- support deterministic ordering by `updatedAt` and `productId`;
- return count and next cursor material needed by a later service/route layer.

Not authorized:

- HTTP query parsing;
- response serialization;
- route registration.

## 13. Get Product Boundary

Authorized get behavior:

- fetch one product by `workspaceId` and `productId`;
- return null/not-found result if absent;
- never fetch by `productId` only.

Not authorized:

- 404 response mapping;
- permission decision;
- membership decision.

## 14. Transaction Boundary

Product Repository may support transaction participation.

Allowed:

- accept a `pg` client or transaction client where needed;
- use a pool for standalone repository operations;
- keep transaction ownership outside route handlers for now.

Not authorized:

- service transaction orchestration;
- combining product write with idempotency write;
- combining product write with audit event write.

Those require later service/use-case authorization.

## 15. Idempotency Boundary

Idempotency infrastructure exists, but idempotency repository implementation is not authorized by this gate.

The Product Repository must not:

- insert idempotency records;
- read idempotency records;
- replay stored responses;
- enforce idempotency keys;
- implement idempotency cleanup.

A later gate must authorize idempotency repository implementation.

## 16. Audit Boundary

Audit infrastructure exists, but audit repository implementation is not authorized by this gate.

The Product Repository must not:

- insert audit events;
- compare before/after state for audit;
- publish audit events;
- implement audit retention;
- expose audit queries.

A later gate must authorize audit repository implementation.

## 17. Permission and Workspace Guard Boundary

The Product Repository must not modify:

- `permission-guard`;
- `workspace-context-guard`;
- auth guard;
- request context model;
- runtime route harnesses.

Permission and workspace checks remain route/service-layer responsibilities.

## 18. OpenAPI Boundary

The Product Repository implementation must conform to the accepted OpenAPI Product schema.

The Product Repository implementation must not mutate OpenAPI files.

The Product Repository implementation must not generate clients.

The Product Repository implementation must not redefine contract authority.

## 19. Error Model Boundary

Repository-level errors may be represented as typed results or exceptions only for data access failure.

Not authorized:

- HTTP `ErrorModel` response implementation;
- route-level 400, 401, 403, 404, 409, or 422 mapping;
- response envelope implementation.

Route/service mapping remains later scope.

## 20. Test Authorization

The future implementation PR may add DB-backed tests for:

- create product;
- get product by workspace and product id;
- list products by workspace;
- update product;
- version increment on update;
- version conflict result;
- workspace isolation;
- nullable optional fields;
- status and stock status mapping;
- price persistence;
- deterministic ordering.

Tests must not require product routes.

Tests must not call HTTP endpoints.

Tests must not implement service/use-case tests.

## 21. CI Authorization

The existing CI PostgreSQL service may be used.

Allowed CI changes:

- run repository DB tests if not already covered by `pnpm run test`;
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
- scope all product queries by workspace;
- avoid accepting workspace identity from client body;
- avoid broad SQL string interpolation for user-controlled values.

Parameterized SQL is required for dynamic values.

## 24. Non-Authorized Files and Areas

The future implementation PR must not add or modify:

- product route files;
- Fastify route registration;
- controllers;
- services;
- use-case orchestration;
- idempotency repository files;
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
- DB-backed repository tests in CI;
- confirmation that no routes/controllers/services were added.

## 26. Risk Review

### 26.1 Scope Creep Risk

Risk:

Repository implementation may expand into service or route behavior.

Mitigation:

This gate only authorizes repository data access.

### 26.2 Cross-Workspace Data Leak Risk

Risk:

Queries may fetch by `productId` without `workspaceId`.

Mitigation:

All repository methods must scope by `workspaceId`.

### 26.3 Contract Drift Risk

Risk:

Repository types may drift from accepted OpenAPI Product schema.

Mitigation:

Map only accepted Product fields and keep readiness deferred.

### 26.4 Transaction Boundary Risk

Risk:

Repository may prematurely own product/idempotency/audit combined transactions.

Mitigation:

This gate excludes idempotency and audit repositories and service orchestration.

### 26.5 Dependency Creep Risk

Risk:

Implementation may introduce ORM or query builder.

Mitigation:

Use existing `pg`; no new dependency authorized.

## 27. Final Decision

Decision: GO to Backend Slice 0 Product Repository Implementation Execution.

This gate authorizes a future implementation PR limited to Product Repository data access.

This gate authorizes:

- product repository interface;
- product repository implementation;
- product row mapping;
- product repository DB tests;
- minimal DB helper changes if needed.

This gate does not authorize:

- product routes;
- controllers;
- services;
- idempotency repository;
- audit repository;
- OpenAPI mutation;
- generated clients;
- UI;
- deployment;
- secrets;
- formatting baseline cleanup.

## 28. Recommended Next Step

Recommended next step after this gate is merged:

`Backend Slice 0 Product Repository Implementation Execution`

## 29. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged Product Persistence Infrastructure Implementation Execution.
- Merged Product Persistence Infrastructure Implementation Authorization Gate.
- Accepted OpenAPI authority repository.
- Existing `products` table.
- Existing migration runner.
- Existing PostgreSQL-backed CI validation.
- Existing direct `pg` dependency.

### Outputs

- Product Repository implementation authorization granted.
- Repository-only scope defined.
- Route/service/idempotency/audit exclusions preserved.
- Verification requirements defined.
- Next execution step selected.

### Gaps

- Product Repository is not yet implemented.
- Idempotency Repository remains unauthorized.
- Audit Repository remains unauthorized.
- Product service/use-case remains unauthorized.
- Product routes remain unauthorized.
- HTTP error mapping remains unauthorized.

### Transition Decision

GO to `Backend Slice 0 Product Repository Implementation Execution`.

Do not implement repository code until this gate is merged.
