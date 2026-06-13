# Nashir Backend Slice 0 — Product Route OpenAPI Authority Comparison Evidence Gate

## 1. Gate Name

Backend Slice 0 Product Route OpenAPI Authority Comparison Evidence Gate

## 2. Gate Type

Authority-backed comparison evidence gate.

This gate is documentation-only.

It does not authorize runtime implementation, OpenAPI edits, generated client regeneration, SQL migrations, auth changes, permission guard changes, workspace context changes, request context parsing changes, package changes, CI workflow changes, UI work, or deployment work.

## 3. Purpose

This gate records evidence from the pinned external OpenAPI authority and compares it against the accepted backend product route runtime inventory.

The purpose is to determine whether the next step is:

- No-change acceptance.
- OpenAPI edit authorization planning.
- Runtime correction planning.
- NO-GO due to incomplete authority evidence.

## 4. Inputs

### 4.1 Latest Accepted Planning Gate

- `docs/nashir_backend_slice_0_product_route_openapi_authority_comparison_planning_gate.md`
- Decision: GO to Backend Slice 0 Product Route OpenAPI Authority Comparison Evidence Gate.

### 4.2 Authority Inputs

- Authority repo path used locally: `/Users/mohammedalqudairi/workspace/nashir`
- Authority ref used: `36da9ed31903562bddfb7ffd669841956e334a51`
- Authority OpenAPI file: `docs/nashir_v1_openapi.yaml`

### 4.3 Runtime Inputs

Runtime files used as evidence:

- `src/products/product-route.ts`
- `src/products/product-handlers.ts`
- `src/products/product-schema.ts`
- `src/products/product-types.ts`
- `src/error-model.ts`
- `src/permission-guard.ts`
- `src/request-context.ts`
- `src/workspace-context-guard.ts`
- `tests/products/product-route-handler.test.ts`

## 5. Authority Validation Evidence

### 5.1 Validation Command

```bash
node scripts/validate-contract-authority.mjs \
  --authority-repo "$NASHIR_AUTHORITY_REPO" \
  --authority-ref "36da9ed31903562bddfb7ffd669841956e334a51"
```

### 5.2 Validation Output

```text
PASS: Authority repository path exists: /Users/mohammedalqudairi/workspace/nashir
PASS: Authority repository is a Git work tree: /Users/mohammedalqudairi/workspace/nashir
PASS: Authority ref 36da9ed31903562bddfb7ffd669841956e334a51 resolves to pinned SHA 36da9ed31903562bddfb7ffd669841956e334a51
PASS: Authority file exists at pinned SHA: docs/nashir_v1_openapi.yaml
PASS: Authority file exists at pinned SHA: docs/nashir_auth_rbac_workspace_identity_gate.md
PASS: Authority file exists at pinned SHA: docs/nashir_auth_rbac_openapi_alignment_final_re_review_gate.md
PASS: Authority file exists at pinned SHA: docs/nashir_backend_slice_0_contract_safe_infrastructure_validation_action_gate.md
PASS: Copied authority file absent from backend: docs/nashir_v1_openapi.yaml
PASS: Copied authority file absent from backend: docs/nashir_auth_rbac_workspace_identity_gate.md
PASS: Copied authority file absent from backend: docs/nashir_auth_rbac_openapi_alignment_final_re_review_gate.md
PASS: Copied authority file absent from backend: docs/nashir_backend_slice_0_contract_safe_infrastructure_validation_action_gate.md
PASS: Generated client directory absent from backend: src/generated
PASS: Generated client directory absent from backend: generated
PASS: Generated client directory absent from backend: openapi-generated
PASS: Allowed CI workflow exists in backend: .github/workflows/ci.yml
PASS: Contract authority validation completed successfully.
```

### 5.3 Resolved Authority SHA

```text
36da9ed31903562bddfb7ffd669841956e334a51
```

### 5.4 OpenAPI File Existence

```text
docs/nashir_v1_openapi.yaml exists at 36da9ed31903562bddfb7ffd669841956e334a51
```

## 6. Authority OpenAPI Product Evidence

Relevant OpenAPI lines extracted from the pinned authority file:

