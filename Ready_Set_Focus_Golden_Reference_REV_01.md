# Ready & Set Focus Golden Reference — REV_01

> Status: CANONICAL PROJECT UI REFERENCE / HARD LOCK
> Date: 2026-09-14
> Applies to: Ready & Set Focus / Time Attack screen
> Parent authority: `Ready_Set_Ui_Master_Logic_REV_07.md` inheriting REV_06
> Brand line: **그냥! 지금 하면 돼!**

## 0. PURPOSE — HARD LOCK

This file exists so a new conversation, agent, Codex session, handoff, or implementation task can reproduce the approved Focus UI without depending on an old chat screenshot.

`RULE EXISTS BUT ORIGINAL IMAGE IS NOT AVAILABLE` is NOT an acceptable stopping condition for this Focus screen while this canonical contract and repository implementation are recoverable.

The canonical reconstruction route is:

`THIS FILE → Ready_Set_Ui_Master_Logic_REV_07.md → inherited REV_06 Golden rules → index.html Focus DOM → styles.css Focus composition → app.js/runtime behavior → actual rendered result`

A historical screenshot is supporting witness evidence, not the sole recoverability path.

If a future worker cannot see the original conversation image, it SHALL reconstruct from this contract and the repository implementation. It SHALL NOT downgrade the approved design to UNKNOWN merely because the screenshot is absent.

Only if this file, the parent MASTER, and the implementation routes above are all unavailable may source coverage be marked UNVERIFIED.

## 1. APPROVED VISUAL IDENTITY — HARD LOCK

The approved Focus screen is a single high-density composition, not a generic dashboard.

Required visual hierarchy:

1. vivid Focus Yellow background
2. oversized black two-line headline: `그냥! / 지금 하면 돼!`
3. white/ivory mission pill below headline
4. large full circular White/Ivory analog clock hero
5. handwritten encouragement copy around the clock
6. black/dark charcoal control panel below the clock
7. remaining time as primary numeric information
8. target time as secondary numeric information
9. mission + BGM state row
10. two primary action buttons: `잠깐 멈춤` / `완료했어요`
11. start / focus / issue time row
12. floating music control at upper-right inside app UI

The result SHALL preserve the visual relationship among these items, not merely contain similar components.

## 2. OS STATUS BAR / SAFE AREA — HARD LOCK

Do not draw or fake:
- device time
- cellular signal
- Wi-Fi
- battery percentage/icon
- Dynamic Island / notch artwork

Those belong to the operating system.

Implementation starts below the real safe area using `env(safe-area-inset-top)` and corresponding left/right/bottom safe-area values.

`OS STATUS BAR ≠ APP UI`.

## 3. NO CROPPED SCREENSHOT IMPLEMENTATION — HARD LOCK

The approved screenshot SHALL NOT be used as a flattened full-screen background, crop, or image-map substitute for the live UI.

All functional UI is recreated as live HTML/CSS/SVG/Canvas/DOM elements as appropriate.

The analog clock, timer values, mission data, BGM state, buttons, and session stats MUST remain live and accessible.

Background decoration may use original authored assets, gradients, vector shapes, stars, speed lines, or illustration layers, but the functional composition must not depend on a screenshot crop.

`LOOKS IDENTICAL ≠ FLATTENED SCREENSHOT`.

## 4. ANALOG CLOCK — LIVE CURRENT TIME — HARD LOCK

The analog clock is a real current-time clock, not a fixed decorative illustration.

At render time and continuously thereafter:

- second hand angle = `seconds * 6deg + milliseconds * 0.006deg`
- minute hand angle = `minutes * 6deg + seconds * 0.1deg`
- hour hand angle = `(hours % 12) * 30deg + minutes * 0.5deg + seconds / 120deg`

Update at least once per second. Smooth updates are allowed/preferred where battery/performance remains reasonable.

The Focus countdown remains a separate session timer. The analog clock displays actual local current time.

`CURRENT CLOCK TIME ≠ SESSION REMAINING TIME`.

Clock visual lock:
- complete uncropped circle
- White/Ivory face
- thin refined rim
- readable black numerals
- precise black hour/minute hands
- thin yellow/gold second hand
- yellow/gold center pin accent
- subtle premium depth/shadow
- `Ready & Set` branding near center
- no thick black wall-clock treatment

## 5. PHONE COMPOSITION — HARD LOCK

On phone portrait:
- Focus composition uses the available viewport width while preserving the approved vertical hierarchy.
- headline, mission pill, clock, and dark panel remain centered as one composition.
- no bottom navigation is added to Focus unless separately approved.
- no extra tool dock is inserted under the clock.
- the clock remains fully visible and is never cropped to make room.
- layout scaling may occur only as needed to fit 320–430px class widths while maintaining proportions and touch targets.

Minimum interaction target: approximately 44 CSS px or larger for primary controls.

## 6. TABLET COMPOSITION — RIGHT-HAND TOUCH ANCHOR — HARD LOCK

Tablet and wide-screen behavior is NOT a redesign into a two-column dashboard.

The approved Focus composition remains internally intact but the whole interactive Stage is anchored toward the right-hand touch zone.

Required behavior:

`PHONE = CENTERED FULL STAGE`
`TABLET/WIDE = RIGHT-ANCHORED FULL STAGE + LEFT BACKGROUND EXPANSION`

Tablet rules:
- Stage internal ratio/order/visual relationships stay the same as phone.
- Stage does not stretch indefinitely with viewport width.
- use a max Stage width suitable for touch and legibility.
- move the Stage toward the right while keeping right safe-area / edge comfort spacing.
- do not pin controls flush to the physical glass edge.
- the left area is expanded Yellow illustration/background space.
- background stars, rays, speed lines and nonfunctional decoration may reflow/extend into the extra canvas.
- primary touch actions remain within comfortable right-side reach.
- `잠깐 멈춤` and `완료했어요` remain in the Stage and preserve their relative positions.

