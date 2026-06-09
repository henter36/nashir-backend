# Nashir Backend Slice 0 Auth/RBAC Source-of-Truth Decision Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only decision gate |
| Authorization source | `docs/nashir_backend_slice_0_request_context_permission_source_alignment_review_gate.md` (PR #36) |
| PR #36 merge commit (alignment review gate) | `32faed84cbbeb57d8998e512ac7ae21b463fb539` |
| PR #35 merge commit (alignment planning gate) | `edd3cc0c9e626d6d127e6835b9e333262d90c06e` |
| PR #34 merge commit (follow-up decision gate) | `c4bca191a7cd902566598791ced35eb95b5ec635` |
| Authority repository | `henter36/nashir` |
| Authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation, auth provider integration, database access, role storage, product routes, broad permission enforcement, generated clients, OpenAPI changes, SQL/migrations/ORM, or deployment of any kind |

---

## 1. Scope

PR #36's review gate passed all 9 criteria for the alignment planning gate and recommended this Auth/RBAC Source-of-Truth Decision Gate to:

- Record explicit, binding decisions about which system is the source of truth for identity, workspace membership, roles, and permissions
- Confirm the `grantedPermissions`-never-caller-supplied invariant as a durable constraint for all future execution gates
- Address the `ErrorModel` field-name alignment observation from the review gate (wider than `ErrorCode` strings alone)
- Address the `x-workspace-scope: route` / path-param vs. header-based workspace context observation
- Define precisely what the next planning gate may plan
- Produce a GO / NO-GO decision to the Backend Slice 0 Auth/RBAC Source-of-Truth Decision Review Gate

This gate records decisions, not implementation. It does not open an execution gate. Every decision recorded here is a design constraint that future gates must treat as settled unless a subsequent decision gate explicitly revisits it.

---

## 2. Inputs Reviewed

| Input | Purpose |
|---|---|
| `docs/nashir_backend_slice_0_request_context_permission_source_alignment_review_gate.md` (PR #36) | Authorization source — Section 8 specifies what this gate must decide and address |
| `docs/nashir_backend_slice_0_request_context_permission_source_alignment_planning_gate.md` (PR #35) | The planning document whose decisions this gate formalizes — Sections 5, 6, 7, 8, 9 |
| `src/request-context.ts` (108 lines) | Confirms current state: `RequestContext { workspaceId: string; actorId: string }` from caller-supplied headers; no cryptographic verification |
| `src/permission-guard.ts` (108 lines) | Confirms `evaluatePermissionGuard` is convention-agnostic, pure, and caller-supplied-`grantedPermissions` based |
| `src/app.ts` (197 lines) | Confirms: one call site for `evaluatePermissionGuard` (line 68); `STATIC_HARNESS_GRANTED_PERMISSIONS = Object.freeze(["harness.read","harness.write"])` is the only runtime `grantedPermissions` source; `grantedPermissions` is never sourced from request headers |
| `src/error-model.ts` (47 lines) | Confirms backend-local `ErrorModel` field names: `code`, `message`, `statusCode`, `correlationId`, `details` |
| `henter36/nashir` `docs/nashir_v1_openapi.yaml` (authority commit `04f54f8`) | Confirms: `bearerAuth` scheme with deferred provider/format; "workspace membership resolved and enforced server-side"; guard chain `authGuard → workspaceContextGuard → permissionGuard`; `x-workspace-scope: route`; `x-membership-check: non-disclosing`; `x-permission: nashir.<resource>.<action>`; authority `ErrorModel` fields `errorCode`, `requestId`, `retryable`, `status` |

---

## 3. What Was Established by Prior Gates

The following are settled facts entering this decision gate — not re-opened here:

- `evaluatePermissionGuard` is a pure, correct, convention-agnostic permission decision primitive. It is on `main`, test-proven, and gate-reviewed.
- The wiring shape `requestContext → evaluatePermissionGuard → PermissionGuardResult` is proven by the diagnostic harness.
- `RequestContext { workspaceId, actorId }` is the current runtime shape — two caller-supplied headers, no cryptographic verification.
- `STATIC_HARNESS_GRANTED_PERMISSIONS = Object.freeze(["harness.read","harness.write"])` is the only runtime `grantedPermissions` source. No real permission source exists.
- The intended target architecture is Model C (hybrid: bearer token identity + server-side DB membership/role/permission resolution). This was established by the alignment planning gate and confirmed by the review gate.
- Five pipeline layers must each be addressed before real enforcement: (1) request identity, (2) workspace scope, (3) membership source, (4) role source, (5) permission resolution.
- Five sub-problems require their own future gates (in approximate dependency order): auth token format/verification, workspace membership model, role and permission model, `ErrorCode` alignment, permission-string convention adoption.
- Two carried open items from the review gate: the `ErrorModel` field-name divergence is wider than `ErrorCode` strings alone; `x-workspace-scope: route` implies path-param-driven workspace scope.

---

## 4. Source-of-Truth Decisions

This section records six binding decisions. Each is a constraint that future execution gates must treat as settled.

### Decision 1 — Source of truth for authenticated identity

**Decision:** The bearer token is the authoritative source for the caller's verified identity (`actorId`). The backend must not treat the `x-nashir-actor-id` header alone as verified identity in any real enforcement context.

**Basis:** The authority contract's `bearerAuth` scheme requires HTTP bearer token authentication for all non-health routes. The token provider and format are deferred to a later auth implementation gate, but the authority establishes unambiguously that identity is token-backed. A self-asserted `x-nashir-actor-id` header is appropriate only in the current diagnostic harness (which is opt-in, default-off, and returns always-200 diagnostic responses — not real enforcement).

**Constraint for future gates:** Any execution gate that wires `evaluatePermissionGuard` to a real route must use token-verified identity as the `actorId` passed to `evaluatePermissionGuard`'s `requestContext`. The `x-nashir-actor-id` header must not be promoted to a verified identity source in any non-harness code path.

### Decision 2 — Source of truth for workspace membership

**Decision:** The server-side database is the authoritative source for workspace membership. Membership status (active, invited, suspended) must be resolved by the backend on every request for workspace-scoped routes. Membership context must not be embedded in or trusted from the bearer token.

**Basis:** The authority contract's `bearerAuth` description states: "Workspace membership is resolved and enforced server-side for the path workspace; the contract does not require membership context in the token." All workspace-scoped routes carry `x-membership-check: non-disclosing`. This requires real-time, server-side membership resolution — a stale token claim cannot satisfy it.

**Constraint for future gates:** Any execution gate implementing workspace-scoped routes must include a server-side membership check before `evaluatePermissionGuard` is called. A non-member must receive the same response as an actor who lacks the required permission — the backend must not reveal membership status through error-code distinctions. This is the `x-membership-check: non-disclosing` invariant and must be implemented at the `workspaceContextGuard` layer, not inside `evaluatePermissionGuard`.

### Decision 3 — Source of truth for roles

**Decision:** The server-side database is the authoritative source for role assignments. The role that an active member holds within a workspace must be resolved server-side, not asserted by the client or embedded in the token.

**Basis:** This follows directly from Decision 2. If membership is server-side, role assignment — which is a property of the membership record — must also be server-side. Token-embedded roles would be stale for the same reasons token-embedded membership would be stale: a role change does not invalidate an existing token.

**Constraint for future gates:** Any execution gate implementing role resolution must query the role assignment from the same data store as membership. Role must not be carried in the bearer token as a claim that the backend trusts directly.

### Decision 4 — Where role-to-permission mapping must live

**Decision:** The role-to-permission mapping must live in a server-controlled layer (either a hardcoded service-layer mapping or a DB-stored policy table). It must never be carried in the bearer token or derived from client-supplied input. The output of the mapping must be a set of `nashir.<resource>.<action>` strings — matching the authority contract's `x-permission` annotations.

**Basis:** The authority's `x-permission` annotations enumerate the canonical permissions for V1 routes (e.g., `nashir.products.read`, `nashir.products.manage`, `nashir.assets.read`, `nashir.assets.manage`, `nashir.content.read`, `nashir.content.manage`). These are opaque string values from `evaluatePermissionGuard`'s perspective, but they must be produced by a server-controlled mapping that is consistent with the authority's annotations. Client-controlled role-to-permission mapping would allow permission escalation.

**Constraint for future gates:** The role-to-permission mapping must be:
- Server-side and server-controlled
- Consistent with the `nashir.<resource>.<action>` permission strings in the authority's `x-permission` annotations
- Not embedded in or derivable from the bearer token
- Versioned or managed such that a permission addition or removal takes effect immediately for all active members (consistent with server-side authority)

### Decision 5 — Whether `grantedPermissions` may ever be caller-supplied

**Decision:** No. `grantedPermissions` must never be sourced from request headers, query parameters, request body, or any other client-supplied input in any real enforcement context.

**Basis:** Allowing a caller to supply their own permission set is equivalent to no authorization check. The entire security model of `evaluatePermissionGuard` rests on the assumption that its `grantedPermissions` array is produced by a server-controlled, server-verified process. This invariant was first established by the static harness fixture (which is server-side, not client-supplied) and is recorded as a design constraint in the alignment planning gate (Section 9, risk 3) and confirmed by the review gate (Observation A).

**Constraint for future gates (durable):** This decision is non-negotiable. Any PR, execution gate, or implementation that introduces a code path where `grantedPermissions` is derived from a request header, query parameter, body field, or any other client-supplied value must be rejected. The current implementation satisfies this invariant: `src/app.ts` line 70 passes `STATIC_HARNESS_GRANTED_PERMISSIONS` — a server-side constant — to `evaluatePermissionGuard`.

### Decision 6 — Boundary between pipeline layers

**Decision:** The six pipeline concerns are assigned as follows. This boundary is binding for future gate design.

| Pipeline layer | Source of truth | Implementation gate ownership |
|---|---|---|
| **Request identity** (`actorId`) | Bearer token — cryptographically verified. Token provider and format: deferred to auth token gate. | `authGuard` — to be addressed in the auth token planning gate |
| **Workspace scope** (`workspaceId`) | Route path parameter `{workspaceId}` for workspace-scoped routes. Not from a header in real enforcement. | `workspaceContextGuard` — route parameter extracted and used for membership check |
| **Membership source** | Server-side DB. Active membership required. Non-disclosing check required. | `workspaceContextGuard` — membership lookup against DB |
| **Role source** | Server-side DB. Role is a property of the membership record. | `workspaceContextGuard` or a role-resolver called from it |
| **Permission resolution** | Server-controlled role-to-permission mapping producing `nashir.<resource>.<action>[]`. | The call site that prepares `grantedPermissions` before calling `evaluatePermissionGuard` |
| **Permission enforcement** | `evaluatePermissionGuard` (existing, complete). | Already on `main` — no change required |

---

## 5. Candidate Model Evaluation

The four candidate models from the alignment planning gate are re-evaluated here against the decisions recorded in Section 4.

### Model A — Token-only permissions

Model A routes `grantedPermissions` derivation through the bearer token. Decision 2 rules this out as the primary model: workspace membership must be resolved server-side ("the contract does not require membership context in the token") and must be real-time to satisfy `x-membership-check: non-disclosing`. Token-embedded permissions cannot be revoked in real time without token invalidation infrastructure. Decision 3 rules it out for roles for the same reason.

**Status:** Not the source-of-truth model. Bearer tokens are used for Layer 1 identity (Decision 1) only.

### Model B — DB-only membership and role resolution

Model B uses DB queries for all authorization: identity, membership, and role. This satisfies Decisions 2 and 3 but does not satisfy Decision 1 — the authority requires bearer token identity; a DB-only model would fall back to header-asserted `actorId`, which is not cryptographically verified.

**Status:** Not the source-of-truth model. DB is correct for membership and roles (Decisions 2 and 3) but insufficient for identity (Decision 1).

### Model C — Hybrid: token identity + DB membership/role/permission resolution (confirmed)

Model C satisfies all six decisions in Section 4:
- Decision 1 (identity): bearer token provides cryptographically verified `actorId`
- Decision 2 (membership): DB query resolves active membership for `(actorId, workspaceId)`
- Decision 3 (roles): DB query resolves role from membership record
- Decision 4 (permission mapping): server-controlled role → `nashir.<resource>.<action>[]` mapping
- Decision 5 (no caller-supplied): `grantedPermissions` is produced by the server-side role mapping
- Decision 6 (boundary): cleanly aligns `authGuard` (token) → `workspaceContextGuard` (DB membership + role) → `permissionGuard` (`evaluatePermissionGuard`)

**Status: Confirmed source-of-truth model.**

### Model D — Static / dev-only

Already implemented as `STATIC_HARNESS_GRANTED_PERMISSIONS`. Appropriate for the opt-in diagnostic harness. Not a candidate for any real enforcement path (violates Decisions 1–4 simultaneously for real enforcement contexts). Must remain behind `enableInternalPermissionGuardHarnessRoutes === true` strict equality guard, default `false`.

**Status:** Dev/test scaffold only. Scope must not expand beyond the existing harness.

---

## 6. The `grantedPermissions`-Never-Caller-Supplied Invariant

This invariant is elevated from a recorded design constraint (alignment planning gate Section 9) to a durable, gate-level decision:

> **`grantedPermissions` must never be sourced from request headers, query parameters, request body, or any other client-supplied input in any real enforcement context. Every future execution gate that introduces a new `grantedPermissions` producer must demonstrate that the producer is server-controlled and server-verified.**

Current state:
- Only one call site exists: `src/app.ts` line 70, inside the opt-in harness handler
- It passes `STATIC_HARNESS_GRANTED_PERMISSIONS` — a server-side constant, not a client-derived value
- This invariant is structurally satisfied today

For the invariant to continue to hold as real enforcement is introduced:
- The membership lookup (Decision 2), role resolution (Decision 3), and permission mapping (Decision 4) must all be server-side
- No middleware, plugin, or hook may accept a `X-Nashir-Permissions` or equivalent header as a permission source
- No test fixture may pass permissions as a query parameter in a non-harness code path

---

## 7. `ErrorModel` Alignment — a Separate Future Contract Concern

The review gate (PR #36) raised Observation B: the backend's `ErrorModel` diverges from the authority's not only in the `ErrorCode` string values but also in field names.

**Backend `ErrorModel` (current `src/error-model.ts`):**
```typescript
interface ErrorModel {
  code: string;          // e.g. "FORBIDDEN", "NOT_FOUND", "REQUEST_CONTEXT_REQUIRED"
  message: string;
  statusCode: number;
  correlationId?: string;
  details?: unknown;
}
```

**Authority `ErrorModel` (authority OpenAPI `components/schemas/ErrorModel`):**
```yaml
ErrorModel:
  required: [errorCode, message, requestId, retryable, status]
  properties:
    errorCode:    { $ref: "#/components/schemas/ErrorCode" }   # lower.snake_case enum
    message:      string
    details:      object (additionalProperties: true)
    requestId:    string
    retryable:    boolean
    status:       integer (100–599)
```

**Divergences enumerated:**

| Field | Backend | Authority | Divergence |
|---|---|---|---|
| Error code field name | `code` | `errorCode` | Renamed |
| Error code values | `SCREAMING_SNAKE_CASE` (e.g., `FORBIDDEN`) | `lower.snake_case` (e.g., `permission.denied`) | Format and vocabulary |
| Request/correlation ID | `correlationId` (optional) | `requestId` (required) | Renamed; optionality flipped |
| HTTP status | `statusCode` | `status` | Renamed |
| Retryable flag | absent | `retryable` (required, boolean) | Missing field |
| Details | `details?: unknown` | `details?: object` (additionalProperties) | Compatible but weakly typed |

**Decision:** `ErrorModel` alignment is explicitly a **separate future contract concern** that must not be addressed in any gate from this sequence until a dedicated OpenAPI/contract alignment gate is opened and authorized. Reasons:

1. The backend's `ErrorModel` shape was established by prior gate-reviewed work and is used by multiple existing tests (`tests/error-model.test.ts`, 11 tests). Changing it requires its own test, execution, and review gate sequence.
2. `correlationId` → `requestId` is a semantic change (these may not be the same concept) that requires cross-repository coordination with the authority.
3. The `retryable` field requires a policy decision about which error codes are retryable — this is not a mechanical rename.
4. This entire divergence is contained: the backend currently produces `ErrorModel` responses only for `/health` errors, `REQUEST_CONTEXT_REQUIRED` (401), `NOT_FOUND` (404 route), and `INTERNAL_SERVER_ERROR` (500). No permission-failure `ErrorModel` response is produced today (the harness is always-200). No urgency.

**Tracking:** The full field-level divergence is recorded in this gate's Section 7. The `PENDING ALIGNMENT` entry in `docs/contract_reference.md` covers this. No action is authorized here.

---

## 8. `x-workspace-scope: route` Semantics vs. Header-Based Context

The review gate (PR #36) raised Observation C: the authority's `x-workspace-scope: route` annotation implies that workspace identity for permission enforcement should come from the route's `{workspaceId}` path parameter, not from a header. The current backend has no workspace-scoped product routes, so no conflict exists today. This gate records the design decision explicitly.

**Decision:** For workspace-scoped routes (any route under `/workspaces/{workspaceId}/...`), the `workspaceId` for permission enforcement and membership lookup must be the route's `{workspaceId}` path parameter. The `x-nashir-workspace-id` header continues to carry `workspaceId` for the `RequestContext` (used by the diagnostics harness and for correlation), but it must not be the authoritative workspace scope for enforcement when a path parameter is present.

**Rationale:** The path parameter is part of the route contract and is visible in the URL; clients cannot silently escalate workspace scope by sending a different header value. The header-sourced `workspaceId` in `RequestContext` is appropriate for the current harness (which has no workspace-scoped routes) but must be superseded by the path parameter when real workspace-scoped product routes are added.

**How this interacts with `evaluatePermissionGuard`:** The `resourceWorkspaceId` parameter of `evaluatePermissionGuard` must be set to the route's `{workspaceId}` path parameter value for any real workspace-scoped enforcement call. The `requestContext.workspaceId` can remain the header-sourced value; `evaluatePermissionGuard` will compare `resourceWorkspaceId !== requestContext.workspaceId` and return `not_found` if they differ — providing the workspace isolation guarantee. This is the correct usage pattern and requires no change to `evaluatePermissionGuard`.

**Constraint for future gates:** Any execution gate that adds workspace-scoped routes must pass the route's `{workspaceId}` path parameter as `resourceWorkspaceId` to `evaluatePermissionGuard`. It must not pass the header-sourced `requestContext.workspaceId` as `resourceWorkspaceId`.

---

## 9. What the Next Planning Gate May Plan

The Backend Slice 0 Auth/RBAC Source-of-Truth Decision Review Gate (the next recommended gate after this one) independently verifies this decision gate. If it reaches GO, it recommends the next narrowly-scoped planning gate.

The next planning gate after the review gate is authorized to plan exactly **one** of the following sub-problems (in approximate dependency order):

1. **Auth token format and verification** — What is the bearer token format? What is the provider? How is the signature verified? What claims does the token carry (minimum: a verified `actorId`)? This is the `authGuard` layer and is the prerequisite for Decisions 2–4. This is the highest-priority sub-problem and should be planned first unless there is a specific reason to proceed out of order.

2. **Workspace membership model** — What does the membership record look like? What statuses exist? How does the membership lookup work given `(actorId, workspaceId)` from the verified token and route path parameter? How does the non-disclosing check work? This is the `workspaceContextGuard` membership layer and depends on sub-problem 1 (verified `actorId`).

3. **Role and permission model** — What roles exist? How is role assignment stored? How does the role → `nashir.<resource>.<action>[]` mapping work? This depends on sub-problems 1 and 2.

4. **`ErrorCode` alignment** — Resolve the `FORBIDDEN`/`NOT_FOUND` vs. `permission.denied`/`resource.not_found` mismatch, and separately plan the `ErrorModel` field-name alignment (Section 7 above). This is independent of sub-problems 1–3 and can be planned in parallel, but it should not be implemented before a real enforcement call site exists.

5. **Permission-string convention adoption** — Confirm `nashir.<resource>.<action>` as the convention for this backend. Enumerate the V1 permission set. Update test fixtures.

The planning gate that follows the review gate must select exactly one of these sub-problems and remain documentation-only.

---

## 10. Non-Authorization Boundary

This decision gate does not authorize, and must NOT be read as approving, any of the following:

- implementation of any auth provider, token issuer, or token verification mechanism
- implementation of any bearer token parsing, signature verification, or claim extraction
- implementation of any database schema, ORM, migration, or SQL for workspace membership, role storage, or permission tables
- implementation of any role-to-permission mapping or permission resolution service
- wiring `evaluatePermissionGuard` into any call site other than the existing `permissionGuardHarnessHandler`
- changes to `src/request-context.ts` (including adding role, token, or permission fields)
- changes to `src/permission-guard.ts` (including changing the input/output types)
- changes to `src/error-model.ts` (including renaming fields toward authority alignment)
- product routes of any kind
- any extension of the static harness fixture
- generated client changes
- OpenAPI or contract-document changes (including `ErrorCode` mismatch resolution, `ErrorModel` field renaming, or `requestId`/`retryable`/`status` addition)
- environment-variable or secrets configuration
- CI workflow changes
- deployment, pilot readiness, or production readiness of any kind

---

## 11. GO / NO-GO Decision

**Decision: GO** to the **Backend Slice 0 Auth/RBAC Source-of-Truth Decision Review Gate** — because:

- Six binding source-of-truth decisions are recorded in Section 4, each grounded in the authority contract and the prior gate sequence.
- Model C (hybrid: token identity + DB membership/role/permission resolution) is confirmed as the source-of-truth model with explicit per-decision rationale.
- The `grantedPermissions`-never-caller-supplied invariant is elevated from a design constraint to a durable gate-level decision.
- The `ErrorModel` field-name divergence is enumerated in full and explicitly deferred to a future contract alignment gate, with rationale for deferral.
- The `x-workspace-scope: route` / path-param vs. header decision is recorded with a clear usage pattern for `evaluatePermissionGuard`'s `resourceWorkspaceId` parameter.
- The next planning gate's scope is defined (Section 9) with five sub-problems listed in dependency order and the requirement to select exactly one.
- All prohibitions in Section 10 carry forward.

**NO-GO** for everything listed in Section 10.

---

## 12. Recommended Next Gate

**Backend Slice 0 Auth/RBAC Source-of-Truth Decision Review Gate** — a documentation-only review gate that independently verifies the six decisions in Section 4 of this gate.

That review gate must:

- Independently verify (not rely on this gate's self-assessment) that each of the six decisions is grounded in the authority contract and the prior gate sequence
- Verify that the `grantedPermissions`-never-caller-supplied invariant is accurately stated and currently satisfied by the codebase
- Verify that the `ErrorModel` divergence enumeration in Section 7 is accurate against both `src/error-model.ts` and the authority OpenAPI
- Verify that the `x-workspace-scope: route` design decision in Section 8 is consistent with the authority contract and the current `evaluatePermissionGuard` interface
- Verify the non-authorization boundary is complete
- If GO: recommend the next narrowly-scoped planning gate for the highest-priority sub-problem from Section 9 (auth token format and verification, unless there is a documented reason to proceed differently)

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

# Confirm RequestContext has only workspaceId and actorId — no token, role, or permission fields
grep -n "interface RequestContext" src/request-context.ts

# Confirm grantedPermissions is never sourced from request headers
grep -n "grantedPermissions" src/app.ts

# Confirm evaluatePermissionGuard has exactly one runtime call site
grep -n "evaluatePermissionGuard" src/app.ts src/index.ts

# Confirm backend ErrorModel field names (code, correlationId, statusCode)
grep -n "code\|correlationId\|statusCode\|retryable\|requestId" src/error-model.ts

# Confirm authority ErrorModel requires errorCode, requestId, retryable, status
grep -A 10 "ErrorModel:" ../nashir/docs/nashir_v1_openapi.yaml | grep "required\|errorCode\|requestId\|retryable\|status"

# Confirm authority bearer scheme defers provider and token format
grep -A 5 "bearerAuth:" ../nashir/docs/nashir_v1_openapi.yaml

# Confirm authority requires server-side membership resolution
grep -A 8 "bearerAuth:" ../nashir/docs/nashir_v1_openapi.yaml

# Confirm x-workspace-scope: route annotation is present on workspace-scoped routes
grep -n "x-workspace-scope" ../nashir/docs/nashir_v1_openapi.yaml | head -5

# Confirm no product routes
grep -E -n "app\.(post|put|delete|patch)" src/app.ts

# Confirm ErrorCode mismatch still PENDING ALIGNMENT
grep -n "PENDING ALIGNMENT" docs/contract_reference.md
```
