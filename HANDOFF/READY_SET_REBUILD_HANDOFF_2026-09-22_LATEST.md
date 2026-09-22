# READY & SET REBUILD HANDOFF — LATEST — 2026-09-22 REV6

## Resume
최신 TAKY 기준으로 Ready & Set predeploy frozen candidate 후속 작업을 재개해.

Repository: `hns140412-glitch/Ready-Set`
Branch: `taky/ready-rebuild-v01-2026-09-21`
Validated product HEAD: `6287c0e4c64fbadcdaf3d7d27a291b414ccba751`

## First read
1. `C2S/READY_SET_PRODUCT_COMPLETION_C2S_CLOSURE_2026-09-22_REV5.md`
2. `C2S/READY_SET_PRODUCT_COMPLETION_ATOMS_2026-09-22_REV5.json`
3. `C2S/READY_SET_PRODUCT_COMPLETION_MATRIX_2026-09-22_REV4.md`
4. this handoff
5. `REBUILD/validate-rebuild-v01.mjs`

## Frozen product validation
At product HEAD `6287c0e...`:
- Ready Runtime E2E: PASS / 82 of 82 / run 35681187182
- TAKY Worker Self-Test: PASS / run 35681187177
- Ready Integration CI: PASS / run 35681187201
- Planner Free Window: PASS / run 35681187219
- Daily Availability: PASS / run 35681187202
- Weekly Availability: PASS / run 35681187261
- Single Active Task: PASS / run 35681187228
- Child FACT Confirmation: PASS / run 35681187187
- Release archive boundary: PASS
- Deploy-source archive entries: 155
- Verified deploy-source artifact: generated successfully
- DEVICE_VERIFIED: NOT RUN

## REV6 predeploy hardening
### Release archive boundary
- `.gitattributes` excludes governance/test/handoff/generated audit material from `git archive`.
- `.github/`, `tests/`, `C2S/`, `HANDOFF/`, `REBUILD/`, `ui-audit/`, Markdown, nested ZIP are excluded.
- Runtime essentials remain required by `tests/release-package-contract.test.js`.
- Runtime E2E now validates the archive boundary before packaging.
- Actual deploy-source artifact was produced only after archive validation + Runtime E2E PASS.

### PWA cache / archive consistency
- Legacy master-logic Markdown files were removed from service-worker CORE.
- This prevents PWA install/cache.addAll from depending on files intentionally excluded from the deploy archive.
- Regression test rejects Markdown re-entry into the service-worker core list.

### Version provenance
- `VERSION.json` remains a compatibility mirror.
- `releaseStatus` now reflects `PREDEPLOY_FROZEN_CANDIDATE__EXTERNAL_DEVICE_PENDING`.
- Browser/runtime and archive validation are recorded without claiming device/provider/production validation.

## Previously closed
### Multi-member
- member-scoped Profile / Planner / Assignment / app state
- active-member-only local-first recovery/flush/conflict resolution
- remote member scope required
- cross-member remote write forbidden

### Real family timetable
Confirmed execution-eligible rows:
- Mon English 16:00–18:00
- Mon Science 19:00–20:00
- Tue Piano 14:00–16:00
- Wed English 16:00–18:00
- Thu Taekwondo 16:30–18:00
- Fri English 16:00–18:00

Confirmation-required HOLD:
- Mon Taekwondo 14:30 / end missing
- Tue Talent worksheet 19:00–21:00 / source marked uncertain
- Wed Piano 13:30 / end missing
- Wed Taekwondo 14:30 / end missing
- Thu Piano 14:30 / end missing
- Fri Piano 14:30 / end missing

Rule:
- no inferred times
- confirmed rows only are execution-eligible
- family-specific evidence remains test fixture data, not deploy product data

### Provider/device contracts closed predeploy
- unsupported recording fail-closed
- microphone denial classification
- actual MIME/extension handling
- capture Parent auth
- provider config/error fail-closed
- review-draft only
- answer-reference protection
- upload count/type/size guards

### Learning reference binding
- official standard/unit mapping may bind only when verified source evidence exists.
- no actual grade/semester/unit context => evidence available but not applied.
- weak/non-unique unit context => candidate/HOLD, not invented mapping.

## Current internal state
- Rebuild ownership: ~98–99%
- Planner browser/runtime productization: ~90%
- Multi-member browser/runtime isolation: closed predeploy
- Release packaging boundary: closed predeploy
- PWA offline/archive dependency mismatch: closed
- Overall user-facing product maturity: ~74–76% conservative
- Netlify / Production / main merge: HOLD

## Remaining truthful gaps
1. Confirm six HOLD timetable rows.
2. Bind real workbook/textbook/unit evidence only where actual evidence exists.
3. Real OCR/Vision provider + real images.
4. Real microphone/camera/device.
5. Physical-device safe-area / keyboard / audio / camera UX.
6. Production Identity / remote sync.
7. TAKY external-resource gate before deploy.

## TAKY operating constraints
- Live refresh before edits.
- If HEAD moves, diff first.
- Preserve character parallel work.
- Fresh file SHA + sequential contents updates for isolated edits.
- No force push.
- If exact-head gate red: stop, classify, minimal fix, rerun.
- No user-as-tester.
- Separate CODED / CI_VERIFIED / RUNTIME_VERIFIED / DEVICE_VERIFIED.
- No Netlify / Production / main merge at this stage.
