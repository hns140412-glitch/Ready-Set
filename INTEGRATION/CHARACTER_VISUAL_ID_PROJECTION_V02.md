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

## Current catalog — HARD LOCK 2026-09-23
Exactly one item is selected from this fixed five-item set:
- CAMERA / 카메라
- COMPASS / 나침반
- FIELD_NOTEBOOK / 탐험 노트
- BINOCULARS / 쌍안경
- WATER_BOTTLE / 물병

All five are the authoritative offered set for Character Formation.
The older six-item catalog (magnifier / explorer hat / round glasses / compass / mini field bag / field notebook) is SUPERSEDED and MUST NOT be used by runtime, generation, UI, tests, or downstream consumers.

Authority alignment:
- runtime: `src/identity/character-signature-item-runtime.js`
- UI anchor: `CF-A05-SIGNATURE-ITEM`
- asset manifest: `assets/character-formation/asset-manifest.json`

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


## 2026-09-23 residue correction

This document previously retained a stale six-item catalog while the runtime and approved Character Formation anchor had already moved to the fixed five-item set.

Classification:
- stale six-item catalog: SUPERSEDED / SEARCH-EXCLUDED
- fixed five-item set: CURRENT / HARD_LOCK
- Projection V02 contract shape: KEEP
- Signature Item position before Direction Round 1: KEEP / HARD_LOCK

This correction changes no Visual ID identity and no approved visual anchor.
