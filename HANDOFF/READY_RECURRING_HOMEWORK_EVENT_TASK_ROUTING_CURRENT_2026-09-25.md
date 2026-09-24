# READY RECURRING HOMEWORK + EVENT TASK ROUTING CURRENT — 2026-09-25

STATE: CLOSED_CURRENT
BRANCH: taky/ready-character-intro-integration-2026-09-24
EXACT_HEAD: 1eea39f54c1326f7fa05107ebade7cbbda3d6b01
RUNTIME_E2E_RUN: 36070607378
RUNTIME_E2E: SUCCESS

## CLOSED OWNERSHIP
- EVENT TASK: child may enter an ad-hoc event task and start Timer immediately without a Planner TODO.
- NEW HOMEWORK FACT: child/parent input is captured as Assignment Fact; parent confirmation remains required before Learning Engine interpretation and Planner allocation.
- RECURRING HOMEWORK: recurring weekdays are stored once, interpreted by Learning Engine, and materialized by Planner into dated TODOs.

## OWNER BOUNDARIES
- Learning Engine owns learning-unit interpretation, review need, activity type/sequence, and specialist routing intent.
- Planner owns dated TODO materialization and schedule/date allocation.
- Hide & Seek does NOT decide when review occurs; it executes language-memory work and returns evidence.
- Ready executes Ready-owned tasks and Timer.
- Specialist execution is derived from Learning Engine routing metadata; current vocabulary MEMORY/RECALL work routes to hide-seek, print work remains ready-set.

## VERIFIED
- MON/WED/FRI vocabulary -> dated TODOs on the matching weekdays.
- vocabulary TODO execution_app = hide-seek.
- MON/WED/FRI print tasks -> dated TODOs on matching weekdays.
- print TODO execution_app = ready-set.
- direct child event task -> immediate Timer path.
- collapsed NEW FACT intake remains parent-review flow.
- full Ready Runtime E2E SUCCESS at exact head.

## NEXT OPEN
Wire the actual runtime handoff from a dated TODO with execution_app=hide-seek into the family app handoff contract, while preserving:
Learning Engine decision -> Planner date -> specialist execution -> evidence return.
Do not move review/date authority into Hide & Seek.

DEPLOYMENT: HOLD
MERGE: HOLD
