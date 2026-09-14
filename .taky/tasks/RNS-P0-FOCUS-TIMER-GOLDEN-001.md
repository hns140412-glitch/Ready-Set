# RNS-P0-FOCUS-TIMER-GOLDEN-001 — Ready & Set Focus Timer Golden regression restoration

Status: READY_FOR_CODEX / NOT_DISPATCHED
Repository: `hns140412-glitch/Ready-Set`
Work branch: `runtime-session-bridge-2026-09-10`
Human merge/deploy approval: REQUIRED

## Role

TAKY/ChatGPT = ORCHESTRATOR + REVIEWER.
Codex = IMPLEMENTATION EXECUTOR.

Codex owns implementation design inside this contract, code authoring/modification, focused tests and implementation evidence.
TAKY owns the Golden target, scope, acceptance, review and rework decision.

`CODEX_DONE != TAKY_PASS`.

## Usage discipline

This is a bounded visual/product behavior slice. Do not broaden into unrelated Ready & Set cleanup, architecture rewrite, character work, Planner redesign, production deployment or repository-wide visual polish.

Use the smallest relevant test and browser loops. Do not repeatedly rerun expensive browser/E2E checks when previously valid evidence is unaffected by the current diff.

## Objective

Restore the actual Ready & Set Focus timer screen to the approved Golden design and conditional REC behavior.

This is **Golden regression restoration**, not a new design exercise.

The final rendered timer UI should match the approved Golden references as closely as the web platform permits while preserving functional timer/session behavior and the current Ready & Set source-of-truth semantics.

## Canonical source of truth

Read before editing:
1. `AGENTS.md`
2. `docs/FOCUS_TIMER_GOLDEN_CANONICAL.md`
3. `Ready_Set_Ui_Master_Logic_REV_07.md`
4. inherited REV_06 sections:
   - `# 14. FOCUS / TIME ATTACK VISUAL MASTER`
   - `# 15. FULL CLOCK HERO — HARD LOCK`
   - `# 16. FOCUS TIME PANEL + REC BUTTON`
   - `# 17. TIMER CORE — PRESERVE / HARD LOCK`
   - `# 59. GOLDEN REFERENCES — HARD LOCK`
   - `# 94. PHASE 02 — 시안 제작`
   - `# 95. PHASE 03 — 시안 검토 / SELF-VALIDATION`
5. live `origin/runtime-session-bridge-2026-09-10` HEAD at task start; fetch and record exact SHA before edits.

### Bound Golden references

Primary mobile Golden:
`Ready_Set_Focus_Timer_Golden_Reference_REV_01.jpeg`
- 864 × 1536
- SHA-256 `0da45388e62e72193c6f73b1f2b83d2bc38d159613cc33d74796a7f7903e7035`

Responsive phone/tablet Golden:
`Ready_Set_Focus_UI_Phone_Tablet_Golden_Reference_REV_01.jpeg`
- 1536 × 1024
- SHA-256 `880f44a7f73251a4995a67522a7ecdfd1a60cf7f50c5149cfb9ed2366b3235f7`

If the executor cannot inspect the exact bound image bytes, do not invent a substitute and do not claim visual Golden PASS. Report `GOLDEN_REFERENCE_BYTES_UNAVAILABLE` and limit work to code/spec preparation until the exact images are available in the executor workspace.

## Current confirmed drift to inspect

The existing implementation already contains partial Golden structure but must be compared rather than trusted.

Known areas to inspect:
- Focus headline/copy differs from the Golden `그냥! 지금 하면 돼!` identity;
- clock structure is present but Golden clock details/branding/editorial finish may be incomplete;
- verify 1–12 numerals are actually rendered, not only styled in CSS;
- verify `Ready & Set` clock identity is present as in the Golden composition;
- editorial yellow background energy/stars/rays are materially reduced or absent;
- mission pill styling differs from Golden;
- Dark Control Panel structure exists but Target wording/semantics currently appears as `보조 타이머` in the implementation and must be reconciled with canonical Target Time rules;
- conditional REC behavior must be fully verified in the real runtime, including its exact placement between Remaining and Target.

Do not assume this list is exhaustive. Compare actual render to the bound references.

## Required visual behavior

Preserve/restore:
1. Bold Yellow Focus identity.
2. `그냥! 지금 하면 돼!` primary Focus identity unless a newer canonical source explicitly supersedes it.
3. Full White/Ivory Analog Clock as the dominant hero.
4. Entire clock visible; no forced crop.
5. Readable 1–12 numerals.
6. Refined rim, precise hands, subtle depth/shadow and clean premium material.
7. `Ready & Set` identity integrated into the clock composition according to the Golden reference.
8. Golden editorial energy elements on the yellow canvas where they materially define the approved composition.
9. Dark Control Panel below the clock; it must not visually outrank the clock.
10. Current Mission.
11. Remaining Time.
12. Target Time.
13. Pause / Complete.
14. BGM/status and secondary timing data without stealing primary hierarchy.
15. Phone/tablet responsive behavior that preserves Golden hierarchy and composition.

