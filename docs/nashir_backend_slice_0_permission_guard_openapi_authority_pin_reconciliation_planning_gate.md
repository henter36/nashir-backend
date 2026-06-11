# Nashir Backend Slice 0 — Permission Guard OpenAPI Authority Pin Reconciliation Planning Gate

## 1. Gate Classification

Gate type: Documentation-only planning gate.

This gate plans how to reconcile the OpenAPI authority pin mismatch and required authority file-set mismatch identified by the completed OpenAPI Authority Source Confirmation Gate and OpenAPI Authority Pin Reconciliation Decision Gate.

This gate does not authorize implementation.

This gate does not authorize validation script modification.

This gate does not authorize OpenAPI mutation.

This gate does not authorize generated client changes.

This gate does not authorize public route implementation.

This gate does not authorize product route implementation.

This gate does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 2. Inputs Reviewed

Inputs reviewed:

- Merged PR #84: `docs: decide permission guard openapi authority pin reconciliation`.
- Merged PR #83: `docs: confirm permission guard openapi authority source`.
- Merged PR #82: `docs: decide permission guard openapi authority inventory`.
- Merged PR #81: `docs: review permission guard openapi authority inventory`.
- Merged PR #80: `docs: decide permission guard openapi rbac contract alignment`.
- `scripts/validate-contract-authority.mjs`.
- `scripts/validate-contracts.mjs`.
- `package.json`.
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

## 3. Planning Objective

This planning gate defines the safe review path for reconciling the authority pin mismatch and authority file-set mismatch.

This gate must answer what should be reviewed next before any future script modification, OpenAPI mutation, generated artifact review, product route inventory, or permission representation decision.

This gate does not choose the final reconciliation outcome.

This gate does not edit any validation script.

## 4. Documented Facts

The previous decision and source confirmation gates documented the following facts:

1. OpenAPI authority is external to `henter36/nashir-backend` for the current Backend Slice 0 stage.
2. `docs/nashir_v1_openapi.yaml` is the known OpenAPI authority candidate.
3. Backend-local OpenAPI mutation remains unauthorized.
4. Generated client changes remain unauthorized.
5. Product/public route implementation remains unauthorized.
6. DB, ORM, and migrations remain unauthorized.
7. A pinned authority reference mismatch exists between validation scripts.
8. A required authority file-set mismatch exists between validation scripts.
9. Validation script modification remains unauthorized.
10. Product route inventory remains deferred.
11. Permission representation remains deferred.
12. Error/disclosure mapping remains deferred.

## 5. Reconciliation Problem

The backend repository currently has at least two contract validation paths:

- `scripts/validate-contract-authority.mjs`
- `scripts/validate-contracts.mjs`

These scripts appear to validate different authority snapshots and different required authority file sets.

This creates a sequencing risk:

- product route inventory may rely on the wrong contract snapshot;
- permission representation may attach to the wrong authority surface;
- generated artifact review may derive from the wrong source;
- OpenAPI mutation planning may target the wrong authority pin;
- future validation script changes may remove guardrails without understanding why both scripts exist.

## 6. Planning Boundaries

### 6.1 In Scope

This planning gate may plan review of:

- authority pin ownership;
- authority SHA purpose;
- required authority file-set purpose;
- validation script responsibility;
- package script responsibility;
- CI validation behavior;
- generated client absence checks;
- copied authority file absence checks;
- whether future code changes may need authorization;
- which gate should come after planning review.

### 6.2 Out of Scope

This planning gate must not:

- modify `scripts/validate-contract-authority.mjs`;
- modify `scripts/validate-contracts.mjs`;
- modify `package.json`;
- modify CI workflows;
- modify OpenAPI files;
- modify generated clients;
- add product routes;
- add public routes;
- add runtime permission enforcement;
- add DB, ORM, or migrations;
- change deployment or secrets;
- change UI or workflow files;
- perform formatting baseline cleanup.

## 7. Candidate Files for Future Review

The following files may be reviewed by the next planning review gate:

- `scripts/validate-contract-authority.mjs`
- `scripts/validate-contracts.mjs`
- `package.json`
- `.github/workflows/ci.yml`, only if validation command behavior is relevant
- prior documentation gates that define contract authority and validation boundaries

Review does not mean modification.

No file modification is authorized by this planning gate.

## 8. Candidate Files for Future Modification Planning

The following files may be subject to future modification planning, but only after review and a later explicit authorization gate:

- `scripts/validate-contract-authority.mjs`
- `scripts/validate-contracts.mjs`
- `package.json`
- CI workflow files, if validation command behavior must change

No future modification is approved in this planning gate.

