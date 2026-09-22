# READY & SET REBUILD MANIFEST V01

## Preserve as domain assets
- ready-learning-master-v01.js
- ready-integration-v1.js
- verified Planner rules/contracts from ready-planner-v01.js
- verified session semantics from ready-runtime-v07.js
- existing Learning App Family contract behavior

## Rewrite/split targets
- app.js -> shell + feature views + event wiring
- ready-planner-v01.js -> planner-domain + planner-store + planner-projection
- ready-runtime-v07.js -> session-domain + session-orchestrator + session-view adapter

## Target tree
src/
  shell/
  schedule/
  assignment/
  learning/
  planner/
  session/
  integrations/
  persistence/
  views/

## Migration order
R0 shell/store boundary
R1 planner domain extraction
R2 schedule + assignment intake
R3 session orchestration
R4 views/navigation
R5 integration adapters
R6 old-path removal after parity regression

## Guard
No feature is counted as migrated until STRUCTURE/FUNCTIONAL/JOURNEY/UI_UX/RUNTIME evidence exists.

## External character integration boundary
- Character Visual ID is developed independently.
- Ready owns only the future consumer adapter for `CHARACTER_VISUAL_ID_PROJECTION_V01`.
- Integration contract: `INTEGRATION/CHARACTER_VISUAL_ID_CONTRACT_V01.md`.
