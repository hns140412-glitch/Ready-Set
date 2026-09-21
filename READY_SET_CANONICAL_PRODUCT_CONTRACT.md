# READY_SET_CANONICAL_PRODUCT_CONTRACT

Status: ACTIVE_RENEWED_CANONICAL
Generation: READY_RENEWAL_01
Date: 2026-09-20

## Product identity
Ready & Set is the child's learning execution BASE CAMP and session orchestrator. It is not a timer product; timing is an execution tool.

Primary loop:
ASSIGNMENT FACT → LEARNING MASTER → LEARNING UNIT → PLANNER → DATED TODO → TODAY → CHILD SELECT → SESSION → PER-TASK RESULT → PROGRESS/CARRY-OVER → LEARN/REPLAN

## Authority — HARD LOCK
PARENT = capture/input/confirm/support.
LEARNING MASTER = interpret/decompose/load metadata.
PLANNER = sole dated allocation authority.
CHILD = view/allowed fact input/TODAY selection/execution/outcome report.

Forbidden:
- Parent direct required_today/allocation-day/authoritative-time assignment.
- Ready execution creating DATED TODO.
- observations overwriting FACT.
- pages/minutes as primary learning split.

## Session — HARD LOCK
ONE SESSION / MULTIPLE TASKS / ONE ACTIVE TASK / AT MOST ONE ACTIVE LAP.
SESSION_END != TASK_COMPLETE.
Task results: COMPLETED / PARTIAL / DEFERRED / WAITING_FOR_PARENT / BLOCKED.
No bulk completion path may overwrite per-task outcomes.

## Timing
Timestamp-derived timing is authoritative. APP_SWITCH != PAUSE. Navigation/specialist routing must not reset the session.

## Multi-app
Ready owns the session. Handoff preserves session_id / goal_id / task_id / lap_id / return_target.
Vocabulary/retrieval → Hide & Seek.
Expression/writing/speaking → Snap & Pop.
Specialist completion may finish a task/lap, never the whole Ready session.

## TODAY / Mission
TODAY is a projection of Planner-created DATED TODOs. Mission is execution setup only.
Child ad-hoc input must follow CHILD INPUT → PARENT REVIEW/CONFIRM → LEARNING MASTER → PLANNER → TODAY.

## Capture
Capture originals → temp preservation → Save and Analyze → OCR/classification REVIEW DRAFT → Parent review/correction → FACT confirmation → Learning Master → Planner.
OCR is never FACT. Answer references are PARENT_ONLY. Every source item must be linked, ignored-with-reason, or unresolved.

## Planner
Planner uses deadlines, fixed commitments, load/difficulty/recovery and advisory execution evidence.
Rewrite target: actual free windows after school/academy/travel/meals/preparation/rest/safety buffer.

## Result / carry-over
Result must reflect actual per-task outcomes. Incomplete tasks never display as completed. Carry-over preserves lineage and cannot loop indefinitely.

## Local-first / family / sync
Preserve snapshots, Outbox, retry/conflict and Parent/Child authorization. Production sync/Identity verification is separate from code completeness.

## UI language
Exploration/mission/route/base-camp language is canonical. Time Attack / Focus Mode are not product identities.
Shared expedition-member rules are external authority; Ready consumes them.

## Validation labels
CODED / CI_VERIFIED / RUNTIME_VERIFIED / DEVICE_VERIFIED / PRODUCTION_VERIFIED are independent.

## Rewrite closure
UNMAPPED_MATERIAL=0 and SILENT_LOSS=0 within recovered scope.
Reverse Reconstruction Test must reproduce intended Ready behavior without requiring historical REV documents.


## Current implementation truth
Exact Ready main evidence basis:
- main SHA: `6142cfeb5599a625d61ffa1faca866b2b6817cc8`
- Ready Integration CI #119: PASS
- Ready Runtime E2E #205: PASS, 42/42
- TAKY Codex Worker Self-Test #322: PASS
- Learning Engine PR #68: merged to main
- Device verification: NOT PERFORMED
- Production verification: NOT VERIFIED

This evidence proves current coded/CI/runtime state only. It does not erase remaining product gaps.

## Expedition-rule ownership
Shared expedition-member identity, personality, lifecycle and behavior rules are owned upstream by Snap & Pop under TAKY governance.
Ready consumes the shared expedition projection for its child experience.

Hard:
- Ready SHALL NOT fork a competing expedition-member rule system.
- Ready MAY define Ready-specific presentation/use of expedition members without redefining upstream personality/lifecycle authority.
- shared-rule changes flow from the upstream owner into Ready through governed reflection.

## Renewal priorities
1. Planner real availability windows and life-buffer semantics.
2. Child FACT → Parent confirmation → Learning Master → Planner closure.
3. Ready ↔ Hide & Seek / Snap & Pop runtime handoff roundtrip.
4. WEEK/DAY/TODAY/Mission/Session/Result adventure-language/UI consolidation.
5. legacy manifest/README/cache/version cleanup.
6. physical-device verification on one exact candidate SHA.
7. production verification.

## Deployment / device verification budget
Implementation and verification are branch-first.
GitHub CI and deterministic Runtime verification are the default closure path before hosting.

Hard:
- Netlify is not a debugging surface.
- Do not create branch previews/sites/deploys merely to inspect code that GitHub CI/Runtime can validate.
- A physical-device deployment is a deliberate final gate after exact candidate SHA selection.
- Higher-cost/external side effects require applicable PRE-ACTION rule bindings and satisfied preconditions under TAKY.


## Resume / external-resource execution contract
Continuity evidence:
`READY_SET_HANDOFF_2026-09-20_LATEST` in governed Google Drive.

Authority order:
`LATEST TAKY → READY CURRENT CANONICAL → CURRENT GITHUB MAIN/BRANCH EVIDENCE → HANDOFF CONTINUITY EVIDENCE`.

Implementation execution:
`BRANCH IMPLEMENTATION → CI/RUNTIME → INTEGRATED REVIEW → FROZEN EXACT SHA → TAKY EXTERNAL-RESOURCE GATE → ONE EXTERNAL DEPLOYMENT → DEVICE VALIDATION`.

A candidate is not frozen while material implementation gaps in the selected release scope are still being edited or while branch CI/Runtime is not green.

Before any external deployment/validation action, the execution record must satisfy TAKY:
- PRE-ACTION rule binding;
- external resource action classification;
- call budget;
- exact candidate SHA frozen;
- no lower-cost local validation remaining for the same question;
- no repeated equivalent call without new evidence/trigger.

Device validation is a final verification gate, not an implementation/debug loop.
