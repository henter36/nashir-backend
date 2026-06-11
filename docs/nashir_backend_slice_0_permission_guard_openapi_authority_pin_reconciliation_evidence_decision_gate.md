# Nashir Backend Slice 0 — Permission Guard OpenAPI Authority Pin Reconciliation Evidence Decision Gate

## 1. Gate Classification

Gate type: Documentation-only evidence decision gate.

This gate decides the next safe path after the OpenAPI Authority Pin Reconciliation Evidence Review Gate.

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

- Merged PR #87: `docs: review permission guard openapi authority pin reconciliation evidence`.
- Merged PR #86: `docs: review permission guard openapi authority pin reconciliation planning`.
- Merged PR #85: `docs: plan permission guard openapi authority pin reconciliation`.
- Merged PR #84: `docs: decide permission guard openapi authority pin reconciliation`.
- Merged PR #83: `docs: confirm permission guard openapi authority source`.
- Merged PR #82: `docs: decide permission guard openapi authority inventory`.
- Merged PR #81: `docs: review permission guard openapi authority inventory`.
- Merged PR #80: `docs: decide permission guard openapi rbac contract alignment`.
- Evidence classification for `scripts/validate-contract-authority.mjs`.
- Evidence classification for `scripts/validate-contracts.mjs`.
- Evidence classification for package validation commands.
- Evidence classification for authority pins.
- Evidence classification for required authority file sets.
- Evidence classification for generated client absence checks.
- Evidence classification for copied authority file absence checks.
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

## 3. Decision Objective

This gate must choose exactly one next path based on the collected evidence.

The decision must avoid:

- accepting authority pin split without sufficient evidence;
- modifying validation scripts prematurely;
- mutating OpenAPI prematurely;
- introducing generated clients prematurely;
- starting product route inventory against an unresolved authority boundary;
- selecting permission representation against an unresolved authority boundary.

## 4. Evidence Summary

The evidence review confirmed:

1. `scripts/validate-contract-authority.mjs` exists.
2. `scripts/validate-contracts.mjs` exists.
3. `package.json` exposes both validation commands.
4. Both validation paths depend on an external authority repository.
5. Both validation paths include `docs/nashir_v1_openapi.yaml`.
6. The authority pins differ.
7. The required authority file sets differ.
8. Generated client absence checks exist.
9. Copied authority file absence checks exist.
10. CI validation behavior remains unresolved.
11. Script ownership remains unresolved.
12. The pin split may be intentional, stale, legacy, or unresolved.
13. The available evidence is insufficient to safely accept or modify the split.

## 5. Evidence Decision Matrix

| Decision candidate | Result | Reason |
|---|---:|---|
| Accept split pins as intentional | NO-GO | Evidence does not yet prove the split is intentional. |
| Authorize validation script modification | NO-GO | Code/script changes require stronger evidence and explicit implementation authorization. |
| Authorize OpenAPI mutation | NO-GO | Authority pin status remains unresolved. |
| Authorize generated client work | NO-GO | Generated client work depends on stable or accepted authority. |
| Proceed to product route inventory | NO-GO | Product route inventory depends on stable or accepted OpenAPI authority. |
| Proceed to permission representation decision | NO-GO | Permission representation depends on stable or accepted authority. |
| Collect additional authority evidence | SELECTED | Missing evidence is narrow and must be collected before acceptance or implementation. |

## 6. Selected Next Path

Selected next path:

`Backend Slice 0 Permission Guard OpenAPI Authority Additional Evidence Collection Gate`

This selected path is documentation-only.

This selected path must collect missing authority evidence.

This selected path must not modify scripts.

This selected path must not modify package commands.

This selected path must not modify CI workflow files.

This selected path must not mutate OpenAPI.

This selected path must not modify generated clients.

This selected path must not add product or public routes.

This selected path must not add DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 7. Why Additional Evidence Is Required

The evidence review identified the mismatch, but did not prove intent.

The following facts remain unresolved:

- whether the two authority pins are intentionally different;
- whether one pin is stale;
- whether one validation script is legacy;
- whether both scripts are current but validate different scopes;
- whether CI uses one or both validation commands;
- whether the external authority repository still contains both pinned commits;
- whether the file-set difference maps to separate authority scopes;
- whether future product route inventory should depend on one script, both scripts, or a reconciled script.

Because these are unresolved, the project should collect additional evidence before accepting, reconciling, or modifying the validation boundary.

## 8. Required Evidence for the Selected Next Gate

The selected Additional Evidence Collection Gate must collect:

- exact current repository location of the external authority repository;
- whether `36da9ed31903562bddfb7ffd669841956e334a51` exists in the authority repository;
- whether `04f54f8be852001173f4014cb2d81c5cdb97e35c` exists in the authority repository;
- whether either pin is ancestor/descendant of the other;
- whether each required authority file exists at each pin;
- whether CI runs `validate:contract-authority`;
- whether CI runs `validate:contracts`;
- whether CI supplies `NASHIR_AUTHORITY_REPO`;
- whether CI checks out the external authority repository;
- whether the package command names reflect separate validation scopes;
- whether prior authority docs identify one pin as superseding the other;
- whether previous gates explain why AI/runtime planning evidence is included in one validation path but not the other.

