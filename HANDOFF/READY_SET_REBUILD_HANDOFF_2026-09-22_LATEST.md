# READY & SET REBUILD HANDOFF — LATEST — 2026-09-22 REV4

## Resume
최신 TAKY 기준으로 Ready & Set 배포 전 작업을 재개해.

Repository: `hns140412-glitch/Ready-Set`
Branch: `taky/ready-rebuild-v01-2026-09-21`
Validated product HEAD: `579089d6fa0c5c59950916cbe86ddc93a65fda0c`
Validation surface: PR #103 DRAFT / HOLD / DO NOT MERGE

## First read
1. `C2S/READY_SET_PRODUCT_COMPLETION_C2S_CLOSURE_2026-09-22_REV4.md`
2. `C2S/READY_SET_PRODUCT_COMPLETION_ATOMS_2026-09-22_REV4.json`
3. `C2S/READY_SET_PRODUCT_COMPLETION_MATRIX_2026-09-22_REV3.md`
4. `HANDOFF/READY_SET_NEW_CHAT_START_2026-09-22_REV4.md`
5. `REBUILD/validate-rebuild-v01.mjs`

## Phase
- Rebuild structure: FROZEN PRODUCT CANDIDATE / ~98–99%
- Planner browser/runtime productization: ~90%
- Overall user-facing product maturity: ~73–75% conservative
- DEVICE_VERIFIED: NOT RUN
- Netlify / Production / main merge: HOLD

## Exact validated product-head gates
At `579089d6fa0c5c59950916cbe86ddc93a65fda0c`:
- TAKY Codex Worker Self-Test — PASS — run 35677510686
- Ready Integration CI — PASS — run 35677510758
- Ready Runtime E2E — PASS — run 35677510701
- Planner Free Window Gate — PASS — run 35677510704
- Ready Daily Availability Gate — PASS — run 35677510688
- Ready Weekly Availability Gate — PASS — run 35677510812
- Ready Single Active Task Gate — PASS — run 35677510802
- Ready Child FACT Confirmation Gate — PASS — run 35677510842

## REV4 completed

### Multi-member isolation
Closed in browser/runtime:
- member-scoped Profile/app state
- member-scoped Planner
- member-scoped Assignment
- member-scoped local-first snapshots
- active-member-only recovery
- active-member-only outbox flush
- active-member-only public snapshot/outbox/conflict reads
- cross-member conflict resolution blocked
- remote sync requires authenticated member scope
- cross-member remote write blocked
- unscoped authenticated remote write blocked
- two-member E2E confirms no Profile / Planner / Assignment / snapshot / conflict mixing

Status:
- CODED PASS
- CI_VERIFIED PASS
- RUNTIME_VERIFIED PASS
- DEVICE_VERIFIED NOT RUN

### Learning reference binding
- official registry/unit evidence is consumed where verified
- Math 5-1 `약수와 배수` -> `6수01-04` verified runtime path
- insufficient actual context fails closed
- stale mapping-gap flags are removed after verified match
- English official achievement standard may bind, but unit mapping stays explicit `UNIT_MAPPING_EVIDENCE_GAP` because current source has no verified unit-connection table
- never invent textbook/unit mapping

### Planner / family timetable calibration
- representative weekly family timetable harness added
- recurring English / piano / taekwondo / science schedule patterns covered
- date-specific replacement covered
- real defect fixed: free-window capacity previously ignored weekly recurring schedule occurrences
- free-window capacity now consumes expanded `scheduleCommitmentsForDate()`, including recurring schedule and exceptions
- dedicated Planner Free Window Gate guards the behavior

Important:
- representative harness != actual family dataset calibration
- actual family times remain DATA_PENDING and must not be inferred

## Major previously completed slices
### Planner
- one-off + weekly fixed schedule
- schedule validity range
- SKIP / REPLACE overlays
- daily + weekly availability
- availability validity + exceptions
- weekly reflow proposal + Parent approval
- dirty-review
- adaptive estimate proposal + Parent approval
- MORNING daypart evidence without invented clock time
- evidence-backed allocation rationale
- carry/replan

### Learning Master
- subject method routing
- ordered specialist roundtrip
- evidence ontology/handoff
- repeated PARTIAL adaptive feedback
- smaller units / retrieval checkpoint / recovery escalation
- superseding analysis + Planner reallocation
- birthdate-only learner context
- no grade/region/curriculum inference from birthdate

### Capture
- source preservation
- Parent review
- reanalysis history
- failed reanalysis preserves prior successful draft
- English Capture -> FACT -> Learning Master -> Planner path

## Remaining predeploy priorities
Internal work, if authoritative data is available:
1. bind/calibrate actual family timetable dataset
2. bind actual workbook/textbook/unit reference evidence without inference
3. keep frozen-candidate regression clean after any parallel character change

External/device HOLD:
1. real OCR/Vision provider + real image
2. production Identity/remote sync
3. real microphone/camera
4. physical-device safe-area/keyboard/UX
5. Netlify deployment

## Concurrent branch warning
Same branch can receive character work.
Before any edit:
- live refresh
- classify diff
- preserve unrelated changes
- use fresh file SHA + sequential updates
- never force push

## TAKY constraints
- no user-as-tester/debugger
- no fake PASS
- CODED / CI / RUNTIME / DEVICE always separated
- Planner owns schedule dates
- specialist evidence cannot schedule dates
- birthdate cannot infer grade/region/curriculum
- Netlify / Production / main merge only after external-resource gate
- Snap & Pop / Hide & Seek untouched from this branch

## Resume target
Default resume target is **predeploy gap closure only**.
Do not reopen closed structural rebuild work without new regression evidence.