## 9. Planned Review Questions

The next planning review gate should answer:

1. Are the two validation scripts intentionally separate?
2. If separate, what does each script validate?
3. Which script is authoritative for Backend Slice 0 contract authority validation?
4. Which pinned SHA is current for the OpenAPI/RBAC/workspace authority stream?
5. Which pinned SHA is current for the broader contract validation stream?
6. Are both pinned SHAs intentionally different?
7. Are the required file sets intentionally different?
8. Does either script represent legacy validation behavior?
9. Is one script narrower and one broader?
10. Do package scripts clearly express the distinction?
11. Does CI run both validations, one validation, or neither?
12. Would any future correction require a code authorization gate?
13. What must remain blocked until reconciliation is complete?

## 10. Planned Classification Matrix

The planning review gate should classify each validation script using this matrix:

| Item | Planned classification |
|---|---|
| `scripts/validate-contract-authority.mjs` | authority boundary validator / current / legacy / unresolved |
| `scripts/validate-contracts.mjs` | contract validator / current / legacy / unresolved |
| `validate:contract-authority` | package command classification required |
| `validate:contracts` | package command classification required |
| pinned SHA in `validate-contract-authority.mjs` | current / legacy / intentionally split / unresolved |
| expected commit in `validate-contracts.mjs` | current / legacy / intentionally split / unresolved |
| authority file set in `validate-contract-authority.mjs` | current / legacy / intentionally split / unresolved |
| required contract file set in `validate-contracts.mjs` | current / legacy / intentionally split / unresolved |

## 11. Planned Reconciliation Options

The planning review gate should evaluate these options.

### Option A — Keep both scripts intentionally split

Description:

Both validation scripts remain valid and intentionally validate different authority scopes.

Review requirement:

Document the purpose of each script, each pin, and each required file set.

Potential next gate:

Authority Pin Split Acceptance Decision Gate.

### Option B — Treat one script as current and one as legacy

Description:

One validation script is retained as the current authority validation path while the other is marked as legacy or superseded.

Review requirement:

Identify which script is current and why.

Potential next gate:

Validation Script Reconciliation Implementation Authorization Gate, only if code changes are needed.

### Option C — Converge both scripts to one authority pin

Description:

Both scripts should use the same authority SHA.

Review requirement:

Confirm the single authority SHA and the intended file set.

Potential next gate:

Validation Script Reconciliation Implementation Authorization Gate.

### Option D — Split broader contract validation from OpenAPI/RBAC authority validation

Description:

One script validates the OpenAPI/RBAC/workspace authority slice, while the other validates broader product/agent/runtime contract readiness.

Review requirement:

Document naming, ownership, and expected CI behavior.

Potential next gate:

Validation Script Boundary Clarification Planning Review Gate or Implementation Authorization Gate.

### Option E — Defer script changes but block dependent gates

Description:

No script changes are planned yet, and dependent gates remain blocked.

Review requirement:

Explain what additional authority evidence is needed.

Potential next gate:

Authority Evidence Collection Review Gate.

## 12. Planned Verification Commands

The next planning review gate should verify repository evidence using read-only commands only.

Suggested local commands:

```bash
git status -sb
git log --oneline -5
git show --stat HEAD
git grep -E -n "PINNED_AUTHORITY_SHA|EXPECTED_AUTHORITY_COMMIT|AUTHORITY_FILES|REQUIRED_CONTRACT_FILES"
git grep -E -n "validate:contract-authority|validate:contracts"
git grep -E -n "NASHIR_AUTHORITY_REPO|--authority-repo"
git diff --check
```

If reviewing CI behavior:

```bash
find .github/workflows -maxdepth 2 -type f -print
grep -E -R "validate:contract-authority|validate:contracts" .github/workflows || true
```

These commands are review-only.

They do not authorize edits.

## 13. Planned Review Outputs

The planning review gate must produce:

- PASS/FAIL review of planning completeness;
- list of validation scripts reviewed;
- list of pinned authority references reviewed;
- list of authority file sets reviewed;
- classification of whether the mismatch is intentional, stale, legacy, or unresolved;
- explicit statement of whether any code change might be needed later;
- explicit statement that no code change is authorized yet;
- recommended next gate.

## 14. Decision on Validation Script Modification

Decision: NO-GO.

Reason:

Validation script changes are code changes and require explicit later authorization.

This planning gate only plans how to review and reconcile the mismatch.

## 15. Decision on OpenAPI Mutation

Decision: NO-GO.

Reason:

OpenAPI mutation requires stable authority ownership and a later explicit OpenAPI mutation gate.

No OpenAPI file may be changed.

## 16. Decision on Generated Clients

