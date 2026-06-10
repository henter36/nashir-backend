# Nashir Backend Slice 0 — Workspace Context Resolution Implementation Authorization Gate

## 1. Gate Purpose

This document authorizes the exact implementation boundary for Backend Slice 0 Workspace Context Resolution.

This gate follows the merged Workspace Context Resolution Implementation Planning Gate and Implementation Planning Review Gate.

This is an implementation authorization gate.

This gate decides whether a later implementation execution pull request may implement the planned workspace context resolution guard and tests.

This gate authorizes only the implementation scope explicitly listed in this document.

This gate does not itself implement code.

This gate does not authorize product routes, workspace route implementation, database schema changes, SQL migrations, ORM/query implementation, OpenAPI changes, deployment changes, secrets configuration, UI changes, or a new backend slice.

## 2. Reviewed Inputs

| Input  |          Status | Purpose                                                          |
| ------ | --------------: | ---------------------------------------------------------------- |
| PR #61 |          Merged | Workspace Context Resolution Implementation Planning Review Gate |
| PR #60 |          Merged | Workspace Context Resolution Implementation Planning Gate        |
| PR #59 |          Merged | Workspace Context Resolution Decision Review Gate                |
| PR #58 |          Merged | Workspace Context Resolution Decision Gate                       |
| PR #57 |          Merged | Workspace Context Resolution Planning Review Gate                |
| PR #56 |          Merged | Workspace Context Resolution Planning Gate                       |
| PR #55 |          Merged | Auth0 token verification execution verification                  |
| PR #54 |          Merged | Auth0 token verification execution review                        |
| PR #53 |          Merged | Auth0 token verification implementation                          |
| PR #47 | Prior authority | Auth0 token verification decision gate                           |
| PR #43 | Prior authority | Auth0 provider selection                                         |
| PR #41 | Prior authority | JWT/JWKS token format decision                                   |

## 3. Authorization Summary

This gate authorizes a later implementation execution pull request to implement:

| Area                                                  |  Authorization |
| ----------------------------------------------------- | -------------: |
| workspaceContextGuard utility                         |     Authorized |
| WorkspaceMembershipResolver boundary                  |     Authorized |
| FullyResolvedRequestContext request attachment typing |     Authorized |
| Unit tests for workspace context resolution           |     Authorized |
| App-level route wiring                                | Not authorized |
| Product routes                                        | Not authorized |
| Workspace route implementation                        | Not authorized |
| Database schema changes                               | Not authorized |
| SQL migrations                                        | Not authorized |
| ORM/query implementation                              | Not authorized |
| OpenAPI changes                                       | Not authorized |
| UI changes                                            | Not authorized |
| Deployment/secrets                                    | Not authorized |

## 4. Authorized Implementation Objective

The authorized implementation objective is to introduce a workspace context resolution guard that runs after Auth0 token verification and before permission evaluation.

The authorized implementation must:

1. Require a VerifiedIdentityContext produced by authGuard.
2. Read workspaceId only from a route/path parameter.
3. Reject or ignore workspaceId from Auth0 token claims.
4. Reject or ignore workspaceId from Auth0 organizations.
5. Reject or ignore workspaceId from Auth0 metadata.
6. Reject or ignore x-nashir-workspace-id.
7. Reject or ignore request body workspaceId.
8. Reject or ignore query string workspaceId.
9. Verify workspace membership through an injected Nashir membership resolver boundary.
10. Produce FullyResolvedRequestContext.
11. Preserve permissionGuard as the action-level authorization boundary.
12. Fail closed.

## 5. Authorized File Scope

The later implementation execution pull request is authorized to change only these files:

| File                                  | Authorized Change                                            |
| ------------------------------------- | ------------------------------------------------------------ |
| src/workspace-context-guard.ts        | Create workspace context guard implementation                |
| src/request-context.ts                | Add or confirm FullyResolvedRequestContext attachment typing |
| tests/workspace-context-guard.test.ts | Add deterministic unit tests                                 |

