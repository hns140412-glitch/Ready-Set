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
TAKY inspected the current branch before dispatch and confirmed a likely concrete failure path that Codex must reproduce before modifying code:

- `ready-base-runtime-v1.js::readyPublishPlannerResult(...)` writes `PARTIAL | DEFERRED | BLOCKED | WAITING_FOR_PARENT` to the same Planner task and appends `learningReports`.
- `ready-foundation-control-v1.js::actualHistory(...)` correctly carries non-completed tasks into history when learning reports exist.
- `ready-foundation-v1.js::plan(...)` suppresses future projection only for history rows whose status is exactly `COMPLETED`.
- However, `ready-foundation-control-v1.js::prepare(...)` currently adds any Planner task with `learningReports?.length` to `protectedIds`, and then skips a newly generated candidate when `protectedIds` already contains that candidate id.

This means a `PARTIAL`/other non-completed task can be preserved as historical evidence while the same unit's prospective candidate is also blocked from being re-created, causing remaining work to disappear instead of being replanned.

Treat this as a confirmed inspection lead, not permission to patch blindly. Reproduce it with the real candidate/task identity and determine the smallest correction that preserves immutable actual evidence without suppressing legitimate future projection.

## Confirmed TAKY inspection finding 2 — wrap-up may overwrite a non-completed task as COMPLETED
TAKY also confirmed a second high-risk path across the real session-finalization flow:

- `ready-runtime-v07.js::setTaskState(...)` publishes the chosen task result (`PARTIAL | DEFERRED | BLOCKED | WAITING_FOR_PARENT | COMPLETED`) to the bound Planner task.
- `ready-runtime-v07.js::finalizeSession()` then calls `originalCompleteSession()` after all task states are resolved.
- In the base runtime, `originalCompleteSession` resolves to the canonical `readyComplete()` implementation.
- `ready-base-runtime-v1.js::readyComplete()` unconditionally creates a record with `status:'COMPLETED'` and calls `readyPublishPlannerResult(plannerTaskId,'COMPLETED',...)` for the session's planner task id.

Therefore a user can explicitly mark the canonical task as `PARTIAL`, `DEFERRED`, `BLOCKED`, or `WAITING_FOR_PARENT` in wrap-up, have that result correctly published, and then the final generic session close can overwrite the same Planner task to `COMPLETED`.

This is a product-state correctness defect, not a UI-only issue. The fix must preserve session closure/history while preventing generic session completion from falsely completing a non-completed Planner assignment. Do not invent a second planner/result store.

Required regression before acceptance:
- start a real Planner-bound Ready session;
- set the task to `PARTIAL` (repeat for at least one of `DEFERRED/BLOCKED/WAITING_FOR_PARENT` or cover all parametrically);
- finalize the session through the actual wrap-up path;
- assert the Planner task remains the chosen non-completed state and is never rewritten to `COMPLETED`;
- verify a true `COMPLETED` task still closes and remains completed.

## First investigation targets
Inspect before modifying:
- `ready-foundation-control-v1.js` — especially `actualHistory(...)` and `prepare(...)` protection/filter logic;
- `ready-foundation-v1.js` — completed-unit semantics in `plan(...)`;
- `ready-base-runtime-v1.js` — result publication and generic session completion behavior;
- `ready-runtime-v07.js` — wrap-up/finalization and specialist-return result publication;
- `ready-home-homework-mvp-v1.js` — Planner ↔ canonical task binding;
- Planner/parent surfaces that render current and remaining state;
- `tests/ready-daily-loop-result-planner-contract.mjs`;
- `tests/ready-planner-actual-history-replan-e2e.mjs`;
- `tests/ready-specialist-bridge-contract.mjs`.

Do not widen scope unless the real product path proves the defect lives elsewhere.

## Required product behavior
1. The canonical Planner task remains the same assignment identity through Ready and specialist round trips using the existing session/task ownership fields.
2. Session finish writes one normalized result state: `COMPLETED | PARTIAL | DEFERRED | BLOCKED | WAITING_FOR_PARENT` with provenance.
3. Generic session closure must never upgrade a non-completed task to `COMPLETED`.
4. `COMPLETED` suppresses only genuinely completed unit(s) from future projection.
5. `PARTIAL` preserves completed evidence and produces/retains a bounded remainder when reliable quantity evidence exists.
6. If quantity is unknown, keep an explicit unresolved remainder; do not invent pages, minutes, percentages, or completion quantity.
7. `DEFERRED`, `BLOCKED`, and `WAITING_FOR_PARENT` preserve the assignment and drive only governed prospective replanning when a confirmed future study opportunity exists.
8. Past actual history is immutable. Replanning writes prospectively only.
9. Specialist return updates the same Planner assignment; no duplicate task/session authority.
10. Reload preserves in-progress/result/remainder state locally. Network sync may remain out of scope for this slice.
11. Parent-visible state distinguishes confirmed assignment fact, session/child-reported result, and unresolved evidence.

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
A. Execute one real product-path assignment from Planner into Ready and finish `COMPLETED`; after replan it does not return.
B. Execute one real assignment as `PARTIAL`; finalizing the session does not overwrite it to `COMPLETED`, past actual remains intact, and only remaining work is projected forward.
C. A `PARTIAL` result without reliable quantity evidence remains explicitly unresolved rather than disappearing or receiving invented quantity.
D. `DEFERRED`, `BLOCKED`, and `WAITING_FOR_PARENT` do not become completed and do not erase remaining work, including after generic session finalization.
E. Round trip through at least one specialist bridge preserves `session_id + goal_id + task_id + lap_id`/equivalent canonical ownership and affects the same Planner assignment.
F. Reload after result write preserves current result/remainder locally.
G. Parent surface visibly separates confirmed FACT, reported result, and unresolved remainder/evidence.
H. No historical actual is rewritten after replanning.
I. Existing relevant tests remain green; add/adjust regression tests only after the real product path is fixed.
J. Add a regression that specifically proves a task with `learningReports` and non-`COMPLETED` status does not suppress legitimate future projection of its remaining unit.
K. Add a regression that proves wrap-up/finalizeSession cannot rewrite a non-completed Planner result to `COMPLETED`.

## Validation plan
Run the smallest relevant suite first, then adjacent regressions:
- `node tests/ready-daily-loop-result-planner-contract.mjs`
- `node tests/ready-planner-actual-history-replan-e2e.mjs`
- `node tests/ready-specialist-bridge-contract.mjs`
- focused new regression for non-completed learning-report replanning
- focused new regression for wrap-up/finalization result preservation
- other directly affected existing tests as justified by changed files

Also exercise the affected product path in a real browser/mobile-width runtime when available. If runtime/mobile cannot be executed, report `UNVERIFIED` rather than PASS.

## Delivery requirements
Return:
- actual START_REMOTE_HEAD after `git fetch`;
- reproduced failing case(s) before fix;
- confirmed root cause(s), not assumed diagnosis;
- changed files and why each changed;
- exact test commands/results;
- runtime/mobile evidence or explicit UNVERIFIED reason;
- unresolved product/architecture decision only if truly blocking;
- resulting commit SHA(s);
- requested lifecycle state: `TAKY_REVIEW`.

Do not merge to main and do not deploy production.

`CODEX_DONE != TAKY_PASS`.
