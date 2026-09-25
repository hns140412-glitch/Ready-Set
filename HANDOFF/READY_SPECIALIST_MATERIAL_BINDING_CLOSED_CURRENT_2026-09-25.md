# READY SPECIALIST MATERIAL BINDING — CLOSED CURRENT / EXTERNAL HOLDS — 2026-09-25

STATE: READY_INTERNAL_BINDING_CLOSED / SPECIALIST_INTEGRATION_PREPARED / LIVE_PROVIDER_OPEN
BRANCH: taky/ready-character-intro-integration-2026-09-24

## TAKY execution
Think Again, Keep Your Key.
Think Again, You’re The Key.
USER != DEBUGGER.

CLOSED work is inherited unless new regression evidence appears.
DEPLOYMENT HOLD and MERGE HOLD remain active.
Netlify was not called.

## Exact Ready validation

VALIDATED_FUNCTIONAL_HEAD:
fe59aa022bb7aec5bda8ccd1281e50a9a2d2c29b

READY_RUNTIME_E2E_RUN:
36099642710

RESULT:
SUCCESS

PLAYWRIGHT:
104 passed

## CLOSED in Ready

### 1. Source provenance preservation
Ready now preserves the following across:
Assignment -> Learning Unit -> Planner Proposal/TODO -> Session Task -> Specialist learning_context

- assignment_id
- analysis_id
- learning_unit_id
- source_range
- workbook_ref_id

For vocabulary components, source_range means the learning-unit range itself, e.g. "Unit 3".
It does not incorrectly substitute the broader package range such as "p.10~12".

### 2. Adaptive lexical review scope
Hide MEMORY_RETRIEVAL_EVIDENCE review_advisories no longer collapse to priority-only data.

Ready preserves bounded lexical review scope:
review_advisories[].lexicalId
-> specialist evidence interpretation
-> adaptive_review_policy.target_lexical_ids
-> Learning Unit.review_lexical_ids
-> Planner TODO.review_lexical_ids
-> Rev07 task.review_lexical_ids

### 3. Explicit Hide review directive
When and only when a Hide-routed task has evidence-backed review_lexical_ids,
Ready adds:
review_directive = {
  authority: EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE,
  reviewPolicyOwner: READY_LEARNING_ENGINE,
  scheduleOwner: READY_SET_PLANNER,
  lexicalIds: [...],
  directiveId,
  taskId,
  scheduledDate
}

This directive can scope Hide review items but cannot alter schedule dates.
Planner remains sole dated allocation authority.

### 4. No lexical inference for new material
Ready does NOT manufacture lexicalId values from:
- source_range
- workbook name
- task label
- assignment title
- learning_unit_id

Therefore:
READY_LEARNING_UNIT_ID != HIDE_LEXICAL_ID

This separation is intentional.

## Specialist integration branches prepared

### Hide & Seek
Repo: hns140412-glitch/Hide-Seek
Branch: integration/ready-learning-context-binding-2026-09-25
HEAD: e204539ad9ade165e9af07b9b04c850dc94b6da8

Prepared delta:
- V2 ready bridge accepts learning_context
- READY_LEARNING_CONTEXT_V1 is decoded
- assignment_id / analysis_id / learning_unit_id are required
- source_range / workbook_ref_id are preserved
- authority/family/grade-like keys are rejected
- decoded Ready context is returned as task result provenance
- it is not converted into Hide lexical ids
- regression tests added

Validation truth:
- source delta prepared
- NOT MERGED
- NOT DEPLOYED
- this integration branch has no push-triggered V2 workflow; exact browser CI is therefore NOT CLAIMED

### Snap & Pop
Repo: hns140412-glitch/Snap-Pop
Branch: integration/ready-learning-context-binding-2026-09-25
HEAD: bba86666a2c74dba848141e56342cfaa96890ddd

Prepared delta:
- Snap learning_context decoder preserves source_range/workbook_ref_id
- Ready identity fields are required
- authority/family/grade-like keys are rejected
- existing session/task/lap continuity remains unchanged
- static Ready-Snap bridge validator extended

Validation truth:
- source delta prepared
- NOT MERGED
- NOT DEPLOYED
- exact integration-branch closure workflow not run

## Remaining OPEN

### A. INITIAL NEW-MATERIAL BINDING
For the first encounter with new vocabulary, there may be no prior Hide lexical evidence.
Ready therefore cannot truthfully construct lexicalIds.

A valid future solution must explicitly associate one of:
- Ready source artifact / assignment material
- Hide mission/material capture
- parent/child confirmed material link

without guessing from labels.

This is now the main internal cross-app binding OPEN.

### B. EXACT-SOURCE HOSTED ROUNDTRIP
Hide external-resource gate still blocks hosted V2 proof until the deployment action can bind to the exact frozen source SHA/branch.

Do not use a siteId-only deploy action to claim exact-source validation.

### C. LIVE SNAP/HIDE PROVIDER ROUNDTRIP
Working-source contracts do not equal deployed-runtime proof.

### D. PHYSICAL DEVICE VERIFICATION
Camera/microphone/PWA lifecycle and real-device cross-app return remain open.

## Progress

Ready pre-deploy functional completion:
approximately 92%.

Interpretation:
- core Ready runtime and adaptive loop: materially closed
- member scope: closed
- consolidated journey: closed
- Ready-side specialist target/source/review binding: closed
- cross-repo source integration: prepared
- initial new-material association + hosted/provider/device evidence: still open

No percentage is granted for unrun external/provider/device evidence.

## NEXT

Proceed with INITIAL NEW-MATERIAL BINDING contract.

Goal:
connect a confirmed Ready assignment/source artifact to a Hide mission/material identity without lexical guessing and without moving Planner authority.

DEPLOYMENT: HOLD
MERGE: HOLD
NETLIFY: DO NOT CALL BEFORE GATE
