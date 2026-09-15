# FOCUS TIMER UI ASSET — REV 01
Status: ASSET_LOCKED
Authority: TAKY
Canonical visual source: `타임어택 집중 챌린지 UI.png` — RIGHT Focus/Timer screen.

## HARD VISUAL LOCK
- Yellow editorial Focus shell with radial/sunburst energy.
- `FOCUS MODE` black pill.
- Oversized black `타임 어택` title.
- Mission pill immediately below title.
- Full analog clock is the visual hero. Do not crop, simplify, replace with digital-only UI, or reduce to a small widget.
- Clock: white/ivory face, dark rim, readable numerals/ticks, black hour/minute hands, restrained yellow second-hand accent.
- Dark subordinate control panel below the clock.
- Time hierarchy: primary remaining/elapsed time + target time.
- Primary CTA pair: `잠깐 멈춤` / `완료했어요`.
- Pause reason controls are shown for explicit pause flow.
- Resume CTA: `다시 집중하기`.
- Guide/avatar must not overtake Timer/Mission/Recording/Result hierarchy.

## COMPONENT MAP
FT-01 FocusShell
FT-02 FocusHeader
FT-03 MissionPill
FT-04 AnalogClockHero
FT-05 TimerControlPanel
FT-06 TimeMetricPrimary
FT-07 TargetMetric
FT-08 FocusStatusBar
FT-09 PauseCTA
FT-10 CompleteCTA
FT-11 PauseReasonGroup
FT-12 ResumeCTA
FT-13 BGMAction
FT-14 ConditionalRECAction

## STATE MAP
READY / RUNNING / PAUSED / BACKGROUND_OR_LOCKED / COMPLETION_REQUESTED

- BACKGROUND_OR_LOCKED is not Pause by itself.
- COMPLETION_REQUESTED emits a request only; Timer must not authoritatively complete Planner/Daily Loop.

## TIMER CONTRACT
Timestamp is source of truth.

`totalChallenge = endAt - startAt`
`issueTime = accumulatedPausedIssueTime`
`focusTime = totalChallenge - issueTime`
`remaining = targetTime - focusTime`

Required: background/resume recalculation, session snapshot/restore, no focus accumulation during explicit Pause, duplicate timer prevention, duplicate completion-event prevention. Screen lock/app switch != Pause. System Wait != ISSUE unless explicitly classified.

## REC CONTRACT
REC is not a generic timer button. Show only for recording-applicable missions. After successful recording show `REC ✓`. REC event remains separate from Pause/Complete.

## RESPONSIVE LOCK
PHONE: Header → Mission → Full Analog Clock → Dark Control Panel. No forced clock crop. Lower content may scroll.
TABLET: preserve same hierarchy; do not redesign as dashboard/grid. Clock remains dominant.

## CODEX BOUNDARY
Codex may assemble components/styles and bind existing state/input/event interfaces. Codex must not redesign, use current repo UI as design authority, invent visual rules, crop/simplify the clock, make REC generic, change timer semantics, or mark Planner/Daily Loop complete from Timer.

## ACCEPTANCE
TAKY reviews actual diff, browser/device behavior, functional tests, impact and regression. Runtime integration is not TAKY_PASS until that review passes.
