# Nashir Backend Slice 0 — Permission Guard Product Route Implementation Planning Gate

## 1. Gate Classification

Gate type: Documentation-only product route implementation planning gate.

This gate plans product route implementation boundaries.

This gate does not authorize implementation.

This gate does not authorize route implementation.

This gate does not authorize controller, service, repository, DB, ORM, migrations, generated clients, OpenAPI mutation, validation script modification, package script modification, CI workflow modification, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #93: `docs: decide permission guard error disclosure mapping`.
- Merged PR #92: `docs: decide permission guard permission representation`.
- Merged PR #91: `docs: review permission guard product route inventory`.
- Accepted OpenAPI authority repository: `henter36/nashir`.
- Accepted CI-active Backend Slice 0 authority pin: `36da9ed31903562bddfb7ffd669841956e334a51`.
- Accepted OpenAPI authority file: `docs/nashir_v1_openapi.yaml`.
- Accepted product routes:
  - `GET /workspaces/{workspaceId}/products`
  - `POST /workspaces/{workspaceId}/products`
  - `GET /workspaces/{workspaceId}/products/{productId}`
  - `PUT /workspaces/{workspaceId}/products/{productId}`
- Accepted product permissions:
  - `nashir.products.read`
  - `nashir.products.manage`
- Accepted error and disclosure mapping.
- Existing Auth0 identity-only boundary.
- Existing route/path `workspaceId` authority.
- Existing deny-by-default rule.
- Existing workspace-before-permission ordering.
- Existing membership-before-permission ordering.
- Existing workspace context guard behavior, where current implementation combines route workspace resolution with non-disclosing membership lookup.
- Existing permission guard primitive.
- Existing internal harness-only app wiring.
- Existing non-authorization of implementation.

## 3. Planning Objective

This gate must plan:

- the product route implementation boundary;
- which files may be candidates in a future implementation gate;
- which files must remain out of scope;
- which product routes can be implemented first;
- which dependencies block implementation;
- which persistence decisions are required before implementation;
- which generated artifacts must remain unchanged unless explicitly authorized;
- which tests would be required in a future implementation gate.

This gate must not write product route code.

This gate must not create product controllers.

This gate must not create product services.

This gate must not create product repositories.

This gate must not add DB, ORM, or migrations.

## 4. Current Runtime Inventory

Current runtime state:

- The backend app is a Fastify runtime.
- `/health` exists and must remain ungated.
- Internal harness routes exist only when explicitly enabled.
- The permission guard harness is internal-only.
- Product routes are not currently implemented.
- Product route implementation remains unauthorized.

Future product route work must not affect:

- `/health`;
- internal harness route opt-in behavior;
- request correlation behavior;
- non-disclosing error behavior;
- existing tests unless explicitly updated for authorized behavior.

## 5. Product Routes Planned

The product routes planned for future implementation are:

| Route | Method | operationId | Permission | Status |
|---|---|---|---|---|
| `/workspaces/{workspaceId}/products` | GET | `listProducts` | `nashir.products.read` | Planned only |
| `/workspaces/{workspaceId}/products` | POST | `createProduct` | `nashir.products.manage` | Planned only |
| `/workspaces/{workspaceId}/products/{productId}` | GET | `getProduct` | `nashir.products.read` | Planned only |
| `/workspaces/{workspaceId}/products/{productId}` | PUT | `updateProduct` | `nashir.products.manage` | Planned only |

This gate does not authorize implementation of these routes.

## 6. Required Guard Order

Future product route implementation must preserve the accepted guard behavior.

### Read operations

Applies to:

- `listProducts`
- `getProduct`

Required order:

1. `authGuard`
2. `workspaceContextGuard`
   - Current implementation combines route workspace resolution and non-disclosing membership checking.
   - Future implementation may preserve this combined hook.
   - Any split into a separate `nonDisclosingMembershipCheck` requires explicit authorization.
3. `permissionGuard`
4. resource lookup / ownership verification

### Write operations

Applies to:

- `createProduct`
- `updateProduct`

Required order:

1. `authGuard`
2. `workspaceContextGuard`
   - Current implementation combines route workspace resolution and non-disclosing membership checking.
   - Future implementation may preserve this combined hook.
   - Any split into a separate `nonDisclosingMembershipCheck` requires explicit authorization.
3. `permissionGuard`
4. `rejectBodyWorkspaceId`
5. validation
6. idempotency or optimistic concurrency check
7. persistence
8. audit

This gate does not implement this order.

## 7. Error and Disclosure Mapping Dependency

Future product route implementation must preserve the accepted mapping:

