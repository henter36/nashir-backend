# Nashir Backend Slice 0 — Permission Guard OpenAPI Authority Pin Reconciliation Decision Gate

## 1. Gate Classification

Gate type: Documentation-only decision gate.

This gate decides the next Backend Slice 0 path after the completed Permission Guard OpenAPI Authority Source Confirmation Gate.

This gate does not authorize implementation.

This gate does not authorize OpenAPI mutation.

This gate does not authorize validation script modification.

This gate does not authorize generated client changes.

This gate does not authorize public route implementation.

This gate does not authorize product route implementation.

This gate does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #83: `docs: confirm permission guard openapi authority source`.
- Merged PR #82: `docs: decide permission guard openapi authority inventory`.
- Merged PR #81: `docs: review permission guard openapi authority inventory`.
- Merged PR #80: `docs: decide permission guard openapi rbac contract alignment`.
- `scripts/validate-contract-authority.mjs`.
- `scripts/validate-contracts.mjs`.
- `package.json`.
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

## 3. Documented Facts

The OpenAPI Authority Source Confirmation Gate documented the following facts:

1. OpenAPI authority is external to `henter36/nashir-backend` for the current Backend Slice 0 stage.
2. `docs/nashir_v1_openapi.yaml` is the known OpenAPI authority candidate.
3. Backend-local OpenAPI mutation remains unauthorized.
4. Generated client changes remain unauthorized.
5. Product/public route implementation remains unauthorized.
6. DB, ORM, and migrations remain unauthorized.
7. A pinned authority reference mismatch exists between validation scripts.
8. A required authority file-set mismatch exists between validation scripts.
9. Route inventory remains deferred.
10. Permission representation remains deferred.
11. Error/disclosure mapping remains deferred.

## 4. Decision Objective

This decision gate must select exactly one next path.

The selected path must reduce the authority pin / authority file-set mismatch without opening implementation.

The selected path must not mix:

- validation script modification;
- OpenAPI mutation;
- generated client changes;
- route implementation;
- product route implementation;
- permission representation selection;
- DB, ORM, or migration work.

## 5. Problem Statement

The current backend repository has more than one contract validation view.

One validation path uses one authority pin and file set.

Another validation path uses a different authority pin and file set.

This means later OpenAPI/RBAC decisions may rely on different contract snapshots unless the difference is reconciled, accepted as intentional, or replaced by a single documented source-of-truth policy.

## 6. Options Considered

### Option A — Treat the pin mismatch as intentional and proceed to product route inventory

Description:

Accept that the two validation scripts intentionally validate different contract snapshots and proceed to product route inventory.

Decision: NO-GO.

Reason:

There is no approved decision in the current gate sequence that states the split authority pins are intentional and safe. Proceeding would create contract drift risk.

### Option B — Proceed to permission representation decision

Description:

Choose whether permission requirements should be represented in route configuration, OpenAPI metadata, a policy map, or a mixed model.

Decision: NO-GO.

Reason:

Permission representation depends on a stable OpenAPI authority reference.

### Option C — Proceed to generated artifact inventory review

Description:

Inventory generated artifacts and generated clients before reconciling authority pins.

Decision: NO-GO.

Reason:

Generated artifact review depends on knowing which authority pin and file set are current.

### Option D — Authorize validation script modification directly

Description:

Directly authorize edits to `scripts/validate-contract-authority.mjs` or `scripts/validate-contracts.mjs`.

Decision: NO-GO.

Reason:

Script modification requires planning, review, and explicit implementation authorization. This decision gate alone must not authorize code changes.

### Option E — Authorize OpenAPI mutation planning

Description:

Start planning changes to `docs/nashir_v1_openapi.yaml` or any OpenAPI source.

Decision: NO-GO.

Reason:

OpenAPI mutation remains explicitly unauthorized and unsafe while authority pins conflict.

### Option F — OpenAPI Authority Pin Reconciliation Planning Gate

Description:

Create a documentation-only planning gate to reconcile the authority pin mismatch and required authority file-set mismatch.

This planning gate should define:

- whether both validation scripts should remain;
- whether the pins should converge;
- whether the file sets are intentionally different;
- which script is authoritative for Backend Slice 0;
- whether later script changes may need an implementation authorization gate;
- what verification is required before route inventory or permission representation.

Decision: SELECTED.

Reason:

This is the smallest safe next step. It reduces ambiguity without modifying code, OpenAPI, generated clients, routes, DB, ORM, or migrations.

## 7. Selected Path

Selected next path:

`Backend Slice 0 Permission Guard OpenAPI Authority Pin Reconciliation Planning Gate`

This selected path is documentation-only.

It must not implement code.

It must not modify validation scripts.

It must not mutate OpenAPI.

It must not modify generated clients.

It must not add product routes.

It must not add public routes.

It must not add DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 8. Why Planning Comes Before Script Changes

Planning comes before script changes because the current mismatch may have more than one valid interpretation:

1. The scripts may be intentionally validating different authority slices.
2. One script may be obsolete.
3. One pin may be stale.
4. One required file set may be incomplete.
5. The validation responsibilities may need separation by name.
6. Both scripts may be valid but need clearer documentation.

Choosing among these requires a planning output first.

## 9. Required Inputs for the Selected Next Gate

The selected planning gate must review:

- `scripts/validate-contract-authority.mjs`;
- `scripts/validate-contracts.mjs`;
- `package.json`;
- prior contract validation gates;
- prior OpenAPI/RBAC gates;
- authority repository assumptions;
- pinned authority SHAs;
- required authority file sets;
- generated client absence checks;
- CI workflow behavior;
- non-authorization boundaries.

## 10. Required Outputs for the Selected Next Gate

