# Nashir Backend Slice 0 — Workspace Context Resolution App Wiring Implementation Authorization Gate

## 1. Gate Classification

Gate type: Documentation-only implementation authorization gate.

This gate authorizes a narrow implementation slice for wiring the already implemented `workspaceContextGuard` into the backend app lifecycle.

This gate does not implement the wiring.

This gate does not authorize public routes.

This gate does not authorize product routes.

This gate does not authorize OpenAPI changes.

This gate does not authorize DB, migration, ORM, query, deployment, secrets, or UI work.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged `workspaceContextGuard` implementation.
- Merged Workspace Context Resolution Implementation Execution Verification Gate.
- Merged App Wiring Planning Gate.
- Merged App Wiring Planning Review Gate.
- Current `src/app.ts` lifecycle.
- Current `src/workspace-context-guard.ts` contract.
- Existing internal harness route pattern.
- Existing auth guard boundary.
- Existing transitional header request-context path.
- Existing repository formatting baseline deferral.

## 3. Current Implementation Baseline

Current `src/app.ts`:

- decorates `requestContext`;
- decorates `verifiedIdentityContext`;
- decorates `correlationId`;
- resolves correlation ID in `onRequest`;
- runs `authGuardHook` when `authConfig` exists;
- uses transitional header-based context only when `authConfig` is absent;
- exposes internal harness routes only through explicit opt-in options;
- does not yet wire `workspaceContextGuard`.

Current `workspaceContextGuard`:

- consumes `request.verifiedIdentityContext`;
- reads `workspaceId` from route params;
- calls injected `WorkspaceMembershipResolver`;
- emits `request.requestContext = { actorId, workspaceId }`;
- maps membership and validation failures to HTTP error responses.

## 4. Authorization Decision

Decision: AUTHORIZE a narrow app-wiring implementation slice.

The implementation may wire `workspaceContextGuard` only in an internal, opt-in, workspace-scoped harness path.

The implementation must not introduce public/product routes.

The implementation must not alter OpenAPI.

The implementation must not introduce DB-backed membership persistence.

## 5. Authorized Files

The next implementation PR may modify only:

- `src/app.ts`
- `tests/workspace-context-app-wiring.test.ts`

If the implementer chooses to reuse an existing app-level test file instead of creating a new one, the only acceptable alternative is:

- `tests/request-context-plumbing.test.ts`

The implementation must not modify both test files unless a review comment requires consolidation.

## 6. Explicitly Unauthorized Files

The next implementation PR must not modify:

- OpenAPI files
- generated files
- migration files
- database schema files
- ORM model files
- product route files
- deployment files
- secrets or environment files
- package dependency files
- UI files
- repository-wide formatting-only files
- `src/workspace-context-guard.ts`, unless a compile-only type import/export issue is discovered and separately justified in the PR body

## 7. Authorized Runtime Wiring Shape

The implementation may:

- import `createWorkspaceContextGuardHook`;
- import the `WorkspaceMembershipResolver` type;
- add an optional app build option for injecting a workspace membership resolver;
- create a `workspaceContextGuardHook` only when an injected resolver exists;
- apply the hook only to an internal workspace-scoped harness route that includes `:workspaceId`;
- preserve `/health` behavior unchanged;
- preserve correlation ID behavior unchanged;
- preserve `authGuardHook` execution before workspace context resolution.

## 8. Hook Point Authorization

The implementation must not rely on global `onRequest` for workspace context resolution.

The authorized hook point is route-scoped and must run after route params are reliably available.

Preferred implementation direction:

- keep existing `onRequest` for correlation and auth;
- add `workspaceContextGuardHook` as a route-level `preHandler` or equivalent route-scoped hook on the internal workspace route harness;
- do not apply the guard globally to all non-health routes.

## 9. Internal Harness Scope

The only route eligible for wiring in this slice is the existing internal workspace route harness shape:

`/internal/workspace-route-harness/:workspaceId`

The harness remains:

- opt-in only;
- disabled by default;
- internal diagnostic/test surface only;
- not a product route;
- not a public API route.

The implementation must not add a new public route.

## 10. Resolver Scope

