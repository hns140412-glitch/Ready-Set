# READY_IMPLEMENTATION_BASELINE_V1

Status: COMPLETE / W-00 GATE CLOSED  
Date: 2026-09-20 KST  
Authority: latest TAKY + Drive Current Truth + direct GitHub inspection  
Main inspected: `7f5b428ebc270685da02cbccebd27576cbfee9c0`  
Staging inspected: `bd9e6422a656f17ff8f05c4a2dbac01f0bf6dcf2`  
PR #29: HOLD / DO NOT MERGE  
NotebookLM: excluded

## Hard authority

`ASSIGNMENT FACT → LEARNING MASTER ANALYSIS → PLANNER ALLOCATION → DATED TODO → TODAY → READY EXECUTION → RESULT / PROGRESS EVENT → CARRY-OVER / LEARN`

- Parent = CAPTURE / INPUT / CONFIRM
- Learning Master = INTERPRET / LOAD ANALYSIS
- Planner = ALLOCATE
- Child = VIEW / FACT INPUT WHEN APPLICABLE / SELECT TODAY / EXECUTE
- Parent FACT must not directly create a DATED TODO.
- Ready execution must not create a new DATED TODO.
- Physical pages and minutes are secondary evidence, never the primary split unit.
- DEVICE_VERIFIED is forbidden without physical-device evidence.

## Baseline matrix

| 기능명 | 최신 의미 기준 | main 구현 위치 | staging 구현 위치 | 최신 의미 | 더 검증됨 | disposition | 근거 파일 | 검증 상태 |
|---|---|---|---|---|---|---|---|---|
| Parent intake | FACT capture/input/confirm only | `app.js:648-733` exposes homework template minutes, preferred days, required_today | `ready-stage-f.js:57-62`; `ready-parent-capture-intake-v1.js` | staging | main runtime shell, staging semantics | PORT_TO_INTEGRATION + REWRITE main admin surface | Current Truth §§4,7,8; semantic review conflicts 1-5 | main CODED/RUNTIME_VERIFIED but semantic FAIL; staging CODED/static-local only |
| Talent | one weekly package, six book facts; next Tuesday boundary; answer parent-only | no 6-book FACT model | `ready-stage-e.js`, `ready-stage-f.js`, capture intake | staging | staging meaning; capture runtime unverified | PORT_TO_INTEGRATION; REWRITE allocation behind Learning Master | Current Truth §5 | CODED in staging; CI/RUNTIME unknown for specified head |
| English | reusable workbook ref + per-cycle facts; prints/components separate; unresolved next academy blocks allocation | no FACT/package model | `ready-stage-e.js`, `ready-stage-f.js`, `ready-stage-g14-planner-authority.js` | staging | staging meaning | PORT_TO_INTEGRATION; preserve confirmation conflict; REWRITE direct allocation | Current Truth §6 | CODED/static-local; runtime not established |
| Learning Master | confirmed FACT → interpreted learning units with provenance/confidence | absent; template accepts arbitrary `learning_units` | absent; Stage E uses baseline activity profiles and marks interpretation pending | neither | neither | REWRITE / NEW MODULE | Current Truth §5.4; implementation gap | NOT CODED |
| Planner allocation | sole DATED TODO authority; learning-unit/load/deadline/schedule based | `ready-planner-v01.js`; minute-fit allocator | staging Stage E/G14 provisional allocators | neither fully; main lifecycle stronger | main contract + browser E2E | PRESERVE main lifecycle; REWRITE candidate selection; SUPERSEDE staging direct allocators | main planner contract test; Current Truth | main CI/RUNTIME verified at prior exact-main evidence; current integration NOT VERIFIED |
| DATED TODO | Planner-created execution instance with full upstream IDs | main `upsertDatedTodo`, `commitAllocation`; but `linkOrCreateTodayItems` can create from Ready | staging `days[].tasks` created directly from facts | main schema closer | main | PRESERVE storage/state; REWRITE creation guard; DELETE direct Ready creation path | `ready-planner-v01.js`, runtime-flow test | CODED/CI/RUNTIME on main; semantic guard missing |
| TODAY | projection of Planner dated tasks; child selects, does not allocate | `todayProjection`, `app.js:168-191` | Stage F child task selection | main engine + staging semantics | main runtime | PRESERVE + PORT child semantics | Current Truth §8 | main CODED/CI/RUNTIME |
| Child Mission | chosen TODAY tasks → execution setup | `app.js:195-237`; also arbitrary manual task input | Stage F hides legacy setup and shows dated tasks | staging meaning | main runtime | REWRITE to prevent arbitrary task→DATED TODO authority; preserve FACT intake exception | Current Truth §§4,8 | partial |
| Focus | timestamp session, explicit pause/issue separation, task/lap bridge | `app.js:335-401`, `ready-runtime-v07.js` | staging layers rely on main shell | main | main | PRESERVE | runtime-flow spec; handoff runtime rules | CODED/CI/RUNTIME_VERIFIED on main; DEVICE not claimed |
| Result | factual end state and actual observation | `app.js:393-545`, runtime bridge | staging reuses runtime | main | main | PRESERVE | runtime-flow spec | CODED/CI/RUNTIME_VERIFIED on main |
| Carry-over | PARTIAL/DEFERRED/BLOCKED/WAITING preserved; actual time observation only | `ready-planner-v01.js` outcome/carry queue | Stage G14 status preservation partial | main | main | PRESERVE; extend provenance to learning unit | planner contract + runtime-flow | CODED/CI/RUNTIME_VERIFIED on main |
| Local-first | IndexedDB snapshot + Outbox + recovery + explicit conflict | `ready-local-first-v01.js` | staging legacy localStorage stores/capture-specific IndexedDB | main | main | PRESERVE; extend scopes | local-first.spec.js | CODED/CI/RUNTIME_VERIFIED on main |
| role routing | temporary query role allowed only for tests; actual child/parent IA differs | main lacks governed split | `ready-stage-f.js`, role context | staging | staging semantics, not full auth | PORT_TO_INTEGRATION; OPEN full family auth; query role TEST_ONLY | Current Truth §§8-9 | CODED in staging; runtime for target head unknown |

