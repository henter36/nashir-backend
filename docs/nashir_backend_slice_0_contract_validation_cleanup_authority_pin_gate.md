# Nashir Backend Slice 0 Contract Validation Cleanup & Authority Pin Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only validation/tooling cleanup gate |
| Purpose | Clean up and clarify the local contract validation posture, and explicitly adopt a single pinned authority commit for Backend Slice 0 validation, before opening the Minimal Implementation Planning Gate |
| Approved pinned authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Authority repository | `henter36/nashir` |
| Implementation authorization | None — this gate is validation/tooling cleanup only and does not authorize backend implementation |

---

## 1. Scope

This gate performs a limited, documentation-led cleanup pass over Backend Slice 0's local contract validation tooling. It:

- explicitly adopts `henter36/nashir` commit `04f54f8be852001173f4014cb2d81c5cdb97e35c` as the pinned authority commit for Backend Slice 0 contract validation
- records the current validation posture, including an authority-SHA inconsistency discovered during this review
- decides whether any script or `package.json` change is necessary, safe, and within the approved scope
- carries forward the same non-authorization boundary established by PR #8, PR #9, and PR #10

This gate is validation/tooling cleanup only. It is not backend implementation, and it does not open the door to backend implementation by itself.

---

## 2. Inputs Reviewed

