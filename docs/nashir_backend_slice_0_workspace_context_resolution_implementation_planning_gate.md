# Nashir Backend Slice 0 — Workspace Context Resolution Implementation Planning Gate

## 1. Gate Purpose

This document defines the implementation planning boundary for Backend Slice 0 Workspace Context Resolution.

This gate follows the merged Workspace Context Resolution Decision Gate and Decision Review Gate.

This is an implementation planning gate only.

This gate plans the implementation scope, file boundaries, test boundaries, sequencing, and risks for a later implementation authorization gate.

This gate does not authorize runtime implementation.

This gate does not authorize product routes, workspace routes, database schema changes, SQL migrations, ORM/query implementation, OpenAPI changes, deployment changes, secrets configuration, UI changes, or a new backend slice.

## 2. Reviewed Inputs

| Input  |          Status | Purpose                                           |
| ------ | --------------: | ------------------------------------------------- |
| PR #59 |          Merged | Workspace Context Resolution Decision Review Gate |
| PR #58 |          Merged | Workspace Context Resolution Decision Gate        |
| PR #57 |          Merged | Workspace Context Resolution Planning Review Gate |
| PR #56 |          Merged | Workspace Context Resolution Planning Gate        |
| PR #55 |          Merged | Auth0 token verification execution verification   |
| PR #54 |          Merged | Auth0 token verification execution review         |
| PR #53 |          Merged | Auth0 token verification implementation           |
| PR #47 | Prior authority | Auth0 token verification decision gate            |
| PR #43 | Prior authority | Auth0 provider selection                          |
| PR #41 | Prior authority | JWT/JWKS token format decision                    |

## 3. Current Approved Decisions

The implementation plan must follow these approved decisions:

| Decision Area                           | Approved Decision            |
| --------------------------------------- | ---------------------------- |
| V1 workspaceId source                   | Route/path parameter         |
| Auth0 workspace authority               | Rejected                     |
| x-nashir-workspace-id                   | Rejected in Auth0 path       |
| Request body workspaceId                | Rejected by default          |
| Query string workspaceId                | Deferred                     |
| Resource-owned workspace resolution     | Deferred                     |
| Membership authority                    | Nashir WorkspaceMember       |
| Actor not workspace member              | 404                          |
| Missing workspace route parameter       | 400                          |
| Invalid workspaceId format              | 400                          |
| Workspace membership lookup unavailable | 503                          |
| OpenAPI changes                         | Not authorized by prior gate |
| Runtime implementation                  | Not yet authorized           |

## 4. Planned Implementation Objective

The planned implementation objective is to introduce a workspace context resolution layer after Auth0 token verification and before permission evaluation.

The planned implementation must:

1. Require a valid VerifiedIdentityContext produced by authGuard.
2. Read workspaceId only from an approved route/path parameter.
3. Reject workspaceId from Auth0 token claims, Auth0 organizations, Auth0 metadata, transitional headers, arbitrary body fields, and query strings.
4. Verify workspace membership using Nashir authority.
5. Produce FullyResolvedRequestContext.
6. Preserve permissionGuard as the action-level authorization boundary.
7. Fail closed.

## 5. Planned Runtime Flow

The planned runtime flow is:

| Step | Component             | Input                                               | Output                      |
| ---- | --------------------- | --------------------------------------------------- | --------------------------- |
| 1    | authGuard             | Authorization bearer token                          | VerifiedIdentityContext     |
| 2    | workspaceContextGuard | VerifiedIdentityContext and route/path workspaceId  | FullyResolvedRequestContext |
| 3    | permissionGuard       | FullyResolvedRequestContext and required permission | Permission decision         |

The planned workspaceContextGuard must not run before authGuard.

The planned permissionGuard must not be used for workspace-scoped permission decisions until FullyResolvedRequestContext exists.

## 6. Planned File Scope

The following files are planned for later implementation authorization review.

| File                                  | Planned Purpose                                            |       Status |
| ------------------------------------- | ---------------------------------------------------------- | -----------: |
| src/workspace-context-guard.ts        | Workspace context guard implementation                     | Planned only |
| src/request-context.ts                | Add or confirm workspace context request attachment typing | Planned only |
| tests/workspace-context-guard.test.ts | Workspace context guard tests                              | Planned only |
| src/app.ts                            | Later guard wiring if explicitly authorized                | Planned only |

No file may be implemented under this planning gate.

The implementation authorization gate must confirm the exact final file list before coding starts.

## 7. Planned Non-File Scope

The following are explicitly not planned for the first implementation slice:

| Area                            |   Status | Reason                                                             |
| ------------------------------- | -------: | ------------------------------------------------------------------ |
| Product routes                  | Excluded | Route implementation not authorized                                |
| Workspace route implementation  | Excluded | Route implementation not authorized                                |
| Database schema                 | Excluded | No DB changes authorized                                           |
| SQL migrations                  | Excluded | No migration authorization                                         |
| ORM models                      | Excluded | No ORM authorization                                               |
| Production DB queries           | Excluded | Membership resolver boundary must be planned first                 |
| OpenAPI changes                 | Excluded | Requires separate OpenAPI alignment gate if route contracts change |
| UI                              | Excluded | Backend Slice 0 only                                               |
| Deployment/secrets              | Excluded | Not needed for planning                                            |
| Resource-owned workspace lookup | Deferred | Explicitly deferred by decision gate                               |

## 8. Planned workspaceContextGuard Responsibility

The planned workspaceContextGuard is responsible for:

1. Requiring VerifiedIdentityContext.
2. Extracting workspaceId from an approved route/path parameter source.
3. Validating workspaceId format.
4. Verifying workspace existence if supported by the approved membership resolver boundary.
5. Verifying actor membership in the workspace.
6. Producing FullyResolvedRequestContext.
7. Attaching the resolved context for downstream permissionGuard use.
8. Returning the approved error semantics.

The planned workspaceContextGuard is not responsible for:

1. Verifying Auth0 JWTs.
2. Granting permissions.
3. Evaluating action-level permissions.
4. Trusting Auth0 workspace data.
5. Trusting x-nashir-workspace-id.
6. Trusting request body workspaceId.
7. Trusting query string workspaceId.
8. Creating workspace records.
9. Creating membership records.
10. Mutating data.
11. Implementing routes.

## 9. Planned Membership Resolver Boundary

Implementation planning may introduce a WorkspaceMembershipResolver or equivalent abstraction.

Planned boundary:

| Responsibility                                                | Planned Location                          |
| ------------------------------------------------------------- | ----------------------------------------- |
| Check workspace membership                                    | WorkspaceMembershipResolver or equivalent |
| Return membership found / not found                           | Resolver result                           |
| Return lookup unavailable state                               | Resolver error/result                     |
| Avoid production DB coupling in first implementation planning | Required                                  |
| Support deterministic tests                                   | Required                                  |

The first implementation plan should use a deterministic test resolver or in-memory resolver for tests unless a repository boundary is separately authorized.

Production DB query implementation is not authorized by this planning gate.

## 10. Planned Error Semantics

The later implementation must use these approved semantics:

| Failure                                      |           Planned Result |
| -------------------------------------------- | -----------------------: |
| Missing VerifiedIdentityContext              |                      401 |
| Missing required workspaceId route parameter |                      400 |
| Invalid workspaceId format                   |                      400 |
| Workspace not found                          |                      404 |
| Actor is not a workspace member              |                      404 |
| Workspace membership lookup unavailable      |                      503 |
| Permission denied after workspace resolution | permissionGuard decision |

The actor-not-member result remains 404 for enumeration safety.

## 11. Planned Test Scope

The later implementation must include tests for:

| Test Area                                                                    | Required |
| ---------------------------------------------------------------------------- | -------: |
| Missing VerifiedIdentityContext returns 401                                  |      Yes |
| Missing workspaceId route parameter returns 400                              |      Yes |
| Invalid workspaceId format returns 400                                       |      Yes |
| Workspace not found returns 404                                              |      Yes |
| Actor not workspace member returns 404                                       |      Yes |
| Workspace membership lookup unavailable returns 503                          |      Yes |
| Valid actor and valid workspace membership emits FullyResolvedRequestContext |      Yes |
| FullyResolvedRequestContext contains actorId and workspaceId                 |      Yes |
| Auth0 token workspace claims are ignored                                     |      Yes |
| x-nashir-workspace-id is ignored in Auth0 path                               |      Yes |
| Request body workspaceId is ignored by default                               |      Yes |
| Query string workspaceId is not trusted                                      |      Yes |
| permissionGuard remains separate from membership resolution                  |      Yes |
| No live Auth0 dependency                                                     |      Yes |

Tests may use verified identity fixtures rather than live Auth0.

## 12. Planned Integration Boundary

The first implementation planning target should be guard/context utility integration only.

| Integration Area                          |                  Planned Status |
| ----------------------------------------- | ------------------------------: |
| workspaceContextGuard unit-level behavior |                         Planned |
| Request context typing                    |                         Planned |
| App-level guard wiring                    | Requires explicit authorization |
| Product route integration                 |                     Not planned |
| Workspace route integration               |                     Not planned |
| OpenAPI route contract update             |                     Not planned |
| DB-backed membership lookup               |                     Not planned |

