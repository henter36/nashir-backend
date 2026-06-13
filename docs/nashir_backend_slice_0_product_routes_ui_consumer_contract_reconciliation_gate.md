# Backend Slice 0 Product Routes / UI Consumer Contract Reconciliation Gate

| Field | Value |
|---|---|
| Gate type | Backend Slice 0 UI-consumer contract reconciliation gate |
| Status | GO |
| Repository | `henter36/nashir-backend` |
| UI authority | `henter36/nashir` |
| Approved Product UI | 23-page Arabic React UI |
| Backend scope | Product-route and UI-consumer contract reconciliation only |
| Runtime changes | NO |
| OpenAPI changes | NO |
| Generated types changes | NO |
| SQL/migration changes | NO |
| UI changes | NO |
| Production readiness claimed | NO |

---

## 1. Final Decision

**GO.**

Proceed with a documentation-only reconciliation of current Backend Slice 0 product-route behavior against the approved `henter36/nashir` UI consumer needs.

This gate does not authorize implementation.

---

## 2. Inputs

| Input | Role |
|---|---|
| `henter36/nashir` | Only approved Nashir Product UI source |
| `henter36/nashir-backend` | Backend runtime/API implementation |
| PR #186 in `henter36/nashir` | UI source-of-truth cleanup accepted |
| PR #130 in `henter36/nashir-backend` | Post-UI-authority reconciliation accepted |
| Product routes | Current Backend Slice 0 runtime/API surface |
| Authority OpenAPI | Contract authority to be preserved |

---

## 3. Approved UI Consumer Screens To Consider

```text
storeSetup
productCatalog
productIntelligence
campaigns
campaignsList
creatorStudio
content
contentReview
publishingQueue
analytics
settings
```

These are the screens most likely to consume backend product, store, campaign, content, publishing, or analytics APIs.

This does not remove the remaining approved screens from V1; it only narrows this reconciliation to likely API-consuming surfaces.

---

## 4. Current Known Product/API Route Families

Expected route families to inventory:

```text
/workspaces/{workspaceId}/nashir-products
/workspaces/{workspaceId}/nashir-products/{productId}
/workspaces/{workspaceId}/nashir-store-profile
/workspaces/{workspaceId}/nashir-campaigns
/workspaces/{workspaceId}/nashir-campaigns/{nashirCampaignId}
/workspaces/{workspaceId}/nashir-campaigns/{nashirCampaignId}/readiness
/workspaces/{workspaceId}/nashir-campaigns/{nashirCampaignId}/evidence
```

This inventory must distinguish:

```text
Implemented
Documented only
OpenAPI-authority only
Runtime-only
Deferred
Out of V1
```

---

## 5. Required Reconciliation Questions

For each route family, answer:

1. Is the route implemented in backend runtime?
2. Is it represented in authority OpenAPI?
3. Is it represented in generated types?
4. Which approved UI screen would consume it?
5. Is the response shape aligned with current runtime behavior?
6. Does it require permission guard enforcement?
7. Does it require workspace boundary enforcement?
8. Does it require idempotency?
9. Does it create audit events?
10. Is it safe for V1, or should it remain deferred?

---

## 6. Explicit NO-GO Boundaries

```text
NO-GO: Implementing new backend routes in this gate.
NO-GO: Editing OpenAPI in this gate.
NO-GO: Regenerating generated types in this gate.
NO-GO: SQL or migrations in this gate.
NO-GO: UI work in this gate.
NO-GO: Reintroducing marketing-os/ui/nashir as a UI consumer.
NO-GO: Static /nashir or /nashir/ serving.
NO-GO: Removing valid backend API routes merely because they contain nashir-*.
NO-GO: Agents, analytics runtime, publishing runtime, or production readiness.
```

---

## 7. Verification Commands

```bash
git diff --check
npm test
```

Route inventory helper:

```bash
grep -E -RIn "nashir-products|nashir-store-profile|nashir-campaigns|readiness|evidence" src docs tests 2>/dev/null || true
```

Forbidden UI target helper:

```bash
grep -E -RIn \
  --include="*.js" \
  --include="*.ts" \
  --include="*.mjs" \
  --include="*.cjs" \
  '/nashir([^a-zA-Z0-9_-]|$)|ui/nashir|marketing-os/ui/nashir' . \
  | grep -v node_modules \
  | grep -v .git \
  || true
```

Expected interpretation:

```text
Valid /workspaces/{workspaceId}/nashir-* API routes are allowed.
Static /nashir UI serving or marketing-os/ui/nashir targeting is not allowed.
```

---

## 8. Output Required From Next Review

The next review gate must produce:

```text
- Route family inventory.
- UI consumer mapping.
- Runtime vs OpenAPI alignment status.
- Generated types alignment status.
- Permission/workspace/idempotency/audit status.
- V1 keep/defer decision per route family.
- Explicit list of implementation gaps.
```

---

## 9. Decision

```text
GO: Product-route/UI-consumer contract reconciliation may proceed as documentation-only review.
NO-GO: Runtime, OpenAPI, generated types, migration, or UI changes.
```

---

## 10. Next Allowed Gate

```text
Backend Slice 0 Product Routes UI Consumer Contract Review Gate
```

Purpose:

- Produce the actual route-to-UI mapping.
- Identify contract gaps.
- Decide the next narrow implementation or contract-alignment gate.
