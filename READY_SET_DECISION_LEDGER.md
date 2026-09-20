# READY_SET_DECISION_LEDGER

Status: ACTIVE C2S LEDGER
Generation: READY_C2S_REWRITE_01
Disposition set: PRESERVE / MERGE / SUPERSEDE / ARCHIVE / OPEN

| Atom | Material | Disposition | Destination |
|---|---|---|---|
| RDY-C2S-001 | Ready & Set brand | PRESERVE | Product Contract |
| RDY-C2S-002 | execution/base-camp orchestrator, not timer product | PRESERVE | Product Contract |
| RDY-C2S-003 | Parent/Learning Master/Planner/Child authority split | PRESERVE | Product Contract |
| RDY-C2S-004 | one-session multi-task/lap | MERGE | Runtime State Model |
| RDY-C2S-005 | SESSION_END != TASK_COMPLETE | PRESERVE | Runtime State Model |
| RDY-C2S-006 | REV_07 per-task finalize + legacy bulk complete conflict | PRESERVE | R1 / PR #70 closed overwrite path; runtime consolidation remains open |
| RDY-C2S-007 | timestamp timing | PRESERVE | Product Contract |
| RDY-C2S-008 | Hide & Seek / Snap & Pop continuity | MERGE | Product Contract |
| RDY-C2S-009 | voice wrap-up for unresolved states | MERGE | Runtime State Model |
| RDY-C2S-010 | Capture → Review Draft → Parent Confirm → FACT | PRESERVE | Product Contract |
| RDY-C2S-011 | capture No Silent Loss | PRESERVE | Product Contract |
| RDY-C2S-012 | Local-first/Outbox/conflict | PRESERVE | Product Contract |
| RDY-C2S-013 | Parent/Child family boundary | PRESERVE | Product Contract |
| RDY-C2S-014 | live Identity/cloud roundtrip | OPEN | production verification |
| RDY-C2S-015 | Time Attack as product identity | SUPERSEDE | R2 |
| RDY-C2S-016 | Focus Mode/Focus Golden active authority | ARCHIVE | R2/R6 |
| RDY-C2S-017 | stale Time Attack manifest.json | ARCHIVE | R3 |
| RDY-C2S-018 | stale Time Attack/GitHub Pages README | SUPERSEDE | R3 |
| RDY-C2S-019 | REV_06/07 as active version authority | SUPERSEDE | Version Registry |
| RDY-C2S-020 | 0.9.3 / feature cache / REV mismatch | SUPERSEDE | R3 |
| RDY-C2S-021 | Planner real availability windows + buffers | OPEN | R5 |
| RDY-C2S-022 | child ad-hoc FACT generic confirmation gap | OPEN | R4 |
| RDY-C2S-023 | shared expedition-member authority | OPEN | consume upstream |
| RDY-C2S-024 | exploration WEEK/DAY/TODAY | PRESERVE | Product Contract |
| RDY-C2S-025 | Base Camp naming/island identity | OPEN | post-core |
| RDY-C2S-026 | Imagination Cloud call | OPEN | post-core |
| RDY-C2S-027 | exact current main CI/runtime failing | OPEN | R7 |
| RDY-C2S-028 | DEVICE_VERIFIED not run | OPEN | later gate |
| RDY-C2S-029 | PRODUCTION_VERIFIED not run | OPEN | later gate |
| RDY-C2S-030 | Learning Engine version independent | PRESERVE | Version Registry |
| RDY-C2S-031 | validation evidence keyed by SHA | PRESERVE | Validation Status |
| RDY-C2S-032 | append-only REV_08 approach | SUPERSEDE | semantic canonical docs |
| RDY-C2S-033 | historical REV docs retained as provenance | ARCHIVE | R6 |

## Coverage
Recovered atoms registered here: 33.
UNMAPPED_MATERIAL=0 and SILENT_LOSS=0 within the declared whole-product rewrite-review scope.
This does not claim recovery of inaccessible historical raw turns.

## Rewrite sequence
R0 canonical ledger/skeleton
R1 single session engine
R2 product language/UI authority
R3 version/build/validation/manifests/README
R4 generic Child FACT confirmation
R5 Planner real free-window semantics
R6 absorb compatibility overlays + archive old active authorities
R7 exact-main CI/runtime repair and release reclassification
