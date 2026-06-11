# Nashir Backend Slice 0 — Permission Guard OpenAPI Authority Pin Reconciliation Evidence Review Gate

## 1. Gate Classification

Gate type: Documentation-only evidence review gate.

This gate collects and classifies evidence for the OpenAPI authority pin mismatch and required authority file-set mismatch.

This gate does not authorize implementation.

This gate does not authorize validation script modification.

This gate does not authorize OpenAPI mutation.

This gate does not authorize generated client changes.

This gate does not authorize public route implementation.

This gate does not authorize product route implementation.

This gate does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

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
- `.github/workflows/ci.yml`, where available.
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

## 3. Evidence Review Objective

This gate reviews repository evidence before any reconciliation decision.

This gate must classify:

- validation scripts;
- package commands;
- pinned authority references;
- required authority file sets;
- authority repository input behavior;
- generated client absence checks;
- copied authority file absence checks;
- CI validation behavior.

This gate must not edit any file.

This gate must not decide implementation authorization.

This gate must not decide OpenAPI mutation.

## 4. Evidence Collection Summary

The current evidence indicates that the backend repository contains two validation views:

1. `scripts/validate-contract-authority.mjs`
2. `scripts/validate-contracts.mjs`

Both are relevant to contract authority validation.

The evidence also shows that they reference different authority pins and different required file sets.

This is a contract governance concern, not a runtime implementation task.

## 5. Evidence: `scripts/validate-contract-authority.mjs`

Evidence collected from `scripts/validate-contract-authority.mjs`:

| Evidence item | Observed value | Review classification |
|---|---|---|
| Script path | `scripts/validate-contract-authority.mjs` | Authority boundary validation script |
| Authority repository input | `--authority-repo` or `NASHIR_AUTHORITY_REPO` | External authority repository required |
| Pinned authority reference | `36da9ed31903562bddfb7ffd669841956e334a51` | Current/legacy/intentional status unresolved |
| OpenAPI authority file included | `docs/nashir_v1_openapi.yaml` | OpenAPI authority candidate present |
| Auth/RBAC/workspace authority file included | `docs/nashir_auth_rbac_workspace_identity_gate.md` | Relevant to identity/workspace boundary |
| OpenAPI alignment authority file included | `docs/nashir_auth_rbac_openapi_alignment_final_re_review_gate.md` | Relevant to OpenAPI/RBAC alignment |
| Backend Slice 0 contract validation authority file included | `docs/nashir_backend_slice_0_contract_safe_infrastructure_validation_action_gate.md` | Relevant to backend contract-safe validation |
| Copied authority files in backend | Expected absent | Prevents backend-local authority drift |
| Generated client directories | Expected absent | Prevents generated artifact drift |
| Workflow exception | `.github/workflows/ci.yml` allowed where applicable | CI validation boundary evidence |

Review classification:

`validate-contract-authority.mjs` appears to be a narrow authority-boundary validation script focused on preventing copied authority files, preventing generated clients, and validating a pinned external authority set.

Open question:

The status of pin `36da9ed31903562bddfb7ffd669841956e334a51` remains unresolved.

## 6. Evidence: `scripts/validate-contracts.mjs`

Evidence collected from `scripts/validate-contracts.mjs`:

| Evidence item | Observed value | Review classification |
|---|---|---|
| Script path | `scripts/validate-contracts.mjs` | Contract validation script |
| Authority repository input | `--authority-repo` or `NASHIR_AUTHORITY_REPO` | External authority repository required |
| Expected authority commit | `04f54f8be852001173f4014cb2d81c5cdb97e35c` | Current/legacy/intentional status unresolved |
| Required OpenAPI file | `docs/nashir_v1_openapi.yaml` | OpenAPI authority candidate present |
| Required AI/runtime planning file | `docs/nashir_ai_agent_runtime_selection_planning_gate.md` | Broader contract/readiness evidence |
| Validation scope | Contract file existence and expected authority commit | Broader or separate scope likely, but unresolved |

Review classification:

`validate-contracts.mjs` appears to be a broader contract validation script than `validate-contract-authority.mjs`, but its exact ownership and currentness remain unresolved.

Open question:

The status of expected commit `04f54f8be852001173f4014cb2d81c5cdb97e35c` remains unresolved.

## 7. Evidence: `package.json`

Evidence collected from `package.json`:

| Package script | Observed command | Review classification |
|---|---|---|
| `validate:contract-authority` | `node scripts/validate-contract-authority.mjs` | Authority boundary validation command |
| `validate:contracts` | `node scripts/validate-contracts.mjs` | Contract validation command |

