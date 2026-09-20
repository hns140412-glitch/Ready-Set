# READY_SET_RUNTIME_STATE_MODEL

Status: ACTIVE_REWRITE_CANONICAL
Generation: READY_C2S_REWRITE_01

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

## Rewrite target
Absorb ready-runtime-v07 compatibility behavior into one canonical session runtime.
Never call a legacy bulk completion routine after per-task finalization.
