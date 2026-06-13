# Nashir Backend Slice 0 — OpenAPI Authority Pin Update / Reconciliation Gate

## 1. Gate Name

Backend Slice 0 OpenAPI Authority Pin Update / Reconciliation Gate

## 2. Gate Type

Authority pin update and reconciliation gate.

This gate updates the backend repository authority validation pin after the accepted authority OpenAPI edit was merged.

This gate does not authorize runtime implementation, generated client regeneration, SQL migrations, copied OpenAPI files, route expansion, CI workflow changes, UI work, or deployment work.

## 3. Purpose

This gate reconciles backend governance with the updated external OpenAPI authority commit.

The authority repository PR that aligned product route OpenAPI success response schemas and product list limit requiredness has been merged.

The backend repository must now update its pinned authority SHA so future contract authority validation uses the accepted authority commit.

## 4. Inputs

### 4.1 Previous Backend Gate

- `docs/nashir_backend_slice_0_product_route_openapi_edit_proposal_gate.md`
- Decision: GO to Backend Slice 0 Product Route OpenAPI Authority Edit Execution Gate.

### 4.2 Authority Execution Result

- Authority repository: `henter36/nashir`
- Authority PR: `#184`
- Authority merge commit: `13388d787f57e2d863eda960db6de497bd2efa6c`
- Modified authority file: `docs/nashir_v1_openapi.yaml`

### 4.3 Previous Backend Pin

```text
36da9ed31903562bddfb7ffd669841956e334a51
```

### 4.4 New Backend Pin

```text
13388d787f57e2d863eda960db6de497bd2efa6c
```

## 5. Changed Backend Files

Expected changed backend files:

- `scripts/validate-contract-authority.mjs`
- `docs/nashir_backend_slice_0_openapi_authority_pin_update_reconciliation_gate.md`

No backend OpenAPI copy is allowed.

No generated clients are allowed.

No runtime code changes are allowed.

## 6. Validation Evidence

Validation command:

```bash
node scripts/validate-contract-authority.mjs \
  --authority-repo "$NASHIR_AUTHORITY_REPO" \
  --authority-ref "13388d787f57e2d863eda960db6de497bd2efa6c"
```

Validation output:

```text
PASS: Authority repository path exists: /Users/mohammedalqudairi/workspace/nashir
PASS: Authority repository is a Git work tree: /Users/mohammedalqudairi/workspace/nashir
PASS: Authority ref 13388d787f57e2d863eda960db6de497bd2efa6c resolves to pinned SHA 13388d787f57e2d863eda960db6de497bd2efa6c
PASS: Authority file exists at pinned SHA: docs/nashir_v1_openapi.yaml
PASS: Authority file exists at pinned SHA: docs/nashir_auth_rbac_workspace_identity_gate.md
PASS: Authority file exists at pinned SHA: docs/nashir_auth_rbac_openapi_alignment_final_re_review_gate.md
PASS: Authority file exists at pinned SHA: docs/nashir_backend_slice_0_contract_safe_infrastructure_validation_action_gate.md
PASS: Copied authority file absent from backend: docs/nashir_v1_openapi.yaml
PASS: Copied authority file absent from backend: docs/nashir_auth_rbac_workspace_identity_gate.md
PASS: Copied authority file absent from backend: docs/nashir_auth_rbac_openapi_alignment_final_re_review_gate.md
PASS: Copied authority file absent from backend: docs/nashir_backend_slice_0_contract_safe_infrastructure_validation_action_gate.md
PASS: Generated client directory absent from backend: src/generated
PASS: Generated client directory absent from backend: generated
PASS: Generated client directory absent from backend: openapi-generated
PASS: Allowed CI workflow exists in backend: .github/workflows/ci.yml
PASS: Contract authority validation completed successfully.
```

## 7. Reconciliation Findings

| Check | Result | Decision |
| :--- | :--- | :--- |
| Authority SHA updated from previous pin | New pin is `13388d787f57e2d863eda960db6de497bd2efa6c` | Accepted |
| Authority OpenAPI exists at new pin | Verified by validator | Accepted |
| Required authority governance files exist at new pin | Verified by validator | Accepted |
| Backend copied OpenAPI file absent | Verified by validator | Accepted |
| Backend generated client directories absent | Verified by validator | Accepted |
| Runtime code unchanged | Required by gate scope | Accepted |
| SQL migrations unchanged | Required by gate scope | Accepted |

## 8. Generated Types Boundary

Generated types regeneration remains blocked in this gate.

Reason:

- The authority PR intentionally did not include generated TypeScript artifacts.
- This backend pin update only reconciles the authority pin.
- Generated client/type regeneration requires a separate authorization gate.

Recommended next gate:

- Backend Slice 0 Product Route OpenAPI Generated Types Regeneration Authorization Gate

## 9. Not Authorized

This gate does not authorize:

- Runtime code changes.
- Generated client regeneration.
- SQL migrations.
- OpenAPI copy into backend.
- Product route expansion.
- ErrorModel edits.
- Pagination policy changes.
- CI workflow changes.
- UI changes.
- Deployment work.

## 10. Risks

| Risk | Status | Control |
| :--- | :--- | :--- |
| Backend validator may reject the new authority SHA | Mitigated | Validation passed against the new pin. |
| Generated TypeScript types may be stale after authority edit | Open | Separate generated-types regeneration gate required. |
| Backend could accidentally copy authority OpenAPI | Controlled | Validator confirms copied authority files are absent. |
| Runtime could drift from updated authority | Controlled | Runtime was the basis for the accepted authority edit. |

## 11. Decision

Decision: GO to Backend Slice 0 Product Route OpenAPI Generated Types Regeneration Authorization Gate.

Rationale:

The backend authority pin has been updated to the accepted authority OpenAPI merge commit and validation passed. The next unresolved risk is stale generated TypeScript types, which must be handled in a separate authorization gate rather than mixed into this pin update.

## 12. Transition Control

Do not regenerate clients in this gate.

Do not change runtime code.

Do not add migrations.

Do not copy OpenAPI into backend.

A separate generated-types regeneration authorization gate is required before updating generated TypeScript artifacts.
