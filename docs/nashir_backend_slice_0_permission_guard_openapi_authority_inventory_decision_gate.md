# Nashir Backend Slice 0 — Permission Guard OpenAPI Authority Inventory Decision Gate

## 1. Gate Classification

Gate type: Documentation-only decision gate.

This gate decides the next Backend Slice 0 path after the completed Permission Guard OpenAPI Authority Inventory Review Gate.

This gate does not authorize implementation.

This gate does not authorize OpenAPI mutation.

This gate does not authorize public route implementation.

This gate does not authorize product route implementation.

This gate does not authorize generated client changes.

This gate does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #81: `docs: review permission guard openapi authority inventory`.
- Merged PR #80: `docs: decide permission guard openapi rbac contract alignment`.
- Merged PR #79: `docs: review permission guard openapi rbac contract alignment planning`.
- Merged PR #78: `docs: plan permission guard openapi rbac contract alignment`.
- Merged PR #77: `docs: decide permission guard app wiring follow-up`.
- Accepted Auth0 identity-only boundary.
- Accepted route/path `workspaceId` authority.
- Accepted workspace-before-permission ordering.
- Accepted membership-before-permission ordering.
- Accepted internal harness-only permission guard app wiring.
- Existing contract-first governance.
- Existing non-authorization of implementation.
- Existing non-authorization of OpenAPI mutation.
- Existing non-authorization of generated client changes.
- Existing non-authorization of product/public routes.
- Existing non-authorization of DB, ORM, migrations, deployment, secrets, UI, workflow, and formatting baseline cleanup.

## 3. Documented Facts

The OpenAPI Authority Inventory Review Gate documented the following facts:

1. OpenAPI authority remains unresolved.
2. Direct OpenAPI source file location remains unresolved.
3. ErrorModel authority source remains unresolved.
4. Generated artifact inventory remains unresolved.
5. Generated client impact remains unresolved.
6. Workspace path authority remains unresolved.
7. Product route inventory remains unresolved.
8. Permission representation remains unresolved.
9. Error/disclosure mapping remains unresolved.
10. First eligible product route slice remains unresolved.
11. Persistent RBAC model remains unresolved.

## 4. Decision Objective

This decision gate must select exactly one next path.

The selected next path must reduce OpenAPI authority uncertainty without opening implementation.

The selected next path must not mix:

- OpenAPI mutation;
- generated client changes;
- product route implementation;
- public route implementation;
- permission representation selection;
- DB, ORM, or migration work.

## 5. Options Considered

### Option A — OpenAPI Authority Source Confirmation Gate

Description:

Create a documentation-only gate to confirm where OpenAPI authority currently lives.

This option should determine whether the OpenAPI authority is:

- inside `henter36/nashir-backend`;
- external to `henter36/nashir-backend`;
- checked out by CI from another repository;
- documented but not present locally;
- intentionally deferred for the current Backend Slice 0 stage.

Decision: SELECTED.

Reason:

The inventory review found OpenAPI authority unresolved. Before route inventory, permission representation, generated client impact, or OpenAPI mutation can be planned, the project must confirm the source of authority.

### Option B — Generated Artifact Inventory Review

Description:

Create a documentation-only gate to inventory generated artifacts and generated clients.

Decision: NO-GO for now.

Reason:

Generated artifact inventory depends on knowing the authoritative OpenAPI source and generation boundary.

### Option C — Product Route Inventory Review

Description:

Create a documentation-only gate to inventory current and future product routes.

Decision: NO-GO for now.

Reason:

Product route inventory should come after OpenAPI authority source is confirmed, otherwise route inventory may drift from the contract authority.

### Option D — Permission Representation Decision

Description:

Choose whether permission requirements live in route configuration, OpenAPI metadata, a policy map, or a mixed model.

Decision: NO-GO for now.

Reason:

Permission representation depends on knowing whether OpenAPI authority is local, external, generated, or deferred.

