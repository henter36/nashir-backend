# Nashir Backend Slice 0 — Product Route Handler Request Context Permissions Gate

## 1. Gate Classification

Gate type: Prerequisite decision gate.

This gate resolves the single blocker (Condition A) identified in `docs/nashir_backend_slice_0_product_route_handler_implementation_authorization_gate.md`.

Blocker: `RequestContext` has no `grantedPermissions` field. `evaluatePermissionGuard` takes `grantedPermissions` as an explicit argument. Product route handlers cannot call `evaluatePermissionGuard({ grantedPermissions: requestContext.grantedPermissions, ... })` until the field exists.

This gate does not authorize product route handler code.

This gate does not write implementation code.

## 2. Files Reviewed

| File | Key observation |
|---|---|
| `src/request-context.ts` | `RequestContext` has `workspaceId` and `actorId` only. No `grantedPermissions`. `resolveRequestContextFromHeaders` parses `x-nashir-workspace-id` and `x-nashir-actor-id` only. |
| `src/permission-guard.ts` | `evaluatePermissionGuard` takes `grantedPermissions: readonly string[]` as an explicit argument. It does not read from `RequestContext`. |
| `src/auth-guard.ts` | Sets `request.verifiedIdentityContext = { actorId: payload.sub }`. Does not set `grantedPermissions`. JWT payload is not further read for permissions. |
| `src/app.ts` | `workspaceContextGuardHook` created only when BOTH `authGuardHook` AND `workspaceMembershipResolver` are present. Harness path calls `resolveRequestContextFromHeaders` and sets `request.requestContext = result.context`. `workspaceContextGuardHook` in `workspace-context-guard.ts` overwrites `requestContext` with `{ actorId, workspaceId }` only. |
| `src/workspace-context-guard.ts` | Sets `typedRequest.requestContext = { actorId, workspaceId }`. Does not include `grantedPermissions`. |
| `tests/request-context.test.ts` | Asserts `result.context` equals `{ workspaceId, actorId }` — will break if `grantedPermissions` is added as a required field and not included in expected objects. |
| `tests/request-context-plumbing.test.ts` | Workspace route harness handler in `app.ts` returns `requestContext: { workspaceId, actorId }` — these assertions will NOT break because the handler only returns named fields, not the full context object. |

## 3. Current State Gap

`RequestContext` (`src/request-context.ts`):

```typescript
export interface RequestContext {
  workspaceId: string;
  actorId: string;
}
```

`evaluatePermissionGuard` call site (planned in product handlers):

```typescript
evaluatePermissionGuard({
  requiredPermission: "nashir.products.read",
  grantedPermissions: requestContext.grantedPermissions,  // DOES NOT EXIST
  requestContext,
  disclosureMode: "non_disclosing"
})
```

This is a compile-time error. The blocker is real.

## 4. Design Decision

### 4.1 Required vs Optional

`grantedPermissions` must be optional (`grantedPermissions?: readonly string[]`).

Reason: `src/workspace-context-guard.ts` sets `requestContext` without `grantedPermissions`:

```typescript
typedRequest.requestContext = {
  actorId: identityResult.identity.actorId,
  workspaceId: workspaceIdResult.workspaceId
};
```

`src/workspace-context-guard.ts` is on the blocklist for this gate and for the product route implementation gate. Making `grantedPermissions` required would cause a TypeScript compile error in that file without touching it. Therefore, `grantedPermissions` is declared optional.

Product handlers MUST use `requestContext.grantedPermissions ?? []` when passing to `evaluatePermissionGuard`. This is the authoritative calling pattern. No product handler may assume `grantedPermissions` is non-null.

### 4.2 Type Change

Add to `RequestContext` and `FullyResolvedRequestContext`:

```typescript
grantedPermissions?: readonly string[];
```

Both interfaces independently need this field. `FullyResolvedRequestContext extends VerifiedIdentityContext` — `VerifiedIdentityContext` does NOT get this field since it only carries `actorId` and `grantedPermissions` is a resolved-context concern, not an identity concern.

### 4.3 Header Name

Header: `x-nashir-granted-permissions`

Exported constant: `GRANTED_PERMISSIONS_HEADER = "x-nashir-granted-permissions"`

Format: comma-separated permission strings. This is consistent with the pattern of existing headers in `request-context.ts` and requires no JSON parsing.

Example: `x-nashir-granted-permissions: nashir.products.read,nashir.products.manage`

### 4.4 Parsing Algorithm

The header is parsed only in the harness auth path (`resolveRequestContextFromHeaders`). It is NOT parsed in `authGuardHook` — that file is blocked and Auth0→permissions mapping is deferred to a future gate.

Parsing:

1. Read header value using the same `inspectHeader` helper used for `workspaceId` and `actorId` (case-insensitive, first array element if multi-valued).
2. If header absent or blank: `grantedPermissions = []`.
3. If header present: split on `,`, trim each entry, filter out empty strings, deduplicate using `Set`.
4. No character-set validation beyond trim and empty filtering. Permission strings are used only in exact-string `includes` comparison inside `evaluatePermissionGuard` — no injection surface.

