# Nashir Backend Slice 0 — Permission Guard OpenAPI Authority Inventory Review Gate

## 1. Gate Classification

Gate type: Documentation-only inventory review gate.

This gate inventories the OpenAPI authority surface relevant to future Permission Guard / RBAC / workspace contract alignment.

This gate does not authorize implementation.

This gate does not authorize OpenAPI mutation.

This gate does not authorize public route implementation.

This gate does not authorize product route implementation.

This gate does not authorize generated client changes.

This gate does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #80: `docs: decide permission guard openapi rbac contract alignment`.
- Merged PR #79: `docs: review permission guard openapi rbac contract alignment planning`.
- Merged PR #78: `docs: plan permission guard openapi rbac contract alignment`.
- Merged PR #77: `docs: decide permission guard app wiring follow-up`.
- Merged PR #76: `docs: accept permission guard app wiring execution`.
- Merged PR #74: `feat: wire permission guard app harness`.
- Existing Backend Slice 0 Auth0 identity-only boundary.
- Existing route/path `workspaceId` authority.
- Existing workspace-before-permission ordering.
- Existing membership-before-permission ordering.
- Existing internal harness-only permission guard app wiring.
- Existing non-authorization of OpenAPI mutation.
- Existing non-authorization of product/public routes.
- Existing non-authorization of generated clients, DB, ORM, migrations, deployment, secrets, UI, workflow, and formatting baseline cleanup.

## 3. Review Objective

This gate answers one question:

What is the current OpenAPI authority surface that must be respected before future permission representation, route inventory, disclosure mapping, or implementation authorization?

This gate does not decide the final permission representation model.

This gate does not decide the final product route inventory.

This gate does not decide route-specific 403/404 disclosure behavior.

This gate does not authorize OpenAPI mutation.

## 4. Inventory Scope

### 4.1 In Scope

This inventory may review:

- OpenAPI authority file locations.
- OpenAPI-related repository documentation.
- Error model authority references.
- Generated contract boundary references.
- Contract authority references.
- Auth/RBAC source-of-truth references.
- Workspace identity and `workspaceId` route/path references.
- Existing route/OpenAPI relationship.
- Contract drift risks.
- Future gate prerequisites.

### 4.2 Out of Scope

This inventory must not perform:

- OpenAPI file edits.
- generated file edits.
- runtime implementation.
- route implementation.
- controller implementation.
- product route implementation.
- public route implementation.
- permission representation selection.
- persistent RBAC implementation.
- DB, ORM, or migration work.
- deployment or secrets changes.
- UI or workflow changes.
- formatting baseline cleanup.

## 5. Authority Inventory Method

This review uses a repository-level authority classification approach.

Each discovered or referenced artifact is classified as one of:

| Classification | Meaning |
|---|---|
| Authority | May define the contract source of truth |
| Authority reference | Refers to an external or upstream authority |
| Planning evidence | Supports sequencing but is not itself authority |
| Generated / derived | Must not be manually changed without generation authority |
| Non-authority | Not a contract source of truth |

## 6. Current Inventory Findings

### 6.1 Direct OpenAPI source files

Current review finding:

No direct OpenAPI mutation is authorized by this gate.

Direct OpenAPI source authority remains unresolved until a future gate explicitly confirms file locations and mutation rules.

Review result: OPEN GAP.

Disposition:

Carry forward to the next gate.

### 6.2 OpenAPI-related planning documents

The current repository includes documentation that references OpenAPI/RBAC alignment and contract-first governance.

Classification:

Planning evidence.

Review result: PASS.

These documents help determine sequencing but do not themselves authorize OpenAPI mutation.

### 6.3 Error model contract references

The current repository includes prior planning/review references to ErrorModel and response contract behavior.

Classification:

Authority reference or planning evidence, depending on the upstream OpenAPI authority location.

Review result: PARTIAL.

Reason:

The ErrorModel concept is referenced, but this gate does not confirm the authoritative OpenAPI file or generated source that owns the model.

Disposition:

Carry forward to future OpenAPI authority confirmation.

### 6.4 Generated artifacts

Generated artifact authority is unresolved in this gate.

Classification:

Generated / derived, if present.

Review result: OPEN GAP.

Decision:

Generated files must remain read-only unless a future explicit gate authorizes generation or generated client changes.

### 6.5 Route implementation files

Route implementation files are not OpenAPI authority.

Classification:

Runtime implementation, not contract authority.

Review result: PASS.

Decision:

Do not infer OpenAPI authority from runtime route files during this gate.

### 6.6 Internal permission guard harness

The internal permission guard harness is not OpenAPI authority.

Classification:

Runtime harness.

Review result: PASS.

Decision:

Do not use the internal harness route as product API contract authority.

## 7. Current Authority Map

| Surface | Current Status | Classification | Decision |
|---|---|---|---|
| Direct OpenAPI source file | unresolved | Authority candidate | inventory required before mutation |
| OpenAPI planning docs | present as planning evidence | Planning evidence | usable for sequencing only |
| ErrorModel references | present as contract references | Authority reference / planning evidence | authority source unresolved |
| generated artifacts | unresolved | Generated / derived candidate | read-only until authorized |
| runtime route files | present | Non-authority for contract | do not treat as OpenAPI authority |
| internal harness route | present | Non-authority for product API | do not treat as product contract |

