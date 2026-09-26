# READY & SET — BASE CAMP UI HANDOFF — 2026-09-22 LATEST

Status: READY_FOR_NEW_CHAT / C2S_COMPILE_CLOSED
Repo: `hns140412-glitch/Ready-Set`
Branch: `taky/ready-rebuild-v01-2026-09-21`
C2S closure commit: `94518be46c75f9d683e32c6dde15adde98b9bf09`

## Read first

1. `HANDOFF/TAKY_UI_DECISION_REGISTRY_POINTER_2026-09-22.md`
2. `C2S/READY_SET_BASE_CAMP_UI_C2S_CLOSURE_2026-09-22.md`
3. `C2S/READY_SET_3_SCREEN_UI_DESIGN_STANDARD_2026-09-22_REV1.md`
4. `C2S/READY_SET_UI_MOCKUP_REVIEW_REJECT_01_2026-09-22.md`

If available in TAKY, also read:
- `C2S/LEARNING_APP_FAMILY_UI_DECISION_REGISTRY_2026-09-22.md`
- `C2S/LEARNING_APP_FAMILY_SHARED_ISLAND_WORLD_TOPOLOGY_2026-09-22.md`

## Current locked UI scope

Ready & Set = **Base Camp UI only**.

Primary screens = exactly 3:
- `이번 주 여정`
- `오늘의 탐험길`
- Timer `그냥! 지금 하면 돼!`

Timer is already visual-locked and asset-ready. Do not redesign it.

New visual work scope:
- Weekly
- Daily

Character / Exploration Crew construction is being handled in another conversation/workstream. Ready only consumes resolved IDs/assets.

## Current visual direction

Do not use the latest failed mockups as baseline.

Target:
`PLANNER FIRST → BASE CAMP SECOND → CHARACTER OPTIONAL`

Concept:
- fixed island / Base Camp environment remains visible
- SOULS-like world-first composition is a composition reference only
- Planner floats above the world as translucent/frosted UI
- schedule readability remains stronger than illustration
- avoid opaque pastel tile walls
- avoid giant island map as Weekly
- avoid generic quest list as Daily
- character assets injected later from upstream character system

## Weekly

Label: `이번 주 여정`

Purpose:
- see one week quickly from Base Camp

Need:
- Mon–Sun
- fixed commitments
- Planner DATED TODO
- free windows
- today marker
- optional progress
- selected day → Daily

Keep it simpler than historical dense weekly samples.

## Daily

Label: `오늘의 탐험길`

Purpose:
- follow the real chronological route for today

Need:
- pre-school task when present
- fixed schedule
- Planner tasks
- free time
- current/next
- Timer start
- clear semantic distinction between commitment/task/free window

## Timer

LOCKED existing visual and assets.

Allowed:
- continuity checks
- runtime binding
- regression verification

Forbidden:
- alternative mockup
- restyle
- new island-art replacement
- generic bottom nav

## Motion / effects

Research examples from GitHub / public Netlify deployments / commercial apps before high-fi.

Preferred:
- Weekly → Daily spatial continuity
- View Transition style
- 250–400ms
- subtle ambient world motion
- subtle current-time pulse
- small current/next elevation
- reduced-motion support

No game-FX overload.

## Demo data

Planner may generate synthetic schedule data for mockup review.
Mark it `MOCKUP_ONLY / SYNTHETIC`.
Never treat it as learner FACT.

## Next exact sequence

1. live refresh branch
2. read the documents above
3. research commercial/reference examples
4. extract design principles, not just screenshots
5. classify PRESERVE / ADJUST / REJECT
6. create low-fi Weekly structure
7. validate readability + semantics
8. create low-fi Daily structure
9. validate readability + semantics
10. define shared Base Camp/world + translucent Planner composition
11. verify Timer connection only
12. 390×844 contrast/motion/accessibility review
13. only then generate high-fi Weekly + Daily
14. compare against C2S locks before presenting

## Critical prohibitions

- do not invent extra primary screens
- do not redesign Timer
- do not build character creation in Ready
- do not make Weekly a game map
- do not make Daily a quest log
- do not cover the island with opaque colored tiles
- do not invent global navigation for mockup convenience
- do not merge badge/gem/wish/affinity into one growth score
- do not use Snap wish economy inside Ready
- do not claim FINAL_VISUAL_LOCK from a generated image

## New-chat success condition

The next chat should first produce a **reference-driven low-fi Weekly/Daily UI structure** that passes:
- TAKY scope
- Planner semantics
- Base Camp continuity
- visual legibility
- 390×844 usability

Only after that should high-fidelity visual generation resume.
