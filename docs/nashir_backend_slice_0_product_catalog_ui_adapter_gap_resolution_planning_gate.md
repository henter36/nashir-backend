# Nashir Product Catalog UI Adapter Gap Resolution Planning Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only UI adapter gap-resolution planning gate |
| Status | GO for later implementation authorization review |
| Repository | `henter36/nashir-backend` |
| Prior review | Product Catalog UI Backend Integration Review Gate |
| UI authority repository | `henter36/nashir` |
| Accepted backend route family | `/workspaces/{workspaceId}/products` |
| UI implementation | NO |
| Runtime changes | NO |
| OpenAPI changes | NO |
| Generated types changes | NO |
| SQL/migration changes | NO |
| Production readiness claimed | NO |

---

## 1. Final Decision

**GO for gap-resolution planning.**

This gate resolves the blocking Product Catalog UI adapter planning gaps
sufficiently for a later Product Catalog UI Adapter Implementation
Authorization Gate to review a narrow implementation scope.

This gate does not authorize implementation. It does not authorize UI changes,
backend runtime changes, OpenAPI edits, generated client/type regeneration,
SQL/migrations, aliases, broader runtime scope, or production readiness.

---

## 2. Inputs

| Input | Finding |
|---|---|
| PR #138 | Created the Product Catalog UI/backend integration planning map. |
| PR #139 | Accepted the planning map but blocked implementation authorization until focused adapter gaps were resolved. |
| UI authority | `henter36/nashir/src/pages/ProductCatalogPage.jsx` remains the Product Catalog functional source of truth. |
| Accepted backend contract | List/create/get/update product operations remain accepted under `/workspaces/{workspaceId}/products`. |
| Security boundary | Auth, workspace, RBAC, non-disclosure, idempotency, concurrency, and audit behavior remain backend-owned. |

---

## 3. Status Display And Interaction Decision

The first adapter slice must use backend statuses directly. It must not map
them to the prototype-only `ready`, `review`, or `blocked` values.

| Backend status | Display label | Interaction decision |
|---|---|---|
| `draft` | `مسودة` | Display as backend draft. Product metadata may be edited through the accepted update route. |
| `active` | `نشط` | Display as backend active. Do not label it “ready for campaigns”; product metadata may be edited. |
| `archived` | `مؤرشف` | Display and allow selection/read only. Disable Product Catalog metadata editing in the first adapter slice. |

Additional status decisions:

```text
Create requests omit status so backend default behavior remains authoritative.
Update requests omit status.
The first adapter slice exposes no status mutation control.
Campaign readiness must not be inferred from product status.
```

---

## 4. Paginated List State Model

| Concern | Exact planning decision |
|---|---|
| Initial load | Request `GET /workspaces/{workspaceId}/products?limit=50&sort=updatedAt:desc`. |
| Required limit | Use `limit=50` for every list request in the first adapter slice. |
| Cursor retention | Retain the latest successful nullable `nextCursor` with the loaded list state. |
| `hasMore` | Show continuation only when the latest successful response has `hasMore: true`. |
| `nextCursor` | Send it as `cursor` only for the next continuation request; never invent or transform it. |
| Load more | Append products from the next page, deduplicated by `productId`; preserve the first occurrence order. |
| Continuation failure | Keep already loaded products and the prior cursor; allow retry of the same continuation request. |
| Refresh | Discard loaded pages/cursor and reload the first page. Retain selection only if the selected `productId` exists in the refreshed first page; otherwise select the first result or none. |
| Search | Search only the currently loaded products. Label the result as search within loaded products; do not imply server-wide search. |
| Selection | Track selection by `productId`. Appending pages preserves selection. If a refreshed or replaced list omits the selected product, select the first loaded product or none. |
| Summary cards | Derive cards from loaded products only and label them as loaded-data summaries. Do not present partial values as full-catalog totals. |
| `count` | Preserve the response `count` as page-response metadata; do not reinterpret it as a full-catalog total unless the accepted contract later guarantees that meaning. |
| `updatedAfter` | Use exactly `updatedAfter` only if a later authorized UI interaction needs it; the first adapter slice does not require it. |