No other file is authorized by this gate.

## 6. Files Explicitly Not Authorized

The later implementation execution pull request must not change:

| File / Area           |  Authorization |
| --------------------- | -------------: |
| src/app.ts            | Not authorized |
| package.json          | Not authorized |
| pnpm-lock.yaml        | Not authorized |
| OpenAPI files         | Not authorized |
| database schema files | Not authorized |
| migration files       | Not authorized |
| ORM/model files       | Not authorized |
| product route files   | Not authorized |
| workspace route files | Not authorized |
| UI files              | Not authorized |
| deployment files      | Not authorized |
| secrets/config files  | Not authorized |

If implementation later requires any file outside the authorized list, a new authorization gate is required before changing it.

## 7. Authorized Exported Shape

The later implementation is authorized to introduce the following exported boundary in src/workspace-context-guard.ts or an equivalent strictly narrower shape.

### 7.1 Workspace Membership Resolver

The authorized resolver boundary is:

| Name                        | Purpose                                             |
| --------------------------- | --------------------------------------------------- |
| WorkspaceMembershipResolver | Injected boundary for checking workspace membership |

The resolver must accept:

| Field       | Source                  |
| ----------- | ----------------------- |
| actorId     | VerifiedIdentityContext |
| workspaceId | route/path parameter    |

The resolver must return one of these outcomes:

| Outcome             | Meaning                                       |
| ------------------- | --------------------------------------------- |
| member              | actor is a workspace member                   |
| workspace_not_found | workspace does not exist or cannot be exposed |
| not_member          | actor is not a member                         |
| unavailable         | membership lookup dependency unavailable      |

The resolver must not perform unauthorized production DB queries unless separately authorized.

The resolver may be implemented in tests as a deterministic in-memory fixture.

### 7.2 Guard Factory

The authorized guard factory is:

| Export                          | Purpose                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| createWorkspaceContextGuardHook | Creates a Fastify-compatible guard hook or equivalent request hook |

The guard must receive:

| Input                           | Requirement                             |
| ------------------------------- | --------------------------------------- |
| request.verifiedIdentityContext | Required                                |
| request.params workspaceId      | Required for workspace-scoped guard use |
| WorkspaceMembershipResolver     | Required                                |

The guard must produce:

| Output                                                   | Requirement                               |
| -------------------------------------------------------- | ----------------------------------------- |
| request.requestContext or approved equivalent attachment | FullyResolvedRequestContext               |
| actorId                                                  | copied from VerifiedIdentityContext       |
| workspaceId                                              | copied from approved route/path parameter |

The exact attachment field must align with existing request-context conventions.

If the existing repository already uses request.requestContext for FullyResolvedRequestContext, the implementation must preserve that convention.

## 8. Authorized workspaceId Source

The later implementation is authorized to read workspaceId only from route/path params.

| Source                   |  Authorization |
| ------------------------ | -------------: |
| route/path parameter     |     Authorized |
| Auth0 token payload      | Not authorized |
| Auth0 organization claim | Not authorized |
| Auth0 app_metadata       | Not authorized |
| Auth0 user_metadata      | Not authorized |
| x-nashir-workspace-id    | Not authorized |
| request body workspaceId | Not authorized |
| query string workspaceId | Not authorized |

The guard must not fall back to any unauthorized source.

## 9. Authorized Error Semantics

The later implementation must use these error semantics:

| Failure                                      |        Authorized Result |
| -------------------------------------------- | -----------------------: |
| Missing VerifiedIdentityContext              |                      401 |
| Missing required workspaceId route parameter |                      400 |
| Invalid workspaceId format                   |                      400 |
| Workspace not found                          |                      404 |
| Actor is not a workspace member              |                      404 |
| Workspace membership lookup unavailable      |                      503 |
| Permission denied after workspace resolution | permissionGuard decision |

The actor-not-member result remains 404 for enumeration safety.

