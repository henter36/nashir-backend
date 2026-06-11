# Nashir Backend Slice 0 — Permission Guard Error and Disclosure Mapping Decision Gate

## 1. Gate Classification

Gate type: Documentation-only error and disclosure mapping decision gate.

This gate decides product-route error and disclosure behavior for later planning.

This gate does not authorize implementation.

This gate does not authorize route implementation.

This gate does not authorize controller, service, repository, DB, ORM, migrations, generated clients, OpenAPI mutation, validation script modification, package script modification, CI workflow modification, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #92: `docs: decide permission guard permission representation`.
- Merged PR #91: `docs: review permission guard product route inventory`.
- Accepted OpenAPI authority repository: `henter36/nashir`.
- Accepted CI-active Backend Slice 0 authority pin: `36da9ed31903562bddfb7ffd669841956e334a51`.
- Accepted OpenAPI authority file: `docs/nashir_v1_openapi.yaml`.
- Accepted product permissions:
  - `nashir.products.read`
  - `nashir.products.manage`
- Existing Auth0 identity-only boundary.
- Existing route/path `workspaceId` authority.
- Existing deny-by-default rule.
- Existing workspace-before-permission ordering.
- Existing membership-before-permission ordering.
- Existing non-disclosing product route membership behavior.
- Existing permission representation decision.
- Existing non-authorization of implementation.

## 3. Review Objective

This gate must decide:

- route-level 401 behavior;
- route-level 403 behavior;
- route-level non-disclosing 404 behavior;
- route-level 400 behavior;
- route-level 409 behavior;
- route-level 422 behavior;
- error body disclosure boundaries;
- guard-order impact on disclosure;
- implementation eligibility after this decision.

This gate must not implement errors.

This gate must not modify `ErrorModel`.

This gate must not modify OpenAPI.

This gate must not add route handlers.

## 4. Product Routes in Scope

The product routes in scope are:

| Route | Method | operationId | Permission | Write control |
|---|---|---|---|---|
| `/workspaces/{workspaceId}/products` | GET | `listProducts` | `nashir.products.read` | none |
| `/workspaces/{workspaceId}/products` | POST | `createProduct` | `nashir.products.manage` | idempotency key required; reject body workspaceId |
| `/workspaces/{workspaceId}/products/{productId}` | GET | `getProduct` | `nashir.products.read` | none |
| `/workspaces/{workspaceId}/products/{productId}` | PUT | `updateProduct` | `nashir.products.manage` | optimistic concurrency required; reject body workspaceId |

This gate does not authorize implementation of these routes.

## 5. Status Code Mapping Decision

Decision: Product route status codes must be mapped as follows.

| Status | Meaning | Disclosure behavior |
|---:|---|---|
| 200 | Successful list, get, or update | Allowed only after auth, workspace, membership, permission, and resource checks pass |
| 201 | Successful create | Allowed only after auth, workspace, membership, permission, validation, idempotency, and audit planning checks pass |
| 400 | Bad request shape, malformed request, missing required protocol/header input | May identify request defect but must not disclose workspace or product existence |
| 401 | Missing, invalid, expired, or unverifiable authentication | Must not disclose workspace, membership, permission, or resource existence |
| 403 | Authenticated active member lacks the required canonical permission | Must not disclose product existence; must be returned before product-specific lookup when possible |
| 404 | Non-disclosing not found / invisible boundary | Must cover non-member, inactive membership where route metadata requires non-disclosure, invisible workspace, cross-workspace resource, missing product, or missing route |
| 409 | Conflict | Used for idempotency conflict or optimistic concurrency/version conflict |
| 422 | Validation failed | Used for valid JSON/request envelope with invalid domain payload, including forbidden workspace identity in body |
| default | Default error | Must not leak internals |

## 6. 401 Unauthorized Decision

Decision: 401 is used only for authentication failure.

Applies when:

- bearer token is missing;
- bearer token is invalid;
- bearer token is expired;
- token issuer/audience/signature validation fails;
- verified actor identity cannot be established.

Rules:

- 401 must not disclose whether `workspaceId` exists.
- 401 must not disclose whether `productId` exists.
- 401 must not disclose whether a membership exists.
- 401 must not disclose required permission details beyond the stable error code boundary.
- 401 must use the accepted error response model.

This gate does not modify auth guard implementation.

## 7. 403 Forbidden Decision

Decision: 403 is used for an authenticated active workspace member who lacks the required canonical permission.

Applies when:

- actor is authenticated;
- workspace context is resolved;
- active membership is confirmed;
- required permission is missing.

Required permissions:

| Operation | Required permission |
|---|---|
| `listProducts` | `nashir.products.read` |
| `getProduct` | `nashir.products.read` |
| `createProduct` | `nashir.products.manage` |
| `updateProduct` | `nashir.products.manage` |

Rules:

- 403 must not run product-specific lookup when permission is already missing.
- 403 must not reveal whether a requested `productId` exists.
- 403 must not reveal role names required to gain access.
- 403 must not expose granted permission lists.
- 403 must not include internal guard-chain details.

This gate does not implement permission enforcement.

## 8. 404 Non-Disclosing Decision

