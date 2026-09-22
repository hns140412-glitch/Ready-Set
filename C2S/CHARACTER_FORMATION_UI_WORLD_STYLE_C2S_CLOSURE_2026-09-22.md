# CHARACTER FORMATION UI / WORLD STYLE — C2S CLOSURE
Date: 2026-09-22
Branch: `taky/character-visual-id-core-2026-09-22`

## Status
- C2S_COMPILE_CLOSED = TRUE
- REFLECTION_COMPLETE = TRUE
- UI_CANONICALIZATION = PARTIAL
- FINAL_UI_MOCKUP = NOT_LOCKED
- CHARACTER_WORLD_STYLE = DEFINED
- COMPANION_VISUAL_ID = HARD_LOCK
- USER_CHARACTER_VISUAL_ID = SOURCE_PHOTO_DRIVEN
- DEPLOYMENT = NOT_RUN
- DEVICE_VALIDATION = NOT_RUN

## Scope

This closure records the Character Formation UI, companion-crew behavior, travel-preparation context, and shared Character World Style decisions made after Character Core was frozen.

This file does NOT replace Character Core logic.
Character Core remains governed by:
- `C2S/CHARACTER_VISUAL_ID_CORE_C2S_CLOSURE_2026-09-22.md`
- `INTEGRATION/CHARACTER_VISUAL_ID_PROJECTION_V02.md`

## TAKY recovery rule

Existing approved samples and locked Visual IDs MUST be recovered before proposing a new mockup.

Required loop:
`CONTEXT RECOVERY -> PRIOR DECISION CHECK -> EXISTING SAMPLE RECOVERY -> PRESERVE / ADJUST / FORBIDDEN / ADD -> DELTA EDIT -> VALIDATION`

Hard correction:
`PRESERVE BEFORE RECREATE`

A visually attractive new mockup is NOT acceptable if it silently replaces an already-approved UI structure, companion identity, or Character Formation flow.

## Character Formation UI — base relationship

The existing Character Formation sample is the BASE LAYER.

The travel-preparation / packing concept is a CONTEXT LAYER.

Therefore:
- existing layout grammar is preserved;
- packing/travel atmosphere is layered into background, props, and the Signature Item step;
- packing context must not become a new app/UI language;
- no wholesale redesign into storybook, RPG HUD, or new game UI.

Canonical relation:
`FORMATION UI BASE + TRAVEL PREPARATION CONTEXT + LOCKED COMPANION VISUAL IDS`

## Formation story

Core emotional framing:
`여행을 떠나기 전, 함께 준비하는 캐릭터 구축 여정`

The user is preparing:
- a companion,
- a name/relationship,
- their own source-photo-based character,
- two expression/mood directions,
- one small Signature Exploration Item,
- A/B/C visual candidates,
- final Visual ID,
before beginning the adventure.

## User character visibility rule

Before A/B/C candidate generation:
- no completed user character may appear as if already created;
- photo/source placeholder or neutral pre-character state only.

The user character first appears meaningfully at A/B/C discovery.

This prevents chronology inversion.

## Companion crew — hard lock

Locked companion crew:
- 두비 / Dubi
- 로리 / Tori
- 잉크 / Ink
- 노바 / Nova
- 테이크 / Take
- 제로 / Zero

Their supplied/approved Visual IDs are the authority.

Companion Visual IDs:
`HARD LOCK`

User mood/direction selection MUST NOT alter companion Visual IDs.

Hard rule:
`USER MOOD -> USER CHARACTER ONLY`
`USER MOOD -/-> COMPANION VISUAL ID`

Companion changeable layer:
- expression
- pose
- gesture
- action
- screen position
- short dialogue
- reaction

Companion locked layer:
- species
- face
- silhouette
- body proportion
- fur/primary color
- signature clothing
- signature equipment
- core palette
- Visual ID

## Companion exposure / familiarity rule

All six companions should appear during Character Formation so the child becomes familiar with them.

They should not appear only on one selection screen.

Formation relationship:
`FAMILIARITY -> SELECTION -> RELATIONSHIP -> COMPANIONSHIP`

One companion is chosen as the primary companion, but the other five are NOT treated as rejected or eliminated.
All remain members of the wider exploration crew.

## Companion self-promotion behavior

The six companions should feel lively, slightly noisy, witty, and eager to be chosen, without changing their Visual IDs.

Behavior should be character-specific rather than six identical animations.

Examples:
- Dubi: steps forward first, taps the bag, “와! 나랑 가자! 벌써 준비했어!”
- Tori: tidies Dubi’s overpacked bag, “두비야, 그것부터 좀 넣고…”
- Ink: compares two maps, “음… 내가 보기엔 이쪽 길도 있는데?”
- Nova: already wearing goggles near the exit, “가보자! 준비는 가면서 하면 되지!”
- Take: checks the list, “잠깐. 물, 지도, 노트… 하나 빠졌어.”
- Zero: offers the travel soundtrack, “출발 음악은 내가 맡을게!”

These are action/personality layers, not Visual ID changes.

## Companion selection and naming

The child selects one primary companion.

Name model:
- `canonical_name` = original locked name
- `display_name` = user-selected current nickname

Renaming MUST NOT overwrite canonical identity.

Name changes should become playful history, not disposable settings.

