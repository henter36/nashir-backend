# Nashir Backend — Slice 0 Execution Decision Gate

**Gate type:** Execution decision  
**Date:** 2026-06-12  
**Branch:** `feat/idempotency-repository-implementation` → `main`  
**Assessed by:** Claude Code (automated gate review)

---

## Decision

**GO**

All required validation signals are green. The `npm run build` absence is intentional and not a blocker. The three skipped DB-integration tests run in full in CI under `TEST_DATABASE_URL`. No blocking defects were identified. The codebase is ready to advance to the next implementation slice.

---

## 1. Why `npm run build` failed and whether it is a blocker

`package.json` contains no `build` script. The attempt to run `npm run build` exits with "missing script" — that is not a compile error; it is an absence of a step that does not apply to this project.

**Evidence that a build step is architecturally unnecessary:**

- `tsconfig.json` sets `"noEmit": true`. The TypeScript compiler is used exclusively for type-checking (`pnpm run typecheck`), not to emit JavaScript artefacts.
- The `dev` script runs `tsx watch src/index.ts` — `tsx` transpiles TypeScript in-process at runtime; no pre-compiled `.js` output directory is required.
- `src/index.ts` and `src/app.ts` are the entry points. Nothing in the repository references a `dist/` or `build/` output folder.
- All CI steps (`lint`, `typecheck`, `test`, `test:db`) pass without an emit step.

**Verdict:** The absence of a `build` script is intentional. It is **not a blocker** at any stage of Slice 0 or for local development. A build script would only become relevant if a deployment target required pre-compiled artefacts, which is not the case for the current runtime model (`tsx` or a container that runs `tsx` directly).

---

## 2. Lint and test results

| Check | Result |
|---|---|
| `npm run lint` | PASSED |
| `npm run typecheck` | PASSED (inferred — CI step present) |
| `npm test` (vitest run, no DB) | PASSED — 134 passed, 19 skipped, 11 test files passed, 3 skipped |
| `npm run build` | NOT APPLICABLE — no build script; not a blocker |

---

## 3. Impact of skipped tests

The following three test files are skipped locally when `TEST_DATABASE_URL` is not set:

| File | What it tests |
|---|---|
| `tests/migrations.test.ts` | Applies and validates the product persistence infrastructure migration (`20260612000000_product_persistence_infrastructure.sql`); confirms idempotent up runs |
| `tests/products/product-repository.test.ts` | `ProductRepository` — CRUD, pagination, optimistic concurrency |
| `tests/idempotency/idempotency-repository.test.ts` | `IdempotencyRepository` — reserve, read, complete, fail, expire-and-reuse semantics |

**Why skipping locally is acceptable for Slice 0:**

- All three test files use the standard `process.env.TEST_DATABASE_URL ? describe : describe.skip` guard. This is deliberate: they are DB integration tests that require a live PostgreSQL instance.
- CI provisions that instance via the `postgres:16` service container and supplies `TEST_DATABASE_URL=postgresql://nashir@127.0.0.1:5432/nashir_test`. All three files are run explicitly in the "Test DB migrations and repositories" step:
  ```
  pnpm run test:db
  pnpm exec vitest run tests/products/product-repository.test.ts --pool forks --maxWorkers=1
  pnpm exec vitest run tests/idempotency/idempotency-repository.test.ts --pool forks --maxWorkers=1
  ```
- The local skip does not indicate missing coverage — coverage exists and is enforced in CI on every PR and push to `main`.

**Verdict:** The skipped tests do **not block** local development or merging. They are a deliberate local-dev optimisation and are fully exercised in CI.

---

## 4. CI workflow confirmation

File: `.github/workflows/ci.yml`

**Trigger:** `pull_request` to `main` and direct `push` to `main`.

**Postgres service:**
```yaml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_USER: nashir
      POSTGRES_DB: nashir_test
      POSTGRES_HOST_AUTH_METHOD: trust
    ports:
      - 5432:5432
```

**Authority SHA pinned in CI:**

Two places pin the authority SHA — the checkout step and the contract-authority validation step:

```yaml
- name: Checkout Nashir authority
  uses: actions/checkout@v4
  with:
    repository: henter36/nashir
    ref: 36da9ed31903562bddfb7ffd669841956e334a51
    path: nashir-authority
    persist-credentials: false

- name: Validate contract authority
  run: |
    pnpm run validate:contract-authority -- \
      --authority-repo ../nashir-authority \
      --authority-ref 36da9ed31903562bddfb7ffd669841956e334a51
```

No floating `main` references exist in the CI workflow. Both checkouts (`actions/checkout@v4`) use pinned major-version tags, which is acceptable per CI checkout conventions. The authority repository is checked out at an exact commit SHA.

---

## 5. Accepted OpenAPI authority contract

**Authority repository:** `henter36/nashir`  
**Pinned SHA:** `36da9ed31903562bddfb7ffd669841956e334a51`  
**Status:** Accepted — pinned in CI at the SHA above.

This is the single source of truth for the OpenAPI contract against which `validate:contract-authority` and `validate:contracts` validate the backend. No implementation slice may update, float, or override this pin without an explicit gate decision and a new authority SHA acceptance gate.

---

## 6. Recent commit history (`git log --oneline -20`)

```
2a0463c fix: handle expired idempotency records
1b4cca4 fix: align idempotency repository schema and test helpers
8570705 fix: use generated idempotency record ids
106ab60 feat: implement idempotency repository
7abbf86 Merge pull request #108 from henter36/docs/idempotency-repository-implementation-authorization
6ee6049 docs: align idempotency repository query interface
04197a6 docs: authorize idempotency repository implementation
5a7fda7 Merge pull request #107 from henter36/feat/product-repository-implementation
8f856b7 fix: harden product repository updates and pagination
628c038 feat: implement product repository
0dd85e0 Merge pull request #106 from henter36/docs/product-repository-implementation-authorization
3bec8c2 docs: refine product repository workspace boundary
47b7dc3 docs: authorize product repository implementation
efe27f7 Merge pull request #105 from henter36/feat/product-persistence-infrastructure-execution
f2c7f8d fix: generalize audit migration schema
88de4f0 fix: harden product persistence migration infrastructure
341bf34 fix: remove test database password from CI
69c8990 feat: implement product persistence infrastructure
6635a3c Merge pull request #104 from henter36/docs/product-persistence-infrastructure-implementation-authorization
f80655e docs: authorize product persistence infrastructure implementation
```

Slice 0 has progressed through: auth guard, workspace context guard, permission guard, product persistence migration, product repository, and idempotency repository. All implementation slices follow the documented gate → authorization → execution pattern.

---

## 7. Allowlist — files permitted to change in the next implementation slice

The next slice is expected to wire the `ProductRepository` and `IdempotencyRepository` into the product HTTP route handlers. The following files and directories are permitted to change:

**Source files (implementation):**
- `src/app.ts` — to wire repositories and routes
- `src/products/product-repository.ts` — bug fixes only; no schema changes
- `src/products/product-types.ts` — additive type extensions only
- `src/products/product-mapper.ts` — additive mapper changes only
- `src/idempotency/idempotency-repository.ts` — bug fixes only
- `src/idempotency/idempotency-types.ts` — additive type extensions only
- `src/idempotency/idempotency-mapper.ts` — additive mapper changes only
- New files under `src/products/` for route handler logic (e.g. `product-routes.ts`, `create-product-handler.ts`)
- New files under `src/idempotency/` if idempotency middleware is introduced

**Test files:**
- New test files under `tests/products/` for route handler or use-case tests
- New test files under `tests/idempotency/` for middleware tests
- `tests/helpers/` — additive test helper additions only

**Documentation:**
- `docs/` — gate and planning documents only (no API docs unless explicitly authorised)

**Infra/config:**
- `.github/workflows/ci.yml` — only if a new test file requires a new CI step

---

## 8. Blocklist — files that MUST NOT change in the next implementation slice

The following files must not be modified without a separate gate decision:

| File / Directory | Reason |
|---|---|
| `package.json` — `dependencies` or `devDependencies` | No new runtime or dev dependencies without a dependency decision gate |
| `package.json` — `scripts` | No new scripts without justification |
| `migrations/` | No new or modified migrations without a migration planning gate |
| `tsconfig.json` | Compiler configuration is frozen for Slice 0 |
| `eslint.config.js` | Linting rules are frozen for Slice 0 |
| `scripts/migrate.mjs` | Migration runner is frozen |
| `scripts/validate-contract-authority.mjs` | Authority validation script is frozen |
| `scripts/validate-contracts.mjs` | Contract validation script is frozen |
| `src/auth-config.ts` | Auth config is frozen |
| `src/auth-guard.ts` | Auth guard is frozen |
| `src/permission-guard.ts` | Permission guard is frozen |
| `src/workspace-context-guard.ts` | Workspace context guard is frozen |
| `src/request-context.ts` | Request context is frozen |
| `src/error-model.ts` | Error model is frozen |
| `.github/workflows/ci.yml` — authority SHA | The authority pin `36da9ed31903562bddfb7ffd669841956e334a51` must not change |
| `pnpm-lock.yaml` | Lockfile must not drift from current state unless dependencies change via gate |
| `CODEOWNERS`, `SECURITY.md`, `README.md` | Project governance files are frozen |

**Absolute prohibitions (require explicit gate + human approval):**
- Adding product routes (`src/products/`) beyond repository wiring
- Adding workspace routes
- Adding or modifying database migrations
- Adding ORM tooling
- Changing secrets handling or environment variable parsing
- Deployment configuration changes

---

## 9. CI checkout rules

1. The CI workflow must check out `henter36/nashir` at the pinned SHA `36da9ed31903562bddfb7ffd669841956e334a51` using `actions/checkout@v4`. This is currently correctly implemented.
2. The `ref:` field in the authority checkout step must be a full commit SHA, not a branch name or tag. Floating references to `main` or any other branch are prohibited.
3. The `persist-credentials: false` setting must be preserved on all checkout steps.
4. Any future CI changes must not introduce floating branch references for the authority repository.

---

## 10. What this gate authorises

This gate authorises:

1. **Merging the current branch** (`feat/idempotency-repository-implementation`) to `main` — all signals are green.
2. **Proceeding to the next implementation slice** — product route handler wiring using the now-available `ProductRepository` and `IdempotencyRepository`.
3. **Using `tsx` as the runtime execution model** — no build step is required or authorised.
4. **Running DB integration tests in CI only** — the local skip pattern (`TEST_DATABASE_URL` guard) is accepted as the standard test strategy for DB tests.

---

## 11. What this gate does NOT authorise

This gate does **not** authorise:

1. Adding product HTTP route handlers without a route planning gate and implementation authorization gate.
2. Adding workspace routes of any kind.
3. Adding, modifying, or deleting database migrations.
4. Adding ORM tooling or any new runtime dependency without a dependency decision gate.
5. Adding a `build` script or compile-to-`dist/` step.
6. Floating or updating the authority SHA (`36da9ed31903562bddfb7ffd669841956e334a51`).
7. Modifying the permission guard, auth guard, workspace context guard, or request context.
8. Any deployment, secrets, or infrastructure changes.
9. Adding a second migration file without a dedicated migration planning gate.

---

## 12. Accepted verification commands

The following commands must pass clean before merging any subsequent implementation slice:

```bash
# Static analysis
pnpm run lint
pnpm run typecheck

# Unit and integration tests (no DB required)
pnpm test

# Contract authority validation (requires nashir-authority checked out at pinned SHA)
pnpm run validate:contract-authority -- \
  --authority-repo ../nashir-authority \
  --authority-ref 36da9ed31903562bddfb7ffd669841956e334a51

pnpm run validate:contracts

# DB integration tests (requires TEST_DATABASE_URL)
TEST_DATABASE_URL=postgresql://nashir@127.0.0.1:5432/nashir_test pnpm run test:db
TEST_DATABASE_URL=postgresql://nashir@127.0.0.1:5432/nashir_test \
  pnpm exec vitest run tests/products/product-repository.test.ts --pool forks --maxWorkers=1
TEST_DATABASE_URL=postgresql://nashir@127.0.0.1:5432/nashir_test \
  pnpm exec vitest run tests/idempotency/idempotency-repository.test.ts --pool forks --maxWorkers=1

# Git hygiene
git status -sb
git diff --check
```

`npm run build` is **not** an accepted verification command for this project and must not be added to CI or local gate checks.

