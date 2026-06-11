# Nashir Backend Slice 0 — Permission Guard App Wiring Completion Follow-up Decision Gate

## 1. Gate Classification

Gate type: Documentation-only follow-up decision gate.

This gate decides the next Backend Slice 0 path after the completed and accepted Permission Guard App Wiring execution stream.

This gate does not authorize new implementation.

This gate does not authorize public route implementation.

This gate does not authorize product route implementation.

This gate does not authorize OpenAPI changes.

This gate does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #71: `docs: plan permission guard app wiring`.
- Merged PR #72: `docs: review permission guard app wiring planning`.
- Merged PR #73: `docs: authorize permission guard app wiring implementation`.
- Merged PR #74: `feat: wire permission guard app harness`.
- Merged PR #75: `docs: review permission guard app wiring execution`.
- Merged PR #76: `docs: accept permission guard app wiring execution`.
- Accepted Auth0 identity-only boundary.
- Accepted route/path `workspaceId` authority.
- Accepted workspace context resolution before permission enforcement.
- Accepted internal-only permission guard harness.
- Accepted static/internal/deterministic harness permission source.
- Accepted non-authorization of public/product routes.
- Accepted non-authorization of OpenAPI changes.
- Accepted non-authorization of DB, ORM, migrations, deployment, secrets, UI, workflow, and formatting baseline cleanup.

## 3. Current Accepted State

The Permission Guard App Wiring execution stream is accepted.

Accepted current state:

- Auth0 verifies identity only.
- Auth0 is not workspace authority.
- Auth0 is not permission authority.
- Workspace context resolution is route/path based.
- Workspace membership is resolved before permission evaluation.
- Permission guard app wiring exists only through an internal opt-in harness route.
- Permission source is static/internal/deterministic for the harness only.
- No public route permission enforcement exists.
- No product route permission enforcement exists.
- No persistent RBAC permission source exists.
- No OpenAPI permission contract change exists.
- No DB, ORM, or migration work exists for permissions.

## 4. Evidence Basis

### 4.1 Documented facts from the accepted stream

The accepted stream explicitly confirms:

- implementation stayed within the authorized file scope;
- permission enforcement runs after workspace context resolution;
- Auth0 remains identity-only;
- permission source remains static/internal/deterministic for the internal harness only;
- no public/product routes were introduced;
- no OpenAPI changes were introduced;
- no DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting cleanup were introduced.

### 4.2 Decision inference

Because the accepted implementation is harness-only and intentionally non-production RBAC, the next step must not be product route implementation.

Before product routes or persistent RBAC are authorized, the project must align:

- OpenAPI contract expectations;
- Auth/RBAC boundaries;
- workspace identity boundaries;
- permission source boundary;
- route enforcement semantics;
- error and disclosure contract.

This inference is based on the accepted non-authorization boundaries and the existing contract-first project governance.

## 5. Follow-up Options Considered

### Option A — Product Route Permission Enforcement Planning

Description:

Start planning permission enforcement on product/public routes.

Decision: NO-GO.

Reason:

Product/public route enforcement would introduce API behavior before the OpenAPI/Auth/RBAC/workspace contract alignment is explicitly reviewed.

Risk:

- contract drift;
- route behavior not matching OpenAPI;
- permission source ambiguity;
- premature production RBAC assumptions.

### Option B — Persistent RBAC Permission Source Planning

Description:

Start planning DB-backed or ORM-backed permission source.

Decision: NO-GO.

Reason:

Persistent RBAC source requires contract and data-boundary clarity before schema or resolver planning.

Risk:

- premature DB/ORM design;
- migration churn;
- unclear role/permission authority;
- unclear workspace membership and permission separation.

### Option C — OpenAPI/RBAC Contract Alignment Planning

Description:

Plan the contract alignment between:

- OpenAPI;
- Auth0 identity-only;
- workspace context resolution;
- permission guard behavior;
- error/disclosure model;
- future product route enforcement;
- future persistent RBAC source.

Decision: SELECTED.

Reason:

This is the safest next step because it creates a reviewable contract boundary before either product routes or persistent permission source work begins.

### Option D — Additional Internal Harness Hardening

Description:

Continue enhancing the internal permission harness.

Decision: NO-GO for now.

Reason:

The internal harness slice has already been accepted. Additional harness hardening would risk looping in implementation without advancing the next architectural boundary.

## 6. Selected Path

Selected next path:

`Backend Slice 0 Permission Guard OpenAPI/RBAC Contract Alignment Planning Gate`

This selected path is documentation-only planning.

It must not implement code.

It must not modify OpenAPI yet.

It must not add product routes.

It must not add public routes.

It must not add DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting cleanup.

## 7. Purpose of the Selected Next Gate

The selected next gate should define how the accepted internal permission guard app wiring will later connect to production contract behavior.

The next gate should answer:

- Which future routes require permission enforcement?
- Which OpenAPI contract fields or responses must exist before route implementation?
- Whether permission requirements live in OpenAPI metadata, route configuration, or separate policy mapping.
- How 403 versus 404 disclosure behavior maps to product API contracts.
- How workspace route/path identity maps to OpenAPI paths.
- Whether `requestContext` remains actor/workspace-only.
- Where the future permission source boundary should be defined.
- Which future gate must authorize persistent RBAC, if needed.
- Which future gate must authorize product route wiring, if needed.

## 8. Accepted Boundaries Carried Forward

The selected next gate must preserve:

- Auth0 identity-only.
- Route/path `workspaceId` as workspace authority.
- Workspace context before permission enforcement.
- Membership before permission enforcement.
- Permission source not trusted from headers.
- Permission source not trusted from body.
- Permission source not trusted from query string.
- Permission source not trusted from Auth0 claims.
- No roles or permissions added to `requestContext`.
- No public/product route implementation without explicit authorization.
- No OpenAPI mutation without explicit authorization.
- No DB/ORM/migration work without explicit authorization.

## 9. Required Inputs for the Next Gate

The next planning gate must review:

- accepted Permission Guard App Wiring execution stream;
- current `src/app.ts` app lifecycle;
- current `src/permission-guard.ts` primitive;
- current `src/workspace-context-guard.ts` boundary;
- current error model behavior;
- current OpenAPI authority files;
- existing route inventory;
- existing product/public route prohibition;
- current generated contract boundaries;
- V1 scope and deferred RBAC decisions.

## 10. Required Outputs for the Next Gate

The next planning gate must produce:

- OpenAPI/RBAC/workspace contract alignment summary;
- route enforcement sequencing decision;
- permission source boundary decision;
- error/disclosure contract decision;
- product route implementation prerequisites;
- persistent RBAC implementation prerequisites;
- explicit non-authorization list;
- GO/NO-GO recommendation for the next gate.

## 11. Explicit Non-Authorization in This Gate

This follow-up decision gate does not authorize:

- implementation changes;
- OpenAPI changes;
- generated client changes;
- product route implementation;
- public route implementation;
- DB-backed permission resolver;
- ORM-backed permission resolver;
- permission migrations;
- workspace membership persistence;
- deployment changes;
- secrets changes;
- UI changes;
- workflow changes;
- formatting baseline cleanup.

## 12. Risk Review

### 12.1 Contract drift risk

Risk:

Moving directly to product route implementation could diverge from the OpenAPI authority.

Decision:

Controlled by selecting OpenAPI/RBAC contract alignment first.

### 12.2 RBAC persistence risk

Risk:

Moving directly to DB/ORM permission persistence could encode the wrong authority model.

Decision:

Controlled by deferring persistent RBAC planning until contract alignment is reviewed.

### 12.3 Implementation loop risk

Risk:

Continuing to enhance the internal harness could create a loop of internal-only implementation.

Decision:

Controlled by stopping harness expansion and moving to contract alignment.

### 12.4 Scope creep risk

Risk:

The next phase could mix OpenAPI, DB, routes, and runtime implementation in one PR.

Decision:

Controlled by requiring the next gate to be planning-only.

## 13. Gaps

No blocking gap remains in Permission Guard App Wiring.

Intentional deferred gaps:

- production permission source;
- persistent RBAC model;
- product route permission enforcement;
- public route permission enforcement;
- OpenAPI permission contract alignment;
- generated client alignment;
- migration strategy;
- deployment/runtime configuration.

These gaps must be addressed through future gates, not through this decision gate.

## 14. Decision Summary

| Option | Decision | Reason |
|---|---|---|
| Product route permission enforcement planning | NO-GO | Requires contract alignment first |
| Persistent RBAC permission source planning | NO-GO | Requires authority and contract alignment first |
| OpenAPI/RBAC contract alignment planning | SELECTED | Safest prerequisite before production route or RBAC work |
| Additional internal harness hardening | NO-GO | Harness slice already accepted |

## 15. Final Decision

Decision: GO to Backend Slice 0 Permission Guard OpenAPI/RBAC Contract Alignment Planning Gate.

This decision selects the next planning path only.

This decision does not authorize implementation.

This decision does not authorize OpenAPI mutation.

This decision does not authorize public/product route work.

This decision does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 16. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Permission Guard OpenAPI/RBAC Contract Alignment Planning Gate`

That gate should be documentation-only and should define the contract path before any future runtime, route, OpenAPI, DB, ORM, or migration implementation.

## 17. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Accepted Permission Guard App Wiring execution stream.
- Accepted internal harness implementation.
- Existing Auth0 identity-only boundary.
- Existing route/path workspace boundary.
- Existing permission guard primitive.
- Existing OpenAPI/contract-first governance.

### Outputs

- Selected next gate.
- Explicit rejection of direct product route implementation.
- Explicit rejection of direct persistent RBAC implementation.
- Explicit preservation of all non-authorization boundaries.

### Gaps

- production RBAC source remains deferred;
- product route enforcement remains deferred;
- OpenAPI permission contract remains unresolved;
- persistent permission data model remains unresolved.

### Transition Decision

GO to `Backend Slice 0 Permission Guard OpenAPI/RBAC Contract Alignment Planning Gate`.

Do not start implementation before that next planning gate is merged and reviewed.
