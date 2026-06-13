# Backend Slice 0 Product Routes UI Consumer Contract Review Gate

| Field | Value |
|---|---|
| Gate type | Backend Slice 0 product routes / UI consumer contract review gate |
| Status | GO |
| Repository | `henter36/nashir-backend` |
| UI authority | `henter36/nashir` |
| Approved Product UI | 23-page Arabic React UI |
| Review scope | Runtime route inventory vs approved UI-consumer contract expectations |
| Runtime changes | NO |
| OpenAPI changes | NO |
| Generated types changes | NO |
| SQL/migration changes | NO |
| UI changes | NO |
| Production readiness claimed | NO |

---

## 1. Final Decision

**GO.**

This review confirms that Backend Slice 0 may continue to a narrow route-contract decision gate, but it also identifies a material naming/alignment gap between previously planned route-family labels and the current backend runtime product routes.

This review does not authorize implementation.

---

## 2. Inputs

| Input | Finding |
|---|---|
| PR #186 in `henter36/nashir` | Merged; confirms `henter36/nashir` is the only approved Nashir Product UI source. |
| PR #130 in `henter36/nashir-backend` | Merged; accepts post-UI-authority backend reconciliation. |
| PR #131 in `henter36/nashir-backend` | Merged; planned this route/UI-consumer contract review. |
| `src/app.ts` | Registers `productPlugin` only when product, idempotency, and audit repositories are all available. |
| `src/products/product-route.ts` | Defines current product runtime paths as `/workspaces/:workspaceId/products` and `/workspaces/:workspaceId/products/:productId`. |
| UI file scan | No frontend/Product UI files found in backend. |
| Forbidden UI target scan | No evidence of static `/nashir` Product UI serving from backend. |

---

## 3. Evidence Summary

### 3.1 Backend UI file absence

Observed result:

```text
backend-ui-file-scan.txt = 0
```

Interpretation:

```text
PASS: no frontend/Product UI files are present in nashir-backend.
```

### 3.2 Product plugin registration

Current backend app registers product routes through `productPlugin` only when all required repositories exist:

```text
productRepository
idempotencyRepository
auditRepository
workspaceContextGuardHook
```

Interpretation:

```text
PASS: product route activation is dependency-gated and remains backend/runtime only.
```

### 3.3 Current runtime product route paths

Current product route constants are:

```text
/workspaces/:workspaceId/products
/workspaces/:workspaceId/products/:productId
```

Current methods registered:

```text
GET  /workspaces/:workspaceId/products
POST /workspaces/:workspaceId/products
GET  /workspaces/:workspaceId/products/:productId
PUT  /workspaces/:workspaceId/products/:productId
```

Interpretation:

```text
PASS: product runtime routes exist.
FINDING: current runtime uses /products, not /nashir-products.
```

---

## 4. Route Family Inventory

| Route family | Runtime status | Evidence | UI consumer candidate | Review finding |
|---|---:|---|---|---|
| `/workspaces/:workspaceId/products` | Implemented | `src/products/product-route.ts` | `productCatalog`, `storeSetup`, `productIntelligence`, `creatorStudio` | Runtime exists under `/products`, not `/nashir-products`. |
| `/workspaces/:workspaceId/products/:productId` | Implemented | `src/products/product-route.ts` | `productCatalog`, `productIntelligence`, `creatorStudio`, `contentReview` | Runtime exists under `/products/:productId`, not `/nashir-products/{productId}`. |
| `/workspaces/{workspaceId}/nashir-products` | Not observed in runtime | Planning docs only | Same product UI consumers | Naming/alignment gap. Requires decision gate before edits. |
| `/workspaces/{workspaceId}/nashir-store-profile` | Not observed in runtime from current review evidence | Planning docs only | `storeSetup`, `settings` | Defer; do not implement in this review. |
| `/workspaces/{workspaceId}/nashir-campaigns` | Not observed in runtime from current review evidence | Planning docs only | `campaigns`, `campaignsList`, `creatorStudio`, `publishingQueue`, `analytics` | Defer; do not implement in this review. |
| `/workspaces/{workspaceId}/nashir-campaigns/{id}/readiness` | Not observed in runtime from current review evidence | Planning docs only | `productIntelligence`, `creatorStudio`, `contentReview` | Defer; readiness remains outside current product runtime. |
| `/workspaces/{workspaceId}/nashir-campaigns/{id}/evidence` | Not observed in runtime from current review evidence | Planning docs only | `creatorStudio`, `contentReview` | Defer; evidence lifecycle is not authorized here. |

