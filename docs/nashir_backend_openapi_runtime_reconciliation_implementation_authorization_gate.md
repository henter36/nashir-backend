# Nashir Backend OpenAPI Runtime Reconciliation Implementation Authorization Gate

## Decision Summary

Decision: GO to limited implementation PR #1 only: ErrorModel and HealthResponse reconciliation.

Decision: NO-GO to product version/nullability/readiness changes until their decision is explicitly accepted.

Decision: NO-GO to new routes, migrations, generated types, or OpenAPI edits unless specifically authorized by a later gate.

This gate is documentation-only. It converts the readiness review findings into a narrow authorization boundary for follow-up implementation. It does not change runtime code, OpenAPI, generated types, tests, migrations, routes, auth/RBAC/workspace behavior, CI, or dependencies.

## Current Authority SHA

Authority command verified for this gate:

```bash
git -C "$NASHIR_AUTHORITY_REPO" rev-parse HEAD
```

Verified authority SHA:

```text
7962a35cec6f8372501b3a7b92062288e9b1d958
```

Authority OpenAPI reference:

```text
$NASHIR_AUTHORITY_REPO/docs/nashir_v1_openapi.yaml
```

## Scope Boundary

This authorization is limited to the reconciliation surface identified by `docs/nashir_backend_openapi_runtime_reconciliation_readiness_review_gate.md`.

Current public contract runtime route coverage remains:

- `GET /health`
- `GET /workspaces/:workspaceId/products`
- `POST /workspaces/:workspaceId/products`
- `GET /workspaces/:workspaceId/products/:productId`
- `PUT /workspaces/:workspaceId/products/:productId`

Internal harness routes remain excluded from the public contract count and are not authorized for productization by this gate.

## Explicit Implementation Allowlist

The next implementation PR may modify only the files required to reconcile ErrorModel and HealthResponse behavior and tests.

Allowed implementation intent for PR #1:

- Align public runtime error response bodies with the authority `ErrorModel` shape.
- Preserve HTTP status codes while changing only response body shape and error-code mapping where required.
- Align `GET /health` success response with authority `HealthResponse`.
- Update existing tests that assert current error and health shapes.
- Add narrowly scoped tests only if needed to prove the reconciled ErrorModel and HealthResponse behavior.
- Update docs only when directly explaining the PR #1 reconciliation result.

Allowed file families for PR #1:

- `src/error-model.ts`
- `src/app.ts`
- `src/auth-guard.ts`
- `src/workspace-context-guard.ts`
- `src/permission-guard.ts`
- `src/products/product-handlers.ts`
- Existing tests that assert error or health response bodies.
- Narrow new tests only for ErrorModel or HealthResponse reconciliation.
- Documentation directly tied to PR #1 acceptance.

Authorization note: this allowlist is for the later implementation PR only. This current gate remains documentation-only.

## Explicit Blocklist

This gate does not authorize:

- Runtime implementation in this PR.
- OpenAPI edits.
- Generated type creation or regeneration.
- `src/generated`, `generated`, or `openapi-generated`.
- SQL migrations.
- New public routes.
- New internal harness routes.
- Product route expansion.
- Product persistence changes.
- Product `version`, nullability, or `readiness` behavior changes in PR #1.
- Asset, campaign, creator studio, readiness, workspace management, publishing, analytics, or audit route implementation.
- Auth provider selection changes.
- RBAC policy changes.
- Workspace membership or workspace resolution behavior changes.
- CI workflow changes.
- Package/dependency changes.
- A new Slice.
- Remote push.

## Reconciliation Decisions Required Before Code

Required decisions already made by this gate:

1. PR #1 uses authority as the target for `ErrorModel`.
2. PR #1 uses authority as the target for `HealthResponse`.
3. PR #1 must not change product response/request contracts.
4. PR #1 must not add generated types.
5. PR #1 must not add routes or migrations.

Decisions still required before later code:

1. Whether `Product.version` should be public string or number.
2. Whether product write fields may be nullable in the public contract.
3. Whether runtime product responses should include `readiness`.
4. Whether product contract reconciliation should change runtime or require an OpenAPI edit proposal.
5. Whether OpenAPI conformance checking should be planned first or implemented immediately in PR #3.
6. Whether generated types remain blocked until conformance checks pass.

