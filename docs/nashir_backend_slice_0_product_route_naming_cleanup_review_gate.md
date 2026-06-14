# Backend Slice 0 Product Route Naming Cleanup Review Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only cleanup review gate |
| Status | GO |
| Repository | `henter36/nashir-backend` |
| Reviewed cleanup gate | Product Route Naming Stale Reference Cleanup Gate |
| Canonical V1 product route | `/workspaces/{workspaceId}/products` |
| Non-canonical route | `/workspaces/{workspaceId}/nashir-products` |
| Runtime changes | NO |
| OpenAPI changes | NO |
| Generated types changes | NO |
| SQL/migration changes | NO |
| UI changes | NO |
| Production readiness claimed | NO |

---

## 1. Final Decision

**GO.**

The Product Route Naming Stale Reference Cleanup Gate is accepted as a documentation-only cleanup.

This review confirms that `/workspaces/{workspaceId}/products` remains the canonical V1 product route family, and `/workspaces/{workspaceId}/nashir-products` remains non-canonical.

This review does not authorize implementation.

---

## 2. Inputs

| Input | Finding |
|---|---|
| PR #133 | Accepted `/workspaces/{workspaceId}/products` as canonical and rejected `/nashir-products` as canonical. |
| PR #134 | Cleaned or classified stale `/nashir-products` documentation references. |
| Cleanup rule | Preserve only rejected/non-canonical/historical `/nashir-products` references. |
| Runtime boundary | Runtime route changes remain NO-GO. |
| OpenAPI boundary | OpenAPI edits remain NO-GO. |
| Generated types boundary | Regeneration remains NO-GO. |

---

## 3. Review Criteria

| Criterion | Result | Finding |
|---|---:|---|
| Canonical `/products` preserved | PASS | `/products` remains the accepted V1 product route family. |
| `/nashir-products` not treated as canonical | PASS | Remaining references must describe rejected, stale, or historical context only. |
| Runtime unchanged | PASS | This review authorizes no runtime edits. |
| OpenAPI unchanged | PASS | This review authorizes no OpenAPI edits. |
| Generated types unchanged | PASS | This review authorizes no generated type regeneration. |
| SQL/migrations unchanged | PASS | This review authorizes no database changes. |
| UI unchanged | PASS | This review authorizes no UI changes. |
| Alias routes not introduced | PASS | `/nashir-products` aliases remain NO-GO. |

---

## 4. Remaining Reference Policy

Remaining `/nashir-products` references are acceptable only when they are clearly framed as:

```text
rejected
non-canonical
stale planning terminology
historical decision context
```

They are not acceptable if they imply:

```text
expected route
canonical route
runtime route
OpenAPI authority route
UI-required route
```

---

## 5. NO-GO Boundaries

```text
NO-GO: Runtime route changes.
NO-GO: OpenAPI edits.
NO-GO: Generated type regeneration.
NO-GO: SQL or migrations.
NO-GO: UI changes.
NO-GO: Adding /nashir-products alias routes.
NO-GO: Treating stale planning references as contract authority.
NO-GO: Production or pilot readiness.
```

---

## 6. Verification Commands

```bash
grep -RIn "nashir-products" docs || true
git diff --check
npm test
```

Expected interpretation:

```text
Any remaining /nashir-products references must be rejected/non-canonical/historical only.
```

---

## 7. Decision

```text
GO: Product route naming cleanup is accepted.
GO: /workspaces/{workspaceId}/products remains canonical.
NO-GO: /workspaces/{workspaceId}/nashir-products as canonical or alias route.
NO-GO: Runtime, OpenAPI, generated type, SQL/migration, UI, or production readiness work.
```

---

## 8. Next Recommended Gate

```text
Backend Slice 0 Product Route Runtime Contract Acceptance Review Gate
```

Purpose:

* Confirm the already implemented product runtime routes match the accepted OpenAPI/generated contract.
* Review `GET/POST /workspaces/{workspaceId}/products` and `GET/PUT /workspaces/{workspaceId}/products/{productId}`.
* Verify permission, workspace, idempotency, audit, and response-shape alignment.
* Decide whether product routes are ready to become the first UI-consumable backend slice for `henter36/nashir`.