The selected planning gate must produce:

- classification of each validation script;
- classification of each pinned authority SHA;
- classification of each required authority file set;
- whether the split pins are intended or unresolved;
- whether the file sets are intended or unresolved;
- recommended reconciliation path;
- files that may be candidates for a future authorization gate;
- files that remain blocked;
- verification commands for the later review gate;
- explicit non-authorization of code changes.

## 11. Decision on Validation Script Modification

Decision: NO-GO for this gate.

Reason:

Validation script changes are code changes. They require explicit future authorization after planning and review.

Candidate files that may be subject to future modification planning:

- `scripts/validate-contract-authority.mjs`
- `scripts/validate-contracts.mjs`
- `package.json`
- CI workflow files, if validation command behavior is involved

No change to these files is authorized by this decision gate.

## 12. Decision on OpenAPI Mutation

Decision: NO-GO.

Reason:

OpenAPI mutation requires a stable authority source and a future explicit OpenAPI mutation planning or implementation authorization gate.

No OpenAPI file may be changed.

## 13. Decision on Generated Clients

Decision: NO-GO.

Reason:

Generated client changes depend on reconciled authority pins and a generated artifact inventory.

No generated client changes are authorized.

## 14. Decision on Product Route Inventory

Decision: DEFER.

Reason:

Product route inventory depends on a stable contract authority reference.

No product route inventory is authorized.

## 15. Decision on Permission Representation

Decision: DEFER.

Reason:

Permission representation depends on confirmed and reconciled OpenAPI authority.

No permission representation model is selected.

## 16. Decision on Error and Disclosure Mapping

Decision: DEFER.

Reason:

Route-specific 401, 403, and non-disclosing 404 behavior depends on OpenAPI response authority and product route inventory.

No route-specific mapping is selected.

## 17. Decision on Persistent RBAC

Decision: NO-GO.

Reason:

Persistent RBAC requires:

- permission source authority;
- role/permission model;
- membership versus permission grant separation;
- data model review;
- migration authorization;
- runtime resolver authorization.

These remain future work.

## 18. Risk Review

### 18.1 Contract Drift Risk

Risk:

Different validation scripts may continue validating different contract snapshots.

Mitigation:

Select authority pin reconciliation planning before route or permission decisions.

### 18.2 Stale Pin Risk

Risk:

One pinned SHA may be stale.

Mitigation:

Require the planning gate to classify each pin and determine whether it is current, legacy, or intentionally split.

### 18.3 File-Set Drift Risk

Risk:

Required authority file sets may represent different product scopes.

Mitigation:

Require the planning gate to classify each required authority file and explain its purpose.

### 18.4 Premature Script Change Risk

Risk:

Changing validation scripts before planning may remove important guardrails.

Mitigation:

Keep validation script modification blocked until a later authorization gate.

### 18.5 Premature Implementation Risk

Risk:

Runtime or route work may start before contract authority is stable.

Mitigation:

Keep implementation explicitly blocked.

## 19. Confirmed Facts

Confirmed in this decision:

- Authority pin reconciliation is required before product route inventory.
- Authority file-set reconciliation is required before generated artifact inventory.
- Validation script modification is not authorized.
- OpenAPI mutation is not authorized.
- Generated client changes are not authorized.
- Product/public route implementation is not authorized.
- DB, ORM, migrations, deployment, secrets, UI, workflow, and formatting cleanup remain unauthorized.

## 20. Gaps

Known unresolved gaps after this decision:

- Authority pin reconciliation unresolved.
- Required authority file-set reconciliation unresolved.
- Validation script ownership unresolved.
- ErrorModel authority source unresolved.
- Generated artifact inventory unresolved.
- Generated client impact unresolved.
- Workspace path authority unresolved.
- Product route inventory unresolved.
- Permission representation unresolved.
- Error/disclosure mapping unresolved.
- First eligible product route slice unresolved.
- Persistent RBAC model unresolved.

## 21. Final Decision

Decision: GO to Backend Slice 0 Permission Guard OpenAPI Authority Pin Reconciliation Planning Gate.

This decision selects a documentation-only planning gate.

This decision does not authorize implementation.

This decision does not authorize validation script modification.

This decision does not authorize OpenAPI mutation.

This decision does not authorize generated client changes.

This decision does not authorize public/product route work.

This decision does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 22. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Permission Guard OpenAPI Authority Pin Reconciliation Planning Gate`

That gate should plan how to reconcile, classify, or intentionally preserve the current validation-script authority pin split.

## 23. Explicit Non-Authorization

This decision gate does not authorize:

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

## 24. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged OpenAPI Authority Source Confirmation Gate.
- Merged OpenAPI Authority Inventory Decision Gate.
- Merged OpenAPI Authority Inventory Review Gate.
- Merged OpenAPI RBAC Contract Alignment Decision Gate.
- Contract validation scripts.
- Existing Auth0 identity-only boundary.
- Existing route/path `workspaceId` authority.
- Existing workspace-before-permission ordering.
- Existing membership-before-permission ordering.
- Existing internal harness-only permission guard app wiring.
- Existing contract-first governance.

### Outputs

- Selected exactly one next path.
- Rejected proceeding directly to product route inventory.
- Rejected proceeding directly to permission representation.
- Rejected proceeding directly to generated artifact inventory.
- Rejected direct validation script modification.
- Rejected OpenAPI mutation.
- Selected authority pin reconciliation planning as the next prerequisite.

### Gaps

- Authority pin reconciliation unresolved.
- Required authority file-set reconciliation unresolved.
- Validation script ownership unresolved.
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

GO to `Backend Slice 0 Permission Guard OpenAPI Authority Pin Reconciliation Planning Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
