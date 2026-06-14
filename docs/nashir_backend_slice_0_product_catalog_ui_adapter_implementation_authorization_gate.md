# Nashir Product Catalog UI Adapter Implementation Authorization Gate

| Field | Value |
|---|---|
| Gate type | Documentation-only UI adapter implementation authorization gate |
| Status | GO |
| Repository | `henter36/nashir-backend` |
| Implementation repository | `henter36/nashir` |
| Prior planning gate | Product Catalog UI Adapter Gap Resolution Planning Gate |
| Accepted backend route family | `/workspaces/{workspaceId}/products` |
| Implementation in this gate | NO |
| Backend runtime changes | NO |
| OpenAPI changes | NO |
| Generated types changes | NO |
| SQL/migration changes | NO |
| Production readiness claimed | NO |

---

## 1. Final Decision

**GO.**

Authorize a later narrow Product Catalog UI Adapter Implementation Execution
Gate in `henter36/nashir`, provided that implementation remains strictly within
the boundaries defined by PR #140 and this authorization gate.

This gate does not implement anything. It does not authorize backend runtime
changes, OpenAPI edits, generated client/type regeneration, SQL/migrations,
aliases, broader runtime scope, or production readiness.

---

## 2. Inputs

| Input | Finding |
|---|---|
| PR #137 | Accepted the current product runtime route family as a contract-aligned backend slice candidate for UI consumption planning. |
| PR #138 | Mapped ProductCatalogPage consumption to the accepted product routes and identified adapter gaps. |
| PR #139 | Accepted the integration map but blocked implementation authorization until adapter gaps were resolved. |
| PR #140 | Resolved the blocking status, pagination, allowlist, UI-only-field, idempotency, concurrency, delete/store-pull, and non-disclosure planning gaps. |
| Implementation ownership | The later UI adapter implementation belongs in `henter36/nashir`, not `henter36/nashir-backend`. |

---

## 3. Authorized Future Implementation Target

The later execution gate may authorize ProductCatalogPage adapter consumption
of only:

```text
GET  /workspaces/{workspaceId}/products
POST /workspaces/{workspaceId}/products
GET  /workspaces/{workspaceId}/products/{productId}
PUT  /workspaces/{workspaceId}/products/{productId}
```

No other route family or operation is authorized.

---

## 4. Authorized Adapter Scope

| Scope | Authorization boundary |
|---|---|
| UI surface | ProductCatalogPage adapter consumption only. |
| List response | Consume `ProductListResponse.products`, `count`, `hasMore`, and `nextCursor`. |
| Item response | Consume `ProductResponse.product` for create, get, and update. |
| Identity | Map UI `id` to backend `productId`; never use product name as identity. |
| List state | Use `limit=50`, first-page/load-more behavior, retained cursor, and `hasMore` continuation. |
| Search | Search loaded products only and label it as loaded-data search. |
| Summary cards | Derive from loaded products only and label them as loaded-data summaries. |
| Create | Use the strict create request allowlist and PR #140 idempotency-key lifecycle. |
| Update | Use the strict update request allowlist, retained version, `If-Match`, and explicit conflict recovery. |
| Error handling | Preserve non-disclosing auth, permission, workspace, not-found, and conflict handling. |

---

## 5. Status Authorization Boundary

The first adapter slice may display backend statuses only as:

| Backend status | UI label | Authorized interaction |
|---|---|---|
| `draft` | `مسودة` | Display; metadata edit allowed through accepted update route. |
| `active` | `نشط` | Display; metadata edit allowed through accepted update route. |
| `archived` | `مؤرشف` | Display/select/read only; metadata editing disabled. |

```text
NO-GO: Status mutation control.
NO-GO: Sending status in create or update requests.
NO-GO: Mapping status to prototype ready/review/blocked lifecycle values.
NO-GO: Inferring campaign readiness from product status.
```

---

## 6. Request Allowlists

### 6.1 Create Body

Only these fields may be sent:

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

### 6.2 Update Body

Only changed values from these fields may be sent:

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

### 6.3 Never Sent

