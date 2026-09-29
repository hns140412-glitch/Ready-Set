# Share-card UI application / code and layered environment handoff — 2026-09-29

**Authority**: user's newly accepted INTERIM 4-card image direction. A later redesign remains possible; never replace locked Profile Visual ID or existing companions by the sample characters pictured in reference boards.

**Actual code in this branch**
- `src/share/share-settings-ui-runtime.js` and `src/share/share-settings-ui.css`: full real four-state mobile settings overlay, immediate Profile default theme, read-only approved profile avatar consent, current selected companions (maximum 3), factual field toggles, reaction text tones, actual preview entry.
- `app.js`: live Ready share buttons now enter configuration screen, not image generation or a different standalone mock; projector reads canonical Profile/Expedition/Planner/Result, keeps one-shot presentation options separate from canonical user settings.
- `src/views/share-card-runtime.js`: layered rendering with clean independent background, golden parchment SVG, logo SVG, effects SVG, live verified child Visual ID and original selected crew WebPs, mission and recorded result data. No sample character/mission/reward text is baked into scenery. Render = 720x1280 PNG. Preparation then a second real tap for `navigator.share({files:[PNG],text:caption})` through OS; no Kakao API. Copy text, image-only, save image are alternatives.
- `src/share/share-visual-asset-registry-runtime.js`: explicit `INTERIM_ACCEPTED` is supported ONLY after four binary files are present, hashes checked and local registry activated. The GitHub Draft branch currently still marks files `ASSET_PACKAGE_READY_REPO_BINDING_OPEN` and does not pretend to have binary scene art committed.
- Existing Ready `assets/share-card/ui/*.svg` and `fx/*.svg` stay independent; profile child asset is loaded through the visual projection only after approval and opt-in, not cut from the reference board.
- `tests/share-settings-ui.spec.js`: 390x844 genuine DOM screen test with four choices, disabled result when no receipt, profile/crew connection, field/tone selection and preview. Browser test uses explicitly marked synthetic fixture art, not production artwork.

**Environment art package (a separate verified ZIP handoff)**
`TAKY_READY_SHARE_UI_20260929.zip` contains:
`assets/share-card/scenes/drop-pre.webp`, `drop-result.webp`, `sail-pre.webp`, `sail-result.webp`; these four are entire independent **character-free, data-free environmental images** converted from independently authored illustration files, NOT crops of the composite example/UI screenshot. `scene-manifest.json` pins SHA-256 and source per image. `RUN_SHARE_PREVIEW.ps1` checks SHA, clones this exact Draft PR into an isolated LOCALAPPDATA review copy and binds local `INTERIM_ACCEPTED` without changing the original working directories. The ZIP exists as a conversation attachment; it is not yet a repository binary commit.

**Layer contract**
L1 independent background art (4);
L2 atmospheric effect SVG (sun / drop canopy);
L3 existing original wood logo SVG;
L4 approved child full-character Visual ID (PROFILE opt-in);
L5 existing selected crew locked-Visual-ID WebP (max 3 from Expedition; no new picker);
L6 dynamic mission/title and factual recorded metrics;
L7 existing parchment SVG and dynamic text;
L8 editable share caption and native OS sheet.

**Release gate**
Native-share UI/code/test: implemented / browser-tested; visual user-approved interim direction established. Full pixel parity with the composite reference, real approved profile asset in actual runtime, remote binary scene commit, real iPhone Kakao text+PNG delivery and PWA cache/revision remain OPEN. GH PR stays Draft. NO main merge, Netlify deploy, automatic publicity or source profile upload. USER != DEBUGGER.
