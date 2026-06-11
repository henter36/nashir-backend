# Nashir Backend Slice 0 — Product Data Model Authority Review Gate

## 1. Gate Classification

Gate type: Documentation-only product data model authority review gate.

This gate reviews the planned product data model boundary against the accepted OpenAPI authority.

This gate does not authorize implementation.

This gate does not authorize SQL implementation.

This gate does not authorize DB table creation.

This gate does not authorize migration creation.

This gate does not authorize migration execution.

This gate does not authorize repository implementation.

This gate does not authorize route implementation.

This gate does not authorize controller, service, ORM adoption, generated clients, OpenAPI mutation, validation script modification, package script modification, CI workflow modification, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #96: `docs: plan product data model and migrations`.
- Merged PR #95: `docs: decide product persistence strategy`.
- Merged PR #94: `docs: plan product route implementation boundary`.
- Merged PR #93: `docs: decide permission guard error disclosure mapping`.
- Merged PR #92: `docs: decide permission guard permission representation`.
- Merged PR #91: `docs: review permission guard product route inventory`.
- Accepted OpenAPI authority repository: `henter36/nashir`.
- Accepted CI-active Backend Slice 0 authority pin: `36da9ed31903562bddfb7ffd669841956e334a51`.
- Accepted OpenAPI authority file: `docs/nashir_v1_openapi.yaml`.
- Accepted product route planning.
- Accepted product persistence strategy planning.
- Accepted product data model and migration planning.
- Accepted direct `pg` persistence direction for planning.
- Existing non-authorization of implementation.

## 3. Review Objective

This gate must review:

- whether the planned product data model aligns with OpenAPI product routes;
- whether product identity is correctly modeled;
- whether workspace ownership is required by authority;
- whether product names are display-only;
- whether create/update route controls imply persistence requirements;
- whether idempotency, concurrency, and audit requirements are authority-backed;
- whether unsupported fields or lifecycle states were introduced by planning;
- whether exact schema field extraction is required before SQL or migrations;
- what the next documentation gate should be.

This gate must not define SQL columns.

This gate must not define table names.

This gate must not create migrations.

This gate must not modify OpenAPI.

## 4. Authority Evidence — Product Tag and Workspace Rule

Authority evidence:

- Product catalog metadata is defined under the `Products` tag.
- Product names are display fields only.
- `productId` is canonical.
- Workspace resources are scoped to a workspace.
- `workspaceId` is path-derived and must never be supplied in a request body.

Review decision:

The planned data model requirement for:

- stable product identity;
- workspace ownership;
- body `workspaceId` rejection;
- route-derived workspace context;

is aligned with authority.

This gate does not implement these rules.

## 5. Authority Evidence — Product Routes

Authority product routes:

| Route | Method | operationId | Authority implication |
|---|---|---|---|
| `/workspaces/{workspaceId}/products` | GET | `listProducts` | workspace-scoped list |
| `/workspaces/{workspaceId}/products` | POST | `createProduct` | workspace-scoped create |
| `/workspaces/{workspaceId}/products/{productId}` | GET | `getProduct` | product identity by `productId` under workspace |
| `/workspaces/{workspaceId}/products/{productId}` | PUT | `updateProduct` | workspace-scoped update with product identity |

Review decision:

The planned data model must support product lookup by both:

- `workspaceId`;
- `productId`.

Product lookup by `productId` alone is not authority-aligned for protected workspace routes.

This gate does not implement lookups.

## 6. Authority Evidence — Permissions

Authority product permissions:

| Operation | Permission |
|---|---|
| `listProducts` | `nashir.products.read` |
| `getProduct` | `nashir.products.read` |
| `createProduct` | `nashir.products.manage` |
| `updateProduct` | `nashir.products.manage` |

Review decision:

The data model itself must not encode role names or permission mappings.

Permission enforcement remains guard-level behavior.

Product persistence may store product ownership and state, but must not become a persistent RBAC model in this slice.