---

## 5. UI Consumer Mapping

| UI screen | Runtime route currently usable | Gap |
|---|---|---|
| `productCatalog` | `/workspaces/:workspaceId/products`, `/workspaces/:workspaceId/products/:productId` | Need confirm UI contract expects `/products` or `/nashir-products`. |
| `storeSetup` | Product routes may support product setup only | Store profile route not observed in runtime evidence. |
| `productIntelligence` | Product read/list may support inventory context | Readiness/intelligence routes are not authorized here. |
| `creatorStudio` | Product read/list may support product selection | Campaign/content generation routes deferred. |
| `contentReview` | Product read may support context | Review workflow route not observed. |
| `campaigns` | No campaign runtime route observed in this review evidence | Campaign routes deferred. |
| `campaignsList` | No campaign runtime route observed in this review evidence | Campaign routes deferred. |
| `publishingQueue` | No publishing runtime route observed | Publishing runtime remains NO-GO. |
| `analytics` | No analytics runtime route observed | Analytics runtime remains NO-GO. |
| `settings` | No store/settings API route observed | Settings backend contract deferred. |

---

## 6. Contract Alignment Findings

| Area | Status | Finding |
|---|---:|---|
| Runtime product routes | Implemented | Four product routes are registered by `productPlugin`. |
| Runtime route naming | Gap | Runtime uses `/products`; planning docs referenced `/nashir-products`. |
| OpenAPI authority alignment | Unresolved | Must be checked in a later decision gate before any route rename or OpenAPI edit. |
| Generated types alignment | Unresolved | Must be checked after OpenAPI authority decision. |
| Permission guard | Present | Present in route-handler planning chain, but must be verified route-by-route in next decision gate. Do not assume complete UI-consumer permission coverage from this review alone. |
| Workspace boundary | Present | Product plugin receives `workspaceContextGuardHook`; route-level behavior must remain verified by tests. Keep as required V1 boundary. |
| Idempotency | Required | Required for create path; repository dependency gates route registration. Preserve for write routes. |
| Audit | Required | Required for create/update path; repository dependency gates route registration. Preserve for mutation routes. |

---

## 7. Main Risk

| Risk | Severity | Decision |
|---|---:|---|
| Treating `/nashir-products` as implemented when runtime actually uses `/products` | HIGH | Must be corrected by a later contract decision gate. |
| Renaming runtime routes without OpenAPI/generated/UI decision | HIGH | NO-GO. |
| Editing OpenAPI before deciding whether authority should use `/products` or `/nashir-products` | HIGH | NO-GO. |
| Expanding into campaign/store/readiness/evidence runtime routes from this review | HIGH | NO-GO. |
| Confusing valid backend API routes with static `/nashir` Product UI serving | MEDIUM | Keep distinction explicit. |

---

## 8. NO-GO Boundaries

```text
NO-GO: Runtime route changes in this review.
NO-GO: OpenAPI edits in this review.
NO-GO: Generated type regeneration in this review.
NO-GO: SQL or migrations in this review.
NO-GO: UI changes in this review.
NO-GO: Static /nashir or /nashir/ Product UI serving.
NO-GO: Reintroducing marketing-os/ui/nashir as a UI consumer.
NO-GO: Adding store profile, campaign, readiness, evidence, publishing, analytics, or agents runtime routes from this review.
NO-GO: Renaming /products to /nashir-products without a dedicated route naming authority decision.
```

---

## 9. Decision

```text
GO: Continue to a dedicated Product Route Naming / Authority Alignment Decision Gate.
NO-GO: Implementation, OpenAPI, generated types, migrations, UI, or runtime changes from this review.
```

---

## 10. Next Allowed Gate

```text
Backend Slice 0 Product Route Naming / Authority Alignment Decision Gate
```

Purpose:

- Decide whether V1 backend authority should preserve `/workspaces/{workspaceId}/products` or move toward `/workspaces/{workspaceId}/nashir-products`.
- Compare runtime, OpenAPI authority, generated types, and approved `henter36/nashir` UI expectations.
- Choose the next narrow action:
  - accept `/products` as canonical;
  - authorize an OpenAPI authority edit;
  - authorize a runtime route rename/alias plan;
  - or defer route naming changes.
