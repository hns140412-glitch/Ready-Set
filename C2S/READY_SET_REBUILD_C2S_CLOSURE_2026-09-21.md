# READY & SET REBUILD C2S CLOSURE — 2026-09-21

Status: HANDOFF_READY / REBUILD_IN_PROGRESS
Scope: Ready & Set only.
Authority branch: `taky/ready-rebuild-v01-2026-09-21`
Live code HEAD observed before closure: `59a0619a4e0369fbc935a1fc7de05cb65a73fd9c`

## 1. User intent / locked direction
- Ready & Set has the same monolith / false-completion risk identified in Snap & Pop and Hide & Seek.
- Do not continue feature accumulation on top of the monolith.
- Perform a structural rebuild / major surgery.
- Preserve verified domain assets; rebuild composition, state, view, service and ownership boundaries.
- Do not use the user as tester/debugger.
- Do not touch Snap & Pop / Hide & Seek from this conversation; those are being rebuilt in other conversations.
- No Netlify / production / main merge in this rebuild phase.
- Every implementation report must include a realistic user-facing implementation percentage.
- CODED / CI / RUNTIME / DEVICE must remain distinct.

## 2. Rebuild branch policy
Active product branch is not the direct edit target.
Dedicated rebuild branch:
`taky/ready-rebuild-v01-2026-09-21`

The old monolith remains as fallback evidence until migrated responsibility reaches parity and runtime regression passes.

## 3. Architecture direction
Target:
App Shell
→ Domain Modules
→ State / Persistence
→ Runtime Services
→ Integration Adapters
→ Views

Domain authority must not be accidentally generalized through a shared layer.

## 4. Rebuild work now present on live branch
Live tree at `59a0619...` includes:

### Planner
- `src/planner/planner-domain.js`
- `src/planner/outcome-policy.js`
- `src/planner/planner-policy-runtime.js`
- `src/planner/planner-projection-runtime.js`
- `src/planner/planner-view-runtime.js`

### Session
- `src/session/session-domain-runtime.js`
- `src/session/session-service-runtime.js`

### Shell / state / persistence
- `src/core/state-store.js`
- `src/shell/app-shell.js`
- `src/shell/navigation-runtime.js`
- `src/shell/accessibility-runtime.js`
- `src/persistence/app-state-runtime.js`

### Assignment / Capture
- `src/assignment/assignment-service-runtime.js`
- `src/assignment/capture-service-runtime.js`
- `src/assignment/capture-draft-runtime.js`

### Recording / Audio
- `src/recording/recording-service-runtime.js`
- `src/audio/audio-service-runtime.js`

### Views
- `src/views/home-view-runtime.js`
- `src/views/mission-view-runtime.js`
- `src/views/focus-view-runtime.js`
- `src/views/planner-screen-view-runtime.js`
- `src/views/planner-admin-view-runtime.js`
- `src/views/parent-intake-view-runtime.js`
- `src/views/capture-view-runtime.js`
- `src/views/recording-view-runtime.js`
- `src/views/result-history-view-runtime.js`
- `src/views/profile-settings-view-runtime.js`
- `src/views/auth-sync-view-runtime.js`
- `src/views/share-card-runtime.js`

## 5. Structural progress evidence
Original audited Ready app.js was about 105 KB.
Live rebuild `app.js` at `59a0619...` is about 64.8 KB.

This is evidence that responsibility has actually moved out of the monolith, not merely that folders were created.

Do NOT interpret file-size reduction alone as product completion.

## 6. Important runtime regression lessons captured

### A. Planner projection recursion regression
A mechanical replacement created:
`plannerTodayProjection() -> plannerTodayProjection()`
and caused:
- Maximum call stack size exceeded
- TODAY / Mission failures
- accessibility / visual audit cascading failures

Fix:
restore source authority:
`ReadySetPlanner.todayProjection() -> ReadyRebuildPlannerProjection.todayItem()`

A rebuild regression guard was added to prevent self-recursive projection.

### B. Planner Admin extraction over-cut
A block replacement accidentally removed about 19.8 KB between
`renderPlannerAdmin()` and `renderParentIntake()`, including:
- schedule edit/save wiring
- availability wiring
- capture helpers / renderCaptureIntake
- capture event handlers

