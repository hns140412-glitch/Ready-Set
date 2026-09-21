# READY_SHARED_RUNTIME_MIGRATION_V01

Status: IMPLEMENTATION BRANCH / CI + BROWSER RUNTIME VALIDATION PENDING

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

- browser CI/runtime must pass on this branch;
- real installed-PWA/device update and restore behavior remains unverified;
- release_id/build identity may be regenerated at frozen-candidate stage;
- Hide/Snap are not migrated by this Ready branch.

## Claim boundary

CODED on branch after commit.
CI_VERIFIED / RUNTIME_VERIFIED only after workflow evidence.
DEVICE_VERIFIED / PRODUCTION_VERIFIED are not claimed.

END
