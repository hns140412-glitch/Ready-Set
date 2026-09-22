# READY & SET NEW CHAT START — 2026-09-22 REV3

최신 TAKY 기준으로 Ready & Set 제품 완성도 작업을 재개해.

## Repository
- repo: `hns140412-glitch/Ready-Set`
- branch: `taky/ready-rebuild-v01-2026-09-21`
- C2S captured HEAD: `f2d3d9a5ae27185ae49cfb3db3a5db92bfdc07f2`

## 반드시 먼저 할 일
1. branch를 live refresh한다. captured HEAD를 정본으로 가정하지 않는다.
2. 아래 문서를 순서대로 읽는다.
   - `C2S/READY_SET_PRODUCT_COMPLETION_C2S_CLOSURE_2026-09-22_REV3.md`
   - `C2S/READY_SET_PRODUCT_COMPLETION_ATOMS_2026-09-22_REV3.json`
   - `HANDOFF/READY_SET_REBUILD_HANDOFF_2026-09-22_LATEST.md`
   - `C2S/READY_SET_PRODUCT_COMPLETION_MATRIX_2026-09-22_REV2.md`
   - `REBUILD/validate-rebuild-v01.mjs`
3. latest exact-head Foundation / Self-Test / Runtime E2E / Integration / Planner gates를 확인한다.
4. red면 다음 구현으로 넘어가지 말고 runtime regression vs stale test/validator를 분류한 뒤 최소 수정한다.

## 현재 중요 상태
- Rebuild ownership migration: ~98–99%.
- Planner browser/runtime productization: ~88–90%.
- Overall user-facing product maturity: ~72–74% conservative.
- DEVICE_VERIFIED: NOT RUN.
- Netlify / Production / main merge: 금지 상태 유지.

## 최근 닫힌 축
- weekly schedule + validity + SKIP/REPLACE
- weekly availability + validity + SKIP/REPLACE
- weekly reflow + Parent approval + dirty-review
- MORNING evidence/daypart without fake clock time
- adaptive estimate
- repeated PARTIAL adaptive Learning Master feedback loop
- specialist memory evidence -> smaller units/retrieval checkpoint/recovery
- birthdate-only LearnerContext, no grade/region/curriculum inference
- Capture review/reanalysis history
- English Capture -> FACT -> Learning Master -> Planner E2E

## 현재 가장 중요한 미완료
**Multi-member isolation exact-head runtime validation.**

ReadyMemberScope has been introduced:
- Planner/Assignment storage member scoped
- app state dynamic member-scoped key
- local-first sync scope member encoded
- sync conflict count/list filtered by active member
- raw `member:...:planner` prefix hidden in UI label

But the exact captured-head Runtime E2E was still running when C2S closed.

### Resume validation target
Create/confirm an E2E that proves:
1. member A creates profile/Planner/Assignment data.
2. session switches to member B.
3. member B does not see A's profile/Planner/Assignment/conflict rows.
4. B can create independent data.
5. switching back to A restores only A data.
6. local-first snapshot recovery respects member scope.
7. remote sync scope cannot cross member boundary.

## Important concurrent-work warning
The same branch is also receiving character-related commits.
Recent parallel character work includes:
- reference survey
- source photo normalization
- generation job state
- asset key contract
- character core orchestrator
- UI journey validator
- dormant Character Visual ID style cleanup

Do not overwrite these changes.

If branch moves while editing:
- classify changed files,
- if unrelated, rebase conceptually onto latest,
- use fresh file SHA + sequential GitHub contents updates for isolated files,
- never force push.

## TAKY constraints
- no user-as-tester
- no fake PASS
- distinguish CODED / CI_VERIFIED / RUNTIME_VERIFIED / DEVICE_VERIFIED
- Planner owns schedule dates
- specialist evidence cannot own schedule dates
- birthdate cannot infer grade/region/curriculum
- no Netlify/Production/main merge before external-resource gate
- Snap & Pop / Hide & Seek untouched in this Ready branch

## After member isolation closes
Next priorities:
1. real family timetable dataset calibration
2. subject reference binding / achievement-standard evidence
3. real OCR/Vision provider + real image validation
4. real microphone/device validation
5. real-device UX
6. external sync/deploy only through TAKY gate
