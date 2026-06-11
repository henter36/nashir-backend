# Nashir Backend Slice 0 — Permission Guard App Wiring Planning Review Gate

## 1. Gate Classification

Gate type: Documentation-only planning review gate.

This gate reviews the merged Backend Slice 0 Permission Guard App Wiring Planning Gate.

This gate does not authorize implementation.

This gate does not authorize public route implementation.

This gate does not authorize product route implementation.

This gate does not authorize OpenAPI changes.

This gate does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #71: `docs: plan permission guard app wiring`.
- `docs/nashir_backend_slice_0_permission_guard_app_wiring_planning_gate.md`.
- Accepted Backend Slice 0 Workspace Context Resolution execution stream.
- Existing Auth0 identity-only boundary.
- Existing V1 route/path `workspaceId` decision.
- Existing separation between workspace membership and permission enforcement.
- Current permission guard primitive boundary.
- Current workspace context guard boundary.
- Existing internal harness route pattern.
- Existing prohibition on public/product routes, OpenAPI, DB, ORM, migrations, deployment, secrets, UI, workflow, and formatting baseline cleanup.

## 3. Review Scope

This review validates whether the planning gate is sufficient to proceed to a later implementation authorization gate.

Reviewed scope:

- lifecycle placement of permission enforcement;
- dependency on `FullyResolvedRequestContext`;
- route-scoped wiring boundary;
- permission source boundary;
- Auth0 authority boundary;
- public/product route prohibition;
- OpenAPI and data-layer non-authorization;
- internal harness planning;
- future implementation file-scope expectations;
- verification and test expectations.

Out of scope:

- implementation;
- runtime code changes;
- public API routes;
- product routes;
- OpenAPI changes;
- DB-backed permission resolver;
- ORM models;
- migrations;
- deployment;
- secrets;
- UI;
- workflow changes;
- formatting cleanup.

## 4. Planning Gate Merge Verification

The planning gate was merged through PR #71.

Observed planning gate output:

- file added: `docs/nashir_backend_slice_0_permission_guard_app_wiring_planning_gate.md`;
- decision: GO to Backend Slice 0 Permission Guard App Wiring Planning Review Gate;
- explicit non-authorization preserved.

Review result: PASS.

## 5. Lifecycle Ordering Review

The planning gate correctly requires permission enforcement to run after workspace context resolution.

Required order preserved:

1. request correlation context;
2. Auth0 identity verification when `authConfig` exists;
3. workspace context resolution from route/path `workspaceId`;
4. workspace membership resolution;
5. `FullyResolvedRequestContext` attached to request;
6. permission enforcement after resolved context exists.

This prevents permission checks from running without a verified actor and workspace.

Review result: PASS.

## 6. Request Context Boundary Review

The planning gate correctly requires permission enforcement to consume `requestContext.actorId` and `requestContext.workspaceId`.

The planning gate correctly prohibits:

- mutating `requestContext`;
- attaching roles to `requestContext`;
- attaching permissions to `requestContext`;
- exposing granted permissions in failure responses.

Review result: PASS.

## 7. Permission Source Boundary Review

The planning gate correctly identifies permission source ambiguity as a blocking risk unless controlled.

The planning gate allows only:

- deterministic in-memory permission resolver for tests;
- injected permission resolver boundary;
- static internal harness permissions only when limited to internal diagnostic/test routes.

The planning gate correctly prohibits:

- DB-backed permission resolver;
- ORM-backed permission resolver;
- migration-backed permission tables;
- Auth0 roles as permission authority;
- Auth0 permissions as permission authority;
- Auth0 organizations as permission authority;
- token claims as permission authority;
- request body, query, or header permissions.

Review result: PASS.

## 8. Auth0 Authority Boundary Review

The planning gate preserves the existing Auth0 boundary.

Auth0 remains identity provider only.

Auth0 must not become:

- workspace authority;
- membership authority;
- permission authority;
- RBAC data source.

Review result: PASS.

## 9. Route Wiring Boundary Review

The planning gate correctly requires route-scoped permission guard wiring.

The planning gate correctly prohibits global `onRequest` permission enforcement.

Preferred route shape is valid:

- `authGuard` remains in `onRequest`;
- `workspaceContextGuard` runs as route-scoped `preHandler`;
- permission guard runs after workspace context is available.