This gate does not implement permission storage.

## 7. Authority Evidence — Guard Chain

Authority guard chain for read operations includes:

- `authGuard`;
- `workspaceContextGuard`;
- `nonDisclosingMembershipCheck`;
- `permissionGuard`.

Authority guard chain for write operations additionally includes:

- `rejectBodyWorkspaceId`.

Review decision:

The planned data model must preserve non-disclosing behavior by enabling workspace-owned product queries.

The data model must not require body-derived workspace identity.

This gate does not implement guard chains.

## 8. Authority Evidence — Create Product

Authority create route:

- operationId: `createProduct`;
- permission: `nashir.products.manage`;
- workspace scope: route;
- audit required: true;
- requires `IdempotencyKeyHeader`;
- request schema reference: `CreateProductRequest`;
- response schema reference: `ProductResponse`;
- possible statuses include 201, 400, 401, 403, 404, 409, 422, and default.

Review decision:

The planned data model correctly identifies that future create implementation needs:

- product storage;
- workspace ownership;
- idempotency persistence;
- audit persistence;
- validation mapping;
- conflict handling.

This gate does not implement create behavior.

## 9. Authority Evidence — Update Product

Authority update route:

- operationId: `updateProduct`;
- permission: `nashir.products.manage`;
- workspace scope: route;
- audit required: true;
- requires `ProductIdPath`;
- requires `If-Match` or `X-Resource-Version`;
- request schema reference: `UpdateProductRequest`;
- response schema reference: `ProductResponse`;
- possible statuses include 200, 400, 401, 403, 404, 409, 422, and default.

Review decision:

The planned data model correctly identifies that future update implementation needs:

- persisted product identity;
- workspace ownership;
- version or revision support;
- optimistic concurrency behavior;
- audit persistence;
- validation mapping;
- conflict handling.

This gate does not implement update behavior.

## 10. Authority Evidence — List Product

Authority list route:

- operationId: `listProducts`;
- permission: `nashir.products.read`;
- workspace scope: route;
- audit required: false;
- query parameters include limit, cursor, status, updatedAfter, and sort;
- response schema reference: `ProductListResponse`.

Review decision:

The planned data model must support future read/list behavior with:

- workspace filtering;
- pagination planning;
- status filtering if supported by the authority schemas;
- updated-after filtering;
- sort planning.

However, exact indexes, table names, and SQL are not authorized here.

This gate does not implement list behavior.

## 11. Authority Evidence — Get Product

Authority get route:

- operationId: `getProduct`;
- permission: `nashir.products.read`;
- workspace scope: route;
- audit required: false;
- requires `WorkspaceIdPath`;
- requires `ProductIdPath`;
- response schema reference: `ProductResponse`.

Review decision:

The planned data model must support a lookup boundary equivalent to:

- workspace context;
- product identity;
- non-disclosing not-found behavior.

This gate does not implement get behavior.

## 12. Product Identity Review

Decision: The planned product data model identity boundary is authority-aligned.

Authority states:

- product names are display fields only;
- `productId` is canonical;
- product routes use `productId` in the path for single-product read/update.

Therefore:

- product identity must be based on `productId`;
- product name must not be used as identity;
- product ID must be stable enough for route addressing;
- product ID format must be reviewed against authority parameters before implementation.

This gate does not choose an ID generation implementation.

## 13. Workspace Ownership Review

Decision: The planned workspace ownership boundary is authority-aligned.

Authority states:

- workspace resources are scoped to a workspace;
- `workspaceId` is path-derived;
- `workspaceId` must never be supplied in request body.

Therefore:

- product persistence must include workspace ownership conceptually;
- every product record must be associated with exactly one workspace;
- product repository planning must require workspace context;
- cross-workspace access must remain non-disclosing.

This gate does not define SQL columns.

## 14. Lifecycle and Status Review

Decision: Lifecycle/state fields are not yet fully authorized at the data model level.

Authority list route includes `StatusQuery`.