Decision: 404 is used for non-disclosing boundary protection.

Applies when:

- actor is authenticated but has no visible workspace boundary;
- actor has no workspace membership and route metadata requires non-disclosure;
- actor has inactive membership and route metadata requires non-disclosure;
- workspace is invisible to actor;
- product belongs to another workspace;
- product does not exist;
- nested parent/resource relationship is missing or invisible;
- route does not exist.

Rules:

- 404 must not distinguish missing resource from invisible resource.
- 404 must not distinguish missing workspace from inaccessible workspace.
- 404 must not distinguish cross-workspace product from missing product.
- 404 must not reveal whether `workspaceId` is valid.
- 404 must not reveal whether `productId` is valid.
- 404 must use a generic message such as `Resource not found.`
- 404 must use the accepted error response model.

This gate resolves the product-route disclosure boundary as stricter than a generic forbidden response when membership visibility is not established.

This gate does not implement membership enforcement.

## 9. 400 Bad Request Decision

Decision: 400 is used for malformed or protocol-level request defects.

Applies when:

- malformed JSON prevents parsing;
- invalid path/query/header shape prevents safe interpretation;
- required protocol headers are missing where the route cannot proceed;
- idempotency key header is missing on `createProduct`;
- concurrency header is missing on `updateProduct` when the route requires `If-Match` or `X-Resource-Version`.

Rules:

- 400 may describe the request defect.
- 400 must not disclose workspace existence.
- 400 must not disclose product existence.
- 400 must not leak implementation details.

This gate does not implement request validation.

## 10. 409 Conflict Decision

Decision: 409 is used for conflict states.

Applies when:

- idempotency key conflicts with an already processed incompatible create request;
- optimistic concurrency version does not match;
- `If-Match` or `X-Resource-Version` detects stale update intent.

Rules:

- 409 may be returned only after auth, workspace, membership, and permission checks pass.
- 409 must not be used to disclose product existence to unauthorized actors.
- 409 must not reveal cross-workspace resource details.
- 409 must use the accepted error response model.

This gate does not implement idempotency or optimistic concurrency persistence.

## 11. 422 Validation Failed Decision

Decision: 422 is used for valid request envelope with invalid domain payload.

Applies when:

- request body is parseable JSON but violates schema/domain validation;
- product payload fields are invalid;
- body attempts to include `workspaceId` or `workspace_id`;
- payload includes fields that would override route-derived workspace identity;
- create/update body violates approved product input constraints.

Rules:

- body `workspaceId` or `workspace_id` must be rejected.
- route-derived `workspaceId` remains the only trusted workspace identity.
- 422 must not reveal whether the workspace or product exists beyond the already authorized context.
- 422 must use the accepted error response model.

This gate does not implement schemas.

## 12. Error Body Disclosure Decision

Decision: Product route error bodies must be stable and non-leaking.

Error responses must not include:

- stack traces;
- SQL errors;
- ORM errors;
- raw validation library internals;
- raw token verification internals;
- granted permission lists;
- role-to-permission mappings;
- workspace membership internals;
- whether a workspace exists when access is not visible;
- whether a product exists when access is not authorized;
- cross-workspace ownership details;
- idempotency storage internals;
- audit persistence internals.

Allowed error body fields are limited to the accepted ErrorModel boundary.

This gate does not modify ErrorModel.

## 13. Guard Ordering Disclosure Decision

Decision: Product route error/disclosure behavior depends on this guard order:

### Read operations

Expected order:

1. `authGuard`
2. `workspaceContextGuard`
3. `nonDisclosingMembershipCheck`
4. `permissionGuard`
5. resource lookup / ownership verification

Applies to:

- `listProducts`
- `getProduct`

### Write operations

Expected order:

1. `authGuard`
2. `workspaceContextGuard`
3. `nonDisclosingMembershipCheck`
4. `permissionGuard`
5. `rejectBodyWorkspaceId`
6. validation
7. idempotency or optimistic concurrency check
8. persistence
9. audit

Applies to:

- `createProduct`
- `updateProduct`

This order is a disclosure decision only.

This gate does not implement the guard chain.

## 14. Operation-Level Mapping

### 14.1 listProducts

| Scenario | Status |
|---|---:|
| unauthenticated | 401 |
| authenticated but no visible membership boundary | 404 |
| active member without `nashir.products.read` | 403 |
| invalid query/header input | 400 |
| valid request with no products | 200 |
| valid request with products | 200 |

### 14.2 createProduct

| Scenario | Status |
|---|---:|
| unauthenticated | 401 |
| authenticated but no visible membership boundary | 404 |
| active member without `nashir.products.manage` | 403 |
| missing idempotency key | 400 |
| body includes `workspaceId` or `workspace_id` | 422 |
| invalid product payload | 422 |
| idempotency conflict | 409 |
| valid create | 201 |

### 14.3 getProduct

| Scenario | Status |
|---|---:|
| unauthenticated | 401 |
| authenticated but no visible membership boundary | 404 |
| active member without `nashir.products.read` | 403 |
| malformed `productId` | 400 |
| product missing | 404 |
| product belongs to another workspace | 404 |
| valid read | 200 |