### Option E — Error and Disclosure Mapping Decision

Description:

Decide route-specific 401, 403, and non-disclosing 404 behavior.

Decision: NO-GO for now.

Reason:

Disclosure mapping depends on OpenAPI response authority and product route inventory.

### Option F — OpenAPI Mutation Planning

Description:

Plan changes to OpenAPI files.

Decision: NO-GO for now.

Reason:

OpenAPI mutation cannot be planned before confirming which OpenAPI source is authoritative.

### Option G — Product Route Implementation Authorization

Description:

Authorize product route permission enforcement implementation.

Decision: NO-GO.

Reason:

Implementation remains premature and explicitly blocked by prior gates.

## 6. Selected Path

Selected next path:

`Backend Slice 0 Permission Guard OpenAPI Authority Source Confirmation Gate`

This selected path is documentation-only.

It must not implement code.

It must not mutate OpenAPI.

It must not modify generated clients.

It must not add product routes.

It must not add public routes.

It must not add DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 7. Why Source Confirmation Comes Before Other Work

Source confirmation comes before other work because the project currently cannot safely answer:

- which OpenAPI file is authoritative;
- whether OpenAPI authority is local or external;
- whether ErrorModel is owned by a local or external contract;
- whether generated artifacts are authoritative or derived;
- whether generated client changes would be required by OpenAPI mutation;
- which workspace-scoped paths must be inventoried;
- which product routes are contract-covered.

Without confirming the source of authority, all later OpenAPI/RBAC decisions risk contract drift.

## 8. Required Inputs for the Selected Next Gate

The selected next gate must review:

- repository files and docs referencing OpenAPI authority;
- CI behavior that may check out an external contract authority;
- docs referencing ErrorModel;
- docs referencing generated clients or generated artifacts;
- docs referencing Auth/RBAC source of truth;
- docs referencing workspace identity and route/path `workspaceId`;
- current route/OpenAPI relationship;
- prior OpenAPI/RBAC alignment gates;
- explicit non-authorization boundaries.

## 9. Required Outputs for the Selected Next Gate

The selected next gate must produce:

- confirmed OpenAPI authority source status;
- whether authority is local, external, deferred, or unresolved;
- list of files or repositories that are authority candidates;
- list of files that are not authority;
- ErrorModel authority status;
- generated artifact authority status;
- CI/checkout authority implications, if any;
- contract drift risks;
- recommended next gate.

## 10. Explicit Non-Authorization for Selected Next Gate

The selected next gate must explicitly state that it does not authorize:

- OpenAPI mutation;
- generated client changes;
- generated artifact regeneration;
- runtime implementation;
- product route implementation;
- public route implementation;
- permission representation selection;
- persistent RBAC implementation;
- DB, ORM, migrations;
- deployment/secrets;
- UI/workflow changes;
- formatting baseline cleanup.

## 11. Decision on Product Route Inventory

Decision: DEFER.

Reason:

Product route inventory should wait until OpenAPI authority source is confirmed.

No product route inventory is authorized by this gate.

## 12. Decision on Permission Representation

Decision: DEFER.

Reason:

Permission representation depends on whether OpenAPI authority is local, external, generated, or deferred.

Candidate models remain:

- route configuration;
- OpenAPI metadata;
- separate policy map;
- mixed route configuration plus OpenAPI metadata.

No model is selected in this decision gate.

## 13. Decision on Error and Disclosure Mapping

Decision: DEFER.

Reason:

Route-specific 401, 403, and 404 mapping depends on OpenAPI response authority and route inventory.

The current accepted behavior remains:

- 401 for missing or invalid auth;
- 403 for disclosing permission denial;
- 404 for non-disclosing permission denial;
- 404 for cross-workspace resource mismatch.

No route-specific mapping is selected in this decision gate.

## 14. Decision on Generated Clients

Decision: NO-GO to generated client changes.

