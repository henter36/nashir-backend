# Nashir Backend Slice 0 — Permission Guard OpenAPI Authority Additional Evidence Collection Gate

## 1. Gate Classification

Gate type: Documentation-only additional evidence collection gate.

This gate collects the additional evidence requested by the OpenAPI Authority Pin Reconciliation Evidence Decision Gate.

This gate does not authorize implementation.

This gate does not authorize validation script modification.

This gate does not authorize package script modification.

This gate does not authorize CI workflow modification.

This gate does not authorize OpenAPI mutation.

This gate does not authorize generated client changes.

This gate does not authorize public route implementation.

This gate does not authorize product route implementation.

This gate does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #88: `docs: decide permission guard openapi authority pin reconciliation evidence`.
- Merged PR #87: `docs: review permission guard openapi authority pin reconciliation evidence`.
- Merged PR #86: `docs: review permission guard openapi authority pin reconciliation planning`.
- Merged PR #85: `docs: plan permission guard openapi authority pin reconciliation`.
- Merged PR #84: `docs: decide permission guard openapi authority pin reconciliation`.
- Merged PR #83: `docs: confirm permission guard openapi authority source`.
- Merged PR #82: `docs: decide permission guard openapi authority inventory`.
- Merged PR #81: `docs: review permission guard openapi authority inventory`.
- Merged PR #80: `docs: decide permission guard openapi rbac contract alignment`.
- `scripts/validate-contract-authority.mjs`.
- `scripts/validate-contracts.mjs`.
- `package.json`.
- `.github/workflows/ci.yml`.
- Authority repository: `henter36/nashir`.
- Authority pin: `36da9ed31903562bddfb7ffd669841956e334a51`.
- Authority pin: `04f54f8be852001173f4014cb2d81c5cdb97e35c`.
- Existing Auth0 identity-only boundary.
- Existing route/path `workspaceId` authority.
- Existing workspace-before-permission ordering.
- Existing membership-before-permission ordering.
- Existing internal harness-only permission guard app wiring.
- Existing contract-first governance.
- Existing non-authorization of implementation.
- Existing non-authorization of OpenAPI mutation.
- Existing non-authorization of validation script modification.
- Existing non-authorization of generated client changes.
- Existing non-authorization of product/public routes.
- Existing non-authorization of DB, ORM, migrations, deployment, secrets, UI, workflow, and formatting baseline cleanup.

## 3. Evidence Collection Objective

This gate collects missing evidence for:

- authority repository path confirmation;
- authority pin existence;
- authority pin ancestry;
- required authority file availability at each pin;
- CI validation behavior;
- package command behavior;
- whether the authority pin split appears intentional, stale, legacy, or still unresolved.

This gate must not modify any file.

This gate must not authorize implementation.

This gate must not authorize script changes.

## 4. Authority Repository Path Evidence

Evidence collected:

| Evidence item | Observed value | Classification |
|---|---|---|
| Authority repository used by CI | `henter36/nashir` | Confirmed |
| Backend repository | `henter36/nashir-backend` | Confirmed |
| CI authority checkout path | `nashir-authority` | Confirmed |
| CI backend checkout path | `nashir-backend` | Confirmed |

Finding:

The external authority repository path is confirmed as `henter36/nashir`.

This resolves the authority repository path gap for the current backend CI evidence.

## 5. Validation Script Evidence

### 5.1 `scripts/validate-contract-authority.mjs`

Evidence collected:

| Evidence item | Observed value | Classification |
|---|---|---|
| Script path | `scripts/validate-contract-authority.mjs` | Current authority validation script used by CI |
| Pinned authority SHA | `36da9ed31903562bddfb7ffd669841956e334a51` | CI-active authority pin |
| Required authority files | `docs/nashir_v1_openapi.yaml`; `docs/nashir_auth_rbac_workspace_identity_gate.md`; `docs/nashir_auth_rbac_openapi_alignment_final_re_review_gate.md`; `docs/nashir_backend_slice_0_contract_safe_infrastructure_validation_action_gate.md` | Backend Slice 0 OpenAPI/RBAC/workspace/contract-safe authority set |
| Authority repo input | `--authority-repo` or `NASHIR_AUTHORITY_REPO` | External authority repo required |
| Authority ref input | `--authority-ref`, default `HEAD` | CI supplies explicit authority ref |
| Generated client absence check | `src/generated`, `generated`, `openapi-generated` must be absent | Active backend guardrail |
| Copied authority file absence check | authority files must be absent from backend | Active backend guardrail |
| Allowed CI workflow file | `.github/workflows/ci.yml` | Active workflow allowlist |

Finding:

`validate-contract-authority.mjs` is the current CI-active contract authority validation script for Backend Slice 0.

### 5.2 `scripts/validate-contracts.mjs`

Evidence collected:

| Evidence item | Observed value | Classification |
|---|---|---|
| Script path | `scripts/validate-contracts.mjs` | Package-exposed contract validation script |
| Expected authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` | Broader/later authority reference |
| Required contract files | `docs/nashir_v1_openapi.yaml`; `docs/nashir_ai_agent_runtime_selection_planning_gate.md` | OpenAPI plus AI/runtime planning file set |
| Authority repo input | `--authority-repo` or `NASHIR_AUTHORITY_REPO` | External authority repo required |
| Commit comparison behavior | warning if local authority HEAD differs from expected commit | Advisory comparison behavior |
| CI usage | not observed in current CI workflow | Not CI-active |

Finding:

`validate-contracts.mjs` appears to represent a broader or later contract validation path that includes AI Agent Runtime planning evidence. It is present as a package command but is not observed as CI-active in the current backend workflow.

## 6. Package Command Evidence

Evidence collected from `package.json`:

| Package command | Observed script | Classification |
|---|---|---|
| `validate:contract-authority` | `node scripts/validate-contract-authority.mjs` | CI-active authority validation command |
| `validate:contracts` | `node scripts/validate-contracts.mjs` | Package-exposed broader contract validation command |

Finding:

Both validation commands are present in `package.json`.

The command names suggest separate validation concerns, but current CI uses only `validate:contract-authority`.

## 7. CI Workflow Evidence

Evidence collected from `.github/workflows/ci.yml`:

| CI evidence item | Observed value | Classification |
|---|---|---|
| Authority repository checkout | `henter36/nashir` | Confirmed |
| Authority checkout ref | `36da9ed31903562bddfb7ffd669841956e334a51` | Confirmed |
| Authority checkout path | `nashir-authority` | Confirmed |
| Backend checkout path | `nashir-backend` | Confirmed |
| Contract validation command | `pnpm run validate:contract-authority` | Confirmed |
| Authority repo argument | `--authority-repo ../nashir-authority` | Confirmed |
| Authority ref argument | `--authority-ref 36da9ed31903562bddfb7ffd669841956e334a51` | Confirmed |
| `validate:contracts` usage in CI | not observed | Not CI-active |
| `NASHIR_AUTHORITY_REPO` usage in CI | not observed | Not CI-active |

Finding:

CI validates the backend against the `36da...` authority pin through `validate:contract-authority`.

CI does not currently run `validate:contracts`.

This resolves the CI validation behavior gap for the current workflow.

## 8. Authority Pin Existence Evidence

Evidence collected from `henter36/nashir`:

| Pin | Existence | Commit message classification |
|---|---:|---|
| `36da9ed31903562bddfb7ffd669841956e334a51` | exists | Backend Slice 0 contract-safe infrastructure validation action authority |
| `04f54f8be852001173f4014cb2d81c5cdb97e35c` | exists | AI Agent Runtime planning gate restoration authority |

Finding:

Both authority pins exist in `henter36/nashir`.

This resolves the authority pin existence gap.

## 9. Authority Pin Ancestry Evidence

Evidence collected by comparing `henter36/nashir` commits:

| Base | Head | Result |
|---|---|---|
| `36da9ed31903562bddfb7ffd669841956e334a51` | `04f54f8be852001173f4014cb2d81c5cdb97e35c` | `04f54...` is ahead of `36da...` |
| Merge base | `36da9ed31903562bddfb7ffd669841956e334a51` | `36da...` is the merge base |

Finding:

`04f54f8be852001173f4014cb2d81c5cdb97e35c` is a later authority commit relative to `36da9ed31903562bddfb7ffd669841956e334a51`.

This indicates the pins are not unrelated.

The later pin adds broader AI/runtime planning evidence, while CI remains pinned to the Backend Slice 0 contract-authority pin.

## 10. Required Authority File Availability Evidence

### 10.1 Files required by `validate-contract-authority.mjs` at `36da...`

| File | Availability at `36da...` | Classification |
|---|---:|---|
| `docs/nashir_v1_openapi.yaml` | present | OpenAPI authority |
| `docs/nashir_auth_rbac_workspace_identity_gate.md` | present | Auth/RBAC/workspace authority |
| `docs/nashir_auth_rbac_openapi_alignment_final_re_review_gate.md` | present | OpenAPI/RBAC alignment authority |
| `docs/nashir_backend_slice_0_contract_safe_infrastructure_validation_action_gate.md` | present | Backend Slice 0 contract-safe authority |

Finding:

The `validate-contract-authority.mjs` file set is available at the CI-active authority pin `36da...`.

### 10.2 Files required by `validate-contracts.mjs`

| File | Availability at `36da...` | Availability at `04f54...` | Classification |
|---|---:|---:|---|
| `docs/nashir_v1_openapi.yaml` | present | present | Common OpenAPI authority candidate |
| `docs/nashir_ai_agent_runtime_selection_planning_gate.md` | absent | present | Later AI/runtime planning evidence |

Finding:

The file-set mismatch is explained by the later addition/restoration of the AI Agent Runtime planning gate at `04f54...`.

## 11. Evidence-Based Classification

| Item | Evidence-based classification |
|---|---|
| `36da9ed31903562bddfb7ffd669841956e334a51` | Current CI-active Backend Slice 0 contract authority pin |
| `04f54f8be852001173f4014cb2d81c5cdb97e35c` | Later broader authority pin including AI Runtime planning evidence |
| `validate:contract-authority` | Current CI-active validation command |
| `validate:contracts` | Package-exposed broader contract validation command, not current CI-active |
| `scripts/validate-contract-authority.mjs` | Current backend authority guardrail script |
| `scripts/validate-contracts.mjs` | Broader/advisory contract validation script |
| `docs/nashir_v1_openapi.yaml` | Common OpenAPI authority candidate |
| AI Runtime planning evidence | Later broader planning authority, not currently part of CI-active Backend Slice 0 authority validation |

## 12. Interpretation of Split

The evidence indicates the authority pin split is most likely scope-based rather than accidental:

- `36da...` is used by CI.
- `36da...` contains the Backend Slice 0 contract-safe infrastructure validation action gate.
- `validate-contract-authority.mjs` validates against `36da...`.
- CI runs `validate:contract-authority`.
- `04f54...` is later than `36da...`.
- `04f54...` includes AI Agent Runtime planning evidence.
- `validate-contracts.mjs` references `04f54...`.
- CI does not currently run `validate:contracts`.

However, this gate should not directly accept the split as policy because acceptance requires a decision gate.

## 13. Additional Evidence Collection Result

| Gap from Evidence Decision Gate | Result |
|---|---:|
| Authority repository path confirmation | RESOLVED — `henter36/nashir` |
| Authority pin existence | RESOLVED — both pins exist |
| Authority pin ancestry | RESOLVED — `04f54...` is later than `36da...` |
| Required authority file availability at each pin | PARTIALLY RESOLVED — required files explain scope difference |
| Validation script ownership | PARTIALLY RESOLVED — CI-active versus package-exposed distinction identified |
| Package script responsibility | PARTIALLY RESOLVED — both commands present, only one CI-active |
| CI validation behavior | RESOLVED — current CI uses `validate:contract-authority` only |
| ErrorModel authority source | UNRESOLVED |
| Generated artifact inventory | UNRESOLVED |
| Generated client impact | UNRESOLVED |
| Workspace path authority | UNRESOLVED |
| Product route inventory | UNRESOLVED |
| Permission representation | UNRESOLVED |
| Error/disclosure mapping | UNRESOLVED |
| First eligible product route slice | UNRESOLVED |
| Persistent RBAC model | UNRESOLVED |

## 14. Candidate Next Paths

### Option A — Authority Pin Split Acceptance Decision Gate

Decision: SELECTED.

Reason:

The additional evidence is now sufficient for a decision gate to consider accepting the split as intentional and scope-based:

- `36da...` for current Backend Slice 0 CI-active contract authority validation.
- `04f54...` for broader/later contract validation including AI Runtime planning evidence.

### Option B — Validation Script Reconciliation Implementation Authorization Gate

Decision: NO-GO.

Reason:

No script change is needed before a split acceptance decision.

Implementation authorization remains premature.

### Option C — OpenAPI Mutation Gate

Decision: NO-GO.

Reason:

No OpenAPI mutation is required by the collected evidence.

### Option D — Product Route Inventory Review Gate

Decision: NO-GO.

Reason:

Product route inventory should wait until the authority pin split is formally accepted or otherwise reconciled.

### Option E — Permission Representation Decision Gate

Decision: NO-GO.

Reason:

Permission representation should wait until authority pin split is formally accepted or otherwise reconciled.

## 15. Selected Next Path

Selected next path:

`Backend Slice 0 Permission Guard OpenAPI Authority Pin Split Acceptance Decision Gate`

This selected path is documentation-only.

It must decide whether to accept the split as intentional and scope-based.

It must not modify scripts.

It must not modify package commands.

It must not modify CI workflow files.

It must not mutate OpenAPI.

It must not modify generated clients.

It must not add product or public routes.

It must not add DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 16. Decision on Validation Script Modification

Decision: NO-GO.

Reason:

The additional evidence supports a decision gate before any implementation authorization.

No change is authorized to:

- `scripts/validate-contract-authority.mjs`
- `scripts/validate-contracts.mjs`

## 17. Decision on Package Script Modification

Decision: NO-GO.

Reason:

No package script change is authorized.

No change is authorized to:

- `package.json`

## 18. Decision on CI Workflow Modification

Decision: NO-GO.

Reason:

CI behavior is now understood for current scope. No CI change is authorized.

No change is authorized to:

- `.github/workflows/ci.yml`
- any other CI workflow file

## 19. Decision on OpenAPI Mutation

Decision: NO-GO.

Reason:

This evidence collection gate does not authorize OpenAPI mutation.

No OpenAPI file may be changed.

## 20. Decision on Generated Clients

Decision: NO-GO.

Reason:

Generated client changes remain blocked.

No generated client changes are authorized.

## 21. Decision on Product Route Inventory

Decision: DEFER.

Reason:

Product route inventory depends on formal acceptance or reconciliation of the authority pin split.

## 22. Decision on Permission Representation

Decision: DEFER.

Reason:

Permission representation depends on formal acceptance or reconciliation of the authority pin split.

## 23. Decision on Error and Disclosure Mapping

Decision: DEFER.

Reason:

Route-specific 401, 403, and non-disclosing 404 behavior depends on OpenAPI response authority and product route inventory.

## 24. Decision on Persistent RBAC

Decision: NO-GO.

Reason:

Persistent RBAC requires separate data model, migration, resolver, and runtime enforcement authorization.

## 25. Risk Review

### 25.1 Contract Drift Risk

Risk:

The project may treat both pins as equivalent without documenting their scope difference.

Mitigation:

Proceed to a split acceptance decision gate.

### 25.2 CI Scope Risk

Risk:

`validate:contracts` exists but is not CI-active.

Mitigation:

Document the current distinction before deciding whether this is acceptable.

### 25.3 Future Scope Creep Risk

Risk:

Later AI/runtime planning authority could be mistaken as current Backend Slice 0 runtime authorization.

Mitigation:

Keep AI/runtime authority classified as later/broader planning evidence only.

### 25.4 Premature Script Change Risk

Risk:

Script changes could collapse two different validation scopes.

Mitigation:

Keep script modification blocked.

## 26. Final Decision

Decision: GO to Backend Slice 0 Permission Guard OpenAPI Authority Pin Split Acceptance Decision Gate.

This decision selects a documentation-only split acceptance decision gate.

This decision does not authorize implementation.

This decision does not authorize validation script modification.

This decision does not authorize package script modification.

This decision does not authorize CI workflow modification.

This decision does not authorize OpenAPI mutation.

This decision does not authorize generated client changes.

This decision does not authorize public/product route work.

This decision does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 27. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Permission Guard OpenAPI Authority Pin Split Acceptance Decision Gate`

