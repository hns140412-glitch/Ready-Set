# Focus Timer Golden Acceptance Checklist

Status: REVIEW GATE / HARD LOCK
Task: `RNS-P0-FOCUS-TIMER-GOLDEN-001`
Canonical: `docs/FOCUS_TIMER_GOLDEN_CANONICAL.md`

This checklist does not create new product criteria. It operationalizes the already approved Golden/reference rules so TAKY and Codex do not reinterpret them during implementation.

## 1. Visual identity

- [ ] Yellow Focus identity is preserved.
- [ ] Primary Golden copy/mission hierarchy is preserved unless a newer canonical source explicitly supersedes it.
- [ ] Full White/Ivory analog clock is the dominant hero.
- [ ] Entire clock circle is visible; no forced crop.
- [ ] Numerals 1–12 are rendered and readable.
- [ ] `Ready & Set` clock identity is present.
- [ ] Dark Control Panel stays visually subordinate to the clock.
- [ ] Background/editorial decoration supports the Golden and does not replace/reinterpret it.

## 2. Analog clock

- [ ] Clock face/rim/numerals/branding may be image/SVG/CSS, but hands are separate dynamic UI layers.
- [ ] Hour/minute/second hands represent current local wall-clock time, matching the current implementation semantics unless explicitly superseded later.
- [ ] Hand positions derive from current timestamps; no cumulative interval drift after background/app switch.
- [ ] Session Remaining/Target/Focus times remain separate from analog wall-clock hand semantics.

## 3. Timer / REC

Normal mission:
- [ ] `남은 시간 | 목표 시간`

Active `영어 · 문장 녹음` mission:
- [ ] `남은 시간 | REC | 목표 시간`
- [ ] REC is centered between Remaining and Target.
- [ ] REC is inactive/hidden for unrelated missions.
- [ ] REC target is >=44×44 CSS px.
- [ ] Accessible label is `문장 녹음`.
- [ ] Recording completion has explicit `REC ✓` or equivalent non-color-only state.
- [ ] Recording round trip returns to the same active session without timer reset.

## 4. Responsive placement — DO NOT REINTERPRET

Phone:
- [ ] Same approved UI composition fitted to the screen.
- [ ] Clock/timer/panel relative placement is preserved.

Tablet / wide:
- [ ] Clock and timer/control panel relative placement is unchanged.
- [ ] UI is not redesigned into separate left/right columns.
- [ ] Approved timer UI composition and scale intent are retained as one block.
- [ ] Yellow/editorial background canvas is expanded.
- [ ] The unchanged timer UI block is placed toward the RIGHT side of the expanded canvas for right-hand touch accessibility, matching the Golden responsive board.
- [ ] Added left-side area is background/editorial expansion only.
- [ ] Any unapproved relative movement of clock vs timer/panel = `REGRESSED`.

Canonical shorthand:
`PHONE = same UI fitted to screen`
`TABLET = same UI block + background extension + right-side placement`

## 5. Session behavior

- [ ] Timestamp-derived timer semantics remain intact.
- [ ] Background/visibility restoration remains intact.
- [ ] `APP_SWITCH != PAUSE` remains intact.
- [ ] Pause remains distinct from recording/system wait.
- [ ] Focus visual restoration causes no timer/session reset.

## 6. Evidence gate

- [ ] Actual phone render captured (minimum representative width: 390px).
- [ ] Actual tablet/wide render captured.
- [ ] Actual Golden bytes used for side-by-side visual comparison when available to executor/reviewer.
- [ ] Each material item classified `PRESERVED | IMPROVED | CHANGED | REGRESSED | UNKNOWN`.
- [ ] Zero `REGRESSED` items for TAKY PASS.
- [ ] Any `UNKNOWN` blocks visual PASS.
- [ ] `CODEX_DONE != TAKY_PASS`.

## Explicit prohibition

Neither TAKY nor Codex may change an approved placement/design rule merely because another layout appears cleaner, more balanced, more responsive, or easier to implement. Such alternatives may be reported as proposals only and remain unapplied until explicit user approval.