```text
5:  description: Contract-first API for Nashir V1. Slice 1 covers Products and Assets. Slice 2 adds Campaign Content + Review/Preview metadata only. Slice 3 adds AI readiness snapshot endpoints; all are read-only and advisory only. Slice 4 adds Creator Studio session, context draft, readiness assessment, and transfer draft endpoints; all are draft-only and do not execute AI, publish content, scrape platforms, or create real destination records.
12:  - name: Products
13:    description: Product catalog metadata. Product names are display fields only; productId is canonical.
17:    description: V1 Core Content Studio compatibility surface for content-item CRUD, preview-artifact metadata, and compatibility lifecycle actions. Submit-review, approve, and reject are aliases over the authoritative ContentDraft lifecycle and must not create a second lifecycle, approval model, permission model, or service. Slice 2 does not execute AI, publish, schedule, upload binaries, or run external integrations.
23:    description: Workspace identity and settings. All merchant-owned resources are scoped to a workspace. workspaceId is path-derived and must never be supplied in a request body.
79:  /workspaces/{workspaceId}/products:
81:      operationId: listProducts
82:      x-permission: nashir.products.read
95:        - permissionGuard
97:        - Products
98:      summary: List products.
99:      description: Lists product catalog records for a workspace. Product names are not identity; productId is canonical.
116:          description: Product list response.
120:                $ref: "#/components/schemas/ProductListResponse"
126:      operationId: createProduct
127:      x-permission: nashir.products.manage
140:        - permissionGuard
143:        - Products
155:              $ref: "#/components/schemas/CreateProductRequest"
164:          description: Product created.
168:                $ref: "#/components/schemas/ProductResponse"
177:  /workspaces/{workspaceId}/products/{productId}:
179:      operationId: getProduct
180:      x-permission: nashir.products.read
193:        - permissionGuard
195:        - Products
197:      description: Reads one product by productId. Product names are display labels and must not be used as identity.
200:        - $ref: "#/components/parameters/ProductIdPath"
208:          description: Product response.
212:                $ref: "#/components/schemas/ProductResponse"
218:      operationId: updateProduct
219:      x-permission: nashir.products.manage
232:        - permissionGuard
235:        - Products
237:      description: Updates product metadata. Clients must send If-Match or X-Resource-Version for optimistic concurrency.
240:        - $ref: "#/components/parameters/ProductIdPath"
249:              $ref: "#/components/schemas/UpdateProductRequest"
256:          description: Product updated.
260:                $ref: "#/components/schemas/ProductResponse"
271:  /workspaces/{workspaceId}/assets:
274:      x-permission: nashir.assets.read
287:        - permissionGuard
298:        - $ref: "#/components/parameters/LinkedProductIdQuery"
321:      x-permission: nashir.assets.manage
334:        - permissionGuard
371:  /workspaces/{workspaceId}/assets/{assetId}:
374:      x-permission: nashir.assets.read
387:        - permissionGuard
413:      x-permission: nashir.assets.manage
426:        - permissionGuard
431:      description: Updates asset metadata only. Clients must send If-Match or X-Resource-Version for optimistic concurrency. Updating an asset does not approve rights automatically.
465:  /workspaces/{workspaceId}/assets/{assetId}/link-product:
467:      operationId: linkAssetToProduct
468:      x-permission: nashir.assets.manage
481:        - permissionGuard
497:              $ref: "#/components/schemas/LinkAssetToProductRequest"
519:  /workspaces/{workspaceId}/campaign-contents:
522:      x-permission: nashir.content.read
535:        - permissionGuard
539:      description: Lists campaign content records for a workspace. campaignContentId is canonical identity. Product and asset names may appear only as display snapshots; productId and assetId remain canonical links. This slice does not execute AI, publish, schedule, upload binary assets, or call connectors.
569:      x-permission: nashir.content.manage
582:        - permissionGuard
587:      description: Creates campaign content metadata and editable body content linked to an existing productId and optional existing assetIds. It does not execute AI, publish, schedule, upload binary assets, or approve asset rights.
621:  /workspaces/{workspaceId}/campaign-contents/{campaignContentId}:
624:      x-permission: nashir.content.read
637:        - permissionGuard
665:      x-permission: nashir.content.manage
678:        - permissionGuard
683:      description: Updates campaign content metadata or editable body content. Clients must send If-Match or X-Resource-Version for optimistic concurrency. Updating approved content should be handled by implementation policy and must not imply publishing.
719:  /workspaces/{workspaceId}/campaign-contents/{campaignContentId}/submit-review:
722:      x-permission: nashir.content.manage
735:        - permissionGuard
740:      description: Compatibility alias over the authoritative ContentDraft submit-review lifecycle transition using campaignContentId identity; it must not create a second lifecycle or approval model. This is a review transition only and does not execute AI, publish, schedule, or upload assets. Clients should send Idempotency-Key and a current If-Match or X-Resource-Version value.
777:  /workspaces/{workspaceId}/campaign-contents/{campaignContentId}/approve:
780:      x-permission: nashir.content.approve
794:        - permissionGuard
799:      description: Compatibility alias over the authoritative ContentDraft approval transition; it must use the same approval record, self-approval prevention, and nashir.content.approve permission model. This does not publish, schedule, execute AI, or approve asset rights automatically. Clients should send Idempotency-Key and a current If-Match or X-Resource-Version value.
836:  /workspaces/{workspaceId}/campaign-contents/{campaignContentId}/reject:
839:      x-permission: nashir.content.approve
853:        - permissionGuard
858:      description: Compatibility alias over the authoritative ContentDraft rejection transition; it must use the same approval record and nashir.content.approve permission model. This is a review decision only and does not publish, schedule, execute AI, or upload assets. Clients should send Idempotency-Key and a current If-Match or X-Resource-Version value.
895:  /workspaces/{workspaceId}/campaign-contents/{campaignContentId}/preview-artifacts:
898:      x-permission: nashir.content.read
911:        - permissionGuard
946:      x-permission: nashir.content.manage
959:        - permissionGuard
999:  /workspaces/{workspaceId}/readiness:
1002:      x-permission: nashir.workflow.read
1015:        - permissionGuard
1042:  /workspaces/{workspaceId}/workflow-definitions/{workflowDefinitionId}/readiness:
1045:      x-permission: nashir.workflow.read
1058:        - permissionGuard
1086:  /workspaces/{workspaceId}/workflow-definitions/{workflowDefinitionId}/steps/{stepKey}/readiness:
1089:      x-permission: nashir.workflow.read
1102:        - permissionGuard
1131:  /workspaces/{workspaceId}/ai-providers/{providerId}/readiness:
1134:      x-permission: nashir.model_routing.read
1147:        - permissionGuard
1175:  /workspaces/{workspaceId}/model-routes/{modelRouteId}/readiness:
1178:      x-permission: nashir.model_routing.read
1191:        - permissionGuard
1219:  /workspaces/{workspaceId}/prompts/{promptId}/readiness:
1222:      x-permission: nashir.prompt_governance.read
1235:        - permissionGuard
1263:  /workspaces/{workspaceId}/creator-studio/sessions:
1266:      x-permission: nashir.creator_studio.use
1279:        - permissionGuard
1322:  /workspaces/{workspaceId}/creator-studio/sessions/{sessionId}:
1325:      x-permission: nashir.creator_studio.use
1338:        - permissionGuard
1369:  /workspaces/{workspaceId}/creator-studio/context-drafts:
1372:      x-permission: nashir.creator_studio.transfer.create
1385:        - permissionGuard
1431:  /workspaces/{workspaceId}/creator-studio/context-drafts/{draftId}:
1434:      x-permission: nashir.creator_studio.use
1447:        - permissionGuard
1479:  /workspaces/{workspaceId}/creator-studio/readiness-assessments:
1482:      x-permission: nashir.creator_studio.transfer.create
1495:        - permissionGuard
1534:  /workspaces/{workspaceId}/creator-studio/transfer-drafts/content-studio:
1537:      x-permission: nashir.creator_studio.transfer.create
1550:        - permissionGuard
1597:  /workspaces/{workspaceId}/creator-studio/transfer-drafts/campaign:
1600:      x-permission: nashir.creator_studio.transfer.create
1613:        - permissionGuard
1660:  /workspaces/{workspaceId}/creator-studio/transfer-drafts/publishing:
1663:      x-permission: nashir.creator_studio.transfer.create
1676:        - permissionGuard
1723:  /workspaces/{workspaceId}/creator-studio/transfer-drafts/prompt-governance:
1726:      x-permission: nashir.creator_studio.transfer.create
1727:      x-secondary-permission: nashir.prompt_governance.read
1740:        - permissionGuard
1787:  /workspaces/{workspaceId}/creator-studio/transfer-drafts/{transferId}:
1790:      x-permission: nashir.creator_studio.use
1803:        - permissionGuard
1836:  /workspaces/{workspaceId}:
1839:      x-permission: nashir.workspace.read
1849:        - permissionGuard
1853:      description: Returns workspace metadata for the authenticated member. Requires nashir.workspace.read permission.
1874:      x-permission: nashir.workspace.update
1884:        - permissionGuard
1889:      description: Updates workspace-level settings. Requires nashir.workspace.update permission (admin or owner). workspaceId must not be supplied in the request body.
1918:  /workspaces/{workspaceId}/me:
1921:      x-permission: nashir.workspace.read
1931:        - permissionGuard
1935:      description: Returns the authenticated user's own WorkspaceMember record and role for this workspace. Requires nashir.workspace.read permission. Does not require nashir.members.manage; returns only the caller's own WorkspaceMember record.
1954:  /workspaces/{workspaceId}/members:
1957:      x-permission: nashir.workspace.read
1967:        - permissionGuard
1971:      description: Lists all WorkspaceMember records for the workspace. Requires nashir.workspace.read permission. Member list is not visible to non-members.
1994:      x-permission: nashir.members.manage
2004:        - permissionGuard
2009:      description: Invites a new member to the workspace. Requires nashir.members.manage permission (admin or owner). Creates a WorkspaceMember with status invited. Emits audit event.
2039:  /workspaces/{workspaceId}/members/{memberId}:
2042:      x-permission: nashir.workspace.read
2052:        - permissionGuard
2056:      description: Returns a WorkspaceMember record. Requires nashir.workspace.read permission. Any active member may read their own record; nashir.members.manage is required to read other members' records.
2078:      x-permission: nashir.members.manage
2088:        - permissionGuard
2093:      description: Updates the role of a WorkspaceMember. Requires nashir.members.manage permission (admin or owner). Emits audit event.
2125:      x-permission: nashir.members.manage
2135:        - permissionGuard
2139:      description: Removes a WorkspaceMember from the workspace. Requires nashir.members.manage permission (admin or owner). Emits audit event.
2157:  /workspaces/{workspaceId}/members/{memberId}/suspend:
2160:      x-permission: nashir.members.manage
2170:        - permissionGuard
2174:      description: Suspends a WorkspaceMember. Status transitions from active to suspended. Requires nashir.members.manage permission. Returns 409 if member is already suspended. Emits audit event.
2196:  /workspaces/{workspaceId}/members/{memberId}/activate:
2199:      x-permission: nashir.members.manage
2209:        - permissionGuard
2213:      description: Activates a suspended or invited WorkspaceMember. Status transitions to active. Requires nashir.members.manage permission. Returns 409 if member is already active. Emits audit event.
2235:  /workspaces/{workspaceId}/store-profile:
2238:      x-permission: nashir.store_profile.read
2248:        - permissionGuard
2252:      description: Returns the workspace's StoreProfile. One StoreProfile per workspace in V1. Requires nashir.store_profile.read permission.
2273:      x-permission: nashir.store_profile.update
2283:        - permissionGuard
2288:      description: Creates or updates the workspace's StoreProfile. Requires nashir.store_profile.update permission (admin or owner). workspaceId must not be supplied in the request body. Emits audit event.
2316:  /workspaces/{workspaceId}/data-sources:
2319:      x-permission: nashir.data_sources.read
2329:        - permissionGuard
2333:      description: Lists DataSource records for the workspace. Requires nashir.data_sources.read permission.
2356:      x-permission: nashir.data_sources.manage
2366:        - permissionGuard
2371:      description: Creates a DataSource record for the workspace. Requires nashir.data_sources.manage permission. No credentials are stored on this entity. Emits audit event.
2401:  /workspaces/{workspaceId}/data-sources/{dataSourceId}:
2404:      x-permission: nashir.data_sources.read
2414:        - permissionGuard
2418:      description: Returns a DataSource record. Requires nashir.data_sources.read permission. Returns 404 if not found in workspace.
2440:      x-permission: nashir.data_sources.manage
2450:        - permissionGuard
2455:      description: Updates a DataSource record. Requires nashir.data_sources.manage permission. Emits audit event.
2487:      x-permission: nashir.data_sources.manage
2497:        - permissionGuard
2501:      description: Removes a DataSource record. Requires nashir.data_sources.manage permission. Emits audit event.
2519:  /workspaces/{workspaceId}/channel-connections:
2522:      x-permission: nashir.channel_connections.read
2532:        - permissionGuard
2536:      description: Lists ChannelConnection records for the workspace. No raw credentials are returned. Requires nashir.channel_connections.read permission.
2559:      x-permission: nashir.channel_connections.manage
2569:        - permissionGuard
2574:      description: Creates a ChannelConnection record. Requires nashir.channel_connections.manage permission (admin or owner). Raw credentials must not be supplied; use IntegrationCredentials for credential references. Emits audit event.
2604:  /workspaces/{workspaceId}/channel-connections/{channelConnectionId}:
2607:      x-permission: nashir.channel_connections.read
2617:        - permissionGuard
2621:      description: Returns a ChannelConnection record. No raw credentials are returned. Requires nashir.channel_connections.read permission.
2643:      x-permission: nashir.channel_connections.manage
2653:        - permissionGuard
2658:      description: Updates a ChannelConnection record. Requires nashir.channel_connections.manage permission (admin or owner). Emits audit event.
2690:      x-permission: nashir.channel_connections.manage
2700:        - permissionGuard
2704:      description: Removes a ChannelConnection record. Requires nashir.channel_connections.manage permission (admin or owner). Emits audit event.
2722:  /workspaces/{workspaceId}/integration-credentials:
2725:      x-permission: nashir.integration_credentials.manage
2735:        - permissionGuard
2740:      description: Creates a vault-backed credential reference for a workspace integration. Requires nashir.integration_credentials.manage permission (admin or owner). Raw secret values must not be supplied or returned; an opaque vault reference identifier may be accepted and stored but is never returned. Emits audit event.
2770:  /workspaces/{workspaceId}/integration-credentials/{integrationCredentialId}:
2773:      x-permission: nashir.integration_credentials.manage
2783:        - permissionGuard
2787:      description: Revokes and removes a vault-backed credential reference. Requires nashir.integration_credentials.manage permission (admin or owner). Emits audit event. Does not return the credential value.
2805:  /workspaces/{workspaceId}/campaigns:
2808:      x-permission: nashir.campaigns.read
2818:        - permissionGuard
2822:      description: Lists Campaign records for the workspace. Requires nashir.campaigns.read permission.
2847:      x-permission: nashir.campaigns.manage
2857:        - permissionGuard
2862:      description: Creates a Campaign record for the workspace. Requires nashir.campaigns.manage permission. Campaign lifecycle status naming is deferred to the OpenAPI YAML review gate. Emits audit event.
2892:  /workspaces/{workspaceId}/campaigns/{campaignId}:
2895:      x-permission: nashir.campaigns.read
2905:        - permissionGuard
2909:      description: Returns a Campaign record. Requires nashir.campaigns.read permission. Returns 404 if not found in workspace.
2931:      x-permission: nashir.campaigns.manage
2941:        - permissionGuard
2946:      description: Updates a Campaign record. Requires nashir.campaigns.manage permission. Emits audit event.
2978:      x-permission: nashir.campaigns.manage
2988:        - permissionGuard
2992:      description: Archives a Campaign record. Soft-delete; campaign data is preserved but hidden from active views. Requires nashir.campaigns.manage permission. Emits audit event.
3010:  /workspaces/{workspaceId}/campaigns/{campaignId}/brief:
3013:      x-permission: nashir.campaigns.read
3023:        - permissionGuard
3027:      description: Returns the CampaignBrief for a campaign. One brief per campaign. Requires nashir.campaigns.read permission.
3049:      x-permission: nashir.campaigns.manage
3059:        - permissionGuard
3064:      description: Creates or updates the CampaignBrief for a campaign. Requires nashir.campaigns.manage permission. Emits audit event.
3093:  /workspaces/{workspaceId}/campaigns/{campaignId}/content-items:
3096:      x-permission: nashir.content.read
3106:        - permissionGuard
3110:      description: Lists CampaignContentItem records for a specific campaign. Requires nashir.content.read permission.
3135:      x-permission: nashir.content.manage
3145:        - permissionGuard
3150:      description: Creates a CampaignContentItem for a campaign. Requires nashir.content.manage permission. Emits audit event.
3181:  /workspaces/{workspaceId}/content-items:
3184:      x-permission: nashir.content.read
3194:        - permissionGuard
3198:      description: Lists all CampaignContentItem records across the workspace. Supports Content Studio workspace-wide views without requiring a campaignId. Requires nashir.content.read permission.
3220:  /workspaces/{workspaceId}/content-items/{contentItemId}/drafts:
3223:      x-permission: nashir.content.read
3233:        - permissionGuard
3237:      description: Lists ContentDraft records for a specific CampaignContentItem. Requires nashir.content.read permission.
3262:      x-permission: nashir.content.manage
```

