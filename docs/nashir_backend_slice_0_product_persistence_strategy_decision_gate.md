# Nashir Backend Slice 0 — Product Persistence Strategy Decision Gate

## 1. Gate Classification

Gate type: Documentation-only product persistence strategy decision gate.

This gate decides the product persistence strategy direction for future planning.

This gate does not authorize implementation.

This gate does not authorize route implementation.

This gate does not authorize controller, service, repository, DB, ORM, migrations, generated clients, OpenAPI mutation, validation script modification, package script modification, CI workflow modification, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #94: `docs: plan product route implementation boundary`.
- Merged PR #93: `docs: decide permission guard error disclosure mapping`.
- Merged PR #92: `docs: decide permission guard permission representation`.
- Merged PR #91: `docs: review permission guard product route inventory`.
- Accepted OpenAPI authority repository: `henter36/nashir`.
- Accepted CI-active Backend Slice 0 authority pin: `36da9ed31903562bddfb7ffd669841956e334a51`.
- Accepted OpenAPI authority file: `docs/nashir_v1_openapi.yaml`.
- Existing backend runtime dependency on `pg`.
- No accepted ORM dependency.
- No accepted migration tool.
- No accepted migration scripts.
- Existing Auth0 identity-only boundary.
- Existing route/path `workspaceId` authority.
- Existing workspace-before-permission ordering.
- Existing membership-before-permission behavior.
- Existing error and disclosure mapping.
- Existing product route implementation planning gate.
- Existing non-authorization of implementation.

## 3. Decision Objective

This gate must decide:

- whether V1 product persistence should use direct `pg`, ORM, or another approach;
- whether product storage is required before route implementation;
- whether product repository boundaries are required;
- whether DB/ORM/migration work is authorized now;
- how product workspace ownership must be represented conceptually;
- how idempotency, optimistic concurrency, and audit persistence relate to product persistence;
- what the next documentation gate should be.

This gate must not implement persistence.

This gate must not create migrations.

This gate must not create repositories.

This gate must not create product tables.

This gate must not modify package dependencies.

## 4. Current Repository Evidence

Current backend package evidence:

- The backend uses Node >= 22.
- The runtime dependency list includes `pg`.
- The runtime dependency list includes `fastify`, `jose`, and `zod`.
- No ORM is currently accepted as a dependency.
- No migration tool is currently accepted as a dependency.
- Package scripts do not include a migration command.

Decision impact:

- Future product persistence should not introduce ORM or migration tooling without a separate authorization gate.
- Existing `pg` dependency may be treated as the current persistence direction for planning only.
- No DB implementation is authorized by this gate.

## 5. Persistence Strategy Decision

Decision: V1 Backend Slice 0 product persistence strategy should be planned around direct PostgreSQL access through `pg`.

This is a planning decision only.

Rationale:

- `pg` already exists as an accepted runtime dependency.
- No ORM has been accepted.
- No migration tool has been accepted.
- Introducing ORM now would expand scope beyond the accepted Slice 0 boundaries.
- Direct `pg` keeps the persistence layer explicit and easier to audit for workspace isolation and disclosure behavior.

This decision does not authorize:

- SQL implementation;
- repository implementation;
- DB table creation;
- migration creation;
- connection pool implementation;
- transaction implementation;
- seed data;
- deployment configuration.

## 6. ORM Decision

Decision: ORM is NO-GO for Backend Slice 0 product persistence unless separately authorized.

Reason:

Introducing an ORM would require:

- dependency changes;
- model design;
- migration strategy;
- generated or inferred schema behavior;
- additional review of query disclosure behavior;
- additional review of transaction semantics;
- additional CI and package script impact.

None of these are authorized in this gate.

## 7. Migration Decision

Decision: DB migrations remain unresolved and not authorized.

Reason:

Product persistence requires a migration strategy, but this gate only selects the persistence direction.

Unresolved migration questions:

- migration tool selection;
- migration file location;
- migration execution command;
- CI migration validation;
- local development DB lifecycle;
- test DB lifecycle;
- rollback strategy;
- migration ownership across environments.

Therefore, product route implementation remains blocked after this gate.

## 8. Product Storage Conceptual Boundary

Future product storage must conceptually support:

- `productId`;
- `workspaceId`;
- product display/name fields from OpenAPI authority;
- create timestamp;
- update timestamp;
- version or revision field for optimistic concurrency;
- active/archive state if accepted by authority;
- audit correlation reference if later authorized;
- idempotency linkage for create operations if later authorized.

This is conceptual only.

This gate does not define SQL columns.

This gate does not define DB schema.

This gate does not define migrations.

## 9. Workspace Ownership Decision

Decision: Every persisted product must be owned by exactly one workspace.

Rules for future implementation:

- `workspaceId` must come from the route context.
- `workspaceId` must not be trusted from request body.
- Product lookup must always include workspace ownership.
- Cross-workspace product access must resolve as non-disclosing 404.
- Product identity alone must not be sufficient for access.
- Repository APIs must require workspace context for product reads and writes.

This gate does not implement repository APIs.

## 10. Repository Boundary Decision

Decision: Future product persistence must use an explicit repository boundary.

Expected future repository responsibilities:

- list products by workspace;
- get product by workspace and product ID;
- create product within workspace;
- update product within workspace and version;
- enforce workspace ownership at query boundary;
- return not-found semantics without exposing cross-workspace details;
- avoid leaking SQL/DB errors.

This gate does not create repository files.

## 11. Idempotency Persistence Decision

Decision: idempotency persistence is required before implementing `createProduct`.

Reason:

`createProduct` requires idempotency behavior.

Future idempotency strategy must decide:

- idempotency key storage;
- workspace scoping;
- actor scoping, if required;
- request fingerprinting;
- response replay behavior;
- conflict behavior;
- retention period;
- transaction boundary with product creation.

This gate does not implement idempotency storage.

## 12. Optimistic Concurrency Persistence Decision

Decision: optimistic concurrency persistence is required before implementing `updateProduct`.

Reason:

`updateProduct` requires version conflict behavior through `If-Match` or `X-Resource-Version`.

Future concurrency strategy must decide:

- version field format;
- version increment behavior;
- stale version detection;
- 409 mapping;
- update transaction boundary;
- response version propagation.

This gate does not implement optimistic concurrency.

## 13. Audit Persistence Decision

Decision: audit persistence is required before implementing product write operations.

Applies to:

- `createProduct`
- `updateProduct`

Future audit strategy must decide:

- audit event destination;
- actor ID capture;
- workspace ID capture;
- product ID capture;
- action name;
- correlation ID capture;
- before/after state policy;
- failure audit policy;
- retention and compliance boundaries.

This gate does not implement audit storage.

## 14. Product Route Eligibility Decision

Decision: product route implementation remains NOT ELIGIBLE after this gate.

Reason:

The following remain unresolved:

- DB migration strategy;
- product table/data model;
- product repository API;
- transaction boundary;
- idempotency persistence;
- optimistic concurrency persistence;
- audit persistence;
- test database strategy;
- implementation authorization.

## 15. Candidate Next Paths

### Option A — Product Data Model and Migration Planning Gate

Decision: SELECTED.

Reason:

Direct `pg` persistence direction is selected for planning, but no table, migration, or test DB strategy has been decided.

### Option B — Direct Product Route Implementation

Decision: NO-GO.

Reason:

Routes cannot be implemented safely without data model, migration, repository, idempotency, concurrency, and audit decisions.

### Option C — ORM Adoption Gate

Decision: NO-GO.

Reason:

ORM adoption is not needed for V1 Slice 0 and would expand scope.

### Option D — Generated Client Inventory Gate

Decision: DEFER.

Reason:

No OpenAPI mutation is authorized and generated artifacts remain out of scope.

## 16. Selected Next Path

Selected next path:

`Backend Slice 0 Product Data Model and Migration Planning Gate`

This selected path is documentation-only.

It must plan data model and migration boundaries.

It must not implement DB schema.

It must not create migrations.

It must not add ORM.

It must not modify package scripts.

It must not modify CI workflow files.

It must not implement product routes.

## 17. Risk Review

### 17.1 Premature Persistence Risk

Risk:

Selecting `pg` may be mistaken as authorization to implement DB access.

Mitigation:

State explicit NO-GO for repository, DB, SQL, and migration implementation.

### 17.2 ORM Scope Creep Risk

Risk:

Introducing ORM would expand implementation surface and governance risk.

Mitigation:

Keep ORM NO-GO unless separately authorized.

### 17.3 Workspace Isolation Risk

Risk:

Product lookup by product ID alone could leak cross-workspace product existence.

Mitigation:

Require future repository boundaries to include workspace ownership in all product queries.

### 17.4 Idempotency Risk

Risk:

`createProduct` without idempotency storage may create duplicate products or inconsistent responses.

Mitigation:

Require idempotency persistence decision before create implementation.

### 17.5 Concurrency Risk

Risk:

`updateProduct` without version persistence may overwrite concurrent updates.

Mitigation:

Require optimistic concurrency persistence decision before update implementation.

### 17.6 Audit Risk

Risk:

Write operations may be implemented before audit persistence is defined.

Mitigation:

Require audit persistence decision before product write implementation.

## 18. Final Decision

Decision: GO to Backend Slice 0 Product Data Model and Migration Planning Gate.

This decision accepts direct `pg` as the planned persistence direction for V1 Backend Slice 0 product persistence.

This decision rejects ORM adoption for this slice unless separately authorized.

This decision confirms that product route implementation remains blocked.

This decision does not authorize implementation.

This decision does not authorize route implementation.

This decision does not authorize controller implementation.

This decision does not authorize service implementation.

This decision does not authorize repository implementation.

This decision does not authorize SQL implementation.

This decision does not authorize DB tables.

This decision does not authorize migrations.

This decision does not authorize OpenAPI mutation.

This decision does not authorize generated client changes.

This decision does not authorize validation script modification.

This decision does not authorize package script modification.

This decision does not authorize CI workflow modification.

This decision does not authorize deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 19. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Product Data Model and Migration Planning Gate`

That gate should plan the product table/data model, migration approach, local/test DB lifecycle, rollback boundary, and DB validation expectations without implementing migrations.

## 20. Explicit Non-Authorization

This product persistence strategy decision gate does not authorize:

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

## 21. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged Product Route Implementation Planning Gate.
- Merged Error and Disclosure Mapping Decision Gate.
- Merged Permission Representation Decision Gate.
- Merged Product Route Inventory Review Gate.
- Existing `pg` dependency.
- No accepted ORM dependency.
- No accepted migration tool.
- Accepted product route permissions.
- Accepted product error and disclosure mapping.
- Existing non-authorization of implementation.

### Outputs

- Direct `pg` selected as the planned V1 product persistence direction.
- ORM adoption rejected for this slice unless separately authorized.
- Product storage concept boundary identified.
- Workspace ownership requirement confirmed.
- Repository boundary requirement confirmed.
- Idempotency persistence requirement confirmed.
- Optimistic concurrency persistence requirement confirmed.
- Audit persistence requirement confirmed.
- Product route implementation remains blocked.
- Product Data Model and Migration Planning Gate selected as next gate.

### Gaps

- Product data model unresolved.
- Product migration strategy unresolved.
- Product repository API unresolved.
- Transaction boundary unresolved.
- Test database strategy unresolved.
- Local development database lifecycle unresolved.
- Idempotency storage unresolved.
- Optimistic concurrency storage unresolved.
- Audit storage unresolved.
- Product route implementation readiness unresolved.
- Explicit implementation authorization unresolved.

### Transition Decision

GO to `Backend Slice 0 Product Data Model and Migration Planning Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