That gate should decide whether to accept the observed split as intentional and scope-based.

## 28. Explicit Non-Authorization

This evidence collection gate does not authorize:

- runtime implementation;
- route implementation;
- controller implementation;
- product route implementation;
- public route implementation;
- OpenAPI mutation;
- validation script modification;
- package script modification;
- CI workflow modification;
- generated client changes;
- generated artifact regeneration;
- DB-backed permission resolver;
- ORM-backed permission resolver;
- permission migrations;
- workspace membership persistence;
- deployment changes;
- secrets changes;
- UI changes;
- workflow changes;
- formatting baseline cleanup.

## 29. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged OpenAPI Authority Pin Reconciliation Evidence Decision Gate.
- Merged OpenAPI Authority Pin Reconciliation Evidence Review Gate.
- Merged OpenAPI Authority Pin Reconciliation Planning Review Gate.
- Merged OpenAPI Authority Pin Reconciliation Planning Gate.
- Merged OpenAPI Authority Pin Reconciliation Decision Gate.
- Merged OpenAPI Authority Source Confirmation Gate.
- Merged OpenAPI Authority Inventory Decision Gate.
- Merged OpenAPI Authority Inventory Review Gate.
- Merged OpenAPI RBAC Contract Alignment Decision Gate.
- `scripts/validate-contract-authority.mjs`.
- `scripts/validate-contracts.mjs`.
- `package.json`.
- `.github/workflows/ci.yml`.
- `henter36/nashir` authority repository evidence.
- Authority pin existence evidence.
- Authority pin ancestry evidence.
- Required authority file availability evidence.
- Existing Auth0 identity-only boundary.
- Existing route/path `workspaceId` authority.
- Existing workspace-before-permission ordering.
- Existing membership-before-permission ordering.
- Existing internal harness-only permission guard app wiring.
- Existing contract-first governance.

### Outputs

- Confirmed authority repository path: `henter36/nashir`.
- Confirmed both authority pins exist.
- Confirmed `04f54...` is later than `36da...`.
- Confirmed current CI uses `36da...`.
- Confirmed current CI runs `validate:contract-authority`.
- Confirmed current CI does not run `validate:contracts`.
- Confirmed `validate:contracts` references broader/later AI Runtime planning evidence.
- Classified the split as likely scope-based.
- Rejected script/package/CI/OpenAPI/generated-client modifications.
- Selected Pin Split Acceptance Decision Gate as the next gate.

### Gaps

- Formal authority pin split acceptance unresolved.
- ErrorModel authority source unresolved.
- Generated artifact inventory unresolved.
- Generated client impact unresolved.
- Workspace path authority unresolved.
- Product route inventory unresolved.
- Permission representation unresolved.
- Error/disclosure mapping unresolved.
- First eligible product route slice unresolved.
- Persistent RBAC model unresolved.

### Transition Decision

GO to `Backend Slice 0 Permission Guard OpenAPI Authority Pin Split Acceptance Decision Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