Review result: PASS.

## 10. Internal Harness Boundary Review

The planning gate correctly limits the future implementation to an internal opt-in harness route only.

The harness must remain:

- disabled by default;
- internal only;
- diagnostic/test surface only;
- not public API;
- not product API;
- not an OpenAPI product surface.

Review result: PASS.

## 11. Error and Disclosure Boundary Review

The planning gate correctly preserves the current non-leakage model.

Required behavior remains valid:

- missing permission in disclosing mode returns 403;
- missing permission in non-disclosing mode returns 404;
- cross-workspace resource mismatch returns 404;
- resolver/internal failures must not leak implementation details.

The planning gate correctly prohibits leaking:

- actor ID in failure messages;
- granted permissions;
- resolver internals;
- resource existence across workspaces;
- stack traces;
- Auth0 claims;
- token details.

Review result: PASS.

## 12. File Scope Review

The planning gate correctly states that this stage does not authorize implementation.

The expected future implementation file scope is appropriately narrow:

- `src/app.ts`;
- a dedicated or existing test file for permission guard app wiring.

Potential test file:

- `tests/permission-guard-app-wiring.test.ts`.

Any additional file must require explicit authorization in a later implementation authorization gate.

Review result: PASS.

## 13. Non-Authorization Review

The planning gate correctly blocks:

- implementation;
- public route implementation;
- product route implementation;
- OpenAPI changes;
- generated client changes;
- DB-backed permission resolver;
- DB-backed workspace membership resolver;
- ORM models;
- migrations;
- deployment changes;
- secrets changes;
- UI changes;
- workflow changes;
- formatting baseline cleanup.

Review result: PASS.

## 14. Risk Review

### 14.1 Permission source ambiguity risk

Status: Controlled.

Reason: the planning gate requires injected/internal deterministic permission source only for the next slice.

### 14.2 Auth0 authority expansion risk

Status: Controlled.

Reason: Auth0 remains identity-only and is prohibited as permission authority.

### 14.3 Contract drift risk

Status: Controlled.

Reason: no public/product routes or OpenAPI changes are authorized.

### 14.4 Workspace leakage risk

Status: Controlled.

Reason: cross-workspace mismatch and non-disclosing permission failures remain 404.

### 14.5 Premature persistence risk

Status: Controlled.

Reason: DB, ORM, and migrations remain explicitly unauthorized.

## 15. Review Summary

| Review Item | Result |
|---|---|
| Planning PR merged | PASS |
| Permission enforcement after workspace context | PASS |
| FullyResolvedRequestContext required | PASS |
| Auth0 remains identity-only | PASS |
| Permission source constrained | PASS |
| Route-scoped wiring required | PASS |
| Global permission hook prohibited | PASS |
| Internal harness only | PASS |
| Public/product routes blocked | PASS |
| OpenAPI changes blocked | PASS |
| DB/ORM/migrations blocked | PASS |
| Failure leakage controlled | PASS |
| Future implementation scope narrow | PASS |

## 16. Decision

Decision: GO to Backend Slice 0 Permission Guard App Wiring Implementation Authorization Gate.

This decision authorizes only the next documentation gate.

This decision does not authorize implementation.

This decision does not authorize public route implementation.

This decision does not authorize product route implementation.

This decision does not authorize OpenAPI changes.

This decision does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 17. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Permission Guard App Wiring Implementation Authorization Gate`

That gate must decide whether to authorize a narrow implementation slice.

The authorization gate must define:

- exact files allowed;
- exact internal harness route shape;
- whether a permission resolver abstraction is allowed;
- whether static harness permissions are allowed;
- required app-wiring tests;
- explicit prohibitions on public/product routes, OpenAPI, DB, ORM, migrations, deployment, secrets, UI, workflow, and formatting cleanup.

## 18. Explicit Non-Authorization

This review gate does not authorize:

- implementation;
- public route implementation;
- product route implementation;
- OpenAPI changes;
- generated client changes;
- DB-backed permission resolver;
- DB-backed workspace membership resolver;
- ORM models;
- migrations;
- deployment changes;
- secrets changes;
- UI changes;
- workflow changes;
- formatting baseline cleanup.
