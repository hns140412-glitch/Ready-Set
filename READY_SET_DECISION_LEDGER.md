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
| RDY-C2S-006 | REV_07 per-task finalize + legacy bulk complete conflict | PRESERVE | R1 / PR #70 closed overwrite path; PR #97 consolidated one Planner-active task/runtime ownership |
| RDY-C2S-007 | timestamp timing | PRESERVE | Product Contract |
| RDY-C2S-008 | Hide & Seek / Snap & Pop continuity | MERGE | Product Contract |
| RDY-C2S-009 | voice wrap-up for unresolved states | MERGE | Runtime State Model |
| RDY-C2S-010 | Capture → Review Draft → Parent Confirm → FACT | PRESERVE | Product Contract |
| RDY-C2S-011 | capture No Silent Loss | PRESERVE | Product Contract |
| RDY-C2S-012 | Local-first/Outbox/conflict | PRESERVE | Product Contract |
| RDY-C2S-013 | Parent/Child family boundary | PRESERVE | Product Contract |
| RDY-C2S-014 | live Identity/cloud roundtrip | OPEN | production verification |
| RDY-C2S-015 | Time Attack as product identity | SUPERSEDE | R2 complete / visible branding removed / PR #134 exact-main verified |
| RDY-C2S-016 | Focus Mode/Focus Golden active authority | ARCHIVE | R2/R6 |
| RDY-C2S-017 | stale Time Attack manifest.json | SUPERSEDE | R3 cleanup complete / unused legacy manifest removed / PR #134 exact-main verified |
| RDY-C2S-018 | stale Time Attack/GitHub Pages README | SUPERSEDE | R3 complete / README canonical / PR #137 exact-main verified |
| RDY-C2S-019 | REV_06/07 as active version authority | SUPERSEDE | Version Registry |
| RDY-C2S-020 | 0.9.3 / feature cache / REV mismatch | SUPERSEDE | R3 complete / descriptor + cache + runtime version unified / PR #137 exact-main verified |
| RDY-C2S-021 | Planner real availability windows + buffers | PRESERVE | R5 complete / PR #132 exact-main verified |
| RDY-C2S-022 | child ad-hoc FACT generic confirmation gap | PRESERVE | R4 implemented / exact-main regression verified |
| RDY-C2S-023 | shared expedition-member authority | MERGE | read-only TAKY Crew authority consumer / validation pending |
| RDY-C2S-024 | exploration WEEK/DAY/TODAY | PRESERVE | Product Contract |
| RDY-C2S-025 | Base Camp naming/island identity | OPEN | post-core |
| RDY-C2S-026 | Imagination Cloud call | OPEN | post-core |
| RDY-C2S-027 | exact current main CI/runtime failing | SUPERSEDE | R7 complete on main 8ccd81ef7c2fbf36b7c410fc9eb33e0cc79c4bbc |
| RDY-C2S-028 | DEVICE_VERIFIED not run | OPEN | later gate |
| RDY-C2S-029 | PRODUCTION_VERIFIED not run | OPEN | later gate |
| RDY-C2S-030 | Learning Engine version independent | PRESERVE | Version Registry |
| RDY-C2S-031 | validation evidence keyed by SHA | PRESERVE | Validation Status |
| RDY-C2S-032 | append-only REV_08 approach | SUPERSEDE | semantic canonical docs |
| RDY-C2S-033 | historical REV docs retained as provenance | ARCHIVE | R6 |
| RDY-C2S-034 | Parent period-scoped fixed timetable + voice review/confirm editing | PRESERVE | Planner constraint input / Parent Admin / PR #130 exact-main verified |
| RDY-C2S-035 | Parent-confirmed lifestyle buffers: travel/meal/preparation/rest/safety | PRESERVE | R5 / Planner constraint input / PR #132 exact-main verified |
| RDY-C2S-036 | visible product identity uses Ready & Set / Base Camp / exploration language; timing remains execution aid | PRESERVE | R2 complete / product-language regression gate / PR #134 exact-main verified |
| RDY-C2S-037 | semantic release identity has one authority; mirrors cannot invent version/build state | PRESERVE | R3 complete / ready-release-v01.js + consistency gate / PR #137 exact-main verified |
| RDY-C2S-038 | actual runtime version must equal release descriptor runtime_version | PRESERVE | R3 complete / ReadySetRev07.version regression gate / PR #137 exact-main verified |
| RDY-C2S-039 | Ready local guide type is presentation only, not shared Crew identity authority | MERGE | shared Crew consumer boundary / regression gate |
| RDY-C2S-040 | stale/unsupported Crew handoff must fail closed without relation/affinity writes | MERGE | shared Crew consumer boundary / regression gate |
| RDY-C2S-041 | Parent schedule conflict review before authoritative save | PRESERVE | Planner conflict gate / PR #140 exact-main verified |

## Coverage
Recovered atoms registered here: 41.
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