## 8. Contract Drift Review

Contract drift risk remains active.

Risk:

If product routes, permission metadata, generated clients, or error/disclosure behavior are implemented before the OpenAPI authority is confirmed, backend behavior may diverge from the contract.

Review result: ACTIVE RISK.

Mitigation:

Do not start product route inventory, permission representation selection, OpenAPI mutation, generated client work, or implementation until the OpenAPI authority source is confirmed.

## 9. Workspace Path Authority Review

The accepted backend boundary says route/path `workspaceId` is workspace authority for the current backend slice.

OpenAPI impact:

Future OpenAPI path inventory must confirm which paths are workspace-scoped and where `workspaceId` appears.

Current status:

Unresolved.

Review result: OPEN GAP.

Disposition:

Carry forward to a future route/OpenAPI inventory gate.

## 10. Permission Representation Dependency Review

Permission representation options remain:

- route configuration;
- OpenAPI metadata;
- separate policy map;
- mixed route config plus OpenAPI metadata.

Current status:

Unresolved.

Review result: DEFER.

Reason:

A representation decision depends on knowing which OpenAPI surface is authoritative.

## 11. Error and Disclosure Dependency Review

Current accepted behavior remains:

- 401 for missing or invalid auth;
- 403 for disclosing permission denial;
- 404 for non-disclosing permission denial;
- 404 for cross-workspace resource mismatch.

Current OpenAPI authority status:

Unresolved.

Review result: DEFER.

Reason:

Route-specific 403/404 mapping must wait for OpenAPI authority and product route inventory.

## 12. Generated Client Impact Review

Generated client impact is unresolved.

Review result: OPEN GAP.

Decision:

Generated client changes remain blocked.

Future generated client impact review must answer:

- what generator is authoritative;
- which generated files exist;
- whether generated files are checked in;
- whether OpenAPI mutation would require generated output;
- which gate may authorize generation.

## 13. Product Route Inventory Dependency Review

Product route inventory is not selected as the immediate next step from this gate.

Reason:

Product route inventory should come after OpenAPI authority is confirmed or explicitly declared external/deferred.

Review result: DEFER.

## 14. Persistent RBAC Dependency Review

Persistent RBAC remains blocked.

Reason:

Persistent RBAC requires:

- permission source authority;
- role/permission model;
- membership versus permission grant separation;
- data model review;
- migration authorization;
- runtime resolver authorization.

Review result: NO-GO.

## 15. Inventory Gaps

Current unresolved gaps:

- direct OpenAPI authority file location unresolved;
- OpenAPI mutation rules unresolved;
- ErrorModel authority source unresolved;
- generated artifact inventory unresolved;
- generated client impact unresolved;
- workspace-scoped path authority unresolved;
- product route inventory unresolved;
- permission representation unresolved;
- error/disclosure mapping unresolved;
- first eligible product route slice unresolved;
- persistent RBAC model unresolved.

## 16. Review Decision

Decision: GO to Backend Slice 0 Permission Guard OpenAPI Authority Inventory Decision Gate.

Reason:

This inventory review confirms that OpenAPI authority remains the first unresolved prerequisite.

A decision gate is required to choose the next step:

- confirm external/upstream OpenAPI authority;
- run a narrower file inventory;
- run generated artifact inventory;
- run route inventory only after OpenAPI authority is clarified;
- or authorize a later OpenAPI mutation planning gate.

This review does not authorize implementation.

This review does not authorize OpenAPI mutation.

This review does not authorize generated client changes.

This review does not authorize product/public routes.

This review does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 17. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Permission Guard OpenAPI Authority Inventory Decision Gate`

That gate must select exactly one next path.

Recommended options for that decision gate:

1. OpenAPI authority source confirmation gate.
2. Generated artifact inventory review gate.
3. Product route inventory review gate, only if OpenAPI authority is confirmed.
4. Permission representation decision gate, only if OpenAPI authority is confirmed.
5. Error/disclosure mapping decision gate, only if OpenAPI authority and route inventory are confirmed.

## 18. Explicit Non-Authorization

This review gate does not authorize:

- runtime implementation;
- route implementation;
- controller implementation;
- product route implementation;
- public route implementation;
- OpenAPI mutation;
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

## 19. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged OpenAPI/RBAC Contract Alignment Decision Gate.
- Accepted Permission Guard App Wiring stream.
- Existing Auth0 identity-only boundary.
- Existing route/path workspace boundary.
- Existing permission guard primitive.
- Existing internal harness execution.
- Existing contract-first governance.

### Outputs

- OpenAPI authority inventory review.
- Classification of known OpenAPI-adjacent surfaces.
- Confirmation that OpenAPI authority remains unresolved.
- Confirmation that implementation remains blocked.
- GO recommendation to a decision gate.

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

GO to `Backend Slice 0 Permission Guard OpenAPI Authority Inventory Decision Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
