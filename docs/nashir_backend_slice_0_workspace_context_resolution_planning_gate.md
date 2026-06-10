Nashir Backend Slice 0 — Workspace Context Resolution Planning Gate
1. Gate Purpose
This document defines the planning boundary for Backend Slice 0 Workspace Context Resolution.
This gate follows completion of Backend Slice 0 Auth0 Token Verification implementation execution, review, and verification.
This is a planning gate only.
This gate does not authorize runtime implementation.
This gate does not authorize product routes, workspace routes, database schema changes, SQL migrations, ORM/query implementation, OpenAPI changes, deployment changes, secrets configuration, UI changes, or a new backend slice.
2. Current Documented State
The following state is already documented and accepted by prior gates:
AreaDocumented State
Auth providerAuth0 is selected for V1 identity verification
Auth0 authority boundaryAuth0 is identity proviAuth0 authority bouhority boundaryNashir remains source of truth for Workspace, WorkspaceMember, roles, permissions, approval rules, and access decisions
Token verificationAuth0 JWT verification via JWKS is complete
Identity contextauthGuard emits VerifiedIdentityContext
Verified identity payloadVerifiedIdentityContext contains actorId only
Workspace contextworkspaceId is not resolved by authGuard
Final request contextFullyResolvedRequestContext must be produced after workspace resolution
Authorization pipelineauthGuard → workspaceContextGuard → permissionGuard
Transitional headersx-nashir-actor-id and x-nashir-workspace-id are not trusted in the Auth0-enabled path
3. Inputs Reviewed
InputStatusPurpose
PR #55MergedAuth0 token verification execution verification
PR #54MergedAuth0 token verification execution review
PR #53MergedAuth0 token verification implementation
PR #52Prior authorityImplementation authorization review
PR #51Prior authorityImplementation authorization
PR #49Prior authorityExecution planning
PR #47Prior authorityAuth0 token verification decision
PR #43Prior authorityAuth0 provider selection
PR #41Prior authorityJWT/JWKS token format decision
Existing request context modelReviewedConfirms VerifiedIdentityContext and FullyResolvedRequestContext boundary
4. Planning Objective
The objective of this gate is to plan how Nashir will resolve workspace context after a request has a verified actor identity.
The planned responsibility of workspaceContextGuard is:
1. Receive a verified actor identity from authGuard.
2. Determine the requested workspace boundary from an approved request source.
3. Verify that the actor is allowed to operate within that workspace boundary.
4. Emit FullyResolvedRequestContext with actorId and workspaceId.
5. Preserve separation from permissionGuard, which remains responsible for permission-level authorization.
5. Scope Classification
5.1 In Scope for Planning
AreaPlanning Status
workspaceContextGuard responsibilityIn scope
FullyResolvedRequestContext boundaryIn scope
Workspace source-of-truth rulesIn scope
Workspace membership resolution strategyIn scope
Error semantics planningIn scope
Testing strategy planningIn scope
Boundary with permissionGuardIn scope
5.2 Out of Scope for This Gate
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
New backend sliceNot authorized
6. Documented vs Inferred vs Proposed
6.1 Documented
The following are already documented by prior gates:
1. authGuard verifies identity only.
2. authGuard must not resolve workspaceId.
3. VerifiedIdentityContext contains actorId only.
4. FullyResolvedRequestContext contains actorId and workspaceId.
5. Nashir, not Auth0, owns Workspace and WorkspaceMember authorization authority.
6. Auth0 roles, permissions, organizations, metadata, and custom claims are not trusted for Nashir authorization.
7. Transitional headers are not trusted in the Auth0-enabled production path.
6.2 Inferred
The following are inferred from the approved architecture:
1. workspaceContextGuard must run after authGuard.
2. workspaceContextGuard must not trust workspaceId from Auth0 token claims.
3. workspaceContextGuard must not trust x-nashir-workspace-id in the Auth0-enabled production path.
4. workspaceContextGuard must validate workspace membership before producing FullyResolvedRequestContext.
5. permissionGuard must not run with only VerifiedIdentityContext when a workspace-scoped permission decision is required.
6.3 Proposed
The following are proposed for V1 planning and require review before implementation:
1. For explicitly workspace-scoped routes, the requested workspaceId should come from an approved route/path parameter, not from JWT claims or transitional headers.
2. For resource-scoped routes where workspaceId is not present in the path, workspaceId should be resolved from the resource’s persisted workspace ownership.
3. Missing workspace, inaccessible workspace, or actor-not-member should use enumeration-safe behavior.
4. workspaceContextGuard should emit FullyResolvedRequestContext only after confirming actorId and workspaceId are both valid within Nashir authority.
5. Global or non-workspace-scoped routes should be explicitly classified before bypassing workspaceContextGuard.
7. Workspace Identity Source Boundary
workspaceId must not be sourced from:
SourceTrusted?Reason
Auth0 token payloadNoAuth0 is not Nashir workspace authority
Auth0 organization claimNoAuth0 organizations are not Nashir workspace authority
Auth0 app_metadataNoMetadata is not Nashir authorization authority
Auth0 user_metadataNoMetadata is not Nashir authorization authority
x-nashir-workspace-idNoTransitional header not trusted in Auth0 path
Client-supplied arbitrary body fieldNo by defaultRequires explicit route contract
Route/path workspaceIdProposed YesRequires explicit route contract
Persisted resource workspace ownerProposed YesRequires repository lookup
Nashir WorkspaceMember relationYesNashir source of truth
8. Planned workspaceContextGuard Responsibility
The planned workspaceContextGuard responsibility is:
1. Require VerifiedIdentityContext.
2. Resolve requested workspace boundary.
3. Verify workspace exists.
4. Verify actor is a member of the workspace through Nashir WorkspaceMember authority.
5. Produce FullyResolvedRequestContext.
6. Attach FullyResolvedRequestContext to request context for downstream permissionGuard.
7. Fail closed if required workspace context cannot be resolved.
The guard must not:
1. Grant permissions.
2. Interpret Auth0 roles or permissions.
3. Trust workspaceId from JWT claims.
4. Trust transitional workspace headers in the Auth0-enabled path.
5. Create or mutate workspace records.
6. Create or mutate workspace membership records.
7. Bypass permissionGuard.
9. Planned Context Model
ContextProduced ByContainsStatus
VerifiedIdentityContextauthGuardactorIdExisting
FullyResolvedRequestContextworkspaceContextGuardactorId, workspaceIdPlanned
Permission decisionpermissionGuardRequired permission + resolved contextExisting/planned integration
The planned handoff is:
StageInputOutput
authGuardAuthorization bearer tokenVerifiedIdentityContext
workspaceContextGuardVerifiedIdentityContext + approved workspace sourceFullyResolvedRequestContext
permissionGuardFullyResolvedRequestContext + required permissionallow / deny / not_found
10. Workspace Resolution Modes
10.1 Explicit Workspace-Scoped Route Mode
Proposed V1 behavior:
1. Route includes a workspace identifier in an approved route parameter.
2. workspaceContextGuard reads the approved parameter.
3. workspaceContextGuard verifies the workspace exists.
4. workspaceContextGuard verifies actor membership.
5. workspaceContextGuard emits FullyResolvedRequestContext.
Example conceptual route shape:
ConceptStatus
workspaceId from route/pathProposed
workspaceId from headerRejected
workspaceId from tokenRejected
10.2 Resource-Owned Workspace Mode
Proposed V1 behavior:
1. Route includes a resource identifier.
2. Repository lookup resolves the resource’s workspaceId.
3. workspaceContextGuard confirms actor membership in that workspace.
4. permissionGuard later checks the requested permission.
This mode should only be implemented after repository/query boundaries are explicitly authorized.
10.3 Global Route Mode
Some routes may not be workspace-scoped.
Proposed V1 rule:
1. Global route classification must be explicit.
2. Global route bypass must not be implicit.
3. Any route requiring workspace authorization must not bypass workspaceContextGuard.
11. Membership Verification Boundary
Workspace membership must be resolved from Nashir authority.
Planned source of truth:
EntityPurpose
WorkspaceDefines workspace boundary
WorkspaceMemberDefines actor membership in a workspace
Roles/permissionsEvaluated by permissionGuard, not workspaceContextGuard
workspaceContextGuard verifies membership existence.
permissionGuard verifies action-level permission.
12. Error Semantics Planning
The following error behavior is proposed for review:
FailureProposed ResultReason
Missing VerifiedIdentityContext401Authentication context missing
Missing required workspace source400 or 404Depends on route contract
Invalid workspaceId format400Malformed request input
Workspace not found404Resource does not exist
Actor not a member of workspace404Enumeration-safe boundary
Workspace lookup unavailable503Server dependency unavailable
Permission missing after workspace resolutionpermissionGuard decisionNot workspaceContextGuard responsibility
Unresolved decision:
DecisionStatus
Missing workspace source returns 400 vs 404Unresolved
Actor-not-member returns 403 vs 404Proposed 404, requires review
Workspace lookup failure 503 vs 500Proposed 503, requires review
13. Security Boundary
workspaceContextGuard must preserve these security rules:
1. Default deny.
2. No workspace trust from Auth0.
3. No workspace trust from transitional headers.
4. No permission grant inside workspaceContextGuard.
5. No route-level implicit bypass.
6. No user-controlled workspace switching without Nashir membership verification.
7. No authorization decision based only on actorId.
8. No full request context without validated workspace membership.
14. Test Planning
The implementation gate should require tests for:
Test AreaRequired?
Missing VerifiedIdentityContextYes
Valid actor + valid workspace membershipYes
Valid actor + missing workspaceYes
Valid actor + not a workspace memberYes
Invalid workspaceId formatYes
workspaceId from token ignoredYes
x-nashir-workspace-id ignored in Auth0 pathYes
FullyResolvedRequestContext contains actorId and workspaceIdYes
permissionGuard not called before workspace resolution in protected route flowProposed
Global route explicit bypass behaviorProposed
Tests must not require live Auth0.
Tests should use local verified identity context fixtures or authenticated request fixtures from the completed Auth0 verification slice.
15. Implementation Preconditions
Before implementation can begin, the following must be resolved:
1. Approved workspaceId source for V1 routes.
2. Approved route contract shape for workspace-scoped routes.
3. Approved Workspace and WorkspaceMember read model or repository boundary.
4. Approved error semantics for not-found vs forbidden cases.
5. Approved handling for global routes.
6. Approved test fixture approach.
7. Confirmation that no database migration is needed for this slice, or a separate migration gate if needed.
16. Risks
RiskImpactMitigation
Trusting workspaceId from JWTHighExplicitly prohibited
Trusting x-nashir-workspace-idHighExplicitly prohibited
Conflating membership with permissionHighSeparate workspaceContextGuard and permissionGuard
Returning 403 leaks workspace existenceMediumConsider enumeration-safe 404
Starting implementation before route contract is clearHighRequire review gate before implementation
Reusing transitional harness behavior in production pathHighKeep Auth0 path strict
Adding DB/migrations without authorizationHighKeep this gate planning-only
17. Remaining Gaps
The following remain unresolved and must be addressed before implementation authorization:
1. Exact V1 workspace route contract.
2. Whether workspaceId is path-only for V1.
3. Whether resource-owned workspace resolution is in this slice or deferred.
4. Membership lookup mechanism.
5. Error semantics for missing workspace source.
6. Error semantics for actor-not-member.
7. Whether global routes exist in Slice 0.
8. Test fixture structure for workspace membership.
9. Whether any OpenAPI update is needed before implementation.
18. Review Criteria for Next Gate
The next review gate must confirm:
CriterionRequired Result
No runtime implementation authorized by this gatePASS
Workspace source boundary is explicitPASS
Auth0 workspace authority is rejectedPASS
Transitional workspace header trust is rejectedPASS
Membership vs permission boundary is clearPASS
Error semantics are either resolved or explicitly deferredPASS
Implementation preconditions are listedPASS
Next gate is review, not implementationPASS
19. GO / NO-GO Decision
Decision: GO to Workspace Context Resolution Planning Review Gate.
This gate does not authorize implementation.
This gate does not authorize route creation.
This gate does not authorize database schema changes.
This gate does not authorize SQL migrations.
This gate does not authorize ORM/query implementation.
This gate does not authorize OpenAPI changes.
This gate does not authorize UI changes.
This gate does not authorize deployment or secrets configuration.
20. Next Gate
Recommended next gate:
Workspace Context Resolution Planning Review Gate
Purpose of next gate:
1. Review the proposed workspace context boundary.
2. Resolve or explicitly defer V1 workspaceId source decisions.
3. Review error semantics.
4. Confirm implementation preconditions.
5. Decide whether to proceed to Workspace Context Resolution Decision Gate or revise planning.
