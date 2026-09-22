# READY CHARACTER DIRECTION C2S REFLECTION — 2026-09-22

Status: REFLECTED_TO_REBUILD_CODE / UI_EXECUTION_IN_PROGRESS
Branch: `taky/ready-rebuild-v01-2026-09-21`

## Source correction chain
Latest recovered decision overrides earlier variants.

SUPERSEDED:
- six mood cards with three direct selections
- three direct consultation rounds
- direct candidate-3 selection by the child

CURRENT:
1. source photo is the highest identity authority
2. round 1 presents three direction cards; child selects exactly one
3. confirm selection
4. round 2 presents three distinct direction cards; child selects exactly one
5. confirm selection
6. system derives the third contrast direction automatically
7. generate three candidate directions A/B/C with provenance:
   - A = USER_SELECTION_1
   - B = USER_SELECTION_2
   - C = SYSTEM_AUTO_CONTRAST
8. all candidates preserve the same child identity
9. compare/select -> likeness correction -> Character Master lock

## Canonical visual direction pool
- LIVELY: 신나! / 활발 · 씩씩 · 장난꾸러기
- CURIOUS: 두근두근 / 호기심 · 모험 · 발견
- WARM: 포근해 / 따뜻 · 친근 · 다정
- BOLD: 멋져! / 자신감 · 당당 · 용감
- FOCUSED: 집중! / 차분 · 똑똑 · 꼼꼼
- IMAGINATIVE: 상상중 / 신비 · 창의 · 이야기

The pool is not six cards shown for choose-three. It is the source pool from which two 3-choice consultation rounds and the automatic contrast are composed.

## Visual rules
- no emoji/emoticon/simple-icon substitute cards
- high-density premium illustration cards
- cards express direction, not a different face identity
- timer yellow is protected as Ready functional color; consultation palette must not flatten the product into yellow
- source photo identity outranks mood/style direction

## Implementation evidence in current rebuild
- `src/identity/character-direction-runtime.js`
- `REBUILD/validate-character-direction-v01.mjs`
- loaded before `app.js`
- rebuild state initializes `profile.characterDirection`
- `REBUILD/validate-rebuild-v01.mjs` now guards the correction

## Remaining execution
OPEN:
- dedicated onboarding/character consultation view
- photo capture -> direction round 1 -> round 2 journey wiring
- high-density illustration tile assets
- actual image candidate generation adapter
- likeness correction flow
- Character Master/Visual ID asset lock
- downstream companion-selection screen
- drop/voyage entry theme after character + companion selection

No paid image generation or deployment is performed by this reflection.


## Expansion-pack boundary
Decision locked: core character creation and world-entry presentation are developed as separate deliverables.

CORE / NOW:
- source photo
- two-round character direction consultation
- automatic contrast direction
- A/B/C candidate generation contract
- candidate selection
- likeness correction
- Character Master / Visual ID lock

SEPARATE / LATER EXPANSION PACK:
- intro presentation
- drop entry mode
- voyage entry mode
- world-arrival presentation
- narrative transition into the exploration world

Integration rule:
- expansion-pack work may consume the locked Character Master / Visual ID
- expansion-pack work must not redefine character identity, candidate logic, or source-photo authority
- core character creation must remain independently usable without the expansion pack
- expansion pack can be attached later through a stable handoff contract instead of being embedded into the core character pipeline

Status:
- Intro / Drop / Voyage are DEFERRED_EXPANSION, not missing core implementation.
