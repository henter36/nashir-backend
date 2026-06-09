# Nashir Backend Slice 0 Auth Token Format / Verification Planning Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only planning gate |
| Authorization source | `docs/nashir_backend_slice_0_auth_rbac_source_of_truth_decision_review_gate.md` (PR #38) |
| PR #38 merge commit (decision review gate) | `3a78e49fdcf22e7c77272fb561181fbed4339640` |
| PR #37 merge commit (decision gate) | `540c6133add74d6ff0d124ae60ccb4f64c5dce76` |
| Authority repository | `henter36/nashir` |
| Authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation, auth provider integration, database access, role storage, product routes, broad permission enforcement, generated clients, OpenAPI changes, SQL/migrations/ORM, or deployment of any kind |

---

## 1. Scope

PR #38's decision review gate passed all 13 criteria and reached GO to this planning gate. The six binding source-of-truth decisions from PR #37 are settled and are not re-opened here. This planning gate addresses sub-problem 1 from those decisions: **auth token format and verification**.

This gate does three things:

1. Defines the planning scope: what must be decided before an auth token verification execution gate may be opened
2. Evaluates four candidate token verification models and recommends exactly one planning direction
3. Records what the recommended model constrains for future execution gates — without implementing any of it

This gate does not open an execution gate. It produces a GO / NO-GO decision to the Backend Slice 0 Auth Token Format / Verification Planning Review Gate.

### Settled constraints entering this gate (from prior gates, not re-opened here)

| Constraint | Source |
|---|---|
| Bearer token is the authoritative source for verified identity (`actorId`) | Decision 1, PR #37 |
| `x-nashir-actor-id` header must not be trusted as verified identity in any real enforcement context | Decision 1, PR #37 |
| Workspace membership is server-side DB — not token-embedded | Decision 2, PR #37 |
| Role is server-side DB — not token-embedded | Decision 3, PR #37 |
| Role-to-permission mapping is server-controlled, outputting `nashir.<resource>.<action>[]` | Decision 4, PR #37 |
| `grantedPermissions` must never be caller-supplied | Decision 5, PR #37 |
| Pipeline boundary: `authGuard → workspaceContextGuard → permissionGuard` | Decision 6, PR #37 |
| Token provider and format are deferred to this planning gate | Authority `bearerAuth` description |

---

## 2. Inputs Reviewed

| Input | Purpose |
|---|---|
| `docs/nashir_backend_slice_0_auth_rbac_source_of_truth_decision_review_gate.md` (PR #38) | Authorization source — Section 8 specifies this planning gate's scope and constraints |
| `docs/nashir_backend_slice_0_auth_rbac_source_of_truth_decision_gate.md` (PR #37) | The six binding source-of-truth decisions; Section 9 sub-problem 1 defines what this gate must plan |
| `src/request-context.ts` | Current state: `RequestContext { workspaceId: string; actorId: string }` from caller-supplied headers; the shape that token-verified identity must eventually populate |
| `src/app.ts` | Current state: `resolveRequestContextFromHeaders` called in `onRequest` hook; `STATIC_HARNESS_GRANTED_PERMISSIONS` is the only `grantedPermissions` source; `enableInternalPermissionGuardHarnessRoutes` opt-in flag |
| `src/permission-guard.ts` | `evaluatePermissionGuard` accepts `requestContext: { workspaceId, actorId }` — the interface that token-resolved `actorId` must satisfy |
| `henter36/nashir` `docs/nashir_v1_openapi.yaml` (authority commit `04f54f8`) | `bearerAuth` scheme: type `http`, scheme `bearer`; description defers provider and format; confirms `x-workspace-scope: route`; authority does not specify JWT vs. opaque token |

---

## 3. Current State of Identity Resolution

`src/request-context.ts` resolves `actorId` from the `x-nashir-actor-id` HTTP header: any non-blank string is accepted. There is no signature check, no format validation, no UUID constraint. This is the **diagnostic-harness-era state** — appropriate only for the opt-in internal harness routes.

`src/app.ts`'s `onRequest` hook calls `resolveRequestContextFromHeaders` for all non-health routes. The harness routes pass the header-supplied `actorId` directly to `evaluatePermissionGuard` via `requestContext`. No token is involved anywhere in the current runtime.

**What must change for real enforcement:**

The `authGuard` pipeline layer (Decision 6) must intercept requests before `resolveRequestContextFromHeaders` is used as the `actorId` source for non-harness routes, verify a bearer token, and populate `requestContext.actorId` from the token's verified subject claim. The header-based path remains appropriate only for the diagnostic harness.

---

## 4. Token Verification Model Evaluation

Four candidate models are evaluated. Each is assessed against six criteria relevant to this project's state and constraints.

### Model A — JWT with JWKS verification

**Description:** The backend receives a signed JWT (JSON Web Token, RFC 7519). The `authGuard` verifies the JWT's signature by fetching the issuer's public keys from a JWKS endpoint (RFC 7517). The verified `sub` claim becomes `actorId`.

| Criterion | Assessment |
|---|---|
| **Security** | High. Signature verification is cryptographic. Key rotation is handled via JWKS — the backend fetches current public keys and re-verifies on each request (or caches with a TTL). A compromised private key is mitigated by rotation without backend deployment. |
| **Portability** | High. JWT (RFC 7519) and JWKS (RFC 7517) are open standards. Every major auth provider — Auth0, AWS Cognito, Clerk, Okta, Firebase Authentication, Supabase Auth, Keycloak — issues JWTs with a JWKS endpoint. Provider selection remains deferred. |
| **Local testability** | Good. A test key pair (e.g., RSA or ECDSA) can be generated and used to sign test JWTs locally without any external network dependency. A mock JWKS fixture can serve the public key during tests. The verification logic is fully exercisable offline. |
| **Dependency risk** | Low. Mature, well-maintained TypeScript-native libraries exist (`jose` — pure ESM, no native bindings, works in Node.js and edge runtimes). The standard is stable. No vendor SDK is required. |
| **Future provider flexibility** | High. Because the backend only depends on the JWKS endpoint URL and the JWT standard claims, switching providers means updating the JWKS URL and audience value — not rewriting the verification layer. |
| **Authority compatibility** | Compatible. The authority's `bearerAuth` scheme is type `http`, scheme `bearer`, with the description: "The provider and token format are deferred to a later authorized auth implementation planning gate." JWT with JWKS is the most provider-agnostic standard that satisfies this. The authority does not require a specific format; JWT is the natural fit for a stateless bearer token. |

**Verdict: Primary candidate.**

---

### Model B — Opaque token with introspection

**Description:** The backend receives an opaque reference token (a random identifier). The `authGuard` calls the auth provider's token introspection endpoint (RFC 7662) on every request. The introspection response carries the identity claims.

| Criterion | Assessment |
|---|---|
| **Security** | High. The token itself carries no claims — a leaked token cannot be decoded. Revocation is immediate because the introspection endpoint reflects current token state. |
| **Portability** | Medium. RFC 7662 is a standard but not universally implemented consistently. Some providers require proprietary introspection calls rather than the RFC form. |
| **Local testability** | Harder. Every test that exercises the auth path requires either a live introspection endpoint or a mock HTTP server. This adds infrastructure to the test harness and couples unit tests to network semantics. |
| **Dependency risk** | Medium-high. Every authenticated request requires a synchronous network call to the introspection endpoint. The backend's availability and latency become coupled to the auth provider's availability. A provider outage fails all authenticated requests, not just token issuance. |
| **Future provider flexibility** | Medium. Changing providers may require changing the introspection request format even if both claim RFC 7662 compliance. |
| **Authority compatibility** | Compatible but operationally expensive. The authority's deferral language does not favor or disfavor this model, but the synchronous per-request dependency introduces a failure mode the authority does not anticipate. |

**Verdict: Not the planning direction.** The per-request network dependency introduces availability coupling that Model A avoids. Local testability is materially harder.

---

### Model C — Provider-specific SDK verification

**Description:** The backend integrates a specific auth provider's SDK (e.g., the Auth0 SDK, Clerk backend SDK, or Firebase Admin SDK) to verify tokens.

| Criterion | Assessment |
|---|---|
| **Security** | High, for the chosen provider. |
| **Portability** | Low. The verification logic is tightly coupled to one provider's SDK and token format. |
| **Local testability** | Difficult. Provider SDKs typically require provider-specific infrastructure (tenant configuration, environment variables, test tokens from the provider) even for offline verification. |
| **Dependency risk** | High. Bundling a provider SDK before the provider is selected introduces a dependency that may not match the eventual choice. Changing providers requires replacing the SDK and rewriting the verification layer. |
| **Future provider flexibility** | Very low. The verification layer must be rewritten for any provider change. |
| **Authority compatibility** | Premature. The authority explicitly defers provider selection to this planning gate and a subsequent implementation gate. Selecting a provider SDK here would materially narrow future gates before provider selection is authorized. |

**Verdict: Not the planning direction.** The authority explicitly defers provider selection; provider-specific SDK verification fuses provider selection with verification strategy before the provider selection decision is authorized.

---

### Model D — Temporary dev-only signed token

**Description:** A self-signed token format is introduced as a temporary dev scaffold — similar to the existing `STATIC_HARNESS_GRANTED_PERMISSIONS` pattern — using a locally controlled key.

| Criterion | Assessment |
|---|---|
| **Security** | Low for production. A dev-only scaffold that is not a final verification strategy. |
| **Portability** | Medium. Can be designed to be JWT-shaped, which eases migration to Model A. |
| **Local testability** | Excellent. Fully self-contained, no external dependency. |
| **Dependency risk** | Low — but only because it defers the real verification problem. |
| **Future provider flexibility** | N/A — the scaffold must be replaced entirely for production. |
| **Authority compatibility** | Incompatible with the authority's production requirement. The authority requires bearer token authentication for all non-health routes. A dev-only signed token would satisfy the structure but not the security intent. |

**Verdict: Not the planning direction as a standalone model.** Model D's local testability advantage is already captured by Model A's test key pair approach — a test JWT signed with a locally generated key pair is functionally equivalent to Model D's scaffold, but it exercises the same verification code path that production will use. Building a separate dev-only verification path creates two code paths where one suffices.

---

## 5. Recommended Planning Direction

**Model A — JWT with JWKS verification** is the recommended planning direction, for the following reasons:

1. **Provider-agnostic by design.** Every major auth provider issues JWTs with a JWKS endpoint. Planning around JWT+JWKS keeps provider selection deferred, consistent with the authority's own deferral language. No provider is selected here.

2. **Standard-defined verification algorithm.** JWT verification (signature check, `exp`, `iss`, `aud` validation) is fully specified by RFC 7519 and implementable without provider SDK dependency. The verification layer is portable.

3. **Local testability without external infrastructure.** A test key pair (RSA or ECDSA P-256) can be generated at test time. Test JWTs are signed with the private key. The verification layer fetches the public key from a JWKS fixture rather than a network endpoint. The production code path and the test path are identical — only the JWKS source differs.

4. **Stateless verification.** JWT verification does not require a per-request network call. The backend fetches the JWKS on startup and caches it with a configurable TTL, re-fetching only on key rotation or cache miss. This avoids the availability coupling of Model B.

5. **Compatible with the `authGuard` pipeline assignment.** The `authGuard` layer (Decision 6) maps cleanly to a JWT verification middleware that extracts the verified `sub` claim and populates `requestContext.actorId` before `workspaceContextGuard` runs.

**This recommendation does not select a token provider.** Provider selection (Auth0, Cognito, Clerk, Okta, Firebase Auth, Supabase Auth, self-hosted Keycloak, or other) is explicitly deferred to the auth implementation gate that follows this planning gate's review. The planning direction requires only that the provider issues standard JWTs and exposes a JWKS endpoint.

---

## 6. Identity Claims

### 6.1 Allowed claims the verified JWT may carry

| Claim | JWT standard name | Use in backend |
|---|---|---|
| Subject / user ID | `sub` | Maps directly to `requestContext.actorId`. This is the only verified identity claim the backend trusts for permission enforcement. |
| Issuer | `iss` | Validated against the configured issuer string during JWT verification. Not used after validation. |
| Audience | `aud` | Validated against the configured audience value(s) during JWT verification. The audience value for this backend is an unresolved decision (Section 9). |
| Expiration | `exp` | Validated as mandatory — tokens past their expiration must be rejected. |
| Issued-at | `iat` | Validated as a sanity check — tokens issued in the future may indicate clock skew or token manipulation. |
| Email | `email` | Optional, non-authoritative. May be present in the token but must not be used as the primary identity source. If used at all, it is for display/logging purposes only; `sub` is the authoritative identity. |

### 6.2 Claims the JWT must not carry (or must not be trusted from if present)

The following claims must not appear in a JWT used for Nashir backend enforcement, and if present must be ignored:

| Prohibited claim category | Reason |
|---|---|
| Workspace membership (e.g., `workspaces`, `workspace_ids`, `member_of`) | Membership is resolved server-side on every request (Decision 2). Token-embedded membership cannot satisfy `x-membership-check: non-disclosing` — it is stale and non-revocable in real time. |
| Roles (e.g., `role`, `roles`, `workspace_role`) | Role is a property of the server-side membership record (Decision 3). Token-embedded roles would be stale for the same reason as token-embedded membership. |
| `grantedPermissions` or equivalent (e.g., `permissions`, `scopes` carrying `nashir.*` strings) | `grantedPermissions` must never be caller-supplied (Decision 5). A token that carries permission strings is a form of client-supplied permissions because the token is produced outside the backend's control. |
| Permission inventory (e.g., an array of permission strings beyond what `sub` requires) | Same as above. The permission set is the output of the server-controlled role-to-permission mapping, not a token claim. |
| Workspace authorization decisions (e.g., `can_access_workspace`, `workspace_admin`) | Authorization decisions belong to the `workspaceContextGuard` and `permissionGuard` pipeline layers, not the token. |

**Rationale:** These prohibitions are not new constraints — they follow directly from Decisions 2, 3, 4, and 5 of the source-of-truth decision gate. The JWT's role in the pipeline is narrowly defined: provide a cryptographically verified `sub` claim for the `authGuard` layer. All downstream authorization decisions are made server-side using server-controlled data.

---

## 7. How Verified Token Identity Feeds `requestContext.actorId`

The `authGuard` pipeline layer (to be implemented in a future execution gate) will:

1. Extract the `Authorization: Bearer <token>` header from the incoming request
2. Verify the JWT signature against the JWKS public keys for the configured issuer
3. Validate `exp`, `iss`, and `aud` claims
4. On successful verification, extract the `sub` claim
5. Set `requestContext.actorId = verifiedToken.sub`

The `workspaceContextGuard` and `permissionGuard` layers receive `requestContext.actorId` with the guarantee that it has been cryptographically verified. They do not re-verify the token — they consume the already-verified identity.

**No changes to `src/request-context.ts` are authorized by this gate.** The `RequestContext { workspaceId: string; actorId: string }` interface already has the correct shape for the post-verification world. The `actorId` field will be populated by the `authGuard` from the verified `sub` claim rather than from the `x-nashir-actor-id` header — but this is a change to the call site, not the interface. The interface change question (e.g., whether to add a `verifiedToken` field to `RequestContext`) is deferred to the auth implementation planning gate.

---

## 8. How `workspaceId` Continues to Come from Route Path / Workspace Context

The JWT must not carry workspace membership or workspace identity claims that the backend uses for enforcement. This is settled by Decisions 2 and 4 from the source-of-truth gate and is not re-opened here.

The pipeline remains:

1. **`authGuard`** — verifies the JWT, extracts verified `actorId` from `sub`. Does not determine workspace scope.
2. **`workspaceContextGuard`** — extracts `workspaceId` from the route path parameter `{workspaceId}` for workspace-scoped routes. Uses `(verifiedActorId, workspaceId)` to query DB for active membership. Does not read workspace scope from the token.
3. **`permissionGuard`** — calls `evaluatePermissionGuard` with `resourceWorkspaceId` set to the route path parameter value, not the header-sourced `requestContext.workspaceId`.

The `x-nashir-workspace-id` header continues to populate `requestContext.workspaceId` for correlation and diagnostic purposes in the current harness era, but this value must not be the authoritative workspace scope for enforcement when a path parameter is present. This is the settled `x-workspace-scope: route` design decision from Section 8 of the source-of-truth decision gate.

---

## 9. Transitional Handling of `x-nashir-actor-id`

**Current behavior (harness era):**
- `x-nashir-actor-id` header populates `requestContext.actorId` via `resolveRequestContextFromHeaders`
- This path is used by the opt-in diagnostic harness routes only
- All harness routes return HTTP 200 diagnostic JSON regardless of decision outcome — they do not enforce permissions
- `src/index.ts` calls `buildApp()` with no options — harness routes are never registered in production

**Required behavior (enforcement era):**
- Real enforcement routes must use token-verified `actorId`, not the `x-nashir-actor-id` header
- The `authGuard` middleware extracts `actorId` from the verified JWT `sub` claim
- The `x-nashir-actor-id` header must not be read or trusted in any real enforcement code path

**Transitional boundary:**
- The header-based path in `src/request-context.ts` is retained as-is for the diagnostic harness — this gate does not authorize changes to `src/request-context.ts`
- When the auth implementation execution gate is eventually authorized, it must add the token verification path without removing or breaking the existing harness path — or the harness may be retired at that time; this is a decision for the implementation planning gate that follows this one
- The diagnostic harness (`enableInternalPermissionGuardHarnessRoutes === true`) must remain behind its strict-equality opt-in flag with default `false` through the transitional period
- No production code path may promote `x-nashir-actor-id` to a verified identity source

**Constraint for future execution gates:** Any execution gate that introduces a new call site using `requestContext.actorId` for enforcement decisions must demonstrate that `actorId` is populated from a token-verified source, not from the `x-nashir-actor-id` header. This is an extension of Decision 1 of the source-of-truth gate.

---

## 10. Unresolved Decisions

The following decisions are explicitly not resolved by this planning gate. Each must be addressed before an auth token verification execution gate is authorized.

| # | Unresolved decision | Notes |
|---|---|---|
| 1 | **Token provider selection** | Auth0, AWS Cognito, Clerk, Okta, Firebase Authentication, Supabase Auth, Keycloak, or other. This is the highest-impact choice and depends on deployment environment, cost, team familiarity, and SLA requirements. Deferred to the auth implementation planning gate. |
| 2 | **JWKS endpoint URI** | Depends on provider selection. The URI must be configurable (environment variable or config file) to support dev, staging, and production environments without code changes. |
| 3 | **Token audience claim value(s)** | The `aud` claim value the backend validates against. This is typically a service identifier (e.g., `https://api.nashir.app` or a client ID). Must match what the selected provider issues. |
| 4 | **Key rotation policy** | How frequently the provider rotates signing keys. The backend's JWKS cache TTL must be shorter than the rotation interval. The specific TTL and cache invalidation strategy depend on the provider's rotation policy. |
| 5 | **Local test token strategy** | The mechanism for generating signed test JWTs in the test suite without a live auth provider. The planning direction (Model A) supports a locally generated key pair with a mock JWKS fixture. The specific implementation — test helper, key generation script, or fixture file — is a decision for the auth implementation planning gate. |
| 6 | **Error response mapping for verification failures** | Token verification failures (missing token, expired, bad signature, wrong audience) must produce error responses. The HTTP status codes (401 for missing/invalid, 403 for wrong audience vs. permission denial) and the `ErrorModel` shape for these responses are constrained by the full `ErrorModel` alignment gap (Section 7 of the source-of-truth decision gate). These must not be implemented until the `ErrorModel` alignment gate resolves field names. |
| 7 | **Token verification library** | The Node.js library used to verify JWTs and fetch JWKS. `jose` (pure ESM, no native bindings, standard-compliant, supports Node.js and edge runtimes) is a leading candidate but this is a decision for the implementation planning gate. Selection criteria: pure TypeScript/ESM, no native dependencies, standards-compliant, actively maintained. |
| 8 | **`RequestContext` interface evolution** | Whether `RequestContext` gains a `verifiedToken` or equivalent field to carry post-verification metadata for downstream guards, or whether `actorId: string` remains the only identity surface. This depends on what `workspaceContextGuard` needs — which is a question for the workspace membership planning gate. Deferred. |

---

## 11. What the Next Planning Gate May Plan

This planning gate establishes the direction for sub-problem 1 (auth token format and verification). The Backend Slice 0 Auth Token Format / Verification Planning Review Gate (the next recommended gate) independently verifies this planning gate.

If that review gate reaches GO, it recommends one next narrowly-scoped gate from the following options:

1. **Auth token verification execution planning gate** — Detailed implementation plan for the `authGuard` layer: library selection, JWKS caching strategy, error handling, test token strategy, `RequestContext` evolution. This gate remains documentation-only and must itself be reviewed before execution is authorized. This is the highest-priority next step after the planning review.

2. **Workspace membership model planning gate** — Can be planned in parallel with or after sub-problem 1's execution planning. Depends on a known verified `actorId` interface.

3. **Role and permission model planning gate** — Depends on sub-problems 1 and 2.

4. **`ErrorCode` / `ErrorModel` alignment gate** — Can be planned in parallel; does not depend on sub-problems 1–3 but must not be implemented before a real enforcement call site exists.

5. **Permission-string convention adoption gate** — Can be planned in parallel; relatively small scope.

The next gate after the review gate must remain documentation-only. No execution gate may be opened for auth token verification until the planning gate, its review, and (if needed) an execution planning gate have all passed review.

---

## 12. Non-Authorization Boundary

This planning gate does not authorize, and must NOT be read as approving, any of the following:

- implementation of any auth provider integration or configuration
- implementation of any JWT verification library installation or wiring
- implementation of any JWKS endpoint fetch, cache, or key rotation handling
- implementation of any bearer token parsing, signature verification, or claim extraction
- implementation of any `authGuard` middleware or Fastify hook
- changes to `src/request-context.ts` (including adding token fields, verified sub fields, or renaming `actorId`)
- changes to `src/app.ts` (including adding JWT verification middleware or changing the `onRequest` hook)
- changes to `src/permission-guard.ts`
- changes to `src/error-model.ts`
- installation of any new npm packages (`jose`, `jsonwebtoken`, or any auth SDK)
- changes to `package.json` or `pnpm-lock.yaml`
- implementation of any database schema, ORM, migration, or SQL for workspace membership, role storage, or permission tables
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

## 13. GO / NO-GO Decision

**Decision: GO** to the **Backend Slice 0 Auth Token Format / Verification Planning Review Gate** — because:

- The planning scope for sub-problem 1 (auth token format and verification) is defined in Section 1.
- All four candidate token verification models are evaluated against six criteria in Section 4. Verdicts are grounded in the project's current state and constraints.
- Model A (JWT with JWKS verification) is recommended in Section 5 with defensible reasoning: provider-agnostic, standard-defined, locally testable without external infrastructure, stateless, and aligned with the authority's deferral language. Provider selection remains deferred.
- Allowed identity claims and prohibited token-carried claims are defined in Section 6, grounded in Decisions 2–5 of the source-of-truth gate.
- The token-to-`requestContext.actorId` mapping is defined in Section 7 without authorizing implementation.
- `workspaceId` sourcing from route path parameters is confirmed in Section 8.
- The transitional `x-nashir-actor-id` boundary is defined in Section 9 with a durable constraint for future execution gates.
- Eight unresolved decisions are tracked in Section 10 with enough precision for a future execution planning gate to address each one.
- The non-authorization boundary in Section 12 is complete.

**NO-GO** for everything listed in Section 12.

---

## 14. Recommended Next Gate

**Backend Slice 0 Auth Token Format / Verification Planning Review Gate** — a documentation-only review gate that independently verifies this planning gate.

That review gate must:

- Independently verify (not rely on this gate's self-assessment) that the four-model evaluation is sound, that the Model A recommendation is defensible, and that no model is rejected for unstated reasons
- Verify that the allowed and prohibited claim definitions in Section 6 are consistent with Decisions 2–5 of the source-of-truth gate
- Verify that the token-to-`actorId` mapping in Section 7 is consistent with the `authGuard` pipeline boundary in Decision 6
- Verify that the transitional `x-nashir-actor-id` constraint in Section 9 does not contradict any settled prior gate decision
- Verify that all eight unresolved decisions in Section 10 are genuinely unresolved (i.e., not already settled by the authority or prior gates)
- Verify the non-authorization boundary is complete
- If GO: recommend the next narrowly-scoped planning gate (auth token verification execution planning gate, or any of the parallel sub-problems listed in Section 11)

That review gate must be documentation-only and must carry forward this gate's Section 12 non-authorization boundary.

---

## 15. Verification Commands

```bash
cd ~/workspace/nashir-backend

git fetch origin --quiet
git checkout main
git pull origin main

git log --oneline -8

npm run lint
npm run typecheck
npm test

# Confirm RequestContext has only workspaceId and actorId — no token, verified sub, or role fields
grep -n "interface RequestContext" src/request-context.ts

# Confirm x-nashir-actor-id is still the only actorId source (harness-era state)
grep -n "ACTOR_ID_HEADER\|actorId" src/request-context.ts

# Confirm grantedPermissions is never sourced from request headers
grep -n "grantedPermissions" src/app.ts

# Confirm evaluatePermissionGuard has exactly one runtime call site
grep -n "evaluatePermissionGuard" src/app.ts src/index.ts

# Confirm no product routes
grep -E -n "app\.(post|put|delete|patch)" src/app.ts

# Confirm jose or any JWT library is not yet installed
grep -E "jose|jsonwebtoken|auth0|clerk|cognito" package.json || echo "not installed"

# Confirm authority bearer scheme defers provider and format
grep -A 8 "scheme: bearer" ../nashir/docs/nashir_v1_openapi.yaml

# Confirm authority x-workspace-scope: route annotation
grep -n "x-workspace-scope: route" ../nashir/docs/nashir_v1_openapi.yaml | head -5
```
