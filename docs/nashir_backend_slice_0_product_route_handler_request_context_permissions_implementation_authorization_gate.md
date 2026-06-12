# Nashir Backend Slice 0 — Request Context Permissions Implementation Authorization Gate

## 1. Gate Classification

Gate type: Implementation authorization gate.

Input gate: `docs/nashir_backend_slice_0_product_route_handler_request_context_permissions_gate.md` — Decision: GO.

This gate authorizes the exact, minimal implementation needed to add `grantedPermissions` to `RequestContext`. No product route handlers are authorized here.

## 2. Accepted Authority

- OpenAPI authority SHA: `36da9ed31903562bddfb7ffd669841956e334a51` — unchanged, not touched.
- Gate chain leading here: Execution Decision Gate → Product Route Handler Planning Gate → Product Route Handler Authorization Gate (GO WITH FIXES, Condition A) → Request Context Permissions Gate (GO) → this gate.

## 3. Authorized Changes

### 3.1 `src/request-context.ts`

**Change 1 — New constant after existing header constants:**

```typescript
export const GRANTED_PERMISSIONS_HEADER = "x-nashir-granted-permissions";
```

Position: immediately after `export const CORRELATION_ID_HEADER`.

**Change 2 — Add optional field to `RequestContext`:**

```typescript
export interface RequestContext {
  workspaceId: string;
  actorId: string;
  grantedPermissions?: readonly string[];
}
```

**Change 3 — Add optional field to `FullyResolvedRequestContext`:**

```typescript
export interface FullyResolvedRequestContext extends VerifiedIdentityContext {
  workspaceId: string;
  grantedPermissions?: readonly string[];
}
```

`VerifiedIdentityContext` does NOT get this field. `grantedPermissions` is a resolved-context concern, not an identity concern.

**Change 4 — Update `resolveRequestContextFromHeaders`:**

Add a private helper function to parse the permissions header. Place it alongside the existing `inspectHeader` helper:

```typescript
function parseGrantedPermissions(inspection: HeaderInspection): readonly string[] {
  if (inspection.reason !== "present") {
    return [];
  }

  return [
    ...new Set(
      inspection.value
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    )
  ];
}
```

Update `resolveRequestContextFromHeaders` to call this helper and include the result in the returned context. The existing workspace and actor inspection logic is unchanged. Only the happy-path `return` and the function body gain the permissions inspection:

```typescript
export function resolveRequestContextFromHeaders(
  headers: HeadersLike | null | undefined
): RequestContextResult {
  const safeHeaders = headers ?? {};
  const workspace = inspectHeader(safeHeaders, WORKSPACE_ID_HEADER);
  const actor = inspectHeader(safeHeaders, ACTOR_ID_HEADER);

  if (workspace.reason === "present" && actor.reason === "present") {
    const permissions = inspectHeader(safeHeaders, GRANTED_PERMISSIONS_HEADER);
    return {
      ok: true,
      context: {
        workspaceId: workspace.value,
        actorId: actor.value,
        grantedPermissions: parseGrantedPermissions(permissions)
      }
    };
  }

  // ... existing error path unchanged
}
```

The error path (when workspace or actor headers are missing) is not changed. `grantedPermissions` is only relevant when the context resolves successfully.

No other function in `src/request-context.ts` is modified. `requireRequestContext` is not modified.

### 3.2 `tests/request-context.test.ts`

**Existing assertions to update** — add `grantedPermissions: []` to every `toEqual` that checks `result.context` or the return value of `requireRequestContext`:

| Line | Current expected | Updated expected |
|---|---|---|
| `"returns context when both headers are present"` | `context: { workspaceId, actorId }` | `context: { workspaceId, actorId, grantedPermissions: [] }` |
| `"trims whitespace from header values"` | `context: { workspaceId, actorId }` | `context: { workspaceId, actorId, grantedPermissions: [] }` |
| `"reads required headers case-insensitively"` | `context: { workspaceId, actorId }` | `context: { workspaceId, actorId, grantedPermissions: [] }` |
| `"accepts array header values by using the first value"` | `context: { workspaceId: "workspace-first", actorId: "actor-first" }` | `context: { workspaceId: "workspace-first", actorId: "actor-first", grantedPermissions: [] }` |
| `"returns the context on success"` (requireRequestContext) | `{ workspaceId, actorId }` | `{ workspaceId, actorId, grantedPermissions: [] }` |

All other existing assertions (error path checks, `result.ok`, `result.code`, `result.missing`, `result.issues`, `result.statusCode`) are NOT modified.

**New tests to add** — append to the `resolveRequestContextFromHeaders` describe block:

```
- returns grantedPermissions: [] when x-nashir-granted-permissions header is absent
- returns grantedPermissions: [] when x-nashir-granted-permissions header is blank
- returns grantedPermissions: [] when x-nashir-granted-permissions header is whitespace-only
- returns a single-element array for a single permission value
- returns multiple permissions from a comma-separated header
- trims whitespace from each permission entry
- filters out empty entries (e.g. "a,,b" → ["a","b"])
- deduplicates repeated permission values
- reads x-nashir-granted-permissions case-insensitively
```

