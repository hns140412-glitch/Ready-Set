# READY & SET PRODUCT COMPLETION MATRIX — 2026-09-22

Status: PRODUCT_COMPLETION_AUDITED / REBUILD_FROZEN_CANDIDATE
Authority branch: `taky/ready-rebuild-v01-2026-09-21`
Audited HEAD: `729e089752bbcfa4aec57424f5c994199952f0f0`

## Scoring rule
This matrix measures real child/parent usable product maturity, not file count, controller count, or static validation count.

- IMPLEMENTED: user journey is materially usable and runtime-verified in current scope.
- PARTIAL: meaningful code/runtime exists but product experience, coverage, external setup, or real-world validation remains incomplete.
- EXTERNAL/HOLD: contract/code exists, but external configuration/deployment/provider or OAuth/device evidence is still required.
- NOT_IMPLEMENTED: intended capability does not yet exist in usable form.

CODED / CI / RUNTIME / DEVICE remain separate.

## Weighted matrix

| Capability | Weight | Disposition | Product maturity | Evidence / gap |
|---|---:|---|---:|---|
| App shell / navigation / PWA lifecycle | 5 | IMPLEMENTED | 85% | Shell/navigation/PWA contracts exist; browser runtime green. Physical device not verified. |
| Local-first persistence / recovery | 5 | IMPLEMENTED | 85% | IndexedDB/local recovery and immutable outbox runtime-tested. |
| Family auth / role boundary | 4 | PARTIAL | 55% | Client + Netlify Identity server contracts exist and boundary tests pass; production identity configuration not externally verified. |
| Cloud sync | 4 | PARTIAL / EXTERNAL | 40% | Sync adapter + Netlify Blobs backend contract exist; local default remains LOCAL_ONLY and real production remote sync is unverified. |
| Fixed timetable / schedule admin | 6 | PARTIAL | 65% | Schedule CRUD, Planner Admin, persistence and UI runtime evidence exist; real family timetable dataset and device UX not closed. |
| Availability / free-window planning | 4 | PARTIAL | 65% | Daily/weekly availability and free-window logic/tests exist; end-user planner tuning remains incomplete. |
| Planner allocation / DATED TODO | 7 | PARTIAL | 65% | FACT→Learning Unit→Planner TODO path exists; richer automatic prioritization/adjustment and real workload calibration remain incomplete. |
| TODAY → Mission selection / start | 6 | IMPLEMENTED | 80% | Runtime journey and identity provenance pass. |
| Focus session / pause / outcome | 6 | IMPLEMENTED | 80% | Session start/pause/resume/outcome flow runtime-tested; device/audio behavior not physically verified. |
| Carry-over / replan | 5 | IMPLEMENTED | 75% | PARTIAL/deferred carry and replan runtime path passes; broader real-life scenarios remain. |
| CHILD task proposal → Parent confirm | 4 | IMPLEMENTED | 75% | Child FACT review + Planner routing implemented and tested. |
| Talent 6-book intake | 5 | PARTIAL | 65% | Parent intake + confirmed facts + Planner TODOs tested; OCR-assisted real input and full subject-specific polish remain. |
| English intake / academy cycle | 5 | PARTIAL | 60% | Workbook/components/next-academy hold rules exist; actual academy schedule operation and learning-depth polish remain. |
| Learning Master interpretation | 6 | PARTIAL | 55% | Subject profiles, activity sequence, load/recovery/split policies exist; adaptive calibration and broader subject reference reflection remain incomplete. |
| Capture local intake / review | 5 | PARTIAL | 70% | Camera/gallery, local capture, provenance, review/disposition implemented; physical-camera verification absent. |
| OCR / Vision analysis | 6 | PARTIAL / EXTERNAL | 40% | Front adapter + authenticated Netlify function + OpenAI provider path exist; requires deployed function, Identity session, OPENAI_API_KEY and real-image validation. |
| Recording flow | 4 | PARTIAL | 70% | Browser recording orchestration/storage/review exists; microphone behavior and format/device compatibility not physically verified. |
| Result / history / local calendar | 4 | PARTIAL | 65% | Result/history/local calendar render exists; Google Calendar OAuth is not implemented as a live integration. |
| Profile / guide / settings / share | 4 | PARTIAL | 60% | Local profile, guide, voice/sound settings and share-card path exist; generative profile rendering is not connected. |
| Real-device / product polish | 5 | PARTIAL | 20% | 390×844 browser visual audit exists, but DEVICE_VERIFIED remains NOT RUN. |

Weighted product maturity: **63.95% → report as ~64%**

## What is actually closed
- Core local PWA shell and navigation
- Local-first persistence/recovery
- Planner schedule/availability primitives
- DATED TODO → TODAY → Mission → Focus
- Session pause/resume/outcome
- Result provenance and carry-over/replan
- CHILD proposal → Parent confirm
- Talent/English FACT intake foundations
- Capture local intake/review foundations
- Recording browser flow
- Runtime regression gate and rebuild ownership validation

## Major PARTIAL gaps
1. **Planner productization**
   - real timetable dataset and weekly operating experience
   - automatic workload calibration / reprioritization / auto-adjustment
   - stronger child-facing weekly/day planner UX
2. **Learning Master depth**
   - more subject reference reflection
   - adaptive difficulty/load estimates based on actual outcomes
   - long-term memory/planner feedback loop
3. **Capture/OCR**
   - real deployed provider validation
   - real camera images across varied worksheets/forms
   - correction loop quality and confidence UX
4. **Family + Sync**
   - production Identity / family account setup
   - production remote storage and conflict recovery validation
5. **External integrations**
   - Google Calendar live OAuth integration
   - generative profile/2.5D rendering service
6. **Device/product polish**
   - real iPhone PWA installation and camera/microphone/audio validation
   - safe-area, keyboard, permissions, background/resume and update behavior on device

## Frozen Candidate interpretation
`REBUILD_FROZEN_CANDIDATE` means architecture/ownership surgery can stop as the default mode.
It does NOT mean the product is complete.

Next work must prioritize product gaps rather than additional structural refactoring unless a new runtime defect proves architecture still blocks implementation.

## Current evidence
- Current HEAD Foundation: PASS
- Current HEAD Runtime E2E: PASS
- Controller-code HEAD Self-Test: PASS
- DEVICE_VERIFIED: NOT RUN
- Netlify production deployment: NOT RUN in this rebuild scope
- main merge: NOT RUN
- Snap & Pop / Hide & Seek: untouched

## Overall implementation
- Rebuild / ownership migration: **98–99%**
- Real user-facing product maturity: **~64%**
- Device verification: **0%**
