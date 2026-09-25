# READY ADAPTIVE LOOP + MEMBER SCOPE — NEW CHAT START — 2026-09-25

STATE: RESUME_READY
BRANCH: taky/ready-character-intro-integration-2026-09-24

## 0. TAKY EXECUTION
Think Again, Keep Your Key.
한 번 더 생각하고, 핵심은 놓치지 마.
답을 풀 열쇠는 이미 가지고 있다.

Think Again, You’re The Key.
방법을 찾고 해결하라.
결국 답을 만들어내는 핵심 주체는 인간이다.

Execution:
HUMAN INTENT / DESIRED OUTCOME
-> THINK AGAIN
-> KEEP YOUR KEY
-> FIND A WAY / SOLVE
-> YOU'RE THE KEY
-> VERIFY / CORRECT / CONTINUE

USER != DEBUGGER.
Do not reopen CLOSED work without regression evidence.
Do not deploy or merge without explicit authorization.

## 1. RESUME ORDER
INHERIT APPROVED STATE
-> CURRENT POINTER
-> EXACT HEAD
-> CLOSED inheritance
-> OPEN/NEXT only

LOCAL_RUNTIME_PROJECTION != NEW_CANONICAL.

## 2. CLOSED_CURRENT TO INHERIT
- Family Planner scope:
  HANDOFF/READY_FAMILY_PLANNER_SCOPE_CURRENT_2026-09-24.md
- Planner family visual projection:
  HANDOFF/READY_PLANNER_FAMILY_VISUAL_PROJECTION_CURRENT_2026-09-24.md
- Planner world composition:
  HANDOFF/READY_PLANNER_WORLD_COMPOSITION_CURRENT_2026-09-24.md
- Primary journey / Base Camp composition:
  HANDOFF/READY_PRIMARY_JOURNEY_COMPOSITION_CURRENT_2026-09-24.md
- Recurring homework + event task ownership/routing:
  HANDOFF/READY_RECURRING_HOMEWORK_EVENT_TASK_ROUTING_CURRENT_2026-09-25.md
- Hide handoff + evidence return:
  HANDOFF/READY_HIDE_HANDOFF_EVIDENCE_RETURN_CURRENT_2026-09-25.md

## 3. LOCKED OWNERSHIP
- EVENT TASK:
  child direct input -> immediate Timer execution.
- NEW HOMEWORK FACT:
  child/parent input -> parent confirmation -> Learning Engine interpretation -> Planner allocation.
- RECURRING HOMEWORK:
  recurring weekday rule stored once -> Learning Engine interprets content -> Planner materializes dated TODO.
- Learning Engine:
  learning-unit interpretation, review need, intensity, activity sequence, specialist-routing intent.
- Planner:
  date/time/schedule ownership and dated TODO materialization.
- Hide & Seek:
  language-memory execution + evidence generation only.
  Hide MUST NOT decide schedule date / next review date.
- Rev07:
  in-session execution state only.
  Planner receives terminal result once at session finalization.

## 4. VERIFIED CLOSED FLOW
Learning Engine decision
-> Planner dated TODO
-> stored execution_plan / execution_app
-> Rev07 handoff
-> Hide execution
-> MEMORY_RETRIEVAL_EVIDENCE
-> Rev07 wrap-up
-> Planner execution_observation persistence

Validated functional HEAD:
39cbd984aa4c813287381a8264216ad2e5f721a0
Runtime E2E:
36078694692 = SUCCESS

Closure receipt commit:
3337e66d4535363d50e39b85f32dbb88d662ad4e

## 5. ADAPTIVE MEMORY LOOP — IMPLEMENTED, NOT YET CLOSED
Current intended flow:
weak Hide memory evidence
-> Learning Engine evidence review
-> adjust retrieval checkpoint / recovery intensity / unit span
-> Planner regenerates future dated TODOs
-> recurring weekday constraint remains authoritative

