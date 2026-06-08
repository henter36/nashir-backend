# Nashir Backend Slice 0 Permission Guard Internal Runtime Harness Planning Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only planning gate |
| Reviewed authorization source | `docs/nashir_backend_slice_0_permission_guard_primitive_review_gate.md` (PR #29) |
| PR #29 merge commit | `adca1485c6164e67b9d5483c37d730144df2a6eb` |
| PR #28 merge commit (permission guard primitive) | `31244d03c7f91e51dacdec19d80f4ec37ebb50e5` |
| PR #27 merge commit (workspace route harness + opt-in pattern) | `a1177418312d59d5628207e88b0c9421541d208d` |
| Authority repository | `henter36/nashir` |
| Authority commit recorded from main (`docs/contract_reference.md`, `validate:contracts`) | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation, wiring, or runtime change of any kind. It plans, and only plans, the shape of one future, separately-authorized harness route |

---

## 1. Scope

PR #29 (the Permission Guard Primitive Review Gate) reached **GO**, but explicitly and only to *this* gate — a narrowly-scoped planning gate for an internal runtime harness (`docs/nashir_backend_slice_0_permission_guard_primitive_review_gate.md` Sections 11–12). PR #29 was equally explicit about what that GO does **not** cover: it does not authorize implementation, broad permission enforcement, product routes, an auth provider, role storage, DB/SQL/ORM, generated clients, OpenAPI changes, secrets/environment configuration, CI workflow changes, deployment, pilot readiness, or production readiness (Section 9 of that gate, carried forward verbatim in Section 9 below).

This gate's job is therefore narrow and specific: **plan** — in prose, types, and route-shape description only — a single, opt-in, disabled-by-default internal diagnostic route that proves the wiring shape `requestContext -> evaluatePermissionGuard -> decision output` using static/test-fixture data, mirroring the already-accepted, already-merged opt-in pattern PR #27 established (`enableInternalHarnessRoutes?: boolean`, default `false`, gating route registration inside `buildApp`). It does not write, edit, or scaffold any of that route's code. It adds only this one documentation file.

---

## 2. Inputs Reviewed

| Input | Use in this plan |
|---|---|
| `docs/nashir_backend_slice_0_permission_guard_primitive_review_gate.md` (PR #29, merge `adca148`) | The authorization source for this gate — Sections 9, 11, and 12 define exactly what this plan may and may not propose; re-read in full and carried forward in Sections 9 and 13 below |
| `src/permission-guard.ts` (current `main` HEAD) | The pure decision primitive this harness would exercise — `evaluatePermissionGuard(input)`, its `EvaluatePermissionGuardInput`/`PermissionGuardResult` shapes, and its `PermissionGuardRequestContext { workspaceId, actorId }` input shape, which the harness route's real `request.requestContext` must be adapted to |
| `tests/permission-guard.test.ts` (current `main` HEAD) | Source of realistic, already-reviewed example inputs (`requiredPermission`, `grantedPermissions`, `disclosureMode`, `resourceWorkspaceId`) that a future harness could safely reuse as static fixtures without inventing new ones |
| `src/app.ts` (current `main` HEAD, lines 23–43, 56–65, 105–118) | The exact shape of the existing opt-in harness pattern this plan proposes to mirror: `WORKSPACE_ROUTE_HARNESS_ROUTE`, `workspaceRouteHarnessHandler`, `BuildAppOptions extends FastifyServerOptions { enableInternalHarnessRoutes?: boolean }`, the `const { enableInternalHarnessRoutes, ...fastifyOpts } = opts` destructure, and the `if (enableInternalHarnessRoutes === true) { app.get(...) }` gate — independently re-read to ground this plan in the actual, currently-merged precedent rather than a description of it |
| `src/request-context.ts` (current `main` HEAD) | Confirms the shape `RequestContext { workspaceId: string; actorId: string }` that `request.requestContext` carries once the existing `onRequest` hook has gated a request — this is the adapter surface between the runtime and `PermissionGuardRequestContext` |
| `src/error-model.ts` (current `main` HEAD) | Confirms `CreateErrorModelInput = ErrorModel = { code, message, statusCode, correlationId?, details? }` — the shape that PR #29 Section 7 found `PermissionGuardForbiddenResult`/`PermissionGuardNotFoundResult` to be structurally mappable onto, and which Section 5 of this plan explicitly declines to wire up |
| `tests/request-context-plumbing.test.ts` (current `main` HEAD) | Source of the established harness-testing idioms (`buildAppWithHarness(options)`, `injectAndParse`, `expectRequestContextRequired`/`expectNotFound`/`expectInternalServerError` helper patterns, and the existing "is not registered by default" test for `WORKSPACE_ROUTE_HARNESS_ROUTE`) that a future execution gate would extend rather than invent from scratch |
| PR #27 (`Add internal workspace route harness`, merge `a117741`) and its follow-up opt-in-gating commit | The precedent this plan is required to mirror: a single read-only `GET /internal/workspace-route-harness/:workspaceId` route, gated by `enableInternalHarnessRoutes` (default `false`), echoing `requestContext`/`correlationId` without touching auth, DB, or permissions |
| `docs/contract_reference.md` / `docs/contract-reference.md` | Confirm the standing `PENDING ALIGNMENT` position and that "permission enforcement ... [must not be synchronized against the OpenAPI contract] until a later explicit Auth/RBAC/OpenAPI alignment gate authorizes it" — directly bearing on why this harness must not become enforcement |

---

## 3. What This Gate Plans (and Only Plans)

This gate proposes — for a later, separately-authorized **execution** gate to implement, not for itself to build — the shape of exactly one route:

```
GET /internal/permission-guard-harness/:requiredPermission
```

registered only inside `buildApp` and only when explicitly opted in, alongside (not replacing or modifying) the existing `WORKSPACE_ROUTE_HARNESS_ROUTE`. Nothing else. No second route, no variant, no "while we're at it" addition is proposed.

### 3.1 Proposed opt-in flag (planning requirement 3)

Mirroring `enableInternalHarnessRoutes` (`src/app.ts:60`) exactly, extend `BuildAppOptions` with a second, independent flag:

```ts
export interface BuildAppOptions extends FastifyServerOptions {
  enableInternalHarnessRoutes?: boolean;
  enableInternalPermissionGuardHarnessRoutes?: boolean;
}
```

- **Default:** `false` (planning requirement 2 — disabled by default). Omitting it, or passing `false`, must leave the route unregistered, exactly as the existing flag's "is not registered by default and falls through to the existing 404 ErrorModel behavior" test (`tests/request-context-plumbing.test.ts`) already proves for its sibling.
- **Independence:** this flag must gate *only* the permission-guard harness route. It must not be aliased to, combined with, or implied by `enableInternalHarnessRoutes` — each opt-in surface should be independently controllable, so enabling one diagnostic route never silently exposes another. This mirrors the existing destructure pattern: `const { enableInternalHarnessRoutes, enableInternalPermissionGuardHarnessRoutes, ...fastifyOpts } = opts`, with the new flag never forwarded into `Fastify({ ... })`.
- **Naming:** the flag name proposed in the task prompt (`enableInternalPermissionGuardHarnessRoutes?: boolean`, default `false`) is adopted as-is — it follows the existing `enableInternal*HarnessRoutes` naming convention precisely, requires no deviation, and keeps the two opt-in surfaces visually and semantically parallel for future readers.

### 3.2 Proposed route registration (mirrors `src/app.ts:116–118`)

```ts
if (enableInternalPermissionGuardHarnessRoutes === true) {
  app.get(PERMISSION_GUARD_HARNESS_ROUTE, permissionGuardHarnessHandler);
}
```

placed alongside, not inside, the existing `if (enableInternalHarnessRoutes === true) { ... }` block — two separate, independently-gated conditionals, not a merged or nested one. This preserves the property that disabling one harness can never be circumvented by enabling the other.

### 3.3 Proposed handler shape — proving the wiring, nothing more (planning requirement 8)

The handler's *only* job is to demonstrate the chain `requestContext -> evaluatePermissionGuard -> decision output`:

```ts
async function permissionGuardHarnessHandler(
  request: FastifyRequest<{ Params: { requiredPermission: string } }>
) {
  const decision = evaluatePermissionGuard({
    requiredPermission: request.params.requiredPermission,
    grantedPermissions: STATIC_HARNESS_GRANTED_PERMISSIONS,   // static fixture — see 3.4
    requestContext: {
      workspaceId: request.requestContext?.workspaceId ?? "",
      actorId: request.requestContext?.actorId ?? ""
    }
  });

  return { ok: true, decision };
}
```

This sketch is illustrative of the *shape* a future execution gate would refine — not a final signature, and not something this gate authorizes anyone to type into `src/app.ts`. It is reproduced here only so that the planning claims in Sections 3.4–3.6 below are concrete enough to review and accept or reject as a unit.

Because the route sits behind the existing `onRequest` request-context gate (every non-`/health` route does — `src/app.ts:77–104`), `request.requestContext` is guaranteed to be a populated `{ workspaceId, actorId }` by the time the handler runs whenever the route actually executes; the `?? ""` fallback exists only to satisfy the `requestContext?: RequestContext` optional-decoration type (`src/app.ts:18–19`), exactly as `workspaceRouteHarnessHandler` already does at `src/app.ts:38–39`. No new request-context logic is introduced or proposed.

### 3.4 Static/test-fixture `grantedPermissions` only (planning requirement 4)

`grantedPermissions` must be a **module-level constant array of string literals**, defined directly in `src/app.ts` (or, if the execution gate judges it cleaner, inline at the call site) — for example:

```ts
const STATIC_HARNESS_GRANTED_PERMISSIONS = Object.freeze([
  "harness.read",
  "harness.write"
]);
```

The exact literal values are an execution-gate decision (it may prefer to reuse a fixture already reviewed in `tests/permission-guard.test.ts`, e.g. `"workspace:read"`/`"workspace.products.read"`, or invent harness-local ones like the example above — both are acceptable, and this plan does not pre-decide between them). What this plan *does* fix, as a hard constraint any execution gate must honor, is the **source**: a literal, static, compile-time-constant array — never a database query, role-resolution call, environment variable, configuration file read, header-derived value, or any other runtime-sourced input. `requiredPermission` may vary per request (taken from the route param, as sketched in 3.3) precisely because varying it is what lets the harness demonstrate all three `evaluatePermissionGuard` decisions (`allowed`, `forbidden`, `not_found` via `non_disclosing` if exercised) against one fixed, known `grantedPermissions` set — but `grantedPermissions` itself must never vary by request, environment, or external state.

### 3.5 No external dependencies (planning requirement 5)

The proposed route must not, directly or transitively, introduce or invoke:
- a database, ORM, query layer, or any `pg`/SQL usage (the harness consumes only the static array in 3.4 and the already-gated `request.requestContext`)
- an auth provider (token verification, identity-provider calls, session lookups)
- a role resolver or any "where do `grantedPermissions` come from at runtime" service
- secrets or environment variables (`process.env` reads of any kind — the flag in 3.1 is a `buildApp` *option*, supplied by the caller/test harness in-process, not an environment variable; this mirrors exactly how `enableInternalHarnessRoutes` is supplied in `tests/request-context-plumbing.test.ts`'s `buildAppWithHarness({ enableInternalHarnessRoutes: true })`)
- external services, network calls, or file-system I/O of any kind

This is independently checkable against the existing precedent: `workspaceRouteHarnessHandler` (`src/app.ts:31–43`) and `evaluatePermissionGuard` (per PR #29 Section 5) both already satisfy an equivalent constraint, so the proposed route would be composing two already-reviewed, already-pure/already-minimal surfaces — not introducing a new category of dependency.

### 3.6 Proving wiring shape only — not protecting anything (planning requirements 1, 6, 7, 8)

The proposed route:
- is purely diagnostic and read-only — it performs no mutation, creates no state, and gates access to nothing;
- sits beside, and has zero effect on, every existing route (`/health`, `WORKSPACE_ROUTE_HARNESS_ROUTE`, the `setNotFoundHandler`/`setErrorHandler` paths) — it does not wrap, decorate, precede, or otherwise interpose itself in front of any of them;
- protects no real product route, because **no real product route exists in this repository** (independently re-confirmable: `grep -E -n "app\.(get|post|put|delete|patch)" src/app.ts` returns only `/health` and the one existing harness route) — there is structurally nothing for it to protect, and this plan does not propose creating anything for it to protect;
- cannot become broad or default-on enforcement, because (a) it is opt-in and defaults to `false` (3.1), (b) it is the *only* call site that would ever invoke `evaluatePermissionGuard` from runtime code, and (c) its result is *returned as diagnostic JSON*, never used to gate, redirect, short-circuit, or otherwise affect the handling of the very request that triggered it (or any other request). The decision is an **output to inspect**, not an **input to a gate**.

This satisfies planning requirement 8 precisely: the route proves only that the chain `requestContext -> evaluatePermissionGuard -> decision output` can be wired end-to-end inside a real Fastify handler — nothing about *using* that decision to protect anything is proposed, sketched, or implied.

---

## 4. Worked Examples (illustrative only — not authorized to build)

To make the "proves only the wiring shape" claim concrete and reviewable, three illustrative request/response pairs (using the fixture from 3.4 and a `requestContext` of `{ workspaceId: "workspace-123", actorId: "actor-456" }`, established by the existing `onRequest` gate exactly as it is today):

| Request | `evaluatePermissionGuard` decision | Illustrative harness JSON body |
|---|---|---|
| `GET /internal/permission-guard-harness/harness.read` | `allowed` (permission present in the static set) | `{ "ok": true, "decision": { "ok": true, "decision": "allowed", "requestContext": { "workspaceId": "workspace-123", "actorId": "actor-456" }, "requiredPermission": "harness.read" } }` |
| `GET /internal/permission-guard-harness/harness.delete` | `forbidden` (missing, default `disclosing` mode) | `{ "ok": true, "decision": { "ok": false, "decision": "forbidden", "statusCode": 403, "code": "FORBIDDEN", "message": "Forbidden.", "requiredPermission": "harness.delete" } }` |
| `GET /internal/permission-guard-harness/harness.delete` (request missing `x-nashir-workspace-id`/`x-nashir-actor-id`) | *(never reached — the existing `onRequest` gate returns the standard 401 `REQUEST_CONTEXT_REQUIRED` ErrorModel first, exactly as it does for `WORKSPACE_ROUTE_HARNESS_ROUTE` today)* | *(standard 401 ErrorModel body — unchanged from current behavior)* |

These are presented purely to demonstrate that the proposed shape can express all three `evaluatePermissionGuard` outcomes (`allowed`, `forbidden`, and — by supplying a `non_disclosing`-mode fixture variant, which an execution gate may or may not choose to add — `not_found`) through one static configuration and a varying route parameter, and that the existing 401/404/500 ErrorModel behaviors remain completely untouched and reachable exactly as before. **No part of this table is authorized to be built by this gate**; it exists solely so a reviewer of this plan can evaluate the proposal concretely rather than in the abstract.

---

## 5. ErrorModel HTTP Response Mapping — Explicitly Out of Scope (planning requirement 9)

PR #29 Section 7 found, as a *structural* matter, that `PermissionGuardForbiddenResult`/`PermissionGuardNotFoundResult` line up field-for-field with `CreateErrorModelInput` (`{ code, message, statusCode, correlationId?, details? }`) and could in principle be mapped through `createHttpErrorResponse` with no change to either module. PR #29 Section 9 was equally explicit that this finding does **not** authorize actually performing that mapping — it remains "a separate, later, explicitly-authorized step."

This plan adopts that position without modification or expansion: **mapping `evaluatePermissionGuard` decisions into live HTTP `ErrorModel` responses (i.e., having the harness — or anything else — actually `reply.code(decision.statusCode).send(createHttpErrorResponse(...))` based on a `forbidden`/`not_found` decision) is out of scope for this planning gate, and remains out of scope for the execution gate this plan recommends, unless a separate, explicitly-scoped authorization gate is opened for it first.**

Concretely, this means the proposed harness route (Section 3) must:
- always respond `200 OK` with a diagnostic JSON body that *describes* the decision (as in the worked examples in Section 4), regardless of whether that decision is `allowed`, `forbidden`, or `not_found`;
- never translate a `forbidden`/`not_found` decision into an actual `403`/`404` HTTP response;
- never call `createHttpErrorResponse`, `createErrorModel`, or any function from `src/error-model.ts`.

This keeps the harness unambiguously diagnostic — a window onto the primitive's behavior — rather than an enforcement surface wearing a diagnostic label. It also avoids a subtle trap: if the harness *did* emit real `403`/`404` HTTP statuses from a static-fixture decision, a future reader could mistake that for evidence that permission enforcement is "basically already wired up," when in fact only one hardcoded, opt-in, diagnostic code path would exist. Keeping the response uniformly `200` with a descriptive body makes the diagnostic-only nature of the route impossible to mistake for enforcement — directly addressing the "false sense of authorization" risk in Section 7.

---

## 6. Relationship to the Existing Harness Pattern

| Aspect | `WORKSPACE_ROUTE_HARNESS_ROUTE` (PR #27, merged) | Proposed `PERMISSION_GUARD_HARNESS_ROUTE` (this plan) |
|---|---|---|
| Opt-in flag | `enableInternalHarnessRoutes?: boolean`, default `false` | `enableInternalPermissionGuardHarnessRoutes?: boolean`, default `false` — independent, not aliased |
| Route shape | `GET /internal/workspace-route-harness/:workspaceId` | `GET /internal/permission-guard-harness/:requiredPermission` |
| Gated by existing `onRequest` plumbing | Yes — relies entirely on it, adds no auth logic of its own | Yes — identical reliance, no new gating logic |
| Data source | Echoes `request.requestContext`/`request.correlationId`/route params only | Echoes the same, *plus* a static, module-level `grantedPermissions` fixture (Section 3.4) — no new runtime data source |
| Mutates state / calls external systems | No | No |
| HTTP status of its own response | Always `200` (diagnostic echo) | Always `200` (diagnostic echo of a decision — Section 5) |
| Registered location | Inside `buildApp`, gated by its own `if` | Proposed: inside `buildApp`, gated by its own independent `if`, placed alongside (Section 3.2) |

The proposed route is, by design, structurally homologous to the one precedent this repository already has for exactly this kind of diagnostic — it introduces no new pattern, only a second instance of an already-accepted one, composed with an already-reviewed pure primitive.

---

## 7. Planning Requirements Traceability

| # | Planning requirement | Where addressed |
|---|---|---|
| 1 | Plan only a narrow, opt-in internal permission guard harness route | Section 3 (one route, one handler, one flag — nothing else proposed) |
| 2 | The proposed route must be disabled by default | Section 3.1 (`enableInternalPermissionGuardHarnessRoutes` defaults to `false`) |
| 3 | Propose an opt-in flag similar to `enableInternalPermissionGuardHarnessRoutes?: boolean`, default `false` | Section 3.1 (adopted verbatim, mirroring `enableInternalHarnessRoutes`) |
| 4 | The route must use only static/test-fixture `grantedPermissions` | Section 3.4 (module-level frozen string-literal array; `requiredPermission` may vary per request, `grantedPermissions` never does) |
| 5 | The route must not use a database, auth provider, role resolver, secrets, environment variables, or external services | Section 3.5 (each category enumerated and explicitly excluded, cross-checked against existing pure precedents) |
| 6 | The route must not protect real product routes | Section 3.6 (no product routes exist to protect; route does not interpose on any existing route) |
| 7 | The route must not become broad/default-on runtime enforcement | Section 3.6 (opt-in + sole call site + decision is output-only, never gates anything) |
| 8 | The route should prove only the wiring shape `requestContext -> evaluatePermissionGuard -> decision output` | Section 3.3 (handler sketch does exactly this and nothing more), Section 3.6 (explicit "proves only" framing) |
| 9 | Clarify whether `ErrorModel` HTTP response mapping is in/out of scope | Section 5 (explicitly **out of scope**, with concrete behavioral constraints — always `200`, never calls `error-model.ts`) |
| 10 | Carry forward all non-authorization boundaries from PR #29 Section 9 | Section 9 below (verbatim, with the harness-specific items folded in) |
| 11 | Risks: premature wiring, false sense of authorization, `ErrorCode` mismatch, permission-source ambiguity, accidental exposure | Section 8 |
| 12 | GO/NO-GO decision | Section 10 |
| 13 | Recommended next gate (if GO): execution gate for one route only | Section 11 |

---

## 8. Risk Review

| Risk | Finding | Control proposed by this plan |
|---|---|---|
| **Premature runtime wiring** | A future reader (or this plan's own author, mid-execution) could be tempted to "just also" wire `evaluatePermissionGuard` into the existing `onRequest` hook, `WORKSPACE_ROUTE_HARNESS_ROUTE`, or some other real path while building the harness — since the primitive is right there and "it would only take one more line" | This plan proposes exactly **one** call site for `evaluatePermissionGuard` (the new harness handler, Section 3.3) and states explicitly that it must be the *only* one (Section 3.6); Section 9 carries forward the prohibition on "wiring `permission-guard` ... into `src/app.ts`'s `onRequest` hook, route handlers, `setNotFoundHandler`, or `setErrorHandler`" for every path other than this one narrow, diagnostic, opt-in route |
| **False sense of authorization** | Seeing a working, end-to-end `requestContext -> evaluatePermissionGuard -> decision` route in `main` could lead a future contributor (or reviewer) to believe permission enforcement is "basically done" or that extending the harness into real enforcement is a small, already-cleared step | Section 5 mandates the harness always return `200` with a *descriptive* body — never a real `403`/`404` derived from the decision — so its diagnostic nature cannot be mistaken for enforcement by inspecting its behavior; Section 9 restates, verbatim, that this gate (and the execution gate it would authorize) confer no authorization for broad enforcement, product routes, or ErrorModel-mapping; the recommended next gate (Section 11) is scoped to "one internal opt-in diagnostic route" by name, foreclosing scope creep at the authorization level, not just the documentation level |
| **`ErrorCode` authority mismatch** | PR #29 Section 7 independently confirmed that `FORBIDDEN`/`NOT_FOUND` (the `code` values `evaluatePermissionGuard` emits) do not match the authority's closed, `lower.snake_case`, dot-namespaced `ErrorCode` enum (whose closest analogues are `permission.denied`/`resource.not_found`/`workspace.not_found`) — a carried pattern matching the pre-existing `REQUEST_CONTEXT_REQUIRED` divergence | This plan does not attempt to resolve, paper over, or even surface that mismatch through the harness: because the harness never emits real HTTP `ErrorModel` responses (Section 5), the mismatched codes would appear *only* inside a `200`-wrapped diagnostic JSON body — clearly labeled as an internal decision snapshot, not as a claim of authority-conformant API behavior. The mismatch remains exactly what PR #29 found it to be: a documented, deferred, cross-repository concern, untouched by this plan or its proposed route |
| **Permission-source ambiguity** | `evaluatePermissionGuard` is, by design (per PR #29 Section 9), agnostic about *where* `grantedPermissions` comes from — it only consumes an array. A harness that makes this look "wired up" could obscure the fact that **no system in this repository produces a real `grantedPermissions` value** (no role storage, no grant resolver, no auth provider) | Section 3.4 mandates the source be a **module-level, frozen, compile-time-constant string-literal array** — and Section 3.6 states plainly that this route is "the only call site that would ever invoke `evaluatePermissionGuard` from runtime code." The worked examples (Section 4) make the fixed, static nature of the input visually explicit (the same array, `STATIC_HARNESS_GRANTED_PERMISSIONS`, appears in every row), so a reader cannot mistake the harness for evidence that a real permission-source exists or is planned by this gate |
| **Accidental harness exposure** | Either harness route (`WORKSPACE_ROUTE_HARNESS_ROUTE` or this proposed one) being registered by default, or the two opt-in flags being merged/aliased, could expose internal diagnostics in normal runtime use | Section 3.1 mandates the new flag default to `false` and remain **independent** of `enableInternalHarnessRoutes` — enabling one harness must never enable the other. This mirrors the already-merged, already-tested fix for exactly this risk class on `WORKSPACE_ROUTE_HARNESS_ROUTE` (the "Fix the internal workspace route harness exposure risk" task that produced the `enableInternalHarnessRoutes` opt-in, including its own "is not registered by default" test) — the execution gate this plan recommends should include an equivalent default-disabled test for the new route and flag from the outset, rather than as a follow-up fix |

---

## 9. Explicit Non-Authorization Boundary (carried forward from PR #29 Section 9, verbatim, plus harness-specific clarifications)

This planning gate does not authorize, and must NOT be read as approving, any of the following:

- wiring `permission-guard` (or any permission decision logic) into `src/app.ts`'s `onRequest` hook, route handlers, `setNotFoundHandler`, or `setErrorHandler` — **other than the single, narrow, opt-in, diagnostic route this plan describes**, and even that route only once a separate execution gate explicitly authorizes building it
- broad or default-on runtime permission enforcement across any existing or future route
- product routes of any kind (workspace/campaign/content/product/asset APIs, etc.)
- an auth provider implementation (token issuance, session/credential verification, identity-provider integration)
- a role or permission inventory / role database / grant-resolution service (i.e., any system that *produces* `grantedPermissions` — Section 8 "permission-source ambiguity" confirms none exists, and this plan does not propose creating one)
- DB, SQL, migrations, ORM, or query-layer work of any kind
- generated clients
- OpenAPI or other contract-document changes (including any change that would declare `FORBIDDEN`/`NOT_FOUND` as authority-conformant codes, or attempt to resolve the `ErrorCode` mismatch unilaterally)
- secrets or environment-variable configuration
- mapping permission-guard failure results into live `ErrorModel` HTTP responses (Section 5 of this gate restates and sharpens this: the proposed harness must always respond `200` with a descriptive body, never a real `403`/`404`)
- CI workflow changes
- deployment, pilot readiness, or production readiness of any kind
- **any second harness route, variant, or extension beyond the single route this plan describes** (a harness-specific addition: this plan is scoped to exactly one route, and "while we're here" additions are exactly the kind of scope creep Section 8's "premature runtime wiring" and "false sense of authorization" risks describe)
- **actually writing, editing, or scaffolding any of the code sketched in Sections 3–4** (those sketches are illustrative inputs for review, not authorized changes — this gate adds only the present documentation file)

Each of these remains forbidden exactly as PR #29 left it; this gate changes none of these positions, and narrows rather than widens the path forward.

---

## 10. GO / NO-GO Decision

**Decision: GO** to a **Backend Slice 0 Permission Guard Internal Runtime Harness Execution Gate — scoped to exactly one internal, opt-in diagnostic route** — because:

- the proposed route and flag are a direct, minimal-delta mirror of an already-accepted, already-merged, already-tested precedent (PR #27's `WORKSPACE_ROUTE_HARNESS_ROUTE` / `enableInternalHarnessRoutes`, including its opt-in-by-default-disabled fix), reducing this to a well-understood composition rather than a novel design;
- the primitive it would exercise (`evaluatePermissionGuard`) was independently re-verified pure, side-effect-free, and safe to call from arbitrary contexts by PR #29 (all twelve of that gate's review criteria passed);
- every one of the twelve planning requirements in the originating task is concretely addressed (Section 7 traceability table) with specific types, constraints, and behavioral guarantees — not vague intentions;
- the proposal contains hard, checkable constraints that prevent it from drifting into enforcement: a static-fixture-only data source (3.4), a single sanctioned call site (3.6), an always-`200` diagnostic response contract that never touches `error-model.ts` (Section 5), and an independent, default-`false` opt-in flag (3.1); and
- every risk this gate was asked to consider (Section 11 of the originating task) has a concrete, plan-level control (Section 8), not merely an acknowledgment.

**NO-GO** for, at this time and on the strength of this gate alone:
- actually writing, editing, or scaffolding any source or test code (including the illustrative sketches in Sections 3–4 of this plan)
- any second harness route or any extension beyond the single route this plan describes
- mapping permission-guard decisions into live `ErrorModel` HTTP responses
- broad or default-on runtime permission enforcement, product routes, an auth provider, role storage, DB/SQL/ORM, generated clients, OpenAPI changes, secrets/environment configuration, CI workflow changes, deployment, pilot readiness, or production readiness

This gate authorizes no source-code change of any kind. It authorizes only the opening of the execution gate named in Section 11 — and that gate, per the constraints this plan establishes, may build *exactly* the one route described here, nothing wider, and must still pass its own review/acceptance step before merge (mirroring the PR #27 → harness-exposure-fix → PR #29-style review cadence already established for this family of changes).

---

## 11. Recommended Next Step

**Backend Slice 0 Permission Guard Internal Runtime Harness Execution Gate** — scoped, by name and by the constraints in Sections 3–9 of this plan, to implementing **exactly one** internal, opt-in, disabled-by-default diagnostic route:

```
GET /internal/permission-guard-harness/:requiredPermission
```

gated by a new, independent `enableInternalPermissionGuardHarnessRoutes?: boolean` flag (default `false`) on `BuildAppOptions`, calling `evaluatePermissionGuard` exactly once with a static, module-level `grantedPermissions` fixture and the already-gated `request.requestContext`, and always responding `200` with a diagnostic JSON body describing the resulting decision — never a real `403`/`404` `ErrorModel` response.

That execution gate must:
- implement only the route, flag, handler, and fixture described in Sections 3–5 of this plan (no broader scope, no second route, no `ErrorModel`-mapping);
- add tests mirroring the existing `WORKSPACE_ROUTE_HARNESS_ROUTE` suite, **including** a "disabled by default — falls through to the existing 404 ErrorModel behavior" test from the start (per Section 8's "accidental harness exposure" control — learned from, not repeating, the follow-up fix that PR #27's route required);
- carry forward, verbatim, this gate's Section 9 non-authorization boundary into its own scope statement; and
- itself recommend GO only to a further documentation-only review/acceptance gate (mirroring PR #29's role for PR #28) before any such code is merged to `main` — not to broad enforcement, product routes, or any of the categories enumerated in Section 9.

Do not open a broad permission-enforcement, product-route, auth-provider, role-storage, database, generated-client, OpenAPI-alignment, `ErrorModel`-mapping, or multi-route harness *implementation* gate from this plan. Each remains forbidden (Section 9) until its own, separately-scoped authorization sequence exists.

---

## 12. Verification Commands

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

# Confirm the precedent this plan mirrors is exactly as described
grep -nE "enableInternalHarnessRoutes|BuildAppOptions|WORKSPACE_ROUTE_HARNESS_ROUTE|workspaceRouteHarnessHandler" src/app.ts

# Confirm no product routes exist to "protect" (planning requirement 6 / Section 3.6)
grep -E -n "app\.(get|post|put|delete|patch)" src/app.ts

# Confirm evaluatePermissionGuard remains unwired (no premature integration has occurred)
grep -rn "permission-guard|evaluatePermissionGuard|PermissionGuard" src/app.ts src/index.ts

# Confirm error-model.ts is not referenced from permission-guard.ts (mapping remains unimplemented)
grep -n "error-model" src/permission-guard.ts
```
