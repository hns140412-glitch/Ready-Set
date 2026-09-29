# READY SHARE UI — DESIGN-TO-UI BINDING / 2026-09-29

STATUS: BOUNDED CODE + LOCAL INTERIM LAYER PACKAGE VERIFIED / GITHUB BINARY ASSET ATTACHMENT OPEN / NOT RELEASED.

## User-approved visual authority and scope
- Approved interim reference: four illustrated screens in latest 2026-09-29 conversation:
  `낙하 × 시작/완료`, `항해 × 시작/완료`, share settings, character/crew/profile and information editing, image + text in native mobile share.
- Earlier rejected polygon/flat simple Canvas scenic art is NOT the visual authority.
- No cropping the full sample UI board to fake layers. Environment, sun/canopy FX, wood logo, parchment information board, dynamic headline/missions/numbers and Profile-Visual-ID/selected crew slots have separate roles.
- Four independent 720×1030 interim scenic stages are derived from independent environment-only artwork and divided further into 12 RGBA sky/world/foreground files, NOT from user screenshot. Distinct landscape imagery is temporary, replaceable later under same contract. No child portrait, text, task, reward, badge or crew is baked into environment.

## Code integrated in Draft branch
- `src/views/share-settings-runtime.js` + `assets/share-card/ui/share-settings.css` provide a real responsive editable DOM and true image preview, four selector controls, profile identity readout, selected companion inclusion (max 3), six factual fields, reaction text and sticky share button. An unrelated profile or crew picker is not introduced.
- Existing `app.js` routes three Ready entry buttons to the share editor, preserves existing Profile/Expedition/Planner/Result owners, and passes transient share choices only to existing verified projection and `ReadyRebuildShareCard`. No new data store or child avatar regeneration.
- `src/share/share-golden-truth-runtime.js`: explicit transient theme override only; PROFILE remains default authority. Actual per-task outcome, target/focus, verified award receipt rule remain.
- `src/share/share-visual-asset-registry-runtime.js` fails closed unless it can fetch 4 staged scene WebP files and `scene-installed.json` and verify exact SHA256 bytes via secure context. Absence/HASH mismatch means no user-visible fake share image.
- Existing `src/views/share-card-runtime.js`: real 720×1280 Canvas source compositing; title, mission, original Guide/crew derivatives, actual data/verified stars, native share preview with a SECOND real button tap to `navigator.share({files:[PNG],text})`, alternate image-only and copy/download. The already generated placeholder/screenshot is never inserted as artwork.

## Binary asset package / install gate
Local archive: `TAKY_READY_SHARE_LAYERED_ASSETS_20260929.zip`, includes 4 environment-only WebP, 12 separately editable 720×1030 PNG layers, `assets/share-card/scene-installed.json`, SHA-256 report, scoped PowerShell staging script. Assets are NOT currently present in this GitHub branch (code connector accepts text but there is no verified raw-binary write path). Never mark GitHub deployment-ready before attaching the actual bytes and re-running checkout/browser screenshot.
Installer only runs in `fix/share-ui-layered-binding-20260929`; it refuses other branches. No git reset/commit/push, main merge or Netlify invocation.

## Verification / OPEN
- Latest branch syntax/Node contract and 3 new Playwright browser tests PASS: 390×844 visible controls, four modes, actual Canvas image, share config, profile theme default, crew toggling/re-selection, no profile mutation, missing binary fail-closed. CI success is not user-device visual parity.
- Local archive integrity: 4 stage SHA256, 12 separate RGBA layer hashes, each 720×1030; ZIP CRC OK.
- OPEN: attach binary files to Draft in GitHub, run actual 4-state screenshot comparisons against latest user's image, prove *real Profile Visual ID* and *actual selected crew assets*, real iPhone Safari → KakaoTalk simultaneous image + text or fallback, full cross-app regression, final human approval.
- MUST remain Draft / no main merge / no Netlify production / USER != DEBUGGER.