Permission denial remains outside workspaceContextGuard.

## 10. Authorized workspaceId Format Validation

The later implementation is authorized to add deterministic workspaceId format validation.

The validation must be conservative.

Authorized validation options:

| Option                                              | Authorization |
| --------------------------------------------------- | ------------: |
| non-empty string validation                         |    Authorized |
| safe string validation consistent with existing IDs |    Authorized |
| route/path parameter presence validation            |    Authorized |

Not authorized:

| Option                                                    |  Authorization |
| --------------------------------------------------------- | -------------: |
| database existence validation through production DB query | Not authorized |
| OpenAPI contract modification                             | Not authorized |
| route schema modification                                 | Not authorized |

If the implementation needs a stricter ID format than already established in the repository, that must be documented in the implementation PR.

## 11. Authorized Request Context Typing

The later implementation may update src/request-context.ts only to support the workspace context attachment required by workspaceContextGuard.

Authorized typing:

| Type                                              |  Authorization |
| ------------------------------------------------- | -------------: |
| VerifiedIdentityContext reuse                     |     Authorized |
| FullyResolvedRequestContext reuse                 |     Authorized |
| Fastify request augmentation for resolved context |     Authorized |
| New unrelated request context fields              | Not authorized |
| Permissions embedded into request context         | Not authorized |
| Workspace role embedded into request context      | Not authorized |

FullyResolvedRequestContext must contain actorId and workspaceId only unless a prior approved authority already defines additional fields.

## 12. Authorized Tests

The later implementation execution pull request must include tests for:

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
| x-nashir-workspace-id is ignored                                             |      Yes |
| request body workspaceId is ignored by default                               |      Yes |
| query string workspaceId is not trusted                                      |      Yes |
| permissionGuard remains separate from membership resolution                  |      Yes |
| no live Auth0 dependency                                                     |      Yes |
| deterministic in-memory membership resolver fixture                          |      Yes |

Tests must not require live Auth0.

Tests must not require production database access.

Tests must not require migrations.

## 13. Authorized Test Fixture Boundary

The later implementation may introduce in-memory test fixtures inside tests/workspace-context-guard.test.ts.

Authorized fixtures:

| Fixture                              | Authorization |
| ------------------------------------ | ------------: |
| verified identity fixture            |    Authorized |
| route params fixture                 |    Authorized |
| in-memory membership resolver        |    Authorized |
| unavailable resolver fixture         |    Authorized |
| non-member resolver fixture          |    Authorized |
| workspace-not-found resolver fixture |    Authorized |

Not authorized:

| Fixture                  |  Authorization |
| ------------------------ | -------------: |
| live Auth0 tenant        | Not authorized |
| real JWKS endpoint       | Not authorized |
| production DB connection | Not authorized |
| migration runner         | Not authorized |
| ORM-backed resolver      | Not authorized |

## 14. Explicitly Not Authorized Runtime Integration

This authorization gate does not authorize app-level runtime integration.

| Integration Item                                |  Authorization |
| ----------------------------------------------- | -------------: |
| Registering workspaceContextGuard in src/app.ts | Not authorized |
| Applying guard to routes                        | Not authorized |
| Creating workspace-scoped routes                | Not authorized |
| Modifying existing route handlers               | Not authorized |
| Creating global route bypass list               | Not authorized |
| Product route integration                       | Not authorized |

A later integration planning and authorization gate is required before app-level route wiring.

## 15. Explicitly Not Authorized OpenAPI Work

This authorization gate does not authorize OpenAPI changes.

| OpenAPI Work                          |  Authorization |
| ------------------------------------- | -------------: |
| New workspace path parameter contract | Not authorized |
| Updating existing route contracts     | Not authorized |
| Product route contract changes        | Not authorized |
| Error response contract edits         | Not authorized |
| Generated client updates              | Not authorized |

If route contract work becomes necessary, an OpenAPI alignment gate must occur before route implementation.

