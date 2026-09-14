# READY & SET — CODEX TASK CONTRACT

Status: TEMPLATE / FAIL-CLOSED
Authority: TAKY orchestrator review controls task acceptance and completion.

## Required fields

- TASK_ID:
- OBJECTIVE:
- SOURCE_OF_TRUTH:
- REPOSITORY: hns140412-glitch/Ready-Set
- WORK_BRANCH: runtime-session-bridge-2026-09-10
- START_REMOTE_HEAD:
- CHANGE_SCOPE:
- DO_NOT:
- ACCEPTANCE_TESTS:
- VALIDATION_PLAN:
- HUMAN_APPROVAL_REQUIRED_FOR_MERGE: true
- HUMAN_APPROVAL_REQUIRED_FOR_PRODUCTION_DEPLOY: true
- DELIVERY_REQUIREMENTS:

## Execution rules

1. Run `git fetch` before implementation and record `origin/runtime-session-bridge-2026-09-10` HEAD.
2. Do not trust Handoff SHA over live remote state.
3. Codex may implement and test; it may not redefine requirements or declare TAKY PASS.
4. Keep the diff minimal and exclude unrelated refactors.
5. A material implementation reaches `CODEX_DONE` only after the stated tests/checks are run or explicitly recorded as UNVERIFIED with reason.
6. `CODEX_DONE` transitions to `TAKY_REVIEW`, not directly to merge/deploy.
7. TAKY review must evaluate requirement, diff scope, test/build, regression, runtime/mobile, truthfulness, and approval gates as applicable.
8. Failed review transitions to `REWORK` and returns to Codex with bounded corrections.
9. Merge/mainline promotion and production deployment require recorded human approval when required above.

## Lifecycle

`READY -> ASSIGNED_TO_CODEX -> IN_PROGRESS -> CODEX_DONE -> TAKY_REVIEW -> (REWORK | HUMAN_APPROVAL) -> MERGED -> DEPLOYED`

Forbidden transitions:
- `CODEX_DONE -> MERGED`
- `CODEX_DONE -> DEPLOYED`
- `TAKY_REVIEW -> MERGED` when required human approval is absent
- `MERGED -> DEPLOYED` when required production approval is absent

## Codex completion evidence

- START_REMOTE_HEAD:
- RESULTING_COMMIT_SHA:
- ROOT_CAUSE_OR_IMPLEMENTATION_SUMMARY:
- CHANGED_FILES:
- TESTS_RUN:
- TEST_RESULTS:
- RUNTIME_MOBILE_EVIDENCE:
- REGRESSION_EVIDENCE:
- UNRESOLVED_RISKS:
- REQUESTED_NEXT_STATE: TAKY_REVIEW

`CODEX_DONE != TAKY_PASS`.
