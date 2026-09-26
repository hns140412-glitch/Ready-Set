# READY × CHARACTER VISUAL ID INTEGRATION CONTRACT V01

Status: SEPARATED_DEVELOPMENT / INTEGRATION_DEFERRED
Date: 2026-09-22

## Ownership

### Ready & Set owns
- learner profile display
- planner / mission / focus / result flows
- presentation slots that may render an already locked character
- fallback avatar behavior when no Visual ID is connected

### Character Visual ID owns
- source photo identity intake
- mood/direction consultation
- two direct selections + one system contrast direction
- A/B/C candidate generation
- candidate comparison and selection
- likeness correction
- Visual ID lock
- Character Master / master assets
- generation provider / image storage / generation job state

Ready & Set must not implement or redefine the Character Visual ID generation pipeline.

## Integration payload

Ready consumes only a stable published projection:

```json
{
  "contract_version": "CHARACTER_VISUAL_ID_PROJECTION_V01",
  "visual_id": "visual_xxx",
  "member_scope": "member_xxx",
  "identity_version": 1,
  "status": "VISUAL_ID_LOCKED",
  "assets": {
    "avatar_square": "asset-reference",
    "portrait_card": "asset-reference",
    "full_character": "asset-reference"
  },
  "master_sheet": "asset-reference-or-null",
  "source_provenance": {
    "source_hash": "opaque-hash",
    "character_core_version": "version"
  }
}
```

## Boundary rules
- Ready never receives or stores the original child source photo as part of the integration payload.
- Ready never owns provider prompts, generation jobs, correction instructions, or candidate provenance internals.
- Character Visual ID does not own planner, mission, focus, learning engine, assignment or Ready UX.
- Ready may display a fallback local avatar when Character Visual ID is absent/offline.
- Character changes are delivered through versioned projection only.
- Intro / Drop / Voyage / World Arrival remain a separate expansion-pack track and are not part of this contract.

## Integration gate
Integration starts only after:
1. Character Visual ID core is independently validated.
2. Visual ID projection contract is frozen.
3. Ready exact-head remains green without the Character core loaded.
4. Adapter-level tests pass using mock projection data.
5. Provider/Netlify deployment is separately gated.

## Current state
- Character core development branch: `taky/character-visual-id-core-2026-09-22`
- Ready rebuild branch: `taky/ready-rebuild-v01-2026-09-21`
- Integration: DEFERRED
