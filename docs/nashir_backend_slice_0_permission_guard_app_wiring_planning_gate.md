# Nashir Backend Slice 0 — Permission Guard App Wiring Planning Gate

## 1. Gate Classification

Gate type: Documentation-only planning gate.

This gate plans the next Backend Slice 0 step after accepting the completed Workspace Context Resolution execution stream.

This gate does not authorize implementation.

This gate does not authorize public route implementation.

This gate does not authorize product route implementation.

This gate does not authorize OpenAPI changes.

This gate does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Purpose

The purpose of this gate is to define how `permissionGuard` should be wired into the backend application lifecycle after `FullyResolvedRequestContext` is available.

The next implementation must preserve the existing separation between:

- identity verification;
- workspace context resolution;
- workspace membership verification;
- permission enforcement.

This planning gate prevents premature expansion into product routes, public APIs, OpenAPI changes, or persistent RBAC data sources.

## 3. Inputs Reviewed

Inputs reviewed:

- Accepted Backend Slice 0 Workspace Context Resolution execution stream.
- Existing Auth0 identity-only boundary.
- Existing V1 route/path `workspaceId` decision.
- Existing separation between workspace membership and permission enforcement.
- Current `src/app.ts` app lifecycle.
- Current `src/workspace-context-guard.ts` boundary.
- Current `src/permission-guard.ts` primitive.
- Current permission guard unit tests.
- Current internal harness route pattern.
- Current prohibition on OpenAPI, DB, ORM, migration, product route, public route, deployment, secrets, UI, workflow, and formatting cleanup changes.

## 4. Current Baseline

Current accepted baseline:

- `authGuard` verifies identity only.
- Auth0 is not workspace authority.
- `workspaceContextGuard` consumes verified identity and route/path `workspaceId`.
- Workspace membership is resolved through an injected `WorkspaceMembershipResolver`.
- Successful workspace membership emits `request.requestContext = { actorId, workspaceId }`.
- `permissionGuard` exists as a pure evaluation primitive.
- `permissionGuard` is not yet wired as an app-level route guard after workspace context resolution.
- Existing permission guard internal harness uses deterministic/static permissions only.
- No public or product route is currently authorized for permission enforcement wiring.

## 5. Planning Scope

This gate covers planning only for app wiring of permission enforcement.

Planned scope:

- define where permission enforcement belongs in the Fastify lifecycle;
- define how `permissionGuard` consumes `FullyResolvedRequestContext`;
- define route-scoped wiring boundaries;
- define the temporary permission source boundary for V1 wiring tests;
- define required tests for the next implementation slice;
- define explicit non-authorizations.

Out of scope:

- DB-backed permission lookup;
- RBAC persistence model;
- workspace membership persistence;
- Auth0 roles or permissions as enforcement authority;
- public routes;
- product routes;
- OpenAPI changes;
- generated clients;
- deployment and runtime configuration;
- secrets;
- UI;
- workflow changes;
- formatting baseline cleanup.

## 6. Binding Architectural Decision

Decision: Permission enforcement must run after workspace context resolution.

Required sequence for any future guarded workspace route:

1. request correlation context is established;
2. Auth0 identity verification runs when `authConfig` exists;
3. workspace context resolution validates route/path `workspaceId`;
4. workspace membership is resolved;
5. `FullyResolvedRequestContext` is attached to the request;
6. permission enforcement evaluates the required permission against the resolved request context.

Permission enforcement must not run before `request.requestContext` contains both:

- `actorId`;
- `workspaceId`.

## 7. Permission Guard Consumption Contract

The existing `permissionGuard` must consume:

- `requiredPermission`;
- `grantedPermissions`;
- `requestContext.actorId`;
- `requestContext.workspaceId`;
- optional `resourceWorkspaceId`;
- optional `disclosureMode`.

The app wiring must not mutate `requestContext`.

The app wiring must not attach roles, permissions, or granted permissions to `requestContext`.

