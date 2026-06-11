# Nashir Backend Slice 0 — Permission Guard Product Route Inventory Review Gate

## 1. Gate Classification

Gate type: Documentation-only product route inventory review gate.

This gate inventories product routes from the accepted external OpenAPI authority.

This gate does not authorize implementation.

This gate does not authorize controller implementation.

This gate does not authorize route implementation.

This gate does not authorize validation script modification.

This gate does not authorize package script modification.

This gate does not authorize CI workflow modification.

This gate does not authorize OpenAPI mutation.

This gate does not authorize generated client changes.

This gate does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #90: `docs: accept permission guard openapi authority pin split`.
- Merged PR #89: `docs: collect permission guard openapi authority evidence`.
- Merged PR #88: `docs: decide permission guard openapi authority pin reconciliation evidence`.
- Merged PR #87: `docs: review permission guard openapi authority pin reconciliation evidence`.
- Merged PR #86: `docs: review permission guard openapi authority pin reconciliation planning`.
- Merged PR #85: `docs: plan permission guard openapi authority pin reconciliation`.
- Merged PR #84: `docs: decide permission guard openapi authority pin reconciliation`.
- Merged PR #83: `docs: confirm permission guard openapi authority source`.
- Merged PR #82: `docs: decide permission guard openapi authority inventory`.
- Merged PR #81: `docs: review permission guard openapi authority inventory`.
- Merged PR #80: `docs: decide permission guard openapi rbac contract alignment`.
- Accepted authority repository: `henter36/nashir`.
- Accepted CI-active Backend Slice 0 authority pin: `36da9ed31903562bddfb7ffd669841956e334a51`.
- Accepted later broader AI/runtime authority pin: `04f54f8be852001173f4014cb2d81c5cdb97e35c`.
- Accepted OpenAPI authority file: `docs/nashir_v1_openapi.yaml`.
- Existing Auth0 identity-only boundary.
- Existing route/path `workspaceId` authority.
- Existing workspace-before-permission ordering.
- Existing membership-before-permission ordering.
- Existing internal harness-only permission guard app wiring.
- Existing contract-first governance.
- Existing non-authorization of implementation.
- Existing non-authorization of OpenAPI mutation.
- Existing non-authorization of validation script modification.
- Existing non-authorization of generated client changes.
- Existing non-authorization of product/public routes.
- Existing non-authorization of DB, ORM, migrations, deployment, secrets, UI, workflow, and formatting baseline cleanup.

## 3. Review Objective

This gate inventories product routes only.

This gate must identify:

- product route paths;
- HTTP methods;
- operation IDs;
- route workspace scope;
- permission strings;
- membership check behavior;
- guard-chain expectation;
- audit expectation;
- sensitive operation classification;
- implementation eligibility;
- unresolved gaps before permission representation and route implementation.

This gate must not implement product routes.

This gate must not select persistent RBAC storage.

This gate must not modify OpenAPI.

## 4. Product Route Inventory Source

The product route inventory source is:

- Repository: `henter36/nashir`
- Authority pin: `36da9ed31903562bddfb7ffd669841956e334a51`
- File: `docs/nashir_v1_openapi.yaml`

This is the current accepted Backend Slice 0 CI-active OpenAPI authority context.

The later broader authority pin `04f54f8be852001173f4014cb2d81c5cdb97e35c` remains accepted as broader AI/runtime planning authority evidence only.

## 5. OpenAPI Product Route Inventory

The direct product routes identified from the accepted OpenAPI authority are:

| Route | Method | operationId | Permission | Workspace scope | Membership check | Audit | Sensitive | Implementation status |
|---|---|---|---|---|---|---:|---:|---|
| `/workspaces/{workspaceId}/products` | GET | `listProducts` | `nashir.products.read` | route | non-disclosing | false | false | Not implemented / not authorized |
| `/workspaces/{workspaceId}/products` | POST | `createProduct` | `nashir.products.manage` | route | non-disclosing | true | false | Not implemented / not authorized |
| `/workspaces/{workspaceId}/products/{productId}` | GET | `getProduct` | `nashir.products.read` | route | non-disclosing | false | false | Not implemented / not authorized |
| `/workspaces/{workspaceId}/products/{productId}` | PUT | `updateProduct` | `nashir.products.manage` | route | non-disclosing | true | false | Not implemented / not authorized |

## 6. Product Route Permission Inventory

The direct product route permission strings are:

| Permission | Used by | Classification |
|---|---|---|
| `nashir.products.read` | `listProducts`, `getProduct` | Product read permission |
| `nashir.products.manage` | `createProduct`, `updateProduct` | Product write/manage permission |

Finding:

The product route inventory introduces two product permissions for future representation:

- `nashir.products.read`
- `nashir.products.manage`

This gate does not decide role-to-permission mapping.

This gate does not decide persistent RBAC storage.

This gate does not decide permission seeding.

## 7. Product Route Workspace Boundary Inventory

All direct product routes are workspace-scoped through the route path:

- `/workspaces/{workspaceId}/products`
- `/workspaces/{workspaceId}/products/{productId}`

Observed workspace scope:

- `x-workspace-scope: route`

Accepted boundary:

- `workspaceId` is path-derived.
- `workspaceId` must not be trusted from request body.
- product resources must remain under the resolved workspace boundary.
- product names are display labels only and must not be treated as identity.
- `productId` is the canonical product identifier.

## 8. Product Route Membership Boundary Inventory

All direct product routes use:

- `x-membership-check: non-disclosing`

Expected guard behavior:

- unauthenticated request returns 401.
- authenticated actor without active workspace membership should not disclose workspace/resource existence.
- route should follow the non-disclosing membership path before permission enforcement.
- permission check should not run before workspace context and membership context are resolved.

This gate does not implement the membership check.

## 9. Product Route Guard Chain Inventory

Observed guard chain for product routes:

### Read operations

Expected guard chain:

1. `authGuard`
2. `workspaceContextGuard`
3. `nonDisclosingMembershipCheck`
4. `permissionGuard`

Applies to:

- `listProducts`
- `getProduct`

### Write/manage operations

Expected guard chain:

1. `authGuard`
2. `workspaceContextGuard`
3. `nonDisclosingMembershipCheck`
4. `permissionGuard`
5. `rejectBodyWorkspaceId`

Applies to:

- `createProduct`
- `updateProduct`

Finding:

The product route guard-chain inventory aligns with the existing Backend Slice 0 guard sequencing:

- Auth identity first.
- Workspace context second.
- Membership boundary before permission enforcement.
- Permission guard after context resolution.
- Reject body `workspaceId` for write operations.

This gate does not implement the chain on product routes.

## 10. Product Route Response Inventory

Observed response families across product routes:

| Response | Inventory finding |
|---|---|
| `200` | success for list/get/update |
| `201` | success for create |
| `400` | bad request where applicable |
| `401` | unauthorized |
| `403` | permission denied |
| `404` | not found / non-disclosing boundary candidate |
| `409` | conflict / version or idempotency conflict where applicable |
| `422` | validation failed where applicable |
| `default` | default error model |

Finding:

The product routes require later error and disclosure mapping before implementation.

This gate does not decide route-specific response body behavior.

This gate does not implement response contracts.

## 11. Product Route Write-Operation Inventory

Write/manage operations:

| Route | Method | operationId | Write control evidence |
|---|---|---|---|
| `/workspaces/{workspaceId}/products` | POST | `createProduct` | idempotency key required; audit required; body workspaceId rejected |
| `/workspaces/{workspaceId}/products/{productId}` | PUT | `updateProduct` | optimistic concurrency via `If-Match` or `X-Resource-Version`; audit required; body workspaceId rejected |

Finding:

Write operations require additional implementation planning before any route code:

- idempotency behavior;
- optimistic concurrency behavior;
- audit event behavior;
- validation failure mapping;
- non-disclosing membership behavior;
- permission enforcement behavior.

This gate does not authorize those implementations.

## 12. Product Route Implementation Eligibility

Decision: NOT ELIGIBLE for implementation in this gate.

Reason:

The product route inventory is now documented, but the following are unresolved:

- permission representation;
- role-to-permission mapping;
- route-level error/disclosure mapping;
- resource workspace ownership resolution;
- product data model persistence;
- idempotency persistence;
- optimistic concurrency persistence;
- audit event persistence;
- generated artifact inventory;
- product route implementation authorization.

## 13. Candidate Next Paths

### Option A — Permission Representation Decision Gate

Decision: SELECTED.

Reason:

The product route inventory identifies two concrete product permissions:

- `nashir.products.read`
- `nashir.products.manage`

The next safe step is to decide how permissions are represented for documentation and later enforcement planning, without implementing persistent RBAC.

### Option B — Product Route Implementation Planning Gate

Decision: NO-GO.

Reason:

Implementation planning is premature before permission representation and error/disclosure mapping.

### Option C — Error and Disclosure Mapping Decision Gate

Decision: DEFER.

Reason:

Error/disclosure mapping should follow permission representation and route inventory.

### Option D — Persistent RBAC Planning Gate

Decision: NO-GO.

Reason:

Persistent RBAC requires permission representation, data model, migration, and runtime resolver authorization.

### Option E — Generated Client Inventory Gate

Decision: DEFER.

Reason:

Generated clients remain blocked. Generated artifact impact can be reviewed later, after permission representation and implementation planning boundaries are clearer.

## 14. Selected Next Path

Selected next path:

`Backend Slice 0 Permission Guard Permission Representation Decision Gate`

This selected path is documentation-only.

It must decide how route permission strings are represented for the next planning stage.

It must not implement routes.

It must not modify OpenAPI.

It must not generate clients.

It must not modify validation scripts.

It must not modify package scripts.

It must not modify CI workflow files.

It must not add DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 15. Decision on Product Route Implementation

Decision: NO-GO.

Reason:

This gate inventories product routes only.

No route implementation is authorized.

No changes are authorized to:

- `src/app.ts`
- route modules
- controllers
- services
- repositories
- request schemas
- tests

## 16. Decision on OpenAPI Mutation

Decision: NO-GO.

Reason:

The product route inventory uses the accepted external OpenAPI authority.

No OpenAPI mutation is authorized.

No OpenAPI file may be changed.

## 17. Decision on Generated Clients

Decision: NO-GO.

Reason:

Generated clients remain blocked.

No generated client changes are authorized.

## 18. Decision on Validation Script Modification

Decision: NO-GO.

Reason:

No validation script change is required for route inventory.

No change is authorized to:

- `scripts/validate-contract-authority.mjs`
- `scripts/validate-contracts.mjs`

## 19. Decision on Package Script Modification

Decision: NO-GO.

Reason:

No package script change is required for route inventory.

No change is authorized to:

- `package.json`

## 20. Decision on CI Workflow Modification

Decision: NO-GO.

Reason:

No CI workflow change is required for route inventory.

No change is authorized to:

- `.github/workflows/ci.yml`
- any other CI workflow file

## 21. Risk Review

### 21.1 Route Inventory Mistaken for Implementation

Risk:

A documented route inventory may be mistaken for route implementation authorization.

Mitigation:

State NO-GO for route implementation.

### 21.2 Permission Representation Drift

Risk:

Permission strings may be interpreted differently across future code, docs, and OpenAPI.

Mitigation:

Proceed to a Permission Representation Decision Gate.

### 21.3 Workspace Disclosure Risk

Risk:

Product routes may disclose workspace or product existence if membership and permission ordering is wrong.

Mitigation:

Preserve non-disclosing membership boundary before implementation.

