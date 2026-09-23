# Character Formation Assets

Status: ACTIVE / RUNTIME ASSET PIPELINE

## Hard rule

Approved mockups are **reference anchors**, not runtime screenshots.

FORBIDDEN:
- crop an approved full-screen mockup and use it as the app background;
- bake UI text/buttons into a screen image;
- recreate a Crew member from memory instead of binding the locked Visual ID asset;
- replace the preparation-room art direction with generic cards/white forms.

Required pipeline:

`APPROVED MOCKUP`
→ `SCENE DECOMPOSITION`
→ `HIGH-DENSITY INDIVIDUAL ASSETS`
→ `ASSET MANIFEST`
→ `DOM/CSS COMPOSITION`
→ `MOTION / SENSOR DEPTH`
→ `390x844 RUNTIME SCREENSHOT REGRESSION`.

## Folder layout

- `_references/` — approved mockup anchors. EVIDENCE ONLY. Never rendered directly.
- `background/` — textless, characterless preparation-room/world layers.
- `foreground/` — luggage, leaves, desk-edge, maps and depth props.
- `crew/` — transparent locked Crew Visual ID derivatives.
- `items/` — Signature Item illustrations.
- `fx/` — light, glow, dust, shadow/contact layers where required.
- `textures/` — paper, parchment, wood, frosted-surface textures.
- `icons/` — UI icons only; no baked labels.

## Visual premise

Character Formation happens **before travel** while packing/preparing.

The persistent island is the destination and may appear only as hints:
postcards, maps, photos, distant window view, travel notes.

The preparation-space scene remains dominant until Voyage/Drop.

## Implementation rule

Text, controls, selected state, progress, accessibility and data are DOM/runtime UI.

Illustration provides world density and identity.
Illustration must not contain the functional UI state that the runtime needs to change.

## Motion

Assets must be separable enough to support:
- small Crew gesture/pose projections;
- foreground/midground depth;
- optional sensor parallax;
- contact-shadow response;
- reduced-motion static fallback.

Think Again, Keep Your Key.
Think Again, You're The Key.