The app wiring must not expose `grantedPermissions` in failure responses.

The app wiring must preserve generic failure messages.

## 8. Permission Source Boundary

For the next implementation slice, the permission source must remain non-persistent.

Allowed for the next implementation slice:

- deterministic in-memory permission resolver for tests;
- injected permission resolver boundary;
- static internal harness permissions only if explicitly limited to internal diagnostic/test routes.

Not allowed for the next implementation slice:

- DB-backed permission resolver;
- ORM-backed permission resolver;
- migration-backed permission tables;
- Auth0 roles as permission authority;
- Auth0 permissions as permission authority;
- Auth0 organizations as permission authority;
- token claims as permission authority;
- request body, query, or header permissions.

Required planning conclusion:

Permission source for the next implementation must be an injected internal/test boundary only.

Persistent permission source requires a separate future planning gate.

## 9. Route Wiring Boundary

Permission guard app wiring must be route-scoped.

The implementation must not add permission enforcement as a global `onRequest` hook.

The preferred route shape is:

- `authGuard` continues in `onRequest`;
- `workspaceContextGuard` runs as a route-scoped `preHandler`;
- permission guard runs after workspace context is available, either as a later route-scoped `preHandler` or equivalent route-level guard.

The next implementation may only wire permission enforcement into an internal opt-in harness route.

The next implementation must not wire permission enforcement into public/product routes.

## 10. Internal Harness Planning

The next implementation may introduce or adapt an internal permission-protected harness route only.

The harness must be:

- opt-in only;
- disabled by default;
- internal diagnostic/test surface only;
- not a public API route;
- not a product route;
- not represented as a product OpenAPI surface;
- deterministic in tests.

The harness must prove:

- auth runs before workspace context resolution;
- workspace context resolution runs before permission enforcement;
- permission enforcement can allow a request;
- permission enforcement can deny with 403;
- permission enforcement can deny with 404 in non-disclosing mode;
- cross-workspace `resourceWorkspaceId` mismatch returns 404;
- failure responses do not leak actor, granted permissions, or internal details.

## 11. Required Permission Resolver Boundary

If a permission resolver abstraction is introduced, it must be injected.

Allowed resolver input:

- `actorId`;
- `workspaceId`;
- `requiredPermission`;
- optional route/resource context if needed for internal harness testing.

Allowed resolver output:

- granted permission list; or
- deterministic permission decision input for `evaluatePermissionGuard`.

The resolver must not:

- call a database;
- call Auth0;
- call an external service;
- read secrets;
- read environment-specific RBAC configuration;
- trust client-supplied permission values.

Any persistent or external permission lookup must be deferred to a future gate.

## 12. Error Boundary

The next implementation must preserve the existing error model.

Expected mappings:

- missing verified identity before permission enforcement: existing auth/workspace guard error path must handle this before permission guard runs;
- missing workspace context before permission enforcement: internal server misconfiguration or controlled 500/503-style internal failure, not a client-authorized bypass;
- missing permission in disclosing mode: 403 `FORBIDDEN`;
- missing permission in non-disclosing mode: 404 `NOT_FOUND`;
- cross-workspace resource mismatch: 404 `NOT_FOUND`;
- unexpected resolver failure, if resolver exists: generic unavailable/error response with no internal detail leakage.

The implementation must not leak:

- actor ID in failure messages;
- granted permissions;
- resolver internals;
- resource existence across workspaces;
- stack traces;
- Auth0 claims;
- token details.

## 13. File Scope for Future Implementation

This planning gate does not authorize implementation.

If a later implementation authorization gate is approved, the expected implementation files should be limited to:

- `src/app.ts`;
- a new or existing test file for permission guard app wiring.

Potential test file name:

- `tests/permission-guard-app-wiring.test.ts`

A future implementation authorization gate must explicitly approve any additional files.

## 14. Explicitly Unauthorized Files

The next planning review and any future implementation must not modify:

- OpenAPI files;
- generated client files;
- migration files;
- database schema files;
- ORM model files;
- product route files;
- public route files;
- deployment files;
- secrets or environment files;
- UI files;
- workflow files;
- package dependency files;
- repository-wide formatting-only files.

## 15. Test Plan for Future Implementation

A later implementation authorization gate should require tests for:

- internal permission harness disabled by default;
- `/health` remains ungated;
- permission harness requires successful Auth0 identity verification when `authConfig` exists;
- permission harness requires successful workspace context resolution before permission enforcement;
- allowed permission returns success;
- missing permission returns 403 in disclosing mode;
- missing permission returns 404 in non-disclosing mode;
- resource workspace mismatch returns 404 even when permission is granted;
- permissions are not read from headers, body, query, or Auth0 claims;
- failure responses do not leak granted permissions;
- failure responses do not leak actor ID;
- resolver failure, if introduced, is generic and non-leaking;
- no public/product route is introduced.

Tests must be deterministic.

No live Auth0, DB, network, external service, or secrets are authorized.

## 16. Verification Commands Required for This Planning Gate

The planning PR must provide results for:

```bash
git status -sb
git diff --check
git diff --name-only
```

If markdown formatting is checked in the repository, also run:

```bash
npx prettier --check docs/nashir_backend_slice_0_permission_guard_app_wiring_planning_gate.md
```

This planning gate does not require app tests because it must not change runtime code.

## 17. Risks

### 17.1 Permission source ambiguity risk

Risk: wiring permission enforcement before deciding the permission source may accidentally make Auth0, headers, body, query, or static test values appear authoritative.

Status: Blocking unless controlled.

Control: next implementation must use only an injected/internal deterministic boundary.

### 17.2 Auth0 authority expansion risk

Risk: Auth0 roles, permissions, organizations, app metadata, or custom claims could become authorization authority.

Status: Not allowed.

Control: Auth0 remains identity-only.

### 17.3 Contract drift risk

Risk: adding public/product routes without OpenAPI alignment creates runtime contract drift.

Status: Not allowed.

Control: no public/product route changes in this stream.

### 17.4 Workspace leakage risk

Risk: permission failures can reveal cross-workspace resource existence.

Status: Controlled by preserving 404 for cross-workspace mismatch and non-disclosing denial paths.

### 17.5 Premature persistence risk

Risk: DB/ORM/migration work could be introduced before RBAC data authority is designed.

Status: Not allowed.

Control: defer persistent permissions to a separate future gate.

## 18. Planning Summary

| Item                                | Planning Decision                             |
| ----------------------------------- | --------------------------------------------- |
| Permission guard lifecycle position | After workspace context resolution            |
| Workspace context requirement       | Required before permission enforcement        |
| Auth0 role/permission authority     | Not allowed                                   |
| Permission source for next slice    | Injected/internal deterministic boundary only |
| Public routes                       | Not authorized                                |
| Product routes                      | Not authorized                                |
| OpenAPI changes                     | Not authorized                                |
| DB/ORM/migrations                   | Not authorized                                |
| Harness route                       | Internal opt-in only                          |
| Implementation authorization        | Not granted by this gate                      |

## 19. GO / NO-GO Decision

Decision: GO to Backend Slice 0 Permission Guard App Wiring Planning Review Gate.

This decision is GO for review of this planning gate only.

This decision does not authorize implementation.

This decision does not authorize public routes.

This decision does not authorize product routes.

This decision does not authorize OpenAPI changes.

This decision does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 20. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Permission Guard App Wiring Planning Review Gate`

That review gate must confirm:

- permission enforcement is planned after workspace context resolution;
- permission source remains injected/internal/deterministic only;
- Auth0 remains identity-only;
- no public/product route is introduced;
- no OpenAPI change is introduced;
- no DB/ORM/migration change is introduced;
- future implementation scope is narrow and reviewable.

## 21. Explicit Non-Authorization

This planning gate does not authorize:

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
