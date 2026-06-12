# Nashir Backend Slice 0 — AuditRepository Planning Gate

## 1. Gate Name

Backend Slice 0 AuditRepository Planning Gate

## 2. Gate Type

Planning gate.

This gate plans the future AuditRepository implementation after the Product Route Handler implementation and acceptance review were completed.

This gate does not authorize implementation.

## 3. Inputs

### 3.1 Repository

- Repository: `henter36/nashir-backend`
- Base branch: `main`

### 3.2 Completed Prior Gates / PRs

| Item | Status |
| :--- | :--- |
| Product persistence infrastructure | Completed |
| ProductRepository implementation | Completed |
| IdempotencyRepository implementation | Completed |
| Request Context Permissions implementation | Completed |
| Product Route Handler implementation | Completed |
| Product Route Handler Acceptance Gate | Completed |
| Product Route Handler Acceptance Review Gate | Completed |

### 3.3 Current Known Gap

The Product Route Handler implementation intentionally did not implement:
* AuditRepository
* Runtime audit event writing
* Product create/update audit persistence
This planning gate exists to decide the scope and boundaries of that future audit slice.

## 4. Problem Statement

Product route handlers now exist for product create/update behavior, but audit behavior remains deferred.
This creates a compliance and traceability gap:
* Product create/update actions can happen through backend routes.
* The system does not yet have an accepted AuditRepository implementation slice.
* Runtime audit event persistence is not yet accepted as complete.

## 5. Planning Scope

This gate plans a future repository-level audit implementation.
The planned implementation target is:
AuditRepository
The planned audit persistence target is:
audit_events
The planned future slice should support writing audit records for backend-controlled product mutations.

## 6. In-Scope for Future Implementation Planning

The future implementation slice may include planning for:
* A new AuditRepository.
* A typed audit event input model.
* Insert-only audit event persistence.
* Product create audit event writing.
* Product update audit event writing.
* Tests for AuditRepository.
* Tests for product route handler audit integration.
* Failure behavior when audit persistence fails.
* Boundary between audit persistence and product/idempotency transactions.

## 7. Out of Scope for This Planning Gate

This planning gate does not authorize:
* Creating AuditRepository.
* Modifying route handlers.
* Writing audit events.
* Changing database migrations.
* Changing audit_events schema.
* Changing OpenAPI authority.
* Changing generated clients.
* Changing CI workflows.
* Changing packages or dependencies.
* Changing authentication or authorization behavior.
* Implementing Auth0 permission mapping.
* Implementing production WorkspaceMembershipResolver wiring.
* Implementing idempotency failed retry/reclaim behavior.

## 8. Required Decisions Before Implementation

### 8.1 Audit Event Shape

Decision required:
Define the exact AuditRepository input contract.
Minimum proposed fields:

| Field | Purpose |
| :--- | :--- |
| `workspaceId` | Workspace boundary |
| `actorId` | Actor performing the action |
| `action` | Audited action name |
| `resourceType` | Resource category, e.g. `product` |
| `resourceId` | Resource identifier |
| `correlationId` | Request correlation identifier |
| `metadata` | Additional structured event data |
Proposed action names:

| Product Operation | Proposed Audit Action |
| :--- | :--- |
| Product created | `product.created` |
| Product updated | `product.updated` |
This is a proposal, not yet an implementation decision.

### 8.2 Transaction Boundary

Decision required:
Choose whether audit writes must be in the same transaction as product mutation.
Options:

| Option | Meaning | Risk |
| :--- | :--- | :--- |
| Same transaction | Product change and audit write commit/fail together | Strong consistency, but audit failures block product mutation |
| Separate transaction | Product change can succeed even if audit write fails | Possible audit gap |
| Outbox-style deferred audit | Product change records audit intent for later processing | More robust, but larger scope |
Recommended for V1:
Same transaction for product create/update audit events.
Reason:
V1 needs a simple and reviewable audit guarantee for product mutations.

### 8.3 Audit Failure Behavior

Decision required:
Define what happens if audit write fails.
Proposed V1 behavior:
* Product create/update should fail if the required audit write fails.
* Return internal error using existing error model.
* Do not silently ignore audit failures.
Rationale:
If a route is contractually audit-required, silent audit failure creates compliance drift.

### 8.4 Idempotency Interaction

Decision required:
Define create-product idempotency interaction with audit writes.
Proposed V1 behavior:
* First successful create writes one audit event.
* Idempotency replay returns stored response and does not write a second audit event.
* Failed idempotency retry policy remains out of scope unless separately authorized.

### 8.5 Update Conflict Interaction

