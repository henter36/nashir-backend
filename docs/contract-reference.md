# Contract Authority Reference

`henter36/nashir` remains the docs/contracts/governance authority.

`henter36/nashir-backend` is only the backend runtime repository. It must not
redefine, fork, or diverge from the authorities maintained in `henter36/nashir`.

## Authority Areas

`henter36/nashir` remains the authority for:

- OpenAPI contract
- Auth/RBAC/Workspace Identity
- SQL/schema/migration planning
- governance gates

`docs/nashir_v1_openapi.yaml` is resolved only as the OpenAPI authority
location.

OpenAPI/Auth/RBAC/Workspace Identity alignment remains PENDING ALIGNMENT.

The OpenAPI contract must not be used as an active downstream synchronization
authority for backend implementation, generated clients, route implementation,
permission enforcement, migration/runtime work, or deployment decisions until
alignment is established.

Generated clients are BLOCKED until a later generated-client gate.

SQL migrations, migration runner, ORM/query layer, auth implementation, database
config, deployment config, and production or pilot readiness are not authorized.
