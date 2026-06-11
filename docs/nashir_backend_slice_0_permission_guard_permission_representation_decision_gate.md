# Nashir Backend Slice 0 — Permission Guard Permission Representation Decision Gate

## 1. Gate Classification

Gate type: Documentation-only permission representation decision gate.

This gate decides how route permission strings are represented for later planning.

This gate does not authorize implementation.

This gate does not authorize route implementation.

This gate does not authorize controller, service, repository, DB, ORM, migrations, generated clients, OpenAPI mutation, validation script modification, package script modification, CI workflow modification, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #91: `docs: review permission guard product route inventory`.
- Accepted OpenAPI authority repository: `henter36/nashir`.
- Accepted CI-active Backend Slice 0 authority pin: `36da9ed31903562bddfb7ffd669841956e334a51`.
- Accepted OpenAPI authority file: `docs/nashir_v1_openapi.yaml`.
- Accepted product route permissions:
  - `nashir.products.read`
  - `nashir.products.manage`
- Existing Auth/RBAC and workspace identity authority.
- Existing deny-by-default rule.
- Existing workspace-before-permission ordering.
- Existing membership-before-permission ordering.
- Existing non-disclosing membership behavior.
- Existing product route inventory gate.
- Existing non-authorization of implementation.

## 3. Review Objective

This gate must decide:

- the canonical representation of permission strings;
- whether permission strings may be invented locally;
- whether product permissions are represented as runtime code, data, or documentation only at this stage;
- whether role-to-permission mapping is implemented or only referenced;
- whether persistent RBAC is authorized;
- whether implementation may begin after this gate.

This gate must not implement permission enforcement.

This gate must not create a DB-backed permission model.

This gate must not create seed data.

This gate must not modify OpenAPI.

## 4. Current Permission Evidence

The accepted product route inventory identified the following route permissions:

| Permission | Applies to | Classification |
|---|---|---|
| `nashir.products.read` | `listProducts`, `getProduct` | Product read permission |
| `nashir.products.manage` | `createProduct`, `updateProduct` | Product write/manage permission |

Finding:

These are the only product permissions accepted for this Backend Slice 0 product-route boundary.

No additional backend-local product permission may be invented in this gate.

## 5. Permission Representation Decision

Decision: Permission strings are represented as canonical string codes.

Canonical format:

```text
nashir.<domain>.<action>
```

For product routes in this slice:

```text
nashir.products.read
nashir.products.manage
```

The permission code is the stable authorization identifier.

The permission code is not a display label.

The permission code is not a role name.

The permission code is not a database schema decision.

The permission code is not a generated client type decision.

The permission code is not an implementation authorization.

## 6. Source of Truth Decision

Decision: The source of truth for permission strings is the accepted external OpenAPI authority plus the accepted Auth/RBAC workspace identity authority.

Rules:

* Backend code must not invent permission strings.
* Backend-local documentation must not rename permission strings.
* OpenAPI-local permission strings must not diverge from Auth/RBAC authority.
* Product permission strings must remain:

  * `nashir.products.read`
  * `nashir.products.manage`

Any new permission string requires a separately authorized decision gate.

## 7. Runtime Representation Decision

Decision: Documentation-only representation in this gate.

This gate does not authorize:

* TypeScript permission enum.
* TypeScript permission constants.
* runtime permission registry.
* DB permission table.
* role-permission seed data.
* permission resolver.
* ORM model.
* migration.
* generated client change.

Reason:

Creating runtime permission representation would become implementation, and implementation remains blocked until later gates resolve error/disclosure behavior, route implementation boundaries, persistence, audit, idempotency, and concurrency.

## 8. Role-to-Permission Mapping Decision

Decision: Role-to-permission mapping is referenced from the accepted Auth/RBAC authority only.

This gate does not implement role-to-permission mapping.

For product routes, the accepted role meaning remains:

| Permission               | Expected minimum roles from Auth/RBAC authority            | Implementation status |
| ------------------------ | ---------------------------------------------------------- | --------------------- |
| `nashir.products.read`   | viewer, analyst, editor, reviewer, publisher, admin, owner | Not implemented       |
| `nashir.products.manage` | editor, admin, owner                                       | Not implemented       |

This gate does not authorize a role resolver.

This gate does not authorize persistence.

This gate does not authorize seed data.

## 9. Guard Enforcement Boundary

Decision: Future route enforcement must pass only canonical permission strings into the permission guard.

Expected future usage concept:

```text
requiredPermission = "nashir.products.read"
requiredPermission = "nashir.products.manage"
```

This is a representation decision only.

This gate does not authorize adding these calls to product routes.

## 10. Non-Disclosing Permission Behavior

Decision: Permission representation must preserve the non-disclosing route behavior already accepted for product routes.

Rules:

* Auth runs first.
* Workspace context resolves before permission.
* Membership check runs before permission.
* Permission guard runs after workspace and membership context.
* Non-member, cross-workspace, or invisible workspace/resource access must not disclose existence.

This gate does not implement error/disclosure mapping.

## 11. Product Route Implementation Eligibility

Decision: NOT ELIGIBLE for implementation in this gate.

Reason:

The following remain unresolved:

* route-level error/disclosure mapping;
* resource workspace ownership resolution;
* product persistence;
* idempotency persistence;
* optimistic concurrency persistence;
* audit persistence;
* generated artifact inventory;
* generated client impact;
* first eligible product route implementation slice;
* persistent RBAC model.

