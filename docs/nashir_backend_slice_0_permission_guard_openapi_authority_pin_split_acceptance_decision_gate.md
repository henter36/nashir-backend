# Nashir Backend Slice 0 — Permission Guard OpenAPI Authority Pin Split Acceptance Decision Gate

## 1. Gate Classification

Gate type: Documentation-only authority pin split acceptance decision gate.

This gate decides whether the observed OpenAPI authority pin split is accepted as intentional and scope-based.

This gate does not authorize implementation.

This gate does not authorize validation script modification.

This gate does not authorize package script modification.

This gate does not authorize CI workflow modification.

This gate does not authorize OpenAPI mutation.

This gate does not authorize generated client changes.

This gate does not authorize public route implementation.

This gate does not authorize product route implementation.

This gate does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #89: `docs: collect permission guard openapi authority evidence`.
- Merged PR #88: `docs: decide permission guard openapi authority pin reconciliation evidence`.
- Merged PR #87: `docs: review permission guard openapi authority pin reconciliation evidence`.
- Merged PR #86: `docs: review permission guard openapi authority pin reconciliation planning`.
- Merged PR #85: `docs: plan permission guard openapi authority pin reconciliation`.
- Merged PR #84: `docs: decide permission guard openapi authority pin reconciliation`.
- Merged PR #83: `docs: confirm permission guard openapi authority source`.
- Merged PR #82: `docs: decide permission guard openapi authority inventory`.
- Merged PR #81: `docs: review permission guard openapi authority inventory`.
- Merged PR #80: `docs: decide permission guard openapi rbac contract alignment`.
- `scripts/validate-contract-authority.mjs`.
- `scripts/validate-contracts.mjs`.
- `package.json`.
- `.github/workflows/ci.yml`.
- Authority repository: `henter36/nashir`.
- CI-active authority pin: `36da9ed31903562bddfb7ffd669841956e334a51`.
- Later broader authority pin: `04f54f8be852001173f4014cb2d81c5cdb97e35c`.
- Existing Auth0 identity-only boundary.
- Existing route/path `workspaceId` authority.
- Existing workspace-before-permission ordering.
- Existing membership-before-permission ordering.
- Existing internal harness-only permission guard app wiring.
- Existing contract-first governance.
- Existing non-authorization of implementation.
- Existing non-authorization of OpenAPI mutation.
- Existing non-authorization of validation script modification.
- Existing non-authorization of generated client changes.
- Existing non-authorization of product/public routes.
- Existing non-authorization of DB, ORM, migrations, deployment, secrets, UI, workflow, and formatting baseline cleanup.

## 3. Decision Objective

This gate decides whether to accept the observed split between:

- `36da9ed31903562bddfb7ffd669841956e334a51`
- `04f54f8be852001173f4014cb2d81c5cdb97e35c`

as intentional and scope-based.

This decision must not authorize code changes.

This decision must not collapse, rewrite, or reconcile validation scripts.

This decision must not mutate OpenAPI.

This decision must not start product route implementation.

## 4. Evidence Summary

The additional evidence collection gate established:

1. Authority repository is `henter36/nashir`.
2. Both authority pins exist.
3. `04f54f8be852001173f4014cb2d81c5cdb97e35c` is later than `36da9ed31903562bddfb7ffd669841956e334a51`.
4. `36da9ed31903562bddfb7ffd669841956e334a51` is the current CI-active authority pin.
5. Current CI checks out `henter36/nashir` at `36da9ed31903562bddfb7ffd669841956e334a51`.
6. Current CI runs `validate:contract-authority`.
7. Current CI does not run `validate:contracts`.
8. `validate-contract-authority.mjs` validates Backend Slice 0 OpenAPI/RBAC/workspace/contract-safe authority files.
9. `validate-contracts.mjs` references a later broader authority pin that includes AI Agent Runtime planning evidence.
10. The file-set difference is explained by later AI/runtime planning evidence, not by an immediate Backend Slice 0 product-route implementation requirement.

## 5. Split Classification

| Pin | Accepted classification | Current treatment |
|---|---|---|
| `36da9ed31903562bddfb7ffd669841956e334a51` | CI-active Backend Slice 0 contract authority pin | Accepted for current backend CI authority validation |
| `04f54f8be852001173f4014cb2d81c5cdb97e35c` | Later broader authority pin including AI/runtime planning evidence | Accepted as broader/later planning authority evidence, not current Backend Slice 0 CI authority |
| `validate:contract-authority` | Current CI-active authority validation command | Accepted as current CI command |
| `validate:contracts` | Broader package-exposed contract validation command | Accepted as non-CI-active for current Backend Slice 0 |
| `scripts/validate-contract-authority.mjs` | Current Backend Slice 0 authority guardrail script | Accepted as current CI-backed validator |
| `scripts/validate-contracts.mjs` | Broader/advisory contract validation script | Accepted as outside current Backend Slice 0 CI validation path |

## 6. Decision: Accept Authority Pin Split

Decision: ACCEPTED.

The authority pin split is accepted as intentional and scope-based for the current Backend Slice 0 stage.

Accepted interpretation:

- `36da9ed31903562bddfb7ffd669841956e334a51` remains the current CI-active Backend Slice 0 authority validation pin.
- `04f54f8be852001173f4014cb2d81c5cdb97e35c` remains a later broader authority reference that includes AI Agent Runtime planning evidence.
- The split does not currently require validation script reconciliation.
- The split does not currently require package script reconciliation.
- The split does not currently require CI workflow changes.
- The split does not currently require OpenAPI mutation.
- The split does not currently authorize generated clients.
- The split does not currently authorize product route implementation.

## 7. What This Acceptance Does Not Mean

This acceptance does not mean both pins are interchangeable.

This acceptance does not mean `04f54...` supersedes `36da...` for current Backend Slice 0 CI validation.

This acceptance does not mean `36da...` should be used for AI/runtime planning evidence.

This acceptance does not authorize backend scripts to be modified.

This acceptance does not authorize `package.json` changes.

This acceptance does not authorize `.github/workflows/ci.yml` changes.

This acceptance does not authorize OpenAPI mutation.

This acceptance does not authorize generated client creation.

This acceptance does not authorize product route implementation.

## 8. Current Authority Boundary After Acceptance

Current accepted boundary:

| Boundary | Accepted authority source |
|---|---|
| Backend Slice 0 CI authority validation | `henter36/nashir` at `36da9ed31903562bddfb7ffd669841956e334a51` |
| Current CI validation command | `pnpm run validate:contract-authority` |
| Current CI validator | `scripts/validate-contract-authority.mjs` |
| Current OpenAPI authority candidate | `docs/nashir_v1_openapi.yaml` in external authority repo |
| AI/runtime planning evidence | broader/later authority context at `04f54f8be852001173f4014cb2d81c5cdb97e35c` |
| Product route implementation | still unauthorized |
| Generated clients | still unauthorized |
| Persistent RBAC | still unauthorized |

## 9. Impact on Downstream Gates

The split acceptance removes the authority-pin blocker for documentation-only route inventory review.

It does not remove implementation blockers.

It does not authorize product routes.

It does not authorize controllers.

It does not authorize OpenAPI changes.

It does not authorize generated clients.

It only allows the project to proceed to a documentation-only review of product-route inventory from the currently accepted external authority context.

## 10. Candidate Next Paths

### Option A — Product Route Inventory Review Gate

Decision: SELECTED.

Reason:

After accepting the pin split as scope-based, the next safe step is to inventory OpenAPI product routes and route-level permission relevance without implementing them.

### Option B — Permission Representation Decision Gate

Decision: NO-GO for now.

Reason:

Permission representation should depend on route inventory evidence.

### Option C — Error and Disclosure Mapping Decision Gate

Decision: NO-GO for now.

Reason:

Error/disclosure mapping depends on route inventory and response authority.

### Option D — Generated Artifact Inventory Gate

Decision: NO-GO for now.

Reason:

Generated clients remain blocked, and route inventory should precede generated artifact impact analysis.

### Option E — Validation Script Reconciliation Implementation Authorization Gate

Decision: NO-GO.

Reason:

The split has been accepted as scope-based; script reconciliation is not currently required.

## 11. Selected Next Path

Selected next path:

`Backend Slice 0 Permission Guard Product Route Inventory Review Gate`

This selected path is documentation-only.

It must inventory product route authority and permission relevance.

It must not implement routes.

It must not modify OpenAPI.

It must not modify generated clients.

It must not modify validation scripts.

It must not modify package scripts.

It must not modify CI workflow files.

It must not add DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 12. Required Inputs for Product Route Inventory Review Gate

The selected Product Route Inventory Review Gate must review:

- accepted OpenAPI authority source;
- current external authority repository boundary;
- current accepted CI-active authority pin;
- OpenAPI path inventory relevant to V1 product surfaces;
- route workspace boundary evidence;
- route actor/permission relevance;
- error response authority;
- generated client impact, only as inventory;
- route implementation blockers;
- existing Auth0 identity-only boundary;
- existing route/path `workspaceId` authority;
- existing workspace-before-permission ordering;
- existing permission guard app wiring.

## 13. Required Outputs for Product Route Inventory Review Gate

The selected Product Route Inventory Review Gate must output:

- product route inventory;
- route method inventory;
- workspace-scoped versus non-workspace-scoped classification;
- permission relevance classification;
- route implementation eligibility classification;
- unresolved gaps before permission representation;
- recommended next gate.

## 14. Decision on Validation Script Modification

Decision: NO-GO.

Reason:

Authority pin split is accepted as scope-based. No validation script change is currently required or authorized.

No change is authorized to:

- `scripts/validate-contract-authority.mjs`
- `scripts/validate-contracts.mjs`

## 15. Decision on Package Script Modification

Decision: NO-GO.

Reason:

No package script change is required or authorized.

No change is authorized to:

- `package.json`

## 16. Decision on CI Workflow Modification

Decision: NO-GO.

Reason:

No CI workflow change is required or authorized.

No change is authorized to:

- `.github/workflows/ci.yml`
- any other CI workflow file

## 17. Decision on OpenAPI Mutation

Decision: NO-GO.

