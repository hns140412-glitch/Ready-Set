# READY-VS-004 — Parent FACT → Planner Today → Child Start

Status: CLOSED_LOCAL_VERIFIED
Date: 2026-10-06
Repository: D:\Git PWA\READY-WEBAPP-20261006
Branch: taky/ready-webapp-vertical-slice-20261006
Starting / resume HEAD: 2d10583713a82dae2fb55f2aa7f482df4f578193
Deploy / Push / Merge / Netlify Publish: FORBIDDEN

## Why this is next

VS001 proved child execution after a Planner task already exists.
VS002 proved parent setup/input surfaces.
VS003 proved fresh guardian first-run reaches real parent Home without paid generation.

Now close the first truly connected family loop:
PARENT FACT INPUT -> FACT_CONFIRMED -> PLANNER DATED TASK -> CHILD HOME -> START/FOCUS.

No MASTER/Beta/Alpha reopening.

## SAVEY read order

Read only task-relevant files:
- AGENTS.md
- Ready_Set_Ui_Master_Logic_REV_07.md
- READY_HOMEWORK_MVP_CONTRACT.md
- ready-stage-f.js
- ready-stage-e.js
- ready-foundation-control-v1.js
- ready-foundation-v1.js
- ready-parent-setup-hub-v1.js
- ready-schedule-base-v1.js
- ready-role-context-v1.js
- ready-home-homework-mvp-v1.js
- ready-home-homework-ui-v1.js
- existing relevant tests for foundation assignment bridge/planner/VS001~003

Reuse inherited Alpha/Frozen Beta semantics already bound in this workstream. Do not reread whole Alpha.

## Objective

Using only local/browser state and current production UI:

1. Parent Home -> schedule setup.
2. Parent creates or confirms one STUDY_OPPORTUNITY for today using the existing schedule editor.
3. Parent opens homework input.
4. Parent enters an English homework FACT with a non-empty range and an explicit next-academy/cycle boundary that makes today an eligible planning day.
5. Save must produce FACT_CONFIRMED, not AI-candidate status.
6. Foundation/Planner must project at least one real dated TODAY_TASK for today, with stable sourceAssignmentId/sourceUnitId/projection/authority fields.
7. Parent Home/Planner status reflects the allocation.
8. Switch to child mode through the existing role switch.
9. Child Home shows the Planner-created task.
10. Child starts it without selecting a timer and reaches Focus in the existing VS001 session/lap path.
11. Reload before starting or after reaching Home must not lose the Planner task.
12. No duplicate Planner task is created by render/reload/reconcile.

This is the first cross-role vertical slice.

## Hard semantics

- Parent CAPTURES/INPUTS/CONFIRMS; Parent does not manually assign today's study amount.
- Planner/MAIN owns dated allocation.
- English FACT and today's task are different entities.
- FACT_CONFIRMED is required before Planner projection.
- AI extraction is not used for this slice.
- Missing timetable rows are NOT free time.
- A STUDY_OPPORTUNITY must be explicit evidence; do not infer one.
- Timer remains optional.
- Ready owns session/lap execution only.
- USER != DEBUGGER.
- No fake OCR/AI result.
- No paid API.

## Known architecture

ReadyFoundationControlV1.installAssignmentBridge wraps parent English/Talent FACT saves and calls prepareConfirmedFacts().
prepareConfirmedFacts() reads confirmed FACTs + Learning/Subject units, applies ReadyFoundationV1.plan(), and writes Planner/MAIN TODAY_TASK projections into readyset_planner_v1.

Use that path. Do not bypass Planner by manually writing a child task from the parent UI.

## Implementation guidance

First run the flow against current HEAD with browser/CDP. If it already works end-to-end, do not add production code just to create a diff:
- add only a focused integration contract/evidence harness if needed,
- fix only the smallest real missing link exposed by the browser.

If a real gap exists, prefer bounded changes in:
- ready-stage-f.js
- ready-foundation-control-v1.js
- ready-parent-setup-hub-v1.js
- ready-role-context-v1.js
- targeted test only
Do not refactor session runtime.

## Acceptance — automated

Must keep PASS:
- ready-vs-001-home-focus-result-contract.mjs
- ready-vs-002-parent-setup-home-contract.mjs
- ready-vs-003-first-run-runtime-contract.mjs
- ready-first-run-parent-activation-contract.mjs
- ready-foundation-contract.mjs
- ready-foundation-assignment-bridge-contract.mjs
- ready-foundation-assignment-bridge-execution.mjs
- ready-homework-parent-confirm-planner-e2e.mjs
- ready-daily-loop-result-planner-contract.mjs

Add:
- tests/ready-vs-004-parent-fact-to-child-focus-contract.mjs
  validating FACT vs dated task separation, explicit opportunity requirement, no duplicate projection, role boundary, and child startability.

Full suite:
- compare to current HEAD baseline 22 tests / 5 known failures.
- no new failure family.

## Acceptance — browser/CDP 390x844

