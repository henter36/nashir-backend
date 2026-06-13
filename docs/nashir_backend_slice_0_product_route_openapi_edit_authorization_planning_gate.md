# Nashir Backend Slice 0 — Product Route OpenAPI Edit Authorization Planning Gate

## 1. Gate Name

Backend Slice 0 Product Route OpenAPI Edit Authorization Planning Gate

## 2. Gate Type

OpenAPI edit authorization planning gate.

This gate is documentation-only.

It does not authorize direct OpenAPI edits, runtime implementation, generated client regeneration, SQL migrations, auth changes, permission guard changes, workspace context changes, request context parsing changes, package changes, CI workflow changes, UI work, or deployment work.

## 3. Purpose

This gate decides whether the contract drift found in the Product Route OpenAPI Authority Comparison Evidence Gate should proceed to an OpenAPI edit proposal gate.

The evidence gate found drift between the accepted runtime product route behavior and the pinned external OpenAPI authority.

This gate does not edit `docs/nashir_v1_openapi.yaml`.

This gate does not copy authority files into the backend repository.

This gate does not regenerate clients.

This gate does not change runtime code.

## 4. Inputs

### 4.1 Latest Accepted Evidence Gate

- `docs/nashir_backend_slice_0_product_route_openapi_authority_comparison_evidence_gate.md`
- Decision: GO to Backend Slice 0 Product Route OpenAPI Edit Authorization Planning Gate.

### 4.2 Evidence Summary

The Evidence Gate identified:

- Product route presence is aligned.
- Workspace scoping metadata is aligned.
- Permission metadata is aligned.
- Create request body is materially aligned.
- Update request body is materially aligned.
- Idempotency header is aligned.
- Optimistic concurrency headers are aligned.
- Product response envelopes have contract drift.
- Product list response envelope has contract drift.
- Product list `limit` requiredness has contract drift.
- ErrorModel needs follow-up verification during the OpenAPI edit proposal work.

## 5. Confirmed Drift Items

### 5.1 Product Item Response Envelope Drift

Runtime item operations currently return:

```text
{ product }
```

OpenAPI authority currently represents product item responses through `ProductResponse`, which requires:

```text
data
warnings
```

Affected operations:

- `POST /workspaces/{workspaceId}/products`
- `GET /workspaces/{workspaceId}/products/{productId}`
- `PUT /workspaces/{workspaceId}/products/{productId}`

Classification:

- Contract drift.

### 5.2 Product List Response Envelope Drift

Runtime list operation currently returns:

```text
{ products, count, hasMore, nextCursor }
```

OpenAPI authority currently represents product list responses through `ProductListResponse`, which requires:

```text
data
meta
warnings
```

Affected operation:

- `GET /workspaces/{workspaceId}/products`

Classification:

- Contract drift.

### 5.3 Product List `limit` Requiredness Drift

Runtime list handling requires a valid `limit`.

OpenAPI authority currently references `LimitQuery`, which is optional and has a default.

Affected operation:

- `GET /workspaces/{workspaceId}/products`

Classification:

- Contract drift.

Important constraint:

- Global mutation of shared `LimitQuery` is not authorized by this gate because it may affect other list endpoints.
- Any `limit` correction must be scoped specifically to the product list operation unless a later authority-wide pagination policy gate approves a shared change.

## 6. Logical Conflict Review

There is a governance tension:

- The project uses an external OpenAPI authority.
- Normally, runtime should conform to the authority contract.
- However, the runtime product route foundation has already been accepted by prior gates and tested.
- The Evidence Gate selected OpenAPI edit authorization planning as the next safe step rather than immediate runtime correction.

Resolution for this gate:

- This gate may authorize planning of a narrow OpenAPI edit proposal.
- This gate does not approve the edit itself.
- The next gate must still decide whether to actually edit the authority OpenAPI or redirect to runtime correction.

## 7. Proposed OpenAPI Edit Authorization Scope

The next gate may propose only the following authority OpenAPI changes.

### 7.1 ProductResponse Candidate

Authorized for proposal:

- Align `ProductResponse` with accepted runtime shape for product item operations.

Candidate target shape:

```yaml
ProductResponse:
  type: object
  required:
    - product
  properties:
    product:
      $ref: "#/components/schemas/Product"
```

Not authorized in this gate:

- Changing unrelated response schemas.
- Changing all API response envelope policy.
- Adding client-generation changes.
- Changing runtime responses.

