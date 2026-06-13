# Nashir Backend Slice 0 — Product Route OpenAPI Edit Proposal Gate

## 1. Gate Name

Backend Slice 0 Product Route OpenAPI Edit Proposal Gate

## 2. Gate Type

OpenAPI edit proposal gate.

This gate is documentation-only.

It does not authorize direct OpenAPI edits, runtime implementation, generated client regeneration, SQL migrations, auth changes, permission guard changes, workspace context changes, request context parsing changes, package changes, CI workflow changes, UI work, or deployment work.

## 3. Purpose

This gate proposes a narrow authority OpenAPI YAML change plan to resolve the product-route contract drift recorded in the Product Route OpenAPI Authority Comparison Evidence Gate and authorized for proposal by the Product Route OpenAPI Edit Authorization Planning Gate.

This gate does not edit `docs/nashir_v1_openapi.yaml`.

This gate does not commit to the authority repository.

This gate does not regenerate generated clients.

This gate does not change runtime code.

## 4. Inputs

### 4.1 Latest Accepted Authorization Gate

- `docs/nashir_backend_slice_0_product_route_openapi_edit_authorization_planning_gate.md`
- Decision: GO to Backend Slice 0 Product Route OpenAPI Edit Proposal Gate.

### 4.2 Authority Inputs

- Authority repository path used locally: `/Users/mohammedalqudairi/workspace/nashir`
- Authority ref used: `36da9ed31903562bddfb7ffd669841956e334a51`
- Authority OpenAPI file: `docs/nashir_v1_openapi.yaml`

### 4.3 Runtime Inputs

- `src/products/product-schema.ts`
- `src/products/product-handlers.ts`
- Prior accepted product route runtime gates.

## 5. Authority Validation Evidence

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

## 6. Current Authority Product Route Excerpts

### 6.1 Product Collection Path

```text
77:         default:
78:           $ref: "#/components/responses/DefaultError"
79:   /workspaces/{workspaceId}/products:
80:     get:
81:       operationId: listProducts
82:       x-permission: nashir.products.read
83:       x-workspace-scope: route
84:       x-membership-check: non-disclosing
85:       x-store-scope: implicit
86:       x-human-review-required: false
87:       x-audit-required: false
88:       x-evidence-required: false
89:       x-sensitive-operation: false
90:       x-no-automatic-execution: false
91:       x-guard-chain:
92:         - authGuard
93:         - workspaceContextGuard
94:         - nonDisclosingMembershipCheck
95:         - permissionGuard
96:       tags:
97:         - Products
98:       summary: List products.
99:       description: Lists product catalog records for a workspace. Product names are not identity; productId is canonical.
100:       parameters:
101:         - $ref: "#/components/parameters/WorkspaceIdPath"
102:         - $ref: "#/components/parameters/LimitQuery"
103:         - $ref: "#/components/parameters/CursorQuery"
104:         - $ref: "#/components/parameters/StatusQuery"
105:         - $ref: "#/components/parameters/UpdatedAfterQuery"
106:         - $ref: "#/components/parameters/SortQuery"
107:         - $ref: "#/components/parameters/RequestIdHeader"
108:       responses:
109:         "401":
110:           $ref: "#/components/responses/Unauthorized"
111:         "403":
112:           $ref: "#/components/responses/PermissionDenied"
113:         "404":
114:           $ref: "#/components/responses/NotFound"
115:         "200":
116:           description: Product list response.
117:           content:
118:             application/json:
119:               schema:
120:                 $ref: "#/components/schemas/ProductListResponse"
121:         "400":
122:           $ref: "#/components/responses/BadRequest"
123:         default:
124:           $ref: "#/components/responses/DefaultError"
125:     post:
126:       operationId: createProduct
127:       x-permission: nashir.products.manage
128:       x-workspace-scope: route
129:       x-membership-check: non-disclosing
130:       x-store-scope: implicit
131:       x-human-review-required: false
132:       x-audit-required: true
133:       x-evidence-required: false
134:       x-sensitive-operation: false
135:       x-no-automatic-execution: false
136:       x-guard-chain:
137:         - authGuard
138:         - workspaceContextGuard
139:         - nonDisclosingMembershipCheck
140:         - permissionGuard
141:         - rejectBodyWorkspaceId
142:       tags:
143:         - Products
144:       summary: Create product.
145:       description: Creates product metadata for the workspace. This endpoint does not create assets, campaigns, connector runs, or AI output.
146:       parameters:
147:         - $ref: "#/components/parameters/WorkspaceIdPath"
148:         - $ref: "#/components/parameters/IdempotencyKeyHeader"
149:         - $ref: "#/components/parameters/RequestIdHeader"
150:       requestBody:
151:         required: true
152:         content:
153:           application/json:
154:             schema:
155:               $ref: "#/components/schemas/CreateProductRequest"
156:       responses:
157:         "401":
158:           $ref: "#/components/responses/Unauthorized"
159:         "403":
160:           $ref: "#/components/responses/PermissionDenied"
161:         "404":
162:           $ref: "#/components/responses/NotFound"
163:         "201":
164:           description: Product created.
165:           content:
166:             application/json:
167:               schema:
168:                 $ref: "#/components/schemas/ProductResponse"
```

