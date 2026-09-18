# RNS-P0-STAGING-DEVICE-VALIDATION-001 — Ready & Set staging parity + iPhone runtime gate

Status: READY_FOR_EXECUTION / STAGING_SOURCE_PATH_REQUIRED
Date: 2026-09-19
Repository: `hns140412-glitch/Ready-Set`
Work branch: `taky/exploration-journey-2026-09-18`
START_HEAD: `58233891cb0411eacd3e24dc76b47ecc8f10378e`
PR: #4 (OPEN / DRAFT / MERGEABLE)
Lifecycle target: `TAKY_REVIEW_DEVICE`

## Role
TAKY/ChatGPT = ORCHESTRATOR + REVIEWER  
Codex = IMPLEMENTATION EXECUTOR when code changes are actually required  
Netlify staging = runtime verification surface

`CODE PASS != STAGING PARITY != DEVICE PASS != RELEASE PASS`

## Objective
Do not add a new feature first. Make the current confirmed Ready & Set implementation verifiable on the actual iPhone/PWA path by:

`EXACT SAFE BRANCH -> STAGING PARITY -> IPHONE DEVICE VALIDATION -> FIX ONLY OBSERVED GAPS -> REGRESSION -> HUMAN APPROVAL`

## Verified start state
GitHub source:
- branch: `taky/exploration-journey-2026-09-18`
- HEAD: `58233891cb0411eacd3e24dc76b47ecc8f10378e`
- five current PR workflow runs: SUCCESS
- current confirmed journey is already implemented at source/CI level:
  `보호자 시간표/숙제 FACT -> Planner -> 오늘 할 일 -> 미션 -> 확정 타이머 -> 필요 시 녹음 -> 종료상태 -> 탐험기록 -> 공유`

Netlify staging:
- project: `ready-set-staging-taky`
- site id: `63bd9a17-909b-4bac-8cb3-06437a628896`
- current deploy id: `6aa698853e51c883dd6a69c2`
- current deploy created: `2026-09-13T12:35:17.556Z`
- deploy title: `Deploy triggered by upload`
- `commit_ref = null`
- `branch = null`
- therefore current staging deploy is NOT evidence of branch HEAD `58233891...`

## Hard locks
- DO NOT merge to `main`.
- DO NOT deploy production.
- DO NOT redesign the timer.
- Preserve confirmed timer UI:
  - yellow focus field
  - `그냥! 지금 하면 돼!`
  - full analog clock
  - mission
  - remaining / target time
  - pause / `완료했어요`
  - BGM
  - conditional REC
- DO NOT revive:
  - Focus Mode
  - Time Attack
  - old Golden assets
  - rejected `ready-focus-tools-v1.js`
- `SESSION_END != TASK_COMPLETE`
- `APP_SWITCH != PAUSE`
- `SCREEN_LOCK != PAUSE`
- `NETWORK_FAILURE != SESSION_END`
- preserve `COMPLETED / PARTIAL / DEFERRED / BLOCKED / WAITING_FOR_PARENT` truth.
- Do not ask the user to perform developer debugging that can be completed through the controlled toolchain.

## Gate 1 — establish staging source parity
Before any device PASS claim, publish the exact safe-branch tree to staging through a traceable path.

Acceptable evidence must identify the deployed source as the same tree as START_HEAD, not merely the same app name or an old upload.

Preferred:
1. a Git-backed staging branch deployment that records source branch/commit; or
2. a deterministic archive/manual staging deployment produced from START_HEAD with a recorded source manifest.

If the available Netlify path cannot consume the exact safe branch, return:
`STAGING_SOURCE_PATH_REQUIRED`

Do not substitute a redeploy of the 2026-09-13 upload.

## Gate 2 — deployed artifact parity
After deploy, verify at minimum:
- `VERSION.json` = expected branch version
- service-worker cache version = expected branch cache version
- rejected focus module absent from active/precache path
- current exploration journey contract assets/scripts present
- no stale deploy artifact serving the old runtime

Record deploy id, publish timestamp and source trace.

## Gate 3 — actual iPhone/PWA validation
Use the real staging build on iPhone/PWA and record PASS/FAIL/UNVERIFIED for:

### Session/timer
- start one session only
- target and no-target behavior
- pause/resume
- background -> foreground
- screen lock -> restore
- reload -> same active session
- no implicit pause from app switch/pageshow

### Outcome/report/share
- COMPLETED truth
- PARTIAL truth
- DEFERRED truth
- BLOCKED / WAITING_FOR_PARENT where supported
- report and calendar show the same truthful state
- image-first/native share does not mutate state
- Kakao/share-sheet handoff where available

### Recording
- REC only when required
- timer continues during recording
- BGM stops during recording and resumes appropriately
- real iPhone supported container/MIME
- M4A/AAC when actually supported; never fake extension
- original + transfer preservation/fallback
- editable transfer filename
- native share sheet
- microphone/noise-reduction quality observation

### PWA/cache
- active session is not interrupted by update
- stale cache does not revive rejected UI
- safe update/restore behavior

### BGM
- Essential playback behavior on actual iPhone
- metronome / local nature / water paths remain functional

## Gate 4 — repair discipline
Only defects reproduced on the current staging/device path may open code edits in this task.

For each defect:
1. capture reproduction evidence;
2. identify owner/root cause;
3. make smallest durable fix;
4. add/adjust regression coverage;
5. rerun affected CI and device path;
6. preserve confirmed UI.

No unrelated refactor or cosmetic sweep.

## Existing automated regression baseline
Current HEAD workflow evidence:
- Ready First Run Parent Activation Contract: SUCCESS
- Ready Parent Capture Contract: SUCCESS
- Ready Homework Analysis Contract: SUCCESS
- Ready Foundation Assignment Bridge Contract: SUCCESS
- Ready Exploration Journey Contract: SUCCESS

These are source/CI evidence only, not device evidence.

## Completion conditions
Task may move to `TAKY_REVIEW_DEVICE` only when:
- exact safe-branch staging source is traceable;
- staging artifact parity is verified;
- representative iPhone/PWA cases are executed;
- failures are fixed or explicitly remain OPEN with evidence;
- affected automated regressions are green;
- no main/production change occurred.

Then and only then may the next transition be:
`HUMAN_APPROVAL -> main promotion / production deploy`

## Explicit OPEN item
The current Netlify project is presently evidenced as an upload-style deploy with no commit/branch trace. Establishing a safe exact-branch staging publication path is the first unresolved executable item.
