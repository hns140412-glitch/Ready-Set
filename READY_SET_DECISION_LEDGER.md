# READY_SET_DECISION_LEDGER

Status: ACTIVE C2S LEDGER / READY_RENEWAL_01
Generation: READY_RENEWAL_01
Disposition set: PRESERVE / MERGE / SUPERSEDE / ARCHIVE / OPEN / CLOSED / OWNERSHIP_TRANSFER

| Atom | Material | Disposition | Destination / current truth |
|---|---|---|---|
| RDY-C2S-001 | Ready & Set brand | PRESERVE | Product Contract |
| RDY-C2S-002 | execution/base-camp orchestrator, not timer product | PRESERVE | Product Contract |
| RDY-C2S-003 | Parent/Learning Master/Planner/Child authority split | PRESERVE | Product Contract |
| RDY-C2S-004 | one-session multi-task/lap | CLOSED | Runtime State Model / exact-main runtime verified |
| RDY-C2S-005 | SESSION_END != TASK_COMPLETE | CLOSED | Runtime State Model / per-task outcome path active |
| RDY-C2S-006 | REV_07 bulk-complete conflict | CLOSED | current main uses per-task finalization authority |
| RDY-C2S-007 | timestamp timing | PRESERVE | Product Contract / runtime |
| RDY-C2S-008 | Hide & Seek / Snap & Pop continuity | CLOSED | Ready + Hide branch candidates preserve shared runtime identity and continuous lap timing; main promotion pending |
| RDY-C2S-009 | voice wrap-up for unresolved states | MERGE | Runtime State Model / UI refinement remaining |
| RDY-C2S-010 | Capture → Review Draft → Parent Confirm → FACT | PRESERVE | Product Contract |
| RDY-C2S-011 | capture No Silent Loss | PRESERVE | Product Contract |
| RDY-C2S-012 | Local-first/Outbox/conflict | CLOSED | browser runtime verified; production roundtrip separate |
| RDY-C2S-013 | Parent/Child family boundary | CLOSED | browser/runtime contract verified; production identity separate |
| RDY-C2S-014 | live Identity/cloud roundtrip | OPEN | production verification |
| RDY-C2S-015 | Time Attack as product identity | SUPERSEDE | exploration/base-camp product identity |
| RDY-C2S-016 | Focus Mode as product identity / old Golden active authority | ARCHIVE | historical provenance only; confirmed visual details may remain by explicit owner rule |
| RDY-C2S-017 | stale Time Attack manifest identity | CLOSED | manifest.json aligned to Ready & Set identity on P5 exact candidate |
| RDY-C2S-018 | stale Time Attack/GitHub Pages README language | CLOSED | README/PC local guidance aligned to current product and deployment gate semantics |
| RDY-C2S-019 | REV_06/07 active-version authority | SUPERSEDE | semantic canonical docs + Version Registry |
| RDY-C2S-020 | 0.9.3 / feature cache / REV mismatch | CLOSED | version registry authority + 1.0.0-alpha.2 + non-feature cache namespace; REV retained only as compatibility/provenance |
| RDY-C2S-021 | Planner real availability windows + buffers | CLOSED | PR #73 candidate: CODED + CI_VERIFIED + RUNTIME_VERIFIED; main promotion pending |
| RDY-C2S-022 | child ad-hoc FACT → Parent confirmation generic path | CLOSED | PR #73 candidate: CODED + CI_VERIFIED + RUNTIME_VERIFIED; Child direct confirmation blocked; main promotion pending |
| RDY-C2S-023 | shared expedition-member personality/lifecycle/rules authority | OWNERSHIP_TRANSFER | Snap & Pop upstream authority; Ready consumes projection only |
| RDY-C2S-024 | exploration WEEK/DAY/TODAY | PRESERVE | UI/product renewal |
| RDY-C2S-025 | Base Camp naming/island identity | CLOSED | active Ready UI consolidated to base-camp / exploration language; main promotion pending |
| RDY-C2S-026 | Imagination Cloud call | OPEN | post-core product layer |
| RDY-C2S-027 | exact current main CI/runtime failing | SUPERSEDE | main SHA 6142cfeb...: Integration CI #119 PASS / Runtime E2E #205 42/42 PASS / Worker #322 PASS |
| RDY-C2S-028 | DEVICE_VERIFIED | OPEN | final physical-device gate only after exact candidate closure |
| RDY-C2S-029 | PRODUCTION_VERIFIED | OPEN | final production gate; Netlify is not a debugging surface |
| RDY-C2S-030 | Learning Engine main integration | CLOSED | PR #68 merged; current main runtime verified |
| RDY-C2S-031 | validation evidence keyed by SHA | PRESERVE | Validation Status |
| RDY-C2S-032 | append-only REV_08 approach | SUPERSEDE | semantic canonical docs |
| RDY-C2S-033 | historical REV docs retained as provenance | PRESERVE | historical only, non-authoritative |

