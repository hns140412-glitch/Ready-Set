# READY & SET REBUILD HANDOFF — LATEST — 2026-09-21

## Resume command
최신 TAKY 기준으로 Ready & Set 대수술을 재개해.

Repository:
- `hns140412-glitch/Ready-Set`

Authority rebuild branch:
- `taky/ready-rebuild-v01-2026-09-21`

First read:
1. `C2S/READY_SET_REBUILD_C2S_CLOSURE_2026-09-21.md`
2. `C2S/READY_SET_REBUILD_ATOMS_2026-09-21.json`
3. `REBUILD/READY_REBUILD_MANIFEST_V01.md`
4. `REBUILD/validate-rebuild-v01.mjs`
5. this handoff

## Mandatory first action
Live-refresh branch HEAD and workflow status before any edit.

Observed HEAD at handoff preparation:
`59a0619a4e0369fbc935a1fc7de05cb65a73fd9c`

Foundation at observed HEAD:
- run `35599385239` SUCCESS

Runtime at observed code HEAD:
- run `35599385063`
- FAILURE
- primary error: `ReferenceError: Cannot access 'homeView' before initialization`
- cascading navigation / Planner Admin / Mission failures followed

FIRST TASK IN NEXT CHAT:
1. inspect initialization order around Home View extraction / navigation bootstrap
2. repair the TDZ/ordering regression with the smallest change
3. run Rebuild Foundation + exact-head Runtime E2E
4. continue extraction only after both pass

## Current rebuild shape
The branch already contains migrated modules for:
- planner domain/policy/projection/view
- session domain/service
- navigation/accessibility shell
- app-state persistence
- assignment service
- capture service + capture draft
- recording service
- audio service
- home/mission/focus/planner/planner-admin/parent-intake/capture/recording/result-history/profile-settings/auth-sync views
- share-card runtime preparation

Live `app.js` at observed HEAD: about 64.8 KB.
Do not restart extraction from the old 105 KB baseline.

## Critical corrections to preserve
1. Never create a self-recursive planner projection wrapper.
2. Never replace a broad range between function names without exact brace/function boundaries.
3. Never delete event wiring merely because view rendering moved.
4. View ownership, service ownership and domain authority are separate.
5. Every migrated slice requires:
   STRUCTURE → FUNCTIONAL → JOURNEY/UI → RUNTIME evidence.
6. DEVICE remains unverified unless physically run.
7. No Netlify / deploy / main merge.

## Parallel-work protection
This branch was advancing concurrently.
Recent live commits after this conversation's earlier work include recording/capture-draft/accessibility/share-card work.

Before each edit:
- read live HEAD
- inspect changed files
- apply delta only
- do not overwrite newer work
- do not redo modules already migrated

## Next sequence
After repairing the current exact-head Runtime FAIL and confirming PASS:
1. re-audit remaining `app.js` responsibilities
2. finish share-card wiring if still shadow-only
3. finish residual Capture orchestration split
4. finish residual Recording orchestration split
5. finish Result/History residual handlers
6. finish Profile/Settings residual handlers
7. finish Auth/Sync residual handlers
8. final bootstrap/app-shell cleanup
9. add ownership guards and full runtime regression after each slice

## Reporting
Every answer must include:
- current CODED / CI / RUNTIME / DEVICE status
- real user-facing Ready implementation %
- rebuild migration %
- explicit OPEN/BLOCKED items

Do not inflate percentage based on file count or validator count.

## Baseline at handoff
Prior user-facing estimate: ~50–52%.
Prior rebuild estimate before latest parallel progress: ~38–42%.
Because the branch advanced substantially, re-audit rebuild % before updating it.

## Scope
Ready & Set only.
Snap & Pop and Hide & Seek rebuilds are owned by other conversations.

## Character Visual ID separation — 2026-09-22
Character generation is NOT part of Ready & Set implementation.

Independent development branch:
- `taky/character-visual-id-core-2026-09-22`

Ready integration contract:
- `INTEGRATION/CHARACTER_VISUAL_ID_CONTRACT_V01.md`

Ready responsibilities:
- continue Ready planner / mission / focus / result / assignment / learning work independently
- keep only a nullable `profile.characterVisualId` consumer slot
- do not load Character generation runtimes
- do not own photo identity generation, mood consultation, A/B/C candidates, likeness correction, provider calls, or Character Master generation

Integration is deferred until Character Visual ID core is independently complete and its projection contract is frozen.

Intro / Drop / Voyage / World Arrival remain a separate later expansion track.
