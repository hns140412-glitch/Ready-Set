# READY & SET — LEARNING APP FAMILY INTEGRATION — 2026-09-21

Status: BRANCH_IMPLEMENTED_AND_VERIFIED
Repository: hns140412-glitch/Ready-Set
Branch: taky/learning-app-family-p1-2026-09-21
Exact verified HEAD: 8f2c097ae52fcb53b22ca9bc0f9a867ff660dc48

## Implemented integration delta

1. Specialist return semantics
- HELP_NEEDED -> WAITING_FOR_PARENT.
- explicit TASK_BLOCKED / BLOCKED -> BLOCKED.
- specialist source_app / event_id / lap_id / raw state / normalized state are preserved.
- specialist completion closes specialist lap only and does not end the Ready session.

2. READY_LEARNING_CONTEXT_V1 producer
- Ready is the producer from confirmed Learning Unit / analysis / assignment lineage.
- fail closed unless confirmed lineage exists.
- minimum payload:
  learning_unit_id / analysis_id / assignment_id / subject /
  concept_skill_target / activity_types / cognitive_load_profile /
  confidence / unresolved_flags.
- learning context is advisory metadata only.
- no identity, role, permission, Planner allocation authority, dated TODO authority,
  or Hanja grade inference authority is transferred.

3. Planner/session authority
- Ready remains session owner.
- Ready Planner remains DATED TODO/allocation owner.
- at most one Planner task may be IN_PROGRESS.
- specialist apps own specialist tasks/laps, never Ready SESSION_END.

## Verification

- Ready Integration CI: PASS on exact integration HEAD.
- Ready Runtime E2E: PASS on exact integration HEAD.
- central TAKY cross-app contract re-run: PASS with this exact SHA.
- CODED: YES
- CI_VERIFIED: YES
- RUNTIME_VERIFIED: YES for Ready integration/runtime scope
- DEVICE_VERIFIED: NO / NOT_RUN
- PRODUCTION_VERIFIED: NO / NOT_RUN

## External-action boundary

- main is not changed by this integration branch.
- no Netlify/deployment was performed.
- no production claim.
- merge/freeze remains a separate TAKY decision.

END
