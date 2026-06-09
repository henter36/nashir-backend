# Nashir Backend Slice 0 Auth Token Format / Verification Decision Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only decision gate |
| Authorization source | `docs/nashir_backend_slice_0_auth_token_format_verification_planning_review_gate.md` (PR #40) |
| PR #40 merge commit (planning review gate) | `1a0a82bfdcf22e7c77272fb561181fbed4339640` |
| PR #39 merge commit (planning gate) | `3cc71fbcbbb3898d60e33d7cfdcb37a96800d094` |
| PR #38 merge commit (decision review gate) | `b1b84f6` |
| PR #37 merge commit (decision gate) | `540c6133add74d6ff0d124ae60ccb4f64c5dce76` |
| Authority repository | `henter36/nashir` |
| Authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation, auth provider integration, database access, role storage, product routes, broad permission enforcement, generated clients, OpenAPI changes, SQL/migrations/ORM, or deployment of any kind |

---

## 1. Scope

PR #40's planning review gate passed all 12 criteria and reached GO to this decision gate. The planning gate (PR #39) evaluated four candidate token verification models and recommended Model A (JWT with JWKS verification). The review gate (PR #40) independently verified that recommendation and confirmed it was defensible.

This decision gate does two things:

1. Records the formally binding decision: Model A (JWT with JWKS verification) is the auth token verification strategy for Nashir backend Slice 0
2. Records what that decision constrains for all future implementation gates — without implementing any of it

This gate does not open an execution gate or an execution planning gate. It produces a GO / NO-GO decision to the Backend Slice 0 Auth Token Format / Verification Decision Review Gate.

### What this gate does not re-open

The following are settled and are not re-evaluated here:

| Settled constraint | Source |
|---|---|
| Bearer token is the authoritative identity source (`actorId`) | Decision 1, PR #37 |
| `x-nashir-actor-id` header must not be trusted in real enforcement | Decision 1, PR #37 |
| Workspace membership is server-side DB — not token-embedded | Decision 2, PR #37 |
| Role is server-side DB — not token-embedded | Decision 3, PR #37 |
| Role-to-permission mapping is server-controlled | Decision 4, PR #37 |
| `grantedPermissions` must never be caller-supplied | Decision 5, PR #37 |
| Pipeline boundary: `authGuard → workspaceContextGuard → permissionGuard` | Decision 6, PR #37 |
| Token provider and format were deferred; JWT + JWKS is the planning direction | PR #39, confirmed PR #40 |

---

## 2. Inputs Reviewed

| Input | Purpose |
|---|---|
| `docs/nashir_backend_slice_0_auth_token_format_verification_planning_review_gate.md` (PR #40) | Authorization source — GO decision and Section 8 define what this gate must record |
| `docs/nashir_backend_slice_0_auth_token_format_verification_planning_gate.md` (PR #39) | Four-model evaluation and Model A recommendation with five reasons |
| `docs/nashir_backend_slice_0_auth_rbac_source_of_truth_decision_review_gate.md` (PR #38) | Six binding source-of-truth decisions that all decisions in this gate carry forward |
| `docs/nashir_backend_slice_0_auth_rbac_source_of_truth_decision_gate.md` (PR #37) | The six source-of-truth decisions themselves |
| `src/request-context.ts` | Current state: `RequestContext { workspaceId, actorId }` populated from headers; no cryptographic verification |
| `src/app.ts` | Current state: `STATIC_HARNESS_GRANTED_PERMISSIONS` is the only `grantedPermissions` source; harness opt-in default false; no product routes |
| `src/permission-guard.ts` | `EvaluatePermissionGuardInput.requestContext.actorId: string` — the interface that token-verified identity must populate |
| `henter36/nashir` `docs/nashir_v1_openapi.yaml` (authority commit `04f54f8`) | `bearerAuth` scheme; `x-workspace-scope: route`; `x-membership-check: non-disclosing` |

---

## 3. Decision 1 — Token Verification Strategy

**Decision: Model A — JWT with JWKS verification — is the binding token verification strategy for Nashir backend Slice 0.**

**Basis:** PR #39 evaluated four models against six criteria. PR #40 independently verified that evaluation and confirmed all five reasons for the Model A recommendation are grounded in observable facts, the authority contract, and the project's deferred-provider constraint.

The five reasons, confirmed here as the basis for this binding decision:

1. **Provider-agnostic by design.** Every major auth provider (Auth0, AWS Cognito, Clerk, Okta, Firebase Authentication, Supabase Auth, Keycloak) issues JWTs and exposes a JWKS endpoint. Choosing JWT + JWKS defers provider selection without constraining it. The authority's own language — "The provider and token format are deferred to a later authorized auth implementation planning gate" — is satisfied: JWT with JWKS is the most provider-agnostic approach that satisfies the authority's `bearerAuth` scheme requirement.

2. **Standard-defined verification algorithm.** JWT signature verification (`RS256`, `ES256`, or other standard algorithms) and claims validation (`exp`, `iss`, `aud`) are fully specified by RFC 7519. The verification layer requires no vendor SDK.

3. **Local testability without external infrastructure.** A test key pair (RSA or ECDSA P-256) can be generated at test time. The same verification code path that runs in production can be exercised in tests with a mock JWKS fixture — only the JWKS source URL differs. No live auth provider or network mock is required for unit testing.

4. **Stateless per-request verification.** JWKS public keys are fetched once and cached. No per-request network call is required after the initial fetch (except for cache refresh on rotation). This avoids the per-request availability coupling of opaque token introspection (Model B).

5. **Compatible with the `authGuard` pipeline boundary.** The `authGuard` layer maps cleanly to a JWT verification middleware: verify signature → validate `exp`/`iss`/`aud` → extract `sub` → set `requestContext.actorId`. The `RequestContext { workspaceId, actorId }` interface already has the correct shape; no structural change to the interface is required for the post-verification world.

**Constraint for future gates (binding):** All future execution gates for auth token verification must implement JWT verification with JWKS. No gate may substitute opaque token introspection, a provider-specific SDK, or a dev-only scaffold as the production verification strategy.

---

## 4. Rejected Alternatives

### Model B — Opaque token with introspection

**Rejected.** Model B requires a synchronous network call to the auth provider's token introspection endpoint (RFC 7662) on every authenticated request. This introduces per-request availability coupling: a provider outage fails all authenticated requests, not just token issuance. Local testability is materially harder — tests require a mock HTTP introspection server. The decision basis in Section 3 (reasons 3 and 4) rules it out. Future gates must not reopen this alternative unless a decision gate explicitly revisits it with new evidence.

### Model C — Provider-specific SDK verification

**Rejected.** Model C fuses provider selection with verification strategy before provider selection is authorized. The authority explicitly defers provider selection to a later gate. Installing a provider SDK before provider selection would create an SDK dependency that may not match the eventual choice and would require the verification layer to be rewritten on any provider change. Future gates must not introduce a provider SDK for token verification until the provider has been selected through its own gate.

### Model D — Temporary dev-only signed token

**Rejected as a standalone model.** Model D's only advantage — local testability without external infrastructure — is fully captured by Model A's test key pair approach: a locally generated key pair used to sign test JWTs exercises the same verification code path as production. Building a separate dev-only verification path creates two code paths where one suffices. Future gates must not introduce a dev-only token format as a parallel verification strategy.

---

## 5. Decision 2 — Binding Token Identity Rule

**Decision: The verified JWT `sub` claim is the future authoritative source for `requestContext.actorId` in all real enforcement code paths.**

**Basis:** This follows directly from Decision 1 of PR #37 (bearer token is the authoritative identity source) and the Model A selection in Section 3 of this gate. The `sub` claim is the standard JWT subject identifier — the only claim that provides a stable, provider-scoped, cryptographically verified identity.

**How the mapping works:**

```
Authorization: Bearer <JWT>
  ↓
authGuard: verify signature, validate exp/iss/aud
  ↓
sub claim extracted from verified payload
  ↓
requestContext.actorId = verifiedToken.sub
  ↓
workspaceContextGuard consumes actorId (verified identity guaranteed)
  ↓
permissionGuard consumes actorId via evaluatePermissionGuard
```

**Constraint for future gates (binding):** Any execution gate that wires `evaluatePermissionGuard` into a real enforcement path must demonstrate that `requestContext.actorId` is populated from a token-verified `sub` claim, not from the `x-nashir-actor-id` header. This is a direct extension of Decision 1 of PR #37.

**No changes to `src/request-context.ts` or `src/permission-guard.ts` are authorized by this gate.** The `RequestContext { workspaceId: string; actorId: string }` interface already has the correct shape. Whether `RequestContext` gains additional fields (e.g., `verifiedToken` or token metadata) to support downstream guards is deferred to the execution planning gate for auth token verification.

---

## 6. Confirmed Allowed Token Claims

The following claims are the only claims the backend trusts from the JWT. This confirmation carries forward the planning gate's Section 6.1 as a binding constraint.

| Claim | JWT standard name | Backend use |
|---|---|---|
| Subject / user ID | `sub` | Only verified identity claim trusted for enforcement. Mapped to `requestContext.actorId`. |
| Issuer | `iss` | Validated against configured issuer during verification. Not used after validation. |
| Audience | `aud` | Validated against configured audience during verification. Audience value is an unresolved decision (Section 11). |
| Expiration | `exp` | Mandatory validation — tokens past their expiration are rejected. |
| Issued-at | `iat` | Validated as a sanity check — tokens issued significantly in the future indicate clock skew or token manipulation. |
| Email | `email` | Optional and non-authoritative. If present, may be used for display or logging only. Must not be used as the primary identity for enforcement; `sub` is authoritative. |

**Constraint for future gates (binding):** No implementation gate may add a claim to this allowed set without explicitly opening a new decision gate to justify the addition. Adding a claim to the trusted set is an authorization-model change.

---

## 7. Confirmed Prohibited Token-Carried Data

The following categories of data must not appear in a JWT used for Nashir backend enforcement, and if present must be ignored. This confirmation carries forward the planning gate's Section 6.2 as a binding constraint.

| Prohibited category | Decision basis |
|---|---|
| Workspace membership (e.g., `workspaces`, `workspace_ids`, `member_of`) | Decision 2, PR #37: membership resolved server-side; stale token claims cannot satisfy `x-membership-check: non-disclosing` |
| Roles (e.g., `role`, `roles`, `workspace_role`) | Decision 3, PR #37: role is a property of the server-side membership record |
| `grantedPermissions` or equivalent (`permissions`, `scopes` carrying `nashir.*`) | Decision 5, PR #37: `grantedPermissions` must never be caller-supplied; a token claim is produced outside backend control |
| Permission inventory (array of permission strings) | Decision 5, PR #37: permission set is the output of server-controlled role-to-permission mapping |
| Workspace authorization decisions (`can_access_workspace`, `workspace_admin`, etc.) | Decision 6, PR #37: authorization decisions belong to `workspaceContextGuard` and `permissionGuard` pipeline layers |

**Constraint for future gates (binding):** Any execution gate that discovers a JWT carrying any of these prohibited claim categories must fail review. The `authGuard` implementation must ignore these claims if present — it must not pass them to `workspaceContextGuard` or any other downstream layer.

---

## 8. Confirmed `workspaceId` Sourcing

**Confirmed:** `workspaceId` for permission enforcement and membership lookup must come from the route path parameter `{workspaceId}`, not from any token claim.

**Basis:** This is settled by Decision 2 of PR #37 (membership is server-side) and Section 8 of the source-of-truth decision gate. The authority's `x-workspace-scope: route` annotation on all workspace-scoped routes confirms this. The `authGuard` determines only the actor's identity — it does not determine workspace scope. Workspace scope is determined by the route itself.

**Constraint for future gates (binding):** The `authGuard` implementation must not extract a workspace claim from the JWT and use it as the `workspaceId` for enforcement. The pipeline sequence is:
- `authGuard` → extracts verified `actorId` from `sub`, sets `requestContext.actorId`
- `workspaceContextGuard` → extracts `workspaceId` from route path parameter `{workspaceId}`, queries DB for active membership using `(actorId, workspaceId)`
- `permissionGuard` → calls `evaluatePermissionGuard` with `resourceWorkspaceId` set to the route path parameter value

The `x-nashir-workspace-id` header continues to populate `requestContext.workspaceId` for correlation and diagnostic purposes in the current harness era, but this value is not the authoritative enforcement scope when a path parameter is present.

---

## 9. Confirmed `x-nashir-actor-id` Transitional Boundary

**Confirmed:** `x-nashir-actor-id` is a diagnostic-harness-era header. It must not be trusted as verified identity in any real enforcement code path.

**Current state (binding, must not change without a new gate):**
- `x-nashir-actor-id` populates `requestContext.actorId` via `resolveRequestContextFromHeaders` in `src/request-context.ts`
- This path is used exclusively by the opt-in diagnostic harness routes (`enableInternalPermissionGuardHarnessRoutes === true`, default `false`)
- All harness routes return HTTP 200 diagnostic JSON — they do not enforce permissions
- `src/index.ts` calls `buildApp()` with no options — harness routes are never registered in production

**Constraint for future execution gates (binding):** Any execution gate introducing a real enforcement route must demonstrate that `requestContext.actorId` is populated from a token-verified `sub` claim on that code path. The `x-nashir-actor-id` header path in `src/request-context.ts` may be retained for the diagnostic harness or retired — this is a decision for the auth token verification execution gate — but it must never be the identity source for production enforcement.

---

## 10. Confirmed JWKS Planning Requirements

The following operational requirements apply to any future JWKS-based JWT verification implementation. They are confirmed here as binding constraints that the execution planning gate must carry as pre-conditions.

| Requirement | Constraint |
|---|---|
| **Configurable JWKS endpoint URI** | The JWKS endpoint URL must be configurable via environment variable or config file. Hard-coded URIs are not acceptable — the same verification code must work in dev, staging, and production by changing configuration only. |
| **Cache TTL shorter than provider rotation interval** | The backend's JWKS cache TTL must be set shorter than the provider's key rotation interval. A TTL equal to or longer than the rotation interval risks holding stale public keys and rejecting valid tokens after rotation. |
| **Rate-limited on-demand refresh for unknown `kid`** | When a JWT presents a `kid` (key ID) not present in the cached JWKS, the verification layer must support an on-demand refresh of the JWKS. This refresh must be rate-limited to prevent an attacker from triggering repeated JWKS fetches by presenting tokens with fabricated `kid` values. The specific rate-limit parameters (e.g., minimum interval between refreshes) are deferred to the execution planning gate. |

These three requirements are not negotiable — any implementation that omits the cache TTL constraint or the rate-limited `kid` refresh constraint must fail its execution review gate.

---

## 11. Unresolved Decisions

The following decisions are explicitly deferred to the auth token verification execution planning gate. None of them must be resolved before the next decision review gate; they are pre-conditions for the execution planning gate that follows.

| # | Unresolved decision | Why deferred |
|---|---|---|
| 1 | **Token provider selection** | Auth0, AWS Cognito, Clerk, Okta, Firebase Auth, Supabase Auth, Keycloak, or other. Depends on deployment environment, cost, SLA, and team familiarity. Highest-impact choice; must have its own decision authority. |
| 2 | **JWKS endpoint URI** | Depends on provider selection. Must be configurable; specific URI unknown until provider is chosen. |
| 3 | **Token audience claim value(s)** | The `aud` value the backend validates against. Typically a service identifier (e.g., `https://api.nashir.app`). Must match what the selected provider issues. |
| 4 | **Key rotation TTL values and refresh rate limit** | Concrete TTL duration and minimum refresh interval depend on the provider's rotation schedule and SLA. The constraints are established (Section 10 above); the values are not. |
| 5 | **Local test token strategy** | The mechanism for generating signed test JWTs without a live auth provider. Model A supports a locally generated key pair with a mock JWKS fixture; specific tooling (test helper, fixture file, generation script) is a decision for the execution planning gate. |
| 6 | **JWT verification library** | `jose` (pure ESM, no native bindings, Node.js and edge runtime compatible) is the leading candidate. Final selection requires reviewing actively maintained alternatives against the criteria: pure TypeScript/ESM, no native dependencies, standards-compliant. Decision deferred to execution planning gate. |
| 7 | **`ErrorModel` response mapping for token verification failures** | Token expiry, bad signature, missing token, and wrong audience each require an HTTP error response. The shape of these responses is constrained by the `ErrorModel` alignment gap (Section 7 of the source-of-truth decision gate, PR #37). Implementation must wait for the `ErrorModel` alignment gate. |
| 8 | **`RequestContext` interface evolution** | Whether `RequestContext` gains a `verifiedToken` or equivalent field to carry post-verification metadata for downstream guards. Depends on what `workspaceContextGuard` needs — a question for the workspace membership planning gate. Deferred. |

---

## 12. What the Next Gate May Authorize

The Backend Slice 0 Auth Token Format / Verification Decision Review Gate (the next recommended gate after this one) independently verifies this decision gate.

If that review gate reaches GO, it opens the path to the following (in dependency order):

1. **Auth token verification execution planning gate** — Detailed, implementation-ready plan for the `authGuard` layer. Resolves unresolved decisions 5, 6, 7, and 8 from Section 11 above. Selects the JWT library. Specifies the test token strategy. Plans `RequestContext` evolution. Specifies JWKS cache TTL and rate-limit parameters. This gate must be reviewed before any execution gate is opened.

2. **Workspace membership model planning gate** — Plans the `workspaceContextGuard` layer. Depends on a stable `actorId` interface from item 1.

3. **Auth token provider selection decision gate** — Formally selects the auth provider. Resolves unresolved decisions 1, 2, and 3. Can be planned in parallel with item 1 but the selection must occur before any provider-specific configuration is added to the codebase.

4. **`ErrorCode` / `ErrorModel` alignment gate** — Plans field-name alignment between the backend and the authority contract. Can proceed in parallel but must not be implemented before a real enforcement call site exists. Resolves unresolved decision 7.

No execution gate for auth token verification may be opened until the execution planning gate (item 1 above) and its review gate have both passed.

---

## 13. Non-Authorization Boundary

This decision gate does not authorize, and must NOT be read as approving, any of the following:

- implementation of any auth provider integration or configuration
- implementation of any JWT verification library installation or wiring
- implementation of any JWKS endpoint fetch, cache, or key rotation handling
- implementation of any bearer token parsing, signature verification, or claim extraction
- implementation of any `authGuard` middleware or Fastify hook
- changes to `src/request-context.ts` (including adding token fields, a `verifiedToken` property, or renaming `actorId`)
- changes to `src/app.ts` (including adding JWT verification middleware or changing the `onRequest` hook)
- changes to `src/permission-guard.ts`
- changes to `src/error-model.ts`
- installation of any new npm packages (`jose`, `jsonwebtoken`, or any auth SDK)
- changes to `package.json` or `pnpm-lock.yaml`
- implementation of any database schema, ORM, migration, or SQL
- implementation of any role-to-permission mapping or permission resolution service
- wiring `evaluatePermissionGuard` into any call site other than the existing `permissionGuardHarnessHandler`
- product routes of any kind
- any extension of the static harness fixture
- generated client changes
- OpenAPI or contract-document changes
- environment-variable or secrets configuration
- CI workflow changes
- deployment, pilot readiness, or production readiness of any kind

---

## 14. GO / NO-GO Decision

**Decision: GO** to the **Backend Slice 0 Auth Token Format / Verification Decision Review Gate** — because:

- Model A (JWT with JWKS verification) is formally recorded as the binding auth token verification strategy in Section 3, grounded in five independently verifiable reasons confirmed by the planning review gate.
- The three rejected alternatives (B, C, D) are recorded in Section 4 with their rejection reasons, making the decision defensible and auditable.
- The binding token identity rule (`sub` → `requestContext.actorId`) is recorded in Section 5 with the explicit constraint for future execution gates.
- The allowed claim set (Section 6) and the prohibited claim categories (Section 7) carry forward the planning gate's Section 6 as binding constraints, each traced to prior gate decisions.
- `workspaceId` sourcing from route path parameters is confirmed in Section 8 with a binding pipeline constraint.
- The `x-nashir-actor-id` transitional boundary is confirmed in Section 9 with a binding constraint for future execution gates.
- The three JWKS operational requirements (configurable endpoint, TTL < rotation interval, rate-limited `kid` refresh) are confirmed in Section 10 as binding pre-conditions for the execution planning gate.
- Eight unresolved decisions are explicitly deferred in Section 11 — none premature, each correctly bounded.
- The non-authorization boundary in Section 13 is complete.

**NO-GO** for everything listed in Section 13.

---

## 15. Recommended Next Gate

**Backend Slice 0 Auth Token Format / Verification Decision Review Gate** — a documentation-only review gate that independently verifies this decision gate.

That review gate must:

- Independently verify (not rely on this gate's self-assessment) that each decision is grounded in prior gate findings and the authority contract
- Verify that the rejected alternatives are correctly characterized
- Verify that the binding token identity rule in Section 5 is consistent with the `authGuard` pipeline boundary (Decision 6, PR #37)
- Verify that the allowed and prohibited claim sets in Sections 6 and 7 are consistent with Decisions 2–5 of the source-of-truth decision gate (PR #37)
- Verify that the JWKS operational requirements in Section 10 are sound
- Verify that the eight unresolved decisions in Section 11 are genuinely unresolved and correctly deferred
- Verify the non-authorization boundary is complete
- Verify that PR #41 (this gate's PR) changed only the one permitted documentation file
- If GO: recommend the auth token verification execution planning gate as the highest-priority next step

That review gate must be documentation-only and must carry forward this gate's Section 13 non-authorization boundary.

---

## 16. Verification Commands

```bash
cd ~/workspace/nashir-backend

git fetch origin --quiet
git checkout main
git pull origin main

git log --oneline -8

npm run lint
npm run typecheck
npm test

# Confirm RequestContext has only workspaceId and actorId — no token, sub, or role fields
grep -n "interface RequestContext" src/request-context.ts

# Confirm x-nashir-actor-id is still the only actorId source (harness-era state)
grep -n "ACTOR_ID_HEADER\|actorId" src/request-context.ts

# Confirm grantedPermissions is never sourced from request headers
grep -n "grantedPermissions" src/app.ts

# Confirm evaluatePermissionGuard has exactly one runtime call site
grep -n "evaluatePermissionGuard" src/app.ts src/index.ts

# Confirm no product routes
grep -E -n "app\.(post|put|delete|patch)" src/app.ts

# Confirm no JWT/auth libraries installed
grep -E "jose|jsonwebtoken|auth0|clerk|cognito|firebase" package.json || echo "not installed"

# Confirm authority bearer scheme defers provider and format
grep -A 8 "scheme: bearer" ../nashir/docs/nashir_v1_openapi.yaml

# Confirm authority x-workspace-scope: route annotation
grep -n "x-workspace-scope: route" ../nashir/docs/nashir_v1_openapi.yaml | head -5

# Confirm authority x-membership-check: non-disclosing annotation
grep -n "x-membership-check: non-disclosing" ../nashir/docs/nashir_v1_openapi.yaml | head -5
```
