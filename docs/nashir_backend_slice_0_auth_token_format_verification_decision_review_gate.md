# Nashir Backend Slice 0 Auth Token Format / Verification Decision Review Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only decision review gate |
| Authorization source | `docs/nashir_backend_slice_0_auth_token_format_verification_decision_gate.md` (PR #41) |
| PR #41 merge commit (decision gate) | `3eb49e632b7754feccae076c99055dacea194480` |
| PR #40 merge commit (planning review gate) | `1cd7793` |
| PR #39 merge commit (planning gate) | `3cc71fbcbbb3898d60e33d7cfdcb37a96800d094` |
| PR #37 merge commit (source-of-truth decision gate) | `540c6133add74d6ff0d124ae60ccb4f64c5dce76` |
| Authority repository | `henter36/nashir` |
| Authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation, auth provider integration, database access, role storage, product routes, broad permission enforcement, generated clients, OpenAPI changes, SQL/migrations/ORM, or deployment of any kind |

---

## 1. Scope

PR #41 merged the Backend Slice 0 Auth Token Format / Verification Decision Gate. That gate formally recorded Model A (JWT with JWKS verification) as the binding token verification strategy, defined the `sub` → `actorId` identity rule, confirmed allowed and prohibited claim sets, and deferred eight implementation decisions.

This review gate independently verifies those decisions and all supporting claims against the same authority inputs, live source files, and the PR #41 commit record. It does not rely on the decision gate's self-assessment. It produces a 12-criterion PASS/FAIL matrix, a GO / NO-GO decision, and a recommendation for the next gate that is justified against the unresolved decisions remaining in Section 11 of the decision gate.

---

## 2. Inputs Used for Independent Verification

| Input | How verified |
|---|---|
| `docs/nashir_backend_slice_0_auth_token_format_verification_decision_gate.md` (PR #41) | Read in full — the primary artifact under review |
| `src/request-context.ts` (`main` HEAD) | Read directly — confirmed `RequestContext { workspaceId: string; actorId: string }`; `x-nashir-actor-id` is the sole `actorId` source; no token, sub, role, or permission fields |
| `src/app.ts` (`main` HEAD) | Read directly — `STATIC_HARNESS_GRANTED_PERMISSIONS` is the only `grantedPermissions` source (line 70); one `evaluatePermissionGuard` call site (line 68); harness opt-in flags default false; no product routes |
| `src/permission-guard.ts` (`main` HEAD) | Read directly — `EvaluatePermissionGuardInput.requestContext.actorId: string`; accepts opaque permission strings; no token fields |
| `src/error-model.ts` (`main` HEAD) | Read directly — `ErrorModel { code, message, statusCode, correlationId?, details? }`; unchanged |
| `package.json` | Grepped — confirmed no `jose`, `jsonwebtoken`, `auth0`, `clerk`, `cognito`, or Firebase library installed |
| `henter36/nashir` `docs/nashir_v1_openapi.yaml` (authority commit `04f54f8`) | Grepped — confirmed `bearerAuth` scheme description defers provider and format; `x-workspace-scope: route` present on 89 workspace-scoped routes; `x-membership-check: non-disclosing` present |
| `git show --stat 3eb49e6` | Confirmed: exactly one file added (`docs/nashir_backend_slice_0_auth_token_format_verification_decision_gate.md`, 344 insertions); no other files touched |

---

## 3. Review Criteria and PASS/FAIL Matrix

### Criterion 1 — Decision gate remains documentation-only

**What to verify:** The decision gate authorizes no implementation, no JWT/JWKS library, no auth provider integration, no source file changes.

**Independent check:**

Decision gate header: "Implementation authorization: None."

Decision gate Section 13 (non-authorization boundary) enumerates 21 prohibited categories, verified by reading the section in full. The list explicitly names: JWT verification library installation; JWKS fetch/cache/rotation handling; `authGuard` middleware; bearer token parsing; changes to all named source files (`src/request-context.ts`, `src/app.ts`, `src/permission-guard.ts`, `src/error-model.ts`); `package.json`; and `pnpm-lock.yaml`.

`package.json` independently confirmed: no JWT or auth library is installed. All source files are at the same state as prior gates — confirmed by reading `src/request-context.ts` and `src/app.ts` directly. `git show --stat 3eb49e6` shows exactly one file added in `docs/`.

**Finding:** The decision gate records binding decisions without authorizing any implementation. The non-authorization boundary is complete and specific.

**Result: PASS**

---

### Criterion 2 — Model A (JWT with JWKS verification) is formally selected

**What to verify:** Section 3 records Model A as a binding gate-level decision, not merely a planning recommendation.

**Independent check:**

Decision gate Section 3:
> "Model A — JWT with JWKS verification — is the binding token verification strategy for Nashir backend Slice 0."

The word "binding" appears in both the decision statement and the constraint paragraph: "All future execution gates for auth token verification must implement JWT verification with JWKS. No gate may substitute opaque token introspection, a provider-specific SDK, or a dev-only scaffold as the production verification strategy."

This language elevates the Model A choice from a planning recommendation (PR #39) to a gate-level binding constraint. Future review gates for auth implementation are now required to verify JWT + JWKS is used — they do not need to re-evaluate the model choice.

The five reasons recorded in Section 3 are the same five confirmed by PR #40's review. The decision gate does not add new reasons — it carries forward the confirmed set, which is the correct pattern for a decision gate.

**Finding:** Model A is formally and bindingly recorded. The constraint for future gates is explicit and auditable.

**Result: PASS**

---

### Criterion 3 — All three rejected alternatives are recorded with rejection reasons

**What to verify:** Section 4 records Models B, C, and D with their rejection reasons. No model is dismissed without argument.

**Independent check:**

**Model B (opaque token + introspection):**
> "Rejected. Model B requires a synchronous network call to the auth provider's token introspection endpoint (RFC 7662) on every authenticated request. This introduces per-request availability coupling: a provider outage fails all authenticated requests, not just token issuance. Local testability is materially harder — tests require a mock HTTP introspection server."

Two independent rejection reasons: availability coupling and testability. Both are accurate. RFC 7662 introspection is a per-request call by definition. The availability argument is correct: if the introspection endpoint is down, token verification fails for every request. The testability argument is correct: tests need either a live endpoint or a mock HTTP server.

**Model C (provider SDK):**
> "Rejected. Model C fuses provider selection with verification strategy before provider selection is authorized. The authority explicitly defers provider selection to a later gate."

This is accurate. The authority `bearerAuth` description says: "The provider and token format are deferred to a later authorized auth implementation planning gate." Installing a provider SDK before provider selection is authorized by its own gate creates a dependency that may need to be reversed. The constraint is correctly bounded: "Future gates must not introduce a provider SDK for token verification until the provider has been selected through its own gate."

**Model D (dev-only signed token):**
> "Rejected as a standalone model. Model D's only advantage — local testability without external infrastructure — is fully captured by Model A's test key pair approach."

The rejection is correctly framed as "not as a standalone model" — the local testability property is not lost, it is subsumed by Model A's test key pair approach. The "two code paths where one suffices" argument is sound.

**Finding:** All three alternatives are rejected with stated, verifiable reasons. No model is dismissed by assertion.

**Result: PASS**

---

### Criterion 4 — JWT `sub` is the future source for `requestContext.actorId`

**What to verify:** Section 5 establishes the `sub` → `actorId` mapping as a binding constraint with a clear pipeline flow.

**Independent check:**

Decision gate Section 5:
> "The verified JWT `sub` claim is the future authoritative source for `requestContext.actorId` in all real enforcement code paths."

The pipeline diagram in Section 5 shows:
```
Authorization: Bearer <JWT>
  ↓ authGuard: verify signature, validate exp/iss/aud
  ↓ sub claim extracted from verified payload
  ↓ requestContext.actorId = verifiedToken.sub
  ↓ workspaceContextGuard consumes actorId
  ↓ permissionGuard consumes actorId via evaluatePermissionGuard
```

This mapping is consistent with:
- `src/permission-guard.ts` — `EvaluatePermissionGuardInput.requestContext.actorId: string` accepts any string; the interface is compatible with a verified `sub` claim without modification
- `src/request-context.ts` — `RequestContext.actorId: string` already has the correct shape
- Decision 1 of PR #37 — bearer token is the authoritative identity source; the `sub` claim is the JWT bearer token's identity representation

Section 5 also correctly notes: "No changes to `src/request-context.ts` or `src/permission-guard.ts` are authorized by this gate. The `RequestContext { workspaceId: string; actorId: string }` interface already has the correct shape." This is confirmed by reading `src/request-context.ts` lines 5–8 — the interface is unchanged.

The constraint for future execution gates is explicit: "Any execution gate that wires `evaluatePermissionGuard` into a real enforcement path must demonstrate that `requestContext.actorId` is populated from a token-verified `sub` claim, not from the `x-nashir-actor-id` header."

**Finding:** The `sub` → `actorId` rule is accurately recorded as a binding constraint. The current source interface is compatible without modification.

**Result: PASS**

---

### Criterion 5 — Allowed token claims are identity/validation-only

**What to verify:** Section 6 permits only `sub`, `iss`, `aud`, `exp`, `iat`, and optionally `email` (non-authoritative). No authorization or membership claims are in the allowed set.

**Independent check:**

Decision gate Section 6 lists six allowed claims:

| Claim | Correctly bounded? | Notes |
|---|---|---|
| `sub` | ✓ | "Only verified identity claim trusted for enforcement. Mapped to `requestContext.actorId`." |
| `iss` | ✓ | "Not used after validation." Validation claim only. |
| `aud` | ✓ | "Not used after validation." Validation claim only. Audience value is unresolved (Section 11). |
| `exp` | ✓ | "Mandatory validation." Expiration is a validation claim. |
| `iat` | ✓ | "Validated as a sanity check." Issued-at is a validation claim. |
| `email` | ✓ | "Optional and non-authoritative... May be used for display or logging only... `sub` is authoritative." |

No authorization claims (`roles`, `permissions`, `workspaces`, `scope` carrying `nashir.*`) appear in Section 6. The allowed set is strictly identity (`sub`) and validation (`iss`, `aud`, `exp`, `iat`) claims, with one optional informational claim (`email`) correctly bounded as non-authoritative.

The constraint at the end of Section 6 is important and correct: "No implementation gate may add a claim to this allowed set without explicitly opening a new decision gate to justify the addition." This prevents claims from creeping into the trusted set via implementation gates.

**Finding:** The allowed claim set is correctly bounded to identity and validation claims. The `email` carve-out is properly conditioned. The constraint against unauthorized claim additions is explicit.

**Result: PASS**

---

### Criterion 6 — Tokens must not carry workspace membership, roles, `grantedPermissions`, permission inventory, or authorization decisions

**What to verify:** Section 7 explicitly prohibits all five categories of unauthorized token claims, each traced to a prior gate decision.

**Independent check:**

Decision gate Section 7 lists five prohibited categories:

| Category | Present | Traced to |
|---|---|---|
| Workspace membership (`workspaces`, `workspace_ids`, `member_of`) | ✓ | Decision 2, PR #37: "membership resolved server-side; stale token claims cannot satisfy `x-membership-check: non-disclosing`" |
| Roles (`role`, `roles`, `workspace_role`) | ✓ | Decision 3, PR #37: "role is a property of the server-side membership record" |
| `grantedPermissions` or equivalent (`permissions`, `scopes` carrying `nashir.*`) | ✓ | Decision 5, PR #37: "`grantedPermissions` must never be caller-supplied; a token claim is produced outside backend control" |
| Permission inventory (array of permission strings) | ✓ | Decision 5, PR #37: "permission set is the output of server-controlled role-to-permission mapping" |
| Workspace authorization decisions (`can_access_workspace`, `workspace_admin`) | ✓ | Decision 6, PR #37: "authorization decisions belong to `workspaceContextGuard` and `permissionGuard` pipeline layers" |

All five prohibited categories are present. Each is traced to a specific prior gate decision (Decisions 2, 3, 5, or 6 from PR #37). The constraint for future gates is explicitly binding: "Any execution gate that discovers a JWT carrying any of these prohibited claim categories must fail review."

**Finding:** Section 7 correctly and completely prohibits all five unauthorized claim categories. Each prohibition is grounded in a prior gate decision and is independently verifiable against the authority contract.

**Result: PASS**

---

### Criterion 7 — `workspaceId` remains route/workspace-context derived

**What to verify:** Section 8 confirms `workspaceId` for enforcement comes from the route path parameter `{workspaceId}`, not from a token claim.

**Independent check:**

Decision gate Section 8:
> "`workspaceId` for permission enforcement and membership lookup must come from the route path parameter `{workspaceId}`, not from any token claim."

The binding constraint for future execution gates:
> "The `authGuard` implementation must not extract a workspace claim from the JWT and use it as the `workspaceId` for enforcement."

And the pipeline sequence:
- `authGuard` → `actorId` from `sub` only; does not set `workspaceId`
- `workspaceContextGuard` → `workspaceId` from route path parameter
- `permissionGuard` → `resourceWorkspaceId` from route path parameter (not header)

This is consistent with:
- Authority `x-workspace-scope: route` annotation — confirmed on 89 workspace-scoped routes in `nashir_v1_openapi.yaml`
- Source-of-truth decision gate Section 8 (PR #37): "`resourceWorkspaceId` must be set to the route's `{workspaceId}` path parameter value"
- `src/permission-guard.ts` lines 77–81: workspace isolation check via `resourceWorkspaceId !== requestContext.workspaceId`

Section 8 correctly preserves the `x-nashir-workspace-id` header for correlation/diagnostics while constraining it from enforcement authority.

**Finding:** Section 8 is accurate and consistent with the authority contract and all prior gate decisions. The `authGuard` scope is correctly bounded to identity only.

**Result: PASS**

---

### Criterion 8 — `x-nashir-actor-id` remains transitional/non-production only

**What to verify:** Section 9 correctly constrains `x-nashir-actor-id` to the diagnostic harness and prohibits its promotion to verified identity in any enforcement path.

**Independent check:**

Decision gate Section 9 defines the current state binding:
- `x-nashir-actor-id` populates `requestContext.actorId` via `resolveRequestContextFromHeaders` in `src/request-context.ts`
- Used exclusively by opt-in diagnostic harness routes (`enableInternalPermissionGuardHarnessRoutes === true`, default `false`)
- All harness routes return HTTP 200 diagnostic JSON — no enforcement
- `src/index.ts` calls `buildApp()` with no options — harness routes never registered in production

All four points are independently verified:
- `src/request-context.ts` line 2: `ACTOR_ID_HEADER = "x-nashir-actor-id"` — the only `actorId` source in current runtime
- `src/app.ts` line 161: `if (enableInternalPermissionGuardHarnessRoutes === true)` — strict equality, default false
- `src/app.ts` lines 57–79: `permissionGuardHarnessHandler` always returns `{ ok: true, decision }` at HTTP 200

The constraint for future gates:
> "Any execution gate introducing a real enforcement route must demonstrate that `requestContext.actorId` is populated from a token-verified `sub` claim on that code path. The `x-nashir-actor-id` header path in `src/request-context.ts` may be retained for the diagnostic harness or retired... but it must never be the identity source for production enforcement."

**Finding:** Section 9 accurately describes the current state and correctly defines the enforcement-era constraint. The transitional boundary is precise and consistent with Decision 1 of PR #37.

**Result: PASS**

---

### Criterion 9 — JWKS requirements include configurable endpoint, TTL < rotation interval, and rate-limited `kid` refresh

**What to verify:** Section 10 explicitly records all three operational JWKS requirements as binding constraints.

**Independent check:**

Decision gate Section 10 has three entries:

**Configurable JWKS endpoint URI:**
> "The JWKS endpoint URL must be configurable via environment variable or config file. Hard-coded URIs are not acceptable — the same verification code must work in dev, staging, and production by changing configuration only."

This is correct and necessary: the JWKS URI varies by provider and environment. Hard-coding would prevent moving between environments or changing providers without a code change.

**Cache TTL shorter than provider rotation interval:**
> "The backend's JWKS cache TTL must be set shorter than the provider's key rotation interval. A TTL equal to or longer than the rotation interval risks holding stale public keys and rejecting valid tokens after rotation."

This is correct. If the TTL equals or exceeds the rotation interval, the cache may not refresh between the old key being retired and the new key becoming authoritative, causing verification failures for valid tokens.

**Rate-limited on-demand refresh for unknown `kid`:**
> "When a JWT presents a `kid` (key ID) not present in the cached JWKS, the verification layer must support an on-demand refresh of the JWKS. This refresh must be rate-limited to prevent an attacker from triggering repeated JWKS fetches by presenting tokens with fabricated `kid` values."

This is correct and addresses a real attack surface. Without rate limiting, an attacker can present JWTs with arbitrary `kid` values to induce repeated JWKS fetches, potentially overwhelming the JWKS endpoint or the backend itself. The rate-limit parameters (minimum refresh interval) are correctly deferred to the execution planning gate.

Section 10 closes with: "These three requirements are not negotiable — any implementation that omits the cache TTL constraint or the rate-limited `kid` refresh constraint must fail its execution review gate." This is appropriately strong language for security-relevant operational requirements.

**Finding:** All three required JWKS operational requirements are present and accurately stated. The constraints are correctly framed as binding pre-conditions for the execution planning gate.

**Result: PASS**

---

### Criterion 10 — All seven required deferred decisions remain explicit

**What to verify:** Section 11 tracks all seven required deferred decisions: provider selection, JWKS endpoint URI, audience value, key rotation TTL values, local test token strategy, final JWT verification library, and `ErrorModel` response mapping.

**Independent check against decision gate Section 11:**

| Required deferred decision | Present | Planning gate entry |
|---|---|---|
| Auth provider selection | ✓ | Item 1: "Auth0, AWS Cognito, Clerk, Okta, Firebase Auth, Supabase Auth, Keycloak, or other" |
| JWKS endpoint URI | ✓ | Item 2: "Depends on provider selection. Must be configurable." |
| Audience value | ✓ | Item 3: "`aud` value the backend validates against. Typically a service identifier." |
| Key rotation TTL values | ✓ | Item 4: "Concrete TTL duration and minimum refresh interval depend on the provider's rotation schedule." |
| Local test token strategy | ✓ | Item 5: "locally generated key pair with a mock JWKS fixture; specific tooling deferred" |
| Final JWT verification library | ✓ | Item 6: "`jose` is the leading candidate. Final selection... deferred to execution planning gate." |
| `ErrorModel` response mapping | ✓ | Item 7: "constrained by the `ErrorModel` alignment gap... Implementation must wait for the `ErrorModel` alignment gate." |

All seven required deferred decisions are present. A correct eighth item is also tracked: `RequestContext` interface evolution (whether to add a `verifiedToken` field). This is appropriately deferred to the workspace membership planning gate.

Each deferred decision is genuinely unresolved — none is settled by the authority contract or prior gates.

**Finding:** All seven required deferred decisions are tracked with precision sufficient for downstream gate planning. None is prematurely settled.

**Result: PASS**

---

### Criterion 11 — Non-authorization boundary is complete

**What to verify:** Section 13 explicitly prohibits all required implementation categories.

**Independent check against decision gate Section 13:**

| Required prohibition | Present |
|---|---|
| No JWT/JWKS code | ✓ — "JWT verification library installation or wiring"; "JWKS endpoint fetch, cache, or key rotation handling"; "bearer token parsing, signature verification, or claim extraction" |
| No auth provider integration | ✓ — "auth provider integration or configuration" |
| No DB access | ✓ — "database schema, ORM, migration, or SQL" |
| No SQL/migrations/ORM | ✓ — same entry |
| No role storage | ✓ — "role-to-permission mapping or permission resolution service" |
| No product routes | ✓ — "product routes of any kind" |
| No broad permission enforcement | ✓ — "wiring `evaluatePermissionGuard` into any call site other than the existing `permissionGuardHarnessHandler`" |
| No generated clients | ✓ — "generated client changes" |
| No OpenAPI changes | ✓ — "OpenAPI or contract-document changes" |
| No env/secrets config | ✓ — "environment-variable or secrets configuration" |
| No deployment / pilot / production | ✓ — "deployment, pilot readiness, or production readiness" |
| `authGuard` middleware / Fastify hook | ✓ — explicitly named |
| Named source files | ✓ — `src/request-context.ts`, `src/app.ts`, `src/permission-guard.ts`, `src/error-model.ts` all listed |
| Named packages | ✓ — `jose`, `jsonwebtoken`, auth SDKs listed |
| `package.json` / `pnpm-lock.yaml` | ✓ — explicitly listed |

All required categories are present. Section 13 is the most specific in the Slice 0 gate sequence and leaves no ambiguity about what the decision gate does not authorize.

**Finding:** The non-authorization boundary is complete. No required prohibition is absent.

**Result: PASS**

---

### Criterion 12 — PR #41 changed only the expected documentation file

**What to verify:** The PR #41 merge commit touched only `docs/nashir_backend_slice_0_auth_token_format_verification_decision_gate.md`.

**Independent check:**

`git show --stat 3eb49e632b7754feccae076c99055dacea194480`:
```
...auth_token_format_verification_decision_gate.md | 344 +++++++++++++++++++++
 1 file changed, 344 insertions(+)
```

One file, `docs/` directory, documentation gate only. No changes to `src/`, `tests/`, `package.json`, `pnpm-lock.yaml`, workflow files, OpenAPI files, generated files, SQL/migration files, or environment configuration.

**Finding:** PR #41 is clean. Scope is exactly what the gate permits.

**Result: PASS**

---

## 4. PASS/FAIL Summary

| # | Criterion | Result |
|---|---|---|
| 1 | Decision gate remains documentation-only | PASS |
| 2 | Model A (JWT + JWKS) formally and bindingly selected | PASS |
| 3 | All three rejected alternatives recorded with reasons | PASS |
| 4 | JWT `sub` is the future source for `requestContext.actorId`; constraint for execution gates is explicit | PASS |
| 5 | Allowed claims limited to `sub`, `iss`, `aud`, `exp`, `iat`, `email` (non-authoritative only) | PASS |
| 6 | Tokens must not carry membership, roles, `grantedPermissions`, permission inventory, or auth decisions | PASS |
| 7 | `workspaceId` remains route path-parameter derived; `authGuard` does not set workspace scope | PASS |
| 8 | `x-nashir-actor-id` remains diagnostic-harness-era only; real enforcement must not trust it | PASS |
| 9 | JWKS: configurable endpoint; cache TTL < rotation interval; rate-limited `kid` refresh | PASS |
| 10 | All 7 required deferred decisions remain explicit and genuinely unresolved | PASS |
| 11 | Non-authorization boundary complete | PASS |
| 12 | PR #41 changed only the one permitted documentation file | PASS |

**All 12 criteria: PASS**

---

## 5. Independent Observation — Next Gate Sequencing

The decision gate's Section 12 and Section 15 recommend the **auth token verification execution planning gate** as the highest-priority next step. This review gate redirects to the **auth provider selection planning gate** first, for the following reason:

Four of the eight unresolved decisions in Section 11 — provider selection (item 1), JWKS endpoint URI (item 2), audience value (item 3), and key rotation TTL values (item 4) — are **mutually dependent on the provider choice**. The JWKS URI is the provider's JWKS endpoint; the audience value must match what the provider issues; the rotation TTL must be shorter than the provider's rotation schedule. None of these three can be specified without first selecting the provider.

The execution planning gate (decision gate's Section 12, item 1) is described as resolving items 5, 6, 7, and 8 (test token strategy, library selection, `ErrorModel` mapping, `RequestContext` evolution). These four items are provider-independent and could be planned in parallel. However, the execution planning gate would be incomplete without also resolving items 1–4 — and an execution plan that defers the JWKS URI, audience, and rotation policy cannot produce a complete `authGuard` implementation specification.

**Conclusion:** Selecting the provider first yields a complete, self-contained execution planning gate. Entering execution planning without the provider produces a gate that must be re-opened when the provider is chosen. The safer sequence is:

> provider selection planning → provider selection review → provider decision → execution planning → execution review → execution

The four provider-independent items (library, test strategy, `ErrorModel` mapping, `RequestContext` evolution) may be addressed in the execution planning gate once the provider is known.

---

## 6. Non-Authorization Boundary

This review gate does not authorize, and must NOT be read as approving, any of the following:

- implementation of any auth provider integration or configuration
- implementation of any JWT verification library installation or wiring
- implementation of any JWKS endpoint fetch, cache, or key rotation handling
- implementation of any bearer token parsing, signature verification, or claim extraction
- implementation of any `authGuard` middleware or Fastify hook
- changes to `src/request-context.ts`, `src/app.ts`, `src/permission-guard.ts`, or `src/error-model.ts`
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

## 7. GO / NO-GO Decision

**Decision: GO** to the **Backend Slice 0 Auth Provider Selection Planning Gate** — because:

- All 12 review criteria pass.
- The decision gate accurately records Model A as the binding strategy with five confirmed reasons and three rejected alternatives.
- The `sub` → `actorId` identity rule is correctly stated, consistent with the pipeline boundary from Decision 6 of PR #37, and compatible with the current `RequestContext` interface without modification.
- The allowed and prohibited claim sets are correctly bounded and traced to prior gate decisions.
- The `workspaceId` sourcing constraint is consistent with the authority's `x-workspace-scope: route` annotation and all prior gate decisions.
- The `x-nashir-actor-id` transitional boundary is accurately stated and independently verified against `src/request-context.ts` and `src/app.ts`.
- All three JWKS operational requirements are present and correctly framed as binding pre-conditions.
- All seven required deferred decisions remain explicitly unresolved. Four of them (provider, JWKS URI, audience, rotation policy) are interdependent on the provider choice — the safer next step is to resolve the provider first, making the subsequent execution planning gate complete and provider-specific.
- The non-authorization boundary is complete.
- PR #41 changed exactly one file in `docs/`. Scope was clean.

**NO-GO** for everything listed in Section 6 above.

---

## 8. Recommended Next Gate

**Backend Slice 0 Auth Provider Selection Planning Gate** — a documentation-only planning gate that evaluates auth provider candidates and selects one for Nashir backend Slice 0.

That gate must:

- Evaluate candidate auth providers (Auth0, AWS Cognito, Clerk, Okta, Firebase Authentication, Supabase Auth, Keycloak, and any others relevant to the deployment environment) against criteria including: JWT issuance with standard JWKS, production SLA, pricing model, local development story, Node.js SDK maturity, and team familiarity
- Recommend exactly one provider — or record that provider selection is deferred with explicit conditions that must be met before an execution gate opens
- Confirm the JWKS endpoint URI format for the recommended provider
- Confirm the expected `aud` claim format for the recommended provider
- Confirm the provider's key rotation schedule and the resulting JWKS cache TTL constraint
- Remain documentation-only — it must not authorize any provider SDK installation, credentials configuration, or tenant setup
- Be reviewed by its own dedicated review gate before any provider-specific configuration proceeds
- Carry forward this gate's Section 6 non-authorization boundary verbatim

That planning gate must NOT be read as authorizing provider account creation, SDK installation, environment variable configuration, or any implementation work.

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

# Confirm PR #41 changed only the decision gate doc
git show --stat 3eb49e632b7754feccae076c99055dacea194480

# Confirm RequestContext has only workspaceId and actorId — no token, sub, or role fields
grep -n "interface RequestContext" src/request-context.ts

# Confirm x-nashir-actor-id is still the only actorId source
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

# Confirm x-workspace-scope: route annotation count
grep -c "x-workspace-scope: route" ../nashir/docs/nashir_v1_openapi.yaml
```
