# READY & SET — BASE CAMP UI C2S CLOSURE — 2026-09-22

Status: C2S_COMPILE_CLOSED / UI_DECISION_PACKET_READY / HIGH_FI_NOT_LOCKED
Scope: Ready & Set Base Camp UI only
Branch: `taky/ready-rebuild-v01-2026-09-21`
Reviewed HEAD: `fa5ad34a873a2039a76bc28f48f7c5f031f52e86`

## 0. Authority / precedence

Apply in this order:
1. latest direct user correction
2. TAKY FAMILY_LOCKED decisions
3. Ready app-local LOCKED decisions
4. recovered Library visual lineage / approved assets
5. current Ready canonical runtime/domain contracts
6. cross-app ownership contracts
7. implementation feasibility
8. historical mockups / assistant proposals

Do not silently promote another app's local UI to family authority.
Do not infer FINAL_VISUAL_LOCK from a generated mockup.

## 1. Ready UI ownership boundary — LOCKED

Ready & Set is the shared-island **BASE CAMP UI**.

Ready owns:
- Base Camp visual/UI
- Planner projection
- weekly/daily schedule presentation
- Weekly → Daily → Timer continuity
- Timer/session handoff
- Base Camp route gateways to specialist regions

Ready does NOT own:
- Explorer character creation
- Exploration Crew construction/selection
- crew personality/catalog
- whole-island character onboarding
- Snap gem/wish/blessing economy
- Hide vocabulary/memory authority

Resolved character/crew identity is injected by ID/state. Ready must work without a fixed character asset.

## 2. Three-screen scope — LOCKED

Exactly three primary Ready screens:

1. WEEKLY = **이번 주 여정**
2. DAILY = **오늘의 탐험길**
3. TIMER = **그냥! 지금 하면 돼!**

Mission / Focus / Wrap / Result / Parent approval / carry-over / capture / evidence are not new primary screens by default.
Use component / state / sheet / modal / overlay / inline expansion first.

Fourth primary screen requires OPEN → impact review → regression review → HUMAN APPROVAL.

## 3. Timer disposition — app-local LOCKED

Timer visual direction is already confirmed and assets exist.

Status:
- visual composition = LOCKED
- asset lineage = EXISTING
- redesign = FORBIDDEN unless explicitly reopened

Allowed:
- runtime binding
- Weekly/Daily → Timer handoff
- session/task/BGM/REC/completion state binding
- 390×844 regression checks
- implementation bug fixes preserving visual intent

Not allowed:
- alternative Timer mockups
- new generic bottom nav
- new island artwork replacing Timer asset language
- badge/gem/crew clutter

## 4. Shared island / Base Camp interpretation — FAMILY_LOCKED inheritance

ONE ISLAND is world topology, not a requirement to cover every screen in island artwork.

- fixed island geography
- Ready = Base Camp / island hub
- Hide = jungle / waterfall region
- Snap = beach region
- app switch = movement within one island
- current companion continuity persists across regions
- island/base-camp rename never resets learning history or ownership

Ready three-screen interpretation:
- Weekly = Base Camp에서 이번 주 전체 경로를 멀리 봄
- Daily = 오늘 이동 경로를 가까이 봄
- Timer = 탐험 지점에 도착해 지금 수행

The three screens are a change of viewing distance, not separate worlds.

## 5. Visual direction — current LOCK_CANDIDATE

Primary hierarchy:
**PLANNER FIRST → BASE CAMP SECOND → CHARACTER OPTIONAL**

Current direction:
- world-first spatial depth inspired by SOULS-like composition
- do NOT copy SOULS dark fantasy art
- Base Camp / island environment should remain visible
- Planner appears as floating translucent/frosted information layer
- avoid opaque pastel tiles covering the whole world
- use one large glass/frosted Planner surface rather than many heavy cards where possible
- actual schedule readability remains first priority
- character style must match approved upstream explorer character lineage
- character may appear in world, but must not own layout

This is a current design direction, not FINAL_VISUAL_LOCK.

## 6. Weekly — `이번 주 여정`

Purpose:
see the week quickly from Base Camp.

Required:
- Mon–Sun
- fixed commitments
- Planner DATED TODO
- meaningful free windows
- today marker
- progress/completion only when useful
- selected day → Daily transition

Rules:
- simpler than previous dense planner samples
- no admin spreadsheet feel
- no giant world-map UI
- island/Base Camp atmosphere visible but secondary to weekly readability
- exact detail belongs to Daily
- no invented persistent global navigation

## 7. Daily — `오늘의 탐험길`

Purpose:
today's actual chronological route.

Required:
- vertical timeline
- pre-school tasks when Planner demo/runtime provides them
- fixed commitments
- Planner DATED TODOs
- free time
- current/next item
- direct Timer start
- carry/reflow state only if needed

Semantics must visibly distinguish:
- fixed commitment
- today's task
- free window

Do not fill unknown real times by inference.

## 8. Planner semantics — LOCKED

`Schedule Commitment != Assignment Fact != DATED TODO != Progress Event`

Hard rules:
- school/academy/fixed schedule = occupied time, not automatically a task
- Planner alone owns date/time allocation
- Free Window != Required Study Time
- Learning Master does not directly allocate times
- Timer does not create DATED TODO
- Parent capture does not silently place study blocks

## 9. Mockup data — LOCKED for review

Planner may use synthetic demo data for visual review.

