# READY_SET_RUNTIME_STATE_MODEL

Status: ACTIVE_RENEWED_CANONICAL
Generation: READY_RENEWAL_01

## Identity
assignment_id → analysis_id → learning_unit_id → allocation_run_id → todo_id → session_id → task_id → lap_id → progress/observation/carry_over_id

## FACT
INPUT_CAPTURED → CONFIRMATION_REQUIRED if conflicting → FACT_CONFIRMED → READY_FOR_INTERPRETATION → INTERPRETED.
Revision supersedes old analysis/units but preserves historical execution under its original revision.

## TODO
PLANNED → IN_PROGRESS → COMPLETED/PARTIAL/DEFERRED/WAITING_FOR_PARENT/BLOCKED.
SUPERSEDED is administrative.
Only PLANNED may start. IN_PROGRESS has session ownership. Terminal TODOs do not restart directly.

## Session
READY → ACTIVE → WRAP_UP → ENDED.
Exactly one authoritative finalization path.

## Task
PENDING → one of COMPLETED/PARTIAL/DEFERRED/WAITING_FOR_PARENT/BLOCKED.
A session default may never overwrite the task result.

## Lap
ACTIVE → ENDED.
APP_SWITCH does not automatically end a Lap.

## Wrap-up
Known states → identify only unresolved tasks → minimal clarification → resolve every task → finalize exactly once → emit Planner outcomes/history → clear active session.

## Result
Transient Result exists only for the just-ended session and is consumed after leaving Result.
Historical records live in History/Calendar and are never reused as a fresh result.

## Carry-over
PARTIAL/DEFERRED may replan.
WAITING_FOR_PARENT/BLOCKED require resolution.
Repeated/deadline-risk carry escalates.
Preserve root_todo_id/source_todo_id/carry_over_id lineage.

## Current runtime relation
Current exact-main runtime has a single per-task outcome finalization path verified by Runtime E2E.

The remaining runtime renewal work is not to recreate the session engine. It is to close:
- real cross-app Ready ↔ Hide & Seek / Snap & Pop roundtrip;
- device background/lock continuity on physical iPhone;
- child-input confirmation handoff into FACT;
- Planner real-life availability/replan inputs.

Hard:
- never restore a legacy bulk completion path after per-task finalization;
- do not convert device-only uncertainty into a reason to reopen already verified browser runtime behavior;
- do not claim cross-app/device continuity from browser-only evidence.
