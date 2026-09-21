# Ready & Set Focus Golden Reference — REV_01

> **ARCHIVED LEGACY AUTHORITY — NOT CURRENT SOURCE OF TRUTH**
> Current Ready authority: `READY_SET_CANONICAL_PRODUCT_CONTRACT.md` → `READY_SET_RUNTIME_STATE_MODEL.md` → `READY_SET_DECISION_LEDGER.md`.
> This file is preserved for provenance/recovery only. Specific content is active only when explicitly preserved by the current canonical.

> Status: PRESERVED VISUAL REFERENCE / LEGACY AUTHORITY ISOLATED
> Date: 2026-09-14
> Applies to: Ready & Set Focus / Time Attack screen
> Current semantic authority: `READY_SET_CANONICAL_PRODUCT_CONTRACT.md` + `READY_SET_RUNTIME_STATE_MODEL.md`; this file remains a visual reference only. Historical parent lineage: REV_07 → REV_06.
> Brand line: **그냥! 지금 하면 돼!**

## 0. CANONICAL VISUAL SOURCE — HARD LOCK

The canonical visual source is the **combined Phone + Tablet Focus UI image**, not the older phone-only timer reference.

Canonical file name:
`Ready_Set_Focus_UI_Phone_Tablet_Golden_Reference_REV_01.jpeg`

Persistent copies:
- ChatGPT Library: `/Ready_Set/Golden_References/Ready_Set_Focus_UI_Phone_Tablet_Golden_Reference_REV_01.jpeg`
- Google Drive: `/TAKY/Ready_Set/Golden_References/Ready_Set_Focus_UI_Phone_Tablet_Golden_Reference_REV_01.jpeg`
- Google Drive file ID: `1LWObXKC-XeXqiZFAuw4RYjGbABctOPTy`

This image is the approved responsive UI visual reference showing both:
- PHONE = centered full Focus stage
- TABLET = same Focus stage right-anchored, with Yellow background expanded to the left

The previous phone-only image `Ready_Set_Focus_Timer_Golden_Reference_REV_01.jpeg` is supporting/legacy reference only and MUST NOT override this combined Phone+Tablet Golden.

A new conversation, Codex session, agent, or handoff SHALL search for and open this canonical file before claiming that the original visual source is missing.

`PHONE-ONLY TIMER IMAGE != FINAL RESPONSIVE GOLDEN`
`FINAL RESPONSIVE GOLDEN = PHONE + TABLET COMBINED UI IMAGE`

## 1. PURPOSE — HARD LOCK

This file exists so a new conversation, agent, Codex session, handoff, or implementation task can reproduce the approved Focus UI without depending on an old chat screenshot.

`RULE EXISTS BUT ORIGINAL IMAGE IS NOT AVAILABLE` is NOT an acceptable stopping condition while the canonical image and this contract are recoverable.

The canonical reconstruction route is:

`CANONICAL PHONE+TABLET IMAGE → THIS FILE → Ready_Set_Ui_Master_Logic_REV_07.md → inherited REV_06 Golden rules → index.html Focus DOM → styles.css Focus composition → app.js/runtime behavior → actual rendered result`

## 2. APPROVED VISUAL IDENTITY — HARD LOCK

The approved Focus screen is a single high-density composition, not a generic dashboard.

Required visual hierarchy:
1. vivid Focus Yellow background
2. oversized black two-line headline: `그냥! / 지금 하면 돼!`
3. white/ivory mission pill below headline
4. large full circular White/Ivory analog clock hero
5. handwritten encouragement copy around the clock
6. black/dark charcoal control panel below the clock
7. remaining time as primary numeric information
8. target time as secondary numeric information
9. mission + BGM state row
10. two primary action buttons: `잠깐 멈춤` / `완료했어요`
11. start / focus / issue time row
12. floating music control at upper-right inside app UI

The result SHALL preserve the visual relationship among these items, not merely contain similar components.

## 3. OS STATUS BAR / SAFE AREA — HARD LOCK