Review classification:

`package.json` exposes both validation paths as first-class commands.

This suggests both scripts may be intentionally retained, but it does not by itself prove whether the different pins are intentional.

Open question:

The package command naming does not fully resolve which command is authoritative for Backend Slice 0 OpenAPI/RBAC/workspace validation.

## 8. Evidence: Authority Repository Input Behavior

Both validation scripts require an external authority repository through one of:

- `--authority-repo`
- `NASHIR_AUTHORITY_REPO`

Review classification:

OpenAPI authority remains external to `henter36/nashir-backend`.

Backend-local OpenAPI mutation remains unauthorized.

Authority repository input behavior is consistent with contract-first governance.

## 9. Evidence: Authority Pin Mismatch

Observed authority references:

| Script | Authority reference | Classification |
|---|---|---|
| `scripts/validate-contract-authority.mjs` | `36da9ed31903562bddfb7ffd669841956e334a51` | unresolved |
| `scripts/validate-contracts.mjs` | `04f54f8be852001173f4014cb2d81c5cdb97e35c` | unresolved |

Evidence review result:

The authority pins are different.

This difference may be:

- intentional split by validation scope;
- stale pin in one script;
- legacy validation behavior;
- broader versus narrower contract authority boundary;
- unresolved contract drift.

This evidence is not enough to authorize script changes directly.

## 10. Evidence: Required Authority File-Set Mismatch

Observed file-set difference:

| Script | Required authority files | Classification |
|---|---|---|
| `scripts/validate-contract-authority.mjs` | `docs/nashir_v1_openapi.yaml`; `docs/nashir_auth_rbac_workspace_identity_gate.md`; `docs/nashir_auth_rbac_openapi_alignment_final_re_review_gate.md`; `docs/nashir_backend_slice_0_contract_safe_infrastructure_validation_action_gate.md` | OpenAPI/RBAC/workspace/backend contract-safe authority set |
| `scripts/validate-contracts.mjs` | `docs/nashir_v1_openapi.yaml`; `docs/nashir_ai_agent_runtime_selection_planning_gate.md` | OpenAPI plus broader AI/runtime planning evidence |

Evidence review result:

The file sets are different.

This difference may be intentional, but the current evidence does not confirm that.

The file-set mismatch should be decided in a follow-up evidence decision gate.

## 11. Evidence: Generated Client Absence Boundary

Evidence from `scripts/validate-contract-authority.mjs` indicates generated client directories are expected to be absent from backend:

- `src/generated`
- `generated`
- `openapi-generated`

Review classification:

Generated clients remain blocked in this backend stage.

No generated client inventory or regeneration is authorized by this evidence review.

## 12. Evidence: Copied Authority File Absence Boundary

Evidence from `scripts/validate-contract-authority.mjs` indicates copied authority files are expected to be absent from backend.

Review classification:

Backend must not become the editable source of copied contract authority files at this stage.

This supports the current boundary that OpenAPI authority remains external.

## 13. Evidence: CI Workflow Behavior

Evidence status: PARTIAL / REQUIRES REVIEW.

The planning gate required CI workflow behavior to be inspected where relevant.

This evidence review should not assume CI behavior unless commands or workflow content explicitly prove it.

Required future review evidence:

- whether CI runs `validate:contract-authority`;
- whether CI runs `validate:contracts`;
- whether CI uses `NASHIR_AUTHORITY_REPO`;
- whether CI checks out the external authority repository;
- whether CI only runs one of the validation commands.

Evidence review decision:

CI validation behavior remains unresolved unless separately verified in the PR review process.

## 14. Evidence Classification Matrix

| Item | Evidence classification | Current status |
|---|---|---|
| `scripts/validate-contract-authority.mjs` | Authority boundary validator | current/legacy status unresolved |
| `scripts/validate-contracts.mjs` | Contract validation script | current/legacy status unresolved |
| `validate:contract-authority` | Package command for authority validation | active package command |
| `validate:contracts` | Package command for contract validation | active package command |
| `36da9ed31903562bddfb7ffd669841956e334a51` | Pinned authority SHA | unresolved |
| `04f54f8be852001173f4014cb2d81c5cdb97e35c` | Expected authority commit | unresolved |
| `docs/nashir_v1_openapi.yaml` | Common OpenAPI authority candidate | shared across both file sets |
| OpenAPI/RBAC/workspace file set | Narrow authority boundary candidate | unresolved |
| AI/runtime planning file set | Broader contract validation candidate | unresolved |
| generated client absence checks | Guardrail against generated drift | active boundary |
| copied authority file absence checks | Guardrail against backend authority drift | active boundary |