Reason:

Generated client impact cannot be evaluated until OpenAPI authority source and generation boundary are confirmed.

Generated client changes remain blocked.

## 15. Decision on OpenAPI Mutation

Decision: NO-GO to OpenAPI mutation.

Reason:

OpenAPI mutation requires a confirmed authority source and a later explicit mutation planning or implementation authorization gate.

No OpenAPI file may be changed from this decision gate.

## 16. Decision on Persistent RBAC

Decision: NO-GO to persistent RBAC.

Reason:

Persistent RBAC requires:

- permission source authority;
- role/permission model;
- membership versus permission grant separation;
- data model review;
- migration authorization;
- runtime resolver authorization.

These remain future work.

## 17. Risk Review

### 17.1 Contract Drift Risk

Risk:

Route inventory, permission representation, or OpenAPI mutation could target the wrong contract surface.

Mitigation:

Select OpenAPI Authority Source Confirmation first.

### 17.2 Generated Client Drift Risk

Risk:

Generated clients may be modified before confirming their authority and source.

Mitigation:

Block generated client changes and confirm authority source first.

### 17.3 ErrorModel Authority Risk

Risk:

Permission denial behavior could be mapped to a non-authoritative error model.

Mitigation:

Require ErrorModel authority status in the selected next gate.

### 17.4 Route Sequencing Risk

Risk:

Product route planning could start before workspace-scoped OpenAPI paths are known.

Mitigation:

Defer product route inventory.

### 17.5 Premature Implementation Risk

Risk:

Runtime permission enforcement could be implemented before contract alignment is complete.

Mitigation:

Keep implementation explicitly blocked.

## 18. Gaps

Known unresolved gaps after this decision:

- OpenAPI authority source unresolved;
- Direct OpenAPI file location unresolved;
- ErrorModel authority source unresolved;
- Generated artifact inventory unresolved;
- Generated client impact unresolved;
- Workspace path authority unresolved;
- Product route inventory unresolved;
- Permission representation unresolved;
- Error/disclosure mapping unresolved;
- First eligible product route slice unresolved;
- Persistent RBAC model unresolved.

These gaps are expected.

This gate selects source confirmation as the next prerequisite to reduce them.

## 19. Final Decision

Decision: GO to Backend Slice 0 Permission Guard OpenAPI Authority Source Confirmation Gate.

This decision selects a documentation-only confirmation gate.

This decision does not authorize implementation.

This decision does not authorize OpenAPI mutation.

This decision does not authorize public/product route work.

This decision does not authorize generated client changes.

This decision does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 20. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Permission Guard OpenAPI Authority Source Confirmation Gate`

The next gate should confirm whether OpenAPI authority is local, external, deferred, or still unresolved.

The next gate should recommend whether the following gate should be:

- Generated artifact inventory review;
- product route inventory review;
- permission representation decision;
- error/disclosure mapping decision;
- OpenAPI mutation planning;
- or another prerequisite gate.

## 21. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged OpenAPI Authority Inventory Review Gate.
- Merged OpenAPI/RBAC Contract Alignment Decision Gate.
- Accepted Permission Guard App Wiring stream.
- Existing Auth0 identity-only boundary.
- Existing route/path workspace boundary.
- Existing permission guard primitive.
- Existing internal harness execution.
- Existing contract-first governance.

### Outputs

- Selected exactly one next path.
- Rejected direct generated artifact inventory for now.
- Rejected direct product route inventory for now.
- Rejected permission representation decision for now.
- Rejected error/disclosure mapping decision for now.
- Rejected OpenAPI mutation.
- Rejected implementation.
- Selected OpenAPI authority source confirmation as the next prerequisite.

### Gaps

- OpenAPI authority source unresolved.
- Direct OpenAPI file location unresolved.
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

GO to `Backend Slice 0 Permission Guard OpenAPI Authority Source Confirmation Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
