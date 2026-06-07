# Nashir Backend Slice 0 Minimal Implementation Authorization Decision Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only authorization decision gate |
| Decision question | May Backend Slice 0 proceed toward a future minimal implementation **execution** gate, limited strictly to request-context / contract-safe infrastructure plumbing? |
| Reviewed inputs | PR #10, PR #11, PR #12, PR #13, current `main` |
| PR #12 merge commit | `c26eb3d6dd4e401f736b545ac7ec2be6aa958417` |
| PR #13 merge commit | `c19cad4` (`docs: review backend slice 0 minimal implementation planning`) |
| Authority repository | `henter36/nashir` |
| Pinned authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate authorizes only the future *opening* of an execution gate; it does not implement code and does not modify `src/`, `scripts/`, `package.json`, `.github/`, `generated/`, `migrations/`, or any runtime file |

---

## 1. Title

Backend Slice 0 Minimal Implementation Authorization Decision Gate

---

## 2. Scope

This gate decides whether the previously reviewed minimal implementation **planning** boundary (PR #12, reviewed and found sound by PR #13) is ready to move toward a future **Backend Slice 0 Minimal Implementation Execution Gate**.

This gate:

- records the explicit authorization decision required by the planning gate's own Section 8 precondition 3 and the planning review gate's Section 8 recommendation
- states precisely which narrow future boundary is approved for consideration in that future execution gate, and which files may be touched there
- restates, without weakening, every forbidden area carried forward from PR #10–#13
- does **not** itself write, scaffold, or merge any implementation code
- does **not** modify `src/`, `scripts/`, `package.json`, `.github/`, `generated/`, `migrations/`, or any other runtime file

This is a documentation-only authorization decision gate. It adds only this decision document. The authorization it grants is limited to *opening* a future execution gate under the boundary defined in Section 5 — it is not itself an implementation authorization, and no code may be written on the strength of this gate alone.

---

## 3. Inputs Reviewed

| Input | Use in this review |
|---|---|
| `docs/nashir_backend_slice_0_implementation_readiness_decision_gate.md` (PR #10) | Recorded the prior decision: GO to a minimal implementation planning gate only; established the precedent that implementation requires its own separate, explicit decision |
| `docs/nashir_backend_slice_0_contract_validation_cleanup_authority_pin_gate.md` (PR #11) | Explicitly adopted `04f54f8be852001173f4014cb2d81c5cdb97e35c` as the pinned `henter36/nashir` authority commit; confirmed no script/CI cleanup was necessary or safe |
| `docs/nashir_backend_slice_0_minimal_implementation_planning_gate.md` (PR #12, merge commit `c26eb3d`) | Defined the proposed minimal implementation boundary (Section 4), allowed/forbidden file lists (Sections 5, 7), required preconditions (Section 8), and verification commands (Section 9) that this decision gate now authorizes carrying forward into a future execution gate |
| `docs/nashir_backend_slice_0_minimal_implementation_planning_review_gate.md` (PR #13, merge commit `c19cad4`) | Independently reviewed PR #12's plan against twelve review objectives and found PASS on all twelve, with a recorded GO to "Backend Slice 0 Minimal Implementation Authorization Decision Gate only" |
| `package.json` on `main` | Confirms `lint`, `format:check`, `typecheck`, `test`, `validate:contracts`, `validate:contract-authority` scripts exist and `dependencies` (`fastify`, `pg`, `zod`) are unchanged |
| `scripts/validate-contracts.mjs` | Confirms `EXPECTED_AUTHORITY_COMMIT = "04f54f8be852001173f4014cb2d81c5cdb97e35c"` matches the pinned commit recorded throughout PR #11–#13 and this gate |
| `src/app.ts` | Confirms the only registered route remains `app.get("/health", ...)` (line 9) |
| Current `main` branch state | Confirms a clean working tree at commit `c19cad4` (PR #13 merge), with `npm run lint`, `npm run typecheck`, `npm test`, and `NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts` all passing, and `npm run format:check` showing the same pre-existing warnings on three files documented by PR #13 |

---

## 4. Authorization Decision Context

The planning gate (PR #12) proposed, and the planning review gate (PR #13) confirmed sound, a minimal future implementation boundary limited to **request-context / contract-safe infrastructure only**: wiring the already-implemented, already-tested `src/request-context.ts` into the Fastify app as request-level plumbing, without exposing any new product route.

Both PR #12 (Section 8, precondition 3) and PR #13 (Section 8, "Recommended Next Step") state that a **separate, explicit user decision** — distinct from the planning gate and the planning review gate — is required before any implementation code may be written for this boundary. This gate **is** that decision.

Answering the seven questions posed for this gate:

1. **Has minimal implementation planning been reviewed?**
   Yes. PR #12 (the planning gate) was independently reviewed by PR #13 (the planning review gate), which scored all twelve review criteria PASS and recorded a GO limited to opening this authorization decision gate.

2. **Is the future boundary still limited to request-context / contract-safe infrastructure only?**
   Yes. Section 5 below adopts, without expansion, the exact boundary defined in PR #12 Section 4 and confirmed by PR #13 Section 4 (criterion 2): wiring `src/request-context.ts` into the Fastify app as request-level plumbing (e.g., a `preHandler` hook or plugin resolving and attaching `{ workspaceId, actorId }`, with a consistent `401 REQUEST_CONTEXT_REQUIRED` error shape), with no new product route exposed.

3. **Is `/health` explicitly excluded/ungated?**
   Yes. Section 5 restates, without weakening, that `/health` must remain excluded/ungated from any future request-context plumbing, exactly as required by PR #12 Section 5 (the `src/app.ts` row) and confirmed by PR #13 Section 4 (criterion 3) and Section 5 (risk review, "`/health` regression risk").

4. **Are product routes still forbidden?**
   Yes. Section 7 below restates that no route beyond `/health` — including any product API route, workspace CRUD, or campaign/content/product API — is authorized by this gate or may be considered in scope for the future execution gate without its own separate, explicit approval.

5. **Are auth/RBAC implementation, DB, SQL, migrations, ORM, secrets, generated clients, CI workflows, runtime dependencies, provider/prompt/tool/connector execution, and publishing still forbidden?**
   Yes, all of them, without exception. Section 7 and Section 11 each restate this full list as forbidden, carried forward unchanged from PR #10 Section 7, PR #11 Section 10, PR #12 Sections 7 and 11, and PR #13 Section 6.

6. **What exact future implementation files may be considered?**
   Section 6 below lists exactly three categories: `src/app.ts`, possibly a small request-context module under `src/` if justified by the future execution gate, and test file(s) limited to this narrow request-context behavior. No other files are authorized for consideration.

7. **What exact user authorization is still required before any code implementation begins?**
   Section 8 below states explicitly: even after this gate, a future Backend Slice 0 Minimal Implementation Execution Gate must be opened, must restate this same boundary and forbidden-areas list, and the user must give a further, separate, explicit "begin implementation" decision scoped to that execution gate's specific proposed diff before a single line of runtime code is written. This gate authorizes *opening* that execution gate — it does not authorize writing code within it.

---

## 5. Approved Future Boundary (For a Later Execution Gate Only)

This gate approves the following narrow boundary as the *only* scope that a future Backend Slice 0 Minimal Implementation Execution Gate may propose for actual code changes. Approval here means the boundary may be *proposed and planned in detail* by that future gate — it does **not** mean code may be written now, by this gate, or automatically upon that gate's opening:

- request context plumbing (wiring `src/request-context.ts`'s existing `resolveRequestContextFromHeaders` / `requireRequestContext` into the Fastify app as request-level plumbing, e.g., a `preHandler` hook or plugin)
- correlation/request id handling (generating, propagating, and logging a request/correlation identifier as infrastructure-level plumbing)
- workspace-id header inspection only (checking presence/format of `x-nashir-workspace-id` at the plumbing layer — not looking up, storing, or authorizing workspace data)
- a consistent error response shape for missing/blank request-context headers (a single, documented `401 REQUEST_CONTEXT_REQUIRED` shape, building on the existing `RequestContextResult` / `RequestContextError` types)
- the `/health` route must remain excluded/ungated — it must continue to respond identically, unaffected by any request-context plumbing
- tests for the above, and *only* the above, and only if explicitly authorized in the future implementation execution gate itself

No other implementation topic is approved for that future gate's scope. Any expansion beyond this list — including but not limited to product routes, auth/RBAC enforcement, or anything in Section 7 — requires its own distinct, explicit, separately-scoped user decision and is out of bounds for the execution gate this decision authorizes opening.

---

## 6. Files Allowed for Future Implementation Consideration

A future, separately-scoped execution gate may consider proposing changes to — and only to — the following files. Listing them here is authorization to *consider and plan* them in that future gate; it is not authorization to edit them now, and it is not authorization for that future gate to write code without its own further explicit "begin implementation" decision (Section 8):

| File | Plausible future consideration (planning/consideration only — not authorization to write code now) |
|---|---|
| `src/app.ts` | Registering request-context resolution as Fastify plumbing (e.g., a `preHandler` hook/plugin) while ensuring `/health` remains excluded/ungated, and applying the consistent `401 REQUEST_CONTEXT_REQUIRED` error shape, without adding any new route |
| A small request-context module under `src/` (possibly `src/request-context.ts` itself, if minor adjustments are justified to integrate cleanly as Fastify plumbing) | Only if the future execution gate justifies the need — e.g., exporting a plugin wrapper around the already-implemented, already-tested resolution logic; core logic is not expected to change |
| Test file(s) for this narrow request-context behavior only (e.g., extending `tests/request-context.test.ts`, or a new `tests/*.test.ts` file scoped only to plumbing-level integration) | Asserting the `401 REQUEST_CONTEXT_REQUIRED` response shape and correlation/request-id behavior described in Section 5 — and re-asserting, unchanged, that `tests/health.test.ts` continues to pass |

No other file is authorized for consideration in that future execution gate. In particular, this gate does not authorize considering changes to `package.json`, any file under `scripts/`, any file under `.github/`, any database/migration/generated-client directory, or any deployment/configuration file.

---

## 7. Forbidden Files / Areas

The following remain forbidden — both for this gate (which touches none of them) and for the future execution gate this decision authorizes opening — unless and until a distinct, explicit, separately-scoped user decision authorizes each one individually:

- product API routes (any route other than `/health`)
- workspace CRUD endpoints
- campaign/content/product API endpoints
- auth/RBAC enforcement implementation
- DB, SQL, migrations, ORM, database config
- secrets/environment config
- generated clients
- CI workflows (`.github/workflows/*`, any addition or modification)
- provider/model calls
- prompt execution
- agent/tool execution
- connector execution
- publishing
- runtime dependencies (e.g., Mastra, LangGraph, OpenAI Agents SDK, or any package addition to `package.json` `dependencies`)
- deployment
- production readiness
- pilot readiness

This gate modifies none of `src/`, `scripts/`, `package.json`, `.github/`, `generated/`, `migrations/`, or any other runtime file. It adds only this decision document.

---

## 8. Required Preconditions Before Execution

Before a future Backend Slice 0 Minimal Implementation Execution Gate may write, scaffold, or merge any code (i.e., before any implementation commit), all of the following must hold:

1. This authorization decision gate is merged.
2. The future execution gate is opened as its own, separately-scoped PR named `docs/nashir_backend_slice_0_minimal_implementation_execution_gate.md` (or, once that gate authorizes an actual code change, as a correspondingly scoped implementation PR that gate itself defines and bounds).
3. That execution gate explicitly restates, in full, the approved boundary (Section 5), the allowed-files list (Section 6), the forbidden-areas list (Section 7), and the non-authorization boundary (Section 11) of this gate, and is reviewed against them before any commit.
4. A further, separate, explicit user decision — distinct from this gate, scoped specifically to that execution gate's proposed diff — authorizes the actual writing of code. This gate authorizes only the *opening* of the execution gate; it does not pre-authorize any commit within it.
5. `main` is clean and `npm run lint`, `npm run typecheck`, and `npm test` all pass on the commit the execution gate would branch from. `npm run format:check` must pass before any future execution PR is merged; if current `main` still has pre-existing formatting warnings, those warnings must be resolved either by a separately scoped formatting cleanup gate/PR or by an explicitly authorized execution-gate scope that does not violate this gate's allowed-files boundary.
6. `NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts` passes, confirming the authority `HEAD` still matches the pinned commit `04f54f8be852001173f4014cb2d81c5cdb97e35c`.
7. `grep -E -n "app\.(get|post|put|delete|patch)" src/app.ts` shows no route beyond `/health` immediately before the execution gate begins drafting any proposed diff.

---

## 9. Verification Commands

```bash
git status --short
git log --oneline -5
npm run lint
npm run format:check
npm run typecheck
npm test
NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts
grep -E -n "app\.(get|post|put|delete|patch)" src/app.ts
grep -n "04f54f8be852001173f4014cb2d81c5cdb97e35c" scripts/validate-contracts.mjs docs/nashir_backend_slice_0_minimal_implementation_planning_gate.md
git diff --check
git diff --stat
```

These commands were re-run on current `main` (commit `c19cad4`, PR #13 merge) as part of this gate's review:

- `git status --short` — clean
- `npm run lint` — passes
- `npm run format:check` — reports the same pre-existing Prettier warnings on `scripts/validate-contract-authority.mjs`, `scripts/validate-contracts.mjs`, and `src/request-context.ts` documented by PR #13's Risk Review as predating PR #12 (traced to PR #7, merge commit `3bfcea7`); this is unchanged and does not block this decision
- `npm run typecheck` — passes
- `npm test` — 18/18 tests pass (`tests/health.test.ts`, `tests/request-context.test.ts`)
- `NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts` — PASS; authority `HEAD` matches the pinned commit `04f54f8be852001173f4014cb2d81c5cdb97e35c`
- `grep -E -n "app\.(get|post|put|delete|patch)" src/app.ts` — shows only `app.get("/health", ...)` at line 9
- `grep -n "04f54f8be852001173f4014cb2d81c5cdb97e35c" scripts/validate-contracts.mjs docs/nashir_backend_slice_0_minimal_implementation_planning_gate.md` — confirms the pin is recorded consistently in both

---

## 10. Risk Review

| Risk | Finding | Control |
|---|---|---|
| Authorization-creep risk | This gate's GO could be misread as authorizing the future execution gate to write code immediately upon opening | Section 8 precondition 4 states explicitly that a further, separate, explicit user decision — scoped specifically to the execution gate's proposed diff — is required before any commit; Section 12 restates that this gate's GO is limited to opening that gate, "NO-GO for implementation in this PR" |
| Scope-expansion risk | "Request-context plumbing" could silently grow into product routes or auth enforcement once an execution gate begins drafting its proposed diff | Section 5 fixes the approved boundary to the six listed topics only and explicitly excludes everything else; Section 7 restates that product routes and auth/RBAC enforcement remain forbidden without a distinct, separate authorization |
| `/health` regression risk | Future request-context plumbing could inadvertently gate or alter `/health`'s response | Section 5 explicitly requires `/health` to "remain excluded/ungated" and "continue to respond identically"; Section 8 precondition 5 requires `npm test` (which includes `tests/health.test.ts`) to pass both before and after any future change |
| File-list drift risk | A future execution gate could expand the set of files it touches beyond what this gate authorizes considering | Section 6 lists exactly three file categories (`src/app.ts`, a possibly-justified small request-context module, and narrowly-scoped test files) and states "No other file is authorized for consideration" |
| Pre-existing formatting drift risk | `npm run format:check` continues to report Prettier warnings on three files (`scripts/validate-contract-authority.mjs`, `scripts/validate-contracts.mjs`, `src/request-context.ts`) that predate PR #12, as documented by PR #13 | Confirmed unchanged by re-running `npm run format:check` on current `main`; this does not block this decision, but `format:check` must pass before any future execution PR is merged. If the warnings remain on `main`, they must be resolved through a separately scoped formatting cleanup gate/PR or an explicitly authorized execution-gate scope that does not expand beyond the allowed-files boundary. |
| Authority-pin drift risk | A future execution gate could proceed on a stale or unverified authority pin | Section 8 precondition 6 requires `NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts` to pass against `04f54f8be852001173f4014cb2d81c5cdb97e35c` immediately before that gate branches; this gate re-confirmed the pin matches on current `main` |
| False-readiness risk | A merged authorization *decision* gate could be mistaken, in aggregate with PR #10–#13, for cumulative implementation authorization or a green light to start writing code | Section 11 (Non-Authorization Boundary) and Section 12 (GO/NO-GO) state explicitly that this gate's GO applies only to opening a future execution gate, that implementation in this PR is NO-GO, and that any implementation outside the narrow Section 5 boundary is NO-GO regardless of how this decision is read |

---

## 11. Explicit Non-Authorization Boundary

This documentation-only authorization decision gate does not authorize, and must NOT be read as approving:

- backend implementation of any kind, in this PR or by virtue of this PR alone
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

This gate produces a decision record only. It modifies none of `src/`, `scripts/`, `package.json`, `.github/`, `generated/`, `migrations/`, or any other runtime file. No file other than this document is changed by this gate.

---

## 12. GO / NO-GO Decision

Decision: **GO to Backend Slice 0 Minimal Implementation Execution Gate only, as a future gate.** The minimal implementation boundary in Section 5 is approved for that future gate to propose and plan in detail, the allowed-files list in Section 6 is approved for that future gate's consideration, and all preconditions for opening that gate (Section 8, items 1–3) are satisfied by the merge of PR #13 and this decision.

**NO-GO for implementation in this PR.** This gate writes, scaffolds, and merges no code; it modifies no file other than this document.

**NO-GO for any implementation outside the narrow request-context boundary** defined in Section 5 — including but not limited to product routes, auth/RBAC, DB, SQL, migrations, ORM, secrets, generated clients, CI workflows, runtime dependencies, provider/prompt/tool/connector execution, publishing, deployment, production readiness, or pilot readiness (Section 7).

Opening the future execution gate (Section 13) does not, by itself, authorize writing any code. A further, separate, explicit user decision — scoped specifically to that gate's proposed diff — is required before any implementation commit, per Section 8 precondition 4.

---

## 13. Recommended Next Step

Open the next gate as a future execution gate only:

```text
docs/nashir_backend_slice_0_minimal_implementation_execution_gate.md
```

That execution gate must restate, in full, the approved boundary (Section 5), the allowed-files list (Section 6), the forbidden-areas list (Section 7), the required preconditions (Section 8), and the non-authorization boundary (Section 11) of this gate. It may *propose and describe* a specific, bounded code diff within the Section 5 boundary and the Section 6 file list — but it must not itself contain the implementation commit, and it must not write, scaffold, or merge any runtime code, until a further, separate, explicit user decision scoped to its specific proposed diff authorizes that step.

Do not open a backend implementation, route, auth, database, SQL, migration, generated-client, CI, runtime-dependency, provider/model/prompt/tool/connector execution, publishing, deployment, production-readiness, or pilot-readiness PR from this decision gate alone.