Track:
- first met date
- first selected date
- canonical name
- current display name
- previous names
- rename count
- shared adventure count
- memorable phrases / events
- badges / notable history

This history is projected later into the companion encyclopedia / collection / profile experience.

## Signature Exploration Item

Signature Item remains part of the packing metaphor.

It is not a broad customization editor.

Rule:
`IDENTITY > EXPRESSION DIRECTION > SIGNATURE ITEM`

Exactly one item is chosen from three contextually suggested items.

Current catalog:
- MAGNIFIER
- EXPLORER_HAT
- ROUND_GLASSES
- COMPASS
- MINI_FIELD_BAG
- FIELD_NOTEBOOK

The item:
- belongs to the user character;
- is the same across A/B/C;
- remains through likeness correction and Visual ID lock;
- should read as a packed exploration tool;
- must not dominate or obscure identity.

## Formation sequence — UI interpretation

Recommended screen sequence:

1. travel-preparation / basecamp opening
   - all six companions present
   - no completed user character

2. companion selection
   - all six remain visible
   - one primary companion selected

3. companion naming / nickname
   - canonical + display name separation

4. source photo
   - selected companion remains nearby

5. mood / expression direction 1 of 2
   - 3-choice structure

6. mood / expression direction 2 of 2
   - 3-choice structure
   - no third direct choice

7. packing / Signature Item
   - 3 suggested items
   - choose exactly 1

8. generating A/B/C
   - checklist/progress
   - no noisy character animation required

9. A/B/C discovery
   - first meaningful appearance of generated user character
   - same child
   - same Signature Item
   - different expression/direction

10. choose / same-identity confirmation / likeness correction

11. Visual ID lock

12. preparation complete
   - first strong “user + selected companion” team image

13. encyclopedia/history entry created

## Visual environment

Avoid sterile white-only backgrounds.

Preferred context:
- warm pre-departure basecamp / preparation room
- open bag
- map
- notebook
- compass
- travel tags
- packed equipment
- view toward the world/adventure outside
- layered depth
- natural warm light

But:
- environment is context, not the UI owner;
- the world should not overwhelm the character task;
- avoid turning every screen into a full fantasy landscape;
- no early “already adventuring” scene before departure.

## Motion / effect rule

Motion is subordinate to clarity.

Allowed:
- short staggered crew entrance
- one-time hand/head/prop gesture
- subtle selected-card scale
- non-selected crew stepping back slightly, not disappearing
- item settling into bag
- soft A/B/C reveal
- short dissolve/slide between steps
- reduced-motion support

Forbidden:
- endless bounce
- large looping character motion
- confetti-heavy completion
- RPG light beams
- visual effects that alter or obscure Visual IDs
- animation becoming the main spectacle

Motion purpose:
- guide attention
- communicate state
- preserve continuity
- add wit without noise

## Character World Style — shared language

User character and companion crew do NOT need identical anatomy.

They are unified through a shared world language.

### Shared
- rendering quality
- lighting
- material language
- exploration apparel grammar
- equipment family
- emblem/patch language
- hardware/buckle language
- environment palette
- texture quality

### User character
- human/photo-based identity
- slightly more natural human proportion
- source-photo likeness
- user-selected direction
- personal Signature Item

### Companion crew
- locked species
- locked silhouette
- locked chibi/SD proportion
- locked face and equipment identity
- personality/action layer changes only

Key sentence:
`같은 세계의 옷을 입고, 같은 빛 아래 서 있지만, 각자는 자기 몸과 얼굴을 가진다.`

Hierarchy in a shared scene:
- USER = PROTAGONIST
- SELECTED COMPANION = PARTNER
- OTHER 5 = CREW / WORLD CHARACTERS

## Shared design language candidate

World base palette:
- cream
- deep navy
- warm brown
- sage/forest
- sky blue

Personal accents remain character-specific.

Shared equipment can feel like one expedition product family, but not identical copies.

Example:
user compass and Nova’s compass may look like different models from the same expedition equipment line.

## Recent child-photo application

Two child photos were supplied as source examples for applying the source-photo-based Character Visual ID style.

These are reference/test inputs for likeness direction only.

They do not change the identity authority rule:
`SOURCE PHOTO = highest identity authority`

Do not infer identity beyond the visible source.
Do not treat one generated example as canonical unless explicitly approved.

## Mockup status

Recent generated mockups are NOT canonical UI.

Some visual references were useful for:
- warm basecamp atmosphere
- material richness
- world-style unification
- user + companion composition

But repeated failures occurred when:
- layout was recreated rather than delta-edited;
- companion Visual IDs drifted;
- storybook/RPG/new app language replaced the base UI;
- companions became mood-dependent.

Therefore:
`LATEST GENERATED MOCKUPS = REFERENCE_ONLY / NOT_CANONICAL`

## Next work

New chat should NOT generate another mockup immediately.

First:
1. recover the exact approved Character Formation sample(s);
2. recover the exact locked companion Visual ID references;
3. classify each screen element as PRESERVE / ADJUST / ADD / FORBIDDEN;
4. define the shared Character World Style as a reusable spec;
5. only then make a delta-edited UI mockup;
6. validate companion Visual ID fidelity and user-character chronology before accepting.

Final UI acceptance remains:
`NOT_LOCKED`