Recommended CSS layout model:

```css
.focusCanvas {
  min-height: 100dvh;
  padding:
    calc(env(safe-area-inset-top) + var(--focus-safe-top))
    max(env(safe-area-inset-right), var(--focus-edge))
    calc(env(safe-area-inset-bottom) + var(--focus-safe-bottom))
    max(env(safe-area-inset-left), var(--focus-edge));
}

.focusStage {
  width: min(100%, var(--focus-stage-max));
  margin-inline: auto;
}

@media (min-width: 768px) {
  .focusCanvas {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
  .focusStage {
    margin-inline: 0;
  }
}
```

Exact pixel values are implementation-owned and must be validated against the approved composition, but the behavioral rule above is locked.

## 7. BACKGROUND EXPANSION — HARD LOCK

When the viewport becomes larger, extend the canvas, not the functional composition.

`EXTENDABLE`:
- Yellow field
- orange speed/radial lines
- stars
- subtle glow
- nonfunctional decorative strokes

`COMPOSITION LOCK`:
- headline
- mission pill
- clock
- handwritten copy associated with the Stage
- dark control panel
- timer numbers
- buttons
- state/stat rows

A large tablet SHALL NOT enlarge the Stage until it becomes visually bloated. Extra space belongs primarily to the illustration background.

## 8. FUNCTION ↔ UI MAPPING — HARD LOCK

The Focus screen is a live session surface.

### Headline
Purpose: emotional start/focus identity.
It does not replace mission/task state.

### Mission pill
Shows the current active task or current mission summary.
For multi-task sessions, it reflects the active task, not the entire session as one undifferentiated label.

### Analog clock
Shows actual local current time.
Independent of countdown and Lap timing.

### Remaining time
Primary session timing output derived from timestamp-based session state.

### Target time
Shows the single session target time.

### BGM row / floating music control
Shows and controls actual BGM state.
It MUST NOT interrupt or reset session state.

### Pause
Creates explicit pause/issue state according to runtime rules.
Pause is not app switch.

### Complete
Completes the applicable current task/session flow according to current session rules.
`SESSION_END != BULK TASK COMPLETE`.

### REC
Conditional only for the applicable English/sentence-recording mission/event.
When present, its approved semantic structure is `남은 시간 | REC | 목표 시간`.
REC is a special event action, not a generic timer button.

### Start / Focus / Issue stats
Display timestamp-derived session data.
System wait and recording time SHALL NOT be silently misclassified as child issue time.

## 9. MULTI-TASK / LAP INTEGRATION — HARD LOCK

REV_07 multi-task/Lap behavior is added without destroying the approved Focus composition.

- one session
- one target time
- multiple selected tasks allowed
- one active task
- one active Lap
- task change closes current Lap and starts next Lap
- app switch does not close Lap by itself
- specialist-app routing preserves session/task/lap/timing state

UI integration SHALL be minimal and composition-preserving.
Do not add a permanent bottom tool tray or dense dashboard around the clock merely to expose new capabilities.

If a next-task cue is needed, it should appear as a contextual state/action within or adjacent to the existing control-panel system, not as a redesign of the screen.

## 10. VISUAL REGRESSION FAIL CONDITIONS

FAIL if any occur:
- generic white dashboard replaces the Focus composition
- entire screen becomes card-grid UI
- headline hierarchy is weakened into a normal app header
- clock becomes a small progress gauge
- clock is cropped
- clock becomes thick black wall-clock style
- tablet becomes left/right split functional dashboard
- Stage stretches across tablet width
- key controls move away from the right-hand touch zone on tablet
- OS status bar graphics are manually drawn
- bottom navigation appears without explicit approval
- decorative image blocks interaction or accessibility
- screenshot/background image substitutes for live controls
- analog clock hands are static
- app switch or BGM interaction resets timer/session

## 11. REPOSITORY IMPLEMENTATION ROUTE — RECOVERY CONTRACT

Current recoverable implementation paths:

- `index.html` → `#focusView`, `.focusMain`, `.clockHero`, `.controlPanel`
- `styles.css` → Focus Yellow, clock, panel, safe-area and responsive rules
- `app.js` / `ready-runtime-v07.js` → session/timer/clock/runtime behavior
- `Ready_Set_Ui_Master_Logic_REV_07.md` → current project logic
- `Ready_Set_Ui_Master_Logic_REV_06.md` → inherited detailed Golden Visual rules
- this file → approved Focus composition and responsive/touch contract

A future conversation SHALL inspect these routes before making a missing-source claim.

`SEARCH MISS ≠ SOURCE ABSENCE`.
`SCREENSHOT NOT IN CHAT ≠ GOLDEN UI UNRECOVERABLE`.
`CANONICAL SPEC + IMPLEMENTATION ROUTE = RECOVERABLE DESIGN SOURCE`.

## 12. REQUIRED VALIDATION

Every implementation change must compare the actual rendered result against this contract and classify:

`PRESERVED / IMPROVED / CHANGED / REGRESSED / UNKNOWN`

Minimum validation targets:
- phone portrait around 320px width
- common modern iPhone width class
- large phone width around 430px
- tablet portrait
- tablet landscape
- notch/Dynamic-Island safe area
- current-time analog hands
- session countdown
- pause/resume
- task/Lap transition
- BGM
- conditional REC when applicable
- offline/session restoration where applicable

`CHANGED ≠ PASS`.
`REGRESSED = FAIL`.

END — READY & SET FOCUS GOLDEN REFERENCE REV_01
