# READY LEARNING ENGINE ADAPTIVE LOOP + MEMBER SCOPE — CLOSED CURRENT — 2026-09-25

STATE: CLOSED_CURRENT
BRANCH: taky/ready-character-intro-integration-2026-09-24

## Authority
Validated exact functional HEAD:
040a5cb03c1f3acec607de32db9cfd5cd873193a

Exact-head Runtime E2E:
36081580136 = SUCCESS

## Closed regression
member-scope-isolation regression is CLOSED.

Root cause class:
global app state could remain loaded from a previous member scope while the active ReadyMemberScope storage key changed asynchronously. A later save callback could therefore write stale/default app state into the newly active member key.

Fix:
- bind in-memory app state to the storage key from which it was loaded
- block stale cross-member state writes
- reload app state when readyset-family-session changes
- Planner and Assignment isolation logic unchanged

## Adaptive memory loop closure
Adaptive memory loop is CLOSED for the current implemented scope.

Verified flow:
Hide memory evidence
-> Learning Engine reviewLearningEvidence()
-> retrieval checkpoint / recovery intensity / unit-span adjustment
-> Planner future dated TODO regeneration
-> recurring weekday constraint preserved

Learning Engine does not own:
- schedule date
- planner date
- assignment fact
- source range
- deadline

Planner remains schedule/date owner.
Hide remains memory execution + evidence owner.

## Inherited closed flow
Learning Engine decision
-> Planner dated TODO
-> execution_plan / execution_app
-> Rev07
-> Hide
-> MEMORY_RETRIEVAL_EVIDENCE
-> Rev07 wrap-up
-> Planner execution_observation

## Next OPEN
Do not reopen the above without new regression evidence.

Next product work:
1. consolidated end-to-end learning journey audit
2. shared UI/Visual Registry alignment
3. actual cross-app production handoff/provider verification
4. real-device/provider/sync verification
5. deploy gate

DEPLOYMENT: HOLD
MERGE: HOLD
NETLIFY: DO NOT CALL BEFORE GATE
