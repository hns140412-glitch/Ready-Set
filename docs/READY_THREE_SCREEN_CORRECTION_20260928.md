# READY Three-screen implementation correction — 2026-09-28

Status: IMPLEMENTATION CANDIDATE / DRAFT / NOT RELEASE APPROVED.

## Proven source and baseline
- Base is Ready Draft PR #116 HEAD `7da41d541d889189fc23538bb34ac1821012c9ba`, not main. No original file deletion.
- Current main checked: `1d672d862cc8329a5f19ca91c9ed6a338752f5ae`.
- Preserve `READY_SET_CANONICAL_PRODUCT_CONTRACT.md`, `READY_SET_RUNTIME_STATE_MODEL.md`, `READY_SET_DECISION_LEDGER.md`.
- Prior REV_06/REV_07 and old Focus Golden file explicitly have archived legacy authority in GitHub; do not reactivate from title alone.
- Owner: Parent FACT confirmation → Learning Master interpretation → Planner dated allocation → Ready TODAY/session. Local provisional fallback remains visibly distinct.
- App remains existing `index.html` runtime in isolated evening entry. Do not treat that old home as approved starting screen.

## Implemented in this branch
1. On evening entry, use actual Planner WEEK as initial main screen; preserve an already resumed real Focus screen.
2. Three direct labels/navigation: 이번 주 여정 → 오늘의 탐험길 → 그냥! 지금 하면 돼!.
3. WEEK and DAY call existing `nav('planner')` and actual `data-planner-tab` controls. No duplicated schedule/todo stores.
4. TIMER calls existing `nav('focus')` only; existing `renderFocus` rejects absent session and routes to Mission. It cannot create a timer by navigation alone.
5. Focus view hides secondary navigation and keeps current original session, pause, complete, clock and BGM owners. Only obsolete headings are corrected.
6. Existing PR #116 manual provisional entry remains provisional and local-only. No provider OCR/FACT confirmation or central allocation claim.

## Hard release blockers / visual parity
- The library contains visual references `어린이 탐험 플래너 UI 콘셉트.png`, `귀여운 탐험섬 플래너 UI mockup.png`, and phone/tablet timer reference. Their relation to the latest post-2026-09-24 approved Visual ID registry needs exact owner reconciliation; DO NOT elevate a reference or screenshot to a live full-screen background.
- Existing `plannerView` retains old cream/card rendering. This branch does NOT pass the requirement for approved continuous 2.5D island/Base Camp layout, no-card design, 390×844 pixel-level equality, or character Visual ID binding.
- The existing Focus DOM remains live, but its composition/phone/tablet parity with the latest confirmed image must be verified; no wallpaper substitute, forced timer reset or static clock.
- Browser CI is not an iPhone real-device test. OCR, sync, family auth, integration with Hide, and Netlify production remain OPEN.
- No deploy, main merge, original asset redraw, or forced user QA until these gates close.

## Validation
`node tests/evening-canonical-contract.test.js` and `npx playwright test tests/evening-canonical.spec.js tests/evening-quickstart.spec.js --workers=1`.
Exact HEAD check required before reporting any PASS. Release status remains HOLD.
