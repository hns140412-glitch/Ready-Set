# AGENTS.md — Ready & Set local execution guidance

## Role
Codex is the implementation worker for this repository. TAKY/ChatGPT is the orchestrator: it defines outcome, priority, acceptance criteria, and evaluates results. Optimize the user-visible result first; validation is a proportional safety net, not the primary deliverable.

## Branch / source of truth
- Work branch: `runtime-session-bridge-2026-09-10`.
- NEVER trust a stale Handoff SHA over live Git state. Start every work session with `git fetch` and compare local HEAD with `origin/runtime-session-bridge-2026-09-10`.
- Do not write to `main` unless the user explicitly authorizes promotion.
- Preserve existing user data and localStorage/IndexedDB compatibility unless a migration is explicitly part of the task.

## Current product priority
Finish the real first-run product path in this order:
1. Intro / onboarding can complete without requiring paid character generation.
2. Guardian setup becomes actual parent runtime automatically.
3. Parent home exposes timetable and homework intake as first-class actions.
4. Timetable add/edit works and updates schedule authority without inferring free time from missing rows.
5. Homework capture/input works before Planner allocation.
6. AI extraction remains candidate-only until explicit parent confirmation.
7. Confirmed homework FACTs flow into Planner, then Today/Mission/Focus/history.

## Non-negotiable semantics
- `PHOTO != CHARACTER IDENTITY MASTER`.
- If character generation is unavailable, onboarding may defer character completion but must not fabricate a generated `characterVisualId` or claim visual confirmation.
- `AI EXTRACTION != CONFIRMED ASSIGNMENT FACT`.
- `MISSING TIMETABLE ROW != FREE TIME`.
- Parent-entered schedule changes are prospective revisions/overrides; do not rewrite past actual history.
- Answer/reference captures remain parent-only.
- Do not fabricate successful OCR/AI analysis when the analysis endpoint is disabled.

## Local execution expectations
- Prefer using the existing office-PC checkout and existing local preview/server workflow already used for this repo.
- Inspect the repository before choosing commands; do not introduce a new framework/build system unless required.
- Exercise the flow in a real browser at mobile width, and use the iPhone/browser route when available.
- When a bug is found, fix it in code and rerun the smallest relevant checks; do not stop at a diagnosis if the fix is authorized and local.

## Minimum checks after relevant changes
Run the relevant Node contract tests in `tests/`. At minimum for the current track:
- `node tests/ready-parent-capture-contract.mjs`
- `node tests/ready-homework-analysis-contract.mjs`
- `node tests/ready-first-journey-parent-setup-contract.mjs` once present
Also verify the affected first-run path manually in the local browser.

## Result reporting
Report concrete output: changed files, behavior observed locally, test results, unresolved real blockers, and pushed commit SHA. Do not substitute a plan for the requested implementation.