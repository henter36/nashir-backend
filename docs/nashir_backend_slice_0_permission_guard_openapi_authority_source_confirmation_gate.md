# Nashir Backend Slice 0 — Permission Guard OpenAPI Authority Source Confirmation Gate

## 1. Gate Classification

Gate type: Documentation-only authority source confirmation gate.

This gate confirms the current OpenAPI authority source for Backend Slice 0 Permission Guard / RBAC / workspace contract alignment.

This gate does not authorize implementation.

This gate does not authorize OpenAPI mutation.

This gate does not authorize public route implementation.

This gate does not authorize product route implementation.

This gate does not authorize generated client changes.

This gate does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #82: `docs: decide permission guard openapi authority inventory`.
- Merged PR #81: `docs: review permission guard openapi authority inventory`.
- Merged PR #80: `docs: decide permission guard openapi rbac contract alignment`.
- `scripts/validate-contract-authority.mjs`.
- `scripts/validate-contracts.mjs`.
- `package.json`.
- Existing Backend Slice 0 Auth0 identity-only boundary.
- Existing route/path `workspaceId` authority.
- Existing workspace-before-permission ordering.
- Existing membership-before-permission ordering.
- Existing internal harness-only permission guard app wiring.
- Existing contract-first governance.
- Existing non-authorization of implementation.
- Existing non-authorization of OpenAPI mutation.
- Existing non-authorization of generated client changes.
- Existing non-authorization of product/public routes.
- Existing non-authorization of DB, ORM, migrations, deployment, secrets, UI, workflow, and formatting baseline cleanup.

## 3. Confirmation Objective

This gate confirms whether OpenAPI authority is:

- local to `henter36/nashir-backend`;
- external to `henter36/nashir-backend`;
- checked out by CI or local validation as an authority repository;
- copied into backend;
- generated from another source;
- deferred or unresolved.

This gate must also identify any source-of-truth conflict that blocks later route inventory, permission representation, or OpenAPI mutation planning.

## 4. Current Evidence Summary

### 4.1 Backend-local OpenAPI authority

Finding:

No backend-local OpenAPI mutation is authorized.

The current validation scripts treat OpenAPI authority as coming through an authority repository input rather than as a backend-owned editable contract file.

Status: NOT CONFIRMED AS BACKEND-LOCAL AUTHORITY.

Decision:

Do not treat `henter36/nashir-backend` as the editable OpenAPI authority source in this stage.

### 4.2 External authority repository requirement

Finding:

`scripts/validate-contract-authority.mjs` requires an authority repository path through `--authority-repo` or `NASHIR_AUTHORITY_REPO`.

Status: CONFIRMED.

Decision:

OpenAPI authority is external or externally checked out for validation purposes.

### 4.3 Required OpenAPI authority file

Finding:

`scripts/validate-contract-authority.mjs` includes `docs/nashir_v1_openapi.yaml` in its authority file list.

Status: CONFIRMED.

Decision:

`docs/nashir_v1_openapi.yaml` is the known OpenAPI authority candidate.

### 4.4 Copied authority files in backend

Finding:

`scripts/validate-contract-authority.mjs` verifies that copied authority files are absent from the backend repository.

Status: CONFIRMED AS VALIDATION INTENT.

Decision:

Authority files must not be copied into backend as editable sources in this stage.

### 4.5 Generated client directories

Finding:

`scripts/validate-contract-authority.mjs` verifies absence of generated client directories:

- `src/generated`
- `generated`
- `openapi-generated`

Status: CONFIRMED AS VALIDATION INTENT.

Decision:

Generated client directories remain blocked in this backend stage.

### 4.6 Contract validation scripts

Finding:

`package.json` includes both:

- `validate:contract-authority`
- `validate:contracts`

Status: CONFIRMED.

Decision:

Both scripts are relevant to OpenAPI authority source confirmation.

## 5. Authority Source Classification

| Surface | Status | Classification | Decision |
|---|---|---|---|
| `docs/nashir_v1_openapi.yaml` | external authority candidate | OpenAPI authority candidate | not editable from backend in this gate |
| `henter36/nashir-backend` | backend runtime repository | non-authority for editable OpenAPI | do not mutate OpenAPI here |
| `scripts/validate-contract-authority.mjs` | local validation script | authority boundary validator | relevant evidence |
| `scripts/validate-contracts.mjs` | local validation script | contract validation script | relevant evidence |
| generated client directories | expected absent | generated / derived | blocked |
| runtime route files | implementation | non-authority for contract | do not infer authority |
| internal harness route | implementation harness | non-authority for product API | do not infer product contract |

## 6. Confirmed Authority Source Status

Confirmed status:

`OpenAPI authority is external to henter36/nashir-backend for the current Backend Slice 0 stage.`

The known authority file candidate is:

`docs/nashir_v1_openapi.yaml`