### 6.2 Product Item Path

```text
175:         default:
176:           $ref: "#/components/responses/DefaultError"
177:   /workspaces/{workspaceId}/products/{productId}:
178:     get:
179:       operationId: getProduct
180:       x-permission: nashir.products.read
181:       x-workspace-scope: route
182:       x-membership-check: non-disclosing
183:       x-store-scope: implicit
184:       x-human-review-required: false
185:       x-audit-required: false
186:       x-evidence-required: false
187:       x-sensitive-operation: false
188:       x-no-automatic-execution: false
189:       x-guard-chain:
190:         - authGuard
191:         - workspaceContextGuard
192:         - nonDisclosingMembershipCheck
193:         - permissionGuard
194:       tags:
195:         - Products
196:       summary: Get product.
197:       description: Reads one product by productId. Product names are display labels and must not be used as identity.
198:       parameters:
199:         - $ref: "#/components/parameters/WorkspaceIdPath"
200:         - $ref: "#/components/parameters/ProductIdPath"
201:         - $ref: "#/components/parameters/RequestIdHeader"
202:       responses:
203:         "401":
204:           $ref: "#/components/responses/Unauthorized"
205:         "403":
206:           $ref: "#/components/responses/PermissionDenied"
207:         "200":
208:           description: Product response.
209:           content:
210:             application/json:
211:               schema:
212:                 $ref: "#/components/schemas/ProductResponse"
213:         "404":
214:           $ref: "#/components/responses/NotFound"
215:         default:
216:           $ref: "#/components/responses/DefaultError"
217:     put:
218:       operationId: updateProduct
219:       x-permission: nashir.products.manage
220:       x-workspace-scope: route
221:       x-membership-check: non-disclosing
222:       x-store-scope: implicit
223:       x-human-review-required: false
224:       x-audit-required: true
225:       x-evidence-required: false
226:       x-sensitive-operation: false
227:       x-no-automatic-execution: false
228:       x-guard-chain:
229:         - authGuard
230:         - workspaceContextGuard
231:         - nonDisclosingMembershipCheck
232:         - permissionGuard
233:         - rejectBodyWorkspaceId
234:       tags:
235:         - Products
236:       summary: Update product.
237:       description: Updates product metadata. Clients must send If-Match or X-Resource-Version for optimistic concurrency.
238:       parameters:
239:         - $ref: "#/components/parameters/WorkspaceIdPath"
240:         - $ref: "#/components/parameters/ProductIdPath"
241:         - $ref: "#/components/parameters/IfMatchHeader"
242:         - $ref: "#/components/parameters/ResourceVersionHeader"
243:         - $ref: "#/components/parameters/RequestIdHeader"
244:       requestBody:
245:         required: true
246:         content:
247:           application/json:
248:             schema:
249:               $ref: "#/components/schemas/UpdateProductRequest"
250:       responses:
251:         "401":
252:           $ref: "#/components/responses/Unauthorized"
253:         "403":
254:           $ref: "#/components/responses/PermissionDenied"
255:         "200":
256:           description: Product updated.
257:           content:
258:             application/json:
259:               schema:
260:                 $ref: "#/components/schemas/ProductResponse"
261:         "400":
262:           $ref: "#/components/responses/BadRequest"
263:         "404":
264:           $ref: "#/components/responses/NotFound"
265:         "409":
266:           $ref: "#/components/responses/Conflict"
```

