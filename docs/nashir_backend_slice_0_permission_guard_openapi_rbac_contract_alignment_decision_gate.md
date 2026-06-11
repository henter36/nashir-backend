# Nashir Backend Slice 0 — Permission Guard OpenAPI/RBAC Contract Alignment Decision Gate

## 1. Gate Classification

Gate type: Documentation-only decision gate.

This gate decides the next Backend Slice 0 path after the completed Permission Guard OpenAPI/RBAC Contract Alignment Planning Review Gate.

This gate does not authorize implementation.

This gate does not authorize OpenAPI mutation.

This gate does not authorize public route implementation.

This gate does not authorize product route implementation.

This gate does not authorize generated client changes.

This gate does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #79: `docs: review permission guard openapi rbac contract alignment planning`.
- Merged PR #78: `docs: plan permission guard openapi rbac contract alignment`.
- Merged PR #77: `docs: decide permission guard app wiring follow-up`.
- Merged PR #76: `docs: accept permission guard app wiring execution`.
- Merged PR #75: `docs: review permission guard app wiring execution`.
- Merged PR #74: `feat: wire permission guard app harness`.
- Accepted Auth0 identity-only boundary.
- Accepted route/path `workspaceId` authority.
- Accepted workspace-before-permission ordering.
- Accepted membership-before-permission ordering.
- Accepted internal harness-only permission guard app wiring.
- Accepted static/internal/deterministic harness permission source.
- Existing contract-first governance.
- Existing non-authorization of implementation.
- Existing non-authorization of OpenAPI mutation.
- Existing non-authorization of product/public routes.
- Existing non-authorization of DB, ORM, migrations, generated clients, deployment, secrets, UI, workflow, and formatting baseline cleanup.

## 3. Documented Facts

The following are documented facts from the merged planning and planning review gates:

1. Auth0 remains identity-only.
2. Auth0 is not workspace authority.
3. Auth0 is not permission authority.
4. Route/path `workspaceId` remains the accepted workspace authority.
5. Workspace context resolution must happen before permission enforcement.
6. Membership resolution must happen before permission enforcement.
7. `requestContext` must not become a permission bag.
8. Permissions must not be trusted from headers.
9. Permissions must not be trusted from body.
10. Permissions must not be trusted from query string.
11. Permissions must not be trusted from Auth0 claims.
12. Current permission guard app wiring is internal-harness-only.
13. Product route permission enforcement remains unauthorized.
14. Persistent RBAC remains unauthorized.
15. OpenAPI mutation remains unauthorized.
16. OpenAPI authority inventory remains unresolved.
17. Product route inventory remains unresolved.
18. Permission representation model remains unresolved.
19. Disclosure behavior by route remains unresolved.
20. Persistent RBAC model remains unresolved.
21. Generated client impact remains unresolved.

## 4. Decision Objective

This decision gate must select exactly one next path.

The selected path must reduce uncertainty without opening implementation.

The selected path must not mix:

- OpenAPI mutation;
- route implementation;
- RBAC persistence;
- generated client changes;
- runtime authorization implementation;
- DB/ORM/migration work.

## 5. Options Considered

### Option A — OpenAPI Authority Inventory Review

Description:

Create a documentation-only gate that inventories and confirms the authoritative OpenAPI sources relevant to future permission guard alignment.

This option reviews:

- where OpenAPI authority currently lives;
- which OpenAPI files are authoritative;
- whether backend route behavior currently has a corresponding OpenAPI authority;
- whether error models are contract-authoritative;
- whether generated contract artifacts exist and how they should be treated;
- which files must not be changed before explicit OpenAPI mutation authorization.

Decision: SELECTED.

Reason:

OpenAPI authority must be identified before any route inventory, permission representation decision, disclosure mapping, or generated-client impact decision can be safely made.

### Option B — Product Route Inventory Review

Description:

Create a documentation-only gate to inventory current and future product routes.

Decision: NO-GO for now.

Reason:

Route inventory should depend on knowing which OpenAPI source is authoritative. Starting with routes first risks drifting from the contract authority.

### Option C — Permission Representation Decision

Description:

Choose whether required permissions should live in route config, OpenAPI metadata, a policy map, or a mixed model.

Decision: NO-GO for now.

Reason:

Permission representation cannot be selected safely until OpenAPI authority is confirmed.

### Option D — Error and Disclosure Mapping Decision

Description:

Decide which routes use 403 and which use non-disclosing 404.

Decision: NO-GO for now.

Reason:

Disclosure mapping depends on route inventory and OpenAPI response authority. Both are not yet reviewed.

### Option E — Persistent RBAC Planning

Description:

Start planning production RBAC persistence and permission source.

Decision: NO-GO.

Reason:

Persistent RBAC requires authority, route, permission representation, and contract decisions first.

### Option F — Product Route Implementation Authorization

Description:

Authorize implementation of product route permission enforcement.

Decision: NO-GO.

Reason:

Implementation remains premature and explicitly blocked by prior gates.

## 6. Selected Path

Selected next path:

`Backend Slice 0 Permission Guard OpenAPI Authority Inventory Review Gate`

This selected path is documentation-only.

It must not implement code.

It must not mutate OpenAPI.

It must not add routes.

It must not change generated clients.

It must not introduce DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 7. Why OpenAPI Authority Inventory Comes First

OpenAPI authority inventory comes first because the planning review identified several unresolved dependencies:

- OpenAPI authority inventory unresolved;
- product route inventory unresolved;
- permission representation model unresolved;
- disclosure behavior by route unresolved;
- generated client impact unresolved.

These dependencies are ordered.

The first dependency is OpenAPI authority.

Without OpenAPI authority inventory:

- route inventory may use the wrong source;
- permission representation may be attached to the wrong contract location;
- 403/404 responses may not match the authoritative error model;
- generated client impact may be misclassified;
- implementation authorization may target the wrong API surface.

## 8. Decision Boundaries

The selected OpenAPI Authority Inventory Review Gate may review:

- OpenAPI authority file locations;
- OpenAPI-related documentation;
- error model authority references;
- generated contract boundary references;
- repository route/OpenAPI relationship;
- contract drift risks;
- future review criteria.

The selected gate must not:

- edit OpenAPI files;
- edit generated files;
- edit `src`;
- edit tests;
- add product routes;
- add public routes;
- add middleware;
- add DB/ORM/migrations;
- modify package scripts;
- change CI workflows;
- change deployment/secrets.

## 9. Required Inputs for the Selected Next Gate

The selected next gate must review:

- current repository file inventory for OpenAPI-related files;
- current docs referencing OpenAPI authority;
- current docs referencing `ErrorModel`;
- current docs referencing generated client boundaries;
- current docs referencing Auth0/RBAC source of truth;
- current docs referencing workspace identity and route/path `workspaceId`;
- current app wiring boundaries;
- current non-authorization constraints.

## 10. Required Outputs for the Selected Next Gate

The selected next gate must produce:

- list of OpenAPI authority files or explicit statement that authority is external/deferred;
- list of OpenAPI-adjacent files that are not authority;
- list of generated artifacts, if any, and whether they are read-only for the current stage;
- error model authority status;
- workspace-scoped path authority status;
- known gaps;
- contract drift risks;
- recommendation for the next gate.

## 11. Explicit Non-Authorization for Selected Next Gate

The selected next gate must explicitly state that it does not authorize:

- OpenAPI mutation;
- generated client changes;
- route implementation;
- product/public route implementation;
- permission representation selection;
- persistent RBAC implementation;
- DB, ORM, migrations;
- deployment/secrets;
- UI/workflow changes;
- formatting baseline cleanup.

## 12. Decision on Product Routes

Decision: NO-GO to product route implementation.

Reason:

Product routes require:

- OpenAPI authority inventory;
- product route inventory;
- permission representation decision;
- error/disclosure mapping;
- implementation authorization.

None of those implementation prerequisites are complete yet.

