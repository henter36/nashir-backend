# Nashir Backend Slice 0 Auth0 Token Verification Implementation Authorization Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only implementation authorization gate |
| Authorization source | `docs/nashir_backend_slice_0_auth0_token_verification_execution_planning_review_gate.md` (PR #50) |
| PR #50 merge commit (execution planning review gate) | `80e69fd` |
| PR #49 merge commit (execution planning gate) | `a12780d` |
| PR #47 merge commit (token verification decision gate) | `63f7b94` |
| PR #41 merge commit (token format decision gate) | `3eb49e632b7754feccae076c99055dacea194480` |
| PR #37 merge commit (source-of-truth decision gate) | `540c6133add74d6ff0d124ae60ccb4f64c5dce76` |
| Authority repository | `henter36/nashir` |
| Authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | **Conditionally authorized** — see Section 3. Implementation in the execution gate is authorized only within the explicit scope defined in Section 3. Everything not listed in Section 3 is prohibited. |

---

## 1. Scope

PR #50's execution planning review gate passed all 17 criteria and authorized this implementation authorization gate. This gate is the final governance checkpoint before the execution gate may write code.

This gate records exactly what the execution gate is permitted to implement, the constraints that implementation must satisfy, and what remains prohibited. It does not implement anything itself.

This gate produces a GO / NO-GO decision to the Backend Slice 0 Auth0 Token Verification Implementation Authorization Review Gate.

---

## 2. Settled Constraints (not re-opened)

| Constraint | Source |
|---|---|
| Bearer token is the authoritative identity source | Decision 1, PR #37 |
| `x-nashir-actor-id` must not be trusted for real enforcement | Decision 1, PR #37 |
| Workspace membership resolved server-side — not token-embedded | Decision 2, PR #37 |
| Roles resolved server-side — not token-embedded | Decision 3, PR #37 |
| `grantedPermissions` must never be caller-supplied | Decision 5, PR #37 |
| Pipeline boundary: `authGuard → workspaceContextGuard → permissionGuard` | Decision 6, PR #37 |
| JWT + JWKS verification strategy | Decision 1, PR #41 |
| Verified `sub` → `requestContext.actorId` | Decision 2, PR #41 |
| Auth0 is the V1 external identity provider, identity-only | Decision, PR #43 |
| Auth0 Organizations, Roles, Permissions not Nashir authorization authority | PR #43, Section 3 |
| Signature-first verification | Decision 1, PR #47 |
| Trusted payload claims: `iss`, `aud`, `sub`, `exp`, `iat` only | Decision 3, PR #47 |
| `kid` is a JWS header parameter, not a payload claim | Decision 4, PR #47 |
| Auth0 excluded claims; default-deny on payload claims | Decision 5, PR #47 |
| `authGuard` output is `VerifiedIdentityContext` only | Decision 6, PR #47 |
| `workspaceId` sourced from route path param only | Decision 7, PR #47 |
| `permissionGuard` is the only permission enforcement boundary | Decision 8, PR #47 |
| HTTP error mapping (401 / 503 / 502) | Decision 9, PR #47 |
| `x-nashir-actor-id` and `x-nashir-workspace-id` are transitional harness-only | Decision 10, PR #47 |
| `jose` selected as JWT verification library | PR #49, Section 8.1 |
| `createRemoteJWKSet` TTL requires wrapper or re-initialization | PR #49, Section 6, item 4 |
| `TOKEN_LEEWAY_SECONDS` used for both `exp` and `iat` | PR #49, Sections 4.6–4.7 |

---

## 3. Authorized Implementation Scope

The execution gate is authorized to implement exactly the following items. No implementation beyond this list is authorized.

### 3.1 Package installation

- **`jose`** (production dependency) — JWT verification and JWKS key management
- No other auth-related packages unless a subsequent gate explicitly authorizes them

### 3.2 Configuration validation

A startup-time configuration validator that:

- Reads and validates the following environment variables:

  | Variable | Required | Constraint |
  |---|---|---|
  | `AUTH0_ISSUER_URL` | Yes | Valid HTTPS URL ending with `/`; startup error if absent |
  | `AUTH0_AUDIENCE` | Yes | Non-blank string; startup error if absent |
  | `AUTH0_JWKS_URI` | No | Valid HTTPS URL if provided; default: derived as `${AUTH0_ISSUER_URL}.well-known/jwks.json` |
  | `JWKS_CACHE_TTL_SECONDS` | No | Positive integer; default: `600` |
  | `JWKS_REFRESH_COOLDOWN_SECONDS` | No | Positive integer if provided; default: `300` |
  | `TOKEN_LEEWAY_SECONDS` | No | Integer in `[0, 60]`; default: `0` |

- Throws a startup error with a descriptive message if a required variable is absent or any variable fails its constraint

### 3.3 TypeScript context types

- **`VerifiedIdentityContext`**: `{ actorId: string }` — produced by `authGuard`
- **`FullyResolvedRequestContext`**: extends `VerifiedIdentityContext` with `{ workspaceId: string }` — produced by `workspaceContextGuard`
- The existing `RequestContext` shape must remain compatible; these types may be introduced as aliases or refinements without breaking the existing `evaluatePermissionGuard` call site

### 3.4 `authGuard` implementation

A Fastify `onRequest` hook or preHandler plugin that executes the following sequence, in order, with no deviations:

1. **Token extraction** — extract raw token from `Authorization: Bearer <token>`; reject 401 if absent, wrong scheme, or blank
2. **`kid` extraction** — use `jose.decodeProtectedHeader(token)` to decode only the JWS protected header and extract `kid`; reject 401 if the token/header is malformed or `kid` is absent; do not read any payload field
3. **JWKS key retrieval** — fetch key matching `kid` from the configured JWKS endpoint (cache-first, rate-limited refresh per Section 3.5); reject 401 if `kid` unknown after refresh; reject 503/502 if endpoint unavailable
4. **Signature verification** — call `jose` `jwtVerify` with explicit algorithm allowlist (RS256 and/or ES256); reject 401 on invalid signature; algorithm `none` must not appear in the allowlist
5. **Claim validation** (post-signature only) — validate `iss` (exact match), `aud`, `exp` (with `TOKEN_LEEWAY_SECONDS` leeway), `iat` (future-drift check using `TOKEN_LEEWAY_SECONDS`; skip if absent), `sub` (non-blank); reject 401 on any failure
6. **`actorId` binding** — set `verifiedIdentityContext.actorId = verifiedToken.sub`; hand off to `workspaceContextGuard`

The `authGuard` must not:
- Set `workspaceId` in any context object
- Read any claim beyond those listed in step 5
- Consult `x-nashir-actor-id` or `x-nashir-workspace-id`
- Call `evaluatePermissionGuard`
- Read or write the Nashir DB

### 3.5 JWKS cache implementation

A JWKS cache layer that satisfies:

- Cache TTL bounded by `JWKS_CACHE_TTL_SECONDS` — because `jose`'s `createRemoteJWKSet` does not expose a configurable TTL, the implementation must use a wrapper, periodic re-initialization, or an equivalent mechanism that enforces the TTL boundary
- `kid` cache miss may trigger one JWKS re-fetch, subject to a global `JWKS_REFRESH_COOLDOWN_SECONDS` rate limit across all unknown `kid` values
- Rate-limit enforcement must be global, not per `kid`, to prevent unbounded re-fetches from tokens with manufactured or random `kid` values
- Default `JWKS_REFRESH_COOLDOWN_SECONDS` for implementation authorization is 30 seconds unless a later gate explicitly changes it
- JWKS URI sourced from config, never hardcoded

### 3.6 Error response mapping

| Condition | HTTP status |
|---|---|
| Missing or malformed `Authorization` header | 401 |
| Malformed JWT structure | 401 |
| Missing `kid` in JWS header | 401 |
| Unknown `kid` after JWKS refresh | 401 |
| Invalid signature | 401 |
| Issuer mismatch | 401 |
| Audience mismatch | 401 |
| Expired token | 401 |
| Missing or blank `sub` | 401 |
| JWKS endpoint unavailable | 503 Service Unavailable or 502 Bad Gateway |

Error response body must use the existing `ErrorModel` shape (`code`, `message`, `statusCode`, `correlationId?`). The `ErrorModel` field-name divergence from the authority schema is a tracked deferred item; this execution gate must not widen the divergence.

### 3.7 Auth0 non-authority enforcement

The `authGuard` implementation must not read, forward, or store any of the following:

- `org_id`, `permissions`, `roles`, `https://nashir.app/*` custom namespace claims, `app_metadata`, `user_metadata`
- Any payload claim not in the trusted set (`iss`, `aud`, `sub`, `exp`, `iat`)

No downstream component (`workspaceContextGuard`, `permissionGuard`, route handler) may receive any excluded claim from `authGuard`.

### 3.8 Local test infrastructure

Test-only infrastructure that:

- Generates or uses a fixed RSA 2048-bit key pair (checked-in fixture or generated at test setup)
- Serves a mock JWKS fixture in-memory (no live Auth0 JWKS endpoint)
- Provides a test-token helper that signs JWTs with the test private key
- All JWKS HTTP fetches interceptable at test layer (e.g., `nock`, `msw`, or `jose` key import)
- Unit tests must pass with no network access to any Auth0 endpoint

### 3.9 Transitional header non-trust

The implementation must ensure `x-nashir-actor-id` and `x-nashir-workspace-id` are not consulted by `authGuard`, `workspaceContextGuard`, `permissionGuard`, or any product route handler as a trust source. The execution gate must either remove these headers from the production request path or ensure they are unreachable when a token is present. Harness routes may retain access if the opt-in harness flags remain in place.

---

## 4. Explicit Prohibitions

The execution gate must not implement any of the following. Attempting any item on this list invalidates the authorization.

| Prohibited item | Binding source |
|---|---|
| Product or business API routes (any `app.post`, `app.put`, `app.delete`, `app.patch` for product resources) | Scope constraint |
| Database schema changes, ORM, migrations, SQL | Scope constraint |
| Production Auth0 tenant creation, application registration, or API registration | Scope constraint |
| Auth0 SDK (`express-oauth2-jwt-bearer`, Auth0 management client, or equivalent) | PR #47, Decision 9; PR #45, Risk 5 |
| Auth0 Organizations, Roles, or Permissions as Nashir RBAC authority | PR #47, Decision 5; PR #43, Section 3 |
| `workspaceId` sourced from token, from `x-nashir-workspace-id`, or from any source other than the route path parameter | PR #47, Decision 7 |
| Additional call sites for `evaluatePermissionGuard` beyond the existing `permissionGuardHarnessHandler` | PR #37, Decision 5/6 |
| Caller-supplied `grantedPermissions` from any source | Decision 5, PR #37 |
| OpenAPI or contract-document changes | Scope constraint; requires separate authorization |
| Secrets, environment variable values, or deployment configuration committed to the repository | Scope constraint |
| Broad auth refactor or changes outside the `authGuard` slice | Scope constraint |
| UI or frontend work | Scope constraint |
| Any CI/CD pipeline changes | Scope constraint |

---

## 5. Pre-Implementation Checklist

Before writing any implementation code, the execution gate must confirm:

- [ ] `jose` is the only new production dependency
- [ ] `AUTH0_ISSUER_URL` and `AUTH0_AUDIENCE` are validated at startup; absence is a hard error
- [ ] The algorithm allowlist for `jwtVerify` excludes `alg: none` and any HMAC algorithm
- [ ] Signature verification is called before any payload claim is read
- [ ] `TOKEN_LEEWAY_SECONDS` is applied to both `exp` expiration and `iat` future-drift validation
- [ ] `createRemoteJWKSet` cache TTL behavior is addressed (wrapper or re-initialization strategy chosen and documented)
- [ ] `JWKS_REFRESH_COOLDOWN_SECONDS` rate-limiting is enforced to prevent `kid`-flood attacks
- [ ] `VerifiedIdentityContext` does not include `workspaceId`
- [ ] Unit tests require no network access to any Auth0 endpoint
- [ ] Neither `x-nashir-actor-id` nor `x-nashir-workspace-id` is read in the production path

---

## 6. Non-Authorization Boundary

Nothing in this gate authorizes any item listed in Section 4. The conditional authorization in Section 3 applies only to the execution gate for this slice. It does not authorize any future slice, any adjacent layer, or any implementation beyond the items explicitly listed.

This gate does not itself implement any of the authorized items.

---

## 7. GO / NO-GO Decision

**Decision: GO** to the **Backend Slice 0 Auth0 Token Verification Implementation Authorization Review Gate** — because:

- The authorized implementation scope (Section 3) is tightly bounded to the `authGuard` slice established across PR #37 through PR #50.
- All constraints from prior binding decisions are carried forward in Section 2.
- The explicit prohibitions (Section 4) close every expansion path that is not authorized.
- The pre-implementation checklist (Section 5) provides a verifiable gate for the execution gate before code is written.
- This gate itself is documentation-only.

**NO-GO** for everything listed in Section 4 above.

---

## 8. Recommended Next Gate

**Backend Slice 0 Auth0 Token Verification Implementation Authorization Review Gate** — independently verifies this gate.

That review gate must:

- Confirm the authorized scope (Section 3) is bounded to the `authGuard` slice and does not expand to product routes, DB schema, workspace resolution, or Auth0 SDK
- Confirm `VerifiedIdentityContext` in Section 3.3 does not include `workspaceId`
- Confirm the JWKS cache constraint (Section 3.5) addresses the `createRemoteJWKSet` TTL issue
- Confirm all ten HTTP error mappings are present (Section 3.6), with JWKS unavailability at 503/502
- Confirm the prohibited list (Section 4) covers Auth0 Roles/Permissions/Organizations, additional `evaluatePermissionGuard` call sites, and workspace-from-token sourcing
- Confirm the pre-implementation checklist (Section 5) is complete
- Confirm this gate's PR changed only the one permitted documentation file
- If GO: recommend the **Backend Slice 0 Auth0 Token Verification Execution Gate**