### 3.3 `tests/request-context-plumbing.test.ts`

**Existing tests** — NO changes. Confirmed safe: the workspace route harness response in `app.ts` serializes `requestContext` as `{ workspaceId, actorId }` without `grantedPermissions`, so existing `toEqual({ workspaceId, actorId })` assertions pass unchanged.

**New tests to add** — update `harnessHandler` to also return `grantedPermissions` from `requestContext`, then add tests:

Updated `harnessHandler`:

```typescript
async function harnessHandler(request: FastifyRequest) {
  return {
    workspaceId: request.requestContext?.workspaceId ?? null,
    actorId: request.requestContext?.actorId ?? null,
    grantedPermissions: request.requestContext?.grantedPermissions ?? null,
    correlationId: request.correlationId ?? null
  };
}
```

New test cases to add in the `"request-context plumbing on a gated non-health harness route"` describe block:

```
- attaches grantedPermissions: [] to the resolved context when permissions header is absent
- attaches a parsed grantedPermissions array when the header is present with valid values
- trims and deduplicates entries from the permissions header
```

The `/health` existing test is NOT modified. No new `/health` test is needed — the existing "remains ungated and identical even when request-context headers are present" test already proves the health route is unaffected by additional headers.

## 4. Invariants to Preserve

The following behaviors MUST NOT change:

| Invariant | Verification |
|---|---|
| Missing workspace or actor header → 401, `REQUEST_CONTEXT_REQUIRED` | Existing tests cover this |
| Blank workspace or actor header → 401 | Existing tests cover this |
| `/health` route bypasses all context checks | Existing plumbing tests cover this |
| `requireRequestContext` throws on failure with `statusCode: 401` and `code: REQUEST_CONTEXT_REQUIRED` | Existing test covers this |
| Array header values — first element used | Existing tests cover this |
| Case-insensitive header lookup | Existing tests cover this |
| Auth0 path (`authGuardHook` active) — `resolveRequestContextFromHeaders` is never called | Unchanged by this gate |
| `workspaceContextGuardHook` — not modified, sets `requestContext` without `grantedPermissions` | Unchanged by this gate |

## 5. Allowlist

| File | Permitted change |
|---|---|
| `src/request-context.ts` | Add `GRANTED_PERMISSIONS_HEADER` constant; add `grantedPermissions?: readonly string[]` to `RequestContext` and `FullyResolvedRequestContext`; add `parseGrantedPermissions` private helper; update `resolveRequestContextFromHeaders` happy-path return |
| `tests/request-context.test.ts` | Update 5 affected `toEqual` assertions; add 9 new tests for `grantedPermissions` parsing |
| `tests/request-context-plumbing.test.ts` | Update `harnessHandler` to expose `grantedPermissions`; add 3 new plumbing tests |
| `docs/nashir_backend_slice_0_product_route_handler_request_context_permissions_implementation_authorization_gate.md` | This document |

## 6. Blocklist

The following files MUST NOT change:

- `src/products/` (any file)
- `src/idempotency/` (any file)
- `src/permission-guard.ts`
- `src/auth-guard.ts`
- `src/auth-config.ts`
- `src/workspace-context-guard.ts`
- `src/error-model.ts`
- `src/app.ts`
- `migrations/` (any file)
- `package.json`
- `pnpm-lock.yaml`
- `.github/workflows/` (any file)
- `docs/nashir_v1_openapi.yaml`
- Authority SHA `36da9ed31903562bddfb7ffd669841956e334a51`
- Any generated client file

## 7. Verification Commands

These commands must all pass before any PR for this change is opened:

```bash
pnpm run lint
pnpm run typecheck
pnpm test
```

Expected outcome:
- All 134 currently passing tests continue to pass.
- New tests for `grantedPermissions` pass.
- 3 skipped DB-integration test groups remain skipped.
- No typecheck errors.
- No lint errors.

## 8. Final Decision

**Decision: GO.**

No blockers. The implementation is:

- Strictly scoped to `src/request-context.ts` and its two test files.
- Additive only — one optional field, one constant, one private helper function, one updated return statement.
- No auth semantics change.
- No product route handler code.
- No migrations, ORM, or CI changes.
- No new package dependencies.
- TypeScript optional field (`?`) ensures `workspace-context-guard.ts` compiles without modification.

After this PR is merged, **Condition A** of `docs/nashir_backend_slice_0_product_route_handler_implementation_authorization_gate.md` is satisfied and product route handler implementation may begin.

## 9. Explicit Non-Authorization

This gate does not authorize:

- Product route handler implementation.
- Fastify route registration.
- `WorkspaceMembershipResolver` implementation.
- Auth0 → `grantedPermissions` mapping.
- `AuditRepository` implementation.
- `workspace-context-guard.ts` changes.
- Any file not listed in section 5.