The backend repository should treat this authority as read-only and external until a future explicit gate authorizes OpenAPI mutation or contract-authority update work.

## 7. Important Conflict Found

### 7.1 Pinned authority reference mismatch

A conflict exists between local validation scripts:

- `scripts/validate-contract-authority.mjs` uses pinned authority SHA `36da9ed31903562bddfb7ffd669841956e334a51`.
- `scripts/validate-contracts.mjs` uses expected authority commit `04f54f8be852001173f4014cb2d81c5cdb97e35c`.

Review result: BLOCKING FOR MUTATION, NOT BLOCKING FOR DOCUMENTATION-ONLY CONFIRMATION.

Impact:

This mismatch prevents safe OpenAPI mutation planning, generated client planning, or route inventory decisions that depend on a single pinned authority reference.

Decision:

Do not proceed to product route inventory, permission representation, generated client impact review, or OpenAPI mutation planning until the authority pin mismatch is reconciled or intentionally explained.

### 7.2 Required authority file set mismatch

A second conflict exists:

`validate-contract-authority.mjs` requires:

- `docs/nashir_v1_openapi.yaml`
- `docs/nashir_auth_rbac_workspace_identity_gate.md`
- `docs/nashir_auth_rbac_openapi_alignment_final_re_review_gate.md`
- `docs/nashir_backend_slice_0_contract_safe_infrastructure_validation_action_gate.md`

`validate-contracts.mjs` requires:

- `docs/nashir_v1_openapi.yaml`
- `docs/nashir_ai_agent_runtime_selection_planning_gate.md`

Review result: OPEN GAP.

Impact:

The project currently has at least two validation views of contract authority requirements.

Decision:

A reconciliation decision is required before using the authority scripts as a stable basis for route or permission-contract planning.

## 8. ErrorModel Authority Status

Status: NOT FULLY CONFIRMED.

Reason:

ErrorModel is referenced in prior planning/review gates, but this gate confirms only that OpenAPI authority is external and that the known OpenAPI candidate is `docs/nashir_v1_openapi.yaml`.

Decision:

ErrorModel authority must remain unresolved until the external OpenAPI authority and pinned source are reconciled.

## 9. Generated Artifact Authority Status

Status: UNRESOLVED.

Known validation intent:

Generated client directories are expected to be absent from backend in the current stage.

Decision:

Generated artifact inventory and generated client changes remain blocked.

## 10. Workspace Path Authority Status

Status: PARTIALLY CONFIRMED.

Confirmed backend boundary:

Route/path `workspaceId` is the accepted workspace authority in Backend Slice 0.

OpenAPI-specific workspace path authority remains unresolved until the external OpenAPI authority source is reconciled and inspected.

Decision:

Do not start product route inventory or workspace-scoped OpenAPI path mapping yet.

## 11. Product Route Inventory Status

Status: DEFERRED.

Reason:

Product route inventory depends on stable OpenAPI authority source and a single reconciled authority pin.

Decision:

No product route inventory is authorized by this gate.

## 12. Permission Representation Status

Status: DEFERRED.

Reason:

Permission representation depends on knowing whether permissions will be represented through:

- route configuration;
- OpenAPI metadata;
- separate policy map;
- mixed route configuration plus OpenAPI metadata.

Decision:

No representation model is selected by this gate.

## 13. Error and Disclosure Mapping Status

Status: DEFERRED.

Reason:

Route-specific 401, 403, and non-disclosing 404 behavior depends on OpenAPI response authority and product route inventory.

Current accepted behavior remains:

- 401 for missing or invalid auth;
- 403 for disclosing permission denial;
- 404 for non-disclosing permission denial;
- 404 for cross-workspace resource mismatch.

Decision:

No route-specific mapping is selected by this gate.

## 14. Decision Options Considered

### Option A — Product Route Inventory Review

Decision: NO-GO.

Reason:

Product route inventory should not start while authority pin mismatch remains unresolved.

### Option B — Permission Representation Decision

Decision: NO-GO.

Reason:

Permission representation depends on confirmed and reconciled OpenAPI authority.

### Option C — Generated Artifact Inventory Review

Decision: NO-GO for now.

Reason:

Generated artifact review depends on knowing which authority pin and required authority file set are current.

### Option D — OpenAPI Mutation Planning

Decision: NO-GO.

Reason:

OpenAPI mutation is explicitly unauthorized and unsafe while authority source pins conflict.

### Option E — Authority Pin Reconciliation Decision Gate

Decision: SELECTED.

Reason:

The next blocker is not implementation. The next blocker is reconciling or explicitly deciding the source-of-truth mismatch between the validation scripts.

## 15. Selected Next Path

Selected next path:

`Backend Slice 0 Permission Guard OpenAPI Authority Pin Reconciliation Decision Gate`

This selected path is documentation-only.

