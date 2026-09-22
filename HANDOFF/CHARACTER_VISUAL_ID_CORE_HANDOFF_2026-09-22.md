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
