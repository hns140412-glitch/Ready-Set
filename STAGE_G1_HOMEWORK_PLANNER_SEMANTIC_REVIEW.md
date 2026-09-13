# Ready & Set — Stage G1 Homework Intake / Planner Semantic Review

Date: 2026-09-08 KST
Branch target: `staging`
Baseline head before change: `84742e64eaa2966a8db0de985c7c0b23fd7678c2`
Production/main: unchanged
Central TAKY canonical: unchanged

## Purpose

This staging delta corrects the remaining F4/E2 semantic mismatches identified in `READY_CURRENT_TRUTH_LATEST.md` without promoting unverified runtime behavior to Production.

## Preserved hard locks

- `SCHEDULE COMMITMENT ≠ HOMEWORK TEMPLATE ≠ DATED TODO INSTANCE ≠ PROGRESS EVENT`
- Parent = CAPTURE / INPUT / CONFIRM
- Learning Master = INTERPRET / LOAD ANALYSIS
- Planner = ALLOCATE
- Child = VIEW / FACT INPUT WHEN APPLICABLE / SELECT TODAY / EXECUTE
- `PHYSICAL PAGE ≠ LEARNING UNIT`
- `MINUTES ≠ PRIMARY SPLIT UNIT`
- `CODE EXISTS ≠ ACTUAL BEHAVIOR VERIFIED`

## Conflicts found in F4 / E2

1. Parent UI exposed manual difficulty and estimated-minutes fields.
2. Stage E2 used fixed minute capacities as allocation authority.
3. `NEXT_TUE` was a normal Talent allocation slot even though it is the next cycle/deadline boundary.
4. Talent intake used “배포” wording that blurred source intake vs Planner allocation.
5. Parent source input and dated execution tasks shared the same task-oriented storage path.
6. Re-running Talent distribution could blanket remove/recreate generated tasks and risk losing progress identity.
7. English source semantics were only a hardcoded dated seed and did not represent reusable workbook reference + academy-cycle homework facts + weekday print units.
8. Child/parent factual input provenance did not have a common conflict state.

## Stage G1 correction

### Shared assignment FACT model

Planner store is extended non-destructively with:
- `assignmentFacts`
- `assignmentPackages`
- `workbookRefs`
- existing `days[].tasks` retained as dated execution instances

Facts preserve actor provenance. Conflicting child/parent values become `CONFIRMATION_REQUIRED` rather than silently replacing authority.

### Talent

- One weekly package.
- Six separate book-level facts: 연산 / 한자 / 국어 / 사회 / 수학 / 생각하는 피자.
- Book facts keep weekly range, teacher instruction and answer/reference note.
- Next Tuesday is stored as deadline/cycle boundary and excluded from normal planner window.
- No parent difficulty/minute input.
- No fixed minute-capacity table.
- Local staging allocation uses a baseline activity-load profile only as a provisional fallback.
- Time estimate is `null/UNVERIFIED` at source allocation time and remains secondary feedback.
- Existing completed/in-progress tasks are reconciled and preserved instead of blanket delete/recreate.

### English

- Reusable workbook reference is separate from current academy-cycle assignment fact.
- Child and parent can both record the actual range.
- Weekday print homework is stored as independent units.
- Vocabulary/listening/recording/writing components remain separate factual units.
- Next academy date must be explicit before dated allocation is created.
- Missing next academy date stays `NEXT_ACADEMY_UNVERIFIED`; Planner does not invent a deadline.

### Parent UI

Removed from Stage G1 parent surface:
- manual difficulty selection
- manual estimated minutes
- parent allocation terminology

Parent surface now asks for source FACTs only.

### Child UI

- Shows Planner-prepared dated tasks separately from whole assignment FACTs.
- Can add sudden school/event homework with `CHILD_INPUT` provenance.
- Can record an English range fact; a conflict with an existing parent fact becomes `CONFIRMATION_REQUIRED`.

## Static / local checks completed before commit

- `node --check ready-stage-e.js` PASS
- `node --check ready-stage-f.js` PASS
- `node --check ready-stage-c.js` PASS
- `VERSION.json` parse PASS
- Talent test: 6 book facts → 6 dated tasks, no deadline-day allocation PASS
- Talent re-save: stable task IDs and completed status preserved PASS
- Talent minute authority removed PASS
- English parent fact confirmation PASS
- English conflicting child range → `CONFIRMATION_REQUIRED` PASS
- School event `CHILD_INPUT` provenance PASS

## Still not verified

- actual browser/DOM behavior on staging preview
- actual iPhone/device behavior
- real family-role auth; query-param role remains staging-only
- true schedule/commitment integration for final dated allocation
- subject-master deep unit decomposition
- camera/OCR durable capture implementation
- Production behavior

Current dated allocations produced without full schedule integration are explicitly marked `PROVISIONAL_SCHEDULE_AWARENESS_PENDING` and must not be treated as final schedule truth.

## Promotion gate

Do not merge to Production until:
1. staging ref/CI/preview is verified,
2. Child and Parent surfaces are visibly different,
3. parent intake has no difficulty/minute allocation fields,
4. Talent next-Tuesday boundary behavior is confirmed,
5. English whole FACT vs dated task distinction is visible,
6. Focus/session regressions are checked,
7. explicit user approval for Production is received.
