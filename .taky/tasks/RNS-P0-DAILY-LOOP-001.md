# RNS-P0-DAILY-LOOP-001 — Ready & Set daily learning loop implementation

Status: READY_FOR_CODEX / NOT_DISPATCHED
Issue: #3 `P0 — Complete Ready & Set daily learning loop as one product slice`
Repository: `hns140412-glitch/Ready-Set`
Work branch: `runtime-session-bridge-2026-09-10`
Observed remote HEAD before contract creation: `d0e78d08382ca16656e6a0408bd5c18672b76620`

## Role
Codex = IMPLEMENTATION EXECUTOR.
TAKY/ChatGPT = ORCHESTRATOR + REVIEWER.
Codex does not redefine product requirements and does not self-declare TAKY PASS.

## Usage discipline
This task is intentionally bounded to one product slice. Do not broaden into repository-wide cleanup, cosmetic polish, documentation rewrites, production deployment, or unrelated refactors.

## Objective
Close the first authoritative Ready & Set child-result-to-Planner loop so that the same confirmed Planner assignment survives Ready / Hide & Seek / Snap & Pop, writes a normalized actual result, preserves past actuals, and prospectively recomputes only the real remaining work.

## Source of truth
1. GitHub Issue #3 acceptance A–H.
2. Live `origin/runtime-session-bridge-2026-09-10` HEAD at task start; run `git fetch` and record the actual SHA before any edit.
3. `AGENTS.md` role/validation contract.
4. Existing product implementation; consolidate existing paths rather than introducing a parallel planner/session authority.
5. Existing `ready-foundation-v1.js` semantics: `actualHistory` only treats `COMPLETED` units as completed; absence of an explicit study opportunity is not free-time evidence.

## Confirmed TAKY inspection finding 1 — non-completed history may suppress legitimate projection
- `ready-base-runtime-v1.js::readyPublishPlannerResult(...)` writes `PARTIAL | DEFERRED | BLOCKED | WAITING_FOR_PARENT` to the same Planner task and appends `learningReports`.
- `ready-foundation-control-v1.js::actualHistory(...)` correctly carries non-completed tasks into history when learning reports exist.
- `ready-foundation-v1.js::plan(...)` suppresses future projection only for history rows whose status is exactly `COMPLETED`.
- But `ready-foundation-control-v1.js::prepare(...)` adds any Planner task with `learningReports?.length` to `protectedIds`, then skips a newly generated candidate when that id is protected.

Likely effect: a non-completed historical actual is preserved while legitimate future projection of its remaining work is suppressed.

Required reproduction: non-completed task + learning report + replan must preserve the past actual and still produce the allowed future remainder candidate.

## Confirmed TAKY inspection finding 2 — wrap-up may overwrite a non-completed task as COMPLETED
- `ready-runtime-v07.js::setTaskState(...)` publishes the chosen task result to the bound Planner task.
- `ready-runtime-v07.js::finalizeSession()` then calls `originalCompleteSession()`.
- That resolves to base `readyComplete()`.
- `ready-base-runtime-v1.js::readyComplete()` unconditionally records `status:'COMPLETED'` and publishes `COMPLETED` for the session planner task.

Likely effect: `PARTIAL`, `DEFERRED`, `BLOCKED`, or `WAITING_FOR_PARENT` is correctly written first, then generic session finalization can overwrite the same Planner assignment to `COMPLETED`.

Required regression: finalize the real wrap-up path after each non-completed result and prove the Planner task never becomes `COMPLETED`; true completed tasks must still close as completed.

## Confirmed TAKY inspection finding 3 — parent result rendering currently mislabels session evidence
`ready-home-homework-ui-v1.js::renderReports()` currently assumes learning reports are quantity reports from either `CHILD_REPORTED` or parent input:
- it renders `report.completedQuantity + '%'` for every report;
- it labels `CHILD_REPORTED` as `내가 기록`, and every other source as `보호자 기록`;
- it does not render the session writer's `resultState`/provenance shape.

But `ready-base-runtime-v1.js::readyPublishPlannerResult(...)` writes session reports shaped like:
`source: READY_SESSION/SPECIALIST/...`, `resultState`, `focusMs`, `pausedMs`, `sessionId` and no required `completedQuantity`.

Likely effect on the real parent surface:
- a session-derived PARTIAL/BLOCKED/etc. can display `undefined%`;
- READY/Specialist session evidence can be falsely described as `보호자 기록`;
- the parent cannot reliably distinguish confirmed assignment FACT from child/session-reported state and unresolved remainder evidence.

This directly violates Issue #3 parent-facing acceptance. Fix the rendering/model semantics, not by fabricating quantity. Session result states with no reliable quantity must be shown as state/provenance evidence and unresolved remainder where applicable. Percentages are valid only when an explicit cumulative quantity report actually exists.

