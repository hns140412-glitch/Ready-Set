# READY & SET 3-SCREEN UI DESIGN STANDARD — 2026-09-22 REV1

Status: DESIGN_STANDARD_LOCKED / MOCKUP_NOT_STARTED
Authority: latest TAKY + Ready canonical + approved/recovered Library visual lineage
Branch: `taky/ready-rebuild-v01-2026-09-21`
Reviewed HEAD: `b57cc102c456004eba81485333189d6f34276f2f`

## 0. Scope lock

Ready & Set final core UI is limited to exactly three primary screens:

1. TIMER
2. WEEKLY SCHEDULE
3. DAILY SCHEDULE

This three-screen structure is a user-confirmed lock.

Mission / Focus / Wrap-up / Result / Parent approval / carry-over / capture / learning evidence are not automatically promoted to new primary screens.
They must first be expressed as:
- state
- component
- drawer/sheet
- modal
- overlay
- inline expansion
- contextual transition
inside the three-screen architecture.

Creating a fourth primary screen requires:
OPEN → impact review → regression review → HUMAN APPROVAL.

## 1. Source priority / TAKY precedence

Design decisions follow this order:

1. latest direct user correction
2. locked 3-screen structure
3. approved/recovered visual samples in Library
4. current Ready canonical product/state contracts
5. cross-app canonical ownership contracts
6. current runtime feasibility
7. historical master documents
8. assistant proposals / generic design patterns

Historical or attractive mockups never override a newer user correction.

## 2. Recovered visual lineage

### TIMER
Recovered visual lineage:
- `노란 집중 타이머 앱 화면.png`
- `노란 집중 타이머 앱 화면(2).png`
- `노란 집중 타이머 앱 화면(3).png`

Locked corrections recovered from Library:
- headline: `그냥! 지금 하면 돼!`
- remove child-facing `FOCUS MODE` label
- preserve analog-clock-centered composition
- enlarge analog clock using released whitespace
- keep BGM control at upper-right music control
- remove redundant lower sound-change control
- lower area may show current BGM selection
- selected task context remains visible without overtaking the clock
- Timer visual lineage is PRESERVE/REFINE, not redesign-from-zero

### WEEKLY / DAILY
Recovered samples:
- `파스텔 키즈 플래너 앱 UI 디자인 스펙.png`
- `image-gen-1(10).png`
- `image-gen-2(10).png`

Latest user visual correction:
- weekly screen must become simpler / less visually dense
- daily screen is the vertical execution-oriented view
- convert sample composition into actual app UI, not presentation-board decoration

The reference samples are visual lineage, not data authority. Sample dates/tasks/subjects are not product defaults.

## 2.5 Shared Island World Topology — HARD LOCK

Cross-app canonical authority:
TAKY `C2S/LEARNING_APP_FAMILY_SHARED_ISLAND_WORLD_TOPOLOGY_2026-09-22.md`

### Fixed-world invariant
- ONE ISLAND is literal product topology, not a loose visual metaphor.
- Island geography is fixed across sessions and apps.
- Ready / Hide / Snap are not disconnected worlds.
- Random replacement forests/oceans/caves that break spatial continuity are forbidden.
- Local atmosphere may change, but landmark position and world continuity remain recognizable.

### Entry / naming sequence
`CHARACTER / EXPLORATION CREW SETUP → DROP / VOYAGE ARRIVAL → ENTER FIXED ISLAND → NAME ISLAND → READY & SET BASE CAMP / MAP → NAME BASE CAMP → MOVE TO APP REGION`

Rules:
- Drop/Voyage is first-entry or meaningful-transition language, not an animation forced on every app switch.
- Island name persists and may later be renamed without changing geography, history, progress, badges or crew relationship.
- Base-camp name persists and may later be renamed without resetting Planner, Timer, goals, records, badges or crew relationship.
- Island/Base Camp names are presentation identity, not new data owners.