## 9. Read-Only Evidence Collection Commands

The selected next gate may use read-only commands only.

Suggested local backend commands:

```bash
git status -sb
git log --oneline -5
git grep -E -n "PINNED_AUTHORITY_SHA|EXPECTED_AUTHORITY_COMMIT|AUTHORITY_FILES|REQUIRED_CONTRACT_FILES"
git grep -E -n "validate:contract-authority|validate:contracts"
git grep -E -n "NASHIR_AUTHORITY_REPO|--authority-repo"
find .github/workflows -maxdepth 2 -type f -print
grep -E -R "validate:contract-authority|validate:contracts|NASHIR_AUTHORITY_REPO|authority-repo" .github/workflows || true
git diff --check
```

Suggested external authority repository commands, only after the authority repository path is explicitly confirmed:

```bash
git cat-file -e 36da9ed31903562bddfb7ffd669841956e334a51^{commit}
git cat-file -e 04f54f8be852001173f4014cb2d81c5cdb97e35c^{commit}
git merge-base --is-ancestor 36da9ed31903562bddfb7ffd669841956e334a51 04f54f8be852001173f4014cb2d81c5cdb97e35c || true
git merge-base --is-ancestor 04f54f8be852001173f4014cb2d81c5cdb97e35c 36da9ed31903562bddfb7ffd669841956e334a51 || true
git ls-tree -r --name-only 36da9ed31903562bddfb7ffd669841956e334a51 -- docs/nashir_v1_openapi.yaml docs/nashir_auth_rbac_workspace_identity_gate.md docs/nashir_auth_rbac_openapi_alignment_final_re_review_gate.md docs/nashir_backend_slice_0_contract_safe_infrastructure_validation_action_gate.md docs/nashir_ai_agent_runtime_selection_planning_gate.md
git ls-tree -r --name-only 04f54f8be852001173f4014cb2d81c5cdb97e35c -- docs/nashir_v1_openapi.yaml docs/nashir_auth_rbac_workspace_identity_gate.md docs/nashir_auth_rbac_openapi_alignment_final_re_review_gate.md docs/nashir_backend_slice_0_contract_safe_infrastructure_validation_action_gate.md docs/nashir_ai_agent_runtime_selection_planning_gate.md
```

These commands are review-only.

They do not authorize edits.

## 10. Required Outputs for the Selected Next Gate

The Additional Evidence Collection Gate must output:

* confirmed authority repository path;
* existence result for both pins;
* ancestry relationship between both pins;
* file availability at both pins;
* CI validation command evidence;
* package command scope evidence;
* classification of whether the split appears intentional, stale, legacy, or still unresolved;
* recommended next gate.

## 11. Candidate Next Gates After Additional Evidence

The Additional Evidence Collection Gate may recommend exactly one of:

1. `Backend Slice 0 Permission Guard OpenAPI Authority Pin Split Acceptance Decision Gate`
2. `Backend Slice 0 Permission Guard OpenAPI Authority Pin Reconciliation Planning Gate`
3. `Backend Slice 0 Permission Guard Validation Script Reconciliation Implementation Authorization Gate`
4. `Backend Slice 0 Permission Guard OpenAPI Authority Evidence Insufficient Decision Gate`
5. `Backend Slice 0 Permission Guard Product Route Inventory Review Gate`, only if authority split is accepted or reconciled
6. `Backend Slice 0 Permission Guard Permission Representation Decision Gate`, only if authority split is accepted or reconciled

## 12. Decision on Authority Pin Split Acceptance

Decision: NO-GO.

Reason:

The evidence review shows the split exists, but does not prove it is intentional or safe.

Acceptance requires additional evidence.

## 13. Decision on Validation Script Reconciliation

Decision: NO-GO.

Reason:

The evidence review does not yet prove which script, pin, or file set should be changed.

Any future reconciliation requires additional evidence and then a later explicit implementation authorization gate.

## 14. Decision on Validation Script Modification

Decision: NO-GO.

Reason:

Validation script modification is a code change and remains unauthorized.

No changes are authorized to:

* `scripts/validate-contract-authority.mjs`
* `scripts/validate-contracts.mjs`

## 15. Decision on Package Script Modification

Decision: NO-GO.

Reason:

Package script modification may alter validation behavior and remains unauthorized.

No changes are authorized to:

* `package.json`

## 16. Decision on CI Workflow Modification

Decision: NO-GO.

Reason:

CI workflow modification may alter validation behavior and remains unauthorized.

No changes are authorized to:

* `.github/workflows/ci.yml`
* any other CI workflow file

## 17. Decision on OpenAPI Mutation

Decision: NO-GO.

Reason:

OpenAPI mutation requires stable or accepted authority.

No OpenAPI file may be changed.

## 18. Decision on Generated Clients

Decision: NO-GO.

Reason:

Generated client work requires stable or accepted authority and generated artifact inventory.

No generated client changes are authorized.

## 19. Decision on Product Route Inventory

Decision: DEFER.

Reason:

Product route inventory depends on stable or accepted OpenAPI authority.

No product route inventory is authorized.

## 20. Decision on Permission Representation

Decision: DEFER.

Reason:

Permission representation depends on stable or accepted OpenAPI authority.

No permission representation model is selected.

## 21. Decision on Error and Disclosure Mapping

Decision: DEFER.

Reason:

Route-specific 401, 403, and non-disclosing 404 behavior depends on OpenAPI response authority and product route inventory.

No route-specific mapping is selected.

## 22. Decision on Persistent RBAC

Decision: NO-GO.

Reason:

Persistent RBAC requires permission source authority, role/permission model, membership versus permission grant separation, data model review, migration authorization, and runtime resolver authorization.

These remain future work.

## 23. Risk Review

### 23.1 Contract Drift Risk

Risk:

Different validation scripts may continue to depend on different authority snapshots.

Decision:

Do not accept the split yet.

### 23.2 Stale Pin Risk

Risk:

One authority pin may be stale.

Decision:

Collect pin existence and ancestry evidence before acceptance.

### 23.3 CI Blind Spot Risk

Risk:

CI may run only one validation path.

Decision:

Collect CI validation evidence before downstream gates.

### 23.4 Premature Script Change Risk

Risk:

Script changes may remove guardrails before their purpose is understood.

Decision:

Keep script modification blocked.

### 23.5 Downstream Sequencing Risk

Risk:

Product route inventory and permission representation may bind to the wrong authority snapshot.

Decision:

Keep downstream gates deferred.

## 24. Final Decision

Decision: GO to Backend Slice 0 Permission Guard OpenAPI Authority Additional Evidence Collection Gate.

This decision selects a documentation-only evidence collection gate.

This decision does not authorize implementation.

This decision does not authorize validation script modification.

This decision does not authorize package script modification.

This decision does not authorize CI workflow modification.

This decision does not authorize OpenAPI mutation.

This decision does not authorize generated client changes.

This decision does not authorize public/product route work.

This decision does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 25. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Permission Guard OpenAPI Authority Additional Evidence Collection Gate`

That gate should collect the missing pin, file-set, CI, and authority repository evidence before any acceptance, reconciliation, or implementation authorization decision.

## 26. Explicit Non-Authorization

This evidence decision gate does not authorize:

* runtime implementation;
* route implementation;
* controller implementation;
* product route implementation;
* public route implementation;
* OpenAPI mutation;
* validation script modification;
* package script modification;
* CI workflow modification;
* generated client changes;
* generated artifact regeneration;
* DB-backed permission resolver;
* ORM-backed permission resolver;
* permission migrations;
* workspace membership persistence;
* deployment changes;
* secrets changes;
* UI changes;
* workflow changes;
* formatting baseline cleanup.

## 27. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

* Merged OpenAPI Authority Pin Reconciliation Evidence Review Gate.
* Merged OpenAPI Authority Pin Reconciliation Planning Review Gate.
* Merged OpenAPI Authority Pin Reconciliation Planning Gate.
* Merged OpenAPI Authority Pin Reconciliation Decision Gate.
* Merged OpenAPI Authority Source Confirmation Gate.
* Merged OpenAPI Authority Inventory Decision Gate.
* Merged OpenAPI Authority Inventory Review Gate.
* Merged OpenAPI RBAC Contract Alignment Decision Gate.
* Evidence that authority pins differ.
* Evidence that required authority file sets differ.
* Evidence that generated client absence checks exist.
* Evidence that copied authority file absence checks exist.
* Existing Auth0 identity-only boundary.
* Existing route/path `workspaceId` authority.
* Existing workspace-before-permission ordering.
* Existing membership-before-permission ordering.
* Existing internal harness-only permission guard app wiring.
* Existing contract-first governance.

### Outputs

* Rejected immediate split acceptance.
* Rejected immediate validation script modification.
* Rejected immediate package script modification.
* Rejected immediate CI workflow modification.
* Rejected OpenAPI mutation.
* Rejected generated client work.
* Deferred product route inventory.
* Deferred permission representation.
* Selected additional authority evidence collection as the next gate.
* Preserved all non-authorization boundaries.

### Gaps

* Authority repository path confirmation unresolved.
* Authority pin existence unresolved.
* Authority pin ancestry unresolved.
* Required authority file availability at each pin unresolved.
* Validation script ownership unresolved.
* Package script responsibility unresolved.
* CI validation behavior unresolved.
* ErrorModel authority source unresolved.
* Generated artifact inventory unresolved.
* Generated client impact unresolved.
* Workspace path authority unresolved.
* Product route inventory unresolved.
* Permission representation unresolved.
* Error/disclosure mapping unresolved.
* First eligible product route slice unresolved.
* Persistent RBAC model unresolved.

### Transition Decision

GO to `Backend Slice 0 Permission Guard OpenAPI Authority Additional Evidence Collection Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
