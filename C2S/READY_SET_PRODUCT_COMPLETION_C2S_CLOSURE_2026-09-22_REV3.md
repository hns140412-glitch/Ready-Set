# READY & SET PRODUCT COMPLETION C2S CLOSURE — 2026-09-22 REV3

Status: C2S_COMPILE_CLOSED / DOWNSTREAM_EXECUTION_OPEN
Scope: Ready & Set only
Authority branch: `taky/ready-rebuild-v01-2026-09-21`
Captured HEAD: `f2d3d9a5ae27185ae49cfb3db3a5db92bfdc07f2`

## TAKY closure rule
- RAW/latest corrections preserved.
- CODED / CI / RUNTIME / DEVICE separated.
- No Netlify / Production / main merge.
- Snap & Pop / Hide & Seek untouched from this Ready branch.
- Do not treat in-progress Runtime E2E as PASS.
- On resume, live refresh branch before any edit.

## New material atomized in this work session

### PLANNER
1. DECISION — weekly fixed schedule remains canonical; date-specific exceptions are overlays.
2. IMPLEMENTED — schedule exceptions: SKIP / REPLACE, without mutating recurrence source.
3. IMPLEMENTED — weekly schedule validity range: valid_from / valid_until.
4. IMPLEMENTED — availability exceptions: SKIP / REPLACE.
5. IMPLEMENTED — weekly availability validity range.
6. IMPLEMENTED — schedule / availability changes mark reflow_review needed.
7. IMPLEMENTED — weekly reflow remains proposal + Parent approval; no silent TODO movement.
8. CORRECTION — Planner UI must consume exception-expanded schedule, not raw recurrence rows.
9. IMPLEMENTED — daypart display preserves MORNING evidence without inventing clock time.
10. VALIDATED — Planner browser/runtime productization estimated ~88–90%; device remains unverified.

### LEARNING MASTER
11. IMPLEMENTED — adaptive review consumes repeated PARTIAL / carry evidence.
12. IMPLEMENTED — specialist memory evidence may reduce unit span, add retrieval checkpoint, raise recovery floor.
13. AUTHORITY — specialist evidence cannot set schedule date / planner date / deadline.
14. VALIDATED — repeated PARTIAL → carry escalation → specialist evidence → Learning Master reinterpretation → superseding analysis → finer units → Planner reallocation passes browser runtime.
15. IMPLEMENTED — birthdate-only LearnerContext.
16. DECISION — birthdate may influence UNIT_SPAN / CHECKPOINT_FREQUENCY only.
17. PROHIBITED — no automatic grade, region, curriculum or education-policy inference from birthdate.
18. VALIDATED — age 6 gets smaller chunk + checkpoint; age 11/12 preserve normal subject chunk baseline.

### CAPTURE / OCR
19. IMPLEMENTED — capture source preservation, disposition closure, Parent review, reanalysis history.
20. CORRECTION — failed reanalysis must preserve prior successful current draft; failure goes to analysis_failure_history.
21. VALIDATED — capture review + reanalysis history passes browser runtime.
22. VALIDATED — English capture draft → Parent review → confirmed FACT → Learning Master → Planner TODO path exists and passes runtime.
23. OPEN / EXTERNAL — real OCR/Vision provider + real image validation remains external/provider/device work.

### MULTI-MEMBER / FAMILY BOUNDARY
24. CONFLICT FOUND — FamilySession had member_id but planner/assignment/app state were historically family/local-global scoped.
25. IMPLEMENTED — central `ReadyMemberScope` contract added.
26. IMPLEMENTED — Planner and Assignment localStorage keys become authenticated-member scoped; anonymous local keeps legacy keys.
27. IMPLEMENTED — Local-first sync scope encodes member: `member:<member_id>:<scope>`.
28. IMPLEMENTED — app state storage uses dynamic member-scoped key and reloads state on family-session member transition.
29. CORRECTION — sync conflict fixture and UI must parse member-scoped scope.
30. IMPLEMENTED — sync status/conflict list filters rows to active member and hides raw member scope prefix in labels.
31. OPEN VALIDATION — latest exact-head Runtime E2E still in progress at C2S capture time.

### CHARACTER PARALLEL WORK
32. EVIDENCE — concurrent same-branch work added character reference survey, source photo normalization, generation job state, asset keys, core orchestrator, UI journey validation, and then removed dormant Character Visual ID styles.
33. CONSTRAINT — these parallel commits were preserved; Ready member/sync work must not overwrite them.
34. PROCESS CORRECTION — repeated non-fast-forward races occurred because multiple workers push to same branch.
35. STRATEGY — on same-branch concurrent work, prefer fresh file SHA + sequential contents API updates for isolated files; never force push.

## Current validation snapshot at captured HEAD
HEAD: `f2d3d9a5ae27185ae49cfb3db3a5db92bfdc07f2`

Observed:
- Rebuild Foundation: PASS
- TAKY Worker Self-Test: PASS
- Ready Daily Availability Gate: PASS
- Ready Single Active Task Gate: PASS
- Ready Runtime E2E: IN_PROGRESS
- Planner Free Window Gate: IN_PROGRESS
- Integration / Weekly Availability / Child FACT gates: queued or in progress at capture time
- DEVICE_VERIFIED: NOT RUN

Therefore:
- CODED: PASS for the new member-scope and prior Planner/Learning/Capture slices.
- CI_VERIFIED: PARTIAL at capture time.
- RUNTIME_VERIFIED: DO NOT CLAIM on latest captured HEAD until exact-head run completes.
- DEVICE_VERIFIED: NOT RUN.

## Product maturity — conservative
- Rebuild / ownership migration: ~98–99%
- Planner browser/runtime productization: ~88–90%
- Learning Master adaptive internal behavior: materially improved; still PARTIAL because reference binding / external learning evidence depth remains.
- Capture local review path: materially improved; real provider/device OCR remains PARTIAL.
- Overall user-facing product maturity: approximately ~72–74% before real-device/provider completion.
- Multi-member isolation: CODED, exact-head runtime validation still open at capture time.

## Remaining high-value gaps
1. Finish exact-head Runtime/CI validation for member-scoped persistence and sync conflict UI.
2. Verify app_state + Planner + Assignment + IndexedDB/local-first separation across two different member_id values in one browser.
3. Verify remote sync backend accepts member-scoped scope safely without allowing cross-member read/write.
4. Bind real family timetable data and calibrate Planner with actual use.
5. Improve subject reference binding: textbook/unit ↔ achievement-standard mapping where source evidence exists.
6. Real OCR/Vision provider + real image/device validation.
7. Real microphone/device verification.
8. Real-device UX / keyboard / safe-area.
9. External deploy only after frozen candidate + TAKY external-resource gate.

## C2S closure
UNMAPPED_MATERIAL = 0 within recovered current-session scope.
SILENT_LOSS = 0 within recovered current-session scope.
FALSE_CONVERGENCE = false.
REFLECTION_COMPLETE = true for this session.
DOWNSTREAM_EXECUTION_COMPLETE = false because latest exact-head Runtime E2E was still running at capture time.
