# TAKY Routing Pilot — Ready & Set

Status: PILOT / not canonical TAKY master yet
Date: 2026-09-11
Branch: runtime-session-bridge-2026-09-10

## Purpose
Apply the lightweight orchestration direction to a real Ready & Set implementation before promoting it into TAKY MASTER.

## Roles
- TAKY: goal, authority, routing, approval boundaries, cross-validation, final PASS/HOLD decision.
- Chat: product flow, implementation planning, non-conflicting implementation, integration review.
- Codex: isolated root-cause debugging or bounded coding task when assigned.
- Human: approval for paid generation, production/main merge, irreversible or high-impact changes.

## Per-task packet
Every delegated task should contain only what is necessary:
1. Goal / symptom
2. Exact branch + live HEAD
3. Allowed files or subsystem
4. Forbidden changes
5. Relevant evidence only
6. Test budget / verification method
7. Completion condition
8. Required output: root cause, changed files, commit SHA, verification result

Do not send the whole TAKY corpus when a bounded packet is enough.

## Reasoning routing
- LOW: lookup, formatting, deterministic inspection, simple diff.
- MEDIUM: ordinary implementation, contract alignment, bounded debugging.
- HIGH: ambiguous root cause, architecture conflict, security/cost boundary, regression analysis.
Escalate only when evidence requires it. Do not pin an entire project to one reasoning level.

## Ready current split
### Isolated blocker lane — Codex later
Problem: iPhone Deploy Preview reaches PHOTO -> CHARACTER but the consultation Candidate UI does not mount and the Identity placeholder remains.
Completion: CHARACTER entry automatically displays STYLE CONSULTATION 1/3 with three selectable cards, with root cause identified and verified.
Guardrails: work branch only; no main/production; do not hide the symptom with arbitrary timeout/retry; no paid image generation.

### Forward product lane — Chat
Continue the non-conflicting product contract:
CHARACTER_CONFIRMED -> READY_HOME -> TODAY_HOMEWORK -> START -> SESSION/LAP -> TASK_RESULT -> NEXT_TASK_ADJUSTMENT.
Character work stops at confirmed character + Ready entry; then homework MVP is priority.

## Approval gates
Human approval required before:
- paid image generation/provider spend
- merge/release to main or production
- destructive migration or irreversible data change

## Verification rule
CODE_EXISTS != VERIFIED_BEHAVIOR.
PASS requires the stated completion condition to be observed by static/automated/runtime evidence appropriate to the task. User should not be the sole QA where automation/static verification is possible.

## Stop / retry rule
Before testing, define what success means. Repeating the same test without new evidence is not progress. If a bounded test fails repeatedly, stop, identify the earliest failing boundary/file/condition, then change the hypothesis or escalate reasoning.

## Promotion rule
After this pilot, compare cost, context size, regressions, duplicated work, and time-to-PASS. Only proven rules should be proposed for TAKY MASTER; project-specific details remain in Ready/project guidance.
