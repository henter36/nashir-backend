# Nashir Backend Slice 0 — Product Idempotency and Audit Storage Strategy Gate

## 1. Gate Classification

Gate type: Documentation-only product idempotency and audit storage strategy gate.

This gate decides the future idempotency and audit storage strategy for product create/update write flows.

This gate does not authorize implementation.

This gate does not authorize idempotency implementation.

This gate does not authorize audit implementation.

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

- Merged PR #101: `docs: plan product repository transaction boundary`.
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
- Accepted product repository API and transaction boundary planning.
- Existing non-authorization of implementation.

## 3. Decision Objective

This gate must decide:

- idempotency storage scope;
- idempotency key uniqueness boundary;
- idempotency request fingerprint boundary;
- idempotency replay and conflict behavior;
- idempotency transaction participation;
- audit storage scope;
- audit action naming;
- audit actor/workspace/product capture;
- audit before/after state policy;
- audit transaction participation;
- what remains blocking before implementation.

This gate must not implement idempotency.

This gate must not implement audit.

This gate must not create SQL.

This gate must not create migrations.

## 4. Idempotency Applicability Decision

Decision: Idempotency storage is required for future `createProduct` implementation.

Rationale:

- `createProduct` requires `Idempotency-Key`.
- Repeated create requests must not create duplicate products when the same idempotency key and same request are retried.
- Idempotency must participate in the same write transaction as product creation.

Decision: Product update idempotency is not selected for V1 unless a future OpenAPI authority change requires it.

Rationale:

- `updateProduct` uses optimistic concurrency through version headers.
- The accepted route inventory identifies idempotency as a create operation requirement.
- Adding update idempotency would expand V1 scope.

This gate does not implement idempotency.

## 5. Idempotency Storage Strategy Decision

Decision: Future idempotency persistence should use a dedicated idempotency storage concept, separate from product rows.

Candidate future table name:

`idempotency_records`

Status:

Candidate planning name only.

Rationale:

- Idempotency records have lifecycle, request fingerprint, replay, and retention concerns separate from product records.
- Product table should not carry request retry state.
- Dedicated storage allows create flow to coordinate idempotency and product insert transactionally.

This gate does not create a table.

This gate does not authorize SQL column names.

## 6. Idempotency Uniqueness Boundary Decision

Decision: Future idempotency uniqueness should be scoped by workspace, actor, operation, and idempotency key.

Candidate conceptual uniqueness boundary:

- `workspaceId`;
- `actorId`;
- operation name;
- idempotency key.

Rationale:

- `workspaceId` preserves tenant/workspace boundary.
- `actorId` avoids accidental collisions between different users using the same key.
- operation name avoids cross-operation collisions.
- idempotency key alone is not safe globally.

Unresolved:

- whether client/application identifier is needed later;
- whether service-to-service actors require a different actor field;
- exact persistence constraint shape.

This gate does not create constraints.

## 7. Idempotency Operation Naming Decision

Decision: Product create idempotency operation should use a stable operation name.

Candidate future operation name:

`product.create`

Rationale:

- The OpenAPI operation is `createProduct`.
- A stable internal operation name is useful for idempotency scoping.
- This name must not be treated as a permission code.

This gate does not implement operation constants.

## 8. Idempotency Request Fingerprint Decision

Decision: Future idempotency records must store a deterministic request fingerprint.

Candidate fingerprint inputs:

- HTTP method;
- route operation identity;
- `workspaceId`;
- `actorId`;
- normalized accepted create body fields;
- content type if needed by validation layer.

Excluded from fingerprint:

- volatile request IDs;
- authorization token content;
- timestamps;
- raw header order;
- unrelated tracing headers.

Rationale:

- Same idempotency key with different request content must produce a conflict.
- Same idempotency key with same normalized request content should replay safely.
- Raw request bodies should not be used without normalization.

Unresolved:

- hash algorithm;
- exact canonical JSON normalization;
- whether validation should occur before fingerprinting.

This gate does not implement fingerprinting.

## 9. Idempotency Replay Behavior Decision

Decision: Future create replay behavior should distinguish same fingerprint from conflicting fingerprint.

Future behavior:

- Same idempotency key and same fingerprint after successful completion should return the stored successful outcome.
- Same idempotency key and different fingerprint should return conflict.
- Same idempotency key while original request is in progress should return a retryable or conflict outcome, to be decided in implementation planning.
- Failed requests should not be replayed as successful creates unless a future failure policy explicitly authorizes that behavior.

Candidate future stored replay data:

- final status of the idempotency record;
- created `productId`;
- response status code;
- response body snapshot or enough response reference to reconstruct a safe response;
- error outcome if a future policy stores failed outcomes.

Decision:

For V1 planning, store enough successful outcome data to avoid duplicate creation and to return a consistent replay response.

Unresolved:

- whether to store full response body snapshot or product reference plus response metadata;
- retention period;
- in-progress timeout behavior.

This gate does not implement replay behavior.

## 10. Idempotency Status Decision

Decision: Future idempotency records require explicit status.

Candidate future statuses:

- `in_progress`;
- `completed`;
- `failed`;
- `conflict` is not selected as a stored status; it is a derived outcome from fingerprint mismatch.

Rationale:

- In-progress state helps coordinate concurrent retries.
- Completed state supports replay.
- Failed state may support operational visibility, but failure replay policy remains unresolved.

This gate does not create enum values or constraints.

## 11. Idempotency Retention Decision

Decision: Idempotency records require a retention strategy before production.

Candidate future strategy:

- store `expiresAt` conceptually;
- purge expired records through a later operational job;
- do not block V1 planning on implementing purge automation before product route implementation.

Unresolved:

- exact retention duration;
- purge job mechanism;
- whether retention differs by workspace or plan.

This gate does not implement retention or cleanup jobs.

## 12. Idempotency Transaction Boundary Decision

Decision: Future `createProduct` write transaction must include idempotency and product insert behavior.

Future create transaction should coordinate:

- reserve or read idempotency record;
- validate fingerprint match or conflict;
- insert product record;
- write successful idempotency outcome;
- write audit event;
- commit once all required writes succeed;
- rollback on failure.

Rationale:

Product insert without idempotency record update can create duplicate or unreplayable state.

This gate does not implement transactions.

## 13. Idempotency Repository Boundary Decision

Decision: Future idempotency persistence should have its own repository boundary, separate from product repository.

Candidate future responsibilities:

- reserve idempotency key;
- read existing idempotency record;
- compare fingerprint outcome;
- mark completed;
- mark failed if policy requires;
- expose structured outcomes.

Non-responsibilities:

- product insertion;
- permission checks;
- HTTP response construction;
- audit event writing.

This gate does not implement an idempotency repository.

## 14. Audit Applicability Decision

Decision: Audit storage is required for future product write implementation.

Applies to:

- `createProduct`;
- `updateProduct`.

Rationale:

The accepted product route authority marks create and update as audit-required operations.

Audit does not apply to `listProducts` and `getProduct` in this slice unless a future authority change requires it.

This gate does not implement audit.

## 15. Audit Storage Strategy Decision

Decision: Future audit persistence should use a dedicated audit event storage concept, separate from product rows.

Candidate future table name:

`audit_events`

Status:

Candidate planning name only.

Rationale:

- Audit events are append-only operational records.
- Audit data has retention, reporting, and immutability concerns separate from product data.
- Product records should not carry write event history directly.

This gate does not create a table.

This gate does not authorize SQL column names.

## 16. Audit Event Identity Decision

Decision: Future audit events require a stable audit event identity.

Candidate conceptual field:

- audit event ID.

Rationale:

- Audit events need stable references for troubleshooting and traceability.
- Audit storage should not rely on product ID plus timestamp alone.

Unresolved:

- ID generator;
- timestamp source;
- whether audit event ID format aligns with product ID strategy.

This gate does not select an ID generator.

## 17. Audit Actor Capture Decision

Decision: Future audit events must capture verified actor identity.

Candidate conceptual fields:

- `actorId`;
- actor type if later required;
- request context identity source if later required.

Rationale:

- Product write operations are user or system initiated.
- The accepted auth model maps verified identity to request context.
- Audit without actor identity would be operationally incomplete.

This gate does not implement actor capture.

## 18. Audit Workspace Capture Decision

Decision: Future audit events must capture workspace boundary.

Candidate conceptual field:

- `workspaceId`.

Rationale:

- Product writes are workspace-scoped.
- Audit review must be workspace-filterable.
- Workspace capture supports tenant isolation and operational investigation.

This gate does not implement workspace capture.

## 19. Audit Product Capture Decision

Decision: Future product audit events must capture product identity when available.

Candidate conceptual field:

- `productId`.

Rules:

- `createProduct` audit event should capture created `productId` after product ID is generated.
- `updateProduct` audit event should capture target `productId`.
- Failed operations audit policy remains unresolved.

This gate does not implement product capture.

## 20. Audit Action Naming Decision