## 7. Current Authority Schema And Parameter Excerpts

### 7.1 LimitQuery

```text
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
```

### 7.2 ProductResponse

```text
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
```

### 7.3 ProductListResponse

```text
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
4808:           format: uri
4809:           description: Optional metadata reference. This contract does not define binary upload.
4810:         previewUrl:
4811:           type:
4812:             - string
4813:             - "null"
4814:           format: uri
4815:         rightsStatus:
4816:           $ref: "#/components/schemas/RightsStatus"
4817:         usageRights:
```

### 7.4 PaginationMeta

```text
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
4597:     StockStatus:
4598:       type: string
4599:       enum:
4600:         - available
4601:         - limited
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
```

### 7.5 Product Schema Reference Scan

```text
102:         - $ref: "#/components/parameters/LimitQuery"
120:                 $ref: "#/components/schemas/ProductListResponse"
168:                 $ref: "#/components/schemas/ProductResponse"
212:                 $ref: "#/components/schemas/ProductResponse"
260:                 $ref: "#/components/schemas/ProductResponse"
294:         - $ref: "#/components/parameters/LimitQuery"
542:         - $ref: "#/components/parameters/LimitQuery"
919:         - $ref: "#/components/parameters/LimitQuery"
1974:         - $ref: "#/components/parameters/LimitQuery"
2336:         - $ref: "#/components/parameters/LimitQuery"
2539:         - $ref: "#/components/parameters/LimitQuery"
2825:         - $ref: "#/components/parameters/LimitQuery"
3114:         - $ref: "#/components/parameters/LimitQuery"
3201:         - $ref: "#/components/parameters/LimitQuery"
3241:         - $ref: "#/components/parameters/LimitQuery"
3633:         - $ref: "#/components/parameters/LimitQuery"
3672:         - $ref: "#/components/parameters/LimitQuery"
3710:         - $ref: "#/components/parameters/LimitQuery"
3958:         - $ref: "#/components/parameters/LimitQuery"
3996:         - $ref: "#/components/parameters/LimitQuery"
4072:         - $ref: "#/components/parameters/LimitQuery"
4124:     LimitQuery:
4716:     ProductResponse:
4728:     ProductListResponse:
```

## 8. Runtime Product Response Evidence

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

Runtime response and limit references:

```text
src/products/product-handlers.ts:14:  ProductListResponse,
src/products/product-handlers.ts:15:  ProductResponse,
src/products/product-handlers.ts:29:const PERMISSION_READ = "nashir.products.read";
src/products/product-handlers.ts:30:const PERMISSION_MANAGE = "nashir.products.manage";
src/products/product-handlers.ts:240:      "stockStatus must be one of: available, limited, out_of_stock, unknown."
src/products/product-handlers.ts:391:  ): Promise<ProductListResponse | void> {
src/products/product-handlers.ts:402:    if (q.limit === undefined || q.limit === "") {
src/products/product-handlers.ts:403:      sendBadRequest(reply, "limit is required.", request.correlationId);
src/products/product-handlers.ts:406:    const limitNum = Number(q.limit);
src/products/product-handlers.ts:407:    if (!Number.isInteger(limitNum) || limitNum <= 0) {
src/products/product-handlers.ts:410:        "limit must be a positive integer.",
src/products/product-handlers.ts:415:    if (limitNum > 100) {
src/products/product-handlers.ts:418:        "limit must not exceed 100.",
src/products/product-handlers.ts:455:        limit: limitNum,
src/products/product-handlers.ts:470:      products: result.products,
src/products/product-handlers.ts:471:      count: result.count,
src/products/product-handlers.ts:472:      hasMore: result.hasMore,
src/products/product-handlers.ts:473:      nextCursor: result.nextCursor
src/products/product-handlers.ts:489:  ): Promise<ProductResponse | void> {
src/products/product-handlers.ts:617:    const productResponse: ProductResponse = { product };
src/products/product-handlers.ts:635:  ): Promise<ProductResponse | void> {
src/products/product-handlers.ts:671:  ): Promise<ProductResponse | void> {
src/products/product-schema.ts:3:export interface ProductResponse {
src/products/product-schema.ts:7:export interface ProductListResponse {
src/products/product-schema.ts:8:  products: Product[];
src/products/product-schema.ts:9:  count: number;
src/products/product-schema.ts:10:  hasMore: boolean;
src/products/product-schema.ts:11:  nextCursor: string | null;
src/products/product-schema.ts:24:  limit?: string;
```

## 9. Proposed OpenAPI Diff Plan

### 9.1 ProductResponse Proposed Replacement

Current authority shape uses a generic envelope with `data` and `warnings`.

Proposed product-route-specific shape:

```yaml
ProductResponse:
  type: object
  required:
    - product
  properties:
    product:
      $ref: "#/components/schemas/Product"
```

Rationale:

- Aligns product item responses with accepted runtime `ProductResponse`.
- Keeps the change limited to `ProductResponse`.
- Does not alter unrelated response schemas.

### 9.2 ProductListResponse Proposed Replacement

Current authority shape uses `data`, `meta`, and `warnings`.

Proposed product-route-specific shape:

```yaml
ProductListResponse:
  type: object
  required:
    - products
    - count
    - hasMore
    - nextCursor
  properties:
    products:
      type: array
      items:
        $ref: "#/components/schemas/Product"
    count:
      type: integer
      minimum: 0
    hasMore:
      type: boolean
    nextCursor:
      type: string
      nullable: true
```

Rationale:

- Aligns list response with runtime `ProductListResponse`.
- `nextCursor` is required but nullable to match runtime shape.
- Keeps `PaginationMeta` untouched.
- Does not change list response policy for other resources.

### 9.3 Product List Limit Requiredness Proposed Replacement

Current product list path references shared `LimitQuery`, which is optional and shared.

Proposed operation-local parameter replacement for product list only:

```yaml
parameters:
  - $ref: "#/components/parameters/WorkspaceIdPath"
  - name: limit
    in: query
    required: true
    description: Maximum number of product records to return.
    schema:
      type: integer
      minimum: 1
      maximum: 100
  - $ref: "#/components/parameters/CursorQuery"
  - $ref: "#/components/parameters/StatusQuery"
  - $ref: "#/components/parameters/UpdatedAfterQuery"
  - $ref: "#/components/parameters/SortQuery"
  - $ref: "#/components/parameters/RequestIdHeader"
```

Rationale:

- Resolves product list requiredness drift without mutating shared `LimitQuery`.
- Avoids unexpected blast radius across other list endpoints.
- Keeps pagination policy changes scoped to product list only.

## 10. ErrorModel Follow-Up Review

### 10.1 Current ErrorModel Excerpt

```text
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
4597:     StockStatus:
4598:       type: string
4599:       enum:
4600:         - available
4601:         - limited
4602:         - out_of_stock
4603:         - unknown
4604:     Product:
4605:       type: object
4606:       description: Product catalog record. productId is canonical identity; product name is only a display field.
```

### 10.2 Shared Error Response Excerpts

BadRequest:

```text
4381:         minLength: 1
4382:   responses:
4383:     BadRequest:
4384:       description: Bad request.
4385:       content:
4386:         application/json:
4387:           schema:
4388:             $ref: "#/components/schemas/ErrorModel"
4389:     Unauthorized:
4390:       description: Authentication is required or was not accepted.
4391:       content:
4392:         application/json:
4393:           schema:
4394:             $ref: "#/components/schemas/ErrorModel"
4395:     PermissionDenied:
4396:       description: Permission denied.
4397:       content:
4398:         application/json:
4399:           schema:
4400:             $ref: "#/components/schemas/ErrorModel"
4401:     NotFound:
4402:       description: Resource not found.
4403:       content:
4404:         application/json:
4405:           schema:
4406:             $ref: "#/components/schemas/ErrorModel"
4407:     Conflict:
4408:       description: Conflict, idempotency conflict, or version mismatch.
4409:       content:
4410:         application/json:
4411:           schema:
4412:             $ref: "#/components/schemas/ErrorModel"
4413:     ValidationFailed:
4414:       description: Validation failed.
4415:       content:
4416:         application/json:
4417:           schema:
4418:             $ref: "#/components/schemas/ErrorModel"
4419:     RateLimited:
4420:       description: Rate limit exceeded.
4421:       content:
4422:         application/json:
4423:           schema:
4424:             $ref: "#/components/schemas/ErrorModel"
4425:     InternalServerError:
4426:       description: Internal server error.
4427:       content:
4428:         application/json:
4429:           schema:
4430:             $ref: "#/components/schemas/ErrorModel"
4431:     Gone:
4432:       description: Resource existed but has passed its TTL or been invalidated by an expired parent. Distinguishes from 404 (never existed).
4433:       content:
4434:         application/json:
4435:           schema:
4436:             $ref: "#/components/schemas/ErrorModel"
4437:     DefaultError:
4438:       description: Error response.
4439:       content:
4440:         application/json:
4441:           schema:
4442:             $ref: "#/components/schemas/ErrorModel"
4443:   schemas:
4444:     HealthResponse:
4445:       type: object
4446:       required:
4447:         - data
4448:       properties:
4449:         data:
4450:           type: object
4451:           required:
4452:             - service
4453:             - status
4454:             - version
4455:           properties:
4456:             service:
4457:               type: string
4458:               example: nashir-v1-api
4459:             status:
4460:               type: string
4461:               enum:
4462:                 - ok
4463:                 - degraded
4464:             version:
4465:               type: string
4466:               example: 0.1.0
4467:     ErrorCode:
4468:       type: string
4469:       enum:
4470:         - workspace.not_found
4471:         - resource.not_found
4472:         - validation.failed
```

ValidationFailed:

```text
4411:           schema:
4412:             $ref: "#/components/schemas/ErrorModel"
4413:     ValidationFailed:
4414:       description: Validation failed.
4415:       content:
4416:         application/json:
4417:           schema:
4418:             $ref: "#/components/schemas/ErrorModel"
4419:     RateLimited:
4420:       description: Rate limit exceeded.
4421:       content:
4422:         application/json:
4423:           schema:
4424:             $ref: "#/components/schemas/ErrorModel"
4425:     InternalServerError:
4426:       description: Internal server error.
4427:       content:
4428:         application/json:
4429:           schema:
4430:             $ref: "#/components/schemas/ErrorModel"
4431:     Gone:
4432:       description: Resource existed but has passed its TTL or been invalidated by an expired parent. Distinguishes from 404 (never existed).
4433:       content:
4434:         application/json:
4435:           schema:
4436:             $ref: "#/components/schemas/ErrorModel"
4437:     DefaultError:
4438:       description: Error response.
4439:       content:
4440:         application/json:
4441:           schema:
4442:             $ref: "#/components/schemas/ErrorModel"
4443:   schemas:
4444:     HealthResponse:
4445:       type: object
4446:       required:
4447:         - data
4448:       properties:
4449:         data:
4450:           type: object
4451:           required:
4452:             - service
4453:             - status
4454:             - version
4455:           properties:
4456:             service:
4457:               type: string
4458:               example: nashir-v1-api
4459:             status:
4460:               type: string
4461:               enum:
4462:                 - ok
4463:                 - degraded
4464:             version:
4465:               type: string
4466:               example: 0.1.0
4467:     ErrorCode:
4468:       type: string
4469:       enum:
4470:         - workspace.not_found
4471:         - resource.not_found
4472:         - validation.failed
4473:         - permission.denied
4474:         - conflict.version_mismatch
4475:         - idempotency.conflict
4476:         - rate_limit.exceeded
4477:         - review.required
4478:         - publishing.blocked
4479:         - provider.not_ready
4480:         - model_route.not_ready
4481:         - prompt_template.not_approved
4482:         - cost_policy.exceeded
4483:         - creator_studio.session.not_found
4484:         - creator_studio.session.expired
4485:         - creator_studio.draft.not_found
4486:         - creator_studio.draft.expired
4487:         - creator_studio.draft.not_ready
4488:         - creator_studio.transfer.not_found
4489:         - creator_studio.transfer.expired
4490:         - creator_studio.content.not_approved
4491:         - creator_studio.content.archived_or_expired
4492:         - creator_studio.workspace.mismatch
4493:         - creator_studio.governance.blocked
4494:         - creator_studio.consent.required
4495:         - creator_studio.platform.not_connected
4496:         - creator_studio.scheduling.duplicate_not_supported
4497:         - creator_studio.override.invalid
4498:         - workspace.member.not_found
4499:         - workspace.member.already_active
4500:         - workspace.member.already_suspended
4501:         - workspace.member.self_action_forbidden
4502:         - store_profile.not_found
```

Conflict:

```text
4405:           schema:
4406:             $ref: "#/components/schemas/ErrorModel"
4407:     Conflict:
4408:       description: Conflict, idempotency conflict, or version mismatch.
4409:       content:
4410:         application/json:
4411:           schema:
4412:             $ref: "#/components/schemas/ErrorModel"
4413:     ValidationFailed:
4414:       description: Validation failed.
4415:       content:
4416:         application/json:
4417:           schema:
4418:             $ref: "#/components/schemas/ErrorModel"
4419:     RateLimited:
4420:       description: Rate limit exceeded.
4421:       content:
4422:         application/json:
4423:           schema:
4424:             $ref: "#/components/schemas/ErrorModel"
4425:     InternalServerError:
4426:       description: Internal server error.
4427:       content:
4428:         application/json:
4429:           schema:
4430:             $ref: "#/components/schemas/ErrorModel"
4431:     Gone:
4432:       description: Resource existed but has passed its TTL or been invalidated by an expired parent. Distinguishes from 404 (never existed).
4433:       content:
4434:         application/json:
4435:           schema:
4436:             $ref: "#/components/schemas/ErrorModel"
4437:     DefaultError:
4438:       description: Error response.
4439:       content:
4440:         application/json:
4441:           schema:
4442:             $ref: "#/components/schemas/ErrorModel"
4443:   schemas:
4444:     HealthResponse:
4445:       type: object
4446:       required:
4447:         - data
4448:       properties:
4449:         data:
4450:           type: object
4451:           required:
4452:             - service
4453:             - status
4454:             - version
4455:           properties:
4456:             service:
4457:               type: string
4458:               example: nashir-v1-api
4459:             status:
4460:               type: string
4461:               enum:
4462:                 - ok
4463:                 - degraded
4464:             version:
4465:               type: string
4466:               example: 0.1.0
4467:     ErrorCode:
4468:       type: string
4469:       enum:
4470:         - workspace.not_found
4471:         - resource.not_found
4472:         - validation.failed
4473:         - permission.denied
4474:         - conflict.version_mismatch
4475:         - idempotency.conflict
4476:         - rate_limit.exceeded
4477:         - review.required
4478:         - publishing.blocked
4479:         - provider.not_ready
4480:         - model_route.not_ready
4481:         - prompt_template.not_approved
4482:         - cost_policy.exceeded
4483:         - creator_studio.session.not_found
4484:         - creator_studio.session.expired
4485:         - creator_studio.draft.not_found
4486:         - creator_studio.draft.expired
4487:         - creator_studio.draft.not_ready
4488:         - creator_studio.transfer.not_found
4489:         - creator_studio.transfer.expired
4490:         - creator_studio.content.not_approved
4491:         - creator_studio.content.archived_or_expired
4492:         - creator_studio.workspace.mismatch
4493:         - creator_studio.governance.blocked
4494:         - creator_studio.consent.required
4495:         - creator_studio.platform.not_connected
4496:         - creator_studio.scheduling.duplicate_not_supported
```

