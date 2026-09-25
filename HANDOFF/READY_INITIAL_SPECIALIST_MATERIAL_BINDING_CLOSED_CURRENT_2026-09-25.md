# READY INITIAL SPECIALIST MATERIAL BINDING — CLOSED CURRENT — 2026-09-25

STATE: CLOSED_CURRENT
BRANCH: taky/ready-character-intro-integration-2026-09-24

## TAKY execution
Think Again, Keep Your Key.
Think Again, You’re The Key.
USER != DEBUGGER.

CLOSED slices remain inherited unless new regression evidence appears.
DEPLOYMENT HOLD and MERGE HOLD remain active.
Netlify was not called.

## Exact validation
VALIDATED_FUNCTIONAL_HEAD:
6c13afc39cbcb8ba4007d139671b6d0db7529120

READY_RUNTIME_E2E_RUN:
36117371473

RESULT:
SUCCESS

PLAYWRIGHT:
106 passed

Additional exact-head gates:
- shared runtime contract: GREEN
- release archive boundary: GREEN
- Character Intro -> Planner integration: GREEN
- Ready answer-key verification producer: GREEN
- independent Learning Engine adapter v2: GREEN
- Google Account FamilyMembership contract: GREEN
- Google OAuth browser integration: GREEN
- FamilyMembership onboarding contract: GREEN

## Problem closed
New vocabulary may have no prior Hide lexicalId evidence.
Ready therefore must not fabricate lexicalIds from source labels or source ranges.

The binding problem is now solved as an explicit human-confirmed material relationship.

## Binding contract
READY_SPECIALIST_MATERIAL_BINDING_V1

Identity:
- assignment_id
- analysis_id
- learning_unit_id
- source_range
- workbook_ref_id
- concept_skill_target
- specialist_app
- specialist_material_id
- specialist_material_kind

Authority:
- confirmation_state = HUMAN_CONFIRMED
- confirmed_by = PARENT or CHILD
- confirmation_source is recorded

The binding does NOT grant schedule authority.

## Registry behavior
Assignment domain now retains specialistBindings.

Binding lookup is stable across adaptive analysis revisions by the semantic key:
assignment_id
+ specialist_app
+ workbook_ref_id
+ source_range
+ concept_skill_target

learning_unit_id remains provenance but is not the only reuse key.

This avoids losing the material relationship merely because Learning Engine produces a new analysis/unit revision.

## First-link behavior
No automatic association is created from:
- active Hide mission
- assignment title
- workbook label
- source_range text alone
- learning_unit_id
- task label

The first Hide material association requires an explicit human action.

Hide integration candidate exposes:
"이 단어 묶음을 Ready 과제와 연결하고 돌아가기"

Choosing ordinary return does not create a binding.

## Reuse behavior
After a HUMAN_CONFIRMED binding returns from an authorized specialist route:

1. Ready validates assignment/source/concept/app identity.
2. Ready stores the binding in member-scoped Assignment domain state.
3. Ready applies only binding metadata to matching OPEN Planner TODOs.
4. Dates, states, schedule allocation and time estimates are not changed.
5. Rev07 carries the binding on the task.
6. The next specialist launch includes material_binding.
7. The specialist may select only the exact stored specialist_material_id when the rest of the Ready identity matches.

## Review lexical scope remains separate
Existing adaptive review lexical scope remains:
Hide review_advisories[].lexicalId
-> Learning Engine review policy
-> Planner TODO.review_lexical_ids
-> Hide review_directive

That is a review-item scope.

specialist_material_binding is a source/material identity relationship.

The two are not conflated.

## Routing authority correction
Current Planner execution authority is:
READY_EXECUTION_ROUTING

Rev07 now:
- accepts stored READY_EXECUTION_ROUTING as canonical;
- preserves backward compatibility with legacy READY_LEARNING_ENGINE_ROUTING;
- sends route_authority from the actual stored route plan instead of a stale hardcoded value.

This fixed the consolidated journey regression without weakening the test.

## Ready progress
Pre-deploy functional completion:
approximately 93%.

Closed:
- member-scope async app_state isolation
- adaptive memory loop
- consolidated learning journey
- UI/Visual Ready-side Registry alignment
- provider target governance
- source provenance handoff
- evidence-backed lexical review scope
- initial human-confirmed specialist material binding
- binding reuse across future Ready TODO / launch

Still OPEN:
1. Hide integration branch exact-source CI
2. Snap integration branch exact-source CI
3. live hosted cross-app roundtrip
4. physical device/provider verification
5. deploy gate

## Cross-repo prepared candidates
Hide:
integration/ready-learning-context-binding-2026-09-25

Snap:
integration/ready-learning-context-binding-2026-09-25

These remain NOT MERGED and NOT DEPLOYED.

## NEXT
Run exact-source validation for the Hide and Snap integration candidates without Netlify and without merge.

DEPLOYMENT: HOLD
MERGE: HOLD
NETLIFY: DO NOT CALL BEFORE GATE