## 16. Explicitly Not Authorized Data Work

This authorization gate does not authorize data-layer work.

| Data Work                 |  Authorization |
| ------------------------- | -------------: |
| Database schema changes   | Not authorized |
| SQL migrations            | Not authorized |
| Migration runner changes  | Not authorized |
| ORM model changes         | Not authorized |
| Production DB queries     | Not authorized |
| Seeding workspaces        | Not authorized |
| Seeding workspace members | Not authorized |

The first implementation must use an injected resolver boundary and deterministic tests.

## 17. Explicitly Not Authorized Permission Expansion

This authorization gate does not authorize permissionGuard expansion.

| Permission Work                        |  Authorization |
| -------------------------------------- | -------------: |
| Changing permissionGuard semantics     | Not authorized |
| Adding new permission call sites       | Not authorized |
| Adding grantedPermissions from callers | Not authorized |
| Treating membership as permission      | Not authorized |
| Trusting Auth0 roles or permissions    | Not authorized |

workspaceContextGuard verifies workspace membership only.

permissionGuard remains the action-level authorization boundary.

## 18. Implementation Execution Acceptance Criteria

A later implementation execution PR must satisfy:

| Criterion                                               | Required |
| ------------------------------------------------------- | -------: |
| Changes only authorized files                           |      Yes |
| Adds workspaceContextGuard implementation               |      Yes |
| Uses injected WorkspaceMembershipResolver or equivalent |      Yes |
| Reads workspaceId only from route/path params           |      Yes |
| Does not trust Auth0 workspace data                     |      Yes |
| Does not trust x-nashir-workspace-id                    |      Yes |
| Does not trust body/query workspaceId                   |      Yes |
| Emits FullyResolvedRequestContext                       |      Yes |
| Preserves permissionGuard separation                    |      Yes |
| Implements required error semantics                     |      Yes |
| Includes required tests                                 |      Yes |
| Does not change src/app.ts                              |      Yes |
| Does not add dependencies                               |      Yes |
| Does not change OpenAPI                                 |      Yes |
| Does not change DB/migrations/ORM                       |      Yes |
| Does not implement routes                               |      Yes |

## 19. Risk Review

| Risk                                         | Mitigation                                |
| -------------------------------------------- | ----------------------------------------- |
| Scope creep into app wiring                  | src/app.ts not authorized                 |
| Scope creep into DB lookup                   | production DB queries not authorized      |
| Trusting token/header/body/query workspaceId | explicit rejection tests required         |
| Conflating membership with permission        | permissionGuard remains separate          |
| OpenAPI drift                                | OpenAPI changes not authorized            |
| Route behavior drift                         | route implementation not authorized       |
| Enumeration leak                             | actor-not-member returns 404              |
| Test instability                             | deterministic in-memory resolver required |

## 20. Authorization Decision

Decision: GO to Backend Slice 0 Workspace Context Resolution Implementation Execution Gate.

This gate authorizes a later implementation execution pull request limited to:

1. src/workspace-context-guard.ts
2. src/request-context.ts
3. tests/workspace-context-guard.test.ts

This gate authorizes implementation of workspaceContextGuard only within the boundaries defined above.

This gate does not authorize app-level wiring.

This gate does not authorize product routes.

This gate does not authorize workspace route implementation.

This gate does not authorize database schema changes.

This gate does not authorize SQL migrations.

This gate does not authorize ORM/query implementation.

This gate does not authorize OpenAPI changes.

This gate does not authorize UI changes.

This gate does not authorize deployment or secrets configuration.

## 21. Next Gate

Recommended next gate:

Backend Slice 0 Workspace Context Resolution Implementation Execution Gate

Purpose of next gate:

1. Implement the authorized workspaceContextGuard boundary.
2. Update request-context typing only if required.
3. Add deterministic unit tests.
4. Verify all required tests pass.
5. Confirm no unauthorized files or scopes were changed.
6. Confirm implementation remains limited to the authorized file list.