Decision: Future product audit actions should use stable product action names.

Candidate future audit action names:

- `product.create`;
- `product.update`.

Rationale:

- Stable action names support filtering and operational review.
- Names are audit action labels, not permission codes.
- Permission codes remain `nashir.products.read` and `nashir.products.manage`.

This gate does not implement action constants.

## 21. Audit Before/After State Policy Decision

Decision: Future product update audit should support before/after state capture.

Candidate future create audit state:

- before: absent/null;
- after: created product snapshot or selected persisted fields.

Candidate future update audit state:

- before: previous product snapshot or selected persisted fields;
- after: updated product snapshot or selected persisted fields.

Decision:

For V1 planning, audit should capture enough state to understand what changed, while avoiding secrets and unrelated request context.

Rationale:

- Product fields are catalog metadata.
- Write audit without before/after state is less useful for investigation.
- Exact serialization and field allowlist must be decided before implementation.

Unresolved:

- full snapshot versus changed fields only;
- JSON storage format;
- whether read-only response fields like `readiness` are excluded;
- maximum payload size.

This gate does not implement state capture.

## 22. Audit Failure Policy Decision

Decision: Successful create/update operations must be audited.

Decision: Failed operation audit remains unresolved.

Rationale:

- Successful writes are required by route audit planning.
- Failed operation audit may be useful but expands scope and error-path complexity.
- Failed validation and authorization attempts may belong to separate security audit planning, not product audit storage.

Unresolved:

- whether authorization failures are audited;
- whether validation failures are audited;
- whether database failures are audited;
- where failed audit writes are reported.

This gate does not implement failure audit.

## 23. Audit Transaction Boundary Decision

Decision: Successful product write audit events must be written in the same transaction as the product write.

Applies to:

- successful `createProduct`;
- successful `updateProduct`.

Rationale:

- Product write without audit event would violate audit-required route planning.
- Audit event without product write would create false operational history.
- Transactional coordination preserves consistency.

Unresolved:

- how to handle audit write failure;
- whether audit failure aborts the product write;
- whether any async audit path is allowed later.

Decision:

For V1 planning, audit write failure should abort the product write unless a later authorization explicitly permits non-blocking audit.

This gate does not implement transaction behavior.

## 24. Audit Repository Boundary Decision

Decision: Future audit persistence should have its own repository boundary, separate from product repository.

Candidate future responsibilities:

- insert audit event;
- accept actor/workspace/resource/action/state metadata;
- participate in caller-provided transaction;
- return structured persistence outcome.

Non-responsibilities:

- product write;
- permission checks;
- HTTP response construction;
- idempotency replay logic.

This gate does not implement an audit repository.

## 25. Combined Create Flow Strategy

Decision: Future successful `createProduct` flow should coordinate product, idempotency, and audit boundaries.

Conceptual future sequence:

1. Auth guard verifies identity.
2. Workspace context guard resolves workspace.
3. Permission guard authorizes `nashir.products.manage`.
4. Request validation accepts `CreateProductRequest`.
5. Idempotency boundary reserves or replays `Idempotency-Key`.
6. Product repository inserts product within transaction.
7. Audit repository writes `product.create` event within transaction.
8. Idempotency repository marks completed within transaction.
9. Response returns `ProductResponse`.

Status:

Planning only.

This gate does not implement the flow.

## 26. Combined Update Flow Strategy

Decision: Future successful `updateProduct` flow should coordinate product, version, and audit boundaries.

Conceptual future sequence:

1. Auth guard verifies identity.
2. Workspace context guard resolves workspace.
3. Permission guard authorizes `nashir.products.manage`.
4. Request validation accepts `UpdateProductRequest`.
5. Version header is normalized.
6. Product repository performs workspace-scoped conditional update.
7. Audit repository writes `product.update` event within transaction.
8. Response returns `ProductResponse`.

Status:

Planning only.

This gate does not implement the flow.

## 27. Error Mapping Boundary Decision

Decision: Idempotency and audit storage must return structured outcomes, not HTTP responses.

Candidate future idempotency outcomes:

- reserved;
- replay;
- fingerprint conflict;
- in-progress;
- unavailable.

Candidate future audit outcomes:

- written;
- unavailable;
- invalid audit input.

HTTP mapping remains outside idempotency and audit repositories.

This gate does not implement error mapping.

## 28. Product Route Eligibility Decision

Decision: Product route implementation remains NOT ELIGIBLE after this gate.

Reason:

The following remain unresolved:

- migration runner implementation authorization;
- actual migration files;
- idempotency repository implementation;
- audit repository implementation;
- product repository implementation;
- package script authorization;
- CI PostgreSQL service authorization;
- service/use-case implementation boundary;
- route/controller implementation authorization;
- explicit implementation authorization.

## 29. Candidate Next Paths

### Option A — Product Persistence Implementation Authorization Readiness Gate

Decision: SELECTED.

Reason:

After idempotency and audit storage strategy, the remaining step is to verify whether enough decisions exist to authorize a narrow implementation slice, or to explicitly identify remaining blockers without starting code.

### Option B — Product Idempotency Implementation

Decision: NO-GO.

Reason:

Implementation remains blocked by explicit authorization, migrations, repository implementation, and CI/test DB setup.

### Option C — Product Audit Implementation

Decision: NO-GO.

Reason:

Implementation remains blocked by explicit authorization, migrations, repository implementation, and CI/test DB setup.

### Option D — Product Route Implementation

Decision: NO-GO.

Reason:

Routes remain blocked by persistence, idempotency, audit, service/use-case boundary, and implementation authorization.

## 30. Selected Next Path

Selected next path:

`Backend Slice 0 Product Persistence Implementation Authorization Readiness Gate`

This selected path is documentation-only unless it explicitly authorizes a later implementation slice.

It must decide:

- whether the accumulated gates are sufficient for implementation authorization;
- which implementation slice is first if authorization is later granted;
- whether migration runner, migration files, package scripts, CI PostgreSQL, repositories, and tests must be implemented before routes;
- what remains blocked.

It must not implement code.

It must not create SQL.

It must not create migrations.

It must not modify package scripts.

It must not modify CI workflows.

## 31. Risk Review

### 31.1 Duplicate Product Risk

Risk:

Create retries without idempotency may create duplicate products.

Mitigation:

Require idempotency reservation/replay before future product create implementation.

### 31.2 Fingerprint Drift Risk

Risk:

Same idempotency key may be reused with different body.

Mitigation:

Require normalized request fingerprint and conflict behavior.

### 31.3 Audit Gap Risk

Risk:

Product writes may occur without audit events.

Mitigation:

Require audit event write in the same transaction as successful product write.

### 31.4 Transaction Split Risk

Risk:

Product, idempotency, and audit writes may commit independently.

Mitigation:

Require transaction-capable repositories and service/use-case ownership of write transaction.

### 31.5 Scope Creep Risk

Risk:

Audit and idempotency may expand into full platform-wide implementation.

Mitigation:

Limit this gate to product create/update V1 write flows.

## 32. Final Decision

Decision: GO to Backend Slice 0 Product Persistence Implementation Authorization Readiness Gate.

This decision accepts a documentation-only product idempotency and audit storage strategy.

This decision keeps idempotency implementation blocked.

This decision keeps audit implementation blocked.

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

## 33. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Product Persistence Implementation Authorization Readiness Gate`

That gate should determine whether the planning chain is sufficient to authorize a narrow implementation slice, without starting implementation inside the readiness gate itself.

## 34. Explicit Non-Authorization

This product idempotency and audit storage strategy gate does not authorize:

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
- audit persistence;
- workspace membership persistence;
- deployment changes;
- secrets changes;
- UI changes;
- workflow changes;
- formatting baseline cleanup.

## 35. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged Product Repository API and Transaction Boundary Planning Gate.
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

- Idempotency applicability decided for createProduct.
- Idempotency storage strategy selected.
- Idempotency uniqueness boundary selected.
- Idempotency request fingerprint boundary selected.
- Idempotency replay/conflict behavior planned.
- Idempotency transaction boundary planned.
- Audit applicability decided for product create/update.
- Audit storage strategy selected.
- Audit actor/workspace/product capture decided.
- Audit action names planned.
- Audit before/after state policy planned.
- Audit transaction boundary planned.
- Combined create flow strategy planned.
- Combined update flow strategy planned.
- Product Persistence Implementation Authorization Readiness Gate selected as next gate.

### Gaps

- Actual idempotency implementation unresolved.
- Actual audit implementation unresolved.
- Actual product repository implementation unresolved.
- Migration runner implementation unresolved.
- Actual migration files unresolved.
- Package scripts unresolved.
- CI PostgreSQL service unresolved.
- Service/use-case implementation boundary unresolved.
- Route/controller implementation unresolved.
- Explicit implementation authorization unresolved.

### Transition Decision

GO to `Backend Slice 0 Product Persistence Implementation Authorization Readiness Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
