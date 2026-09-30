# READY_SHARED_RUNTIME_MIGRATION_V01

Status: READY CONSUMER MERGED / CI + BROWSER RUNTIME VERIFIED / DEVICE + PRODUCTION PENDING

TAKY shared foundation basis:
`hns140412-glitch/TAKY@c53ee827c03133576f1f9c6e0c6480991f470207`

## Scope

First Ready & Set consumer migration for:
- CAP-RELEASE-COMPAT-001
- CAP-PWA-UPDATE-001

## Implemented

- vendored byte-equivalent TAKY shared release/PWA primitives with provenance record;
- one Ready release descriptor (`ready-release-v01.js`);
- app/runtime/version UI consumes the descriptor;
- service-worker cache identity derives from `release_id`;
- install-time unconditional `skipWaiting()` removed;
- waiting worker activates only after Ready supplies a safe point and the adapter sends `APPLY_UPDATE`;
- Ready safe point is currently conservative: `state.activeSession == null`;
- controller change stores restore intent and reloads through the shared lifecycle;
- VERSION.json downgraded to compatibility mirror;
- package metadata aligned with descriptor;
- Node and Chromium regression tests added.

## Protected semantics

The shared primitive does not decide what a Ready safe point means.
Ready owns the learning-session safe-point rule.

This migration does not alter:
- assignment FACT authority;
- Learning Master / Planner semantics;
- parent/child authority;
- local-first conflict semantics;
- cross-app session ownership.

## Remaining open

- real installed-PWA/device update and restore behavior remains unverified;
- production deployment behavior remains unverified and deployment is HOLD;
- release_id rotates when a frozen deployment candidate or semantic release change is declared;
- Hide/Snap migration is outside this Ready consumer migration and does not block Ready R3 closure.

## Claim boundary

Ready consumer migration is CODED / CI_VERIFIED / RUNTIME_VERIFIED on exact main evidence.
DEVICE_VERIFIED / PRODUCTION_VERIFIED are not claimed.
Semantic release authority is `ready-release-v01.js`; exact git SHA/tree evidence is recorded separately in validation/registry state.

END
