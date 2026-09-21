# READY & SET BADGE SYSTEM RECOVERY — 2026-09-21

Status: C2S RECOVERY / IMPLEMENTATION GAP RECORD

## Why this exists

Badge-related decisions were split across Ready & Set onboarding/growth documents and later TAKY cross-app design discussion. Current Ready & Set runtime branch contains no active badge runtime, so the distinction between ADOPTED badge surfaces and HOLD growth-economy work was lost.

## Ready-specific recovered evidence

### Adopted / preserved presentation direction

Historical Ready handoff:
- Home achievement area: recent records / challenge status / received praise badges.
- Focus: mission badge separated from title/clock.
- Result: completion badge → time metrics → result summary → parent cheer sticker.
- Avatar visual master: small mission badge / watch / notebook allowed as limited motif.

### HOLD — do not conflate

Ready UI Master REV_06:
- character level / growth economy = HOLD.
- advanced reward economy / complex growth scoring remained outside core.

Therefore:
- praise/completion/mission badge presentation was not automatically cancelled by the HOLD.
- badge system must not be reconstructed as character levels, XP ladder, gacha, or competition.

## Cross-app recovered user direction

Direct user evidence from 2026-09-08:
- badges/titles are a fun collection axis;
- include success, mistakes, recovery/improvement, special behavior;
- roughly 60, extensible from real child activities;
- not Ready-only: user explicitly said it should run across the whole ecosystem;
- circular hand-drawn pastel visual;
- center/person stronger, fade transparent outward;
- unearned state as shadow/faint collection item;
- collection/encyclopedia;
- diary/result-share brag mode;
- badge itself grows through stars and color tiers;
- five stars then tier change;
- tier order: green → blue → red → gold → platinum;
- profile character used in badge visuals;
- theme may change expression while preserving identity.

## Current branch gap

Search of current `taky/ready-integration-v01` runtime:
- no badge runtime;
- no praise badge data model;
- no completion badge collection state;
- no cross-app badge event contract;
- no badge collection UI.

This is a downstream implementation omission, not evidence that the badge concept was rejected.

## Ownership boundary

Recommended recovered ownership boundary, pending central TAKY promotion:
- TAKY shared layer: badge identity/event/history/tier contract.
- Ready & Set: emits activity events and renders Ready-specific badge moments.
- Snap & Pop: emits writing/thinking/exploration events and consumes same badge collection.
- Other learning apps: may emit domain-specific events into the same contract.
- App-local EXP/reward systems must not silently become badge authority.

## Implementation status

- SOURCE_RECOVERED = PASS
- DIRECT_USER_CORE_RULES = PASS
- READY_RUNTIME_BADGE_SYSTEM = NOT_CODED
- TAKY_SHARED_BADGE_CONTRACT = NOT_CODED
- DEVICE/RUNTIME = NOT_RUN