## 12. Candidate Next Paths

### Option A — Error and Disclosure Mapping Decision Gate

Decision: SELECTED.

Reason:

Permission representation is now decided at the documentation level. The next blocking implementation risk is incorrect 401/403/404 behavior, especially non-disclosing 404 behavior for workspace and product boundaries.

### Option B — Product Route Implementation Planning Gate

Decision: NO-GO.

Reason:

Implementation planning is premature before route-level error/disclosure mapping is decided.

### Option C — Persistent RBAC Planning Gate

Decision: NO-GO.

Reason:

Persistent RBAC requires explicit authorization for DB/ORM/migrations and role-permission persistence. That is not authorized here.

### Option D — Runtime Permission Registry Gate

Decision: DEFER.

Reason:

Runtime registry creation may be useful later, but it is implementation-adjacent and should follow error/disclosure mapping and implementation planning authorization.

## 13. Selected Next Path

Selected next path:

`Backend Slice 0 Permission Guard Error and Disclosure Mapping Decision Gate`

This selected path is documentation-only.

It must decide route-level 401/403/404 mapping before product route implementation planning.

It must not implement routes.

It must not modify OpenAPI.

It must not generate clients.

It must not modify validation scripts.

It must not modify package scripts.

It must not modify CI workflow files.

It must not add DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 14. Risk Review

### 14.1 Permission Drift Risk

Risk:

Permission strings may drift between OpenAPI, Auth/RBAC authority, backend code, and documentation.

Mitigation:

Use canonical permission strings only and prohibit backend-local invention.

### 14.2 Role Confusion Risk

Risk:

Roles may be treated as permissions, causing overbroad access.

Mitigation:

Keep roles and permissions separate. Roles grant permissions later; permissions remain the operation-level authorization unit.

### 14.3 Premature Runtime Registry Risk

Risk:

Creating enums, registries, seed data, or DB tables now would bypass unresolved implementation gates.

Mitigation:

Keep this gate documentation-only.

### 14.4 Disclosure Risk

Risk:

Permission denial may be implemented as 403 where non-disclosing 404 is required.

Mitigation:

Proceed to Error and Disclosure Mapping Decision Gate before implementation planning.

### 14.5 Implementation Creep Risk

Risk:

A permission representation decision may be mistaken as authorization to implement routes.

Mitigation:

State explicit NO-GO for implementation.

## 15. Final Decision

Decision: GO to Backend Slice 0 Permission Guard Error and Disclosure Mapping Decision Gate.

This decision accepts canonical permission string representation for product routes:

* `nashir.products.read`
* `nashir.products.manage`

This decision does not authorize implementation.

This decision does not authorize route implementation.

This decision does not authorize controller implementation.

This decision does not authorize service implementation.

This decision does not authorize repository implementation.

This decision does not authorize OpenAPI mutation.

This decision does not authorize generated client changes.

This decision does not authorize validation script modification.

This decision does not authorize package script modification.

This decision does not authorize CI workflow modification.

This decision does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 16. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Permission Guard Error and Disclosure Mapping Decision Gate`

That gate should decide exact route-level 401, 403, 404, 409, and 422 mapping before any product route implementation planning.

## 17. Explicit Non-Authorization

This permission representation decision gate does not authorize:

* runtime implementation;
* route implementation;
* controller implementation;
* service implementation;
* repository implementation;
* product route implementation;
* public route implementation;
* OpenAPI mutation;
* validation script modification;
* package script modification;
* CI workflow modification;
* generated client changes;
* generated artifact regeneration;
* DB-backed permission resolver;
* ORM-backed permission resolver;
* permission migrations;
* permission seed data;
* product persistence;
* idempotency persistence;
* optimistic concurrency persistence;
* audit persistence;
* workspace membership persistence;
* deployment changes;
* secrets changes;
* UI changes;
* workflow changes;
* formatting baseline cleanup.

## 18. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

* Merged Product Route Inventory Review Gate.
* Accepted OpenAPI authority file.
* Accepted product route permission strings.
* Accepted Auth/RBAC workspace identity authority.
* Existing deny-by-default rule.
* Existing workspace-before-permission ordering.
* Existing membership-before-permission ordering.
* Existing non-disclosing membership route behavior.
* Existing non-authorization of implementation.

### Outputs

* Accepted canonical permission string representation.
* Accepted product permission strings:

  * `nashir.products.read`
  * `nashir.products.manage`
* Rejected backend-local permission invention.
* Rejected runtime permission registry in this gate.
* Rejected role-to-permission implementation in this gate.
* Rejected persistent RBAC in this gate.
* Rejected product route implementation.
* Selected Error and Disclosure Mapping Decision Gate as the next gate.

### Gaps

* Error/disclosure mapping unresolved.
* Product route response body behavior unresolved.
* Resource workspace ownership resolution unresolved.
* Product persistence unresolved.
* Idempotency persistence unresolved.
* Optimistic concurrency persistence unresolved.
* Audit persistence unresolved.
* Generated artifact inventory unresolved.
* Generated client impact unresolved.
* First eligible product route slice unresolved.
* Persistent RBAC model unresolved.

### Transition Decision

GO to `Backend Slice 0 Permission Guard Error and Disclosure Mapping Decision Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
