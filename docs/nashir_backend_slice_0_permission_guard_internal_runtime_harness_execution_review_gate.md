# Nashir Backend Slice 0 Permission Guard Internal Runtime Harness Execution Review Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only execution review / acceptance gate |
| Reviewed change | PR #32 — `Implement permission guard internal runtime harness` |
| PR #32 merge commit | `1b23ed0db4329549744fa515d39b357efe9dd309` |
| PR #31 merge commit (planning review gate) | `35215df1c70f55f01979aecc3893d5fb1e03b0bc` |
| PR #30 merge commit (planning gate) | `696d638b23662b4cf0982b6389521fba24493928` |
| PR #29 merge commit (primitive review gate) | `adca1485c6164e67b9d5483c37d730144df2a6eb` |
| PR #28 merge commit (permission guard primitive) | `31244d03c7f91e51dacdec19d80f4ec37ebb50e5` |
| PR #27 merge commit (workspace route harness) | `a1177418312d59d5628207e88b0c9421541d208d` |
| Authority repository | `henter36/nashir` |
| Authority commit recorded from main (`docs/contract_reference.md`, `validate:contracts`) | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation, wiring, or runtime change of any kind |

---

## 1. Scope

This gate reviews PR #32 (merge commit `1b23ed0db4329549744fa515d39b357efe9dd309`), which implemented the Backend Slice 0 Permission Guard Internal Runtime Harness Execution Gate authorized by PR #31. It independently re-reads every changed source and test file in full, re-runs all lint/typecheck/test/contract checks on the merged `main` HEAD, and verifies that the implementation stayed within the narrow authorization from PR #31 (planning review gate) and PR #30 (planning gate) — exactly one opt-in, disabled-by-default, static-fixture-driven diagnostic route that proves the wiring shape `requestContext -> evaluatePermissionGuard -> decision output` without enforcement, product routes, DB/auth/role/secrets dependencies, or `ErrorModel` HTTP response mapping.

This is a documentation-only review/acceptance gate. It adds only this review document and authorizes no implementation, wiring, or runtime behavior change of any kind.

---

## 2. Inputs Reviewed

