# CHARACTER FORMATION UI / WORLD STYLE HANDOFF — 2026-09-22 LATEST

Status: READY_FOR_NEW_CHAT
Branch: `taky/character-visual-id-core-2026-09-22`

## Read first

1. `C2S/CHARACTER_FORMATION_UI_WORLD_STYLE_C2S_CLOSURE_2026-09-22.md`
2. `C2S/CHARACTER_FORMATION_UI_WORLD_STYLE_ATOMS_2026-09-22.json`
3. `C2S/CHARACTER_VISUAL_ID_CORE_C2S_CLOSURE_2026-09-22.md`
4. `C2S/CHARACTER_VISUAL_ID_CORE_ATOMS_2026-09-22.json`
5. `INTEGRATION/CHARACTER_VISUAL_ID_PROJECTION_V02.md`
6. `HANDOFF/CHARACTER_VISUAL_ID_CORE_HANDOFF_2026-09-22.md`

## New-chat purpose

Continue Character Formation UI design without recreating settled structure.

Do NOT start by generating a new mockup.

First recover:
- exact approved Character Formation sample(s);
- exact locked companion Visual ID references for Dubi/Tori/Ink/Nova/Take/Zero;
- latest user corrections from the UI/World Style C2S closure.

Then classify:
`PRESERVE / ADJUST / ADD / FORBIDDEN`

Only after that, produce a delta-edited mockup.

## Hard locks

- Character Formation sample = UI base.
- Packing/travel prep = context layer.
- User character does not appear completed before A/B/C.
- Two direct mood selections only.
- Third direction = system auto contrast.
- Signature Item = exactly one minimal packing item.
- Companion Visual IDs are hard locked and mood-independent.
- All six companions appear during formation for familiarity.
- One primary companion is selected; other five remain active crew.
- canonical_name is immutable; display_name may change.
- nickname/history flows into encyclopedia/history.
- motion is subtle and state-driven, not spectacle.
- final UI mockup is NOT yet locked.

## Character World Style

Unify via:
- rendering
- lighting
- materials
- exploration apparel grammar
- equipment family
- emblem/patch system
- environment palette

Do NOT unify by forcing identical anatomy.

User:
- human/photo-based
- more natural proportion
- source-photo likeness
- protagonist

Companions:
- locked chibi/SD animal Visual IDs
- fixed silhouettes
- personality/action changes only

Key sentence:
`같은 세계의 옷을 입고, 같은 빛 아래 서 있지만, 각자는 자기 몸과 얼굴을 가진다.`

## Companion behavior

Make them lively and witty in personality-specific ways.
Do not make all six bounce or perform identical animations.

Examples:
- Dubi over-eager and first forward.
- Tori calms/organizes.
- Ink analyzes alternatives.
- Nova wants to leave immediately.
- Take checks the checklist.
- Zero offers soundtrack/encouragement.

## Visual environment

Preferred:
warm pre-departure basecamp, luggage, maps, notebook, compass, warm light, layered depth, world visible outside.

Avoid:
sterile white-only background, full storybook redesign, RPG HUD, excessive fantasy-world dominance before departure.

## Motion references

Use only as implementation references:
- subtle stagger
- tap/selection feedback
- short enter/exit
- item-settle
- soft candidate reveal
- reduced-motion support

Do not let public GitHub/Netlify examples supersede the canonical UI.

## Evidence state

Character Core code/CI remains separate from UI status.

UI:
- final design = NOT_LOCKED
- latest generated mockups = REFERENCE_ONLY
- base UI recovery required before next render

Character Core:
- independent core exists
- Projection V02
- external provider runtime still NOT_RUN
- device validation still NOT_RUN

## Start prompt for new chat

```
최신 TAKY 기준으로 Character Formation UI / Character World Style 작업을 재개해.

먼저 GitHub hns140412-glitch/Ready-Set의
taky/character-visual-id-core-2026-09-22 브랜치를 live refresh하고 아래를 순서대로 읽어.

1. C2S/CHARACTER_FORMATION_UI_WORLD_STYLE_C2S_CLOSURE_2026-09-22.md
2. C2S/CHARACTER_FORMATION_UI_WORLD_STYLE_ATOMS_2026-09-22.json
3. C2S/CHARACTER_VISUAL_ID_CORE_C2S_CLOSURE_2026-09-22.md
4. C2S/CHARACTER_VISUAL_ID_CORE_ATOMS_2026-09-22.json
5. INTEGRATION/CHARACTER_VISUAL_ID_PROJECTION_V02.md
6. HANDOFF/CHARACTER_FORMATION_UI_WORLD_STYLE_HANDOFF_2026-09-22_LATEST.md

중요:
- 새 시안을 먼저 만들지 마.
- 기존 확정 Character Formation 샘플과 확정 탐험대원 Visual ID를 먼저 복원해.
- PRESERVE / ADJUST / ADD / FORBIDDEN 분류 후 delta edit만 해.
- 짐싸기/여행준비는 context layer이고 기존 UI를 대체하지 않는다.
- 사용자 캐릭터와 동행 탐험대는 anatomy를 억지로 통일하지 말고 Character World Style로 통합한다.
- 두비/로리/잉크/노바/테이크/제로 Visual ID는 HARD LOCK이며 user mood에 종속되지 않는다.
- 6명 모두 구축 과정에 등장해 익숙해지게 하고 1명을 primary companion으로 선택한다.
- canonical_name은 보존하고 display_name/과거 이름/이력은 도감에 축적한다.
- 사용자 캐릭터는 A/B/C 이전에 완성형으로 노출하지 않는다.
- 최종 UI는 아직 NOT_LOCKED다.
```
