# Nashir Backend Slice 0 Auth Provider Selection Review Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only decision review gate |
| Authorization source | `docs/nashir_backend_slice_0_auth_provider_selection_gate.md` (PR #43) |
| PR #43 merge commit (provider selection gate) | `00f1a384221e8578a83777ced9acdd2f14db5e7f` |
| PR #42 merge commit (token format decision review gate) | `b675fb2` |
| PR #41 merge commit (token format decision gate) | `3eb49e632b7754feccae076c99055dacea194480` |
| Authority repository | `henter36/nashir` |
| Authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation, package changes, JWT middleware, Auth0 SDK integration, API routes, database changes, migrations, or deployment/secrets configuration of any kind |

---

## 1. Scope

PR #43 merged the Backend Slice 0 Auth Provider Selection Gate. That gate formally selected Auth0 as the V1 external identity provider, defined Auth0's narrow role (identity only), excluded Auth0 Organizations/Roles/Permissions from Nashir authorization authority, and deferred eight implementation decisions.

This review gate independently verifies those decisions against the prior gate sequence, live source files, and the PR #43 commit record. It does not rely on the provider selection gate's self-assessment. It produces a PASS/FAIL matrix and a GO / NO-GO decision.

---

## 2. Inputs Used for Independent Verification

| Input | How verified |
|---|---|
| `docs/nashir_backend_slice_0_auth_provider_selection_gate.md` (PR #43) | Read in full — the primary artifact under review |
| `docs/nashir_backend_slice_0_auth_token_format_verification_decision_gate.md` (PR #41) | Binding claim set and JWT + JWKS strategy that the provider selection must align with |
| `src/request-context.ts` (`main` HEAD) | Confirmed `RequestContext { workspaceId, actorId }` unchanged; `x-nashir-actor-id` is still the only `actorId` source |
| `src/app.ts` (`main` HEAD) | Confirmed `STATIC_HARNESS_GRANTED_PERMISSIONS` is the only `grantedPermissions` source; harness flags default false; no product routes |
| `package.json` | Confirmed no `auth0`, `jose`, `jsonwebtoken`, or any auth library installed |
| `git show --stat 00f1a38` | Confirmed: exactly one file added in `docs/`; no other files touched |

---

## 3. Review Criteria and PASS/FAIL Matrix

### Criterion 1 — Gate is documentation-only

**Independent check:**

Provider selection gate header: "Implementation authorization: None." Section 7 (non-authorization boundary) enumerates 19 prohibited categories by name, including Auth0 SDK, npm packages, JWT middleware, `authGuard`, all source files, `package.json`, database files, migrations, environment configuration, and deployment.

`package.json` independently confirmed: no auth libraries are installed. `git show --stat 00f1a38` shows exactly one file added in `docs/`. No source, test, or configuration files were touched.

**Result: PASS**

---

### Criterion 2 — Auth0 selection aligns with the JWT + JWKS token format decision

**Independent check:**

The token format decision gate (PR #41) bound the project to JWT with JWKS verification. Auth0 satisfies both requirements: it issues signed JWTs and exposes a standard JWKS endpoint (`https://<tenant>.auth0.com/.well-known/jwks.json`).

The provider selection gate Section 4 lists the validated token fields as `iss`, `aud`, `sub`, `exp`, `iat`, and `kid`. This aligns with PR #41 Section 6's binding set: `iss`, `aud`, `sub`, `exp`, and `iat` are JWT payload claims used for validation and identity binding, while `kid` is a JOSE/JWT header parameter used only for JWKS key selection. Adding `kid` as a key-selection header parameter is an Auth0-specific elaboration, not a contradiction. No claim from PR #41's allowed payload claim set is removed or re-scoped.

**Result: PASS**

---

### Criterion 3 — Auth0's role is correctly bounded to external identity only

**Independent check:**

Provider selection gate Section 3 states Auth0 is responsible for: user authentication, credential management, session issuance, and token signing.

Section 3 explicitly lists what Auth0 is **not** responsible for:

| Nashir authority | Traced to |
|---|---|
| Workspace identity and membership | Decision 2, PR #37 |
| WorkspaceMember status (active/invited/suspended) | `x-membership-check: non-disclosing`, authority OpenAPI |
| Roles within a workspace | Decision 3, PR #37 |
| Permission assignments | Decision 4, PR #37 |
| Approval rules and approval decisions | Nashir product logic |
| `nashir.<resource>.<action>` access decisions | Decision 5/6, PR #37 |

Each exclusion is grounded in a prior gate decision or the authority contract. Section 5 restates the boundary succinctly: Auth0 answers *who is this user?* — Nashir answers all authorization questions.

**Result: PASS**

---

### Criterion 4 — Auth0 Organizations, Roles, and Permissions are explicitly excluded from Nashir authorization authority

**Independent check:**

Provider selection gate Section 3:
> "Auth0 Organizations, Auth0 Roles, and Auth0 permissions must not be treated as Nashir Workspace/RBAC authority in V1."

Section 4:
> "any Auth0-specific claims beyond this list — including `org_id`, `permissions`, `roles`, `https://nashir.app/*` custom namespace claims — must be ignored by the backend in V1."

The rationale is sound: Auth0 Organizations, Roles, and Permissions are Auth0-internal authorization constructs. Accepting them as authorization facts would mean Nashir's RBAC model is partially defined outside the Nashir DB — violating Decision 3 (roles are server-side DB) and Decision 5 (grantedPermissions never caller-supplied) from PR #37.

**Result: PASS**

---

### Criterion 5 — Decision does not authorize implementation

**Independent check:**

Non-authorization boundary (Section 7) covers all required categories:

| Required prohibition | Present |
|---|---|
| No JWT/JWKS code | ✓ — "JWT verification middleware or Fastify hook"; "any `authGuard` layer" |
| No Auth0 SDK | ✓ — "Auth0 SDK, Auth0 management client, or Auth0 authentication library" |
| No package changes | ✓ — `package.json`, `pnpm-lock.yaml` explicitly listed; named packages listed |
| No middleware | ✓ — "JWT verification middleware or Fastify hook"; "any `authGuard` layer" |
| No API routes | ✓ — "product routes of any kind" |
| No DB changes | ✓ — "database schema, ORM, migration, or SQL" |
| No migrations | ✓ — same entry |
| No secrets / deployment config | ✓ — "environment-variable or secrets configuration of any kind"; "deployment, pilot readiness, or production readiness" |

All required prohibitions are present. The gate is clean.

**Result: PASS**

---

### Criterion 6 — All eight deferred decisions remain explicitly unresolved

**Independent check against provider selection gate Section 6:**

| Required deferred decision | Present | Entry |
|---|---|---|
| Auth0 domain / issuer | ✓ | Item 1: "Auth0 tenant domain... determines the `iss` value and the JWKS URI base" |
| API audience | ✓ | Item 2: "Auth0 API identifier registered as the audience" |
| JWKS URI exact value | ✓ | Item 3: "Derived from the tenant domain... Exact value depends on decision 1" |
| JWKS cache TTL | ✓ | Item 5: "Must be shorter than Auth0's key rotation interval" |
| Token TTL | ✓ | Item 4: "Access token lifetime configured in the Auth0 API settings" |
| Key rotation behavior | ✓ | Item 6: "Auth0's signing key rotation schedule and the backend's response" |
| Local test token strategy | ✓ | Item 7: "locally generated key pair with a mock JWKS fixture; specific tooling deferred to execution planning gate" |
| Env var names | ✓ | Item 8: "Environment variable names for: Auth0 issuer URL, Auth0 audience, JWKS URI" |

All eight deferred decisions are present and genuinely unresolved — none is settled by the authority contract or prior gates.

**Result: PASS**

---

### Criterion 7 — PR #43 changed only the expected documentation file

**Independent check:**

`git show --stat 00f1a384221e8578a83777ced9acdd2f14db5e7f`:
```
...backend_slice_0_auth_provider_selection_gate.md | 197 +++++++++++++++++++++
 1 file changed, 197 insertions(+)
```

One file, `docs/` directory, documentation gate only. No changes to `src/`, `tests/`, `package.json`, `pnpm-lock.yaml`, workflow files, OpenAPI files, or environment configuration.

**Result: PASS**

---

## 4. PASS/FAIL Summary

| # | Criterion | Result |
|---|---|---|
| 1 | Gate is documentation-only; PR #43 scope is clean | PASS |
| 2 | Auth0 selection aligns with JWT + JWKS token format decision (PR #41) | PASS |
| 3 | Auth0's role correctly bounded to external identity; Nashir retains all authorization authority | PASS |
| 4 | Auth0 Organizations, Roles, and Permissions explicitly excluded from Nashir authorization | PASS |
| 5 | No implementation authorized; non-authorization boundary complete | PASS |
| 6 | All eight deferred decisions remain explicitly unresolved | PASS |
| 7 | PR #43 changed only the one permitted documentation file | PASS |

**All 7 criteria: PASS**

---

## 5. Non-Authorization Boundary

This review gate does not authorize, and must NOT be read as approving, any of the following:

- implementation of any Auth0 SDK, authentication library, or JWT verification library
- installation of any npm packages
- changes to `package.json` or `pnpm-lock.yaml`
- creation of any Auth0 tenant, application, or API registration
- implementation of any JWT verification middleware, `authGuard`, or Fastify hook
- changes to any file in `src/` or `tests/`
- any database schema, ORM, migration, or SQL
- product routes of any kind
- wiring `evaluatePermissionGuard` beyond the existing `permissionGuardHarnessHandler`
- OpenAPI or contract-document changes
- environment-variable or secrets configuration
- CI workflow changes
- deployment, pilot readiness, or production readiness of any kind

---

## 6. GO / NO-GO Decision

**Decision: GO** to the **Backend Slice 0 Auth0 Token Verification Planning Gate** — because:

- All 7 review criteria pass.
- Auth0 is correctly selected as the V1 external identity provider with a precisely bounded role.
- The selection is consistent with the JWT + JWKS token format decision (PR #41) and the source-of-truth decisions (PR #37).
- Auth0 Organizations, Roles, and Permissions are correctly and explicitly excluded from Nashir authorization authority.
- Nashir's authority over workspace membership, roles, permissions, and access decisions is unambiguously reaffirmed.
- All eight deferred decisions are tracked with enough precision for the next planning gate.
- The non-authorization boundary is complete.
- PR #43 changed exactly one file in `docs/`. Scope was clean.

**NO-GO** for everything listed in Section 5 above.

---

## 7. Recommended Next Gate

**Backend Slice 0 Auth0 Token Verification Planning Gate** — a documentation-only planning gate that produces an implementation-ready plan for the `authGuard` layer using Auth0-issued JWTs.

That gate must:

- Select the JWT verification library (resolving unresolved decision 6 from PR #41 — `jose` as the leading candidate)
- Specify the local test token strategy (resolving decision 7 from PR #41)
- Specify JWKS cache TTL and rate-limit parameters, informed by Auth0's rotation schedule
- Plan `RequestContext` evolution (whether to add post-verification metadata fields)
- Plan error response handling for token verification failures (expired, bad signature, wrong audience, missing token)
- Remain documentation-only — it must not install packages, write code, or configure secrets
- Be reviewed by its own dedicated review gate before any execution gate is opened
- Carry forward this gate's Section 5 non-authorization boundary verbatim
