# Hide Memory Review Roundtrip — C2S Integration Closure

Date: 2026-09-21
Status: BRANCH-ONLY / DRAFT PR #100 / DO NOT MERGE WITHOUT HUMAN APPROVAL

## Canonical ownership
1. Hide & Seek owns language-memory evidence and advisory priority only.
2. Ready Learning Engine owns review-policy interpretation.
3. Ready & Set Planner owns date/TODO scheduling.
4. Hide may activate a past-memory review only from an explicit Planner-created review directive.

## Implemented roundtrip
`Hide memory summary -> ReadyHideMemoryReviewV01.interpretHideMemorySummary -> ReadySetPlanner availability/date selection -> dated TODO -> EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE -> Hide reviewDirective()`

## Learning policy boundary
`interpretHideMemorySummary()` accepts only:
- authority = SPECIALIST_MEMORY_ADVISORY_ONLY
- reviewPolicyOwner = READY_LEARNING_ENGINE
- scheduleOwner = READY_SET_PLANNER
- prioritySemantics = ADVISORY_SIGNAL_NOT_DATE
- advisoryOnly = true
- evidenceBasis = HIDE_MEMORY_EVIDENCE

It emits `READY_LEARNING_ENGINE_REVIEW_POLICY` with lexical IDs and evidence, but no date or TODO ownership.

## Planner boundary
`planReview()` requires explicit candidate dates and existing Parent-confirmed availability through `candidateWindowsByDate()`.
If no confirmed review window exists, it fails closed with `NO_CONFIRMED_REVIEW_WINDOW`.
Only after Planner creates the dated TODO does it emit:
- authority = EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE
- reviewPolicyOwner = READY_LEARNING_ENGINE
- scheduleOwner = READY_SET_PLANNER
- lexicalIds
- directiveId
- taskId
- scheduledDate

Hide consumes lexical IDs/directive identity for retrieval execution; it does not own or reinterpret the date.

## Validation evidence
PR #100 HEAD: a12d58412eaaf1ceb6587962560edadd4908ed54
- Hide Memory Review Roundtrip #1: SUCCESS
- Ready Integration CI #260: SUCCESS
- Ready Runtime E2E #348: SUCCESS
- Ready Daily Availability Gate #12: SUCCESS
- Ready Weekly Availability Gate #6: SUCCESS
- TAKY Codex Worker Self-Test #482: SUCCESS

## Guardrails
- No main merge performed.
- No production deployment performed.
- No Netlify call performed.
- Planner does not schedule without confirmed availability.
- Learning policy output contains no date.
- Hide does not self-select old vocabulary from advisory priority.


## Session-level execution closure
Ready session runtime now carries the Planner-created Hide review directive into the actual specialist launch:
- Planner TODO provenance is revalidated through `directiveForPlannerTodo()`.
- Review TODOs force `suggested_app = hide-seek`.
- `launchSpecialist('hide-seek')` appends the serialized `review_directive` to the Hide URL.
- Hide consumes the existing canonical `reviewDirective()` contract and performs only the specified lexical retrieval.

On specialist return:
- Hide already emits `buildTaskSnapshot()`, including `memorySummary`, inside the TAKY learning event payload.
- Ready now passes the event payload into `applyInboundResult()`.
- `normalizeHideSpecialistResult()` accepts the result only when the memory summary still declares Hide advisory authority and Ready/Planner ownership.
- The normalized specialist result is stored on the Ready runtime task.
- Session wrap-up preserves `specialistResult` alongside the Planner outcome in `taskOutcomes`.

This closes the runtime path:
`Planner review TODO -> Ready session task -> Hide review directive -> Hide retrieval -> Hide memorySummary -> Ready task outcome`.

No new Hide scheduling authority was introduced.
