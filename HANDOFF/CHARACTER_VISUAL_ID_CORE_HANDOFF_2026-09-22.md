# CHARACTER VISUAL ID CORE HANDOFF — 2026-09-22

Status: INDEPENDENT_DEVELOPMENT
Branch: `taky/character-visual-id-core-2026-09-22`

## Purpose
Develop Character Visual ID as an independent subsystem before any Ready & Set integration.

## Core scope
- source photo identity authority
- source normalization/hash
- direction consultation
- exactly two child selections
- automatic third contrast
- A/B/C candidate generation
- comparison/select
- likeness correction
- Visual ID lock
- Character Master / master sheet

## Explicitly out of scope
- Ready planner
- Ready mission/focus/result
- assignment intake
- learning engine
- intro
- drop/voyage/world arrival
- direct Ready UI ownership

## Integration target
Publish only `CHARACTER_VISUAL_ID_PROJECTION_V01`.
Ready consumes the projection through an adapter after Character core completion.

## Current preserved implementation
The branch was created from the completed character-core work checkpoint:
`09b04277ee4c1c053ef44d88371a60756a89ddae`

Continue Character work on this branch only.
Do not add further Character core implementation to the Ready rebuild branch.


## 2026-09-22 resumed formation progress

Exact work resumed after TAKY architecture interruption.

Implemented:
- Character core canonical browser namespace promoted to `CharacterVisualId*` with temporary `ReadyCharacter*` compatibility aliases.
- Visual ID identity lock separated from derivative-asset readiness.
- server master no longer labels one identity image as avatar/portrait/full simultaneously.
- `CHARACTER_VISUAL_ID_PROJECTION_V01` added for downstream consumers.
- projection distinguishes:
  - `VISUAL_ID_LOCKED`
  - `MASTER_ASSETS_READY`
- regression validator added:
  `REBUILD/validate-character-visual-id-independence-v01.mjs`

Current formation sequence remains:
`SOURCE PHOTO -> ROUND 1 -> ROUND 2 -> AUTO CONTRAST -> A/B/C -> SELECT -> LIKENESS CORRECTION -> VISUAL ID LOCK -> DERIVATIVE ASSETS -> MASTER SHEET`

Important:
- no paid image provider call made.
- no Netlify deployment made.
- Ready integration remains deferred.
- original source-photo identity remains highest authority.

Next:
1. make derivative asset generation/crop path real;
2. validate independent runtime without Ready UI ownership;
3. live-verify provider contract before any paid generation;
4. freeze Character projection only after formation core is complete.


## 2026-09-22 core closure update

Read first:
1. `C2S/CHARACTER_VISUAL_ID_CORE_C2S_CLOSURE_2026-09-22.md`
2. `C2S/CHARACTER_VISUAL_ID_CORE_ATOMS_2026-09-22.json`
3. `C2S/CHARACTER_VISUAL_ID_CORE_COMPLETION_MATRIX_2026-09-22.md`
4. this handoff

Validated code checkpoint:
`e3786e16e68703c927d1704487a5399116775809`

Validated workflow:
- run `35679010098`
- SUCCESS
- Character Visual ID contracts PASS
- independent core PASS
- server consistency PASS
- full Worker Self-Test PASS

### Current canonical flow
`SOURCE PHOTO -> ROUND 1 -> ROUND 2 -> AUTO CONTRAST -> A/B/C -> SELECT DIRECTION -> VISUAL CONSISTENCY REVIEW -> SAME-IDENTITY HUMAN CONFIRMATION -> OPTIONAL LIKENESS CORRECTION -> RE-REVIEW -> VISUAL_ID_LOCKED -> DERIVATIVES -> MASTER_ASSETS_READY -> OPTIONAL MASTER SHEET -> PROJECTION`

### Hard lock
Candidate selection is NOT identity approval.

Visual ID lock requires:
- structural gate PASS
- selected candidate visual consistency PASS
- human same-identity confirmation PASS

After likeness correction, prior visual/human evidence is reset and must be reacquired.

### Evidence-first rule
`PER-CANDIDATE EVIDENCE > AGGREGATE MODEL CLAIM`

Candidate-set quality and selected-candidate lock eligibility are separate.

### Projection
Downstream contract:
`CHARACTER_VISUAL_ID_PROJECTION_V01`