### 6.1 Authority Product Paths Full Block

```text
              schema:
                $ref: "#/components/schemas/HealthResponse"
        default:
          $ref: "#/components/responses/DefaultError"
  /workspaces/{workspaceId}/products:
    get:
      operationId: listProducts
      x-permission: nashir.products.read
      x-workspace-scope: route
      x-membership-check: non-disclosing
      x-store-scope: implicit
      x-human-review-required: false
      x-audit-required: false
      x-evidence-required: false
      x-sensitive-operation: false
      x-no-automatic-execution: false
      x-guard-chain:
        - authGuard
        - workspaceContextGuard
        - nonDisclosingMembershipCheck
        - permissionGuard
      tags:
        - Products
      summary: List products.
      description: Lists product catalog records for a workspace. Product names are not identity; productId is canonical.
      parameters:
        - $ref: "#/components/parameters/WorkspaceIdPath"
        - $ref: "#/components/parameters/LimitQuery"
        - $ref: "#/components/parameters/CursorQuery"
        - $ref: "#/components/parameters/StatusQuery"
        - $ref: "#/components/parameters/UpdatedAfterQuery"
        - $ref: "#/components/parameters/SortQuery"
        - $ref: "#/components/parameters/RequestIdHeader"
      responses:
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/PermissionDenied"
        "404":
          $ref: "#/components/responses/NotFound"
        "200":
          description: Product list response.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ProductListResponse"
        "400":
          $ref: "#/components/responses/BadRequest"
        default:
          $ref: "#/components/responses/DefaultError"
    post:
      operationId: createProduct
      x-permission: nashir.products.manage
      x-workspace-scope: route
      x-membership-check: non-disclosing
      x-store-scope: implicit
      x-human-review-required: false
      x-audit-required: true
      x-evidence-required: false
      x-sensitive-operation: false
      x-no-automatic-execution: false
      x-guard-chain:
        - authGuard
        - workspaceContextGuard
        - nonDisclosingMembershipCheck
        - permissionGuard
        - rejectBodyWorkspaceId
      tags:
        - Products
      summary: Create product.
      description: Creates product metadata for the workspace. This endpoint does not create assets, campaigns, connector runs, or AI output.
      parameters:
        - $ref: "#/components/parameters/WorkspaceIdPath"
        - $ref: "#/components/parameters/IdempotencyKeyHeader"
        - $ref: "#/components/parameters/RequestIdHeader"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateProductRequest"
      responses:
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/PermissionDenied"
        "404":
          $ref: "#/components/responses/NotFound"
        "201":
          description: Product created.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ProductResponse"
        "400":
          $ref: "#/components/responses/BadRequest"
        "409":
          $ref: "#/components/responses/Conflict"
        "422":
          $ref: "#/components/responses/ValidationFailed"
        default:
          $ref: "#/components/responses/DefaultError"
  /workspaces/{workspaceId}/products/{productId}:
    get:
      operationId: getProduct
      x-permission: nashir.products.read
      x-workspace-scope: route
      x-membership-check: non-disclosing
      x-store-scope: implicit
      x-human-review-required: false
      x-audit-required: false
      x-evidence-required: false
      x-sensitive-operation: false
      x-no-automatic-execution: false
      x-guard-chain:
        - authGuard
        - workspaceContextGuard
        - nonDisclosingMembershipCheck
        - permissionGuard
      tags:
        - Products
      summary: Get product.
      description: Reads one product by productId. Product names are display labels and must not be used as identity.
      parameters:
        - $ref: "#/components/parameters/WorkspaceIdPath"
        - $ref: "#/components/parameters/ProductIdPath"
        - $ref: "#/components/parameters/RequestIdHeader"
      responses:
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/PermissionDenied"
        "200":
          description: Product response.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ProductResponse"
        "404":
          $ref: "#/components/responses/NotFound"
        default:
          $ref: "#/components/responses/DefaultError"
    put:
      operationId: updateProduct
      x-permission: nashir.products.manage
      x-workspace-scope: route
      x-membership-check: non-disclosing
      x-store-scope: implicit
      x-human-review-required: false
      x-audit-required: true
      x-evidence-required: false
      x-sensitive-operation: false
      x-no-automatic-execution: false
      x-guard-chain:
        - authGuard
        - workspaceContextGuard
        - nonDisclosingMembershipCheck
        - permissionGuard
        - rejectBodyWorkspaceId
      tags:
        - Products
      summary: Update product.
      description: Updates product metadata. Clients must send If-Match or X-Resource-Version for optimistic concurrency.
      parameters:
        - $ref: "#/components/parameters/WorkspaceIdPath"
        - $ref: "#/components/parameters/ProductIdPath"
        - $ref: "#/components/parameters/IfMatchHeader"
        - $ref: "#/components/parameters/ResourceVersionHeader"
        - $ref: "#/components/parameters/RequestIdHeader"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UpdateProductRequest"
      responses:
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/PermissionDenied"
        "200":
          description: Product updated.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ProductResponse"
        "400":
          $ref: "#/components/responses/BadRequest"
        "404":
          $ref: "#/components/responses/NotFound"
        "409":
          $ref: "#/components/responses/Conflict"
        "422":
          $ref: "#/components/responses/ValidationFailed"
        default:
          $ref: "#/components/responses/DefaultError"
```

### 6.2 Authority Targeted Component And Parameter Blocks

