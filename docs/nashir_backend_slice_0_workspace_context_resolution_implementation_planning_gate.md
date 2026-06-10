Nashir Backend Slice 0 — Workspace Context Resolution Implementation Planning Gate
1. Gate Purpose
This document defines the implementation planning boundary for Backend Slice 0 Workspace Context Resolution.
This gate follows the merged Workspace Context Resolution Decision Gate and Decision Review Gate.
This is an implementation planning gate only.
This gate plans the implementation scope, file boundaries, test boundaries, sequencing, and risks for a later implementation authorization gate.
This gate does not authorize runtime implementation.
This gate does not authorize product routes, workspace routes, database schema changes, SQL migrations, ORM/query implementation, OpenAPI changes, deployment changes, secrets configuration, UI changes, or a new backend slice.
2. Reviewed Inputs
InputStatusPurpose
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
3. Current Approved Decisions
The implementation plan must follow these approved decisions:
Decision AreaApproved Decision
V1 workspaceId sourceRoute/path parameter
Auth0 workspace authorityRejected
x-nashir-workspace-idRejected in Auth0 path
Request body workspaceIdRejected by default
Query string workspaceIdDeferred
Resource-owned workspace resolutionDeferred
Membership authorityNashir WorkspaceMember
Actor not workspace member404
Missing workspace route parameter400
Invalid workspaceId format400
Workspace membership lookup unavailable503
OpenAPI changesNot authorized by prior gate
Runtime implementationNot yet authorized
4. Planned Implementation Objective
The planned implementation objective is to introduce a workspace context resolution layer after Auth0 token verification and before permission evaluation.
The planned implementation must:
1. Require a valid VerifiedIdentityContext produced by authGuard.
2. Read workspaceId only from an approved route/path parameter.
3. Reject workspaceId from Auth0 token claims, Auth0 organizations, Auth0 metadata, transitional headers, arbitrary body fields, and query strings.
4. Verify workspace membership using Nashir authority.
5. Produce FullyResolvedRequestContext.
6. Preserve permissionGuard as the action-level authorization boundary.
7. Fail closed.
5. Planned Runtime Flow
The planned runtime flow is:
StepComponentInputOutput
1authGuardAuthorization bearer tokenVerifiedIdentityContext
2workspaceContextGuardVerifiedIdentityContext and route/path workspaceIdFullyResolvedRequestContext
3permissionGuardFullyResolvedRequestContext and required permissionPermission decision
The planned workspaceContextGuard must not run before authGuard.
The planned permissionGuard must not be used for workspace-scoped permission decisions until FullyResolvedRequestContext exists.
6. Planned File Scope
The following files are planned for later implementation authorization review.
FilePlanned PurposeStatus
src/workspace-context-guard.tsWorkspace context guard implementationPlanned only
src/request-context.ts Add or confirm workspace context request attachment typingPlanned only
tests/workspace-context-guard.test.tsWorkspace context guard tests/Planned only
src/app.ts Later guard wiring if explicitly authorizedPlanned only
No file may be implemented under this planning gate.
The implementation authorization gate must confirm the exact final file list before coding starts.
7. Planned Non-File Scope
The following are explicitly not planned for the first implementation slice:
AreaStatusReason
Product routesExcludedRoute implementation not authorized
Workspace route implementationExcludedRoute implementation not authorized
Database schemaExcludedNo DB changes authorized
SQL migrationsExcludedNo migration authorization
ORM modelsExcludedNo ORM authorization
Production DB queriesExcludedMembership resolver boundary must be planned first
OpenAPI changesExcludedRequires separate OpenAPI alignment gate if route contracts change
UIExcludedBackend Slice 0 only
Deployment/secretsExcludedNot needed for planning
Resource-owned workspace lookupDeferredExplicitly deferred by decision gate
8. Planned workspaceContextGuard Responsibility
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
9. Planned Membership Resolver Boundary
Implementation planning may introduce a WorkspaceMembershipResolver or equivalent abstraction.
Planned boundary:
ResponsibilityPlanned Location
Check workspace membershipWorkspaceMembershipResolver or equivalent
Return membership found / not foundResolver result
Return lookup unavailable stateResolver error/result
Avoid production DB coupling in first implementation planningRequired
Support deterministic tests/Required
The first implementation plan should use a deterministic test resolver or in-memory resolver for tests unless a repository boundary is separately authorized.
Production DB query implementation is not authorized by this planning gate.
10. Planned Error Semantics
The later implementation must use these approved semantics:
FailurePlanned Result
Missing VerifiedIdentityContext401
Missing required workspaceId route parameter400
Invalid workspaceId format400
Workspace not found404
Actor is not a workspace member404
Workspace membership lookup unavailable503
Permission denied after workspace resolutionpermissionGuard decision
The actor-not-member result remains 404 for enumeration safety.
11. Planned Test Scope
The later implementation must include tests for:
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
x-nashir-workspace-id is ignored in Auth0 pathYes
Request body workspaceId is ignored by defaultYes
Query string workspaceId is not trustedYes
permissionGuard remains separate from membership resolutionYes
No live Auth0 dependencyYes
Tests may use verified identity fixtures rather than live Auth0.
12. Planned Integration Boundary
The first implementation planning target should be guard/context utility integration only.
Integration AreaPlanned Status
workspaceContextGuard unit-level behaviorPlanned
Request context typingPlanned
App-level guard wiringRequires explicit authorization
Product route integrationNot planned
Workspace route integrationNot planned
OpenAPI route contract updateNot planned
DB-backed membership lookupNot planned
If app-level guard wiring is included later, the implementation authorization gate must explicitly approve it.
13. Planned OpenAPI Boundary
No OpenAPI change is planned in this gate.
If later implementation requires new route/path workspaceId contracts, an OpenAPI alignment gate must happen before route implementation.
CasePlanned Treatment
Guard utility onlyNo OpenAPI change
Route contract with workspaceId path parameterRequires separate OpenAPI alignment gate
Existing route contract changeRequires separate OpenAPI alignment gate
Product route contractNot authorized
14. Planned Security Controls
The later implementation must preserve these security controls:
ControlRequired
Fail closedYes
Do not trust workspaceId from Auth0Yes
Do not trust x-nashir-workspace-idYes
Do not trust request body workspaceIdYes
Do not trust query string workspaceIdYes
Membership does not imply permissionYes
Actor-not-member hides workspace existenceYes
permissionGuard remains action-level authorityYes
No production DB changes without authorizationYes
No route bypass unless explicitly classifiedYes
15. Planned Implementation Preconditions
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
16. Risks
RiskMitigation
Accidentally trusting workspaceId from token/header/body/queryExplicit rejection tests
Conflating workspace membership with permissionKeep permissionGuard separate
Route contract driftNo route implementation in this slice
OpenAPI driftNo OpenAPI changes in this slice
DB scope creepNo DB/query implementation without authorization
Unclear resolver boundaryDecide resolver shape before authorization
Global route bypassRequire explicit classification
Enumeration leakactor-not-member returns 404
17. Implementation Planning Review Criteria
The next review gate must verify:
CriterionRequired
Planning remains implementation-only planningYes
Runtime implementation is not includedYes
File list is clearYes
Test list is clearYes
Auth0 workspace authority remains rejectedYes
x-nashir-workspace-id remains rejectedYes
Membership and permission remain separateYes
Resource-owned workspace lookup remains deferredYes
OpenAPI changes remain excludedYes
DB/migration/ORM work remains excludedYes
Route implementation remains excludedYes
Next gate is implementation planning reviewYes
18. GO / NO-GO Decision
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
19. Next Gate
Recommended next gate:
Backend Slice 0 Workspace Context Resolution Implementation Planning Review Gate
Purpose of next gate:
1. Review the planned implementation scope.
2. Confirm the planned file list.
3. Confirm the planned test list.
4. Confirm the membership resolver boundary.
5. Confirm no unauthorized DB, migration, ORM, OpenAPI, route, UI, deployment, or secrets work is included.
6. Decide whether the project can proceed to implementation authorization planning.
