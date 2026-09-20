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


## Branch-first device validation / hosting budget — HARD LOCK

For Ready & Set implementation and QA:
- Development and verification SHALL stay on a non-main branch until bounded CI + Runtime checks pass.
- Netlify production/main deployment SHALL NOT be used as a routine verification mechanism.
- Branch CI / Playwright Runtime verification is the default verification path.
- Hosting usage must be treated as a finite operational resource.
- Netlify deploy/preview/site creation SHALL NOT be triggered merely to inspect an implementation that can be validated in GitHub Actions.
- Device verification is a separate final gate after branch verification is closed.
- A physical-device test may use one deliberate deployment only after the exact candidate SHA is selected.
- Any temporary hosting site or preview environment created for QA must not be treated as canonical production.
- `CI_VERIFIED / RUNTIME_VERIFIED != DEVICE_VERIFIED != PRODUCTION_VERIFIED`.
- Do not use the user as routine QA/debugger; prepare deterministic seed data and pass/fail checks before requesting device execution.