Implemented:
- Learning Master accepts LEARNING_EVIDENCE_ADVISORY_ONLY.
- reviewLearningEvidence() added to ReadyIntegrationV1.
- strong memory concern threshold:
  max review priority >= 70 OR min memory strength < 60.
- evidence review cannot influence:
  SCHEDULE_DATE / PLANNER_DATE / ASSIGNMENT_FACT / SOURCE_RANGE / DEADLINE.
- recurring_days retained as scheduling constraint.
- automatic session-finalization hook requests evidence review.
- test:
  tests/recurring-adaptive-memory-loop.spec.js
  passes in the latest full suite.

Adaptive implementation commits include:
43dbd762c0b60a95198da9216b06d75a2368df04
bc556a20fbe2ac3034103f7a67583356eeb885f5
0e196220261f7a3b13c31d171d548437eebfffc2
19fd25a5fc5fd561f3399a44b37fb07741dedb0a

## 6. MEMBER-SCOPE REGRESSION — CURRENT OPEN
Current branch HEAD:
d584f119b8b3ec61f72c7f495e345cd3d55d797a

Latest full Runtime E2E:
36080522071 = FAILURE
98-test suite, only:
tests/member-scope-isolation.spec.js
fails.

Failure:
expected CHILD_A scoped app profile.name = "A"
received ""

Checkpoint evidence:
- immediately after persistence.save(A): A exists.
- after awaiting ReadySetLocalFirst.capture('planner', ...): A has been overwritten to blank.
- Planner scoped data remains isolated correctly.
- Assignment scoped data remains isolated correctly.
- app_state is the affected scope.

Important:
the idle session-recovery bug was fixed:
src/session/session-recovery-controller-runtime.js
commit:
e234978600823a2078a93d83f3af1cc0a5bdb936

That product-fix HEAD had a full Runtime E2E SUCCESS:
36080088421 = SUCCESS.

A new regression test:
"idle recovery does not overwrite scoped app state while switching member context"
passes.

Therefore DO NOT reopen Planner/Assignment isolation or adaptive loop.
The remaining OPEN is specifically:
identify the asynchronous app_state write occurring during the await window around
ReadySetLocalFirst.capture('planner', ...).

Likely investigation surfaces:
- global app.js state/save() callbacks still holding prior/default state
- load/renderSettings async callbacks
- safe-point / state-saved event listeners
- PWA update evaluation
- any delayed render/bootstrap callback that calls save()
Do not assume; instrument exact write origin if needed.

## 7. EXACT NEXT ACTION
1. Read this handoff.
2. Refresh current branch HEAD and latest CI.
3. Reproduce only member-scope-isolation failure.
4. Instrument scoped app-state writes:
   - key
   - profile.name
   - caller/reason
   - before/after capture('planner')
5. Fix only the actual writer.
6. Remove temporary checkpoint-only assertions/instrumentation once root cause is proven.
7. Run exact-head full Runtime E2E.
8. Require all tests GREEN.
9. If GREEN:
   - write CLOSED_CURRENT receipt for member-scope regression
   - write CLOSED_CURRENT receipt for adaptive memory loop
   - update overall Ready progress
10. Continue next OPEN only.

## 8. DO NOT REOPEN
- Character Formation closed state
- Planner family semantics
- Planner world composition
- Primary Base Camp journey
- Timer visual
- recurring homework ownership
- direct child event task
- Hide handoff contract
- evidence ontology
unless new regression evidence proves a fault.

## 9. DEPLOYMENT
DEPLOYMENT: HOLD
MERGE: HOLD
Netlify: DO NOT CALL before gate.

## 10. PROGRESS SNAPSHOT
Ready & Set pre-deploy functional completion:
approximately 89-90%.
Adaptive memory loop:
implemented + dedicated test passing, closure blocked only by full-suite member-scope regression.
Main remaining product phases after GREEN:
- consolidated end-to-end journey audit
- final shared UI/Visual Registry alignment
- actual cross-app production handoff/provider verification
- real-device/provider/sync verification
- deploy gate
