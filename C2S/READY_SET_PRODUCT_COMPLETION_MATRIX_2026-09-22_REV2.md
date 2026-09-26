# READY & SET PRODUCT COMPLETION MATRIX — 2026-09-22 REV2

Status: PRODUCT_COMPLETION_AUDITED / REBUILD_FROZEN_CANDIDATE
Authority branch: `taky/ready-rebuild-v01-2026-09-21`
Audited HEAD: `8fedfddda0d04e381aaaa07b3dbd3e4b3c18c0f5`

## Scoring rule
Real child/parent usable maturity only. CODED / CI / RUNTIME / DEVICE remain separate.

## Weighted matrix

| Capability | Weight | Disposition | Product maturity | Evidence / gap |
|---|---:|---|---:|---|
| App shell / navigation / PWA lifecycle | 5 | IMPLEMENTED | 85% | Browser runtime green; physical device not verified. |
| Local-first persistence / recovery | 5 | IMPLEMENTED | 85% | IndexedDB/local recovery and outbox runtime-tested. |
| Family auth / role boundary | 4 | PARTIAL | 60% | Client/server contracts and boundary tests pass; production Identity setup not externally verified. |
| Cloud sync | 4 | PARTIAL / EXTERNAL | 45% | Remote backend contract tests pass; production remote sync still externally unverified. |
| Fixed timetable / schedule admin | 6 | IMPLEMENTED / DEVICE_PENDING | 88% | One-off + weekly recurrence + validity range + SKIP/REPLACE exceptions + UI runtime pass. Actual family dataset/device polish remains. |
| Availability / free-window planning | 4 | IMPLEMENTED / DEVICE_PENDING | 88% | Daily/weekly availability + validity range + single-date SKIP/REPLACE + free-window integration pass. |
| Planner allocation / DATED TODO | 7 | IMPLEMENTED / CALIBRATION_PENDING | 86% | FACT→Learning Unit→Planner, evidence-backed reason, weekly reflow, human approval, adaptive estimate all runtime-tested. |
| TODAY → Mission selection / start | 6 | IMPLEMENTED | 85% | Runtime + identity chain + valid Session Service authority pass. |
| Focus session / pause / outcome | 6 | IMPLEMENTED | 84% | Session and REV_07 runtime green; device/audio pending. |
| Carry-over / replan | 5 | IMPLEMENTED | 84% | Carry/replan plus weekly reflow and dirty-review loop pass. |
| CHILD task proposal → Parent confirm | 4 | IMPLEMENTED | 80% | Child FACT review + Planner routing pass. |
| Talent 6-book intake | 5 | PARTIAL | 68% | Intake and Planner route pass; real OCR-assisted workflow/device polish incomplete. |
| English intake / academy cycle | 5 | PARTIAL | 74% | Academy-day morning vocabulary rule + planner evidence + specialist routing; real family schedule use and depth remain. |
| Learning Master interpretation | 6 | PARTIAL | 68% | Subject methods, specialist fail-closed routing, handoff/evidence roundtrip, evidence-aware review policy now exist. Broader adaptive depth/reference reflection remains. |
| Capture local intake / review | 5 | PARTIAL | 70% | Local camera/gallery review implemented; physical camera verification absent. |
| OCR / Vision analysis | 6 | PARTIAL / EXTERNAL | 40% | Provider path exists; deployed real-image validation pending. |
| Recording flow | 4 | PARTIAL | 70% | Browser flow exists; device microphone/format verification pending. |
| Result / history / local calendar | 4 | PARTIAL | 65% | Local history/calendar present; Google Calendar live OAuth absent. |
| Profile / guide / settings / share | 4 | PARTIAL | 60% | Local flows exist; generative profile service not connected. |
| Real-device / product polish | 5 | PARTIAL | 20% | Browser iPhone-like audit only; DEVICE_VERIFIED NOT RUN. |

Weighted product maturity: approximately **71%**

## Planner closure audit
Planner productization is now approximately **88–90%** in browser/runtime scope.

Closed:
- one-off + weekly fixed schedule
- schedule validity range
- schedule SKIP / REPLACE overlays
- daily + weekly availability
- availability validity range
- availability SKIP / REPLACE overlays
- fixed schedule subtraction from free windows
- evidence-backed assignment rationale
- academy-day MORNING vocabulary rule without invented clock time
- weekly reflow proposal + Parent approval
- schedule/availability change dirty-review signal
- adaptive estimate proposal + Parent approval
- carry-over/replan integration
- child-facing week/day daypart display

Remaining Planner gaps:
1. actual family timetable dataset entry and operating calibration
2. real-device interaction/keyboard/safe-area validation
3. long-horizon calibration from more real execution history
4. optional external calendar integration

## Validation baseline
HEAD `8fedfddd...`
- Rebuild Foundation PASS
- TAKY Worker Self-Test PASS
- Ready Runtime E2E PASS
- Planner Free Window Gate PASS
- Daily Availability Gate PASS
- Weekly Availability Gate PASS
- Single Active Task Gate PASS
- Child FACT Confirmation Gate PASS
- Integration CI PASS
- DEVICE_VERIFIED NOT RUN

## Next priority
Default next work is **Learning Master adaptive depth / feedback loop**, not further structural refactoring.