| Input | Use in this review |
|---|---|
| `package.json` on `main` | Confirms the `validate:contracts` and `validate:contract-authority` script entries and their descriptions |
| `scripts/validate-contracts.mjs` on `main` | Confirms `EXPECTED_AUTHORITY_COMMIT = "04f54f8be852001173f4014cb2d81c5cdb97e35c"`, local/read-only behavior, and absence of `child_process` |
| `scripts/validate-contract-authority.mjs` on `main` | Confirms `PINNED_AUTHORITY_SHA = "36da9ed31903562bddfb7ffd669841956e334a51"`, its required-authority-file list, and its read-only use of `node:child_process` (`execFileSync("git", ...)`) for local, read-only Git inspection only |
| `.github/workflows/ci.yml` on `main` | Confirms the CI workflow checks out `henter36/nashir` at `ref: 36da9ed31903562bddfb7ffd669841956e334a51` and invokes `validate:contract-authority -- --authority-repo ../nashir-authority --authority-ref 36da9ed31903562bddfb7ffd669841956e334a51` |
| Local `henter36/nashir` checkout (`~/workspace/nashir`) | Confirms the checkout's current `HEAD` is `04f54f8be852001173f4014cb2d81c5cdb97e35c`, and that `36da9ed31903562bddfb7ffd669841956e334a51` is an ancestor commit reachable from that `HEAD` |
| `git cat-file -e <sha>:<path>` against the local authority checkout | Confirms all four files in `validate-contract-authority.mjs`'s `AUTHORITY_FILES` list exist at both `36da9ed31903562bddfb7ffd669841956e334a51` and `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| `src/app.ts` | Confirms the backend surface remains `/health`-only |
| `docs/nashir_backend_slice_0_implementation_readiness_decision_gate.md` (PR #10) | Prior decision that Backend Slice 0 is ready only for a planning gate, contingent on no boundary violation — this gate must not introduce one |

---

## 3. Current Validation Posture

Backend Slice 0 carries **two** local validation scripts, each pinned to a **different** `henter36/nashir` commit, for two different purposes:

| Script | Package script | Pinned commit constant | Pinned value | Purpose |
|---|---|---|---|---|
| `scripts/validate-contracts.mjs` | `validate:contracts` | `EXPECTED_AUTHORITY_COMMIT` | `04f54f8be852001173f4014cb2d81c5cdb97e35c` | Local, read-only check that an externally supplied authority checkout contains the required contract files and that the Agent Runtime planning gate carries its required non-authorization markers; warns (does not fail) if the observed authority `HEAD` differs from the pinned reference |
| `scripts/validate-contract-authority.mjs` | `validate:contract-authority` | `PINNED_AUTHORITY_SHA` | `36da9ed31903562bddfb7ffd669841956e334a51` | Local, read-only check — using `execFileSync("git", ...)` strictly for inspection (`rev-parse`, `cat-file -e`) — that an externally supplied authority checkout resolves the supplied `--authority-ref` to this exact pinned SHA, that the pinned SHA contains a fixed list of authority files, and that the backend repo contains no copied authority files, no generated-client directories, and no unauthorized CI workflows |

`04f54f8be852001173f4014cb2d81c5cdb97e35c` is the current `HEAD` of the local `henter36/nashir` checkout used for verification in this gate. `36da9ed31903562bddfb7ffd669841956e334a51` is an **ancestor** of that `HEAD` (confirmed via `git merge-base --is-ancestor`), i.e. an older commit on the same authority history — not a divergent or unrelated reference.

`.github/workflows/ci.yml` checks out the authority repository at `ref: 36da9ed31903562bddfb7ffd669841956e334a51` and passes `--authority-ref 36da9ed31903562bddfb7ffd669841956e334a51` directly to `validate:contract-authority`. The script's `PINNED_AUTHORITY_SHA` constant and the CI workflow's checkout `ref`/`--authority-ref` arguments are therefore tightly coupled: changing one without the other would make the script fail in CI (the resolved ref would no longer match the pinned constant).

---

## 4. Approved Pinned Authority Commit

This gate explicitly adopts:

```text
henter36/nashir @ 04f54f8be852001173f4014cb2d81c5cdb97e35c
```

as **the** pinned authority commit for Backend Slice 0 contract validation going forward.

This value is already recorded as `EXPECTED_AUTHORITY_COMMIT` in `scripts/validate-contracts.mjs` (added by PR #7) and matches the `HEAD` of the local `henter36/nashir` checkout used to verify this gate. No script change is required to adopt it — adoption is being made explicit and durable through this gate document rather than left implicit in source code alone.

---

## 5. Cleanup Objectives

| Objective | Outcome |
|---|---|
| Confirm a single, explicit, documented pinned authority commit exists for Backend Slice 0 contract validation (`validate:contracts`) | Confirmed: `04f54f8be852001173f4014cb2d81c5cdb97e35c`, already present as `EXPECTED_AUTHORITY_COMMIT`, now also explicitly adopted by this gate |
| Determine whether `scripts/validate-contracts.mjs` requires any cleanup | No — it already pins the adopted commit, remains free of `child_process`, and its argument-parsing fail-closed behavior was already reviewed and confirmed in PR #8 (Gemini concern) |
| Determine whether `scripts/validate-contract-authority.mjs` should be reconciled to the same pinned commit ("prefer one clear source of authority SHA") | Investigated and **declined for this gate**: `PINNED_AUTHORITY_SHA` is tightly coupled to `.github/workflows/ci.yml`'s checkout `ref` and `--authority-ref` arguments. Reconciling the script's pin to `04f54f8b...` without also updating those two CI workflow lines would break the `validate:contract-authority` CI step (the checked-out ref would no longer match the pinned constant). Updating the CI workflow is hard-forbidden in this gate's approved scope, so no script change was made |
| Determine whether `package.json` script names or descriptions need clarification | No — `validate:contracts` and `validate:contract-authority` are distinctly named, map clearly to their respective scripts, and require no clarification |
| Avoid introducing any new dependency, network call, write path, or `child_process` usage in `validate-contracts.mjs` | Confirmed unchanged: no edits were made to either script or to `package.json` |

**Conclusion: no script or `package.json` edits were made.** The cleanup this gate performs is the explicit, documented adoption of `04f54f8be852001173f4014cb2d81c5cdb97e35c` as the Backend Slice 0 authority pin (Section 4) and the recorded explanation of why the second script's different, older pin is intentional-by-coupling rather than drift (Sections 3 and 7).

---

## 6. Allowed Files

The following files were in scope for this gate (edit permitted if necessary and safe):

- `docs/nashir_backend_slice_0_contract_validation_cleanup_authority_pin_gate.md` (created by this gate)
- `scripts/validate-contracts.mjs` (reviewed; no edit made — already correct)
- `scripts/validate-contract-authority.mjs` (reviewed; no edit made — reconciling its pin requires a forbidden CI workflow change)
- `package.json` (reviewed; no edit made — script names/descriptions already clear)

---

## 7. Forbidden Files

The following were not modified, and must not be modified by this gate:

- `src/app.ts` and any other backend route/source file
- `.github/workflows/ci.yml` or any CI workflow file
- any auth/RBAC implementation file
- any DB, SQL, migration, or ORM/database-config file
- any secrets or environment-config file
- any generated-client file or directory
- any file introducing a provider/model/prompt/tool/connector/publishing call
- any file introducing a new runtime dependency
- any deployment, production-readiness, or pilot-readiness file

---

## 8. Review Matrix

| # | Check | Finding | Result |
|---|---|---|---|
| 1 | A single, explicit pinned authority commit is adopted for Backend Slice 0 validation | `04f54f8be852001173f4014cb2d81c5cdb97e35c` is adopted in Section 4 and matches the existing `EXPECTED_AUTHORITY_COMMIT` in `scripts/validate-contracts.mjs` and the local authority checkout's current `HEAD` | PASS |
| 2 | `validate:contracts` exists and remains read-only | `package.json` defines `"validate:contracts": "node scripts/validate-contracts.mjs"`; the script's only imports remain `node:console`, `node:fs`, `node:path`, and `node:process`; no writes, no network calls | PASS |
| 3 | `validate-contracts.mjs` does not import `child_process` or `node:child_process` | Confirmed via source inspection — no such import exists; the script reads `.git/HEAD`, the symbolic ref, and `packed-refs` directly | PASS |
| 4 | `validate-contract-authority.mjs`'s different pinned commit is investigated, not silently left inconsistent | `PINNED_AUTHORITY_SHA = "36da9ed31903562bddfb7ffd669841956e334a51"` is confirmed to be an ancestor of the adopted `04f54f8b...` commit, and is shown to be tightly coupled to `.github/workflows/ci.yml`'s hardcoded checkout `ref` and `--authority-ref` values (lines 30 and 48) | PASS — documented, intentionally not changed |
| 5 | No script or `package.json` edit was made that could desynchronize CI | No edits were made to `scripts/validate-contracts.mjs`, `scripts/validate-contract-authority.mjs`, or `package.json`; `git status --short` shows only the new gate document | PASS |
| 6 | No CI workflow was added or modified | `.github/workflows/ci.yml` is untouched by this gate | PASS |
| 7 | No routes beyond `/health` exist | `src/app.ts` registers exactly one route, `app.get("/health", ...)` | PASS |
| 8 | No auth, DB, SQL, migrations, secrets, generated clients, provider/prompt/tool/connector/publishing code, or runtime dependencies were added | This gate added only a documentation file; no source, dependency, schema, or configuration file was changed | PASS |

---

## 9. Risk Review

| Risk | Finding | Control |
|---|---|---|
| Authority-pin drift / confusion risk | Two scripts pin two different `henter36/nashir` commits (`04f54f8b...` for `validate-contracts.mjs`, `36da9ed...` for `validate-contract-authority.mjs`), which could be mistaken for an unintentional inconsistency or "stale pin" | Documented explicitly in Sections 3 and 4: `04f54f8b...` is now the explicitly adopted Backend Slice 0 authority pin; `36da9ed...` is confirmed to be an intentional, older, CI-coupled pin used for a narrower, file-presence-focused authority check |
| CI-desynchronization risk | Changing `PINNED_AUTHORITY_SHA` in `validate-contract-authority.mjs` without also updating `.github/workflows/ci.yml`'s checkout `ref` and `--authority-ref` arguments would make the `validate:contract-authority` CI step fail (resolved ref would no longer equal the pinned constant) | This gate made no such change. Any future reconciliation of the two pins to a single commit must be planned as a combined script-and-CI change in a separate, explicitly scoped gate that is authorized to touch CI — outside this gate's hard-forbidden boundary |
| Hidden process-execution risk | `validate-contract-authority.mjs` uses `node:child_process` (`execFileSync`) | Confirmed this usage is restricted to read-only, local Git inspection commands (`git -C <repo> rev-parse ...`, `git -C <repo> cat-file -e ...`) with `stdio: ["ignore", "pipe", "pipe"]`; it performs no writes and spawns no other processes. This is unchanged by this gate and was not introduced by it |
| Scope-creep risk | A "cleanup" gate could be tempted to fix the pin mismatch by editing scripts and CI together | This gate explicitly declined to do so (Section 5) because CI changes are hard-forbidden in its approved scope; fixing the mismatch safely requires a combined change that this gate is not authorized to make |
| False-readiness risk | A merged cleanup/pin-confirmation gate could be misread as advancing toward implementation authorization | Section 10 (Non-Authorization Boundary) and Section 11 (GO/NO-GO) restate explicitly that this gate authorizes only limited validation cleanup and pin confirmation, not implementation |

---

## 10. Explicit Non-Authorization Boundary

This gate does not authorize, and must NOT be read as approving:

- backend implementation
- new routes beyond `/health`
- product API routes
- auth/RBAC implementation
- DB, SQL, migrations, ORM, database config
- secrets or environment config
- generated clients
- CI workflows (including reconciling the two authority-pin values, which requires a CI change)
- provider/model/prompt/tool/connector execution
- publishing
- runtime dependencies
- deployment
- production readiness
- pilot readiness

---

## 11. GO / NO-GO Decision

Decision: GO to limited contract validation cleanup and authority pin confirmation only. `04f54f8be852001173f4014cb2d81c5cdb97e35c` is explicitly adopted as the pinned `henter36/nashir` authority commit for Backend Slice 0 contract validation (Section 4), and the existing validation posture is confirmed clean with no necessary or safe script edits identified (Section 5).

NO-GO for backend implementation. NO-GO for product routes, auth, DB, SQL, migrations, generated clients, CI workflows, provider/model/prompt/tool execution, connector execution, publishing, runtime dependencies, deployment, production readiness, or pilot readiness.

---

## 12. Recommended Next Step

Open the next gate as a planning gate only:

```text
docs/nashir_backend_slice_0_minimal_implementation_planning_gate.md
```

That gate may plan the smallest safe implementation slice for Backend Slice 0. It must not write, scaffold, or merge any implementation code, and it must carry forward the same non-authorization boundary stated in Section 10 until a separate, explicit user decision authorizes moving from planning into implementation.

If the team later decides the two authority-pin values (`04f54f8b...` and `36da9ed...`) should be reconciled to a single commit, that reconciliation must be planned and executed as its own explicitly scoped gate that is authorized to change both `scripts/validate-contract-authority.mjs` and `.github/workflows/ci.yml` together — not as an extension of this gate or the planning gate above.