No failure path: missing or malformed permissions header does not cause a 401. The field defaults to `[]`, which means all permission checks will fail (return 403 or 404 depending on disclosure mode). This is the correct behavior — missing permissions should be denied, not rejected.

### 4.5 Auth Semantics

No auth semantics change.

`resolveRequestContextFromHeaders` is a harness-only function (used only when `authConfig` is not provided). Adding an optional permissions header to it does not affect Auth0 token verification, JWKS key retrieval, JWT claim validation, or correlation ID assignment.

`authGuardHook` is not modified.

`evaluatePermissionGuard` is not modified.

`workspaceContextGuardHook` is not modified.

The `/health` route bypass in `app.ts` (checked via `routeOptions.url === HEALTH_ROUTE`) is not affected.

### 4.6 Auth0 Path Behavior (Slice 0 Production Gap)

When `authConfig` is provided (Auth0 mode):

1. `authGuardHook` runs → sets `verifiedIdentityContext = { actorId }`. No `grantedPermissions`.
2. `workspaceContextGuardHook` runs → sets `requestContext = { actorId, workspaceId }`. No `grantedPermissions`.
3. `requestContext.grantedPermissions` is `undefined`.
4. Product handlers evaluate: `requestContext.grantedPermissions ?? []` → `[]`.
5. `evaluatePermissionGuard` with empty `grantedPermissions` → permission denied → 403 or 404.

This is a documented Slice 0 production gap. Product routes in Auth0 mode will fail all permission checks until the Auth0→`grantedPermissions` mapping gate is opened. This does not block Slice 0 handler implementation and tests, which use harness auth.

### 4.7 Harness Path Behavior (Used in Product Route Handler Tests)

When `authConfig` is NOT provided (harness auth mode):

1. `resolveRequestContextFromHeaders` parses `x-nashir-granted-permissions` header → `grantedPermissions`.
2. Sets `request.requestContext = { workspaceId, actorId, grantedPermissions }`.
3. Because `authGuardHook` is null, `workspaceContextGuardHook` is also null (it requires `authGuardHook` to exist, per `app.ts`: `if (authGuardHook && workspaceMembershipResolver)`).
4. `requestContext.grantedPermissions` survives to the handler unchanged.
5. Product handlers evaluate `requestContext.grantedPermissions ?? []` → the array parsed from the header.

Note: Because `workspaceContextGuardHook` is null in harness auth mode, workspace membership enforcement requires a different approach in product route handler tests. That design is the responsibility of the product route implementation gate — not this prerequisite gate.

## 5. Impact on Existing Tests

### 5.1 `tests/request-context.test.ts` — BREAKS, update required

All assertions using `toEqual` on `result.context` or `requireRequestContext(result)` will fail after the change because the actual `context` object will include `grantedPermissions: []` but the expected objects do not.

Affected assertions:
- `expect(result).toEqual({ ok: true, context: { workspaceId, actorId } })` — fails: context now has `grantedPermissions: []`
- `expect(requireRequestContext(result)).toEqual({ workspaceId, actorId })` — fails: same reason

These tests must be updated as part of the implementation work. Update: add `grantedPermissions: []` to every expected `context` object where `grantedPermissions` header is not set.

### 5.2 `tests/request-context-plumbing.test.ts` — SAFE, no changes required for existing tests

The workspace route harness handler in `app.ts` returns `requestContext` as a plain object with named fields:

```typescript
requestContext: {
  workspaceId: request.requestContext?.workspaceId ?? null,
  actorId: request.requestContext?.actorId ?? null
}
```

This does not include `grantedPermissions`. The test assertion `toEqual({ workspaceId, actorId })` will still pass after the change because the serialized response body does not include `grantedPermissions`.

New tests for permissions plumbing should be added to this file (see section 8).

### 5.3 All other test files — SAFE

No other test file imports `resolveRequestContextFromHeaders` or asserts on `RequestContext` shape directly.

## 6. Allowlist

Files permitted to change in the implementation work authorized by this gate:

| File | Permitted change |
|---|---|
| `src/request-context.ts` | Add `GRANTED_PERMISSIONS_HEADER` constant; add `grantedPermissions?: readonly string[]` to `RequestContext` and `FullyResolvedRequestContext`; update `resolveRequestContextFromHeaders` to parse the header |
| `tests/request-context.test.ts` | Update affected `toEqual` assertions to include `grantedPermissions: []`; add new tests for header parsing |
| `tests/request-context-plumbing.test.ts` | Add new tests for `grantedPermissions` plumbing through `buildApp` harness |

`src/app.ts` is NOT in the allowlist for this gate. The harness permissions parsing lives entirely in `src/request-context.ts`. `app.ts` does not need to change.

## 7. Blocklist

The following files MUST NOT change in the implementation work for this gate:

- `src/workspace-context-guard.ts`
- `src/auth-guard.ts`
- `src/permission-guard.ts`
- `src/auth-config.ts`
- `src/error-model.ts`
- `src/app.ts`
- `src/products/`
- `migrations/`
- `package.json`
- `pnpm-lock.yaml`
- `.github/workflows/`
- `docs/nashir_v1_openapi.yaml`
- Authority SHA `36da9ed31903562bddfb7ffd669841956e334a51`

## 8. Required Tests

### New tests in `tests/request-context.test.ts`

- returns `grantedPermissions: []` when `x-nashir-granted-permissions` header is absent
- returns `grantedPermissions: []` when `x-nashir-granted-permissions` header is blank
- returns `grantedPermissions: []` when `x-nashir-granted-permissions` header is whitespace-only
- returns single permission from a single-value header
- returns multiple permissions from a comma-separated header
- trims whitespace from each permission value
- filters out empty entries after splitting on comma
- deduplicates repeated permission values
- case-insensitively reads the `x-nashir-granted-permissions` header

### Updated assertions in `tests/request-context.test.ts`

Every existing `toEqual` on `result.context` or `requireRequestContext(result)` must add `grantedPermissions: []`.

### New tests in `tests/request-context-plumbing.test.ts`

- `x-nashir-granted-permissions` header value is accessible via `request.requestContext.grantedPermissions` in a harness route handler
- absent header results in `grantedPermissions` being `undefined` or `[]` on `requestContext` (handler uses `?? []`)
- `/health` route is unaffected — still responds 200 without request-context headers regardless of permissions header presence

## 9. Verification Commands

```bash
pnpm run lint
pnpm run typecheck
pnpm test
```

All 134 currently passing tests must still pass after the change. The 3 skipped DB-integration test files remain skipped.

## 10. Risks

### 10.1 Optional Field Footgun Risk

`grantedPermissions?: readonly string[]` is optional. A product handler that calls `evaluatePermissionGuard({ grantedPermissions: requestContext.grantedPermissions, ... })` without the `?? []` fallback will pass `undefined` where `readonly string[]` is expected.

Mitigation: The authoritative calling pattern documented in this gate and in the product route authorization gate is:

```typescript
grantedPermissions: requestContext.grantedPermissions ?? []
```

TypeScript will surface a type error if `grantedPermissions` is passed directly without `?? []` since `undefined` is not assignable to `readonly string[]`. The type mismatch will be caught at compile time.

### 10.2 Test Coverage Gap Risk

`request-context.test.ts` has 15 existing cases. Adding `grantedPermissions: []` to all expected context objects may be missed for edge cases.

Mitigation: Run `pnpm run typecheck` and `pnpm test` after every assertion update. TypeScript will not flag missing expected fields in `toEqual` calls, so manual review of all affected assertions is required.

### 10.3 Auth0 Permissions Gap Masking Risk

Because product route tests use harness auth (where `grantedPermissions` is set from headers), they will not test the Auth0 path where `grantedPermissions` is `undefined`. This gap may be invisible until an Auth0 integration test is added.

Mitigation: Document explicitly in the product route implementation gate that the Auth0 permissions gap is a known Slice 0 constraint. No Auth0 mode test is required for Slice 0 product route handlers.

### 10.4 Permission String Injection Risk

The `x-nashir-granted-permissions` header is harness-only (non-Auth0 path). In production (Auth0 mode), the header is never parsed. There is no injection risk in production.

In test/development environments using harness auth, an actor with network access to the application can send arbitrary permission strings. This is acceptable for a harness-only header in a non-production auth path.

## 11. Decision

**Decision: GO.**

Rationale:

- The change is minimal: one optional field added to one interface; one header parsed in one function.
- No auth semantics change.
- No Auth0 path change.
- No `workspace-context-guard.ts` change required.
- `permission-guard.ts` does not need to change.
- The harness path is the only path where `grantedPermissions` is populated in Slice 0 — consistent with how all other harness tests work.
- Existing tests break in a predictable, mechanical way: add `grantedPermissions: []` to affected `toEqual` expectations.
- The Auth0 production gap is acknowledged, documented, and acceptable for Slice 0.

## 12. Transition Decision

**GO.** Proceed to:

`docs/nashir_backend_slice_0_product_route_handler_request_context_permissions_implementation_authorization_gate.md`

That gate must:

- Confirm the exact diff to `src/request-context.ts`.
- Confirm all test updates in `tests/request-context.test.ts` and `tests/request-context-plumbing.test.ts`.
- Authorize implementation of the changes described in section 6.
- Confirm that all verification commands in section 9 pass after the change.

After that implementation authorization gate is merged, Condition A of the product route handler authorization gate is satisfied and product route handler implementation may begin.

## 13. Explicit Non-Authorization

This gate does not authorize:

- Product route handler implementation.
- Any changes to `src/products/`.
- `workspace-context-guard.ts` changes.
- `auth-guard.ts` changes.
- Auth0→`grantedPermissions` mapping.
- `WorkspaceMembershipResolver` production implementation.
- Migrations, ORM, package.json, CI, or OpenAPI changes.
