# AGENTS.md — Ready & Set local execution guidance

## Authority / role lock
TAKY/ChatGPT is the ORCHESTRATOR + REVIEWER for this repository. Codex is the IMPLEMENTATION EXECUTOR.

Codex MUST NOT redefine product requirements, architecture direction, acceptance criteria, merge policy, or production-deployment policy unless TAKY explicitly delegates that decision for the current task.

`CODEX_DONE != TAKY_PASS`.
A Codex completion report is implementation evidence only. Completion is granted only after the applicable TAKY review gates pass.

## Required task contract
Every material implementation task MUST have an execution contract containing, at minimum:
- task id;
- objective/outcome;
- source-of-truth references;
- repository + base/work branch;
- live remote HEAD evidence at start;
- change scope;
- explicit do-not list;
- acceptance tests;
- validation plan;
- delivery/report requirements;
- whether human approval is required for merge/deploy.

If the contract is materially incomplete, stop before implementation and return the missing contract fields to TAKY. Do not silently invent product decisions.

## Branch / source of truth
- Work branch: `runtime-session-bridge-2026-09-10`.
- NEVER trust a stale Handoff SHA over live Git state. Start every work session with `git fetch` and compare local HEAD with `origin/runtime-session-bridge-2026-09-10`.
- Record the remote HEAD used to start the task.
- Do not write to `main` unless the user explicitly authorizes promotion.
- Preserve existing user data and localStorage/IndexedDB compatibility unless a migration is explicitly part of the task.

## Execution lifecycle — HARD LOCK
Use this state flow for material coding tasks:

`READY -> ASSIGNED_TO_CODEX -> IN_PROGRESS -> CODEX_DONE -> TAKY_REVIEW -> (REWORK | HUMAN_APPROVAL) -> MERGED -> DEPLOYED`

Rules:
- `CODEX_DONE -> MERGED` is forbidden.
- `CODEX_DONE -> DEPLOYED` is forbidden.
- Any failed TAKY gate sends the task to `REWORK`, then back to Codex with a bounded correction request.
- Do not offload reproducible debugging to the user when the repository/runtime evidence can be inspected directly.
- Merge to protected/mainline branches and production deployment require explicit human approval when the task contract marks them approval-gated.

## Change discipline
- Prefer the smallest diff that satisfies the accepted outcome.
- No unrelated refactor.
- No framework/build-system replacement unless explicitly required.
- Do not broaden scope merely because adjacent cleanup is convenient.
- Preserve current external behavior unless the task explicitly changes it.
- If a new finding requires a product/architecture decision outside the contract, return it to TAKY as a bounded decision point rather than deciding unilaterally.

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

## TAKY review gates
For each material implementation, provide evidence for the applicable gates before requesting PASS:
1. **Requirement gate** — acceptance criteria satisfied.
2. **Diff-scope gate** — no unrelated changes; minimal justified diff.
3. **Static/build gate** — relevant lint/build/syntax checks pass where available.
4. **Contract/test gate** — relevant automated tests pass.
5. **Regression gate** — adjacent existing behavior remains intact.
6. **Runtime/mobile gate** — affected user path is exercised in a real browser/mobile-width path; iPhone route when available and relevant.
7. **Truthfulness gate** — no simulated/fabricated success is reported as live behavior.
8. **Approval gate** — required human approval is present before merge/production deployment.

If a gate cannot be run, report `UNVERIFIED` with the reason. Do not convert missing evidence into PASS.

## Minimum checks after relevant changes
Run the relevant Node contract tests in `tests/`. At minimum for the current track:
- `node tests/ready-parent-capture-contract.mjs`
- `node tests/ready-homework-analysis-contract.mjs`
- `node tests/ready-first-journey-parent-setup-contract.mjs` once present
Also verify the affected first-run path manually in the local browser.

## Result reporting
Always report concrete execution evidence:
- task id + starting remote HEAD;
- root cause / implementation summary;
- changed files;
- tests/checks run and exact results;
- runtime/mobile behavior observed when applicable;
- unresolved real blockers/risks;
- resulting commit SHA;
- lifecycle state requested next (`TAKY_REVIEW`, never self-declared `TAKY_PASS`).

Do not substitute a plan or narrative for the requested implementation result.