# Nashir Backend Slice 0 Next Boundary Planning Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only planning gate |
| Basis | Accepted Backend Slice 0 minimal request-context implementation (PR #16, reviewed by PR #17, accepted by PR #18) |
| PR #16 merge commit | `80ac642f3e8e7e9b214a2fe1038fa7c3b835627b` |
| PR #17 merge commit | `a8746e65a7a25a923b37b765820155bde82546a8` |
| PR #18 merge commit | `138ecf0` (HEAD of `main` at time of writing) |
| Authority repository | `henter36/nashir` |
| Authority commit recorded from main | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation of any kind |

---

## 1. Scope

This gate identifies and recommends the next safe Backend Slice 0 boundary to plan, now that the minimal request-context implementation has been:

- **implemented** (PR #16, merge commit `80ac642f3e8e7e9b214a2fe1038fa7c3b835627b`),
- **reviewed** (PR #17, merge commit `a8746e65a7a25a923b37b765820155bde82546a8`), and
- **accepted** (PR #18, merge commit `138ecf0`).

It evaluates six candidate next-boundary options against a common risk/sequencing matrix, recommends the safest one to plan next, and explicitly defers the rest. It does **not** plan the implementation details of any option — it only identifies which boundary should be the subject of the *next planning gate*.

This is a documentation-only planning gate. It does not modify `src/app.ts`, `src/request-context.ts`, any test file, CI configuration, or any other backend source file. It adds only this planning document, and it authorizes no implementation — not of the recommended option, not of any deferred option, and not of the accepted Slice 0 baseline's internals.

---

## 2. Inputs Reviewed

| Input | Use in this planning gate |
|---|---|
| `henter36/nashir-backend` PR #16 (merge commit `80ac642f3e8e7e9b214a2fe1038fa7c3b835627b`) | Defines the accepted implementation baseline (Section 4) whose boundary this gate plans beyond |
| `henter36/nashir-backend` PR #17 (merge commit `a8746e65a7a25a923b37b765820155bde82546a8`) | Independent execution review confirming the baseline's boundary compliance and surfacing the still-open `qlty check` residual finding referenced in Section 8 |
| `henter36/nashir-backend` PR #18 (merge commit `138ecf0`) | Acceptance gate confirming the baseline is complete and accepted, and recommending this gate as the next step |
| `docs/nashir_backend_slice_0_minimal_implementation_execution_review_gate.md` (added by PR #17) | Source of the accepted boundary's verified scope and the carried-forward residual quality-gate finding |
| `docs/nashir_backend_slice_0_minimal_implementation_execution_acceptance_gate.md` (added by PR #18) | Source of the formally accepted file set, acceptance matrix, and residual risk review that this gate's "current accepted baseline" (Section 4) is drawn from |
| `src/app.ts`, `src/request-context.ts` (current `main` HEAD, post-acceptance) | Re-confirms the single `/health` route, the `onRequest` hook, the `routeOptions?.url` bypass, the `401 REQUEST_CONTEXT_REQUIRED` error shape, and header-inspection-only logic — the concrete surface this gate plans beyond |
| `tests/request-context-plumbing.test.ts`, `tests/request-context.test.ts`, `tests/health.test.ts` (current `main` HEAD) | Confirms the existing test surface (31 tests total) that any next-boundary plan would need to extend without disturbing |
| Local re-run of `npm run lint`, `npm run typecheck`, `npm test`, `validate:contracts` on current `main` HEAD | Confirms the accepted baseline still lints clean, typechecks clean, passes all 31 tests, and the authority reference remains current — i.e., there is no outstanding breakage that the next boundary would need to absorb or work around |

---

## 3. Current Accepted Baseline

As accepted by PR #18 (merge commit `138ecf0`), the Backend Slice 0 minimal implementation provides exactly:

| Capability | Concrete surface on `main` HEAD |
|---|---|
| Request-context plumbing | A single Fastify `onRequest` hook in `src/app.ts` (`app.addHook("onRequest", ...)`, line 48) that runs before body parsing |
| Correlation/request-id handling | `resolveCorrelationId` reads `x-nashir-correlation-id`, trims it, and falls back to `randomUUID()`; the resolved id is attached to `request.correlationId` and echoed in every error response |
| Workspace-id / actor-id header inspection only | `resolveRequestContextFromHeaders` / `inspectHeader` in `src/request-context.ts` return structural `"present" \| "missing" \| "blank"` results for `x-nashir-workspace-id` / `x-nashir-actor-id` — no authorization decision is made |
| Consistent request-context error response shape | Every rejection replies `401 { error: "REQUEST_CONTEXT_REQUIRED", message, correlationId }` |
| `/health` explicitly excluded/ungated | The hook returns immediately when `request.routeOptions?.url === HEALTH_ROUTE` (`src/app.ts` line 49), confirmed by `grep -E -n "app\.(get\|post\|put\|delete\|patch)" src/app.ts` returning exactly one route registration |
| Narrowly scoped tests | 31 tests total across `tests/health.test.ts` (1), `tests/request-context.test.ts` (17), `tests/request-context-plumbing.test.ts` (13) — all scoped to `/health` preservation, correlation/context resolution, and gated-route plumbing on a private test harness route |

**What does not yet exist** (and is therefore in scope to be *planned*, not implemented, next): any product route, any business API, any auth/RBAC decision logic, any database/SQL/ORM layer, any generated client, and any CI workflow beyond the existing `Validate backend` / `SonarCloud` / `qlty check` / `CodeRabbit` checks.

**Carried-forward residual finding:** PR #17's review and PR #18's acceptance both record that the `qlty check` GitHub status reported `state: success` while its own description read `"2 blocking issues"` on the final pre-merge commit of PR #16 (`9624f0ff90dcf671fd9827256e88f52917d5ba3e`) — never investigated or dispositioned. This gate does not resolve that finding; it is noted in Section 8 as background context that should be closed out by the previously recommended follow-up gate independent of whichever next boundary is planned.

---

## 4. Candidate Next Boundaries

Six candidate boundaries were evaluated as the subject of the *next planning gate*:

1. **Error Model / Response Contract Hardening** — formalize and harden the shared error/response envelope (status codes, error codes, message/correlation-id shape, validation-error shape, not-found/method-not-allowed shape, content negotiation) that any future route would need to rely on consistently, building directly on the `401 REQUEST_CONTEXT_REQUIRED` shape already established by the accepted baseline.
2. **Request Context Typing & Test Harness Consolidation** — strengthen the `RequestContext` / `FastifyRequest` augmentation typings, consolidate the test-harness patterns (`buildAppWithHarness`, `injectAndParse`, `expectHealthyBody`, `expectRequestContextRequired`) introduced across `tests/request-context-plumbing.test.ts` into shared, reusable test infrastructure for future suites.
3. **Auth/RBAC/Workspace Identity Implementation Planning** — plan how the currently inspection-only `workspaceId`/`actorId` values would be turned into actual authorization decisions (roles, scopes, workspace membership, permission checks).
4. **Product Route Planning** — plan the first real business route(s) (e.g., workspace, campaign, content, or product resources) that would consume the request context.
5. **Database/SQL/ORM Planning** — plan how persistence (schema, migrations, ORM/query layer, connection/config, secrets) would be introduced to back any future product route.
6. **CI / Generated Client Planning** — plan changes to CI workflows and/or the introduction of generated API clients (e.g., from an OpenAPI contract) to support future consumers.

---

## 5. Option Comparison Matrix

Each option is assessed on: implementation risk, contract drift risk, security risk, dependency risk, reversibility, sequencing value, and whether it touches product routes, auth/RBAC, DB/SQL/ORM, or generated clients/CI.

| Option | Implementation risk | Contract drift risk | Security risk | Dependency risk | Reversibility | Sequencing value | Touches product routes? | Touches auth/RBAC? | Touches DB/SQL/ORM? | Touches generated clients/CI? |
|---|---|---|---|---|---|---|---|---|---|---|
| 1. Error Model / Response Contract Hardening | **Low** — extends the existing, already-accepted `401 REQUEST_CONTEXT_REQUIRED` shape and Fastify error-handling hooks; no new subsystem | **Lowest of all options — actively reduces drift** by formalizing the shape every future route must follow before any route exists to drift from it | **None** — purely shapes error/response envelopes; makes no authorization decisions | **None** — uses only Fastify's existing error-handling primitives (`setErrorHandler`, `setNotFoundHandler`), already a runtime dependency | **High** — a response-shape convention is easy to amend or extend later without breaking working code, since no consumer yet depends on it | **Highest** — every later option (product routes, auth, generated clients) depends on a stable, consistent error/response contract to avoid rework | No | No | No | No |
| 2. Request Context Typing & Test Harness Consolidation | **Low** — refactors existing typings/test helpers already merged in PR #16; no new runtime surface | **Low** — internal typing/test consolidation does not change any externally observable contract | **None** | **None** — no new packages; pure internal refactor of existing code and test utilities | **High** — internal refactor, fully reversible, covered by the existing 31-test suite | **Moderate** — valuable groundwork for future suites, but does not unblock any externally visible capability the way Option 1 does | No | No | No | No |
| 3. Auth/RBAC/Workspace Identity Implementation Planning | **Moderate** (as a planning exercise); **high** once implemented | **Moderate** — authorization semantics are easy to get wrong in ways that ripple into every route's contract | **Highest of all options** — directly concerns who can do what; mistakes here are security incidents, not bugs | **Possible** — may require new libraries (JWT/session/policy engines) | **Low once implemented** — security/identity decisions are costly to change after routes depend on them | **High in the abstract**, but premature now — planning authorization before there is a stable error contract or any route to protect risks redoing the plan once those exist | No (planning only; would precede routes) | **Yes — this is its entire subject** | Possibly (identity/session storage) | Possibly (token/JWT libraries) |
| 4. Product Route Planning | **Moderate** (planning); **high** once implemented | **High if planned now** — without a hardened error contract, each new route risks inventing its own response/error conventions, producing exactly the drift this gate is meant to avoid | **Moderate-to-high** — product routes typically require authorization, which does not yet exist | **Likely** — product logic commonly pulls in validation/serialization libraries | **Low once implemented** — public route shapes are costly to change after consumers exist | **High in the abstract, but sequenced too early** — planning routes before the error contract is hardened or auth exists invites rework | **Yes — this is its entire subject** | Likely (routes typically need authorization) | Likely (routes typically need persistence) | Possibly (clients generated from new routes) |
| 5. Database/SQL/ORM Planning | **Moderate** (planning); **high** once implemented | **Low directly**, but introduces a new subsystem whose conventions must align with the (not-yet-hardened) error contract for failure modes (e.g., not-found, conflict, validation) | **Moderate** — persistence raises secrets/connection-config concerns even before any data model exists | **High** — introduces ORM/driver/migration-tooling dependencies, the largest dependency-surface change of any option | **Lowest of all options** — schemas, migrations, and persisted data are the hardest artifacts to walk back once real | **Low right now** — there is no route or data model yet to persist; planning this first would produce a schema with no consumer | No directly | No directly | **Yes — this is its entire subject** | No |
| 6. CI / Generated Client Planning | **Low-to-moderate** (planning) | **High if generated now** — a generated client locks in today's (minimal, request-context-only) API shape; regenerating after the error contract or routes change would immediately invalidate it | **Low** | **Moderate-to-high** — generator tooling and CI changes are themselves new dependencies/workflow surface | **Moderate** — CI changes are reversible but generated-client churn creates noisy, hard-to-review diffs if done too early | **Lowest right now** — there is effectively nothing stable yet to generate a client from or to wire additional CI around | Indirectly (clients are generated from route contracts) | No | No | **Yes — this is its entire subject (CI + generated clients)** |

---

## 6. Recommended Next Boundary

**Recommended: Error Model / Response Contract Hardening** — to be planned in a dedicated `docs/nashir_backend_slice_0_error_model_response_contract_planning_gate.md`.

Rationale, drawn directly from the matrix in Section 5:

- It is the **only** option that scores **Low** on every risk dimension (implementation, contract drift, security, dependency) **and High** on both reversibility and sequencing value — no other candidate achieves that combination.
- The accepted baseline (Section 3) already established one concrete error shape (`401 REQUEST_CONTEXT_REQUIRED`) and a correlation-id convention. Hardening the *general* error/response envelope is a direct, minimal-risk extension of work already reviewed and accepted — not a new subsystem.
- **Sequencing logic:** every other candidate (product routes, auth/RBAC, generated clients) either *produces* responses that need a stable shape to be consistent, or *consumes* a contract that needs to be stable to avoid being regenerated/rewritten. Hardening the error/response contract now is the one move that **reduces** risk for every option that follows it, rather than deferring or relocating risk:
  - Product routes built against a hardened contract won't invent ad hoc response shapes (avoiding the "high contract drift risk" flagged for Option 4 if planned first).
  - Auth/RBAC failure responses (`403`, `401` variants) can reuse the same hardened envelope instead of being designed in isolation.
  - A generated client built later would generate against a *stable* contract instead of one that is likely to change shape as soon as routes and auth are added (avoiding the regenerate-and-invalidate risk flagged for Option 6).
- It touches **no** product routes, **no** auth/RBAC, **no** DB/SQL/ORM, and **no** generated clients/CI — keeping this next planning step inside the same low-risk, easily-reversible category as the accepted baseline itself.

---

## 7. Deferred Boundaries

The following candidates are **not** recommended to be planned next. Each is deferred for the reason shown, drawn from Section 5:

| Deferred option | Why it is deferred now |
|---|---|
| Request Context Typing & Test Harness Consolidation | Lower sequencing value than Option 1 — it strengthens internal infrastructure but does not establish the externally-visible contract that every subsequent boundary depends on. Worth planning, but after the contract that the harness will need to assert against is itself hardened. |
| Auth/RBAC/Workspace Identity Implementation Planning | Highest security risk of any option, and lowest reversibility once implemented. Planning authorization decisions before there is a stable error contract (to express `401`/`403` consistently) or any route to protect risks having to redo the authorization plan once those exist. Requires its own dedicated planning gate that explicitly addresses security and persistence risk, as called out in the task's reasoning. |
| Product Route Planning | Planning routes before the error/response contract is hardened would let each route invent its own conventions — the exact contract-drift outcome Option 1 is meant to prevent. Also presumes auth/RBAC and (likely) persistence, neither of which exists yet. |
| Database/SQL/ORM Planning | Lowest reversibility of all options (schemas and migrations are the hardest artifacts to walk back) and lowest sequencing value right now (there is no route or data model yet to persist). Also introduces the largest dependency surface of any option. Requires its own dedicated planning gate that explicitly addresses persistence risk, as called out in the task's reasoning. |
| CI / Generated Client Planning | Lowest sequencing value of all options today — there is effectively nothing stable yet to generate a client from. A client generated against today's minimal, request-context-only surface would almost certainly need regeneration as soon as the error contract, routes, or auth are added, producing churn rather than value. Should wait until API behavior and error shapes are stable, per the task's reasoning. |

---

## 8. Risk Review

| Risk | Finding | Control |
|---|---|---|
| Sequencing-error risk | Planning a higher-risk, lower-reversibility boundary (auth/RBAC, DB/SQL, product routes, generated clients) before the error/response contract is hardened could force rework once that contract is later formalized | Controlled by this gate's recommendation (Section 6): plan the contract-hardening boundary first, explicitly deferring the higher-risk options (Section 7) until it is in place |
| Scope-creep / premature-authorization risk | A reader could mistake this planning gate's *recommendation* of Error Model / Response Contract Hardening as *authorization* to begin implementing it | Section 9 (Explicit Non-Authorization Boundary) and Section 10 (GO/NO-GO Decision) state explicitly that no implementation of any kind — including the recommended option — is authorized by this gate; only a further planning gate is |
| Carried-forward quality-gate residual finding | PR #17 and PR #18 both record that `qlty check` reported `state: success` while its description showed `"2 blocking issues"` on PR #16's final pre-merge commit, never investigated or dispositioned (Section 3) | This gate does not attempt to resolve it — it remains the subject of the previously recommended `docs/nashir_backend_slice_0_minimal_implementation_execution_follow_up_gate.md`, independent of and prior to (or in parallel with) whichever next boundary is planned |
| Baseline-regression risk | A future plan could implicitly assume capabilities (auth, persistence, product routes) that do not yet exist on `main` | Controlled by Section 3 (Current Accepted Baseline), which states precisely what exists today — re-verified via `grep` for routes/hooks and a clean local run of lint, typecheck, all 31 tests, and contract validation on current `main` HEAD — and precisely what does not yet exist |

---

## 9. Explicit Non-Authorization Boundary

This documentation-only planning gate does not authorize, and must NOT be read as approving:

- new backend implementation
- product routes
- workspace/campaign/content/product APIs
- auth/RBAC enforcement
- DB, SQL, migrations, ORM, database config
- secrets/environment config
- generated clients
- CI workflows
- runtime dependencies
- provider/model calls
- prompt execution
- agent/tool execution
- connector execution
- publishing
- deployment
- production readiness
- pilot readiness

---

## 10. GO / NO-GO Decision

**Decision: GO** to a **Backend Slice 0 Error Model / Response Contract Hardening Planning Gate** — the option identified in Section 6 as the safest, highest-sequencing-value next boundary, scoring Low on every risk dimension assessed in Section 5 while touching no product routes, auth/RBAC, DB/SQL/ORM, or generated clients/CI.

**NO-GO** for:
- direct implementation of any kind, including the recommended option;
- product routes;
- auth/RBAC implementation;
- DB, SQL, migrations, ORM, or database config;
- generated clients;
- CI workflow changes; and
- provider/model calls, prompt execution, tool execution, connector execution, publishing, deployment, production readiness, or pilot readiness.

This gate authorizes no source-code change of any kind. It authorizes only the opening of a further planning gate for the recommended boundary (Section 11).

---

## 11. Recommended Next Step

**`docs/nashir_backend_slice_0_error_model_response_contract_planning_gate.md`** — Backend Slice 0 Error Model / Response Contract Hardening Planning Gate

That gate should plan (without implementing) how to formalize and harden the shared error/response envelope — building on the `401 REQUEST_CONTEXT_REQUIRED` shape and correlation-id convention already accepted in PR #18 — so that every later boundary (Request Context Typing & Test Harness Consolidation, Auth/RBAC/Workspace Identity, Product Routes, Database/SQL/ORM, and CI/Generated Clients, all deferred in Section 7) can build on a stable, drift-resistant contract rather than inventing its own conventions.

Do not open a product-route, auth/RBAC, database, generated-client, or CI-workflow planning or implementation gate directly from this gate. Each of those remains explicitly deferred (Section 7) until the error/response contract is hardened.

---

## 12. Verification Commands

```bash
cd ~/workspace/nashir-backend

git checkout main
git pull origin main

git status --short
git log --oneline -8

npm run lint
npm run typecheck
npm test
NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts

grep -E -n "app\.(get|post|put|delete|patch)" src/app.ts
grep -n "addHook|onRequest|/health|routeOptions|correlationId" src/app.ts src/request-context.ts
```
