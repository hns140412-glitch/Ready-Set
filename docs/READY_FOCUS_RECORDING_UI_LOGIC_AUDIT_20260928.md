# Ready Focus Golden / Recording UI–logic trace — 2026-09-28

STATUS: DRAFT IMPLEMENTATION EVIDENCE, not approval or deploy authorization.

## Authority and preservation
- Starting code: `taky/ready-character-intro-integration-2026-09-24` EXACT HEAD `a675b93d0dbe7c1297ba0ad1889907ceffc1fbf1`.
- Golden visual: Library/Drive `Ready_Set_Focus_UI_Phone_Tablet_Golden_Reference_REV_01.jpeg`. Visual evidence file `Ready_Set_Focus_Golden_Reference_REV_01.md` is archived from **semantic authority** but its cited combined visual reference remains a preserved, explicitly locked visual. Do not recreate/crop it as the UI.
- Phone: same complete center stage; tablet: same-size full UI in right touch zone and only background expanded left. No redesign or extra permanent screen.
- Product contract: `READY_SET_CANONICAL_PRODUCT_CONTRACT.md`; state owner: `READY_SET_RUNTIME_STATE_MODEL.md`.
- Existing UI/Focus CSS untouched in this patch. No new character or asset.

## Existing UI/function owner mapping
| Visible surface/action | Source of truth and runtime | Proof needed / state |
|---|---|---|
| Golden yellow field, clock layout, tablet right anchor | `index.html` Focus DOM + `styles.css` | Preserve original; structural viewport check only, image parity and device still OPEN |
| Actual analog clock hands | `src/views/focus-view-runtime.js` `renderTick(new Date())` | current device time, never flattened image |
| Selected mission/current task | `ready-runtime-v07.js` active task `renderContractUI` | must not display another task's REC |
| Remaining/target, focus/ISSUE, start time | `session-domain-runtime.js.times` and Focus View, timestamp-derived | app/REC switch does not pause |
| Upper-right sound/BGM / OFF | `mission-focus-controller-runtime.js` and `audio-service-runtime.js` | sound state and playback/errors reflected |
| Pause/Resume | `mission-focus-controller-runtime.js` | explicit only, timestamp-derived issue |
| Complete | `ReadySetRev07.openWrapUp` once → task-by-task outcomes → Result; legacy fallback when REV07 unavailable | no second global outcome overlay |
| Conditional REC | active REV07 task `activity_types:['RECORDING']`; controller rechecks eligibility | not based on a different task in the session |
| Record start/stop | `recording-orchestrator-runtime.js`, real MediaRecorder/mic | unsupported/denied/error/empty fail-closed |
| REC timer + BGM | same Ready session running, BGM paused; `#recordTimerContext` updated once/second | no alternate timer or automatic session pause |
| Playback/re-record | Recording View owns blob preview URL and revokes it on retry/leave | no overlapping old preview with new microphone capture |
| Save/return | IndexedDB `readyset_audio`, then session recordingRef including active task ID; re-enter same Focus session | storage failed → no success; no fake format conversion |
| Result/history playback | `result-history-view-runtime.js` loads recordingRef from local IndexedDB | NOT a cloud cross-device audio-sync promise |
| Voice guide | speech synthesis reads generic guidance only | NOT automatic quality grade or speech analysis |

## Actual correction on this branch
- One owned completion handler and approved visible text `완료했어요`.
- When active task changes, refresh REC condition using typed task data; controller repeats guard.
- Same timestamp-based time remains visible in REC screen.
- Reject empty/error capture; release old preview URL; require explicit confirmation to discard unsaved audio.
- Fail-closed storage; no session `recordingDone` or `recordingRef` unless real audio storage succeeds and state is successfully saved.
- Truthful review text: file created and user should listen; no fabricated pronunciation/reading evaluation.
- Real session/task ID kept; BGM resumes only after returning and only when enabled.
- Browser checks use a fake microphone for deterministic integration; this does NOT certify real iPhone microphone, native audio/MIME, cloud provider, or Netlify.

## Outstanding checks / no silent upgrade
1. 390×844 active REV07 panel must not push Pause/Complete below the viewport; if it does, preserve Golden composition and route extra controls via a contextual overlay, not a permanent panel.
2. Compare actual screenshots at phone and tablet dimensions with combined Golden composition, without embedding Golden as static wallpaper.
3. Test real iPhone Safari microphone permission, MP4/WebM behavior, playback, screen lock, incoming call/app switch, and persistence.
4. Verify family/member-scoped media ownership, backup/sync limits, unsupported microphone recovery and actual export/submission provider separately.
5. Full Ready main cross-app CI and Hide evidence mismatch remain separate OPEN; this bounded test does not certify release.
6. End-to-end three-screen Planner/FACT/OCR integration, real device and production are not covered by this patch.

Release status: HOLD. Main merge, Netlify deployment, old PR #116-based scaffold reuse: prohibited without gate and explicit approval.
