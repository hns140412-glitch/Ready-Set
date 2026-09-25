# 2026-09-11-ready-continuity-b-v2 — implementation evidence

State requested: **TAKY_REVIEW**, not TAKY_PASS. No commit, push, merge, release or deployment.

## Execution context and contract

- Actual starting/current HEAD: `3378128c1e4d8056c6a1f08078cf8788c6053298`.
- Current branch retained: `runtime-session-bridge-2026-09-10`; initial worktree clean.
- Cached origin branch has the same SHA. **Live remote HEAD UNVERIFIED**: `git fetch origin` failed with `cannot open '.git/FETCH_HEAD': Permission denied`. Read-only `ls-remote` also failed because the installed Git could not locate `remote-https`. No branch switch/update attempted under the user's current-branch instruction.
- The named task file is absent from `.taky/tasks`; the user's inline execution contract supplies scope, exclusions, acceptance, checks and delivery instructions. Source semantics: `Ready_Set_Ui_Master_Logic_REV_07.md` continuous timer/specialist routing and REV_06 sections 19 and recovery.

## Recovered existing behavior vs fixes

Existing: one `readyset_state.activeSession` owner, timestamp start/target, explicit pause, REV_07 session/goal/task/lap identifiers, task-switch lap transitions, validated specialist result ownership, manual Planner-result publication and recording as learning activity.

Fixed: reload boot opens the active Focus and restores its display ticker; pageshow/focus/visibility recovery refreshes elapsed wall time without starting another session. Repeated Start returns to the active session. Planner/native/pending selection cannot clear or reload an active session. Canonical contract initialization now runs on the current base-runtime Start path, and Focus renders the actual REV_07 API instead of the obsolete API name.

Added: versioned/provenance-tagged interruption intervals inside the existing session. Pause, Issue and System Wait remain distinct; overlapping exclusions count once against Focus. Legacy aggregate values remain available. Recording storage wait is explicitly marked System Wait and cleared on success/failure; actual recording remains Focus. Lap Focus publication uses session timing instead of raw wall time. Handoff projects timing, interruptions, state owner and retained return target; Ready does not import specialist timer authority. Repeated identical task/result events are idempotent.

No automatic offline pause/end or network dependency was introduced. No lock-screen display/native enhancement was implemented. No first-run, character, parent requirement, paid generation, location, rewards or WEEK/DAY design change.

## Exact changed files

- `ready-base-runtime-v1.js`
- `ready-runtime-v07.js`
- `ready-focus-tools-v1.js`
- `ready-base-native-v2.js`
- `ready-planner-selection-bridge-v1.js`
- `ready-stage-g13-authority-recovery.js`
- `tests/ready-continuity-b-v2.mjs`
- `tests/ready-continuity-browser.html`
- `docs/CONTINUITY_B_V2_EVIDENCE.md`

## Checks (2026-09-25)

`node --check` passed for all six changed runtime JS files. `git diff --check` passed (only Git line-ending notices).

New deterministic harness: `node tests/ready-continuity-b-v2.mjs` — **exit 0**. Executes production base/REV_07 code in a VM with synthetic DOM, storage and controlled clock. Covers background elapsed time, explicit pause, overlapping Issue/System Wait, recording and actual recording-save function success/failure, Hide/Snap outbound transport plus local return, task lap transition, offline/reconnect events, synthetic persisted pageshow, new-context restore including active pause, duplicate Start/ticker/result protection, Planner selection guards and legacy migration. No real external navigation, media capture or device lifecycle is claimed.

Existing tests with **exit 0**:

- `ready-daily-loop-result-planner-contract.mjs`
- `ready-foundation-assignment-bridge-contract.mjs`
- `ready-foundation-assignment-bridge-execution.mjs`
- `ready-homework-analysis-contract.mjs`
- `ready-homework-analysis-parent-confirm-integration.mjs`
- `ready-homework-parent-confirm-planner-e2e.mjs`
- `ready-manual-learning-contract.mjs`
- `ready-mood-direction.mjs`
- `ready-parent-capture-contract.mjs`
- `ready-planner-actual-history-replan-e2e.mjs`
- `ready-schedule-delta-planner-e2e.mjs`
- `ready-schedule-recurring-revision-planner-e2e.mjs`

Existing checks with **exit 1**, not PASS:

- `ready-first-journey-parent-home.mjs`, `ready-first-journey-transition.mjs`: Playwright package unavailable.
- `ready-first-journey-semantics.mjs`: synthetic DOM lacks `remove()` used by unchanged current loader.
- `ready-first-run-parent-activation-contract.mjs`: unchanged loader does not expose expected canonical identity-v2 declaration.
- `ready-foundation-contract.mjs`: unchanged loader lacks expected `AFTER_IDENTITY` declaration.
- `ready-specialist-bridge-contract.mjs`: external `/tmp/hide-bridge.js` fixture absent. Its old source-format assertions also cannot substitute for execution evidence.

`ready-first-journey-parent-setup-contract.mjs` is absent. Loader/First Journey mismatches were not rewritten under this continuity task.

## Runtime and remaining boundaries

**DEVICE_UNVERIFIED**: real browser/mobile run. A dedicated synthetic fixture was prepared for `http://127.0.0.1:8097/tests/ready-continuity-browser.html`, loading the actual index in a 390px iframe. Browser security policy denied localhost access; the fixture was not executed and no alternate browser route was attempted.

iPhone checks outstanding: Safari/PWA background and lock/unlock elapsed continuity; genuine BFCache/back-forward restore; process eviction/reload with persisted pause/Issue; Hide and Snap installed/deployed bridge consumption and return; recording/microphone interruption and storage completion; offline cached boot and reconnect. Headless synthetic events do not establish these results.

Architectural boundary: this repository owns Ready only. Specialist adoption of the additional timing projection is unverified without their code/devices. Fresh boot closes an orphaned recording-save wait as `INTERRUPTED_UNVERIFIED`, allowing Focus to continue without claiming that audio was saved; actual IndexedDB completion remains unverified. The harness checks this recovery. Legacy aggregate-only sessions cannot reconstruct historical interval placement precisely. Lock-screen visibility remains ADR/native work.

Resulting commit: none, by instruction; HEAD unchanged. Gateway/TAKY must review failed/unverified gates before promotion.
