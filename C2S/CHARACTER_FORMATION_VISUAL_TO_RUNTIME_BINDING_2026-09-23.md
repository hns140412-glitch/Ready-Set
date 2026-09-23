# CHARACTER FORMATION — APPROVED VISUAL → RUNTIME BINDING — 2026-09-23

Status: HARD_LOCK / IMPLEMENTATION AUTHORITY
Branch: `taky/character-visual-id-core-2026-09-22`

## 1. Why this exists

The approved high-fi screen is not a mood board.
It is the implementation anchor.

TAKY slogans require continuity:

`Think Again, Keep Your Key.`
= recover and preserve what the user already approved.

`Think Again, You're The Key.`
= find the executable route from approval to working UI instead of asking the user to rediscover regressions.

Therefore:
`APPROVED MOCKUP → ASSETIZE → BUILD → VERIFY`
and not
`APPROVED MOCKUP → FORGET → GENERIC UI`.

## 2. Approved anchors currently binding

### CF-A01 Crew Familiarity
Use for:
- warm travel-preparation room tone
- high-density prop/world language
- Core 6 social presence
- pre-departure mood.

### CF-A02 Primary Companion Select
Main anchor = user-uploaded “누구와 같이 갈까?” screen.
Use for:
- 6-member selection hierarchy
- photographic/polaroid presentation grammar
- visible but non-rejected remaining Crew.

### CF-A03 Companion Name / Alias
Use for:
- selected companion remains protagonist
- relationship/naming task surface
- preparation-room continuity.

Do NOT include Crew personality re-selection.
Crew personality is canonical and fixed.

### CF-A05 Signature Item
Current implementation anchor.
Use for:
- five physical item choices;
- single selected item state;
- selected companion context;
- preparation-room continuity;
- CTA to Direction Round 1.

Required exact item set:
카메라 / 나침반 / 탐험 노트 / 쌍안경 / 물병.

## 3. Assetization rule

Approved full-screen screens go only to `assets/character-formation/_references/`.
They may be used for visual regression and decomposition planning.

They must never be:
- CSS background-image for the complete screen;
- cropped into fake interactive UI;
- shipped with baked Korean UI controls.

Every shippable scene is reconstructed from individual assets plus live DOM.

## 4. High-density illustration requirement

The runtime should preserve the mockup's density through:
- layered background illustration;
- textless prop clusters;
- independent locked Crew assets;
- independent Signature Items;
- foreground occlusion assets;
- warm light/shadow overlays;
- paper/frosted functional surfaces.

Do not replace the art direction with flat emoji/cards to make implementation easier.

## 5. Runtime composition layers

Back → front:

1. FAR WORLD — room architecture / shelves / window
2. DESTINATION HINT — island postcard/map/distant view
3. MID PROPS — luggage / books / lantern / wall notes without functional copy
4. CREW — locked Visual ID derivative
5. TASK SURFACE — live DOM panel
6. FOREGROUND — leaves / map edge / desk props
7. FX — subtle glow / contact shadow / depth haze
8. SYSTEM UI — CTA / progress / accessibility/live states.

## 6. Screen completion gate

A screen is not complete until:
- functional contract passes;
- all required decomposed assets exist;
- no reference screenshot is rendered as the UI;
- 390×844 runtime screenshot matches the approved anchor hierarchy;
- Core 6 asset binding passes;
- motion/reduced-motion states pass.

## 7. Current implementation order

Do not redesign more screens first.

Build in this order:
1. shared Character Formation scene shell;
2. asset loader + manifest;
3. CF-A05 Signature Item live screen;
4. 390×844 screenshot parity;
5. propagate same shell backward to CF-A01/A02/A03;
6. continue Direction Round 1/2 only after the shell is stable.

USER != DEBUGGER.


## 8. HARD LOCK

`APPROVED_VISUAL_TO_RUNTIME_BINDING = HARD_LOCK`

This method may be reopened only by a later explicit user instruction.

Locked execution:
`APPROVED ANCHOR → DECOMPOSED HIGH-DENSITY ASSETS → assets/ → LIVE DOM/CSS → MOTION/DEPTH → 390×844 RUNTIME CAPTURE → ANCHOR COMPARISON → CORRECT DRIFT`.

The following are regression failures:
- re-generating a replacement mockup instead of implementing an accepted anchor;
- full-screen crop/background substitution;
- generic card/form UI replacing approved visual hierarchy;
- missing Core 6 canonical asset binding;
- showing a mockup instead of runtime proof;
- declaring UI complete without runtime screenshot comparison.

This lock inherits TAKY top-level authority and applies to subsequent Character Formation screens unless explicitly reopened.