Use installed Chrome and local server, no Playwright install required.

Capture/log:
1. parent Home after VS003-ready identity
2. schedule editor with explicit STUDY_OPPORTUNITY entered/saved
3. English homework input before save
4. after save: FACT confirmation + Planner dated task evidence
5. parent Home reflecting allocation/status
6. child Home after role switch showing Planner task
7. child Focus after starting
8. reload/return state without duplicate task
9. localStorage evidence:
   - confirmed English assignment FACT
   - one or more Planner tasks for today
   - sourceAssignmentId/sourceUnitId
   - projection TODAY_TASK
   - authority PLANNER/MAIN
10. browser errors []

Use deterministic local dates relative to runtime today. Synthetic data only; label it as fixture evidence.

Artifacts:
- artifacts/ready-vs-004/

## Do not

- no deployment/publish
- no push/merge
- no Netlify
- no paid API
- no manual direct write of Planner task in the browser harness as a shortcut
- no MASTER changes
- no broad test cleanup
- no user-debugger handoff

## Result boundary

PARENT SCREEN -> CONFIRMED FACT -> PLANNER DATED TASK -> ROLE SWITCH -> CHILD SCREEN -> START -> FOCUS -> EVIDENCE

At end:
STARTING STATE
ROOT CAUSE OR ALREADY-WORKING FINDING
IMPLEMENTED FLOW
CHANGED FILES
AUTOMATED TESTS
BROWSER EVIDENCE
STATE EVIDENCE
PRE-EXISTING FAILURES
OPEN RISKS

Do not commit.
## CLOSED RESULT — 2026-10-06

STARTING STATE
- HEAD 2d10583713a82dae2fb55f2aa7f482df4f578193
- branch taky/ready-webapp-vertical-slice-20261006
- VS-001~003 inherited CLOSED; no MASTER/Beta/Alpha reopen.

ROOT CAUSE / FINDING
- The core Foundation/Planner/data flow was already connected correctly: parent-confirmed English FACTs, explicit STUDY_OPPORTUNITY capacity, child Home, Ready Focus execution, Actual History, and replan protection all worked.
- Browser verification exposed one bounded UI defect in two late-loaded surfaces: `window.toast` can resolve to the DOM element `#toast` through named access because the legacy `app.js` global toast function is not part of the current Stage-C core load. Calling that element as a function could throw after an otherwise successful schedule/FACT save.
- The fix is local and defensive: call `window.toast` only when it is actually a function; otherwise update `#toast` directly. No Planner/session ownership or MASTER semantics changed.

IMPLEMENTED FLOW
- child/candidate English input cannot self-confirm FACT.
- explicit parent save produces FACT_CONFIRMED.
- no STUDY_OPPORTUNITY => no Planner projection; missing timetable row is never inferred as free time.
- explicit opportunity => one PLANNER/MAIN + TODAY_TASK with sourceAssignmentId/sourceUnitId.
- child Home receives the task and starts Focus without a timer requirement.
- completing the task writes READY_FOCUS learning report / COMPLETED Actual History.
- later schedule override/replan preserves the completed task and does not reproject the completed unit.