### Region topology
- Ready & Set = BASE CAMP + island MAP/HUB
- Hide & Seek = JUNGLE / WATERFALL region
- Snap & Pop = BEACH region
- Future learning apps join the SAME island unless explicitly re-approved.

### Ready three-screen interpretation
The three Ready screens are not three separate worlds.

- WEEKLY = Base Camp에서 섬 전체의 이번 주 경로를 멀리 보는 전략 지도
- DAILY = 오늘 섬 안에서 이동할 실제 경로를 가까이 보는 루트
- TIMER = 선택한 탐험 지점에 도착한 뒤 수행하는 집중 공간

This is a change in viewing distance, not a change of world.

### Visual continuity contract
- Weekly may reveal the strongest island/map context.
- Daily may reveal route/landmark context more locally.
- Timer should suppress world illustration and preserve the locked yellow analog-clock focus UI.
- The same landmark/route language must remain spatially plausible across Weekly and Daily.
- Character/Crew presence must persist by ID across regions but may be visually minimized by screen purpose.

### Child-facing concept
The child is not “using three planner screens.”
The child is:
`Base Camp에서 이번 주 길을 보고 → 오늘 갈 길을 따라가고 → 한 지점에 도착해 지금 할 일을 한다.`

The exploration concept therefore comes from spatial continuity and movement, not RPG decoration or extra navigation tabs.

## 2.6 Ready & Set world-surface ownership correction — HARD LOCK

Ready & Set owns **BASE CAMP presentation/UI only** inside the shared fixed island.

Ready & Set SHALL NOT own or redesign:
- Explorer character creation
- Exploration Crew construction
- starter crew selection
- crew naming/history
- crew personality definition
- crew catalog/roster construction
- island-wide character onboarding flow

Those are shared/upstream or Snap-owned domains and are being developed independently.

Ready consumes only the resolved runtime identity/context, for example:
- `Explorer_ID / character_id`
- current profile/avatar presentation
- current selected crew member ID
- permitted crew reaction/presence state

Ready-specific visual responsibility is limited to:
- Base Camp spatial identity
- Base Camp schedule/planner presentation
- Base Camp weekly route view
- Base Camp daily route view
- Base Camp timer/execution surface
- route gateways toward other island regions where needed

### Visual rule
The Base Camp may visually acknowledge the Explorer and current crew member, but:
- it must not contain character-building UI;
- it must not re-run crew selection;
- it must not define new crew personalities;
- it must not require a fixed character visual to make the layout work;
- character/crew assets are injected after upstream identity is resolved.

Therefore:
`READY UI DESIGN != CHARACTER SYSTEM DESIGN`

and:

`SHARED ISLAND WORLD != READY OWNS WHOLE ISLAND UI`

Ready's job is to make **Base Camp** feel like the operational home of the learner while preserving continuity with the island world defined elsewhere.

## 2.7 Child-facing wording lock — HARD LOCK

Primary labels:
- WEEKLY SCHEDULE → **이번 주 여정**
- DAILY SCHEDULE → **오늘의 탐험길**
- TIMER headline → **그냥! 지금 하면 돼!**

Language principle:
- Ready & Set is an exploration-oriented Base Camp, not a military command center.
- Prefer: 여정 / 탐험길 / 출발 / 다음 탐험 / 쉬어가기 / 돌아보기 / 지금 할 일.
- De-prioritize or reject as default UI language: 작전 / 작전판 / 작전실 / 전투 / 클리어 / 보상 획득.
- “미션” may appear only where already functionally established, but must not become the dominant naming layer across the three-screen UI.

Three-screen narrative:
`이번 주 여정 → 오늘의 탐험길 → 그냥! 지금 하면 돼!`

Meaning:
- 이번 주 여정 = far-view weekly route from Base Camp
- 오늘의 탐험길 = today’s concrete route
- 그냥! 지금 하면 돼! = execution moment with minimal cognitive overhead

## 3. Product logic that the three screens must carry

