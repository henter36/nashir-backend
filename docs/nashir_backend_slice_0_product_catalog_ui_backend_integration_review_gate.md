# Nashir Product Catalog UI Backend Integration Review Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only UI/backend integration review gate |
| Status | GO with further planning required |
| Repository | `henter36/nashir-backend` |
| Reviewed gate | Product Catalog UI Backend Integration Planning Gate |
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

**GO for the planning gate as a documentation-only integration map.**

The Product Catalog UI Backend Integration Planning Gate correctly maps the
accepted product route family, response envelopes, identity, idempotency,
concurrency, and security boundaries.

**NO-GO for Product Catalog UI Adapter Implementation Authorization.**

Further planning is required before implementation authorization because the
status vocabulary, paginated-list UX, and unsupported-field treatment remain
unresolved. These gaps must not be silently decided by an adapter.

This review does not authorize UI implementation, backend runtime changes,
OpenAPI edits, generated client/type regeneration, SQL/migrations, aliases,
broader runtime scope, or production readiness.

---

## 2. Inputs

| Input | Finding |
|---|---|
| PR #138 | Added the documentation-only Product Catalog UI/backend integration planning map. |
| Product Catalog UI authority | `henter36/nashir/src/pages/ProductCatalogPage.jsx` and `src/utils/productCatalogStore.js` remain the functional UI source of truth. |
| Accepted backend route family | List/create/get/update product routes remain accepted under `/workspaces/{workspaceId}/products`. |
| Accepted response contract | List uses `ProductListResponse`; create/get/update use `ProductResponse`. |
| Backend security boundary | Workspace context, product permissions, non-disclosure, create idempotency, update concurrency, and mutation audit remain backend-owned. |

---

## 3. Documentation-Only Review

| Criterion | Result | Finding |
|---|---:|---|
| Planning gate changes implementation | PASS | PR #138 changed documentation and a narrow README governance status only. |
| Planning gate authorizes implementation | PASS | It explicitly blocks UI implementation and all runtime/contract/database changes. |
| Planning gate expands runtime scope | PASS | Store, Campaign, Publishing, Analytics, Evidence, Readiness, and Agents runtime remain blocked. |
| Planning gate introduces alias routes | PASS | `/nashir-products` remains non-canonical and blocked. |

---

## 4. Query Naming Review

| Query parameter | Result | Finding |
|---|---:|---|
| `updatedAfter` | PASS | The planning gate uses exactly `updatedAfter`, matching `ListProductsQuerystring`, handler validation, repository input, tests, and the accepted OpenAPI contract. |

Alternative spellings such as `updated_after`, `updated-after`, or
`updatedSince` are not accepted.

---

## 5. Adapter Mapping Review

| Mapping | Result | Review finding |
|---|---:|---|
| UI `id` to backend `productId` | PASS | Explicit adapter rename is required; product name must never become identity. |
| `ProductListResponse.products` | PASS | UI list data must be read from `products`, not from a bare response array. |
| `ProductListResponse.count` | PASS | Count is contract metadata and must not be inferred only from the currently loaded page. |
| `ProductListResponse.hasMore` | PASS | Required for paginated-list behavior. |
| `ProductListResponse.nextCursor` | PASS | Nullable cursor must be retained for subsequent list requests. |
| `ProductResponse.product` | PASS | Create/get/update results must be read from `product`, not as bare product objects. |
| Product `version` retention | PASS | Adapter state must retain the backend version used for optimistic concurrency. |
| Create `Idempotency-Key` | PASS | Every create intent requires an idempotency key; UI must not reimplement backend idempotency. |

---

## 6. Unresolved Gap Review

| Gap | Result | Review decision |
|---|---:|---|
| Status vocabulary mismatch | BLOCKING | Backend `draft/active/archived` cannot be silently mapped to UI `draft/ready/review/blocked`; lifecycle and presentation semantics require an explicit planning decision. |
| Paginated API vs full in-memory UI list | BLOCKING | Define initial load, load-more/continuation, refresh, search, selection, and summary-card behavior before implementation. |
| Unsupported UI fields | BLOCKING | Define which fields remain UI-derived/presentation-only and how they survive refresh without being silently sent or represented as persisted backend data. |
| Delete action without accepted route | PASS WITH BOUNDARY | Delete must remain unwired/disabled; implementation authorization must exclude it. |
| Store-pull action without accepted route | PASS WITH BOUNDARY | Store pull must remain unwired/disabled; Store runtime remains out of scope. |
| Create idempotency | PASS WITH REQUIRED PLAN | Specify key generation, reuse on retry, and reset after a completed create intent before implementation. |
| Update optimistic concurrency | PASS WITH REQUIRED PLAN | Specify retained version, accepted header choice, conflict handling, and refresh/retry UX before implementation. |
| Non-disclosing workspace/RBAC behavior | PASS WITH REQUIRED BOUNDARY | UI must preserve backend responses and must not probe, reinterpret, or disclose cross-workspace existence. |

---

## 7. Required Further Planning

The next planning gate must resolve:

```text
1. Exact display/interaction treatment for backend draft, active, and archived statuses.
2. Exact paginated-list state model and ProductCatalogPage loading behavior.
3. Exact allowlist of fields sent in create and update requests.
4. Exact treatment of UI-only fields across load, edit, refresh, and navigation.
5. Idempotency-key lifecycle for one create intent and retries.
6. Version retention, concurrency header choice, and 409 conflict UX.
7. Disabled/unwired treatment for delete and store-pull actions.
8. Non-disclosing handling for auth, permission, workspace, and not-found responses.
```

These decisions must not change the accepted backend contract or invent new
runtime capabilities.

---

## 8. Risk Review

| Risk | Severity | Decision |
|---|---:|---|
| UI treats planning/review as implementation approval | HIGH | NO-GO; implementation authorization is not granted. |
| Status mapping changes lifecycle semantics | HIGH | Block implementation until explicitly resolved. |
| Pagination loads partial data while UI presents full-catalog stats/search | HIGH | Block implementation until UX/state behavior is resolved. |
| Unsupported UI fields drift into request or response contracts | HIGH | Require explicit request allowlist and UI-only-field treatment. |
| Delete or store-pull actions expand runtime scope | HIGH | Keep unwired/disabled. |
| Route alias drift introduces `/nashir-products` | HIGH | NO-GO; `/products` remains canonical. |
| Workspace/RBAC handling discloses existence | HIGH | Preserve backend non-disclosing behavior without UI inference. |

---

## 9. NO-GO Boundaries

```text
NO-GO: UI implementation.
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

## 10. Verification Commands

```bash
npm test
npm run typecheck
npm run lint
NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts
git diff --check
```

---

## 11. Decision

```text
GO: Accept PR #138 as a documentation-only Product Catalog UI/backend integration planning map.
GO: Proceed to focused adapter gap-resolution planning.
NO-GO: Product Catalog UI Adapter Implementation Authorization at this stage.
NO-GO: UI implementation, runtime changes, OpenAPI/generated changes, SQL/migrations, aliases, broader runtime scope, or production readiness.
```

---

## 12. Next Gate

```text
Product Catalog UI Adapter Gap Resolution Planning Gate
```

Purpose:

* Resolve status presentation without redefining backend lifecycle semantics.
* Define paginated-list state and ProductCatalogPage UX.
* Define request field allowlists and UI-only-field treatment.
* Define create idempotency and update concurrency behavior.
* Preserve disabled/unwired delete and store-pull actions.
* Preserve non-disclosing handling for auth, permission, workspace, and not-found responses.
* Decide whether a narrow Product Catalog UI Adapter Implementation Authorization Gate may proceed.