## REC conditional state — HARD LOCK

Default mission:
`남은 시간 | 목표 시간`

When the current selected/active mission contains `영어 · 문장 녹음`:
`남은 시간 | REC | 목표 시간`

REC acceptance:
- centered between Remaining and Target;
- not shown as an active action for unrelated missions;
- red-dot motif + `REC` text;
- touch target >= 44 × 44 CSS px;
- accessibility label `문장 녹음`;
- after recording completion, explicit `REC ✓` or equivalent completed state;
- color alone cannot communicate completed state;
- recording entry/return preserves the same active session and timer state;
- REC must not distort Golden clock/panel balance.

## Timer behavior that must not regress

Do not break existing timestamp-derived timer/session semantics.

Preserve:
- timestamp delta based timing rather than trusting interval counts;
- background/visibility restoration;
- active-session persistence;
- explicit Pause separation from Recording and System Wait;
- recording round trip preserving the same session;
- `APP_SWITCH != PAUSE` inherited from REV_07;
- no timer reset caused by Focus visual restoration.

## Responsive behavior

Phone:
- match the primary Golden hierarchy/proportions;
- full clock remains visible;
- for shorter screens, reduce secondary decoration, spacing, panel padding, typography and clock scale in that order before considering any crop.

Tablet:
- preserve the same Focus identity/components;
- use the additional canvas for deliberate background/composition/spacing expansion;
- do not turn the screen into a generic multi-column dashboard;
- controls remain comfortably reachable and touch targets remain >=44 CSS px where interactive.

## Explicit do-not list

- no new visual concept replacing the Golden;
- no generic dashboard redesign;
- no heavy black clock frame;
- no forced clock crop;
- no emoji-driven UI substitution;
- no removal of timer/session persistence semantics;
- no unrelated Planner/home/onboarding rewrite;
- no production deploy;
- no main merge;
- no fabricated visual PASS from CSS/code inspection alone;
- no claim that `CHANGED` equals improved.

## Acceptance tests

A. Normal mission renders `남은 시간 | 목표 시간` without REC action.
B. `영어 · 문장 녹음` mission renders `남은 시간 | REC | 목표 시간`, with REC centered.
C. REC touch target >=44px and accessible name is `문장 녹음`.
D. REC completion shows explicit completed state (`REC ✓` or approved equivalent), not color only.
E. Recording round trip returns to the same Focus session without timer reset.
F. Full clock is completely visible at representative phone widths, including 390px.
G. Clock visibly includes 1–12 numerals and Ready & Set identity required by the Golden.
H. Dark panel is below/subordinate to the clock and retains required controls/data.
I. Primary copy and Yellow Focus identity match the Golden contract.
J. Tablet render preserves the same design identity rather than becoming a different dashboard.
K. Existing timer/session functional checks directly affected by the diff remain green.
L. Actual phone/tablet screenshots are compared side-by-side against the exact Golden bytes.
M. Every material comparison is classified `PRESERVED | IMPROVED | CHANGED | REGRESSED | UNKNOWN`; zero `REGRESSED` items required for TAKY PASS and `UNKNOWN` prevents visual PASS.

## Validation plan

1. Before edit: fetch/record live remote HEAD and capture current Focus render for baseline if runtime is available.
2. Run the smallest relevant static/syntax checks for changed HTML/CSS/JS.
3. Run focused timer/session tests already present or add narrowly scoped regressions only where existing tests cannot prove the changed behavior.
4. Exercise at minimum:
   - normal mission Focus;
   - `영어 · 문장 녹음` Focus;
   - REC entry + return;
   - 390px phone width;
   - one tablet viewport representative of the Golden responsive board.
5. Produce actual screenshots from the implemented branch.
6. Compare screenshots side-by-side to the exact Golden reference bytes.
7. Do not repeat unrelated E2E/browser loops.

If exact Golden bytes are unavailable in the executor workspace, stop before claiming visual verification and report that boundary precisely.

## Delivery requirements

Return:
- task id;
- actual `START_REMOTE_HEAD`;
- files changed;
- implementation summary;
- exact tests/checks and results;
- runtime/browser evidence;
- phone/tablet screenshot evidence paths;
- Golden comparison table with `PRESERVED / IMPROVED / CHANGED / REGRESSED / UNKNOWN`;
- any unresolved visual or platform limitation;
- resulting commit SHA;
- lifecycle request `TAKY_REVIEW`.

Do not merge main and do not deploy production.

`CODEX_DONE != TAKY_PASS`.