It must not implement code.

It must not mutate OpenAPI.

It must not modify validation scripts.

It must not modify generated clients.

It must not add product routes.

It must not add public routes.

It must not add DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 16. Why Pin Reconciliation Comes Next

Pin reconciliation comes next because:

- OpenAPI authority source is confirmed as external for the current stage.
- The known OpenAPI authority candidate is `docs/nashir_v1_openapi.yaml`.
- The backend has more than one contract validation script.
- The scripts point to different authority SHAs.
- The scripts require different supporting authority files.
- Route inventory, permission representation, generated client impact, and mutation planning all require a stable authority reference.

## 17. Risk Review

### 17.1 Contract Drift Risk

Risk:

Later gates may rely on different contract authority commits.

Mitigation:

Select authority pin reconciliation before route or permission decisions.

### 17.2 Validation Inconsistency Risk

Risk:

Different validation scripts may validate different authority snapshots.

Mitigation:

Require a documentation-only reconciliation decision.

### 17.3 Premature Implementation Risk

Risk:

Implementation may proceed before the contract source is stable.

Mitigation:

Keep implementation explicitly blocked.

### 17.4 OpenAPI Mutation Risk

Risk:

OpenAPI may be mutated against the wrong authority source.

Mitigation:

Keep OpenAPI mutation explicitly blocked.

### 17.5 Generated Client Drift Risk

Risk:

Generated clients may be created or updated from the wrong contract snapshot.

Mitigation:

Keep generated client changes explicitly blocked.

## 18. Confirmed Facts

Confirmed in this gate:

- OpenAPI authority is external to `henter36/nashir-backend` for the current stage.
- `docs/nashir_v1_openapi.yaml` is the known OpenAPI authority candidate.
- backend-local OpenAPI mutation remains unauthorized.
- generated client changes remain unauthorized.
- product/public route implementation remains unauthorized.
- DB/ORM/migrations remain unauthorized.
- authority pin mismatch exists between validation scripts.
- authority file set mismatch exists between validation scripts.

## 19. Gaps

Known unresolved gaps after this gate:

- Authority pin reconciliation unresolved.
- Required authority file set reconciliation unresolved.
- ErrorModel authority source unresolved.
- Generated artifact inventory unresolved.
- Generated client impact unresolved.
- Workspace path authority unresolved.
- Product route inventory unresolved.
- Permission representation unresolved.
- Error/disclosure mapping unresolved.
- First eligible product route slice unresolved.
- Persistent RBAC model unresolved.

## 20. Final Decision

Decision: GO to Backend Slice 0 Permission Guard OpenAPI Authority Pin Reconciliation Decision Gate.

This decision selects a documentation-only reconciliation decision gate.

This decision does not authorize implementation.

This decision does not authorize OpenAPI mutation.

This decision does not authorize validation script modification.

This decision does not authorize generated client changes.

This decision does not authorize public/product route work.

This decision does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 21. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Permission Guard OpenAPI Authority Pin Reconciliation Decision Gate`

That gate should decide exactly one next path:

- reconcile authority pin documentation;
- authorize a later validation-script planning gate;
- proceed to generated artifact inventory only if authority pins are accepted as intentionally split;
- proceed to product route inventory only if authority pin status is accepted as stable;
- or create another prerequisite gate.

## 22. Explicit Non-Authorization

This source confirmation gate does not authorize:

- runtime implementation;
- route implementation;
- controller implementation;
- product route implementation;
- public route implementation;
- OpenAPI mutation;
- validation script modification;
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

## 23. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged OpenAPI Authority Inventory Decision Gate.
- Merged OpenAPI Authority Inventory Review Gate.
- Contract validation scripts.
- Existing Auth0 identity-only boundary.
- Existing route/path workspace boundary.
- Existing permission guard primitive.
- Existing internal harness execution.
- Existing contract-first governance.

### Outputs

- Confirmed OpenAPI authority is external for current backend stage.
- Confirmed known OpenAPI authority candidate is `docs/nashir_v1_openapi.yaml`.
- Confirmed backend OpenAPI mutation remains blocked.
- Confirmed generated clients remain blocked.
- Identified authority pin mismatch.
- Identified authority file set mismatch.
- Selected authority pin reconciliation as the next prerequisite.

### Gaps

- Authority pin reconciliation unresolved.
- Required authority file set reconciliation unresolved.
- ErrorModel authority source unresolved.
- Generated artifact inventory unresolved.
- Generated client impact unresolved.
- Workspace path authority unresolved.
- Product route inventory unresolved.
- Permission representation unresolved.
- Error/disclosure mapping unresolved.
- First eligible product route slice unresolved.
- Persistent RBAC model unresolved.

### Transition Decision

GO to `Backend Slice 0 Permission Guard OpenAPI Authority Pin Reconciliation Decision Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