| Scenario | Required behavior |
|---|---|
| unauthenticated | 401 |
| no visible workspace or membership boundary | 404 |
| active member without required permission | 403 |
| malformed route/header/query protocol input | 400 |
| invalid domain payload | 422 |
| idempotency or optimistic concurrency conflict | 409 |
| product missing or cross-workspace | 404 |

Rules:

- 404 must not disclose semantic existence.
- 403 must not disclose product existence.
- 409 must not run before authorization.
- 422 must not trust body workspace identity.
- Error bodies must not leak stack traces, SQL errors, ORM errors, permission lists, role mappings, workspace internals, or product ownership details.

This gate does not implement error handling.

## 8. Candidate Future File Boundaries

The following files may be candidates in a future implementation authorization gate:

| File or area | Future purpose | Current decision |
|---|---|---|
| `src/app.ts` | register authorized product routes | Candidate only |
| `src/permission-guard.ts` | reuse existing permission guard primitive | Reuse only; no change authorized here |
| `src/workspace-context-guard.ts` | preserve existing combined workspace/membership behavior | Reuse only; no change authorized here |
| `src/error-model.ts` | reuse accepted ErrorModel behavior | Reuse only; no change authorized here |
| `tests/*` | future route behavior tests | Candidate only |

The following are not authorized by this gate:

- product route files;
- product controller files;
- product service files;
- product repository files;
- product schema files;
- DB migrations;
- ORM models;
- generated clients;
- OpenAPI changes;
- CI workflow changes;
- package script changes.

## 9. Product Persistence Blocking Decision

Decision: Product route implementation is blocked by product persistence strategy.

Reason:

Product routes represent real product catalog behavior. Implementing create, update, get, or list without a persistence boundary would create a misleading runtime surface.

The following are unresolved:

- product storage model;
- product repository boundary;
- product ownership by `workspaceId`;
- product identity generation;
- product versioning for optimistic concurrency;
- idempotency key storage;
- audit event storage;
- archival behavior, if any;
- database migration ownership;
- SQL versus ORM approach;
- test database strategy.

Therefore, direct product route implementation is not eligible after this planning gate.

## 10. Product Request and Response Schema Blocking Decision

Decision: Product request/response implementation is blocked until schema ownership is planned.

Reason:

The OpenAPI authority defines product route contracts. Runtime schemas must not drift from the authority.

Unresolved items:

- whether runtime validation schemas are hand-written or generated;
- how OpenAPI request/response shapes are consumed;
- how validation errors map to 400 versus 422;
- how extra body fields are rejected;
- how body `workspaceId` or `workspace_id` rejection is enforced;
- how version/concurrency headers are parsed;
- how idempotency key header is parsed.

This gate does not authorize schema implementation.

## 11. Generated Artifact Decision

Decision: Generated clients and generated artifacts remain out of scope.

Reason:

No OpenAPI mutation is authorized. No generated client impact has been reviewed in this gate.

Future implementation must not modify:

- OpenAPI authority;
- generated clients;
- generated types;
- validation scripts;
- package scripts;
- CI workflow files.

Generated artifact work requires a separate authorization gate.

## 12. Candidate Implementation Slice Plan

A future implementation plan should be sliced as follows.

### Slice A — Product Persistence Strategy Decision

Purpose:

Decide storage and repository boundaries before route implementation.

Required outputs:

- persistence strategy;
- migration ownership;
- product workspace ownership model;
- idempotency storage decision;
- optimistic concurrency storage decision;
- audit storage decision;
- test data strategy.

Status: REQUIRED BEFORE IMPLEMENTATION.

### Slice B — Product Route Implementation Readiness Review

Purpose:

Review whether all implementation prerequisites are satisfied.

Required outputs:

- exact files allowed to change;
- exact product routes allowed;
- test plan;
- no OpenAPI/generated/CI/package drift confirmation;
- rollback plan.

Status: DEFERRED.

### Slice C — First Product Route Implementation Execution

Purpose:

Implement the first authorized product route slice.

Status: NOT AUTHORIZED.

## 13. First Eligible Product Route Recommendation

Recommendation:

Do not start with all four product routes.

The first eligible future implementation slice should likely be read-focused after persistence is decided:

- `GET /workspaces/{workspaceId}/products`
- `GET /workspaces/{workspaceId}/products/{productId}`

Reason:

Read routes exercise:

- auth;
- workspace context;
- membership non-disclosure;
- permission guard;
- product workspace ownership;
- 403/404 mapping;
- response shape.

Write routes add additional unresolved concerns:

- idempotency;
- optimistic concurrency;
- body workspace rejection;
- validation;
- audit;
- persistence mutation.

This recommendation does not authorize read route implementation.

