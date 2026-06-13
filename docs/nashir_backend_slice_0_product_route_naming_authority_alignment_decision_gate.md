# Backend Slice 0 Product Route Naming / Authority Alignment Decision Gate

| Field | Value |
|---|---|
| Gate type | Product route naming / authority alignment decision gate |
| Status | GO |
| Repository | `henter36/nashir-backend` |
| Authority repository | `henter36/nashir` |
| Authority OpenAPI | `docs/nashir_v1_openapi.yaml` |
| Runtime changes | NO |
| OpenAPI changes | NO |
| Generated types changes | NO |
| SQL/migration changes | NO |
| UI changes | NO |
| Production readiness claimed | NO |

---

## 1. Final Decision

**GO.**

Accept `/workspaces/{workspaceId}/products` and `/workspaces/{workspaceId}/products/{productId}` as the canonical Backend Slice 0 V1 product route names.

Reject `/workspaces/{workspaceId}/nashir-products` as a canonical V1 product route name.

This decision does not authorize implementation, route renaming, aliases, OpenAPI edits, generated type regeneration, migrations, or UI work.

---

## 2. Inputs

| Input | Finding |
|---|---|
| `henter36/nashir` OpenAPI authority | Defines product routes under `/workspaces/{workspaceId}/products` and `/workspaces/{workspaceId}/products/{productId}`. |
| `henter36/nashir-backend` runtime | Defines product routes under `/workspaces/:workspaceId/products` and `/workspaces/:workspaceId/products/:productId`. |
| PR #132 review gate | Correctly identified route naming confusion from planning docs that referenced `/nashir-products`. |
| Approved UI authority | `henter36/nashir` remains the only approved Nashir Product UI source. |
| Backend role | `nashir-backend` remains runtime/API only. |

---

## 3. Evidence Summary

### 3.1 Authority OpenAPI

The authority OpenAPI uses:

```text
/workspaces/{workspaceId}/products
/workspaces/{workspaceId}/products/{productId}
```

It does not require `/workspaces/{workspaceId}/nashir-products` as the canonical product route name for V1.

### 3.2 Backend runtime

The backend runtime uses:

```text
/workspaces/:workspaceId/products
/workspaces/:workspaceId/products/:productId
```

Registered methods:

```text
GET  /workspaces/:workspaceId/products
POST /workspaces/:workspaceId/products
GET  /workspaces/:workspaceId/products/:productId
PUT  /workspaces/:workspaceId/products/:productId
```

### 3.3 Source of confusion

Recent planning/reconciliation docs referenced:

```text
/workspaces/{workspaceId}/nashir-products
/workspaces/{workspaceId}/nashir-products/{productId}
```

This is now classified as stale planning terminology, not runtime authority and not OpenAPI authority.

---

## 4. Options Considered

| Option                                  |        Decision | Reason                                                                           |
| --------------------------------------- | --------------: | -------------------------------------------------------------------------------- |
| Keep `/products` canonical              |        SELECTED | Runtime and authority OpenAPI already align.                                     |
| Rename runtime to `/nashir-products`    |        REJECTED | Would create unnecessary runtime churn and contradict current authority OpenAPI. |
| Add alias routes for `/nashir-products` | REJECTED for V1 | Alias routes increase ambiguity and need separate compatibility justification.   |
| Edit OpenAPI to `/nashir-products`      |        REJECTED | No current authority evidence requires this.                                     |
| Defer naming decision                   |        REJECTED | Evidence is sufficient: runtime and OpenAPI agree on `/products`.                |

---

## 5. Canonical Naming Decision

Canonical V1 product API routes:

```text
GET  /workspaces/{workspaceId}/products
POST /workspaces/{workspaceId}/products
GET  /workspaces/{workspaceId}/products/{productId}
PUT  /workspaces/{workspaceId}/products/{productId}
```

Non-canonical route names:

```text
/workspaces/{workspaceId}/nashir-products
/workspaces/{workspaceId}/nashir-products/{productId}
```

---

## 6. Required Follow-up

A later documentation-only cleanup may update stale planning references that imply `/nashir-products` is expected or canonical.

That cleanup must not alter:

```text
runtime routes
OpenAPI authority
generated types
SQL/migrations
UI
CI workflow
```

---

## 7. Risks

| Risk                                                         | Severity | Decision                          |
| ------------------------------------------------------------ | -------: | --------------------------------- |
| Treating stale `/nashir-products` planning text as authority |     HIGH | Rejected by this decision.        |
| Renaming runtime despite OpenAPI/runtime alignment           |     HIGH | NO-GO.                            |
| Adding aliases without compatibility need                    |   MEDIUM | NO-GO for V1.                     |
| Leaving stale docs unmarked                                  |   MEDIUM | Allow documentation-only cleanup. |
| Reintroducing `marketing-os/ui/nashir` as UI consumer        |     HIGH | NO-GO.                            |

---

## 8. NO-GO Boundaries

```text
NO-GO: Runtime route changes.
NO-GO: OpenAPI edits.
NO-GO: Generated type regeneration.
NO-GO: SQL or migrations.
NO-GO: UI changes.
NO-GO: Static /nashir or /nashir/ Product UI serving.
NO-GO: Reintroducing marketing-os/ui/nashir as a UI consumer.
NO-GO: Adding /nashir-products alias routes in this gate.
NO-GO: Treating stale planning docs as contract authority.
NO-GO: Production or pilot readiness.
```

---

## 9. Decision

```text
GO: /workspaces/{workspaceId}/products is accepted as the canonical V1 product route family.
NO-GO: /workspaces/{workspaceId}/nashir-products as canonical V1 product route family.
NO-GO: Runtime, OpenAPI, generated type, migration, or UI changes from this decision.
```

---

## 10. Next Allowed Gate

```text
Backend Slice 0 Product Route Naming Stale Reference Cleanup Gate
```

Purpose:

* Update backend planning/review docs that imply `/nashir-products` is expected or canonical.
* Preserve `/products` as canonical.
* Keep all runtime/OpenAPI/generated/migration/UI changes blocked.
