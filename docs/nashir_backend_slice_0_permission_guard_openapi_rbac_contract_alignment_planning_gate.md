# Nashir Backend Slice 0 — Permission Guard OpenAPI/RBAC Contract Alignment Planning Gate

## 1. Gate Classification

Gate type: Documentation-only planning gate.

This gate plans the alignment between:

- OpenAPI contract expectations;
- Auth0 identity-only boundary;
- workspace context resolution;
- permission guard behavior;
- RBAC authority boundaries;
- future product route permission enforcement;
- future persistent permission source planning.

This gate does not authorize implementation.

This gate does not authorize OpenAPI mutation.

This gate does not authorize public route implementation.

This gate does not authorize product route implementation.

This gate does not authorize generated client changes.

This gate does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #71: `docs: plan permission guard app wiring`.
- Merged PR #72: `docs: review permission guard app wiring planning`.
- Merged PR #73: `docs: authorize permission guard app wiring implementation`.
- Merged PR #74: `feat: wire permission guard app harness`.
- Merged PR #75: `docs: review permission guard app wiring execution`.
- Merged PR #76: `docs: accept permission guard app wiring execution`.
- Merged PR #77: `docs: decide permission guard app wiring follow-up`.
- Current Backend Slice 0 Auth0 identity-only boundary.
- Current route/path `workspaceId` authority.
- Current workspace context resolution boundary.
- Current permission guard primitive boundary.
- Current internal-only permission guard harness boundary.
- Existing contract-first governance.
- Existing non-authorization of public/product routes.
- Existing non-authorization of OpenAPI mutation.
- Existing non-authorization of DB, ORM, migrations, deployment, secrets, UI, workflow, and formatting baseline cleanup.

## 3. Documented Facts

The following are documented facts from the accepted and merged gate stream:

1. Auth0 is identity-only.
2. Auth0 is not workspace authority.
3. Auth0 is not permission authority.
4. Route/path `workspaceId` is the accepted workspace authority for the current backend slice.
5. Workspace context resolution must happen before permission evaluation.
6. Workspace membership must be resolved before permission evaluation.
7. `requestContext` remains actor/workspace context, not a permission bag.
8. Permission source is not trusted from headers.
9. Permission source is not trusted from body.
10. Permission source is not trusted from query string.
11. Permission source is not trusted from Auth0 claims.
12. The accepted app wiring implementation is internal-harness-only.
13. Product/public route permission enforcement has not been authorized.
14. Persistent RBAC has not been authorized.
15. OpenAPI mutation has not been authorized.

## 4. Planning Inference

The following are planning inferences from the documented facts:

1. Product route permission enforcement should not start until the OpenAPI/RBAC/workspace contract boundary is aligned.
2. Persistent RBAC should not start until the permission authority and permission source boundaries are aligned.
3. OpenAPI mutation should not start until the expected contract behavior is documented and reviewed.
4. The next safe step is a planning gate that maps current backend security boundaries to future OpenAPI and route behavior.
5. Future implementation must remain blocked until a separate implementation authorization gate explicitly allows it.

## 5. Purpose of This Planning Gate

This gate plans how the accepted internal permission guard app wiring should later connect to production contract behavior.

This gate should establish:

- what must be aligned before product route permission enforcement;
- what must be aligned before persistent RBAC;
- what must be aligned before OpenAPI mutation;
- how permission decisions map to API error behavior;
- how workspace boundaries map to route and OpenAPI path design;
- how future gates should sequence planning, review, authorization, execution, review, and acceptance.

## 6. Scope Boundary

### 6.1 In Scope

This gate may plan:

- OpenAPI/RBAC/workspace alignment requirements;
- route enforcement prerequisites;
- permission source boundary prerequisites;
- error and disclosure behavior prerequisites;
- future gate sequence;
- future review criteria;
- explicit non-authorization boundaries.

### 6.2 Out of Scope

This gate must not perform:

- runtime implementation;
- route implementation;
- controller implementation;
- public API implementation;
- product API implementation;
- OpenAPI file changes;
- generated client changes;
- DB schema changes;
- ORM model changes;
- migrations;
- deployment changes;
- secrets changes;
- UI changes;
- workflow changes;
- formatting baseline cleanup.

## 7. Current Boundary Map

| Boundary | Current Accepted State | Planning Implication |
|---|---|---|
| Identity | Auth0 identity-only | OpenAPI security must not imply Auth0 permissions as authority |
| Workspace | route/path `workspaceId` | OpenAPI paths must preserve workspace-scoped routes where required |
| Request context | actorId + workspaceId | Do not add roles/permissions to requestContext without a future gate |
| Membership | resolver boundary before permission | Product routes must not bypass workspace membership resolution |
| Permission guard | primitive already exists | Contract alignment must decide how routes declare required permissions |
| Permission source | static/internal harness only | Production permission source remains future scope |
| Disclosure | 403 or 404 behavior exists | OpenAPI error contract must document when each is expected |
| Public/product routes | not authorized | Must remain blocked until later authorization |
| Persistence | not authorized | DB/ORM/migrations remain blocked |