---

## 5. Request Allowlists

### 5.1 Create Request Allowlist

The adapter may send only:

```text
name
category
price
sku
stockStatus
imageUrl
videoUrl
description
```

Create must omit:

```text
workspaceId
productId
status
createdAt
updatedAt
version
```

### 5.2 Update Request Allowlist

The adapter may send only changed values from:

```text
name
category
price
sku
stockStatus
imageUrl
videoUrl
description
```

Update must omit:

```text
workspaceId
productId
status
createdAt
updatedAt
version
```

The retained `version` is sent only through the accepted concurrency header,
not in the request body.

### 5.3 UI Fields Never Sent

```text
id
currency
url
readiness
assets
source
flags
claims
marketing priority
latest analysis
prototype file-label values
```

Unsupported fields must not be added to backend response assumptions.

---

## 6. UI-Only Field Treatment

| Lifecycle point | Exact planning decision |
|---|---|
| Load | Map contract fields into adapter state. UI-only fields use explicit presentation defaults and are marked non-persisted. |
| Edit | Keep UI-only values separate from the persisted edit draft. Build requests exclusively from the allowlist. |
| Refresh | Replace contract-backed values from the backend. Reset UI-only derived/default values; never imply they were persisted. |
| Navigation | UI-only values may remain only in current in-memory UI state. They must not be treated as backend truth after remount/reload. |
| Failed save | Preserve the user's allowlisted edit draft for correction/retry. Preserve UI-only values separately without sending them. |
| Successful save | Replace contract-backed product state with `ProductResponse.product`, retain the returned `version`, and recompute/reset UI-only presentation values. |

Prototype-only readiness, assets, source, flags, claims, marketing priority,
and analysis must be visually identified as unavailable, derived, or
prototype-only if displayed. They must not appear as persisted backend data.

---

## 7. Create Idempotency Lifecycle

| Event | Exact planning decision |
|---|---|
| Start create intent | Generate one opaque unique idempotency key when the user first submits a valid new-product draft. |
| Request retry | Reuse the same key and identical allowlisted request body for retries of the same create intent. |
| User edits after request failure | Treat body changes as a new create intent and generate a new key before resubmission. |
| Completed `201` response | Clear the key after consuming `ProductResponse.product` and completing local state replacement. |
| Definitive validation/auth/permission failure before creation | Preserve the draft, but generate a new key only when a later changed body starts a new intent. |
| Ambiguous network/timeout response | Preserve the same key and identical body; retry must reuse both until a definitive result is received. |
| Idempotency conflict | Do not silently generate a replacement key and duplicate creation. Surface a non-disclosing conflict state and require explicit user recovery. |

The UI adapter supplies the key; backend idempotency remains authoritative.

---

## 8. Update Optimistic Concurrency

| Concern | Exact planning decision |
|---|---|
| Version retention | Retain `product.version` with each loaded product and replace it after every successful `ProductResponse.product`. |
| Header | Send `If-Match` with the retained numeric version. Do not send version in the body. |
| Stale edit | An edit draft records the version present when editing starts. |
| `409` conflict | Do not automatically overwrite or retry. Preserve the user's draft and show a conflict state without disclosing unrelated resource details. |
| Conflict refresh | Fetch the product again through the accepted get route. Present the refreshed product and require the user to review/reapply changes. |
| Retry after conflict | A retry is a new update attempt using the refreshed product version and an explicitly confirmed allowlisted draft. |
| Successful update | Replace local contract-backed state with `ProductResponse.product` and clear the edit/conflict state. |
| Not found during refresh/update | Handle as non-disclosing not-found; do not infer whether the product exists in another workspace. |

---

## 9. Delete And Store-Pull Boundaries

```text
Delete action remains disabled/unwired.
Store-pull action remains disabled/unwired.
No delete route is authorized.
No archive route or status mutation control is authorized.
No store import or Store runtime is authorized.
No fallback to /nashir-products aliases is authorized.
```

The implementation authorization gate, if opened later, must explicitly
exclude these actions.

