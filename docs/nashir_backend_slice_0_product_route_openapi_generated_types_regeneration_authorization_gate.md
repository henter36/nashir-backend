# Nashir Backend Slice 0 — Product Route OpenAPI Generated Types Regeneration Authorization Gate

## 1. Gate Name

Backend Slice 0 Product Route OpenAPI Generated Types Regeneration Authorization Gate

## 2. Gate Type

Generated types regeneration authorization gate.

This gate is documentation-only.

It does not regenerate generated TypeScript types.

It does not modify the authority repository.

It does not modify backend runtime code, generated clients, SQL migrations, copied OpenAPI files, CI workflows, UI, or deployment configuration.

## 3. Purpose

This gate decides whether the product-route OpenAPI changes merged in the authority repository should proceed to a separate generated TypeScript types regeneration execution gate.

The authority OpenAPI was updated to align product route success response schemas and product list `limit` requiredness with the accepted backend runtime.

The backend authority pin was then reconciled to the merged authority commit.

The remaining open risk is stale checked-in generated TypeScript types in the authority repository.

## 4. Inputs

### 4.1 Accepted Authority Edit

- Authority repository: `henter36/nashir`
- Authority PR: `#184`
- Authority merge commit: `13388d787f57e2d863eda960db6de497bd2efa6c`
- Modified authority file: `docs/nashir_v1_openapi.yaml`

### 4.2 Accepted Backend Pin Reconciliation

- Backend PR: `#128`
- Decision: GO to Backend Slice 0 Product Route OpenAPI Generated Types Regeneration Authorization Gate.
- Scope: backend governance and CI pin synchronization only.

### 4.3 Authority Repository Status Evidence

```text
## main...origin/main
```

### 4.4 Authority Recent Log Evidence

```text
13388d7 Merge pull request #184 from henter36/contract/product-route-openapi-authority-edit-execution
cabf737 contract: align product route responses with runtime
5c6729b Merge pull request #183 from henter36/docs/nashir-ai-agent-architecture-adr
4f8be10 docs: add Nashir AI agent workflow architecture ADR
04f54f8 Merge pull request #182 from henter36/docs/restore-agent-runtime-planning-gate
```

### 4.5 Existing Generation Script Evidence

```text
11:    "generate:creator-studio-types": "openapi-typescript docs/nashir_v1_openapi.yaml -o src/generated/creator-studio-openapi-types/index.d.ts"
```

### 4.6 Existing openapi-typescript Dependency Evidence

```text
27:    "openapi-typescript": "^7.13.0",
```

### 4.7 Existing Generated Types File Evidence

```text
GENERATED_TYPES_FILE_EXISTS=YES
```

### 4.8 Local Stash Evidence

```text

```

## 5. Stash Handling Decision

The existing local stash entries must not be used as direct execution input for generated types regeneration.

Reason:

- `stash@{0}` was created before the accepted authority OpenAPI edit was merged.
- `stash@{0}` contains mixed files, including generated types, package files, and `vite.config.js`.
- `stash@{1}` and `stash@{2}` are unrelated WIP items.
- Generated types must be regenerated fresh from current `main` after authority PR `#184`.

Decision:

- Keep existing stash entries as historical reference only.
- Do not `stash pop` for this work.
- Do not cherry-pick generated type output from stash.

## 6. Proposed Execution Scope

The next execution gate may run the existing authority repository script:

```bash
npm run generate:creator-studio-types
```

Expected generated output:

- `src/generated/creator-studio-openapi-types/index.d.ts`

Allowed changed file in the execution PR:

- `src/generated/creator-studio-openapi-types/index.d.ts`

Conditionally allowed only if proven necessary by the execution gate:

- none

## 7. Explicitly Not Authorized

The next execution gate must not modify:

- `docs/nashir_v1_openapi.yaml`
- `package.json`
- `package-lock.json`
- `vite.config.js`
- `.github/**`
- `docs/INDEX.md`
- `src/test/**`
- backend runtime code
- backend generated clients
- SQL migrations
- CI workflows
- UI behavior
- deployment configuration

If the generation process requires `package.json` or lockfile changes, stop and open a separate package/dependency authorization gate.

## 8. Verification Requirements For Next Execution Gate

The next execution gate must verify:

1. Authority repo is on current `main`.
2. Working tree is clean before regeneration.
3. Existing script `npm run generate:creator-studio-types` is used.
4. Generated diff is limited to `src/generated/creator-studio-openapi-types/index.d.ts`.
5. Product route generated types reflect:
   - product list `limit` is required.
   - `ProductResponse` uses `product`.
   - `ProductListResponse` uses `products`, `count`, `hasMore`, and `nextCursor`.
6. No stash content is applied.
7. No backend files are changed.

## 9. Risks

| Risk | Status | Control |
| :--- | :--- | :--- |
| Generated types remain stale after authority OpenAPI edit | Open | Authorize a narrow generated types execution gate. |
| Stash output contaminates the generated result | Controlled | Do not use stash; regenerate fresh from current authority main. |
| Package or lockfile changes sneak into generated types PR | Controlled | Block package changes unless separately authorized. |
| Generated types PR expands into UI/runtime work | Controlled | Allow only generated type file. |
| Backend repo receives generated artifacts | Controlled | Execution must happen in authority repo only. |

## 10. Decision

Decision: GO to Product Route OpenAPI Generated Types Regeneration Execution Gate in the authority repository.

Rationale:

The authority repository already contains a standard generation script and the required `openapi-typescript` dependency. The authority OpenAPI has changed, and checked-in generated TypeScript types may now be stale. A narrow execution gate is justified, but it must regenerate fresh from current authority `main` and must not use old stash content.

## 11. Transition Control

Do not regenerate generated types in this backend PR.

Do not modify the authority repository from this backend authorization gate.

Do not modify package files.

Do not apply stash.

Do not modify backend runtime code.

The next gate must be a separate authority repository execution gate.
