# Backend Slice 0 Product Route Naming Stale Reference Cleanup Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only stale reference cleanup gate |
| Status | GO |
| Repository | `henter36/nashir-backend` |
| Prior decision | Product Route Naming / Authority Alignment Decision Gate |
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

Clean up stale planning references that may imply `/workspaces/{workspaceId}/nashir-products` is expected or canonical.

Preserve references that explicitly document `/nashir-products` as rejected, non-canonical, or historical decision context.

This cleanup does not authorize implementation.

---

## 2. Inputs

| Input | Finding |
|---|---|
| Product Route Naming / Authority Alignment Decision Gate | Accepted `/workspaces/{workspaceId}/products` as canonical V1 product route family. |
| OpenAPI authority | Uses `/workspaces/{workspaceId}/products`. |
| Backend runtime | Uses `/workspaces/:workspaceId/products`. |
| Stale reference scan | Found remaining `/nashir-products` references in documentation only. |

---

## 3. Cleanup Rule

| Reference type | Action |
|---|---|
| `/nashir-products` described as expected/current/valid route | Replace or clarify as stale planning terminology. |
| `/nashir-products` described as rejected/non-canonical | Preserve. |
| `/products` canonical route references | Preserve. |
| Runtime files | Do not change. |
| OpenAPI authority | Do not change. |
| Generated types | Do not regenerate. |

---

## 4. Files To Review

```text
docs/nashir_backend_slice_0_post_ui_authority_reconciliation_gate.md
docs/nashir_backend_slice_0_product_routes_ui_consumer_contract_reconciliation_gate.md
docs/nashir_backend_slice_0_product_routes_ui_consumer_contract_review_gate.md
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
NO-GO: Removing historical decision context that says /nashir-products is rejected or non-canonical.
NO-GO: Production or pilot readiness.
```

---

## 6. Verification

Required checks:

```bash
grep -RIn "nashir-products" docs || true
git diff --check
npm test
```

Expected interpretation:

```text
Remaining /nashir-products references are allowed only if they describe rejected/non-canonical/historical decision context.
```

---

## 7. Decision

```text
GO: Documentation-only stale reference cleanup may proceed.
NO-GO: Runtime, OpenAPI, generated type, SQL/migration, UI, or alias changes.
```

---

## 8. Next Allowed Gate

```text
Backend Slice 0 Product Route Naming Cleanup Review Gate
```

Purpose:

* Confirm stale references were either corrected or explicitly marked as non-canonical.
* Confirm no runtime/OpenAPI/generated/migration/UI changes occurred.