Canonical learning/planning flow remains:
ASSIGNMENT FACT → LEARNING MASTER → PLANNER → DATED TODO → DAILY/WEEKLY PROJECTION → TIMER EXECUTION → RESULT/EVIDENCE → CARRY/REPLAN.

The UI must carry this logic without exposing internal architecture jargon to the child.

### WEEKLY owns the overview question:
“이번 주에 언제 무엇이 있고, 어느 날에 무엇이 배치되어 있는가?”

### DAILY owns the execution-planning question:
“오늘 언제 무엇을 하고, 지금 다음으로 무엇을 하면 되는가?”

### TIMER owns the execution question:
“지금 선택한 일을 방해받지 않고 시작하고 끝내는가?”

## 4. Planner authority rules

Planner remains the sole dated allocation authority.

UI must distinguish:
- fixed schedule / commitment
- available/free window
- Planner-created dated TODO
- completion/progress evidence
- carry/reflow proposal

Hard prohibitions:
- fixed timetable automatically becoming homework
- free time visually implying mandatory study
- Learning Master directly selecting dates/times
- Timer creating DATED TODO
- Parent capture automatically allocating study blocks
- UI silently moving schedule items

Visual distinction must be clear enough that a child can see:
“이미 정해진 일정” vs “오늘 할 일” vs “비어 있는 시간”.

## 5. Three-screen information architecture

### 5.1 WEEKLY SCHEDULE

Purpose:
fast orientation, not detailed editing.

Primary content:
- current week/date range
- Mon–Sun
- confirmed fixed commitments
- Planner DATED TODO summary
- meaningful free-window indication only when useful
- today highlight
- selected-day handoff to Daily

Density rule:
- no full admin spreadsheet feel
- do not show every 30/60 minute row if that makes the weekly screen unreadable
- compress repetitive school/academy blocks where possible
- prioritize pattern recognition over exact detail
- exact detail belongs to Daily

Preferred interaction:
tap day → Daily
tap compact task/schedule block → Daily anchored to that item

Status:
weekly = overview map.

### 5.2 DAILY SCHEDULE

Purpose:
the operational vertical route for one day.

Primary content:
- date/day
- chronological vertical flow
- confirmed commitments
- Planner DATED TODOs
- current/next item
- meaningful gaps/free windows
- carry/reflow/pending state where applicable
- direct Timer entry for an executable TODO

Rules:
- vertical first
- “next action” stronger than decorative header
- fixed schedule and TODO use clearly different visual language
- unknown/unconfirmed time remains visibly unknown, never filled by inference
- long day remains scrollable with sticky/current-time assistance only if it does not collide with bottom controls

Status:
daily = route sheet.

### 5.3 TIMER

Purpose:
single-minded execution.

Locked visual lineage:
- yellow-focused composition
- `그냥! 지금 하면 돼!`
- Ready & Set branding
- analog clock remains visual anchor
- selected task context visible
- remaining/target time
- pause
- completion action
- BGM control
- REC only when contextually eligible

Rules:
- no generic bottom navigation competing with active Timer
- navigating away does not end session
- app switch != pause
- session end != every task complete
- secondary information is hidden/collapsed while focus is active

Status:
timer = execution cabin.

## 6. Exploration Crew system integration

Canonical owner:
Snap & Pop owns Exploration Crew identity, behavior rules, reaction grammar and crew system.
Ready & Set does NOT redefine those rules.

Ready may consume an authorized crew presence layer only.

Locked shared rules:
- official terms: 탐험가 / 탐험대 / 탐험대원 / 탐험대 규칙
- long-term roster ceiling: 20 direction
- starter choice: latest correction = 5–6 candidate range
- current recovered core 6 lineage remains evidence, not permission to invent missing details
- special members are encounter-style, not stronger units
- all members have equal functional capability
- crew differences are personality/voice/gesture/relationship/memory, not performance power
- changing member must not alter learning progress/reward data
- absence creates no penalty or affinity loss
- return may create reunion flavor, not guilt
- crew never authors final answer, grades, mocks, or overpraises
- child mistake/ability/emotion are never joke targets
- character/crew visual is runtime slot based and optional