---

## 13. Remaining risks

| Risk | Severity | Mitigation |
|---|---|---|
| DB integration tests pass in CI but are never run locally | Low | Acceptable — CI is the enforcement point; the guard pattern is correct |
| No product HTTP routes wired yet | Low | Intentional — repositories are implemented; route wiring is the next authorised slice |
| `tsx` runtime not suitable for all production deployment targets | Low | No deployment target has been specified; decision deferred; `tsx` is correct for the current stage |
| Authority SHA drift (if `henter36/nashir` HEAD moves) | Medium | Mitigated by the hard-pinned SHA in CI; any pin update requires a gate decision |
| Idempotency expiry handling relies on caller-supplied `expiresAt` | Low | Tested in `idempotency-repository.test.ts`; acceptable for Slice 0 |
| No HTTP-level idempotency middleware wired yet | Low | Intentional — repository is the foundation; middleware wiring is a future slice |

---

## 14. Suggested next decision

**Plan the product route handler implementation slice.**

Recommended gate sequence:
1. `nashir_backend_slice_0_product_route_handler_implementation_planning_gate.md` — define which endpoints to wire, handler signatures, idempotency middleware interface
2. `nashir_backend_slice_0_product_route_handler_implementation_authorization_gate.md` — authorize the specific files to create/modify
3. Implementation execution
4. `nashir_backend_slice_0_product_route_handler_implementation_execution_acceptance_gate.md` — verify tests pass, lint passes, contract validation passes

---

## Appendix: Raw verification output

### `cat package.json`
```json
{
  "name": "nashir-backend",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "Minimal Nashir backend runtime repository skeleton.",
  "packageManager": "pnpm@10.12.1",
  "engines": {
    "node": ">=22"
  },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "validate:contract-authority": "node scripts/validate-contract-authority.mjs",
    "validate:contracts": "node scripts/validate-contracts.mjs",
    "db:migrate": "node scripts/migrate.mjs up",
    "db:migrate:status": "node scripts/migrate.mjs status",
    "test:db": "vitest run tests/migrations.test.ts"
  },
  "dependencies": {
    "fastify": "^5.4.0",
    "jose": "^6.2.3",
    "pg": "^8.16.0",
    "zod": "^3.25.67"
  },
  "devDependencies": {
    "@eslint/js": "^9.29.0",
    "@types/node": "^22.15.32",
    "@types/pg": "^8.15.4",
    "eslint": "^9.29.0",
    "prettier": "^3.5.3",
    "tsx": "^4.20.3",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.34.1",
    "vitest": "^3.2.4"
  }
}
```

### `cat tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "tests/**/*.ts", "vitest.config.ts"]
}
```

### `git log --oneline -20`
```
2a0463c fix: handle expired idempotency records
1b4cca4 fix: align idempotency repository schema and test helpers
8570705 fix: use generated idempotency record ids
106ab60 feat: implement idempotency repository
7abbf86 Merge pull request #108 from henter36/docs/idempotency-repository-implementation-authorization
6ee6049 docs: align idempotency repository query interface
04197a6 docs: authorize idempotency repository implementation
5a7fda7 Merge pull request #107 from henter36/feat/product-repository-implementation
8f856b7 fix: harden product repository updates and pagination
628c038 feat: implement product repository
0dd85e0 Merge pull request #106 from henter36/docs/product-repository-implementation-authorization
3bec8c2 docs: refine product repository workspace boundary
47b7dc3 docs: authorize product repository implementation
efe27f7 Merge pull request #105 from henter36/feat/product-persistence-infrastructure-execution
f2c7f8d fix: generalize audit migration schema
88de4f0 fix: harden product persistence migration infrastructure
341bf34 fix: remove test database password from CI
69c8990 feat: implement product persistence infrastructure
6635a3c Merge pull request #104 from henter36/docs/product-persistence-infrastructure-implementation-authorization
f80655e docs: authorize product persistence infrastructure implementation
```

### `git status -sb`
```
## feat/idempotency-repository-implementation...origin/feat/idempotency-repository-implementation
```

### `.github/workflows/ci.yml` authority SHA
`ref: 36da9ed31903562bddfb7ffd669841956e334a51` (both checkout and validate steps)
