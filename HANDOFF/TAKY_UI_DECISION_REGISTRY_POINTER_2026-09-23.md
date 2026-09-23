# TAKY UI DECISION REGISTRY POINTER — 2026-09-23 CURRENT

App: Ready-Set / Character Formation
Region: PRE-DEPARTURE PREPARATION → BASE CAMP
Status: CURRENT POINTER / DO NOT DUPLICATE

Before UI/mockup/visual implementation, read only this chain first:

1. TAKY central UI decisions:
   `C2S/LEARNING_APP_FAMILY_UI_DECISION_REGISTRY_2026-09-22.md`
2. TAKY visual/mockup lineage:
   `C2S/LEARNING_APP_FAMILY_VISUAL_MOCKUP_INTEGRATION_REGISTRY_2026-09-22.md`
3. Character Formation implementation authority:
   `C2S/CHARACTER_FORMATION_VISUAL_TO_RUNTIME_BINDING_2026-09-23.md`
4. Runtime asset authority:
   `assets/character-formation/asset-manifest.json`
5. Runtime source:
   `src/identity/`

## Locked local facts

- Core 6 Visual IDs: 두비 / 로리 / 잉크 / 노바 / 테이크 / 제로.
- Visual ID identity is HARD_LOCK. A bad derivative does not reopen the identity.
- approved anchors: CF-A01 / CF-A02 / CF-A03 / CF-A05.
- Character Formation is a before-travel packing/preparation space.
- island is destination hint only before Voyage/Drop.
- Signature Item fixed set:
  카메라 / 나침반 / 탐험 노트 / 쌍안경 / 물병.
- corrected implementation order after photo:
  `사진 → Signature Item → 방향1 → 방향2`.
- default sensor depth: CHARACTER_ONLY.
- full-screen approved mockup crop as runtime UI is forbidden.

## Residue filter

Treat as SUPERSEDED / SEARCH-EXCLUDED when conflicting with the CURRENT chain:
- old six-item Signature Item catalogs;
- wording that reopens Core 6 Visual ID;
- wording that demotes approved anchors to optional inspiration;
- generic replacement mockups;
- invented Crew assets;
- crop/overlay patch outputs;
- old runtime consumers presented as Character Formation canonical.

Treat missing binary files referenced by the asset manifest as:
`ASSET_PENDING`, not implemented and not permission to invent replacements.

## App-local legacy caution

Ready may contain older Guide/runtime assets for separate historical/product flows.
Do not delete them merely by name.
First prove whether the consumer belongs to Character Formation or another app-local Guide contract.
Only a confirmed wrong Character Formation consumer is `EXECUTION_BINDING_BYPASS / REPLACE`.

## Anti-loop

`RESIDUE_FOUND != REOPEN_CANONICAL`
`BINDING_FAILURE -> FIX_BINDING`
`DERIVATIVE_FAILURE -> REJECT_DERIVATIVE`
`CORE6_VISUAL_ID -> REMAINS_HARD_LOCK`

USER != DEBUGGER.