Reason:

This gate accepts the authority pin split only.

No OpenAPI mutation is authorized.

No OpenAPI file may be changed.

## 18. Decision on Generated Clients

Decision: NO-GO.

Reason:

Generated client work remains blocked.

No generated client changes are authorized.

## 19. Decision on Product Route Implementation

Decision: NO-GO.

Reason:

The selected next step is route inventory review only.

No product route implementation is authorized.

## 20. Decision on Permission Representation

Decision: DEFER.

Reason:

Permission representation must follow product route inventory review.

No permission representation model is selected.

## 21. Decision on Error and Disclosure Mapping

Decision: DEFER.

Reason:

Route-specific 401, 403, and non-disclosing 404 behavior depends on route inventory and response authority.

No route-specific mapping is selected.

## 22. Decision on Persistent RBAC

Decision: NO-GO.

Reason:

Persistent RBAC requires separate data model, migration, resolver, and runtime enforcement authorization.

## 23. Risk Review

### 23.1 Scope Confusion Risk

Risk:

The project may confuse the CI-active Backend Slice 0 authority pin with the later AI/runtime planning authority pin.

Mitigation:

Document the split as scope-based and preserve both classifications.

### 23.2 Validation Drift Risk

Risk:

Future changes may accidentally treat `validate:contracts` as CI-active for Backend Slice 0 without review.

Mitigation:

Require future gate if CI behavior changes.

### 23.3 Product Route Sequencing Risk

Risk:

Product route inventory may be mistaken for implementation authorization.

Mitigation:

Select route inventory review only and preserve implementation NO-GO.

### 23.4 Generated Client Risk

Risk:

Route inventory may trigger generated client changes prematurely.

Mitigation:

Keep generated clients blocked.

## 24. Final Decision

Decision: ACCEPTED authority pin split as scope-based.

Decision: GO to Backend Slice 0 Permission Guard Product Route Inventory Review Gate.

This decision selects a documentation-only product route inventory review gate.

This decision does not authorize implementation.

This decision does not authorize validation script modification.

This decision does not authorize package script modification.

This decision does not authorize CI workflow modification.

This decision does not authorize OpenAPI mutation.

This decision does not authorize generated client changes.

This decision does not authorize public/product route implementation.

This decision does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 25. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Permission Guard Product Route Inventory Review Gate`

That gate should inventory product route authority and permission relevance without implementing routes.

## 26. Explicit Non-Authorization

This split acceptance decision gate does not authorize:

- runtime implementation;
- route implementation;
- controller implementation;
- product route implementation;
- public route implementation;
- OpenAPI mutation;
- validation script modification;
- package script modification;
- CI workflow modification;
- generated client changes;
- generated artifact regeneration;
- DB-backed permission resolver;
- ORM-backed permission resolver;
- permission migrations;
- workspace membership persistence;
- deployment changes;
- secrets changes;
- UI changes;
- workflow changes;
- formatting baseline cleanup.

## 27. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged OpenAPI Authority Additional Evidence Collection Gate.
- Merged OpenAPI Authority Pin Reconciliation Evidence Decision Gate.
- Merged OpenAPI Authority Pin Reconciliation Evidence Review Gate.
- Merged OpenAPI Authority Pin Reconciliation Planning Review Gate.
- Merged OpenAPI Authority Pin Reconciliation Planning Gate.
- Merged OpenAPI Authority Pin Reconciliation Decision Gate.
- Merged OpenAPI Authority Source Confirmation Gate.
- Merged OpenAPI Authority Inventory Decision Gate.
- Merged OpenAPI Authority Inventory Review Gate.
- Merged OpenAPI RBAC Contract Alignment Decision Gate.
- Evidence that authority repository is `henter36/nashir`.
- Evidence that both authority pins exist.
- Evidence that `04f54...` is later than `36da...`.
- Evidence that current CI uses `36da...`.
- Evidence that current CI runs `validate:contract-authority`.
- Evidence that current CI does not run `validate:contracts`.
- Existing Auth0 identity-only boundary.
- Existing route/path `workspaceId` authority.
- Existing workspace-before-permission ordering.
- Existing membership-before-permission ordering.
- Existing internal harness-only permission guard app wiring.
- Existing contract-first governance.

### Outputs

- Accepted the authority pin split as scope-based.
- Classified `36da...` as current CI-active Backend Slice 0 authority pin.
- Classified `04f54...` as later broader AI/runtime planning authority evidence.
- Rejected validation script modification.
- Rejected package script modification.
- Rejected CI workflow modification.
- Rejected OpenAPI mutation.
- Rejected generated client changes.
- Rejected product route implementation.
- Selected Product Route Inventory Review Gate as the next gate.

### Gaps

- Product route inventory unresolved.
- Permission representation unresolved.
- Error/disclosure mapping unresolved.
- ErrorModel authority source unresolved.
- Generated artifact inventory unresolved.
- Generated client impact unresolved.
- Workspace path authority unresolved.
- First eligible product route slice unresolved.
- Persistent RBAC model unresolved.

### Transition Decision

GO to `Backend Slice 0 Permission Guard Product Route Inventory Review Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