However, this gate has not extracted the underlying product schema field inventory.

Therefore:

- product status may be required by authority;
- exact allowed values are unresolved in this gate;
- archive/delete state must not be invented unless confirmed by schema authority;
- lifecycle states must be reviewed in a dedicated schema field inventory gate.

This gate does not define status columns.

## 15. Timestamp Review

Decision: Timestamp planning is authority-aligned but exact fields remain unresolved.

Authority list route includes `UpdatedAfterQuery`.

Therefore:

- future product storage likely requires an update timestamp;
- exact response field names must be verified against product schemas;
- created timestamp may be operationally necessary but must be checked against schema authority before exposing it in responses.

This gate does not define timestamp columns.

## 16. Schema Reference Review

Authority references these product schemas:

- `CreateProductRequest`;
- `UpdateProductRequest`;
- `ProductResponse`;
- `ProductListResponse`.

Review decision:

A schema-field inventory is required before SQL/migration planning.

Reason:

This authority review confirms route and behavior alignment, but it does not fully enumerate:

- required product fields;
- optional product fields;
- nullable product fields;
- status enum values;
- timestamp response fields;
- metadata fields;
- external identifiers;
- product images/assets links;
- create-only fields;
- update-only fields;
- server-generated fields.

This gate does not extract or implement schema fields.

## 17. Contract Drift Findings

Findings:

- The previous data model planning is directionally aligned with OpenAPI authority.
- Workspace ownership is required.
- Product identity must be `productId`.
- Product names must remain display-only.
- Create requires idempotency planning.
- Update requires optimistic concurrency planning.
- Write operations require audit planning.
- Route implementation remains blocked.
- SQL and migrations remain blocked.

No product runtime implementation is authorized by these findings.

## 18. Required Correction to Planning Assumptions

Decision: The previous planning phrase “lifecycle state only if supported by accepted product authority” remains valid.

Reason:

Authority exposes status-related query behavior, but exact state fields and values require schema-field inventory before SQL/migration planning.

No immediate correction PR is required.

## 19. Product Data Model Eligibility

Decision: Product data model is not yet eligible for SQL or migration design.

Reason:

The following are still unresolved:

- exact product schema fields;
- required versus optional fields;
- nullable field behavior;
- enum values;
- response-only fields;
- write-only fields;
- server-generated fields;
- exact version field contract;
- exact status/lifecycle contract;
- table naming;
- column naming;
- migration strategy;
- test database lifecycle.

## 20. Candidate Next Paths

### Option A — Product Schema Field Inventory Gate

Decision: SELECTED.

Reason:

Before SQL, table, column, or migration planning, the exact product schema fields must be inventoried from the accepted OpenAPI authority.

### Option B — Migration Tool Decision Gate

Decision: DEFER.

Reason:

Migration tooling should be selected after the schema field inventory clarifies what needs to be represented.

### Option C — Direct SQL Migration Planning

Decision: NO-GO.

Reason:

SQL planning before schema-field inventory risks contract drift.

### Option D — Product Route Implementation

Decision: NO-GO.

Reason:

Routes remain blocked by persistence, schema, migration, repository, idempotency, concurrency, audit, and test DB decisions.

## 21. Selected Next Path

Selected next path:

`Backend Slice 0 Product Schema Field Inventory Gate`

This selected path is documentation-only.

It must inventory product schema fields from OpenAPI authority.

It must not implement SQL.

It must not create migrations.

It must not add DB tables.

It must not modify OpenAPI.

It must not generate clients.

It must not modify package scripts.

It must not modify CI workflow files.

It must not implement routes.

## 22. Risk Review

### 22.1 Schema Drift Risk

Risk:

A data model may introduce columns not present in OpenAPI authority or miss fields required by authority.

Mitigation:

Require schema-field inventory before SQL and migration planning.

### 22.2 Identity Drift Risk

Risk:

Product names may be treated as identity.

Mitigation:

Keep `productId` as canonical and product names as display-only.

