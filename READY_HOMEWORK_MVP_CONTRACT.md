# Ready & Set — Homework MVP Contract

Status: PREVIEW BRANCH CONTRACT
Branch: `runtime-session-bridge-2026-09-10`
Authority: TAKY / Family Learning OS / Ready & Set

## 1. MVP completion line

The character onboarding branch is complete when a child has a confirmed character and can enter Ready. Immediately after that, Ready must help the child start real homework. Character customization beyond confirmation is not part of this MVP.

Canonical path:

`PHOTO → 3-step STYLE CONSULTATION → 3 CANDIDATES → SELECT → RESEMBLANCE REFINEMENT → CHARACTER CONFIRMED → READY HOME → HOMEWORK START`

## 2. Ready ownership

Ready is the base camp / goal and session orchestrator.

- Schedule first, assignment second.
- One island = one learning session.
- One session may contain multiple homework tasks and specialist-app visits.
- Ready owns the canonical session state.
- One active task/lap at a time.
- Task switch ends the current lap and starts another.
- App switch does not automatically pause, end a lap, or end the session.
- Session end is not the same as task completion.

## 3. Homework FACT input

Minimum parent/input facts for each task:

```json
{
  "task_id": "task_*",
  "subject": "영어",
  "title": "영어 숙제",
  "volume": "p.12~18",
  "deadline": "2026-09-12",
  "required": true,
  "source": "PARENT|PHOTO|MANUAL|PLANNER",
  "status": "PLANNED",
  "estimate_min": null,
  "estimate_kind": "UNVERIFIED|BASELINE|MANUAL|LEARNED"
}
```

Rules:

- Never invent missing volume, deadline, or difficulty.
- Unknown values remain explicitly unverified.
- Time estimate is auxiliary; homework amount is the primary fact.
- Required teacher/academy homework is not deleted by the Planner. Planner may change order, split, or timing.

## 4. Child-facing Ready Home

After character confirmation, the first child-facing home state should be intentionally simple.

Primary card:

- Character + explorer companion
- `오늘 뭐부터 탐험할까?`
- Today task count / current task
- One dominant CTA: `숙제 시작`

Secondary actions:

- `오늘 할 일 보기`
- `숙제 추가` for parent/admin flow

Do not show configuration-heavy planner fields on the child's first screen.

## 5. Start interaction

When child taps `숙제 시작`:

1. If there is exactly one ready task, activate it immediately.
2. If there are multiple tasks, show a short task picker ordered by Planner priority.
3. If there are no tasks, show a non-error empty state and route to parent/admin homework input.
4. Timer is optional. Starting homework must not require choosing a timer first.

## 6. Active session contract

```json
{
  "session_id": "session_*",
  "state": "ACTIVE|PAUSED|ENDED",
  "started_at": "ISO-8601",
  "ended_at": null,
  "active_task_id": "task_*",
  "active_lap_id": "lap_*",
  "task_order": ["task_*"],
  "target_min": null
}
```

Lap:

```json
{
  "lap_id": "lap_*",
  "task_id": "task_*",
  "started_at": "ISO-8601",
  "ended_at": null,
  "end_reason": null
}
```

Allowed lap end reasons:

- `TASK_SWITCH`
- `TASK_COMPLETED`
- `TASK_PARTIAL`
- `TASK_DEFERRED`
- `TASK_BLOCKED`
- `WAITING_FOR_PARENT`
- `SESSION_END`

## 7. Task states

Canonical task result states:

- `COMPLETED`
- `PARTIAL`
- `DEFERRED`
- `BLOCKED`
- `WAITING_FOR_PARENT`

A session may end while one or more tasks are still incomplete.

## 8. Specialist apps

Within an active Ready session:

- Hide & Seek = vocabulary specialist.
- Snap & Pop = thought/expression specialist.
- Opening a specialist preserves `session_id`, `active_task_id`, and `active_lap_id` unless the child explicitly changes tasks.
- Returning to Ready resumes the same task/lap when appropriate.

## 9. Timer

Timer implementation must use timestamps, not decrement-only memory state.

- Backgrounding Safari/PWA must not silently reset elapsed time.
- App switch must not implicitly pause the session.
- Target time is optional and separate from homework volume.

## 10. Mobile-safe update rule

During an active session:

- Do not force reload.
- Do not replace canonical session state during deploy/update.
- Preserve recoverable local state before any schema migration.

## 11. MVP acceptance criteria

PASS requires all of the following:

1. Confirmed character enters Ready without repeating onboarding.
2. Ready Home shows the confirmed character and today's homework entry point.
3. A real homework task can be created/loaded without inventing missing facts.
4. Child can start one task without selecting a timer.
5. A canonical session + active task + lap are created.
6. Task switch closes only the lap and preserves the session.
7. Hide/Snap visit preserves session/task context.
8. Session can end with COMPLETED/PARTIAL/DEFERRED/BLOCKED/WAITING_FOR_PARENT outcomes.
9. Refresh/background recovery does not silently reset session timing.
10. Main/production remains untouched until preview/mobile verification passes.

## 12. Current implementation mapping

Existing `ready-stage-d.js` already provides a Planner/local store, homework volume/difficulty/estimate fields, selected-task distribution to mission, optional target time behavior, and active task/specialist tooling. This contract is the target for tightening that implementation after the CHARACTER mount blocker is resolved.

No paid image generation is authorized by this contract.