```text

===== WorkspaceIdPath @ line 4092 =====
4090: components:
4091:   parameters:
4092:     WorkspaceIdPath:
4093:       name: workspaceId
4094:       in: path
4095:       required: true
4096:       description: Stable opaque workspace identifier.
4097:       schema:
4098:         type: string
4099:         minLength: 1
4100:     ProductIdPath:
4101:       name: productId
4102:       in: path
4103:       required: true
4104:       description: Stable opaque product identifier. Product names are not identity.
4105:       schema:
4106:         type: string
4107:         minLength: 1
4108:     AssetIdPath:
4109:       name: assetId
4110:       in: path
4111:       required: true
4112:       description: Stable opaque asset identifier. Asset names and file names are not identity.
4113:       schema:
4114:         type: string
4115:         minLength: 1
4116:     CampaignContentIdPath:
4117:       name: campaignContentId
4118:       in: path
4119:       required: true
4120:       description: Stable opaque campaign content identifier. Campaign content titles are not identity.
4121:       schema:
4122:         type: string
4123:         minLength: 1
4124:     LimitQuery:
4125:       name: limit
4126:       in: query
4127:       required: false
4128:       description: Maximum number of records to return.
4129:       schema:
4130:         type: integer
4131:         minimum: 1
4132:         maximum: 100
4133:         default: 25
4134:     CursorQuery:
4135:       name: cursor
4136:       in: query
4137:       required: false
4138:       description: Cursor for the next page.
4139:       schema:
4140:         type: string
4141:     StatusQuery:
4142:       name: status
4143:       in: query
4144:       required: false
4145:       description: Optional resource status filter.
4146:       schema:
4147:         type: string
4148:     UpdatedAfterQuery:
4149:       name: updatedAfter
4150:       in: query
4151:       required: false
4152:       description: Return resources updated after this timestamp.
4153:       schema:
4154:         type: string
4155:         format: date-time
4156:     SortQuery:
4157:       name: sort
4158:       in: query
4159:       required: false
4160:       description: Stable sort expression such as updatedAt:desc.
4161:       schema:
4162:         type: string
4163:     AssetTypeQuery:
4164:       name: type
4165:       in: query
4166:       required: false
4167:       description: Optional asset type filter.
4168:       schema:
4169:         $ref: "#/components/schemas/AssetType"
4170:     LinkedProductIdQuery:
4171:       name: linkedProductId

===== ProductIdPath @ line 4100 =====
4098:         type: string
4099:         minLength: 1
4100:     ProductIdPath:
4101:       name: productId
4102:       in: path
4103:       required: true
4104:       description: Stable opaque product identifier. Product names are not identity.
4105:       schema:
4106:         type: string
4107:         minLength: 1
4108:     AssetIdPath:
4109:       name: assetId
4110:       in: path
4111:       required: true
4112:       description: Stable opaque asset identifier. Asset names and file names are not identity.
4113:       schema:
4114:         type: string
4115:         minLength: 1
4116:     CampaignContentIdPath:
4117:       name: campaignContentId
4118:       in: path
4119:       required: true
4120:       description: Stable opaque campaign content identifier. Campaign content titles are not identity.
4121:       schema:
4122:         type: string
4123:         minLength: 1
4124:     LimitQuery:
4125:       name: limit
4126:       in: query
4127:       required: false
4128:       description: Maximum number of records to return.
4129:       schema:
4130:         type: integer
4131:         minimum: 1
4132:         maximum: 100
4133:         default: 25
4134:     CursorQuery:
4135:       name: cursor
4136:       in: query
4137:       required: false
4138:       description: Cursor for the next page.
4139:       schema:
4140:         type: string
4141:     StatusQuery:
4142:       name: status
4143:       in: query
4144:       required: false
4145:       description: Optional resource status filter.
4146:       schema:
4147:         type: string
4148:     UpdatedAfterQuery:
4149:       name: updatedAfter
4150:       in: query
4151:       required: false
4152:       description: Return resources updated after this timestamp.
4153:       schema:
4154:         type: string
4155:         format: date-time
4156:     SortQuery:
4157:       name: sort
4158:       in: query
4159:       required: false
4160:       description: Stable sort expression such as updatedAt:desc.
4161:       schema:
4162:         type: string
4163:     AssetTypeQuery:
4164:       name: type
4165:       in: query
4166:       required: false
4167:       description: Optional asset type filter.
4168:       schema:
4169:         $ref: "#/components/schemas/AssetType"
4170:     LinkedProductIdQuery:
4171:       name: linkedProductId
4172:       in: query
4173:       required: false
4174:       description: Optional product link filter.
4175:       schema:
4176:         type: string
4177:     IdempotencyKeyHeader:
4178:       name: Idempotency-Key
4179:       in: header

===== IdempotencyKey =====
NOT FOUND

===== IdempotencyKeyHeader @ line 4177 =====
4175:       schema:
4176:         type: string
4177:     IdempotencyKeyHeader:
4178:       name: Idempotency-Key
4179:       in: header
4180:       required: true
4181:       description: Required for POST create/link operations to prevent duplicate writes.
4182:       schema:
4183:         type: string
4184:         minLength: 8
4185:         maxLength: 255
4186:     IfMatchHeader:
4187:       name: If-Match
4188:       in: header
4189:       required: false
4190:       description: Optional concurrency token. PUT operations require either If-Match or X-Resource-Version.
4191:       schema:
4192:         type: string
4193:     ResourceVersionHeader:
4194:       name: X-Resource-Version
4195:       in: header
4196:       required: false
4197:       description: Optional resource version. PUT operations require either If-Match or X-Resource-Version.
4198:       schema:
4199:         type: string
4200:     RequestIdHeader:
4201:       name: X-Request-Id
4202:       in: header
4203:       required: false
4204:       description: Optional client request tracking identifier.
4205:       schema:
4206:         type: string
4207:     WorkflowDefinitionIdPath:
4208:       name: workflowDefinitionId
4209:       in: path
4210:       required: true
4211:       description: Stable opaque workflow definition identifier.
4212:       schema:
4213:         type: string
4214:         minLength: 1
4215:     StepKeyPath:
4216:       name: stepKey
4217:       in: path
4218:       required: true
4219:       description: Stable step key within the composite scope (workflowDefinitionId, workflowVersion) only. Not a user-facing display label.
4220:       schema:
4221:         type: string
4222:         minLength: 1
4223:     ProviderIdPath:
4224:       name: providerId
4225:       in: path
4226:       required: true
4227:       description: Stable opaque AI provider identifier.
4228:       schema:
4229:         type: string
4230:         minLength: 1
4231:     ModelRouteIdPath:
4232:       name: modelRouteId
4233:       in: path
4234:       required: true
4235:       description: Stable opaque model route identifier.
4236:       schema:
4237:         type: string
4238:         minLength: 1
4239:     PromptIdPath:
4240:       name: promptId
4241:       in: path
4242:       required: true
4243:       description: Stable opaque prompt identifier.
4244:       schema:
4245:         type: string
4246:         minLength: 1
4247:     SessionIdPath:
4248:       name: sessionId
4249:       in: path
4250:       required: true
4251:       description: Stable opaque Creator Studio session identifier.
4252:       schema:
4253:         type: string
4254:         minLength: 1
4255:     DraftIdPath:
4256:       name: draftId

===== IfMatch =====
NOT FOUND

===== IfMatchHeader @ line 4186 =====
4184:         minLength: 8
4185:         maxLength: 255
4186:     IfMatchHeader:
4187:       name: If-Match
4188:       in: header
4189:       required: false
4190:       description: Optional concurrency token. PUT operations require either If-Match or X-Resource-Version.
4191:       schema:
4192:         type: string
4193:     ResourceVersionHeader:
4194:       name: X-Resource-Version
4195:       in: header
4196:       required: false
4197:       description: Optional resource version. PUT operations require either If-Match or X-Resource-Version.
4198:       schema:
4199:         type: string
4200:     RequestIdHeader:
4201:       name: X-Request-Id
4202:       in: header
4203:       required: false
4204:       description: Optional client request tracking identifier.
4205:       schema:
4206:         type: string
4207:     WorkflowDefinitionIdPath:
4208:       name: workflowDefinitionId
4209:       in: path
4210:       required: true
4211:       description: Stable opaque workflow definition identifier.
4212:       schema:
4213:         type: string
4214:         minLength: 1
4215:     StepKeyPath:
4216:       name: stepKey
4217:       in: path
4218:       required: true
4219:       description: Stable step key within the composite scope (workflowDefinitionId, workflowVersion) only. Not a user-facing display label.
4220:       schema:
4221:         type: string
4222:         minLength: 1
4223:     ProviderIdPath:
4224:       name: providerId
4225:       in: path
4226:       required: true
4227:       description: Stable opaque AI provider identifier.
4228:       schema:
4229:         type: string
4230:         minLength: 1
4231:     ModelRouteIdPath:
4232:       name: modelRouteId
4233:       in: path
4234:       required: true
4235:       description: Stable opaque model route identifier.
4236:       schema:
4237:         type: string
4238:         minLength: 1
4239:     PromptIdPath:
4240:       name: promptId
4241:       in: path
4242:       required: true
4243:       description: Stable opaque prompt identifier.
4244:       schema:
4245:         type: string
4246:         minLength: 1
4247:     SessionIdPath:
4248:       name: sessionId
4249:       in: path
4250:       required: true
4251:       description: Stable opaque Creator Studio session identifier.
4252:       schema:
4253:         type: string
4254:         minLength: 1
4255:     DraftIdPath:
4256:       name: draftId
4257:       in: path
4258:       required: true
4259:       description: Stable opaque Creator Studio context draft identifier.
4260:       schema:
4261:         type: string
4262:         minLength: 1
4263:     TransferIdPath:
4264:       name: transferId
4265:       in: path

===== XResourceVersion =====
NOT FOUND

===== XResourceVersionHeader =====
NOT FOUND

===== ResourceVersionHeader @ line 4193 =====
4191:       schema:
4192:         type: string
4193:     ResourceVersionHeader:
4194:       name: X-Resource-Version
4195:       in: header
4196:       required: false
4197:       description: Optional resource version. PUT operations require either If-Match or X-Resource-Version.
4198:       schema:
4199:         type: string
4200:     RequestIdHeader:
4201:       name: X-Request-Id
4202:       in: header
4203:       required: false
4204:       description: Optional client request tracking identifier.
4205:       schema:
4206:         type: string
4207:     WorkflowDefinitionIdPath:
4208:       name: workflowDefinitionId
4209:       in: path
4210:       required: true
4211:       description: Stable opaque workflow definition identifier.
4212:       schema:
4213:         type: string
4214:         minLength: 1
4215:     StepKeyPath:
4216:       name: stepKey
4217:       in: path
4218:       required: true
4219:       description: Stable step key within the composite scope (workflowDefinitionId, workflowVersion) only. Not a user-facing display label.
4220:       schema:
4221:         type: string
4222:         minLength: 1
4223:     ProviderIdPath:
4224:       name: providerId
4225:       in: path
4226:       required: true
4227:       description: Stable opaque AI provider identifier.
4228:       schema:
4229:         type: string
4230:         minLength: 1
4231:     ModelRouteIdPath:
4232:       name: modelRouteId
4233:       in: path
4234:       required: true
4235:       description: Stable opaque model route identifier.
4236:       schema:
4237:         type: string
4238:         minLength: 1
4239:     PromptIdPath:
4240:       name: promptId
4241:       in: path
4242:       required: true
4243:       description: Stable opaque prompt identifier.
4244:       schema:
4245:         type: string
4246:         minLength: 1
4247:     SessionIdPath:
4248:       name: sessionId
4249:       in: path
4250:       required: true
4251:       description: Stable opaque Creator Studio session identifier.
4252:       schema:
4253:         type: string
4254:         minLength: 1
4255:     DraftIdPath:
4256:       name: draftId
4257:       in: path
4258:       required: true
4259:       description: Stable opaque Creator Studio context draft identifier.
4260:       schema:
4261:         type: string
4262:         minLength: 1
4263:     TransferIdPath:
4264:       name: transferId
4265:       in: path
4266:       required: true
4267:       description: Stable opaque Creator Studio transfer draft identifier.
4268:       schema:
4269:         type: string
4270:         minLength: 1
4271:     MemberIdPath:
4272:       name: memberId

===== CreateProductRequest @ line 4663 =====
4661:         version:
4662:           type: string
4663:     CreateProductRequest:
4664:       type: object
4665:       required:
4666:         - name
4667:       properties:
4668:         name:
4669:           type: string
4670:           minLength: 1
4671:         category:
4672:           type: string
4673:         price:
4674:           type: number
4675:           minimum: 0
4676:         sku:
4677:           type: string
4678:         stockStatus:
4679:           $ref: "#/components/schemas/StockStatus"
4680:         imageUrl:
4681:           type: string
4682:           format: uri
4683:         videoUrl:
4684:           type: string
4685:           format: uri
4686:         description:
4687:           type: string
4688:         status:
4689:           $ref: "#/components/schemas/ProductStatus"
4690:     UpdateProductRequest:
4691:       type: object
4692:       minProperties: 1
4693:       properties:
4694:         name:
4695:           type: string
4696:           minLength: 1
4697:         category:
4698:           type: string
4699:         price:
4700:           type: number
4701:           minimum: 0
4702:         sku:
4703:           type: string
4704:         stockStatus:
4705:           $ref: "#/components/schemas/StockStatus"
4706:         imageUrl:
4707:           type: string
4708:           format: uri
4709:         videoUrl:
4710:           type: string
4711:           format: uri
4712:         description:
4713:           type: string
4714:         status:
4715:           $ref: "#/components/schemas/ProductStatus"
4716:     ProductResponse:
4717:       type: object
4718:       required:
4719:         - data
4720:         - warnings
4721:       properties:
4722:         data:
4723:           $ref: "#/components/schemas/Product"
4724:         warnings:
4725:           type: array
4726:           items:
4727:             $ref: "#/components/schemas/Warning"
4728:     ProductListResponse:
4729:       type: object
4730:       required:
4731:         - data
4732:         - meta
4733:         - warnings
4734:       properties:
4735:         data:
4736:           type: array
4737:           items:
4738:             $ref: "#/components/schemas/Product"
4739:         meta:
4740:           $ref: "#/components/schemas/PaginationMeta"
4741:         warnings:
4742:           type: array

===== UpdateProductRequest @ line 4690 =====
4688:         status:
4689:           $ref: "#/components/schemas/ProductStatus"
4690:     UpdateProductRequest:
4691:       type: object
4692:       minProperties: 1
4693:       properties:
4694:         name:
4695:           type: string
4696:           minLength: 1
4697:         category:
4698:           type: string
4699:         price:
4700:           type: number
4701:           minimum: 0
4702:         sku:
4703:           type: string
4704:         stockStatus:
4705:           $ref: "#/components/schemas/StockStatus"
4706:         imageUrl:
4707:           type: string
4708:           format: uri
4709:         videoUrl:
4710:           type: string
4711:           format: uri
4712:         description:
4713:           type: string
4714:         status:
4715:           $ref: "#/components/schemas/ProductStatus"
4716:     ProductResponse:
4717:       type: object
4718:       required:
4719:         - data
4720:         - warnings
4721:       properties:
4722:         data:
4723:           $ref: "#/components/schemas/Product"
4724:         warnings:
4725:           type: array
4726:           items:
4727:             $ref: "#/components/schemas/Warning"
4728:     ProductListResponse:
4729:       type: object
4730:       required:
4731:         - data
4732:         - meta
4733:         - warnings
4734:       properties:
4735:         data:
4736:           type: array
4737:           items:
4738:             $ref: "#/components/schemas/Product"
4739:         meta:
4740:           $ref: "#/components/schemas/PaginationMeta"
4741:         warnings:
4742:           type: array
4743:           items:
4744:             $ref: "#/components/schemas/Warning"
4745:     AssetType:
4746:       type: string
4747:       enum:
4748:         - image
4749:         - video
4750:         - document
4751:         - audio
4752:         - other
4753:     RightsStatus:
4754:       type: string
4755:       enum:
4756:         - needs_review
4757:         - approved
4758:         - rejected
4759:         - unknown
4760:     UsageRights:
4761:       type: string
4762:       enum:
4763:         - owned
4764:         - licensed
4765:         - user_generated
4766:         - unknown
4767:     AssetStatus:
4768:       type: string
4769:       enum:

===== ProductResponse @ line 4716 =====
4714:         status:
4715:           $ref: "#/components/schemas/ProductStatus"
4716:     ProductResponse:
4717:       type: object
4718:       required:
4719:         - data
4720:         - warnings
4721:       properties:
4722:         data:
4723:           $ref: "#/components/schemas/Product"
4724:         warnings:
4725:           type: array
4726:           items:
4727:             $ref: "#/components/schemas/Warning"
4728:     ProductListResponse:
4729:       type: object
4730:       required:
4731:         - data
4732:         - meta
4733:         - warnings
4734:       properties:
4735:         data:
4736:           type: array
4737:           items:
4738:             $ref: "#/components/schemas/Product"
4739:         meta:
4740:           $ref: "#/components/schemas/PaginationMeta"
4741:         warnings:
4742:           type: array
4743:           items:
4744:             $ref: "#/components/schemas/Warning"
4745:     AssetType:
4746:       type: string
4747:       enum:
4748:         - image
4749:         - video
4750:         - document
4751:         - audio
4752:         - other
4753:     RightsStatus:
4754:       type: string
4755:       enum:
4756:         - needs_review
4757:         - approved
4758:         - rejected
4759:         - unknown
4760:     UsageRights:
4761:       type: string
4762:       enum:
4763:         - owned
4764:         - licensed
4765:         - user_generated
4766:         - unknown
4767:     AssetStatus:
4768:       type: string
4769:       enum:
4770:         - draft
4771:         - active
4772:         - archived
4773:     Asset:
4774:       type: object
4775:       description: Asset metadata record. assetId is canonical identity; asset names and file names are display fields only. Binary upload, rights approval, publishing, connector execution, and AI execution are outside Slice 1.
4776:       required:
4777:         - assetId
4778:         - workspaceId
4779:         - name
4780:         - type
4781:         - rightsStatus
4782:         - status
4783:         - createdAt
4784:         - updatedAt
4785:         - version
4786:       properties:
4787:         assetId:
4788:           type: string
4789:         workspaceId:
4790:           type: string
4791:         linkedProductId:
4792:           type:
4793:             - string
4794:             - "null"
4795:         linkedName:

===== ProductListResponse @ line 4728 =====
4726:           items:
4727:             $ref: "#/components/schemas/Warning"
4728:     ProductListResponse:
4729:       type: object
4730:       required:
4731:         - data
4732:         - meta
4733:         - warnings
4734:       properties:
4735:         data:
4736:           type: array
4737:           items:
4738:             $ref: "#/components/schemas/Product"
4739:         meta:
4740:           $ref: "#/components/schemas/PaginationMeta"
4741:         warnings:
4742:           type: array
4743:           items:
4744:             $ref: "#/components/schemas/Warning"
4745:     AssetType:
4746:       type: string
4747:       enum:
4748:         - image
4749:         - video
4750:         - document
4751:         - audio
4752:         - other
4753:     RightsStatus:
4754:       type: string
4755:       enum:
4756:         - needs_review
4757:         - approved
4758:         - rejected
4759:         - unknown
4760:     UsageRights:
4761:       type: string
4762:       enum:
4763:         - owned
4764:         - licensed
4765:         - user_generated
4766:         - unknown
4767:     AssetStatus:
4768:       type: string
4769:       enum:
4770:         - draft
4771:         - active
4772:         - archived
4773:     Asset:
4774:       type: object
4775:       description: Asset metadata record. assetId is canonical identity; asset names and file names are display fields only. Binary upload, rights approval, publishing, connector execution, and AI execution are outside Slice 1.
4776:       required:
4777:         - assetId
4778:         - workspaceId
4779:         - name
4780:         - type
4781:         - rightsStatus
4782:         - status
4783:         - createdAt
4784:         - updatedAt
4785:         - version
4786:       properties:
4787:         assetId:
4788:           type: string
4789:         workspaceId:
4790:           type: string
4791:         linkedProductId:
4792:           type:
4793:             - string
4794:             - "null"
4795:         linkedName:
4796:           type:
4797:             - string
4798:             - "null"
4799:           description: Optional display snapshot for the linked product. It is not product identity.
4800:         name:
4801:           type: string
4802:         type:
4803:           $ref: "#/components/schemas/AssetType"
4804:         url:
4805:           type:
4806:             - string
4807:             - "null"

===== Product @ line 4604 =====
4602:         - out_of_stock
4603:         - unknown
4604:     Product:
4605:       type: object
4606:       description: Product catalog record. productId is canonical identity; product name is only a display field.
4607:       required:
4608:         - productId
4609:         - workspaceId
4610:         - name
4611:         - status
4612:         - createdAt
4613:         - updatedAt
4614:         - version
4615:       properties:
4616:         productId:
4617:           type: string
4618:         workspaceId:
4619:           type: string
4620:         name:
4621:           type: string
4622:         category:
4623:           type:
4624:             - string
4625:             - "null"
4626:         price:
4627:           type:
4628:             - number
4629:             - "null"
4630:           minimum: 0
4631:         sku:
4632:           type:
4633:             - string
4634:             - "null"
4635:         stockStatus:
4636:           $ref: "#/components/schemas/StockStatus"
4637:         imageUrl:
4638:           type:
4639:             - string
4640:             - "null"
4641:           format: uri
4642:         videoUrl:
4643:           type:
4644:             - string
4645:             - "null"
4646:           format: uri
4647:         description:
4648:           type:
4649:             - string
4650:             - "null"
4651:         readiness:
4652:           $ref: "#/components/schemas/Readiness"
4653:         status:
4654:           $ref: "#/components/schemas/ProductStatus"
4655:         createdAt:
4656:           type: string
4657:           format: date-time
4658:         updatedAt:
4659:           type: string
4660:           format: date-time
4661:         version:
4662:           type: string
4663:     CreateProductRequest:
4664:       type: object
4665:       required:
4666:         - name
4667:       properties:
4668:         name:
4669:           type: string
4670:           minLength: 1
4671:         category:
4672:           type: string
4673:         price:
4674:           type: number
4675:           minimum: 0
4676:         sku:
4677:           type: string
4678:         stockStatus:
4679:           $ref: "#/components/schemas/StockStatus"
4680:         imageUrl:
4681:           type: string
4682:           format: uri
4683:         videoUrl:

===== ErrorModel @ line 4517 =====
4515:         - analytics_snapshot.not_found
4516:         - audit_event.not_found
4517:     ErrorModel:
4518:       type: object
4519:       required:
4520:         - errorCode
4521:         - message
4522:         - requestId
4523:         - retryable
4524:         - status
4525:       properties:
4526:         errorCode:
4527:           $ref: "#/components/schemas/ErrorCode"
4528:         message:
4529:           type: string
4530:         details:
4531:           type: object
4532:           additionalProperties: true
4533:         requestId:
4534:           type: string
4535:         retryable:
4536:           type: boolean
4537:         status:
4538:           type: integer
4539:           minimum: 100
4540:           maximum: 599
4541:     PaginationMeta:
4542:       type: object
4543:       required:
4544:         - count
4545:         - hasMore
4546:       properties:
4547:         nextCursor:
4548:           type:
4549:             - string
4550:             - "null"
4551:         count:
4552:           type: integer
4553:           minimum: 0
4554:         hasMore:
4555:           type: boolean
4556:     Warning:
4557:       type: object
4558:       required:
4559:         - code
4560:         - message
4561:         - severity
4562:       properties:
4563:         code:
4564:           type: string
4565:         message:
4566:           type: string
4567:         severity:
4568:           type: string
4569:           enum:
4570:             - info
4571:             - warning
4572:             - critical
4573:     Readiness:
4574:       type: object
4575:       description: Readiness summary for UI and API consumers. It is advisory and does not execute publishing, connectors, or AI.
4576:       required:
4577:         - score
4578:         - label
4579:         - issues
4580:       properties:
4581:         score:
4582:           type: number
4583:           minimum: 0
4584:           maximum: 100
4585:         label:
4586:           type: string
4587:         issues:
4588:           type: array
4589:           items:
4590:             type: string
4591:     ProductStatus:
4592:       type: string
4593:       enum:
4594:         - draft
4595:         - active
4596:         - archived
```

