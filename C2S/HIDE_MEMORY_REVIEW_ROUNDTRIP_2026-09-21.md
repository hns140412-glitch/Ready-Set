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


## Hide Runtime V2 contract correction

Current Hide V2 producer contract:
- resultContract = `HIDE_SPECIALIST_RESULT_V2`
- runtime = `V2`
- activeMissionId / missionStatus
- taskState / learningPhase
- trailMastery = null unless Hide owns and actually measures Trail Mastery separately
- memorySummary = SPECIALIST_MEMORY_ADVISORY_ONLY
- taskContext preserves Ready session/task/lap correlation

Ready now:
- normalizes V2 mission fields without pretending they are V1 sheet fields;
- preserves null `trailMastery` instead of coercing null to 0;
- consumes Hide V2 `learning_event` query envelopes;
- validates the V2 event through `normalizeHideV2ReturnEvent()`;
- stores the normalized Hide result on the Ready task.

### Stale-target fail-closed correction
The historical hard-coded Hide Netlify URL is not accepted as evidence of the current V2 candidate.

For Planner-directed Hide review:
- Ready requires explicit `globalThis.ReadySetSpecialistTargets.hideSeekV2`.
- If no current V2 target is configured, launch fails closed with `HIDE_V2_TARGET_REQUIRED`.
- Ready must not silently route a V2 review directive to the historical V1 deployment.

### Validation
Ready pre-document HEAD `84b68624612c745b5a30274cb0b5744199963a53`:
- Hide Memory Review Roundtrip #13 — SUCCESS
- Ready Integration CI #278 — SUCCESS
- Ready Runtime E2E #445 — SUCCESS
- Ready Daily Availability Gate #24 — SUCCESS
- Ready Weekly Availability Gate #18 — SUCCESS
- Ready Single Active Task Gate #18 — SUCCESS
- TAKY Codex Worker Self-Test #541 — SUCCESS

Hide V2 producer HEAD `4a9797a048a1c4a2c04023e90f35f97ee6d43d12`:
- Validate Hide Runtime V2 #73 — SUCCESS
- Validate Hide & Seek #527 — SUCCESS

### Remaining truth boundary
This is CURRENT-CANDIDATE CONTRACT VERIFIED, not live cross-app runtime verified.
No current Hide V2 hosted target has been configured and no deployment was performed.
Therefore the full Ready-current-candidate -> Hide-current-candidate -> Ready browser roundtrip remains OPEN.
