# READY-VS-001 — Usable Home → Focus → Result vertical slice

Status: ASSIGNED_TO_CLAUDE_CODE
Date: 2026-10-06
Orchestrator: TAKY / ChatGPT
Implementation actor: Claude Code
Verification actor: TAKY/local first; Codex only if materially necessary after concrete diff
Repository worktree: D:\Git PWA\READY-WEBAPP-20261006
Base repository HEAD: 16026f41149dae5faed1c4ca2d1f2933a40ced7a
Work branch: taky/ready-webapp-vertical-slice-20261006
Deploy / Push / Merge / Netlify Publish: FORBIDDEN

## Objective

Create the first tangible, locally usable Ready & Set child execution vertical slice from the existing codebase.

A real user must be able to:
1. reach a Ready child/home surface that reads as BASE CAMP, not a generic dashboard;
2. see today's task facts from the existing Planner/homework state;
3. start a task without being forced to choose a timer;
4. enter a Focus surface that visibly shows the active task and timestamp-derived session/lap state;
5. finish the active task/lap with one explicit factual result:
   COMPLETED / PARTIAL / DEFERRED / BLOCKED / WAITING_FOR_PARENT;
6. return to Ready Home with the result/state reflected without creating a duplicate session.

This is a local usable vertical slice, not a production release.

## Required authority read

Read first, in this order:
1. D:\Git PWA\TAKY_ALPHA_20261003\ALPHA_INPUT\FROZEN_BETA\TAKY_BETA_FROZEN_20261003.lock.json
2. D:\Git PWA\TAKY_ALPHA_20261003\ALPHA\TAKY_ALPHA_CURRENT_V1.json
3. Task-relevant Alpha Ready section in:
   D:\Git PWA\TAKY_ALPHA_20261003\ALPHA\TAKY_ALPHA_MASTER_V1_INTEGRATED_DRAFT.md
4. AGENTS.md in this worktree, but USER-latest actor routing overrides the old Codex-as-implementer wording:
   Claude Code = implementation; Codex = optional independent verification.
5. Ready_Set_Ui_Master_Logic_REV_07.md
6. READY_HOMEWORK_MVP_CONTRACT.md
7. Existing current modified/untracked files in this worktree; preserve their learning-evidence work and do not discard it.

Do NOT re-audit Beta/Alpha from zero.

## Product semantics

- Ready = BASE CAMP / execution + session orchestrator.
- Planner remains dated allocation authority.
- Ready owns session/lap execution projection.
- APP_SWITCH != PAUSE.
- APP_SWITCH != LAP_END.
- SESSION_END != TASK_COMPLETE.
- One session / one active task / one active lap.
- Timer/target is optional; starting homework cannot require timer setup.
- Unknown task facts remain unknown; never invent volume/deadline/difficulty.
- USER != DEBUGGER.

## UI direction

The child-facing result must feel like Ready's exploration/base-camp world.
Do not replace it with a generic SaaS dashboard.

Prefer:
- one clear base-camp hero;
- today's mission/task as the primary object;
- one dominant "숙제 시작" / resume action;
- child-friendly high-legibility mobile layout;
- Focus screen with task + time state as the hero;
- result choices only when finishing/wrapping the task.

Reuse existing approved/local assets and existing styling language.
Do not generate new character art.
Do not depend on paid image generation.
Do not redesign the entire application.

## Scope

Allowed:
- index.html
- styles.css / ready-base-home-v1.css
- app.js
- ready-home-homework-mvp-v1.js
- ready-home-homework-ui-v1.js
- ready-runtime-v07.js
- ready-focus-tools-v1.js
- closely related existing local modules
- targeted tests
- one task-specific evidence artifact

Preserve the dirty overlay already copied from the user's primary checkout:
- app.js
- index.html
- ready-runtime-v07.js
- sw.js
- taky-learning-evidence-client-v1.js

Do not remove or overwrite that work.

## Do not

- no framework rewrite;
- no unrelated refactor;
- no Netlify deploy/publish;
- no push/merge;
- no paid API;
- no fake OCR/AI success;
- no fake character generation;
- no developer/debug panels exposed as the user-facing result;
- no document-only completion;
- no broad Master/Beta/Alpha rewrite.

## Acceptance evidence

Required:
A. Static/syntax checks for changed JS.
B. Relevant existing contract tests, at minimum those that actually exist for Ready session/homework/home.
C. Add a focused automated contract test for this vertical slice if current tests do not cover it.
D. Exercise the path locally in a browser at mobile width if technically available on the machine.
E. Produce screenshot(s) into:
   artifacts/ready-vs-001/
   for Home and Focus/Result if browser capture is available.
F. Report browser verification separately from automated tests; do not fabricate visual PASS.
G. git diff --check.

## Completion boundary

CODE/CLAUDE DONE is not USER CONFIRMED and not deployment.

Desired report:
SCREEN -> INTERACTION -> DATA/STATE -> END-TO-END RESULT -> EVIDENCE

At end print:
- STARTING STATE
- IMPLEMENTED USER FLOW
- CHANGED FILES
- TEST RESULTS
- BROWSER/MOBILE EVIDENCE
- OPEN RISKS
- RESULTING GIT STATUS

Do not commit.