### 14.4 updateProduct

| Scenario | Status |
|---|---:|
| unauthenticated | 401 |
| authenticated but no visible membership boundary | 404 |
| active member without `nashir.products.manage` | 403 |
| malformed `productId` | 400 |
| missing concurrency header | 400 |
| body includes `workspaceId` or `workspace_id` | 422 |
| invalid product payload | 422 |
| product missing | 404 |
| product belongs to another workspace | 404 |
| stale version / optimistic concurrency conflict | 409 |
| valid update | 200 |

## 15. Product Route Implementation Eligibility

Decision: NOT ELIGIBLE for implementation in this gate.

Reason:

This gate decides error and disclosure mapping only.

The following remain unresolved:

- resource workspace ownership resolution;
- product persistence;
- product request schema implementation;
- idempotency persistence;
- optimistic concurrency persistence;
- audit persistence;
- generated artifact inventory;
- generated client impact;
- first eligible product route implementation slice;
- persistent RBAC model;
- product route implementation authorization.

## 16. Candidate Next Paths

### Option A — Product Route Implementation Planning Gate

Decision: SELECTED.

Reason:

Permission representation and error/disclosure mapping are now decided at the documentation level. The next safe step is a documentation-only implementation planning gate that plans product route implementation boundaries without writing route code.

### Option B — Direct Product Route Implementation

Decision: NO-GO.

Reason:

Implementation still requires explicit implementation authorization. Planning must precede code.

### Option C — Persistent RBAC Planning Gate

Decision: NO-GO.

Reason:

Persistent RBAC remains broader than product route implementation planning and requires separate DB/ORM/migration authorization.

### Option D — Generated Client Inventory Gate

Decision: DEFER.

Reason:

Generated client impact should be reviewed after implementation planning clarifies whether OpenAPI remains unchanged.

## 17. Selected Next Path

Selected next path:

`Backend Slice 0 Permission Guard Product Route Implementation Planning Gate`

This selected path is documentation-only.

It must plan implementation boundaries.

It must not implement routes.

It must not modify OpenAPI.

It must not generate clients.

It must not modify validation scripts.

It must not modify package scripts.

It must not modify CI workflow files.

It must not add DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 18. Risk Review

### 18.1 403/404 Disclosure Drift Risk

Risk:

A route may return 403 where non-disclosing 404 is required, revealing workspace or product existence.

Mitigation:

Use 404 for invisible workspace, missing membership visibility, cross-workspace product, missing product, or missing nested parent.

### 18.2 Permission Denial Lookup Risk

Risk:

A route may perform product lookup before permission check, allowing timing or status-based inference.

Mitigation:

For active members without permission, return 403 before product-specific lookup where possible.

### 18.3 Body Workspace Trust Risk

Risk:

Write operations may trust workspace identity from request body.

Mitigation:

Reject `workspaceId` and `workspace_id` in request bodies with 422.

### 18.4 Conflict Leakage Risk

Risk:

409 may reveal idempotency or resource state before authorization.

Mitigation:

Only evaluate idempotency or concurrency after auth, workspace, membership, and permission pass.

### 18.5 Implementation Creep Risk

Risk:

This mapping may be mistaken as implementation authorization.

Mitigation:

State explicit NO-GO for implementation.

## 19. Final Decision

Decision: GO to Backend Slice 0 Permission Guard Product Route Implementation Planning Gate.

This decision accepts product route error and disclosure mapping.

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

## 20. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Permission Guard Product Route Implementation Planning Gate`

That gate should plan how product route implementation will be sliced while preserving permission representation and error/disclosure mapping.

## 21. Explicit Non-Authorization

This error and disclosure mapping decision gate does not authorize:

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
- permission seed data;
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

## 22. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged Permission Representation Decision Gate.
- Merged Product Route Inventory Review Gate.
- Accepted OpenAPI authority file.
- Accepted product route permission strings.
- Accepted Auth/RBAC workspace identity authority.
- Existing deny-by-default rule.
- Existing workspace-before-permission ordering.
- Existing membership-before-permission ordering.
- Existing non-disclosing product route behavior.
- Existing non-authorization of implementation.

### Outputs

- Accepted product route 401 mapping.
- Accepted product route 403 mapping.
- Accepted product route non-disclosing 404 mapping.
- Accepted product route 400 mapping.
- Accepted product route 409 mapping.
- Accepted product route 422 mapping.
- Accepted error body disclosure boundary.
- Accepted operation-level product error mapping.
- Rejected product route implementation.
- Selected Product Route Implementation Planning Gate as the next gate.

### Gaps

- Product route implementation plan unresolved.
- Resource workspace ownership resolution unresolved.
- Product persistence unresolved.
- Product request schema implementation unresolved.
- Idempotency persistence unresolved.
- Optimistic concurrency persistence unresolved.
- Audit persistence unresolved.
- Generated artifact inventory unresolved.
- Generated client impact unresolved.
- First eligible product route slice unresolved.
- Persistent RBAC model unresolved.

### Transition Decision

GO to `Backend Slice 0 Permission Guard Product Route Implementation Planning Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