## 7. Runtime Product Route Evidence

### 7.1 Runtime Route Inventory

```text

export interface ProductPluginOptions {
  productRepository: ProductRepository;
  idempotencyRepository: IdempotencyRepository;
  auditRepository: AuditRepository;
  workspaceContextGuardHook?:
    | ((request: FastifyRequest, reply: FastifyReply) => Promise<void>)
    | null;
}

export const productPlugin: FastifyPluginAsync<ProductPluginOptions> =
  async function productPlugin(
    fastify: FastifyInstance,
    opts: ProductPluginOptions
  ): Promise<void> {
    const {
      productRepository,
      idempotencyRepository,
      auditRepository,
      workspaceContextGuardHook
    } = opts;

    const preHandler = workspaceContextGuardHook
      ? [workspaceContextGuardHook]
      : [];

    const routeOpts = preHandler.length > 0 ? { preHandler } : {};

    fastify.get<{
      Params: ProductRouteParams;
      Querystring: ListProductsQuerystring;
    }>(
      PRODUCTS_ROUTE,
      routeOpts,
      createListProductsHandler({ productRepository })
    );

    fastify.post<{
      Params: ProductRouteParams;
      Body: Record<string, unknown>;
    }>(
      PRODUCTS_ROUTE,
      routeOpts,
      createCreateProductHandler({
        productRepository,
        idempotencyRepository,
        auditRepository
      })
    );

    fastify.get<{ Params: ProductItemRouteParams }>(
      PRODUCT_ITEM_ROUTE,
      routeOpts,
      createGetProductHandler({ productRepository })
    );

    fastify.put<{
      Params: ProductItemRouteParams;
      Body: Record<string, unknown>;
    }>(
      PRODUCT_ITEM_ROUTE,
      routeOpts,
      createUpdateProductHandler({ productRepository, auditRepository })
    );
  };
```

