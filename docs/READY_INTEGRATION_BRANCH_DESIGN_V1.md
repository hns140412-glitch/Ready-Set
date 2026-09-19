# READY_INTEGRATION_BRANCH_DESIGN_V1

Branch: `taky/ready-integration-v01`  
Base: main `7f5b428ebc270685da02cbccebd27576cbfee9c0`  
Status: W-01 DESIGN LOCK

## Pipeline

`Assignment Fact → Learning Master Analysis → Learning Unit → Planner Allocation → DATED TODO → TODAY → Ready Execution → Progress Event / Observation → Carry-over / Learn`

## Single ownership

| Entity | Owner | Store |
|---|---|---|
| Assignment Fact / Package / Workbook Ref | Intake domain | `readyset_assignments_v2` mirrored through Local-first |
| Learning Analysis / Learning Unit | Learning Master | same aggregate, versioned analysis records |
| Homework/Learning Template | Learning Master | Planner store; references analysis/unit IDs |
| DATED TODO | Planner only | Planner store |
| TODAY selection | Child execution choice | app/session state; references existing TODO IDs |
| Progress / Carry-over | Planner from Ready result | Planner store |

## Integration rules

1. Main is the runtime base; staging is a semantic donor, not a merge base.
2. No second `days[].tasks` planner store is introduced.
3. Staging `assignmentFacts/assignmentPackages/workbookRefs` are migrated into `readyset_assignments_v2`.
4. Main `homework_templates` is retained only as Learning Master output.
5. Ready UI may link to an existing DATED TODO but may not create one.
6. Parent capture may persist source artifacts and facts but may not call Planner allocation.
7. Planner accepts only `FACT_CONFIRMED` and `INTERPRETED` units.
8. Unresolved facts, missing academy boundary, or actor conflict block allocation.
9. Actual time is observation evidence and cannot overwrite baseline or expand work automatically.
10. Query-role remains TEST_ONLY; no full Family Auth in this batch.

## Provenance chain

Every DATED TODO must carry:

- `assignment_id`
- `analysis_id`
- `learning_unit_id`
- `template_id`
- `allocation_run_id`
- source actor / confirmation evidence

Every result must preserve `todo_id`, `session_id`, `task_id`, and `learning_unit_id`.

## Port decisions

- Port semantics, not staging storage or provisional allocation functions.
- Preserve main Local-first, Outbox, recovery, conflict handling, runtime E2E, WEEK/DAY, Focus/Result/carry-over.
- Add assignment and Learning Master scopes to Local-first.
- Keep capture blobs in capture IndexedDB; store only artifact references in Assignment Facts.
- Answer/reference artifacts are `PARENT_ONLY` and excluded from child projections.

## Deletion / supersede boundary

- main Parent homework template allocation controls: superseded.
- staging direct fact-to-`days[].tasks` allocation: superseded.
- staging G14 Parent fact-to-task creation: superseded.
- PR #29 remains HOLD / DO NOT MERGE and is not used as the integration base.

## Verification boundary

- Static/unit contract proof: CI_VERIFIED only after GitHub Actions passes on this branch/PR.
- Browser Playwright proof: RUNTIME_VERIFIED only for tested scenarios.
- No physical evidence: DEVICE_VERIFIED remains false.
- No Netlify/production work before W-02 through W-07 gates close.
