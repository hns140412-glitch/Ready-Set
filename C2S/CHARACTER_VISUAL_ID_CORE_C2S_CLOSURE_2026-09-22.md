# CHARACTER VISUAL ID CORE — C2S CLOSURE
Date: 2026-09-22
Branch: `taky/character-visual-id-core-2026-09-22`

## Status
- C2S_COMPILE_CLOSED = TRUE
- REFLECTION_COMPLETE = TRUE
- CORE_CODED = TRUE
- EXACT_CODE_CHECKPOINT_CI = PASS
- PAID_PROVIDER_EXECUTION = NOT_RUN
- NETLIFY_DEPLOY = NOT_RUN
- DEVICE_VERIFIED = NOT_RUN
- READY_INTEGRATION = DEFERRED

Validated code checkpoint:
`e3786e16e68703c927d1704487a5399116775809`

Workflow:
- run: `35679010098`
- result: SUCCESS
- Character Visual ID contracts: PASS
- independent Character core execution: PASS
- Character server consistency core: PASS
- full Worker Self-Test: PASS

## Canonical owner
`CHARACTER_VISUAL_ID`

Character is developed independently.
Ready & Set is a later consumer, not the semantic owner.

Temporary `ReadyCharacter*` browser aliases remain only for migration compatibility.

## Canonical formation flow

```
SOURCE PHOTO
-> ROUND 1: child selects 1 of 3 directions
-> ROUND 2: child selects 1 of 3 distinct directions
-> SYSTEM AUTO CONTRAST
-> A / B / C candidate contract
-> candidate generation
-> direction selection
-> consistency review
-> child same-identity confirmation
-> optional likeness correction
-> consistency re-review after correction
-> VISUAL_ID_LOCKED
-> deterministic derivative assets
   - full_character
   - portrait_card
   - avatar_square
-> MASTER_ASSETS_READY
-> optional Character Master Sheet
-> CHARACTER_VISUAL_ID_PROJECTION_V01
```

## Identity authority

Highest authority:
`SOURCE_PHOTO`

Locked rule:
`SAME_CHILD_DIFFERENT_DIRECTION`

Preserved:
- recognizable identity
- face shape
- hairstyle cues
- age impression
- natural proportions

Direction may change:
- expression
- pose
- gesture
- motion energy
- atmosphere
- exploration detail

Forbidden:
- identity substitution
- sensitive-trait inference/change
- face obstruction
- franchise imitation
- text/logo/watermark

## Direction provenance

- A = USER_SELECTION_1
- B = USER_SELECTION_2
- C = SYSTEM_AUTO_CONTRAST

The child makes exactly two direct direction selections.
The third direction is system-derived.

## Consistency Gate

Contract:
`CHARACTER_VISUAL_ID_CONSISTENCY_GATE_V01`

Required dimensions:
1. Structural evidence
2. Visual consistency evidence
3. Human same-identity confirmation

Lock is not allowed unless:
- structural = PASS
- selected candidate visual consistency = PASS
- human confirmation = PASS
- final_state = PASS

Important correction:
candidate-set quality and selected-candidate lock eligibility are separate.

A weak unselected candidate may make candidate-set quality FAIL while a verified selected candidate can remain eligible for lock after required evidence.

Evidence-first rule:
`PER-CANDIDATE EVIDENCE > AGGREGATE MODEL CLAIM`

## Visual review boundary

Endpoint:
`/api/character/consistency-review`

Execution gate:
`CHARACTER_VISUAL_ID_PAID_REVIEW`

Default:
LOCKED / NOT_RUN

Provider execution is not claimed.

The review contract uses structured evidence and stores per-candidate:
- same child identity
- direction readability
- face unobstructed
- identity drift risk
- note

The model is not allowed to identify the person or infer sensitive traits.

## Provider generation boundary

Generation gate:
`CHARACTER_VISUAL_ID_PAID_GENERATION`

Legacy fallback:
`READY_CHARACTER_PAID_GENERATION`

No paid generation executed in this closure.

## Visual ID lock vs derivative assets

`VISUAL_ID_LOCKED`
= final identity/provenance fixed.

`MASTER_ASSETS_READY`
= actual usable derivative assets exist.

The previous false pattern:
`avatar_square = portrait_card = full_character`
from a single identity image is rejected.

Derivatives are produced deterministically without another image-generation request:
- portrait_card: 4:5 normalized crop
- avatar_square: 1:1 head/shoulder-oriented crop
- full_character: locked identity asset

## Projection contract

`CHARACTER_VISUAL_ID_PROJECTION_V01`

Downstream consumers receive:
- visual_id
- member_scope
- identity_version
- status
- full_character
- portrait_card
- avatar_square
- optional master_sheet
- source provenance
- assurance states

Projection consumption rejects:
- not locked
- assurance not PASS
- missing derivatives when consumer requires them

Ready / Hide / Snap must consume projection.
They must not inspect or mutate Character internal generation state.

## Independent-core proof

Validator:
`REBUILD/validate-character-independent-core-v01.mjs`

It runs without Ready app orchestration and verifies:
- direction consultation
- automatic contrast
- generation contract
- identity authority
- structural gate
- visual/human gate fixture
- Visual ID lock
- derivative readiness
- projection consumption

Result at validated checkpoint:
PASS

## Regression validators

- `validate-character-direction-v01.mjs`
- `validate-character-consistency-gate-v01.mjs`
- `validate-character-independent-core-v01.mjs`
- `validate-character-server-consistency-v01.mjs`
- `validate-character-ui-journey-v01.mjs`
- `validate-character-visual-id-independence-v01.mjs`

CI also syntax-checks:
`netlify/functions/character-*.mjs`

## Remaining external/runtime evidence

NOT_RUN:
- real source-photo upload against deployed server
- one real A/B/C candidate generation set
- real visual consistency review
- real child compare/select
- real likeness correction
- real Visual ID lock
- real derivative upload
- real Character Master Sheet
- mobile/device validation

These are not code gaps by default.
They are external-resource/runtime evidence gaps.

## Deferred / explicitly out of core

- Intro
- Drop
- Voyage
- World Arrival
- Ready planner
- Ready mission/focus/result
- Learning Engine
- assignment intake

These may later consume Character projection but may not redefine the identity pipeline.


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