DefaultError:

```text
4435:           schema:
4436:             $ref: "#/components/schemas/ErrorModel"
4437:     DefaultError:
4438:       description: Error response.
4439:       content:
4440:         application/json:
4441:           schema:
4442:             $ref: "#/components/schemas/ErrorModel"
4443:   schemas:
4444:     HealthResponse:
4445:       type: object
4446:       required:
4447:         - data
4448:       properties:
4449:         data:
4450:           type: object
4451:           required:
4452:             - service
4453:             - status
4454:             - version
4455:           properties:
4456:             service:
4457:               type: string
4458:               example: nashir-v1-api
4459:             status:
4460:               type: string
4461:               enum:
4462:                 - ok
4463:                 - degraded
4464:             version:
4465:               type: string
4466:               example: 0.1.0
4467:     ErrorCode:
4468:       type: string
4469:       enum:
4470:         - workspace.not_found
4471:         - resource.not_found
4472:         - validation.failed
4473:         - permission.denied
4474:         - conflict.version_mismatch
4475:         - idempotency.conflict
4476:         - rate_limit.exceeded
4477:         - review.required
4478:         - publishing.blocked
4479:         - provider.not_ready
4480:         - model_route.not_ready
4481:         - prompt_template.not_approved
4482:         - cost_policy.exceeded
4483:         - creator_studio.session.not_found
4484:         - creator_studio.session.expired
4485:         - creator_studio.draft.not_found
4486:         - creator_studio.draft.expired
4487:         - creator_studio.draft.not_ready
4488:         - creator_studio.transfer.not_found
4489:         - creator_studio.transfer.expired
4490:         - creator_studio.content.not_approved
4491:         - creator_studio.content.archived_or_expired
4492:         - creator_studio.workspace.mismatch
4493:         - creator_studio.governance.blocked
4494:         - creator_studio.consent.required
4495:         - creator_studio.platform.not_connected
4496:         - creator_studio.scheduling.duplicate_not_supported
4497:         - creator_studio.override.invalid
4498:         - workspace.member.not_found
4499:         - workspace.member.already_active
4500:         - workspace.member.already_suspended
4501:         - workspace.member.self_action_forbidden
4502:         - store_profile.not_found
4503:         - data_source.not_found
4504:         - channel_connection.not_found
4505:         - integration_credential.not_found
4506:         - campaign.not_found
4507:         - campaign.archived
4508:         - content_item.not_found
4509:         - content_draft.not_found
4510:         - content_approval.self_approval_forbidden
4511:         - content_approval.already_decided
4512:         - publishing_job.not_found
4513:         - publishing_job.already_confirmed
4514:         - publishing_job.already_cancelled
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
```

### 10.3 ErrorModel Proposal Decision

No ErrorModel edit is proposed in this gate.

Reason:

- The confirmed blocking drift is in product success response envelopes and product list `limit` requiredness.
- Error responses are shared and should not be changed as part of a product-success-response alignment unless a separate ErrorModel-specific drift gate authorizes it.
- The next execution gate must keep ErrorModel unchanged unless a new explicit ErrorModel authorization gate is created.

