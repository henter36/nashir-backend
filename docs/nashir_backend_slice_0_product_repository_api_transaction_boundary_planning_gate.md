# Nashir Backend Slice 0 — Product Repository API and Transaction Boundary Planning Gate

## 1. Gate Classification

Gate type: Documentation-only product repository API and transaction boundary planning gate.

This gate plans the future product repository API boundary and transaction behavior.

This gate does not authorize implementation.

This gate does not authorize repository implementation.

This gate does not authorize route implementation.

This gate does not authorize controller implementation.

This gate does not authorize service implementation.

This gate does not authorize SQL file creation.

This gate does not authorize DB table creation.

This gate does not authorize migration creation.

This gate does not authorize migration execution.

This gate does not authorize migration runner implementation.

This gate does not authorize package script modification.

This gate does not authorize CI workflow modification.

This gate does not authorize OpenAPI mutation.

This gate does not authorize generated client changes.

This gate does not authorize deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #100: `docs: decide product migration runner test db strategy`.
- Merged PR #99: `docs: decide product sql data model strategy`.
- Merged PR #98: `docs: inventory product schema fields`.
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
- Accepted direct `pg` persistence planning direction.
- Accepted product migration runner and test DB strategy.
- Existing non-authorization of implementation.

## 3. Decision Objective

This gate must decide:

- future product repository responsibility boundary;
- future repository method names and conceptual input/output shapes;
- workspace scoping rules at repository boundary;
- product read transaction expectations;
- product create transaction expectations;
- product update transaction expectations;
- optimistic concurrency boundary;
- idempotency handoff boundary;
- audit handoff boundary;
- error mapping boundary;
- what remains blocking before implementation.

This gate must not implement repositories.

This gate must not create repository files.

This gate must not create SQL queries.

This gate must not create migrations.

## 4. Repository Responsibility Boundary Decision

Decision: Future product repository code should be responsible only for product persistence access and persistence-level mapping.

Repository responsibilities:

- execute product data queries;
- require `workspaceId` for all workspace-owned product operations;
- require `productId` for single-product operations;
- map rows to product persistence records;
- expose not-found outcomes without leaking cross-workspace existence;
- expose version mismatch outcomes for update planning;
- participate in caller-provided transactions where write flows require multiple persistence writes.

Repository non-responsibilities:

- authentication;
- permission evaluation;
- workspace membership evaluation;
- HTTP request parsing;
- HTTP response formatting;
- route-level error response construction;
- OpenAPI validation;
- idempotency policy ownership;
- audit policy ownership;
- secrets loading;
- migration execution.

Rationale:

Auth, workspace, permission, and disclosure behavior were already planned at guard and route boundary. The repository must remain a persistence boundary, not an authorization boundary.

This gate does not implement repositories.

## 5. Workspace Scoping Decision

Decision: Every future product repository method must require `workspaceId`.

Rationale:

- Product is workspace-owned.
- Product routes are workspace-scoped.
- `workspaceId` is path-derived, not request-body-derived.
- Cross-workspace existence must not be leaked.
- Product lookup must not rely on `productId` alone.

Planning rule:

No product repository method should retrieve, update, or list products without a `workspaceId` input.

This gate does not implement the rule.

## 6. Repository Method Inventory Decision

Decision: Future V1 product repository planning should include four primary product methods.

Candidate future methods:

| Method | Purpose |
|---|---|
| `listProducts` | List products under a workspace. |
| `getProductById` | Fetch one product under a workspace. |
| `createProduct` | Create one product under a workspace. |
| `updateProduct` | Update one product under a workspace with version control. |

Status:

Candidate API planning only.

No method names are implementation-authorized by this gate.

## 7. listProducts Repository Boundary

Decision: Future `listProducts` repository planning must support workspace-scoped listing.

Candidate conceptual input:

- `workspaceId`;
- `limit`;
- `cursor`;
- `status`;
- `updatedAfter`;
- `sort`.

Candidate conceptual output:

- product rows;
- pagination cursor or cursor context;
- count for returned page;
- hasMore indicator.

Repository behavior expectations:

- query only within `workspaceId`;
- support status filtering if provided;
- support updatedAfter filtering if provided;
- support sorting compatible with OpenAPI planning;
- return an empty list when no products match.

Unresolved:

- exact cursor encoding;
- exact sort allowlist;
- exact pagination SQL;
- exact index plan.

This gate does not implement listing.

## 8. getProductById Repository Boundary

Decision: Future `getProductById` repository planning must support workspace-scoped product lookup.

Candidate conceptual input:

- `workspaceId`;
- `productId`.

Candidate conceptual output:

- product record if found;
- not-found/null result if not found under that workspace.

Repository behavior expectations:

- lookup by `workspaceId` and `productId`;
- do not distinguish product missing from product existing in another workspace;
- return a neutral not-found outcome to the caller.

Unresolved:

- exact result type;
- null versus discriminated union;
- row-to-domain mapper location.

This gate does not implement lookup.

## 9. createProduct Repository Boundary

Decision: Future `createProduct` repository planning must support workspace-scoped product creation.

Candidate conceptual input:

- `workspaceId`;
- accepted create request fields;
- generated `productId`;
- generated `createdAt`;
- generated `updatedAt`;
- generated `version`;
- transaction context, if the outer write flow requires idempotency and audit writes.

Candidate conceptual output:

- created product record.

Repository behavior expectations:

- never accept body-derived `workspaceId`;
- never accept client-supplied `productId`;
- set or receive server-generated timestamps;
- set or receive initial version;
- persist only fields authorized by `CreateProductRequest` plus server-managed fields;
- expose database conflicts to caller through planned error result, not raw database errors.

Unresolved:

- ID generator;
- timestamp source implementation;
- initial version token format;
- idempotency transaction ownership;
- audit transaction ownership.

This gate does not implement create.

## 10. updateProduct Repository Boundary

Decision: Future `updateProduct` repository planning must support workspace-scoped product update with optimistic concurrency.

Candidate conceptual input:

- `workspaceId`;
- `productId`;
- accepted update request fields;
- expected version token;
- generated next version token;
- generated `updatedAt`;
- transaction context, if the outer write flow requires audit writes.

Candidate conceptual output:

- updated product record;
- not-found outcome;
- version-mismatch outcome.

Repository behavior expectations:

- update only within `workspaceId`;
- update only product identified by `productId`;
- require expected version from route/service boundary;
- change version after successful update;
- change `updatedAt` after successful update;
- enforce `minProperties: 1` before repository call or reject empty patch at repository boundary if caller fails validation;
- avoid raw database errors crossing repository boundary.

Unresolved:

- exact version compare semantics;
- whether `If-Match` and `X-Resource-Version` normalize before repository call;
- exact update field allowlist;
- exact no-op update behavior.

This gate does not implement update.

## 11. Transaction Ownership Decision

Decision: Future write transactions should be owned by an application service/use-case boundary, not by individual repository methods alone.

Rationale:

Product writes will eventually need to coordinate:

- product row write;
- idempotency record write or replay;
- audit event write;
- optimistic concurrency check;
- rollback behavior.

A repository-only transaction would not have enough context to coordinate idempotency and audit.

Planning rule:

Repository methods should be able to participate in a caller-provided transaction/client context.

This gate does not implement transaction wrappers.

## 12. Read Transaction Decision

Decision: Future read operations may execute without explicit multi-step transaction unless pagination consistency requirements later require one.

Applies to:

- `listProducts`;
- `getProductById`.

Rationale:

Read routes do not require idempotency or audit writes.

Unresolved:

- pagination consistency for cursor-based listing;
- whether future list pages require repeatable-read semantics.

This gate does not implement read transactions.

## 13. Create Transaction Boundary Decision

Decision: Future create flow must be transaction-capable.

Future create transaction should eventually coordinate:

- idempotency lookup or reservation;
- product insert;
- audit event insert;
- idempotency success record or response reference;
- rollback on failure.

Current decision:

The repository API should support product insert within an external transaction context.

Unresolved:

- exact idempotency storage design;
- exact audit storage design;
- exact transaction helper API;
- conflict handling for repeated idempotency key.

This gate does not implement create transactions.

## 14. Update Transaction Boundary Decision

Decision: Future update flow must be transaction-capable.

Future update transaction should eventually coordinate:

- product lookup or conditional update;
- optimistic concurrency check;
- product update;
- audit event insert;
- rollback on failure.

Current decision:

The repository API should support product update within an external transaction context.

Unresolved:

- before/after state audit capture;
- version token generation;
- no-op update policy;
- version mismatch error mapping.

This gate does not implement update transactions.

## 15. Optimistic Concurrency Boundary Decision

Decision: Version normalization should happen before repository update, while version comparison should happen in the repository/database operation.

Rationale:

- HTTP headers are route/service concerns.
- Stored version comparison is a persistence concern.
- Repository should not parse HTTP headers.
- Repository should receive a normalized expected version token.

Future expected inputs:

- normalized expected version;
- generated next version.

Future expected outcomes:

- updated product;
- not found;
- version mismatch.

This gate does not implement concurrency behavior.

## 16. Idempotency Handoff Boundary Decision

Decision: Idempotency policy is outside the product repository but must share the write transaction for create.

Rationale:

`createProduct` requires `Idempotency-Key`.

Future idempotency boundary should own:

- idempotency key validation;
- request fingerprint;
- replay behavior;
- conflict behavior;
- retention policy.

Product repository should own:

- actual product row insertion;
- returning created product record.

Unresolved:

- idempotency repository API;
- idempotency table design;
- transaction sequencing;
- replay response storage strategy.

This gate does not implement idempotency.

## 17. Audit Handoff Boundary Decision

Decision: Audit policy is outside the product repository but must share write transaction for create/update.

Future audit boundary should own:

- actor capture;
- workspace capture;
- product capture;
- action name;
- before/after state policy;
- failure policy.

Product repository should own:

- product row insert/update;
- product row retrieval needed by caller for audit state, if planned later.

Unresolved:

- audit repository API;
- audit table design;
- before/after serialization;
- failure audit requirements.

This gate does not implement audit.

## 18. Error Mapping Boundary Decision

Decision: Repository must return structured persistence outcomes, not HTTP responses.

Candidate future repository outcomes:

- success;
- not found;
- version mismatch;
- unique/conflict violation;
- unavailable/database failure.

HTTP mapping remains outside repository.

Expected future mapping:

| Repository outcome | Future HTTP-level mapping |
|---|---|
| success | 200 or 201 depending on route |
| not found | 404 under existing non-disclosure rules |
| version mismatch | 409 |
| idempotency conflict | 409 |
| validation failure | 400 or 422 before repository call |
| database unavailable | 503 or 500 depending future error model decision |

This gate does not implement error mapping.

## 19. Validation Boundary Decision

Decision: Request validation should occur before repository calls.

Rationale:

- OpenAPI/Zod validation is not a repository responsibility.
- `CreateProductRequest` and `UpdateProductRequest` body rules should be enforced before persistence.
- Repository may still protect against impossible/empty update inputs defensively in future implementation.

Repository should not accept arbitrary unvalidated request bodies.

This gate does not implement validation.

## 20. Row Mapping Boundary Decision

Decision: Future repository planning should include a row-to-product mapper.

Rationale:

- SQL naming may use snake_case.
- API product shape uses camelCase.
- Mapping should be explicit and testable.
- Raw database rows should not leak above the persistence boundary.

Candidate future mapper:

- database row to Product persistence model;
- Product persistence model to API response may remain service/controller responsibility.

Unresolved:

- exact TypeScript type definitions;
- mapper file location;
- generated OpenAPI type usage strategy.

This gate does not implement mappers.

## 21. Disclosure and Workspace Leakage Decision

Decision: Repository must not expose cross-workspace existence.

Planning rule:

All product read/update repository operations must filter by both `workspaceId` and `productId` where product identity is involved.

Repository must not provide a helper that checks product existence by `productId` alone for route use.

Rationale:

Existing error/disclosure planning requires non-disclosure for workspace-scoped product resources.

This gate does not implement queries.

## 22. Product Route Eligibility Decision

Decision: Product route implementation remains NOT ELIGIBLE after this gate.

Reason:

The following remain unresolved:

- actual repository implementation authorization;
- migration runner implementation authorization;
- actual migration files;
- idempotency storage strategy;
- audit storage strategy;
- validation implementation boundary;
- service/use-case implementation boundary;
- route/controller implementation authorization;
- CI PostgreSQL service authorization;
- package script authorization.

## 23. Candidate Next Paths

### Option A — Product Idempotency and Audit Storage Strategy Gate

Decision: SELECTED.

Reason:

Repository API and transaction planning depends on idempotency and audit storage decisions before implementation can be safely authorized.

