# Backend Slice 0 Product Route Runtime Contract Acceptance Decision Gate

| Field | Value |
|---|---|
| Gate type | Product route runtime contract acceptance decision gate |
| Status | GO |
| Repository | `henter36/nashir-backend` |
| Authority repository | `henter36/nashir` |
| Canonical V1 product route family | `/workspaces/{workspaceId}/products` |
| Runtime changes | NO |
| OpenAPI changes | NO |
| Generated types changes | NO |
| SQL/migration changes | NO |
| UI changes | NO |
| Production readiness claimed | NO |

---

## 1. Final Decision

**GO.**

Accept the current Backend Slice 0 product runtime route family as contract-aligned for a narrow product-catalog backend slice.

This decision does not authorize UI integration, runtime changes, OpenAPI edits, generated type regeneration, SQL/migration changes, alias routes, or production readiness.

---

## 2. Inputs

| Input | Finding |
|---|---|
| PR #133 | Accepted `/workspaces/{workspaceId}/products` as canonical V1 product route family. |
| PR #134 | Cleaned stale `/nashir-products` references. |
| PR #135 | Accepted product route naming cleanup review. |
| PR #136 | Reviewed product runtime routes against accepted OpenAPI/generated contract. |
| OpenAPI authority | Product routes are defined under `/workspaces/{workspaceId}/products`. |
| Backend runtime | Product routes exist under `/workspaces/:workspaceId/products`. |
| Generated contract | Product response/list shapes must remain aligned with `ProductResponse` and `ProductListResponse`. |

---

## 3. Accepted Runtime Route Family

```text
GET  /workspaces/{workspaceId}/products
POST /workspaces/{workspaceId}/products
GET  /workspaces/{workspaceId}/products/{productId}
PUT  /workspaces/{workspaceId}/products/{productId}
```

---

## 4. Acceptance Decision

| Area                     |       Decision | Finding                                                                                      |
| ------------------------ | -------------: | -------------------------------------------------------------------------------------------- |
| Route naming             |       ACCEPTED | `/products` is canonical and aligned with OpenAPI authority.                                 |
| Runtime route family     |       ACCEPTED | Current backend product route family is the accepted Slice 0 product backend surface.        |
| OpenAPI alignment        |       ACCEPTED | Product route naming and expected operations align with authority.                           |
| Generated response shape |       ACCEPTED | Product responses must use `ProductResponse`; list responses must use `ProductListResponse`. |
| Workspace boundary       |       ACCEPTED | `workspaceId` must remain path-derived and enforced through workspace context.               |
| Permission boundary      |       ACCEPTED | Read routes require product read permission; mutation routes require manage permission.      |
| Idempotency              |       ACCEPTED | Product create must preserve idempotency behavior.                                           |
| Audit                    |       ACCEPTED | Product create/update must preserve audit behavior.                                          |
| Disclosure model         |       ACCEPTED | Cross-workspace or unauthorized existence must remain non-disclosing.                        |
| UI readiness             | NOT AUTHORIZED | UI integration requires a separate planning gate.                                            |
| Production readiness     | NOT AUTHORIZED | No pilot or production readiness is claimed.                                                 |

---

## 5. Authorization Granted

This decision authorizes only:

```text
Proceeding to a narrow UI/backend integration planning gate for product catalog consumption.
```

---

## 6. Still Not Authorized

```text
NO-GO: UI implementation.
NO-GO: Runtime route changes.
NO-GO: OpenAPI edits.
NO-GO: Generated type regeneration.
NO-GO: SQL or migrations.
NO-GO: /nashir-products alias routes.
NO-GO: Store profile runtime.
NO-GO: Campaign runtime.
NO-GO: Readiness/evidence runtime.
NO-GO: Publishing runtime.
NO-GO: Analytics runtime.
NO-GO: Agent runtime.
NO-GO: Production or pilot readiness.
```

---

## 7. Risks

| Risk                                                        | Severity | Decision                                          |
| ----------------------------------------------------------- | -------: | ------------------------------------------------- |
| Treating this as UI implementation approval                 |     HIGH | NO-GO; only integration planning is allowed next. |
| Expanding from Product Catalog to Store/Campaign/Publishing |     HIGH | NO-GO without dedicated gates.                    |
| Changing runtime routes after acceptance                    |     HIGH | NO-GO without a new decision gate.                |
| Skipping UI integration planning                            |   MEDIUM | NO-GO; integration planning must be explicit.     |
| Claiming production readiness                               |     HIGH | NO-GO.                                            |

---

## 8. Verification Commands

```bash
npm test
npm run typecheck
npm run lint
NASHIR_AUTHORITY_REPO=../nashir npm run validate:contracts
git diff --check
```

---

## 9. Decision

```text
GO: Current product runtime routes are accepted as the first contract-aligned backend slice candidate for UI consumption planning.
NO-GO: UI implementation, runtime changes, OpenAPI edits, generated type regeneration, SQL/migration work, alias routes, or production readiness.
```

---

## 10. Next Allowed Gate

```text
Nashir Product Catalog UI Backend Integration Planning Gate
```

Purpose:

* Plan how the approved `henter36/nashir` Product Catalog UI consumes the accepted product backend routes.
* Map Product Catalog UI needs to the accepted product route contract.
* Decide whether any UI adapter/store changes are needed.
* Keep implementation blocked until the planning gate is accepted.
