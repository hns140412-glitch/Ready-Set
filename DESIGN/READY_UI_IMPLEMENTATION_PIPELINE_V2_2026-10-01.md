# Ready & Set UI Implementation Pipeline V2 — 2026-10-01

Status: ACTIVE EXECUTION CONTRACT / DRAFT BRANCH / MERGE HOLD / NETLIFY HOLD

## 0. Authority lock

Execution base:
- repository: `hns140412-glitch/Ready-Set`
- branch base: `main@daed2ebd072061b870bfd0d2f2472dd344661bad`
- current validated runtime-code basis: `e1c8afaea0f946a0176e36ef794d2380f0daefe2`
- current main adds validation/registry closure only after that code basis.

Planner authority preserved from current main:
- named schedule periods with date ranges
- period-scoped weekly fixed commitments
- automatic active-period precedence/fallback
- parent-confirmed lifestyle buffers
- free-window subtraction using commitments + buffers
- schedule-period/commitment/buffer conflict preview
- explicit Parent acknowledgement before conflicting authoritative save
- Planner remains the only authority allowed to create authoritative DATED TODOs
- Parent/Ready voice/UI must never bypass Planner authority.

Explorer Crew authority preserved from current main:
- consume shared `ReadyExplorerCrewAuthorityConsumer`
- current selected `character_id` is the companion identity source
- do not add a local Core6 default/fallback that pretends to be selected
- do not recreate characters from names.

## 1. Golden visual/source lock

Accepted composition references are recovered in TAKY-ASSETS Draft PR #2,
head `aae935d9a196cddbca43187c2d2d39e45a82160b`.

Week:
- `weekly_approved_composition.png`
- 941×1672
- SHA-256 `cd479f1c72a58171a5873a6c06e442fecfb7d63819a741f6984650968308db42`

Day:
- `daily_approved_composition.png`
- 941×1672
- SHA-256 `733aa39ea2972fffa04362994cb1218c60e34eb1558a86816a2388dd4f6e9ad5`

Preparation / Goal mood:
- `preparation_approved_mood_reference.png`
- 941×1672
- SHA-256 `03f3229200a20a38b875b68b0feb1e8f06bb71cd593178311595aaab6162bd53`

These three files are composition references only.
They contain baked characters, labels, sample dates and sample Planner facts.
Direct use as a live runtime background is FORBIDDEN.

If a verified clean plate or semantic layer package is unavailable, set
`SOURCE_ASSET_UNRESOLVED` and stop the visual-promotion gate. Do not generate
a substitute and present it as approved source.

Timer:
- preserve the existing approved Timer implementation and visual.
- do not redesign Timer while implementing Week / Day / Goal.
- obsolete copy corrections already accepted remain allowed.

## 2. What may be reused from legacy Draft PR #121

PR #121 is NOT an implementation base. It diverged before current Planner,
schedule-period, lifestyle-buffer, conflict-review and shared crew updates.

Only selectively port concepts that do not violate current authority:
1. child walkie-talkie interaction concept
2. voice -> structured draft -> explicit confirmation pattern
3. Ready approved-screen contract wording that still matches current user decisions
4. regression test ideas after rewriting them against current main.

Do NOT cherry-pick wholesale:
- old `app.js`
- old `index.html`
- old `styles.css`
- local Core6 binding/fallback
- duplicate Parent voice parser
- legacy Planner rendering assumptions.

## 3. Voice-input integration

### Child
Primary quick-add affordance:
`walkie-talkie -> speech -> structured draft -> child confirms -> Assignment Fact`

Rules:
- never auto-commit speech.
- typing remains a secondary fallback.
- child quick-add must create/modify assignment/event fact input only.
- it must not directly create an authoritative DATED TODO.
- Planner decides placement after the fact is eligible/confirmed under current rules.

Target utterances include:
- “금요일까지 리코더 연습 20분”
- “내일 단원평가 준비 30분”
- “오늘 책 읽기 20분”
- “토요일 친구 생일 2시”

### Parent
Do NOT create a second Parent voice engine.
Extend the existing current-main schedule voice path centered on
`parseScheduleVoiceCommand()`, existing preview/confirm, and conflict review.

