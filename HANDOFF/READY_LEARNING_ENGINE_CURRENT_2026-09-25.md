# READY LEARNING ENGINE CURRENT — 2026-09-25 (SUPERSEDED AS ENGINE AUTHORITY)

STATE: SUPERSEDED_AS_ENGINE_AUTHORITY
SCOPE: Ready & Set Learning Engine vertical contract
CORRECTION: Ready & Set is not the Learning Engine. This file is retained as implementation lineage only. Current Ready boundary authority is HANDOFF/READY_LEARNING_ENGINE_ADAPTER_CURRENT_2026-09-25.md; Core authority is TAKY OS/LEARNING_ENGINE_CORE.md.
AUTHORITY: latest validated implementation on branch `taky/ready-character-intro-integration-2026-09-24`
PRINCIPLE: DEEP MEMORY — LIGHT EXECUTION
USER != DEBUGGER

## 1. SINGLE VERTICAL FLOW

ASSIGNMENT FACT
→ LEARNER CONTEXT
→ LEARNING MASTER INTERPRETATION
→ LEARNING UNIT
→ PLANNER ALLOCATION
→ REV_07 EXECUTION
→ SPECIALIST EVIDENCE
→ PLANNER EXECUTION OBSERVATION
→ LEARNER ADAPTIVE PROFILE
→ ADAPTIVE REVIEW POLICY
→ LEARNING MASTER RE-INTERPRETATION
→ PLANNER RE-ALLOCATION

There is one Learning Engine. Learner Context and Learner Adaptive Profile are submodels, not separate engines.

## 2. OWNER BOUNDARIES

### Assignment Domain
Owns:
- confirmed assignment facts
- fact revision
- interpretation lifecycle metadata
- learning evidence review receipt

Must not own:
- dated schedule decisions
- specialist execution policy

Primary code:
- `ready-assignment-domain-v2.js`

### Learner Context
Owns:
- birthdate-only developmental context
- age-band advisory

Must not infer:
- grade
- curriculum
- education policy
- schedule date

Primary code:
- `src/learning/learner-context-runtime.js`

### Learning Master
Owns:
- concept / skill interpretation
- learning unit boundaries
- activity sequence
- difficulty / cognitive load
- recovery intensity
- checkpoint / retrieval checkpoint decisions
- adaptive review policy

Must not own:
- schedule date
- planner date
- deadline mutation
- assignment fact mutation

Primary code:
- `ready-learning-master-v01.js`

### Ready Integration
Owns:
- orchestration between Fact → Learning Master → Planner
- specialist evidence interpretation
- learner adaptive profile derivation
- evidence-triggered review
- adaptive review idempotency key

Must not become:
- another Learning Master
- another Planner
- another evidence store

Primary code:
- `ready-integration-v1.js`

### Planner
Owns:
- dated TODO materialization
- family schedule constraints
- execution observations
- carry-over
- allocation / re-allocation
- planner estimate proposals

Must not own:
- learning interpretation
- review date policy from Hide
- curriculum meaning

Primary code:
- `ready-planner-v01.js`

### REV_07 Session Runtime
Owns:
- in-session task state
- specialist handoff runtime
- terminal result collection
- one terminal Planner result at finalization
- automatic adaptive review trigger after evidence return

Must not own:
- long-term learning policy
- dated schedule
- persistent learner model

Primary code:
- `ready-runtime-v07.js`

### Specialist Apps
Hide & Seek:
- executes language-memory activity
- emits MEMORY_RETRIEVAL_EVIDENCE

Snap & Pop:
- executes production / expedition activity
- emits specialist evidence according to contract

Specialists must not schedule next review dates.

## 3. LEARNER ADAPTIVE PROFILE

Current adaptive profile derives from recent execution observations.

Scope:
- member
- subject

Evidence controls:
- deduplicate repeated evidence
- recent evidence window: 90 days
- minimum 3 memory samples for trend classification
- personal baseline vs latest performance
- trend: IMPROVING / STABLE / DECLINING / INSUFFICIENT_EVIDENCE

Can influence:
- RECOVERY_INTENSITY
- CHECKPOINT_SELECTION
- UNIT_SPAN
- ACTIVITY_SEQUENCE

Cannot influence:
- SCHEDULE_DATE
- PLANNER_DATE
- ASSIGNMENT_FACT
- SOURCE_RANGE
- DEADLINE
- FACT_CONFIRMATION

## 4. ADAPTIVE REVIEW

Inputs may include:
- weak memory strength
- high review priority
- personal decline from baseline
- repeated PARTIAL / DEFERRED / BLOCKED / WAITING_FOR_PARENT
- carry-over depth

Outputs may include:
- smaller learning units
- retrieval checkpoint
- short checkpoint
- higher recovery need
- parent-help escalation when appropriate

Recurring weekday constraints remain Planner authority.

## 5. IDEMPOTENCY CONTRACT

Planner terminal observations:
- keyed by session + task + todo
- duplicate terminal recording does not create a second observation

Learning evidence review:
- review key is derived from assignment + fact revision + member + subject + unique evidence keys
- successful review writes a receipt to the Assignment Fact
- the same evidence review key must return `LEARNING_EVIDENCE_ALREADY_REVIEWED`
- new evidence changes the key and permits a new review

Implementation commits:
- `65260ee1541966d304af84d6cc431355011ad206` review receipt
- `c27736d375282caa39ea91ffc3ea1e75d1889ba0` review idempotency
- `883ed955aab5a0e23adab85f9c0c62ca0afa8f38` isolated regression fixture

Verification status:
- member/subject isolation: GREEN
- personal baseline policy: GREEN
- consolidated learning journey: GREEN
- terminal + evidence-review idempotency exact-head: GREEN
- validated functional HEAD: `695ac2140f38d14902c6e06278aeda6fd1902aa8`
- Runtime E2E: `36090675519`
- Runtime flow / package / artifact steps: SUCCESS

## 6. CLOSED / DO NOT REOPEN WITHOUT REGRESSION

- Learning Engine owns interpretation, not dates.
- Planner owns dates.
- Hide returns memory evidence, not schedule authority.
- REV_07 holds session-internal state and emits terminal result at finalization.
- recurring weekday authority is preserved through adaptive re-planning.
- member-scoped persistence regression previously fixed and closed.
- learner adaptive baseline is part of the Learning Engine, not a parallel engine.

## 7. REMAINING OPEN

1. deployment / merge remain HOLD until deployment gate
2. future Learning Engine changes must preserve this CURRENT contract
3. production-device / live specialist-provider verification remains a release concern, not a Learning Engine logic OPEN

## 8. ANTI-FRAGMENTATION RULE

Any new learning behavior must enter through one of the owners above.
Do not create a second learner model, second review engine, second scheduler, or specialist-owned review calendar.
If a new behavior cannot be assigned to an existing owner, update this CURRENT contract first before implementation.