## Coverage
Recovered atoms registered here: 33.
UNMAPPED_MATERIAL=0 and SILENT_LOSS=0 within the declared whole-product rewrite-review scope.
This does not claim recovery of inaccessible historical raw turns.

## Renewal execution sequence — current
The old R0→R7 sequence is superseded by the following result-driven sequence.

### P0 — canonical/current-truth cleanup
- refresh current-main validation/version truth;
- remove stale active-state claims;
- isolate historical REV/Time Attack identity;
- keep exact-main evidence keyed to SHA.

### P1 — Planner reality engine — CANDIDATE CLOSED
Candidate HEAD `450caf84b23788b40a93e070742d86edc0165baa`.

Evidence:
- Integration CI #130 PASS
- Worker Self-Test #331 PASS
- Runtime E2E #216 PASS, 45/45
- real availability profile + schedule commitments + before/after buffers
- zero-executable-window dates are excluded from Learning Unit allocation
- availability remains `EXECUTABILITY_GATE_NOT_VOLUME_AUTHORITY`

Main promotion remains pending; this does not imply DEVICE/PRODUCTION verification.

Implemented semantics were based on:
school / academy / travel / meals / preparation / rest / safety buffer / fixed events,
then allocate learning units without converting free time into mandatory study volume.

### P2 — Child FACT confirmation closure — CANDIDATE CLOSED
Candidate HEAD `60bc3ba2fea851f1951866111f2561d17339e08f`.

Evidence:
- Integration CI #136 PASS
- Worker Self-Test #338 PASS
- Runtime E2E #222 PASS, 46/46
- Child direct confirmation is blocked with `PARENT_CONFIRMATION_REQUIRED`
- Parent review may correct subject / assignment range / deadline boundary before confirmation
- confirmed FACT flows through Learning Master → Planner → TODAY with assignment / analysis / learning-unit / todo identity preserved
- P1 Planner reality-engine regression tests remained PASS and P1 was not reworked

Closed flow:
CHILD INPUT → PARENT REVIEW/CONFIRM → FACT → LEARNING MASTER → PLANNER → TODAY.

Main promotion remains pending; this does not imply DEVICE/PRODUCTION verification or frozen deployment candidate.

### P3 — cross-app execution continuity — CANDIDATE CLOSED
Ready candidate HEAD `dec81f5bc3f133e5af25bd105a170dc1da6bb510`.
Hide candidate HEAD `5e4a4fca4338b146a49e10e4151d4f45753e5cdf` / draft PR #5.

Evidence:
- Ready Integration CI #140 PASS
- Ready Worker Self-Test #343 PASS
- Ready Runtime E2E #226 PASS, 47/47
- Hide validation PASS
- Ready → Hide / Snap handoff preserves `session_id / goal_id / task_id / lap_id / return_target`
- Hide → Snap now preserves `goal_id / return_target` in addition to session/task/lap
- wrong `goal_id` inbound result is rejected by Ready
- PARTIAL return keeps the same active lap and original `started_ms`
- COMPLETED return ends that same lap and records elapsed timing

Closed roundtrip contract:
Ready → Hide & Seek / Snap & Pop → Ready, with one session / one goal / same task / same lap until result closure.

Main promotion remains pending; this does not imply DEVICE/PRODUCTION verification or frozen deployment candidate.

### P3b — Hide Memory Summary → Ready advisory roundtrip — CANDIDATE CLOSED
Ready code candidate HEAD `bc31ef9dc5a9f6087ef584f26448e48f30ccc98e`.
Hide code candidate HEAD `62feaff70a7f250e8cf92b12925cd86b9cc30574` on `implementation/hide-seek-capture-session-v02`.

Evidence:
- Ready Integration CI #151 PASS
- Ready Worker Self-Test #360 PASS
- Ready Runtime E2E #237 PASS, 49/49
- Hide Validate #111 PASS
- same-window Hide → Ready return carries compact `memory_summary` plus `event_id`
- postMessage and URL-return paths normalize through one Ready inbound contract
- Planner stores idempotent `SPECIALIST_MEMORY_ADVISORY_ONLY` observations
- TODAY projection exposes memory follow-up without changing assignment FACT, source range, deadline, required-today, or study volume
- Learning Master may use the advisory only for recovery spacing / review priority / recall checkpoint
- duplicate event_id does not duplicate Planner evidence

Closed flow:
`HIDE RAW TRACE → HIDE COMPACT MEMORY SUMMARY → READY RUNTIME → PLANNER ADVISORY → TODAY FOLLOW-UP → FUTURE LEARNING MASTER ADVISORY`.