---

## 10. Non-Disclosing Response Handling

| Response class | Exact UI handling |
|---|---|
| Authentication error | Show a generic authentication/session action. Do not expose resource existence or workspace details. |
| Permission error | Show a generic insufficient-permission state. Do not probe the same resource through alternate routes. |
| Workspace boundary failure | Show a generic unavailable/not-authorized state and return to the active workspace context. Do not infer cross-workspace existence. |
| Not found | Show generic product unavailable/not-found messaging. Do not distinguish absent from cross-workspace hidden resources. |
| Conflict | Show only the accepted conflict/recovery flow; do not infer hidden workspace or resource state. |

The UI must preserve backend ErrorModel meaning, correlation identifiers, and
non-disclosing behavior. It must not reinterpret response differences to
discover cross-workspace existence.

---

## 11. Gap Resolution Result

| Gap | Result | Decision |
|---|---:|---|
| Status vocabulary | RESOLVED FOR FIRST ADAPTER SLICE | Use read-only backend status presentation; no status mutation or readiness inference. |
| Pagination | RESOLVED FOR FIRST ADAPTER SLICE | Use first-page plus load-more model and label partial search/stats. |
| Request allowlists | RESOLVED | Strict create/update allowlists defined. |
| UI-only fields | RESOLVED FOR FIRST ADAPTER SLICE | Keep separate, non-persisted, and reset/recompute at defined lifecycle points. |
| Create idempotency | RESOLVED | One key per unchanged create intent; reuse on ambiguous retry. |
| Update concurrency | RESOLVED | Retain version, send `If-Match`, and require explicit conflict recovery. |
| Delete/store pull | RESOLVED BY BOUNDARY | Remain disabled/unwired and excluded. |
| Non-disclosure | RESOLVED BY BOUNDARY | Generic handling preserves backend authority without probing. |

---

## 12. Risks

| Risk | Severity | Decision |
|---|---:|---|
| Treating status labels as lifecycle redefinition | HIGH | Block status mutation and readiness inference. |
| Presenting partial pages as full catalog | HIGH | Require loaded-data labels for search and summaries. |
| Sending unsupported UI fields | HIGH | Enforce strict request allowlists. |
| Duplicate create after ambiguous response | HIGH | Reuse the same key and body. |
| Overwriting a concurrent update | HIGH | Require `If-Match` and explicit conflict recovery. |
| Delete/store-pull scope expansion | HIGH | Keep disabled/unwired. |
| Workspace/RBAC disclosure drift | HIGH | Preserve generic non-disclosing response handling. |

---

## 13. NO-GO Boundaries

```text
NO-GO: UI implementation in this gate.
NO-GO: Backend runtime changes.
NO-GO: OpenAPI edits.
NO-GO: Generated client or generated type regeneration.
NO-GO: SQL or migrations.
NO-GO: Package or lockfile changes.
NO-GO: CI/CD changes.
NO-GO: /nashir-products aliases.
NO-GO: Store, Campaign, Publishing, Analytics, Evidence, Readiness, or Agents runtime.
NO-GO: Production or pilot readiness.
```

---

## 14. Verification Commands

```bash
npm test
npm run typecheck
npm run lint
NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts
git diff --check
```

---

## 15. Decision

```text
GO: Blocking adapter gaps are sufficiently resolved for a later narrow Product Catalog UI Adapter Implementation Authorization Gate.
NO-GO: Implementation in this planning gate.
NO-GO: Runtime changes, OpenAPI/generated changes, SQL/migrations, aliases, broader runtime scope, or production readiness.
```

---

## 16. Next Gate

```text
Product Catalog UI Adapter Implementation Authorization Gate
```

Purpose:

* Review and authorize only the narrow Product Catalog UI adapter implementation described by this planning gate.
* Limit implementation to list/create/get/update consumption of the accepted product routes.
* Require strict request allowlists, first-page/load-more pagination, idempotency, concurrency, and non-disclosing handling.
* Keep status mutation, delete, store pull, broader runtime scope, and production readiness blocked.
