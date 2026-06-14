# Nashir Product Catalog UI Backend Integration Planning Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only UI/backend integration planning gate |
| Status | GO |
| Repository | `henter36/nashir-backend` |
| UI authority repository | `henter36/nashir` |
| UI source of truth | `src/pages/ProductCatalogPage.jsx` |
| Accepted backend route family | `/workspaces/{workspaceId}/products` |
| UI implementation | NO |
| Runtime changes | NO |
| OpenAPI changes | NO |
| Generated types changes | NO |
| SQL/migration changes | NO |
| Production readiness claimed | NO |

---

## 1. Final Decision

**GO for Product Catalog UI/backend integration planning only.**

Map how the approved `henter36/nashir` Product Catalog UI may consume the
accepted Backend Slice 0 product routes. Preserve the Product Catalog UI as the
functional source of truth and the accepted OpenAPI/runtime contract as the API
boundary.

The planning review found UI adapter and capability gaps that require a later
integration review before any implementation authorization.

This gate does not authorize UI implementation, backend runtime changes,
OpenAPI edits, generated client regeneration, SQL/migrations, aliases, broader
runtime scope, or production readiness.

---

## 2. Inputs

| Input | Finding |
|---|---|
| PR #133 | Accepted `/workspaces/{workspaceId}/products` as canonical and rejected `/nashir-products` as canonical. |
| PR #134 | Cleaned stale `/nashir-products` documentation references. |
| PR #135 | Accepted the product route naming cleanup review. |
| PR #136 | Reviewed the existing product runtime routes against the accepted OpenAPI/generated contract. |
| PR #137 | Accepted the current product runtime route family as contract-aligned for Product Catalog UI consumption planning. |
| Product Catalog UI authority | `henter36/nashir/src/pages/ProductCatalogPage.jsx` and its current `productCatalogStore.js` mock behavior remain the functional UI source of truth. |
| Accepted backend route family | `GET/POST /workspaces/{workspaceId}/products` and `GET/PUT /workspaces/{workspaceId}/products/{productId}`. |

---

## 3. Outputs

This gate produces only:

```text
UI/backend integration planning map
ProductCatalogPage consumption assumptions
UI field-to-contract mapping
UI adapter and capability gap inventory
Auth/workspace/RBAC consumption assumptions
Risk review
Next review gate recommendation
```

Implementation remains blocked.

---

## 4. Accepted Backend Contract

| UI intent | Accepted route | Contract shape | Backend boundary |
|---|---|---|---|
| Load catalog | `GET /workspaces/{workspaceId}/products` | `ProductListResponse` | Requires `limit`; supports cursor, status, updatedAfter, and sort. |
| Add product metadata | `POST /workspaces/{workspaceId}/products` | `ProductResponse` | Requires manage permission and `Idempotency-Key`. |
| Load one product | `GET /workspaces/{workspaceId}/products/{productId}` | `ProductResponse` | Uses canonical `productId`. |
| Update product metadata | `PUT /workspaces/{workspaceId}/products/{productId}` | `ProductResponse` | Requires manage permission and optimistic-concurrency version header. |

The accepted slice does not provide delete/archive, store import, asset counts,
readiness/evidence, campaign creation, publishing, analytics, or agents
runtime.

---

## 5. ProductCatalogPage Consumption Assumptions

| Assumption | Planning decision |
|---|---|
| Initial catalog data | Replace local mock catalog reads only after a separate implementation authorization. |
| Product identity | UI adapter must map backend `productId` to the UI identity currently represented as `id`; names must never become identity. |
| List pagination | UI must plan for required `limit`, `hasMore`, and nullable `nextCursor`; current in-memory full-list behavior is not the backend contract. |
| Create | UI must plan an idempotency key per create intent and must not place `workspaceId` in the request body. |
| Update | UI must retain backend `version` and send the required concurrency header; current local overwrite behavior is insufficient. |
| Delete action | Current Product Catalog delete control has no accepted backend route and must remain mock/disabled or be separately planned. |
| Pull from store | Current simulated store pull has no accepted backend route and must not be wired by this slice. |
| Search and stats | Current client-side search and derived summary cards may remain UI-derived during planning, subject to list pagination limits. |
| Error handling | UI must consume backend non-disclosing auth/workspace/not-found behavior without attempting existence discovery. |

---

## 6. UI Field To Contract Mapping

### 6.1 Direct Or Narrow Adapter Mapping

| ProductCatalogPage field/use | Product contract field | Planning result |
|---|---|---|
| `id` | `productId` | Adapter rename required. |
| `name` | `name` | Direct. |
| `category` | `category` | Direct; UI fallback label is presentation-only. |
| `price` | `price` | Type adapter required: UI currently handles display strings; contract uses number or null. |
| `imageUrl` | `imageUrl` | Direct when valid URI; prototype file labels are not valid backend values. |
| `videoUrl` | `videoUrl` | Direct when valid URI; prototype file labels are not valid backend values. |
| `description` | `description` | Direct. |
| `status` | `status` | Semantic adapter/UX decision required; backend values are `draft`, `active`, and `archived`. |
| last-updated display | `updatedAt` | Direct presentation mapping. |
| concurrency state | `version` | Must be retained by adapter for update requests. |

### 6.2 Backend Fields Not Currently Owned By ProductCatalogPage