The implementation may add dependency injection for a resolver using the existing contract:

Input:

- `actorId`
- `workspaceId`

Output object:

- `{ outcome: "member" }`
- `{ outcome: "workspace_not_found" }`
- `{ outcome: "not_member" }`
- `{ outcome: "unavailable" }`

The implementation may use deterministic in-memory resolvers in tests.

The implementation must not implement DB-backed membership lookup.

## 11. Auth0 Boundary

The implementation must preserve:

- Auth0 as identity provider only.
- Auth0 not used as workspace membership authority.
- No Auth0 role, permission, organization, user metadata, app metadata, or custom claim as workspace authority.
- Workspace context resolution must consume only `VerifiedIdentityContext` from `authGuard`.

## 12. Workspace ID Source Boundary

The implementation must preserve:

- route/path `workspaceId` as the only trusted workspace source in the Auth0 runtime path;
- no trust in `x-nashir-workspace-id` for Auth0 path;
- no trust in request body workspace ID;
- no trust in query string workspace ID;
- no trust in Auth0 token workspace claims.

## 13. Transitional Header Path Boundary

The existing transitional header-based context path must remain isolated to no-authConfig mode.

The implementation must not mix transitional `x-nashir-workspace-id` behavior with Auth0 plus `workspaceContextGuard` mode.

## 14. Permission Boundary

The implementation must not add permission checks.

`permissionGuard` remains separate and later than workspace context resolution.

This implementation slice is about context resolution only.

## 15. Test Authorization

Tests must verify:

- `/health` remains ungated.
- internal harness remains disabled by default.
- route-scoped workspace wiring runs only when enabled and resolver is provided.
- `authGuard`-produced `verifiedIdentityContext` is required before workspace context resolution.
- valid membership emits `requestContext` with `actorId` and route `workspaceId`.
- `not_member` and `workspace_not_found` return 404.
- resolver unavailable or thrown errors return 503.
- missing route workspace ID cannot be replaced by header/body/query values.
- no permissions or roles are attached by workspace wiring.

Tests must use deterministic fixtures only.

No live Auth0, DB, network, or external service is authorized.

## 16. Verification Commands Required

The implementation PR must provide results for:

```bash
npm run typecheck
npm run lint
npx prettier --check src/app.ts tests/workspace-context-app-wiring.test.ts
npm test -- tests/workspace-context-app-wiring.test.ts
git diff --check
git diff --name-only
```

All commands must pass before the PR is opened.

## 17. Prohibitions Summary

| Prohibited item | Reason |
|---|---|
| Public or product routes | Out of authorized scope |
| OpenAPI changes | Requires separate gate |
| DB-backed resolver | No persistence layer authorized |
| Auth0 SDK | Not authorized as RBAC authority |
| Auth0 roles/orgs/permissions as workspace authority | Binding constraint from PR #43 and PR #47 |
| workspaceId from token, headers, body, or query | Binding constraint from PR #47, Decision 7 |
| Global onRequest wiring for workspace context | Breaks route-param availability guarantee |
| Additional evaluatePermissionGuard call sites | Binding constraint from PR #37, Decision 5 |
| Secrets or credentials in any committed file | Scope constraint |

## 18. GO / NO-GO Decision

**Decision: GO** to the Workspace Context Resolution App Wiring Implementation Execution Gate — because:

- The authorized scope (Sections 5–15) is tightly bounded to wiring the already-implemented `workspaceContextGuard` into an opt-in internal harness route only.
- All constraints from the auth guard slice and prior binding decisions are carried forward.
- The explicit prohibitions (Section 17) close every expansion path not authorized.
- This gate is documentation-only.

**NO-GO** for everything listed in Section 17.

## 19. Next Gate

**Workspace Context Resolution App Wiring Implementation Execution Gate**

That gate must:

- Implement only what is authorized in Sections 5–15 of this gate.
- Confirm that `workspaceContextGuard` runs after `authGuard` in the wired path.
- Confirm that the internal harness remains opt-in and disabled by default.
- Confirm that no product route, public route, or OpenAPI change is introduced.
- Confirm all verification commands in Section 16 pass.
- Open a PR against main with only the authorized file changes.
