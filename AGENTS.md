# Ready & Set Agent / Recovery Rules

## CURRENT AUTHORITY — HARD LOCK

Before any Ready & Set implementation, review, recovery, UI, runtime, validation, or deployment task, load and apply in this order:

1. `READY_SET_CANONICAL_PRODUCT_CONTRACT.md`
2. `READY_SET_RUNTIME_STATE_MODEL.md`
3. `READY_SET_DECISION_LEDGER.md`
4. `READY_SET_VERSION_REGISTRY.json`
5. `READY_SET_VALIDATION_STATUS.json`
6. current implementation and exact branch/HEAD evidence

GitHub TAKY remains the higher governance authority. These Ready files are the current project authority.

`CANONICAL LOADED != CANONICAL APPLIED`
`HISTORICAL REFERENCE != CURRENT AUTHORITY`
`SEARCH MISS != SOURCE ABSENCE`

## Historical UI / REV material

The following files are provenance/recovery evidence only unless the current Ready canonical explicitly reactivates a specific part:

- `Ready_Set_Ui_Master_Logic_REV_06.md`
- `Ready_Set_Ui_Master_Logic_REV_07.md`
- `Ready_Set_Focus_Golden_Reference_REV_01.md`

They MUST NOT override the current Product Contract, Runtime State Model, Decision Ledger, Version Registry, or latest user correction.

In particular:
- Ready & Set is an exploration/base-camp execution orchestrator, not a Time Attack product.
- timing remains an execution tool;
- Time Attack / Focus Mode are not active product identities;
- Focus Golden is not active product authority;
- `SESSION_END != TASK_COMPLETE`;
- Planner is the sole DATED TODO allocation authority.

## Recovery rule

Do not declare a prior source, decision, screenshot, or implementation absent before checking current canonical plus recoverable repository evidence.

`SCREENSHOT MISSING FROM CHAT != DESIGN SOURCE MISSING`

When historical evidence conflicts with current canonical, preserve the evidence as provenance and follow current canonical.

## Implementation / validation truth

Before editing, resolve current HEAD. After editing, inspect integrated result and run bounded relevant checks.

Report states separately:
`DECIDED / CODED / CI_VERIFIED / RUNTIME_VERIFIED / DEVICE_VERIFIED / PRODUCTION_VERIFIED`.

Do not ask the user to perform routine debugging or QA while system-side evidence/recovery remains available.


## PRE-ACTION application gate — HARD LOCK
Before any material implementation, validation, external verification, deployment, repository promotion, or costly side effect:
1. resolve applicable TAKY/project rules;
2. bind them to the exact planned action;
3. verify required preconditions;
4. choose the lowest-impact compliant execution path;
5. block the action when it conflicts with an applicable rule.

`RULE LOADED != RULE APPLIED`.

For Ready:
- branch implementation/CI/Runtime comes before external hosting;
- Netlify is not a routine debugging surface;
- production/main promotion and device deployment remain explicit release gates;
- external UI references are comparison inputs, not Ready authority;
- Snap & Pop owns shared expedition-member rules; Ready consumes them.

## Branch-first renewal workflow
Default:
`RENEWAL BRANCH → IMPLEMENT → BOUNDED CI/RUNTIME → INTEGRATED REVIEW → HUMAN-APPROVED PROMOTION WHEN REQUIRED → DEVICE FINAL GATE → PRODUCTION FINAL GATE`.

Do not repeat equivalent validation when no actionable delta remains.
Do not ask the user to debug recoverable system-side failures.


## Latest handoff integration — 2026-09-20
Durable continuity source:
`Google Drive / READY_SET_HANDOFF_2026-09-20_LATEST`.

The handoff is continuity evidence, not higher authority than current TAKY or current GitHub code.
Startup/resume order:
1. load latest TAKY canonical;
2. read the latest Ready handoff when resuming;
3. resolve current Ready main SHA;
4. compare handoff against current code;
5. continue branch-only implementation/verification;
6. do not call hosting during implementation review;
7. freeze one exact candidate only after branch CI + Runtime closure;
8. external deployment/device validation is allowed only after TAKY PRE-ACTION + external-resource gate passes.

External-resource lock:
`LOCAL/BRANCH → CI/RUNTIME → ONE FROZEN CANDIDATE → EXTERNAL DEPLOY/VALIDATION`.

Hard:
- no repeated Netlify/deploy-preview/status calls for the same goal without new evidence;
- no hosting call before candidate SHA is frozen;
- if GitHub/CI/Runtime can answer the question, use them first;
- user is not a routine tester/debugger;
- system-side failure analysis and minimal rework precede any user device action;
- Netlify budget defaults to one justified external execution for the frozen deployment goal unless TAKY explicitly permits otherwise.

`TOOL AVAILABLE != CALL JUSTIFIED`.
`STATUS CHECK != PROGRESS`.
`RETRY WITHOUT NEW EVIDENCE != VALIDATION`.
