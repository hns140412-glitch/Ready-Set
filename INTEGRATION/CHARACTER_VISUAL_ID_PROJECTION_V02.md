# CHARACTER VISUAL ID PROJECTION V02 — FROZEN CONSUMER CONTRACT
Date: 2026-09-22
Status: FROZEN_PRE_PROVIDER
Owner: CHARACTER_VISUAL_ID

## Supersession
V02 supersedes pre-integration V01 before any Ready / Hide / Snap consumer integration.

Reason:
Character formation now includes one user-selected Signature Exploration Item.

No downstream migration is required because app integration has not started.

## Contract
`CHARACTER_VISUAL_ID_PROJECTION_V02`

Carries:
- visual_id
- member_scope
- identity_version
- status
- assets
- signature_item
- source_provenance
- assurance
- capabilities
- optional master_sheet

## Signature item
Minimal downstream projection only:
- `signature_item.id`
- `signature_item.label`

Private and not projected:
- generation prompt
- face-policy implementation text
- affinity scoring
- offered alternatives
- internal item-selection state

Rule:
`IDENTITY > EXPRESSION DIRECTION > SIGNATURE ITEM`

Exactly one Signature Item is selected before A/B/C candidate generation.

All A/B/C candidates must use the same item.

The item must remain through:
- candidate generation
- candidate selection
- likeness correction
- Visual ID lock
- derivative assets
- Character Master Sheet

The item must not:
- cover the face or eyes
- replace identity cues
- become a costume editor
- introduce a second major signature prop

## Current catalog
- MAGNIFIER / 돋보기
- EXPLORER_HAT / 탐험 모자
- ROUND_GLASSES / 얇은 안경
- COMPASS / 나침반
- MINI_FIELD_BAG / 미니 필드백
- FIELD_NOTEBOOK / 탐험 노트

Only 3 are suggested in one session.
The child chooses exactly 1.

## Privacy boundary
Unchanged from V01:
- no source photo
- no source hash/fingerprint
- no provider internals
- no raw review evidence
- no correction prompt

## Assurance
A consumable projection still requires:
- identity_locked = true
- assurance.final_state = PASS

Display-ready consumers additionally require:
- derivatives_ready = true

## Runtime boundary
FROZEN_PRE_PROVIDER does not claim real visual-quality verification.

Still NOT_RUN:
- real A/B/C generation
- real item visual persistence
- real visual review
- real likeness correction
- device validation