| Input | Use in this review |
|---|---|
| `docs/nashir_backend_slice_0_permission_guard_internal_runtime_harness_execution_gate.md` (PR #32) | The primary artifact under review — all 15 review criteria are applied against the two changed source/test files, and the gate document's own claims are independently verified against the merged source |
| `src/app.ts` (current `main` HEAD, 197 lines, independently re-read in full) | The primary implementation file — every new line is independently re-read and checked: the import, route constant, static fixture, query interface, handler body, `BuildAppOptions` extension, destructure update, and registration block |
| `tests/permission-guard-internal-runtime-harness.test.ts` (current `main` HEAD, 213 lines, 9 tests, independently re-read in full) | The new test file — each of the 9 tests is independently re-read and matched against the 8 required behavioral properties from PR #31 |
| `src/permission-guard.ts` (current `main` HEAD, 108 lines) | Re-confirmed unchanged by PR #32 — provides the independently-verified pure-primitive behavior that the handler composes |
| `src/error-model.ts` (current `main` HEAD, 47 lines) | Re-confirmed unchanged — used only to independently verify that `createHttpErrorResponse` (line 37) and `createErrorModel` (line 16) are not referenced from the new handler (lines 57–79 of `src/app.ts`) |
| `src/index.ts` (current `main` HEAD, 18 lines) | Re-confirmed `buildApp()` is called with no arguments on line 3 — independently proves neither harness flag is ever active in the normal runtime entry point |
| `docs/nashir_backend_slice_0_permission_guard_internal_runtime_harness_planning_review_gate.md` (PR #31) | The authorization source — the execution gate constraints PR #31 imposed (opt-in flag, static fixture, always-`200`, no `error-model.ts`, independent flags, default-disabled test from outset) are independently compared against the merged implementation |
| `tests/request-context-plumbing.test.ts` (current `main` HEAD) | Re-confirmed unchanged and all 23 tests still passing — verifies the new harness did not regress existing request-context, not-found, or error-handling behavior |

---

## 3. Review Criteria

This review checks PR #32 against fifteen criteria, each resolved in the Review Matrix (Section 11):

1. Exactly one internal diagnostic route was added: `GET /internal/permission-guard-harness/:requiredPermission`
2. The route is opt-in only and disabled by default
3. Default `buildApp()` does not register or expose the route
4. The route requires the existing request-context mechanism
5. The route uses only static/test-fixture `grantedPermissions`
6. No DB, auth provider, role resolver, secrets, env config, external services, generated clients, OpenAPI changes, SQL/migrations/ORM, or CI workflow changes were introduced
7. `forbidden`/`not_found` decisions return uniform `200` diagnostic JSON and are not translated into real `403`/`404` HTTP responses
8. `src/error-model.ts` is not called by the harness route
9. `evaluatePermissionGuard` is not broadly wired into runtime or real product routes
10. Diagnostic response does not leak `grantedPermissions`, actor permission inventory, or internal authority details
11. Tests cover: default route absence, opt-in route presence, request-context requirement, allowed decision, forbidden decision, `not_found` decision, non-leakage, no `ErrorModel` response mapping
12. PR #32 changed only the expected files
13. No wording or implementation detail could be misread as production-ready permission enforcement
14. A clear PASS/FAIL matrix is produced (Section 11 of this gate)
15. A clear GO/NO-GO decision is reached (Section 12 of this gate)

---

## 4. PR #32 Change Set Verification

`git show --stat 1b23ed0db4329549744fa515d39b357efe9dd309` shows exactly three files changed:

```
docs/nashir_backend_slice_0_permission_guard_internal_runtime_harness_execution_gate.md   310 insertions
src/app.ts                                                                                  47 insertions, 1 deletion
tests/permission-guard-internal-runtime-harness.test.ts                                    212 insertions
```

`git show --name-only` confirms the same three filenames and no others. The one deletion in `src/app.ts` is the replacement of the single-line destructure (`const { enableInternalHarnessRoutes, ...fastifyOpts } = opts;`) with the multi-line version that adds `enableInternalPermissionGuardHarnessRoutes` — a net addition of 4 lines, the "1 deletion" being the original single line.

Note: the merge commit includes a second constituent commit, "test: harden permission guard harness leak assertion," which strengthened the non-leakage test before merge. This is addressed in Section 8.3 below.

The following files were confirmed unchanged by PR #32: `src/permission-guard.ts`, `src/error-model.ts`, `src/request-context.ts`, `src/index.ts`, `tests/permission-guard.test.ts`, `tests/request-context-plumbing.test.ts`, `tests/health.test.ts`, `tests/request-context.test.ts`, `tests/error-model.test.ts`, `package.json`, `pnpm-lock.yaml`, and all workflow, OpenAPI, generated, and migration files. **Criterion 12: PASS.**

---

## 5. Source Code Review — `src/app.ts`

### 5.1 Imports

The three pre-existing imports remain unchanged: `node:crypto`, `fastify`, `./error-model.js`, `./request-context.js`. One new import was added at line 10:

```ts
import { evaluatePermissionGuard } from "./permission-guard.js";
```

`./permission-guard.js` is already on `main` (PR #28). No new package dependency was introduced: `package.json` is unchanged, confirmed by `git show --name-only`.

No DB driver (`pg`, `mysql`, `prisma`, `drizzle`, `typeorm`, etc.), auth library (`jsonwebtoken`, `passport`, `oauth`, etc.), HTTP client (`axios`, `node-fetch`, etc.), secrets manager, or external service client was imported anywhere in the changed files.

### 5.2 Route constant and static fixture (lines 27–33)

```ts
const PERMISSION_GUARD_HARNESS_ROUTE =
  "/internal/permission-guard-harness/:requiredPermission";

const STATIC_HARNESS_GRANTED_PERMISSIONS = Object.freeze([
  "harness.read",
  "harness.write"
]);
```

`STATIC_HARNESS_GRANTED_PERMISSIONS` is:
- module-level (not function-scoped or request-scoped)
- `Object.freeze`-d (immutable at runtime — no push/pop/mutation is possible)
- a compile-time-constant array of two string literals (`"harness.read"`, `"harness.write"`) that are harness-local identifiers with no relationship to the authority's `nashir.<resource>.<action>` permission convention
- sourced entirely at import time — no DB read, no env read, no config file read, no network call

This satisfies the PR #31 constraint that `grantedPermissions` must be a "literal, static, compile-time-constant array — never a database query, role-resolution call, environment variable, configuration file read, header-derived value, or any other runtime-sourced input."

### 5.3 Handler (lines 57–79), independently re-read in full

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

**Independent line-by-line findings:**

- `disclosureMode` is derived from a query param via a strict `=== "non_disclosing"` check. Any other value (or its absence) defaults to `"disclosing"`. The inferred type of `disclosureMode` is `"non_disclosing" | "disclosing"` (TypeScript infers string-literal types from a ternary with string-literal branches) — structurally identical to `PermissionDisclosureMode`, verified by the typecheck clean run.
- `grantedPermissions: STATIC_HARNESS_GRANTED_PERMISSIONS` — the module-level frozen constant; this is the only `grantedPermissions` source used by the handler. No variable, parameter, header, DB result, or environment value feeds into this field.
- `requestContext` adapter: `request.requestContext?.workspaceId ?? ""` / `actorId ?? ""`. The `?.`/`?? ""` fallbacks satisfy the optional `request.requestContext?: RequestContext` decoration type (same pattern as `workspaceRouteHarnessHandler` at lines 49–50). The `onRequest` hook (lines 118–144, unchanged) guarantees `request.requestContext` is populated for any non-`/health` request that reaches the handler — the `""` fallback is unreachable during normal operation.
- `return { ok: true, decision }` — the handler always returns a plain object with HTTP `200` (Fastify's default for a handler that returns a value without calling `reply.code()`). There is no `reply.code(...)`, no `reply.send(...)`, no call to `createHttpErrorResponse`, no call to `createErrorModel` anywhere in the handler body.
- No `process.env`, no I/O, no external call, no mutation of any shared state.

**`createHttpErrorResponse` call-site verification.** `grep` on `src/app.ts` confirms:
- Line 10: `import { evaluatePermissionGuard } from "./permission-guard.js";`
- Line 68: `const decision = evaluatePermissionGuard({...});` — the one and only call site
- Line 128: `const errorResponse = createHttpErrorResponse({...})` — inside the `onRequest` hook, unchanged
- Line 166: `const errorResponse = createHttpErrorResponse({...})` — inside `setNotFoundHandler`, unchanged
- Line 184: `const errorResponse = createHttpErrorResponse({...})` — inside `setErrorHandler`, unchanged

`permissionGuardHarnessHandler` spans lines 57–79. The three `createHttpErrorResponse` calls (lines 128, 166, 184) are all outside this range, all in pre-existing code, all unchanged. The handler is structurally isolated from the error-model layer.

### 5.4 `BuildAppOptions` and destructure (lines 92–105)

```ts
export interface BuildAppOptions extends FastifyServerOptions {
  enableInternalHarnessRoutes?: boolean;
  enableInternalPermissionGuardHarnessRoutes?: boolean;  // line 97 — new
}

export function buildApp(opts: BuildAppOptions = {}): FastifyInstance {
  const {
    enableInternalHarnessRoutes,
    enableInternalPermissionGuardHarnessRoutes,  // line 103 — new
    ...fastifyOpts
  } = opts;
  const app = Fastify({ logger: true, ...fastifyOpts });
```

Both flags are destructured before `...fastifyOpts` is spread into the Fastify constructor — neither flag reaches `Fastify({...})` as an unknown option. The two flags are listed at separate lines (96, 97) and extracted at separate lines (102, 103) in the destructure: they are independent and cannot be aliased. The existing `enableInternalHarnessRoutes` flag and its behavior are completely unchanged.

### 5.5 Route registration (lines 157–163)

```ts
if (enableInternalHarnessRoutes === true) {
  app.get(WORKSPACE_ROUTE_HARNESS_ROUTE, workspaceRouteHarnessHandler);
}

if (enableInternalPermissionGuardHarnessRoutes === true) {
  app.get(PERMISSION_GUARD_HARNESS_ROUTE, permissionGuardHarnessHandler);
}
```

Two independent conditionals. The new one uses strict `=== true` equality — `undefined`, `false`, or any other value does not register the route. `src/index.ts` calls `buildApp()` with no arguments (line 3: `const app = buildApp();`), so the default value of `opts` is `{}`, making both flags `undefined` and neither route registered in normal runtime use.

**Route list verification.** `grep -E -n "app\.(get|post|put|delete|patch)"` on `src/app.ts` returns exactly three lines:
- Line 146: `app.get(HEALTH_ROUTE, ...)` — pre-existing
- Line 158: `app.get(WORKSPACE_ROUTE_HARNESS_ROUTE, ...)` — inside `if (enableInternalHarnessRoutes === true)`, pre-existing
- Line 162: `app.get(PERMISSION_GUARD_HARNESS_ROUTE, ...)` — inside `if (enableInternalPermissionGuardHarnessRoutes === true)`, new

No `app.post`, `app.put`, `app.delete`, or `app.patch` appears. No product route exists or was added.

---

## 6. Handler Purity, Static Fixture, and Non-Enforcement Verification

**Single call site.** `evaluatePermissionGuard` appears exactly twice in `src/app.ts`: line 10 (import declaration) and line 68 (the single invocation inside `permissionGuardHarnessHandler`). It does not appear in `src/index.ts`. It does not appear in the `onRequest` hook (lines 118–144), `setNotFoundHandler` (lines 165–175), or `setErrorHandler` (lines 181–193). The permission primitive remains confined to the one diagnostic handler and no real route. **Criterion 9: PASS.**

**Uniform `200` diagnostic response.** The handler at lines 57–79 never calls `reply.code(...)`. In Fastify, a handler that returns a value without calling `reply.code()` produces an HTTP `200` response. The return value `{ ok: true, decision }` wraps the decision (which may internally have `statusCode: 403` or `statusCode: 404` fields) in a diagnostic envelope — those internal fields are data described in the body, not the HTTP response status. The three test cases ("allowed", "forbidden", "not_found") each assert `expect(statusCode).toBe(200)` independently and all pass. **Criterion 7: PASS.**

**`grantedPermissions` non-leakage.** `PermissionGuardAllowedResult` (`ok: true`, `decision: "allowed"`, `requestContext`, `requiredPermission`), `PermissionGuardForbiddenResult` (`ok: false`, `decision: "forbidden"`, `statusCode: 403`, `code: "FORBIDDEN"`, `message`, `requiredPermission`), and `PermissionGuardNotFoundResult` (`ok: false`, `decision: "not_found"`, `statusCode: 404`, `code: "NOT_FOUND"`, `message`, `requiredPermission`) — all verified from `src/permission-guard.ts:16–44` — structurally exclude `grantedPermissions` from every result variant. The handler wraps the result in `{ ok: true, decision }`, which also does not include `grantedPermissions`. The non-leakage test (Section 8.3 below) independently confirms this from the outside for the `allowed` path — including the assertion that `"harness.write"` (the unrequested fixture permission) does not appear anywhere in the serialized response body. **Criterion 10: PASS.**

---

## 7. `src/error-model.ts` Non-Invocation Review

`src/error-model.ts` exports two functions: `createErrorModel` (line 16) and `createHttpErrorResponse` (line 37). The function body of `permissionGuardHarnessHandler` (lines 57–79 of `src/app.ts`) contains neither name. The only lines in `src/app.ts` that reference `createHttpErrorResponse` are 9 (import), 128, 166, and 184 — all outside the handler's range and all in pre-existing, unchanged code (the `onRequest` 401 path, the 404 not-found handler, and the 500 error handler). `createErrorModel` does not appear anywhere in `src/app.ts` (it is wrapped by `createHttpErrorResponse` inside `src/error-model.ts` itself). No route of any kind in `src/app.ts` calls `createErrorModel` directly.

The harness route therefore satisfies the PR #31 constraint: it "never calls `createHttpErrorResponse`, `createErrorModel`, or any function from `src/error-model.ts`." **Criterion 8: PASS.**

---

## 8. Test File Review

### 8.1 Structure and coverage

Nine tests across four `describe` blocks — all nine independently re-read and independently re-run (72/72 pass on merged `main` HEAD):

| Describe block | Tests | Behavioral property covered |
|---|---|---|
| `opt-in flag` | 3 | Default 404, `enableInternalHarnessRoutes` alone → 404 (flag independence), flag → 200 |
| `request context gate` | 1 | Missing context → 401 `REQUEST_CONTEXT_REQUIRED` |
| `decision output — always 200 diagnostic JSON` | 3 | Allowed → 200, forbidden → 200, not_found → 200 |
| `non-leakage and diagnostic purity` | 2 | `grantedPermissions` not exposed; no ErrorModel HTTP mapping |

**Coverage map against PR #31 test requirements:**

| PR #31 test requirement | Covered by |
|---|---|
| Default route absence | "is not registered by default and falls through to the existing 404 ErrorModel behavior" |
| Opt-in route presence | "is exposed when enableInternalPermissionGuardHarnessRoutes is true" |
| Request context requirement | "rejects requests missing request-context headers with the existing 401 ErrorModel shape" |
| Allowed decision | "returns 200 with an allowed diagnostic decision when the permission is in the static fixture" |
| Forbidden decision | "returns 200 with a forbidden diagnostic decision when the permission is absent (disclosing mode)" |
| Not_found decision | "returns 200 with a not_found diagnostic decision when non_disclosing mode is requested" |
| Non-leakage | "does not expose grantedPermissions in the diagnostic output" |
| No ErrorModel response mapping | "does not apply ErrorModel HTTP response mapping — the outer HTTP status is always 200 even for a forbidden decision" |

All 8 required properties are independently covered by at least one named test. **Criterion 11: PASS.**

### 8.2 Flag independence test (beyond PR #31 minimum)

The test "enabling enableInternalHarnessRoutes alone does not expose the permission guard harness route" (`buildApp({ enableInternalHarnessRoutes: true })` → 404 on the permission-guard route) is an additional test beyond the PR #31 minimum. It directly proves the independence guarantee from PR #30 Section 3.1: enabling the workspace harness must never silently expose the permission-guard harness. This is a stronger baseline than was strictly required, and it is the lesson from PR #27's retrospective "exposure risk" fix applied from the outset as the planning gate required.

### 8.3 Hardened non-leakage test

The merge commit includes a second constituent commit, "test: harden permission guard harness leak assertion," which modified the non-leakage test between the original commit and merge. The change:

**Original:**
```ts
expect("grantedPermissions" in body).toBe(false);
expect("grantedPermissions" in body.decision).toBe(false);
```

**Merged (hardened):**
```ts
expect(body).not.toHaveProperty("grantedPermissions");
expect(body.decision).toBeDefined();
expect(body.decision).not.toHaveProperty("grantedPermissions");
```

This is a strictly stronger assertion:
- `.not.toHaveProperty("grantedPermissions")` uses Vitest's built-in property matcher, which is equivalent to the `in` check but more idiomatic and explicit in test output
- `expect(body.decision).toBeDefined()` adds an independent assertion that `body.decision` exists before checking its sub-properties — preventing the test from passing vacuously if `body.decision` were somehow absent (which would cause `body.decision.not.toHaveProperty(...)` to throw rather than fail cleanly)

The hardening makes the test more robust without relaxing any assertion. The `JSON.stringify(body).not.toContain(UNREQUESTED_FIXTURE_PERMISSION)` assertion (checking that `"harness.write"` does not appear anywhere in the serialized body) is unchanged and remains present. **The hardening commit is a positive change, not a concern.**

---

## 9. Wording and Production-Enforcement Signal Review

This section examines whether any wording or implementation detail in PR #32 could be misread as production-ready permission enforcement (criterion 13).

**Handler name and route path.** The handler is named `permissionGuardHarnessHandler` (not `permissionGuardMiddleware`, `authGuard`, or any name suggesting real enforcement). The route path is `/internal/permission-guard-harness/:requiredPermission` — the word "harness" and the `/internal/` prefix both signal diagnostic, non-production use.

**Always-`200` response.** The handler unconditionally returns `{ ok: true, decision }`. The outer `ok: true` field is a diagnostic success signal — "the harness responded" — not "access was granted." A caller who receives a `forbidden` decision will see `statusCode: 200` at the HTTP level with `body.ok: true` and `body.decision.ok: false, body.decision.decision: "forbidden"`. This structure cannot be mistaken for a real access-control response by any HTTP client, middleware, or observability tool that inspects the HTTP layer.

**`evaluatePermissionGuard` is the sole call site.** A future reader inspecting `src/app.ts` can see that `evaluatePermissionGuard` is called exactly once, inside a function gated by `enableInternalPermissionGuardHarnessRoutes === true`, and that `buildApp()` in production never passes this flag. There is no code path through which this primitive's output could affect a real request's handling.

**Missing comment on the new registration block.** The existing workspace harness registration block (lines 153–158) has a four-line comment ("Read-only harness proving request-context plumbing reaches a real route..."). The new registration block (lines 161–163) has no preceding comment. This is a very minor omission — the flag name `enableInternalPermissionGuardHarnessRoutes` and the `if (... === true)` structure are self-documenting — but a follow-up could add a comment for symmetry. It does not constitute a "misreadable as enforcement" wording issue. **No material concern.**

**Conclusion:** No wording or implementation detail in PR #32 could reasonably be misread as production-ready permission enforcement. **Criterion 13: PASS.**

---

## 10. Baseline Checks (independently re-run on merged `main` HEAD)

| Check | Result |
|---|---|
| `npm run lint` | Clean — no warnings or errors |
| `npm run typecheck` | Clean — `tsc --noEmit` exits with code 0 |
| `npm test` | 72/72 tests pass across 6 test files (9 new + 63 pre-existing) |
| `npx prettier --check` | All files use Prettier code style |
| `NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts` | All markers present; authority HEAD matches pinned commit `04f54f8be852001173f4014cb2d81c5cdb97e35c` |

Pre-existing test suites (23 plumbing tests, 11 permission-guard tests, 17 request-context tests, 11 error-model tests, 1 health test) all continue to pass — no regression introduced by PR #32.

---

## 11. Review Matrix (PASS/FAIL)

| # | Criterion | Finding | Result |
|---|---|---|---|
| 1 | Exactly one internal diagnostic route added: `GET /internal/permission-guard-harness/:requiredPermission` | `PERMISSION_GUARD_HARNESS_ROUTE` at `src/app.ts:27–28`; one `app.get` at line 162; `grep` confirms no other route registrations were added | PASS |
| 2 | Route is opt-in only and disabled by default | `enableInternalPermissionGuardHarnessRoutes?: boolean` at line 97; registration gated by strict `=== true` at line 161; `src/index.ts` calls `buildApp()` with no args | PASS |
| 3 | Default `buildApp()` does not register or expose the route | `src/index.ts:3` is `const app = buildApp();` (unchanged); test "is not registered by default" independently proves 404 → NOT_FOUND | PASS |
| 4 | Route requires existing request-context mechanism | `onRequest` hook (lines 118–144) is unchanged; test "rejects requests missing request-context headers" independently proves 401 → REQUEST_CONTEXT_REQUIRED | PASS |
| 5 | Route uses only static/test-fixture `grantedPermissions` | `STATIC_HARNESS_GRANTED_PERMISSIONS = Object.freeze(["harness.read", "harness.write"])` — module-level, frozen, compile-time-constant; handler passes it directly, no variable substitution | PASS |
| 6 | No DB/auth/role/secrets/external/generated/OpenAPI/SQL/CI changes introduced | PR #32 changed only 3 files; only new import is `./permission-guard.js` (already on `main`); `package.json` unchanged; no DB/auth/network/env import anywhere in changed files | PASS |
| 7 | `forbidden`/`not_found` return uniform `200` diagnostic JSON | Handler always `return { ok: true, decision }` with no `reply.code()`; three tests independently prove HTTP 200 for all three decision paths | PASS |
| 8 | `src/error-model.ts` not called by harness route | Handler spans lines 57–79; `createHttpErrorResponse` appears only at lines 128, 166, 184 (all pre-existing, outside handler range); `createErrorModel` does not appear in `src/app.ts` at all | PASS |
| 9 | `evaluatePermissionGuard` not broadly wired | Appears at line 68 only; absent from `onRequest` hook, `setNotFoundHandler`, `setErrorHandler`, and `src/index.ts`; no product route calls it | PASS |
| 10 | Diagnostic response does not leak `grantedPermissions` or inventory | All three `PermissionGuardResult` variants structurally exclude `grantedPermissions` (verified from `src/permission-guard.ts:16–44`); test asserts `.not.toHaveProperty("grantedPermissions")` and `JSON.stringify(body)` does not contain `"harness.write"` | PASS |
| 11 | Tests cover all 8 required behavioral properties | Coverage map in Section 8.1 confirms all 8 properties are covered; all 9 tests independently re-run and pass | PASS |
| 12 | PR #32 changed only the expected files | `git show --name-only` confirms exactly 3 files: `src/app.ts`, `tests/permission-guard-internal-runtime-harness.test.ts`, `docs/nashir_backend_slice_0_permission_guard_internal_runtime_harness_execution_gate.md` | PASS |
| 13 | No wording/implementation misreadable as production enforcement | Handler name, route path, always-`200` response, and single-call-site isolation all unambiguously signal diagnostic use; the "harden" commit strengthened (not relaxed) the non-leakage test | PASS |
| 14 | Clear PASS/FAIL matrix | See this section | PASS |
| 15 | Clear GO/NO-GO decision | See Section 12 below | PASS |

**All fifteen review criteria PASS.**

---

## 12. GO / NO-GO Decision

**Decision: GO** to a **Backend Slice 0 Permission Guard Internal Runtime Harness Follow-up Decision Gate** — because all fifteen review criteria in Section 11 resulted in a clean PASS:

- PR #32 changed exactly three files and no others — the scope matches precisely what PR #31 authorized.
- The implementation stays within every constraint from PR #31: opt-in flag, static fixture, always-`200`, no `error-model.ts` calls, independent flag, `=== true` gate, `onRequest` gate reliance unchanged, default-disabled test from the outset (plus the additional flag-independence test, which is stronger than the minimum required).
- All 72 tests pass (9 new, 63 pre-existing unchanged) on the merged `main` HEAD, independently re-run. Lint, typecheck, prettier, and `validate:contracts` are all clean.
- `evaluatePermissionGuard` has exactly one call site in the runtime source: inside the single, opt-in, diagnostic handler. No premature wiring to `onRequest`, `setNotFoundHandler`, `setErrorHandler`, or any product route occurred.
- The "harden" commit that was added between the original implementation commit and the merge strengthened the non-leakage test — a positive change that did not relax any assertion and did not introduce new scope.
- No wording or implementation detail could be misread as production-ready permission enforcement.

**NO-GO** for, at this time and on the strength of this gate alone:
- wiring `evaluatePermissionGuard` into any additional call site beyond `permissionGuardHarnessHandler`
- broad or default-on runtime permission enforcement across any existing or future route
- product routes of any kind
- an auth provider implementation, role/permission inventory, or grant-resolution service
- DB, SQL, migrations, ORM, or query-layer work
- generated clients
- OpenAPI or contract-document changes
- secrets or environment-variable configuration
- mapping permission-guard decisions into live HTTP `ErrorModel` responses
- CI workflow changes
- deployment, pilot readiness, or production readiness

This gate authorizes no source-code change of any kind. It authorizes only the opening of the follow-up decision gate named in Section 13.

---

## 13. Recommended Next Step

**Backend Slice 0 Permission Guard Internal Runtime Harness Follow-up Decision Gate.**

The permission guard harness is now on `main`. The wiring shape `requestContext -> evaluatePermissionGuard -> decision output` has been independently verified and test-proven across all three decision paths. The next gate does not authorize implementation — it decides the shape of the work that comes after.

That gate must choose between, and document a rationale for, exactly one of:

**A. Stop here.** Declare Slice 0 permission guard work complete at the harness level. The primitive (`evaluatePermissionGuard`) and its diagnostic harness are on `main` and test-proven. No further work within this slice is needed until a new slice is explicitly authorized. Document what Slice 0 achieved and what it intentionally left deferred.

**B. Narrow harness hardening.** Authorize only a tightly-scoped documentation or test follow-up (e.g., adding the missing comment to the `if (enableInternalPermissionGuardHarnessRoutes === true)` block, or adding a `disclosureMode` query-param validation guard). This requires its own scoped review gate before implementation.

**C. Permission-source alignment planning.** Open a planning gate to reason about the future question of "where will `grantedPermissions` come from at runtime?" — addressing the permission-source ambiguity risk that the harness intentionally does not resolve. This gate must remain documentation-only and must not authorize implementing a role storage, grant resolver, or auth provider.

**D. Real auth/RBAC integration planning.** Open a separate, explicitly-scoped planning gate for the first real authentication or RBAC integration. This would be a significant gate covering: auth provider selection, token verification flow, role/permission storage approach, `grantedPermissions` resolution lifecycle, OpenAPI `ErrorCode` alignment, and the multi-gate execution sequence that would eventually bring `evaluatePermissionGuard` to bear on real product routes. This gate must itself produce only a plan document, not authorize implementation.

The follow-up decision gate must not authorize any combination of A–D simultaneously. It must pick exactly one path, scope it precisely, and open only the next narrowly-scoped gate appropriate for that path — not broad authorization for all of auth, RBAC, and enforcement in one step.

In all cases, the follow-up decision gate must carry forward, verbatim, this gate's Section 12 NO-GO list into its own non-authorization boundary.

---

## 14. Verification Commands

```bash
cd ~/workspace/nashir-backend

git fetch origin --quiet
git checkout main
git pull origin main

git status --short
git log --oneline -8

npm run lint
npm run typecheck
npm test
NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts

# Confirm PR #32 changed exactly 3 files
git show --name-only --format=short 1b23ed0db4329549744fa515d39b357efe9dd309

# Confirm evaluatePermissionGuard has exactly one call site in runtime source
grep -n "evaluatePermissionGuard" src/app.ts src/index.ts

# Confirm createHttpErrorResponse is not in the handler (lines 57-79)
grep -n "createHttpErrorResponse\|createErrorModel" src/app.ts

# Confirm route list — exactly 3 routes (health, workspace harness gated, pg harness gated)
grep -E -n "app\.(get|post|put|delete|patch)" src/app.ts

# Confirm both flags are independent (on separate lines, destructured separately)
grep -n "enableInternal" src/app.ts

# Confirm index.ts calls buildApp with no arguments
grep -n "buildApp" src/index.ts

# Confirm static fixture is frozen and module-level
grep -n "STATIC_HARNESS_GRANTED_PERMISSIONS" src/app.ts

# Confirm no process.env reads were added to src/app.ts for the harness
grep -n "process.env" src/app.ts
```
