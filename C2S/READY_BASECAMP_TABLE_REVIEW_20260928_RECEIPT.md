# TAKY Ready Base Camp preparation-table UI — staged local review receipt
Date: 2026-09-28
User direction: Use latest Weekly and Daily concept images as a changeable candidate and create layer-separated, live Planner-bound UI. SOULS main signature remains Weekly/Daily spatial-composition reference only.
This is NOT final visual approval. Do not promote to production without source/asset/visual gates.

## Isolated complete artifacts
Library: `/TAKY/READY_SET/BASECAMP_TABLE_REVIEW_20260928/`
- `READY_SET_BASECAMP_TABLE_PREVIEW_20260928.zip` SHA256 `4f348407b256a8448b28abcdede109e6793da5bc841e87b0cdf05168594bbb9e`, 1,006,004 bytes, 15 files.
- `READY_SET_BASECAMP_TABLE_SOURCE_REVIEW_20260928.zip` SHA256 `0d04e76b6503d1c86f966a2ae9425b5de2fd3919ee43d2dace9b0528d2261711`, 14,217,000 bytes, 234 files.
- `README.md`, `QA.json`, `layer_manifest.json`.
- Visual reference source screenshots are separately preserved, never used as flattened live Planner background.

## Actual code & assets staged inside ZIP (not yet GitHub binary merged)
- Six original crop-derived scene layers: Week/Day canopy, shared clean island vista, and separate near table. Crops with fade alphas; NOT a true object matte/clean plate. Source screenshots' baked text and invented avatar are NOT embedded in app background.
- `index.html` / `src/views/planner-screen-view-runtime.js` / `ready-basecamp-table-v1.css`: one preparation-table board with Week seven-column schedule; Daily vertical path; Planner items supplied through existing query and rendered as live DOM, no user FACT hardcoded.
- `preview-ready-table.html`: offline, *synthetic demo only*; no real family data saved.
- Existing Focus/Timer HTML, runtime and clock-master source compared byte-for-byte to package base.
- PowerShell candidate-preview launcher calls installed Visual Gate Prepare before any preview and never deploys.

## Source gate
37 source/asset/behavior checks PASS; ZIP integrity PASS. Original art SHA checks preserved in manifest.
Real browser visual render remains OPEN: container Chromium navigation blocked by `ERR_BLOCKED_BY_ADMINISTRATOR`; no visual PASS claimed.
GitHub binary asset upload/branch patch apply is OPEN. Do not claim packaged local source is already GitHub-integrated.

## Gate states
FUNCTIONAL_SOURCE_CORRECTION=REVIEW
LOCAL_ASSET_LAYER_SOURCE=QA_PASS
LIVE_RENDER_VISUAL_QA=OPEN
HUMAN_VISUAL_APPROVAL=OPEN
PR118_VISUAL_AUTHORITY_GATE=FAIL/HOLD
MAIN_MERGE=HOLD
NETLIFY=HOLD

The prior flat CSS substitute is explicitly rejected. This review package is a replacement candidate, not a superseding approved source.