## 15. Evidence-Based Findings

### Finding 1 — OpenAPI authority is external

Result: PASS.

Both validation paths depend on an external authority repository.

### Finding 2 — `docs/nashir_v1_openapi.yaml` is common to both views

Result: PASS.

Both validation scripts include the OpenAPI authority candidate.

### Finding 3 — Authority pins differ

Result: OPEN GAP.

The two validation scripts reference different authority commits.

### Finding 4 — Required file sets differ

Result: OPEN GAP.

The two validation scripts require different supporting authority files.

### Finding 5 — Script ownership remains unresolved

Result: OPEN GAP.

The repository exposes both scripts, but the current evidence does not fully state which script is authoritative for which future backend gate.

### Finding 6 — Direct script modification remains unsafe

Result: PASS.

The current evidence is not enough to authorize direct script modification.

## 16. Candidate Interpretations

### Interpretation A — Intentional split

The two scripts may intentionally validate different scopes:

- one for OpenAPI/RBAC/workspace/backend authority boundary;
- one for broader contract validation.

Status: plausible but not proven.

### Interpretation B — Stale pin

One of the two pinned authority references may be stale.

Status: plausible but not proven.

### Interpretation C — Legacy script

One script may be legacy or superseded.

Status: plausible but not proven.

### Interpretation D — Naming ambiguity

Both scripts may be valid, but package command names and future gate language may need clarification.

Status: plausible but not proven.

## 17. Evidence Review Decision Options

### Option A — Accept the split pins as intentional

Decision: NO-GO for this gate.

Reason:

Evidence is not sufficient to accept the split as intentional.

### Option B — Authorize validation script reconciliation implementation

Decision: NO-GO.

Reason:

Implementation authorization remains premature.

### Option C — Proceed to product route inventory

Decision: NO-GO.

Reason:

Product route inventory depends on stable or intentionally accepted authority pins.

### Option D — Proceed to permission representation decision

Decision: NO-GO.

Reason:

Permission representation depends on stable or intentionally accepted authority pins.

### Option E — Proceed to evidence decision gate

Decision: SELECTED.

Reason:

The next safe step is a decision gate that evaluates the evidence and selects one of:

- accept split pins as intentional;
- plan validation script reconciliation;
- collect additional authority evidence;
- keep downstream gates blocked.

## 18. Selected Next Path

Selected next path:

`Backend Slice 0 Permission Guard OpenAPI Authority Pin Reconciliation Evidence Decision Gate`

This selected path is documentation-only.

It must not modify scripts.

It must not mutate OpenAPI.

It must not modify generated clients.

It must not add routes.

It must not add DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 19. Required Inputs for the Selected Evidence Decision Gate

The evidence decision gate must review:

- this evidence review gate;
- exact authority pins;
- exact required authority file sets;
- package command evidence;
- CI workflow evidence, if available;
- copied authority file absence boundary;
- generated client absence boundary;
- prior OpenAPI/RBAC/workspace authority gates;
- downstream dependency risks.

## 20. Required Outputs for the Selected Evidence Decision Gate

The evidence decision gate must decide one next path:

1. Authority Pin Split Acceptance Decision Gate.
2. Validation Script Reconciliation Planning Gate.
3. Validation Script Reconciliation Implementation Authorization Gate, only if planning/review support it.
4. Additional Authority Evidence Collection Gate.
5. Product Route Inventory Review Gate, only if authority split is accepted or reconciled.
6. Permission Representation Decision Gate, only if authority split is accepted or reconciled.

## 21. Decision on Validation Script Modification

Decision: NO-GO.

Reason:

This evidence review does not authorize changing:

- `scripts/validate-contract-authority.mjs`
- `scripts/validate-contracts.mjs`
- `package.json`
- `.github/workflows/ci.yml`

Any future modification requires a later explicit implementation authorization gate.

## 22. Decision on OpenAPI Mutation

Decision: NO-GO.

Reason:

OpenAPI mutation requires stable authority ownership and a later explicit OpenAPI mutation gate.

No OpenAPI file may be changed.

## 23. Decision on Generated Clients

Decision: NO-GO.

Reason:

Generated client changes require reconciled authority pins and generated artifact inventory.

No generated client changes are authorized.

## 24. Decision on Product Route Inventory

Decision: DEFER.

Reason:

Product route inventory depends on stable or intentionally accepted authority pins.

No product route inventory is authorized.

## 25. Decision on Permission Representation

Decision: DEFER.

Reason:

Permission representation depends on stable or intentionally accepted authority pins.