## 13. Decision on Persistent RBAC

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

## 14. Decision on OpenAPI Mutation

Decision: NO-GO to OpenAPI mutation.

Reason:

The next gate is an inventory/review gate only.

OpenAPI mutation can only be considered after authority inventory confirms:

- authoritative file locations;
- mutation prerequisites;
- generated client impact;
- error model compatibility;
- route alignment requirements.

## 15. Decision on Permission Representation

Decision: DEFER.

Reason:

The project must first know which OpenAPI source is authoritative.

Candidate models remain:

- route configuration;
- OpenAPI metadata;
- separate policy map;
- mixed route config plus OpenAPI metadata.

No option is selected in this decision gate.

## 16. Decision on Error and Disclosure Mapping

Decision: DEFER.

Reason:

Route-specific 403/404 behavior depends on both OpenAPI response contract and route inventory.

The current accepted rule remains:

- 403 may be used for disclosing permission denial;
- 404 may be used for non-disclosing denial;
- cross-workspace resource mismatch returns 404.

No route-specific mapping is selected in this decision gate.

## 17. Risk Review

### 17.1 Contract Drift Risk

Risk:

Selecting route inventory or permission representation before confirming OpenAPI authority could produce contract drift.

Mitigation:

Select OpenAPI Authority Inventory Review first.

### 17.2 Premature Implementation Risk

Risk:

Moving directly to implementation would bypass unresolved contract decisions.

Mitigation:

Keep all implementation explicitly blocked.

### 17.3 RBAC Authority Ambiguity Risk

Risk:

Persistent RBAC planning could encode the wrong permission source.

Mitigation:

Defer persistent RBAC until after OpenAPI and permission authority decisions.

### 17.4 Generated Client Drift Risk

Risk:

Generated clients may be changed before their authority and generation source are understood.

Mitigation:

Block generated client changes and require inventory first.

### 17.5 Disclosure Contract Risk

Risk:

403/404 mapping could be inconsistent with OpenAPI and product route expectations.

Mitigation:

Defer disclosure mapping until after OpenAPI authority and route inventory review.

## 18. Gaps

Known unresolved gaps after this decision:

- OpenAPI authority inventory unresolved;
- product route inventory unresolved;
- permission representation model unresolved;
- disclosure behavior by route unresolved;
- persistent RBAC model unresolved;
- generated client impact unresolved;
- first eligible product route slice unresolved.

These gaps are expected.

This gate selects the first prerequisite to reduce them.

## 19. Final Decision

Decision: GO to Backend Slice 0 Permission Guard OpenAPI Authority Inventory Review Gate.

This decision selects a documentation-only review gate.

This decision does not authorize implementation.

This decision does not authorize OpenAPI mutation.

This decision does not authorize public/product route work.

This decision does not authorize generated client changes.

This decision does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 20. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Permission Guard OpenAPI Authority Inventory Review Gate`

The next gate should inventory the OpenAPI authority surface and decide whether the following gate should be:

- product route inventory review;
- permission representation decision;
- error/disclosure mapping decision;
- generated client impact review;
- or another prerequisite gate.

## 21. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged Planning Review Gate.
- Accepted Permission Guard App Wiring stream.
- Existing Auth0 identity-only boundary.
- Existing route/path workspace boundary.
- Existing permission guard primitive.
- Existing internal harness execution.
- Existing contract-first governance.

### Outputs

- Selected exactly one next path.
- Rejected direct product route implementation.
- Rejected direct persistent RBAC.
- Rejected OpenAPI mutation.
- Deferred permission representation.
- Deferred error/disclosure mapping.
- Selected OpenAPI authority inventory as the next prerequisite.

### Gaps

- OpenAPI authority inventory unresolved.
- Product route inventory unresolved.
- Permission representation unresolved.
- Error/disclosure mapping unresolved.
- Persistent RBAC unresolved.
- Generated client impact unresolved.

### Transition Decision

GO to `Backend Slice 0 Permission Guard OpenAPI Authority Inventory Review Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
