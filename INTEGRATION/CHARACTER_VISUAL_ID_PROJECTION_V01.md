# CHARACTER VISUAL ID PROJECTION V01 — FROZEN CONSUMER CONTRACT
Date: 2026-09-22
Status: FROZEN_PRE_PROVIDER
Owner: CHARACTER_VISUAL_ID

## Purpose

This contract is the only supported downstream interface from Character Visual ID into Ready & Set, Hide & Seek, Snap & Pop, and future consumers.

Consumers must not inspect Character generation jobs, source-photo storage, provider payloads, correction internals, or consistency-review internals.

## Contract

`CHARACTER_VISUAL_ID_PROJECTION_V01`

Required fields:

- `contract_version`
- `visual_id`
- `member_scope`
- `identity_version`
- `status`
- `assets`
- `source_provenance`
- `assurance`
- `capabilities`

Status:
- `NOT_READY`
- `VISUAL_ID_LOCKED`
- `MASTER_ASSETS_READY`

Assets:
- `full_character`
- `portrait_card`
- `avatar_square`

Optional:
- `master_sheet`

## Privacy boundary

The projection SHALL NOT expose:
- original source photo
- source photo data URL/blob
- source hash/fingerprint
- provider request/response
- provider job ID
- correction prompt
- raw visual-review evidence
- biometric/identity inference beyond the already-approved Visual ID state

Projection only exposes:
- `source_provenance.authority = SOURCE_PHOTO`
- `source_provenance.source_bound = true|false`
- `raw_source_exposed = false`
- `source_fingerprint_exposed = false`

## Assurance

A consumable Visual ID requires:
- `identity_locked = true`
- `assurance.final_state = PASS`

A consumer requiring display-ready assets additionally requires:
- `derivatives_ready = true`

Consumers SHALL call the equivalent of:
`assertConsumable(projection,{requireDerivatives:true|false})`

## Ownership

Character Visual ID owns:
- identity source
- direction consultation
- generation
- consistency review
- likeness correction
- Visual ID lock
- derivative assets
- projection publication

Consumer apps own only:
- where/how an approved projection is displayed
- app-specific layout/presentation
- app-local fallback when projection is unavailable

Consumers MUST NOT:
- regenerate Character assets
- alter Visual ID identity
- mutate Character assurance
- infer missing Character state
- reach into Character source/provider storage
- promote fallback avatars into Character Visual ID authority

## Versioning

V01 is frozen at the semantic/schema level before provider execution.

Allowed without version bump:
- internal implementation changes
- performance changes
- storage changes
- additional private Character internals
- bug fixes that preserve projection meaning

Requires new contract version:
- field removal/meaning change
- new required field
- changed status semantics
- changed assurance semantics
- exposing additional source/provider information
- consumer mutation rights

## Runtime evidence boundary

`FROZEN_PRE_PROVIDER` does not mean real visual quality has been verified.

Still NOT_RUN:
- real A/B/C generation
- real visual consistency review
- real likeness correction
- device validation

These require separate external-resource/runtime evidence.