## 8. OpenAPI Alignment Questions

The next review must answer these questions before any OpenAPI mutation:

1. Which OpenAPI authority file or files are authoritative for backend route behavior?
2. Which paths are workspace-scoped and therefore require `workspaceId` in the route?
3. Which future product routes require permission enforcement?
4. Which operations are public, authenticated-only, workspace-member-only, or permission-protected?
5. Should required permissions be represented in OpenAPI metadata, route configuration, a separate policy map, or both?
6. How should OpenAPI represent 401, 403, and 404 responses for protected workspace resources?
7. Does the existing `ErrorModel` remain sufficient for permission denials?
8. Should non-disclosing 404 be documented as intentional behavior?
9. Should generated clients see 403 and 404 as separate contract responses?
10. Which OpenAPI changes must remain blocked until after this alignment is reviewed?

## 9. RBAC Alignment Questions

The next review must answer these questions before persistent RBAC work:

1. What is the future production permission source?
2. Is the permission source DB-backed, config-backed, policy-backed, or hybrid?
3. Where are role-to-permission mappings defined?
4. Are permissions workspace-specific?
5. Are permissions actor-specific, membership-specific, role-specific, or policy-specific?
6. Is membership separate from permission grants?
7. How are workspace owners/admins represented?
8. How are system actors represented, if any?
9. How are permission changes audited?
10. Which decisions are required before DB/ORM/migration planning?

## 10. Route Enforcement Alignment Questions

The next review must answer these questions before product route implementation:

1. Where will route-level required permissions be declared?
2. Does every workspace-scoped product route require `workspaceContextGuard`?
3. Does every protected product route require `permissionGuard` after workspace context?
4. How are route params validated before permission evaluation?
5. How are resource workspace mismatches detected?
6. Which routes use disclosing 403?
7. Which routes use non-disclosing 404?
8. Is permission enforcement route-local, plugin-based, or middleware/hook-based?
9. How are test harness routes kept separate from production routes?
10. What is the first product route slice eligible for implementation after alignment?

## 11. Error and Disclosure Alignment

The future contract must preserve the following expectations unless a later gate explicitly changes them:

- missing or invalid auth returns 401;
- failed workspace resolution may return 404 where non-disclosure is required;
- missing permission may return 403 in disclosing contexts;
- missing permission may return 404 in non-disclosing contexts;
- cross-workspace resource mismatch returns 404;
- denial responses must not expose granted permissions;
- denial responses must not expose Auth0 claims;
- denial responses must not expose token details;
- denial responses must not expose stack traces.

Open question:

- Which product routes should use disclosing behavior and which should use non-disclosing behavior?

Decision in this gate:

- Defer route-specific disclosure mapping to the next review gate.

## 12. Permission Requirement Representation Options

### Option A — Required Permission in Route Configuration

Description:

Each route declares the required permission in backend route configuration.

Benefits:

- direct runtime enforcement;
- simple to test;
- avoids OpenAPI-specific execution dependency.

Risks:

- possible drift if OpenAPI does not reflect the same required permission.

Planning status: Candidate.

### Option B — Required Permission in OpenAPI Metadata

Description:

OpenAPI includes a vendor extension or equivalent metadata for required permissions.

Benefits:

- contract-visible;
- supports generated documentation and policy review.

Risks:

- requires careful contract governance;
- may require generated client/tooling updates.

Planning status: Candidate, but not authorized for mutation in this gate.

### Option C — Separate Policy Map

Description:

Permissions are declared in a separate policy map that links route identifiers to required permissions.

Benefits:

- decouples policy from route code and OpenAPI;
- can support future policy engines.

Risks:

- another source of truth;
- drift risk unless strongly governed.

Planning status: Candidate.

### Option D — Mixed Route Config + OpenAPI Metadata

Description:

Route config is runtime authority and OpenAPI metadata is contract authority, both verified by tests.

Benefits:

- runtime clarity;
- contract clarity;
- drift can be detected.

Risks:

- requires validation tooling.

Planning status: Strong candidate for future review, but not selected for implementation in this gate.

## 13. Planning Decision on Permission Representation

Decision: Defer final representation choice to the Contract Alignment Review Gate.

Reason:

This planning gate identifies viable models but does not have enough reviewed contract inventory to select a final authority model.

Required next review:

- compare current OpenAPI authority;
- compare current route inventory;
- determine whether metadata, route config, policy map, or mixed model should be the future path.

## 14. Product Route Sequencing Decision

Decision: NO-GO to product route implementation from this gate.

Reason:

Product route implementation requires:

- OpenAPI/RBAC contract alignment review;
- route enforcement model selection;
- error/disclosure mapping;
- permission source boundary decision;
- implementation authorization.

No product route work may start from this planning gate.

## 15. Persistent RBAC Sequencing Decision

Decision: NO-GO to persistent RBAC implementation from this gate.

Reason:

Persistent RBAC requires:

- authority decision;
- permission source decision;
- data model decision;
- migration authorization;
- runtime resolver authorization;
- test plan authorization.

No DB, ORM, or migration work may start from this planning gate.

## 16. OpenAPI Mutation Sequencing Decision

Decision: NO-GO to OpenAPI mutation from this gate.

Reason:

OpenAPI mutation requires a review gate that first confirms:

- current OpenAPI authority paths;
- current route scope;
- required permission representation strategy;
- error model compatibility;
- generated client impact.

No OpenAPI file may be changed from this planning gate.

## 17. Proposed Next Review Criteria

The next review gate should verify:

- current OpenAPI authority files are identified;
- route inventory is identified;
- workspace-scoped paths are identified;
- expected security behavior is mapped;
- expected error behavior is mapped;
- permission representation options are compared;
- drift risks are identified;
- a single next implementation or planning path is selected;
- all non-authorization boundaries remain explicit.

## 18. Required Future Gate Sequence

Recommended future sequence:

1. Permission Guard OpenAPI/RBAC Contract Alignment Planning Gate.
2. Permission Guard OpenAPI/RBAC Contract Alignment Planning Review Gate.
3. Permission Guard OpenAPI/RBAC Contract Alignment Decision Gate.
4. Specific implementation authorization gate, if and only if selected.
5. Narrow implementation execution gate.
6. Execution review gate.
7. Execution acceptance gate.

This sequence prevents mixing planning, contract mutation, runtime implementation, DB work, and route work in one PR.

## 19. Risks

### 19.1 Contract Drift Risk

Risk:

Backend route behavior may diverge from OpenAPI.

Mitigation:

Require OpenAPI/RBAC contract alignment review before route implementation.

### 19.2 Permission Authority Ambiguity Risk

Risk:

Permissions may be inferred from Auth0 claims, headers, body, query string, or route-local assumptions.

Mitigation:

Preserve the accepted rule that none of those are permission authority.

### 19.3 Workspace Leakage Risk

Risk:

Product routes may expose workspace/resource existence through incorrect 403/404 behavior.

Mitigation:

Require disclosure mapping before product route implementation.

### 19.4 Persistent RBAC Prematurity Risk

Risk:

DB/ORM schema could encode the wrong RBAC model.

Mitigation:

Defer persistent RBAC until authority and contract alignment are reviewed.

### 19.5 Implementation Loop Risk

Risk:

The project may continue adding harness-only slices without reaching product contract alignment.

Mitigation:

This gate selects contract alignment as the next path and rejects further internal harness expansion for now.

## 20. Gaps

Known unresolved gaps:

- current OpenAPI authority paths must be reviewed;
- product route inventory must be reviewed;
- permission representation model remains undecided;
- disclosure mapping by route remains undecided;
- production permission source remains undecided;
- persistent RBAC data model remains undecided;
- generated client impact remains undecided;
- first eligible product route slice remains undecided.

These are not defects in the accepted app wiring stream.

They are the planned subject of the next review and decision gates.

## 21. Planning Outputs

This planning gate outputs:

- current boundary map;
- OpenAPI alignment questions;
- RBAC alignment questions;
- route enforcement alignment questions;
- error/disclosure alignment questions;
- permission representation options;
- explicit NO-GO for product route implementation;
- explicit NO-GO for persistent RBAC implementation;
- explicit NO-GO for OpenAPI mutation;
- recommended next review gate.

## 22. Final Decision

Decision: GO to Backend Slice 0 Permission Guard OpenAPI/RBAC Contract Alignment Planning Review Gate.

This decision authorizes a documentation-only review gate.

This decision does not authorize implementation.

This decision does not authorize OpenAPI mutation.

This decision does not authorize public/product route work.

This decision does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, generated client changes, or formatting baseline cleanup.

## 23. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Permission Guard OpenAPI/RBAC Contract Alignment Planning Review Gate`

That gate should review this planning output and decide whether the next step should be:

- a contract alignment decision gate;
- a narrower OpenAPI authority review;
- a route inventory review;
- or another prerequisite planning gate.

## 24. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Accepted Permission Guard App Wiring stream.
- Merged follow-up decision selecting OpenAPI/RBAC contract alignment.
- Existing Auth0 identity-only boundary.
- Existing route/path workspace boundary.
- Existing permission guard primitive.
- Existing internal harness execution.
- Existing contract-first governance.

### Outputs

- Planning map for OpenAPI/RBAC contract alignment.
- Explicit non-authorization of implementation.
- Explicit sequencing before product routes, persistent RBAC, and OpenAPI mutation.
- GO recommendation to planning review.

### Gaps

- OpenAPI authority inventory unresolved.
- Product route inventory unresolved.
- Permission representation model unresolved.
- Disclosure behavior by route unresolved.
- Persistent RBAC model unresolved.
- Generated client impact unresolved.

### Transition Decision

GO to `Backend Slice 0 Permission Guard OpenAPI/RBAC Contract Alignment Planning Review Gate`.

Do not start implementation before the next review gate is merged and a later authorization gate explicitly allows implementation.
