# Nashir Backend Slice 0 Request Context / Permission Source Alignment Review Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only planning review gate |
| Authorization source | `docs/nashir_backend_slice_0_request_context_permission_source_alignment_planning_gate.md` (PR #35) |
| PR #35 merge commit (planning gate) | `edd3cc0c9e626d6d127e6835b9e333262d90c06e` |
| PR #34 merge commit (follow-up decision gate) | `c4bca191a7cd902566598791ced35eb95b5ec635` |
| Authority repository | `henter36/nashir` |
| Authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation, auth provider integration, database access, role storage, product routes, broad permission enforcement, generated clients, OpenAPI changes, SQL/migrations/ORM, or deployment of any kind |

---

## 1. Scope

PR #35 merged the Backend Slice 0 Request Context / Permission Source Alignment Planning Gate. That gate selected Model C (hybrid: token identity + DB permission resolution) as the intended target architecture for `grantedPermissions` production, documented the five-layer permission pipeline, and enumerated eight unresolved decisions and five risks.

This review gate independently verifies the planning gate against the same authority inputs, live source files, and the PR #35 commit record. It does not rely on the planning gate's own self-assessment. It produces a PASS/FAIL matrix and a GO / NO-GO decision.

---

## 2. Inputs Used for Independent Verification

| Input | How verified |
|---|---|
| `docs/nashir_backend_slice_0_request_context_permission_source_alignment_planning_gate.md` (PR #35) | Read in full — the primary artifact under review |
| `src/request-context.ts` (108 lines, `main` HEAD) | Read directly — verified `RequestContext` field set and absence of permission/role/token fields |
| `src/permission-guard.ts` (108 lines, `main` HEAD) | Read directly — verified input types, output variants, and convention-agnostic design |
| `src/app.ts` (197 lines, `main` HEAD) | Read directly — verified single `evaluatePermissionGuard` call site (line 68), static fixture (lines 30–33), no product routes (POST/PUT/DELETE/PATCH) |
| `src/index.ts` | Verified: `const app = buildApp();` — no harness flags active in production |
| `henter36/nashir` `docs/nashir_v1_openapi.yaml` (authority commit `04f54f8`) | Grepped directly — verified `ErrorCode` enum, guard chain annotations, `x-permission` convention, `bearerAuth` scheme language, `x-membership-check: non-disclosing` presence |
| `docs/contract_reference.md` | Read directly — verified `PENDING ALIGNMENT` record |
| `git show --stat edd3cc0` | Confirmed: exactly one file added (`docs/nashir_backend_slice_0_request_context_permission_source_alignment_planning_gate.md`, 351 insertions, 0 deletions elsewhere) |

---

## 3. Review Criteria and PASS/FAIL Matrix

### Criterion 1 — RequestContext fields accurately described

**What to verify:** The planning gate accurately describes `workspaceId`, `actorId`, caller-supplied HTTP headers, and the absence of cryptographic verification.

**Independent check:**

`src/request-context.ts` lines 5–7:
```typescript
export interface RequestContext {
  workspaceId: string;
  actorId: string;
}
```

Header constants (lines 1–3): `x-nashir-workspace-id`, `x-nashir-actor-id`. No `grantedPermissions`, `roleId`, `role`, `token`, `JWT`, or `bearer` field exists anywhere in `request-context.ts` — confirmed by grep.

`resolveRequestContextFromHeaders` accepts any non-blank string for either header. The `inspectHeader` function checks only for presence and non-blank (lines 38–62). No signature verification, no format check, no UUID validation.

**Planning gate claim (Section 3):** `workspaceId` and `actorId` from headers, presence/non-blank only, no cryptographic verification, no membership check, no role association, no permission derivation, no token backing.

**Finding:** Accurately described. All seven property rows in the planning gate's Section 3 table match the source.

**Result: PASS**

---

### Criterion 2 — Five-layer pipeline separation

**What to verify:** The planning gate clearly separates request identity, workspace scope, membership source, role source, permission resolution, and permission enforcement as distinct concerns.

**Independent check:**

Planning gate Section 5 defines six concerns:
1. Request identity — `actorId` header, no verification → **Absent**
2. Workspace scope — `workspaceId` header, no path/header alignment enforcement → **Partially present**
3. Membership source — no lookup, status model, or non-disclosing check → **Absent**
4. Role source — no role model, assignment, or storage → **Absent**
5. Permission resolution — `STATIC_HARNESS_GRANTED_PERMISSIONS` only → **Stub only**
6. Permission enforcement (`evaluatePermissionGuard`) — the note correctly separates this as complete, not one of the five upstream concerns

Each concern is independently grounded in the source. `src/request-context.ts` confirms layers 1 and 2. `src/app.ts` and the absence of any DB, ORM, or role module confirm layers 3–5. `src/permission-guard.ts` is isolated at layer 6.

**Finding:** All five upstream layers are correctly named, correctly distinguished, and grounded in the live codebase state. The note that `evaluatePermissionGuard` itself is a sixth downstream concern (already complete) is accurate and prevents confusion.

**Result: PASS**

---

### Criterion 3 — Authority guard chain correctly represented

**What to verify:** The planning gate correctly maps `authGuard → workspaceContextGuard → permissionGuard` from the authority contract.

**Independent check:**

Authority OpenAPI `x-security` annotations on workspace-scoped routes (e.g., `GET /workspaces/{workspaceId}/products`, line 92–95 of `nashir_v1_openapi.yaml`):
```yaml
security:
  - authGuard
  - workspaceContextGuard
  - permissionGuard
```
This three-guard ordered chain appears on every workspace-scoped route in the authority contract.

Planning gate Section 5 maps these guards to pipeline layers:
- `authGuard` = Layer 1 (request identity / token verification)
- `workspaceContextGuard` = Layers 2 + 3 (workspace scope + membership)
- `permissionGuard` = Layers 4 + 5 (role + permission resolution, then `evaluatePermissionGuard`)

Planning gate Section 7 decomposes future sub-problems using the same three guards explicitly.

**Finding:** The guard chain is correctly sourced from the authority contract and accurately mapped to the five pipeline layers.

**Result: PASS**

---

### Criterion 4 — Four candidate models evaluated

**What to verify:** All four models (A: token-derived, B: DB-derived, C: hybrid, D: static/dev-only) are evaluated, and each is assessed against security, testability, contract alignment, workspace isolation, future auth/RBAC integration, and risk of fake authorization.

**Independent check:**

Planning gate Section 6 evaluates all four models. The six evaluation criteria appear in every model's evaluation table:

| Model | Security | Testability | Contract alignment | Workspace isolation | Future auth/RBAC | Fake authorization risk |
|---|---|---|---|---|---|---|
| A | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| B | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| C | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| D | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Each model concludes with an explicit "Verdict" paragraph that states why it is or is not selected.

**Factual accuracy spot-checks:**

- Model A "no real-time membership validation": confirmed — authority says "workspace membership resolved and enforced server-side," which token claims cannot satisfy in real time.
- Model B "requires full DB schema, ORM, and migrations before any enforcement can be tested": confirmed — no DB exists in this repository.
- Model C: "Only model that satisfies all four authority contract requirements simultaneously" — confirmed: `bearerAuth` (token identity) + server-side membership enforcement + `x-membership-check: non-disclosing` + `x-permission` permission strings all require the combination of token identity and DB permission resolution.
- Model D: "already implemented as the harness static fixture" — confirmed (`STATIC_HARNESS_GRANTED_PERMISSIONS = Object.freeze(["harness.read","harness.write"])`, `src/app.ts` line 30).

**Finding:** All four models evaluated across all six criteria. Verdicts are factually grounded.

**Result: PASS**

---

### Criterion 5 — Model C recommended for defensible reasons, not treated as implementation authorization

**What to verify:** The planning gate recommends Model C with sound reasoning and explicitly does not authorize implementation of it.

**Independent check:**

Planning gate Section 7 states: "Documenting Model C as the target does not authorize its implementation — it establishes the design constraints so that when execution gates eventually open for the token layer, the membership layer, and the role/permission layer, they share a coherent architectural direction."

Planning gate Section 7's decomposition lists five sub-problems that must each be addressed in their own gate before real enforcement is possible. None of those sub-problems have an open gate or any authorized execution.

Planning gate Section 10 (non-authorization boundary) explicitly prohibits implementation of any component of Model C.

The rationale for recommending Model C over A, B, and D is independently verifiable:
- Model A alone: authority requires server-side membership resolution — token claims don't satisfy `x-membership-check: non-disclosing`
- Model B alone: authority requires bearer token identity (`authGuard` is not satisfied by header-only identity)
- Model D: no real authorization path, dev-only

**Finding:** Recommendation is defensible and grounded in the authority contract. Model C is documented as a design direction, not an implementation authorization.

**Result: PASS**

---

### Criterion 6 — Non-authorization boundary complete

**What to verify:** The planning gate explicitly does not authorize implementation, auth provider integration, database access, role storage, SQL/migrations/ORM, product routes, broad permission enforcement, generated clients, OpenAPI changes, environment/secrets config, deployment, pilot, or production readiness.

**Independent check against planning gate Section 10:**

| Prohibition | Present in Section 10 |
|---|---|
| Auth provider / token verification implementation | ✓ — "implementation of any auth provider, token issuer, or token verification mechanism" |
| Database schema / ORM / migration / SQL | ✓ — "implementation of any database schema, ORM, migration, or SQL for workspace membership or role storage" |
| Role-to-permission mapping implementation | ✓ — "implementation of any role-to-permission mapping or permission resolution service" |
| Wiring `evaluatePermissionGuard` beyond harness | ✓ — "wiring `evaluatePermissionGuard` into any call site other than the existing `permissionGuardHarnessHandler`" |
| `src/request-context.ts` changes | ✓ — explicitly listed |
| `src/permission-guard.ts` changes | ✓ — explicitly listed |
| Product routes | ✓ — "product routes of any kind" |
| Static harness fixture extension | ✓ — "any extension of the static harness fixture beyond its current use" |
| Generated clients | ✓ — "generated client changes" |
| OpenAPI / contract-document changes | ✓ — "OpenAPI or contract-document changes (including resolving the `ErrorCode` mismatch)" |
| Environment / secrets configuration | ✓ — "environment-variable or secrets configuration" |
| CI workflow changes | ✓ — "CI workflow changes" |
| Deployment / pilot / production readiness | ✓ — "deployment, pilot readiness, or production readiness" |
| Broad permission enforcement | Substantively covered — prohibiting product routes and prohibiting wiring `evaluatePermissionGuard` beyond the harness together prevent any broad enforcement; the exact phrase "broad permission enforcement" is not a standalone bullet. Noted — not a blocking gap. |

**Finding:** All enumerated prohibitions are present. The one minor note (exact phrase "broad permission enforcement" not a standalone line) is non-blocking given that the substance is covered by two other bullets.

**Result: PASS**

---

### Criterion 7 — Eight unresolved decisions explicitly tracked

**What to verify:** The planning gate tracks all eight specified unresolved decisions: canonical permission source, role-to-permission mapping location, workspace membership lookup source, `ErrorCode` alignment, authority repo synchronization path, token provider format, permission cache/no-cache posture, and non-disclosing 404/403 mapping behavior.

**Independent check against planning gate Section 8:**

| Required unresolved decision | Planning gate entry |
|---|---|
| Canonical permission source | "Canonical permission source" — documented |
| Role-to-permission mapping location | "Role-to-permission mapping location" — documented |
| Workspace membership lookup source | "Workspace membership lookup source" — documented |
| `ErrorCode` alignment | "ErrorCode alignment for permission failures" — documented; references `docs/contract_reference.md` `PENDING ALIGNMENT` |
| Authority repo synchronization path | "Authority repo synchronization path" — documented |
| Token provider format | "Bearer token format and provider" — documented; references authority deferral language |
| Permission cache or no-cache posture | "Membership resolution timing" — documented as "Is membership resolved once per request (synchronous lookup) or cached (stale membership risk)?" This is the permission/membership cache question — correctly recorded even if worded as a timing question. |
| Non-disclosing 404/403 mapping behavior | "`x-membership-check: non-disclosing` implementation" — documented; notes that `evaluatePermissionGuard`'s `not_found` path exists but membership non-disclosure is a distinct absent concern |

All eight unresolved decisions are present and accurately described.

**Finding:** All eight required unresolved decisions are tracked. Each is grounded in observable facts from the source or authority contract.

**Result: PASS**

---

### Criterion 8 — Risk review covers five required risks

**What to verify:** The planning gate's risk review covers premature RBAC integration, request context carrying too much authority, trusting client-supplied permissions, contract drift, and workspace boundary leakage.

**Independent check against planning gate Section 9:**

| Required risk | Present | Control documented |
|---|---|---|
| Premature RBAC integration | ✓ — "Premature RBAC integration" | This gate is documentation-only; no execution gate authorized until review gate reaches GO |
| Request context carrying too much authority | ✓ — "Request context carrying too much authority" | `src/request-context.ts` not modified; any extension requires its own execution gate |
| Trusting client-supplied permissions | ✓ — "Trusting client-supplied permissions" | `grantedPermissions` currently server-side only (static fixture); this invariant recorded as a design constraint |
| Contract drift | ✓ — "Contract drift" | `ErrorCode` mismatch contained within always-200 harness; future enforcement gates must not use `FORBIDDEN`/`NOT_FOUND` until alignment gate resolves mapping |
| Workspace boundary leakage | ✓ — "Workspace boundary leakage" | `evaluatePermissionGuard` already checks `resourceWorkspaceId` before permission membership; future enforcement must pass route `{workspaceId}` as `resourceWorkspaceId` |

**Finding:** All five required risks are present. Each control is grounded in the current codebase state or recorded as a binding design constraint for future gates.

**Result: PASS**

---

### Criterion 9 — No source/test/runtime/package/OpenAPI/SQL/generated/workflow files changed by PR #35

**Independent check:**

`git show --stat edd3cc0c9e626d6d127e6835b9e333262d90c06e` output:
```
1 file changed, 351 insertions(+)
docs/nashir_backend_slice_0_request_context_permission_source_alignment_planning_gate.md
```

No changes to `src/`, `tests/`, `package.json`, `pnpm-lock.yaml`, workflow files, OpenAPI files, generated files, SQL or migration files, or environment/secrets configuration.

**Finding:** PR #35 added exactly one file in `docs/`. Scope was clean.

**Result: PASS**

---

## 4. PASS/FAIL Summary

| # | Criterion | Result |
|---|---|---|
| 1 | RequestContext fields accurately described (`workspaceId`, `actorId`, headers, no verification) | PASS |
| 2 | Five-layer pipeline clearly separated (identity, workspace scope, membership, role, permission resolution) | PASS |
| 3 | Authority guard chain (`authGuard → workspaceContextGuard → permissionGuard`) correctly represented | PASS |
| 4 | All four candidate models evaluated across all six criteria | PASS |
| 5 | Model C recommended for defensible reasons; not treated as implementation authorization | PASS |
| 6 | Non-authorization boundary complete for all enumerated prohibitions | PASS |
| 7 | All eight unresolved decisions explicitly tracked | PASS |
| 8 | Risk review covers all five required risks with documented controls | PASS |
| 9 | PR #35 changed only the one permitted planning gate doc file | PASS |

**All 9 criteria: PASS**

---

## 5. Independent Observations

The following observations are recorded here to inform the next gate. They do not block GO.

**Observation A — `grantedPermissions` is never caller-supplied in any current code path.** This is the most important safety invariant established by Slice 0. `src/app.ts` line 70 passes `STATIC_HARNESS_GRANTED_PERMISSIONS` directly — not any value derived from request headers or query parameters. The planning gate records this as a design constraint for future execution gates (Section 9, Criterion 3 control). Any future execution gate that introduces a new `grantedPermissions` source must pass through its own review before reaching `main`.

**Observation B — The `ErrorModel` shape divergence is deeper than the `ErrorCode` mismatch alone.** The authority's `ErrorModel` requires `errorCode` (not `code`), `requestId` (not `correlationId`), `retryable` (boolean), and `status` (not `statusCode`). The backend's `createHttpErrorResponse` produces `{ code, message, statusCode, correlationId, details }`. Both the field names and the `code` vs `errorCode` naming differ. The planning gate's unresolved decision 4 records `ErrorCode` alignment; this review notes that full `ErrorModel` alignment involves field-name reconciliation beyond the error code string values alone. A future contract alignment gate will need to address both.

**Observation C — The `x-workspace-scope: route` annotation implies path-param-driven workspace scope.** The authority's `x-workspace-scope: route` on workspace-scoped routes (confirmed in the authority OpenAPI) indicates that the workspace identity for permission enforcement is expected to come from the route's `{workspaceId}` path parameter, not from a header. The current backend's `workspaceId` arrives via `x-nashir-workspace-id` header only — there are no workspace-scoped product routes yet, so no conflict exists today. But when product routes are eventually added, the alignment between path param and request context header will require an explicit design decision. The planning gate notes this in unresolved decision 8 ("Workspace path param vs. request context alignment"). Confirmed as a real gap.

---

## 6. Non-Authorization Boundary

This review gate does not authorize, and must NOT be read as approving, any of the following:

- implementation of any auth provider, token issuer, or token verification mechanism
- implementation of any database schema, ORM, migration, or SQL for workspace membership or role storage
- implementation of any role-to-permission mapping or permission resolution service
- wiring `evaluatePermissionGuard` into any call site other than the existing `permissionGuardHarnessHandler`
- changes to `src/request-context.ts`, `src/permission-guard.ts`, or any other source file
- product routes of any kind
- any extension of the static harness fixture
- generated client changes
- OpenAPI or contract-document changes (including resolving the `ErrorCode` mismatch or `ErrorModel` field alignment)
- environment-variable or secrets configuration
- CI workflow changes
- deployment, pilot readiness, or production readiness of any kind

---

## 7. GO / NO-GO Decision

**Decision: GO** to the **Backend Slice 0 Auth/RBAC Source-of-Truth Decision Gate** — because:

- All 9 review criteria pass.
- The planning gate accurately describes the current state of `requestContext`, the five pipeline layers, and the four candidate models.
- The authority guard chain is correctly sourced and mapped.
- Model C is recommended with defensible reasoning grounded in the authority contract; it is explicitly documented as a design direction only, not an implementation authorization.
- All eight unresolved decisions are tracked with enough precision that a future execution gate can address each one without relitigating the architecture.
- All five risks are documented with controls that are observable in the current codebase.
- PR #35 changed only the one permitted file.

**NO-GO** for everything listed in Section 6 above.

---

## 8. Recommended Next Gate

**Backend Slice 0 Auth/RBAC Source-of-Truth Decision Gate** — a documentation-only gate that decides, from the design direction established by the planning gate, the precise order in which the five pipeline sub-problems will be addressed.

That gate must:

- Use the planning gate's Section 7 decomposition (five sub-problems in approximate dependency order: auth token format, workspace membership model, role and permission model, `ErrorCode` alignment, permission-string convention adoption) as the input set
- Decide which sub-problem to address first and why
- Confirm that the `grantedPermissions`-never-from-client invariant is carried forward as a binding constraint into any execution gate it recommends
- Address Observation B from this review (full `ErrorModel` alignment is wider than `ErrorCode` strings alone) in the context of the ordering decision
- Be explicitly documentation-only
- Not open an execution gate directly — recommend at most one narrowly-scoped documentation-only planning gate for the selected first sub-problem
- Carry forward this gate's Section 6 non-authorization boundary verbatim

---

## 9. Verification Commands

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

# Confirm PR #35 changed only the planning gate doc
git show --stat edd3cc0c9e626d6d127e6835b9e333262d90c06e

# Confirm RequestContext has only workspaceId and actorId
grep -n "interface RequestContext" src/request-context.ts
grep -n "grantedPermissions\|roleId\|token\|JWT\|bearer" src/request-context.ts

# Confirm evaluatePermissionGuard has exactly one runtime call site
grep -n "evaluatePermissionGuard" src/app.ts src/index.ts

# Confirm grantedPermissions is never sourced from request headers
grep -n "grantedPermissions" src/app.ts

# Confirm no product routes
grep -E -n "app\.(post|put|delete|patch)" src/app.ts

# Confirm ErrorCode mismatch still PENDING ALIGNMENT
grep -n "PENDING ALIGNMENT" docs/contract_reference.md

# Confirm authority ErrorCode enum and bearerAuth deferred language
grep -A 4 "bearerAuth:" ../nashir/docs/nashir_v1_openapi.yaml
```
