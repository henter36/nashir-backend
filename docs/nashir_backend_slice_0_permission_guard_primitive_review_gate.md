# Nashir Backend Slice 0 Permission Guard Primitive Review Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only implementation review / acceptance gate |
| Reviewed change | PR #28 — `feat: add permission guard decision primitive` |
| PR #28 merge commit | `31244d03c7f91e51dacdec19d80f4ec37ebb50e5` |
| PR #27 merge commit (workspace route harness) | `a1177418312d59d5628207e88b0c9421541d208d` |
| PR #26 merge commit (500 ErrorModel) | `7d9f31bc603bf7f5e2fd03f2990b2bebf7068eeb` |
| PR #25 merge commit (404 ErrorModel) | `3150873f08ae5e04656b789ea0d82c3c10c6f290` |
| PR #24 merge commit (401 ErrorModel) | `29b6e33a6335d67c318ae6cd53cd875e865495b1` |
| PR #23 merge commit (ErrorModel primitive) | `a2b86c6bac52eef72d9f8190c3c371e77d9f94ab` |
| Authority repository | `henter36/nashir` |
| Authority commit recorded from main (`docs/contract_reference.md`, `validate:contracts`) | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation, wiring, or runtime change of any kind |

---

## 1. Scope

This gate reviews PR #28 (merge commit `31244d03c7f91e51dacdec19d80f4ec37ebb50e5`), which added `src/permission-guard.ts` and `tests/permission-guard.test.ts` — a pure, in-memory permission *decision* primitive (`evaluatePermissionGuard`) that is **intentionally not wired into any Fastify route, hook, or runtime path**.

The review independently re-derives its findings from the merged source (not from the PR description alone): it re-reads `src/permission-guard.ts` and `tests/permission-guard.test.ts` in full, cross-checks them against `src/error-model.ts` and `src/app.ts` (to assess later mappability and confirm no runtime wiring exists), re-runs the test suite and contract-authority validation, and independently re-fetches the authority `ErrorCode` enum and `x-permission` conventions from `henter36/nashir` at the pinned commit.

This is a documentation-only review/acceptance gate. It does not modify `src/permission-guard.ts`, `src/app.ts`, `src/error-model.ts`, `src/request-context.ts`, any test file, CI configuration, `package.json`, OpenAPI/contract documents, or any other backend source file. It adds only this review document, and it authorizes no implementation, wiring, or runtime behavior change of any kind.

---

## 2. Inputs Reviewed

