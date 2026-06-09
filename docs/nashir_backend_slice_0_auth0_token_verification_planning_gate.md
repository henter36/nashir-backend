# Nashir Backend Slice 0 Auth0 Token Verification Planning Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only planning gate |
| Authorization source | `docs/nashir_backend_slice_0_auth_provider_selection_review_gate.md` (PR #44) |
| PR #44 merge commit (provider selection review gate) | `d2cd43d` |
| PR #43 merge commit (provider selection gate) | `00f1a384221e8578a83777ced9acdd2f14db5e7f` |
| PR #41 merge commit (token format decision gate) | `3eb49e632b7754feccae076c99055dacea194480` |
| Authority repository | `henter36/nashir` |
| Authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation, package changes, JWT middleware, Auth0 SDK integration, API routes, database changes, migrations, or deployment/secrets configuration of any kind |

---

## 1. Scope

PR #44's provider selection review gate passed all 7 criteria and authorized this planning gate. Prior binding decisions established that Auth0 is the V1 external identity provider and that JWT + JWKS is the token verification strategy. Those decisions are settled and are not re-opened here.

This gate plans the `authGuard` token verification layer at the design level. It records:

1. The verification sequence the `authGuard` must execute
2. Which JWT fields are trusted and for what purpose
3. Which Auth0-specific claims must be explicitly ignored
4. The planned runtime boundaries between token verification, identity extraction, and authorization
5. Deferred decisions that must be resolved before an execution gate may be opened

This gate does not open an execution gate. It produces a GO / NO-GO decision to the Backend Slice 0 Auth0 Token Verification Planning Review Gate.

---

## 2. Inputs Used for Planning

| Input | Purpose |
|---|---|
| `docs/nashir_backend_slice_0_auth_provider_selection_gate.md` (PR #43) | Auth0's bounded role, trusted claim set, 8 deferred decisions |
| `docs/nashir_backend_slice_0_auth_provider_selection_review_gate.md` (PR #44) | Authorization source for this planning gate; GO confirmed |
| `docs/nashir_backend_slice_0_auth_token_format_verification_decision_gate.md` (PR #41) | Binding JWT + JWKS strategy; `sub` → `actorId` rule; JWKS operational requirements |
| `docs/nashir_backend_slice_0_auth_rbac_source_of_truth_decision_gate.md` (PR #37) | Six binding source-of-truth decisions: identity = token, membership = DB, role = DB, permission mapping = server-controlled, no caller-supplied `grantedPermissions`, pipeline boundary |
| `src/request-context.ts` | Current `RequestContext { workspaceId: string; actorId: string }`; `x-nashir-actor-id` is the current (harness-era) `actorId` source — to be replaced by verified `sub` |
| `src/app.ts` | Current pipeline: `resolveRequestContextFromHeaders` in `onRequest`; `STATIC_HARNESS_GRANTED_PERMISSIONS` is the only `grantedPermissions` source; no product routes |
| `src/permission-guard.ts` | `evaluatePermissionGuard` accepts `requestContext: { workspaceId, actorId }` — the interface that a verified `sub` must satisfy |
| `henter36/nashir` `docs/nashir_v1_openapi.yaml` (commit `04f54f8`) | `bearerAuth` scheme: `type: http`, `scheme: bearer`; `x-workspace-scope: route` on all workspace-scoped routes |

---

## 3. Settled Constraints Entering This Gate

| Constraint | Source |
|---|---|
| Bearer token is the authoritative identity source | Decision 1, PR #37 |
| `x-nashir-actor-id` must not be trusted for real enforcement | Decision 1, PR #37 |
| Workspace membership resolved server-side — not token-embedded | Decision 2, PR #37 |
| Roles resolved server-side — not token-embedded | Decision 3, PR #37 |
| `grantedPermissions` must never be caller-supplied | Decision 5, PR #37 |
| Pipeline boundary: `authGuard → workspaceContextGuard → permissionGuard` | Decision 6, PR #37 |
| Token verification strategy: JWT with JWKS | Decision 1, PR #41 |
| Verified JWT `sub` → `requestContext.actorId` (binding) | Decision 2, PR #41 |
| JWKS: configurable endpoint, cache TTL < rotation interval, rate-limited `kid`-triggered refresh | PR #41, confirmed PR #42 |
| Auth0 is the V1 external identity provider, identity-only | Decision, PR #43 |
| Auth0 Organizations, Roles, and Permissions are not Nashir authorization authority | PR #43, Section 3 |

---

## 4. Planned Auth0 Verification Model

### 4.1 Verification sequence

The `authGuard` must execute these steps in order. Every step must succeed; any failure rejects the request.

| Step | What is verified | Reject on |
|---|---|---|
| 1. Token presence | `Authorization: Bearer <token>` header is present and non-blank | Missing or malformed `Authorization` header |
| 2. JWT structure | Token is a well-formed JWT (three base64url segments: header, payload, signature) | Malformed token that cannot be parsed |
| 3. `kid` extraction | JWS header parameter `kid` is present in the JWT header | Missing `kid` — cannot select JWKS key |
| 4. JWKS key retrieval | Public key matching `kid` is fetched from the Auth0 JWKS endpoint (cache-first, rate-limited refresh) | Unknown `kid` after refresh; JWKS endpoint unavailable |
| 5. Signature verification | JWT signature is valid against the retrieved public key | Invalid signature |
| 6. Issuer validation | `iss` matches the configured Auth0 issuer (`https://<tenant>.auth0.com/`) | `iss` absent or does not match |
| 7. Audience validation | `aud` contains or matches the configured Nashir API audience identifier | `aud` absent or does not match |
| 8. Expiration validation | `exp` is present and the token has not expired | `exp` absent or token is expired |
| 9. `sub` extraction | `sub` is present and non-blank | `sub` absent or blank |
| 10. `actorId` binding | Verified `sub` value is written to `requestContext.actorId` | — (downstream guards enforce workspace and permission checks) |

Steps 5–9 must be performed after the signature is verified. Claims from an unverified token must not be used for any step beyond `kid` extraction (step 3) and structural parsing (step 2).

### 4.2 JWKS caching and refresh

The JWKS key cache must satisfy the operational requirements established in PR #41:

- Cache is keyed by `kid`
- Cache TTL must be strictly less than Auth0's signing key rotation interval (exact value deferred — Section 7)
- On cache miss for a known `kid`, the JWKS endpoint is re-fetched once
- Rate limiting must prevent unbounded re-fetches triggered by tokens with manufactured or unknown `kid` values
- JWKS endpoint URI is configurable — not hardcoded (exact value deferred — Section 7)

### 4.3 Error responses

Token verification failures must produce appropriate HTTP responses. Error response shape must align with the authority `ErrorModel` (deferred to the error model alignment gate; tracked in prior gates). Planned failure modes:

| Failure | HTTP status |
|---|---|
| Missing or malformed `Authorization` header | 401 |
| Malformed JWT structure | 401 |
| Invalid signature | 401 |
| Expired token | 401 |
| Issuer mismatch | 401 |
| Audience mismatch | 401 |
| Missing `sub` | 401 |
| Unknown `kid` after JWKS refresh | 401 |
| JWKS endpoint unavailable | 503 (or 401 — deferred to execution planning gate) |

---

## 5. Trusted Token Fields

All trusted fields are read only after signature verification succeeds (steps 5–9 above).

### 5.1 JWT payload claims (verified)

| Claim | Type | Use in `authGuard` |
|---|---|---|
| `iss` | string | Validated against the configured Auth0 issuer. Value must match exactly. |
| `aud` | string or string[] | Validated against the configured Nashir API audience. |
| `sub` | string | Verified user identity. Written to `requestContext.actorId`. |
| `exp` | number (Unix timestamp) | Mandatory expiration check. |
| `iat` | number (Unix timestamp) | Sanity check against tokens issued significantly in the future. |

### 5.2 JWT/JWS header parameter (used before payload verification)

| Parameter | Type | Use in `authGuard` |
|---|---|---|
| `kid` | string | Key identifier. Used to select the matching public key from the JWKS endpoint. Not forwarded to application logic after verification. |

`kid` is a JWS header parameter, not a JWT payload claim. It is present in the unverified token header and is used only to retrieve the correct JWKS public key before signature verification. It has no authorization meaning after that step.

---

## 6. Auth0 Claims Explicitly Not Trusted

The following claims must be ignored by the backend in V1, even if present in Auth0-issued JWTs. No downstream layer may use them for authorization decisions.

| Claim / field | Why excluded |
|---|---|
| `org_id` | Auth0 Organizations feature — not Nashir workspace authority (PR #43, Section 3) |
| `permissions` | Auth0 Permissions feature — Nashir's `grantedPermissions` must be server-controlled (Decision 5, PR #37) |
| `roles` | Auth0 Roles feature — Nashir roles are server-side DB (Decision 3, PR #37) |
| `https://nashir.app/*` custom namespace claims | Any custom namespace claims injected via Auth0 Actions or Rules — not trusted in V1 |
| `app_metadata` | Auth0 management metadata — not an authorization source for Nashir |
| `user_metadata` | User-supplied metadata — never used for authorization |
| Any claim not listed in Section 5 | Default-deny: only explicitly listed claims are trusted |

---

## 7. Planned Runtime Boundaries

### 7.1 What `authGuard` does

- Extracts the `Authorization: Bearer` token from the request
- Executes the full verification sequence (Section 4.1)
- On success: binds verified `sub` to `requestContext.actorId`
- On failure: returns a 4xx/5xx response immediately; the request does not reach `workspaceContextGuard` or `permissionGuard`

### 7.2 What `authGuard` does not do

- `authGuard` does not resolve workspace membership — that is `workspaceContextGuard`'s responsibility
- `authGuard` does not resolve roles or permissions — that is the server-controlled mapping layer
- `authGuard` does not call `evaluatePermissionGuard`
- `authGuard` does not read or write the Nashir DB
- `authGuard` does not interpret any Auth0 claim beyond `iss`, `aud`, `sub`, `exp`, `iat`
- `authGuard` does not surface any claim value to product route handlers

### 7.3 Pipeline position

```
Authorization: Bearer <JWT>
  └─ authGuard
       ├─ verify signature, iss, aud, exp, sub
       └─ requestContext.actorId = verifiedToken.sub
            └─ workspaceContextGuard
                 ├─ workspaceId from route path param (x-workspace-scope: route)
                 └─ membership check against Nashir DB (x-membership-check: non-disclosing)
                      └─ permissionGuard
                           └─ evaluatePermissionGuard(requiredPermission, grantedPermissions, requestContext)
```

### 7.4 `requestContext` evolution

The current `RequestContext { workspaceId: string; actorId: string }` shape satisfies the post-verification pipeline. No new fields are required in `RequestContext` to support the `authGuard` layer. `workspaceId` continues to be sourced from the route path parameter, not from the token.

The `x-nashir-actor-id` header remains present as a transitional harness mechanism. It must not be used as a verified identity source in any real enforcement context (Decision 1, PR #37). The execution planning gate must plan its removal from the production request path.

---

## 8. Deferred Decisions

All nine decisions below are explicitly unresolved by this gate. Each must be addressed before an execution gate may be opened.

| # | Unresolved decision | Notes |
|---|---|---|
| 1 | **Auth0 tenant domain / issuer** | Determines the exact `iss` value and the JWKS URI base. |
| 2 | **API audience value** | The Auth0 API identifier registered as the audience for this backend. |
| 3 | **JWKS endpoint URI** | Derived from the tenant domain. Exact value depends on decision 1. |
| 4 | **JWKS cache TTL** | Must be strictly less than Auth0's signing key rotation interval. Exact value depends on Auth0's rotation schedule. |
| 5 | **Token TTL assumptions** | Access token lifetime configured in Auth0 API settings. Affects session window design. |
| 6 | **Key rotation behavior** | Auth0's signing key rotation schedule; backend response: on-demand `kid`-triggered refresh, rate-limiting strategy, cache invalidation behavior. |
| 7 | **Local test token strategy** | How signed test JWTs are generated without a live Auth0 tenant. Established approach (PR #41): locally generated RSA key pair with a mock JWKS fixture. Specific tooling (test helper, fixture file, generation script) deferred to execution planning gate. |
| 8 | **Environment variable names** | Variable names for: Auth0 issuer URL, Auth0 audience, JWKS URI (or derivable from issuer), and any other verification configuration. |
| 9 | **JWT verification library** | The npm package used to verify JWTs and fetch/cache JWKS keys. Leading candidate: `jose` (Web Crypto API-based, standards-aligned, no native bindings). Alternatives (`jsonwebtoken` + manual JWKS, Auth0 SDK) must be evaluated against the no-native-bindings and minimal-dependency constraints before selection. Library selection must happen in the execution planning gate, not here. |

---

## 9. Risk Review

The following risks must be addressed in the execution planning gate and resolved before any auth token verification code is written.

### Risk 1 — Accepting unsigned or algorithmically downgraded tokens

An `alg: none` JWT or a token signed with a weak or unexpected algorithm (e.g., HS256 when RS256 is expected) must be rejected before signature verification is attempted. The verification library must be configured to accept only the expected algorithm(s). Default-permissive `alg` acceptance is a known class of JWT security vulnerability.

**Mitigation plan:** The execution planning gate must specify the expected algorithm explicitly (Auth0 currently issues RS256 and ES256). The library must be called with an explicit algorithm allowlist, not a wildcard.

### Risk 2 — Trusting claims from an unverified token

Any use of token claims before signature verification succeeds — including `iss`, `aud`, `sub`, or any other field — would allow an attacker to inject arbitrary claim values. Only `kid` (for JWKS key lookup) and structural parsing may occur before signature verification. All claim reads for validation or business logic must occur after successful signature verification.

**Mitigation plan:** The verification sequence (Section 4.1) imposes this order explicitly. The execution planning gate must verify the chosen library enforces this order by default or documents how to enforce it.

### Risk 3 — Confusing `kid` (JWS header parameter) with payload claims

`kid` is a JWS header parameter, not a JWT payload claim. It resides in the unverified token header. Its only purpose is to select the correct JWKS public key. It must not be forwarded to application logic, stored as identity, or used as a trust signal after key selection.

**Mitigation plan:** Section 5.2 records this distinction. The execution planning gate must confirm the library separates header parameters from verified claims in its API.

### Risk 4 — Treating Auth0 Organizations, Roles, or Permissions as Nashir authorization authority

Auth0 issues tokens that may contain `org_id`, `roles`, `permissions`, and custom namespace claims. Passing any of these to `evaluatePermissionGuard` or to any workspace/membership lookup would violate Decision 3, Decision 5 (PR #37), and the binding exclusion from PR #43.

**Mitigation plan:** Section 6 enumerates all excluded claims. The execution planning gate must confirm no claim beyond `sub` (for `actorId`) is read from the verified token payload.

### Risk 5 — Over-coupling to Auth0 SDK

Installing the Auth0 authentication SDK or management client couples the verification layer to Auth0-specific abstractions and introduces dependencies that are not needed for JWT + JWKS verification. The Jose RFC standard library (`jose`) provides JWT verification and JWKS fetching without Auth0-specific coupling, making future provider migration lower-risk.

**Mitigation plan:** Library selection (deferred decision 9) must evaluate coupling risk explicitly. The Auth0 SDK must not be selected unless no standards-compliant alternative satisfies all requirements.

### Risk 6 — Unbounded JWKS re-fetch on manufactured `kid` values

An attacker can send tokens with arbitrary `kid` values to trigger repeated JWKS endpoint fetches, potentially exhausting the JWKS endpoint's rate limit or degrading backend performance. The JWKS cache and refresh logic must apply rate limiting and maximum retry caps on `kid` cache miss refreshes.

**Mitigation plan:** Section 4.2 states the rate-limiting requirement. The execution planning gate must specify the exact rate-limit strategy and cap.

---

## 10. Non-Authorization Boundary

This gate does not authorize, and must NOT be read as approving, any of the following:

- implementation of any JWT verification middleware, `authGuard` hook, or Fastify plugin
- installation of any npm packages (`jose`, `jsonwebtoken`, `auth0`, `express-oauth2-jwt-bearer`, or any equivalent)
- changes to `package.json` or `pnpm-lock.yaml`
- creation of any Auth0 tenant, application, API registration, or management client
- changes to `src/request-context.ts`, `src/app.ts`, `src/permission-guard.ts`, or `src/error-model.ts`
- changes to any other file in `src/` or `tests/`
- any database schema, ORM, migration, or SQL
- product routes of any kind
- wiring `evaluatePermissionGuard` into any call site other than the existing `permissionGuardHarnessHandler`
- any extension of the static harness fixture
- OpenAPI or contract-document changes
- environment-variable or secrets configuration
- CI workflow changes
- deployment, pilot readiness, or production readiness of any kind

---

## 11. GO / NO-GO Decision

**Decision: GO** to the **Backend Slice 0 Auth0 Token Verification Planning Review Gate** — because:

- The verification sequence is fully specified (Section 4.1) and consistent with the JWT + JWKS strategy from PR #41 and the Auth0 bounded-role decision from PR #43.
- Trusted token fields are enumerated with purpose and verification-step ordering (Section 5).
- Excluded claims are enumerated with rationale traceable to prior binding decisions (Section 6).
- Runtime boundaries are defined: `authGuard` scope, pipeline position, and what `authGuard` must not do (Section 7).
- Nine deferred decisions are tracked with enough precision for an execution planning gate (Section 8).
- Six risks are identified with mitigation plans (Section 9).
- The non-authorization boundary is complete (Section 10).

**NO-GO** for everything listed in Section 10.

---

## 12. Recommended Next Gate

**Backend Slice 0 Auth0 Token Verification Planning Review Gate** — independently verifies this planning gate.

That review gate must:

- Confirm the verification sequence (Section 4.1) is complete and correctly ordered (signature before claim reads)
- Confirm `kid` is correctly identified as a JWS header parameter, not a payload claim
- Confirm no excluded claim (Section 6) is used for any authorization purpose
- Confirm `authGuard` runtime boundaries (Section 7) are consistent with the `authGuard → workspaceContextGuard → permissionGuard` pipeline (Decision 6, PR #37)
- Confirm all nine deferred decisions are genuinely unresolved
- Confirm all six risks have mitigation plans
- Confirm the non-authorization boundary is complete
- Confirm this gate's PR changed only the one permitted documentation file
- If GO: recommend the **Backend Slice 0 Auth0 Token Verification Execution Planning Gate**
