# READY-VS-003 — Real first-run → no-cost character defer → Parent Home

Status: ASSIGNED_TO_CLAUDE_CODE
Date: 2026-10-06
Repository: D:\Git PWA\READY-WEBAPP-20261006
Branch: taky/ready-webapp-vertical-slice-20261006
Starting HEAD: eaa2149167bde434c0300f4850bb79b53cdb7d6f
Deploy / Push / Merge / Netlify Publish: FORBIDDEN

## Why this is next

READY-VS-001 proved a real child Home → Focus → Result path after identity exists.
READY-VS-002 proved a real parent setup Home → Schedule / Homework input path after identity exists.

The remaining usability blocker is first-run boot: a fresh user must reach those real screens without hand-seeding identity and without paid character generation.

Do NOT reopen MASTER/Beta/Alpha. Use the already-closed MASTER and inherited Ready semantics.

## Required source read — SAVEY order

Read only:
1. D:\Git PWA\TAKY_ALPHA_20261003\ALPHA_INPUT\FROZEN_BETA\TAKY_BETA_FROZEN_20261003.lock.json
2. D:\Git PWA\TAKY_ALPHA_20261003\ALPHA\TAKY_ALPHA_CURRENT_V1.json
3. Ready section of D:\Git PWA\TAKY_ALPHA_20261003\ALPHA\TAKY_ALPHA_MASTER_V1_INTEGRATED_DRAFT.md
4. AGENTS.md
5. Ready_Set_Ui_Master_Logic_REV_07.md
6. READY_HOMEWORK_MVP_CONTRACT.md
7. ready-stage-c.js
8. ready-onboarding-identity-v2.js and byte-compatible v1
9. ready-onboarding-flow-completion-v1.js
10. ready-role-context-v1.js
11. tests/ready-first-run-parent-activation-contract.mjs
12. tests/ready-foundation-contract.mjs

No broad reread.

## Concrete root cause already evidenced

Current Stage-C:
- has no canonical IDENTITY owner constant for identity v2;
- has a single CORE_CHAIN;
- unconditionally releaseHeldLayers() removes #readyFirstRun before/while first-run should own the screen;
- does not load ready-onboarding-flow-completion-v1.js;
- baseline tests expect canonical identity-v2 boot + AFTER_IDENTITY separation and currently fail.

Fix this real boot ownership conflict, not just the test strings.

## Objective

From blank first-run state, Ready must preserve the identity/onboarding owner until completion, then activate the correct runtime role.

Guardian path:
INTRO
→ guardian mode
→ child profile
→ photo
→ character consultation
→ explicit "캐릭터는 나중에 완성하고 계속" no-cost defer
→ explorer selection
→ theme
→ READY
→ persisted parent runtime
→ READY-VS-002 Parent Home.

No paid generation call is required.

## Hard semantics

- PHOTO != CHARACTER IDENTITY MASTER.
- DEFER must set characterSetupState=DEFERRED_NO_COST and must NOT fabricate characterVisualId.
- Parent = capture/input/confirm/support; child = execute.
- Stage-C must not remove first-run DOM while identity is incomplete.
- Once identity is READY, Stage-C may release first-run layers and render core.
- role activation must derive GUARDIAN_FOR_CHILD → parent.
- paid generation remains locked / no API call.
- USER != DEBUGGER.

## Expected implementation shape

Prefer minimal changes:
- ready-stage-c.js
- only if actually required: ready-onboarding-flow-completion-v1.js / role context
- one focused READY-VS-003 contract test
- browser/CDP first-run evidence harness under artifacts/ready-vs-003/

Do not rewrite onboarding UI.

Stage-C should have explicit boot phases rather than one chain:
- canonical identity owner reference
- load/ensure identity + onboarding completion
- if identity not READY: preserve first-run owner and do not release it
- when identity becomes READY: load/render remaining core and release held layers
- recovery/pageshow/focus must respect the same ownership condition
- idempotent, no duplicate script/observer storm.

Existing index legacy identity URL may remain while it is byte-identical to v2; do not create a second competing owner.

## Acceptance tests

Must PASS:
- tests/ready-first-run-parent-activation-contract.mjs
- tests/ready-foundation-contract.mjs
- tests/ready-vs-002-parent-setup-home-contract.mjs
- tests/ready-vs-001-home-focus-result-contract.mjs
- add tests/ready-vs-003-first-run-runtime-contract.mjs if needed for dynamic boot ownership.

Run ready-first-journey-semantics.mjs if possible. If it fails solely because its VM omits queueMicrotask, report that as a harness defect; do not weaken production code to satisfy the harness.

Full suite:
- compare against the existing baseline 7 failure families.
- READY-VS-003 must introduce no new failure family.

## Browser evidence

Use installed Chrome/CDP at 390x844, local only.

Required screenshots/state:
1. fresh first-run intro visible
2. guardian mode/profile visible
3. character step with explicit no-cost defer visible
4. explorer step
5. theme step
6. after completion, parent Home from VS-002 visible
7. reload still parent Home
8. identity record: status READY, setupMode GUARDIAN_FOR_CHILD, characterSetupState DEFERRED_NO_COST, characterVisualId null
9. browser errors []

You may use a synthetic local photo fixture for the browser test. Do not claim it is real user camera evidence.

## Do not

- no deploy/publish/push/merge
- no paid API
- no framework rewrite
- no fake visual ID
- no broad cleanup
- no fixing unrelated specialist fixture / Playwright dependency failures
- no document-only completion

## Result

SCREEN → INTERACTION → STATE → PARENT HOME → RELOAD → EVIDENCE

At end:
STARTING STATE
ROOT CAUSE
IMPLEMENTED FLOW
CHANGED FILES
TEST RESULTS
BROWSER EVIDENCE
PRE-EXISTING FAILURES
OPEN RISKS

Do not commit.