Decision: NO-GO.

Reason:

Generated client changes require reconciled authority pins and generated artifact inventory.

No generated client changes are authorized.

## 17. Decision on Product Route Inventory

Decision: DEFER.

Reason:

Product route inventory depends on stable OpenAPI authority and validation boundaries.

No product route inventory is authorized.

## 18. Decision on Permission Representation

Decision: DEFER.

Reason:

Permission representation depends on confirmed and reconciled OpenAPI authority.

No permission representation model is selected.

## 19. Decision on Error and Disclosure Mapping

Decision: DEFER.

Reason:

Route-specific 401, 403, and non-disclosing 404 behavior depends on OpenAPI response authority and product route inventory.

No route-specific mapping is selected.

## 20. Decision on Persistent RBAC

Decision: NO-GO.

Reason:

Persistent RBAC requires permission source authority, role/permission model, membership versus permission grant separation, data model review, migration authorization, and runtime resolver authorization.

These remain future work.

## 21. Risk Review

### 21.1 Contract Drift Risk

Risk:

Different validations may continue to depend on different authority snapshots.

Mitigation:

Plan a dedicated reconciliation review before route or permission decisions.

### 21.2 Stale Pin Risk

Risk:

One authority pin may be stale or superseded.

Mitigation:

Require classification of every pin before authorizing changes.

### 21.3 File-Set Drift Risk

Risk:

The required file sets may represent different product scopes without documentation.

Mitigation:

Require file-set classification and purpose mapping.

### 21.4 Premature Code Change Risk

Risk:

Script changes may remove guardrails before their purpose is understood.

Mitigation:

Keep code changes blocked until planning review and authorization.

### 21.5 Sequencing Risk

Risk:

Moving to product route inventory too early may create a contract mismatch.

Mitigation:

Defer product route inventory until reconciliation is complete or intentionally accepted.

## 22. Planning Completeness Checklist

The planning review gate should verify that this planning gate includes:

- gate classification;
- inputs reviewed;
- problem statement;
- scope boundaries;
- candidate files for review;
- candidate files for future modification planning;
- planned review questions;
- planned classification matrix;
- planned reconciliation options;
- planned verification commands;
- planned review outputs;
- explicit non-authorization boundaries;
- risks;
- gaps;
- transition decision.

## 23. Gaps

Known unresolved gaps after this planning gate:

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

## 24. Final Decision

Decision: GO to Backend Slice 0 Permission Guard OpenAPI Authority Pin Reconciliation Planning Review Gate.

This decision selects a documentation-only planning review gate.

This decision does not authorize implementation.

This decision does not authorize validation script modification.

This decision does not authorize OpenAPI mutation.

This decision does not authorize generated client changes.

This decision does not authorize public/product route work.

This decision does not authorize DB, ORM, migrations, deployment, secrets, UI, workflow, or formatting baseline cleanup.

## 25. Recommended Next Gate

Recommended next gate:

`Backend Slice 0 Permission Guard OpenAPI Authority Pin Reconciliation Planning Review Gate`

That gate should review this planning output and decide whether the project can proceed to:

- Authority Pin Split Acceptance Decision Gate;
- Validation Script Reconciliation Implementation Authorization Gate;
- Authority Evidence Collection Review Gate;
- another prerequisite gate.

## 26. Explicit Non-Authorization

This planning gate does not authorize:

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

## 27. Inputs, Outputs, Gaps, and Transition Decision

### Inputs

- Merged OpenAPI Authority Pin Reconciliation Decision Gate.
- Merged OpenAPI Authority Source Confirmation Gate.
- Merged OpenAPI Authority Inventory Decision Gate.
- Merged OpenAPI Authority Inventory Review Gate.
- Merged OpenAPI RBAC Contract Alignment Decision Gate.
- Contract validation scripts.
- Existing Auth0 identity-only boundary.
- Existing route/path `workspaceId` authority.
- Existing workspace-before-permission ordering.
- Existing membership-before-permission ordering.
- Existing internal harness-only permission guard app wiring.
- Existing contract-first governance.

### Outputs

- Planned reconciliation review path.
- Planned classification matrix for validation scripts and authority pins.
- Planned review questions.
- Planned reconciliation options.
- Planned verification commands.
- Explicitly blocked validation script modification.
- Explicitly blocked OpenAPI mutation.
- Explicitly blocked generated client changes.
- Explicitly blocked implementation.
- Selected planning review as the next gate.

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

GO to `Backend Slice 0 Permission Guard OpenAPI Authority Pin Reconciliation Planning Review Gate`.

Do not start implementation before a future authorization gate explicitly allows implementation.
