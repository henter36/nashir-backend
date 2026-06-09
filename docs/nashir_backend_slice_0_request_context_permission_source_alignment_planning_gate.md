# Nashir Backend Slice 0 Request Context / Permission Source Alignment Planning Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only planning gate |
| Authorization source | `docs/nashir_backend_slice_0_permission_guard_internal_runtime_harness_follow_up_decision_gate.md` (PR #34) |
| PR #34 merge commit (follow-up decision gate) | `c4bca191a7cd902566598791ced35eb95b5ec635` |
| PR #33 merge commit (execution review gate) | `d29871139e0a976f0bdb4423d73a59f3d77859c7` |
| PR #32 merge commit (execution gate) | `1b23ed0db4329549744fa515d39b357efe9dd309` |
| Authority repository | `henter36/nashir` |
| Authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation, wiring, database access, auth provider integration, role storage, product routes, broad permission enforcement, generated clients, OpenAPI changes, SQL/migrations/ORM, or deployment of any kind |

---

## 1. Scope

PR #34's follow-up decision gate selected Path C — this planning gate — as the lowest-risk next step after Slice 0's diagnostic harness was accepted on `main`. The authorization source required this gate to:

- Document the current `requestContext` fields and their source
- Define what information is missing to derive real `grantedPermissions`
- Distinguish the five layers of the permission pipeline: request identity, workspace scope, membership source, role source, and permission resolution
- Evaluate four candidate permission-source models
- Recommend exactly one next direction
- Identify unresolved decisions and risks
- Produce a GO / NO-GO decision and recommend the next gate

This gate reaches a GO. It does not open an execution gate. The next step it recommends is a documentation-only review gate that independently verifies this planning document.

---

## 2. Inputs Reviewed

| Input | Purpose |
|---|---|
| `docs/nashir_backend_slice_0_permission_guard_internal_runtime_harness_follow_up_decision_gate.md` (PR #34) | Authorization source — Section 10 specifies what this gate must address |
| `src/request-context.ts` (108 lines) | Defines `RequestContext`, `resolveRequestContextFromHeaders`, header constants; the current source of `workspaceId` and `actorId` at runtime |
| `src/permission-guard.ts` (108 lines) | Defines `evaluatePermissionGuard` and its input/output types; the pure primitive that consumes `grantedPermissions` from its caller |
| `src/app.ts` (197 lines) | Confirms: one call site for `evaluatePermissionGuard` (line 68, inside the opt-in harness handler); `STATIC_HARNESS_GRANTED_PERMISSIONS = Object.freeze(["harness.read","harness.write"])` is the only runtime `grantedPermissions` source; no product routes |
| `tests/permission-guard.test.ts` | 11 passing tests — confirms `evaluatePermissionGuard` is convention-agnostic; accepts any opaque permission strings |
| `tests/request-context-plumbing.test.ts` | 23 passing tests — confirms request context is resolved from raw headers at the `onRequest` hook; headers are not cryptographically verified |
| `henter36/nashir` `docs/nashir_v1_openapi.yaml` (authority commit `04f54f8`) | Defines: `ErrorCode` closed enum (`lower.snake_case`, dot-namespaced); `ErrorModel` shape (`errorCode`, `message`, `requestId`, `retryable`, `status`); `bearerAuth` security scheme ("provider and token format deferred to a later authorized auth implementation planning gate; workspace membership resolved and enforced server-side"); guard chain annotations (`authGuard`, `workspaceContextGuard`, `permissionGuard`); `x-permission` convention (`nashir.<resource>.<action>`); `x-membership-check: non-disclosing` on all workspace-scoped routes |
| `docs/contract_reference.md` | Records `OpenAPI/Auth/RBAC/Workspace Identity alignment: PENDING ALIGNMENT` |
| `docs/nashir_backend_slice_0_permission_guard_primitive_review_gate.md` (PR #29) | Section 7: carried `ErrorCode` mismatch; Section 8: permission-string convention not settled |

---

## 3. Current Request Context: Fields and Source

`src/request-context.ts` defines:

```typescript
export interface RequestContext {
  workspaceId: string;  // from header: x-nashir-workspace-id
  actorId: string;      // from header: x-nashir-actor-id
}
```

At runtime, `resolveRequestContextFromHeaders` reads `x-nashir-workspace-id` and `x-nashir-actor-id` from the incoming HTTP request headers. If either header is absent or blank, the `onRequest` hook in `src/app.ts` rejects the request with HTTP `401 REQUEST_CONTEXT_REQUIRED` before the route handler is reached.

**Current properties of these values:**

| Property | Current state |
|---|---|
| Source | Caller-supplied HTTP headers |
| Format validation | Presence and non-blank only — no format, UUID, or length constraint |
| Cryptographic verification | None — any value that is non-blank is accepted |
| Workspace membership check | None — `workspaceId` is accepted without verifying that `actorId` is an active member |
| Role association | None — no role is resolved from `actorId` or `workspaceId` |
| Permission derivation | None — `grantedPermissions` is not produced from these values; the harness uses a static fixture |
| Token backing | None — there is no bearer token, JWT, or session token associated with the request context |

The request context is therefore an **unverified identity and workspace claim pair**. It is sufficient to route requests and pass values to `evaluatePermissionGuard`, but it carries no guarantee that the caller has any actual relationship to the identified workspace or that the actor exists.

---

## 4. What Is Missing to Derive Real `grantedPermissions`

`evaluatePermissionGuard` accepts `grantedPermissions: readonly string[]` from its caller. It does not know or care where those strings come from. The caller is entirely responsible for supplying an accurate set of permissions for the `(actorId, workspaceId)` pair.

To produce real `grantedPermissions` from `(workspaceId, actorId)`, the following questions must be answered — and none of them are currently answered anywhere in this repository:

| Missing element | Question |
|---|---|
| **Actor identity verification** | Is `actorId` cryptographically verified as belonging to the request originator, or is it a self-asserted header value? |
| **Workspace membership** | Is `actorId` an active member of `workspaceId`? What membership statuses exist (active, invited, suspended)? |
| **Role assignment** | What role (or roles) does `actorId` hold within `workspaceId`? Where is role-to-actor assignment stored? |
| **Permission mapping** | What permissions does that role grant? How is the role → `nashir.<resource>.<action>[]` mapping stored and versioned? |
| **Membership resolution timing** | Is membership resolved once per request (synchronous lookup) or cached (stale membership risk)? |
| **Permission-string convention** | Are permissions `nashir.<resource>.<action>` strings matching the authority's `x-permission` annotations? Or a different scheme? |
| **Workspace path vs. context alignment** | For workspace-scoped routes like `GET /workspaces/:workspaceId/products`, does the route's `workspaceId` path param need to match the request context's `workspaceId`? Who enforces that? |

Until all of these are answered, any call to `evaluatePermissionGuard` in a real enforcement context is unsafe — because the `grantedPermissions` array it receives could be fabricated, stale, or derived from an unverified identity.

---

## 5. The Five-Layer Permission Pipeline

The authority contract's guard chain annotation (`authGuard` → `workspaceContextGuard` → `permissionGuard`) corresponds to five distinct pipeline concerns that must each be addressed before real enforcement is possible. This gate defines them explicitly so they can be reasoned about separately:

| Layer | Description | Current state |
|---|---|---|
| **1. Request identity** | Who is making the request? The caller's cryptographically verified identity — not a self-asserted header value. | **Absent.** `actorId` is a caller-supplied header with no verification. The `bearerAuth` scheme in the authority contract is declared but its provider and token format are deferred. |
| **2. Workspace scope** | Which workspace is this request scoped to? For workspace-scoped routes, the workspace is the path parameter `{workspaceId}`. | **Partially present.** `workspaceId` arrives via the `x-nashir-workspace-id` header and is carried in `requestContext`. On workspace-scoped routes the path param would also supply it, but this backend has no workspace-scoped product routes yet. No alignment between header and path param is enforced. |
| **3. Membership source** | Is the identified actor an active member of the identified workspace? What is their membership status? The authority marks all workspace-scoped routes `x-membership-check: non-disclosing` — a non-member must receive the same response as an actor without the required permission (not a membership-revealing 401). | **Absent.** No membership lookup, status model, or non-disclosing check exists. |
| **4. Role source** | What role does the active member hold in this workspace? The role determines which permissions are granted. The role-to-actor mapping must be authoritative and server-side. | **Absent.** No role model, role assignment, or role storage exists. |
| **5. Permission resolution** | Given the actor's role, produce a `grantedPermissions: string[]` array. Permissions follow the `nashir.<resource>.<action>` convention in the authority's `x-permission` annotations. | **Stub only.** `STATIC_HARNESS_GRANTED_PERMISSIONS = ["harness.read","harness.write"]` is the only runtime source — a frozen diagnostic fixture with no relationship to real permissions. |

> Note: there is a sixth concern — **permission enforcement** — which is `evaluatePermissionGuard` itself. That layer is complete and test-proven (Slice 0). This gate reasons about the five upstream layers that feed it.

---

## 6. Candidate Permission-Source Models

Four candidate approaches to producing real `grantedPermissions` are evaluated here. These candidates are not mutually exclusive in the long term — the recommended direction is a hybrid — but they are evaluated individually to surface trade-offs clearly.

### Model A — Token-derived permissions

**Description.** The bearer token (JWT) issued by the auth provider contains `grantedPermissions` (or roles) as claims. The backend verifies the token signature, extracts the claims, and passes them directly to `evaluatePermissionGuard`. `workspaceId` and `actorId` would also be token claims rather than (or in addition to) headers.

**Evaluation:**

| Criterion | Assessment |
|---|---|
| **Security** | Depends entirely on token issuance being correct and on robust signature verification. If the token issuer is not controlled or key rotation is not implemented, a forged token grants any permissions. No real-time membership validation — a suspended member's token remains valid until expiry. |
| **Testability** | Excellent for unit/integration tests — a test token can be signed with a test key, or the token verification layer can be mocked. No DB required for unit tests. |
| **Contract alignment** | Partially aligned. The authority's `bearerAuth` scheme uses HTTP bearer tokens, but explicitly defers the provider and token format. The authority also says "workspace membership is resolved and enforced server-side" — token-embedded permissions do not satisfy this for real-time membership changes. |
| **Workspace isolation** | Moderate. The token must be workspace-scoped, or the backend must validate that the token's workspace claim matches the route's `{workspaceId}`. Requires careful token design to prevent cross-workspace permission bleed. |
| **Future auth/RBAC integration** | Common in microservice architectures with JWTs from an identity provider. Works well if token rotation, expiry, and revocation are managed. |
| **Risk of fake authorization** | High if: (a) the token signing key is weak or test-only keys persist in production; (b) stale permissions in long-lived tokens allow suspended members to act; (c) token claim format is never validated against the authority's `x-permission` convention. |

**Verdict on A:** A valid long-term component (bearer token identity is required by the authority contract), but insufficient alone — the authority explicitly requires server-side membership resolution. Permissions alone in the token do not satisfy `x-membership-check: non-disclosing`.

### Model B — DB-derived workspace membership and role resolution

**Description.** The backend queries a database for each request to:
1. Verify the actor's active membership status in the workspace
2. Look up the actor's role in the workspace
3. Resolve the role's permissions using a stored role → permission mapping

No permissions are in the token; the token provides only verified identity. `grantedPermissions` is produced entirely server-side.

**Evaluation:**

| Criterion | Assessment |
|---|---|
| **Security** | Very strong. Server-side authority — no client can forge membership, role, or permissions. Membership status is real-time; a suspended actor is denied immediately. |
| **Testability** | Requires DB fixtures or ORM test wrappers. Integration tests must seed membership and role data. Unit-testing the permission-guard primitive independently (as today) remains possible — the DB lookup is upstream of `evaluatePermissionGuard`. |
| **Contract alignment** | Strong alignment with "workspace membership resolved and enforced server-side." The membership tag model and role-to-permission mapping belong here. |
| **Workspace isolation** | Very strong — workspace membership is per-workspace; the DB query is naturally workspace-scoped. |
| **Future auth/RBAC integration** | Natural fit for multi-tenant SaaS; role tables and membership tables are standard patterns. But requires a full DB schema, ORM, and migrations before any enforcement can be tested. |
| **Risk of fake authorization** | Low once implemented. High during the transition if test fixtures substitute for real membership data in non-test environments. |

**Verdict on B:** Strongly aligned with the authority contract and the correct long-term design for membership enforcement. Cannot be implemented without DB, migrations, and ORM — all of which are outside the scope of any current gate.

### Model C — Hybrid: token identity + DB permission resolution (recommended direction)

**Description.** The bearer token provides cryptographically verified `actorId` (and nothing else about permissions). The backend then uses `(actorId, workspaceId)` to query the DB for:
1. Active membership status (with non-disclosing behavior for non-members)
2. Role assignment
3. Permission resolution from the role

`grantedPermissions` is produced server-side; the token provides only the verified identity that drives the lookup.

**Evaluation:**

| Criterion | Assessment |
|---|---|
| **Security** | Strongest model. Token-verified identity prevents identity spoofing. Server-side membership and role resolution prevents stale-permission attacks. Non-disclosing membership check prevents workspace existence inference via error-code differences. |
| **Testability** | Integration tests require both token mocking and DB fixture seeding. Unit tests for `evaluatePermissionGuard` remain pure and DB-free. The token verification layer and the DB permission resolver can be tested independently. |
| **Contract alignment** | Best alignment. `bearerAuth` supplies verified identity; "workspace membership resolved and enforced server-side" is satisfied by DB lookup; `x-membership-check: non-disclosing` is satisfiable by the non-disclosing check at layer 3; `x-permission: nashir.<resource>.<action>` strings are produced by the role → permission mapping. |
| **Workspace isolation** | Strongest. The route `{workspaceId}` path parameter drives the membership lookup; the token cannot assert workspace scope. |
| **Future auth/RBAC integration** | This is the canonical architecture for multi-tenant SaaS authorization. Aligns with the authority contract's guard chain. |
| **Risk of fake authorization** | Low once implemented. Risks are primarily transitional (test keys in production, test fixture membership records leaking to production). Addressed by keeping test-only harness flags (`enableInternalPermissionGuardHarnessRoutes`) off-by-default. |

**Verdict on C:** The correct long-term design. It cleanly maps to the authority's guard chain (`authGuard` = token verification; `workspaceContextGuard` = route workspace validation + membership check; `permissionGuard` = `evaluatePermissionGuard` with DB-resolved permissions). This model cannot be implemented without both an auth provider and a DB — both are deferred to future gates. This planning gate documents it as the **intended target** without authorizing any implementation.

### Model D — Temporary static / dev-only permission source

**Description.** A controlled, opt-in mechanism (similar to the existing harness flags) supplies a fixed or environment-configurable set of `grantedPermissions` per actor or globally. Intended only for local development and integration test scaffolding — not for production.

**Evaluation:**

| Criterion | Assessment |
|---|---|
| **Security** | No real security — this is explicitly a fake authorization mechanism. Any request with the right header or env-var configuration is granted arbitrary permissions. |
| **Testability** | Excellent — this is what the current `STATIC_HARNESS_GRANTED_PERMISSIONS` fixture already provides for the harness tests. |
| **Contract alignment** | None relevant. This is a test scaffold, not a real permission source. |
| **Workspace isolation** | Can be implemented to respect workspace scope (the harness already does via the `requestContext` workspace boundary check) but provides no real isolation. |
| **Future auth/RBAC integration** | Transitional only — no forward path to a real permission source. |
| **Risk of fake authorization** | Very high if it persists beyond test/dev. A development permission source that is "temporarily" wired to real routes is indistinguishable from no authorization at all. |

**Verdict on D:** Already implemented as the harness static fixture. Appropriate for the harness and for integration test scaffolding. Not a candidate for any real enforcement path. Its presence must always be gated by an opt-in flag (`=== true` strict equality check) with default `false`, as established by Slice 0. This gate does not authorize extending or exporting this model beyond the existing harness.

---

## 7. Recommended Direction

**Recommended direction: Model C (hybrid: token identity + DB permission resolution)** as the intended target architecture.

Rationale:
- Model C is the only model that satisfies all four authority contract requirements simultaneously: bearer token identity (`authGuard`), server-side workspace membership with non-disclosing behavior (`workspaceContextGuard` + `x-membership-check: non-disclosing`), and permission-string-based enforcement (`permissionGuard` + `x-permission: nashir.<resource>.<action>`).
- Model A alone is insufficient because the authority requires server-side membership resolution.
- Model B alone is insufficient because the authority uses bearer token identity (Layer 1 must be token-based).
- Model D is appropriate only as a dev/test scaffold (already implemented as the static harness fixture) and must never be the real enforcement path.
- Documenting Model C as the target does not authorize its implementation — it establishes the design constraints so that when execution gates eventually open for the token layer, the membership layer, and the role/permission layer, they share a coherent architectural direction.

**Decomposition into future gate-able sub-problems:**

The following sub-problems must each be addressed in their own narrowly-scoped gate before real enforcement is possible. They are listed in approximate dependency order:

1. **Auth token format and verification** — what is the bearer token format? What is the provider? How is the signature verified? This is the `authGuard` layer. The authority defers this to "a later authorized auth implementation planning gate."

2. **Workspace membership model** — what does the membership table look like? What statuses exist (active, invited, suspended)? How does the workspace membership lookup work given `(actorId, workspaceId)`? How is `x-membership-check: non-disclosing` satisfied? This is the `workspaceContextGuard` layer.

3. **Role and permission model** — what roles exist? How is role assignment stored? How does the role → `nashir.<resource>.<action>[]` mapping work? This is the data model underlying `permissionGuard`.

4. **`ErrorCode` alignment** — `evaluatePermissionGuard` emits `FORBIDDEN`/`NOT_FOUND` (`SCREAMING_SNAKE_CASE`); the authority uses `permission.denied`/`resource.not_found` (`lower.snake_case`). This must be aligned before any `PermissionGuardResult` can be mapped to a real HTTP `ErrorModel` response. This belongs to a later OpenAPI/contract alignment gate.

5. **Permission-string convention adoption** — the `nashir.<resource>.<action>` convention is used in the authority's `x-permission` annotations but is not yet confirmed in this backend's test fixtures or implementation. Once confirmed, no change to `evaluatePermissionGuard` is required (it is convention-agnostic), but fixtures and real enforcement call sites must use the canonical strings.

None of these sub-problems are authorized by this gate.

---

## 8. Unresolved Decisions

| Decision | Status | Notes |
|---|---|---|
| **Canonical permission source** | Unresolved | This gate documents Model C as the intended target direction. The specific implementation (token provider, DB schema, role model) is not settled and requires future gates. |
| **Role-to-permission mapping location** | Unresolved | Where is the `role → nashir.<resource>.<action>[]` mapping stored? Options: hardcoded in a service layer, stored in the DB, or derived from a policy file. Each has different update and versioning implications. |
| **Workspace membership lookup source** | Unresolved | The membership table schema, status model (active/invited/suspended), and lookup interface are not defined in this repository. The authority contract implies server-side resolution but does not specify the storage shape. |
| **`ErrorCode` alignment for permission failures** | Pending alignment — documented in `docs/contract_reference.md` | Backend-local: `FORBIDDEN` (403), `NOT_FOUND` (404). Authority enum: `permission.denied`, `resource.not_found`, `workspace.not_found`. These must be aligned before real `ErrorModel` responses are produced for permission failures. Resolution belongs to a future OpenAPI/contract alignment gate. |
| **Authority repo synchronization path** | Unresolved | The authority's `x-permission` annotations define the canonical permission strings. This backend must adopt those strings. A future cross-repository coordination step (or a separate alignment gate) must confirm the convention and enumerate the permission set for V1 routes. |
| **Bearer token format and provider** | Deferred by authority | The authority's `bearerAuth` scheme explicitly defers the provider and token format. This cannot be resolved in this repository alone. |
| **`x-membership-check: non-disclosing` implementation** | Unresolved | `evaluatePermissionGuard` already implements the `not_found` path for permission failures in `non_disclosing` mode. But membership non-disclosure (returning `not_found` rather than `forbidden` for a non-member) is a separate concern that does not exist in the current codebase. |
| **Workspace path param vs. request context alignment** | Unresolved | For routes like `GET /workspaces/:workspaceId/products`, the `{workspaceId}` path param must match the request context's `workspaceId`. Who enforces this, and when (in `workspaceContextGuard`, in route handler, or in `evaluatePermissionGuard`'s `resourceWorkspaceId` param)? |

---

## 9. Risk Review

| Risk | Description | Control |
|---|---|---|
| **Premature RBAC integration** | An execution gate is opened for DB-based role storage or auth provider integration before the permission-source design is reviewed and stabilized. Premature RBAC implementation tends to produce tightly-coupled, hard-to-test authorization logic that diverges from the authority contract. | This gate is documentation-only. The recommended next gate is a review-only gate. No execution gate for auth, DB, or role storage is authorized until after the review gate reaches GO and recommends one explicitly. |
| **Request context carrying too much authority** | A future change introduces additional fields to `RequestContext` (e.g., `grantedPermissions: string[]`, `roleId: string`) — making the request context a permission source rather than just an identity/scope claim. This creates client-controlled authorization. | `src/request-context.ts` is not modified by this gate. Any change to add permission or role fields to `RequestContext` would represent a significant architectural decision requiring its own execution gate and review. The current shape (`workspaceId`, `actorId` only) should be treated as stable unless a gate explicitly authorizes its extension. |
| **Trusting client-supplied permissions** | A temporary implementation passes `grantedPermissions` in a header or query parameter (analogous to the current `workspaceId` / `actorId` header pattern) to allow early testing — and that pattern persists beyond its intended scope. | The current harness uses a static server-side fixture — `grantedPermissions` is never caller-supplied. The only runtime call site for `evaluatePermissionGuard` (line 68, `src/app.ts`) uses the frozen fixture. This invariant must be preserved: `grantedPermissions` must always be produced server-side. This gate records this as a design constraint for all future execution gates. |
| **Contract drift** | `FORBIDDEN`/`NOT_FOUND` error codes accumulate more call sites before the `ErrorCode` alignment with the authority is resolved. Each additional call site that uses these backend-local codes increases the alignment cost. | The `ErrorCode` mismatch is currently contained within the always-200 harness diagnostic body — it is not surfaced in real `ErrorModel` HTTP responses. Section 7, unresolved decision 4 explicitly records this as requiring a future alignment gate. Future execution gates that produce real HTTP error responses for permission failures must not use `FORBIDDEN`/`NOT_FOUND` until the alignment gate resolves the mapping. |
| **Workspace boundary leakage** | A permission enforcement implementation fails to check that the route's `{workspaceId}` matches the actor's workspace scope — allowing a request for workspace A to succeed if the actor has sufficient permission in workspace B. | `evaluatePermissionGuard` already checks `resourceWorkspaceId` vs. `requestContext.workspaceId` (Section 5, Layer 2 of the current primitive implementation). The workspace-boundary check runs before permission membership check. Future execution gates that wire real enforcement must pass `resourceWorkspaceId` from the route path parameter — this is a non-negotiable constraint documented here. |

---

## 10. Non-Authorization Boundary

This planning gate does not authorize, and must NOT be read as approving, any of the following:

- implementation of any auth provider, token issuer, or token verification mechanism
- implementation of any database schema, ORM, migration, or SQL for workspace membership or role storage
- implementation of any role-to-permission mapping or permission resolution service
- wiring `evaluatePermissionGuard` into any call site other than the existing `permissionGuardHarnessHandler` in `src/app.ts`
- changes to `src/request-context.ts` (adding role, permission, or token fields to `RequestContext`)
- changes to `src/permission-guard.ts` (changing the input/output types of `evaluatePermissionGuard`)
- product routes of any kind
- any extension of the static harness fixture beyond its current use in `permissionGuardHarnessHandler`
- generated client changes
- OpenAPI or contract-document changes (including resolving the `ErrorCode` mismatch)
- environment-variable or secrets configuration
- CI workflow changes
- deployment, pilot readiness, or production readiness of any kind

The recommended next gate is a documentation-only review gate. Any subsequent execution gate requires its own explicit, narrowly-scoped authorization.

---

## 11. GO / NO-GO Decision

**Decision: GO** to the **Backend Slice 0 Request Context / Permission Source Alignment Review Gate** — because:

- The five layers of the permission pipeline are now clearly defined and documented: request identity, workspace scope, membership source, role source, and permission resolution.
- Four candidate permission-source models have been evaluated. Model C (hybrid: token identity + DB permission resolution) is identified as the intended target direction, with explicit reasoning for why Models A, B, and D are insufficient or inappropriate as standalone approaches.
- Eight unresolved decisions have been enumerated and scoped, so future execution gates can address each one without relitigating the architecture.
- Five risks have been identified and their controls stated.
- The non-authorization boundary carries forward and extends the boundary from the follow-up decision gate.

**NO-GO** for any artifact, change, or implementation described in Section 10 above.

---

## 12. Recommended Next Gate

**Backend Slice 0 Request Context / Permission Source Alignment Review Gate** — a documentation-only review gate that independently verifies this planning document against the same authority inputs used here.

That review gate must:

- Independently verify (do not rely on this gate's own self-assessment) that the five pipeline layers are correctly identified against `src/request-context.ts`, `src/permission-guard.ts`, and the authority contract
- Verify that all four candidate models are evaluated against each criterion and that no criterion was omitted
- Verify that Model C is correctly described as the intended target direction, and that the reasoning for not selecting A, B, or D is sound
- Verify that the eight unresolved decisions accurately reflect the current state of this repository and the authority contract
- Verify that the five risks are real and that the stated controls are present in the current codebase or in the constraints recorded here
- Confirm the non-authorization boundary is complete and does not inadvertently authorize any implementation
- Reach a GO or NO-GO decision
- If GO: recommend the next narrowly-scoped gate (which must remain documentation-only or, if execution, must be scoped to exactly one of the sub-problems listed in Section 7's decomposition)

---

## 13. Verification Commands

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

# Confirm request context fields: workspaceId and actorId only
grep -n "interface RequestContext" src/request-context.ts

# Confirm grantedPermissions is never a field on RequestContext
grep -n "grantedPermissions\|roleId\|role\b" src/request-context.ts

# Confirm evaluatePermissionGuard has exactly one runtime call site
grep -n "evaluatePermissionGuard" src/app.ts src/index.ts

# Confirm grantedPermissions is never sourced from request headers
grep -n "grantedPermissions" src/app.ts

# Confirm the static fixture is the only grantedPermissions source
grep -n "STATIC_HARNESS_GRANTED_PERMISSIONS" src/app.ts

# Confirm no product routes exist
grep -E -n "app\.(post|put|delete|patch)" src/app.ts

# Confirm ErrorCode mismatch is still contained (harness always 200)
grep -n "FORBIDDEN\|NOT_FOUND\|permission.denied\|resource.not_found" src/permission-guard.ts

# Confirm authority ErrorCode enum values
grep -A 20 "ErrorCode:" ../nashir/docs/nashir_v1_openapi.yaml | grep "^\s*-"

# Confirm authority security scheme is bearer (deferred provider)
grep -A 6 "bearerAuth:" ../nashir/docs/nashir_v1_openapi.yaml

# Confirm contract_reference.md records PENDING ALIGNMENT
grep -n "PENDING ALIGNMENT" docs/contract_reference.md
```