Required regression/verification:
- session `PARTIAL` report with no quantity renders no fake/undefined percentage;
- source is displayed truthfully as Ready/session/specialist-derived evidence, not parent input;
- manually entered percentage progress still renders its true percentage;
- unresolved remainder remains explicit when quantity is unknown.

## First investigation targets
Inspect before modifying:
- `ready-foundation-control-v1.js` — `actualHistory(...)`, `prepare(...)`;
- `ready-foundation-v1.js` — completed-unit semantics in `plan(...)`;
- `ready-base-runtime-v1.js` — result publication and generic session completion;
- `ready-runtime-v07.js` — wrap-up/finalization and specialist-return publication;
- `ready-home-homework-mvp-v1.js` — Planner ↔ canonical task binding and quantity-report model;
- `ready-home-homework-ui-v1.js` — parent/child report rendering and provenance semantics;
- `tests/ready-daily-loop-result-planner-contract.mjs`;
- `tests/ready-planner-actual-history-replan-e2e.mjs`;
- `tests/ready-specialist-bridge-contract.mjs`.

Do not widen scope unless the real product path proves the defect lives elsewhere.

## Required product behavior
1. The canonical Planner task remains the same assignment identity through Ready and specialist round trips using existing ownership fields.
2. Session finish writes one normalized result state: `COMPLETED | PARTIAL | DEFERRED | BLOCKED | WAITING_FOR_PARENT` with truthful provenance.
3. Generic session closure never upgrades a non-completed task to `COMPLETED`.
4. `COMPLETED` suppresses only genuinely completed unit(s) from future projection.
5. `PARTIAL` preserves completed evidence and produces/retains bounded remainder when reliable quantity evidence exists.
6. If quantity is unknown, keep an explicit unresolved remainder; do not invent pages, minutes, percentages, or completion quantity.
7. `DEFERRED`, `BLOCKED`, and `WAITING_FOR_PARENT` preserve the assignment and drive only governed prospective replanning when a confirmed future study opportunity exists.
8. Past actual history is immutable. Replanning writes prospectively only.
9. Specialist return updates the same Planner assignment; no duplicate task/session authority.
10. Reload preserves in-progress/result/remainder state locally. Network sync may remain out of scope for this slice.
11. Parent-visible state distinguishes confirmed assignment FACT, explicit quantity report, session/specialist-reported result, and unresolved remainder/evidence.

## Explicit non-goals
- no new parallel Planner store;
- no replacement framework/build system;
- no broad UI redesign;
- no production deployment;
- no cleanup of unrelated diagnostic workflows;
- no fabricated test/runtime PASS;
- no timer requirement;
- no inferred free time from missing timetable rows.

## Acceptance tests
A. Planner → Ready → `COMPLETED`; after replan it does not return.
B. Planner → Ready → `PARTIAL`; finalization does not overwrite to completed, past actual remains, remaining work moves prospectively.
C. `PARTIAL` without reliable quantity remains explicitly unresolved with no invented percentage.
D. `DEFERRED`, `BLOCKED`, `WAITING_FOR_PARENT` do not become completed or disappear, including after finalization.
E. Specialist round trip preserves `session_id + goal_id + task_id + lap_id`/equivalent ownership and updates the same Planner assignment.
F. Reload preserves current result/remainder locally.
G. Parent surface separates confirmed FACT, explicit quantity report, session/specialist result provenance, and unresolved remainder.
H. No historical actual is rewritten after replanning.
I. Existing relevant tests remain green; regression tests follow real product fixes.
J. Non-completed task with `learningReports` does not suppress legitimate future projection.
K. `finalizeSession` cannot rewrite a non-completed Planner result to `COMPLETED`.
L. Session-origin report rendering never shows `undefined%` or mislabels it as parent input.

## Validation plan
Run smallest relevant suite first, then adjacent regressions:
- `node tests/ready-daily-loop-result-planner-contract.mjs`
- `node tests/ready-planner-actual-history-replan-e2e.mjs`
- `node tests/ready-specialist-bridge-contract.mjs`
- focused regression for non-completed learning-report replanning
- focused regression for wrap-up/finalization result preservation
- focused rendering/model regression for session report provenance/no fabricated quantity
- other directly affected existing tests as justified by changed files

Also exercise the affected product path in a real browser/mobile-width runtime when available. If runtime/mobile cannot be executed, report `UNVERIFIED` rather than PASS.

## Delivery requirements
Return actual START_REMOTE_HEAD, reproduced failing cases before fix, confirmed root causes, changed files, exact tests/results, runtime/mobile evidence or UNVERIFIED reason, resulting commit SHA(s), and requested lifecycle state `TAKY_REVIEW`.

Do not merge to main and do not deploy production.

`CODEX_DONE != TAKY_PASS`.