### 7.2 ProductListResponse Candidate

Authorized for proposal:

- Align `ProductListResponse` with accepted runtime list shape.

Candidate target shape:

```yaml
ProductListResponse:
  type: object
  required:
    - products
    - count
    - hasMore
  properties:
    products:
      type: array
      items:
        $ref: "#/components/schemas/Product"
    count:
      type: integer
      minimum: 0
    hasMore:
      type: boolean
    nextCursor:
      type: string
      nullable: true
```

Not authorized in this gate:

- Changing unrelated list response schemas.
- Changing `PaginationMeta` globally.
- Removing pagination concepts from other endpoints.
- Generated client regeneration.

### 7.3 Product List Limit Requiredness Candidate

Authorized for proposal:

- Resolve product list `limit` drift without changing the shared `LimitQuery` globally.

Allowed proposal options:

| Option | Description | Status |
| :--- | :--- | :--- |
| Product-specific inline `limit` parameter | Replace the product list reference to `LimitQuery` with an operation-local required `limit` parameter. | Allowed for proposal |
| Product-specific `ProductLimitQuery` component | Add a product-scoped required parameter and use it only for product list. | Allowed for proposal if inline parameter is rejected |
| Global `LimitQuery` required change | Change the shared `LimitQuery` to required. | Not authorized by this gate |
| Runtime correction | Make runtime list `limit` optional to match authority default. | Requires a separate runtime correction planning gate |

Recommended proposal path:

- Prefer operation-local required `limit` parameter for product list only.
- Do not mutate shared `LimitQuery` globally.

## 8. ErrorModel Follow-Up Scope

The next gate must verify shared error response schemas before any OpenAPI edit.

Required checks:

- `BadRequest`
- `ValidationFailed`
- `Conflict`
- `PermissionDenied`
- `NotFound`
- `DefaultError`
- `ErrorModel`

The next gate may propose ErrorModel changes only if the product runtime error body and OpenAPI ErrorModel materially diverge.

This gate does not authorize ErrorModel edits directly.

## 9. Next Gate Requirements

The next gate must be:

Backend Slice 0 Product Route OpenAPI Edit Proposal Gate

Required outputs:

- Exact authority repository path used.
- Exact authority SHA used.
- Exact OpenAPI file path.
- Current `ProductResponse` schema excerpt.
- Current `ProductListResponse` schema excerpt.
- Current product list `limit` parameter excerpt.
- Proposed OpenAPI YAML diff plan.
- Blast-radius review for shared components.
- Confirmation that generated clients remain blocked.
- Confirmation that runtime code remains unchanged.
- Decision:
  - GO to OpenAPI authority edit execution, or
  - GO to runtime correction planning, or
  - NO-GO.

## 10. Not Authorized

This gate does not authorize:

- Editing `docs/nashir_v1_openapi.yaml`.
- Committing to the authority repository.
- Runtime code changes.
- Generated client regeneration.
- SQL migrations.
- Product route expansion.
- ErrorModel edits.
- Pagination policy changes across all endpoints.
- CI changes.
- UI changes.
- Deployment work.

## 11. Risks

| Risk | Status | Control |
| :--- | :--- | :--- |
| Changing authority to match runtime may weaken contract-first governance | Open | Next gate must explicitly compare authority-first vs runtime-accepted options. |
| Shared `LimitQuery` mutation may affect unrelated endpoints | Controlled | This gate blocks global `LimitQuery` changes. |
| Product response envelope change may conflict with broader API envelope policy | Open | Next gate must perform blast-radius review. |
| Generated clients may drift | Controlled | Generated client regeneration remains blocked. |
| OpenAPI edit may be applied before authorization | Controlled | This gate does not authorize direct edit. |

## 12. Decision

Decision: GO to Backend Slice 0 Product Route OpenAPI Edit Proposal Gate.

Rationale:

The Evidence Gate established product-route contract drift. A narrow OpenAPI edit proposal is the next safe planning step, but the actual authority OpenAPI edit must remain blocked until a proposal gate reviews the exact YAML diff and blast radius.

## 13. Transition Control

Do not edit OpenAPI yet.

Do not regenerate clients.

Do not change runtime code.

Do not add migrations.

Do not expand product routes.

A separate OpenAPI Edit Proposal Gate is required before any authority repository edit.