### Option B — Product Repository Implementation

Decision: NO-GO.

Reason:

Implementation remains blocked by idempotency, audit, migration files, migration runner implementation, test DB implementation, and explicit authorization.

### Option C — Product Route Implementation

Decision: NO-GO.

Reason:

Routes remain blocked by persistence and write-flow dependencies.

### Option D — Migration Runner Implementation

Decision: NO-GO.

Reason:

This gate does not authorize runner code, SQL files, package scripts, or CI changes.

## 24. Selected Next Path

Selected next path:

`Backend Slice 0 Product Idempotency and Audit Storage Strategy Gate`

This selected path is documentation-only.

It must decide:

- idempotency storage scope;
- idempotency request fingerprinting;
- idempotency replay/conflict behavior;
- audit event storage scope;
- audit action names;
- before/after state policy;
- how both participate in create/update transactions.

It must not implement idempotency.

It must not implement audit.

It must not create SQL.

It must not create migrations.

It must not implement repositories or routes.

## 25. Risk Review

### 25.1 Premature Repository Implementation Risk

Risk:

Repository API planning may be mistaken as authorization to write repository code.

Mitigation:

State explicit NO-GO for repository implementation.

### 25.2 Transaction Split Risk

Risk:

Product insert/update may be implemented outside idempotency/audit transaction boundaries.

Mitigation:

Require future write transaction planning to include product, idempotency, and audit writes.

### 25.3 Workspace Leakage Risk

Risk:

Repository helpers may be introduced that look up products by product ID alone.

Mitigation:

Require workspace-scoped repository inputs for all product operations.

### 25.4 Error Leakage Risk

Risk:

Raw database errors may leak to HTTP responses.

Mitigation:

Require structured repository outcomes and separate HTTP error mapping.

### 25.5 Validation Boundary Risk

Risk:

Repository may receive raw unvalidated request bodies.

Mitigation:

Keep validation at route/service boundary and define repository inputs as accepted field sets only.

## 26. Final Decision

Decision: GO to Backend Slice 0 Product Idempotency and Audit Storage Strategy Gate.

This decision accepts a documentation-only product repository API and transaction boundary plan.

This decision keeps repository implementation blocked.

This decision keeps route implementation blocked.

This decision keeps SQL implementation blocked.

This decision keeps migration creation blocked.

This decision keeps package script changes blocked.

This decision keeps CI workflow changes blocked.

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

## 27. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Product Idempotency and Audit Storage Strategy Gate`

That gate should decide idempotency and audit storage boundaries before any product persistence implementation authorization.

## 28. Explicit Non-Authorization

This product repository API and transaction boundary planning gate does not authorize:

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

## 29. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged Product Migration Runner and Test DB Strategy Gate.
- Merged Product SQL Data Model and Migration Strategy Decision Gate.
- Merged Product Schema Field Inventory Gate.
- Merged Product Data Model Authority Review Gate.
- Merged Product Data Model and Migration Planning Gate.
- Merged Product Persistence Strategy Decision Gate.
- Merged Product Route Implementation Boundary Planning Gate.
- Existing direct `pg` planning direction.
- Existing non-authorization of implementation.

### Outputs

- Product repository responsibility boundary decided.
- Workspace scoping rule decided.
- Candidate repository method inventory decided.
- listProducts boundary planned.
- getProductById boundary planned.
- createProduct boundary planned.
- updateProduct boundary planned.
- Transaction ownership boundary planned.
- Create/update transaction expectations planned.
- Optimistic concurrency boundary planned.
- Idempotency handoff boundary planned.
- Audit handoff boundary planned.
- Error mapping boundary planned.
- Validation boundary planned.
- Row mapping boundary planned.
- Product Idempotency and Audit Storage Strategy Gate selected as next gate.

### Gaps

- Idempotency storage unresolved.
- Audit storage unresolved.
- Actual repository implementation unresolved.
- Migration runner implementation unresolved.
- Actual migration files unresolved.
- Package scripts unresolved.
- CI PostgreSQL service unresolved.
- Service/use-case implementation boundary unresolved.
- Route/controller implementation unresolved.
- Explicit implementation authorization unresolved.

### Transition Decision

GO to `Backend Slice 0 Product Idempotency and Audit Storage Strategy Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