## Required preserve set from main

- IndexedDB snapshots, Outbox, retry/recovery/conflict resolution.
- Sync adapter truthful LOCAL_ONLY / CONNECTED / ERROR behavior.
- WEEK/DAY projection.
- TODAY → Mission → Focus → Result → carry-over runtime.
- Existing factual task-result states and timestamp-based session behavior.

## Selective port set from staging

- `assignmentFacts`, `assignmentPackages`, `workbookRefs`.
- Talent six-book package and parent-only answer references.
- English workbook/range/weekday print/component semantics.
- actor provenance and `CONFIRMATION_REQUIRED`.
- different child/parent information architecture and primary actions.

## Rewrite / supersede list

1. `app.js` Planner Admin homework form: remove Parent-owned minutes, weekdays, and `required_today`.
2. `ready-planner-v01.js::linkOrCreateTodayItems`: stop creating DATED TODO from Ready execution intake; link only to Planner-created TODOs.
3. `ready-planner-v01.js::allocateToday`: minute-fit template allocation is superseded as primary allocation logic.
4. staging `allocateTalentPackage` / `allocateEnglishPackage`: superseded until Learning Master interpreted units exist.
5. staging `ready-stage-g14-planner-authority.js::addScienceHomework`: Parent FACT → immediate dated task path is forbidden.
6. main manual Mission task input may create a FACT/event candidate but must not gain Planner authority.
7. `homework_templates` remains only a Learning-Master-produced reusable structure; it is not an Assignment Fact.

## Canonical relationship

- Assignment Fact: immutable/source-correctable statement of what was assigned.
- Homework/Learning Template: reusable interpreted learning structure produced by Learning Master.
- Learning Unit: divisible concept/skill/activity unit, with load and dependency metadata.
- DATED TODO: Planner-created execution instance referencing a Learning Unit.
- Progress Event / Observation: execution result; actual time remains `OBSERVATION_ONLY`.

## Gate result

UNKNOWN count for the required thirteen areas: **0**.

W-00 is closed. Functional code modification is now allowed only on the integration branch and must preserve the authority chain above.
