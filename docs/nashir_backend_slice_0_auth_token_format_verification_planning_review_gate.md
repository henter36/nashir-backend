# Nashir Backend Slice 0 Auth Token Format / Verification Planning Review Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only planning review gate |
| Authorization source | `docs/nashir_backend_slice_0_auth_token_format_verification_planning_gate.md` (PR #39) |
| PR #39 merge commit (planning gate) | `3cc71fbcbbb3898d60e33d7cfdcb37a96800d094` |
| PR #38 merge commit (decision review gate) | `b1b84f6` |
| Authority repository | `henter36/nashir` |
| Authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation, auth provider integration, database access, role storage, product routes, broad permission enforcement, generated clients, OpenAPI changes, SQL/migrations/ORM, or deployment of any kind |

---

## 1. Scope

PR #39 merged the Backend Slice 0 Auth Token Format / Verification Planning Gate. That gate evaluated four candidate token verification models and recommended Model A (JWT with JWKS verification) as the planning direction for the `authGuard` layer.

This review gate independently verifies that planning gate against the same authority inputs, live source files, and the PR #39 commit record. It does not rely on the planning gate's self-assessment. It produces a 12-criterion PASS/FAIL matrix and a GO / NO-GO decision.

---

## 2. Inputs Used for Independent Verification

| Input | How verified |
|---|---|
| `docs/nashir_backend_slice_0_auth_token_format_verification_planning_gate.md` (PR #39) | Read in full — the primary artifact under review |
| `src/request-context.ts` (108 lines, `main` HEAD) | Read directly — confirmed `RequestContext { workspaceId: string; actorId: string }` from `x-nashir-actor-id` header; no token, sub, role, or permission fields |
| `src/app.ts` (197 lines, `main` HEAD) | Read directly — confirmed `STATIC_HARNESS_GRANTED_PERMISSIONS` is the only `grantedPermissions` source (line 70); `evaluatePermissionGuard` has one call site; harness flags default false; no product routes |
| `src/permission-guard.ts` (108 lines, `main` HEAD) | Read directly — confirmed `EvaluatePermissionGuardInput` accepts `requestContext: { workspaceId, actorId }` and opaque permission strings; no token fields |
| `src/error-model.ts` (47 lines, `main` HEAD) | Read directly — confirmed `ErrorModel { code, message, statusCode, correlationId?, details? }`; no changes |
| `package.json` | Grepped — confirmed no `jose`, `jsonwebtoken`, `auth0`, `clerk`, `cognito`, or Firebase library installed |
| `henter36/nashir` `docs/nashir_v1_openapi.yaml` (authority commit `04f54f8`) | Grepped directly — confirmed `bearerAuth` scheme description defers provider and format; `x-workspace-scope: route` and `x-membership-check: non-disclosing` present on workspace-scoped routes |
| `git show --stat 3cc71fb` | Confirmed: exactly one file added (`docs/nashir_backend_slice_0_auth_token_format_verification_planning_gate.md`, 378 insertions); no other files touched |

---

## 3. Review Criteria and PASS/FAIL Matrix

### Criterion 1 — Planning gate remains documentation-only

**What to verify:** The planning gate authorizes no implementation of any JWT/JWKS library, auth provider, middleware, or runtime change.

**Independent check:**

Planning gate header:
> "Implementation authorization: None — this gate is documentation-only and authorizes no implementation, auth provider integration, database access, role storage, product routes, broad permission enforcement, generated clients, OpenAPI changes, SQL/migrations/ORM, or deployment of any kind"

Planning gate Section 12 (non-authorization boundary) enumerates 21 prohibited categories — verified by reading Section 12 in full. The prohibited list explicitly names JWT library installation (`jose`, `jsonwebtoken`), `authGuard` middleware, JWKS fetch/cache/rotation handling, bearer token parsing, changes to all source files, and `package.json`.

`package.json` independently confirmed: no JWT or auth libraries are installed. `src/` files are unchanged from the prior gate's state.

**Finding:** The planning gate records a direction without authorizing implementation. No ambiguity exists in its non-authorization boundary.

**Result: PASS**

---

### Criterion 2 — Model A (JWT with JWKS verification) recommended for defensible reasons

**What to verify:** The recommendation for Model A is grounded in the project's constraints and the authority contract, not stated preference.

**Independent check:**

Planning gate Section 5 gives five distinct reasons for the recommendation:

1. **Provider-agnostic by design** — Every major auth provider issues JWTs with a JWKS endpoint. This keeps provider selection deferred, consistent with the authority's own language: "The provider and token format are deferred to a later authorized auth implementation planning gate" (grepped from `nashir_v1_openapi.yaml`). Verified accurate.

2. **Standard-defined verification algorithm** — JWT verification is fully specified by RFC 7519. No vendor SDK required. This is accurate: RFC 7519 defines signature verification, and the claims validation algorithm (`exp`, `iss`, `aud`) is independently specifiable without a provider.

3. **Local testability without external infrastructure** — A test key pair (RSA or ECDSA P-256) can be generated at test time. The verification code path is identical between test and production; only the JWKS source differs. This is accurate: a local JWKS fixture can serve a known public key to the same verification function that a live JWKS endpoint would serve in production.

4. **Stateless verification** — JWKS are fetched and cached; no per-request network call is required after the initial fetch. This is accurate and is the primary advantage over Model B.

5. **Compatible with the `authGuard` pipeline boundary** — The `authGuard` layer (Decision 6) maps cleanly to a middleware that verifies a JWT and sets `requestContext.actorId`. Verified: `evaluatePermissionGuard` accepts `requestContext: { workspaceId, actorId }` — the interface is compatible.

All five reasons are independently verifiable and grounded in observable facts or the authority contract. No reason is unstated or circular.

**Finding:** The Model A recommendation is defensible. It follows from the project's deferred-provider constraint and the authority's own deferral language.

**Result: PASS**

---

### Criterion 3 — All three alternative models evaluated with verdicts

**What to verify:** Models B (opaque token + introspection), C (provider SDK), and D (dev-only signed token) are each evaluated against the same criteria with explicit verdicts.

**Independent check:**

Planning gate Section 4 evaluates all four models. Each model is assessed against six criteria: security, portability, local testability, dependency risk, future provider flexibility, and authority compatibility.

**Model B (opaque token + introspection):**
- Verdict: "Not the planning direction. The per-request network dependency introduces availability coupling that Model A avoids. Local testability is materially harder."
- The per-request introspection call dependency is accurate: RFC 7662 introspection requires a network call on every authenticated request. The availability coupling argument (provider outage = all requests fail) is sound. Local testability claim is accurate: tests require a mock HTTP server or live endpoint.
- No criterion is scored without a reason.

**Model C (provider SDK):**
- Verdict: "Not the planning direction. The authority explicitly defers provider selection; provider-specific SDK verification fuses provider selection with verification strategy before the provider selection decision is authorized."
- This is accurately sourced from the authority's deferral language. Bundling a provider SDK before provider selection is authorized creates a dependency that cannot be reversed without re-opening a gate.
- No criterion is scored without a reason.

**Model D (dev-only signed token):**
- Verdict: "Not the planning direction as a standalone model. Model D's local testability advantage is already captured by Model A's test key pair approach."
- This is accurate: a locally generated key pair used to sign test JWTs exercises the same Model A verification code path. Model D's sole advantage (local testability) is not exclusive to it.
- The "authority compatibility: incompatible with production requirement" assessment is accurate — the authority requires bearer token authentication for all non-health routes and does not provide a dev-only bypass mechanism.

**Finding:** All three alternatives are evaluated with six criteria each and explicit verdicts. Each verdict is grounded in a stated, verifiable reason.

**Result: PASS**

---

### Criterion 4 — Allowed identity claims limited to identity/validation claims

**What to verify:** The planning gate permits only `sub`, `iss`, `aud`, `exp`, `iat`, and optionally `email` (as non-authoritative). No authorization or membership claims are in the allowed set.

**Independent check:**

Planning gate Section 6.1 lists six allowed claims:

| Claim | Use | Correctly bounded? |
|---|---|---|
| `sub` | Maps to `requestContext.actorId`; authoritative identity | ✓ |
| `iss` | Validated during verification; not used after | ✓ |
| `aud` | Validated during verification; not used after | ✓ |
| `exp` | Mandatory expiration check | ✓ |
| `iat` | Sanity check against future issuance | ✓ |
| `email` | "Optional, non-authoritative"; display/logging only; `sub` is authoritative | ✓ |

The `email` claim is correctly bounded: Section 6.1 states it "must not be used as the primary identity source" and "If used at all, it is for display/logging purposes only." This is an important constraint — `email` addresses can change or be shared across providers; only `sub` provides a stable, provider-scoped, cryptographically verified identity.

No authorization claims (`roles`, `permissions`, `workspaces`, `scope` carrying `nashir.*`) appear in Section 6.1. The allowed set is strictly limited to identity and validation claims.

**Finding:** Section 6.1 correctly limits the allowed claim set to identity/validation claims. The `email` carve-out is properly conditioned as non-authoritative.

**Result: PASS**

---

### Criterion 5 — Token-carried workspace membership, roles, `grantedPermissions`, permission inventory, and authorization decisions are explicitly prohibited

**What to verify:** Section 6.2 explicitly prohibits all five categories of unauthorized token claims.

**Independent check:**

Planning gate Section 6.2 lists five prohibited claim categories:

| Prohibited category | Present | Reason grounded in prior gate? |
|---|---|---|
| Workspace membership (e.g., `workspaces`, `workspace_ids`, `member_of`) | ✓ | Decision 2 (PR #37): membership is server-side; stale token claims cannot satisfy `x-membership-check: non-disclosing` |
| Roles (e.g., `role`, `roles`, `workspace_role`) | ✓ | Decision 3 (PR #37): role is a property of the server-side membership record |
| `grantedPermissions` or equivalent (e.g., `permissions`, `scopes` carrying `nashir.*`) | ✓ | Decision 5 (PR #37): `grantedPermissions` must never be caller-supplied; a token claim is client-supplied |
| Permission inventory (array of permission strings) | ✓ | Decision 5 — same reasoning; permission set is output of server-controlled mapping |
| Workspace authorization decisions (e.g., `can_access_workspace`, `workspace_admin`) | ✓ | Authorization decisions belong to `workspaceContextGuard` and `permissionGuard` pipeline layers |

All five prohibited categories are present. Each is grounded in a prior gate decision (Decisions 2, 3, or 5 from PR #37). The rationale section at the end of 6.2 correctly states: "These prohibitions are not new constraints — they follow directly from Decisions 2, 3, 4, and 5 of the source-of-truth decision gate."

**Finding:** Section 6.2 correctly and completely prohibits all five categories of unauthorized token claims, with binding rationale traced to prior gate decisions.

**Result: PASS**

---

### Criterion 6 — Verified token identity feeds `requestContext.actorId`

**What to verify:** The planning gate defines how the `authGuard` layer maps the verified JWT `sub` claim to `requestContext.actorId`.

**Independent check:**

Planning gate Section 7 describes a five-step sequence:
1. Extract `Authorization: Bearer <token>` header
2. Verify JWT signature against JWKS public keys for the configured issuer
3. Validate `exp`, `iss`, `aud` claims
4. Extract `sub` claim on successful verification
5. Set `requestContext.actorId = verifiedToken.sub`

This mapping is consistent with:
- `src/permission-guard.ts` — `EvaluatePermissionGuardInput.requestContext.actorId: string` — the `actorId` field will accept the verified `sub` without interface changes
- `src/request-context.ts` — `RequestContext.actorId: string` — same interface, already the correct shape
- Decision 6 (PR #37) — `authGuard` owns Layer 1 (request identity / token verification); `workspaceContextGuard` and `permissionGuard` consume `actorId` without re-verifying

The planning gate correctly notes: "No changes to `src/request-context.ts` are authorized by this gate. The `RequestContext { workspaceId: string; actorId: string }` interface already has the correct shape for the post-verification world."

This is independently verified: `src/request-context.ts` lines 5–8 define `interface RequestContext { workspaceId: string; actorId: string }` — no modification is needed for the `authGuard` to populate `actorId` from a verified `sub`.

**Finding:** The token-to-`actorId` mapping in Section 7 is accurate, consistent with the pipeline boundary (Decision 6), and requires no source changes to support.

**Result: PASS**

---

### Criterion 7 — `workspaceId` remains route/workspace-context derived; not from token membership claims

**What to verify:** Section 8 confirms `workspaceId` comes from the route path parameter `{workspaceId}`, not from a token claim.

**Independent check:**

Planning gate Section 8 states:
> "The JWT must not carry workspace membership or workspace identity claims that the backend uses for enforcement."

Section 8 maps the three-guard pipeline:
- `authGuard` — extracts `actorId` from `sub`. Does not determine workspace scope.
- `workspaceContextGuard` — extracts `workspaceId` from route path parameter `{workspaceId}`. Uses `(verifiedActorId, workspaceId)` for membership lookup.
- `permissionGuard` — calls `evaluatePermissionGuard` with `resourceWorkspaceId` from route path parameter.

This is consistent with:
- Authority `x-workspace-scope: route` annotation (confirmed by grep — present on all workspace-scoped routes in `nashir_v1_openapi.yaml`)
- Source-of-truth decision gate Section 8: "`resourceWorkspaceId` parameter of `evaluatePermissionGuard` must be set to the route's `{workspaceId}` path parameter value"
- `src/permission-guard.ts` lines 77–81 — `resourceWorkspaceId !== requestContext.workspaceId` workspace isolation check

The planning gate also correctly preserves the existing header-based `requestContext.workspaceId` for correlation and diagnostics while constraining it from being the authoritative enforcement scope when a path parameter is present.

**Finding:** Section 8 is accurate and consistent with the authority contract, the source-of-truth decision gate, and the current `evaluatePermissionGuard` interface. `workspaceId` for enforcement derives from the route path parameter, not the token.

**Result: PASS**

---

### Criterion 8 — `x-nashir-actor-id` remains non-production / transitional only

**What to verify:** Section 9 correctly constrains `x-nashir-actor-id` to the diagnostic harness and prohibits its use in real enforcement.

**Independent check:**

Planning gate Section 9 defines three distinct states:

**Current behavior (harness era):**
- `x-nashir-actor-id` populates `requestContext.actorId` via `resolveRequestContextFromHeaders`
- Used only by opt-in diagnostic harness routes
- All harness routes return HTTP 200 regardless of decision outcome — no enforcement
- `src/index.ts` calls `buildApp()` with no options — harness routes never registered in production

This is independently verified:
- `src/request-context.ts` lines 1–2: `ACTOR_ID_HEADER = "x-nashir-actor-id"` — the only `actorId` source in the current runtime
- `src/app.ts` line 161: `if (enableInternalPermissionGuardHarnessRoutes === true)` — strict equality, default false
- `src/app.ts` line 70: `grantedPermissions: STATIC_HARNESS_GRANTED_PERMISSIONS` — static constant, not from headers

**Required behavior (enforcement era):**
- Real enforcement routes must use token-verified `actorId`
- `x-nashir-actor-id` header must not be read or trusted in real enforcement code paths

**Transitional boundary:**
- Header-based path in `src/request-context.ts` is retained as-is (gate does not authorize changes)
- Diagnostic harness remains behind strict-equality opt-in flag with default `false`
- No production code path may promote `x-nashir-actor-id` to a verified identity source

The constraint for future execution gates is explicit and correctly extends Decision 1 from PR #37: "Any execution gate that introduces a new call site using `requestContext.actorId` for enforcement decisions must demonstrate that `actorId` is populated from a token-verified source, not from the `x-nashir-actor-id` header."

**Finding:** Section 9 accurately describes the current state, required future state, and transitional boundary. The durable constraint for future execution gates is precise and traceable to Decision 1.

**Result: PASS**

---

### Criterion 9 — JWKS key rotation planning: cache TTL shorter than rotation interval, rate-limited on-demand refresh for unknown `kid`

**What to verify:** Section 10 explicitly addresses JWKS cache TTL relative to key rotation interval, and rate-limited on-demand refresh when an unknown key ID (`kid`) is encountered.

**Independent check:**

Planning gate Section 10, item 4 (Key rotation policy):
> "How frequently the provider rotates signing keys. The backend's JWKS cache TTL must be shorter than the rotation interval, and the verification layer should support rate-limited, on-demand JWKS refreshing when an unknown key ID (kid) is encountered."

Both required elements are present:

1. **Cache TTL shorter than rotation interval** — explicitly stated as a constraint: "The backend's JWKS cache TTL must be shorter than the rotation interval." This is the correct operational constraint — if the TTL equals or exceeds the rotation interval, the backend may hold stale keys and reject valid tokens signed with the new key.

2. **Rate-limited on-demand refresh for unknown `kid`** — explicitly stated: "the verification layer should support rate-limited, on-demand JWKS refreshing when an unknown key ID (kid) is encountered." This addresses the attack surface: without rate limiting, an attacker could present tokens with fabricated `kid` values to trigger repeated JWKS fetches (a form of denial-of-service against the JWKS endpoint and the backend itself).

Both constraints are recorded as unresolved decisions that must be addressed in the implementation planning gate — they are not yet specified with concrete TTL values or rate-limit parameters, which is correct for a planning gate.

**Finding:** Section 10, item 4 explicitly captures both required operational constraints on JWKS caching and key rotation. The rate-limited `kid`-based refresh requirement is present.

**Result: PASS**

---

### Criterion 10 — All required unresolved decisions explicitly tracked

**What to verify:** Section 10 tracks provider selection, JWKS endpoint, audience, key rotation, local test token strategy, and error response mapping. (Eight decisions are present; this criterion verifies the six required ones are among them.)

**Independent check against planning gate Section 10:**

| Required unresolved decision | Present | Planning gate entry |
|---|---|---|
| Provider selection | ✓ | Item 1: "Auth0, AWS Cognito, Clerk, Okta, Firebase Authentication, Supabase Auth, Keycloak, or other" |
| JWKS endpoint URI | ✓ | Item 2: "Depends on provider selection. The URI must be configurable (environment variable or config file)" |
| Token audience claim value(s) | ✓ | Item 3: "`aud` claim value the backend validates against... typically a service identifier" |
| Key rotation policy | ✓ | Item 4: "JWKS cache TTL must be shorter than rotation interval; rate-limited, on-demand refreshing when unknown `kid` encountered" |
| Local test token strategy | ✓ | Item 5: "Locally generated key pair with a mock JWKS fixture... test helper, key generation script, or fixture file" |
| Error response mapping for verification failures | ✓ | Item 6: "Token verification failures... HTTP status codes... constrained by full `ErrorModel` alignment gap" |

All six required decisions are present. Two additional decisions are tracked beyond the minimum: item 7 (token verification library — `jose` as leading candidate) and item 8 (`RequestContext` interface evolution). Both are genuinely unresolved: no library is installed, and the interface evolution question depends on `workspaceContextGuard` requirements not yet planned.

**Finding:** All six required unresolved decisions are tracked with enough precision for a future execution planning gate to address each one. The two additional decisions (library selection, interface evolution) are appropriately deferred.

**Result: PASS**

---

### Criterion 11 — Non-authorization boundary is complete

**What to verify:** Section 12 explicitly prohibits implementation, auth provider integration, DB access, role storage, SQL/migrations/ORM, product routes, broad permission enforcement, generated clients, OpenAPI changes, env/secrets config, deployment, pilot, and production readiness.

**Independent check against planning gate Section 12:**

| Prohibited category | Present in Section 12 |
|---|---|
| Auth provider integration / configuration | ✓ — "implementation of any auth provider integration or configuration" |
| JWT verification library installation / wiring | ✓ — "implementation of any JWT verification library installation or wiring" |
| JWKS fetch / cache / key rotation | ✓ — "implementation of any JWKS endpoint fetch, cache, or key rotation handling" |
| Bearer token parsing / signature verification / claim extraction | ✓ — explicitly listed |
| `authGuard` middleware / Fastify hook | ✓ — "implementation of any `authGuard` middleware or Fastify hook" |
| `src/request-context.ts` changes | ✓ — explicitly listed with specific examples |
| `src/app.ts` changes | ✓ — "including adding JWT verification middleware or changing the `onRequest` hook" |
| `src/permission-guard.ts` changes | ✓ — explicitly listed |
| `src/error-model.ts` changes | ✓ — explicitly listed |
| New npm packages (`jose`, `jsonwebtoken`, any auth SDK) | ✓ — explicitly listed by name |
| `package.json` / `pnpm-lock.yaml` changes | ✓ — explicitly listed |
| DB schema / ORM / migration / SQL | ✓ — "implementation of any database schema, ORM, migration, or SQL for workspace membership, role storage, or permission tables" |
| Role-to-permission mapping / permission resolution | ✓ — explicitly listed |
| Wiring `evaluatePermissionGuard` beyond harness | ✓ — explicitly listed |
| Product routes | ✓ — "product routes of any kind" |
| Static harness fixture extension | ✓ — explicitly listed |
| Generated client changes | ✓ — explicitly listed |
| OpenAPI / contract-document changes | ✓ — explicitly listed |
| Environment-variable / secrets configuration | ✓ — explicitly listed |
| CI workflow changes | ✓ — explicitly listed |
| Deployment / pilot / production readiness | ✓ — explicitly listed |

All required categories are present. The planning gate's Section 12 is the most specific non-authorization boundary in the Slice 0 gate sequence — it explicitly names the specific libraries (`jose`, `jsonwebtoken`), specific source files, and specific Fastify constructs that must not change. This precision reduces the risk of misinterpretation.

**Finding:** The non-authorization boundary is complete and more specific than required. No category is missing.

**Result: PASS**

---

### Criterion 12 — PR #39 changed only the expected documentation file

**What to verify:** The PR #39 merge commit touched only `docs/nashir_backend_slice_0_auth_token_format_verification_planning_gate.md`.

**Independent check:**

`git show --stat 3cc71fbcbbb3898d60e33d7cfdcb37a96800d094`:
```
...auth_token_format_verification_planning_gate.md | 378 +++++++++++++++++++++
 1 file changed, 378 insertions(+)
```

One file, `docs/` directory, documentation gate only. No changes to `src/`, `tests/`, `package.json`, `pnpm-lock.yaml`, workflow files, OpenAPI files, generated files, SQL or migration files, or environment configuration.

**Finding:** PR #39 is clean. Scope is exactly what the gate permits.

**Result: PASS**

---

## 4. Independent Observations

The following observations are recorded for the next gate. They do not block GO.

**Observation A — Section 15 verification commands contain a garbled `cd` command.** The first line of the `bash` block in Section 15 reads `cd "20 20 12 61 79 80 81 98 701 33 100 204 250 395 398 399 400git rev-parse --show-toplevel)"` — this is a documentation artifact and has no effect on any gate decision. The remaining verification commands in Section 15 are correct. This is a cosmetic issue only.

**Observation B — The planning gate's Section 11 describes the next gate as an "auth token verification execution planning gate."** This review gate recommends redirecting through a **decision gate** first (see Section 7 below). A decision gate formalizes the Model A choice as a binding gate-level decision before any execution planning begins — consistent with the pattern established by the source-of-truth decision gate sequence. The planning gate's Section 11 framing (going directly to an execution planning gate) is not incorrect — it reflects a valid sequencing option — but the decision gate layer is the appropriate next step to ensure the Model A direction is gate-confirmed before implementation planning is opened.

**Observation C — Item 6 of Section 10 (error response mapping) correctly defers to the `ErrorModel` alignment gate.** Token verification failures (expired, bad signature, wrong audience) must eventually produce `ErrorModel`-shaped responses. The planning gate correctly notes these cannot be finalized until the full `ErrorModel` alignment gap is resolved. This dependency is correctly tracked.

**Observation D — `jose` is named in Section 10 item 7 as a "leading candidate" for the JWT verification library.** This is informational and does not constitute library selection or implementation authorization. The planning gate correctly notes: "selection criteria: pure TypeScript/ESM, no native dependencies, standards-compliant, actively maintained." These criteria are sound and `jose` satisfies all of them. The final library decision is correctly deferred to the implementation planning gate.

---

## 5. PASS/FAIL Summary

| # | Criterion | Result |
|---|---|---|
| 1 | Planning gate remains documentation-only | PASS |
| 2 | Model A (JWT + JWKS) recommended for defensible reasons | PASS |
| 3 | All three alternative models evaluated with verdicts | PASS |
| 4 | Allowed claims limited to `sub`, `iss`, `aud`, `exp`, `iat`, `email` (non-authoritative only) | PASS |
| 5 | Token-carried membership, roles, `grantedPermissions`, permission inventory, workspace auth decisions explicitly prohibited | PASS |
| 6 | Verified token identity feeds `requestContext.actorId` via `authGuard` extracting `sub` | PASS |
| 7 | `workspaceId` remains route path-parameter derived; not from token claims | PASS |
| 8 | `x-nashir-actor-id` remains transitional/diagnostic only; real enforcement must not trust it | PASS |
| 9 | JWKS cache TTL shorter than rotation interval; rate-limited on-demand refresh for unknown `kid` | PASS |
| 10 | All six required unresolved decisions tracked (provider, JWKS URI, audience, key rotation, test token strategy, error mapping) | PASS |
| 11 | Non-authorization boundary complete; all prohibited categories present | PASS |
| 12 | PR #39 changed only the one permitted documentation file | PASS |

**All 12 criteria: PASS**

---

## 6. Non-Authorization Boundary

This review gate does not authorize, and must NOT be read as approving, any of the following:

- implementation of any auth provider integration or configuration
- implementation of any JWT verification library installation or wiring
- implementation of any JWKS endpoint fetch, cache, or key rotation handling
- implementation of any bearer token parsing, signature verification, or claim extraction
- implementation of any `authGuard` middleware or Fastify hook
- changes to `src/request-context.ts`, `src/app.ts`, `src/permission-guard.ts`, or `src/error-model.ts`
- installation of any new npm packages (`jose`, `jsonwebtoken`, or any auth SDK)
- changes to `package.json` or `pnpm-lock.yaml`
- implementation of any database schema, ORM, migration, or SQL
- implementation of any role-to-permission mapping or permission resolution service
- wiring `evaluatePermissionGuard` into any call site other than the existing `permissionGuardHarnessHandler`
- product routes of any kind
- any extension of the static harness fixture
- generated client changes
- OpenAPI or contract-document changes
- environment-variable or secrets configuration
- CI workflow changes
- deployment, pilot readiness, or production readiness of any kind

---

## 7. GO / NO-GO Decision

**Decision: GO** to the **Backend Slice 0 Auth Token Format / Verification Decision Gate** — because:

- All 12 review criteria pass.
- The planning gate accurately describes the current state of identity resolution, the four candidate models, and the constraints that govern the recommendation.
- Model A is recommended with five independently verifiable reasons, each grounded in the authority contract, the project's deferred-provider constraint, or observable properties of the JWT standard.
- All three alternative models are evaluated and rejected with stated reasons. No model is dismissed without argument.
- The allowed and prohibited claim sets in Section 6 are consistent with Decisions 2–5 of the source-of-truth gate (PR #37).
- The `authGuard` → `sub` → `actorId` mapping in Section 7 is correct and requires no source interface changes.
- The `x-workspace-scope: route` / path-parameter sourcing in Section 8 is consistent with the authority contract and settled prior gate decisions.
- The `x-nashir-actor-id` transitional constraint in Section 9 correctly extends Decision 1 and is independently verified against `src/request-context.ts` and `src/app.ts`.
- Section 10 item 4 explicitly captures both required JWKS operational constraints: TTL shorter than rotation interval, and rate-limited on-demand refresh for unknown `kid`.
- All six required unresolved decisions are tracked with precision sufficient for a future execution planning gate.
- The non-authorization boundary is complete and the most specific in the Slice 0 sequence.
- PR #39 changed exactly one file in `docs/`. Scope was clean.

**NO-GO** for everything listed in Section 6 above.

---

## 8. Recommended Next Gate

**Backend Slice 0 Auth Token Format / Verification Decision Gate** — a documentation-only decision gate that formalizes the Model A (JWT + JWKS) choice as a binding gate-level decision before any execution planning begins.

That decision gate must:

- Formally record Model A (JWT with JWKS verification) as the binding auth token verification strategy for Nashir backend Slice 0
- Confirm that provider selection remains deferred and does not need to be resolved before execution planning
- Confirm that the eight unresolved decisions from planning gate Section 10 are the correct pre-conditions for the execution planning gate
- Confirm that the `jose` library is an acceptable library candidate (or specify an alternative set of selection criteria)
- Define precisely what the execution planning gate may plan — library selection, JWKS caching strategy, error handling, test token strategy, `RequestContext` evolution
- Remain documentation-only — the decision gate must not open an execution gate directly
- Carry forward the non-authorization boundary from this review gate verbatim

The decision gate must NOT be read as opening or authorizing an execution gate for auth token verification. The sequence is: this review gate → decision gate → (if GO) execution planning gate → execution planning review gate → execution gate.

---

## 9. Verification Commands

```bash
cd ~/workspace/nashir-backend

git fetch origin --quiet
git checkout main
git pull origin main

git log --oneline -8

npm run lint
npm run typecheck
npm test

# Confirm PR #39 changed only the planning gate doc
git show --stat 3cc71fbcbbb3898d60e33d7cfdcb37a96800d094

# Confirm RequestContext has only workspaceId and actorId — no token, sub, or role fields
grep -n "interface RequestContext" src/request-context.ts

# Confirm x-nashir-actor-id is still the only actorId source (harness-era state)
grep -n "ACTOR_ID_HEADER\|actorId" src/request-context.ts

# Confirm grantedPermissions is never sourced from request headers
grep -n "grantedPermissions" src/app.ts

# Confirm evaluatePermissionGuard has exactly one runtime call site
grep -n "evaluatePermissionGuard" src/app.ts src/index.ts

# Confirm no product routes
grep -E -n "app\.(post|put|delete|patch)" src/app.ts

# Confirm no JWT/auth libraries installed
grep -E "jose|jsonwebtoken|auth0|clerk|cognito|firebase" package.json || echo "not installed"

# Confirm authority bearer scheme defers provider and format
grep -A 8 "scheme: bearer" ../nashir/docs/nashir_v1_openapi.yaml

# Confirm authority x-workspace-scope: route annotation is present
grep -n "x-workspace-scope: route" ../nashir/docs/nashir_v1_openapi.yaml | head -5
```
