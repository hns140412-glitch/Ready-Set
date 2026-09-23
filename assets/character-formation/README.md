# Character Formation Assets

Status: HARD_LOCK / RUNTIME ASSET PIPELINE

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
- `items/` — locked five Signature Item illustrations only.
- `tools/` — common exploration tools/props such as map, lantern, books, suitcase, tags, postcard.
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


## Lock state

`CHARACTER_FORMATION_ASSET_METHOD = HARD_LOCK`

Reopen policy: `EXPLICIT_USER_REOPEN_ONLY`.

Any future Character Formation UI implementation must use the approved-anchor → decomposed-assets → assets-folder → live-UI → motion/depth → 390×844 regression path. A conflicting shortcut is a regression, not an alternative implementation.


## Manifest ownership

`asset-manifest.json` is the single runtime address table for Character Formation illustration assets.

Runtime code must not hardcode Character Formation asset file paths.

Consumption path:
`asset-manifest.json → CharacterFormationAssetRuntime → scene/view DOM consumers`

Asset truth:
- manifest key present + binary present = bindable;
- manifest key present + binary missing = PENDING;
- board/mockup filename text alone = NOT proof of a binary asset;
- Signature Item set and common exploration-tool pool remain separate contracts.

USER != DEBUGGER: missing illustration binaries degrade internally to pending/hidden assets and must not surface broken-image debugging to the user.