```text
id
workspaceId
productId
status
createdAt
updatedAt
version
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

`version` may be retained in adapter state only and sent through `If-Match`.

---

## 7. Idempotency Authorization Boundary

The later execution gate must require:

```text
Generate one opaque unique Idempotency-Key per valid create intent.
Reuse the same key and identical allowlisted body for retries of that intent.
Reuse both after ambiguous network or timeout responses.
Generate a new key only when body changes create a new intent.
Clear the key after a definitive successful create is consumed.
Do not silently generate a replacement key after idempotency conflict.
```

Backend idempotency remains authoritative.

---

## 8. Concurrency Authorization Boundary

The later execution gate must require:

```text
Retain product.version from every accepted product response.
Capture the edit-start version.
Send If-Match with the retained numeric version.
Do not send version in the request body.
On 409, preserve the draft and do not overwrite or automatically retry.
Refresh through the accepted get route.
Require user review/reapply before retry with the refreshed version.
Replace local state with ProductResponse.product after success.
```

---

## 9. UI-Only Field Boundary

UI-only values must remain separate from contract-backed state. They must not
be sent, invented as backend response fields, or represented as persisted
backend truth.

Across load, edit, refresh, navigation, failed save, and successful save, the
later execution gate must preserve the lifecycle decisions from PR #140:

```text
Load contract-backed state from accepted responses.
Build requests only from strict allowlists.
Preserve allowlisted drafts after failed save.
Replace contract-backed state from ProductResponse.product after successful save.
Reset or recompute UI-only presentation values without claiming persistence.
```

---

## 10. Disabled And Unwired Actions

```text
Delete remains disabled/unwired.
Store pull remains disabled/unwired.
No delete route is authorized.
No archive route or status mutation route is authorized.
No store import or Store runtime is authorized.
```

The later execution gate must treat any attempt to wire these actions as a
blocking scope violation.

---

## 11. Non-Disclosing Handling

The later execution gate must preserve:

| Response class | Required boundary |
|---|---|
| Authentication error | Generic authentication/session handling without resource or workspace disclosure. |
| Permission error | Generic insufficient-permission handling without alternate-route probing. |
| Workspace boundary failure | Generic unavailable/not-authorized handling without cross-workspace inference. |
| Not found | Generic product unavailable/not-found handling without distinguishing hidden cross-workspace resources. |
| Conflict | Accepted conflict/recovery flow only, without hidden-state inference. |

Backend ErrorModel meaning and correlation identifiers must remain intact.

---

## 12. Authorization Review

| Criterion | Result | Finding |
|---|---:|---|
| Adapter target is narrow | PASS | ProductCatalogPage consumption only. |
| Backend routes are accepted | PASS | Only accepted list/create/get/update product routes are in scope. |
| Status semantics are bounded | PASS | Direct display only; no mutation or readiness inference. |
| Pagination behavior is defined | PASS | First page plus load more with partial-data labels. |
| Request bodies are bounded | PASS | Strict create/update allowlists are defined. |
| UI-only fields are bounded | PASS | Never sent or represented as persisted backend truth. |
| Create idempotency is defined | PASS | Key lifecycle and ambiguous retry behavior are explicit. |
| Update concurrency is defined | PASS | Version retention, `If-Match`, and conflict recovery are explicit. |
| Delete/store pull are excluded | PASS | Both remain disabled/unwired. |
| Non-disclosure is defined | PASS | Auth/workspace/RBAC/not-found/conflict boundaries are explicit. |

No remaining blocking gap prevents opening the later narrow execution gate.

---

## 13. Hard Blocks

```text
NO-GO: Implementation in this authorization gate.
NO-GO: Backend runtime changes.
NO-GO: OpenAPI edits.
NO-GO: Generated client or generated type regeneration.
NO-GO: SQL or migrations.
NO-GO: Package or lockfile changes.
NO-GO: CI/CD changes.
NO-GO: /nashir-products aliases.
NO-GO: Delete route.
NO-GO: Archive or status mutation route.
NO-GO: Store import or Store runtime.
NO-GO: Campaign, Publishing, Analytics, Evidence, Readiness, or Agents runtime.
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
GO: A later Product Catalog UI Adapter Implementation Execution Gate may proceed in henter36/nashir within the exact authorized scope.
NO-GO: Implementation in this gate.
NO-GO: Backend runtime, OpenAPI/generated, SQL/migration, alias, broader runtime, or production readiness work.
```

---

## 16. Next Gate

```text
Product Catalog UI Adapter Implementation Execution Gate
```

Purpose:

* Implement only the authorized ProductCatalogPage adapter scope in `henter36/nashir`.
* Consume only the accepted list/create/get/update product routes.
* Preserve strict request allowlists, pagination, idempotency, concurrency, disabled/unwired actions, and non-disclosing handling.
* Keep all backend runtime, contract, database, broader runtime, and production readiness work blocked.