## 11. Blast-Radius Review

| Proposed Change | Scope | Blast Radius | Control |
| :--- | :--- | :--- | :--- |
| Replace `ProductResponse` schema | Product response schema | Product item operations that reference `ProductResponse` | Verify references before execution. |
| Replace `ProductListResponse` schema | Product list response schema | Product list operation references `ProductListResponse` | Verify references before execution. |
| Product list inline required `limit` | Product list operation only | No shared parameter mutation | Do not change shared `LimitQuery`. |
| Leave `PaginationMeta` unchanged | Shared pagination schema | No change | Keep unrelated list endpoints untouched. |
| Leave ErrorModel unchanged | Shared error contract | No change | Separate gate required for ErrorModel edits. |

## 12. Authority-First Versus Runtime-Accepted Decision Review

### 12.1 Authority-First Option

Option:

- Change runtime to match authority envelopes: `data/meta/warnings`.

Impact:

- Requires runtime handler changes.
- Requires test changes.
- Reopens previously accepted product route runtime behavior.
- May affect UI/client expectations once runtime is consumed.

Decision:

- Not selected in this proposal gate.

### 12.2 Runtime-Accepted Option

Option:

- Propose authority OpenAPI changes to match accepted runtime product route shape.

Impact:

- Requires authority OpenAPI edit in a separate execution gate.
- Keeps runtime stable.
- Requires generated client regeneration only later, after a separate generated-client authorization gate.

Decision:

- Selected for proposal.

## 13. Execution Gate Requirements

The next gate must be:

Backend Slice 0 Product Route OpenAPI Authority Edit Execution Gate

Execution gate requirements:

- Apply edits only in the authority repository.
- Modify only `docs/nashir_v1_openapi.yaml`.
- Do not touch backend runtime code.
- Do not copy authority OpenAPI into backend.
- Do not regenerate clients.
- Re-run authority validation after edit.
- Produce exact diff for:
  - `ProductResponse`
  - `ProductListResponse`
  - product list `limit` parameter
- Confirm shared `LimitQuery`, `PaginationMeta`, and `ErrorModel` remain unchanged.
- Return to backend repository only after authority edit is merged.

## 14. Not Authorized

This gate does not authorize:

- Direct OpenAPI edit.
- Authority repository commit.
- Runtime code changes.
- Generated client regeneration.
- SQL migrations.
- Product route expansion.
- ErrorModel edits.
- Shared `LimitQuery` changes.
- Shared `PaginationMeta` changes.
- CI changes.
- UI changes.
- Deployment work.

## 15. Risks

| Risk | Status | Control |
| :--- | :--- | :--- |
| Authority changed to match runtime may weaken contract-first discipline | Accepted with control | Prior gates accepted runtime and selected OpenAPI edit planning. Execution still requires separate gate. |
| Product schemas may be reused outside product routes | Open | Execution gate must verify references immediately before editing. |
| Product list `limit` inline parameter may diverge from shared pagination conventions | Accepted with control | Scoped exception only for Product list due to runtime alignment. |
| Generated clients drift from updated authority | Controlled | Client regeneration remains blocked until a separate generated-client gate. |
| ErrorModel drift may remain unresolved | Controlled | No ErrorModel edit proposed; separate gate required if found later. |

## 16. Decision

Decision: GO to Backend Slice 0 Product Route OpenAPI Authority Edit Execution Gate.

Rationale:

The proposed YAML diff plan is narrow, scoped to product success response schemas and product list `limit` requiredness. It avoids runtime changes, shared pagination mutation, ErrorModel edits, and generated client regeneration.

## 17. Transition Control

Do not edit OpenAPI in this backend PR.

Do not commit to the authority repository from this backend gate.

Do not change runtime code.

Do not regenerate clients.

Do not add migrations.

The next gate must execute only after this proposal is reviewed and accepted.
