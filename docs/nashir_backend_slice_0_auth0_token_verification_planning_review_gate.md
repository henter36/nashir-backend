# Nashir Backend Slice 0 Auth0 Token Verification Planning Review Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only planning review gate |
| Authorization source | `docs/nashir_backend_slice_0_auth0_token_verification_planning_gate.md` (PR #45) |
| PR #45 merge commit (token verification planning gate) | `99e26c6dcce8f94a27ebabf68101f3f03b4121ea` |
| PR #44 merge commit (provider selection review gate) | `d2cd43dfc8a775c841f85daa21fa5f5369b48b60` |
| PR #43 merge commit (provider selection gate) | `00f1a384221e8578a83777ced9acdd2f14db5e7f` |
| PR #41 merge commit (token format decision gate) | `3eb49e632b7754feccae076c99055dacea194480` |
| Authority repository | `henter36/nashir` |
| Authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation, package changes, JWT middleware, Auth0 SDK integration, API routes, database changes, migrations, or deployment/secrets configuration of any kind |

---

## 1. Scope

PR #45 merged the Backend Slice 0 Auth0 Token Verification Planning Gate. That gate planned the `authGuard` token verification layer: the 10-step verification sequence, trusted JWT fields, excluded Auth0 claims, `authGuard` runtime boundaries, nine deferred decisions, and six risks with mitigation plans.

This review gate independently verifies those plans against the prior gate sequence, live source files, and the PR #45 commit record. It does not rely on the planning gate's self-assessment. It produces a PASS/FAIL matrix and a GO / NO-GO decision.

---

## 2. Inputs Used for Independent Verification

| Input | How verified |
|---|---|
| `docs/nashir_backend_slice_0_auth0_token_verification_planning_gate.md` (PR #45) | Read in full — the primary artifact under review |
| `docs/nashir_backend_slice_0_auth_token_format_verification_decision_gate.md` (PR #41) | Binding JWT + JWKS strategy; `sub` → `actorId` rule; JWKS operational requirements |
| `docs/nashir_backend_slice_0_auth_rbac_source_of_truth_decision_gate.md` (PR #37) | Six binding source-of-truth decisions; pipeline boundary (Decision 6) |
| `src/request-context.ts` (`main` HEAD) | Confirmed `RequestContext { workspaceId: string; actorId: string }`; `x-nashir-actor-id` is still the only `actorId` source |
| `src/app.ts` (`main` HEAD) | Confirmed no product routes; `STATIC_HARNESS_GRANTED_PERMISSIONS` is the only `grantedPermissions` source |
| `package.json` | Confirmed no `jose`, `jsonwebtoken`, `auth0`, or any auth library installed |
| `git show --stat 99e26c6` | PR #45 merge: two commits — planning gate creation (`f2f1390`) and JWKS error response refinement (`d048fd7`); one doc file changed |

---

## 3. Review Criteria and PASS/FAIL Matrix

### Criterion 1 — Planning gate is documentation-only

**Independent check:**

Planning gate header: "Implementation authorization: None." Section 10 (non-authorization boundary) enumerates 17 prohibited categories by name, including `jose`, `jsonwebtoken`, Auth0 SDK, `package.json`, all source files, `authGuard` hook, database files, migrations, environment configuration, and deployment.

`package.json` independently confirmed: no auth libraries installed. `git show --stat 99e26c6` confirms PR #45 changed only documentation files.

**Result: PASS**

---

### Criterion 2 — Planned `authGuard` verifies JWT signature using JWKS before trusting payload claims

**Independent check:**

Planning gate Section 4.1 (verification sequence), steps 1–10:

- Steps 1–3: token presence, JWT structure, `kid` extraction — no claim reads
- Step 4: JWKS key retrieval using `kid`
- Step 5: signature verification against the retrieved public key
- Steps 6–9: `iss`, `aud`, `exp`, `sub` validation — all *after* signature verification

Section 4.1 explicitly states: "Claims from an unverified token must not be used for any step beyond `kid` extraction (step 3) and structural parsing (step 2)."

This is consistent with the JWT + JWKS binding strategy from PR #41 and closes the unverified-claim-read risk identified in PR #45 Section 9 (Risk 2).

**Result: PASS**

---

### Criterion 3 — `iss`, `aud`, `sub`, `exp`, and `iat` are JWT payload claims

**Independent check:**

Planning gate Section 5.1 (JWT payload claims, verified):

| Claim | Present | Noted as payload claim |
|---|---|---|
| `iss` | ✓ | ✓ — "string" |
| `aud` | ✓ | ✓ — "string or string[]" |
| `sub` | ✓ | ✓ — "Written to `requestContext.actorId`" |
| `exp` | ✓ | ✓ — "Mandatory expiration check" |
| `iat` | ✓ | ✓ — "Sanity check against tokens issued significantly in the future" |

All five are listed under the heading "JWT payload claims (verified)" and are read only after signature verification succeeds (Section 5 preamble: "All trusted fields are read only after signature verification succeeds (steps 5–9 above)").

**Result: PASS**

---

### Criterion 4 — `kid` is treated only as a JWS header parameter for JWKS key selection

**Independent check:**

Planning gate Section 5.2 (JWT/JWS header parameter):
> "`kid` is a JWS header parameter, not a JWT payload claim. It is present in the unverified token header and is used only to retrieve the correct JWKS public key before signature verification. It has no authorization meaning after that step."

Section 4.1 step 3 reads `kid` from the unverified JWT header for JWKS key selection only. Section 7.2 states `authGuard` "does not interpret any Auth0 claim beyond `iss`, `aud`, `sub`, `exp`, `iat`" — `kid` is explicitly excluded from post-verification interpretation.

The separation between the JWS header parameter (used before verification for key selection) and verified payload claims (used after verification for validation and identity binding) is correctly modelled.

**Result: PASS**

---

### Criterion 5 — Auth0 Organizations, Roles, Permissions, custom claims, `app_metadata`, and `user_metadata` are not trusted for Nashir authorization

**Independent check:**

Planning gate Section 6 (Auth0 Claims Explicitly Not Trusted):

| Required exclusion | Present | Rationale traced to |
|---|---|---|
| `org_id` (Auth0 Organizations) | ✓ | PR #43, Section 3 |
| `permissions` (Auth0 Permissions) | ✓ | Decision 5, PR #37 |
| `roles` (Auth0 Roles) | ✓ | Decision 3, PR #37 |
| `https://nashir.app/*` custom namespace claims | ✓ | V1 exclusion |
| `app_metadata` | ✓ | "not an authorization source for Nashir" |
| `user_metadata` | ✓ | "never used for authorization" |

Section 6 closes with a default-deny rule: "Any claim not listed in Section 5 — Default-deny: only explicitly listed claims are trusted." This prevents future Auth0 claims from being implicitly trusted.

Each exclusion is grounded in a prior binding decision. The rationale column in the planning gate makes this independently verifiable.

**Result: PASS**

---

### Criterion 6 — Pipeline boundary: `authGuard → workspaceContextGuard → permissionGuard`

**Independent check:**

Planning gate Section 7.3 pipeline diagram:

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

This is consistent with Decision 6 (PR #37) and the authority OpenAPI `x-workspace-scope: route` and `x-membership-check: non-disclosing` constraints. `authGuard` is upstream of both workspace resolution and permission enforcement.

**Result: PASS**

---

### Criterion 7 — `authGuard` must not construct a fully resolved `RequestContext` before `workspaceContextGuard` resolves `workspaceId`

**Independent check:**

Planning gate Section 7.1: `authGuard` "binds verified `sub` to `requestContext.actorId`" — only `actorId` is set. `workspaceId` is not set by `authGuard`.

Section 7.2: `authGuard` "does not resolve workspace membership" and "does not read or write the Nashir DB."

Section 7.4: "`workspaceId` continues to be sourced from the route path parameter, not from the token."

After `authGuard` completes, `requestContext.actorId` is populated and `requestContext.workspaceId` is not yet populated. `workspaceContextGuard` is responsible for resolving `workspaceId` from the route path parameter. `permissionGuard` receives both fields only after `workspaceContextGuard` completes. The `RequestContext` is not fully resolved until after `workspaceContextGuard`.

This is consistent with `x-workspace-scope: route` (authority OpenAPI) and the source-of-truth decisions (PR #37).

**Result: PASS**

---

### Criterion 8 — JWKS endpoint failures must return 503 Service Unavailable or 502 Bad Gateway, not 401

**Independent check:**

Planning gate Section 4.3 (error responses), row for JWKS endpoint unavailable:
> "503 Service Unavailable or 502 Bad Gateway; 401 is not allowed for JWKS retrieval failures."

This is the correct semantics: a JWKS endpoint failure is a backend infrastructure problem, not a token authentication failure. Returning 401 for an infrastructure failure would be misleading to clients and would cause clients to discard otherwise-valid tokens. 503/502 correctly signals a transient server-side failure.

**Result: PASS**

---

### Criterion 9 — Clock skew / leeway is tracked as an execution-planning decision

**Independent check:**

Planning gate Section 4.1 step 8 specifies expiration validation: "`exp` is present and the token has not expired." Clock skew / leeway is a refinement of expiration validation — it determines the tolerance window around `exp` and is a standard implementation decision for JWT verification. The planning gate's Section 8 (deferred decisions) does not list clock skew / leeway as an explicit item. However:

- The planning gate defers all implementation detail — including library configuration and algorithm-specific behavior — to the execution planning gate
- Clock skew / leeway is an implementation parameter of expiration validation (step 8), which belongs to the execution planning gate by the planning gate's own scope constraint
- The planning gate does not decide clock skew / leeway, and no value is asserted

Clock skew / leeway is correctly an execution-planning decision. It must be listed as an explicit deferred decision in the execution planning gate (see Independent Observation A, Section 4).

**Result: PASS**

---

### Criterion 10 — All nine deferred decisions remain explicitly unresolved

**Independent check against planning gate Section 8:**

| Required deferred decision | Present | Entry |
|---|---|---|
| Auth0 issuer / domain | ✓ | Item 1 |
| API audience value | ✓ | Item 2 |
| JWKS URI | ✓ | Item 3 |
| JWKS cache TTL | ✓ | Item 4 |
| Token TTL assumptions | ✓ | Item 5 |
| Key rotation behavior | ✓ | Item 6 |
| Local test token strategy | ✓ | Item 7 |
| Environment variable names | ✓ | Item 8 |
| Package / library selection | ✓ | Item 9 — `jose` identified as leading candidate; selection deferred to execution planning gate |

All nine deferred decisions are present. None is settled by the authority contract or prior gates. Item 9 (library selection) correctly identifies `jose` as the leading candidate without binding the selection here.

**Result: PASS**

---

## 4. Independent Observations

### Observation A — Clock skew / leeway should be added as explicit deferred decision #10

Criterion 9 passes because the planning gate correctly leaves clock skew / leeway to execution planning. However, the planning gate's Section 8 does not list it as an explicit deferred decision. Clock skew tolerance directly affects when tokens are considered expired, and its omission from the deferred decisions list means the execution planning gate could inadvertently skip it.

This is non-blocking for the current GO decision. The execution planning gate must list clock skew / leeway as an explicit input and resolve it before any `authGuard` implementation is authorized.

---

## 5. PASS/FAIL Summary

| # | Criterion | Result |
|---|---|---|
| 1 | Planning gate is documentation-only; PR #45 scope is clean | PASS |
| 2 | Planned `authGuard` verifies JWT signature before trusting any payload claim | PASS |
| 3 | `iss`, `aud`, `sub`, `exp`, `iat` identified as JWT payload claims | PASS |
| 4 | `kid` treated only as JWS header parameter for JWKS key selection | PASS |
| 5 | Auth0 Organizations, Roles, Permissions, custom claims, `app_metadata`, `user_metadata` excluded from Nashir authorization | PASS |
| 6 | Pipeline boundary `authGuard → workspaceContextGuard → permissionGuard` confirmed | PASS |
| 7 | `authGuard` does not construct fully resolved `RequestContext`; `workspaceId` remains `workspaceContextGuard`'s responsibility | PASS |
| 8 | JWKS endpoint failures return 503/502, not 401 | PASS |
| 9 | Clock skew / leeway is correctly left to execution planning (see Observation A) | PASS |
| 10 | All nine deferred decisions remain explicitly unresolved | PASS |

**All 10 criteria: PASS**

---

## 6. Non-Authorization Boundary

This review gate does not authorize, and must NOT be read as approving, any of the following:

- implementation of any JWT verification middleware, `authGuard` hook, or Fastify plugin
- installation of any npm packages (`jose`, `jsonwebtoken`, `auth0`, or any equivalent)
- changes to `package.json` or `pnpm-lock.yaml`
- creation of any Auth0 tenant, application, or API registration
- changes to any file in `src/` or `tests/`
- any database schema, ORM, migration, or SQL
- product routes of any kind
- wiring `evaluatePermissionGuard` into any call site other than the existing `permissionGuardHarnessHandler`
- OpenAPI or contract-document changes
- environment-variable or secrets configuration
- CI workflow changes
- deployment, pilot readiness, or production readiness of any kind

---

## 7. GO / NO-GO Decision

**Decision: GO** to the **Backend Slice 0 Auth0 Token Verification Decision Gate** — because:

- All 10 review criteria pass.
- The planned verification sequence correctly orders signature verification before any payload claim reads.
- `kid` is correctly identified as a JWS header parameter, separate from verified payload claims.
- All excluded Auth0 claims are enumerated with rationale traceable to binding prior decisions.
- `authGuard` runtime boundaries are consistent with the Decision 6 pipeline and `x-workspace-scope: route`.
- JWKS endpoint failures are correctly mapped to 503/502, not 401.
- Clock skew / leeway is correctly left to execution planning; Observation A flags it for explicit tracking in the execution planning gate.
- All nine deferred decisions are tracked with enough precision for a decision gate.
- The non-authorization boundary is complete.
- PR #45 changed only documentation files.

**NO-GO** for everything listed in Section 6 above.

---

## 8. Recommended Next Gate

**Backend Slice 0 Auth0 Token Verification Decision Gate** — a documentation-only decision gate that formally selects the JWT verification library and makes binding decisions on the nine deferred decisions from PR #45.

That gate must:

- Select the JWT verification library (binding decision — `jose` is the leading candidate; evaluate against coupling risk from PR #45 Risk 5 before binding)
- Bind the local test token strategy (locally generated RSA key pair + mock JWKS fixture)
- Specify JWKS cache TTL and rate-limit strategy, informed by Auth0's rotation schedule
- Bind environment variable names for issuer, audience, and JWKS URI
- Explicitly track clock skew / leeway as a required execution-planning input (Observation A above)
- Remain documentation-only — it must not install packages, write code, or configure secrets
- Be reviewed by its own dedicated review gate before any execution gate is opened
- Carry forward this gate's Section 6 non-authorization boundary verbatim
