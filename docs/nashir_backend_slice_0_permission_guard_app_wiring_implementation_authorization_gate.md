# Nashir Backend Slice 0 — Permission Guard App Wiring Implementation Authorization Gate

## 1. Gate Classification

Gate type: Documentation-only implementation authorization gate.

This gate authorizes a narrow implementation slice for wiring the existing `permissionGuard` into the backend app lifecycle after Workspace Context Resolution.

This gate does not implement the wiring.

This gate does not authorize public route implementation.

This gate does not authorize product route implementation.

This gate does not authorize OpenAPI changes.

This gate does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #71: `docs: plan permission guard app wiring`.
- Merged PR #72: `docs: review permission guard app wiring planning`.
- Existing `src/app.ts` app lifecycle.
- Existing `src/permission-guard.ts` primitive.
- Existing `src/workspace-context-guard.ts` route-scoped workspace context guard.
- Existing permission guard unit tests.
- Existing workspace context app wiring tests.
- Existing Auth0 identity-only boundary.
- Existing V1 route/path `workspaceId` decision.
- Existing separation between workspace membership and permission enforcement.
- Existing prohibition on public/product routes, OpenAPI, DB, ORM, migrations, deployment, secrets, UI, workflow, and formatting baseline cleanup.

## 3. Current Baseline

Current accepted baseline:

- `authGuard` verifies identity only.
- Auth0 is not workspace authority.
- Auth0 is not permission authority.
- `workspaceContextGuard` consumes verified identity and route/path `workspaceId`.
- Workspace membership is resolved through an injected `WorkspaceMembershipResolver`.
- Successful workspace context resolution emits `request.requestContext = { actorId, workspaceId }`.
- `permissionGuard` exists as a pure evaluation primitive.
- `permissionGuard` is not yet wired after workspace context resolution in an app-level route-scoped guard.
- Existing permission guard harness is internal only and does not represent public/product API behavior.
- No DB-backed permission source exists.
- No public/product route is authorized.

## 4. Authorization Decision

Decision: AUTHORIZE a narrow implementation slice for Permission Guard App Wiring.

The next implementation PR may wire `permissionGuard` only into an internal, opt-in, workspace-scoped permission harness route.

The implementation must run permission enforcement only after:

- Auth0 identity verification when `authConfig` exists;
- workspace context resolution;
- workspace membership success;
- `request.requestContext` is available with both `actorId` and `workspaceId`.

This authorization does not permit any public/product route work.

## 5. Authorized Files

The next implementation PR may modify only:

- `src/app.ts`
- `tests/permission-guard-app-wiring.test.ts`

If a minimal compile-only type adjustment is unavoidable, it must be explicitly justified in the PR body before merge.

No other source, test, contract, workflow, package, generated, database, deployment, or formatting files are authorized.

## 6. Explicitly Unauthorized Files

The next implementation PR must not modify:

- OpenAPI files;
- generated files;
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
- repository-wide formatting-only files;
- `src/permission-guard.ts`;
- `src/workspace-context-guard.ts`;
- `src/auth-guard.ts`;
- `src/request-context.ts`.

## 7. Authorized Runtime Wiring Shape

The implementation may:

- add an opt-in internal permission app wiring harness route;
- keep the harness disabled by default;
- route the harness through the existing auth path when `authConfig` exists;
- apply `workspaceContextGuard` before permission enforcement;
- call `evaluatePermissionGuard` only after `request.requestContext` is populated;
- use deterministic internal/static granted permissions only inside the harness;
- support disclosure mode testing through a controlled internal harness query value;
- support optional `resourceWorkspaceId` testing through a controlled internal harness route or query value;
- return generic permission guard decisions without leaking granted permissions.

The implementation must not:

- trust permissions from headers;
- trust permissions from body;
- trust permissions from query string;
- trust permissions from Auth0 claims;
- trust Auth0 roles, permissions, organizations, metadata, app metadata, or custom claims as permission authority;
- attach granted permissions to `requestContext`;
- attach roles to `requestContext`;
- mutate `requestContext`;
- expose internal permission source details in responses.

## 8. Authorized Internal Harness Route

The implementation may introduce one internal opt-in route for app-wiring verification.

Preferred route shape:

`/internal/workspace-permission-guard-harness/:workspaceId/:requiredPermission`

Required route behavior:

- disabled by default;
- enabled only when an explicit app build option is true;
- not public API;
- not product API;
- not OpenAPI product surface;
- must include route/path `workspaceId`;
- must include route/path `requiredPermission`;
- must run after Auth0 identity verification when `authConfig` exists;
- must run after `workspaceContextGuard`;
- must evaluate permission after `request.requestContext` exists.

The existing internal permission harness may remain unchanged unless the implementation needs to avoid route overlap or naming ambiguity.

## 9. Authorized Permission Source Boundary

For this implementation slice, the permission source must remain internal and deterministic.

Allowed:

- static internal harness permissions;
- deterministic in-memory permission fixtures in tests;
- static granted permissions scoped only to the internal harness.

Not allowed:

- DB-backed permission resolver;
- ORM-backed permission resolver;
- migration-backed permission tables;
- Auth0-backed permission resolver;
- external service permission resolver;
- environment-backed RBAC configuration;
- secret-backed permission configuration;
- client-supplied granted permissions.

This authorization does not create the final RBAC permission source for Nashir V1.

Persistent permission source requires a separate future gate.

## 10. Required Lifecycle Order

The implementation must preserve this order:

1. request correlation context;
2. Auth0 identity verification when `authConfig` exists;
3. route/path workspace ID resolution;
4. workspace membership resolution;
5. `request.requestContext = { actorId, workspaceId }`;
6. permission enforcement using `evaluatePermissionGuard`;
7. route handler.

Permission enforcement must not run if `request.requestContext` is missing or incomplete.

## 11. Error and Disclosure Requirements

The implementation must preserve existing non-leakage behavior.

Required behavior:

- missing auth continues through existing auth error path;
- failed workspace context resolution continues through existing workspace guard error path;
- missing permission in disclosing mode returns 403 `FORBIDDEN`;
- missing permission in non-disclosing mode returns 404 `NOT_FOUND`;
- cross-workspace `resourceWorkspaceId` mismatch returns 404 `NOT_FOUND`;
- failure responses do not include `grantedPermissions`;
- failure responses do not include Auth0 claims;
- failure responses do not include token details;
- failure responses do not include stack traces;
- failure responses do not disclose cross-workspace resource existence.

## 12. Test Authorization

The next implementation PR must add deterministic tests in:

`tests/permission-guard-app-wiring.test.ts`

Tests must cover:

- internal permission harness disabled by default;
- `/health` remains ungated;
- permission harness requires successful Auth0 identity verification when `authConfig` exists;
- permission harness requires successful workspace context resolution before permission enforcement;
- valid workspace membership plus granted permission returns success;
- missing permission returns 403 in disclosing mode;
- missing permission returns 404 in non-disclosing mode;
- resource workspace mismatch returns 404 even when permission is granted;
- permission enforcement uses route/path `workspaceId`;
- permissions are not read from headers;
- permissions are not read from request body;
- permissions are not read from query string as granted permissions;
- permissions are not read from Auth0 claims;
- failure responses do not leak granted permissions;
- failure responses do not leak actor ID;
- no public route is introduced;
- no product route is introduced.

Tests must use deterministic fixtures only.

No live Auth0, DB, network, external service, or secrets are authorized.

## 13. Verification Commands Required

The implementation PR must provide results for:

```bash
npm run typecheck
npm run lint
npx prettier --check src/app.ts tests/permission-guard-app-wiring.test.ts
npm test -- tests/permission-guard-app-wiring.test.ts
git diff --check
git diff --name-only
```

All commands must pass before opening the implementation PR.

## 14. Required PR Body for Next Implementation

The next implementation PR body must include:

- Summary of exact files changed.
- Confirmation that only authorized files were changed.
- Confirmation that permission enforcement runs after workspace context resolution.
- Confirmation that Auth0 remains identity-only.
- Confirmation that permissions are internal/static/deterministic for harness only.
- Confirmation that no public/product routes were added.
- Confirmation that no OpenAPI, DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting cleanup files were changed.
- Verification command results.

## 15. Risk Review

### 15.1 Permission source ambiguity risk

Risk: implementation could accidentally treat headers, query, Auth0 claims, or static harness data as production permission authority.

Control: only internal harness static/deterministic permissions are authorized.

Status: Controlled.

### 15.2 Auth0 authority expansion risk

Risk: Auth0 roles, permissions, organizations, or claims could become authorization authority.

Control: Auth0 remains identity-only and is explicitly prohibited as permission authority.

Status: Controlled.

### 15.3 Route exposure risk

Risk: internal permission harness could become public/product surface.

Control: route must be opt-in, disabled by default, internal only, and not OpenAPI product surface.

Status: Controlled.

### 15.4 Workspace leakage risk

Risk: permission failures could reveal cross-workspace resource existence.

Control: cross-workspace mismatch and non-disclosing denial paths must return 404.

Status: Controlled.

### 15.5 Scope creep risk

Risk: implementation could expand into DB, ORM, migrations, OpenAPI, product routes, or public routes.

Control: authorized file scope is limited to `src/app.ts` and `tests/permission-guard-app-wiring.test.ts`.

Status: Controlled.

## 16. Authorization Summary

| Item                          | Authorization                               |
| ----------------------------- | ------------------------------------------- |
| Implementation authorized     | Yes, narrow internal harness only           |
| Public routes                 | Not authorized                              |
| Product routes                | Not authorized                              |
| OpenAPI changes               | Not authorized                              |
| DB/ORM/migrations             | Not authorized                              |
| Auth0 as permission authority | Not authorized                              |
| Permission source             | Static/internal/deterministic harness only  |
| Route wiring                  | Route-scoped only                           |
| Global permission hook        | Not authorized                              |
| Allowed source file           | `src/app.ts`                                |
| Allowed test file             | `tests/permission-guard-app-wiring.test.ts` |

## 17. GO / NO-GO Decision

Decision: GO to Backend Slice 0 Permission Guard App Wiring Implementation Execution Gate.

This decision authorizes only the narrow implementation slice described in this gate.

This decision does not authorize public routes.

This decision does not authorize product routes.

This decision does not authorize OpenAPI changes.

This decision does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 18. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Permission Guard App Wiring Implementation Execution Gate`

That gate must:

- implement only what is authorized in this document;
- modify only the authorized files;
- prove permission enforcement runs after workspace context resolution;
- prove Auth0 remains identity-only;
- prove permissions are not read from client input or Auth0 claims;
- prove failure responses do not leak granted permissions or actor identity;
- prove no public/product routes are introduced;
- provide all verification command results.

## 19. Explicit Non-Authorization

This implementation authorization gate does not authorize:

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
