# CODEX TASK — Ready & Set current execution packet

Generated for the office-PC local Codex worker. Re-check live Git HEAD before starting; this file's embedded SHA is a pointer, not authority.

## Outcome
Make the first usable Ready & Set path work end-to-end from intro through parent setup, with timetable and homework intake active before Planner usage.

## Current implementation already present on the branch
- First-run identity/profile/photo/character consultation flow.
- Character paid generation remains locked.
- `ready-role-context-v1.js`: derives/persists parent vs child runtime role.
- `ready-onboarding-flow-completion-v1.js`: deferred-character onboarding continuation toward explorer/world completion.
- `ready-parent-setup-hub-v1.js`: parent-first timetable + homework entry surface and schedule editor.
- `ready-parent-capture-intake-v1.js`: six Talent-book camera intake, IndexedDB source retention.
- `ready-homework-analysis-bridge-v1.js` + `/api/homework-analysis`: gated extraction candidate path.
- `ready-schedule-base-v1.js`, `ready-foundation-v1.js`, `ready-foundation-control-v1.js`, `ready-stage-g14-planner-authority.js`: schedule/planner authority layers.

## TAKY direction lock — baseline timetable
- The currently confirmed base timetable is the authoritative baseline and is considered FIXED.
- Do not redesign or repeatedly re-enter the whole weekly timetable during normal use.
- Future schedule changes are recorded only as deltas against the fixed baseline:
  - recurring/prospective change = profile revision effective from a chosen date;
  - one-day exception = dated override;
  - genuinely new recurring activity = add as a new effective-dated schedule entry.
- Never overwrite historical schedule facts or past Planner actuals when a future schedule change is entered.
- Missing timetable rows are not free-time evidence.
- Planner recalculation after a schedule delta is prospective only and must preserve past execution evidence.
- User-facing behavior should emphasize `기본 시간표는 확정`, and expose change/add controls only when a real change occurs.

## Work packet A — first-run completion
1. Open a clean local browser storage state.
2. Exercise: Guardian for child → profile → photo → character consultation.
3. Character generation is locked, so the user must be able to choose `캐릭터는 나중에 완성` and continue.
4. Complete explorer/world selection and enter the application.
5. Confirm guardian setup lands in actual parent runtime without manually adding `?role=parent`.
6. Confirm the role switch is not visible over the unfinished first-run overlay.
7. IMPORTANT: deferred character must not create a fake generated `characterVisualId`. If current code does so, replace that with explicit deferred visual state and adapt readiness logic so profile readiness can coexist with `characterVisualState=DEFERRED` while still distinguishing it from a confirmed Identity Master.

Acceptance:
- no onboarding dead end when paid character generation is locked;
- no false claim that a generated identity master exists;
- parent role opens automatically after guardian onboarding;
- reloading preserves the selected runtime role.

## Work packet B — timetable activation
1. Parent home must surface timetable as step 1.
2. Open timetable; confirm the fixed baseline rows render as the authoritative weekly schedule.
3. Do NOT require whole-table re-entry as part of normal setup once the baseline is confirmed.
4. Enter one genuine schedule change and verify it is stored as a delta, not a destructive baseline rewrite:
   - recurring/prospective change via profile revision, or
   - one-day change via dated override.
5. Add a new recurring fixed event only as a new effective-dated entry when an actual new activity exists.
6. Confirm missing schedule rows are never treated as free-time evidence.
7. Confirm Planner candidates update only where schedule authority permits, prospectively, without rewriting past actuals.

Acceptance:
- base timetable remains intact after edits;
- change/add controls are visible and usable on mobile width;
- saved deltas survive reload;
- current weekly/daily view reflects effective baseline + delta result;
- history before the effective date remains unchanged;
- Planner uses the resulting effective schedule authority prospectively.

## Work packet C — homework activation
1. Parent home must surface homework capture/input as step 2.
2. Open homework path from parent home without hidden navigation knowledge.
3. Verify Talent rapid capture: choose book → capture multiple pages → change capture kind → next book → save-and-analyze.
4. Verify captures persist in IndexedDB.
5. If homework analysis flag is disabled, the UI must say analysis is pending/locked while retaining photos.
6. If analysis flag is enabled locally and provider key exists, extraction may prefill candidate fields only.
7. Parent confirmation must be required before FACT confirmation.
8. Confirmed FACT should then be eligible for Planner allocation using the current effective timetable (fixed baseline + any applicable delta).

Acceptance:
- no auto-click or implicit FACT confirmation from the capture queue;
- answer/reference source stays parent-only;
- AI extraction never becomes `FACT_CONFIRMED` without explicit parent action;
- confirmed FACT appears in the planner pipeline;
- Planner allocation respects fixed baseline + effective schedule deltas.

## Work packet D — product polish after functional pass
Only after A/B/C work:
- improve intro copy/visual hierarchy;
- make parent setup hub visually consistent with Ready & Set world shell;
- remove placeholder-like technical copy from user-facing screens;
- preserve the concise capture UX: rapid shooting first, analysis second;
- replace implementation jargon such as FACT/OCR/API in child-facing or ordinary parent-facing copy where it hurts usability, while retaining internal semantics in code/data.

## Tests / local evidence
Run relevant existing contracts plus add or extend browser-level tests so the schedule authority rule is enforced, not merely documented.

Expected minimum local evidence:
- clean-state intro completion screenshot/state;
- parent home showing timetable + homework entry;
- fixed baseline timetable visible without re-entry;
- prospective recurring schedule revision keeps historical dates unchanged;
- one-day override affects only its target date;
- effective schedule change survives reload;
- homework capture retained after reload;
- confirmed homework entering Planner candidate path;
- Planner candidate allocation changes prospectively when schedule delta applies;
- exact test commands + pass/fail output.

## Commit policy
Make coherent commits on `runtime-session-bridge-2026-09-10`, push to origin, and report final commit SHA. Do not merge to main.
