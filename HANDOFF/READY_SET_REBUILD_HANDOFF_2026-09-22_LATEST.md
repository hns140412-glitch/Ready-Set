# READY & SET REBUILD HANDOFF — LATEST — 2026-09-22 REV3

## Resume
최신 TAKY 기준으로 Ready & Set 제품 완성도 작업을 재개해.

Repository: `hns140412-glitch/Ready-Set`
Branch: `taky/ready-rebuild-v01-2026-09-21`
Handoff write HEAD: `4a8141eef1d70a4bf1384bee424ee6aed396533c`

## First read
1. `C2S/READY_SET_PRODUCT_COMPLETION_C2S_CLOSURE_2026-09-22_REV3.md`
2. `C2S/READY_SET_PRODUCT_COMPLETION_ATOMS_2026-09-22_REV3.json`
3. `HANDOFF/READY_SET_NEW_CHAT_START_2026-09-22_REV3.md`
4. `C2S/READY_SET_PRODUCT_COMPLETION_MATRIX_2026-09-22_REV2.md`
5. `REBUILD/validate-rebuild-v01.mjs`

## Phase
- Rebuild structure: FROZEN CANDIDATE / ~98–99%
- Planner browser/runtime productization: ~88–90%
- Overall user-facing product maturity: ~72–74% conservative
- DEVICE_VERIFIED: NOT RUN
- Deploy / Netlify / Production / main merge: HOLD

## Major completed browser/runtime slices
### Planner
- one-off + weekly fixed schedule
- valid_from / valid_until
- schedule SKIP / REPLACE
- daily + weekly availability
- availability SKIP / REPLACE
- free-window subtraction
- weekly reflow proposal + Parent approval
- dirty-review after schedule/availability changes
- adaptive estimate proposal + approval
- academy-day MORNING vocabulary rule without invented clock time
- evidence-backed allocation rationale
- daypart UI
- carry/replan

### Learning Master
- subject method routing
- ordered specialist roundtrip
- evidence ontology / handoff
- repeated PARTIAL adaptive review
- smaller unit span / retrieval checkpoint / recovery escalation
- superseding analysis + Planner reallocation
- birthdate-only LearnerContext
- no automatic grade/region/curriculum inference

### Capture
- source preservation
- capture disposition closure
- Parent review
- reanalysis history
- failed reanalysis preserves previous successful draft
- English Capture -> FACT -> Learning Master -> Planner E2E

## Current open focus: multi-member isolation
Central `ReadyMemberScope` now exists.

Implemented:
- authenticated member-scoped Planner storage key
- authenticated member-scoped Assignment storage key
- app state uses dynamic member-scoped key
- app state reloads when family-session member changes
- local-first sync scope uses `member:<member_id>:<scope>`
- local-first recovery maps scoped snapshot back to scoped localStorage key
- sync conflict fixture updated for member-scoped scope
- sync conflict list/count filters active member
- raw member scope prefix hidden from conflict UI label

### Validation state
The C2S snapshot was closed while exact-head Runtime E2E was still moving due concurrent same-branch character work.
On resume, DO NOT reuse a prior PASS claim.
Live refresh first, then inspect the exact latest-head:
- Foundation
- Self-Test
- Runtime E2E
- Integration CI
- Planner gates

If Runtime is red, stop next implementation and classify:
1. true member-scope regression
2. stale test/validator
3. concurrent unrelated character commit regression

## Required next E2E
Prove two distinct member IDs do not leak data:
1. member A profile / Planner / Assignment / sync conflict data
2. switch to member B
3. B must not see A data
4. B creates independent data
5. switch back to A restores A-only data
6. IndexedDB/local-first recovery respects member
7. remote sync scope prevents cross-member read/write

## Concurrent branch warning
Same branch is receiving character work. Recent changes include:
- character reference survey
- source photo normalization
- generation job state
- asset key contract
- core orchestrator
- UI journey validation
- dormant Character Visual ID cleanup

Do not revert or overwrite these unrelated commits.

If branch HEAD moves:
- live refresh
- inspect diff
- preserve unrelated files
- for isolated file changes prefer fresh file SHA + sequential contents API update
- never force push

## Preserve TAKY
- no user-as-tester
- CODED / CI / RUNTIME / DEVICE separation
- no fake PASS
- Planner owns dates
- specialist evidence cannot own dates
- birthdate cannot infer grade/region/curriculum
- no Netlify/Production/main merge before external-resource gate
- Snap & Pop / Hide & Seek untouched

## After member isolation
1. actual family timetable calibration
2. textbook/unit ↔ achievement-standard evidence binding
3. real OCR/Vision provider + real-image validation
4. real microphone/device validation
5. physical-device UX / safe-area / keyboard
6. production sync/deploy only through TAKY external-resource gate
