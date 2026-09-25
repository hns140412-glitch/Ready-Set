# READY CROSS-APP PROVIDER VERIFICATION — CURRENT — 2026-09-25

STATE: INTERNAL_PROVIDER_PREP_CLOSED / LIVE_PROVIDER_ROUNDTRIP_OPEN
BRANCH: taky/ready-character-intro-integration-2026-09-24

## TAKY execution
Think Again, Keep Your Key.
Think Again, You’re The Key.
USER != DEBUGGER.

CLOSED Ready ownership/runtime slices remain inherited.
No Netlify deploy/hosted call was made.
DEPLOYMENT HOLD and MERGE HOLD remain active.

## Exact functional validation
VALIDATED_FUNCTIONAL_HEAD: 4c89efd6ac2497c2be9d5eeeb4c1fd0ba318f917
READY_RUNTIME_E2E_RUN: 36087700432
RESULT: SUCCESS
PLAYWRIGHT: 101 passed

The exact-head suite includes:
- consolidated Ready -> Hide evidence -> adaptive replan journey
- learner adaptive profile
- recurring adaptive memory loop
- governed specialist target descriptor
- existing member-scope / Planner / Assignment / session / sync regression suite

## Ready-side provider preparation — CLOSED

Ready no longer owns specialist endpoints as unstructured constants inside Rev07.

Added:
- src/integrations/specialist-targets-runtime.js
- tests/specialist-targets.spec.js

Contract:
- global owner: ReadySetSpecialistTargets
- current legacy Hide/Snap URLs are preserved as fallback so existing behavior does not change
- hideSeekV2 and snapPopV2 are NULL unless explicitly configured
- no V2 target is guessed
- trusted postMessage origins derive from the resolved target descriptor
- Rev07 obtains specialist URLs through the descriptor
- current fallback consumer capability is truthfully marked UNVERIFIED_CONSUMER

This implements the provider-target seam required by the Hide external-resource gate without pretending that a hosted V2 target already exists.

## Regression caught during this slice

A concurrent adaptive-profile change introduced:
ReferenceError: clean is not defined

Impact:
- learner adaptive profile test failed
- recurring adaptive memory loop failed
- automatic evidence review interrupted consolidated session finalization before Result

Disposition:
- fixed only the missing evidence-key normalization helper
- no Planner / Assignment / member-scope ownership redesign
- exact-head full Runtime E2E returned to 101/101 GREEN

## Cross-repo evidence

### Hide & Seek current V2 lineage
Inspected working branch:
taky/learning-data-policy-gate-2026-09-23

V2 bridge:
src/v2/ready-bridge.js

Verified:
- session_id / goal_id / task_id / lap_id / return_target preserved
- explicit Ready Planner review_directive supported
- reviewPolicyOwner = READY_LEARNING_ENGINE
- scheduleOwner = READY_SET_PLANNER
- V2 result returns memorySummary and exact task context

OPEN:
- current V2 bridge does not consume READY_LEARNING_CONTEXT_V1 learning_context from Ready
- its local item learningContext belongs to Hide language-model semantics and must not be assumed identical to Ready assignment/analysis/learning-unit identity
- Ready currently sends learning_context but does not send the Hide V2 review_directive contract
- therefore exact assignment/learning-unit -> Hide V2 mission/material binding is NOT CLOSED

Hide external-resource gate also states:
- hosted V2 target must exist before Ready configures hideSeekV2
- production merge was not requested
- exact-source deploy mechanism is blocked because the available siteId-only deploy path cannot bind to a frozen branch/SHA
- do not spend external deploy budget until exact source can be proven

### Snap & Pop current working lineage
Inspected:
taky/learning-data-policy-gate-2026-09-23

Verified in working source:
- snap-bridge.js accepts learning_context
- READY_LEARNING_CONTEXT_V1 is decoded with bounded fields
- session/task/lap/return context is preserved

OPEN:
- hosted runtime validation remains NOT RUN under its external-resource gate
- actual deployed consumer/entrypoint is therefore not claimed verified

## Current truth

BROWSER_CONTRACT_GREEN != LIVE_HOSTED_ROUNDTRIP_VERIFIED

Current status:
- Ready producer contract: GREEN
- Ready target governance: GREEN
- Ready exact-head runtime: GREEN
- Snap working-source consumer: CONTRACT_PRESENT
- Hide V2 exact Ready learning-context/material binding: OPEN
- hosted Hide V2 frozen target: OPEN / external gate blocked
- hosted Snap target validation: OPEN
- live cross-app roundtrip: OPEN
- physical device roundtrip: OPEN

## Progress

Ready pre-deploy functional completion remains approximately 91%.

No percentage increase is claimed merely for adding provider configuration structure.
The remaining delta is evidence-dependent and cross-app/provider/device heavy.

## NEXT OPEN — same provider slice

1. Define the explicit Ready -> Hide V2 task-material binding contract without conflating:
   - Ready assignment_id / analysis_id / learning_unit_id
   - Hide lexical/material identity
   - Planner schedule authority
2. Align Hide V2 consumer to that contract on a non-production integration branch.
3. Prove source-level / browser roundtrip against exact candidate sources.
4. Keep hosted/live validation OPEN until an exact-source external deployment path exists and the deployment gate is explicitly opened.

Do not call Netlify before that gate.

DEPLOYMENT: HOLD
MERGE: HOLD
NETLIFY: DO NOT CALL BEFORE GATE