## Gap 1: ErrorModel Runtime Does Not Match Authority

### Current Reality

Runtime error responses are produced through `src/error-model.ts` with this shape:

```text
{ code, message, statusCode, correlationId?, details? }
```

Runtime codes are uppercase internal strings such as `BAD_REQUEST`, `VALIDATION_FAILED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, and `INTERNAL_SERVER_ERROR`.

### Authority Expectation

Authority `ErrorModel` requires:

```text
{ errorCode, message, requestId, retryable, status, details? }
```

Authority `ErrorCode` values are dotted public codes such as `validation.failed`, `permission.denied`, `resource.not_found`, `conflict.version_mismatch`, and `idempotency.conflict`.

### Recommended Resolution

Fix in runtime and tests in PR #1.

Recommended PR #1 approach:

- Replace or adapt the runtime serializer so public error bodies use `errorCode`, `message`, `requestId`, `retryable`, `status`, and optional `details`.
- Map existing internal error inputs to authority-compatible public error codes.
- Preserve existing HTTP status behavior.
- Use the current correlation id as authority `requestId`.
- Define deterministic `retryable` values for current runtime errors.
- Update existing tests that assert error body shape across auth, workspace, permission, product, not-found, and error-handler paths.

### Where the Fix Belongs

| Area | Decision |
|---|---|
| Runtime | Yes, PR #1. |
| OpenAPI | No. |
| Generated types | No. |
| Tests | Yes, PR #1 may update/add narrow ErrorModel tests. |

### Risk If Ignored

Clients and future generated types will encode a public error contract that does not match runtime behavior. Every future route would inherit the drift.

### Acceptance Criteria

- All public error responses use authority field names.
- `status` in the response body matches the HTTP status code.
- `requestId` is present and sourced from the current request/correlation id path.
- `retryable` is present and deterministic.
- Current HTTP status code semantics are preserved.
- Auth, workspace, permission, product, 404, and 500 tests pass with the reconciled shape.
- No product contract behavior changes are included.

## Gap 2: HealthResponse Runtime Does Not Match Authority

### Current Reality

`GET /health` currently returns:

```text
{ status, service, runtime, uptimeSeconds }
```

### Authority Expectation

Authority `HealthResponse` requires:

```text
{ data: { service, status, version } }
```

Allowed `status` values are `ok` and `degraded`.

### Recommended Resolution

Fix in runtime and tests in PR #1.

Recommended PR #1 approach:

- Change `GET /health` success response to the authority `{ data }` envelope.
- Use a stable service value appropriate for the backend runtime.
- Include a stable version value.
- Remove public `runtime` and `uptimeSeconds` from the health response unless a later OpenAPI edit authorizes them.

### Where the Fix Belongs

| Area | Decision |
|---|---|
| Runtime | Yes, PR #1. |
| OpenAPI | No. |
| Generated types | No. |
| Tests | Yes, PR #1 may update health tests. |

### Risk If Ignored

The simplest public endpoint would remain visibly out of contract, weakening confidence in any later OpenAPI/runtime conformance effort.

### Acceptance Criteria

- `GET /health` returns a body matching authority `HealthResponse`.
- Health remains ungated.
- Health still returns HTTP 200 in the existing infrastructure health tests.
- No runtime route additions or auth/workspace/RBAC behavior changes are included.

## Gap 3: Product.version Runtime Is Number While OpenAPI Uses String

### Current Reality

Runtime product type uses:

```text
version: number
```

Product update uses numeric optimistic concurrency values.

### Authority Expectation

Authority `Product.version` is:

```text
type: string
```

### Recommended Resolution

Do not fix in PR #1.

Recommended later approach:

- Make a human decision whether public `Product.version` should be string or number.
- If string is accepted, change runtime response serialization and tests without changing internal database/version arithmetic.
- If number is accepted, create an OpenAPI edit proposal in the authority repo rather than changing runtime.

### Where the Fix Belongs

| Area | Decision |
|---|---|
| Runtime | Later only if string is accepted. |
| OpenAPI | Later only if number is accepted. |
| Generated types | No until decision and conformance are accepted. |
| Tests | Later with the chosen direction. |

### Risk If Ignored

Clients may treat version as the wrong type, breaking optimistic concurrency flows and future generated clients.

### Acceptance Criteria

- A human decision records string vs number.
- The selected source of truth is reflected in runtime or OpenAPI, not both inconsistently.
- Product update concurrency tests prove the selected public representation does not break `If-Match` or `X-Resource-Version`.

## Gap 4: Product Nullability and Readiness Need Decisions

### Current Reality

Runtime create/update accepts `null` for several optional product fields, including:

- `category`
- `sku`
- `imageUrl`
- `videoUrl`
- `description`

Runtime product responses do not include `readiness`.

### Authority Expectation

Authority product response allows nullable product fields and an optional `readiness`.

Authority `CreateProductRequest` and `UpdateProductRequest` list those optional fields as strings, not nullable. Authority `Product` includes optional `readiness`.

### Recommended Resolution

Do not fix in PR #1.

Recommended later approach:

- Decide whether write requests may clear optional fields using `null`.
- Decide whether product responses must include `readiness`, omit it until computed, or require an OpenAPI edit.
- Keep product route behavior unchanged until those decisions are accepted.

### Where the Fix Belongs

| Area | Decision |
|---|---|
| Runtime | Later only if authority-compatible behavior is chosen. |
| OpenAPI | Later only if runtime nullability or readiness omission is accepted as the contract. |
| Generated types | No until decision and conformance are accepted. |
| Tests | Later with the chosen direction. |

### Risk If Ignored

Product clients may send or expect values that one side rejects or omits. Readiness may become an accidental runtime promise without implementation.

### Acceptance Criteria

- Human decision records nullable write-field policy.
- Human decision records `readiness` response policy.
- Product route tests cover the accepted behavior.
- No generated types are introduced before the accepted contract is stable.

## Gap 5: No Automated Fastify/OpenAPI Conformance Checker

### Current Reality

Runtime/OpenAPI alignment is reviewed manually. Current validators confirm authority pins, required authority docs, absence of copied authority files, absence of generated clients, and allowed CI workflows, but they do not compare Fastify routes or response shapes against OpenAPI operations.

### Authority Expectation

Authority OpenAPI is the contract reference for public routes and schemas once an implementation gate authorizes reconciliation.

### Recommended Resolution

Do not implement in PR #1.

Recommended PR #3 direction:

- Start with a planning PR if ErrorModel/HealthResponse or product decisions are still unstable.
- Implement a checker only after the initial response-shape reconciliation is accepted.
- Keep generated types blocked until conformance strategy is accepted.

### Where the Fix Belongs

| Area | Decision |
|---|---|
| Runtime | No. |
| OpenAPI | No. |
| Generated types | No. |
| Tests/tooling | PR #3 planning or implementation, depending readiness. |

### Risk If Ignored

Manual review will continue to miss operation-level drift, especially when new routes are added later.

### Acceptance Criteria

- PR #3 explicitly chooses planning-only or implementation.
- If implemented, the checker inventories public Fastify routes and compares them with expected OpenAPI operations.
- Internal harness routes are excluded from public-contract route counts.
- Checker does not require generated clients unless separately authorized.

## Gap 6: Runtime Covers Only Health and Product Public Contract Operations

### Current Reality

Runtime public contract routes cover `/health` and four product operations. Authority OpenAPI includes assets, campaign content, readiness, creator studio, workspace, members, store profile, data sources, channel connections, integration credentials, campaigns, content drafts, publishing, analytics, and audit routes.

### Authority Expectation

The authority OpenAPI documents the broader V1 surface, but this gate does not authorize implementing that broader surface.

### Recommended Resolution

Do not add routes in PR #1.

Recommended later approach:

- Keep route coverage expansion blocked.
- Require a separate route-family authorization gate before any new public operation is implemented.
- Do not treat OpenAPI presence as runtime implementation authorization.

### Where the Fix Belongs

| Area | Decision |
|---|---|
| Runtime | No route additions authorized. |
| OpenAPI | No. |
| Generated types | No. |
| Tests | No new route tests until route implementation is separately authorized. |

### Risk If Ignored

The backend could expand into large unreviewed surfaces before foundational response and product contract mismatches are resolved.

### Acceptance Criteria

- PR #1 changes no route inventory.
- Future route-family work has its own explicit authorization gate.
- Internal harness routes remain excluded from public contract implementation counts.

## Small Implementation PR Plan After This Gate

### PR #1: ErrorModel/HealthResponse Reconciliation

Allowed after this gate.

Scope:

- Runtime ErrorModel serializer and mapped public error codes.
- Runtime `GET /health` response envelope.
- Existing/narrow tests for error and health response bodies.
- Documentation needed to record acceptance.

Not allowed:

- Product `version`, nullability, or `readiness` changes.
- OpenAPI edits.
- Generated types.
- New routes.
- Migrations.
- Auth/RBAC/workspace behavior changes.

### PR #2: Product.version/Nullability Reconciliation

Blocked until human decisions are accepted.

Scope only after authorization:

- Product public `version` representation.
- Product write nullability.
- Product `readiness` response policy.
- Product tests for accepted contract behavior.

### PR #3: OpenAPI Conformance Checker Planning or Implementation

Blocked until PR #1 is accepted.

Direction:

- Planning-only if product decisions remain unresolved.
- Implementation if response-shape reconciliation is stable and the checker can remain generated-type-free.

## Verification Commands Required for Each PR

Minimum verification for PR #1:

```bash
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm test
NASHIR_AUTHORITY_REPO="$NASHIR_AUTHORITY_REPO" pnpm run validate:contracts
NASHIR_AUTHORITY_REPO="$NASHIR_AUTHORITY_REPO" pnpm run validate:contract-authority
```

Additional focused PR #1 verification:

```bash
pnpm exec vitest run tests/health.test.ts tests/error-model.test.ts tests/request-context-plumbing.test.ts tests/auth-guard.test.ts tests/workspace-context-guard.test.ts tests/permission-guard.test.ts tests/products/product-route-handler.test.ts
```

Minimum verification for PR #2:

```bash
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm test
NASHIR_AUTHORITY_REPO="$NASHIR_AUTHORITY_REPO" pnpm run validate:contracts
NASHIR_AUTHORITY_REPO="$NASHIR_AUTHORITY_REPO" pnpm run validate:contract-authority
```

Additional focused PR #2 verification:

```bash
pnpm exec vitest run tests/products/product-route-handler.test.ts tests/products/product-repository.test.ts --pool forks --maxWorkers=1
```

Minimum verification for PR #3:

```bash
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm test
NASHIR_AUTHORITY_REPO="$NASHIR_AUTHORITY_REPO" pnpm run validate:contracts
NASHIR_AUTHORITY_REPO="$NASHIR_AUTHORITY_REPO" pnpm run validate:contract-authority
```

If PR #3 implements a checker, it must also run the checker locally and in CI only if a later gate authorizes CI changes.

## Human Decisions Required

Before PR #1:

- Confirm authority `ErrorModel` is the target runtime public shape.
- Confirm authority `HealthResponse` is the target runtime public shape.
- Confirm PR #1 may update existing tests and add only narrow response-shape tests.

Before PR #2:

- Decide public `Product.version` type: string or number.
- Decide nullable product write-field policy.
- Decide product `readiness` response policy.
- Decide whether product reconciliation is runtime-only or requires an OpenAPI edit proposal.

Before PR #3:

- Decide planning-only vs implementation.
- Decide whether checker output is advisory or blocking.
- Decide whether CI changes are authorized.
- Decide whether generated types remain blocked until checker adoption.

## Final Recommendation

GO to limited implementation PR #1 only: ErrorModel and HealthResponse reconciliation.

NO-GO to product version/nullability/readiness changes until their decision is explicitly accepted.

NO-GO to new routes, migrations, generated types, or OpenAPI edits unless specifically authorized by a later gate.