### 7.2 Runtime Error / Permission / Validation Boundary

```text

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRODUCT_STATUS_SET = new Set<string>(PRODUCT_STATUSES);
const STOCK_STATUS_SET = new Set<string>(STOCK_STATUSES);
const SORT_DIRECTION_SET = new Set<string>(SORT_DIRECTIONS);
const STRING_OR_NULL_FIELDS = [
  "category",
  "sku",
  "imageUrl",
  "videoUrl",
  "description"
] as const;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function isProductStatus(value: unknown): value is ProductStatus {
  return typeof value === "string" && PRODUCT_STATUS_SET.has(value);
}

function isStockStatus(value: unknown): value is StockStatus {
  return typeof value === "string" && STOCK_STATUS_SET.has(value);
}

function isSortDirection(value: unknown): value is SortDirection {
  return typeof value === "string" && SORT_DIRECTION_SET.has(value);
}

function parsePositiveInteger(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function isInvalidCursorError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = "code" in err ? (err as { code?: unknown }).code : undefined;
  return (
    err.message === "Invalid product list cursor" ||
    code === "22007" ||
    code === "22P02"
  );
}

function firstHeaderValue(
  value: string | readonly string[] | undefined
): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  correlationId: string | undefined,
  details?: unknown
): void {
  const response = createHttpErrorResponse({
    code,
    message,
    statusCode,
    correlationId,
    details
  });
  reply.code(statusCode).send(response.body);
}

function sendBadRequest(
  reply: FastifyReply,
  message: string,
  correlationId: string | undefined,
  details?: unknown
): void {
  sendError(reply, 400, "BAD_REQUEST", message, correlationId, details);
}

function sendValidationFailed(
  reply: FastifyReply,
  message: string,
  correlationId: string | undefined
): void {
  sendError(reply, 422, "VALIDATION_FAILED", message, correlationId);
}

function sendNotFound(
  reply: FastifyReply,
  correlationId: string | undefined
): void {
  sendError(reply, 404, "NOT_FOUND", "Resource not found.", correlationId);
}

type ResolvedCtx = NonNullable<FastifyRequest["requestContext"]>;

function resolveContextAndPermission(
  request: FastifyRequest,
  reply: FastifyReply,
  requiredPermission: string
): { ok: true; ctx: ResolvedCtx } | { ok: false } {
  const ctx = request.requestContext;
  if (ctx === undefined) {
    sendError(
      reply,
      500,
      "INTERNAL_SERVER_ERROR",
      "Internal server error.",
      request.correlationId
    );
    return { ok: false };
  }
  const decision = evaluatePermissionGuard({
    requiredPermission,
    grantedPermissions: ctx.grantedPermissions ?? [],
    requestContext: { workspaceId: ctx.workspaceId, actorId: ctx.actorId }
  });
  if (decision.ok === false) {
    sendError(
      reply,
      decision.statusCode,
      decision.code,
      decision.message,
      request.correlationId
    );
    return { ok: false };
  }
  return { ok: true, ctx };
}

type ValidateMode = "create" | "update";

type ValidateFail = {
  ok: false;
  statusCode: 400 | 422;
  code: "BAD_REQUEST" | "VALIDATION_FAILED";
  message: string;
};
type CreateValidationResult =
  | { ok: true; input: CreateProductInput }
  | ValidateFail;
type UpdateValidationResult =
  | { ok: true; input: UpdateProductInput }
  | ValidateFail;

function validationFailed(message: string): ValidateFail {
```

### 7.3 Runtime Handler Behavior

