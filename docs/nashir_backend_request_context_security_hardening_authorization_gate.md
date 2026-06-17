# Nashir Backend - Request Context Security Hardening Authorization Gate

## Decision Summary

Gate type: Documentation-only implementation authorization gate.

Decision:

- GO to one limited implementation PR for the two hardening items authorized below.
- NO-GO for any expansion beyond those two items.

This gate authorizes implementation planning and execution only within the scope listed here. This gate itself changes documentation only.

## Source Review Gate Reference

Source review gate:

`docs/nashir_backend_request_context_security_fallback_review_gate.md`

The source review identified two hardening gaps:

1. Transitional request-context header fallback remains powerful when `authConfig` is absent.
2. Product route mounting with Auth0 but without `workspaceMembershipResolver` fails closed late through handler-level 500 instead of an earlier configuration guard.

The implementation PR authorized by this gate may address only those gaps.

## Authorized Implementation Scope

Authorized item A:

Tighten transitional request-context header fallback so it is explicitly test/local-only or guarded by a clear app configuration boundary.

Transitional request-context headers covered by item A:

- `x-nashir-actor-id`
- `x-nashir-workspace-id`
- `x-nashir-granted-permissions`

Preferred implementation shape:

- Add an explicit `buildApp` test/local option such as `enableTransitionalRequestContextHeaders: true`.
- The option default must be `false`.
- The option must only be used by tests and local harnesses.
- Production/Auth0-configured paths must not consult transitional headers.

Alternative implementation shape:

- If an environment flag is used instead, it must be explicit, default-false, and clearly non-production, for example `NASHIR_ENABLE_TRANSITIONAL_REQUEST_CONTEXT_HEADERS=true`.
- Environment-driven behavior must still satisfy all risk boundaries and Canonical non-goals / prohibited changes below.

Allowed implementation outcomes for item A:

- add an explicit app option that enables transitional request-context header mode;
- keep transitional header mode available for tests and local harnesses only when explicitly enabled;
- fail closed for non-health requests when neither Auth0 verification nor explicitly enabled transitional mode is configured;
- preserve `/health` as ungated;
- preserve the existing `RequestContext` shape unless a narrower internal type is needed without contract impact.

Authorized item B:

Add a fail-fast configuration guard when product routes are registered in an Auth0-backed path that requires workspace membership resolution but `workspaceMembershipResolver` is not configured.

Allowed implementation outcomes for item B:

- reject or throw during `buildApp` setup when product repositories are provided with `authConfig` but without `workspaceMembershipResolver`;
- reject or throw during `buildApp` setup when product routes would otherwise run without a workspace context guard;
- keep the failure generic and configuration-facing, not a public route behavior change;
- preserve all existing workspace membership resolver outcomes and non-disclosure mappings.

Authorized runtime files for the implementation PR:

- `src/app.ts`
- `src/request-context.ts` only if needed to express an explicit transitional-mode helper or type boundary

Authorized test files for the implementation PR:

- `tests/request-context-plumbing.test.ts`
- `tests/workspace-context-app-wiring.test.ts`
- product route wiring tests only if needed to prove product route registration fails fast without `workspaceMembershipResolver`

No other implementation files are authorized by this gate.

## Canonical Non-Goals / Prohibited Changes

The implementation PR must not:

- change OpenAPI;
- change generated types;
- add routes;
- remove routes;
- change public route paths;
- change the ErrorModel response contract;
- change permission semantics;
- change Auth0 token verification semantics;
- change workspace membership semantics;
- add an allow-all membership fallback;
- expose workspace existence to unauthorized actors;
- expose resource existence across workspaces;
- read permissions from Auth0 claims as runtime authority;
- read permissions from caller-controlled headers, body, or query in Auth0-backed runtime paths;
- add dependencies;
- change CI;
- change migrations, DB schema, ORM, or persistence behavior.

All implementation, test, risk, and acceptance decisions in this authorization gate inherit this canonical list.

## Risk Boundaries

The implementation PR must preserve these boundaries:

- `/health` remains ungated.
- Auth0-backed paths continue to derive actor identity only from verified JWT `sub`.
- Route/path `workspaceId` remains the trusted workspace source for workspace-guarded paths.
- `workspace_not_found` and `not_member` continue to map to indistinguishable 404 behavior.
- Membership unavailability continues to map to 503 without leaking resolver details.
- Cross-workspace resource mismatch continues to return 404 before permission grant checks.
- Missing permission behavior remains 403 in disclosing mode and 404 in non-disclosing mode.
- Internal harness routes remain opt-in.
- Product routes must not become usable with caller-supplied identity, workspace, or permission headers in production-oriented configuration.
- See Canonical non-goals / prohibited changes for changes that remain outside scope even when implementing A or B.

## Expected Files For Implementation PR

Expected runtime changes:

- `src/app.ts`

Possible runtime change if justified:

- `src/request-context.ts`

Expected tests:

- `tests/request-context-plumbing.test.ts`
- `tests/workspace-context-app-wiring.test.ts`

Possible additional test file if product registration is the chosen fail-fast boundary:

- `tests/products/product-route-handler.test.ts`

The implementation PR should keep the changed-file list small and explain any file outside this list before editing it.

## Required Tests For Implementation PR

The implementation PR must include tests proving item A:

- non-health requests fail closed when `authConfig` is absent and transitional header mode is not explicitly enabled;
- transitional request-context headers still work only when the explicit test/local option is enabled;
- `x-nashir-granted-permissions` is not accepted unless transitional mode is explicitly enabled;
- `/health` remains ungated in all modes;
- missing context failure happens before body parsing for gated non-health requests.

The implementation PR must include tests proving item B:

- product route registration with product repositories and `authConfig` fails fast when `workspaceMembershipResolver` is missing;
- product route registration succeeds when `authConfig` and `workspaceMembershipResolver` are both configured;
- no allow-all membership fallback is introduced;
- workspace membership failures still use the existing non-disclosing 404 behavior;
- membership resolver unavailability still maps to 503 without leaking resolver details.

Regression tests must continue proving:

- Auth0-backed requests ignore transitional request-context headers;
- route/path `workspaceId` overrides untrusted header/body/query workspace-like values;
- permission decisions do not read granted permissions from client input or Auth0 claims;
- permission failure responses do not expose granted permission inventories or actor identity.

## Validation Commands

The implementation PR and this authorization PR must pass:

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm test
NASHIR_AUTHORITY_REPO=/tmp/nashir-authority-e22 pnpm run validate:contracts
NASHIR_AUTHORITY_REPO=/tmp/nashir-authority-e22 pnpm run validate:contract-authority
NASHIR_AUTHORITY_REPO=/tmp/nashir-authority-e22 pnpm run validate:runtime-conformance
```

## Acceptance Criteria

The implementation PR is acceptable only if:

- item A is implemented with an explicit test/local transitional mode or equivalent guarded boundary;
- item B is implemented with a fail-fast configuration guard for product routes that require Auth0-backed workspace membership resolution;
- Canonical non-goals / prohibited changes are preserved;
- no workspace or resource existence is disclosed through changed 401/403/404/503 behavior;
- all required tests and validations pass.

## Final GO/NO-GO

Final decision:

- GO to a limited implementation PR for A and B only.
- NO-GO for any behavior change outside A and B, including all Canonical non-goals / prohibited changes.

This authorization PR is documentation-only.