### 22.3 Workspace Isolation Risk

Risk:

Schema planning may permit product lookup without workspace ownership.

Mitigation:

Require workspace-owned product persistence boundary.

### 22.4 Lifecycle Drift Risk

Risk:

Status/lifecycle values may be invented before schema authority is reviewed.

Mitigation:

Defer lifecycle decisions to schema-field inventory.

### 22.5 Premature Implementation Risk

Risk:

Authority review may be mistaken as permission to create SQL or migrations.

Mitigation:

State explicit NO-GO for SQL, migrations, DB tables, routes, repositories, and runtime implementation.

## 23. Final Decision

Decision: GO to Backend Slice 0 Product Schema Field Inventory Gate.

This decision confirms the planned product data model is directionally aligned with route-level OpenAPI authority.

This decision confirms that exact product schema fields remain unresolved.

This decision confirms that SQL and migrations remain blocked.

This decision confirms that product route implementation remains blocked.

This decision does not authorize implementation.

This decision does not authorize route implementation.

This decision does not authorize controller implementation.

This decision does not authorize service implementation.

This decision does not authorize repository implementation.

This decision does not authorize SQL implementation.

This decision does not authorize DB table creation.

This decision does not authorize migration creation.

This decision does not authorize migration execution.

This decision does not authorize ORM adoption.

This decision does not authorize package dependency changes.

This decision does not authorize package script changes.

This decision does not authorize CI workflow changes.

This decision does not authorize OpenAPI mutation.

This decision does not authorize generated client changes.

This decision does not authorize deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 24. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Product Schema Field Inventory Gate`

That gate should extract and document exact fields from:

- `CreateProductRequest`;
- `UpdateProductRequest`;
- `ProductResponse`;
- `ProductListResponse`;
- related product parameters.

## 25. Explicit Non-Authorization

This product data model authority review gate does not authorize:

- runtime implementation;
- route implementation;
- controller implementation;
- service implementation;
- repository implementation;
- product route implementation;
- public route implementation;
- SQL implementation;
- DB table creation;
- DB migration creation;
- DB migration execution;
- ORM adoption;
- package dependency changes;
- package script changes;
- CI workflow changes;
- OpenAPI mutation;
- generated client changes;
- generated artifact regeneration;
- product seed data;
- idempotency persistence;
- optimistic concurrency persistence;
- audit persistence;
- workspace membership persistence;
- deployment changes;
- secrets changes;
- UI changes;
- workflow changes;
- formatting baseline cleanup.

## 26. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged Product Data Model and Migration Planning Gate.
- Merged Product Persistence Strategy Decision Gate.
- Merged Product Route Implementation Planning Gate.
- Merged Error and Disclosure Mapping Decision Gate.
- Accepted OpenAPI authority file.
- Accepted product routes.
- Accepted product permissions.
- Accepted product route guard chains.
- Accepted product error and disclosure mapping.
- Existing direct `pg` planning direction.
- Existing non-authorization of implementation.

### Outputs

- Product route authority reviewed.
- Product identity authority reviewed.
- Workspace ownership authority reviewed.
- Create route persistence implications reviewed.
- Update route persistence implications reviewed.
- List/get route persistence implications reviewed.
- Schema-field inventory identified as required.
- SQL and migration planning remain blocked.
- Product Schema Field Inventory Gate selected as next gate.

### Gaps

- Exact product schema fields unresolved.
- Required product fields unresolved.
- Optional product fields unresolved.
- Nullable fields unresolved.
- Product status enum unresolved.
- Timestamp response fields unresolved.
- Create-only fields unresolved.
- Update-only fields unresolved.
- Response-only fields unresolved.
- Server-generated fields unresolved.
- SQL data model unresolved.
- Migration strategy unresolved.
- Test DB lifecycle unresolved.
- Repository API contract unresolved.
- Explicit implementation authorization unresolved.

### Transition Decision

GO to `Backend Slice 0 Product Schema Field Inventory Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
