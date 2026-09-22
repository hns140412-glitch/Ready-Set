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
