# RNS-P0-EXPLORATION-JOURNEY-001 — Ready & Set confirmed exploration journey

Status: READY_FOR_CODEX
Repository: `hns140412-glitch/Ready-Set`
Work branch: `runtime-session-bridge-2026-09-10`
Lifecycle target: TAKY_REVIEW_LOCAL
Human commit/push/deploy approval: REQUIRED

## Role
TAKY/ChatGPT = ORCHESTRATOR + REVIEWER
Codex = IMPLEMENTATION EXECUTOR
Claude = INDEPENDENT REVIEWER
Gemini = ADVERSARIAL CROSS-VALIDATOR

`CODEX_DONE != TAKY_PASS`
`MASTER PASS != IMPLEMENTATION PASS != DEPLOY PASS != RELEASE PASS`

## Objective
Implement the confirmed Ready & Set journey:

TIMER → EXPLORATION WRAP-UP → EXPLORATION REPORT → COMPLETION SHARE

This is functional completion of the confirmed product flow, NOT a redesign.

## Authority order
1. latest explicit user correction
2. RAW/original source
3. current canonical/project/runtime
4. verified Master
5. Handoff/Summary

File names such as FINAL / GOLDEN / PASS / LOCKED do not create authority.

## UI authority lock
- Preserve the user's confirmed Ready & Set explorer-style UI.
- DO NOT revive or use as authority:
  - Focus Mode
  - Time Attack
  - old Focus Golden
  - rejected Golden assets/contracts
- Functional wiring first.
- Preserve confirmed composition, spacing, typography, navigation, explorer concept and copy tone.
- If exact confirmed UI evidence is unavailable in the executor environment, do not invent a redesign. Keep existing non-rejected UI and mark visual deltas UNVERIFIED.

## Session/state locks
- ONE SESSION
- ONE ACTIVE TASK
- ONE ACTIVE LAP
- ONE SESSION STATE OWNER
- SESSION_END != TASK_COMPLETE
- APP_SWITCH != PAUSE
- SCREEN_LOCK != PAUSE
- NETWORK_FAILURE != SESSION_END
- SPECIALIST/RECORDING round trip returns to the same active session
- no second competing timer/session store

Outcome states must remain truthful:
- COMPLETED
- PARTIAL
- DEFERRED
- BLOCKED
- WAITING_FOR_PARENT

Never coerce non-completed outcomes into COMPLETED.

## 1. Timer
Reuse existing timer/session semantics.

Required:
- 10 / 15 / 25 minute targets where currently supported
- custom target where currently supported
- no-target/free-focus mode where current product rules allow
- start / running / remaining / focused elapsed / pause / resume / end
- authoritative timestamps, not interval-count truth
- reload/background/screen-lock restoration from persisted timestamps
- explicit pause only
- timer duration must not determine homework quantity
- finishing timer must preserve actual task/session outcome

Focused time must exclude paused/issue/system-wait time where evidence exists.

## 2. Exploration wrap-up
Ending the timer/session must use the existing wrap-up path rather than inventing a separate unrelated modal.

Required:
- preserve actual outcome
- SESSION_END must not silently become TASK_COMPLETE
- incomplete work remains visible
- DEFERRED/PARTIAL work remains eligible for carry-over/reschedule
- record actual timing only where evidence exists
- no fabricated achievement/quantity data

## 3. Exploration report
Report must reflect actual session evidence only.

Show where evidence exists:
- task/exploration title
- outcome/status
- target time
- actual focused time
- paused/issue time
- start/end evidence
- deferred/carry-over truth

Do NOT fabricate:
- XP
- streak
- score
- fake target time
- completion labels for non-completed states

## 4. Completion share
Share output must be derived from the same verified report data.

Required:
- PARTIAL/DEFERRED/BLOCKED/WAITING_FOR_PARENT must not be labeled complete
- sharing must not mutate session/task/planner state
- no internal IDs/debug/hidden parent data
- no fake timing/achievement data
- share/report status and timing must match

## Known defects to verify before editing
These are review findings, not blindly trusted facts. Reconfirm from source before changing:
- `publishTaskResult` may derive focus time from wall-clock including pauses
- `pausedMs` may be hardcoded to 0
- result UI may statically say COMPLETE/완료 without rendering actual status
- share handler may exist only in a file not loaded by the current runtime chain
- old Focus-related module may still be loaded and capable of reviving rejected UI
- Planner publish may fail silently when binding is unavailable

## Minimal-diff principle
Change only the smallest files necessary to satisfy this task.
Do not restore whole historical modules just to recover one handler.
Do not reintroduce rejected Focus assets while fixing timer/share behavior.

## Acceptance tests
A. 10-min target start → countdown decreases
B. pause → focused time stops accumulating appropriately; resume continues
C. background → authoritative timestamps restore state
D. reload → active-session truth restored
E. no-target session → no fake countdown/target
F. COMPLETED → truthful completed report
G. PARTIAL → remains PARTIAL everywhere
H. DEFERRED → carry-over truth preserved
I. BLOCKED / WAITING_FOR_PARENT preserved where supported
J. share uses same status/timing as report and does not mutate state
K. report reload restores persisted truth where product requires persistence
L. rejected Focus/Time Attack/old Golden UI not used as authority
M. specialist/recording round-trip preserves same active session/timer
N. duplicate start/click does not create competing active sessions/tasks/laps
O. mobile-width full-path smoke test, including representative 390px viewport

## Required validation
Before edit:
1. Read `AGENTS.md`
2. Read this task file
3. Read the live runtime files that own timer/session/result/share
4. Record current branch/HEAD
5. Verify old `RNS-P0-FOCUS-TIMER-GOLDEN-001` is SUPERSEDED

After edit:
- syntax/static checks for every changed JS/HTML file
- focused session/timer tests
- outcome-state tests
- reload/background tests where supported
- share no-mutation test
- 390px smoke test
- git status
- git diff --stat
- full diff available for TAKY review

## Execution boundary — HARD LOCK
Work only in the user's local Git-linked Ready-Set working folder.

NO:
- commit
- push
- PR create/update
- merge
- deploy
- direct implementation writes to GitHub remote

If the executor cannot persist to the user's actual linked local folder:
- do not substitute a remote write
- return `WORKTREE_PERSISTENCE_UNAVAILABLE`
- provide complete recoverable patch/diff/artifact
- stop at `TAKY_REVIEW_LOCAL`

Final lifecycle:
LOCAL SAVE → TAKY VALIDATION → HUMAN APPROVAL → COMMIT → PUSH → REMOTE HEAD VERIFY

## Delivery
Return:
- START_HEAD
- actual working-folder path
- changed files
- concise implementation summary
- exact tests and PASS/FAIL
- browser/mobile evidence
- git status
- git diff --stat
- remaining UNVERIFIED
- recoverable patch/diff if local persistence unavailable
- lifecycle = TAKY_REVIEW_LOCAL