Projection carries assurance state.
Consumer must reject an unassured projection.

### External gates still closed
- `CHARACTER_VISUAL_ID_PAID_GENERATION`
- `CHARACTER_VISUAL_ID_PAID_REVIEW`

No paid generation/review was executed.
No Netlify deployment was performed.
No device validation was performed.

### Next runtime-only evidence sequence
When external-resource execution is explicitly authorized:
1. frozen source photo
2. one controlled A/B/C generation
3. select one candidate
4. visual consistency review
5. same-identity confirmation
6. likeness correction only if needed
7. visual consistency re-review after correction
8. Visual ID lock
9. derivative asset generation
10. optional Character Master Sheet
11. projection freeze review

Do not integrate into Ready / Hide / Snap before the projection freeze review.
Do not reopen Intro / Drop / Voyage as Character core work.


## 2026-09-22 pre-provider frozen core update

Latest exact HEAD:
`0fe155604869df9d550daa6328f3579ee5c6c96c`

Workflow:
- run `35679773522`
- conclusion: SUCCESS
- full Worker Self-Test: PASS
- Character Visual ID contracts: PASS
- independent Character core: PASS
- server consistency gate: PASS
- projection freeze validator: PASS
- privacy / ownership-boundary validator: PASS

### Projection freeze
`CHARACTER_VISUAL_ID_PROJECTION_V01` is now:
`FROZEN_PRE_PROVIDER`

Consumer privacy boundary:
- original source photo: NOT EXPOSED
- source photo hash/fingerprint: NOT EXPOSED
- provider internals: NOT EXPOSED
- correction internals: NOT EXPOSED
- raw visual-review evidence: NOT EXPOSED

Consumers receive only approved identity assets, status, minimal provenance, assurance, and capabilities.

### Source-photo lifecycle
Original source photo is required only before Visual ID lock for:
- candidate generation
- visual consistency review
- likeness correction

After successful `VISUAL_ID_LOCKED`:
- source image blob is deleted
- source metadata is deleted
- purge event is recorded
- internal source hash may remain as provenance evidence
- downstream projection never exposes the hash

Policy:
`PURGED_AFTER_VISUAL_ID_LOCK`

### Master Sheet correction
Character Master Sheet no longer depends on the original source photo.
After lock, the verified locked final character becomes the visual authority for derivative consistency/master-sheet generation.

### Independence boundary
Character server storage namespace:
`character-visual-id-assets-v1`

Character functions no longer import Ready family auth directly.
They consume the current family identity implementation only through:
`character-family-session-adapter.mjs`

This adapter is an implementation boundary only.
Character does not own family identity semantics.

### Frozen state
`CORE_CODED = TRUE`
`EXACT_HEAD_CI = PASS`
`PROJECTION_FROZEN_PRE_PROVIDER = TRUE`
`SOURCE_PRIVACY_BOUNDARY = PASS`
`INDEPENDENT_CORE_EXECUTION = PASS`

Still NOT_RUN:
- paid image generation
- paid visual review
- deployed server runtime
- real child source-photo flow
- device validation
- Ready / Hide / Snap integration


## Signature Item handoff update

Latest validated code checkpoint:
`f337c29dd7e855d19e868a2b7758c885ea59534b`

CI:
`35683452887` SUCCESS

New canonical formation stage:
`MOOD 1 -> MOOD 2 -> SIGNATURE ITEM -> A/B/C`

Signature Item is intentionally minimal.
Do not turn this into a broad avatar editor.

Rule:
`IDENTITY > EXPRESSION DIRECTION > SIGNATURE ITEM`

Exactly one item is selected from three contextually suggested options.

Canonical catalog:
MAGNIFIER / EXPLORER_HAT / ROUND_GLASSES / COMPASS / MINI_FIELD_BAG / FIELD_NOTEBOOK.

The item:
- is identical across A/B/C;
- survives likeness correction;
- becomes part of Character Master;
- is exposed downstream only as `id + label`;
- must not obscure face/eyes or replace identity cues.

Projection:
`CHARACTER_VISUAL_ID_PROJECTION_V02`

V01 is superseded before consumer integration.

Still do not claim:
- final UI design complete;
- real item rendering quality verified;
- real A/B/C generation verified;
- device runtime verified.
