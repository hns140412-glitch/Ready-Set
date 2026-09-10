# TAKY Execution Harness Pilot — Ready & Set

Status: PILOT / NON-CANONICAL
Date: 2026-09-11
Branch: `runtime-session-bridge-2026-09-10`
Baseline HEAD when drafted: `1aae89df4b61cc619dd393c444be22404ae16338`
Authority: TAKY / Family Learning OS / Ready & Set project rules

## Purpose

Test an execution-harness layer below TAKY without changing TAKY canonical governance or main/production.

External systems such as OpenClaw and Prime Agent are references, not authorities. Their useful patterns are adopted only after evidence, verification, rollback safety, and the existing TAKY approval gates.

## Layering

1. TAKY Constitution / Governance — fixed authority and approval rules.
2. TAKY Orchestrator — chooses goal, route, scope, evidence requirements, and stop conditions.
3. Model Routing — ChatGPT, Codex, Gemini, or another bounded worker chosen per task.
4. Execution Harness — browser, shell, files, local services, app actions, scheduled checks, and other permitted execution.
5. Evidence Layer — records what was attempted, what actually happened, and the earliest failing boundary.
6. Continual Harness — turns verified evidence into reusable lessons and skills.
7. Cross-validation / Regression — verifies that a local success does not break adjacent flows.
8. Human Approval — required before canonical governance promotion, paid generation, main/production merge or release, destructive migration, or other irreversible action.

## Execution packet

Every bounded execution should receive only the context needed for that task:

- goal and user-visible symptom
- repository / branch / live HEAD
- allowed files or subsystem
- forbidden changes
- current evidence
- reasoning level: LOW / MEDIUM / HIGH
- test budget
- completion condition
- rollback point
- required output: root cause, changed files, commit SHA, verification evidence

Do not send the whole TAKY corpus when a bounded packet is sufficient.

## Evidence record

For each meaningful success or failure, preserve:

- `symptom`
- `earliest_failing_boundary`
- `cause`
- `change`
- `verification`
- `scope`
- `rollback`
- `supersedes` when applicable

`CODE EXISTS != ACTUAL BEHAVIOR VERIFIED` remains mandatory.

## Continual improvement ladder

`CANDIDATE_LESSON -> VERIFIED_LESSON -> SKILL_CANDIDATE -> SKILL -> CANONICAL_RULE_CANDIDATE`

Promotion rules:

- One observation never auto-promotes a rule.
- A lesson becomes verified only with reproducible or independently corroborated evidence.
- A skill candidate must succeed repeatedly within its declared scope.
- Skill promotion requires regression verification and a rollback path.
- Cross-project stability is required before proposing a TAKY canonical rule.
- Canonical promotion always requires Human Approval.
- Failed or superseded evidence is retained; it is not silently deleted.

## Security and cost gates

- Least privilege by default.
- Local-only binding is preferred for local execution services unless remote exposure is explicitly required and secured.
- Never store API keys, secrets, access tokens, or source photos in lesson/skill memory.
- Paid image generation remains locked until explicit user approval.
- Main/production merge or release remains locked until explicit user approval and verification.
- Destructive or irreversible actions require explicit approval.
- Repeating automation must have a stop condition, bounded cadence, and cost/resource guard where applicable.

## Ready & Set pilot lanes

### Lane A — isolated character blocker

Symptom: iPhone PHOTO -> CHARACTER succeeds, but the Candidate consultation UI does not mount and the page remains at `스타일 상담을 준비하고 있어요.`

Worker candidate: Codex on the office PC.

Allowed goal: identify and fix the earliest real failing boundary in `index -> Candidate -> Identity -> Stage-C` without hiding the problem behind arbitrary timeout/retry behavior.

Completion evidence: `STYLE CONSULTATION 1/3` appears automatically with three selectable cards on the mobile Deploy Preview.

Restrictions: branch only; no main/production; no paid generation.

Current classification: `CANDIDATE_LESSON` until root cause and runtime verification are captured.

### Lane B — Ready Home / homework

Continue non-conflicting implementation after the character gate, using the existing Ready session/task/lap owner as canonical runtime state.

Important correction gate: the homework adapter must not become a second independent session owner. Any temporary duplicate homework session store is ADJUST/HOLD until it delegates to the canonical Ready runtime.

Target flow:

`CHARACTER_CONFIRMED -> READY_HOME -> TODAY_HOMEWORK -> START -> SESSION/LAP -> TASK_RESULT -> NEXT_TASK_ADJUSTMENT`

Completion evidence must include session continuity across task switch and specialist-app round trips, timestamp timing, task-result states, and recovery after refresh/background.

## Stop / retry rules

- Do not repeat the same test without new evidence.
- When blocked, identify the earliest failing boundary, file, condition, or request.
- Escalate reasoning effort only when evidence justifies it; lower it again after the ambiguity is resolved.
- Stop a lane when its completion condition is met or when the remaining evidence requires a user-only physical/runtime action.

## Rollback

Every promoted change must identify a prior known-good commit or configuration. Supplemental lessons/skills may be superseded or rolled back without rewriting TAKY Constitution history.

## Pilot success criteria

This pilot is successful only if Ready & Set demonstrates a complete evidence loop:

`route -> execute -> capture evidence -> identify cause/result -> verify -> extract lesson -> reuse -> regression check -> retain/rollback`

Only then should any execution-harness or continual-learning pattern be proposed for TAKY canonical adoption.
