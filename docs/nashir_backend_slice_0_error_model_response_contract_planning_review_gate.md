# Nashir Backend Slice 0 Error Model / Response Contract Planning Review Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only planning review gate |
| Reviewed planning gate | `docs/nashir_backend_slice_0_error_model_response_contract_planning_gate.md` (PR #20) |
| PR #20 merge commit | `07a51b7e0bb8ae6f48cf07d5d9be35cd3d82cf9c` |
| PR #16 merge commit (accepted implementation) | `80ac642f3e8e7e9b214a2fe1038fa7c3b835627b` |
| PR #17 merge commit (review) | `a8746e65a7a25a923b37b765820155bde82546a8` |
| PR #18 merge commit (acceptance) | `138ecf0` |
| PR #19 merge commit (next-boundary planning) | `5796ee0` |
| Authority repository | `henter36/nashir` |
| Authority commit recorded from main | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation of any kind |

---

## 1. Scope

This gate reviews `docs/nashir_backend_slice_0_error_model_response_contract_planning_gate.md` (PR #20, merge commit `07a51b7e0bb8ae6f48cf07d5d9be35cd3d82cf9c`) — the planning gate that analyzed how the Backend Slice 0 error response contract should evolve toward the authority OpenAPI `ErrorModel`.

The review determines whether the proposed error-model direction is **safe**, **sequenced correctly**, and **sufficiently bounded** before any future implementation gate is opened, by independently re-verifying PR #20's evidence (the accepted baseline's source code, the authority `ErrorModel`/`ErrorCode`/`RequestIdHeader` schemas, and the existing test surface) rather than taking its conclusions on faith.

This is a documentation-only planning review gate. It does not modify `src/app.ts`, `src/request-context.ts`, any test file, CI configuration, `package.json`, or any other backend source file. It adds only this review document, and it authorizes no implementation of any kind — not the plan it reviews, not any candidate shape discussed within that plan, and not any other runtime change.

---

## 2. Inputs Reviewed

| Input | Use in this review |
|---|---|
| `docs/nashir_backend_slice_0_error_model_response_contract_planning_gate.md` (PR #20, merge commit `07a51b7e0bb8ae6f48cf07d5d9be35cd3d82cf9c`) | The planning document under review — its candidate shapes, taxonomy findings, alignment analysis, correlation/request-id options, deferred items, and decision are each independently re-checked in Sections 5–9 |
| `git show --stat` / `--name-only` for PR #20's merge commit | Confirms PR #20 changed exactly one file, `docs/nashir_backend_slice_0_error_model_response_contract_planning_gate.md` (362 insertions), and no source, test, dependency, or CI file — the basis for review-criteria items 1–2 (Section 10) |
| `docs/nashir_backend_slice_0_next_boundary_planning_gate.md` (PR #19) | Confirms PR #20 was opened against the boundary that PR #19 actually recommended (Error Model / Response Contract Hardening), not a substituted or expanded one |
| `docs/nashir_backend_slice_0_minimal_implementation_execution_acceptance_gate.md` (PR #18) | Source of the formally accepted baseline that PR #20's "current accepted shape" claims must match |
| `src/app.ts`, `src/request-context.ts` (current `main` HEAD, re-verified independently via `grep`) | Independently re-confirms the exact current error shape PR #20 describes: a single `onRequest`-hook `401` reply `{ error: result.code, message: result.message, correlationId }`, with `result.code` structurally fixed to the literal `"REQUEST_CONTEXT_REQUIRED"` (`src/request-context.ts` lines 19–28, 93) |
| `tests/request-context-plumbing.test.ts` (current `main` HEAD) | Independently re-confirms the 13 plumbing-test assertions PR #20 cites (`body.error === "REQUEST_CONTEXT_REQUIRED"`, `typeof body.message === "string"`, `typeof body.correlationId === "string"`, and verbatim correlation-id propagation) |
| `package.json` (current `main` HEAD) | Independently re-confirms the dependency surface PR #20 describes: `fastify` (used), `pg` and `zod` (both pre-existing since before PR #16 — `git diff 7f06e15 HEAD -- package.json` empty — and unused by the request-context implementation); no new runtime dependency exists |
| `henter36/nashir` authority OpenAPI contract — `docs/nashir_v1_openapi.yaml`, independently re-fetched at the `ErrorModel` schema, `ErrorCode` enum, and `RequestIdHeader` parameter (the same locations PR #20 cites) | **Independent re-verification, not a re-statement of PR #20's claims** — this review re-read the schema text directly from the authority repository and confirms PR #20's transcription is accurate (Sections 5–8). This is the single most consequential input: it is what determines whether the "prefer the nested shape" review position (below) can actually be applied |
| Local re-run of `npm run lint`, `npm run typecheck`, `npm test`, `validate:contracts` on current `main` HEAD | Confirms the baseline this plan was written against is still intact: lint clean, typecheck clean, all 31 tests passing, authority reference current |

---

## 3. Review Criteria

This review checks PR #20 against fifteen criteria, each resolved in the Review Matrix (Section 10) and elaborated where indicated:

1. PR #20 remained documentation-only
2. No runtime files were modified by PR #20
3. PR #20's gate does not authorize implementation
4. Product routes remain forbidden
5. Auth/RBAC remains forbidden
6. DB, SQL, migrations, ORM, database config, and secrets remain forbidden
7. Generated clients remain forbidden
8. CI workflow changes remain forbidden
9. Runtime dependencies remain forbidden
10. Provider/model calls, prompt execution, tool execution, connector execution, publishing, deployment, production readiness, and pilot readiness remain forbidden
11. The proposed error response shape options are sound (Section 5)
12. The OpenAPI `ErrorModel` alignment analysis is accurate (Section 6)
13. The correlation/request-id placement analysis is sound (Section 7)
14. The error code taxonomy analysis is accurate (Section 8)
15. The test-expectations analysis is sound and appropriately scoped (Section 9)

---

## 4. Planning Decision Reviewed

PR #20's core planning decision, restated for review:

- **Preserve** the current accepted flat error shape (`{ error, message, correlationId }`, "Candidate A") as-is for now — it is reviewed, accepted, and asserted by 31 passing tests, and changing it now would itself be premature implementation.
- **Explicitly reject** migrating to the proposed nested shape (`{ error: { code, message, correlationId } }`, "Candidate B") as a planning target, on the grounds that the authority `ErrorModel` is flat, not nested — meaning Candidate B would be a detour requiring two migrations rather than one.
- **Document** a third, evidence-derived shape ("Candidate C": `{ errorCode, message, details?, requestId, retryable, status }`) as the actual authority-aligned target for a later, separately-authorized migration.
- **Defer** the question of how to reconcile `correlationId`/`x-nashir-correlation-id` with the authority's `requestId`/`X-Request-Id` convention to three documented (but undecided) options for a later execution-planning gate.
- **Defer** the question of error-code taxonomy entirely, on the grounds that the authority `ErrorCode` enum is closed and owned by `henter36/nashir`, not by this backend repository — any conformant code requires a cross-repository contract change.
- **Recommend** GO to a planning *review* gate only (this gate), with NO-GO for any implementation.

Each element of this decision is independently re-checked against primary evidence in Sections 5–9 below, not merely re-stated.

---

## 5. Error Response Shape Review

Three directions were to be reviewed: the current flat shape, a "nested ErrorModel-compatible shape," and a transitional compatibility approach. The reviewing instruction additionally specified a position to apply: *prefer the nested shape as the target direction **if it aligns with the authority OpenAPI contract**; allow transitional compatibility only if required to avoid breaking the already-accepted behavior.*

That conditional is the crux of this review, so it was checked first, against the primary source rather than PR #20's transcription of it (Section 6 shows the schema text this review independently re-fetched). The result: **the authority `ErrorModel` is a flat object** — `errorCode`, `message`, `details`, `requestId`, `retryable`, and `status` are declared as direct sibling properties, with no `error` (or any other) wrapper object anywhere in its definition. A shape of the form `{ error: { code, message, ... } }` does not satisfy this schema; it could not pass validation against it without first being unwrapped.

This means the conditional "prefer the nested shape **if it aligns**" does not activate — its premise is false. Applying the instruction faithfully (rather than mechanically following its preferred branch regardless of the facts) leads to its other branch: **transitional compatibility, used because it is required to avoid breaking the already-accepted request-context behavior.** That is exactly the direction PR #20 chose. On independent verification, then:

- **Current flat shape (Candidate A):** correctly assessed by PR #20 as already-accepted, fully tested, and — notably — *structurally* closer to the authority target than the nested option, since both are flat objects (they differ in field names and in which fields exist, not in overall shape).
- **"Nested ErrorModel-compatible" shape (Candidate B):** PR #20's finding that this label is a misnomer is **confirmed independently**: the shape is not compatible with the authority `ErrorModel`, because that model is flat. Adopting it would not be a step toward alignment; it would be a detour that increases total migration work, exactly as PR #20 argued (Section 11, contract-drift risk).
- **Transitional compatibility approach:** correctly identified as the only one of the three that (a) avoids breaking the accepted, tested baseline now, and (b) does not move the implementation further from the true (flat, authority-aligned) target. This is the soundest of the three options, and is the one this review concurs should be carried forward.

**Conclusion:** PR #20's shape decision is sound, and — when the reviewing instruction's conditional is applied to the actual schema rather than to the proposal's label — it is also the one that instruction itself implies once its "if it aligns" precondition is correctly evaluated as false.

---

## 6. OpenAPI `ErrorModel` Alignment Review

This review independently re-fetched the authority schema text directly from `henter36/nashir`'s `docs/nashir_v1_openapi.yaml` (not from PR #20's transcription) and confirms it reads exactly as PR #20 reproduced it:

```yaml
ErrorModel:
  type: object
  required:
    - errorCode
    - message
    - requestId
    - retryable
    - status
  properties:
    errorCode:
      $ref: "#/components/schemas/ErrorCode"
    message:
      type: string
    details:
      type: object
      additionalProperties: true
    requestId:
      type: string
    retryable:
      type: boolean
    status:
      type: integer
      minimum: 100
      maximum: 599
```

Cross-checking each gap PR #20 identified against this independently-re-fetched text:

| PR #20 claim | Independently re-verified? | Finding |
|---|---|---|
| The model is flat, not nested | Yes | All six properties (`errorCode`, `message`, `details`, `requestId`, `retryable`, `status`) are direct siblings under `properties`; no nested `error` object exists |
| `errorCode` (not `error`) is the identifier field, and is enum-typed via `$ref` | Yes | `errorCode: { $ref: "#/components/schemas/ErrorCode" }`, present in `required` |
| `requestId` (not `correlationId`) is the tracking-id field, and is required | Yes | `requestId: { type: string }`, present in `required` |
| `retryable` and `status` are required fields absent from the current shape entirely | Yes | Both present in `required`; neither exists anywhere in the current `{ error, message, correlationId }` body |
| `details` is an optional, free-form object | Yes | `details: { type: object, additionalProperties: true }`, absent from `required` |
| `status` is an integer constrained to valid HTTP status range | Yes | `type: integer, minimum: 100, maximum: 599` |

Every gap PR #20 listed is independently confirmed accurate, and no material gap was found to be missing from PR #20's analysis. The conclusion that "full alignment is not a small tweak" — it requires field renames, two semantically novel new required fields, an optional free-form field, and (per Section 8) a closed enum value the backend cannot add unilaterally — is independently corroborated.

**Conclusion:** PR #20's `ErrorModel` alignment analysis is accurate and complete. No correction is required.

---

## 7. Correlation/Request-Id Review

Independently re-checked against the authority contract:

- The `RequestIdHeader` parameter is defined exactly as PR #20 described: `name: X-Request-Id`, `in: header`, `required: false`, `description: "Optional client request tracking identifier."`, `schema: { type: string }` — and is referenced from roughly twenty operations.
- A case-insensitive search of the entire authority OpenAPI contract for the string `"correlation"` returns **zero matches** (independently re-run as `grep -ic "correlation" docs/nashir_v1_openapi.yaml` → `0`). PR #20's claim that "correlation" has no authority-side counterpart is confirmed precisely, not approximately.
- The accepted backend baseline's `correlationId` / `x-nashir-correlation-id` convention is therefore, as PR #20 concluded, a wholly backend-local invention — not a partial or divergent implementation of an authority concept, but an independent one.

PR #20 declined to choose among three transitional options for reconciling this divergence (rename to `requestId`/`X-Request-Id`; dual-support both names through a deprecation window; or treat `requestId` and `correlationId` as two distinct, coexisting concepts). This review finds that restraint correct: choosing among them requires either an implementation decision (out of scope for any planning gate) or authority-side clarification of whether the two concepts are meant to relate at all (a cross-repository question this backend-side gate cannot resolve). Documenting the three options precisely enough for a later gate to decide among them — without prematurely picking one — is exactly the right level of commitment for a planning document.

**Conclusion:** PR #20's correlation/request-id analysis is accurate, and its decision to leave the choice open is appropriately scoped, not an omission.

---

## 8. Error Code Taxonomy Review

Independently re-checked:

- `src/request-context.ts` (lines 19–28, 93) types `RequestContextResult`'s failure branch to the **single string literal** `"REQUEST_CONTEXT_REQUIRED"` — the implementation is structurally incapable of emitting any other code today. PR #20's claim that exactly one code exists is confirmed by direct inspection, not inference.
- The authority `ErrorCode` enum (re-fetched independently) is a closed list of roughly fifty values, every one of which follows a `lower.snake_case`, dot-namespaced convention (`workspace.not_found`, `validation.failed`, `permission.denied`, `campaign.not_found`, `creator_studio.session.not_found`, and so on). `REQUEST_CONTEXT_REQUIRED` matches this convention in neither case style (`SCREAMING_SNAKE_CASE` vs. `lower.snake_case`) nor namespacing (no dot-segment), and — independently confirmed by reading the full enum list — is simply absent from it. There is no near-miss or partial match; the concept of "missing or invalid request context" has no representation anywhere in the enum.
- PR #20's conclusion — that introducing a conformant code requires a contract change in the authority repository, which this backend repository does not own and cannot unilaterally perform — is correct as a matter of where the `ErrorCode` schema is defined and governed (`henter36/nashir`, not `henter36/nashir-backend`).

PR #20's recommendation that "only the single, already-accepted `REQUEST_CONTEXT_REQUIRED` literal continues to be emitted" in this slice is therefore the only position consistent with both (a) not authorizing implementation, and (b) not inventing a new code value that would need to be retired the moment authority-side alignment becomes possible.

**Conclusion:** PR #20's error code taxonomy analysis is accurate, and its decision to defer taxonomy decisions as a cross-repository concern is correct, not a gap.

---

## 9. Test Expectation Review

PR #20's Section 9 lists seven categories of test expectations to inform a *future* implementation gate (exact field/type assertions, `errorCode` enum-membership checks, `status`/HTTP-status consistency, `retryable` correctness per error condition, tracking-id propagation, optional dual-shape backward-compatibility assertions, and `/health` non-regression). Reviewing each against the existing, independently-re-confirmed test surface:

- The propagation expectations map directly onto assertions that already exist and pass today (`tests/request-context-plumbing.test.ts` lines 130–132, 148, 177, 195–196, 213, 256–257) — meaning the future gate would be *extending* proven assertions, not inventing untested ones from scratch.
- The `errorCode`-membership and `status`/`retryable` expectations correctly anticipate fields that **do not exist yet** in the current shape (Section 6) — they are forward-looking placeholders for the target shape, correctly framed as informing a future gate rather than describing present behavior.
- The `/health` non-regression expectation correctly reflects that `/health` never errors and has no error shape (independently re-confirmed: `grep -E -n "app\.(get|post|put|delete|patch)" src/app.ts` still returns exactly the one `/health` route registration).
- This review independently re-confirms PR #20's claim that **no test file was modified**: `git show --name-only --format=short 07a51b7e0bb8ae6f48cf07d5d9be35cd3d82cf9c` lists only the planning document, and the local re-run of `npm test` on current `main` HEAD still shows all 31 tests passing unchanged.

**Conclusion:** PR #20's test-expectations analysis is sound, correctly anchored to the existing, passing test surface, and appropriately scoped as guidance for a future gate rather than as new test obligations imposed now.

---

## 10. Review Matrix (PASS/FAIL)

| # | Criterion | Finding | Result |
|---|---|---|---|
| 1 | PR #20 remained documentation-only | `git show --stat 07a51b7e0bb8ae6f48cf07d5d9be35cd3d82cf9c` shows exactly one file changed, `docs/nashir_backend_slice_0_error_model_response_contract_planning_gate.md` (362 insertions, 0 deletions) | PASS |
| 2 | No runtime files were modified | `git show --name-only --format=short 07a51b7e0bb8ae6f48cf07d5d9be35cd3d82cf9c` lists only the one documentation file; `src/app.ts`, `src/request-context.ts`, all test files, `package.json`, and `.github/` are absent from the diff | PASS |
| 3 | The gate does not authorize implementation | PR #20's Sections 12–13 (Explicit Non-Authorization Boundary; GO/NO-GO Decision) state plainly that "no shape, field name, error code, or header convention discussed herein... may be implemented on the strength of this gate alone," and recommend GO to a *review* gate only | PASS |
| 4 | Product routes remain forbidden | Listed explicitly in PR #20's non-authorization boundary and GO/NO-GO decision; independently re-confirmed `grep -E -n "app\.(get\|post\|put\|delete\|patch)" src/app.ts` still returns exactly the single `/health` route | PASS |
| 5 | Auth/RBAC remains forbidden | Listed explicitly in PR #20's non-authorization boundary and GO/NO-GO decision; no authorization logic exists anywhere in `src/request-context.ts` (header inspection only — `inspectHeader` returns structural `"present"\|"missing"\|"blank"` results) | PASS |
| 6 | DB, SQL, migrations, ORM, database config, and secrets remain forbidden | Listed explicitly in PR #20's non-authorization boundary and GO/NO-GO decision; `package.json` `dependencies`/`devDependencies` byte-identical to before PR #16 (`git diff 7f06e15 HEAD -- package.json` empty); `pg` is present but pre-existing and unused — no schema, migration, or connection-config file exists anywhere in the tree | PASS |
| 7 | Generated clients remain forbidden | Listed explicitly in PR #20's non-authorization boundary and GO/NO-GO decision; no `generated`/`src/generated`/`openapi-generated` directory exists in this repository's tree | PASS |
| 8 | CI workflow changes remain forbidden | Listed explicitly in PR #20's non-authorization boundary and GO/NO-GO decision; `git diff 7f06e15 HEAD --name-only -- .github/` returns no results | PASS |
| 9 | Runtime dependencies remain forbidden | Listed explicitly in PR #20's non-authorization boundary and GO/NO-GO decision; `package.json` dependency lists are byte-identical to the pre-PR-16 baseline; `zod`, like `pg`, is pre-existing and unused | PASS |
| 10 | Provider/model/prompt/tool/connector execution, publishing, deployment, production readiness, pilot readiness remain forbidden | Listed explicitly in PR #20's non-authorization boundary and GO/NO-GO decision; no such code, configuration, or dependency exists anywhere in the diff or the current tree | PASS |
| 11 | Error response shape options are sound | Independently re-verified in Section 5: the "prefer nested if it aligns" instruction's precondition is false (the authority `ErrorModel` is flat), so transitional compatibility is correctly the operative choice — exactly what PR #20 selected | PASS |
| 12 | OpenAPI `ErrorModel` alignment analysis is accurate | Independently re-fetched and cross-checked field-by-field against the authority schema in Section 6; every claim confirmed, nothing material missing | PASS |
| 13 | Correlation/request-id placement analysis is sound | Independently re-confirmed zero "correlation" references in the authority contract and the exact `RequestIdHeader`/`requestId` convention in Section 7; PR #20's decision to leave the reconciliation choice open is correctly scoped | PASS |
| 14 | Error code taxonomy analysis is accurate | Independently re-confirmed the single-literal current state and the closed, non-conforming, non-matching authority `ErrorCode` enum in Section 8; the cross-repository deferral is correct | PASS |
| 15 | Test-expectations analysis is sound and appropriately scoped | Independently cross-checked against the existing, passing 31-test surface in Section 9; correctly anchored, correctly forward-looking, no test file touched | PASS |

**All fifteen review criteria PASS.**

---

## 11. Risk Review

| Risk | Finding | Control |
|---|---|---|
| Misapplied-instruction risk | A literal, unverified application of "prefer the nested shape if it aligns with the authority contract" — without checking whether it actually does — would have produced a recommendation to migrate toward a shape the authority schema cannot accept | Controlled by this review's independent re-fetch of the authority `ErrorModel` schema (Section 6) before evaluating the shape question (Section 5): the conditional's precondition was checked against primary evidence and found false, so the instruction's own fallback (transitional compatibility) was correctly applied instead — concurring with, not rubber-stamping, PR #20 |
| Contract-drift risk (carried from PR #20, independently re-confirmed) | Adopting the nested shape would create a third shape matching neither the accepted baseline nor the authority target, requiring two migrations instead of one | Confirmed still controlled: this review independently verifies the authority model is flat, reinforcing PR #20's rejection of the nested shape as the planning target |
| Cross-repository dependency risk (carried from PR #20, independently re-confirmed) | Full alignment requires a conformant `ErrorCode` enum value that only `henter36/nashir` can add (Section 8), and a resolution of the `correlationId`/`requestId` divergence that may require authority-side input (Section 7) | Confirmed still controlled: PR #20 correctly flagged both as deferred, cross-repository concerns rather than assuming they are unilaterally solvable; this review concurs and does not attempt to resolve either |
| Carried-forward `qlty check` residual finding | PR #17, #18, #19, and #20 all record (or, in #20's case, reference) that the `qlty check` GitHub status reported `state: success` while its description showed `"2 blocking issues"` on PR #16's final pre-merge commit (`9624f0ff90dcf671fd9827256e88f52917d5ba3e`), never investigated or dispositioned | Unchanged by this review — it remains the subject of the previously recommended `docs/nashir_backend_slice_0_minimal_implementation_execution_follow_up_gate.md`, entirely independent of the error-model planning track this gate reviews |
| Premature-authorization risk | A reader could mistake this review's "all criteria PASS" finding, or its concrete schema cross-checks, for clearance to begin implementing any of the shapes discussed | Section 12 (Explicit Non-Authorization Boundary) and Section 13 (GO/NO-GO Decision) state plainly that this review authorizes only the opening of a further authorization-decision gate — not any runtime change |

---

## 12. Explicit Non-Authorization Boundary

This review gate does not authorize, and must NOT be read as approving:

- runtime implementation
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

## 13. GO / NO-GO Decision

**Decision: GO** to a **Backend Slice 0 Error Model / Response Contract Authorization Decision Gate only** — because all fifteen review criteria in Section 10 resulted in a clean PASS: PR #20 stayed documentation-only, modified no runtime files, authorized no implementation, kept every forbidden category (product routes, auth/RBAC, DB/SQL/ORM/secrets, generated clients, CI, runtime dependencies, AI-provider/readiness work) explicitly out of scope, and its shape, alignment, correlation/request-id, taxonomy, and test-expectations analyses all independently re-verify as accurate and soundly scoped.

**NO-GO** for:
- direct implementation
- product routes
- auth/RBAC implementation
- DB, SQL, migrations, ORM, database config
- generated clients
- CI workflow changes
- runtime dependencies
- provider/model calls, prompt execution, tool execution, connector execution, publishing, deployment, production readiness, or pilot readiness

This gate authorizes no source-code change of any kind. It authorizes only the opening of a further authorization-*decision* gate (Section 14) — one that itself, per the task that opened this review, must still require a later, explicit authorization decision before any runtime code change.

---

## 14. Recommended Next Step

**`docs/nashir_backend_slice_0_error_model_response_contract_authorization_decision_gate.md`** — Backend Slice 0 Error Model / Response Contract Authorization Decision Gate

That gate should make the formal authorization *decision* — informed by, and consistent with, this review's independently-confirmed findings: preserve the current accepted shape now; do not migrate toward the proposed nested shape (it does not align with the authority `ErrorModel`, which is flat); record the authority-aligned flat shape (`{ errorCode, message, details?, requestId, retryable, status }`) as the documented eventual target; and explicitly route the `correlationId`/`requestId` reconciliation and the `ErrorCode` taxonomy/enum questions to cross-repository coordination before any of them can be implemented. That decision gate must still require a further, explicit authorization step — separate from itself — before any runtime code change is made.

Do not open a product-route, auth/RBAC, database, generated-client, CI-workflow, or direct error-model-*implementation* gate from this review. Each remains forbidden (Section 12) or deferred (per PR #20's Section 10, independently corroborated here) until a later, explicitly-authorized execution gate exists.

---

## 15. Verification Commands

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

git show --stat 07a51b7e0bb8ae6f48cf07d5d9be35cd3d82cf9c
git show --name-only --format=short 07a51b7e0bb8ae6f48cf07d5d9be35cd3d82cf9c

grep -n "REQUEST_CONTEXT_REQUIRED|correlationId|error|message" src/app.ts src/request-context.ts tests/request-context-plumbing.test.ts
grep -E -n "app\.(get|post|put|delete|patch)" src/app.ts
```