| Input | Use in this review |
|---|---|
| `src/permission-guard.ts` (current `main` HEAD / PR #28 merge `31244d0`, 108 lines) | The primitive under review — its types, decision ordering, and message/field hygiene are independently re-read line-by-line and checked in Sections 3–7 |
| `tests/permission-guard.test.ts` (current `main` HEAD / PR #28 merge `31244d0`, 219 lines, 11 tests) | Independently re-read in full; each of the ten review-requirement behaviors is matched against a concrete, currently-passing assertion in Section 6 |
| `git show --stat 31244d0` / `--name-only` | Confirms PR #28 changed exactly two files — `src/permission-guard.ts` (108 insertions) and `tests/permission-guard.test.ts` (219 insertions) — and no `src/app.ts`, route, OpenAPI, CI, or `package.json` file |
| `src/error-model.ts` (current `main` HEAD) | Used in Section 7 to independently assess whether `PermissionGuardForbiddenResult` / `PermissionGuardNotFoundResult` shapes can be mapped onto `CreateErrorModelInput` (`{ code, message, statusCode, correlationId?, details? }`) without modification to either module |
| `src/app.ts` (current `main` HEAD, re-confirmed via `grep -nE "app\.(get\|post\|put\|delete\|patch)\|setNotFoundHandler\|setErrorHandler\|onRequest"`) | Independently re-confirms that **no** import of, or reference to, `permission-guard` exists anywhere in the runtime app — the primitive remains fully unwired, exactly as PR #28 represents |
| Local re-run of `npm run lint`, `npm run typecheck`, `npm test`, `NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts` on the reviewed commit | Confirms the baseline this review evaluates is intact: lint clean, typecheck clean, all 63 tests passing (11 of them the new permission-guard suite), and the authority-pin/contract-authority validator reports `PASS` against authority commit `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| `henter36/nashir` authority OpenAPI contract — `docs/nashir_v1_openapi.yaml`, independently re-fetched at the `ErrorCode` enum (lines 4467–4516) and representative `x-permission` annotations (e.g. lines 82, 127, 274, 522, 780) | Independent re-verification of the authority's permission-string convention (`nashir.<resource>.<action>`, e.g. `nashir.products.read`, `nashir.content.approve`) and its closed `ErrorCode` enum (`permission.denied`, `resource.not_found`, `workspace.not_found`, …) — the basis for Section 7's contract-mismatch finding |
| `docs/contract_reference.md`, `docs/contract-reference.md` | Confirm the current, explicit governance position: OpenAPI/Auth/RBAC/Workspace-Identity alignment is `PENDING ALIGNMENT`, the OpenAPI contract "must not be used as an active downstream synchronization authority for ... permission enforcement ... until a later explicit Auth/RBAC/OpenAPI alignment gate authorizes it," and "auth implementation ... [is] not authorized" |

---

## 3. Review Criteria

This review checks PR #28 against twelve criteria, each resolved in the Review Matrix (Section 8):

1. PR #28 remained documentation/implementation-scoped to exactly its two allowed files and modified no runtime wiring
2. `evaluatePermissionGuard` is acceptable as a pure permission decision primitive (no Fastify, I/O, env, DB, role storage, auth provider, or runtime hooks)
3. Workspace-boundary mismatch is evaluated before permission-membership checks
4. `resourceWorkspaceId: null` and `undefined` are both treated as "absent," not as a mismatch
5. Denied (`forbidden`/`not_found`) results do not leak `actorId`, `grantedPermissions`, internal permission inventory, or resource existence
6. `disclosing` mode returns 403 on a missing permission
7. `non_disclosing` mode returns 404 on a missing permission
8. Failure outputs can be safely mapped later onto the existing internal `ErrorModel` serializer without modification to either module
9. Any mismatch between `FORBIDDEN`/`NOT_FOUND` and the authority `ErrorModel`/`ErrorCode` contract is identified
10. The non-authorization boundary is complete and explicit (product routes, auth provider, role storage, DB/SQL/migrations/ORM, generated clients, OpenAPI, secrets/env, deployment/pilot/production readiness, and broad runtime wiring)
11. The recommended next gate is correctly bounded to a narrow, opt-in, static/test-permission internal harness — not broad enforcement or product routes
12. Test coverage (Section 6) substantiates each of the above behaviorally, not just by declaration

---

## 4. Change Reviewed

PR #28's core change, restated for review:

- **Adds** `src/permission-guard.ts`, exporting `evaluatePermissionGuard(input)` and five supporting types: `PermissionGuardRequestContext`, `PermissionDisclosureMode`, `EvaluatePermissionGuardInput`, `PermissionGuardAllowedResult`, `PermissionGuardForbiddenResult`, `PermissionGuardNotFoundResult`, and the `PermissionGuardResult` union.
- **Models** three decisions — `allowed` (`ok: true`), `forbidden` (`ok: false`, `403`, `code: "FORBIDDEN"`, `message: "Forbidden."`), and `not_found` (`ok: false`, `404`, `code: "NOT_FOUND"`, `message: "Resource not found."`) — each carrying `requiredPermission` through.
- **Adds** `tests/permission-guard.test.ts` with 11 tests covering allow, default-forbidden, non-disclosing-not-found, workspace-boundary mismatch (including the nullable `resourceWorkspaceId` case), non-leakage, `requiredPermission` preservation, non-mutation, readonly-array support, generic/actor-free messaging, determinism/no-side-effects, and `null`-as-absent handling.
- **Performs no runtime wiring**: independently re-confirmed by `grep -rn "permission-guard\|evaluatePermissionGuard\|PermissionGuard" src/app.ts src/index.ts` returning no matches — the primitive exists in isolation, exactly as represented.

Each element of this change is independently re-checked against the merged source in Sections 5–7 below, not merely re-stated from the PR description.

---

## 5. Purity and Decision-Ordering Review

**Purity (review requirement 1; criterion 2).** Independent re-read of `src/permission-guard.ts` (all 108 lines) confirms:

- `import` statements: **none**. The file has zero imports — not of `fastify`, `node:*`, `./error-model`, `./request-context`, or any other module. It is fully self-contained.
- I/O: **none**. No `fetch`, `fs`, `net`, `process.stdout/stderr`, logging, or timers anywhere in the file.
- Environment reads: **none**. No `process.env` reference exists.
- Database / role storage / auth provider: **none**. `grantedPermissions: readonly string[]` is supplied entirely by the caller; the module neither queries nor stores anything — there is no role table, no permission inventory, no provider call, and no notion of "where permissions come from."
- Runtime hooks / routes: **none**. No `app.get`/`app.post`/`addHook`/`setNotFoundHandler`/`setErrorHandler`/`decorateRequest` call exists; the function is a plain, synchronous, total mapping from `EvaluatePermissionGuardInput` to `PermissionGuardResult`.

**Conclusion:** `evaluatePermissionGuard` is acceptable as a pure permission decision primitive. It satisfies all nine "implementation requirements" PR #28 was scoped to (pure types/functions only, no Fastify imports, no I/O, no env reads, no DB access, no role database, no actual auth provider, no runtime hooks, no product route) — independently re-verified by direct inspection, not by trusting the PR's self-description.

**Decision ordering (review requirement 2; criterion 3).** Lines 77–98 show the ordering precisely:

```ts
if (resourceWorkspaceId != null && resourceWorkspaceId !== requestContext.workspaceId) {
  return notFoundResult(requiredPermission);            // <- workspace-boundary check, FIRST
}

if (grantedPermissions.includes(requiredPermission)) {
  return { ok: true, decision: "allowed", ... };        // <- permission-membership check, SECOND
}

if (disclosureMode === "non_disclosing") {
  return notFoundResult(requiredPermission);
}

return { ok: false, decision: "forbidden", ... };
```

The workspace-boundary comparison is the **first** branch evaluated and **returns unconditionally** on mismatch — it is never reached only after a permission check, and it short-circuits before `grantedPermissions.includes(...)` is ever evaluated. This is also the behavior asserted by test "returns 404 when resourceWorkspaceId differs from requestContext.workspaceId, even when the permission is granted" (`tests/permission-guard.test.ts:66–82`), which deliberately supplies `grantedPermissions: [REQUIRED_PERMISSION]` (the permission *is* granted) together with a mismatched `resourceWorkspaceId`, and asserts the result is still `not_found`/404 — independently re-run and confirmed passing.

**Conclusion:** Workspace-boundary mismatch is evaluated strictly before, and overrides, permission-membership — exactly as review requirement 2 and the design comment (lines 62–65) state. This ordering is the one that prevents a 403-vs-404 status difference from being usable as a cross-workspace existence oracle (an actor who *would* be granted the permission cannot distinguish "wrong workspace" from "right workspace, no such resource" — both yield an identical 404).

---

## 6. Nullable Boundary, Disclosure Modes, and Non-Leakage Review

**`resourceWorkspaceId: null`/`undefined` as absent (review requirement 3; criterion 4).** The type is declared `resourceWorkspaceId?: string | null` (line 12 — nullable, not merely optional), and the guard condition is `resourceWorkspaceId != null && ...` (line 78), which uses **loose** inequality. In JavaScript/TypeScript, `x != null` is `false` for both `x === null` and `x === undefined`, and `true` for every other value — so the boundary check is skipped (treated as absent) in precisely those two cases, and only those two. This is independently confirmed by two passing tests:

- "treats null resourceWorkspaceId as absent resource workspace boundary" (`tests/permission-guard.test.ts:201–217`) — supplies `resourceWorkspaceId: null` with a *granted* permission and asserts `decision: "allowed"`.
- The omitted-field path is exercised by every other test in the suite that does not pass `resourceWorkspaceId` at all (e.g. the basic "allows when the required permission is present" test, `tests/permission-guard.test.ts:16–29`), each of which also reaches `allowed`/`forbidden` rather than a spurious `not_found`.

Both the `null` and `undefined` cases are therefore independently exercised and pass. **Conclusion:** requirement 3 is satisfied precisely — `null` and `undefined` are both treated as "no workspace boundary to check," and only a *present, differing* string value triggers the `not_found` branch. (Note: a present-but-equal string, e.g. `resourceWorkspaceId: "workspace-123"` matching `requestContext.workspaceId`, is also exercised implicitly as "no mismatch" by the ordering logic, though no test names that exact case explicitly — a minor coverage gap noted in Section 9, not a defect.)

**Non-leakage in denied results (review requirement 5; criterion 5).** Independent re-read of both failure-result interfaces (`PermissionGuardForbiddenResult`, lines 23–30; `PermissionGuardNotFoundResult`, lines 32–39) shows their field sets are exactly `{ ok, decision, statusCode, code, message, requiredPermission }` — `actorId`, `grantedPermissions`, and any notion of "what permissions exist" are structurally absent from the type, not merely omitted at one call site. The allowed-result's `requestContext` is independently re-confirmed to be **rebuilt** from scratch (lines 88–91: `{ workspaceId: requestContext.workspaceId, actorId: requestContext.actorId }`) rather than passed through by reference — meaning even if a caller's `requestContext` object carried extra, sensitive fields, they could not leak through `evaluatePermissionGuard`'s output (and the allowed branch is the *only* one that echoes any context at all; failure branches echo none). This is asserted by "does not leak grantedPermissions in a failure result" (`tests/permission-guard.test.ts:84–106`, checking both `"grantedPermissions" in forbidden/notFound` is `false` and `JSON.stringify(...)` does not contain a planted `"secret:internal-permission"` string) and "keeps failure messages generic and free of actorId" (`tests/permission-guard.test.ts:161–186`, checking both the `message` field and the full serialized JSON of both failure shapes for the actor id `"actor-456"`).

**Disclosure modes (review requirements 5–6; criteria 6–7).**

| Mode | Behavior on missing permission | Test | Independently re-run |
|---|---|---|---|
| `disclosing` (default — `disclosureMode = "disclosing"`, line 74) | `403` / `code: "FORBIDDEN"` / `"Forbidden."` | "forbids with 403 when the permission is missing by default" (`tests/permission-guard.test.ts:31–46`) — supplies no `disclosureMode` at all, confirming the *default* (not just an explicit `"disclosing"` value) yields 403 | PASS |
| `non_disclosing` | `404` / `code: "NOT_FOUND"` / `"Resource not found."` | "returns a non-disclosing 404 when the permission is missing and disclosure mode is non_disclosing" (`tests/permission-guard.test.ts:48–64`) | PASS |

Both branches are reached through the identical `notFoundResult(...)`/forbidden-literal code paths used elsewhere (lines 81, 97, 100–106), so the 404 emitted for "wrong workspace" and the 404 emitted for "non-disclosing missing permission" are **structurally indistinguishable** to a caller — which is the correct non-disclosure property: an actor cannot tell "this resource is in a workspace you cannot see" from "you lack permission and we will not confirm whether it exists" from "it genuinely does not exist." All three collapse to the same generic 404 shape.

**Conclusion:** Both disclosure-mode behaviors (review requirements 5 and 6, listed in the prompt as items "5: `disclosing` → 403" / "6: `non_disclosing` → 404" — corresponding to this gate's criteria 6–7) are correctly implemented and independently confirmed passing, and the non-leakage guarantees (review requirement 4 in this gate's numbering — "denied results do not leak…") hold structurally (by type shape) and behaviorally (by the cited tests), not merely by convention.

---

## 7. ErrorModel Mappability and Authority-Contract Mismatch Review

**Mappability onto the existing internal `ErrorModel` serializer (review requirement 6; criterion 8).** `src/error-model.ts` defines `CreateErrorModelInput = ErrorModel = { code: string; message: string; statusCode: number; correlationId?: string; details?: unknown }`. Comparing field-by-field against `PermissionGuardForbiddenResult`/`PermissionGuardNotFoundResult`:

| `ErrorModel` / `CreateErrorModelInput` field | Permission-guard failure-result source | Compatible? |
|---|---|---|
| `code: string` | `code: "FORBIDDEN"` / `code: "NOT_FOUND"` — both string literals, structurally assignable to `string` | Yes |
| `message: string` | `message: "Forbidden."` / `message: "Resource not found."` — both plain strings | Yes |
| `statusCode: number` | `statusCode: 403` / `statusCode: 404` — both number literals, structurally assignable to `number` | Yes |
| `correlationId?: string` | Not present on either failure result | N/A — caller supplies separately, exactly as the existing 401/404/500 integration sites in `src/app.ts` already do (each constructs its `createHttpErrorResponse` input by combining a locally-resolved `correlationId` with decision-specific `code`/`message`/`statusCode`) |
| `details?: unknown` | Not present on either failure result (by design — review requirement 5: "do not leak … internal permission inventory") | N/A — optional; omission is itself the conservative, correct choice for a non-disclosing primitive |

A future integration site could therefore call `createHttpErrorResponse({ code: result.code, message: result.message, statusCode: result.statusCode, correlationId })` directly from a `PermissionGuardForbiddenResult`/`PermissionGuardNotFoundResult` value with **zero changes to either `permission-guard.ts` or `error-model.ts`** — the shapes already line up on every field both modules share. This is independently verified by direct type-shape comparison (not by running such integration code, which would itself be out of scope for a documentation-only gate and is explicitly not authorized — see Section 9).

**Conclusion:** Review requirement 6 is satisfied — the failure outputs can be safely and mechanically mapped onto the existing internal `ErrorModel` serializer by a future, separately-authorized integration gate, without modification to either module.

**Authority `ErrorModel`/`ErrorCode` contract mismatch (review requirement 7; criterion 9).** Independently re-fetched from `henter36/nashir` at the pinned authority commit `04f54f8be852001173f4014cb2d81c5cdb97e35c`:

- The authority `ErrorCode` enum (`docs/nashir_v1_openapi.yaml:4467–4516`, ~50 values) is a **closed list** following a `lower.snake_case`, dot-namespaced convention — e.g. `permission.denied`, `resource.not_found`, `workspace.not_found`, `validation.failed`, `conflict.version_mismatch`. Neither `FORBIDDEN` nor `NOT_FOUND` (both `SCREAMING_SNAKE_CASE`, undotted) appears anywhere in it, in either case style or as a near-miss. The closest authority analogues are `permission.denied` (for the 403/forbidden concept) and `resource.not_found` / `workspace.not_found` (for the 404/not-found concept) — but these are **distinct string values**, not equivalents, and the backend repository does not own this enum (confirmed by `docs/contract_reference.md`: `henter36/nashir` is the "OpenAPI" / "Auth/RBAC/Workspace Identity" authority).
- This is the **same class of mismatch** independently identified for `REQUEST_CONTEXT_REQUIRED` in the prior `docs/nashir_backend_slice_0_error_model_response_contract_planning_review_gate.md` (Section 8): a backend-local code literal in `SCREAMING_SNAKE_CASE` versus a closed, externally-governed `lower.snake_case`/dot-namespaced enum that the backend cannot unilaterally extend. `FORBIDDEN`/`NOT_FOUND` simply continue that existing, already-acknowledged pattern rather than introducing a new one — and, like `REQUEST_CONTEXT_REQUIRED`, they are internal-only literals that have not been (and per `docs/contract_reference.md`'s `PENDING ALIGNMENT` status, must not yet be) advertised as authority-conformant.
- One encouraging structural observation, also independently verified: `evaluatePermissionGuard` treats `requiredPermission`/`grantedPermissions` as **wholly opaque strings** — it imposes no naming convention, namespace, or format requirement of its own. The authority's `x-permission` annotations (independently re-sampled at `docs/nashir_v1_openapi.yaml:82, 127, 274, 522, 780` — `nashir.products.read`, `nashir.products.manage`, `nashir.assets.read`, `nashir.content.read`, `nashir.content.approve`) follow a `nashir.<resource>.<action>` convention. Because the guard is convention-agnostic, it would accept authority-style permission strings (`"nashir.products.read"`) exactly as readily as the test suite's illustrative `"workspace:read"`/`"workspace.products.read"` fixtures — so **no rework of the primitive itself** would be needed once a future, separately-authorized gate settles on a permission-string convention. This is a point in favor of the primitive's design, independent of the `code` mismatch noted above.

**Conclusion:** Review requirement 7 is satisfied by this finding: `FORBIDDEN`/`NOT_FOUND` **do not** match the authority `ErrorCode` enum's values or naming convention (closed list; `lower.snake_case`, dot-namespaced; closest analogues are `permission.denied`/`resource.not_found`/`workspace.not_found`). This is consistent with, and does not worsen, the already-documented `PENDING ALIGNMENT` status and the existing `REQUEST_CONTEXT_REQUIRED` precedent — it is a carried pattern, not a new or surprising divergence, and remains a cross-repository concern this backend-side gate correctly does not attempt to resolve.

---

## 8. Review Matrix (PASS/FAIL)

| # | Criterion | Finding | Result |
|---|---|---|---|
| 1 | PR #28 stayed scoped to its two allowed files; no runtime wiring | `git show --stat 31244d0` shows exactly two files changed (`src/permission-guard.ts` +108, `tests/permission-guard.test.ts` +219); independently re-confirmed `grep -rn "permission-guard\|evaluatePermissionGuard\|PermissionGuard" src/app.ts src/index.ts` returns no matches | PASS |
| 2 | `evaluatePermissionGuard` is an acceptable pure decision primitive | Section 5: zero imports, no I/O, no env reads, no DB/role storage/auth-provider, no runtime hooks/routes — independently re-verified by full-file inspection | PASS |
| 3 | Workspace-boundary mismatch evaluated before, and overriding, permission membership | Section 5: lines 77–82 are the first branch and return unconditionally; test at `tests/permission-guard.test.ts:66–82` proves override even when the permission *is* granted | PASS |
| 4 | `resourceWorkspaceId: null`/`undefined` both treated as absent | Section 6: type is `string \| null`, comparison uses `!= null` (catches both); independently re-run passing tests cover both the explicit-`null` and omitted-field cases | PASS |
| 5 | Denied results do not leak `actorId`/`grantedPermissions`/permission inventory/existence | Section 6: failure-result types structurally exclude these fields; `requestContext` in the allowed result is rebuilt from only `workspaceId`/`actorId`, never passed through; two tests independently re-confirm via `"x" in result` and `JSON.stringify` containment checks | PASS |
| 6 | `disclosing` mode → 403 on missing permission | Section 6 table; "forbids with 403 ... by default" test (no `disclosureMode` supplied) independently re-run, PASS | PASS |
| 7 | `non_disclosing` mode → 404 on missing permission | Section 6 table; corresponding test independently re-run, PASS | PASS |
| 8 | Failure outputs are mappable onto the existing `ErrorModel` serializer without modifying either module | Section 7 field-by-field comparison: `code`/`message`/`statusCode` line up exactly; `correlationId`/`details` are caller-supplied/optional, matching the existing `src/app.ts` integration pattern | PASS |
| 9 | `FORBIDDEN`/`NOT_FOUND` vs. authority `ErrorCode`/`ErrorModel` mismatch identified | Section 7: independently re-fetched authority enum is closed, `lower.snake_case`, dot-namespaced (`permission.denied`, `resource.not_found`, `workspace.not_found`); `FORBIDDEN`/`NOT_FOUND` match neither value nor convention — same class of carried, pre-acknowledged divergence as `REQUEST_CONTEXT_REQUIRED` | PASS (mismatch correctly identified, not papered over) |
| 10 | Non-authorization boundary is complete (Section 9) | Section 9 enumerates every category the task requires plus the categories carried from prior gates (broad runtime wiring, product routes, auth provider, role storage, DB/SQL/ORM, generated clients, OpenAPI, secrets/env, deployment/pilot/production) | PASS |
| 11 | Recommended next gate is correctly bounded | Section 11 recommends only a narrow, opt-in, static/test-permission internal harness *planning* gate — explicitly not broad enforcement or product routes, mirroring the already-accepted opt-in pattern from PR #27 (`enableInternalHarnessRoutes`, default `false`) | PASS |
| 12 | Behaviors are test-substantiated, not merely declared | Every PASS row above cites a specific, independently re-run, currently-passing test by name and line range (11/11 permission-guard tests pass; 63/63 suite-wide) | PASS |

**All twelve review criteria PASS.**

---

## 9. Explicit Non-Authorization Boundary

This review gate does not authorize, and must NOT be read as approving, any of the following — whether suggested by this primitive's existence, by its mappability onto `ErrorModel` (Section 7), or by the recommended next step (Section 11):

- wiring `permission-guard` (or any permission decision logic) into `src/app.ts`'s `onRequest` hook, route handlers, `setNotFoundHandler`, or `setErrorHandler`
- broad or default-on runtime permission enforcement across any existing or future route
- product routes of any kind (workspace/campaign/content/product/asset APIs, etc.)
- an auth provider implementation (token issuance, session/credential verification, identity-provider integration)
- a role or permission inventory / role database / grant-resolution service (i.e., any system that *produces* `grantedPermissions` — this primitive only *consumes* a caller-supplied array)
- DB, SQL, migrations, ORM, or query-layer work of any kind
- generated clients
- OpenAPI or other contract-document changes (including any change that would declare `FORBIDDEN`/`NOT_FOUND` as authority-conformant codes, or attempt to resolve the Section 7 mismatch unilaterally)
- secrets or environment-variable configuration
- mapping permission-guard failure results into live `ErrorModel` HTTP responses (Section 7 establishes only that this is *structurally possible later*, not that it is authorized now)
- CI workflow changes
- deployment, pilot readiness, or production readiness of any kind

Each of these remains forbidden exactly as it was before this review, and exactly as the task that opened it specified; this gate changes none of these positions.

---

## 10. Risk Review

| Risk | Finding | Control |
|---|---|---|
| Premature-wiring risk | A reader could mistake Section 7's "the shapes already line up" finding for license to begin integrating `permission-guard` into `src/app.ts` | Section 9 states explicitly that ErrorModel-mappability is a *structural* finding about what a *future, separately-authorized* gate could do — not an authorization to do it now; Section 11 recommends only a narrow, opt-in *planning* gate, not an integration gate |
| Authority-contract drift risk (same class as `REQUEST_CONTEXT_REQUIRED`, independently re-confirmed here for `FORBIDDEN`/`NOT_FOUND`) | Continuing to mint backend-local `SCREAMING_SNAKE_CASE` codes that don't match the closed, externally-governed `ErrorCode` enum could compound the eventual alignment effort if left undocumented | Controlled by Section 7's explicit identification of the mismatch (review requirement 7) and by `docs/contract_reference.md`'s standing `PENDING ALIGNMENT` position, which already defers this class of decision to a future cross-repository alignment gate; this review adds no new unresolved surface, it documents an existing one for the same primitive family |
| Permission-string-convention risk | A future integration could lock in an incompatible permission-string convention (e.g., colon-delimited) before the authority's `nashir.<resource>.<action>` convention is formally adopted | Mitigated by the primitive's own design: Section 7 independently confirms `evaluatePermissionGuard` treats permission strings as wholly opaque, imposing no convention of its own — so adopting the authority convention later requires no change to this module |
| Non-disclosure correctness risk | If `non_disclosing` and workspace-boundary-mismatch paths produced *distinguishable* 404 shapes, an actor could use the difference as an existence/workspace oracle | Section 6 independently confirms both paths return through the identical `notFoundResult(...)` helper (line 49), producing byte-identical `{ code, message, statusCode, requiredPermission }` shapes differing only in `requiredPermission`'s value (which the caller already knows, since they supplied it) |
| Carried-forward `qlty check` residual finding (from the PR #16 track, re-noted in the prior error-model planning review gate) | Remains undispositioned, wholly independent of this primitive | Unchanged by this review; remains the subject of its own previously-recommended follow-up gate |

---

## 11. GO / NO-GO Decision

**Decision: GO** to a **Backend Slice 0 Permission Guard Internal Runtime Harness Planning Gate** — because all twelve review criteria in Section 8 resulted in a clean PASS: PR #28 stayed scoped to its two allowed files and added no runtime wiring; `evaluatePermissionGuard` is independently confirmed to be a pure, side-effect-free decision primitive; its workspace-boundary-before-permission ordering and nullable-boundary handling are correctly implemented and test-proven; its denied-result shapes structurally and behaviorally exclude all sensitive fields; both disclosure modes behave as specified and collapse to indistinguishable 404 shapes; its failure outputs are mechanically mappable onto the existing `ErrorModel` serializer without modifying either module; and the one identified contract mismatch (`FORBIDDEN`/`NOT_FOUND` vs. the closed, dot-namespaced authority `ErrorCode` enum) is a carried, already-acknowledged pattern — correctly identified, not papered over, and not a blocker to further *planning*.

**NO-GO** for, at this time and on the strength of this gate alone:
- any wiring of `permission-guard` into `src/app.ts` or any runtime path
- broad or default-on runtime permission enforcement
- product routes of any kind
- an auth provider implementation, role/permission inventory, or grant-resolution service
- DB, SQL, migrations, ORM, or query-layer work
- generated clients
- OpenAPI or contract-document changes (including any attempt to reconcile the Section 7 `ErrorCode` mismatch unilaterally)
- secrets or environment-variable configuration
- mapping permission-guard results into live HTTP `ErrorModel` responses
- CI workflow changes
- deployment, pilot readiness, or production readiness

This gate authorizes no source-code change of any kind. It authorizes only the opening of the next, narrowly-bounded planning gate named below — which must itself still require a further, explicit, separately-scoped authorization and execution gate before any runtime code change is made.

---

## 12. Recommended Next Step

**`docs/nashir_backend_slice_0_permission_guard_internal_runtime_harness_planning_gate.md`** — Backend Slice 0 Permission Guard Internal Runtime Harness Planning Gate.

That gate should *plan only* — not implement — a **narrow, opt-in internal harness route** that exercises `evaluatePermissionGuard` end-to-end using **static or test-fixture permission data** (e.g., a hardcoded `grantedPermissions` array supplied inline or via an opt-in build option), in the same spirit as the already-accepted, already-merged opt-in pattern PR #27 established for the workspace-route harness (`enableInternalHarnessRoutes?: boolean`, defaulting to `false`, gating route registration in `buildApp`). Specifically, that planning gate should:

- propose an analogous opt-in flag (e.g. `enableInternalPermissionGuardHarnessRoutes?: boolean`, defaulting to `false`) so the harness is never exposed by accident;
- propose a single read-only diagnostic route that supplies a static/test `grantedPermissions` set and a fixed or route-derived `requiredPermission`, calls `evaluatePermissionGuard`, and echoes back the resulting `decision` (and, for the `allowed` branch, the rebuilt `requestContext`/`requiredPermission`) — proving the primitive's wiring *shape* without granting it any real authority over real routes;
- explicitly note that mapping `forbidden`/`not_found` decisions into live `ErrorModel` HTTP responses (Section 7 of this gate) is itself a separate, later, explicitly-authorized step — not something the harness route should do silently as a side effect of being planned;
- carry forward, verbatim, every item in this gate's Section 9 non-authorization boundary; and
- recommend GO only to a further, narrowly-scoped *execution* gate for that single harness route — not to broad enforcement, not to product routes, and not to any auth-provider or role-storage work.

Do not open a broad permission-enforcement, product-route, auth-provider, role-storage, database, generated-client, OpenAPI-alignment, or direct runtime-wiring *implementation* gate from this review. Each remains forbidden (Section 9) until a later, explicitly-authorized execution gate exists — and even the recommended harness-planning gate above may only *plan*, not implement, that one narrow route.

---

## 13. Verification Commands

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

git show --stat 31244d03c7f91e51dacdec19d80f4ec37ebb50e5
git show --name-only --format=short 31244d03c7f91e51dacdec19d80f4ec37ebb50e5

grep -nE "import|process\.env|require\(" src/permission-guard.ts
grep -rn "permission-guard|evaluatePermissionGuard|PermissionGuard" src/app.ts src/index.ts

cd ~/workspace/nashir
git log -1 --format="%H"
grep -n "ErrorCode:" -A 50 docs/nashir_v1_openapi.yaml | head -55
grep -nE "x-permission: " docs/nashir_v1_openapi.yaml | head -10
```
