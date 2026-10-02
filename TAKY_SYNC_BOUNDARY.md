# Ready & Set Sync Boundary

Authority: TAKY `TAKY_SYNC_CONTRACT_V1.md`.

Ready & Set must preserve planner/session/task context while applying the shared TAKY sync rules:
- local persistence is cache/queue only unless an app-specific canonical contract explicitly says otherwise;
- stable record identity is mandatory;
- conflict detection uses version/time plus canonical fingerprint where available;
- direct authorized canonical edits win over stale cached values;
- conflicted offline mutations must never silently overwrite newer canonical data;
- successful writes require canonical readback verification.

Ready-specific context that must survive sync:
`session_id / goal_id / task_id / lap_id / dated_todo_id / return_target`.

No deployment state is implied by this contract.