Do not draw or fake device time, cellular signal, Wi-Fi, battery, Dynamic Island or notch artwork.
Those belong to the operating system.
Implementation starts below the real safe area using `env(safe-area-inset-*)`.

## 4. NO CROPPED SCREENSHOT IMPLEMENTATION — HARD LOCK

The approved image SHALL NOT be used as a flattened full-screen background, crop, or image-map substitute for the live UI.
All functional UI is recreated as live HTML/CSS/SVG/Canvas/DOM elements as appropriate.
The analog clock, timer values, mission data, BGM state, buttons, and session stats MUST remain live and accessible.

## 5. ANALOG CLOCK — LIVE CURRENT TIME — HARD LOCK

The analog clock is a real current-time clock, not a fixed decorative illustration.
- second hand angle = `seconds * 6deg + milliseconds * 0.006deg`
- minute hand angle = `minutes * 6deg + seconds * 0.1deg`
- hour hand angle = `(hours % 12) * 30deg + minutes * 0.5deg + seconds / 120deg`

The Focus countdown remains separate from current local clock time.
Clock visual lock: complete uncropped White/Ivory circle, thin rim, black numerals/hands, thin yellow/gold second hand, premium depth, `Ready & Set` center branding.

## 6. PHONE COMPOSITION — HARD LOCK

`PHONE = CENTERED FULL STAGE`
- preserve approved vertical hierarchy
- no crop
- no arbitrary bottom nav/tool dock in Focus
- maintain proportions across common phone widths
- primary touch targets approximately 44 CSS px or larger

## 7. TABLET COMPOSITION — RIGHT-HAND TOUCH ANCHOR — HARD LOCK

`TABLET/WIDE = RIGHT-ANCHORED FULL STAGE + LEFT BACKGROUND EXPANSION`

This is part of the same canonical UI, not a separate redesign.
- same internal Stage ratio/order/visual relationships as phone
- Stage does not stretch across tablet width
- whole Stage moves to the right touch zone
- keep right safe-area / edge comfort spacing
- left side expands only the Yellow illustration/background canvas
- no two-column dashboard transformation
- Pause / Complete remain in the same control-panel relationship

## 8. BACKGROUND EXPANSION — HARD LOCK

Extendable: Yellow field, orange speed/radial lines, stars, glow, nonfunctional decorative strokes.
Composition lock: headline, mission pill, clock, handwritten copy, dark panel, timer values, buttons, stat rows.

## 9. FUNCTION ↔ UI MAPPING — HARD LOCK

The Focus screen remains a live session surface. Mission pill maps to active task, analog clock maps to current local time, Remaining/Target map to session timing, BGM controls actual sound state, Pause creates explicit pause/issue state, Complete follows current task/session semantics, REC appears conditionally for relevant English recording missions, and Start/Focus/Issue stats are timestamp-derived.

## 10. VISUAL REGRESSION FAIL CONDITIONS

FAIL if any occur:
- generic dashboard replaces approved composition
- clock becomes small/cropped/thick black style
- tablet becomes functional split dashboard
- Stage stretches across tablet width
- tablet key controls leave right-hand touch zone
- OS status graphics are drawn into app UI
- screenshot substitutes for live controls
- analog hands are static
- session/BGM/app-switch behavior resets timing

## 11. REPOSITORY IMPLEMENTATION ROUTE — RECOVERY CONTRACT

- `index.html` → Focus DOM
- `styles.css` → Focus composition/responsive layout
- `app.js` / `ready-runtime-v07.js` → live session/clock behavior
- `Ready_Set_Ui_Master_Logic_REV_07.md` → current project logic
- `Ready_Set_Ui_Master_Logic_REV_06.md` → inherited detailed Golden rules
- `Ready_Set_Focus_UI_Phone_Tablet_Golden_Reference_REV_01.jpeg` → canonical visual witness
- this file → canonical responsive/touch contract

A future conversation SHALL inspect these sources before making a missing-source claim.

END — READY & SET FOCUS GOLDEN REFERENCE REV_01