If app-level guard wiring is included later, the implementation authorization gate must explicitly approve it.

## 13. Planned OpenAPI Boundary

No OpenAPI change is planned in this gate.

If later implementation requires new route/path workspaceId contracts, an OpenAPI alignment gate must happen before route implementation.

| Case                                           | Planned Treatment                        |
| ---------------------------------------------- | ---------------------------------------- |
| Guard utility only                             | No OpenAPI change                        |
| Route contract with workspaceId path parameter | Requires separate OpenAPI alignment gate |
| Existing route contract change                 | Requires separate OpenAPI alignment gate |
| Product route contract                         | Not authorized                           |

## 14. Planned Security Controls

The later implementation must preserve these security controls:

| Control                                        | Required |
| ---------------------------------------------- | -------: |
| Fail closed                                    |      Yes |
| Do not trust workspaceId from Auth0            |      Yes |
| Do not trust x-nashir-workspace-id             |      Yes |
| Do not trust request body workspaceId          |      Yes |
| Do not trust query string workspaceId          |      Yes |
| Membership does not imply permission           |      Yes |
| Actor-not-member hides workspace existence     |      Yes |
| permissionGuard remains action-level authority |      Yes |
| No production DB changes without authorization |      Yes |
| No route bypass unless explicitly classified   |      Yes |

## 15. Planned Implementation Preconditions

Before implementation authorization can be requested, the following must be confirmed:

1. Exact workspaceContextGuard function or hook shape.
2. Exact request attachment location for FullyResolvedRequestContext.
3. Whether request-context typing already supports the attachment.
4. Whether WorkspaceMembershipResolver or equivalent is introduced.
5. Whether app-level guard wiring is in or out of the first implementation.
6. Whether first implementation is unit-level only.
7. Exact test fixture structure.
8. Exact file list.
9. Confirmation that no DB, migrations, ORM, OpenAPI, route implementation, UI, deployment, or secrets work is included.

## 16. Risks

| Risk                                                           | Mitigation                                       |
| -------------------------------------------------------------- | ------------------------------------------------ |
| Accidentally trusting workspaceId from token/header/body/query | Explicit rejection tests                         |
| Conflating workspace membership with permission                | Keep permissionGuard separate                    |
| Route contract drift                                           | No route implementation in this slice            |
| OpenAPI drift                                                  | No OpenAPI changes in this slice                 |
| DB scope creep                                                 | No DB/query implementation without authorization |
| Unclear resolver boundary                                      | Decide resolver shape before authorization       |
| Global route bypass                                            | Require explicit classification                  |
| Enumeration leak                                               | actor-not-member returns 404                     |

## 17. Implementation Planning Review Criteria

The next review gate must verify:

| Criterion                                        | Required |
| ------------------------------------------------ | -------: |
| Planning remains implementation-only planning    |      Yes |
| Runtime implementation is not included           |      Yes |
| File list is clear                               |      Yes |
| Test list is clear                               |      Yes |
| Auth0 workspace authority remains rejected       |      Yes |
| x-nashir-workspace-id remains rejected           |      Yes |
| Membership and permission remain separate        |      Yes |
| Resource-owned workspace lookup remains deferred |      Yes |
| OpenAPI changes remain excluded                  |      Yes |
| DB/migration/ORM work remains excluded           |      Yes |
| Route implementation remains excluded            |      Yes |
| Next gate is implementation planning review      |      Yes |

## 18. GO / NO-GO Decision

Decision: GO to Backend Slice 0 Workspace Context Resolution Implementation Planning Review Gate.

This planning gate is complete enough for implementation planning review.

This gate does not authorize implementation.

This gate does not authorize route creation.

This gate does not authorize database schema changes.

This gate does not authorize SQL migrations.

This gate does not authorize ORM/query implementation.

This gate does not authorize OpenAPI changes.

This gate does not authorize UI changes.

This gate does not authorize deployment or secrets configuration.

## 19. Next Gate

Recommended next gate:

Backend Slice 0 Workspace Context Resolution Implementation Planning Review Gate

Purpose of next gate:

1. Review the planned implementation scope.
2. Confirm the planned file list.
3. Confirm the planned test list.
4. Confirm the membership resolver boundary.
5. Confirm no unauthorized DB, migration, ORM, OpenAPI, route, UI, deployment, or secrets work is included.
6. Decide whether the project can proceed to implementation authorization planning.