Status: `MOCKUP_ONLY / SYNTHETIC`

Rules:
- never treat demo schedule as learner FACT
- no private family schedule hardcoded into assets
- unknown real times stay unknown
- sample schedule may change freely between review passes
- visual approval != schedule-content approval

Demo set should stress-test:
- pre-school task
- school
- academy/activity
- Planner task
- free window
- completed item
- next item

## 10. Character / Exploration Crew boundary — LOCKED

Ready consumes only resolved identity/presence.

Canonical shared rules:
- 탐험가 / 탐험대 / 탐험대원 / 탐험대 규칙
- equal functional capability
- differences only in personality/expression/relationship/memory
- no grading/final-answer authoring/mockery
- no permanent large speech bubble
- switching crew never alters learning records/rewards

Ready:
- must not reconstruct crew system
- may provide optional presence/reaction slot
- must remain complete without a character asset

## 11. Badge / reward / economy boundary — LOCKED

`BADGE != EXP != GEM != AFFINITY != CHARACTER LEVEL != WORLD STATE`

Badge:
- process/experience record
- not score/power/ranking
- historical ~60 catalog = working draft, not auto-active

Wish economy:
Canonical owner = `SNAP_POP_WISH_ECONOMY`

Ready must not:
- spend gems
- execute wishes/blessings
- place wish shop in Weekly/Daily/Timer
- reinterpret Snap economy as shared Ready reward

## 12. Wording — LOCKED

Primary:
- Weekly: **이번 주 여정**
- Daily: **오늘의 탐험길**
- Timer: **그냥! 지금 하면 돼!**

Prefer:
여정 / 탐험길 / 출발 / 다음 탐험 / 쉬어가기 / 돌아보기 / 지금 할 일

Avoid as default:
작전 / 작전판 / 작전실 / 전투 / 클리어 / 보상 획득

## 13. Motion / effect direction — LOCK_CANDIDATE

Research/application direction:
- View Transition-style Weekly → Daily continuity
- 250–400ms short spatial transition
- panel movement/scale should imply moving closer within same island
- subtle current-time pulse
- subtle elevation for current/next task
- short completion scale/opacity
- ambient world motion: flag / grass / cloud / water only
- character idle: breathing / eye movement only
- `prefers-reduced-motion` support required

Reject:
- perpetual panel wobble
- fireworks/glow/game FX
- motion that outranks schedule reading
- effect-only information

## 14. Commercial-reference rule — LOCKED process

Before next high-fi mockup, review:
- commercial Planner/Calendar apps
- travel itinerary timeline apps
- child-friendly planner/schedule apps
- glass/frosted mobile UI
- exploration/adventure world-first layouts
- public GitHub UI/PWA examples
- public Netlify deployments / dev community examples

For each useful reference, record:
- why it works
- why it fails
- what Ready can adopt
- what Ready must not copy

Do not collect images without extracting the design principle.

## 15. Rejected mockup lineage

Rejected:
- island-map-first Weekly
- generic quest-list Daily
- invented fixed characters
- invented persistent bottom nav
- regenerated Timer
- opaque tile-heavy schedule surfaces
- world illustration dominating planner legibility

Existing rejection record:
`C2S/READY_SET_UI_MOCKUP_REVIEW_REJECT_01_2026-09-22.md`

Rule:
rejected visual lineage is regression evidence, not inspiration baseline.

## 16. Recovered Library visual lineage

Use as evidence/reference, not automatic authority:
- `노란 집중 타이머 앱 화면.png`
- `노란 집중 타이머 앱 화면(2).png`
- `노란 집중 타이머 앱 화면(3).png`
- `파스텔 키즈 플래너 앱 UI 디자인 스펙.png`
- `image-gen-1(10).png`
- `image-gen-2(10).png`

Recovered user corrections:
- Weekly simpler
- Daily vertical
- actual-app UI, not presentation board
- Timer preserved, not redesigned

## 17. Next work gate

Do NOT jump straight to high-fi.

Next sequence:
1. live refresh branch + read UI registry pointer
2. read this closure + 3-screen standard + reject record
3. recover/review commercial examples
4. classify references: PRESERVE / ADJUST / REJECT
5. define low-fi Weekly structure
6. validate semantics/readability
7. define low-fi Daily structure
8. validate semantics/readability
9. define shared Base Camp translucent-layer composition
10. verify Timer connection only
11. 390×844 visibility / contrast / motion review
12. only then create high-fi Weekly + Daily
13. compare against locked criteria
14. HUMAN APPROVAL before implementation freeze

## 18. Current state

FAMILY_LOCKED:
- ONE ISLAND continuity
- app-region ownership
- companion continuity

READY app-local LOCKED:
- 3 primary screens
- wording
- Timer existing visual/assets
- Planner semantic separation
- Ready = Base Camp UI only
- no character-system duplication
- no Snap wish-economy duplication

LOCK_CANDIDATE:
- world-first Base Camp composition
- translucent/frosted Planner layer
- SOULS-like spatial composition reference
- motion/effect direction

OPEN:
- exact Weekly composition
- exact Daily composition
- exact opacity/blur values
- exact Base Camp environment asset
- exact character placement
- exact motion timings/easings after prototype

SUPERSEDED/REJECTED:
- 6/7-screen Ready IA
- regenerated Timer mockups
- opaque tile-heavy planner
- map-first Weekly
- generic quest-list Daily
- Ready-owned character/crew construction
