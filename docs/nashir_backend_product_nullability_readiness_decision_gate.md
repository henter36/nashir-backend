# Nashir Backend Product Nullability and Readiness Decision Gate

## Decision summary

Decision type: Documentation-only decision gate.

This gate decides Product request nullability and Product readiness policy before any runtime, OpenAPI, generated type, migration, route, or test change.

Context:

- Product version public DTO mapping has been implemented and merged.
- Product `version` remains numeric internally and serializes as string in public Product responses.
- Remaining Product contract gaps are request nullability and optional response `readiness`.

Recommended nullability decision:

Do not change runtime immediately. Current runtime behavior accepts `null` for selected create/update fields and treats it as clear-field input. Preserve that behavior until humans explicitly choose whether to update OpenAPI to document clear-field semantics or change runtime validation to reject `null`.

Recommended readiness decision:

Keep `Product.readiness` omitted while it remains optional in OpenAPI and while runtime has no trustworthy readiness source. Do not add default or placeholder readiness values.

Final gate result: GO for follow-up implementation planning PRs only. NO-GO for immediate runtime, OpenAPI, generated type, migration, route, test, auth/RBAC/workspace, or Product.version changes from this document alone.

## Current verified authority SHA

Authority repository: `../nashir`

Verified authority SHA:

`1a30fb6a13bce5210a23ac8a5d1011187038609b`

Authority file reviewed:

- `../nashir/docs/nashir_v1_openapi.yaml`

Backend source reviewed:

- `src/products/product-types.ts`
- `src/products/product-schema.ts`
- `src/products/product-handlers.ts`
- `src/products/product-repository.ts`
- `src/products/product-mapper.ts`
- `tests/products/product-repository.test.ts`
- `tests/products/product-route-handler.test.ts`

## Current runtime behavior

Runtime Product response shape includes:

| Field | Runtime/public behavior |
|---|---|
| `category` | May be `string` or `null`. |
| `price` | May be `number` or `null`. |
| `sku` | May be `string` or `null`. |
| `imageUrl` | May be `string` or `null`. |
| `videoUrl` | May be `string` or `null`. |
| `description` | May be `string` or `null`. |
| `readiness` | Not present in runtime Product responses. |

Runtime create/update input behavior:

- `validateStringOrNullFields` accepts `string` or `null` for `category`, `sku`, `imageUrl`, `videoUrl`, and `description`.
- `validatePrice` accepts `number` or `null` for `price`.
- `buildCreateInput` and `buildUpdateInput` preserve explicit `null`.
- `ProductRepository.createProduct` writes omitted optional fields as `null`.
- `ProductRepository.updateProduct` updates fields when the input value is not `undefined`; explicit `null` is therefore a set/clear operation for nullable persistence columns.

Runtime readiness behavior:

- Runtime `Product` does not define `readiness`.
- Public `Product` DTO mapping does not add `readiness`.
- Product repository does not read or compute readiness.
- Product persistence has no readiness column.
- Product route tests do not assert readiness.

## Current OpenAPI request behavior

Authority `CreateProductRequest` and `UpdateProductRequest` define these fields as optional but non-null when present:

| Field | Create request type | Update request type |
|---|---|---|
| `category` | `string` | `string` |
| `price` | `number` | `number` |
| `sku` | `string` | `string` |
| `imageUrl` | `string`, `uri` | `string`, `uri` |
| `videoUrl` | `string`, `uri` | `string`, `uri` |
| `description` | `string` | `string` |

Authority request schemas do not currently permit `null` for these fields.

Authority request schemas do not include `readiness`.

## Current OpenAPI response behavior

Authority `Product` response defines the affected nullable fields as optional response properties that allow `null`:

| Field | Response type |
|---|---|
| `category` | `string \| null` |
| `price` | `number \| null` |
| `sku` | `string \| null` |
| `imageUrl` | `string \| null`, `uri` |
| `videoUrl` | `string \| null`, `uri` |
| `description` | `string \| null` |

Authority `Product.readiness`:

- Exists in OpenAPI as `readiness`.
- References `#/components/schemas/Readiness`.
- Is not listed in `Product.required`.
- Is therefore optional in the response contract.

## Nullability issue

### Affected fields

The nullability mismatch affects create/update request handling for:

- `category`
- `price`
- `sku`
- `imageUrl`
- `videoUrl`
- `description`

### Is null currently clear-field?

Yes for update behavior.

Runtime update builds an input containing explicit `null`, and the repository sets the corresponding column because it only skips `undefined`. This makes `null` a clear-field operation for nullable persistence columns.

For create behavior, omitted optional fields and explicit `null` both result in nullable persistence fields being stored as `null`.

### Does OpenAPI allow null in request?

No.

OpenAPI create/update request schemas mark the affected fields as optional but do not include `"null"` in their request-side types.

### Options

#### A) Reject null in create/update to match OpenAPI

Summary:

Change runtime validation to reject `null` for request fields that OpenAPI defines as non-null when present.

Risks:

- Removes current clear-field behavior for update requests.
- Requires clients to use a different mechanism for clearing fields, which does not currently exist in the contract.
- Could require a follow-up clear-field design if users need to erase category, SKU, URLs, description, or price.

Acceptance criteria if selected:

- Runtime validators reject `null` in create/update for affected fields.
- Status codes and ErrorModel shape remain unchanged unless separately authorized.
- Tests prove `null` rejection and no auth/RBAC/workspace behavior changes.
- No OpenAPI change is needed for request nullability.

#### B) Keep null as clear-field and update OpenAPI later

Summary:

Preserve current runtime clear-field behavior and submit an authority OpenAPI update that permits `null` for affected create/update request fields.

Risks:

- Requires authority PR before the backend contract is fully reconciled.
- Public generated clients may change request field types after the authority update.
- Needs explicit docs that `null` means clear, while omitted means no change for update.

Acceptance criteria if selected:

- Authority request schemas allow `null` for affected fields.
- Backend validation remains explicit and documents clear-field semantics in tests.
- Update tests distinguish omitted fields from explicit `null`.
- Create tests document that omitted and explicit `null` both persist nullable fields as `null`.

#### C) Split create/update semantics by field

Summary:

Permit `null` only where clear-field semantics are required, and reject `null` for fields where clearing is not a supported product operation.

Risks:

- More complex API contract.
- More complex validation and tests.
- Field-by-field decisions may be arbitrary without product requirements.

Acceptance criteria if selected:

- Each affected field has an explicit policy.
- OpenAPI and runtime agree field-by-field.
- Tests cover accepted and rejected `null` per field.

### Recommended decision

Choose Option B as the default direction, subject to human approval.

Rationale:

- Current runtime already implements useful clear-field behavior.
- Nullable persistence columns imply that clearing product metadata is a legitimate operation.
- Rejecting `null` would remove behavior before a replacement clear-field mechanism exists.
- The mismatch is best resolved by an explicit authority update or by a human decision to reject clear-field behavior, not by an implicit runtime change.

Implementation should not proceed until humans decide whether clear-field semantics are part of the public Product contract.

## Readiness issue

### Is readiness present in OpenAPI?

Yes. `Product.readiness` exists in the authority `Product` response schema and references `Readiness`.

### Is readiness required?

No. `readiness` is not in the authority `Product.required` list.

### Does runtime compute readiness?

No.

Runtime has no Product readiness source, no Product readiness persistence column, no mapper field, and no Product response test coverage for readiness.

### Options

#### A) Keep omitted while optional

Summary:

Continue omitting `Product.readiness` in runtime responses because the OpenAPI field is optional.

Risks:

- Consumers will not receive readiness data from Product responses yet.
- Future conformance checks must treat absence as valid while the field remains optional.

Acceptance criteria if selected:

- Runtime responses keep omitting `readiness`.
- Tests may assert absence only if a follow-up implementation PR needs to prevent accidental placeholder data.
- OpenAPI remains unchanged.