Runtime caught:
- `renderCaptureIntake is not defined`
- missing saveScheduleBtn wiring
- Planner Admin schedule test failure

Fix:
restore only the missing tail from the last PASS commit while retaining the new Planner Admin view delegation.

Lesson:
Never replace a broad text interval based only on neighboring function names.
Use exact function-body boundaries / AST-like brace scanning and runtime regression.

## 7. Verified migration milestones before latest parallel progress
Confirmed PASS checkpoints during this conversation:
- planner/session/navigation connection after recursion fix: Runtime E2E PASS
- app-state persistence extraction: Runtime E2E PASS
- Mission/TODAY view extraction: Runtime E2E PASS
- Focus view extraction: Runtime E2E PASS
- Planner Admin restore after over-cut: Runtime E2E PASS
- Parent Intake view extraction: Runtime E2E PASS
- Capture helper service connection commit `ce65dc0645036242858c2b51e0ac3b9e9a048bac`: Runtime E2E PASS

## 8. Latest parallel branch progress discovered before handoff
The same rebuild branch advanced further outside this conversation.
Recent commits include:
- `4bd03e5...` extract recording view runtime
- `d6237cc...` load recording view runtime
- `5c7d610...` transfer recording UI ownership
- `5ebb3f2...` extract capture draft application
- `991b32b...` load capture draft runtime
- `eb64b8d...` transfer capture draft application ownership
- `a0ccf5d...` prepare share card runtime
- `59a0619...` lock recording and capture draft ownership

Do NOT overwrite or redo these blindly.
Always live-refresh branch HEAD before the next edit.

## 9. Latest validation state at closure
At the time of C2S closure:
- HEAD `59a0619a4e0369fbc935a1fc7de05cb65a73fd9c`
- Rebuild Foundation workflow run `35599385239`: SUCCESS
- Ready Runtime E2E run `35599385063`: IN_PROGRESS at last check

Therefore:
- STRUCTURE / CI for latest HEAD: verified
- latest exact-head Runtime E2E: DO NOT CLAIM PASS until live rechecked
- DEVICE_VERIFIED: 0 / not run
- PRODUCTION_VERIFIED: not applicable / not deployed

## 10. Next-work order
1. Live-refresh current rebuild HEAD and workflow results.
2. If latest exact-head Runtime E2E passes, continue from current migrated ownership; do not repeat prior extraction.
3. Inspect `app.js` remaining responsibilities quantitatively before edits.
4. Prioritize remaining monolith responsibilities:
   - share-card actual wiring if still shadow-only
   - residual Capture orchestration / analysis request UI coupling
   - remaining recording event/orchestration coupling
   - Result/History residual handlers
   - Profile/Settings residual handlers
   - auth/sync residual handlers
   - final shell/bootstrap cleanup
5. For each slice:
   - exact function-boundary extraction
   - preserve authority
   - add ownership regression guard
   - run rebuild CI
   - run Runtime E2E
   - only then remove old path
6. No deployment / Netlify / main merge.

## 11. Implementation-rate reporting rule
Keep separate:
- EXISTING_PRODUCT_USABLE_IMPLEMENTATION
- REBUILD_MIGRATION_COMPLETION

Last conversation estimate before latest parallel progress:
- usable Ready & Set: about 50–52%
- rebuild migration: about 38–42%

Because live branch advanced materially to app.js ~64.8 KB and added more migrated modules, rebuild migration must be re-audited in the next conversation before giving a new percentage.
Do not simply increment it from commit count.

## 12. C2S closure
Recovered scope:
- user direction: mapped
- structural decisions: mapped
- regression/correction evidence: mapped
- verified PASS checkpoints: mapped
- parallel-branch conflict risk: mapped
- latest exact-head runtime uncertainty: explicitly OPEN
- next actions: mapped

UNMAPPED_MATERIAL = 0 within this Ready rebuild conversation scope.
SILENT_LOSS = 0 within recovered scope.
FALSE_CONVERGENCE = avoided: latest Runtime is not called PASS while still running.