CHANGED FILES
- tests/ready-vs-004-parent-fact-to-child-focus-contract.mjs
- artifacts/ready-vs-004/browser-flow.mjs
- artifacts/ready-vs-004/*.png
- artifacts/ready-vs-004/state-evidence.json
- this task record
- .taky/READY_NEW_CHAT_START_LATEST.md (resume pointer update)
- ready-parent-setup-hub-v1.js — safe toast dispatch after schedule save
- ready-stage-f.js — safe toast dispatch after homework FACT save
- No other production runtime files changed.

AUTOMATED TESTS
- READY-VS-004 focused contract: PASS.
- VS-001/002/003 focused regression: PASS.
- supporting Foundation / assignment / parent-confirm / daily-loop / actual-history tests: PASS.
- git diff --check: PASS.

BROWSER EVIDENCE — Chrome/CDP 390x844
- Parent Home: PASS.
- actual schedule editor STUDY_OPPORTUNITY entry/save: PASS.
- actual English homework UI p.32~41 + next academy 2026-10-08: PASS.
- FACT_CONFIRMED + one today Planner task: PASS.
- child Home task visibility: PASS.
- child Focus start: PASS.
- completion -> READY_FOCUS learning report + COMPLETED: PASS.
- parent one-day schedule override -> replan: completed history preserved, no duplicate/reprojection.
- reload persistence: one source task, COMPLETED 1, PLANNED 0.
- browser errors: [].
- API / paid calls: 0.

PRE-EXISTING FULL-SUITE FAILURES
- baseline suite intentionally excludes the new VS-004 test: 22 total / 17 PASS / 5 FAIL.
- failed names unchanged: ready-first-journey-parent-home.mjs; ready-first-journey-semantics.mjs; ready-first-journey-transition.mjs; ready-mood-direction.mjs; ready-specialist-bridge-contract.mjs.
- no new failure family.

OPEN RISKS
- Physical iPhone/Safari + installed-PWA lifecycle remains DEVICE-ONLY HOLD and was not required to close local VS-004.
- No further Ready vertical slice is assigned in this task. Next slice selection is a user/product decision point.

Do not commit / push / merge / deploy without a new explicit instruction.

## 공방검토 — 2026-10-06

판정 절차:
1. 공격: CLOSED 근거를 반례로 깨기
2. 결정: 실제 사용자 가치/불변식 위반만 재OPEN
3. 방어: 최소 수정 + 반례 재실행
4. 2차 공격: 반복 재계획/완료 전환
5. 회귀: VS-001~004 + Foundation/Planner 관련 테스트

ATTACK-01 — PARTIAL → replan
- 최초 판정: 공격 성공.
- 반례: 40% PARTIAL 뒤 prepareConfirmedFacts()를 실행하면 원본 PARTIAL은 보존되지만 새 remainder task에 진행률이 없었다.
- 위험: 사용자 관점에서 남은 60%가 새 100% 과제로 보일 수 있어 Actual History → replan 의미 연속성이 끊김.
- 따라서 기존 “COMPLETED 보존”만으로 VS-004 전체 폐루프를 CLOSED 처리한 것은 불충분.

DEFENSE-01
- ready-foundation-control-v1.js의 remainder projection에 PARTIAL learningProgress를 승계.
- remainderProgress에 completedQuantity / remainingQuantity / unit을 명시.
- 원본 actual row는 수정하지 않음.
- Planner ownership/sourceUnitId/sourceAssignmentId 불변.

ATTACK-02 — 반복 replan / remainder 완료
- prepareConfirmedFacts() 3회 반복 후에도 PARTIAL 원본 + remainder 1개만 존재: PASS.
- remainder는 40% 완료 / 60% 남음 상태를 승계: PASS.
- remainder를 100% 완료한 뒤 재계획: 추가 PLANNED 재투영 0: PASS.
- 원본 PARTIAL actual row 보존: PASS.

공방 최종판정:
- READY-VS-004 CLOSED_LOCAL_VERIFIED 유지 가능.
- 단, CLOSED 근거는 COMPLETED 보존만이 아니라 PARTIAL remainder 연속성까지 포함하도록 강화.
- 공격에서 실제 결함 1건 발견 → 방어 수정 → 동일 반례 + 2차 공격 PASS.
- Claude/Codex 호출 Necessity 없음: 로컬에서 재현·원인·수정·회귀가 결정론적으로 닫힘.

## TAKY 2.0 FORMAL GONGBANG REVIEW — 2026-10-06
Previous attack/defense-only completion label is superseded by this formal review.

Sequence completed:
COMPARE -> REVIEW -> ANALYZE -> SUPPLEMENT -> IMPROVE -> CASE RESEARCH -> OPTIMIZE -> ERROR/SELF/REGRESSION VERIFY -> ATTACK -> DECIDE -> DEFEND -> REATTACK -> FINAL VERIFY.

Authority comparison:
- Ready MASTER REV_07 keeps homework source FACT, dated execution instance, and progress/history separate.
- PARENT captures/confirms; PLANNER/MAIN allocates; CHILD selects/executes; Ready owns execution/session projection only.
- Homework MVP contract requires cumulative PARTIAL progress and remaining quantity to survive/resume.

Findings and corrections:
- ATTACK found PARTIAL 40% replan created a remainder without progress semantics.
- DEFENSE now carries learningProgress and remainderProgress (40 complete / 60 remaining) without changing sourceAssignmentId/sourceUnitId or original actual row.
- Additional analysis found actualHistory depended on learningReports to include some formal result states.
- actualHistory now explicitly recognizes COMPLETED, IN_PROGRESS, PARTIAL, DEFERRED, BLOCKED, WAITING_FOR_PARENT.
- A stale bridge contract assertion was updated to match the MASTER result-state contract.

External case comparison:
- Adaptive study-planner patterns preserve partial/actual execution and repair only affected future scheduling.
- Planner-style daily views keep unfinished work linked to the source plan.
- Learning assignment systems preserve progress for resume.
These support preservation + minimal-disturbance remainder repair rather than full regeneration.

Optimization:
- Reused existing learningProgress, Actual History and source-unit identity; no new engine/schema.
- Claude/Codex not required by Necessity Gate because reproduction, correction and regression were deterministic locally.

Reattack:
- 3 repeated replans: no remainder multiplication.
- remainder carries 40/60.
- completing remainder: no further PLANNED projection.
- original PARTIAL actual row remains.
- final focused regression: FORMAL_GONGBANG_FINAL_FAIL=0.
- git diff --check: no error.

FINAL: READY-VS-004 = TAKY 2.0 FORMAL GONGBANG CLOSED_LOCAL_VERIFIED.
Device-only iPhone/Safari/PWA lifecycle remains a separate HOLD.
