# Nashir Backend Slice 0 Minimal Implementation Execution Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only execution gate |
| Purpose | Restate the approved minimal implementation boundary from PR #14 in execution-ready form, define the *shape* of a future proposed implementation diff strictly within that boundary, and request the explicit user authorization required before any code is written |
| Authorizing decision gate | `docs/nashir_backend_slice_0_minimal_implementation_authorization_decision_gate.md` (PR #14, merge commit `476c5abef13142005eeb60de6b585c8928a73e20`) |
| Authority repository | `henter36/nashir` |
| Pinned authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and does not write, scaffold, or merge any code. GO here means only "request explicit user authorization for a proposed implementation diff," not "begin implementation" |

---

## 1. Title

Backend Slice 0 Minimal Implementation Execution Gate

---

## 2. Scope

This gate is the future execution gate named as the recommended next step by PR #14 (the Minimal Implementation Authorization Decision Gate). PR #14 authorized *opening* this gate under a narrow approved boundary — it did not authorize writing any code, and neither does this gate.

This gate:

- restates, in full and without weakening, the approved boundary, allowed-files list, forbidden-areas list, required preconditions, and non-authorization boundary recorded in PR #14
- describes the *shape* of a future proposed implementation diff strictly within that boundary, as planning/description text only — not as code to be merged by this gate
- explicitly requests the further, separate, explicit user authorization that PR #14 Section 8 precondition 4 states is required before any implementation commit
- does **not** write, scaffold, or merge any implementation code
- does **not** modify `src/`, `scripts/`, `package.json`, `.github/`, `generated/`, `migrations/`, or any other runtime file

This is a documentation-only execution gate. It adds only this document. Its GO is limited to "request explicit user authorization for a proposed implementation diff" — it is NOT a GO to write code in this PR, and it is NOT a GO for any implementation outside the narrow boundary restated in Section 4.

---

## 3. Inputs Reviewed

| Input | Use in this gate |
|---|---|
| `docs/nashir_backend_slice_0_minimal_implementation_authorization_decision_gate.md` (PR #14, merge commit `476c5ab`) | The authorizing decision gate. Section 5 (Approved Future Boundary), Section 6 (Files Allowed for Future Implementation Consideration), Section 7 (Forbidden Files / Areas), Section 8 (Required Preconditions Before Execution), and Section 11 (Explicit Non-Authorization Boundary) are restated below in execution-ready form, unchanged in substance |
| `docs/nashir_backend_slice_0_minimal_implementation_planning_gate.md` (PR #12, merge commit `c26eb3d`) | Original source of the boundary definition (Section 4) and allowed/forbidden file lists (Sections 5, 7), carried forward through PR #13 and PR #14 to this gate |
| `docs/nashir_backend_slice_0_minimal_implementation_planning_review_gate.md` (PR #13, merge commit `c19cad4`) | Independent review that found the planning gate's boundary sound on all twelve criteria, recommending the authorization decision gate that became PR #14 |
| `package.json` on `main` | Confirms `lint`, `format:check`, `typecheck`, `test`, `validate:contracts`, `validate:contract-authority` scripts exist and `dependencies` (`fastify`, `pg`, `zod`) are unchanged |
| `scripts/validate-contracts.mjs` | Confirms `EXPECTED_AUTHORITY_COMMIT = "04f54f8be852001173f4014cb2d81c5cdb97e35c"` matches the pinned commit recorded throughout PR #11–#14 and this gate |
| `src/app.ts` | Confirms the only registered route remains `app.get("/health", ...)` (line 9), and is the file this gate's described diff-shape would eventually touch |
| `src/request-context.ts` | Confirms the already-implemented, already-tested header-resolution module (`resolveRequestContextFromHeaders`, `requireRequestContext`, `WORKSPACE_ID_HEADER`, `ACTOR_ID_HEADER`) that any future plumbing would wire in, without itself needing redesign |
| Current `main` branch state | Confirms a clean working tree at commit `476c5ab` (PR #14 merge), with `npm run lint`, `npm run typecheck`, `npm test`, and `NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts` all passing, and `npm run format:check` showing the same pre-existing warnings on three files documented by PR #13 and PR #14 |

---

## 4. Restated Approved Boundary (from PR #14, Section 5 — Unchanged)

PR #14 approved the following narrow boundary as the *only* scope this execution gate may describe for a future proposed implementation diff. Restating it here does not expand it by one item; this gate adds nothing to it and removes nothing from it:

- request context plumbing (wiring `src/request-context.ts`'s existing `resolveRequestContextFromHeaders` / `requireRequestContext` into the Fastify app as request-level plumbing, e.g., a `preHandler` hook or plugin)
- correlation/request id handling (generating, propagating, and logging a request/correlation identifier as infrastructure-level plumbing)
- workspace-id header inspection only (checking presence/format of `x-nashir-workspace-id` at the plumbing layer — not looking up, storing, or authorizing workspace data)
- a consistent error response shape for missing/blank request-context headers (a single, documented `401 REQUEST_CONTEXT_REQUIRED` shape, building on the existing `RequestContextResult` / `RequestContextError` types)
- the `/health` route must remain explicitly excluded/ungated — it must continue to respond identically, unaffected by any request-context plumbing
- narrowly scoped tests for the above, and *only* the above, and only if separately authorized in a future, explicitly scoped step

No other implementation topic is in scope for the diff this gate describes. Any expansion beyond this list — including but not limited to product routes, auth/RBAC enforcement, or anything in Section 6 — requires its own distinct, explicit, separately-scoped user decision and is out of bounds for this gate and for any diff it may describe.

---

## 5. Described Shape of a Future Proposed Implementation Diff (Description Only — Not Code to Merge)

This section describes, in narrative/planning form only, the *shape* that a future proposed implementation diff could take strictly within the Section 4 boundary. **No code in this section, or anywhere in this document, is to be written, scaffolded, or merged by this gate.** It exists solely so that the explicit user authorization requested in Section 9 can be given (or withheld) against a concrete, bounded description — not a vague one.

| Boundary topic (Section 4) | Described shape of the future diff (planning/description only) |
|---|---|
| Request context plumbing | `src/app.ts` would register the existing `requireRequestContext` (or an equivalent thin plugin wrapper around it) as a Fastify `preHandler` hook or plugin, attaching `{ workspaceId, actorId }` to the request object for routes that opt in. The hook would be registered in a way that does not apply to `/health`. |
| Correlation/request id handling | The plumbing would generate or read a request/correlation identifier (e.g., from an incoming header or generated per-request), attach it to the request/response cycle, and include it in the structured log line and in the error-response shape described below. No new logging dependency would be introduced — only the existing Fastify logger would be used. |
| Workspace-id header inspection only | The plumbing would check for the presence and basic format of `x-nashir-workspace-id` (and the actor-id header) using the existing `WORKSPACE_ID_HEADER` / `ACTOR_ID_HEADER` constants and `resolveRequestContextFromHeaders` logic already implemented and tested in `src/request-context.ts`. It would not look up, validate against, store, or authorize any workspace record — that remains forbidden (Section 6). |
| Consistent error response shape | When required request-context headers are missing or blank, the plumbing would return a single, documented `401` response shaped like `{ error: "REQUEST_CONTEXT_REQUIRED", message: <string>, correlationId: <string> }` (exact field names to be finalized only in the authorized implementation step), built on the existing `RequestContextError` type rather than a newly invented error model. |
| `/health` route exclusion | `src/app.ts` would register the `/health` route either before the plumbing hook is applied globally, or with an explicit per-route opt-out, such that `tests/health.test.ts` continues to pass completely unchanged in behavior — same status code, same body shape, same fields. |
| Narrowly scoped tests (only if separately authorized) | If and only if separately authorized, `tests/request-context.test.ts` could be extended (or a new, narrowly named file such as `tests/request-context-plugin.test.ts` could be added) using the existing Vitest + Fastify `inject` pattern, asserting: (a) the `401 REQUEST_CONTEXT_REQUIRED` shape on missing/blank headers, (b) successful attachment of `{ workspaceId, actorId }` on valid headers, (c) correlation-id propagation, and (d) that `/health` remains unaffected. |

This description is bounded, file-scoped (Section 6), and topic-scoped (Section 4). It is offered so that the user can authorize — or decline, or request changes to — a concrete proposed shape, rather than an open-ended one. **Authorizing this description is not the same as authorizing the eventual code.** Per Section 9 and PR #14 Section 8 precondition 4, a further, separate, explicit "begin implementation" decision — scoped to the actual proposed diff once drafted — remains required before any commit.

---

## 6. Restated Files Allowed for Implementation Consideration (from PR #14, Section 6 — Unchanged)

A future, separately-authorized implementation step may consider proposing changes to — and only to — the following files. Restating them here authorizes nothing beyond what PR #14 already authorized considering; it does not authorize editing them now, and it does not authorize writing code without the further explicit "begin implementation" decision described in Section 9:

| File | Plausible future consideration (description only — not authorization to write code now) |
|---|---|
| `src/app.ts` | Registering request-context resolution as Fastify plumbing (e.g., a `preHandler` hook/plugin) while ensuring `/health` remains explicitly excluded/ungated, and applying the consistent `401 REQUEST_CONTEXT_REQUIRED` error shape, without adding any new route |
| A small request-context module under `src/` (possibly `src/request-context.ts` itself, if minor adjustments are justified to integrate cleanly as Fastify plumbing) | Only if a future, explicitly authorized step justifies the need — e.g., exporting a plugin wrapper around the already-implemented, already-tested resolution logic; core logic is not expected to change |
| Test file(s) for this narrow request-context behavior only (e.g., extending `tests/request-context.test.ts`, or a new `tests/*.test.ts` file scoped only to plumbing-level integration) | Asserting the `401 REQUEST_CONTEXT_REQUIRED` response shape and correlation/request-id behavior described in Section 5 — and re-asserting, unchanged, that `tests/health.test.ts` continues to pass — and only if separately authorized |

No other file is authorized for consideration. In particular, this gate does not authorize considering changes to `package.json`, any file under `scripts/`, any file under `.github/`, any database/migration/generated-client directory, or any deployment/configuration file.

---

## 7. Restated Forbidden Files / Areas (from PR #14, Section 7 — Unchanged, Carried Forward From PR #10–#14)

The following remain forbidden — both for this gate (which touches none of them) and for any future implementation step this gate may eventually request authorization for — unless and until a distinct, explicit, separately-scoped user decision authorizes each one individually:

- product routes (any route other than `/health`)
- workspace/campaign/content/product APIs (workspace CRUD, campaign/content/product API endpoints)
- auth/RBAC enforcement (permission checks, role models, token verification)
- DB, SQL, migrations, ORM, database config (connections, pools, queries, migration runners, query-layer code)
- secrets/environment config (secrets or real environment configuration)
- generated clients (generated clients or generated types)
- CI workflows (`.github/workflows/*`, any addition or modification)
- provider/model calls (external provider/model API calls)
- prompt/tool/connector execution (prompt construction or execution, agent/tool execution or registries, connector execution)
- publishing (publishing or external-sending code)
- runtime dependencies (e.g., Mastra, LangGraph, OpenAI Agents SDK, or any package addition to `package.json` `dependencies`)
- deployment (deployment configuration or infrastructure-as-code)
- production or pilot readiness (production readiness work, pilot readiness work)

This gate modifies none of `src/`, `scripts/`, `package.json`, `.github/`, `generated/`, `migrations/`, or any other runtime file. It adds only this document.

---

## 8. Restated Required Preconditions Before Any Code Is Written (from PR #14, Section 8 — Unchanged)

Before any implementation commit may be made for the diff described in Section 5, all of the following must hold:

1. This execution gate is merged.
2. The further, separate, explicit user authorization requested in Section 9 — scoped specifically to a concrete proposed diff — is given. Opening and merging this gate does not, by itself, satisfy this precondition.
3. The proposed diff, once drafted for that authorization request, explicitly restates the boundary (Section 4), the allowed-files list (Section 6), the forbidden-areas list (Section 7), and the non-authorization boundary (Section 10) of this gate, and is reviewed against them before any commit.
4. `main` is clean and `npm run lint`, `npm run typecheck`, and `npm test` all pass on the commit the implementation would branch from. `npm run format:check` must pass before any implementation PR is merged; if `main` still carries the pre-existing formatting warnings documented below, they must be resolved either by a separately scoped formatting cleanup gate/PR or by an explicitly authorized scope that does not expand beyond the Section 6 allowed-files boundary.
5. `NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts` passes, confirming the authority `HEAD` still matches the pinned commit `04f54f8be852001173f4014cb2d81c5cdb97e35c`.
6. `grep -E -n "app\.(get|post|put|delete|patch)" src/app.ts` shows no route beyond `/health` immediately before any commit is drafted.

---

## 9. Request for Explicit User Authorization

This gate formally requests the further, separate, explicit user authorization that PR #14 Section 8 precondition 4 states is required before any implementation commit may be made.

Specifically, this gate asks the user to decide, as a distinct decision from merging this gate:

> Do you authorize drafting and proposing an actual implementation diff for the boundary and described shape in Sections 4–6 above (request-context plumbing, correlation/request-id handling, workspace-id header inspection, consistent `REQUEST_CONTEXT_REQUIRED` error shape, `/health` exclusion, and — only if separately named — narrowly scoped tests), to be reviewed in its own, separately scoped implementation PR before any merge?

Merging this gate is **not** an answer to that question, and is **not** itself an authorization to write code. The authorization, if given, would itself need to be followed by the actual proposed-diff PR going through its own review before merge — this gate does not pre-approve that PR's contents, only the *act of drafting and proposing* one within the restated boundary.

If the user does not give this authorization, Backend Slice 0 remains exactly where it is today: `/health`-only, validation-only, with `src/request-context.ts` implemented and tested but not wired into any route — and no further action is implied or expected.

---

## 10. Explicit Non-Authorization Boundary

This documentation-only execution gate does not authorize, and must NOT be read as approving:

- backend implementation of any kind, in this PR or by virtue of this PR alone
- new routes beyond `/health`
- product routes, workspace CRUD, or campaign/content/product APIs
- auth/RBAC implementation or enforcement
- database access, SQL, migrations, ORM, or database configuration
- secrets or environment configuration
- generated clients or generated types
- CI workflow addition or modification
- provider/model calls, prompt execution, tool execution, connector execution, or publishing
- runtime dependencies or any new package addition
- deployment configuration
- production readiness or pilot readiness

This gate produces a description and an authorization request only. It modifies none of `src/`, `scripts/`, `package.json`, `.github/`, `generated/`, `migrations/`, or any other runtime file. No file other than this document is changed by this gate.

---

## 11. GO / NO-GO Decision

Decision: **GO only to requesting explicit user authorization for a proposed implementation diff**, as described in Section 9. The boundary in Section 4, the allowed-files list in Section 6, and the forbidden-areas list in Section 7 are restated here unchanged from PR #14, and the described diff-shape in Section 5 is bounded strictly within them.

**NO-GO for writing code in this PR.** This gate writes, scaffolds, and merges no code; it modifies no file other than this document.

**NO-GO for any implementation outside the narrow boundary** restated in Section 4 — including but not limited to product routes, workspace/campaign/content/product APIs, auth/RBAC enforcement, DB/SQL/migrations/ORM/database config, secrets/environment config, generated clients, CI workflows, provider/model calls, prompt/tool/connector execution, publishing, runtime dependencies, deployment, or production/pilot readiness (Section 7).

Merging this gate authorizes nothing beyond placing the authorization request of Section 9 before the user. It does not start, schedule, or imply any implementation work.

---

## 12. Recommended Next Step

The user reviews and answers the authorization request in Section 9, as a decision distinct from merging this gate.

- If the user **authorizes** drafting a proposed diff: open a separately scoped implementation PR that restates this gate's boundary (Section 4), allowed-files list (Section 6), forbidden-areas list (Section 7), and non-authorization boundary (Section 10), proposes a concrete, reviewable diff strictly within them, and is itself reviewed and approved before any merge — satisfying PR #14 Section 8 precondition 4 and this gate's Section 8 precondition 2.
- If the user **does not authorize** it (declines, defers, or asks for changes to the described shape): no further action is implied. Backend Slice 0 remains `/health`-only and validation-only, exactly as it is today, until and unless a future, distinctly-scoped decision revisits this request.

Do not open a backend implementation, route, auth, database, SQL, migration, generated-client, CI, runtime-dependency, provider/model/prompt/tool/connector execution, publishing, deployment, production-readiness, or pilot-readiness PR from this execution gate alone, and do not treat the merge of this gate as that authorization.

---

## 13. Verification Commands

```bash
git status --short
git log --oneline -5
npm run lint
npm run format:check
npm run typecheck
npm test
NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts
grep -E -n "app\.(get|post|put|delete|patch)" src/app.ts
grep -n "04f54f8be852001173f4014cb2d81c5cdb97e35c" scripts/validate-contracts.mjs docs/nashir_backend_slice_0_minimal_implementation_authorization_decision_gate.md
git diff --check
git diff --stat
```

These commands were re-run on current `main` (commit `476c5ab`, PR #14 merge) as part of drafting this gate:

- `git status --short` — clean
- `npm run lint` — passes
- `npm run format:check` — reports the same pre-existing Prettier warnings on `scripts/validate-contract-authority.mjs`, `scripts/validate-contracts.mjs`, and `src/request-context.ts` documented by PR #13 and PR #14 as predating PR #12 (traced to PR #7, merge commit `3bfcea7`); unchanged, and does not block this gate, but must be resolved before any future implementation PR merges (Section 8, precondition 4)
- `npm run typecheck` — passes
- `npm test` — 18/18 tests pass (`tests/health.test.ts`, `tests/request-context.test.ts`)
- `NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts` — PASS; authority `HEAD` matches the pinned commit `04f54f8be852001173f4014cb2d81c5cdb97e35c`
- `grep -E -n "app\.(get|post|put|delete|patch)" src/app.ts` — shows only `app.get("/health", ...)` at line 9
- `grep -n "04f54f8be852001173f4014cb2d81c5cdb97e35c" scripts/validate-contracts.mjs docs/nashir_backend_slice_0_minimal_implementation_authorization_decision_gate.md` — confirms the pin is recorded consistently in both