```text
      );
  }
  return value;
}

function computeFingerprint(params: {
  workspaceId: string;
  actorId: string;
  idempotencyKey: string;
  body: unknown;
}): string {
  const canonicalBody = JSON.stringify(sortObjectKeys(params.body));
  const input = [
    params.workspaceId,
    params.actorId,
    "product.create",
    params.idempotencyKey,
    canonicalBody
  ].join("\x00");
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function createListProductsHandler(deps: {
  productRepository: ProductRepository;
}) {
  return async function listProductsHandler(
    request: FastifyRequest<{
      Params: ProductRouteParams;
      Querystring: ListProductsQuerystring;
    }>,
    reply: FastifyReply
  ): Promise<ProductListResponse | void> {
    const check = resolveContextAndPermission(request, reply, PERMISSION_READ);
    if (check.ok === false) {
      return;
    }
    const { ctx } = check;

    const q = request.query;
    const status = q.status;
    const sort = q.sort;

    if (q.limit === undefined || q.limit === "") {
      sendBadRequest(reply, "limit is required.", request.correlationId);
      return;
    }
    const limitNum = Number(q.limit);
    if (!Number.isInteger(limitNum) || limitNum <= 0) {
      sendBadRequest(
        reply,
        "limit must be a positive integer.",
        request.correlationId
      );
      return;
    }
    if (limitNum > 100) {
      sendBadRequest(
        reply,
        "limit must not exceed 100.",
        request.correlationId
      );
      return;
    }
    if (status !== undefined && isProductStatus(status) !== true) {
      sendBadRequest(
        reply,
        "status must be one of: draft, active, archived.",
        request.correlationId
      );
      return;
    }
    if (q.updatedAfter !== undefined) {
      const parsed = new Date(q.updatedAfter);
      if (Number.isNaN(parsed.getTime())) {
        sendBadRequest(
          reply,
          "updatedAfter must be a valid date.",
          request.correlationId
        );
        return;
      }
    }
    if (sort !== undefined && isSortDirection(sort) !== true) {
      sendBadRequest(
        reply,
        "sort must be one of: updatedAt:desc, updatedAt:asc.",
        request.correlationId
      );
      return;
    }

    let result;
    try {
      result = await deps.productRepository.listProducts({
        workspaceId: ctx.workspaceId,
        limit: limitNum,
        cursor: q.cursor ?? null,
        status,
        updatedAfter: q.updatedAfter,
        sort
      });
    } catch (err) {
      if (isInvalidCursorError(err)) {
        sendBadRequest(reply, "Invalid cursor.", request.correlationId);
        return;
      }
      throw err;
    }

    return {
      products: result.products,
      count: result.count,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor
    };
  };
}

export function createCreateProductHandler(deps: {
  productRepository: ProductRepository;
  idempotencyRepository: IdempotencyRepository;
  auditRepository: AuditRepository;
}) {
  return async function createProductHandler(
    request: FastifyRequest<{
      Params: ProductRouteParams;
      Body: Record<string, unknown>;
    }>,
    reply: FastifyReply
  ): Promise<ProductResponse | void> {
    const check = resolveContextAndPermission(
      request,
      reply,
      PERMISSION_MANAGE
    );
    if (check.ok === false) {
      return;
    }
    const { ctx } = check;

    const idempotencyKey = firstHeaderValue(request.headers["idempotency-key"]);

    if (!idempotencyKey || idempotencyKey.trim().length === 0) {
      sendBadRequest(
        reply,
        "Idempotency-Key header is required.",
        request.correlationId
      );
      return;
    }

    const body = request.body ?? {};

    if ("workspaceId" in body || "workspace_id" in body) {
      sendValidationFailed(
        reply,
        "Request body must not include workspaceId or workspace_id.",
        request.correlationId
      );
      return;
    }

    const validation = validateCreateProductBody(body);
    if (validation.ok === false) {
      sendError(
        reply,
        validation.statusCode,
        validation.code,
        validation.message,
        request.correlationId
      );
      return;
    }

    const trimmedKey = idempotencyKey.trim();
    const fingerprint = computeFingerprint({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      idempotencyKey: trimmedKey,
      body
    });

    const expiresAt = new Date(Date.now() + 86_400_000).toISOString();
    const scope = {
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      operationName: "product.create",
      idempotencyKey: trimmedKey
    };

    const idempotencyResult =
      await deps.idempotencyRepository.reserveIdempotencyRecord({
        ...scope,
        requestFingerprint: fingerprint,
        expiresAt
      });

    if (idempotencyResult.status === "existing") {
      const record = idempotencyResult.record;
      if (record.requestFingerprint !== fingerprint) {
        sendError(
          reply,
          409,
          "CONFLICT",
          "Request body conflicts with the original request for this idempotency key.",
          request.correlationId
        );
        return;
      }
      if (record.responseStatusCode === 201) {
        reply.code(201).send(record.responseBody);
        return;
      }
      sendError(
        reply,
        409,
        "CONFLICT",
        "Idempotent request conflict.",
        request.correlationId
      );
      return;
    }

    let product;
    try {
      product = await deps.auditRepository.withTransaction(async (db) => {
        const createdProduct = await deps.productRepository.createProduct({
          workspaceId: ctx.workspaceId,
          input: validation.input,
          db
        });
        await deps.auditRepository.createAuditEvent(
          {
            workspaceId: ctx.workspaceId,
            actorId: ctx.actorId,
            action: "product.created",
            resourceType: "product",
            resourceId: createdProduct.productId,
            correlationId: request.correlationId,
            afterState: {
              productId: createdProduct.productId,
              status: createdProduct.status,
              idempotencyKey: trimmedKey,
              version: createdProduct.version
            }
          },
          db
        );
        return createdProduct;
      });
    } catch (err) {
      await deps.idempotencyRepository
        .markIdempotencyRecordFailed({ ...scope, responseStatusCode: 500 })
        .catch(() => undefined);
      throw err;
    }

    const productResponse: ProductResponse = { product };
    await deps.idempotencyRepository.markIdempotencyRecordCompleted({
      ...scope,
      responseStatusCode: 201,
      responseBody: productResponse as unknown as JsonValue,
      resourceId: product.productId
    });

    reply.code(201).send(productResponse);
  };
}

export function createGetProductHandler(deps: {
  productRepository: ProductRepository;
}) {
  return async function getProductHandler(
    request: FastifyRequest<{ Params: ProductItemRouteParams }>,
    reply: FastifyReply
  ): Promise<ProductResponse | void> {
    const check = resolveContextAndPermission(request, reply, PERMISSION_READ);
    if (check.ok === false) {
      return;
    }
    const { ctx } = check;

    if (isUuid(request.params.productId) === false) {
      sendNotFound(reply, request.correlationId);
      return;
    }

    const product = await deps.productRepository.getProductById({
      workspaceId: ctx.workspaceId,
      productId: request.params.productId
    });

    if (product === null) {
      sendNotFound(reply, request.correlationId);
      return;
    }

    return { product };
  };
}

export function createUpdateProductHandler(deps: {
  productRepository: ProductRepository;
  auditRepository: AuditRepository;
}) {
  return async function updateProductHandler(
    request: FastifyRequest<{
      Params: ProductItemRouteParams;
      Body: Record<string, unknown>;
    }>,
    reply: FastifyReply
  ): Promise<ProductResponse | void> {
    const check = resolveContextAndPermission(
      request,
      reply,
      PERMISSION_MANAGE
    );
    if (check.ok === false) {
      return;
    }
    const { ctx } = check;

    if (isUuid(request.params.productId) === false) {
      sendNotFound(reply, request.correlationId);
      return;
    }

    const ifMatch = request.headers["if-match"];
    const xResourceVersion = request.headers["x-resource-version"];
    let expectedVersion: number;

    if (ifMatch !== undefined) {
      if (typeof ifMatch !== "string") {
        sendBadRequest(
          reply,
          "If-Match must be a positive integer or quoted positive integer.",
          request.correlationId
        );
        return;
      }
      const stripped = ifMatch.replace(/^"(.*)"$/, "$1");
      const parsed = parsePositiveInteger(stripped);
      if (parsed === null) {
        sendBadRequest(
          reply,
          "If-Match must be a positive integer or quoted positive integer.",
          request.correlationId
        );
        return;
      }
      expectedVersion = parsed;
    } else if (xResourceVersion === undefined) {
      sendBadRequest(
        reply,
        "If-Match or X-Resource-Version header is required.",
        request.correlationId
      );
      return;
    } else {
      const raw = firstHeaderValue(xResourceVersion);
      const parsed = parsePositiveInteger(raw);
      if (parsed === null) {
        sendBadRequest(
          reply,
          "X-Resource-Version must be a positive integer.",
          request.correlationId
        );
        return;
      }
      expectedVersion = parsed;
    }

    const body = request.body ?? {};

    if ("workspaceId" in body || "workspace_id" in body) {
      sendValidationFailed(
        reply,
        "Request body must not include workspaceId or workspace_id.",
        request.correlationId
      );
      return;
    }

    const validation = validateUpdateProductBody(body);
    if (validation.ok === false) {
      sendError(
        reply,
        validation.statusCode,
        validation.code,
        validation.message,
        request.correlationId
      );
      return;
    }

    const result = await deps.auditRepository.withTransaction(async (db) => {
      const updateResult = await deps.productRepository.updateProduct({
        workspaceId: ctx.workspaceId,
        productId: request.params.productId,
        input: validation.input,
        expectedVersion,
        db
      });
      if (updateResult.status === "updated") {
        await deps.auditRepository.createAuditEvent(
          {
            workspaceId: ctx.workspaceId,
            actorId: ctx.actorId,
            action: "product.updated",
            resourceType: "product",
            resourceId: updateResult.product.productId,
            correlationId: request.correlationId,
            beforeState: {
              productId: updateResult.product.productId,
              previousVersion: expectedVersion
            },
            afterState: {
              productId: updateResult.product.productId,
              newVersion: updateResult.product.version,
              changedFields: Object.keys(validation.input)
            }
          },
          db
        );
      }
      return updateResult;
    });

    if (result.status === "not_found") {
      sendNotFound(reply, request.correlationId);
      return;
    }

    if (result.status === "version_conflict") {
      sendError(
        reply,
        409,
        "CONFLICT",
        "Version conflict.",
        request.correlationId,
        {
          currentVersion: result.currentVersion
        }
      );
      return;
    }

    return { product: result.product };
  };
}
```

