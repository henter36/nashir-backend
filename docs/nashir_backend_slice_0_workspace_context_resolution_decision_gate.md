Nashir Backend Slice 0 — Workspace Context Resolution Decision Gate
1. Gate Purpose
This document records the V1 decisions for Backend Slice 0 Workspace Context Resolution.
This gate follows the merged Workspace Context Resolution Planning Gate and Planning Review Gate.
This is a decision gate only.
This gate decides the approved V1 boundaries for workspace context resolution before implementation planning.
This gate does not authorize runtime implementation.
This gate does not authorize product routes, workspace routes, database schema changes, SQL migrations, ORM/query implementation, OpenAPI changes, deployment changes, secrets configuration, UI changes, or a new backend slice.
2. Reviewed Inputs
InputStatusPurpose
PR #57MergedWorkspace Context Resolution Planning Review Gate
PR #56MergedWorkspace Context Resolution Planning Gate
PR #55MergedAuth0 token verification execution verification
PR #54MergedAuth0 token verification execution review
PR #53MergedAuth0 token verification implementation
PR #47Prior authorityAuth0 token verification decision gate
PR #43Prior authorityAuth0 provider selection
PR #41Prior authorityJWT/JWKS token format decision
3. Current Accepted Architecture
The accepted request authorization sequence remains:
StageComponentOutput
1authGuardVerifiedIdentityContext
2workspaceContextGuardFullyResolvedRequestContext
3permissionGuardPermission decision
The accepted context boundary remains:
ContextProducerContains
VerifiedIdentityContextauthGuardactorId
FullyResolvedRequestContextworkspaceContextGuardactorId, workspaceId
authGuard must not resolve workspaceId.
permissionGuard must not run for workspace-scoped permission decisions without a resolved workspace context.
4. Decision 1 — V1 workspaceId Source
Decision: For V1 workspace-scoped routes, the approved workspaceId source is an explicit route or path parameter.
SourceDecisionReason
Route/path workspaceIdApproved for V1Explicit route contract and reviewable boundary
Auth0 token payloadRejectedAuth0 is not Nashir workspace authority
Auth0 organization claimRejectedAuth0 organizations are not Nashir workspaces
Auth0 app_metadataRejectedMetadata is not Nashir authorization authority
Auth0 user_metadataRejectedMetadata is not Nashir authorization authority
x-nashir-workspace-idRejected in Auth0 pathTransitional header is not trusted
Request body workspaceIdRejected by defaultToo easy to confuse command payload with authorization boundary
Query string workspaceIdDeferredRequires route-specific contract review
V1 workspaceContextGuard must not accept workspaceId from JWT claims, Auth0 organizations, Auth0 metadata, transitional headers, or arbitrary request body fields.
5. Decision 2 — Resource-Owned Workspace Resolution
Decision: Resource-owned workspace resolution is deferred from the first Workspace Context Resolution implementation slice.
For this decision gate, the first implementation path should focus on explicit workspace-scoped route context.
ModeDecisionReason
Explicit route/path workspaceIdApproved for V1 first implementation planningSimple, auditable, contract-first
Resource-owned workspace lookupDeferredRequires repository/resource ownership boundary
Mixed route/resource resolutionDeferredAdds ambiguity before route contracts are mature
Global implicit bypassRejectedBypass must be explicit and reviewed
Resource-owned workspace resolution may be introduced later through a separate planning and decision gate.
6. Decision 3 — Workspace Membership Authority
Decision: Workspace membership must be resolved from Nashir WorkspaceMember authority.
Authority CandidateDecision
Nashir WorkspaceMemberApproved authority
Auth0 roleRejected
Auth0 permissionRejected
Auth0 organizationRejected
Auth0 metadataRejected
Caller-supplied granted permissionsRejected
workspaceContextGuard verifies membership existence only.
permissionGuard remains responsible for action-level authorization.
Membership does not imply permission.
7. Decision 4 — Membership Lookup Boundary
Decision: Future implementation planning may introduce a workspace membership resolver boundary, but not database/ORM implementation unless separately authorized.
Approved for implementation planning:
ItemDecision
WorkspaceMembershipResolver interface or equivalent boundaryApproved for planning
Deterministic test fixture or in-memory resolver for tests/Approved for planning
Production DB query implementationNot authorized by this gate
SQL migrationNot authorized by this gate
ORM model changeNot authorized by this gate
The implementation planning gate must decide whether the first implementation uses an existing repository boundary, a new interface, or a test-only resolver.
8. Decision 5 — Error Semantics
Decision: V1 workspaceContextGuard error semantics are:
FailureDecisionReason
Missing VerifiedIdentityContext401Authentication context missing
Missing required workspaceId route parameter400Route contract input missing
Invalid workspaceId format400Malformed request input
Workspace not found404Workspace boundary not found
Actor is not a workspace member404Enumeration-safe boundary
Workspace membership lookup unavailable503Server dependency unavailable
Permission denied after workspace resolutionpermissionGuard decisionNot workspaceContextGuard responsibility
The actor-not-member case uses 404 for enumeration safety.
The missing workspace source case uses 400 when the route contract requires a workspaceId path parameter.
9. Decision 6 — Global Route Handling
Decision: Global route bypass must be explicit and is not implicitly allowed.
Route TypeDecision
Workspace-scoped routeMust use workspaceContextGuard
Global routeRequires explicit classification
Unknown route classificationMust not bypass workspaceContextGuard by default
Health routeExisting health behavior remains outside this decision unless later changed
The implementation planning gate must list any route class that is allowed to bypass workspaceContextGuard.
No broad global bypass is authorized by this decision gate.
10. Decision 7 — OpenAPI Boundary
Decision: No OpenAPI change is authorized by this gate.
If the future implementation introduces or changes route contracts that expose workspaceId in paths, an OpenAPI alignment gate must occur before route implementation.
CaseDecision
Guard/context utility onlyNo OpenAPI change required
New workspace-scoped route contractRequires OpenAPI planning/alignment before route implementation
Existing route contract changeRequires OpenAPI planning/alignment
Product route implementationNot authorized
This decision gate does not authorize OpenAPI edits.
11. Decision 8 — Test Boundary
Decision: Future implementation planning must include tests for workspace context resolution without requiring live Auth0.
Required test areas:
Test AreaDecision
Missing VerifiedIdentityContextRequired
Valid actor and valid workspace membershipRequired
Valid actor but workspace not foundRequired
Valid actor but not workspace memberRequired
Missing workspaceId route parameterRequired
Invalid workspaceId formatRequired
workspaceId from token ignoredRequired
x-nashir-workspace-id ignored in Auth0 pathRequired
FullyResolvedRequestContext contains actorId and workspaceIdRequired
permissionGuard not responsible for membership resolutionRequired
No live Auth0 dependencyRequired
Tests may use local verified identity fixtures from the completed Auth0 verification slice.
12. Decision 9 — Implementation Sequencing
Decision: The next implementation-related stage must be an implementation planning gate, not implementation.
Required sequence:
StepGate
1Workspace Context Resolution Decision Review Gate
2Workspace Context Resolution Implementation Planning Gate
3Workspace Context Resolution Implementation Planning Review Gate
4Workspace Context Resolution Implementation Authorization Gate
5Implementation only after explicit authorization
This decision gate does not skip the review or authorization process.
13. Accepted V1 Workspace Context Resolution Boundary
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
14. Explicit Non-Goals
This gate does not authorize:
AreaStatus
Runtime implementationNot authorized
Product route implementationNot authorized
Workspace route implementationNot authorized
Database schema changesNot authorized
SQL migrationsNot authorized
ORM/query implementationNot authorized
OpenAPI changesNot authorized
UI changesNot authorized
Deployment changesNot authorized
Secrets configurationNot authorized
New backend slice implementationNot authorized
15. Risk Review
RiskDecision Mitigation
Trusting workspaceId from Auth0Rejected
Trusting x-nashir-workspace-idRejected
Conflating membership with permissionworkspaceContextGuard and permissionGuard remain separate
Workspace enumeration leakageActor-not-member returns 404
Route contract ambiguityV1 uses route/path workspaceId only
Resource ownership ambiguityResource-owned resolution deferred
DB/migration scope creepNot authorized
OpenAPI driftRoute contract changes require OpenAPI alignment gate
16. Remaining Gaps After This Decision
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
17. Decision Summary
DecisionResult
V1 workspaceId sourceApproved route/path parameter
Auth0 workspace authorityRejected
Transitional workspace header trustRejected
Request body workspaceIdRejected by default
Query string workspaceIdDeferred
Resource-owned workspace resolutionDeferred
Membership authorityNashir WorkspaceMember
Actor-not-member behavior404
Missing workspace route parameter400
Invalid workspaceId format400
Workspace lookup unavailable503
OpenAPI changesNot authorized by this gate
Runtime implementationNot authorized by this gate
18. GO / NO-GO Decision
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
19. Next Gate
Recommended next gate:
Backend Slice 0 Workspace Context Resolution Decision Review Gate
Purpose of next gate:
1. Review all V1 decisions.
2. Confirm route/path workspaceId source decision.
3. Confirm resource-owned resolution deferral.
4. Confirm 404 actor-not-member behavior.
5. Confirm OpenAPI boundary.
6. Confirm whether the project can move to implementation planning after review.
