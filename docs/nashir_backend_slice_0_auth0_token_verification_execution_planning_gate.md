# Nashir Backend Slice 0 Auth0 Token Verification Execution Planning Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only execution planning gate |
| Authorization source | `docs/nashir_backend_slice_0_auth0_token_verification_decision_review_gate.md` (PR #48) |
| PR #48 merge commit (decision review gate) | `a0e67e5` |
| PR #47 merge commit (token verification decision gate) | `63f7b94` |
| PR #45 merge commit (token verification planning gate) | `99e26c6dcce8f94a27ebabf68101f3f03b4121ea` |
| PR #41 merge commit (token format decision gate) | `3eb49e632b7754feccae076c99055dacea194480` |
| PR #37 merge commit (source-of-truth decision gate) | `540c6133add74d6ff0d124ae60ccb4f64c5dce76` |
| Authority repository | `henter36/nashir` |
| Authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation, package changes, source changes, tests, middleware, secrets, deployment, or production readiness of any kind |

---

## 1. Scope

PR #48's decision review gate passed all 15 criteria and authorized this execution planning gate. All binding decisions from PR #47 are settled and are not re-opened here.

This gate plans the concrete implementation of the `authGuard` token verification layer. It resolves or bounds the eleven deferred decisions from PR #47, specifies TypeScript context boundaries, defines the future error contract, and lays out unit and integration test categories. It does not write code, install packages, or modify any source file.

This gate produces a GO / NO-GO decision to the Backend Slice 0 Auth0 Token Verification Execution Planning Review Gate.

---

## 2. Inputs from Previous Gates

| Input | Purpose |
|---|---|
| `docs/nashir_backend_slice_0_auth0_token_verification_decision_gate.md` (PR #47) | Ten binding decisions; eleven deferred decisions to resolve |
| `docs/nashir_backend_slice_0_auth0_token_verification_decision_review_gate.md` (PR #48) | Authorization source; confirms all decisions and deferred items |
| `docs/nashir_backend_slice_0_auth0_token_verification_planning_gate.md` (PR #45) | Six risks with mitigation plans; JWKS caching requirements |
| `docs/nashir_backend_slice_0_auth_token_format_verification_decision_gate.md` (PR #41) | Binding JWT + JWKS strategy; `sub` → `actorId`; JWKS operational requirements |
| `docs/nashir_backend_slice_0_auth_rbac_source_of_truth_decision_gate.md` (PR #37) | Six source-of-truth decisions; pipeline boundary |
| `src/request-context.ts` | Current `RequestContext { workspaceId: string; actorId: string }`; both header constants present |
| `src/app.ts` | Current `onRequest` hook; `resolveRequestContextFromHeaders`; no product routes |
| `src/permission-guard.ts` | `evaluatePermissionGuard` signature — the interface `authGuard` output must satisfy |
| `henter36/nashir` `docs/nashir_v1_openapi.yaml` (commit `04f54f8`) | `bearerAuth`; `x-workspace-scope: route`; `x-membership-check: non-disclosing` |

---

## 3. Execution Objectives

The `authGuard` implementation must:

1. Extract and verify Auth0-issued JWTs from incoming requests
2. Bind the verified `sub` claim to `requestContext.actorId`
3. Reject any request where verification fails — before the request reaches `workspaceContextGuard`
4. Produce a `VerifiedIdentityContext` (see Section 5) — not a fully resolved `RequestContext`
5. Support local testing without a live Auth0 tenant

The implementation must not:

- Resolve workspace membership, roles, or permissions
- Consult `x-nashir-actor-id` or `x-nashir-workspace-id` as identity or workspace sources
- Install the Auth0 SDK or any deep-coupled Auth0 client library
- Accept tokens with algorithm `none` or any algorithm not explicitly allowlisted

---

## 4. Planned Verification Implementation

### 4.1 Token extraction

Extract the raw token string from the `Authorization` header:

```
Authorization: Bearer <token>
```

Reject with 401 if the header is absent, not prefixed with `Bearer `, or the token portion is blank. Do not attempt to parse a token that fails this check.

### 4.2 JWT/JWS structural parsing and `kid` extraction

Parse the token's header segment only (first base64url segment). Extract `kid`. Reject with 401 if:

- The token does not have exactly three base64url segments
- The header segment cannot be decoded and parsed as JSON
- `kid` is absent from the parsed header

`kid` must be used only to select the JWKS key. It must not be read from the payload, forwarded to application logic, or used after key selection.

### 4.3 JWKS key retrieval and caching

Fetch the public key matching the extracted `kid` from the configured JWKS endpoint:

- Cache keyed by `kid`; TTL is a resolved decision (Section 6, item 4)
- On cache miss: re-fetch the JWKS endpoint once; apply the rate-limit cap (Section 6, item 6)
- If `kid` is still unknown after re-fetch: reject with 401
- If the JWKS endpoint is unavailable: reject with 503 Service Unavailable or 502 Bad Gateway

### 4.4 Signature verification

Verify the JWT signature using the retrieved public key and an explicit algorithm allowlist. The `jose` library's `jwtVerify` (or equivalent) must be called with:

- An explicit key object (not a raw secret)
- An explicit `algorithms` option listing the expected Auth0 signing algorithms (RS256 and/or ES256)
- Algorithm `none` must not appear in the allowlist

Reject with 401 on invalid signature.

### 4.5 Post-verification claim validation

After and only after signature verification succeeds, validate:

| Claim | Validation rule |
|---|---|
| `iss` | Exact string match against `AUTH0_ISSUER_URL`. No wildcard or prefix matching. |
| `aud` | Contains or matches `AUTH0_AUDIENCE`. |
| `exp` | Token is not expired. Apply clock skew leeway from config (Section 6, item 10). |
| `iat` | Token was not issued more than a configurable future-skew window ahead of now; if `iat` is absent, skip rather than reject (see Section 4.6). |
| `sub` | Present and non-blank. |

Reject with 401 on any failure.

### 4.6 `iat` validation strategy

`iat` is a sanity check, not a hard trust boundary. Planned behavior:

- If `iat` is present: reject if `iat` is more than `TOKEN_LEEWAY_SECONDS` seconds in the future (configurable). The same leeway value planned for `exp` validation must be used for `iat` future-drift validation to avoid custom temporal-claim behavior that conflicts with standard JWT verification library behavior.
- If `iat` is absent: proceed without rejection — Auth0 includes `iat` by default; absence is unusual but not a security failure on its own
- `iat` is never used to derive a session window; `exp` governs expiration

### 4.7 Clock skew / leeway decision

**Resolved:** clock skew / leeway is a configurable parameter (environment variable `TOKEN_LEEWAY_SECONDS`). Default value: **0 seconds** (no leeway). A non-zero value must be explicitly set in deployment configuration and must not exceed 60 seconds. Rationale: defaulting to zero is the conservative safe choice; operators who need leeway to accommodate clock drift between Auth0 and the backend can set it explicitly.

### 4.8 `actorId` binding

On successful verification: `requestContext.actorId = verifiedToken.sub`. This is the only output `authGuard` writes to the request context before handing off to `workspaceContextGuard`.

---

## 5. TypeScript Context Boundaries

### 5.1 Context types

Two distinct TypeScript types govern the progressive population of the request context:

**`VerifiedIdentityContext`** — produced by `authGuard`:

```typescript
interface VerifiedIdentityContext {
  actorId: string; // verified JWT sub
}
```

**`FullyResolvedRequestContext`** — produced by `workspaceContextGuard`, extending `VerifiedIdentityContext`:

```typescript
interface FullyResolvedRequestContext extends VerifiedIdentityContext {
  workspaceId: string; // from route path parameter
}
```

`FullyResolvedRequestContext` is a rename-compatible superset of the existing `RequestContext`. The existing `RequestContext { workspaceId: string; actorId: string }` shape is preserved; these are planning-time names that the execution gate will formalize.

### 5.2 Boundary rules

- `authGuard` receives a bare request context and produces `VerifiedIdentityContext`
- `authGuard` must not set `workspaceId` or accept it from any header
- `workspaceContextGuard` consumes `VerifiedIdentityContext` and produces `FullyResolvedRequestContext`
- `permissionGuard` / `evaluatePermissionGuard` accepts only `FullyResolvedRequestContext`
- No intermediate type carries both `actorId` and `workspaceId` until after `workspaceContextGuard` completes

### 5.3 Final type name decision

`VerifiedIdentityContext` and `FullyResolvedRequestContext` are the working names for this plan. The execution gate may refine these names. The constraint is immovable: no type that `authGuard` produces may include `workspaceId`.

---

## 6. Resolved and Remaining Deferred Decisions

Eleven decisions were deferred in PR #47. This gate resolves or further bounds each one.

| # | Decision | Resolution status | Plan |
|---|---|---|---|
| 1 | Auth0 tenant domain / issuer | **Deferred to env config** | Provided via `AUTH0_ISSUER_URL` at runtime. Format: `https://<tenant>.auth0.com/`. No default value; absence is a startup error. |
| 2 | API audience value | **Deferred to env config** | Provided via `AUTH0_AUDIENCE` at runtime. No default; absence is a startup error. |
| 3 | JWKS URI | **Resolved: derivable** | Default derivation: `${AUTH0_ISSUER_URL}.well-known/jwks.json`. Can be overridden via `AUTH0_JWKS_URI` for custom domains. |
| 4 | JWKS cache TTL | **Resolved: 10 minutes** | Default `JWKS_CACHE_TTL_SECONDS=600`. Configurable per deployment. If the selected JWT library is `jose` with `createRemoteJWKSet`, execution planning must account for the library's caching behavior explicitly: a strict TTL requires a wrapper, controlled re-initialization of the remote JWK set, or an equivalent cache-boundary mechanism. Unknown `kid` refresh behavior and refresh cooldown must be planned separately from TTL. |
| 5 | Token TTL assumptions | **Noted; not configurable here** | Auth0 access token TTL is set in the Auth0 API settings. Backend assumes tokens may be short-lived (minutes) to medium-lived (hours). Execution gate must not assume any specific TTL. |
| 6 | Key rotation behavior | **Resolved: rate-limited on-demand** | On `kid` cache miss: re-fetch JWKS once; cap at 1 re-fetch per `kid` per 5-minute window (configurable via `JWKS_REFRESH_COOLDOWN_SECONDS=300`). |
| 7 | Local test token strategy | **Resolved: RSA key pair + mock JWKS** | See Section 9. |
| 8 | Environment variable names | **Resolved** | See Section 10. |
| 9 | JWT verification library | **Resolved: `jose`** | See Section 8.1. |
| 10 | Clock skew / leeway | **Resolved: `TOKEN_LEEWAY_SECONDS`, default 0** | See Section 4.7. |
| 11 | TypeScript context type names | **Resolved: working names** | `VerifiedIdentityContext`, `FullyResolvedRequestContext`. See Section 5. |

---

## 7. Auth0 Non-Authority Boundary

The following must not be read, forwarded, stored, or used by any backend component in V1. This boundary carries forward verbatim from PR #47 Decision 5.

| Excluded claim / feature | Binding source |
|---|---|
| `org_id` — Auth0 Organizations | PR #43, Section 3; PR #47, Decision 5 |
| `permissions` — Auth0 Permissions | Decision 5, PR #37; PR #47, Decision 5 |
| `roles` — Auth0 Roles | Decision 3, PR #37; PR #47, Decision 5 |
| `https://nashir.app/*` — custom namespace claims | PR #47, Decision 5 |
| `app_metadata` | PR #47, Decision 5 |
| `user_metadata` | PR #47, Decision 5 |

Default-deny: any payload claim not listed in Section 4.5 of this gate is excluded.

---

## 8. Package / Library Plan

### 8.1 Selected library: `jose`

**`jose`** is selected as the JWT verification and JWKS client library.

Selection rationale:

| Criterion | `jose` |
|---|---|
| Standards-aligned | RFC 7515 (JWS), RFC 7517 (JWK), RFC 7519 (JWT) |
| No native bindings | Pure TypeScript / Web Crypto API — no node-gyp, no binary compilation |
| JWKS fetching built-in | `createRemoteJWKSet` handles endpoint fetch, caching, and `kid`-based key selection |
| Algorithm enforcement | Explicit `algorithms` option in `jwtVerify` — rejects `alg: none` by default |
| No Auth0 SDK coupling | Standalone library with no Auth0 management client dependency |
| Actively maintained | Current major version with Node.js LTS support |

Alternatives evaluated and rejected:

| Alternative | Reason rejected |
|---|---|
| `jsonwebtoken` + manual JWKS | Manual JWKS fetch and caching increases attack surface; no built-in `kid`-based key rotation |
| Auth0 `express-oauth2-jwt-bearer` | Over-couples verification layer to Auth0-specific abstractions; violates PR #45 Risk 5 |
| `passport-jwt` | Framework-coupling without benefit; unnecessary abstraction layer |

### 8.2 Installation constraint

`jose` will be installed as a production dependency in the execution gate. This gate does not authorize that installation. `package.json` and `pnpm-lock.yaml` must not be modified in this PR.

### 8.3 Safety constraints

- `jwtVerify` must always be called with an explicit `algorithms` option
- `createRemoteJWKSet` must always be initialized with the config-provided JWKS URI, never a hardcoded string
- The raw token string must never be logged

---

## 9. Local Test Token Strategy

Unit and integration tests must not depend on a live Auth0 tenant. The planned strategy:

### 9.1 Test RSA key pair

Generate a 2048-bit RSA key pair at test setup time (or as a checked-in fixture). The private key signs test tokens; the public key populates the mock JWKS fixture.

### 9.2 Mock JWKS fixture

A static in-memory JWKS response containing the test public key, formatted to the standard JWKS JSON structure (`{ keys: [{ kty, n, e, kid, use, alg }] }`). The mock JWKS server (or in-memory interceptor) serves this fixture in place of the Auth0 JWKS endpoint.

### 9.3 Deterministic test tokens

Test tokens are generated by signing a known payload with the test private key. Each token must specify:

- `iss`: a fixed test issuer string (e.g., `https://test.auth0.example.com/`)
- `aud`: a fixed test audience string
- `sub`: a test subject value (e.g., `auth0|test-user-id`)
- `exp`: current time + a short TTL (e.g., 300 seconds)
- `iat`: current time
- `kid`: the `kid` of the test key in the mock JWKS

Specific tooling (test helper module, fixture file path, generation script) is deferred to the execution gate.

### 9.4 No live Auth0 dependency for unit tests

Unit tests must be able to run offline. Any JWKS HTTP fetch must be interceptable at the test layer (e.g., `nock`, `msw`, or equivalent). The choice of HTTP interceptor is deferred to the execution gate.

---

## 10. Environment and Configuration Plan

All configuration values are provided via environment variables. Absence of a required variable must cause a startup-time error with a clear message, never a silent fallback.

| Variable | Required | Description | Default |
|---|---|---|---|
| `AUTH0_ISSUER_URL` | Yes | Auth0 tenant issuer URL. Must end with `/`. Format: `https://<tenant>.auth0.com/`. | None — startup error if absent |
| `AUTH0_AUDIENCE` | Yes | Nashir API audience identifier registered in Auth0. | None — startup error if absent |
| `AUTH0_JWKS_URI` | No | Explicit JWKS endpoint URI. If absent, derived as `${AUTH0_ISSUER_URL}.well-known/jwks.json`. | Derived from `AUTH0_ISSUER_URL` |
| `JWKS_CACHE_TTL_SECONDS` | No | JWKS cache TTL in seconds. Must be less than Auth0's key rotation interval. | `600` (10 minutes) |
| `JWKS_REFRESH_COOLDOWN_SECONDS` | No | Minimum interval between JWKS re-fetches on `kid` cache miss. | `300` (5 minutes) |
| `TOKEN_LEEWAY_SECONDS` | No | Clock skew tolerance for `exp` validation in seconds. Must not exceed 60. | `0` |

Validation rules for startup:

- `AUTH0_ISSUER_URL` must be a valid HTTPS URL ending with `/`
- `AUTH0_AUDIENCE` must be a non-blank string
- `JWKS_CACHE_TTL_SECONDS` must be a positive integer
- `JWKS_REFRESH_COOLDOWN_SECONDS` must be a positive integer if provided
- `TOKEN_LEEWAY_SECONDS` must be an integer in `[0, 60]`

---

## 11. Test Planning

No tests are implemented in this gate. The categories below define what the execution gate must cover.

### 11.1 Unit test categories

| Category | Key cases |
|---|---|
| Token extraction | Missing `Authorization` header; wrong scheme (not `Bearer`); blank token portion |
| `kid` extraction | Missing `kid`; malformed header segment; non-string `kid` |
| Signature verification | Valid token; tampered payload; tampered header; wrong algorithm (`alg: none` must reject); expired key |
| Issuer validation | Matching issuer; non-matching issuer; missing `iss` |
| Audience validation | Matching audience (string); matching audience (array); non-matching audience; missing `aud` |
| Expiration validation | Valid token; expired token (no leeway); expired token within leeway; expired token beyond leeway |
| `iat` validation | Present and valid; present and far-future; absent (must not reject) |
| `sub` extraction | Present and non-blank; missing; blank string |
| `actorId` binding | Verified `sub` correctly written to `requestContext.actorId` |
| Excluded claims | `org_id`, `permissions`, `roles`, custom namespace claims not present in `VerifiedIdentityContext` |

### 11.2 Integration test categories

| Category | Key cases |
|---|---|
| Full pipeline | Valid token → `authGuard` → `workspaceContextGuard` → `permissionGuard` → allowed |
| Auth failure propagation | Invalid token → 401 before `workspaceContextGuard` is reached |
| JWKS unavailable | Mock JWKS endpoint returns 503 → `authGuard` returns 503/502 |
| Unknown `kid` | Token with unknown `kid` after JWKS re-fetch → 401 |
| Harness isolation | `x-nashir-actor-id` and `x-nashir-workspace-id` ignored by `authGuard`; harness routes still use existing mechanism |

### 11.3 Negative security tests

| Test | What it verifies |
|---|---|
| `alg: none` token | Must be rejected by `jwtVerify` algorithm allowlist |
| Token signed with wrong key | Must reject with 401 |
| Token with `org_id` claim | `org_id` must not appear in `VerifiedIdentityContext` or be passed downstream |
| Token with `permissions` claim | `permissions` must not appear in `VerifiedIdentityContext` or be passed downstream |
| Manufactured `kid` flood | Rate-limited re-fetch prevents more than one JWKS call per `kid` per cooldown window |
| Expired token | Rejected regardless of `iat` validity |
| Future `iat` (within leeway) | Accepted if within configured leeway |
| Future `iat` (beyond leeway × 2) | Rejected |

---

## 12. Transitional Header Removal Plan

`x-nashir-actor-id` and `x-nashir-workspace-id` are the current harness-era context sources. Once `authGuard` and `workspaceContextGuard` are implemented:

- `resolveRequestContextFromHeaders` in `src/request-context.ts` is replaced by the token verification + route extraction pipeline
- `ACTOR_ID_HEADER` (`x-nashir-actor-id`) is removed from the production request path
- `WORKSPACE_ID_HEADER` (`x-nashir-workspace-id`) is removed from the production request path
- Both headers may remain accessible only to the opt-in internal harness routes (if harness routes are retained; their fate is a separate decision)
- Neither header must be read by `authGuard`, `workspaceContextGuard`, `permissionGuard`, or any product route handler as a trust source

The execution gate must plan this removal explicitly. It must not leave a code path where the harness headers are consulted as a fallback when a token is present.

---

## 13. Non-Authorization Boundary

This gate does not authorize, and must NOT be read as approving, any of the following:

- implementation of any JWT verification middleware, `authGuard` hook, or Fastify plugin
- installation of `jose` or any other npm package
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

## 14. GO / NO-GO Decision

**Decision: GO** to the **Backend Slice 0 Auth0 Token Verification Execution Planning Review Gate** — because:

- Execution objectives are defined (Section 3)
- The planned implementation sequence (Sections 4.1–4.8) is complete and consistent with PR #47 binding decisions
- TypeScript context boundaries are specified with working type names (`VerifiedIdentityContext`, `FullyResolvedRequestContext`) (Section 5)
- All eleven deferred decisions from PR #47 are resolved or bounded (Section 6)
- `jose` is selected as the JWT verification library with coupling risk evaluated (Section 8)
- Local test token strategy is specified (Section 9)
- Environment variables are named and validated (Section 10)
- Test categories cover unit, integration, and negative security cases (Section 11)
- Transitional header removal plan is specified (Section 12)
- The non-authorization boundary is complete (Section 13)

**NO-GO** for everything listed in Section 13 above.

---

## 15. Recommended Next Gate

**Backend Slice 0 Auth0 Token Verification Execution Planning Review Gate** — independently verifies this gate.

That review gate must:

- Confirm the planned verification sequence (Section 4) is consistent with PR #47 Decision 1 (signature-first) and PR #47 Decision 9 (error mapping)
- Confirm `VerifiedIdentityContext` does not include `workspaceId` and `FullyResolvedRequestContext` is only produced after `workspaceContextGuard`
- Confirm `jose` selection meets the coupling-risk criteria from PR #45 Risk 5
- Confirm `TOKEN_LEEWAY_SECONDS` defaults to 0 and is capped at 60
- Confirm the local test strategy requires no live Auth0 dependency
- Confirm the transitional header removal plan names both headers and all three guard layers
- Confirm all eleven deferred decisions are resolved or explicitly bounded
- Confirm the non-authorization boundary is complete
- Confirm this gate's PR changed only the one permitted documentation file
- If GO: recommend the **Backend Slice 0 Auth0 Token Verification Execution Gate**
