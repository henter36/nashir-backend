# Nashir Backend Slice 0 — AuditRepository Implementation Authorization Gate

## 1. Gate Name

Backend Slice 0 AuditRepository Implementation Authorization Gate

## 2. Gate Type

Implementation authorization gate.

This gate authorizes a future narrow implementation PR for AuditRepository only if the decisions below are accepted.

This gate does not implement runtime code.

## 3. Inputs

### 3.1 Repository

- Repository: `henter36/nashir-backend`
- Base branch: `main`

### 3.2 Prior Gates

- `docs/nashir_backend_slice_0_audit_repository_planning_gate.md`
- `docs/nashir_backend_slice_0_audit_repository_planning_review_gate.md`

### 3.3 Current Implemented Context

The following Backend Slice 0 components already exist:

- Product persistence infrastructure.
- ProductRepository.
- IdempotencyRepository.
- Product route handlers.
- Request context permissions.
- Permission guard wiring.
- Workspace context guard wiring.

## 4. Authorization Objective

Authorize the minimum implementation scope required to close the current audit gap for product create/update mutations.

The implementation must:

1. Add a dedicated `AuditRepository`.
2. Use the existing `audit_events` table if sufficient.
3. Wire audit writes into successful product create/update only.
4. Prevent duplicate audit events on idempotency replay.
5. Prevent successful audited mutation when required audit write fails.
6. Avoid OpenAPI, generated client, auth, permission, workspace context, package, CI, UI, and deployment changes.

## 5. Existing Schema Verification

The existing `audit_events` table is the preferred V1 persistence target.

Accepted schema mapping:

| Audit Concept | Existing Column | Decision |
| :--- | :--- | :--- |
| Audit event ID | `audit_event_id` | Use backend-generated UUID/string |
| Workspace ID | `workspace_id` | Required |
| Actor ID | `actor_id` | Required |
| Action | `action_name` | Use values such as `product.created` and `product.updated` |
| Resource type | `resource_type` | Use `product` |
| Resource ID | `resource_id` | Required for product mutations |
| Correlation/request ID | `request_id` | Use request correlation ID when available |
| Occurred at | `created_at` | Database-generated timestamp; do not accept from client |
| Metadata | `before_state` / `after_state` | Keep minimal and non-sensitive |

Decision:

GO with existing `audit_events` schema.

No migration is authorized by this gate.

## 6. Authorized Implementation Scope

The future implementation PR may modify only the following files unless review proves a narrower equivalent path:

| File | Purpose |
| :--- | :--- |
| `src/audit/audit-types.ts` | Define audit input/result types |
| `src/audit/audit-repository.ts` | Implement AuditRepository |
| `tests/audit/audit-repository.test.ts` | DB-backed AuditRepository tests |
| `src/products/product-handlers.ts` | Wire audit writes into product create/update only |
| `src/products/product-route.ts` | Pass AuditRepository dependency into product handlers if required |
| `src/app.ts` | Wire AuditRepository only if app-level dependency injection requires it |
| `tests/products/product-route-handler.test.ts` | Add audit integration coverage |

Conditional file:

| File | Condition |
| :--- | :--- |
| `src/products/product-repository.ts` | Only if narrow transaction client support is required to ensure product mutation and audit write share one consistency boundary |

## 7. Explicit Blocklist

The future implementation PR must not modify:

- OpenAPI authority files.
- Generated clients.
- SQL migrations.
- Auth guard.
- Permission guard.
- Workspace context guard.
- Request context parsing.
- IdempotencyRepository behavior, unless separately authorized.
- Package dependencies.
- CI workflow.
- UI files.
- Deployment files.
- Product read/list behavior.
- Product schema contract beyond dependency wiring.

## 8. Transaction Boundary Decision

Preferred V1 decision:

Product create/update and required audit write must be executed in one reliable consistency boundary.

Accepted implementation direction:

- Use the same database client/transaction when feasible.
- If current repository wiring cannot support same-transaction behavior without broad refactoring, the implementation PR must stop and request a separate transaction-boundary planning gate.

Silent audit failure is not acceptable.

## 9. Audit Behavior Rules

### 9.1 Product Create

Successful first create must write one audit event:

- `action_name`: `product.created`
- `resource_type`: `product`
- `resource_id`: created product ID
- `workspace_id`: request context workspace ID
- `actor_id`: request context actor ID
- `request_id`: correlation ID if available
- metadata: minimal and non-sensitive

Idempotency replay must not write a duplicate audit event.

Failed create must not write a success audit event.

### 9.2 Product Update

Successful update must write one audit event:

- `action_name`: `product.updated`
- `resource_type`: `product`
- `resource_id`: updated product ID
- `workspace_id`: request context workspace ID
- `actor_id`: request context actor ID
- `request_id`: correlation ID if available
- metadata: minimal and non-sensitive

Version conflict must not write an audit event.

Not found must not write an audit event.

Validation failure must not write an audit event.

### 9.3 Read/List

Product read and list endpoints are not audited in V1.

## 10. Metadata Boundary

Allowed metadata examples:

| Operation | Allowed Metadata |
| :--- | :--- |
| `product.created` | `productId`, `status`, `idempotencyKey`, `version` |
| `product.updated` | `productId`, `previousVersion`, `newVersion`, `changedFields` |

Blocked metadata:

- Raw authorization headers.
- Raw tokens.
- Full request body.
- Full product payload.
- Secrets.
- Client-provided timestamp as source of truth.
- Excessive or unrelated data.

## 11. Required Tests

The future implementation PR must include tests for:

| Area | Required Coverage |
| :--- | :--- |
| AuditRepository insert | Persists required audit fields |
| Timestamp boundary | Uses database/backend time, not client input |
| Product create success | Writes one `product.created` audit event |
| Product create replay | Does not duplicate audit event |
| Product create validation failure | No audit event |
| Product create persistence failure | Mutation does not silently succeed if required audit write fails |
| Product update success | Writes one `product.updated` audit event |
| Product update version conflict | No audit event |
| Product update not found | No audit event |
| Product update validation failure | No audit event |
| Metadata boundary | Does not persist raw request body, token, or secrets |

## 12. Risk Review

| Risk | Decision |
| :--- | :--- |
| Existing schema naming differs from planned shape | Accepted through explicit mapping |
| Migration scope creep | Blocked |
| Duplicate audit events on idempotency replay | Must be covered by tests |
| Product mutation succeeds without audit | Blocked |
| Overcollection in metadata | Blocked |
| Transaction refactor becomes broad | Stop and create separate planning gate |
| OpenAPI drift | Blocked |
| Permission/auth drift | Blocked |

## 13. Authorization Decision

Decision: GO.

A future narrow implementation PR is authorized for AuditRepository only, under the allowlist, blocklist, transaction, metadata, and test constraints defined in this gate.

This document does not itself implement AuditRepository.

## 14. Next Gate

Recommended next gate:

Backend Slice 0 AuditRepository Implementation Execution Gate

Purpose:

- Implement the authorized AuditRepository scope.
- Add required tests.
- Run verification.
- Confirm no blocked files changed.
- Confirm no migration, OpenAPI, generated client, auth, permission, workspace context, package, CI, UI, or deployment drift.

## 15. Verification Commands

Run from repository root:

```bash
git checkout main
git pull origin main
git status -sb
git log --oneline -5
grep -R "CREATE TABLE IF NOT EXISTS audit_events" -n migrations
grep -R "audit_events" -n src tests migrations docs || true
grep -R "AuditRepository" -n src tests docs || true
## 16. Output

This gate produces:

Authorization decision for a future AuditRepository implementation PR.
Existing schema mapping decision.
No-migration decision for V1.
File allowlist.
Blocklist.
Transaction boundary decision.
Audit behavior rules.
Required tests.
GO only to narrow AuditRepository implementation execution.