### 21.4 Body Workspace Trust Risk

Risk:

Write operations may accept workspace identity from request body.

Mitigation:

Preserve `rejectBodyWorkspaceId` as future write-operation guard.

### 21.5 Generated Client Creep Risk

Risk:

Route inventory may trigger generated client changes prematurely.

Mitigation:

Keep generated clients blocked.

## 22. Final Decision

Decision: GO to Backend Slice 0 Permission Guard Permission Representation Decision Gate.

This decision selects a documentation-only permission representation decision gate.

This decision does not authorize implementation.

This decision does not authorize route implementation.

This decision does not authorize controller implementation.

This decision does not authorize validation script modification.

This decision does not authorize package script modification.

This decision does not authorize CI workflow modification.

This decision does not authorize OpenAPI mutation.

This decision does not authorize generated client changes.

This decision does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 23. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Permission Guard Permission Representation Decision Gate`

That gate should decide how the route permission strings identified here are represented for later planning.

## 24. Explicit Non-Authorization

This product route inventory review gate does not authorize:

- runtime implementation;
- route implementation;
- controller implementation;
- service implementation;
- repository implementation;
- product route implementation;
- public route implementation;
- OpenAPI mutation;
- validation script modification;
- package script modification;
- CI workflow modification;
- generated client changes;
- generated artifact regeneration;
- DB-backed permission resolver;
- ORM-backed permission resolver;
- permission migrations;
- product persistence;
- idempotency persistence;
- optimistic concurrency persistence;
- audit persistence;
- workspace membership persistence;
- deployment changes;
- secrets changes;
- UI changes;
- workflow changes;
- formatting baseline cleanup.

## 25. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged OpenAPI Authority Pin Split Acceptance Decision Gate.
- Merged OpenAPI Authority Additional Evidence Collection Gate.
- Merged OpenAPI Authority Pin Reconciliation Evidence Decision Gate.
- Merged OpenAPI Authority Pin Reconciliation Evidence Review Gate.
- Merged OpenAPI Authority Pin Reconciliation Planning Review Gate.
- Merged OpenAPI Authority Pin Reconciliation Planning Gate.
- Merged OpenAPI Authority Pin Reconciliation Decision Gate.
- Merged OpenAPI Authority Source Confirmation Gate.
- Merged OpenAPI Authority Inventory Decision Gate.
- Merged OpenAPI Authority Inventory Review Gate.
- Merged OpenAPI RBAC Contract Alignment Decision Gate.
- Accepted OpenAPI authority file.
- Product route path inventory.
- Product route method inventory.
- Product route permission inventory.
- Product route guard-chain inventory.
- Product route response inventory.
- Existing Auth0 identity-only boundary.
- Existing route/path `workspaceId` authority.
- Existing workspace-before-permission ordering.
- Existing membership-before-permission ordering.
- Existing internal harness-only permission guard app wiring.
- Existing contract-first governance.

### Outputs

- Identified four direct product operations.
- Identified two product route paths.
- Identified two product permission strings.
- Classified all product routes as workspace-scoped via route.
- Classified all product routes as non-disclosing membership routes.
- Classified product write operations as requiring `rejectBodyWorkspaceId`.
- Rejected product route implementation.
- Rejected OpenAPI mutation.
- Rejected generated client changes.
- Selected Permission Representation Decision Gate as the next gate.

### Gaps

- Permission representation unresolved.
- Role-to-permission mapping unresolved.
- Error/disclosure mapping unresolved.
- Product persistence unresolved.
- Resource workspace ownership resolution unresolved.
- Idempotency persistence unresolved.
- Optimistic concurrency persistence unresolved.
- Audit persistence unresolved.
- Generated artifact inventory unresolved.
- Generated client impact unresolved.
- First eligible product route slice unresolved.
- Persistent RBAC model unresolved.

### Transition Decision

GO to `Backend Slice 0 Permission Guard Permission Representation Decision Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
