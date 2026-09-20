# READY_SET_CANONICAL_PRODUCT_CONTRACT

Status: ACTIVE_REWRITE_CANONICAL
Generation: READY_C2S_REWRITE_01
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

## Deployment / device verification budget
Implementation verification is branch-first.
GitHub Actions / deterministic Runtime checks are the default closure path before hosting.
Netlify is not a debugging surface and must not be consumed for routine intermediate checks.
A physical-device verification deployment is a deliberate final gate for an exact candidate SHA, not a development loop.

## Rewrite closure
UNMAPPED_MATERIAL=0 and SILENT_LOSS=0 within recovered scope.
Reverse Reconstruction Test must reproduce intended Ready behavior without requiring historical REV documents.
