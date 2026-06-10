# Nashir Backend Slice 0 Auth0 Token Verification Execution Planning Review Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only execution planning review gate |
| Authorization source | `docs/nashir_backend_slice_0_auth0_token_verification_execution_planning_gate.md` (PR #49) |
| PR #49 merge commit (execution planning gate) | `a12780d` |
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

PR #49 merged the Backend Slice 0 Auth0 Token Verification Execution Planning Gate. That gate resolved all eleven deferred decisions from PR #47, specified the `authGuard` implementation plan, defined TypeScript context boundaries, named environment variables, planned test categories, and specified the transitional header removal strategy.

This review gate independently verifies those plans against the prior gate sequence, live source files, and the PR #49 commit record. It does not rely on the execution planning gate's self-assessment. It produces a PASS/FAIL matrix and a GO / NO-GO decision.

---

## 2. Inputs Used for Independent Verification

| Input | How verified |
|---|---|
| `docs/nashir_backend_slice_0_auth0_token_verification_execution_planning_gate.md` (PR #49) | Read in full — primary artifact under review |
| `docs/nashir_backend_slice_0_auth0_token_verification_decision_gate.md` (PR #47) | Ten binding decisions and eleven deferred decisions the execution plan must be consistent with |
| `docs/nashir_backend_slice_0_auth0_token_verification_planning_gate.md` (PR #45) | Risk register; `createRemoteJWKSet` coupling risk (Risk 5) |
| `docs/nashir_backend_slice_0_auth_provider_selection_gate.md` (PR #43) | Auth0 selected as V1 external identity provider; Auth0 is identity-only and not Nashir authorization authority |
| `docs/nashir_backend_slice_0_auth_rbac_source_of_truth_decision_gate.md` (PR #37) | Pipeline boundary; `grantedPermissions` never caller-supplied |
| `src/request-context.ts` (`main` HEAD) | `RequestContext { workspaceId, actorId }`; both `ACTOR_ID_HEADER` and `WORKSPACE_ID_HEADER` constants present |
| `src/app.ts` (`main` HEAD) | `resolveRequestContextFromHeaders`; no product routes; harness flags default false |
| `package.json` | Confirmed `jose` not yet installed |
| `git show --stat a12780d` | PR #49 contained two commits (`25adeb4`, `54e476d`); both changed only the one execution planning gate document |

---

## 3. Review Criteria and PASS/FAIL Matrix

### Criterion 1 — Execution planning gate is documentation-only

**Independent check:**

Execution planning gate header: "Implementation authorization: None." Section 13 enumerates 18 prohibited categories including `jose`, `package.json`, all `src/` and `tests/` files, `authGuard` hook, database files, migrations, environment configuration, and deployment.

`package.json` independently confirmed: `jose` is not installed. `git show --stat a12780d` confirms PR #49 changed only the one documentation file across both commits.

**Result: PASS**

---

### Criterion 2 — Future implementation scope is limited to Auth0 token verification

**Independent check:**

Execution planning gate Section 3 (Execution Objectives) enumerates five implementation objectives:

1. Extract and verify Auth0-issued JWTs
2. Bind verified `sub` to `requestContext.actorId`
3. Reject failing requests before `workspaceContextGuard`
4. Produce `VerifiedIdentityContext`, not a fully resolved `RequestContext`
5. Support local testing without a live Auth0 tenant

Section 3 also enumerates four implementation prohibitions: no workspace/role/permission resolution, no consultation of `x-nashir-actor-id`/`x-nashir-workspace-id`, no Auth0 SDK, no unsigned-token acceptance.

No scope expansion beyond Auth0 token verification is present. No product routes, DB schema, workspace logic, or permission mapping appears in the implementation plan.

**Result: PASS**

---

### Criterion 3 — Library selection is `jose`; no Auth0 SDK deep coupling planned

**Independent check:**

Execution planning gate Section 8.1 selects `jose` and explicitly rejects three alternatives:

| Rejected alternative | Reason |
|---|---|
| `jsonwebtoken` + manual JWKS | Manual JWKS fetch and caching increases attack surface; no built-in `kid`-based key rotation |
| Auth0 `express-oauth2-jwt-bearer` | Over-couples to Auth0-specific abstractions; violates PR #45 Risk 5 |
| `passport-jwt` | Framework-coupling without benefit |

The selection rationale covers five criteria: standards alignment (RFC 7515/7517/7519), no native bindings, built-in JWKS fetching, explicit algorithm enforcement, and no Auth0 SDK dependency. This satisfies the coupling-risk evaluation required by PR #47 Decision 9 and PR #45 Risk 5.

Section 8.2 explicitly notes that `jose` installation is authorized in the execution gate, not this gate.

**Result: PASS**

---

### Criterion 4 — All six environment variables are planned with startup validation

**Independent check against execution planning gate Section 10:**

| Variable | Required | Startup error if absent | Present |
|---|---|---|---|
| `AUTH0_ISSUER_URL` | Yes | Yes — "None — startup error if absent" | ✓ |
| `AUTH0_AUDIENCE` | Yes | Yes — "None — startup error if absent" | ✓ |
| `AUTH0_JWKS_URI` | No | N/A — derived from `AUTH0_ISSUER_URL` | ✓ |
| `JWKS_CACHE_TTL_SECONDS` | No | N/A — default `600` | ✓ |
| `JWKS_REFRESH_COOLDOWN_SECONDS` | No | N/A — default `300` | ✓ |
| `TOKEN_LEEWAY_SECONDS` | No | N/A — default `0` | ✓ |

All six variables are named. Startup validation rules cover: `AUTH0_ISSUER_URL` (valid HTTPS URL ending `/`), `AUTH0_AUDIENCE` (non-blank string), `AUTH0_JWKS_URI` (valid HTTPS URL if provided), `JWKS_CACHE_TTL_SECONDS` (positive integer), `JWKS_REFRESH_COOLDOWN_SECONDS` (positive integer if provided), `TOKEN_LEEWAY_SECONDS` (integer in `[0, 60]`). A startup error on absent required variables prevents silent misconfiguration.

**Result: PASS**

---

### Criterion 5 — `jose` / `createRemoteJWKSet` caching behavior is accounted for; strict TTL requires wrapper, controlled re-initialization, or equivalent cache-boundary mechanism

**Independent check:**

Execution planning gate Section 6, deferred decision item 4 (JWKS cache TTL), after the PR #49 refinement commit (`54e476d`):

> "If the selected JWT library is `jose` with `createRemoteJWKSet`, execution planning must account for the library's caching behavior explicitly: a strict TTL requires a wrapper, controlled re-initialization of the remote JWK set, or an equivalent cache-boundary mechanism. Unknown `kid` refresh behavior and refresh cooldown must be planned separately from TTL."

This is the correct observation. `jose`'s `createRemoteJWKSet` maintains an internal cache that does not natively support an externally-configured TTL or a hard cache flush on demand. Achieving the `JWKS_CACHE_TTL_SECONDS` constraint requires either: (a) periodically recreating the `JWKSSet` object, (b) wrapping the JWKS fetch with a custom cache layer that expires on TTL, or (c) an equivalent mechanism that enforces the configured TTL boundary. The execution gate must choose and document one approach.

The separation of "TTL expiry" from "unknown `kid` refresh cooldown" is also correctly called out — they are distinct behaviors that `createRemoteJWKSet` conflates internally.

**Result: PASS**

---

### Criterion 6 — `TOKEN_LEEWAY_SECONDS` is used consistently for both `exp` and `iat` future-drift validation

**Independent check:**

Execution planning gate Section 4.6 (`iat` validation strategy), after the PR #49 refinement commit (`54e476d`):

> "If `iat` is present: reject if `iat` is more than `TOKEN_LEEWAY_SECONDS` seconds in the future (configurable). The same leeway value planned for `exp` validation must be used for `iat` future-drift validation to avoid custom temporal-claim behavior that conflicts with standard JWT verification library behavior."

Section 4.5 (`exp` validation) uses `TOKEN_LEEWAY_SECONDS` from `Section 6, item 10`.

Section 4.7 confirms `TOKEN_LEEWAY_SECONDS` defaults to 0 and is capped at 60.

Both `exp` and `iat` future-drift checks use the same `TOKEN_LEEWAY_SECONDS` value. Using different tolerance windows for the two claims would introduce inconsistent temporal semantics and could conflict with how `jose`'s `jwtVerify` applies leeway internally. Consistency is correctly required.

**Result: PASS**

---

### Criterion 7 — `authGuard` verifies signature before trusting any payload claim

**Independent check:**

Execution planning gate Sections 4.1–4.5 impose the following strict ordering:

- 4.1: Token extraction — no claim reads
- 4.2: `kid` extraction from JWS header only — no payload reads
- 4.3: JWKS key retrieval — no payload reads
- 4.4: Signature verification — explicit algorithm allowlist; reject on invalid signature
- 4.5: Post-verification claim validation (`iss`, `aud`, `exp`, `iat`, `sub`) — only after signature

Section 4.5 is headed "Post-verification claim validation" and opens with "After and only after signature verification succeeds." This is consistent with PR #47 Decision 1 (signature-first) and the pipeline labels from PR #47 Section 4.

**Result: PASS**

---

### Criterion 8 — `kid` is treated only as a JWS header parameter for JWKS key selection

**Independent check:**

Execution planning gate Section 4.2:
> "`kid` must be used only to select the JWKS key. It must not be read from the payload, forwarded to application logic, or used after key selection."

Section 4.2 explicitly parses "the token's header segment only (first base64url segment)" to extract `kid`. The payload segment is not read until after signature verification in Section 4.5. This is consistent with PR #47 Decision 4.

**Result: PASS**

---

### Criterion 9 — Missing `kid` and unknown `kid` after JWKS refresh map to 401

**Independent check:**

Execution planning gate:

- Section 4.2: Missing `kid` → reject with 401 (enumerated as a rejection condition)
- Section 4.3: Unknown `kid` after re-fetch → "reject with 401"

Both cases are present. Both are correctly 401 (malformed or unrecognizable token), distinct from JWKS endpoint unavailability (Section 4.3: 503/502). Consistent with PR #47 Decision 9.

**Result: PASS**

---

### Criterion 10 — JWKS endpoint unavailable maps to 503 or 502, never 401

**Independent check:**

Execution planning gate Section 4.3:
> "If the JWKS endpoint is unavailable: reject with 503 Service Unavailable or 502 Bad Gateway"

No 401 fallback is present for JWKS endpoint unavailability. This is consistent with PR #47 Decision 9 and the explicit rationale from PR #45 Section 4.3 ("401 is not allowed for JWKS retrieval failures").

**Result: PASS**

---

### Criterion 11 — `authGuard` emits `VerifiedIdentityContext` only and must not include `workspaceId`

**Independent check:**

Execution planning gate Section 5.1 defines `VerifiedIdentityContext`:

```typescript
interface VerifiedIdentityContext {
  actorId: string; // verified JWT sub
}
```

`workspaceId` is not present. Section 5.2 states: "authGuard must not set `workspaceId` or accept it from any header."

Section 4.8 confirms `authGuard`'s only output: "`requestContext.actorId = verifiedToken.sub`. This is the only output `authGuard` writes to the request context before handing off to `workspaceContextGuard`."

`src/request-context.ts` independently confirms `RequestContext { workspaceId: string; actorId: string }` — the type boundary plan is consistent with the current two-field shape.

**Result: PASS**

---

### Criterion 12 — `workspaceContextGuard` produces `FullyResolvedRequestContext` after resolving `workspaceId` from the route path parameter

**Independent check:**

Execution planning gate Section 5.1 defines `FullyResolvedRequestContext`:

```typescript
interface FullyResolvedRequestContext extends VerifiedIdentityContext {
  workspaceId: string; // from route path parameter
}
```

Section 5.2: "`workspaceContextGuard` consumes `VerifiedIdentityContext` and produces `FullyResolvedRequestContext`."

The `workspaceId` source annotation ("from route path parameter") is consistent with PR #47 Decision 7 and the authority OpenAPI `x-workspace-scope: route`.

**Result: PASS**

---

### Criterion 13 — `permissionGuard` remains the authorization enforcement boundary

**Independent check:**

Execution planning gate Section 5.2: "`permissionGuard` / `evaluatePermissionGuard` accepts only `FullyResolvedRequestContext`."

Section 5.2 also states: "No intermediate type carries both `actorId` and `workspaceId` until after `workspaceContextGuard` completes" — which prevents any component between `authGuard` and `permissionGuard` from making a permission decision with partial context.

`src/app.ts` independently confirmed: `evaluatePermissionGuard` has one call site (`permissionGuardHarnessHandler`); no product routes exist. Consistent with PR #47 Decision 8.

**Result: PASS**

---

### Criterion 14 — Auth0 Organizations, Roles, Permissions, custom claims, `app_metadata`, and `user_metadata` are not trusted for Nashir authorization

**Independent check:**

Execution planning gate Section 7 (Auth0 Non-Authority Boundary):

| Required exclusion | Present | Binding source cited |
|---|---|---|
| `org_id` (Auth0 Organizations) | ✓ | PR #43, Section 3; PR #47, Decision 5 |
| `permissions` (Auth0 Permissions) | ✓ | Decision 5, PR #37; PR #47, Decision 5 |
| `roles` (Auth0 Roles) | ✓ | Decision 3, PR #37; PR #47, Decision 5 |
| `https://nashir.app/*` custom namespace | ✓ | PR #47, Decision 5 |
| `app_metadata` | ✓ | PR #47, Decision 5 |
| `user_metadata` | ✓ | PR #47, Decision 5 |

Default-deny rule: "any payload claim not listed in Section 4.5 of this gate is excluded." Consistent with PR #47 Decision 5's default-deny scoped to payload claims.

**Result: PASS**

---

### Criterion 15 — Local tests use RSA key pair + mock JWKS fixture with no live Auth0 dependency

**Independent check:**

Execution planning gate Section 9:

- Section 9.1: "Generate a 2048-bit RSA key pair at test setup time (or as a checked-in fixture)"
- Section 9.2: "A static in-memory JWKS response containing the test public key" — explicitly "in-memory"
- Section 9.3: Deterministic test tokens signed with the test private key; `kid` references the mock JWKS key
- Section 9.4: "Unit tests must be able to run offline. Any JWKS HTTP fetch must be interceptable at the test layer." HTTP interceptor (e.g., `nock`, `msw`) is required; live Auth0 dependency is prohibited.

Consistent with the local test strategy deferred decision from PR #47 Section 5, item 7, and the approach described since PR #41.

**Result: PASS**

---

### Criterion 16 — `x-nashir-actor-id` and `x-nashir-workspace-id` removal is planned for the production path

**Independent check:**

Execution planning gate Section 12 (Transitional Header Removal Plan):

- Both `x-nashir-actor-id` and `x-nashir-workspace-id` are named for removal
- "Neither header must be read by `authGuard`, `workspaceContextGuard`, `permissionGuard`, or any product route handler as a trust source" — all three guards named
- "`resolveRequestContextFromHeaders` in `src/request-context.ts` is replaced by the token verification + route extraction pipeline"
- A specific constraint against fallback: "The execution gate must not leave a code path where the harness headers are consulted as a fallback when a token is present"

`src/request-context.ts` independently confirmed: both `ACTOR_ID_HEADER` and `WORKSPACE_ID_HEADER` constants are still present — confirming this is planned removal, not yet executed.

**Result: PASS**

---

### Criterion 17 — No implementation, source changes, packages, tests, secrets, DB changes, migrations, deployment, or production readiness are authorized

**Independent check:**

Execution planning gate Section 13 enumerates 18 prohibited categories:

| Required prohibition | Present |
|---|---|
| No JWT middleware / `authGuard` hook | ✓ |
| No `jose` or package installation | ✓ — "`jose` or any other npm package" explicitly listed |
| No `package.json` / `pnpm-lock.yaml` | ✓ |
| No `src/` or `tests/` changes | ✓ |
| No DB schema, ORM, migration, SQL | ✓ |
| No product routes | ✓ |
| No OpenAPI changes | ✓ |
| No environment / secrets config | ✓ |
| No CI workflow changes | ✓ |
| No deployment / production readiness | ✓ |

`package.json` independently confirmed: `jose` not installed. `git show --stat a12780d` shows one doc file only across both PR #49 commits.

**Result: PASS**

---

## 4. PASS/FAIL Summary

| # | Criterion | Result |
|---|---|---|
| 1 | Execution planning gate is documentation-only; PR #49 scope is clean | PASS |
| 2 | Future implementation scope limited to Auth0 token verification | PASS |
| 3 | `jose` selected; no Auth0 SDK deep coupling planned; alternatives evaluated | PASS |
| 4 | All six env vars named with startup validation rules | PASS |
| 5 | `jose`/`createRemoteJWKSet` caching behavior accounted for; strict TTL requires wrapper or re-initialization | PASS |
| 6 | `TOKEN_LEEWAY_SECONDS` used consistently for `exp` and `iat` future-drift validation | PASS |
| 7 | `authGuard` verifies signature before trusting any payload claim | PASS |
| 8 | `kid` treated as JWS header parameter for JWKS key selection only | PASS |
| 9 | Missing `kid` and unknown `kid` after refresh map to 401 | PASS |
| 10 | JWKS endpoint unavailable maps to 503/502, never 401 | PASS |
| 11 | `authGuard` emits `VerifiedIdentityContext` only; `workspaceId` not included | PASS |
| 12 | `workspaceContextGuard` produces `FullyResolvedRequestContext` from route path param | PASS |
| 13 | `permissionGuard` remains the only authorization enforcement boundary | PASS |
| 14 | Auth0 excluded claims enumerated; default-deny on payload claims | PASS |
| 15 | Local tests use RSA key pair + mock JWKS; no live Auth0 dependency for unit tests | PASS |
| 16 | Both transitional headers named for removal; all three guard layers listed | PASS |
| 17 | No implementation authorized; non-authorization boundary complete | PASS |

**All 17 criteria: PASS**

---

## 5. Non-Authorization Boundary

This review gate does not authorize, and must NOT be read as approving, any of the following:

- installation of `jose` or any npm package
- changes to `package.json` or `pnpm-lock.yaml`
- changes to any file in `src/` or `tests/`
- implementation of any JWT verification middleware, `authGuard` hook, or Fastify plugin
- creation of any Auth0 tenant, application, or API registration
- any database schema, ORM, migration, or SQL
- product routes of any kind
- environment-variable or secrets configuration
- CI workflow changes
- deployment, pilot readiness, or production readiness of any kind

---

## 6. GO / NO-GO Decision

**Decision: GO** to the **Backend Slice 0 Auth0 Token Verification Implementation Authorization Gate** — because:

- All 17 review criteria pass.
- The implementation plan covers the full `authGuard` lifecycle (extraction → `kid` parse → JWKS → signature → claim validation → `actorId` binding).
- `jose` is selected with explicit coupling-risk evaluation meeting the PR #45 Risk 5 criteria.
- `jose`/`createRemoteJWKSet` caching behavior is called out; the execution gate must choose a wrapper or re-initialization strategy.
- `TOKEN_LEEWAY_SECONDS` is consistently applied to both `exp` and `iat` validation, defaulting to zero.
- TypeScript context boundaries (`VerifiedIdentityContext`, `FullyResolvedRequestContext`) structurally prevent `authGuard` from setting `workspaceId`.
- All six environment variables are named with startup validation rules and safe defaults.
- Local test strategy requires no live Auth0 dependency.
- Both transitional headers are named for removal, with all three guard layers listed as prohibited consumers.
- The non-authorization boundary is complete.
- PR #49 changed only the one permitted documentation file.

**NO-GO** for everything listed in Section 5 above.

---

## 7. Recommended Next Gate

**Backend Slice 0 Auth0 Token Verification Implementation Authorization Gate** — a documentation gate that formally authorizes the implementation to begin and records what the execution gate is permitted to do.

That authorization gate must:

- Explicitly authorize `jose` installation as a production dependency
- Explicitly authorize modification of `src/request-context.ts`, `src/app.ts`, and related source files
- Explicitly authorize the `VerifiedIdentityContext` / `FullyResolvedRequestContext` TypeScript types
- Explicitly authorize the removal of `x-nashir-actor-id` and `x-nashir-workspace-id` from the production request path
- Specify what the execution gate must NOT do (product routes, DB schema, Auth0 SDK, `evaluatePermissionGuard` additional call sites)
- Carry forward this gate's Section 5 non-authorization boundary for everything not explicitly authorized
