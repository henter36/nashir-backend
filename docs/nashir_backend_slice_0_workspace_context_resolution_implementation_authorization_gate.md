Nashir Backend Slice 0 — Workspace Context Resolution Implementation Authorization Gate
1. Gate Purpose
This document authorizes the exact implementation boundary for Backend Slice 0 Workspace Context Resolution.
This gate follows the merged Workspace Context Resolution Implementation Planning Gate and Implementation Planning Review Gate.
This is an implementation authorization gate.
This gate decides whether a later implementation execution pull request may implement the planned workspace context resolution guard and tests.
This gate authorizes only the implementation scope explicitly listed in this document.
This gate does not itself implement code.
This gate does not authorize product routes, workspace route implementation, database schema changes, SQL migrations, ORM/query implementation, OpenAPI changes, deployment changes, secrets configuration, UI changes, or a new backend slice.
2. Reviewed Inputs
InputStatusPurpose
PR #61MergedWorkspace Context Resolution Implementation Planning Review Gate
PR #60MergedWorkspace Context Resolution Implementation Planning Gate
PR #59MergedWorkspace Context Resolution Decision Review Gate
PR #58MergedWorkspace Context Resolution Decision Gate
PR #57MergedWorkspace Context Resolution Planning Review Gate
PR #56MergedWorkspace Context Resolution Planning Gate
PR #55MergedAuth0 token verification execution verification
PR #54MergedAuth0 token verification execution review
PR #53MergedAuth0 token verification implementation
PR #47Prior authorityAuth0 token verification decision gate
PR #43Prior authorityAuth0 provider selection
PR #41Prior authorityJWT/JWKS token format decision
3. Authorization Summary
This gate authorizes a later implementation execution pull request to implement:
AreaAuthorization
workspaceContextGuard utilityAuthorized
WorkspaceMembershipResolver boundaryAuthorized
FullyResolvedRequestContext request attachment typingAuthorized
Unit tests for workspace context resolutionAuthorized
App-level route wiringNot authorized
Product routesNot authorized
Workspace route implementationNot authorized
Database schema changesNot authorized
SQL migrationsNot authorized
ORM/query implementationNot authorized
OpenAPI changesNot authorized
UI changesNot authorized
Deployment/secretsNot authorized
4. Authorized Implementation Objective
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
5. Authorized File Scope
The later implementation execution pull request is authorized to change only these files:
FileAuthorized Change
src/workspace-context-guard.tsCreate workspace context guard implementation
src/request-context.ts Add or confirm FullyResolvedRequestContext attachment typing
tests/workspace-context-guard.test.tsAdd deterministic unit tests
No other file is authorized by this gate.
6. Files Explicitly Not Authorized
The later implementation execution pull request must not change:
File / AreaAuthorization
src/app.ts Not authorized
package.json Not authorized
pnpm-lock.yaml Not authorized
OpenAPI filesNot authorized
database schema filesNot authorized
migration filesNot authorized
ORM/model filesNot authorized
product route filesNot authorized
workspace route filesNot authorized
UI filesNot authorized
deployment filesNot authorized
secrets/config filesNot authorized
If implementation later requires any file outside the authorized list, a new authorization gate is required before changing it.
7. Authorized Exported Shape
The later implementation is authorized to introduce the following exported boundary in src/workspace-context-guard.ts or an equivalent strictly narrower shape.
7.1 Workspace Membership Resolver
The authorized resolver boundary is:
NamePurpose
WorkspaceMembershipResolverInjected boundary for checking workspace membership
The resolver must accept:
FieldSource
actorIdVerifiedIdentityContext
workspaceIdroute/path parameter
The resolver must return one of these outcomes:
OutcomeMeaning
memberactor is a workspace member
workspace_not_foundworkspace does not exist or cannot be exposed
not_memberactor is not a member
unavailablemembership lookup dependency unavailable
The resolver must not perform unauthorized production DB queries unless separately authorized.
The resolver may be implemented in tests as a deterministic in-memory fixture.
7.2 Guard Factory
The authorized guard factory is:
ExportPurpose
createWorkspaceContextGuardHookCreates a Fastify-compatible guard hook or equivalent request hook
The guard must receive:
InputRequirement
request.verifiedIdentityContextRequired
request.params workspaceIdRequired for workspace-scoped guard use
WorkspaceMembershipResolverRequired
The guard must produce:
OutputRequirement
request.requestContext or approved equivalent attachmentFullyResolvedRequestContext
actorIdcopied from VerifiedIdentityContext
workspaceIdcopied from approved route/path parameter
The exact attachment field must align with existing request-context conventions.
If the existing repository already uses request.requestContext for FullyResolvedRequestContext, the implementation must preserve that convention.
8. Authorized workspaceId Source
The later implementation is authorized to read workspaceId only from route/path params.
SourceAuthorization
route/path parameterAuthorized
Auth0 token payloadNot authorized
Auth0 organization claimNot authorized
Auth0 app_metadataNot authorized
Auth0 user_metadataNot authorized
x-nashir-workspace-idNot authorized
request body workspaceIdNot authorized
query string workspaceIdNot authorized
The guard must not fall back to any unauthorized source.
9. Authorized Error Semantics
The later implementation must use these error semantics:
FailureAuthorized Result
Missing VerifiedIdentityContext401
Missing required workspaceId route parameter400
Invalid workspaceId format400
Workspace not found404
Actor is not a workspace member404
Workspace membership lookup unavailable503
Permission denied after workspace resolutionpermissionGuard decision
The actor-not-member result remains 404 for enumeration safety.
Permission denial remains outside workspaceContextGuard.
10. Authorized workspaceId Format Validation
The later implementation is authorized to add deterministic workspaceId format validation.
The validation must be conservative.
Authorized validation options:
OptionAuthorization
non-empty string validationAuthorized
safe string validation consistent with existing IDsAuthorized
route/path parameter presence validationAuthorized
Not authorized:
OptionAuthorization
database existence validation through production DB queryNot authorized
OpenAPI contract modificationNot authorized
route schema modificationNot authorized
If the implementation needs a stricter ID format than already established in the repository, that must be documented in the implementation PR.
11. Authorized Request Context Typing
The later implementation may update src/request-context.ts only to support the workspace context attachment required by workspaceContextGuard.
Authorized typing:
TypeAuthorization
VerifiedIdentityContext reuseAuthorized
FullyResolvedRequestContext reuseAuthorized
Fastify request augmentation for resolved contextAuthorized
New unrelated request context fieldsNot authorized
Permissions embedded into request contextNot authorized
Workspace role embedded into request contextNot authorized
FullyResolvedRequestContext must contain actorId and workspaceId only unless a prior approved authority already defines additional fields.
12. Authorized Tests
The later implementation execution pull request must include tests for:
Test AreaRequired
Missing VerifiedIdentityContext returns 401Yes
Missing workspaceId route parameter returns 400Yes
Invalid workspaceId format returns 400Yes
Workspace not found returns 404Yes
Actor not workspace member returns 404Yes
Workspace membership lookup unavailable returns 503Yes
Valid actor and valid workspace membership emits FullyResolvedRequestContextYes
FullyResolvedRequestContext contains actorId and workspaceIdYes
Auth0 token workspace claims are ignoredYes
x-nashir-workspace-id is ignoredYes
request body workspaceId is ignored by defaultYes
query string workspaceId is not trustedYes
permissionGuard remains separate from membership resolutionYes
no live Auth0 dependencyYes
deterministic in-memory membership resolver fixtureYes
Tests must not require live Auth0.
Tests must not require production database access.
Tests must not require migrations.
13. Authorized Test Fixture Boundary
The later implementation may introduce in-memory test fixtures inside tests/workspace-context-guard.test.ts.
Authorized fixtures:
FixtureAuthorization
verified identity fixtureAuthorized
route params fixtureAuthorized
in-memory membership resolverAuthorized
unavailable resolver fixtureAuthorized
non-member resolver fixtureAuthorized
workspace-not-found resolver fixtureAuthorized
Not authorized:
FixtureAuthorization
live Auth0 tenantNot authorized
real JWKS endpointNot authorized
production DB connectionNot authorized
migration runnerNot authorized
ORM-backed resolverNot authorized
14. Explicitly Not Authorized Runtime Integration
This authorization gate does not authorize app-level runtime integration.
Integration ItemAuthorization
Registering workspaceContextGuard in src/app.ts Not authorized
Applying guard to routesNot authorized
Creating workspace-scoped routesNot authorized
Modifying existing route handlersNot authorized
Creating global route bypass listNot authorized
Product route integrationNot authorized
A later integration planning and authorization gate is required before app-level route wiring.
15. Explicitly Not Authorized OpenAPI Work
This authorization gate does not authorize OpenAPI changes.
OpenAPI WorkAuthorization
New workspace path parameter contractNot authorized
Updating existing route contractsNot authorized
Product route contract changesNot authorized
Error response contract editsNot authorized
Generated client updatesNot authorized
If route contract work becomes necessary, an OpenAPI alignment gate must occur before route implementation.
16. Explicitly Not Authorized Data Work
This authorization gate does not authorize data-layer work.
Data WorkAuthorization
Database schema changesNot authorized
SQL migrationsNot authorized
Migration runner changesNot authorized
ORM model changesNot authorized
Production DB queriesNot authorized
Seeding workspacesNot authorized
Seeding workspace membersNot authorized
The first implementation must use an injected resolver boundary and deterministic tests.
17. Explicitly Not Authorized Permission Expansion
This authorization gate does not authorize permissionGuard expansion.
Permission WorkAuthorization
Changing permissionGuard semanticsNot authorized
Adding new permission call sitesNot authorized
Adding grantedPermissions from callersNot authorized
Treating membership as permissionNot authorized
Trusting Auth0 roles or permissionsNot authorized
workspaceContextGuard verifies workspace membership only.
permissionGuard remains the action-level authorization boundary.
18. Implementation Execution Acceptance Criteria
A later implementation execution PR must satisfy:
CriterionRequired
Changes only authorized filesYes
Adds workspaceContextGuard implementationYes
Uses injected WorkspaceMembershipResolver or equivalentYes
Reads workspaceId only from route/path paramsYes
Does not trust Auth0 workspace dataYes
Does not trust x-nashir-workspace-idYes
Does not trust body/query workspaceIdYes
Emits FullyResolvedRequestContextYes
Preserves permissionGuard separationYes
Implements required error semanticsYes
Includes required tests/Yes
Does not change src/app.ts Yes
Does not add dependenciesYes
Does not change OpenAPIYes
Does not change DB/migrations/ORMYes
Does not implement routesYes
19. Risk Review
RiskMitigation
Scope creep into app wiringsrc/app.ts not authorized
Scope creep into DB lookupproduction DB queries not authorized
Trusting token/header/body/query workspaceIdexplicit rejection tests required
Conflating membership with permissionpermissionGuard remains separate
OpenAPI driftOpenAPI changes not authorized
Route behavior driftroute implementation not authorized
Enumeration leakactor-not-member returns 404
Test instabilitydeterministic in-memory resolver required
20. Authorization Decision
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
21. Next Gate
Recommended next gate:
Backend Slice 0 Workspace Context Resolution Implementation Execution Gate
Purpose of next gate:
1. Implement the authorized workspaceContextGuard boundary.
2. Update request-context typing only if required.
3. Add deterministic unit tests.
4. Verify all required tests pass.
5. Confirm no unauthorized files or scopes were changed.
6. Confirm implementation remains limited to the authorized file list.
