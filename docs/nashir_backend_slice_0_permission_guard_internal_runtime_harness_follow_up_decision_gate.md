# Nashir Backend Slice 0 Permission Guard Internal Runtime Harness Follow-up Decision Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only follow-up decision gate |
| Authorization source | `docs/nashir_backend_slice_0_permission_guard_internal_runtime_harness_execution_review_gate.md` (PR #33) |
| PR #33 merge commit (execution review gate) | `d29871139e0a976f0bdb4423d73a59f3d77859c7` |
| PR #32 merge commit (execution gate) | `1b23ed0db4329549744fa515d39b357efe9dd309` |
| PR #31 merge commit (planning review gate) | `35215df1c70f55f01979aecc3893d5fb1e03b0bc` |
| PR #30 merge commit (planning gate) | `696d638b23662b4cf0982b6389521fba24493928` |
| PR #29 merge commit (primitive review gate) | `adca1485c6164e67b9d5483c37d730144df2a6eb` |
| PR #28 merge commit (permission guard primitive) | `31244d03c7f91e51dacdec19d80f4ec37ebb50e5` |
| Authority repository | `henter36/nashir` |
| Authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation, wiring, or runtime change of any kind |

---

## 1. Scope

PR #33's execution review gate confirmed all 15 criteria for PR #32 passed — the Backend Slice 0 Permission Guard Internal Runtime Harness is accepted as a diagnostic-only artifact and is on `main`. PR #33 recommended this follow-up decision gate to determine the shape of the next step.

This gate does two things: (1) confirms what Slice 0 did and did not authorize, and (2) selects exactly one of four possible forward paths and documents why the others were not selected at this time. It does not implement anything, authorize implementation of anything, or open any execution gate directly. It opens only the one documentation-only planning gate named in Section 12, and that gate must itself remain planning-only.

---

## 2. Inputs Reviewed

| Input | Use in this decision |
|---|---|
| `docs/nashir_backend_slice_0_permission_guard_internal_runtime_harness_execution_review_gate.md` (PR #33) | The authorization source for this gate — Section 13 specifies the four paths and the requirement to pick exactly one |
| `docs/nashir_backend_slice_0_permission_guard_internal_runtime_harness_execution_gate.md` (PR #32) | Documents what was built — the single opt-in harness route, the static fixture, the always-`200` response constraint, and the non-authorization boundary that carries forward |
| `src/app.ts` (current `main` HEAD, 197 lines) | Confirms the current implementation state: `evaluatePermissionGuard` has one call site (line 68, inside `permissionGuardHarnessHandler`); `STATIC_HARNESS_GRANTED_PERMISSIONS = Object.freeze(["harness.read", "harness.write"])` is the only `grantedPermissions` source in the runtime; no product routes, no auth provider, no DB, no broad enforcement |
| `src/permission-guard.ts` (current `main` HEAD, 108 lines) | The primitive this decision gate reasons about: `evaluatePermissionGuard(input: EvaluatePermissionGuardInput): PermissionGuardResult` — pure, zero imports, caller-supplied `grantedPermissions`, no built-in notion of where permissions come from |
| `src/request-context.ts` (current `main` HEAD) | The request-context shape that `evaluatePermissionGuard` adapts to its `requestContext` input: `RequestContext { workspaceId: string; actorId: string }` — the two identifiers that would eventually drive a real permission-source lookup |
| `tests/permission-guard-internal-runtime-harness.test.ts` (current `main` HEAD) | 9 passing tests — evidence that the harness is diagnostic-only (always `200`, no enforcement behavior, static fixture) |
| `tests/permission-guard.test.ts` (current `main` HEAD) | 11 passing tests — evidence that `evaluatePermissionGuard` is correct, pure, and convention-agnostic about permission string format |
| `docs/nashir_backend_slice_0_permission_guard_primitive_review_gate.md` (PR #29) | Section 7 documents the carried `ErrorCode` mismatch (`FORBIDDEN`/`NOT_FOUND` vs the authority's closed `lower.snake_case` enum); Section 8 documents the permission-string convention risk — both remain open and inform the selected path |

---

## 3. What Slice 0 Achieved

Slice 0 built and review-gated exactly two runtime artifacts:

**`evaluatePermissionGuard` (PR #28, reviewed PR #29)** — a pure, in-memory permission decision primitive:
- Zero imports, zero side effects, zero I/O
- Accepts: `requiredPermission: string`, `grantedPermissions: readonly string[]`, `requestContext: { workspaceId, actorId }`, optional `resourceWorkspaceId`, optional `disclosureMode`
- Returns: `PermissionGuardResult` — one of `allowed` (`ok: true`), `forbidden` (`ok: false`, 403 internal), or `not_found` (`ok: false`, 404 internal)
- Workspace-boundary mismatch checked before permission membership — prevents cross-workspace existence inference
- `grantedPermissions`/`actorId` never leaked in failure results (structural and behavioral guarantee)
- Convention-agnostic: accepts any opaque permission strings; imposes no naming convention of its own

**`GET /internal/permission-guard-harness/:requiredPermission` (PR #32, reviewed PR #33)** — a diagnostic route proving the wiring shape `requestContext -> evaluatePermissionGuard -> decision output`:
- Opt-in only: `enableInternalPermissionGuardHarnessRoutes?: boolean`, default `false`; `src/index.ts` calls `buildApp()` with no arguments — never registered in production
- Static fixture: `STATIC_HARNESS_GRANTED_PERMISSIONS = Object.freeze(["harness.read", "harness.write"])` — the only `grantedPermissions` source in the runtime codebase
- Always returns HTTP `200` with `{ ok: true, decision }` regardless of the decision value — explicitly diagnostic, not enforcement
- Never calls `createHttpErrorResponse` or any function from `src/error-model.ts`
- 9 passing tests prove: default-disabled behavior, opt-in exposure, 401 gate, all three decision paths at `200`, `grantedPermissions` non-leakage, no `ErrorModel` HTTP mapping

**Documentation gate sequence:** PR #28 → PR #29 review → PR #30 plan → PR #31 plan review → PR #32 implementation → PR #33 execution review. Each step was independently reviewed before the next was opened. The gate sequence is complete and all artifacts are on `main`.

---

## 4. What Slice 0 Intentionally Left Open

These are not defects or gaps — they are deliberate deferments, documented in the gate sequence and carried forward into this decision.

**`grantedPermissions` source — no real producer exists.** `evaluatePermissionGuard` is, by design, agnostic about where `grantedPermissions` comes from. It consumes a caller-supplied array and does nothing else. The harness supplies a frozen, static fixture. No service, database table, role resolver, token claim parser, or cache in this repository produces a real `grantedPermissions` value. The question of how `workspaceId` and `actorId` from `requestContext` would eventually map to a real set of granted permissions is the most significant open design question following Slice 0.

**`ErrorCode` authority mismatch — documented as PENDING ALIGNMENT.** `evaluatePermissionGuard` emits `code: "FORBIDDEN"` and `code: "NOT_FOUND"` (backend-local, `SCREAMING_SNAKE_CASE`). The authority's `henter36/nashir` OpenAPI contract defines a closed `ErrorCode` enum in `lower.snake_case`, dot-namespaced convention — closest analogues are `permission.denied`, `resource.not_found`, `workspace.not_found`. These are distinct string values and cannot be reconciled unilaterally by this repository. `docs/contract_reference.md` records this as `PENDING ALIGNMENT`. The harness never exposes these codes as real HTTP `ErrorModel` responses (always `200`) — so the mismatch is contained — but it must be addressed before `evaluatePermissionGuard` can be wired into real API responses.

**Permission-string convention — not settled.** The authority's `x-permission` annotations follow a `nashir.<resource>.<action>` convention (e.g., `nashir.products.read`, `nashir.content.approve`). The test suite uses illustrative fixtures (`"workspace:read"`, `"workspace.products.read"`, `"harness.read"`). Because `evaluatePermissionGuard` is convention-agnostic, no rework of the primitive is needed when the convention is formally adopted — but the convention itself has not been confirmed for this backend.

**No product routes, no real enforcement.** There is nothing for `evaluatePermissionGuard` to protect at runtime today — the repository has only `/health` and the two opt-in diagnostic harness routes. The question of how permission enforcement would eventually be applied to real product routes remains entirely deferred.

---

## 5. Non-Authorization Confirmations

This gate independently confirms the following from the current `main` state:

- The internal runtime harness is accepted as a **diagnostic-only** Slice 0 artifact. It is not permission enforcement. It does not protect any route. It cannot produce a real authorization decision that matters to any product feature. **Decision requirement 1: confirmed.**
- Neither the harness nor any other part of this repository constitutes broad runtime permission enforcement. `evaluatePermissionGuard` is called from one opt-in, default-disabled code path only. **Decision requirement 2: confirmed.**
- No product route exists in this repository. `src/app.ts` registers only `/health`, `WORKSPACE_ROUTE_HARNESS_ROUTE` (opt-in), and `PERMISSION_GUARD_HARNESS_ROUTE` (opt-in). No `app.post`/`put`/`delete`/`patch` registration exists. **Decision requirement 3: confirmed.**
- No auth provider implementation (token issuance, session management, identity-provider integration) exists or is authorized. **Decision requirement 4: confirmed.**
- No DB, SQL, migration, ORM, role storage, generated client, OpenAPI change, deployment, pilot readiness, or production readiness artifact was created by Slice 0, and none is authorized by this gate. **Decision requirement 5: confirmed.**

---

## 6. Four-Path Evaluation

### Path A — Stop here

**Description.** Declare Slice 0 permission guard work complete at the harness level. `evaluatePermissionGuard` and its diagnostic harness are on `main`, test-proven, and gate-reviewed. No further work within this gate sequence is needed.

**Arguments for.** The primitive is genuinely useful on its own — it can be called from tests, from future execution gates, or from a future auth integration directly, without any further Slice 0 preparation. Stopping avoids building ahead of a real need.

**Arguments against.** Stopping without a documented plan for the `grantedPermissions` source leaves the most important open design question entirely undocumented. A future contributor arriving at `evaluatePermissionGuard` with a mandate to "add auth" has no guidance on the expected design — the permission-source approach, convention, or alignment with the authority contract. That increases the risk that the next step (whenever it comes) begins without adequate design grounding. The cost of a documentation-only planning gate is low; the cost of a poorly-designed permission source wired to a pure, well-designed primitive is high.

**Verdict: Not selected.** The open `grantedPermissions` question has enough architectural consequence to warrant a planning document before implementation begins. Path C produces that document at documentation-only cost.

### Path B — Narrow harness hardening

**Description.** Add a tightly-scoped documentation or test follow-up — for example, a comment on the `if (enableInternalPermissionGuardHarnessRoutes === true)` block (which currently lacks the prose comment the workspace harness block has at lines 153–156), or a `disclosureMode` input validation guard, or additional edge-case tests.

**Arguments for.** The missing comment is a small cosmetic gap — the workspace harness registration block has four lines of explanatory comment; the permission-guard harness block has none. Symmetry and readability would be marginally improved.

**Arguments against.** PR #33 reviewed all 15 criteria and found no defect or material gap. The `enableInternalPermissionGuardHarnessRoutes` flag name is self-documenting. A hardening-only gate at this stage would consume review bandwidth without advancing any architectural question. Any comment could be added as part of the alignment planning gate's execution gate, if one is opened, rather than as a standalone change now. The identified gap (missing comment) is noted here and in this gate's Verification Commands — it does not require a dedicated gate.

**Verdict: Not selected.** No identified defect or test gap warrants a standalone hardening cycle. The comment note is recorded here for future reference.

### Path C — Request-context / permission-source alignment planning (selected)

**Description.** Open a documentation-only planning gate that addresses the most architecturally significant open question from Slice 0: how will `workspaceId` and `actorId` from `requestContext` eventually map to a caller-supplied `grantedPermissions` array in a real system? That planning gate would also address the permission-string convention question and the `ErrorCode` alignment path.

**Arguments for.** This is the natural next design question after proving the wiring shape. `evaluatePermissionGuard` is pure and correct — the only thing that prevents it from being used in real enforcement is the absence of a plan for its `grantedPermissions` input. A planning gate:
- costs nothing to implement (documentation only)
- produces the design constraints that any future auth/RBAC implementation gate would need
- addresses the three open questions (permission source, permission-string convention, `ErrorCode` alignment path) in a single, coherent document
- does not commit to any specific technology, provider, or timeline
- is strictly lower-risk than jumping to auth/RBAC implementation planning, which would pre-suppose answers to questions this gate would establish

The alignment between `requestContext { workspaceId, actorId }` and a real permission source is a foundational design decision. Getting it wrong would require rework of the call sites that produce `grantedPermissions`, the permission-string convention, and potentially `evaluatePermissionGuard`'s input type. Getting it right in a planning document first means the execution gate (if one follows) has a stable design to implement against.

**Arguments against.** A planning gate delays implementation. If the direction is already obvious (e.g., a specific role-storage design is already decided externally), a planning gate produces documentation for a foregone conclusion.

**Verdict: Selected.** The permission-source design question is not yet settled, the convention is not yet confirmed, and the `ErrorCode` alignment path is `PENDING`. A documentation-only planning gate directly addresses all three at low cost. See Section 12 for the precise scope of the recommended gate.

### Path D — Real auth/RBAC integration planning

**Description.** Open a planning gate for the first real authentication or RBAC integration — covering auth provider selection, token verification flow, role/permission storage design, `grantedPermissions` resolution lifecycle, OpenAPI `ErrorCode` alignment, and the multi-gate execution sequence that would eventually bring `evaluatePermissionGuard` to bear on real product routes.

**Arguments for.** This is ultimately the goal — real permission enforcement on real product routes. Getting there faster by planning it all now avoids multiple smaller gate cycles.

**Arguments against.** There are no product routes to protect. There is no auth provider. There is no token format. There is no role storage design. Jumping to full auth/RBAC integration planning before the permission-source design is established means planning a system that depends on unresolved design questions — the planning document would necessarily contain open questions that should have been resolved in a prerequisite alignment gate. The result would be an underspecified plan that increases the risk of scope creep when execution begins. Path C's alignment gate is the prerequisite for a well-grounded Path D.

**Verdict: Not selected now.** Path D is the logical successor to Path C — if the alignment planning gate reaches GO, the execution gate it authorizes may eventually evolve into full auth/RBAC integration planning. But Path D cannot be meaningfully scoped until Path C's questions are answered.

---

## 7. Risk Review

| Risk | Description | Control |
|---|---|---|
| **Premature RBAC integration** | Jumping from the diagnostic harness directly to implementing an auth provider, role storage, or real enforcement — before the permission-source design is documented — creates integration risk and makes the pure `evaluatePermissionGuard` primitive harder to test in isolation | The selected gate (Path C) is documentation-only. It produces a planning document that establishes design constraints *before* any implementation gate is opened. No implementation is authorized by this decision gate or by the planning gate it recommends. |
| **Fake security from static permissions** | A future contributor could observe that `evaluatePermissionGuard` is on `main` and callable, and conclude that permission enforcement "just needs a real permission source" — treating the harness fixture as proof of security rather than as a diagnostic scaffold | The harness always returns HTTP 200 with a `{ ok: true, decision }` envelope, making its diagnostic-only nature observable from the wire. Section 4 of this gate explicitly documents that no real permission source exists. Section 10 re-states that this gate authorizes no enforcement. The alignment planning gate (Path C) must document the gap between static fixtures and real permission sources as its first section. |
| **Permission-source ambiguity** | Without a documented design for how `grantedPermissions` is produced, multiple incompatible approaches may be prototyped in parallel (e.g., JWT claims, DB role tables, external policy services) before the design is settled | Path C directly addresses this: its planning gate must document the expected shape of the permission-source system and eliminate ambiguity before any implementation is authorized. |
| **Contract drift from authority** | `FORBIDDEN`/`NOT_FOUND` codes continue to diverge from the authority's closed `ErrorCode` enum (`permission.denied`, `resource.not_found`, `workspace.not_found`). Each implementation cycle that uses these codes without resolving the mismatch increases the eventual alignment cost. | The harness contains the mismatch inside a `200`-wrapped diagnostic body — it never surfaces as a real API response. The alignment planning gate (Path C) must include an explicit section on `ErrorCode` alignment as part of the permission-source design. Resolving the mismatch before any real enforcement is wired prevents it from compounding. |
| **Confusing diagnostic harness with production enforcement** | A future contributor (or stakeholder) seeing the harness route on `main` may believe that permission enforcement is "already in place," leading to a false sense of security or to incomplete enforcement being treated as sufficient | The always-`200` invariant and the `{ ok: true, decision }` envelope make the harness's non-enforcement nature observable. Section 4 of this gate and the alignment planning gate both explicitly state that no enforcement exists. The alignment gate's scope statement must list "confusing the harness with enforcement" as a primary motivation for the planning work. |

---

## 8. Explicit Non-Authorization Boundary

This decision gate does not authorize, and must NOT be read as approving, any of the following:

- broad or default-on runtime permission enforcement across any existing or future route
- wiring `evaluatePermissionGuard` into any call site other than `permissionGuardHarnessHandler`
- product routes of any kind
- an auth provider implementation (token issuance, session management, identity-provider integration)
- a role or permission inventory, role database, or grant-resolution service
- DB, SQL, migrations, ORM, or query-layer work of any kind
- generated clients
- OpenAPI or contract-document changes (including any attempt to resolve the `ErrorCode` mismatch unilaterally)
- secrets or environment-variable configuration
- mapping permission-guard failure results into live `ErrorModel` HTTP responses
- CI workflow changes
- deployment, pilot readiness, or production readiness of any kind
- **implementing any artifact described in the planning gate this decision recommends** — that planning gate is itself documentation-only, and its implementation (if any) requires a separate, explicitly-scoped execution gate and review gate

---

## 9. GO / NO-GO Decision

**Decision: GO** to a **Backend Slice 0 Request Context / Permission Source Alignment Planning Gate** — because:

- Slice 0's diagnostic harness is on `main`, review-accepted, and functionally complete as a diagnostic artifact. The wiring shape `requestContext -> evaluatePermissionGuard -> decision output` is proven and test-covered.
- The most consequential open question is the design of the `grantedPermissions` source. Before any real enforcement, role-storage, or auth-provider work begins, a documented design for how `workspaceId`/`actorId` from `requestContext` maps to a real permission set must exist.
- A documentation-only planning gate for this question costs nothing to build, eliminates the permission-source ambiguity risk identified in Section 7, and is the lowest-risk way to prepare the ground for any future real enforcement gate.
- Paths A, B, and D were each independently evaluated and not selected for the reasons stated in Section 6.
- All five non-authorization confirmations in Section 5 hold. This decision changes none of them.

**NO-GO** for, at this time and on the strength of this gate alone, everything in Section 8 above.

---

## 10. Recommended Next Step

**Backend Slice 0 Request Context / Permission Source Alignment Planning Gate** — a documentation-only gate that plans (does not implement) the design of the permission-source system.

That planning gate must:

- **Document the open design questions** established by Slice 0:
  - What system produces `grantedPermissions` at runtime? (DB role table? JWT claims? External policy service? A combination?)
  - What is the lookup key — `workspaceId`, `actorId`, or both? What is the expected cardinality (per-actor, per-workspace, per-actor-per-workspace)?
  - What is the expected latency and caching model, if any?

- **Address the permission-string convention** question:
  - The authority's `x-permission` annotations use `nashir.<resource>.<action>` (e.g., `nashir.products.read`). Is this the convention this backend will use?
  - If so, what is the enumerated set of permissions for Slice 0's initial product features?
  - Because `evaluatePermissionGuard` is convention-agnostic, no change to the primitive is expected — but the convention must be documented before it is used in fixtures, test data, or real enforcement.

- **Address the `ErrorCode` alignment path**:
  - `FORBIDDEN`/`NOT_FOUND` (backend-local, `SCREAMING_SNAKE_CASE`) vs. `permission.denied`/`resource.not_found`/`workspace.not_found` (authority enum, `lower.snake_case`)
  - The planning gate must document a proposed alignment path — not execute it, but propose whether it belongs to a later OpenAPI alignment gate, to the next major auth integration gate, or to a different cross-repository coordination step

- **Be explicitly documentation-only**: no `src/` change, no `tests/` change, no `package.json` change, no generated file, no migration, no deployment artifact

- **Carry forward, verbatim, this gate's Section 8 non-authorization boundary** into its own scope statement

- **Recommend GO only to** a further, narrowly-scoped planning or execution gate for whichever sub-question it resolves — not to a broad auth/RBAC implementation gate

---

## 11. Verification Commands

```bash
cd ~/workspace/nashir-backend

git fetch origin --quiet
git checkout main
git pull origin main

git log --oneline -8

npm run lint
npm run typecheck
npm test
NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts

# Confirm the current state: evaluatePermissionGuard has exactly one runtime call site
grep -n "evaluatePermissionGuard" src/app.ts src/index.ts

# Confirm static fixture is the only grantedPermissions source in runtime source
grep -n "STATIC_HARNESS_GRANTED_PERMISSIONS\|grantedPermissions" src/app.ts

# Confirm no product routes
grep -E -n "app\.(post|put|delete|patch)" src/app.ts

# Confirm both harness flags default-false (index.ts builds with no args)
grep -n "buildApp" src/index.ts

# Confirm the ErrorCode mismatch is still PENDING ALIGNMENT
grep -n "PENDING ALIGNMENT\|FORBIDDEN\|NOT_FOUND" docs/contract_reference.md 2>/dev/null || echo "check docs/contract_reference.md manually"

# Note: the workspace harness registration block (src/app.ts lines 153-158) has
# a four-line prose comment; the permission-guard harness block (lines 161-163)
# does not. This is cosmetic and non-blocking but can be addressed in the
# alignment planning gate's execution gate if one is authorized.
```