### 7.4 Runtime Response Shape Types

```text
import type { Product } from "./product-types.js";

export interface ProductResponse {
  product: Product;
}

export interface ProductListResponse {
  products: Product[];
  count: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface ProductRouteParams {
  workspaceId: string;
}

export interface ProductItemRouteParams {
  workspaceId: string;
  productId: string;
}

export interface ListProductsQuerystring {
  limit?: string;
  cursor?: string;
  status?: string;
  updatedAfter?: string;
  sort?: string;
}
```

## 8. Product Route Inventory Comparison

| Runtime Method | Runtime Path | OpenAPI Evidence | Decision |
| :--- | :--- | :--- | :--- |
| GET | `/workspaces/:workspaceId/products` | Present as `listProducts` under `/workspaces/{workspaceId}/products`. | Aligned |
| POST | `/workspaces/:workspaceId/products` | Present as `createProduct` under `/workspaces/{workspaceId}/products`. | Aligned |
| GET | `/workspaces/:workspaceId/products/:productId` | Present as `getProduct` under `/workspaces/{workspaceId}/products/{productId}`. | Aligned |
| PUT | `/workspaces/:workspaceId/products/:productId` | Present as `updateProduct` under `/workspaces/{workspaceId}/products/{productId}`. | Aligned |

Route inventory classification: No route presence drift.

## 9. Parameter Comparison

| Area | Runtime | OpenAPI Evidence | Decision |
| :--- | :--- | :--- | :--- |
| `workspaceId` path param | Present | `WorkspaceIdPath` exists and is required. | Aligned |
| `productId` path param | Present for item routes | `ProductIdPath` exists and is required. | Aligned |
| `limit` query param | Required for list runtime validation | `LimitQuery` exists but is `required: false` with default `25`. | Contract drift |
| `cursor` query param | Optional for list | `CursorQuery` exists and is optional. | Aligned |
| `status` query param | Optional for list | `StatusQuery` exists and is optional. | Aligned |
| `updatedAfter` query param | Optional for list | `UpdatedAfterQuery` exists and is optional. | Aligned |
| `sort` query param | Optional for list | `SortQuery` exists and is optional. | Aligned |

Parameter classification: Contract drift for `limit` requiredness only.

## 10. Header Comparison

| Header | Runtime Use | OpenAPI Evidence | Decision |
| :--- | :--- | :--- | :--- |
| `Idempotency-Key` | Required for create | `IdempotencyKeyHeader` exists and is required on create product. | Aligned |
| `If-Match` | Accepted for update expected version | `IfMatchHeader` exists on update product. | Aligned |
| `X-Resource-Version` | Accepted fallback for update expected version | `ResourceVersionHeader` maps to `X-Resource-Version` and exists on update product. | Aligned |
| Correlation/request ID header | Runtime uses correlation/request boundary | `RequestIdHeader` exists on product routes. | Aligned |
| Permission/granted permissions header | Runtime request context boundary | OpenAPI records `x-permission`; granted permission transport remains runtime/request-context concern. | Documentation-only drift |

Header classification: Mostly aligned. Permission header transport is not represented as a public contract header, but permissions are represented through `x-permission`.

## 11. Request Body Comparison

| Operation | Runtime Body Behavior | OpenAPI Evidence | Decision |
| :--- | :--- | :--- | :--- |
| Create product | Requires `name`; rejects `workspaceId` / `workspace_id`; validates product fields | `CreateProductRequest` requires `name` and does not include workspace ownership fields. `rejectBodyWorkspaceId` is also listed in the guard chain. | Aligned |
| Update product | Requires at least one updatable field; rejects `workspaceId` / `workspace_id`; validates product fields | `UpdateProductRequest` has `minProperties: 1` and does not include workspace ownership fields. `rejectBodyWorkspaceId` is also listed in the guard chain. | Aligned |
| List products | No body | No request body shown for list. | Aligned |
| Get product | No body | No request body shown for get. | Aligned |

Request body classification: No blocking drift found.

## 12. Response Body Comparison

| Operation | Runtime Response Shape | OpenAPI Evidence | Decision |
| :--- | :--- | :--- | :--- |
| List products | `{ products, count, hasMore, nextCursor }` | `ProductListResponse` requires `data`, `meta`, and `warnings`. | Contract drift |
| Create product | `{ product }` with 201 | `ProductResponse` requires `data` and `warnings`. | Contract drift |
| Get product | `{ product }` | `ProductResponse` requires `data` and `warnings`. | Contract drift |
| Update product | `{ product }` | `ProductResponse` requires `data` and `warnings`. | Contract drift |
| Errors | ErrorModel response body | Error responses reference shared OpenAPI responses such as `BadRequest`, `Conflict`, `ValidationFailed`, and `DefaultError`. | Needs follow-up in OpenAPI edit planning |

Response body classification: Blocking contract drift.

## 13. ErrorModel Comparison

| ErrorModel Field | Runtime Boundary | OpenAPI Evidence | Decision |
| :--- | :--- | :--- | :--- |
| `code` | Produced by runtime error response helper | Shared OpenAPI error responses are referenced from product routes. | Needs follow-up |
| `message` | Produced by runtime error response helper | Shared OpenAPI error responses are referenced from product routes. | Needs follow-up |
| `statusCode` | Produced by runtime error response helper | Shared OpenAPI error responses are referenced from product routes. | Needs follow-up |
| `correlationId` | Included when available from request correlation boundary | `RequestIdHeader` exists; ErrorModel body shape must be verified in the OpenAPI edit planning gate. | Needs follow-up |
| `details` | Included only when supplied by runtime error path | ErrorModel body shape must be verified in the OpenAPI edit planning gate. | Needs follow-up |

ErrorModel classification: Follow-up required, but response envelope drift is already sufficient to require OpenAPI edit authorization planning.

## 14. Behavior Semantics Comparison

| Behavior | Runtime Status | OpenAPI Evidence | Decision |
| :--- | :--- | :--- | :--- |
| Workspace scoping | Enforced by workspace context guard | Product routes include `x-workspace-scope: route` and `workspaceContextGuard`. | Aligned |
| Read permission | `nashir.products.read` | List/get product operations include `x-permission: nashir.products.read`. | Aligned |
| Manage permission | `nashir.products.manage` | Create/update product operations include `x-permission: nashir.products.manage`. | Aligned |
| Idempotent create | Implemented | Create product includes `IdempotencyKeyHeader`. | Aligned |
| Optimistic update | Implemented | Update product includes `IfMatchHeader` and `ResourceVersionHeader`. | Aligned |
| Audit side effects | Create/update only; not response payload | OpenAPI marks create/update as `x-audit-required: true` and list/get as `false`. | Aligned |

Behavior semantics classification: No blocking drift found.

## 15. Evidence Interpretation

Evidence classification:

- Route presence: No drift.
- Workspace and permission metadata: No drift.
- Create request body: No blocking drift.
- Update request body: No blocking drift.
- Idempotency header: No drift.
- Optimistic concurrency headers: No drift.
- List `limit` requiredness: Contract drift.
- Product response envelope: Contract drift.
- Product list response envelope: Contract drift.
- ErrorModel details: Follow-up required in the next OpenAPI edit planning gate.

Primary finding:

The accepted runtime product route response shapes do not match the pinned OpenAPI authority response envelopes.

Runtime response shapes:

- Item operations return `{ product }`.
- List operation returns `{ products, count, hasMore, nextCursor }`.

OpenAPI response shapes:

- `ProductResponse` requires `data` and `warnings`.
- `ProductListResponse` requires `data`, `meta`, and `warnings`.

This is contract drift.

## 16. Decision

Decision: GO to Backend Slice 0 Product Route OpenAPI Edit Authorization Planning Gate.

Rationale:

The runtime product route foundation has already been accepted by prior gates. The pinned OpenAPI authority represents the product routes and most behavior metadata, but the response envelope and list limit requiredness differ from runtime behavior. Therefore, the next safe step is not implementation. The next step must be an OpenAPI edit authorization planning gate that decides whether to align the authority contract to the accepted runtime shape or authorize a separate runtime correction gate.

This gate does not authorize OpenAPI edits directly.

This gate does not authorize runtime changes.

This gate does not authorize generated client regeneration.

## 17. Not Authorized

This gate does not authorize:

- OpenAPI edits.
- Runtime code changes.
- Generated client regeneration.
- SQL migrations.
- Product route expansion.
- Audit querying/reporting.
- Read/list audit logging.
- Deployment work.

## 18. Transition Control

Do not merge this gate until Sections 8 through 16 are completed with actual decisions.

A separate gate is required before any implementation or contract-authority change.
