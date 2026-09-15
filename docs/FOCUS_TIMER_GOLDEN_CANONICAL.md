# Ready & Set Focus Timer Golden Canonical

Status: CANONICAL VISUAL CONTRACT / HARD LOCK
Date: 2026-09-15
Scope: Ready & Set Focus / Time Attack timer UI

## Canonical visual references

The phrase **"타이머 UI"** means the following two visual references together.

1. `Ready_Set_Focus_Timer_Golden_Reference_REV_01.jpeg`
   - role: primary mobile Focus Timer visual canonical
   - native size: 864 × 1536
   - SHA-256: `0da45388e62e72193c6f73b1f2b83d2bc38d159613cc33d74796a7f7903e7035`
   - current preserved source: ChatGPT Library

2. `Ready_Set_Focus_UI_Phone_Tablet_Golden_Reference_REV_01.jpeg`
   - role: phone/tablet responsive visual canonical
   - native size: 1536 × 1024
   - SHA-256: `880f44a7f73251a4995a67522a7ecdfd1a60cf7f50c5149cfb9ed2366b3235f7`
   - current preserved source: ChatGPT Library

The binary reference files are not yet stored in this Git branch. Their names, native dimensions and hashes above bind the intended source identity. Implementation must not substitute a different visual merely because the binary is unavailable in the executor workspace. If the exact bytes cannot be inspected by the implementation executor, visual fidelity remains `UNVERIFIED` and dispatch must not claim Golden PASS.

## Authority chain

This file does not replace the product MASTER. It binds the visual references to the existing MASTER rules.

Applicable inherited rules:
- `Ready_Set_Ui_Master_Logic_REV_07.md` inherits REV_06 unless explicitly overridden.
- REV_06 `# 14. FOCUS / TIME ATTACK VISUAL MASTER`
- REV_06 `# 15. FULL CLOCK HERO — HARD LOCK`
- REV_06 `# 16. FOCUS TIME PANEL + REC BUTTON`
- REV_06 `# 59. GOLDEN REFERENCES — HARD LOCK`
- REV_06 `# 94. PHASE 02 — 시안 제작`
- REV_06 `# 95. PHASE 03 — 시안 검토 / SELF-VALIDATION`

## Required visual fidelity

The target is **same-design implementation**, not reinterpretation.

Preserve at minimum:
- bold Yellow Focus identity;
- primary copy `그냥! 지금 하면 돼!` unless a later canonical rule explicitly supersedes it;
- White/Ivory Full Analog Clock as the dominant hero;
- complete round clock visible in-frame; no forced crop;
- readable 1–12 numerals;
- refined rim, precise hands, subtle depth and natural shadow;
- `Ready & Set` identity within the clock composition as shown by the Golden reference;
- editorial yellow-background energy elements where they materially define the Golden composition;
- Dark Control Panel below the clock, never visually dominant before the clock;
- Current Mission;
- Remaining Time;
- Target Time;
- Pause / Complete;
- BGM/secondary status;
- Start / Focus / Pause-Issue secondary timing data where applicable.

Do not redesign the screen because a new treatment looks cleaner or more modern. `CHANGED` is not an automatic PASS.

## Analog clock behavior — HARD LOCK

The analog clock is a live clock object, not a static illustration.

Current implementation semantics are preserved unless a later canonical product rule explicitly supersedes them:
- hour/minute/second hands represent the device's current local wall-clock time;
- hands are rendered as separate dynamic UI layers, not baked into the clock-face asset;
- hand positions are derived from the current timestamp so background/app-switch/resume does not accumulate interval drift;
- the lower Remaining/Target/Focus timing remains session timing and is separate from the analog wall-clock display.

A production clock-face visual asset must therefore contain the face/rim/numerals/branding only; hour/minute/second hands must remain dynamic code-driven layers.

## REC conditional state — HARD LOCK

Default:

`남은 시간 | 목표 시간`

When the active/selected mission contains **`영어 · 문장 녹음`**:

`남은 시간 | REC | 목표 시간`

REC requirements:
- centered between Remaining and Target;
- visible/active only when `영어 · 문장 녹음` is part of the current mission;
- red-dot motif plus `REC` text;
- touch target at least 44 × 44 CSS px;
- accessible label `문장 녹음`;
- after recording completion, show `REC ✓` or an equivalent explicit completed state;
- color alone must not communicate completion;
- must not destabilize the Golden clock/panel visual balance.

## Responsive lock — HARD LOCK

The responsive rule is explicitly defined by the approved phone/tablet Golden reference. TAKY/Codex must not reinterpret it.

Phone:
- show the complete timer UI at the Golden proportions for the screen;
- preserve the relative composition of headline, mission, clock and Dark Control Panel;
- keep the full clock visible;
- for short screens, reduce secondary decoration/spacing/padding/typography/clock scale before considering crop.

Tablet / wide screen:
- **do not rearrange the clock and timer/control panel relative to each other**;
- **do not transform the timer UI into a left-column/right-column redesign**;
- **keep the same UI composition and approximately the same component size as the approved timer UI**;
- **expand the yellow/background canvas only**;
- place the unchanged timer UI composition toward the **right side** of the expanded canvas, as shown by the approved Golden responsive board, to improve right-hand touch accessibility;
- use the added left-side canvas for background extension/editorial decoration only;
- any change to the relative clock/timer/panel placement is `REGRESSED` unless explicitly approved by the user.

Canonical shorthand:

`PHONE = same UI fitted to screen`

`TABLET = same UI composition + same scale intent + background extension + right-side placement`

This is a placement lock, not a design suggestion.

## Validation classification

Each material comparison must be classified as one of:
- `PRESERVED`
- `IMPROVED`
- `CHANGED`
- `REGRESSED`
- `UNKNOWN`

Rules:
- `CHANGED` != automatic PASS
- `REGRESSED` = FAIL
- `UNKNOWN` = approval hold / visual PASS prohibited

Golden completion requires actual rendered screenshots at the relevant phone/tablet viewports and side-by-side review against the exact bound reference bytes.

## Current implementation note

The current branch contains partial Golden structure (Yellow Focus, full clock object, Dark Control Panel, Pause/Complete, BGM), but known drift exists in headline/copy, clock identity/details, editorial composition, mission styling, and Target-Time wording/semantics. The current `app.js` also drives analog hands from `new Date()` wall-clock time; that behavior is now explicitly bound above so visual restoration does not accidentally replace it with a static image or session countdown hands.

This document records the canonical target; it does not itself modify product implementation.
