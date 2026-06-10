# Nashir Backend Slice 0 — Workspace Context Resolution App Wiring Planning Gate

## 1. Gate Classification

Gate type: Documentation-only planning gate.

This gate plans how the already implemented `workspaceContextGuard` may be wired into the backend application lifecycle.

This gate does not authorize implementation.

This gate does not authorize modifying `src/app.ts`.

This gate does not authorize route implementation.

This gate does not authorize OpenAPI changes.

This gate does not authorize DB, migration, ORM, query, deployment, secrets, or UI work.

## 2. Inputs Reviewed

Inputs reviewed:

- PR #63 merged implementation of `workspaceContextGuard`.
- PR #64 merged execution verification gate.
- Current `src/app.ts` request lifecycle.
- Current `src/workspace-context-guard.ts` implementation.
- Existing `authGuard` boundary.
- Existing transitional header-based request context path.
- Approved V1 decision that workspaceId source is the route/path parameter only.

## 3. Current App Lifecycle Observed

Current `src/app.ts` behavior:

- `/health` is excluded from request-context gating.
- `correlationId` is resolved in `onRequest`.
- If `authConfig` exists, `authGuardHook` runs.
- After `authGuardHook`, the current flow returns immediately.
- If `authConfig` does not exist, the transitional header-based request context path is used.
- `workspaceContextGuard` is not yet wired into `src/app.ts`.

This means Auth0 identity verification and workspace context resolution are currently implemented as separate pieces, but not yet connected in the app lifecycle.

## 4. Implemented Guard Boundary Observed

`workspaceContextGuard` currently:

- Requires `request.verifiedIdentityContext`.
- Reads `workspaceId` from a route parameter.
- Rejects missing verified identity with 401.
- Rejects missing route workspaceId with 400.
- Rejects invalid route workspaceId with 400.
- Calls an injected `WorkspaceMembershipResolver`.
- Maps `workspace_not_found` and `not_member` to 404.
- Maps resolver unavailable and thrown errors to 503.
- Emits `request.requestContext = { actorId, workspaceId }`.

## 5. Planning Problem

The planning problem is how to wire the guard into the application without violating approved boundaries.

The main sequencing question:

`authGuard` must run before `workspaceContextGuard`.

The main routing question:

`workspaceContextGuard` needs a trusted route/path `workspaceId`.

The main integration question:

`src/app.ts` currently performs global `onRequest` auth handling, but not all routes necessarily have a `workspaceId` route parameter.

## 6. Required Design Constraints

The wiring plan must preserve:

- Auth0 as identity provider only.
- Nashir as workspace membership authority.
- No Auth0 workspace claims.
- No `x-nashir-workspace-id` trust in Auth0 runtime path.
- No request body workspace ID trust.
- No query string workspace ID trust.
- Permission evaluation remains separate and after workspace context resolution.
- No DB-backed membership resolver unless separately authorized.
- No OpenAPI changes unless separately authorized.

## 7. Proposed Wiring Direction

Proposed direction for a later implementation gate:

- Keep `/health` ungated.
- Keep `correlationId` assignment early.
- Keep `authGuardHook` first when `authConfig` exists.
- Add a separate `workspaceContextGuardHook` only for workspace-scoped routes.
- Do not globally run `workspaceContextGuard` for every non-health route unless every protected route is guaranteed to have `request.params.workspaceId`.
- Introduce explicit app option for an injected `WorkspaceMembershipResolver`.
- Preserve the transitional header-based harness path only when `authConfig` is not configured.

This is a planning proposal only.

## 8. Route Scope Planning

Workspace context wiring should only apply to route shapes that include:

`:workspaceId`

Examples of future route patterns may include:

- `/workspaces/:workspaceId/...`
- `/internal/workspace-route-harness/:workspaceId` for harness-only verification if explicitly authorized.

No product route is authorized by this gate.

No new route is authorized by this gate.

## 9. Resolver Planning

The app wiring must receive a resolver through dependency injection.

Required resolver contract:

- Input:
  - `actorId`
  - `workspaceId`
- Output: object with an `outcome` property:
  - `{ outcome: "member" }`
  - `{ outcome: "workspace_not_found" }`
  - `{ outcome: "not_member" }`
  - `{ outcome: "unavailable" }`

This gate does not authorize implementing persistence.

For app-wiring tests, a deterministic in-memory resolver may be authorized later.

For production, a DB-backed resolver requires a separate persistence planning gate.

## 10. Lifecycle Risk

There is a technical lifecycle risk:

`workspaceContextGuard` depends on route params.

Before implementation, the next authorization gate must confirm that Fastify route params are safely available at the selected hook point.

If route params are not reliably available in the selected hook, the implementation must use a route-level `preHandler` or equivalent route-scoped hook instead of global `onRequest`.

Decision for this planning gate:

Do not assume global `onRequest` is sufficient for workspace context resolution.

## 11. Transitional Harness Risk

Current app includes internal harness routes gated by explicit options.

The next implementation plan must decide whether to:

- leave existing harness unchanged,
- add a new workspace-context wiring harness,
- or test wiring through route-level hooks without new runtime routes.

No harness expansion is authorized by this gate.

## 12. Formatting Baseline

Repository-wide formatting warnings remain classified as:

`Repository Formatting Baseline Cleanup Planning Gate`

They must not be mixed with workspace app wiring.

Decision: defer.

## 13. Acceptance Criteria for Next Gate

The next gate must decide:

- exact hook point for `workspaceContextGuard`;
- whether wiring is route-level or app-level;
- how `WorkspaceMembershipResolver` is injected;
- which files may be touched;
- whether `src/app.ts` can be modified;
- whether harness tests are allowed;
- whether OpenAPI alignment is required before route wiring;
- how transitional header-based mode remains isolated.

## 14. Explicit Non-Authorization

This planning gate does not authorize:

- editing `src/app.ts`;
- wiring `workspaceContextGuard`;
- adding routes;
- adding OpenAPI paths;
- adding DB membership lookup;
- adding ORM models;
- adding migrations;
- changing deployment configuration;
- changing secrets;
- changing UI;
- broad formatting cleanup.

## 15. Planning Decision

Decision: GO to Backend Slice 0 Workspace Context Resolution App Wiring Planning Review Gate.

This decision authorizes only review of this planning gate.

It does not authorize implementation.

## 16. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Workspace Context Resolution App Wiring Planning Review Gate`

The review gate must confirm whether app wiring should proceed to an implementation authorization gate or whether an OpenAPI/route alignment gate is required first.
