# Nashir Backend Slice 0 Auth0 Token Verification Decision Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only decision gate |
| Authorization source | `docs/nashir_backend_slice_0_auth0_token_verification_planning_review_gate.md` (PR #46) |
| PR #46 merge commit (planning review gate) | `3e6014f` |
| PR #45 merge commit (token verification planning gate) | `99e26c6dcce8f94a27ebabf68101f3f03b4121ea` |
| PR #43 merge commit (provider selection gate) | `00f1a384221e8578a83777ced9acdd2f14db5e7f` |
| PR #41 merge commit (token format decision gate) | `3eb49e632b7754feccae076c99055dacea194480` |
| PR #37 merge commit (source-of-truth decision gate) | `540c6133add74d6ff0d124ae60ccb4f64c5dce76` |
| Authority repository | `henter36/nashir` |
| Authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation, package changes, JWT middleware, Auth0 SDK integration, source changes, tests, API routes, database changes, migrations, secrets, or deployment/production readiness of any kind |

---

## 1. Scope

PR #46's planning review gate passed all 10 criteria and authorized this decision gate. The planning gate (PR #45) specified what the `authGuard` must do; this gate records the binding decisions that flow from that plan. Those decisions are carried forward unchanged into all future gates.

This gate decides the Auth0 token verification contract for Backend Slice 0. It does not implement that contract. It produces a GO / NO-GO decision to the Backend Slice 0 Auth0 Token Verification Decision Review Gate.

---

## 2. Settled Constraints Entering This Gate

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
| Auth0 Organizations, Roles, Permissions not Nashir authorization authority | PR #43, Section 3 |
| Planned `authGuard` 10-step verification sequence | PR #45, Section 4.1 |
| JWKS endpoint failures: 503/502, not 401 | PR #45, Section 4.3; confirmed PR #46 Criterion 8 |
| Clock skew / leeway: execution-planning input, not yet decided | PR #46, Observation A |

---

## 3. Binding Decisions

### Decision 1 — Signature-first verification

`authGuard` must verify the JWT signature against the JWKS-retrieved public key **before** reading or trusting any JWT payload claim. The following operations are permitted on the unverified token:

- Structural parsing (confirming three base64url-encoded segments)
- `kid` extraction from the JWS header

All payload claim reads — including `iss`, `aud`, `sub`, `exp`, `iat` — must occur after and only after the signature is verified. This rule is not negotiable and must be enforced by library configuration if the chosen library supports it, or by explicit ordering if it does not.

---

### Decision 2 — Required validation steps

After signature verification, `authGuard` must validate all of the following. Any failure rejects the request with 401.

| Validation | Binding rule |
|---|---|
| Issuer (`iss`) | Must exactly match the configured Auth0 issuer value. No wildcard or prefix matching. |
| Audience (`aud`) | Must contain or match the configured Nashir API audience identifier. |
| Expiration (`exp`) | Token must not be expired. Clock skew / leeway tolerance is a deferred decision (Section 5, item 10). |
| Subject (`sub`) | Must be present and non-blank. |

---

### Decision 3 — Trusted JWT payload claims

The following JWT payload claims are trusted after signature verification. No other payload claim is trusted.

| Claim | Type | Authorized use |
|---|---|---|
| `iss` | string | Issuer validation only (Decision 2) |
| `aud` | string or string[] | Audience validation only (Decision 2) |
| `sub` | string | Identity binding: `requestContext.actorId = verifiedToken.sub` |
| `exp` | number (Unix timestamp) | Expiration validation only (Decision 2) |
| `iat` | number (Unix timestamp) | Sanity check against implausibly future-issued tokens |

---

### Decision 4 — `kid` is a JWS header parameter, not a payload claim

`kid` is present in the unverified JWT header. Its sole authorized use is selecting the matching public key from the JWKS endpoint before signature verification. `kid` has no authorization meaning after key selection. It must not be:

- forwarded to application logic
- stored as identity
- used as a trust signal for any authorization decision
- confused with JWT payload claims in library configuration or application code

---

### Decision 5 — Auth0-specific claims are excluded from Nashir authorization

The following claims must be ignored by the backend in V1, regardless of whether they are present in Auth0-issued JWTs. No component downstream of `authGuard` may use them.

| Claim | Auth0 feature | Why excluded |
|---|---|---|
| `org_id` | Auth0 Organizations | Not Nashir workspace authority (PR #43, Section 3) |
| `permissions` | Auth0 Permissions | `grantedPermissions` must be server-controlled (Decision 5, PR #37) |
| `roles` | Auth0 Roles | Roles are server-side DB (Decision 3, PR #37) |
| `https://nashir.app/*` | Custom namespace | Not trusted in V1 |
| `app_metadata` | Management metadata | Not an authorization source |
| `user_metadata` | User-supplied metadata | Never used for authorization |

Default-deny rule: any claim not listed in Decision 3 or Decision 4 of this gate is excluded.

---

### Decision 6 — `authGuard` output is verified identity context only

`authGuard` produces one output: `requestContext.actorId` populated with the verified `sub` value. It does not produce a fully resolved `RequestContext`. Specifically:

- `authGuard` does not set `requestContext.workspaceId`
- `authGuard` does not resolve workspace membership
- `authGuard` does not resolve roles or permissions
- `authGuard` does not call `evaluatePermissionGuard`
- `authGuard` does not read or write the Nashir DB

After `authGuard` completes, `requestContext.actorId` is populated and `requestContext.workspaceId` is not yet populated.

---

### Decision 7 — `workspaceId` is resolved only by `workspaceContextGuard`

`workspaceId` is sourced from the route path parameter (`x-workspace-scope: route`, authority OpenAPI). It must not be sourced from the JWT, from any token claim, or from any header other than the route path. `workspaceContextGuard` is the only component authorized to populate `requestContext.workspaceId`.

---

### Decision 8 — `permissionGuard` remains the only permission enforcement boundary

After workspace resolution, `evaluatePermissionGuard` remains the only call site for permission enforcement. It accepts `grantedPermissions` from the server-controlled mapping layer only. No component between `authGuard` and `permissionGuard` may make an access-allow decision.

---

### Decision 9 — HTTP error response mapping

| Failure condition | HTTP status |
|---|---|
| Missing or malformed `Authorization` header | 401 |
| Malformed JWT structure | 401 |
| Invalid signature | 401 |
| Issuer mismatch | 401 |
| Audience mismatch | 401 |
| Expired token | 401 |
| Missing or blank `sub` | 401 |
| Unknown `kid` after JWKS refresh | 401 |
| JWKS endpoint unavailable | 503 Service Unavailable or 502 Bad Gateway |

JWKS endpoint failure returns 503/502 because it is a backend infrastructure failure, not a token authentication failure. 401 is not permitted for JWKS retrieval failures.

Error response body shape must align with the authority `ErrorModel`. Exact field mapping is deferred to the `ErrorModel` alignment gate (tracked in prior gates).

---

### Decision 10 — `x-nashir-actor-id` remains transitional, test-harness only

The `x-nashir-actor-id` header is the current harness-era identity source. It must not be used as a verified identity source in any real enforcement context (Decision 1, PR #37). The execution planning gate must plan its removal from the production request path and ensure it is never consulted by `authGuard` or any downstream guard as a trust source.

---

## 4. Token Verification Pipeline (binding)

```
Authorization: Bearer <JWT>
  └─ authGuard
       ├─ [pre-verification] parse JWT structure → extract kid from JWS header
       ├─ fetch JWKS key matching kid (cache-first, rate-limited refresh)
       ├─ verify signature
       ├─ [post-verification] validate iss, aud, exp; extract sub
       └─ requestContext.actorId = verifiedToken.sub
            └─ workspaceContextGuard
                 ├─ workspaceId from route path param (x-workspace-scope: route)
                 └─ server-side membership check (x-membership-check: non-disclosing)
                      └─ permissionGuard
                           └─ evaluatePermissionGuard(requiredPermission, grantedPermissions, requestContext)
```

The annotation `[pre-verification]` and `[post-verification]` are binding labels. No payload claim read may appear in the `[pre-verification]` segment.

---

## 5. Deferred Decisions

The following decisions are explicitly unresolved by this gate. Each must be addressed before an execution gate may be opened.

| # | Unresolved decision | Notes |
|---|---|---|
| 1 | **Auth0 tenant domain / issuer** | Determines the exact `iss` value (`https://<tenant>.auth0.com/`) and the JWKS URI base. |
| 2 | **API audience value** | The Auth0 API identifier registered as the audience for this backend. |
| 3 | **JWKS URI** | Derived from the tenant domain or configured explicitly. Exact value depends on item 1. |
| 4 | **JWKS cache TTL** | Must be strictly less than Auth0's signing key rotation interval. |
| 5 | **Token TTL assumptions** | Access token lifetime in Auth0 API settings. Affects session window design. |
| 6 | **Key rotation behavior** | Auth0's rotation schedule; rate-limit strategy for `kid`-miss refresh; cache invalidation. |
| 7 | **Local test token strategy** | Locally generated RSA key pair with a mock JWKS fixture. Specific tooling deferred to execution planning gate. |
| 8 | **Environment variable names** | For: Auth0 issuer URL, API audience, JWKS URI (or derivable from issuer). |
| 9 | **JWT verification library** | Leading candidate: `jose`. Must be selected in the execution planning gate with explicit coupling-risk evaluation. |
| 10 | **Clock skew / leeway** | Tolerance window for `exp` validation. Must be resolved before any expiration-check code is written. Flagged by PR #46, Observation A. |
| 11 | **Progressive TypeScript context type names** | As `RequestContext` evolves through `authGuard` and `workspaceContextGuard`, intermediate types may be needed. Naming conventions deferred to execution planning gate. |

---

## 6. Non-Authorization Boundary

This gate does not authorize, and must NOT be read as approving, any of the following:

- implementation of any JWT verification middleware, `authGuard` hook, or Fastify plugin
- installation of any npm packages (`jose`, `jsonwebtoken`, `auth0`, or any equivalent)
- changes to `package.json` or `pnpm-lock.yaml`
- creation of any Auth0 tenant, application, or API registration
- changes to `src/request-context.ts`, `src/app.ts`, `src/permission-guard.ts`, or `src/error-model.ts`
- changes to any other file in `src/` or `tests/`
- any database schema, ORM, migration, or SQL
- product routes of any kind
- wiring `evaluatePermissionGuard` into any call site other than the existing `permissionGuardHarnessHandler`
- OpenAPI or contract-document changes
- environment-variable or secrets configuration
- CI workflow changes
- deployment, pilot readiness, or production readiness of any kind

---

## 7. GO / NO-GO Decision

**Decision: GO** to the **Backend Slice 0 Auth0 Token Verification Decision Review Gate** — because:

- Ten binding decisions are recorded (Sections 3–4) covering verification sequence, validation requirements, trusted claims, `kid` scope, excluded Auth0 claims, `authGuard` output boundary, `workspaceId` sourcing, permission enforcement, HTTP error mapping, and `x-nashir-actor-id` disposition.
- All decisions are consistent with the prior gate sequence (PR #37 through PR #46).
- Eleven deferred decisions are tracked (Section 5), including clock skew / leeway (Observation A from PR #46) and TypeScript progressive context type names.
- The non-authorization boundary is complete (Section 6).

**NO-GO** for everything listed in Section 6 above.

---

## 8. Recommended Next Gate

**Backend Slice 0 Auth0 Token Verification Decision Review Gate** — independently verifies this gate's decisions.

That review gate must:

- Verify each binding decision (Decisions 1–10) is consistent with the prior gate sequence
- Verify Decision 1 (signature before claims) is unambiguous and cannot be circumvented
- Verify Decision 4 (`kid` as JWS header parameter only) is clearly separated from payload claims
- Verify Decision 5 (excluded claims) covers all required Auth0 claim categories
- Verify Decision 9 (HTTP error mapping) correctly places JWKS failures at 503/502
- Verify all eleven deferred decisions are genuinely unresolved
- Verify the non-authorization boundary is complete
- Verify this gate's PR changed only the one permitted documentation file
- If GO: recommend the **Backend Slice 0 Auth0 Token Verification Execution Planning Gate**