No permission representation model is selected.

## 26. Decision on Error and Disclosure Mapping

Decision: DEFER.

Reason:

Route-specific 401, 403, and non-disclosing 404 behavior depends on OpenAPI response authority and product route inventory.

No route-specific mapping is selected.

## 27. Decision on Persistent RBAC

Decision: NO-GO.

Reason:

Persistent RBAC requires permission source authority, role/permission model, membership versus permission grant separation, data model review, migration authorization, and runtime resolver authorization.

These remain future work.

## 28. Risk Review

### 28.1 Contract Drift Risk

Risk:

Different validation scripts may continue to depend on different authority snapshots.

Evidence review result:

Risk remains active.

Mitigation:

Move to an evidence decision gate before downstream route or permission gates.

### 28.2 Stale Pin Risk

Risk:

One authority pin may be stale.

Evidence review result:

Risk remains active.

Mitigation:

Require evidence decision before accepting either pin as current.

### 28.3 File-Set Drift Risk

Risk:

Different authority file sets may represent different product scopes without enough documentation.

Evidence review result:

Risk remains active.

Mitigation:

Require evidence decision before proceeding to route inventory or generated artifact inventory.

### 28.4 Premature Script Change Risk

Risk:

Script changes may remove guardrails before their purpose is understood.

Evidence review result:

Risk remains active.

Mitigation:

Keep script modification blocked.

### 28.5 Downstream Route Sequencing Risk

Risk:

Product route inventory may proceed against the wrong authority snapshot.

Evidence review result:

Risk remains active.

Mitigation:

Keep product route inventory deferred.

## 29. Evidence Review Summary

Evidence review result: PASS for evidence collection, OPEN GAP for reconciliation.

Confirmed evidence:

- two validation scripts exist;
- two package commands exist;
- both validation paths use external authority repository input;
- both include `docs/nashir_v1_openapi.yaml`;
- authority pins differ;
- required file sets differ;
- generated client absence boundary exists;
- copied authority file absence boundary exists;
- CI behavior still requires explicit classification unless separately verified.

Conclusion:

The project has enough evidence to proceed to an evidence decision gate, but not enough to authorize code changes or downstream product route planning.

## 30. Gaps

Known unresolved gaps after this evidence review gate:

- Authority pin reconciliation unresolved.
- Required authority file-set reconciliation unresolved.
- Validation script ownership unresolved.
- Package script responsibility unresolved.
- CI validation behavior unresolved.
- ErrorModel authority source unresolved.
- Generated artifact inventory unresolved.
- Generated client impact unresolved.
- Workspace path authority unresolved.
- Product route inventory unresolved.
- Permission representation unresolved.
- Error/disclosure mapping unresolved.
- First eligible product route slice unresolved.
- Persistent RBAC model unresolved.

## 31. Final Decision

Decision: GO to Backend Slice 0 Permission Guard OpenAPI Authority Pin Reconciliation Evidence Decision Gate.

This decision selects a documentation-only evidence decision gate.

This decision does not authorize implementation.

This decision does not authorize validation script modification.

This decision does not authorize OpenAPI mutation.

This decision does not authorize generated client changes.

This decision does not authorize public/product route work.

This decision does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 32. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Permission Guard OpenAPI Authority Pin Reconciliation Evidence Decision Gate`

That gate should select exactly one next path based on this evidence review.

## 33. Explicit Non-Authorization

This evidence review gate does not authorize:

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

## 34. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

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
- CI workflow evidence, if available.
- Existing Auth0 identity-only boundary.
- Existing route/path `workspaceId` authority.
- Existing workspace-before-permission ordering.
- Existing membership-before-permission ordering.
- Existing internal harness-only permission guard app wiring.
- Existing contract-first governance.

### Outputs

- Collected validation script evidence.
- Collected package command evidence.
- Collected authority pin evidence.
- Collected authority file-set evidence.
- Confirmed common OpenAPI authority candidate.
- Confirmed pin mismatch remains unresolved.
- Confirmed file-set mismatch remains unresolved.
- Confirmed script ownership remains unresolved.
- Confirmed generated client absence boundary.
- Confirmed copied authority file absence boundary.
- Selected evidence decision as the next gate.
- Preserved all non-authorization boundaries.

### Gaps

- Authority pin reconciliation unresolved.
- Required authority file-set reconciliation unresolved.
- Validation script ownership unresolved.
- Package script responsibility unresolved.
- CI validation behavior unresolved.
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

GO to `Backend Slice 0 Permission Guard OpenAPI Authority Pin Reconciliation Evidence Decision Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
