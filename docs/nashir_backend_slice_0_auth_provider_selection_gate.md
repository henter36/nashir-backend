# Nashir Backend Slice 0 Auth Provider Selection Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only decision gate |
| Authorization source | `docs/nashir_backend_slice_0_auth_token_format_verification_decision_review_gate.md` (PR #42) |
| PR #42 merge commit (decision review gate) | `b675fb2` |
| PR #41 merge commit (token format decision gate) | `3eb49e632b7754feccae076c99055dacea194480` |
| Authority repository | `henter36/nashir` |
| Authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation, package changes, JWT middleware, Auth0 SDK integration, API routes, database changes, migrations, or deployment/secrets configuration of any kind |

---

## 1. Scope

PR #42's decision review gate passed all 12 criteria and recommended the Auth Provider Selection Planning Gate as the next step, citing that provider selection is a prerequisite for resolving JWKS URI, audience value, and key rotation TTL — all of which were left unresolved by the token format decision gate (PR #41).

This gate records one binding decision: **Auth0 is selected as the external identity provider for Nashir V1.** It defines Auth0's narrow role, the JWT claims the backend may trust, the boundary between Auth0 authority and Nashir authority, and the deferred decisions that the next planning gate must address before any implementation begins.

This gate does not open an execution gate or planning gate directly. It produces a GO / NO-GO decision to the Backend Slice 0 Auth Provider Selection Review Gate.

---

## 2. Settled Constraints Entering This Gate

| Constraint | Source |
|---|---|
| Bearer token is the authoritative identity source | Decision 1, PR #37 |
| Token verification strategy: JWT with JWKS | Decision 1, PR #41 |
| Verified JWT `sub` → `requestContext.actorId` | Decision 2, PR #41 |
| Workspace membership resolved server-side — not token-embedded | Decision 2, PR #37 |
| Roles resolved server-side — not token-embedded | Decision 3, PR #37 |
| `grantedPermissions` must never be caller-supplied | Decision 5, PR #37 |
| JWKS: configurable endpoint, cache TTL < rotation interval, rate-limited `kid` refresh | PR #41, confirmed PR #42 |
| `x-nashir-actor-id` must not be trusted in real enforcement | Decision 1, PR #37 |

---

## 3. Decision — Auth0 Selected as V1 External Identity Provider

**Decision: Auth0 is the external identity provider for Nashir V1.**

Auth0's role is narrowly defined:

- Auth0 issues signed JWTs for authenticated users
- Auth0 exposes a JWKS endpoint for token verification
- Auth0 provides the verified `sub` claim that the backend maps to `requestContext.actorId`
- Auth0 is responsible for: user authentication, credential management, session issuance, and token signing

Auth0 is **not** responsible for, and **must not** be treated as an authority for, any of the following in V1:

| Nashir authority | Rationale |
|---|---|
| Workspace identity and membership | Resolved server-side against the Nashir DB (Decision 2, PR #37) |
| WorkspaceMember status (active, invited, suspended) | Resolved server-side; non-disclosing check required (`x-membership-check: non-disclosing`) |
| Roles within a workspace | Resolved server-side from the membership record (Decision 3, PR #37) |
| Permission assignments | Output of Nashir's server-controlled role-to-permission mapping (Decision 4, PR #37) |
| Approval rules and approval decisions | Nashir product logic — not an auth provider concern |
| Any `nashir.<resource>.<action>` access decision | Enforced by `evaluatePermissionGuard` against server-resolved `grantedPermissions` |

**Auth0 Organizations, Auth0 Roles, and Auth0 Permissions are not used in V1.** These Auth0 features define authorization models within Auth0 itself. Nashir's workspace/RBAC model is Nashir-owned and Nashir-enforced. The two models must not be conflated. No Auth0 organizational claim, role claim, or permission claim may be trusted by the Nashir backend for any authorization decision.

---

## 4. JWT Claims Trusted After Verification

The backend trusts the following claims from an Auth0-issued JWT, and only these claims. This carries forward the binding claim set from PR #41, Section 6, with Auth0-specific context added.

| Claim | Use |
|---|---|
| `iss` | Validated against the configured Auth0 issuer (`https://<tenant>.auth0.com/`). Exact issuer value is an unresolved decision (Section 6). |
| `aud` | Validated against the configured API audience identifier. Exact audience value is an unresolved decision (Section 6). |
| `sub` | Verified user identity. Mapped to `requestContext.actorId`. This is the only identity claim the backend trusts for enforcement. |
| `exp` | Mandatory expiration check. Tokens past their expiration are rejected. |
| `iat` | Sanity check against tokens issued significantly in the future. |
| `kid` | Used by the JWT verification layer to select the correct JWKS public key. Not used by application logic after verification. |

No other claim from the Auth0-issued JWT is trusted for authorization decisions. In particular, any Auth0-specific claims beyond this list — including `org_id`, `permissions`, `roles`, `https://nashir.app/*` custom namespace claims — must be ignored by the backend in V1.

---

## 5. Nashir Remains the Authority

Auth0 answers one question: *who is this user?* (verified via `sub`)

Nashir answers all authorization questions:

- *Is this user a member of this workspace?* → Nashir DB lookup
- *What role does this user hold in this workspace?* → Nashir DB membership record
- *What permissions does this role grant?* → Nashir server-controlled role-to-permission mapping
- *Is the user allowed to perform this action on this resource?* → `evaluatePermissionGuard` with server-resolved `grantedPermissions`

This boundary is not negotiable and must be preserved in all future execution gates.

---

## 6. Deferred Decisions

The following decisions are explicitly unresolved by this gate. Each must be addressed before the auth token verification execution gate is authorized.

| # | Unresolved decision | Notes |
|---|---|---|
| 1 | **Auth0 tenant domain** | The Auth0 tenant to be used for V1 (e.g., `nashir.auth0.com` or a custom domain). Determines the `iss` value and the JWKS URI base. |
| 2 | **API audience value** | The Auth0 API identifier registered as the audience for this backend (e.g., `https://api.nashir.app`). Required for `aud` claim validation. |
| 3 | **JWKS endpoint URI** | Derived from the tenant domain: `https://<tenant>.auth0.com/.well-known/jwks.json`. Exact value depends on decision 1. |
| 4 | **Token TTL** | The access token lifetime configured in the Auth0 API settings. Determines the effective session window. |
| 5 | **JWKS cache TTL** | Must be shorter than Auth0's key rotation interval. Exact value depends on Auth0's rotation schedule and operational SLA requirements. |
| 6 | **Key rotation behavior** | Auth0's signing key rotation schedule and the backend's response: on-demand `kid`-triggered refresh (rate-limited), cache invalidation strategy. |
| 7 | **Local testing token strategy** | How signed test JWTs are generated in the test suite without a live Auth0 tenant. Model A (PR #41) established: locally generated key pair with a mock JWKS fixture. Specific tooling (test helper, fixture file, generation script) is deferred to the execution planning gate. |
| 8 | **Required environment variable names** | The environment variable names for: Auth0 issuer URL, Auth0 audience, JWKS URI (or derivable from issuer), and any other verification configuration. |

---

## 7. Non-Authorization Boundary

This gate does not authorize, and must NOT be read as approving, any of the following:

- implementation of any Auth0 SDK, Auth0 management client, or Auth0 authentication library
- installation of any npm packages (`auth0`, `express-oauth2-jwt-bearer`, `jose`, `jsonwebtoken`, or any equivalent)
- changes to `package.json` or `pnpm-lock.yaml`
- creation of any Auth0 tenant, application, or API registration
- implementation of any JWT verification middleware or Fastify hook
- changes to `src/request-context.ts`, `src/app.ts`, `src/permission-guard.ts`, or `src/error-model.ts`
- changes to any other file in `src/` or `tests/`
- implementation of any `authGuard` layer
- any database schema, ORM, migration, or SQL for membership, roles, or permissions
- product routes of any kind
- wiring `evaluatePermissionGuard` into any call site other than the existing `permissionGuardHarnessHandler`
- any extension of the static harness fixture
- OpenAPI or contract-document changes
- environment-variable or secrets configuration of any kind
- CI workflow changes
- deployment, pilot readiness, or production readiness of any kind

---

## 8. GO / NO-GO Decision

**Decision: GO** to the **Backend Slice 0 Auth Provider Selection Review Gate** — because:

- Auth0 is recorded as the V1 external identity provider with a precisely bounded role (identity only).
- Auth0 Organizations, Roles, and Permissions are explicitly excluded from V1 authorization authority.
- Nashir's authority over workspace membership, roles, permissions, approval rules, and access decisions is reaffirmed and unambiguous.
- The trusted JWT claim set is defined (Section 4) with Auth0-specific context, consistent with the token format decision gate (PR #41, Section 6).
- Eight deferred decisions (Section 6) are tracked with enough precision for the execution planning gate.
- The non-authorization boundary (Section 7) is complete.

**NO-GO** for everything listed in Section 7.

---

## 9. Recommended Next Gate

**Backend Slice 0 Auth Provider Selection Review Gate** — independently verifies this gate's decisions.

That review gate must:

- Verify Auth0's role is correctly bounded to external identity only and does not bleed into workspace/RBAC authority
- Verify the trusted claim set (Section 4) is consistent with PR #41 Section 6
- Verify Auth0 Organizations/Roles/Permissions are correctly excluded from V1
- Verify the eight deferred decisions are genuinely unresolved
- Verify the non-authorization boundary is complete
- Verify PR #43 changed only the one permitted documentation file
- If GO: recommend the **Backend Slice 0 Auth0 Token Verification Planning Gate**

---

## 10. Verification Commands

```bash
cd ~/workspace/nashir-backend

git log --oneline -6

npm run lint
npm run typecheck
npm test

# Confirm no Auth0 or JWT libraries installed
grep -E "auth0|jose|jsonwebtoken|express-oauth2" package.json || echo "not installed"

# Confirm RequestContext shape unchanged
grep -n "interface RequestContext" src/request-context.ts

# Confirm x-nashir-actor-id is still the only actorId source
grep -n "ACTOR_ID_HEADER" src/request-context.ts

# Confirm evaluatePermissionGuard call site count
grep -n "evaluatePermissionGuard" src/app.ts src/index.ts

# Confirm no product routes
grep -E -n "app\.(post|put|delete|patch)" src/app.ts

# Confirm authority bearer scheme still defers provider
grep -A 5 "scheme: bearer" ../nashir/docs/nashir_v1_openapi.yaml
```
