# Nashir Backend Slice 0 — Workspace Context Resolution App Wiring Planning Review Gate

## 1. Gate Classification

Gate type: Documentation-only planning review gate.

This gate reviews the merged Workspace Context Resolution App Wiring Planning Gate.

This gate does not authorize implementation.

This gate does not authorize modifying `src/app.ts`.

This gate does not authorize route implementation.

This gate does not authorize OpenAPI changes.

This gate does not authorize DB, migration, ORM, query, deployment, secrets, or UI work.

## 2. Inputs Reviewed

Inputs reviewed:

- PR #65: `docs: plan workspace context app wiring`
- Merged app wiring planning document.
- Previously merged `workspaceContextGuard` implementation.
- Current app lifecycle in `src/app.ts`.
- Existing `authGuard` runtime boundary.
- Existing transitional header-based request context path.
- Existing internal harness route pattern.
- Formatting baseline deferral decision.

## 3. Planning Document Review Summary

The planning gate correctly identifies that:

- `authGuard` must run before `workspaceContextGuard`.
- `workspaceContextGuard` requires `request.verifiedIdentityContext`.
- `workspaceContextGuard` requires route/path `workspaceId`.
- Workspace membership resolution must remain a Nashir authority concern.
- Auth0 must not become workspace, role, permission, or membership authority.
- Permission evaluation remains separate and later than workspace context resolution.
- Repository formatting baseline cleanup must remain deferred.

Result: PASS.

## 4. Current App Lifecycle Review

The current app lifecycle shows:

- `/health` remains ungated.
- `correlationId` is assigned in `onRequest`.
- When `authConfig` exists, `authGuardHook` runs.
- The current Auth0 path returns immediately after `authGuardHook`.
- Transitional header-based request context resolution is used only when `authConfig` is absent.
- `workspaceContextGuard` is not yet wired.

This confirms the planning gate correctly identified the integration gap.

Result: PASS.

## 5. Hook Point Review

The planning document correctly warns that `workspaceContextGuard` depends on route params.

Because route params must be reliably available, the next implementation authorization must not assume global `onRequest` is the correct hook point.

The safer implementation direction is:

- keep early `onRequest` for correlation ID and auth;
- apply workspace context resolution as route-level `preHandler`, route-level hook, or equivalent route-scoped lifecycle after params are reliably available;
- avoid globally running `workspaceContextGuard` for all non-health routes.

Result: PASS with implementation constraint.

## 6. Resolver Contract Review

The planning gate correctly requires resolver dependency injection.

The resolver output must be documented and implemented as an object with an `outcome` property:

- `{ outcome: "member" }`
- `{ outcome: "workspace_not_found" }`
- `{ outcome: "not_member" }`
- `{ outcome: "unavailable" }`

This aligns the planning document with the implemented TypeScript contract.

Result: PASS.

## 7. Scope Boundary Review

The next implementation authorization may consider touching only the minimum required files for app wiring.

Potential files for a later authorization gate:

- `src/app.ts`
- `tests/app.test.ts` or an equivalent app-level test file if already used in the repository
- possibly `src/workspace-context-guard.ts` only if a narrow exported type adjustment is required

This review does not authorize those changes.

Result: PASS.

## 8. OpenAPI / Route Alignment Review

No product or public workspace route should be introduced through app wiring.

If the next step introduces public workspace-scoped routes, an OpenAPI/route alignment gate must happen first.

If the next step only wires an internal harness or existing route-level test path, OpenAPI changes may remain deferred.

Decision:

- Internal app wiring harness: may proceed to authorization.
- Public/product routes: require OpenAPI/route alignment first.

Result: PASS.

## 9. Transitional Header Path Review

The existing transitional header-based path must remain isolated to no-authConfig mode.

The next implementation must not mix transitional `x-nashir-workspace-id` behavior with the Auth0 runtime path.

Result: PASS.

## 10. Formatting Baseline Review

Repository formatting warnings remain outside this slice.

They are still classified under:

`Repository Formatting Baseline Cleanup Planning Gate`

They must not be mixed with app wiring.

Result: PASS with deferred cleanup.

## 11. Risk Review

### 11.1 Route params availability risk

Risk: using a hook point where route params are unavailable.

Mitigation: require route-level or route-scoped hook in the next authorization gate unless proven otherwise.

Status: Controlled.

### 11.2 Global gating risk

Risk: globally applying `workspaceContextGuard` to routes that do not have `workspaceId`.

Mitigation: only apply to workspace-scoped route patterns.

Status: Controlled.

### 11.3 Membership resolver persistence risk

Risk: accidentally introducing DB-backed resolver work.

Mitigation: next authorization must limit resolver to dependency injection or deterministic test resolver only.

Status: Controlled.

### 11.4 OpenAPI drift risk

Risk: adding route behavior not represented in OpenAPI.

Mitigation: public/product route wiring requires OpenAPI/route alignment first.

Status: Controlled.

## 12. Review Findings

| Review Area | Result |
|---|---|
| Planning document scope | PASS |
| Auth before workspace sequencing | PASS |
| Route workspaceId source preserved | PASS |
| Auth0 boundary preserved | PASS |
| Resolver contract clarified | PASS |
| Permission boundary preserved | PASS |
| OpenAPI risk identified | PASS |
| Formatting baseline deferred | PASS |
| Implementation still unauthorized | PASS |

## 13. Gate Decision

Decision: GO to Backend Slice 0 Workspace Context Resolution App Wiring Implementation Authorization Gate.

This decision does not authorize implementation.

This decision authorizes only preparing the next authorization gate.

## 14. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Workspace Context Resolution App Wiring Implementation Authorization Gate`

The next gate must explicitly decide:

- whether `src/app.ts` may be modified;
- exact hook point for workspace context wiring;
- whether the implementation is route-level or app-level;
- how the `WorkspaceMembershipResolver` is injected;
- whether internal harness wiring is allowed;
- which tests are required;
- whether public routes are still prohibited;
- whether OpenAPI remains untouched;
- how no-authConfig transitional behavior remains isolated.

## 15. Explicit Non-Authorization

This review gate does not authorize:

- editing `src/app.ts`;
- wiring `workspaceContextGuard`;
- adding public routes;
- adding product routes;
- changing OpenAPI;
- implementing DB-backed membership resolver;
- adding ORM models;
- adding migrations;
- changing package dependencies;
- changing deployment or secrets;
- broad formatting cleanup.