Authority boundary:
`SPECIALIST MEMORY SIGNAL != ASSIGNMENT FACT != STUDY VOLUME AUTHORITY`.

Main promotion remains pending; DEVICE/PRODUCTION verification remains NOT RUN.

### P3c — Family Capture/OCR domain sharing — CANDIDATE CLOSED
Family capture analysis transport is shared through `/api/capture/analyze`.

Domains:
- `READY_ASSIGNMENT_FACT` — Ready homework FACT extraction, PARENT-only.
- `HIDE_VOCABULARY` — Hide printed vocabulary OCR, PARENT or CHILD.

Boundaries:
- shared transport/image provider/auth envelope != shared domain interpretation.
- Ready keeps assignment-FACT draft schema.
- Hide keeps word↔meaning interpretation/review semantics.
- Hide frontend no longer requires a private Gemini client/key.
- Hide vocabulary rows must preserve `evidence_item_id` and confidence/warnings.
- assignment drafts cannot be accepted as Hide vocabulary rows.
- unsupported/mismatched domain fails closed; original capture remains preserved.

Evidence:
- Ready Integration CI #172 PASS
- Ready Worker Self-Test #388 PASS
- Ready Runtime E2E #258 PASS
- Hide Family OCR adapter/contract CI independently green
- Production/device verification remains NOT RUN.

### P4 — exploration UI/product-language consolidation — CANDIDATE CLOSED
Candidate HEAD `c4f68d2fc0a86c9e2c6abc8034185026f31d8d45`.

Evidence:
- Integration CI #150 PASS
- Worker Self-Test #359 PASS
- Runtime E2E #236 PASS, 48/48
- active UI no longer exposes `타임어택 / FOCUS MODE / 길잡이`
- home / mission / session / settings language now follows `BASE CAMP / 탐험 / 탐험대원`
- internal legacy identifiers were intentionally left untouched to avoid needless runtime churn

Main promotion remains pending; manifest / README / cache / version authority residue is P5 and remains separate.

### P5 — legacy/version cleanup — CANDIDATE CLOSED
Exact candidate HEAD `78350a93d32d9ad2d6dba5817e8d7007c70c48a8`.

Evidence:
- Integration CI #166 PASS
- Worker Self-Test #381 PASS
- Runtime E2E #252 PASS, 50/50
- `manifest.json` no longer carries Time Attack identity
- `READY_SET_VERSION_REGISTRY.json` is the active version authority
- package/app metadata aligns to `1.0.0-alpha.2 / READY_RENEWAL_01`
- feature-named service-worker cache residue removed
- README and deployment/local-check guides no longer assert stale REV/Time Attack authority
- historical REV documents remain `PROVENANCE_ONLY`

Important exact-SHA boundary:
the branch advanced after this validated P5 SHA for P3c Family Capture/OCR work.
Therefore P5 is closed, but the newer branch HEAD is **not** automatically Runtime-verified by P5 evidence and the deployment candidate is **not frozen**.

### P6 — final device gate
One deliberate exact-SHA deployment only after branch CI + Runtime closure.
Physical iPhone verification is not used as routine debugging.

### P7 — production verification
Verify actual production deploy provenance, Identity/cloud roundtrip, PWA behavior and release state.

## Hard boundaries
`CODED != CI_VERIFIED != RUNTIME_VERIFIED != DEVICE_VERIFIED != PRODUCTION_VERIFIED`.

`RUNTIME_VERIFIED` on current main does not close P1–P5 product gaps.

`EXTERNAL REFERENCE != READY AUTHORITY`.

`SNAP & POP EXPEDITION RULE OWNER != READY PROJECT OWNER`.
Ready consumes the shared expedition projection; it does not fork a competing rule set.


### Frozen candidate tuple — READY FOR P6 GATE
The exact multi-repo candidate is frozen as:

- Ready & Set: `110f58fb1f98500f89a45e1c1bc25be1039a87cc`
- Hide & Seek: `7b8decf45151f736245f3b3c54ee2b81bfdc83ae`
- Snap & Pop: `0e2b5bee094045dc03656ab22b4bed630d4d670f`

Validation basis:
- Ready Integration CI #172 PASS
- Ready Worker #388 PASS
- Ready Runtime E2E #258 PASS, 54/54
- Hide Validate #134 PASS

This freezes code identity only.
`FROZEN_CANDIDATE != DEVICE_VERIFIED != PRODUCTION_VERIFIED`.

External deployment remains blocked until explicit HUMAN APPROVAL / user direction.
No Netlify/hosting call was used during P1–P5/P3c implementation or closure.
