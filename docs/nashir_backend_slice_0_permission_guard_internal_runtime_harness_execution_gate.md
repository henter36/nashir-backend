# Nashir Backend Slice 0 Permission Guard Internal Runtime Harness Execution Gate

| Field | Value |
|---|---|
| Gate type | Narrow implementation execution gate |
| Authorization source | `docs/nashir_backend_slice_0_permission_guard_internal_runtime_harness_planning_review_gate.md` (PR #31) |
| PR #31 merge commit | `71247e79d4ac6feae8f91bad84b8f05cba9e32f1` |
| PR #30 merge commit (planning gate) | `696d638b23662b4cf0982b6389521fba24493928` |
| PR #29 merge commit (primitive review gate) | `adca1485c6164e67b9d5483c37d730144df2a6eb` |
| PR #28 merge commit (permission guard primitive) | `31244d03c7f91e51dacdec19d80f4ec37ebb50e5` |
| PR #27 merge commit (workspace route harness) | `a1177418312d59d5628207e88b0c9421541d208d` |
| Authority repository | `henter36/nashir` |
| Authority commit recorded from main (`docs/contract_reference.md`, `validate:contracts`) | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | Exactly one internal opt-in diagnostic route (`GET /internal/permission-guard-harness/:requiredPermission`), one new `BuildAppOptions` flag, one new handler function, one static fixture constant, and one new test file — nothing beyond this narrow scope |

---

## 1. Scope

PR #31's planning review gate confirmed all 14 review criteria for PR #30 passed, and reached a GO decision to a **Backend Slice 0 Permission Guard Internal Runtime Harness Execution Gate** scoped to implementing exactly one internal, opt-in, disabled-by-default diagnostic route. This gate executes that implementation.

The implementation is deliberately minimal: it mirrors the already-accepted, already-tested `WORKSPACE_ROUTE_HARNESS_ROUTE` / `enableInternalHarnessRoutes` pattern from PR #27 exactly, composing it with the `evaluatePermissionGuard` pure primitive reviewed by PR #28 and PR #29. No new pattern is introduced. No new dependency is added. The route proves only the wiring shape `requestContext -> evaluatePermissionGuard -> decision output`, surfaces the decision as a `200` diagnostic JSON body, and is never reachable unless the caller explicitly passes `enableInternalPermissionGuardHarnessRoutes: true` to `buildApp`.

---

## 2. Inputs Reviewed

| Input | Use in this execution gate |
|---|---|
| `docs/nashir_backend_slice_0_permission_guard_internal_runtime_harness_planning_review_gate.md` (PR #31) | The authorization source — specifies the exact constraints any implementation must satisfy: opt-in flag, static fixture, always-`200` response, no `error-model.ts` calls, default-disabled test from the outset, Section 9 non-authorization boundary carried forward |
| `docs/nashir_backend_slice_0_permission_guard_internal_runtime_harness_planning_gate.md` (PR #30) | The shape reference — the handler sketch, proposed type structures, and worked examples in PR #30 Sections 3 and 4 are the design the implementation must match |
| `src/app.ts` (state before this gate) | The file to be modified — the exact insertion points for the new import, constants, interfaces, handler, flag, destructure update, and registration block |
| `src/permission-guard.ts` (unchanged) | The pure decision primitive the new handler calls — `evaluatePermissionGuard(input: EvaluatePermissionGuardInput): PermissionGuardResult`, with `STATIC_HARNESS_GRANTED_PERMISSIONS` and `request.requestContext` as the input values |
| `src/request-context.ts` (unchanged) | Confirms `RequestContext { workspaceId: string; actorId: string }` — the type `request.requestContext` carries after the `onRequest` gate, adapted to `EvaluatePermissionGuardInput.requestContext` in the handler |
| `src/error-model.ts` (unchanged) | Referenced only to confirm it is deliberately NOT imported by or called from `permissionGuardHarnessHandler` — the always-`200` constraint requires its exclusion |
| `tests/request-context-plumbing.test.ts` (unchanged) | Pattern reference for harness test structure: the `buildAppWithHarness` helper, `injectAndParse`, `expectNotFound`, `expectRequestContextRequired` conventions, and the "not registered by default" test structure that the new suite mirrors |

---

## 3. Files Changed

Exactly two files were changed. No other file was touched.

| File | Change type | Description |
|---|---|---|
| `src/app.ts` | Modified | Added import, constants, interfaces, handler, flag, destructure update, and route registration |
| `tests/permission-guard-internal-runtime-harness.test.ts` | Created (new) | 9 tests proving all required behavioral properties of the new route |

The following files were **not** changed: `src/permission-guard.ts`, `src/error-model.ts`, `src/request-context.ts`, `src/index.ts`, `tests/permission-guard.test.ts`, `tests/request-context-plumbing.test.ts`, `tests/health.test.ts`, `tests/request-context.test.ts`, `tests/error-model.test.ts`, `package.json`, `pnpm-lock.yaml`, any workflow, any OpenAPI file, any generated file, and any migration or environment configuration.

---

## 4. Exact Changes to `src/app.ts`

### 4.1 New import (line 10)

```ts
import { evaluatePermissionGuard } from "./permission-guard.js";
```

`permission-guard.ts` is already on `main` (PR #28). No new package dependency is introduced. The import allows the handler to call `evaluatePermissionGuard` directly — the only call site for this function anywhere in the runtime source.

### 4.2 New route constant and static fixture (lines 27–33)

```ts
const PERMISSION_GUARD_HARNESS_ROUTE =
  "/internal/permission-guard-harness/:requiredPermission";

const STATIC_HARNESS_GRANTED_PERMISSIONS = Object.freeze([
  "harness.read",
  "harness.write"
]);
```

`STATIC_HARNESS_GRANTED_PERMISSIONS` is a module-level, `Object.freeze`-d, compile-time-constant string-literal array. It is never modified, never read from environment variables, never derived from a database or external service. Its values (`"harness.read"`, `"harness.write"`) are harness-local identifiers that do not map to any authority permission convention — they are purposefully opaque test fixtures and nothing more.

### 4.3 New query interface (lines 39–41)

```ts
interface PermissionGuardHarnessQuery {
  disclosureMode?: string;
}
```

An optional `?disclosureMode=non_disclosing` query parameter that allows a test caller to exercise the `not_found` code path through `evaluatePermissionGuard` (which requires `disclosureMode: "non_disclosing"` to return `not_found` when the permission is absent). Any value other than the exact string `"non_disclosing"` falls through to the default `"disclosing"` mode (see handler, Section 4.4). No other query parameter is accepted or used.

### 4.4 New handler (lines 57–79)

```ts
async function permissionGuardHarnessHandler(
  request: FastifyRequest<{
    Params: { requiredPermission: string };
    Querystring: PermissionGuardHarnessQuery;
  }>
) {
  const disclosureMode =
    request.query.disclosureMode === "non_disclosing"
      ? "non_disclosing"
      : "disclosing";

  const decision = evaluatePermissionGuard({
    requiredPermission: request.params.requiredPermission,
    grantedPermissions: STATIC_HARNESS_GRANTED_PERMISSIONS,
    requestContext: {
      workspaceId: request.requestContext?.workspaceId ?? "",
      actorId: request.requestContext?.actorId ?? ""
    },
    disclosureMode
  });

  return { ok: true, decision };
}
```

The handler is pure and produces no side effects:
- **`requiredPermission`**: taken from the route parameter — allows the caller to exercise all three `evaluatePermissionGuard` decision paths against one fixed `grantedPermissions` set without any server-side state change.
- **`grantedPermissions`**: always `STATIC_HARNESS_GRANTED_PERMISSIONS` — no DB, no auth, no env var, no header. This is the constraint from PR #30 Section 3.4 satisfied at the implementation level.
- **`requestContext`**: adapted from `request.requestContext`, which the existing `onRequest` gate guarantees is populated for any non-`/health` request that reaches the handler. The `?? ""` fallbacks satisfy the optional `request.requestContext?: RequestContext` decoration type (matching the identical pattern at `workspaceRouteHarnessHandler` line 50–51), and are unreachable during normal operation because the `onRequest` gate would have returned `401` before this handler runs.
- **`disclosureMode`**: derived solely from the query param via a strict `=== "non_disclosing"` check — any other value (or its absence) defaults to `"disclosing"`.
- **Return value**: `{ ok: true, decision }` — always `200 OK`. The decision value (including its `statusCode: 403`/`404` field for failure cases) is diagnostic data inside the body, never used to set the HTTP response status. `createHttpErrorResponse` and `createErrorModel` are never called.

### 4.5 Updated `BuildAppOptions` (line 97)

```ts
enableInternalPermissionGuardHarnessRoutes?: boolean;
```

Added alongside (not replacing) the existing `enableInternalHarnessRoutes?: boolean` field. Both are optional booleans with an effective default of `false` (the `=== true` gate ensures that omitting either flag, or passing `false`, leaves the corresponding route unregistered).

### 4.6 Updated destructure in `buildApp` (lines 101–105)

```ts
const {
  enableInternalHarnessRoutes,
  enableInternalPermissionGuardHarnessRoutes,
  ...fastifyOpts
} = opts;
```

The new flag is destructured out of `opts` before `...fastifyOpts` is spread into `Fastify({ logger: true, ...fastifyOpts })`. This ensures `enableInternalPermissionGuardHarnessRoutes` is never forwarded into the Fastify constructor as an unknown option — matching the exact existing pattern for `enableInternalHarnessRoutes`.

### 4.7 New route registration (lines 161–163)

```ts
if (enableInternalPermissionGuardHarnessRoutes === true) {
  app.get(PERMISSION_GUARD_HARNESS_ROUTE, permissionGuardHarnessHandler);
}
```

Placed **after** the existing `if (enableInternalHarnessRoutes === true)` block and **before** `app.setNotFoundHandler`. The two opt-in conditionals are independent — enabling one does not enable the other. This preserves the independence guarantee from PR #30 Section 3.1 and PR #31's criterion 2 review.

---

## 5. Test File: `tests/permission-guard-internal-runtime-harness.test.ts`

Nine tests, organized in four `describe` blocks. All pass against the current `main` HEAD.

### 5.1 `opt-in flag` (3 tests)

| Test | What it proves |
|---|---|
| "is not registered by default and falls through to the existing 404 ErrorModel behavior" | `buildApp({ logger: false })` (no flags) → `GET /internal/permission-guard-harness/harness.read` (with valid context headers) → `404 NOT_FOUND`. The route is unreachable without the flag. |
| "enabling enableInternalHarnessRoutes alone does not expose the permission guard harness route" | `buildApp({ logger: false, enableInternalHarnessRoutes: true })` → same URL → `404 NOT_FOUND`. The two flags are independent — enabling the workspace harness does not expose this route. |
| "is exposed when enableInternalPermissionGuardHarnessRoutes is true" | `buildApp({ logger: false, enableInternalPermissionGuardHarnessRoutes: true })` → same URL → `200`. The flag works as specified. |

### 5.2 `request context gate` (1 test)

| Test | What it proves |
|---|---|
| "rejects requests missing request-context headers with the existing 401 ErrorModel shape" | With the flag enabled, `GET /internal/permission-guard-harness/harness.read` with no `x-nashir-workspace-id` / `x-nashir-actor-id` headers → `401 REQUEST_CONTEXT_REQUIRED` with a `correlationId`. The existing `onRequest` gate applies before the handler runs — no special auth logic in the harness. |

### 5.3 `decision output — always 200 diagnostic JSON` (3 tests)

| Test | What it proves |
|---|---|
| "returns 200 with an allowed diagnostic decision when the permission is in the static fixture" | `GET .../harness.read` (present in `STATIC_HARNESS_GRANTED_PERMISSIONS`) → `200`, `body.ok === true`, `body.decision.ok === true`, `body.decision.decision === "allowed"`, `body.decision.requestContext` equals the supplied workspace/actor IDs. |
| "returns 200 with a forbidden diagnostic decision when the permission is absent (disclosing mode)" | `GET .../harness.admin` (not in fixture, default mode) → `200`, `body.ok === true`, `body.decision.ok === false`, `body.decision.decision === "forbidden"`, `body.decision.statusCode === 403`, HTTP status remains `200`. |
| "returns 200 with a not_found diagnostic decision when non_disclosing mode is requested" | `GET .../harness.admin?disclosureMode=non_disclosing` → `200`, `body.ok === true`, `body.decision.ok === false`, `body.decision.decision === "not_found"`, `body.decision.statusCode === 404`, HTTP status remains `200`. |

All three decision paths of `evaluatePermissionGuard` are exercised against one static fixture. All three return HTTP `200` with the decision described inside `body.decision` — not translated into real `403`/`404` HTTP responses.

### 5.4 `non-leakage and diagnostic purity` (2 tests)

| Test | What it proves |
|---|---|
| "does not expose grantedPermissions in the diagnostic output" | `body.grantedPermissions` and `body.decision.grantedPermissions` are both absent; `JSON.stringify(body)` does not contain `"harness.write"` (the unrequested fixture permission) — confirming the static array is never echoed in any response. |
| "does not apply ErrorModel HTTP response mapping — the outer HTTP status is always 200 even for a forbidden decision" | For an absent permission: HTTP status is `200` (not `403`); `body.ok === true` (outer diagnostic envelope); `body.code === undefined` and `body.message === undefined` at the outer level (no top-level `ErrorModel` shape). |

---

## 6. Constraint Compliance Check

| Constraint (from PR #31) | Implementation |
|---|---|
| Exactly one route: `GET /internal/permission-guard-harness/:requiredPermission` | `PERMISSION_GUARD_HARNESS_ROUTE` at line 27–28; one `app.get` registration at line 162. No second route proposed, registered, or tested. |
| Opt-in flag `enableInternalPermissionGuardHarnessRoutes?: boolean`, default `false` | Added to `BuildAppOptions` at line 97; `=== true` gate at line 161; destructured out at line 103 so it never reaches the Fastify constructor. |
| Route only registered when flag is `true` | `if (enableInternalPermissionGuardHarnessRoutes === true)` — strict equality, not truthy check. |
| Default `buildApp()` path must not register this route | `src/index.ts` calls `buildApp()` with no arguments (confirmed unchanged). Test "not registered by default" independently proves this. |
| Route requires existing request context mechanism | Handler sits behind the `onRequest` hook unchanged; test "rejects requests missing request-context headers" independently proves this. |
| `grantedPermissions` from static fixture only; no DB, auth, role resolver, external service | `STATIC_HARNESS_GRANTED_PERMISSIONS = Object.freeze(["harness.read", "harness.write"])` — module-level constant. No import of any DB client, auth library, or external service was added anywhere in `src/app.ts`. |
| Route returns uniform `200` diagnostic JSON for all decisions | Handler always `return { ok: true, decision }`. Three "always 200" tests independently prove this for allowed, forbidden, and not_found paths. |
| Route must not call `createHttpErrorResponse`, `createErrorModel`, or anything from `src/error-model.ts` | Handler body has no call to either function; `src/error-model.ts` is not imported by `permissionGuardHarnessHandler` (the existing import of `createHttpErrorResponse` at line 9 is for the `onRequest` hook and error handlers, unchanged). Test "does not apply ErrorModel HTTP response mapping" independently proves the diagnostic-purity property from the outside. |
| Route must not protect any real route | Handler performs no gate operation on any request other than itself. No `onRequest` hook modification, no `setNotFoundHandler` change, no `setErrorHandler` change. |
| No broad/default-on runtime enforcement | The route is (a) opt-in, (b) the only call site for `evaluatePermissionGuard` in runtime code, and (c) returns the decision as data — not as a gate on the request or any other request. |
| No product routes, auth provider, DB, role storage, generated clients, OpenAPI changes, secrets/env, CI, deployment | Only two files changed, neither of which introduces any of these categories (see Section 3). |

---

## 7. Test Results

```
Test Files  6 passed (6)
     Tests  72 passed (72)
```

Previously passing: 63 tests across 5 files. New: 9 tests in `tests/permission-guard-internal-runtime-harness.test.ts`. All previously passing tests continue to pass — no regression was introduced.

Lint: clean. Typecheck: clean. Prettier: clean. `NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts`: all PASS.

---

## 8. Explicit Non-Authorization Boundary

This execution gate does not authorize, and must NOT be read as approving, any of the following:

- wiring `permission-guard` into `src/app.ts`'s `onRequest` hook, `setNotFoundHandler`, or `setErrorHandler` (the only permitted call site is the single harness handler implemented here — this gate creates no authority to add others)
- broad or default-on runtime permission enforcement across any existing or future route
- product routes of any kind (workspace/campaign/content/product/asset APIs, etc.)
- an auth provider implementation (token issuance, session/credential verification, identity-provider integration)
- a role or permission inventory / role database / grant-resolution service
- DB, SQL, migrations, ORM, or query-layer work of any kind
- generated clients
- OpenAPI or other contract-document changes (including any attempt to resolve the `FORBIDDEN`/`NOT_FOUND` vs. authority `ErrorCode` mismatch unilaterally)
- secrets or environment-variable configuration
- mapping permission-guard failure results into live `ErrorModel` HTTP responses (the harness always returns `200` with a diagnostic body — `createHttpErrorResponse` is never called from the new handler)
- CI workflow changes
- deployment, pilot readiness, or production readiness of any kind
- any second harness route, variant, or extension beyond the single route implemented here

Each of these remains forbidden exactly as PR #30 Section 9 and PR #31 left it. This gate changes none of these positions.

---

## 9. GO / NO-GO Decision

**Decision: GO** to a **Backend Slice 0 Permission Guard Internal Runtime Harness Execution Review Gate** — because:

- Both changed files (`src/app.ts`, `tests/permission-guard-internal-runtime-harness.test.ts`) are exactly scoped to the single route, flag, handler, and fixture authorized by PR #31.
- The implementation satisfies every constraint listed in PR #31 Section 13 (the execution gate requirements): opt-in flag, static fixture only, always-`200` response, no `error-model.ts` calls, independent flag, `=== true` gate, `onRequest` gate reliance unchanged, nine tests covering all required behavioral properties including a "disabled by default" test from the outset.
- All 72 tests pass (9 new, 63 existing unchanged). Lint, typecheck, prettier, and `validate:contracts` are all clean.
- No file outside the two changed files was modified.
- No new package dependency was introduced.
- `src/index.ts` is unchanged — `buildApp()` with no arguments remains the normal runtime entry point, meaning neither harness route is ever reachable in production.

**NO-GO** for, at this time and on the strength of this gate alone, everything in Section 8 above.

---

## 10. Recommended Next Step

**Backend Slice 0 Permission Guard Internal Runtime Harness Execution Review Gate** — a documentation-only review/acceptance gate that independently reviews this execution gate's two changed files before they are merged to `main`.

That review gate should:
- independently re-read `src/app.ts` and `tests/permission-guard-internal-runtime-harness.test.ts` in full;
- re-run lint, typecheck, all 72 tests, prettier, and `validate:contracts`;
- verify that `git show --stat <merge-commit>` shows exactly two changed files;
- verify the `src/index.ts` `buildApp()` call remains unchanged;
- verify that `evaluatePermissionGuard` has no call site other than `permissionGuardHarnessHandler`;
- verify that `createHttpErrorResponse` and `createErrorModel` are not referenced from `permissionGuardHarnessHandler`;
- verify all nine tests pass and cover all required behavioral properties;
- confirm the always-`200` invariant holds across all three decision paths (allowed, forbidden, not_found);
- carry forward, verbatim, this gate's Section 8 non-authorization boundary; and
- reach a GO/NO-GO decision on merging this execution gate's changes to `main`.

Do not open a broad permission-enforcement, product-route, auth-provider, role-storage, database, `ErrorModel`-mapping, or multi-route gate from this execution gate. Each remains forbidden until its own, separately-scoped authorization sequence exists.

---

## 11. Verification Commands

```bash
cd ~/workspace/nashir-backend

git fetch origin --quiet
git status --short
git diff --stat main

npm run lint
npm run typecheck
npm test
NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts

# Confirm exactly two files changed relative to main
git diff --name-only main

# Confirm evaluatePermissionGuard has exactly one call site in runtime source
grep -n "evaluatePermissionGuard" src/app.ts src/index.ts

# Confirm createHttpErrorResponse is not called from permissionGuardHarnessHandler
grep -n "createHttpErrorResponse\|createErrorModel" src/app.ts

# Confirm index.ts calls buildApp with no arguments
grep -n "buildApp" src/index.ts

# Confirm the static fixture is a frozen module-level constant
grep -n "STATIC_HARNESS_GRANTED_PERMISSIONS" src/app.ts

# Confirm the flag is independent (not aliased to enableInternalHarnessRoutes)
grep -n "enableInternalPermissionGuardHarnessRoutes\|enableInternalHarnessRoutes" src/app.ts
```
