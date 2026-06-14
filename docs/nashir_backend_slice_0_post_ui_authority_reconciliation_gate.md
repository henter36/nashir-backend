# Backend Slice 0 Post-UI-Authority Reconciliation Gate

| Field | Value |
|---|---|
| Gate type | Backend Slice 0 post-UI-authority reconciliation gate |
| Status | GO |
| Repository | `henter36/nashir-backend` |
| Date | 2026-06-13 |
| Scope | Reconciles Backend Slice 0 after the Nashir Product UI source-of-truth cleanup |
| UI source of truth | `henter36/nashir` only |
| Approved Product UI | 23-page Arabic React UI in `henter36/nashir` |
| Backend role | Runtime/API implementation only |
| UI changes | NO |
| Backend runtime changes | NO |
| OpenAPI changes | NO |
| Generated types changes | NO |
| SQL/migration changes | NO |
| Production readiness claimed | NO |

---

## 1. Final Decision

**GO.**

Backend Slice 0 may continue only after accepting the post-UI-authority boundary:

```text
henter36/nashir = only approved Nashir Product UI source
henter36/nashir-backend = backend runtime/API implementation only
marketing-os/ui/nashir = not a Product UI authority and must not be targeted by future backend integration
```

This gate does not authorize new backend routes, OpenAPI edits, generated type regeneration, migrations, UI work, agents, analytics runtime, publishing runtime, or production readiness.

---

## 2. Inputs

| Input | Finding |
|---|---|
| `henter36/nashir` PR #186 | Merged. Accepts Nashir UI source-of-truth cleanup and confirms the 23-page Arabic React UI is the only approved Product UI source. |
| `henter36/nashir` approved UI | Exactly 23 Arabic pages are the Product UI authority. |
| `henter36/nashir-backend` | Backend runtime/API implementation only. |
| `marketing-os/ui/nashir` | Must not be used as a Product UI target or future backend integration target. |
| Backend Slice 0 current direction | Product routes, idempotency, audit, permission guard, OpenAPI authority reconciliation, generated types alignment. |

---

## 3. Explicitly Stated Facts

- `henter36/nashir` is the only approved Nashir Product UI source.
- The approved UI surface is exactly 23 Arabic React pages.
- `henter36/nashir-backend` must remain backend/runtime only.
- `marketing-os/ui/nashir` must not be referenced as Product UI.
- Backend API paths using `/workspaces/{workspaceId}/nashir-*` are backend product/API routes, not UI routes.
- This gate does not remove or rename valid backend API routes.
- This gate does not change OpenAPI, generated types, migrations, runtime code, tests, package files, or CI.

---

## 4. Approved Backend Interpretation

Valid Nashir backend API routes remain valid when they serve the approved Product UI in `henter36/nashir`.

Examples of valid backend/API concepts:

```text
/workspaces/{workspaceId}/products
/workspaces/{workspaceId}/products/{productId}
/workspaces/{workspaceId}/nashir-store-profile
```

These must not be confused with a forbidden static Product UI route such as:

```text
/nashir
/nashir/
ui/nashir
```

The backend must not assume, document, or target `marketing-os/ui/nashir` as the UI consumer.

---

## 5. Reconciliation Checks Required

This gate requires verifying:

1. No frontend/Product UI files exist in `henter36/nashir-backend`.
2. No docs in `henter36/nashir-backend` identify `marketing-os/ui/nashir` as Product UI.
3. No docs instruct future API integration against `marketing-os/ui/nashir`.
4. No static serving route `/nashir` or `/nashir/` exists in backend runtime.
5. Valid API routes containing `/nashir-*` are preserved and not treated as UI violations.
6. Backend Slice 0 documentation points future UI integration to `henter36/nashir`.

---

## 6. Verification Commands

### Backend UI file absence

```bash
find . \
  -path "./node_modules" -prune -o \
  -path "./.git" -prune -o \
  -type f \( \
    -name "*.html" -o \
    -name "*.jsx" -o \
    -name "*.tsx" -o \
    -name "*.css" -o \
    -name "*.vue" -o \
    -name "*.svelte" \
  \) -print
```

Expected result:

```text
No frontend/Product UI files.
```

### Forbidden static UI route scan

```bash
grep -E -RIn \
  --include="*.js" \
  --include="*.ts" \
  --include="*.mjs" \
  --include="*.cjs" \
  '/nashir([^a-zA-Z0-9_-]|$)|ui/nashir|marketing-os/ui/nashir' . \
  | grep -v node_modules \
  | grep -v .git \
  || true
```

Expected result:

```text
No static Product UI route or marketing-os UI target.
```

### Valid API route preservation scan

```bash
grep -RIn "/products\|nashir-store-profile\|nashir-campaigns" src docs tests 2>/dev/null || true
```

Expected result:

```text
Valid API/backend references may exist and are not violations.
```

### Standard checks

```bash
npm test
git diff --check
git status -sb
```

---

## 7. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Backend docs still imply `marketing-os/ui/nashir` is Product UI | HIGH | Search and explicitly block references. |
| Static `/nashir` route is confused with valid `/workspaces/.../nashir-*` API routes | HIGH | Preserve API routes; block only static UI serving and `ui/nashir` references. |
| Future API work targets the wrong UI consumer | HIGH | Future integration must target `henter36/nashir`. |
| Over-cleaning removes valid backend API routes | HIGH | Do not remove `/workspaces/{workspaceId}/nashir-*` routes. |
| UI source-of-truth cleanup accepted without backend reconciliation | MEDIUM | This gate closes the backend side of the cleanup. |

---

## 8. NO-GO Boundaries

```text
NO-GO: Any frontend/Product UI files in nashir-backend.
NO-GO: Static /nashir or /nashir/ Product UI serving from nashir-backend.
NO-GO: Targeting marketing-os/ui/nashir as UI consumer.
NO-GO: Removing valid backend API routes merely because they contain nashir-*.
NO-GO: OpenAPI edits in this gate.
NO-GO: Generated type regeneration in this gate.
NO-GO: SQL or migrations in this gate.
NO-GO: Backend runtime changes in this gate.
NO-GO: Product route behavior changes in this gate.
NO-GO: Agents, analytics runtime, publishing runtime, or production readiness.
```

---

## 9. Decision

```text
GO: Backend Slice 0 may continue with henter36/nashir as the only Product UI target.
NO-GO: Any backend assumption that marketing-os/ui/nashir is a Product UI consumer.
NO-GO: Any static Product UI serving from nashir-backend.
```

---

## 10. Next Allowed Gate

```text
Backend Slice 0 Product Routes / UI Consumer Contract Reconciliation Gate
```

Purpose:

- Map current product-route runtime behavior to the approved `henter36/nashir` UI consumption needs.
- Preserve OpenAPI authority discipline.
- Identify any missing UI-consumer contract gaps before new backend implementation.
- Keep all write routes, migrations, generated clients, and UI work blocked unless explicitly authorized.