Ready-specific application:
- WEEKLY: at most a tiny contextual presence; never a mascot-heavy schedule
- DAILY: optional short reaction near “next task” or route transition
- TIMER: generally quiet; crew may appear only for start/help/recovery/completion moments without covering clock/task controls

Exploration Crew must not become a fourth navigation destination inside Ready.

## 7. Badge system integration

Canonical badge principle:
badge = process/experience collection, not score, power, ranking or capability judgment.

Current recovered direction:
- approx 60 launch-scale catalog direction
- final exact catalog remains OPEN
- historical 60 names are WORKING_DRAFT, not active canonical badges
- circular badge
- hand-drawn/pastel
- Profile Character as protagonist
- five display tiers: Green → Blue → Red → Gold → Platinum
- 1–5 gem-stars around upper badge rim
- identity stable; theme expression may vary cosmetically

Hard separation:
BADGE ≠ EXP ≠ GEM ≠ AFFINITY ≠ CHARACTER LEVEL ≠ WORLD STATE.

Ready UI rule:
- Ready may surface a badge candidate/evidence moment only if cross-app producer/consumer ownership is explicitly defined.
- Ready does not activate the historical working catalog by itself.
- A badge does not unlock time, alter Planner authority, change learning load, or improve crew ability.
- Badge presentation must never create leaderboard/streak pressure.

Three-screen use:
- WEEKLY: no badge clutter. At most subtle history marker if later canonicalized.
- DAILY: candidate/earned badge should not compete with next action.
- TIMER: no badge progress meter during focus. Badge event may appear after execution as a small non-blocking recognition layer.
- Exact award thresholds remain OPEN unless canonicalized.

## 8. Gem / Wish / Blessing economy boundary

Canonical owner:
`SNAP_POP_WISH_ECONOMY`

Snap & Pop owns:
- gems
- gem ledger
- 소원 상점
- 소원 사용하기
- 축복 사용하기
- wish transaction

Ready & Set does not:
- spend gems
- execute wishes
- show gem balance as Ready-owned currency
- modify wish eligibility
- place wish shop inside weekly/daily/timer

If a cross-app semantic event is ever shown, it is read-only/contextual and carries no spend authority.

Copy lock inherited from Snap:
- `소원 상점` = browse wishes
- `소원 사용하기` = select/review wish
- `축복 사용하기` = final execution/transaction
- `축복 사용 기록` = completed transaction history
- `응원 카드` = family encouragement, not “축복 카드”

## 9. Reward/growth anti-confusion rules

The UI must not merge these into one generalized “growth score”:
- Planner completion
- focus/session evidence
- badge
- gem
- wish/blessing
- affinity
- exploration crew relationship
- Learning Master assessment

Each has a separate owner and meaning.

Ready’s job is primarily:
plan → see today → execute → record truthful outcome.

The visual system may share a common adventure language, but semantics remain separate.

## 10. Exploration visual language for Ready

Exploration concept in Ready = route/orientation/execution metaphor.

Allowed:
- route line
- signpost metaphor
- map-like day progression
- subtle base-camp texture
- contextual landscape header
- compact expedition markers
- optional crew reaction slot

Avoid:
- RPG HUD overload
- loot/chest emphasis on main schedule
- permanent speech bubbles
- mascot occupying timetable grid
- shiny rarity frames
- XP bars on Planner
- gem counter in Timer
- “mission complete” effects before truthful result state

The schedule must remain easier to read than the theme.

## 11. Color / visual system

Reference direction from recovered timetable samples:
warm pastel, calm, modern, rounded, exploratory.

But latest user feedback requires lower visual fatigue.

