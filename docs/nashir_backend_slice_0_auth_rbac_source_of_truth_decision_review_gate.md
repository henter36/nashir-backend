# Nashir Backend Slice 0 Auth/RBAC Source-of-Truth Decision Review Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only decision review gate |
| Authorization source | `docs/nashir_backend_slice_0_auth_rbac_source_of_truth_decision_gate.md` (PR #37) |
| PR #37 merge commit (decision gate) | `540c6133add74d6ff0d124ae60ccb4f64c5dce76` |
| PR #36 merge commit (alignment review gate) | `32faed84cbbeb57d8998e512ac7ae21b463fb539` |
| PR #35 merge commit (alignment planning gate) | `edd3cc0c9e626d6d127e6835b9e333262d90c06e` |
| Authority repository | `henter36/nashir` |
| Authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Implementation authorization | None — this gate is documentation-only and authorizes no implementation, auth provider integration, database access, role storage, product routes, broad permission enforcement, generated clients, OpenAPI changes, SQL/migrations/ORM, or deployment of any kind |

---

## 1. Scope

PR #37 merged the Backend Slice 0 Auth/RBAC Source-of-Truth Decision Gate. That gate recorded six binding source-of-truth decisions, elevated the `grantedPermissions`-never-caller-supplied invariant to a durable gate-level decision, enumerated the full `ErrorModel` field-name divergence, defined the `x-workspace-scope: route` / path-param vs. header design decision, and specified the scope of the next planning gate.

This review gate independently verifies those six decisions and all supporting claims against the same authority inputs, live source files, and the PR #37 commit record. It does not rely on the decision gate's self-assessment. It produces a 13-criterion PASS/FAIL matrix and a GO / NO-GO decision.

---

## 2. Inputs Used for Independent Verification

| Input | How used |
|---|---|
| `docs/nashir_backend_slice_0_auth_rbac_source_of_truth_decision_gate.md` (PR #37) | The primary artifact under review — read in full |
| `src/request-context.ts` (108 lines, `main` HEAD) | Read directly — verified `RequestContext` field set, header names, absence of token/role/permission fields |
| `src/permission-guard.ts` (108 lines, `main` HEAD) | Read directly — verified `EvaluatePermissionGuardInput`, output variants, workspace-boundary guard, non-leakage |
| `src/app.ts` (197 lines, `main` HEAD) | Read directly — verified single `evaluatePermissionGuard` call site (line 68–76), `STATIC_HARNESS_GRANTED_PERMISSIONS` definition (lines 30–33), opt-in harness flag (line 161), absence of product routes |
| `src/error-model.ts` (47 lines, `main` HEAD) | Read directly — verified field names: `code`, `message`, `statusCode`, `correlationId?`, `details?` |
| `tests/permission-guard.test.ts` | Read directly — verified 10 passing tests; permission strings are opaque (`workspace:read`, `workspace.products.read`); `grantedPermissions` is always a test-supplied constant, never derived from a header |
| `tests/permission-guard-internal-runtime-harness.test.ts` | Read directly — verified 9 passing tests; harness always returns HTTP 200; `grantedPermissions` source is the server-side `STATIC_HARNESS_GRANTED_PERMISSIONS` constant; no test passes a header-sourced permission set |
| `tests/request-context-plumbing.test.ts` | Read directly — confirmed request-context fields (`workspaceId`, `actorId`) are header-sourced with no cryptographic verification |
| `henter36/nashir` `docs/nashir_v1_openapi.yaml` (authority commit `04f54f8`) | Grepped directly — verified `bearerAuth` scheme description; server-side membership language; `x-workspace-scope: route`; `x-membership-check: non-disclosing`; guard chain (`authGuard → workspaceContextGuard → permissionGuard`); `x-permission` annotation values; `ErrorModel` required fields |
| `git show --stat 540c613` | Verified: exactly one file added in `docs/` |

---

## 3. Review Criteria and PASS/FAIL Matrix

### Criterion 1 — Authenticated identity source-of-truth is bearer token with cryptographic verification

**What to verify:** Decision 1 names the bearer token as the authoritative identity source and requires cryptographic verification.

**Independent check:**

Decision gate Section 4, Decision 1:
> "The bearer token is the authoritative source for the caller's verified identity (`actorId`). The backend must not treat the `x-nashir-actor-id` header alone as verified identity in any real enforcement context."

Authority `bearerAuth` scheme description (grepped directly from `nashir_v1_openapi.yaml`):
```
Nashir V1 bearer token placeholder. The provider and token format are
deferred to a later authorized auth implementation planning gate.
Workspace membership is resolved and enforced server-side for the path
workspace; the contract does not require membership context in the token.
```

The authority requires `bearerAuth` on all non-health routes (line 51: `- bearerAuth: []`). The authority scheme type is `http` with `scheme: bearer`. This is a cryptographically-backed scheme by definition — bearer tokens are opaque credentials presented to the server, and cryptographic verification (signature check) is the mechanism by which the server authenticates them. The decision gate correctly records this.

Current `src/request-context.ts` confirms that the **actual present state** uses caller-supplied headers without verification (`resolveRequestContextFromHeaders` performs only presence and non-blank checks — no signature, no format validation). Decision 1 does not misrepresent this; the constraint it records is a **future requirement** for real enforcement paths.

**Finding:** Decision 1 is accurately grounded in the authority contract. The constraint for future gates is precise: token-verified identity must be used as `actorId` in any non-harness enforcement call. The deferral of token provider and format is explicitly acknowledged and aligned with the authority's own deferral language.

**Result: PASS**

---

### Criterion 2 — `x-nashir-actor-id` is explicitly not trusted as verified identity in real enforcement contexts

**What to verify:** The decision gate explicitly states that `x-nashir-actor-id` is not trusted as verified identity outside the diagnostic harness.

**Independent check:**

Decision gate Section 4, Decision 1 constraint:
> "The `x-nashir-actor-id` header must not be promoted to a verified identity source in any non-harness code path."

Decision gate Section 4, Decision 1 basis:
> "A self-asserted `x-nashir-actor-id` header is appropriate only in the current diagnostic harness (which is opt-in, default-off, and returns always-200 diagnostic responses — not real enforcement)."

Decision gate Section 5 (Model A evaluation) confirms that token-only or header-only identity is insufficient.

`src/request-context.ts` confirms: `x-nashir-actor-id` (via `ACTOR_ID_HEADER`) is accepted as-is — any non-blank string is accepted. No signature, no format check, no UUID validation. This is the current harness-era state and is accurately described as "appropriate only in the diagnostic harness."

Decision gate Section 10 prohibits any promotion of this header: "changes to `src/request-context.ts` (including adding role, token, or permission fields)" are explicitly prohibited, which blocks any modification that would promote `x-nashir-actor-id` to a verified identity source without opening a new execution gate.

**Finding:** The decision gate explicitly, accurately, and unambiguously states that `x-nashir-actor-id` is not trusted as verified identity in real enforcement contexts. The constraint carries forward correctly.

**Result: PASS**

---

### Criterion 3 — Workspace membership source-of-truth is server-side DB resolution

**What to verify:** Decision 2 names the server-side database as the authoritative source for workspace membership.

**Independent check:**

Decision gate Section 4, Decision 2:
> "The server-side database is the authoritative source for workspace membership. Membership status (active, invited, suspended) must be resolved by the backend on every request for workspace-scoped routes."

Authority `bearerAuth` scheme description (verified by direct grep):
> "Workspace membership is resolved and enforced server-side for the path workspace; the contract does not require membership context in the token."

Authority workspace membership tag description (line 25 of `nashir_v1_openapi.yaml`):
> "Active membership is required for all workspace-scoped operations. Invited and suspended members are denied access."

`x-membership-check: non-disclosing` appears on every workspace-scoped route in the authority (confirmed by grep — 9+ occurrences). This annotation requires the backend to perform a real-time membership check whose result must not reveal membership status to the caller.

Current codebase has no DB, ORM, or membership lookup — confirmed by the absence of any DB import in `src/app.ts`, `src/request-context.ts`, or `src/permission-guard.ts`. The decision gate accurately records this as a future constraint, not a present implementation.

**Finding:** Decision 2 is accurately grounded in the authority contract. The constraint for future gates (server-side membership check before `evaluatePermissionGuard`, non-disclosing result) is precise and aligned with the authority's `x-membership-check: non-disclosing` annotation.

**Result: PASS**

---

### Criterion 4 — Workspace membership is not embedded in the token

**What to verify:** Decision 2 explicitly states that membership context must not be embedded in or trusted from the bearer token.

**Independent check:**

Decision gate Section 4, Decision 2:
> "Membership context must not be embedded in or trusted from the bearer token."

Authority `bearerAuth` scheme description (verified by direct grep):
> "the contract does not require membership context in the token."

This is a direct authority quote. The decision gate reproduces it accurately in the Decision 2 basis.

Decision gate Section 5, Model A evaluation:
> "Token-embedded permissions cannot be revoked in real time without token invalidation infrastructure."

Decision gate Section 5, Model C confirmation:
> "Decision 2 (membership): DB query resolves active membership for `(actorId, workspaceId)`"

The authority's language ("does not require membership context in the token") implies that embedding membership in the token is unsupported by the contract — the server-side resolution is the required path for `x-membership-check: non-disclosing` to be satisfiable.

**Finding:** Decision 2's prohibition on token-embedded membership is accurately sourced from the authority contract and is correctly explained through the real-time revocation argument.

**Result: PASS**

---

### Criterion 5 — Role source-of-truth is server-side DB membership record

**What to verify:** Decision 3 names the server-side database — specifically the membership record — as the authoritative source for role assignments.

**Independent check:**

Decision gate Section 4, Decision 3:
> "The server-side database is the authoritative source for role assignments. The role that an active member holds within a workspace must be resolved server-side, not asserted by the client or embedded in the token."

Decision gate Section 4, Decision 3 basis:
> "This follows directly from Decision 2. If membership is server-side, role assignment — which is a property of the membership record — must also be server-side. Token-embedded roles would be stale for the same reasons token-embedded membership would be stale."

This derivation is sound. The authority's `x-membership-check: non-disclosing` requirement and the server-side membership mandate together imply server-side role resolution — role is a property of membership; if membership is server-side, role must be too.

Current codebase has no role model, no role field in `RequestContext`, and no role-to-permission mapping. `src/request-context.ts` interface has only `workspaceId` and `actorId`. `src/permission-guard.ts` accepts `grantedPermissions: readonly string[]` with no notion of roles — confirmed by direct read.

**Finding:** Decision 3 is accurately grounded in the authority contract and correctly derived from Decision 2. The derivation that "role is a property of the membership record" is logically sound and aligned with the authority's server-side mandate.

**Result: PASS**

---

### Criterion 6 — Role-to-permission mapping is server-controlled and outputs authority-aligned permission strings

**What to verify:** Decision 4 requires server-controlled role-to-permission mapping and `nashir.<resource>.<action>` permission strings matching authority `x-permission` annotations.

**Independent check:**

Decision gate Section 4, Decision 4:
> "The role-to-permission mapping must live in a server-controlled layer... The output of the mapping must be a set of `nashir.<resource>.<action>` strings — matching the authority contract's `x-permission` annotations."

Authority `x-permission` annotations (confirmed by grep on `nashir_v1_openapi.yaml`):
- `nashir.products.read` (line 82)
- `nashir.products.manage` (line 127)
- `nashir.assets.read` (line 274)
- `nashir.assets.manage` (line 321)
- Additional content-scoped variants confirmed by grep context

The decision gate's Section 4, Decision 4 basis enumerates these permissions: "e.g., `nashir.products.read`, `nashir.products.manage`, `nashir.assets.read`, `nashir.assets.manage`, `nashir.content.read`, `nashir.content.manage`." This matches the authority.

`evaluatePermissionGuard` in `src/permission-guard.ts` is convention-agnostic — it accepts any opaque `requiredPermission: string` and `grantedPermissions: readonly string[]`. The decision gate correctly identifies that the convention (`nashir.<resource>.<action>`) must be adopted by the call site that produces `grantedPermissions`, not by `evaluatePermissionGuard` itself.

The prohibition on client-controlled mapping (Decision 4 basis: "Client-controlled role-to-permission mapping would allow permission escalation") is correct and grounded in the security model.

**Finding:** Decision 4 is accurately grounded in the authority `x-permission` annotations. The requirement for server-controlled mapping producing `nashir.<resource>.<action>` strings is verifiably aligned with the authority contract.

**Result: PASS**

---

### Criterion 7 — `grantedPermissions` may never be caller-supplied from request headers or client input

**What to verify:** The durable `grantedPermissions`-never-caller-supplied invariant is accurately stated and currently satisfied by the codebase.

**Independent check:**

Decision gate Section 5 (elevated invariant):
> "`grantedPermissions` must never be sourced from request headers, query parameters, request body, or any other client-supplied input in any real enforcement context."

Current codebase state — `src/app.ts` line 68–76 (the only `evaluatePermissionGuard` call site):
```typescript
const decision = evaluatePermissionGuard({
  requiredPermission: request.params.requiredPermission,
  grantedPermissions: STATIC_HARNESS_GRANTED_PERMISSIONS,
  requestContext: { ... },
  disclosureMode
});
```

`STATIC_HARNESS_GRANTED_PERMISSIONS = Object.freeze(["harness.read","harness.write"])` (lines 30–33). This is a server-side constant defined at module initialization, not derived from any request field.

Grep confirmed: `grantedPermissions` appears exactly once in `src/app.ts` (line 70). No occurrence of `grantedPermissions` in `src/request-context.ts`. `src/permission-guard.ts` defines the type but does not produce the value.

Test files confirm: `tests/permission-guard.test.ts` and `tests/permission-guard-internal-runtime-harness.test.ts` supply `grantedPermissions` as explicit test constants — never from a simulated request header.

**Finding:** The invariant is accurately stated. It is currently satisfied: the only `grantedPermissions` source is a frozen server-side constant. The test suite confirms no header-derived permission path exists. The durable classification is warranted.

**Result: PASS**

---

### Criterion 8 — Guard pipeline boundary is `authGuard → workspaceContextGuard → permissionGuard`

**What to verify:** The pipeline boundary in Decision 6 matches the authority contract's guard chain.

**Independent check:**

Decision gate Section 4, Decision 6 pipeline table assigns:
- `authGuard` → request identity (bearer token)
- `workspaceContextGuard` → workspace scope + DB membership + role source
- `permissionGuard` → permission resolution + `evaluatePermissionGuard`

Authority `nashir_v1_openapi.yaml` (verified by direct grep on workspace-scoped routes, e.g., lines 92–95):
```yaml
security:
  - authGuard
  - workspaceContextGuard
  - permissionGuard
```
This three-guard ordered chain appears on every workspace-scoped route in the authority. Confirmed for `nashir.products.read` (lines 92–95), `nashir.products.manage` (lines 137–140), `nashir.assets.read` (lines 284–287), `nashir.assets.manage` (lines 331–334), and further occurrences.

The decision gate's `permissionGuard` assignment (covering Decisions 1–5 outputs) maps cleanly onto the existing `evaluatePermissionGuard` function. The `workspaceContextGuard` assignment (membership + role) is correctly identified as the layer that must precede `permissionGuard`.

**Finding:** The three-guard chain is accurately sourced from the authority contract. The layer assignments in Decision 6 are logically coherent with Decisions 1–5 and the authority's security model.

**Result: PASS**

---

### Criterion 9 — `x-workspace-scope: route` semantics handled correctly

**What to verify:** Section 8 correctly addresses the `x-workspace-scope: route` annotation and the constraint that `resourceWorkspaceId` must come from the route's `{workspaceId}` path parameter, not the header-sourced `requestContext.workspaceId`.

**Independent check:**

Decision gate Section 8:
> "For workspace-scoped routes (any route under `/workspaces/{workspaceId}/...`), the `workspaceId` for permission enforcement and membership lookup must be the route's `{workspaceId}` path parameter."
>
> "The `resourceWorkspaceId` parameter of `evaluatePermissionGuard` must be set to the route's `{workspaceId}` path parameter value for any real workspace-scoped enforcement call. The `requestContext.workspaceId` can remain the header-sourced value; `evaluatePermissionGuard` will compare `resourceWorkspaceId !== requestContext.workspaceId` and return `not_found` if they differ."

Authority `nashir_v1_openapi.yaml` — `x-workspace-scope: route` annotation confirmed by direct grep on all workspace-scoped routes (lines 83, 128, 181, 220, 275, 322, 375, 414, 469 and more).

`src/permission-guard.ts` lines 77–81 confirm the workspace-boundary check:
```typescript
if (
  resourceWorkspaceId != null &&
  resourceWorkspaceId !== requestContext.workspaceId
) {
  return notFoundResult(requiredPermission);
}
```

This is precisely the isolation mechanism the decision gate describes. A path-parameter-sourced `resourceWorkspaceId` that differs from the header-sourced `requestContext.workspaceId` would return `not_found` — satisfying workspace isolation without leaking membership status.

Current `src/app.ts`'s `workspaceRouteHarnessHandler` (lines 43–55) does NOT call `evaluatePermissionGuard` — it is a read-only diagnostic that echoes back the route's `workspaceId` param alongside the header-sourced `requestContext`. This correctly demonstrates the param/context distinction without wiring enforcement.

**Finding:** Section 8 is accurately grounded in the authority's `x-workspace-scope: route` annotation and correctly describes the `evaluatePermissionGuard` usage pattern. The constraint for future gates (pass route path parameter as `resourceWorkspaceId`, not header-sourced `requestContext.workspaceId`) is precise and correct.

**Result: PASS**

---

### Criterion 10 — `ErrorModel` field-name mismatch is explicitly deferred; no permission-failure `ErrorModel` responses exist yet

**What to verify:** Section 7 enumerates all `ErrorModel` field divergences accurately and correctly defers them without blocking.

**Independent check:**

**Backend `ErrorModel` (`src/error-model.ts`, verified by direct read):**
```typescript
interface ErrorModel {
  code: string;
  message: string;
  statusCode: number;
  correlationId?: string;
  details?: unknown;
}
```

**Authority `ErrorModel` (`nashir_v1_openapi.yaml`, grepped):**
```yaml
required: [errorCode, message, requestId, retryable, status]
properties:
  errorCode:   { $ref: "#/components/schemas/ErrorCode" }
  message:     string
  details:     object (additionalProperties: true)
  requestId:   string
  retryable:   boolean
  status:      integer (100–599)
```

**Divergence table in decision gate Section 7 — independent verification:**

| Field | Backend | Authority | Decision gate claim | Accurate? |
|---|---|---|---|---|
| Error code field | `code` | `errorCode` | "Renamed" | ✓ |
| Error code values | `SCREAMING_SNAKE_CASE` | `lower.snake_case` | "Format and vocabulary" | ✓ |
| Correlation/Request ID | `correlationId` (optional) | `requestId` (required) | "Renamed; optionality flipped" | ✓ |
| HTTP status field | `statusCode` | `status` | "Renamed" | ✓ |
| Retryable flag | absent | `retryable` (required, boolean) | "Missing field" | ✓ |
| Details type | `details?: unknown` | `details?: object` | "Compatible but weakly typed" | ✓ |

All six divergence rows are accurate. The deferral rationale — "no permission-failure ErrorModel response is produced today (the harness is always-200)" — is verified: `permissionGuardHarnessHandler` always returns `{ ok: true, decision }` at HTTP 200; it never calls `createHttpErrorResponse`. This is confirmed by `src/app.ts` lines 57–79 and the harness test assertions (`expect(body.code).toBeUndefined()` in `permission-guard-internal-runtime-harness.test.ts` line 208).

**Finding:** Section 7 accurately enumerates all six field-level divergences against both `src/error-model.ts` and the authority OpenAPI. The deferral rationale is sound and the "no urgency" claim is verifiably correct.

**Result: PASS**

---

### Criterion 11 — Decision gate does not authorize any prohibited implementation categories

**What to verify:** Section 10 of the decision gate does not authorize implementation, auth provider integration, database access, role storage, SQL/migrations/ORM, product routes, broad permission enforcement, generated clients, OpenAPI changes, environment/secrets config, or deployment.

**Independent check against decision gate Section 10:**

| Prohibited category | Present in Section 10 |
|---|---|
| Auth provider / token issuer / verification | ✓ — "implementation of any auth provider, token issuer, or token verification mechanism" |
| Bearer token parsing / signature / claim extraction | ✓ — "implementation of any bearer token parsing, signature verification, or claim extraction" |
| DB schema / ORM / migration / SQL | ✓ — "implementation of any database schema, ORM, migration, or SQL for workspace membership, role storage, or permission tables" |
| Role-to-permission mapping / permission resolution | ✓ — "implementation of any role-to-permission mapping or permission resolution service" |
| Wiring `evaluatePermissionGuard` beyond harness | ✓ — "wiring `evaluatePermissionGuard` into any call site other than the existing `permissionGuardHarnessHandler`" |
| `src/request-context.ts` changes | ✓ — explicitly listed |
| `src/permission-guard.ts` changes | ✓ — explicitly listed |
| `src/error-model.ts` changes | ✓ — explicitly listed |
| Product routes | ✓ — "product routes of any kind" |
| Static harness fixture extension | ✓ — "any extension of the static harness fixture" |
| Generated clients | ✓ — "generated client changes" |
| OpenAPI / contract-document changes | ✓ — explicitly listed including `ErrorCode`, `ErrorModel`, `requestId`/`retryable`/`status` |
| Environment / secrets configuration | ✓ — "environment-variable or secrets configuration" |
| CI workflow changes | ✓ — "CI workflow changes" |
| Deployment / pilot / production readiness | ✓ — "deployment, pilot readiness, or production readiness" |
| Broad permission enforcement | ✓ — covered by the combination of prohibiting product routes and prohibiting new `evaluatePermissionGuard` call sites; not a standalone bullet but the substance is fully covered |

All categories are present and complete. The explicit listing of individual source files (`src/request-context.ts`, `src/permission-guard.ts`, `src/error-model.ts`) is notably stronger than the prior gates' non-authorization sections and leaves no gap.

**Finding:** The non-authorization boundary is complete. No implementation category is missing. The gate does not authorize anything in Section 10.

**Result: PASS**

---

### Criterion 12 — PR #37 changed only the expected documentation file

**What to verify:** The PR #37 merge commit touched only `docs/nashir_backend_slice_0_auth_rbac_source_of_truth_decision_gate.md`.

**Independent check:**

`git show --stat 540c6133add74d6ff0d124ae60ccb4f64c5dce76`:
```
...ce_0_auth_rbac_source_of_truth_decision_gate.md | 359 +++++++++++++++++++++
 1 file changed, 359 insertions(+)
```

One file, `docs/` directory, documentation gate only. No changes to `src/`, `tests/`, `package.json`, `pnpm-lock.yaml`, workflow files, OpenAPI files, generated files, SQL/migration files, or environment configuration.

**Finding:** PR #37 is clean. Scope is exactly what the gate permits.

**Result: PASS**

---

### Criterion 13 — Ambiguity audit: no language authorizes enforcement implementation

**What to verify:** No section of the decision gate contains language that could plausibly be misread as authorizing authentication implementation, DB implementation, role storage, product routes, or broad permission enforcement.

**Independent examination of potentially ambiguous passages:**

**Passage A** — Section 4, Decision 6, pipeline table column "Implementation gate ownership":

> `authGuard` — to be addressed in the auth token planning gate
> `workspaceContextGuard` — membership lookup against DB
> ...

This column names future gate responsibilities. The word "Implementation gate ownership" is the column header, not a statement that implementation is authorized now. Section 10 explicitly prohibits all of these in the current gate. The usage is consistent with a roadmap column, not an implementation authorization.

*Assessment: Not ambiguous when read in context of Section 10. A reader encountering only Section 4's table in isolation might infer forward intent, but the full document makes the non-authorization boundary unambiguous. Not a blocking concern.*

**Passage B** — Section 6:
> "Any PR, execution gate, or implementation that introduces a code path where `grantedPermissions` is derived from a request header... must be rejected."

This is a prohibition statement, not an authorization. Clear.

**Passage C** — Section 9:
> "The next planning gate after the review gate is authorized to plan exactly one of the following sub-problems..."

This authorizes **planning** only. The word "plan" is used, and Section 9's preamble states explicitly: "The planning gate that follows the review gate must select exactly one of these sub-problems and remain documentation-only." No execution gate is opened here.

**Passage D** — Section 9, sub-problem 1:
> "This is the `authGuard` layer and is the prerequisite for Decisions 2–4. This is the highest-priority sub-problem and should be planned first..."

This is a priority guidance for a future planning gate, not an authorization to implement. The phrase "should be planned" limits scope to documentation.

**Passage E** — Section 11:
> "**Decision: GO** to the Backend Slice 0 Auth/RBAC Source-of-Truth Decision Review Gate"

This GO refers to this review gate (the current document). The target of the GO is documentation-only review, which has now concluded. The GO does not authorize implementation.

**Summary of ambiguity findings:**

No passage in the decision gate authorizes implementation, authentication, DB access, role storage, product routes, or broad permission enforcement. The one near-edge case (Section 4's "Implementation gate ownership" column) is interpretable as future-roadmap labeling and is fully negated by Section 10. The document is clean.

**Result: PASS (no blocking ambiguity)**

---

## 4. PASS/FAIL Summary

| # | Criterion | Result |
|---|---|---|
| 1 | Authenticated identity source-of-truth is bearer token with cryptographic verification | PASS |
| 2 | `x-nashir-actor-id` is explicitly not trusted as verified identity in real enforcement contexts | PASS |
| 3 | Workspace membership source-of-truth is server-side DB resolution | PASS |
| 4 | Workspace membership is not embedded in the token | PASS |
| 5 | Role source-of-truth is server-side DB membership record | PASS |
| 6 | Role-to-permission mapping is server-controlled and outputs authority-aligned `nashir.<resource>.<action>` strings | PASS |
| 7 | `grantedPermissions` may never be caller-supplied; invariant is accurately stated and currently satisfied | PASS |
| 8 | Guard pipeline boundary is `authGuard → workspaceContextGuard → permissionGuard`, matching authority contract | PASS |
| 9 | `x-workspace-scope: route` semantics: `resourceWorkspaceId` must come from route `{workspaceId}`, not header-sourced `requestContext.workspaceId` | PASS |
| 10 | `ErrorModel` field-name mismatch enumerated accurately; deferral is sound; no permission-failure ErrorModel responses exist | PASS |
| 11 | Non-authorization boundary is complete — no prohibited implementation category is authorized | PASS |
| 12 | PR #37 changed only `docs/nashir_backend_slice_0_auth_rbac_source_of_truth_decision_gate.md` | PASS |
| 13 | No language could plausibly be misread as authorizing enforcement implementation | PASS |

**All 13 criteria: PASS**

---

## 5. Independent Observations

The following observations are recorded for the next gate. They do not block GO.

**Observation A — Decision 6's pipeline boundary table is the correct locus for implementation gate assignments.** The table assigns each pipeline layer to a named guard and a future implementation gate. This structure is clear and useful. The "Implementation gate ownership" column is read-only roadmap context — not an authorization. Future gates should use this table as a reference for which guard owns which sub-problem, not as evidence of implementation authorization.

**Observation B — The `grantedPermissions`-never-caller-supplied invariant is now durable at the gate level.** This is the most important single constraint in the document. The decision gate has elevated it from a planning-gate design constraint to a gate-level binding decision. Future execution gates must demonstrate their `grantedPermissions` producer is server-controlled before they can pass review.

**Observation C — Sub-problem ordering in Section 9 is correct.** Auth token format/verification must precede workspace membership (which needs a verified `actorId`) and role resolution (which depends on membership). The dependency order is sound.

**Observation D — The `ErrorModel` divergence enumeration in Section 7 is complete and accurate.** Six field-level divergences are correctly identified. The deferral rationale is sound: no permission-failure `ErrorModel` responses exist today, so aligning these fields cannot be validated end-to-end until a real enforcement call site exists. A dedicated contract alignment gate must address all six divergences together rather than piecemeal.

---

## 6. Non-Authorization Boundary

This review gate does not authorize, and must NOT be read as approving, any of the following:

- implementation of any auth provider, token issuer, or token verification mechanism
- implementation of any bearer token parsing, signature verification, or claim extraction
- implementation of any database schema, ORM, migration, or SQL for workspace membership, role storage, or permission tables
- implementation of any role-to-permission mapping or permission resolution service
- wiring `evaluatePermissionGuard` into any call site other than the existing `permissionGuardHarnessHandler`
- changes to `src/request-context.ts` (including adding role, token, or permission fields)
- changes to `src/permission-guard.ts` (including changing the input/output types)
- changes to `src/error-model.ts` (including renaming fields toward authority alignment)
- product routes of any kind
- any extension of the static harness fixture
- generated client changes
- OpenAPI or contract-document changes (including `ErrorCode` mismatch resolution, `ErrorModel` field renaming, or `requestId`/`retryable`/`status` addition)
- environment-variable or secrets configuration
- CI workflow changes
- deployment, pilot readiness, or production readiness of any kind

---

## 7. GO / NO-GO Decision

**Decision: GO** to the **Backend Slice 0 Auth Token Format / Verification Planning Gate** — because:

- All 13 review criteria pass.
- All six binding source-of-truth decisions are grounded in the authority contract and the prior gate sequence. Each is independently verified against live source files and the authority OpenAPI.
- Model C (hybrid: token identity + DB membership/role/permission resolution) is confirmed as the correct source-of-truth model with per-decision traceability to the authority contract.
- The `grantedPermissions`-never-caller-supplied invariant is accurately stated and is currently satisfied — the only `grantedPermissions` source is a frozen server-side constant at `src/app.ts` line 70.
- The `ErrorModel` field-name divergence enumeration (Section 7) is accurate against both `src/error-model.ts` and the authority OpenAPI. Deferral is correctly justified by the absence of permission-failure responses.
- The `x-workspace-scope: route` design decision (Section 8) is consistent with the authority contract and correctly describes the `evaluatePermissionGuard` `resourceWorkspaceId` usage pattern.
- The non-authorization boundary (Section 10 of the decision gate) is complete and covers all prohibited categories.
- PR #37 changed exactly one file in `docs/`. Scope was clean.
- No ambiguity was found that could be misread as authorizing implementation.

**NO-GO** for everything listed in Section 6 above.

---

## 8. Recommended Next Gate

**Backend Slice 0 Auth Token Format / Verification Planning Gate** — a documentation-only planning gate that selects token verification requirements before any auth implementation begins.

That gate must:

- Address sub-problem 1 from the decision gate's Section 9 only: auth token format and verification
- Decide: What is the bearer token format? (JWT? opaque reference token?) What is the provider? How is the signature verified? What claims does the token carry (minimum: a verified `actorId`)?
- Confirm that all verification requirements are documented before any execution gate for auth implementation is opened
- Remain documentation-only — it must not open an execution gate
- Carry forward all six binding source-of-truth decisions from the decision gate as settled constraints
- Carry forward the `grantedPermissions`-never-caller-supplied invariant as a durable constraint
- Carry forward this gate's Section 6 non-authorization boundary verbatim
- Be reviewed by its own dedicated review gate before any auth implementation proceeds

The gate must not address sub-problems 2–5 (workspace membership model, role and permission model, `ErrorCode` alignment, permission-string convention adoption) — those remain deferred until the auth token planning gate is reviewed and complete.

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

# Confirm PR #37 changed only the decision gate doc
git show --stat 540c6133add74d6ff0d124ae60ccb4f64c5dce76

# Confirm RequestContext has only workspaceId and actorId — no token, role, or permission fields
grep -n "interface RequestContext" src/request-context.ts

# Confirm grantedPermissions is never sourced from request headers
grep -n "grantedPermissions" src/app.ts

# Confirm evaluatePermissionGuard has exactly one runtime call site
grep -n "evaluatePermissionGuard" src/app.ts src/index.ts

# Confirm no product routes
grep -E -n "app\.(post|put|delete|patch)" src/app.ts

# Confirm backend ErrorModel field names (code, correlationId, statusCode)
grep -n "code\|correlationId\|statusCode\|retryable\|requestId" src/error-model.ts

# Confirm authority ErrorModel requires errorCode, requestId, retryable, status
grep -A 20 "ErrorModel:" ../nashir/docs/nashir_v1_openapi.yaml | grep "required\|errorCode\|requestId\|retryable\|status"

# Confirm authority bearerAuth defers provider and token format, requires server-side membership
grep -A 8 "scheme: bearer" ../nashir/docs/nashir_v1_openapi.yaml

# Confirm x-workspace-scope: route annotation on workspace-scoped routes
grep -n "x-workspace-scope: route" ../nashir/docs/nashir_v1_openapi.yaml | head -5

# Confirm x-membership-check: non-disclosing on workspace-scoped routes
grep -n "x-membership-check: non-disclosing" ../nashir/docs/nashir_v1_openapi.yaml | head -5
```
