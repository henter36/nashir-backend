# Nashir Backend Slice 0 — Workspace Context Resolution Decision Gate

## 1. Gate Purpose

This document records the V1 decisions for Backend Slice 0 Workspace Context Resolution.

This gate follows the merged Workspace Context Resolution Planning Gate and Planning Review Gate.

This is a decision gate only.

This gate decides the approved V1 boundaries for workspace context resolution before implementation planning.

This gate does not authorize runtime implementation.

This gate does not authorize product routes, workspace routes, database schema changes, SQL migrations, ORM/query implementation, OpenAPI changes, deployment changes, secrets configuration, UI changes, or a new backend slice.

## 2. Reviewed Inputs

| Input  |          Status | Purpose                                           |
| ------ | --------------: | ------------------------------------------------- |
| PR #57 |          Merged | Workspace Context Resolution Planning Review Gate |
| PR #56 |          Merged | Workspace Context Resolution Planning Gate        |
| PR #55 |          Merged | Auth0 token verification execution verification   |
| PR #54 |          Merged | Auth0 token verification execution review         |
| PR #53 |          Merged | Auth0 token verification implementation           |
| PR #47 | Prior authority | Auth0 token verification decision gate            |
| PR #43 | Prior authority | Auth0 provider selection                          |
| PR #41 | Prior authority | JWT/JWKS token format decision                    |

## 3. Current Accepted Architecture

The accepted request authorization sequence remains:

| Stage | Component             | Output                      |
| ----- | --------------------- | --------------------------- |
| 1     | authGuard             | VerifiedIdentityContext     |
| 2     | workspaceContextGuard | FullyResolvedRequestContext |
| 3     | permissionGuard       | Permission decision         |

The accepted context boundary remains:

| Context                     | Producer              | Contains             |
| --------------------------- | --------------------- | -------------------- |
| VerifiedIdentityContext     | authGuard             | actorId              |
| FullyResolvedRequestContext | workspaceContextGuard | actorId, workspaceId |

authGuard must not resolve workspaceId.

permissionGuard must not run for workspace-scoped permission decisions without a resolved workspace context.

## 4. Decision 1 — V1 workspaceId Source

Decision: For V1 workspace-scoped routes, the approved workspaceId source is an explicit route or path parameter.

| Source                   |               Decision | Reason                                                          |
| ------------------------ | ---------------------: | --------------------------------------------------------------- |
| Route/path workspaceId   |        Approved for V1 | Explicit route contract and reviewable boundary                 |
| Auth0 token payload      |               Rejected | Auth0 is not Nashir workspace authority                         |
| Auth0 organization claim |               Rejected | Auth0 organizations are not Nashir workspaces                   |
| Auth0 app_metadata       |               Rejected | Metadata is not Nashir authorization authority                  |
| Auth0 user_metadata      |               Rejected | Metadata is not Nashir authorization authority                  |
| x-nashir-workspace-id    | Rejected in Auth0 path | Transitional header is not trusted                              |
| Request body workspaceId |    Rejected by default | Too easy to confuse command payload with authorization boundary |
| Query string workspaceId |               Deferred | Requires route-specific contract review                         |

V1 workspaceContextGuard must not accept workspaceId from JWT claims, Auth0 organizations, Auth0 metadata, transitional headers, or arbitrary request body fields.

## 5. Decision 2 — Resource-Owned Workspace Resolution

Decision: Resource-owned workspace resolution is deferred from the first Workspace Context Resolution implementation slice.

For this decision gate, the first implementation path should focus on explicit workspace-scoped route context.

| Mode                            |                                      Decision | Reason                                           |
| ------------------------------- | --------------------------------------------: | ------------------------------------------------ |
| Explicit route/path workspaceId | Approved for V1 first implementation planning | Simple, auditable, contract-first                |
| Resource-owned workspace lookup |                                      Deferred | Requires repository/resource ownership boundary  |
| Mixed route/resource resolution |                                      Deferred | Adds ambiguity before route contracts are mature |
| Global implicit bypass          |                                      Rejected | Bypass must be explicit and reviewed             |

Resource-owned workspace resolution may be introduced later through a separate planning and decision gate.

## 6. Decision 3 — Workspace Membership Authority

Decision: Workspace membership must be resolved from Nashir WorkspaceMember authority.

