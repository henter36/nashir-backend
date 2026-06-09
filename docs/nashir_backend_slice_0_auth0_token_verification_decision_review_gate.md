# Nashir Backend Slice 0 Auth0 Token Verification Decision Review Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only decision review gate |
| Authorization source | `docs/nashir_backend_slice_0_auth0_token_verification_decision_gate.md` (PR #47) |
| PR #47 merge commit (token verification decision gate) | `63f7b94` |
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

PR #47 merged the Backend Slice 0 Auth0 Token Verification Decision Gate. That gate recorded ten binding decisions covering the `authGuard` contract: signature-first verification, required validations, trusted claims, `kid` scope, excluded Auth0 claims, `authGuard` output boundary, `workspaceId` sourcing, permission enforcement, HTTP error mapping, and transitional header disposition.

This review gate independently verifies those decisions against the prior gate sequence, live source files, and the PR #47 commit record. It does not rely on the decision gate's self-assessment. It produces a PASS/FAIL matrix and a GO / NO-GO decision.

---

## 2. Inputs Used for Independent Verification

| Input | How verified |
|---|---|
| `docs/nashir_backend_slice_0_auth0_token_verification_decision_gate.md` (PR #47) | Read in full — primary artifact under review |
| `docs/nashir_backend_slice_0_auth0_token_verification_planning_gate.md` (PR #45) | Planned verification sequence and boundaries the decisions must be consistent with |
| `docs/nashir_backend_slice_0_auth_token_format_verification_decision_gate.md` (PR #41) | Binding JWT + JWKS strategy; `sub` → `actorId` rule; JWKS operational requirements |
| `docs/nashir_backend_slice_0_auth_rbac_source_of_truth_decision_gate.md` (PR #37) | Six source-of-truth decisions; pipeline boundary (Decision 6) |
| `src/request-context.ts` (`main` HEAD) | Confirmed `RequestContext { workspaceId: string; actorId: string }`; `ACTOR_ID_HEADER = "x-nashir-actor-id"`, `WORKSPACE_ID_HEADER = "x-nashir-workspace-id"` are both still present |
| `src/app.ts` (`main` HEAD) | Confirmed no product routes; `resolveRequestContextFromHeaders` is the only request-context source; harness flags default false |
| `package.json` | Confirmed no `jose`, `jsonwebtoken`, `auth0`, or any auth library installed |
| `git show --stat 63f7b94` | PR #47 contained two commits (`e443378`, `e4c6480`); both changed only the one decision gate documentation file |

---

## 3. Review Criteria and PASS/FAIL Matrix

### Criterion 1 — Decision gate is documentation-only

**Independent check:**

Decision gate header: "Implementation authorization: None." Section 6 (non-authorization boundary) enumerates 18 prohibited categories, including `jose`, `jsonwebtoken`, Auth0 SDK, `package.json`, all `src/` and `tests/` files, `authGuard` hook, database files, migrations, environment configuration, and deployment.

`package.json` independently confirmed: no auth libraries installed. `git show --stat 63f7b94` confirms PR #47 changed only the one documentation file across both commits.

**Result: PASS**

---

### Criterion 2 — Signature-first rule: JWT signature must be verified before any payload claim is trusted

**Independent check:**

Decision gate Decision 1:
> "`authGuard` must verify the JWT signature against the JWKS-retrieved public key **before** reading or trusting any JWT payload claim."

Permitted pre-verification operations are explicitly enumerated and limited to structural parsing and `kid` extraction. All payload claim reads (`iss`, `aud`, `sub`, `exp`, `iat`) are listed by name and attributed to the post-verification phase.

The gate adds a library-enforcement note: "This rule is not negotiable and must be enforced by library configuration if the chosen library supports it, or by explicit ordering if it does not." This is consistent with PR #45 Risk 2 mitigation plan and closes the unverified-claim-read attack vector.

The binding pipeline (Section 4) annotates `[pre-verification]` and `[post-verification]` segments explicitly, with a note that no payload claim read may appear in the pre-verification segment.

**Result: PASS**

---

### Criterion 3 — Required validations are explicitly decided: issuer, audience, expiration, subject presence

**Independent check:**

Decision gate Decision 2 (required validation steps, post-signature):

| Validation | Rule present | Binding detail |
|---|---|---|
| Issuer (`iss`) | ✓ | "Must exactly match the configured Auth0 issuer value. No wildcard or prefix matching." |
| Audience (`aud`) | ✓ | "Must contain or match the configured Nashir API audience identifier." |
| Expiration (`exp`) | ✓ | "Token must not be expired. Clock skew / leeway tolerance is a deferred decision (Section 5, item 10)." |
| Subject (`sub`) | ✓ | "Must be present and non-blank." |

All four validations are present. The issuer rule adds "no wildcard or prefix matching" — a tighter constraint than the planning gate specified. Expiration is correctly noted as a binding requirement with clock skew deferred. All four failures reject with 401.

**Result: PASS**

---

### Criterion 4 — Trusted JWT payload claims are limited to `iss`, `aud`, `sub`, `exp`, `iat`

**Independent check:**

Decision gate Decision 3 (trusted JWT payload claims):

| Claim | Present | Authorized use |
|---|---|---|
| `iss` | ✓ | Issuer validation only |
| `aud` | ✓ | Audience validation only |
| `sub` | ✓ | Identity binding: `requestContext.actorId = verifiedToken.sub` |
| `exp` | ✓ | Expiration validation only |
| `iat` | ✓ | Sanity check against implausibly future-issued tokens |

The claim set exactly matches the binding set from PR #41 Section 6 with Auth0 context from PR #43 Section 4. No claims beyond these five are listed. The default-deny rule in Decision 5 closes implicit trust of any unlisted claim.

**Result: PASS**

---

### Criterion 5 — `kid` is correctly treated as a JWS header parameter for JWKS key selection only

**Independent check:**

Decision gate Decision 4:
> "`kid` is present in the unverified JWT header. Its sole authorized use is selecting the matching public key from the JWKS endpoint before signature verification. `kid` has no authorization meaning after key selection."

Decision 4 enumerates four explicit prohibitions on `kid` after key selection: it must not be forwarded to application logic, stored as identity, used as a trust signal, or confused with payload claims in library configuration. This directly addresses PR #45 Risk 3 mitigation requirement.

The default-deny rule in Decision 5 applies only to payload claims (see Criterion 10), not to header parameters. `kid` is therefore correctly excluded from the payload default-deny while remaining separately constrained by Decision 4.

**Result: PASS**

---

### Criterion 6 — Missing `kid` header parameter maps to 401

**Independent check:**

Decision gate Decision 9 (HTTP error response mapping):

```
| Missing `kid` header parameter | 401 |
```

This row is present. Its placement after "Unknown `kid` after JWKS refresh | 401" and before "JWKS endpoint unavailable | 503..." correctly groups the two `kid`-related failure modes. Missing `kid` is a malformed-token condition (the backend cannot select a JWKS key), which is correctly a 401, not a 503.

**Result: PASS**

---

### Criterion 7 — Unknown `kid` after JWKS refresh maps to 401

**Independent check:**

Decision gate Decision 9:

```
| Unknown `kid` after JWKS refresh | 401 |
```

Present. An unknown `kid` after a cache-miss refresh means the token references a key the Auth0 JWKS endpoint does not know — this is an authentication failure (the token cannot be verified), correctly returning 401. This is distinct from a JWKS endpoint unavailability (503/502).

**Result: PASS**

---

### Criterion 8 — JWKS endpoint unavailable maps to 503 Service Unavailable or 502 Bad Gateway, never 401

**Independent check:**

Decision gate Decision 9:

```
| JWKS endpoint unavailable | 503 Service Unavailable or 502 Bad Gateway |
```

The decision gate adds explicit rationale: "JWKS endpoint failure returns 503/502 because it is a backend infrastructure failure, not a token authentication failure. 401 is not permitted for JWKS retrieval failures."

This is consistent with PR #45 Section 4.3 (confirmed PASS in PR #46 Criterion 8). The rationale closes any ambiguity about whether a temporarily unavailable JWKS endpoint should be treated as an authentication rejection.

**Result: PASS**

---

### Criterion 9 — Auth0 Organizations, Roles, Permissions, custom namespace claims, `app_metadata`, and `user_metadata` are excluded from Nashir authorization

**Independent check:**

Decision gate Decision 5 (Auth0-specific claims excluded from Nashir authorization):

| Required exclusion | Present | Rationale traced to |
|---|---|---|
| `org_id` (Auth0 Organizations) | ✓ | PR #43, Section 3 |
| `permissions` (Auth0 Permissions) | ✓ | Decision 5, PR #37 |
| `roles` (Auth0 Roles) | ✓ | Decision 3, PR #37 |
| `https://nashir.app/*` custom namespace | ✓ | "Not trusted in V1" |
| `app_metadata` | ✓ | "Not an authorization source" |
| `user_metadata` | ✓ | "Never used for authorization" |

All six required exclusions are present. Each exclusion targeting an Auth0 authorization feature (`org_id`, `permissions`, `roles`) is traced to a prior binding decision. "No component downstream of `authGuard` may use them" prevents pass-through to `workspaceContextGuard` or `permissionGuard`.

**Result: PASS**

---

### Criterion 10 — Default-deny rule applies only to payload claims not listed in the trusted payload claim set

**Independent check:**

Decision gate Decision 5, closing line:
> "Default-deny rule: any payload claim not listed in Decision 3 of this gate is excluded."

This is correctly scoped to **payload claims** only. The scoping matters: `kid` is a JWS header parameter, not a payload claim. The original draft read "any claim not listed in Decision 3 or Decision 4" — the user narrowed this to payload claims in PR #47 refinement commit `e4c6480`. The narrowing is correct: `kid` is already governed by Decision 4's explicit four-point prohibition; applying a payload-claim default-deny to a header parameter would be a category error.

The default-deny rule, combined with the five trusted claims in Decision 3, creates a closed trusted-claim set with no implicit extension path.

**Result: PASS**

---

### Criterion 11 — `authGuard` outputs verified identity context only and does not resolve `workspaceId`

**Independent check:**

Decision gate Decision 6:
> "`authGuard` produces one output: `requestContext.actorId` populated with the verified `sub` value. It does not produce a fully resolved `RequestContext`."

Decision 6 enumerates five explicit prohibitions: `authGuard` does not set `requestContext.workspaceId`, does not resolve workspace membership, does not resolve roles or permissions, does not call `evaluatePermissionGuard`, and does not read or write the Nashir DB.

The closing statement confirms the intermediate state: "After `authGuard` completes, `requestContext.actorId` is populated and `requestContext.workspaceId` is not yet populated."

`src/request-context.ts` confirms `RequestContext` has exactly two fields: `workspaceId` and `actorId`. Only `actorId` is populated by `authGuard`.

**Result: PASS**

---

### Criterion 12 — `workspaceId` is resolved only by `workspaceContextGuard` from the route path parameter

**Independent check:**

Decision gate Decision 7:
> "`workspaceId` is sourced from the route path parameter (`x-workspace-scope: route`, authority OpenAPI). It must not be sourced from the JWT, from any token claim, or from any header other than the route path."

Decision 7 adds: "`workspaceContextGuard` is the only component authorized to populate `requestContext.workspaceId`." This is consistent with the authority OpenAPI's `x-workspace-scope: route` annotation on all 89 workspace-scoped routes and with Decision 2 from PR #37 (workspace membership resolved server-side).

**Result: PASS**

---

### Criterion 13 — `permissionGuard` remains the only permission enforcement boundary

**Independent check:**

Decision gate Decision 8:
> "After workspace resolution, `evaluatePermissionGuard` remains the only call site for permission enforcement. It accepts `grantedPermissions` from the server-controlled mapping layer only. No component between `authGuard` and `permissionGuard` may make an access-allow decision."

`src/app.ts` independently confirmed: `evaluatePermissionGuard` has exactly one call site (`permissionGuardHarnessHandler`). No product routes exist. This is consistent with Decision 5 from PR #37 (`grantedPermissions` never caller-supplied) and Decision 6 from PR #37 (pipeline boundary).

**Result: PASS**

---

### Criterion 14 — `x-nashir-actor-id` and `x-nashir-workspace-id` are transitional test-harness headers and must be removed from the production request path

**Independent check:**

Decision gate Decision 10 (as refined in PR #47 commit `e4c6480`):
> "The `x-nashir-actor-id` and `x-nashir-workspace-id` headers are current harness-era context sources. They must not be used as verified sources in any real enforcement context (Decision 1, PR #37; Decision 7 of this gate). The execution planning gate must plan their removal from the production request path and ensure they are never consulted by `authGuard`, `workspaceContextGuard`, `permissionGuard`, or any downstream guard as trust sources."

`src/request-context.ts` independently confirmed: both constants (`ACTOR_ID_HEADER = "x-nashir-actor-id"`, `WORKSPACE_ID_HEADER = "x-nashir-workspace-id"`) are present and used by `resolveRequestContextFromHeaders`. The current header-based resolution is the harness-era path; Decision 10 correctly flags both headers for removal and names all three guard layers that must not consult them.

**Result: PASS**

---

### Criterion 15 — All eleven deferred decisions remain explicitly unresolved

**Independent check against decision gate Section 5:**

| Required deferred decision | Present | Item |
|---|---|---|
| Auth0 issuer / domain | ✓ | 1 |
| API audience value | ✓ | 2 |
| JWKS URI | ✓ | 3 |
| JWKS cache TTL | ✓ | 4 |
| Token TTL assumptions | ✓ | 5 |
| Key rotation behavior | ✓ | 6 |
| Local test token strategy | ✓ | 7 |
| Environment variable names | ✓ | 8 |
| JWT verification library | ✓ | 9 — `jose` named as leading candidate; selection deferred |
| Clock skew / leeway | ✓ | 10 — "flagged by PR #46, Observation A" |
| Progressive TypeScript context type names | ✓ | 11 |

All eleven deferred decisions are present and genuinely unresolved. None is settled by the authority contract or prior gates. Item 9 names `jose` as a leading candidate without binding the selection.

**Result: PASS**

---

## 4. PASS/FAIL Summary

| # | Criterion | Result |
|---|---|---|
| 1 | Decision gate is documentation-only; PR #47 scope is clean | PASS |
| 2 | Signature-first rule: signature verified before any payload claim read | PASS |
| 3 | Required validations decided: `iss` (exact match), `aud`, `exp`, `sub` presence | PASS |
| 4 | Trusted payload claims limited to `iss`, `aud`, `sub`, `exp`, `iat` | PASS |
| 5 | `kid` treated as JWS header parameter for JWKS key selection only | PASS |
| 6 | Missing `kid` header parameter maps to 401 | PASS |
| 7 | Unknown `kid` after JWKS refresh maps to 401 | PASS |
| 8 | JWKS endpoint unavailable maps to 503/502, never 401 | PASS |
| 9 | Auth0 excluded claims enumerated with prior-decision rationale; no downstream use permitted | PASS |
| 10 | Default-deny scoped to payload claims only; `kid` governed separately by Decision 4 | PASS |
| 11 | `authGuard` outputs identity context only; `workspaceId` not populated | PASS |
| 12 | `workspaceId` resolved only by `workspaceContextGuard` from route path param | PASS |
| 13 | `permissionGuard` is the only permission enforcement boundary | PASS |
| 14 | `x-nashir-actor-id` and `x-nashir-workspace-id` flagged for removal from production request path | PASS |
| 15 | All eleven deferred decisions remain explicitly unresolved | PASS |

**All 15 criteria: PASS**

---

## 5. Non-Authorization Boundary

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

## 6. GO / NO-GO Decision

**Decision: GO** to the **Backend Slice 0 Auth0 Token Verification Execution Planning Gate** — because:

- All 15 review criteria pass.
- The ten binding decisions cover the complete `authGuard` contract: verification sequence, validation requirements, trusted claim set, `kid` scope, excluded Auth0 claims, output boundary, `workspaceId` sourcing, permission enforcement, HTTP error mapping, and transitional header disposal.
- The signature-first rule (Decision 1) is unambiguous and cannot be circumvented by library-default behavior.
- The `kid` / payload-claim boundary (Decisions 4 and 5) is correctly modelled, with default-deny scoped to payload claims only.
- The JWKS error / auth error distinction (Decision 9) is correctly implemented with explicit rationale.
- Both `x-nashir-actor-id` and `x-nashir-workspace-id` are named for removal from the production request path, with all three guard layers listed.
- All eleven deferred decisions are tracked with enough precision for an execution planning gate.
- The non-authorization boundary is complete.
- PR #47 changed only the one permitted documentation file.

**NO-GO** for everything listed in Section 5 above.

---

## 7. Recommended Next Gate

**Backend Slice 0 Auth0 Token Verification Execution Planning Gate** — a documentation-only execution planning gate that resolves the eleven deferred decisions and produces an implementation-ready plan for the `authGuard` layer.

That gate must:

- Select the JWT verification library (binding decision — `jose` is the leading candidate; evaluate against PR #45 Risk 5 coupling criteria before binding)
- Resolve clock skew / leeway value (deferred decision 10; flagged in PR #46 Observation A)
- Specify JWKS cache TTL and rate-limit strategy
- Specify Auth0 tenant domain, API audience, and JWKS URI (or derivation rule from issuer)
- Specify environment variable names
- Specify the local test token strategy (locally generated RSA key pair + mock JWKS fixture; specific tooling)
- Plan `x-nashir-actor-id` and `x-nashir-workspace-id` removal from the production request path
- Define TypeScript progressive context type names for the partial `RequestContext` after `authGuard` and the full `RequestContext` after `workspaceContextGuard`
- Remain documentation-only — it must not install packages, write code, or configure secrets
- Be reviewed by its own dedicated review gate before any implementation is authorized
- Carry forward this gate's Section 5 non-authorization boundary verbatim