#### B) Add computed readiness

Summary:

Add real computed readiness based on defined product readiness rules and a trustworthy data source.

Risks:

- Requires product intelligence rules that do not currently exist in runtime.
- May require persistence, query, or service changes.
- Can drift from future readiness domain design if implemented prematurely.

Acceptance criteria if selected:

- A separate product readiness specification exists.
- Runtime computes readiness from authoritative inputs.
- Tests cover meaningful ready/warning/blocker states.

#### C) Add default advisory readiness

Summary:

Return a static/default readiness object until real computation exists.

Risks:

- Misleading clients with synthetic readiness data.
- Encourages consumers to depend on non-authoritative signals.
- Creates cleanup risk when real readiness arrives.

Acceptance criteria if selected:

- Human approval explicitly accepts placeholder advisory semantics.
- Response labels make default status unambiguous.
- Tests prevent accidental representation as production readiness.

#### D) Defer to product intelligence slice

Summary:

Leave Product route responses unchanged and decide readiness in the future product intelligence/readiness slice.

Risks:

- The Product response contract remains partially advisory until that slice is planned.
- Requires tracking to avoid losing the readiness decision.

Acceptance criteria if selected:

- A future gate owns product readiness semantics.
- Current Product response remains valid because `readiness` is optional.
- No placeholder readiness is introduced.

### Recommended decision

Choose Option A now and Option D for ownership.

Keep `readiness` omitted while optional, and defer computed readiness to a future product intelligence/readiness slice. Do not add default advisory readiness.

Rationale:

- The authority field is optional.
- Runtime has no trustworthy readiness source.
- A fake default would be more harmful than omission.
- Real readiness should be designed with product intelligence semantics, not bolted onto Product CRUD.

## Explicit blocklist

This gate does not authorize:

- Runtime code changes.
- OpenAPI changes.
- Generated type changes.
- Test changes.
- Migration changes.
- Route changes.
- Product.version changes.
- Product DTO version mapping changes.
- ErrorModel or HealthResponse changes.
- auth/RBAC/workspace behavior changes.
- CI workflow changes.
- Pushing to remote.

## Allowed next implementation PRs after decision

Allowed only after human approval:

- Product nullability implementation PR that either rejects `null` in create/update or preserves `null` as documented clear-field behavior with matching tests.
- Authority OpenAPI PR to allow request `null` for clear-field fields, if Option B is accepted.
- Product readiness planning PR for the product intelligence/readiness slice.
- Product conformance PR that verifies optional `readiness` omission remains OpenAPI-valid.

Not allowed without a separate gate:

- Adding placeholder readiness values.
- Changing persistence nullability.
- Changing Product.version internals or public DTO behavior.
- Changing auth/RBAC/workspace semantics.

## Validation commands

Run from the nashir-backend repository root:

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm test
NASHIR_AUTHORITY_REPO=../nashir pnpm run validate:contracts
NASHIR_AUTHORITY_REPO=../nashir pnpm run validate:contract-authority
```

Expected result:

All commands pass with only this documentation file changed.

## Human decisions required

Humans must decide:

- Whether `null` in create/update is public clear-field contract behavior.
- Whether OpenAPI should be updated to permit request `null` for affected fields.
- Whether any affected fields should reject `null` even if others permit it.
- Whether omitted create fields and explicit `null` create fields should remain equivalent.
- Whether update omission means no change and update `null` means clear.
- Which future slice owns Product readiness computation.
- Whether Product responses should explicitly assert readiness absence until real readiness exists.

## Final GO/NO-GO

GO:

- Use this gate to plan a follow-up nullability implementation or authority update after human approval.
- Keep `Product.readiness` omitted while optional until a real readiness source is designed.
- Preserve Product.version behavior as already reconciled.

NO-GO:

- No runtime change is authorized by this document.
- No OpenAPI change is authorized by this document.
- No generated type, migration, route, test, CI, auth/RBAC/workspace, Product.version, ErrorModel, or HealthResponse change is authorized by this document.
