# READY DEPLOYMENT GATE CURRENT — 2026-09-25

## STATUS

CLOSED:
- Ready source provenance chain
- Adaptive lexical scope
- Human-confirmed specialist material binding
- Ready/Hide/Snap exact-source integration
- Frozen exact-source package provenance
- Exact-source deployment receipt validation
- Live hosted cross-app roundtrip harness
- Explicit deployment gate token enforcement
- Independent Core/Learning decision regression alignment

OPEN:
- LIVE_HOSTED_CROSS_APP_ROUNDTRIP
- IPHONE_PWA_DEVICE_VALIDATION
- POST_HOSTED_MERGE_DECISION

## CURRENT EXACT HEAD

Ready repository:
- repo: hns140412-glitch/Ready-Set
- branch: taky/ready-character-intro-integration-2026-09-24
- exact head: 8367047232e6d36af007eb737b0a472f6fa2736b
- Ready Runtime E2E run: 36121087362
- result: SUCCESS
- Playwright: 108 passed / 1 skipped
- skipped test: live-hosted-cross-app-roundtrip.spec.js
  - intentionally skipped while hosted Hide/Snap URLs are absent and deployment gate remains closed.

## SPECIALIST FROZEN SOURCES

Hide:
- repo: hns140412-glitch/Hide-Seek
- source SHA: bf345ac064fee433660ae5f9bfffb205c20cddde
- source archive SHA-256: c2e95ce4be7c5bc9a05326f32b5ecec4be5a1d68b520bdde5f34c4d8f54761ed

Snap:
- repo: hns140412-glitch/Snap-Pop
- source SHA: 7fcd4d39d4f1fbf159d49a447b17d3cc8c32b15c
- source archive SHA-256: e7d4d4b0694993481bb9deeddd46e9da6706c0d9649c6d6a400a988c71505592

## DEPLOYMENT HARD GATE

Deployment is not authorized by generic continuation commands such as:
- ㄱ
- 이어서
- 진행

Hosted verification workflow now requires the exact explicit input:

DEPLOYMENT_GATE_OPEN

If the input is absent or differs, the workflow exits with:

DEPLOYMENT_HOLD_ACTIVE

This gate does not deploy by itself. It only authorizes the hosted-verification stage after external deployment receipts and hosted URLs exist.

## HOSTED VERIFICATION ORDER

1. Explicit DEPLOYMENT_GATE_OPEN
2. Exact-source deployment receipt validation
3. Hide/Snap hosted URL == receipt URL validation
4. Ready exact-head local launch with EXPLICIT_V2 specialist targets
5. Ready -> hosted Hide
6. Hide validates READY_LEARNING_CONTEXT_V1 identity/source provenance
7. Hide -> Ready return and MEMORY_RETRIEVAL_EVIDENCE acceptance
8. Ready -> hosted Snap
9. Snap validates READY_LEARNING_CONTEXT_V1 identity/source provenance
10. Snap -> Ready return and LEARNER_PRODUCTION_EVIDENCE acceptance
11. Ready final task state == COMPLETED
12. iPhone/PWA/device validation
13. Merge decision

## AUTHORITY BOUNDARIES

- Learning Engine/Core owns learning judgment.
- Ready translates learning intent into execution context.
- Planner owns dated allocation/schedule.
- Hide owns memory-specialist interaction/evidence.
- Snap owns learner-production interaction/evidence.
- Specialist apps do not receive Planner scheduling authority.
- Ready does not infer specialist material identity.
- First specialist material binding requires explicit HUMAN confirmation.

## HOLDS

- DEPLOYMENT HOLD: ACTIVE
- MERGE HOLD: ACTIVE
- NETLIFY CALL: NOT AUTHORIZED

## RESUME RULE

INHERIT APPROVED STATE
→ confirm this CURRENT
→ confirm exact Ready HEAD
→ keep all CLOSED items closed unless new regression evidence exists
→ execute only OPEN/NEXT

Next executable OPEN after explicit deployment authorization:
LIVE_HOSTED_CROSS_APP_ROUNDTRIP
