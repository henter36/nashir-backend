# Nashir Backend — Request Context Security Fallback Review Gate

## Decision Summary

Gate type: Documentation-only security fallback review gate.

Decision:

- GO only to a separate implementation authorization gate for the hardening gaps listed in this document.
- NO-GO for any runtime, auth, workspace, permission, route, OpenAPI, CI, generated type, dependency, or test change inside this PR.

This PR is limited to review documentation. It does not authorize code changes.

## Current Reviewed Areas

Reviewed source areas:

- `src/request-context.ts`
- `src/auth-config.ts`
- `src/auth-guard.ts`
- `src/workspace-context-guard.ts`
- `src/permission-guard.ts`
- `src/app.ts`
- `src/error-model.ts`
- `src/products/product-route.ts`
- `src/products/product-handlers.ts`

Reviewed test evidence:

- `tests/request-context.test.ts`
- `tests/request-context-plumbing.test.ts`
- `tests/auth-guard.test.ts`
- `tests/workspace-context-guard.test.ts`
- `tests/workspace-context-app-wiring.test.ts`
- `tests/permission-guard-app-wiring.test.ts`
- `tests/permission-guard-internal-runtime-harness.test.ts`
- `tests/permission-guard.test.ts`

## Security Invariants

The reviewed runtime is expected to preserve these invariants:

- `/health` remains the only ungated route in the reviewed app-level request-context plumbing.
- Authenticated runtime paths must derive actor identity from verified JWT `sub`, not from caller-controlled request-context headers.
- Auth0 token claims are identity input only; they are not workspace, membership, role, or permission authority.
- Workspace context for Auth0-backed routes must come from the route/path `workspaceId`, not from header, body, query, or token workspace-like values.
- Workspace membership must be resolved before workspace-scoped permission enforcement.
- Permission decisions must not read granted permissions from caller-controlled query, body, arbitrary headers, or Auth0 claims in Auth0-backed harness wiring.
- Cross-workspace resource mismatch returns 404 before permission grant checks.
- Permission failures must not expose granted permission inventories, actor identity, token claims, or stack traces.
- Missing or invalid request context must fail closed before body parsing on gated non-health routes.

## Auth Fallback Boundaries

When `authConfig` is present, `src/app.ts` routes all non-health requests through `authGuardHook` before considering transitional request-context headers.

Reviewed behavior:

- Missing or malformed `Authorization` returns 401.
- Invalid token structure, missing `kid`, invalid signature, wrong issuer, wrong audience, expired token, invalid `sub`, and invalid `iat` return 401.
- JWKS service failures return 503.
- `authGuard` binds only `request.verifiedIdentityContext = { actorId: payload.sub }`.
- `authGuard` does not bind `requestContext`.
- Auth0 claims such as org, permissions, roles, scopes, and custom namespace claims are not forwarded into verified identity or request context.
- Transitional `x-nashir-actor-id` and `x-nashir-workspace-id` headers are ignored when Auth0 token verification is configured.

Boundary result: PASS for Auth0-backed identity fallback boundaries.

## Workspace Context Fallback Boundaries

`workspaceContextGuard` requires verified identity before workspace resolution.

Reviewed behavior:

- Missing, null, or blank `verifiedIdentityContext.actorId` returns 401.
- Missing route `workspaceId` returns 400.
- Invalid route `workspaceId` returns 400.
- Header, body, query, and token workspace-like values are not trusted as workspace authority.
- Route/path `workspaceId` is the only trusted workspace source in the Auth0-backed workspace guard path.
- Membership resolver result `workspace_not_found` maps to 404.
- Membership resolver result `not_member` maps to 404.
- Membership resolver result `unavailable` maps to 503.
- Thrown membership resolver errors map to 503 without leaking resolver error details.

Boundary result: PASS for Auth0-backed workspace fallback boundaries.

## Permission Guard Fallback Boundaries

`evaluatePermissionGuard` separates permission denial from workspace existence disclosure.

Reviewed behavior:

- Granted required permission allows access.
- Missing permission defaults to 403 in disclosing mode.
- Missing permission returns 404 in `non_disclosing` mode.
- `resourceWorkspaceId` mismatch returns 404 even when the required permission is granted.
- Failure decisions do not include `grantedPermissions`.
- Failure messages are generic and do not include actor identity.
- App-level permission harness requires workspace context before permission enforcement.
- App-level permission harness does not read permission authority from request body, query, caller-supplied permission headers, or Auth0 claims.

Boundary result: PASS for the reviewed permission guard primitive and Auth0-backed harness wiring.

## Internal Harness Boundaries

Reviewed internal harness behavior:

- Internal workspace route harness is disabled by default.
- Internal permission guard harness is disabled by default.
- Enabling the workspace harness flag alone does not expose the permission harness.
- Harness routes are internal diagnostic surfaces and are not public product API routes.
- When enabled without Auth0-backed workspace membership wiring, the basic workspace harness may remain unguarded for diagnostic use.
- The standalone permission diagnostic harness returns a 200 diagnostic envelope for permission decisions and does not use ErrorModel HTTP mapping for the inner decision.

Boundary result: PASS for opt-in harness exposure boundaries, with the expectation that harness enablement remains non-production and explicit.

## Non-Disclosure Expectations

Expected non-disclosure behavior:

- Do not reveal whether a workspace exists when the actor is not a member.
- Do not reveal whether a cross-workspace resource exists.
- Do not reveal resource existence through a 403-vs-404 distinction when non-disclosing mode or workspace mismatch applies.
- Do not reveal token parsing, signature, claim, or key-fetch internals in 401/503 responses.
- Do not reveal membership resolver exception details in 503 responses.
- Do not reveal stack traces or thrown internal error messages in 500 responses.
- Do not reveal granted permission inventories in failure responses.

Reviewed mappings:

- 401 maps to `permission.denied` for auth and request-context failures.
- 403 maps to `permission.denied` for disclosing permission denial.
- 404 maps to `workspace.not_found` for workspace membership absence and `resource.not_found` for generic route/resource absence.
- 503 maps to `service.unavailable` for JWKS and membership lookup unavailability.

Boundary result: PASS for the reviewed non-disclosure expectations.

## Existing Evidence From Tests

Existing tests provide evidence for:

- Missing and blank request-context headers return 401.
- Gated requests are rejected before malformed or oversized body parsing.
- `/health` remains ungated and isolated.
- Unknown routes return generic 404 only after request context is satisfied.
- Internal 500 handling does not leak thrown error details.
- Auth0-backed requests ignore transitional request-context headers.
- Auth0 verified identity contains only `actorId`.
- Workspace guard ignores header/body/query/token workspace-like values.
- Membership `workspace_not_found` and `not_member` both map to 404.
- Membership unavailability and thrown resolver failures map to 503.
- Permission guard supports non-disclosing 404 and cross-workspace 404.
- Permission failures do not include granted permission inventories or actor identity.
- Permission app wiring enforces auth before workspace and workspace before permission.
- Internal harness routes are disabled by default and are opt-in.

## Potential Gaps

Gap 1: Transitional header fallback remains powerful when `authConfig` is absent.

Observed behavior:

- Without `authConfig`, `src/app.ts` uses `resolveRequestContextFromHeaders`.
- That path can set `request.requestContext` from `x-nashir-workspace-id`, `x-nashir-actor-id`, and `x-nashir-granted-permissions`.
- If product routes are registered in an app instance without Auth0 config and without workspace membership guard wiring, handlers can evaluate permissions from that transitional request context.

Risk:

- This is acceptable for test, harness, or transitional local flows only if those flows are explicitly excluded from production deployment.
- As a production fallback, it would allow caller-controlled headers to supply actor, workspace, and permissions.

Required next gate:

- A separate implementation authorization gate should decide whether to add a production fail-closed guard, build-time assertion, product-route registration guard, or explicit environment boundary test.

Gap 2: Product route mounting with Auth0 but without workspace membership resolver fails closed via handler-level 500 rather than an earlier configuration error.

Observed behavior:

- With `authConfig` present, `authGuard` sets verified identity only.
- If `workspaceMembershipResolver` is absent, product routes can be registered without a workspace guard preHandler.
- Product handlers then see missing `request.requestContext` and return a generic 500.

Risk:

- This does not appear to allow access, but it is a late failure mode rather than an explicit startup/configuration failure.

Required next gate:

- A separate implementation authorization gate should decide whether product route registration must require both Auth0 config and workspace membership resolver, or whether this remains acceptable until production bootstrap hardening.

## Recommended Next Step

Recommended next step:

- Open a separate implementation authorization gate for production fail-closed configuration around product-route mounting and transitional header fallback.

That gate should explicitly decide whether to authorize one of these approaches:

- reject product route registration unless Auth0 and workspace membership resolver wiring are present;
- disable transitional header-derived permissions outside test or local harness mode;
- add a production startup assertion that rejects product runtime without Auth0 and membership configuration;
- add documentation-only deployment constraints if runtime enforcement is deferred.

## Explicit Non-Goals

This PR does not authorize:

- runtime code changes;
- auth behavior changes;
- workspace membership behavior changes;
- permission behavior changes;
- new routes;
- public route changes;
- product handler changes;
- OpenAPI changes;
- generated type changes;
- CI changes;
- dependency changes;
- test changes;
- database, ORM, or migration changes.

## Required Implementation Authorization If Gaps Require Code Changes

Any fix for the potential gaps above requires a separate implementation authorization gate before code changes.

Required authorization must name:

- exact runtime files allowed to change;
- exact tests allowed to change;
- whether product-route registration can fail at startup;
- whether transitional request-context headers remain available outside tests;
- whether `x-nashir-granted-permissions` remains accepted outside transitional harness mode;
- expected 401/403/404/500/503 behavior after the change;
- OpenAPI non-impact or required OpenAPI authority update.

No implementation is authorized by this review gate.

## Validation Commands

Commands required for this documentation-only PR:

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm test
NASHIR_AUTHORITY_REPO=/tmp/nashir-authority-e22 pnpm run validate:contracts
NASHIR_AUTHORITY_REPO=/tmp/nashir-authority-e22 pnpm run validate:contract-authority
NASHIR_AUTHORITY_REPO=/tmp/nashir-authority-e22 pnpm run validate:runtime-conformance
```

Expected validation result: PASS with no runtime, tests, CI, OpenAPI, generated type, dependency, or route changes.

## Final GO/NO-GO

Final decision:

- GO to a separate implementation authorization gate for the identified hardening questions.
- NO-GO for runtime/auth/workspace/permission/test/CI/OpenAPI/generated/dependency changes in this PR.

This PR is documentation-only.