| Authority Candidate                 |           Decision |
| ----------------------------------- | -----------------: |
| Nashir WorkspaceMember              | Approved authority |
| Auth0 role                          |           Rejected |
| Auth0 permission                    |           Rejected |
| Auth0 organization                  |           Rejected |
| Auth0 metadata                      |           Rejected |
| Caller-supplied granted permissions |           Rejected |

workspaceContextGuard verifies membership existence only.

permissionGuard remains responsible for action-level authorization.

Membership does not imply permission.

## 7. Decision 4 — Membership Lookup Boundary

Decision: Future implementation planning may introduce a workspace membership resolver boundary, but not database/ORM implementation unless separately authorized.

Approved for implementation planning:

| Item                                                         |                    Decision |
| ------------------------------------------------------------ | --------------------------: |
| WorkspaceMembershipResolver interface or equivalent boundary |       Approved for planning |
| Deterministic test fixture or in-memory resolver for tests   |       Approved for planning |
| Production DB query implementation                           | Not authorized by this gate |
| SQL migration                                                | Not authorized by this gate |
| ORM model change                                             | Not authorized by this gate |

The implementation planning gate must decide whether the first implementation uses an existing repository boundary, a new interface, or a test-only resolver.

## 8. Decision 5 — Error Semantics

Decision: V1 workspaceContextGuard error semantics are:

| Failure                                      |                 Decision | Reason                                   |
| -------------------------------------------- | -----------------------: | ---------------------------------------- |
| Missing VerifiedIdentityContext              |                      401 | Authentication context missing           |
| Missing required workspaceId route parameter |                      400 | Route contract input missing             |
| Invalid workspaceId format                   |                      400 | Malformed request input                  |
| Workspace not found                          |                      404 | Workspace boundary not found             |
| Actor is not a workspace member              |                      404 | Enumeration-safe boundary                |
| Workspace membership lookup unavailable      |                      503 | Server dependency unavailable            |
| Permission denied after workspace resolution | permissionGuard decision | Not workspaceContextGuard responsibility |

The actor-not-member case uses 404 for enumeration safety.

The missing workspace source case uses 400 when the route contract requires a workspaceId path parameter.

## 9. Decision 6 — Global Route Handling

Decision: Global route bypass must be explicit and is not implicitly allowed.

| Route Type                   |                                                                    Decision |
| ---------------------------- | --------------------------------------------------------------------------: |
| Workspace-scoped route       |                                              Must use workspaceContextGuard |
| Global route                 |                                            Requires explicit classification |
| Unknown route classification |                            Must not bypass workspaceContextGuard by default |
| Health route                 | Existing health behavior remains outside this decision unless later changed |

The implementation planning gate must list any route class that is allowed to bypass workspaceContextGuard.

No broad global bypass is authorized by this decision gate.

## 10. Decision 7 — OpenAPI Boundary

Decision: No OpenAPI change is authorized by this gate.

If the future implementation introduces or changes route contracts that expose workspaceId in paths, an OpenAPI alignment gate must occur before route implementation.

| Case                                |                                                        Decision |
| ----------------------------------- | --------------------------------------------------------------: |
| Guard/context utility only          |                                      No OpenAPI change required |
| New workspace-scoped route contract | Requires OpenAPI planning/alignment before route implementation |
| Existing route contract change      |                             Requires OpenAPI planning/alignment |
| Product route implementation        |                                                  Not authorized |

This decision gate does not authorize OpenAPI edits.

## 11. Decision 8 — Test Boundary

Decision: Future implementation planning must include tests for workspace context resolution without requiring live Auth0.

Required test areas:

| Test Area                                                    | Decision |
| ------------------------------------------------------------ | -------: |
| Missing VerifiedIdentityContext                              | Required |
| Valid actor and valid workspace membership                   | Required |
| Valid actor but workspace not found                          | Required |
| Valid actor but not workspace member                         | Required |
| Missing workspaceId route parameter                          | Required |
| Invalid workspaceId format                                   | Required |
| workspaceId from token ignored                               | Required |
| x-nashir-workspace-id ignored in Auth0 path                  | Required |
| FullyResolvedRequestContext contains actorId and workspaceId | Required |
| permissionGuard not responsible for membership resolution    | Required |
| No live Auth0 dependency                                     | Required |

Tests may use local verified identity fixtures from the completed Auth0 verification slice.

## 12. Decision 9 — Implementation Sequencing

Decision: The next implementation-related stage must be an implementation planning gate, not implementation.

Required sequence:

| Step | Gate                                                             |
| ---- | ---------------------------------------------------------------- |
| 1    | Workspace Context Resolution Decision Review Gate                |
| 2    | Workspace Context Resolution Implementation Planning Gate        |
| 3    | Workspace Context Resolution Implementation Planning Review Gate |
| 4    | Workspace Context Resolution Implementation Authorization Gate   |
| 5    | Implementation only after explicit authorization                 |

This decision gate does not skip the review or authorization process.

## 13. Accepted V1 Workspace Context Resolution Boundary

The accepted V1 boundary is:

1. authGuard verifies Auth0 JWT and emits VerifiedIdentityContext.
2. workspaceContextGuard receives actorId from VerifiedIdentityContext.
3. workspaceContextGuard reads workspaceId from an approved route/path parameter.
4. workspaceContextGuard rejects workspaceId from JWT, Auth0 orgs, Auth0 metadata, headers, arbitrary body fields, or query strings unless separately approved later.
5. workspaceContextGuard verifies workspace membership using Nashir authority.
6. workspaceContextGuard emits FullyResolvedRequestContext.
7. permissionGuard evaluates permissions after workspace context exists.
8. workspaceContextGuard does not grant permissions.
9. workspaceContextGuard does not mutate data.
10. workspaceContextGuard does not implement product route logic.

## 14. Explicit Non-Goals

This gate does not authorize:

| Area                             |         Status |
| -------------------------------- | -------------: |
| Runtime implementation           | Not authorized |
| Product route implementation     | Not authorized |
| Workspace route implementation   | Not authorized |
| Database schema changes          | Not authorized |
| SQL migrations                   | Not authorized |
| ORM/query implementation         | Not authorized |
| OpenAPI changes                  | Not authorized |
| UI changes                       | Not authorized |
| Deployment changes               | Not authorized |
| Secrets configuration            | Not authorized |
| New backend slice implementation | Not authorized |

## 15. Risk Review

| Risk                                  | Decision Mitigation                                       |
| ------------------------------------- | --------------------------------------------------------- |
| Trusting workspaceId from Auth0       | Rejected                                                  |
| Trusting x-nashir-workspace-id        | Rejected                                                  |
| Conflating membership with permission | workspaceContextGuard and permissionGuard remain separate |
| Workspace enumeration leakage         | Actor-not-member returns 404                              |
| Route contract ambiguity              | V1 uses route/path workspaceId only                       |
| Resource ownership ambiguity          | Resource-owned resolution deferred                        |
| DB/migration scope creep              | Not authorized                                            |
| OpenAPI drift                         | Route contract changes require OpenAPI alignment gate     |

## 16. Remaining Gaps After This Decision

The following remain unresolved because they belong to later gates:

1. Exact implementation shape of workspaceContextGuard.
2. Whether to introduce WorkspaceMembershipResolver interface.
3. Whether a repository boundary already exists or must be introduced later.
4. Concrete route list for first integration.
5. Whether OpenAPI alignment is needed before route integration.
6. Exact test fixture structure.
7. Whether resource-owned workspace resolution is needed in a later slice.
8. Whether global routes exist beyond health routes.

These gaps do not block this decision gate, but they block implementation.

## 17. Decision Summary

| Decision                            | Result                        |
| ----------------------------------- | ----------------------------- |
| V1 workspaceId source               | Approved route/path parameter |
| Auth0 workspace authority           | Rejected                      |
| Transitional workspace header trust | Rejected                      |
| Request body workspaceId            | Rejected by default           |
| Query string workspaceId            | Deferred                      |
| Resource-owned workspace resolution | Deferred                      |
| Membership authority                | Nashir WorkspaceMember        |
| Actor-not-member behavior           | 404                           |
| Missing workspace route parameter   | 400                           |
| Invalid workspaceId format          | 400                           |
| Workspace lookup unavailable        | 503                           |
| OpenAPI changes                     | Not authorized by this gate   |
| Runtime implementation              | Not authorized by this gate   |

## 18. GO / NO-GO Decision

Decision: GO to Backend Slice 0 Workspace Context Resolution Decision Review Gate.

This decision gate is complete enough for review.

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

Backend Slice 0 Workspace Context Resolution Decision Review Gate

Purpose of next gate:

1. Review all V1 decisions.
2. Confirm route/path workspaceId source decision.
3. Confirm resource-owned resolution deferral.
4. Confirm 404 actor-not-member behavior.
5. Confirm OpenAPI boundary.
6. Confirm whether the project can move to implementation planning after review.