Decision required:
Define audit behavior for product update conflicts.
Proposed V1 behavior:
* Successful update writes product.updated.
* Version conflict does not write audit event because no product mutation occurred.
* Not found does not write audit event because no product mutation occurred.

### 8.6 Audit Metadata

Decision required:
Define metadata included in audit event.
Proposed V1 metadata for create:

| Field | Meaning |
| :--- | :--- |
| `productId` | Created product ID |
| `status` | Product status |
| `idempotencyKey` | Present for create requests |
| `version` | Created version |
Proposed V1 metadata for update:

| Field | Meaning |
| :--- | :--- |
| `productId` | Updated product ID |
| `previousVersion` | Expected version from request |
| `newVersion` | Resulting product version |
| `changedFields` | Names of updated fields |
This is a proposal and must be reviewed before implementation.

## 9. Proposed Future File Scope

The future implementation gate may authorize a limited file set.
Proposed files:

| File | Purpose |
| :--- | :--- |
| `src/audit/audit-repository.ts` | New AuditRepository |
| `src/audit/audit-types.ts` | Audit input/result types |
| `tests/audit/audit-repository.test.ts` | Repository tests |
| `src/products/product-handlers.ts` | Wire audit writes into create/update only |
| `tests/products/product-route-handler.test.ts` | Add audit integration coverage |
This is proposed only. It is not authorized by this planning gate.

## 10. Proposed Blocklist

The future implementation gate should continue to block:
* OpenAPI authority changes.
* Generated client changes.
* New migrations unless separately authorized.
* Auth guard changes.
* Permission guard changes.
* Workspace context guard changes.
* IdempotencyRepository behavior changes unless separately authorized.
* Package/dependency changes.
* CI workflow changes.
* UI work.

## 11. Risks

| Risk | Status | Notes |
| :--- | :--- | :--- |
| Product mutations without audit persistence | Open | Main driver for this planning gate |
| Audit write failure behavior unclear | Open | Must be decided before implementation |
| Product and audit transaction boundary unclear | Open | Must be decided before implementation |
| Idempotency replay causing duplicate audit events | Open | Must be explicitly prevented |
| Failed idempotency retry policy mixed into audit slice | Open | Should remain separate unless authorized |
| Audit metadata overcollection | Open | Metadata should be minimal and non-sensitive |
| OpenAPI drift | Controlled | OpenAPI changes are out of scope |
| Scope creep into Auth0 mapping | Controlled | Auth0 mapping remains separate |

## 12. Legal / Compliance Review

Audit events may contain operationally sensitive data.
Planning constraints:
* Do not store secrets.
* Do not store raw Authorization headers.
* Do not store full request bodies unless explicitly approved.
* Do not store unnecessary PII.
* Store minimal structured metadata needed for traceability.
* Keep workspace and actor boundaries clear.

## 13. Recommended V1 Direction

Recommended V1 planning decision:
* Implement insert-only AuditRepository.
* Use existing audit_events persistence target if already created by approved migrations.
* Do not create new migrations in the first audit implementation slice unless schema gap is proven.
* Wire audit writes only to product create/update.
* Write audit events inside the product mutation transaction if repository transaction support allows it.
* Do not audit read/list endpoints in V1.
* Do not change idempotency failed retry behavior in this slice.

## 14. Acceptance Criteria for the Future Implementation Gate

A future implementation gate should require:

* Exact file allowlist.
* Exact audit event input shape.
* Exact transaction behavior.
* Exact failure behavior.
* Tests for successful create audit.
* Tests for successful update audit.
* Tests proving idempotency replay does not duplicate audit event.
* Tests proving update conflict does not write audit event.
* Tests proving audit failure behavior.
* Confirmation that OpenAPI, generated clients, migrations, packages, and CI are untouched unless explicitly authorized.

## 15. Decision

Decision: GO to AuditRepository Planning Review Gate.
This gate authorizes only a planning review gate.
This gate does not authorize AuditRepository implementation.

## 16. Next Gate

Recommended next gate:
Backend Slice 0 AuditRepository Planning Review Gate
Purpose:
* Review and approve the audit event shape.
* Decide transaction boundary.
* Decide audit failure behavior.
* Decide metadata boundaries.
* Decide whether implementation can proceed without a migration.
* Produce an implementation authorization gate only if all required decisions are resolved.

## 17. Verification Commands

Run from repository root:

```bash
git checkout main
git pull origin main
git status -sb
git log --oneline -5
grep -R "AuditRepository" -n src tests docs || true
grep -R "audit_events" -n src tests migrations docs || true
```

## 18. Output

This gate produces:
* A planning record for the future AuditRepository slice.
* A list of decisions required before implementation.
* A proposed V1 direction.
* A GO decision only to AuditRepository Planning Review Gate.
