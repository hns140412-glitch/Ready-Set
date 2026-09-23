# CHARACTER FORMATION RUNTIME INTEGRATION — C2S CLOSURE — 2026-09-24

Status: CURRENT CLOSURE / RESUME AUTHORITY SUPPORT
Scope: Ready & Set / Learning App Family Character Formation
Branch: `taky/character-visual-id-core-2026-09-22`
Exact HEAD at closure: `47b6592f617cf6363edc069006a95a2e6d095cd7`

## 0. TAKY global slogan — authoritative meaning

`Think Again, Keep Your Key.`
- 핵심을 놓치지 말고 다시 생각하라.
- 답을 풀 열쇠는 이미 가지고 있다.

`Think Again, You’re The Key.`
- 방법을 찾고 해결하라.
- 결국 답을 만들어내는 핵심 주체는 인간이다.

Aggressive review / defensive response / rollback / validation / implementation are subordinate methods.
They MUST NOT redefine the slogans.

## 1. Inherited approved state

Previously approved state is inherited automatically.
A narrower local runtime projection does not redefine family canonical decisions.

`LOCAL_RUNTIME_PROJECTION != NEW_CANONICAL`
`APP_SPECIFIC_IMPLEMENTATION != FAMILY_WIDE_REDEFINITION`
`5_SIGNATURE_ITEMS != TOTAL_TOOL_INVENTORY`
`8_COMMON_TOOL_ASSETS != TOTAL_WORLD_TOOL_INVENTORY`

Core 6 canonical Visual IDs remain HARD_LOCK:
- 두비 / 로리 / 잉크 / 노바 / 테이크 / 제로.

Approved anchor hierarchy retained:
- CF-A01 Crew Familiarity
- CF-A02 Primary Companion Select
- CF-A03 Companion Name / Alias
- CF-A05 Signature Item

## 2. Character Formation full journey — CODED

Current runtime now includes the inherited full journey:

`Core 6 만나기
→ 동행 탐험대원 선택
→ 동행 탐험대원 이름/호칭
→ 사용자 사진
→ Signature Item
→ 탐험 방향 1
→ 탐험 방향 2
→ 시스템 자동 대비 방향
→ A/B/C 동일 아이 후보
→ 선택
→ 닮기 보정
→ Visual ID 확정
→ Shared Expedition Accent
→ Voyage / Drop
→ 섬 발견
→ 섬 이름
→ Base Camp 이동
→ Base Camp 이름
→ Ready`

Runtime implementation:
- `src/identity/character-formation-journey-runtime.js`
- version: `CHARACTER_FORMATION_JOURNEY_V01`

Front journey is NO LONGER OPEN.
Post-Visual-ID world-entry journey is NO LONGER OPEN at code-contract level.

## 3. Journey behavior locked

- Core 6 all appear before primary companion selection.
- one primary companion is selected; remaining five remain Crew.
- companion alias/display name does not mutate canonical Visual ID.
- source photo required before user Character Formation.
- Character Formation after photo remains:
  `Signature Item → Direction 1 → Direction 2 → system contrast → A/B/C same child`.
- Shared Expedition Accent changes permitted accent points only; canonical identity remains locked.
- Voyage / Drop are presentation variants to the SAME island, not permanent world forks.
- SKIP is allowed and records a skipped first-journey intro.
- island discovery/name and Base Camp move/name persist under expedition formation state.
- Ready & Set returns to home after formation READY.

## 4. Asset architecture — CODED

Manifest owner:
`assets/character-formation/asset-manifest.json`

Consumer path:
`asset-manifest.json
→ CharacterFormationAssetRuntime
→ live DOM/CSS consumers`

Implemented:
- manifest-driven asset runtime;
- hardcoded Character Formation asset paths removed from scene/view consumers;
- background / foreground / FX runtime layers;
- five Signature Item vector assets;
- eight common exploration tool assets;
- common tool runtime layer;
- CHARACTER_ONLY sensor depth;
- reduced-motion static fallback;
- missing illustration assets degrade internally instead of surfacing broken-image debugging.

Runtime vectors are structural implementation assets, not final approved visual-parity proof.

## 5. Signature Item / tool separation

Signature Item user-choice set is exactly:
- CAMERA
- COMPASS
- FIELD_NOTEBOOK
- BINOCULARS
- WATER_BOTTLE

Choose exactly one.

This does NOT replace inherited character/world tool vocabulary.
Common tools currently bound in runtime are a visible subset only.

## 6. Core 6 asset state

Canonical source lineage:
- name: `가이드☆ 여섯 친구의 찬란한 여정.png`
- file_id: `file_0000000022f0823090aec9a5d4c42aa3`
- role: LOCKED_VISUAL_ID_SOURCE_LINEAGE

Current manifest deliberately remains:
`PENDING_BINARY_ASSETS_CORE6`

Pending only:
- crew.dubi
- crew.lori
- crew.ink
- crew.nova
- crew.take
- crew.zero

Do NOT generate lookalike replacements.
Derive runtime Crew assets from the locked canonical source.

## 7. Current visual evidence ceiling

CODE / CONTRACT:
- PASS

CI at exact HEAD `47b6592f617cf6363edc069006a95a2e6d095cd7`:
- Character Formation UI Binding — SUCCESS
  run: 35871585432
- TAKY Codex Worker Self-Test — SUCCESS
  run: 35871585939

VISUAL FINAL:
- NOT YET PASS

Still required:
- Core 6 canonical derivative binaries;
- approved-anchor-grade high-density art replacement where interim vectors remain;
- 390×844 runtime capture;
- anchor regression comparison;
- visual mismatch correction if found.

## 8. Current OPEN only

OPEN-01 — Core 6 binary derivatives
Derive six Crew runtime assets directly from canonical locked Visual ID source and bind to manifest paths.

OPEN-02 — High-density asset parity
Replace interim structural vectors only where needed to reach approved anchor visual density. Do not change functional contracts.

OPEN-03 — 390×844 runtime proof
Capture Character Formation journey screens and compare against CF-A01/A02/A03/A05 hierarchy.

OPEN-04 — Family integration regression
Confirm this local projection does not redefine:
- shared island continuity;
- badge / gem / wish / blessing family systems;
- Snap & Pop five-tools-free-use rule;
- Explorer_ID / Crew relationship history.

## 9. CLOSED — do not reopen without new evidence

- Core 6 identity selection/reselection.
- fixed five Signature Item choice contract.
- photo → item → direction1 → direction2 order.
- full Character Formation journey ordering.
- shared island vs app-specific separate island question.
- Character-only sensor depth.
- approved-anchor → decomposed assets → live DOM implementation method.
- Handoff as Source of Truth.
- stale six-item Signature Item catalog.

## 10. Resume rule

Resume:
`CURRENT exact HEAD refresh
→ CURRENT pointer read
→ OPEN-01
→ OPEN-02
→ OPEN-03
→ OPEN-04
→ exact-head CI
→ close`

Do not restart broad review.
Do not rebuild closed decisions.
Do not call Netlify.
USER != DEBUGGER.