| Product contract field | Planning treatment |
|---|---|
| `workspaceId` | Context metadata only; never user-editable and never copied into create/update bodies. |
| `sku` | Optional future Product Catalog field; do not add UI in this gate. |
| `stockStatus` | Potential Product Catalog display/edit field; requires separate UI decision. |
| `createdAt` | Optional display metadata; no UI change authorized. |

### 6.3 Current UI Fields Without Accepted Product Route Fields

| ProductCatalogPage field/use | Planning treatment |
|---|---|
| `currency` | UI presentation default only; not persisted by accepted product contract. |
| `url` | No accepted product field; do not send silently. |
| `readiness` | Derived/readiness scope is not part of this accepted runtime slice. |
| `assets` | Asset count requires separate asset integration/runtime scope. |
| `source` | No accepted product field; remain UI-only until separately decided. |
| `flags` | No accepted product field; do not send silently. |
| `claims` | No accepted product field; do not send silently. |
| marketing priority and latest analysis | UI-derived prototype behavior only; no agents/readiness runtime is authorized. |

---

## 7. Response Shape Consumption

| Response | Required UI consumption |
|---|---|
| `ProductListResponse` | Read `products`, `count`, `hasMore`, and `nextCursor`; do not expect the response to be a bare array. |
| `ProductResponse` | Read the product from `product`; do not expect a bare product object. |

No UI adapter may invent fields in the backend response or treat UI-derived
fields as persisted contract fields.

---

## 8. Auth, Workspace, And RBAC Assumptions

The UI does not redefine backend security semantics.

| Boundary | Planning assumption |
|---|---|
| Authentication | Existing backend auth behavior remains authoritative. |
| Workspace identity | `workspaceId` is path-derived from the active workspace context. |
| Read permission | List/get consumption requires `nashir.products.read`. |
| Manage permission | Create/update consumption requires `nashir.products.manage`. |
| Disclosure | Unauthorized, cross-workspace, and not-found behavior remains non-disclosing. |
| Create idempotency | UI integration must supply `Idempotency-Key`; it must not reimplement backend idempotency. |
| Update concurrency | UI integration must supply the accepted version header using the product's retained `version`. |
| Audit | Backend owns required create/update audit behavior; the UI must not claim or emulate audit completion. |

---

## 9. Gap Inventory

| Gap | Severity | Planning decision |
|---|---:|---|
| UI `id` differs from contract `productId` | MEDIUM | Require explicit adapter mapping. |
| UI status vocabulary differs from backend status vocabulary | HIGH | Require review before implementation. |
| UI includes unsupported persisted fields | HIGH | Keep UI-only or remove from request mapping; require review. |
| Delete control has no accepted backend route | HIGH | Do not wire; require separate decision if needed. |
| Store pull control has no accepted backend route | HIGH | Do not wire; Store scope remains blocked. |
| UI assumes full in-memory list while API is paginated | MEDIUM | Define pagination/loading behavior in integration review. |
| Create requires idempotency and update requires version concurrency | HIGH | Adapter behavior must be reviewed before implementation. |
| README denied all product route authorization after PR #137 | MEDIUM | Correct governance status narrowly in this planning PR. |

---

## 10. Risk Review

| Risk | Severity | Decision |
|---|---:|---|
| Stale README or agent drift re-blocks accepted planning or overstates authorization | MEDIUM | Correct README narrowly; this gate remains planning-only. |
| UI treats planning as implementation approval | HIGH | NO-GO; implementation remains blocked. |
| Product Catalog expands into Store, Campaign, or Publishing | HIGH | NO-GO without dedicated gates. |
| Route alias drift introduces `/nashir-products` | HIGH | NO-GO; `/products` remains canonical. |
| Response-shape drift treats responses as bare product/list values | HIGH | Require `ProductResponse` and `ProductListResponse` adapter mapping. |
| Workspace/RBAC disclosure drift | HIGH | Backend semantics remain authoritative and must not be weakened by UI behavior. |

---

## 11. NO-GO Boundaries

```text
NO-GO: UI implementation.
NO-GO: Backend runtime changes.
NO-GO: OpenAPI edits.
NO-GO: Generated client or generated type regeneration.
NO-GO: SQL or migrations.
NO-GO: CI/CD changes.
NO-GO: /nashir-products aliases.
NO-GO: Store, Campaign, Publishing, Analytics, Evidence, Readiness, or Agents runtime.
NO-GO: Production or pilot readiness.
```

---

## 12. Verification Commands

```bash
npm test
npm run typecheck
npm run lint
NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts
git diff --check
```

---

## 13. Decision

```text
GO: Product Catalog UI/backend integration planning is accepted as the current activity.
GO: Map ProductCatalogPage consumption to the accepted /products route family.
NO-GO: UI implementation, runtime changes, OpenAPI edits, generated clients, SQL/migrations, aliases, broader runtime scope, or production readiness.
```

---

## 14. Next Gate

```text
Product Catalog UI Backend Integration Review Gate
```

Purpose:

* Review the proposed UI adapter mapping and unsupported-field treatment.
* Resolve the status-vocabulary, pagination, idempotency, and concurrency plans.
* Confirm delete and store-pull actions remain unwired.
* Decide whether a narrow Product Catalog UI Adapter Implementation Authorization Gate may proceed or whether blocking gaps require further planning.
