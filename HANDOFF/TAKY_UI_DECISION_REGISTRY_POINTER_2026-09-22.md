# TAKY UI DECISION REGISTRY POINTER — 2026-09-25 CURRENT

App: Ready-Set
Region: BASE CAMP / ISLAND MAP

## Pointer status
The prior pointer target:
`TAKY/C2S/LEARNING_APP_FAMILY_UI_DECISION_REGISTRY_2026-09-22.md`
is not present on TAKY main and MUST NOT be treated as a live canonical source.

Current working recovery registry:
- repo: hns140412-glitch/TAKY
- branch: `taky/learning-app-family-ui-visual-2026-09-23`
- file: `C2S/LEARNING_APP_FAMILY_UI_DECISION_REGISTRY_2026-09-23.md`
- status: WORKING IMPLEMENTATION REGISTRY / NOT MERGED

This working registry is for cross-app conflict detection and alignment only.
It MUST NOT be silently promoted to canonical family authority while MERGE HOLD remains active.

## Ready authority order during HOLD
1. latest direct user correction
2. Ready app-local CLOSED/LOCKED decisions
3. working 2026-09-23 cross-app registry for conflict detection
4. runtime/code reality

Rules:
- preserve FAMILY_LOCKED and app-local LOCKED decisions;
- do not promote PROVISIONAL/OPEN/WORKING decisions to canonical family authority;
- do not copy another app's local UI solution as a family lock;
- conflicts must be surfaced, not silently harmonized;
- high-fi/mockup alone does not create FINAL_VISUAL_LOCK;
- when a canonical central registry is restored/merged, refresh this pointer explicitly.

Current Ready-side alignment is recorded in:
`HANDOFF/READY_SHARED_UI_VISUAL_REGISTRY_ALIGNMENT_CURRENT_2026-09-25.md`.
