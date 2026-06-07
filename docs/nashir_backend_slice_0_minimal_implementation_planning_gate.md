# Nashir Backend Slice 0 Minimal Implementation Planning Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only planning gate |
| Purpose | Plan the smallest safe Backend Slice 0 implementation boundary that may be considered after this gate is reviewed and explicitly approved |
| Authority repository | `henter36/nashir` |
| Pinned authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only planning and does not authorize implementation |

---

## 1. Scope

This gate plans — but does not authorize, scaffold, or write — the smallest safe implementation slice that Backend Slice 0 could take after `/health`. It answers, in planning form only:

1. What is the smallest safe implementation boundary after `/health`?
2. What files may be touched in a later implementation gate?
3. What files remain forbidden?
4. What validation must pass before and after the future implementation?
5. What explicit user decision is still required before implementation?

This gate carries forward the validation-only posture confirmed by PR #7–#11 and the readiness decision recorded by PR #10 (GO to a planning gate only, NO-GO to direct implementation). It produces planning text and decision tables only — no code, route, schema, dependency, or configuration change.

---

## 2. Inputs Reviewed

| Input | Use in this review |
|---|---|
| `docs/nashir_backend_slice_0_contract_validation_execution_review_gate.md` (PR #8) | Confirms PR #7's merged validation execution stayed local/read-only with PASS on all 12 checkpoints |
| `docs/nashir_backend_slice_0_infrastructure_validation_review_gate.md` (PR #9) | Confirms the cumulative infrastructure posture after PR #7–#8 remained validation-only with PASS on all 9 checkpoints |
| `docs/nashir_backend_slice_0_implementation_readiness_decision_gate.md` (PR #10) | Recorded decision: GO to a minimal implementation **planning** gate only; NO-GO for direct implementation; recommended this gate by name |
| `docs/nashir_backend_slice_0_contract_validation_cleanup_authority_pin_gate.md` (PR #11) | Explicitly adopted `04f54f8be852001173f4014cb2d81c5cdb97e35c` as the pinned `henter36/nashir` authority commit and confirmed the validation posture needed no script changes |
| `src/app.ts` | Confirms the only registered route is `app.get("/health", ...)` returning `{ status, service, runtime, uptimeSeconds }` |
| `src/index.ts` | Confirms the process entry point only builds and starts the Fastify app; no route or service wiring beyond `buildApp` |
| `src/request-context.ts` | Confirms a header-resolution module exists (`resolveRequestContextFromHeaders`, `requireRequestContext`, `WORKSPACE_ID_HEADER`, `ACTOR_ID_HEADER`) that is fully implemented and tested but **not wired into any route** |
| `tests/health.test.ts`, `tests/request-context.test.ts` | Confirm existing test coverage patterns (Vitest, Fastify `inject`) that a future minimal slice would need to extend, not replace |
| `package.json` | Confirms `lint`, `typecheck`, `test`, `validate:contracts`, `validate:contract-authority` scripts and the unchanged `dependencies` (`fastify`, `pg`, `zod`) |
| Current `main` branch state | Confirms a clean working tree at commit `aae6961` (PR #11 merge), with `npm run lint` and `NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts` both passing |

---

## 3. Current Verified Baseline

| Fact | Status |
|---|---|
| `main` working tree | Clean (`git status --short` empty) |
| Latest merged gate | PR #11 — `docs/scripts: pin authority commit and clean contract validation` (merge commit `aae6961`) |
| `npm run lint` and `npm run format:check` | Passes |
| `NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts` | Passes; authority `HEAD` matches the pinned commit `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Backend route surface | `GET /health` only (`src/app.ts:9`) |
| Request context module | Implemented and unit-tested (`src/request-context.ts`, `tests/request-context.test.ts`) but not registered as Fastify middleware/hooks and not consumed by any route |
| Auth/DB/SQL/migrations/secrets/generated clients/CI/runtime dependencies | None present (confirmed by PR #9, PR #10, and re-confirmed by file-tree inspection in this gate) |

This baseline is the floor that any future minimal implementation slice must start from and must not regress.

---

## 4. Proposed Minimal Implementation Boundary

The smallest safe implementation boundary after `/health` is **request context / contract-safe infrastructure only** — wiring the already-implemented, already-tested `src/request-context.ts` into the Fastify app as request-level plumbing (e.g., a `preHandler` hook or plugin that resolves and attaches `{ workspaceId, actorId }` to the request, and returns a consistent `401 REQUEST_CONTEXT_REQUIRED` error shape when headers are missing or blank), without exposing any new product route.

This boundary explicitly excludes, even in its minimal future form (any of these would require separate, explicit approval beyond this gate and beyond the planning review gate that follows it):

- product API routes
- workspace CRUD
- campaign/content/product APIs
- auth/RBAC enforcement implementation
- database access
- SQL/migrations/ORM
- generated clients
- CI workflow changes
- external provider/model calls
- prompt execution
- agent/tool execution
- connector execution
- publishing
- runtime dependencies
- secrets/environment configuration
- deployment
- production readiness
- pilot readiness

A future implementation gate scoped to this boundary would still expose only `/health` as a product-facing route. Request context wiring would be infrastructure that *future* routes could rely on — it would not itself add a route that uses it.

---

## 5. Allowed Future Files for Implementation Planning

These are the files a *future*, separately-approved implementation gate could plausibly touch to deliver the minimal boundary in Section 4. Listing them here is planning only — it does not authorize editing them now or in that future gate without that gate's own explicit approval:

| File | Plausible future change (planning only) |
|---|---|
| `src/app.ts` | Register request-context resolution as Fastify plumbing (e.g., a `preHandler` hook/plugin) while ensuring the `/health` route is excluded, and apply a consistent error-response shape for `REQUEST_CONTEXT_REQUIRED` failures, without adding any new route |
| `src/request-context.ts` | Minor adjustments only if needed to integrate cleanly as Fastify plumbing (e.g., exporting a plugin wrapper); core resolution logic is already implemented and tested |
| `src/index.ts` | Touched only if the entry point needs to pass through new build options; expected to remain unchanged |
| `tests/health.test.ts` | Extended only if `/health`'s response or behavior must be re-asserted under the new plumbing (it must keep passing unchanged in behavior) |
| `tests/request-context.test.ts` | Extended to cover the plumbing-level integration (e.g., Fastify `inject` tests asserting `401 REQUEST_CONTEXT_REQUIRED` responses), in addition to its existing unit-level coverage |
| A new `tests/*.test.ts` file for request-context plumbing integration (planning name only, e.g. `tests/request-context-plugin.test.ts`) | Would assert the consistent error-response shape and correlation/request-id behavior described in Section 6's allowed planning topics |

No other files are contemplated as part of this minimal boundary.

---

## 6. Allowed Planning Topics

The following topics may be explored in the next planning **review** gate and in any subsequent, separately-approved implementation planning, without themselves constituting implementation:

- request context shape (the `{ workspaceId, actorId }` contract already defined in `src/request-context.ts`)
- request id / correlation id planning (how a request/correlation identifier would be generated, propagated, and logged)
- workspace id header validation planning only (how `x-nashir-workspace-id` presence/format would be checked at the plumbing layer — not how workspace data would be looked up, stored, or authorized)
- error response consistency planning (a single, documented shape for `REQUEST_CONTEXT_REQUIRED` and similar infrastructure-level errors, building on the existing `RequestContextResult`/`RequestContextError` types)
- health route preservation (ensuring `/health` continues to respond identically and is not gated by request-context requirements)
- contract validation preconditions (ensuring `validate:contracts` and `validate:contract-authority` continue to pass unchanged before and after any future change)
- future test expectations (what Vitest/Fastify `inject` coverage a future implementation would need to add or extend, and what must continue passing)

---

## 7. Forbidden Files / Areas

Even in a future, separately-approved minimal implementation gate, the following remain forbidden unless a distinct, explicit user decision authorizes each one individually:

- product API routes (any route other than `/health`)
- workspace CRUD endpoints
- campaign/content/product API endpoints
- auth/RBAC enforcement implementation (permission checks, role models, token verification)
- database access code (connections, pools, queries)
- SQL, migrations, migration runners, or ORM/query-layer code
- generated clients or generated types
- `.github/workflows/*` (any CI workflow addition or modification)
- external provider/model API calls
- prompt construction or execution
- agent/tool execution or tool registries
- connector execution
- publishing or external-sending code
- new runtime dependencies (e.g., Mastra, LangGraph, OpenAI Agents SDK, or any package addition to `package.json` `dependencies`)
- secrets or real environment configuration
- deployment configuration or infrastructure-as-code
- production readiness work
- pilot readiness work

---

## 8. Required Preconditions Before Implementation

Before any future implementation gate for this boundary may begin (i.e., before any code is written), all of the following must hold:

1. This planning gate is merged.
2. A **Backend Slice 0 Minimal Implementation Planning Review Gate** (`docs/nashir_backend_slice_0_minimal_implementation_planning_review_gate.md`) is opened, reviewed, and reaches an explicit GO for *planning* — and that review gate itself does not authorize implementation.
3. A separate, explicit user decision — distinct from any documentation/planning gate — authorizes the transition from planning into implementation for this specific boundary.
4. `main` is clean and `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm test` all pass on the commit the implementation gate would branch from.
5. `NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts` and `NASHIR_AUTHORITY_REPO=../nashir npm run validate:contract-authority -- --authority-ref 04f54f8be852001173f4014cb2d81c5cdb97e35c` (or the CI-pinned ref, as applicable) both pass, confirming the authority posture is unchanged.
6. The implementation gate's own scope statement explicitly repeats the forbidden-areas list in Section 7 and the non-authorization boundary in Section 11, and is reviewed against them before any commit.

---

## 9. Required Verification Commands

These commands must be run, and must pass, both before opening any future implementation gate and after any change that gate proposes:

```bash
git status --short
git log --oneline -5
npm run lint
npm run typecheck
npm run format:check
npm test
NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts
NASHIR_AUTHORITY_REPO=../nashir npm run validate:contract-authority -- --authority-ref 04f54f8be852001173f4014cb2d81c5cdb97e35c
grep -E -n "app\.(get|post|put|delete|patch)" src/app.ts
git diff --check
git diff --stat
```

A future implementation gate must show these commands passing both on the baseline commit (before any change) and on its proposed change (after), with `grep -E -n "app\.(get|post|put|delete|patch)" src/app.ts` showing no route beyond `/health` plus, at most, the planned plumbing registration — never a new product route.

---

## 10. Risk Review

| Risk | Finding | Control |
|---|---|---|
| Planning-to-implementation slippage risk | A planning gate that names specific files and code shapes (Sections 5–6) could be read as pre-authorizing those edits | Section 8 states explicitly that a separate, distinct user decision — beyond this gate and beyond the review gate that follows it — is required before any code is written; Section 11 restates the full non-authorization boundary |
| Scope-expansion risk | "Request context wiring" could silently grow into product routes or auth enforcement once implementation begins | Section 4 fixes the boundary to plumbing only with no new product route, and Section 7 lists auth/RBAC enforcement and product routes as forbidden even in the future minimal slice |
| Regression risk to `/health` | Adding request-context plumbing ahead of routes could inadvertently gate or change `/health`'s response | Section 6 names "health route preservation" as a required planning topic, and Section 9 requires `tests/health.test.ts` to keep passing unchanged before and after any future change |
| Authority-drift risk | A future implementation gate could proceed on a stale or unverified authority pin | Section 8 and Section 9 require both `validate:contracts` and `validate:contract-authority` to pass against the pinned commit `04f54f8be852001173f4014cb2d81c5cdb97e35c` immediately before implementation begins |
| Dependency-creep risk | "Infrastructure" work could be used to justify adding a framework, validation library, or agent-runtime dependency | Section 7 explicitly forbids new runtime dependencies and any addition to `package.json` `dependencies`; the existing `fastify`, `pg`, `zod` set is the ceiling, and `pg` remains unused and out of scope for this boundary |
| False-readiness risk | A merged planning gate could be mistaken for implementation authorization | Section 11 and Section 12 state explicitly that this gate's GO applies only to opening the next *review* gate, and that implementation requires its own distinct, explicit user decision |

---

## 11. Explicit Non-Authorization Boundary

This documentation-only planning gate does not authorize, and must NOT be read as approving:

- backend implementation of any kind, including the minimal boundary described in Section 4
- new routes beyond `/health`
- product API routes, workspace CRUD, or campaign/content/product APIs
- auth/RBAC implementation or enforcement
- database access, SQL, migrations, ORM, or database configuration
- secrets or environment configuration
- generated clients or generated types
- CI workflow addition or modification
- provider/model calls, prompt execution, tool execution, connector execution, or publishing
- runtime dependencies or any new package addition
- deployment configuration
- production readiness or pilot readiness

This gate produces planning text only. No file other than this document is changed by this gate.

---

## 12. GO / NO-GO Decision

Decision: GO to Backend Slice 0 Minimal Implementation Planning **Review** Gate only. The minimal implementation boundary in Section 4 is well-defined, bounded, and consistent with the readiness decision recorded in PR #10 and the validated baseline in Section 3.

NO-GO for implementation. NO-GO for product routes, auth, DB, SQL, migrations, generated clients, CI workflows, provider/model/prompt/tool execution, connector execution, publishing, runtime dependencies, deployment, production readiness, or pilot readiness.

Opening the recommended next gate (Section 13) does not, by itself, authorize implementation. Implementation requires the separate, explicit user decision described in Section 8, item 3.

---

## 13. Recommended Next Step

Open the next gate as a review gate only:

```text
docs/nashir_backend_slice_0_minimal_implementation_planning_review_gate.md
```

That review gate should examine this planning gate's boundary (Section 4), allowed/forbidden file lists (Sections 5–7), preconditions (Section 8), and verification commands (Section 9) for completeness and correctness, and record its own GO/NO-GO on whether the *plan* is sound — without itself authorizing implementation.

Do not open a backend implementation, route, auth, database, SQL, migration, generated-client, CI, runtime-dependency, provider/model/prompt/tool/connector execution, publishing, deployment, production-readiness, or pilot-readiness PR from this planning gate alone.
