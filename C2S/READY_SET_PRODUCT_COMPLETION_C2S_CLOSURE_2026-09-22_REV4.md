# READY & SET PRODUCT COMPLETION C2S CLOSURE — 2026-09-22 REV4

Status: C2S_COMPILE_CLOSED / PREDEPLOY_INTERNAL_PASS / EXTERNAL_DEVICE_OPEN
Scope: Ready & Set only
Authority branch: `taky/ready-rebuild-v01-2026-09-21`
Validated product HEAD: `579089d6fa0c5c59950916cbe86ddc93a65fda0c`

## TAKY closure rule
- CODED / CI_VERIFIED / RUNTIME_VERIFIED / DEVICE_VERIFIED are separated.
- Product validation is anchored to the exact product HEAD above; documentation commits after it do not replace that evidence.
- No Netlify / Production / main merge.
- No user-as-tester.
- Same-branch character work must be preserved; no force push.
- External/provider/device gaps remain OPEN rather than being converted into fake PASS.

## Closed in REV4

### 1. Multi-member isolation
- Central `ReadyMemberScope` remains the storage/sync scope authority.
- Profile/app state, Planner and Assignment storage are member scoped.
- Local-first snapshot recovery only restores the active member.
- Local-first flush only sends the active member's outbox rows.
- Public local-first `snapshots()/outbox()/conflicts()` reads are active-member scoped.
- Cross-member conflict resolution is rejected.
- Remote sync binds the authenticated Identity `member_id` to `member:<member_id>:<scope>`.
- Authenticated unscoped writes are rejected with `MEMBER_SCOPE_REQUIRED`.
- Cross-member writes are rejected with `MEMBER_SCOPE_FORBIDDEN`.
- Two-member browser E2E covers independent Profile / Planner / Assignment / snapshot / conflict state.

Disposition:
- CODED: PASS
- CI_VERIFIED: PASS
- RUNTIME_VERIFIED: PASS
- DEVICE_VERIFIED: NOT RUN

### 2. Learning reference binding
- Existing official achievement-standard registry remains authoritative where verified.
- Verified full registry coverage remains present for Korean / Math / Social Studies / Science / English.
- Verified unit mapping exists for Korean / Math / Social Studies / Science where the official source provides a unit connection table.
- English has verified achievement standards but no verified unit connection table in the current source; this stays an explicit `UNIT_MAPPING_EVIDENCE_GAP`.
- Learning Master runtime now has regression evidence that a real Math 5-1 context can bind `약수와 배수` to official standard `6수01-04` and verified unit-mapping evidence.
- Insufficient actual assignment context remains fail-closed and does not invent a standard.
- Fixed a real stale-gap defect: verified standard matches no longer retain obsolete `GRADE_STANDARD_MAPPING_NOT_YET_BOUND` / source-pointer gap flags.

Disposition:
- CODED: PASS for verified binding path
- CI_VERIFIED: PASS
- RUNTIME_VERIFIED: PASS
- DEVICE_VERIFIED: NOT APPLICABLE to reference matching
- Real textbook/workbook-specific binding remains evidence-dependent, not auto-inferred.

### 3. Family timetable predeploy calibration
- Added representative weekly family timetable calibration harness.
- Weekly English / piano / taekwondo / science commitments are tested against recurring availability.
- Date-specific replacement is tested without mutating the weekly source recurrence.
- Found and fixed a real Planner gap: free-window capacity previously subtracted one-off commitments only and ignored recurring schedule occurrences.
- `freeWindowEvidence()` now consumes the same `scheduleCommitmentsForDate()` expanded schedule contract used by the Planner UI, including weekly recurrence and date exceptions.
- Planner Free Window Gate now directly guards recurring commitment subtraction and replacement exceptions.

Important:
- This is a representative predeploy calibration harness, not a claim that the user's final real family timetable dataset has already been entered/calibrated.

Disposition:
- CODED: PASS
- CI_VERIFIED: PASS
- RUNTIME_VERIFIED: PASS
- REAL_FAMILY_DATA_CALIBRATED: NO / DATA ENTRY PENDING
- DEVICE_VERIFIED: NOT RUN

## Exact-head validation snapshot
Validated product HEAD: `579089d6fa0c5c59950916cbe86ddc93a65fda0c`

- TAKY Codex Worker Self-Test — PASS, run 35677510686
- Ready Integration CI — PASS, run 35677510758
- Ready Runtime E2E — PASS, run 35677510701
- Planner Free Window Gate — PASS, run 35677510704
- Ready Daily Availability Gate — PASS, run 35677510688
- Ready Weekly Availability Gate — PASS, run 35677510812
- Ready Single Active Task Gate — PASS, run 35677510802
- Ready Child FACT Confirmation Gate — PASS, run 35677510842

Runtime browser suite includes 77 Playwright tests at this stage.

## Conservative product maturity
- Rebuild / ownership migration: ~98–99%
- Planner browser/runtime productization: ~90%
- Multi-member browser/runtime isolation: materially closed; production Identity/sync deployment still external.
- Learning reference binding: materially stronger; actual workbook/textbook context remains evidence-dependent.
- Overall user-facing product maturity: approximately ~73–75%.
- DEVICE_VERIFIED: NOT RUN.

The overall maturity is not raised aggressively because real OCR/Vision, microphone, production Identity/sync, real-device UX and final real-family dataset are still outside the verified browser/runtime scope.

## Remaining predeploy/external gaps
1. Enter and calibrate the actual family timetable dataset; do not infer missing times.
2. Continue actual workbook/textbook/unit reference binding only where source evidence exists.
3. Real OCR/Vision provider + real image validation.
4. Real microphone/device validation.
5. Physical-device UX: safe-area / keyboard / camera / audio.
6. Production Identity and remote sync environment verification.
7. External deploy only after frozen candidate review + TAKY external-resource gate.

## C2S closure
UNMAPPED_MATERIAL = 0 within this REV4 work scope.
SILENT_LOSS = 0 within this REV4 work scope.
FALSE_CONVERGENCE = false.
REFLECTION_COMPLETE = true.
PREDEPLOY_INTERNAL_EXECUTION_COMPLETE = true for the validated product HEAD.
DOWNSTREAM_EXTERNAL_EXECUTION_COMPLETE = false.