Parent voice may propose:
- schedule period creation/update
- weekly fixed commitment creation/update
- one-off event creation/update
- lifestyle buffer creation/update
- temporary exceptions
- Planner replan/defer/move requests.

Every authoritative schedule mutation remains:
`voice request -> parsed proposal -> conflict review if needed -> explicit Parent apply`.

Task movement/defer must be expressed as a Planner request/proposal.
Parent UI must not write authoritative DATED TODOs directly.

## 4. UI scene/layer pipeline

For Week, Day and Goal/Preparation:

1. Reference identity verified by SHA.
2. Separate environmental clean plate / semantic environment layers.
3. Separate foreground/table/props layer.
4. Dynamic child Visual ID slot.
5. Dynamic selected companion `character_id` slot from shared authority.
6. Live Planner/UI DOM layer for text, dates, tasks and controls.
7. Optional low-noise effect layer only when it does not reduce readability.

No baked schedule text, sample dates, fake Planner facts, or baked characters in runtime art.

## 5. Screen behavior contract

### Week
- schedule-first seven-day overview.
- show fixed commitments, Planner TODOs and confirmed lifestyle/free-time context without changing their authority.
- active schedule period affects the displayed fixed timetable automatically.
- period override ends -> prior/base timetable resumes automatically.
- scenery remains secondary to timetable readability.

### Day
- chronological route.
- fixed commitments and lifestyle buffers appear in time order.
- Planner TODOs remain Planner-owned.
- unknown TODO time stays unknown; do not invent a clock time.
- walkie-talkie quick-add is available without turning the screen into a form dashboard.

### Goal / Preparation
- preserve approved preparation-table composition.
- goal selection -> optional share -> existing approved Timer.
- child and selected companion prepare at Base Camp.
- share must not block Timer start.

### Parent Admin
- natural-language voice is the primary convenience path.
- detailed forms remain secondary correction tools.
- schedule conflicts are never silently resolved.
- explicit Parent acknowledgement is required where current conflict gate says so.

## 6. Design Gate

Required visual evidence:
- actual browser render, not DOM-only claims.
- 390×844 phone
- 430px-class phone
- 1024×768 tablet
- no horizontal overflow
- readable text/contrast over environment
- safe-area/touch-target checks
- Week/Day/Goal reference comparison at matched viewport
- overlay or side-by-side mismatch review
- selected companion identity and child slot checked independently
- reduced-motion behavior retained where motion exists.

PASS requires correction of material visual mismatch and explicit human visual approval.
Automated browser tests alone are not a visual PASS.

## 7. Regression Gate

Before visual promotion or merge:
- Ready Integration CI PASS
- Ready Runtime E2E PASS
- Child FACT Confirmation PASS
- Single Active Task PASS
- Daily Availability PASS
- Weekly Availability PASS
- Planner free-window/buffer tests PASS
- period timetable tests PASS
- schedule conflict review tests PASS
- shared Explorer Crew authority tests PASS
- PWA/local-first tests PASS
- new walkie-talkie draft-confirm tests PASS
- Parent voice extension tests PASS.

Any failure => STOP / FIX / RETEST. Do not bypass by weakening tests.

## 8. Execution order

`CURRENT MAIN LOCK`
→ `REFERENCE SHA LOCK`
→ `CLEAN PLATE / SEMANTIC LAYER PREP`
→ `WEEK/DAY/GOAL DOM BINDING`
→ `CHILD WALKIE-TALKIE FACT BRIDGE`
→ `PARENT EXISTING VOICE ENGINE EXTENSION`
→ `SHARED COMPANION BINDING`
→ `PHONE/TABLET RENDER`
→ `DESIGN OVERLAY REVIEW`
→ `FULL REGRESSION`
→ `HUMAN VISUAL APPROVAL`
→ only then consider merge/deployment separately.

## 9. Release boundary

Current state:
- pipeline: READY_TO_EXECUTE_V2
- code implementation of V2 UI: NOT_STARTED_ON_THIS_BRANCH
- visual promotion: HOLD
- main merge: HOLD
- Netlify/deployment: HOLD
- device verification: OPEN
- production verification: OPEN

USER != DEBUGGER.