## 14. Candidate Next Paths

### Option A — Product Persistence Strategy Decision Gate

Decision: SELECTED.

Reason:

Product route implementation cannot be safely planned to execution without deciding product persistence, repository ownership, idempotency, concurrency, and audit storage boundaries.

### Option B — Direct Product Route Implementation

Decision: NO-GO.

Reason:

Direct implementation would bypass unresolved persistence and repository decisions.

### Option C — Generated Client Inventory Gate

Decision: DEFER.

Reason:

Generated client work is not needed until implementation planning confirms whether OpenAPI remains unchanged and whether generated artifacts are impacted.

### Option D — Runtime Product Schema Implementation Gate

Decision: NO-GO.

Reason:

Schema implementation is runtime work and must follow persistence and implementation authorization.

## 15. Selected Next Path

Selected next path:

`Backend Slice 0 Product Persistence Strategy Decision Gate`

This selected path is documentation-only.

It must decide product persistence and repository boundaries.

It must not implement routes.

It must not add DB, ORM, or migrations.

It must not modify OpenAPI.

It must not generate clients.

It must not modify validation scripts.

It must not modify package scripts.

It must not modify CI workflow files.

It must not add deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 16. Risk Review

### 16.1 Fake Runtime Surface Risk

Risk:

Implementing product routes without real persistence may create endpoints that look production-ready but are not.

Mitigation:

Require a product persistence strategy decision before implementation.

### 16.2 Contract Drift Risk

Risk:

Runtime schemas may drift from OpenAPI authority.

Mitigation:

Do not implement schemas until schema ownership is decided.

### 16.3 Disclosure Regression Risk

Risk:

Product route implementation may leak workspace or product existence through incorrect 403/404 ordering.

Mitigation:

Preserve the accepted error/disclosure mapping from PR #93.

### 16.4 Guard Refactor Risk

Risk:

Refactoring `workspaceContextGuard` may accidentally change the combined workspace/membership behavior.

Mitigation:

Preserve current combined behavior unless a future gate explicitly authorizes a split.

### 16.5 Persistence Creep Risk

Risk:

Product route planning may lead to unauthorized DB, ORM, or migration work.

Mitigation:

State explicit NO-GO for DB, ORM, migrations, repositories, and product persistence implementation.

## 17. Final Decision

Decision: GO to Backend Slice 0 Product Persistence Strategy Decision Gate.

This planning gate confirms that product route implementation is not eligible yet.

This decision does not authorize implementation.

This decision does not authorize route implementation.

This decision does not authorize controller implementation.

This decision does not authorize service implementation.

This decision does not authorize repository implementation.

This decision does not authorize OpenAPI mutation.

This decision does not authorize generated client changes.

This decision does not authorize validation script modification.

This decision does not authorize package script modification.

This decision does not authorize CI workflow modification.

This decision does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 18. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Product Persistence Strategy Decision Gate`

That gate should decide whether product persistence uses direct `pg`, an ORM, a migration tool, or a deferred persistence abstraction, and it must define the repository boundary before implementation.

## 19. Explicit Non-Authorization

This product route implementation planning gate does not authorize:

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
- DB-backed product storage;
- ORM-backed product storage;
- product migrations;
- product seed data;
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

## 20. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged Error and Disclosure Mapping Decision Gate.
- Merged Permission Representation Decision Gate.
- Merged Product Route Inventory Review Gate.
- Accepted OpenAPI authority file.
- Accepted product route permission strings.
- Accepted error and disclosure mapping.
- Existing deny-by-default rule.
- Existing workspace-before-permission ordering.
- Existing membership-before-permission behavior.
- Existing internal harness-only runtime.
- Existing non-authorization of implementation.

### Outputs

- Product route implementation boundary planned.
- Product route implementation remains rejected.
- Candidate future implementation files identified as candidates only.
- Product persistence strategy identified as blocking.
- Product request/response schema ownership identified as blocking.
- Generated artifact work deferred.
- Read-first future implementation recommendation documented.
- Product Persistence Strategy Decision Gate selected as next gate.

### Gaps

- Product persistence strategy unresolved.
- Product repository boundary unresolved.
- Product workspace ownership persistence unresolved.
- Product request/response runtime schema ownership unresolved.
- Product idempotency persistence unresolved.
- Product optimistic concurrency persistence unresolved.
- Product audit persistence unresolved.
- Product route implementation readiness unresolved.
- Generated artifact inventory unresolved.
- First eligible implementation slice unresolved.
- Explicit implementation authorization unresolved.

### Transition Decision

GO to `Backend Slice 0 Product Persistence Strategy Decision Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
