# READY & SET NEW CHAT START — 2026-09-22 REV4

최신 TAKY 기준으로 Ready & Set 배포 전 작업을 재개해.

## Repository
- repo: `hns140412-glitch/Ready-Set`
- branch: `taky/ready-rebuild-v01-2026-09-21`
- validated product HEAD: `579089d6fa0c5c59950916cbe86ddc93a65fda0c`
- product validation PR surface: #103 DRAFT / HOLD / DO NOT MERGE

## Read first
1. `C2S/READY_SET_PRODUCT_COMPLETION_C2S_CLOSURE_2026-09-22_REV4.md`
2. `C2S/READY_SET_PRODUCT_COMPLETION_ATOMS_2026-09-22_REV4.json`
3. `C2S/READY_SET_PRODUCT_COMPLETION_MATRIX_2026-09-22_REV3.md`
4. `HANDOFF/READY_SET_REBUILD_HANDOFF_2026-09-22_LATEST.md`
5. `REBUILD/validate-rebuild-v01.mjs`

## Resume rule
1. Live refresh branch first. Do not assume the validated product HEAD is still branch HEAD.
2. If HEAD moved because of parallel character work, classify the diff and preserve unrelated changes.
3. Never force push.
4. Use fresh file SHA + sequential contents updates.
5. Before new product implementation, confirm latest exact-head gates or classify why docs-only/concurrent commits moved the branch.
6. No Netlify / Production / main merge before TAKY external-resource gate.
7. Do not use the user as tester/debugger.

## Closed in REV4
### Multi-member isolation
- Profile/app state, Planner, Assignment member scoped
- local-first recovery / flush / public read APIs active-member scoped
- conflicts active-member scoped
- cross-member conflict resolution blocked
- remote sync requires authenticated member scope
- cross-member remote write blocked
- browser E2E across two member IDs

### Planner/timetable
- representative family weekly timetable calibration harness
- recurring schedule now subtracts from free-window capacity
- SKIP/REPLACE expanded schedule is shared by UI and free-window capacity logic
- dedicated Planner Free Window Gate protects recurring subtraction

### Learning reference
- official standard registry/unit mapping consumed by Learning Master where verified
- Math 5-1 약수와 배수 -> 6수01-04 runtime evidence
- insufficient context fails closed
- stale static mapping gaps are cleared after a verified standard match
- English unit mapping stays explicit evidence gap because current source has no verified unit-connection table

## Exact validated product-head gates
At `579089d6fa0c5c59950916cbe86ddc93a65fda0c`:
- Self-Test PASS — 35677510686
- Integration CI PASS — 35677510758
- Runtime E2E PASS — 35677510701
- Planner Free Window PASS — 35677510704
- Daily Availability PASS — 35677510688
- Weekly Availability PASS — 35677510812
- Single Active Task PASS — 35677510802
- Child FACT PASS — 35677510842

## Current maturity
- Rebuild: ~98–99%
- Planner browser/runtime: ~90%
- Overall user-facing product maturity: ~73–75% conservative
- DEVICE_VERIFIED: NOT RUN

## Next predeploy priorities
Proceed only with gaps that can be closed truthfully without deployment:
1. actual family timetable dataset binding/calibration if authoritative data is available
2. actual workbook/textbook/unit reference binding where source evidence exists
3. predeploy provider/device contract checks that do not require external deployment

Hold as external/device:
- real OCR/Vision provider + real image
- production Identity/remote sync environment
- real microphone/camera
- physical-device safe-area/keyboard/UX
- Netlify deploy

When the internal candidate is frozen again, run TAKY external-resource gate before any hosting call.