Therefore:
- background: warm neutral/cream
- schedule blocks: restrained subject/category colors
- no rainbow saturation across every block
- one active accent per screen
- strong text contrast
- decorative landscape uses low information density
- avoid excessive gradients/glow/confetti
- emojis are not primary visual language
- illustration is supporting asset, not UI text replacement

## 12. Typography / spacing / mobile

Primary viewport: 390×844.

- side gutter: ~16px baseline
- major section rhythm: ~20–24px
- tap target >=44px
- Korean-first typography
- subject/task title maximum 2 lines in compact cards
- exact detail expands on demand
- safe-area respected
- no critical control behind keyboard
- no horizontal scroll for three primary screens
- sticky/fixed elements must not collide
- one-hand reach considered for primary actions

## 13. State rules

The three screens must support state presentation without creating new primary screens:

- loading
- empty/no schedule
- no mission
- offline
- sync pending
- sync conflict
- permission denied
- Parent approval pending
- HOLD/UNKNOWN source
- carry-over required
- error/retry

Rule:
state UI explains what happened + what remains safe + next valid action.

No silent failure.
No invented data.

## 14. Screen-transition rules

Primary flow:
WEEKLY ↔ DAILY → TIMER → DAILY

Additional:
- Timer can return to Daily without losing active session when permitted
- Daily can return to Weekly preserving selected date
- completion returns to Daily with truthful state
- carry/reflow returns to Planner-owned Daily/Weekly projection
- specialist app routing returns to same Ready session/task/lap context

No new primary Home/Mission/Result screen is introduced by default.

## 15. Mockup acceptance gate

Before any mockup is approved, verify:

### Scope
- exactly 3 primary screens
- no accidental fourth screen

### Visual lineage
- Timer preserves approved yellow/analog-clock lineage
- Weekly reflects simplified overview correction
- Daily is vertical route view

### Semantics
- commitments / free windows / DATED TODO are distinct
- no inferred unknown times
- Planner authority preserved
- badge/gem/wish/crew semantics not merged

### Crew
- optional slot only
- no fixed character required
- no power difference
- no large persistent dialogue

### Reward
- badge is recognition, not score
- gem/wish/blessing is not Ready-owned
- no reward UI competing with schedule/timer core

### Mobile
- 390×844 usable
- no horizontal overflow
- primary action thumb reachable
- visual density acceptable
- text readable

### Runtime
- every control maps to existing/planned owner/state/event
- visual change does not require deleting existing domain logic
- stable selectors planned before markup rewrite
- E2E regression impact documented

## 16. Design work sequence

LOCKED sequence:

1. recover visual references
2. classify PRESERVE / ADJUST / HOLD / REJECT
3. lock this standard
4. produce WEEKLY wireframe
5. review against sample lineage + logic
6. produce DAILY wireframe
7. review against sample lineage + logic
8. place locked TIMER as fixed third anchor
9. cross-screen consistency audit
10. only then high-fidelity WEEKLY + DAILY
11. compare against approved references
12. self-check / regression-impact check
13. human approval
14. implementation mapping

No high-fidelity generation before steps 1–3 are closed.

## 17. Current disposition

PRESERVE:
- three-screen scope
- locked Timer lineage
- weekly simplified direction
- daily vertical direction
- Planner authority
- runtime character slot model
- exploration crew equal-ability/no-penalty rules
- badge separation from power/economy
- Snap Wish Economy ownership

ADJUST:
- older timetable samples that are too dense/colorful
- exploration decoration that competes with schedule
- legacy Mission/Focus product-language surfaces

HOLD:
- exact badge catalog activation
- exact badge award thresholds
- exact cross-app badge producer/consumer contract
- exact 20-member final visual roster
- exact special encounter cadence/probability
- any Ready display of Snap gem/wish balance

REJECT:
- six/seven-primary-screen redesign
- Time Attack as Ready product identity
- Planner Admin-style dense child UI
- gem/shop/wish controls inside Ready
- badge as level/score/power
- crew character as mandatory layout anchor
