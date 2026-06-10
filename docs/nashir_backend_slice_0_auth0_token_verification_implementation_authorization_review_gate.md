# Nashir Backend Slice 0 Auth0 Token Verification Implementation Authorization Review Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only implementation authorization review gate |
| Authorization source | `docs/nashir_backend_slice_0_auth0_token_verification_implementation_authorization_gate.md` (PR #51) |
| PR #51 merge commit (implementation authorization gate) | `e2498c7` |
| PR #50 merge commit (execution planning review gate) | `80e69fd` |
| PR #49 merge commit (execution planning gate) | `a12780d` |
| PR #47 merge commit (token verification decision gate) | `63f7b94` |
| PR #41 merge commit (token format decision gate) | `3eb49e632b7754feccae076c99055dacea194480` |
| PR #37 merge commit (source-of-truth decision gate) | `540c6133add74d6ff0d124ae60ccb4f64c5dce76` |
| Authority repository | `henter36/nashir` |
| Authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation, package changes, source changes, tests, middleware, secrets, deployment, or production readiness of any kind |

---

## 1. Scope

PR #51 merged the Backend Slice 0 Auth0 Token Verification Implementation Authorization Gate. That gate recorded the conditional implementation authorization for the execution gate: authorized scope (Section 3, nine items), prohibited items (Section 4, fourteen items), and a pre-implementation checklist (Section 5, ten items).

This review gate independently verifies those authorizations and prohibitions against the prior gate sequence, live source files, and the PR #51 commit record. It does not rely on the authorization gate's self-assessment. It produces a PASS/FAIL matrix and a GO / NO-GO decision.

---

## 2. Inputs Used for Independent Verification

| Input | How verified |
|---|---|
| `docs/nashir_backend_slice_0_auth0_token_verification_implementation_authorization_gate.md` (PR #51) | Read in full — primary artifact under review |
| `docs/nashir_backend_slice_0_auth0_token_verification_execution_planning_gate.md` (PR #49) | Resolved execution decisions the authorization must be consistent with |
| `docs/nashir_backend_slice_0_auth0_token_verification_decision_gate.md` (PR #47) | Ten binding decisions; error mapping; excluded claims |
| `docs/nashir_backend_slice_0_auth_rbac_source_of_truth_decision_gate.md` (PR #37) | Pipeline boundary; `grantedPermissions` constraint |
| `src/request-context.ts` (`main` HEAD) | `RequestContext { workspaceId, actorId }`; `ACTOR_ID_HEADER`, `WORKSPACE_ID_HEADER` constants present |
| `src/app.ts` (`main` HEAD) | `resolveRequestContextFromHeaders`; `STATIC_HARNESS_GRANTED_PERMISSIONS`; no product routes |
| `src/permission-guard.ts` (`main` HEAD) | `evaluatePermissionGuard` single call site; `EvaluatePermissionGuardInput` shape |
| `package.json` | Confirmed `jose` not yet installed |
| `git show --stat e2498c7` | PR #51 contained two commits (`c8e3747`, `23289e5`); both changed only the one authorization gate document |

---

## 3. Review Criteria and PASS/FAIL Matrix

### Criterion 1 — Authorization gate is documentation-only

**Independent check:**

Authorization gate header: "Implementation authorization: **Conditionally authorized** — see Section 3." Section 6 (non-authorization boundary) states: "Nothing in this gate authorizes any item listed in Section 4. This gate does not itself implement any of the authorized items."

`package.json` confirmed: `jose` not installed. `git show --stat e2498c7` confirms PR #51 changed only the one documentation file across both commits.

**Result: PASS**

---

### Criterion 2 — Implementation authorization is limited to the Auth0 token verification slice only

**Independent check:**

Authorization gate Section 1: "This gate records exactly what the execution gate is permitted to implement... It does not implement anything itself."

Section 3 lists nine authorized items — all are scoped to `authGuard` token verification, configuration validation, TypeScript context types, JWKS caching, error mapping, test infrastructure, and transitional header non-trust. No product routes, workspace logic, DB operations, or permission-mapping changes appear in Section 3.

Section 4 (explicit prohibitions) reinforces the boundary with: "No implementation beyond this list is authorized." The prohibition list closes product routes, DB schema, Auth0 SDK, workspace-from-token, and all other expansion paths.

**Result: PASS**

---

### Criterion 3 — `jose` is the only authorized production JWT verification dependency

**Independent check:**

Authorization gate Section 3.1:
> "`jose` (production dependency) — JWT verification and JWKS key management"
> "No other auth-related packages unless a subsequent gate explicitly authorizes them"

No other JWT or auth library appears in Section 3.1 or anywhere in Section 3. The prohibition list (Section 4) explicitly bans Auth0 SDK and equivalent deep-coupled libraries. Consistent with PR #49 Section 8.1 and PR #47 Decision 9.

**Result: PASS**

---

### Criterion 4 — No Auth0 SDK is authorized as an authorization source

**Independent check:**

Authorization gate Section 4 (explicit prohibitions):
> "Auth0 SDK (`express-oauth2-jwt-bearer`, Auth0 management client, or equivalent) | PR #47, Decision 9; PR #45, Risk 5"

This is a named prohibition with binding source citations. No Auth0 SDK package appears in Section 3.1 or anywhere in the authorized scope. Consistent with PR #47 Decision 9 and the coupling-risk evaluation in PR #49 Section 8.1.

**Result: PASS**

---

### Criterion 5 — Config validation scope covers all six environment variables

**Independent check against authorization gate Section 3.2:**

| Variable | Present | Required | Constraint |
|---|---|---|---|
| `AUTH0_ISSUER_URL` | ✓ | Yes | Valid HTTPS URL ending `/`; startup error if absent |
| `AUTH0_AUDIENCE` | ✓ | Yes | Non-blank string; startup error if absent |
| `AUTH0_JWKS_URI` | ✓ | No | Valid HTTPS URL if provided; default: derived from `AUTH0_ISSUER_URL` |
| `JWKS_CACHE_TTL_SECONDS` | ✓ | No | Positive integer; default: `600` |
| `JWKS_REFRESH_COOLDOWN_SECONDS` | ✓ | No | Positive integer if provided; default: `300` |
| `TOKEN_LEEWAY_SECONDS` | ✓ | No | Integer in `[0, 60]`; default: `0` |

All six are present. Section 3.2 states: "Throws a startup error with a descriptive message if a required variable is absent or any variable fails its constraint."

**Result: PASS**

---

### Criterion 6 — `AUTH0_JWKS_URI` is validated as HTTPS if provided

**Independent check:**

Authorization gate Section 3.2 table, `AUTH0_JWKS_URI` row: "Valid HTTPS URL if provided."

This is the correct constraint: `AUTH0_JWKS_URI` is optional (an override), but if the operator provides it, it must be a valid HTTPS URL to prevent downgrade to an HTTP JWKS endpoint. Consistent with the derivation rule (`${AUTH0_ISSUER_URL}.well-known/jwks.json` is always HTTPS given `AUTH0_ISSUER_URL` validation).

**Result: PASS**

---

### Criterion 7 — `VerifiedIdentityContext` does not include `workspaceId`

**Independent check:**

Authorization gate Section 3.3:
> "`VerifiedIdentityContext`: `{ actorId: string }` — produced by `authGuard`"

`workspaceId` is not present. The type has exactly one field. Consistent with PR #47 Decision 6 and PR #49 Section 5.1.

`src/request-context.ts` confirms the current `RequestContext { workspaceId: string; actorId: string }` — the new `VerifiedIdentityContext` is a strict subset containing only `actorId`, enforcing the boundary at the TypeScript type level.

**Result: PASS**

---

### Criterion 8 — `FullyResolvedRequestContext` includes `workspaceId` only after `workspaceContextGuard`

**Independent check:**

Authorization gate Section 3.3:
> "`FullyResolvedRequestContext`: extends `VerifiedIdentityContext` with `{ workspaceId: string }` — produced by `workspaceContextGuard`"

`workspaceId` appears only in `FullyResolvedRequestContext`, not in `VerifiedIdentityContext`. Section 3.3 also notes the existing `RequestContext` shape must remain compatible — `FullyResolvedRequestContext` is a superset of `RequestContext` and satisfies the existing `evaluatePermissionGuard` call site signature. Consistent with PR #47 Decisions 6 and 7.

**Result: PASS**

---

### Criterion 9 — `authGuard` sequence uses `jose.decodeProtectedHeader(token)` for `kid` extraction; no payload field read before signature verification

**Independent check:**

Authorization gate Section 3.4, step 2 (as refined in PR #51 commit `23289e5`):
> "use `jose.decodeProtectedHeader(token)` to decode only the JWS protected header and extract `kid`; reject 401 if the token/header is malformed or `kid` is absent; do not read any payload field"

`jose.decodeProtectedHeader` is the correct jose API: it decodes only the protected header without verifying the signature or decoding the payload. It does not perform any cryptographic operation and does not expose payload claims. This is the intended use for pre-verification `kid` extraction.

The step adds "do not read any payload field" — enforcing that nothing in steps 1–3 accesses the JWT payload before step 4 (signature verification). Consistent with PR #47 Decision 1 (signature-first) and PR #47 Decision 4 (`kid` is a JWS header parameter).

**Result: PASS**

---

### Criterion 10 — No payload field is read before signature verification

**Independent check:**

Authorization gate Section 3.4 steps 1–3 each have an explicit constraint preventing payload reads:

- Step 1: Token extraction only — no parsing
- Step 2: "`jose.decodeProtectedHeader(token)` to decode only the JWS protected header… do not read any payload field"
- Step 3: JWKS key retrieval using `kid` from step 2 — no payload access

Step 4 is signature verification; step 5 is "Claim validation (post-signature only)" — the heading explicitly labels it as post-signature.

Step 5 opens with: "validate `iss`… `aud`… `exp`… `iat`… `sub`…" — all are payload claims, all validated only after step 4 completes. Consistent with PR #47 Decision 1.

**Result: PASS**

---

### Criterion 11 — Missing `kid` and unknown `kid` after JWKS refresh map to 401

**Independent check:**

Authorization gate Section 3.4, step 2: missing `kid` → "reject 401 if the token/header is malformed or `kid` is absent."

Authorization gate Section 3.4, step 3: unknown `kid` after refresh → "reject 401 if `kid` unknown after refresh."

Authorization gate Section 3.6 error table: both rows present:
```
| Missing `kid` in JWS header | 401 |
| Unknown `kid` after JWKS refresh | 401 |
```

Consistent with PR #47 Decision 9.

**Result: PASS**

---

### Criterion 12 — JWKS endpoint unavailable maps to 503 or 502, never 401

**Independent check:**

Authorization gate Section 3.4, step 3: "reject 503/502 if endpoint unavailable."

Authorization gate Section 3.6 error table:
```
| JWKS endpoint unavailable | 503 Service Unavailable or 502 Bad Gateway |
```

No 401 fallback for JWKS endpoint failure is present anywhere in the authorization gate. Consistent with PR #47 Decision 9 and PR #45 Section 4.3 rationale.

**Result: PASS**

---

### Criterion 13 — JWKS refresh cooldown is global across all unknown `kid` values, not per `kid`

**Independent check:**

Authorization gate Section 3.5 (as refined in PR #51 commit `23289e5`):
> "`kid` cache miss may trigger one JWKS re-fetch, subject to a **global** `JWKS_REFRESH_COOLDOWN_SECONDS` rate limit across all unknown `kid` values"
> "Rate-limit enforcement must be **global, not per `kid`**, to prevent unbounded re-fetches from tokens with manufactured or random `kid` values"

A per-`kid` rate limit is insufficient: an attacker can submit tokens with an unbounded number of unique manufactured `kid` values, each triggering one JWKS re-fetch before its individual cooldown kicks in. A global rate limit caps total JWKS re-fetches regardless of `kid` cardinality.

**Result: PASS**

---

### Criterion 14 — Implementation-authorized default `JWKS_REFRESH_COOLDOWN_SECONDS` is 30 seconds unless a later gate changes it

**Independent check:**

Authorization gate Section 3.5 (as refined in PR #51 commit `23289e5`):
> "Default `JWKS_REFRESH_COOLDOWN_SECONDS` for implementation authorization is 30 seconds unless a later gate explicitly changes it"

Note: the execution planning gate (PR #49 Section 10) listed the default as 300 seconds. The implementation authorization gate overrides this to 30 seconds. The authorization gate takes precedence as the most recent governance document for the execution gate. The constraint "unless a later gate explicitly changes it" preserves the ability for a future gate to revise the value.

**Result: PASS**

---

### Criterion 15 — `TOKEN_LEEWAY_SECONDS` applies consistently to `exp` and `iat` future-drift

**Independent check:**

Authorization gate Section 3.4, step 5:
> "`exp` (with `TOKEN_LEEWAY_SECONDS` leeway), `iat` (future-drift check using `TOKEN_LEEWAY_SECONDS`; skip if absent)"

The same variable (`TOKEN_LEEWAY_SECONDS`) governs both checks. The `iat` skip-if-absent behavior is consistent with PR #49 Section 4.6. Consistent with PR #50 Criterion 6 verification.

**Result: PASS**

---

### Criterion 16 — Algorithm allowlist excludes `none`

**Independent check:**

Authorization gate Section 3.4, step 4:
> "call `jose` `jwtVerify` with explicit algorithm allowlist (RS256 and/or ES256); reject 401 on invalid signature; **algorithm `none` must not appear in the allowlist**"

This constraint is mandatory, not advisory. The pre-implementation checklist (Section 5) repeats it: "The algorithm allowlist for `jwtVerify` excludes `alg: none` and any HMAC algorithm."

`jose`'s `jwtVerify` does not accept `alg: none` by default, but requiring an explicit allowlist means the implementation cannot accidentally pass a wildcard or empty `algorithms` option. Consistent with PR #45 Risk 1 mitigation.

**Result: PASS**

---

### Criterion 17 — Auth0 Organizations, Roles, Permissions, custom namespace claims, `app_metadata`, and `user_metadata` are not trusted for Nashir authorization

**Independent check:**

Authorization gate Section 3.7 (Auth0 non-authority enforcement):

| Required exclusion | Present |
|---|---|
| `org_id` (Auth0 Organizations) | ✓ |
| `permissions` (Auth0 Permissions) | ✓ |
| `roles` (Auth0 Roles) | ✓ |
| `https://nashir.app/*` custom namespace | ✓ |
| `app_metadata` | ✓ |
| `user_metadata` | ✓ |

Section 3.7 adds: "No downstream component (`workspaceContextGuard`, `permissionGuard`, route handler) may receive any excluded claim from `authGuard`." Default-deny: "Any payload claim not in the trusted set (`iss`, `aud`, `sub`, `exp`, `iat`)." Consistent with PR #47 Decision 5.

**Result: PASS**

---

### Criterion 18 — `workspaceId` must not come from token or headers

**Independent check:**

Authorization gate Section 3.4, `authGuard` prohibitions:
> "Set `workspaceId` in any context object" — prohibited
> "Consult `x-nashir-actor-id` or `x-nashir-workspace-id`" — prohibited

Authorization gate Section 4 (explicit prohibitions):
> "`workspaceId` sourced from token, from `x-nashir-workspace-id`, or from any source other than the route path parameter | PR #47, Decision 7"

Both the authGuard-level prohibition (Section 3.4) and the gate-level prohibition (Section 4) close this path. Consistent with PR #47 Decision 7 and `x-workspace-scope: route` in the authority OpenAPI.

**Result: PASS**

---

### Criterion 19 — `x-nashir-actor-id` and `x-nashir-workspace-id` are not trusted in the production path

**Independent check:**

Authorization gate Section 3.9 (Transitional Header Non-Trust):
> "The implementation must ensure `x-nashir-actor-id` and `x-nashir-workspace-id` are not consulted by `authGuard`, `workspaceContextGuard`, `permissionGuard`, or any product route handler as a trust source."

Section 3.4 prohibitions also list both headers by name. Section 3.9 adds the no-fallback constraint: "The execution gate must either remove these headers from the production request path or ensure they are unreachable when a token is present."

`src/request-context.ts` confirms both `ACTOR_ID_HEADER` and `WORKSPACE_ID_HEADER` are still present — this is planned removal, not yet executed. Consistent with PR #47 Decision 10.

**Result: PASS**

---

### Criterion 20 — No product routes, DB schema changes, migrations, OpenAPI changes, UI work, CI changes, secrets, or deployment are authorized

**Independent check against authorization gate Section 4:**

| Required prohibition | Present |
|---|---|
| Product / business API routes | ✓ — "Product or business API routes (any `app.post`, `app.put`, `app.delete`, `app.patch` for product resources)" |
| Database schema changes, ORM, migrations, SQL | ✓ |
| OpenAPI contract changes | ✓ — "unless separately authorized" |
| UI / frontend work | ✓ |
| CI/CD pipeline changes | ✓ |
| Secrets / environment variable values committed | ✓ — "Secrets, environment variable values, or deployment configuration committed to the repository" |
| Deployment | ✓ — included in "broad auth refactor" + secrets/deployment entry |
| Production Auth0 tenant / application | ✓ — "Production Auth0 tenant creation, application registration, or API registration" |

All required prohibitions are present in Section 4 with binding source citations where applicable.

**Result: PASS**

---

### Criterion 21 — Tests are authorized only for RSA key pair + mock JWKS fixture; no live Auth0 dependency

**Independent check:**

Authorization gate Section 3.8 (Local test infrastructure):
- "Generates or uses a fixed RSA 2048-bit key pair (checked-in fixture or generated at test setup)"
- "Serves a mock JWKS fixture in-memory (no live Auth0 JWKS endpoint)"
- "All JWKS HTTP fetches interceptable at test layer (e.g., `nock`, `msw`, or `jose` key import)"
- "Unit tests must pass with no network access to any Auth0 endpoint"

The pre-implementation checklist (Section 5) repeats: "Unit tests require no network access to any Auth0 endpoint." No live Auth0 dependency is authorized in Section 3.8 or anywhere in Section 3. Consistent with PR #49 Section 9 and PR #50 Criterion 15.

**Result: PASS**

---

## 4. PASS/FAIL Summary

| # | Criterion | Result |
|---|---|---|
| 1 | Authorization gate is documentation-only; PR #51 scope is clean | PASS |
| 2 | Implementation authorization limited to Auth0 token verification slice | PASS |
| 3 | `jose` is the only authorized production JWT verification dependency | PASS |
| 4 | No Auth0 SDK authorized as an authorization source | PASS |
| 5 | Config validation covers all six environment variables | PASS |
| 6 | `AUTH0_JWKS_URI` validated as HTTPS if provided | PASS |
| 7 | `VerifiedIdentityContext` does not include `workspaceId` | PASS |
| 8 | `FullyResolvedRequestContext` includes `workspaceId` only after `workspaceContextGuard` | PASS |
| 9 | `authGuard` uses `jose.decodeProtectedHeader(token)` for `kid`; no payload read before signature | PASS |
| 10 | No payload field read before signature verification | PASS |
| 11 | Missing `kid` and unknown `kid` after refresh map to 401 | PASS |
| 12 | JWKS endpoint unavailable maps to 503/502, never 401 | PASS |
| 13 | JWKS refresh cooldown is global, not per `kid` | PASS |
| 14 | Default `JWKS_REFRESH_COOLDOWN_SECONDS` is 30 seconds per authorization gate | PASS |
| 15 | `TOKEN_LEEWAY_SECONDS` applied consistently to `exp` and `iat` | PASS |
| 16 | Algorithm allowlist excludes `none` and HMAC algorithms | PASS |
| 17 | Auth0 excluded claims enumerated; default-deny on payload claims | PASS |
| 18 | `workspaceId` must not come from token or headers | PASS |
| 19 | `x-nashir-actor-id` and `x-nashir-workspace-id` not trusted in production path | PASS |
| 20 | No product routes, DB, migrations, OpenAPI, UI, CI, secrets, or deployment authorized | PASS |
| 21 | Tests authorized only for RSA key pair + mock JWKS; no live Auth0 dependency | PASS |

**All 21 criteria: PASS**

---

## 5. Non-Authorization Boundary

This review gate does not authorize, and must NOT be read as approving, any implementation. The conditional authorization granted by PR #51 Section 3 takes effect only in the execution gate, after this review gate's GO decision is recorded.

---

## 6. GO / NO-GO Decision

**Decision: GO** to the **Backend Slice 0 Auth0 Token Verification Implementation Execution Gate** — because:

- All 21 review criteria pass.
- The authorized scope is tightly bounded to the `authGuard` slice.
- `jose` is the only authorized production dependency; Auth0 SDK is explicitly prohibited.
- `jose.decodeProtectedHeader(token)` is specified for `kid` extraction — no payload field is accessible before signature verification.
- The JWKS rate-limit is global (not per `kid`), closing the `kid`-flood attack vector.
- The default `JWKS_REFRESH_COOLDOWN_SECONDS` of 30 seconds is recorded in the authorization gate, superseding the 300-second planning-gate default.
- `VerifiedIdentityContext { actorId }` structurally prevents `workspaceId` from appearing in `authGuard` output.
- Both transitional headers are named for non-trust, with all three guard layers listed.
- The 14-item prohibition list closes all expansion paths outside the authorized slice.
- The 10-item pre-implementation checklist provides a verifiable gate before code is written.
- This gate itself changed only the one permitted documentation file.

**NO-GO** for everything listed in Section 4 of PR #51.

---

## 7. Recommended Next Gate

**Backend Slice 0 Auth0 Token Verification Implementation Execution Gate** — the first gate authorized to write code, install packages, and modify source files, strictly within the scope authorized by PR #51 Section 3.

That execution gate must:

- Install `jose` as a production dependency
- Implement the configuration validator with startup errors on required-variable absence
- Implement `VerifiedIdentityContext` and `FullyResolvedRequestContext` types
- Implement `authGuard` using `jose.decodeProtectedHeader` for `kid` and `jwtVerify` for signature + claims
- Implement the JWKS cache with a global `JWKS_REFRESH_COOLDOWN_SECONDS=30` rate limit and a `JWKS_CACHE_TTL_SECONDS`-bounded TTL mechanism
- Implement RSA key pair + mock JWKS test infrastructure
- Remove or prevent production-path access to `x-nashir-actor-id` and `x-nashir-workspace-id`
- Complete the pre-implementation checklist (PR #51 Section 5) before writing any code
- Not implement any item from the PR #51 Section 4 prohibition list
