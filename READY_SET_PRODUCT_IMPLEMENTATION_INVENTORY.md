# READY_SET_PRODUCT_IMPLEMENTATION_INVENTORY

Status: ACTIVE PRODUCT COMPLETENESS INVENTORY
Generation: READY_RENEWAL_01
Purpose: prevent subsystem/test closure from being mistaken for whole-product implementation completion.

## Status vocabulary

- NOT_IMPLEMENTED: no usable product behavior.
- SKELETON: data model, API, placeholder UI, or isolated logic exists but the user feature is not usable end-to-end.
- PARTIAL: meaningful product behavior exists, but major required flows/UX/automation are missing.
- FUNCTIONAL: core user feature works end-to-end in browser runtime for the intended scope.
- VERIFIED: FUNCTIONAL + deterministic CI/runtime evidence for the whole listed feature.
- DEVICE_VERIFIED / PRODUCTION_VERIFIED remain separate and are never inferred.

Hard rule:
SUBSYSTEM CLOSED != PRODUCT FEATURE COMPLETE.
TEST PASS != WHOLE PRODUCT IMPLEMENTED.
A feature is not FUNCTIONAL merely because one underlying contract, module, or happy-path test passes.

## Product feature inventory — current evidence-based baseline

| ID | Product feature | Current depth | Current truth / major gaps |
|---|---|---|---|
| RSP-001 | Product identity / Base Camp language | FUNCTIONAL | Ready & Set / exploration language active. Visual/product coherence still needs broader product pass. |
| RSP-002 | Parent/Child role model | PARTIAL | browser role boundary exists; real family account lifecycle and production identity remain incomplete. |
| RSP-003 | Parent assignment capture | PARTIAL | structured input and domain models exist; full everyday capture UX is not complete. |
| RSP-004 | Child ad-hoc homework input | PARTIAL | input → parent-confirm contract exists; polished parent review workflow remains incomplete. |
| RSP-005 | FACT confirmation / correction | PARTIAL | core authority path exists; complete correction/exception UX is not finished. |
| RSP-006 | Continuous camera capture | PARTIAL | mobile camera file-input capture supports repeated shots, immediate IndexedDB Blob temp-save, preview/delete and continued capture; custom camera UX/device interruption quality is not complete. |
| RSP-007 | Temporary capture preservation | PARTIAL | IndexedDB Blob temp-save, active capture session and preserved originals exist; interruption/recovery UX and physical-device behavior remain unverified. |
| RSP-008 | Batch Save & Analyze OCR | PARTIAL | Save and Analyze locks the capture session and sends preserved manifest/blobs through the analysis adapter into review drafts; production OCR quality and full mobile UX remain incomplete. |
| RSP-009 | OCR review / correction / confidence UX | PARTIAL | review drafts, confidence and evidence linkage exist; complete mobile review UI is incomplete. |
| RSP-010 | OCR retake / image quality handling | NOT_IMPLEMENTED | no complete product flow verified for blur/crop/retake/quality recovery. |
| RSP-011 | Source → evidence → FACT lineage | PARTIAL | lineage contracts exist; full capture UX closure is incomplete. |
| RSP-012 | Talent six-book intake | PARTIAL | six-book domain flow exists; ordinary weekly parent workflow still needs productization. |
| RSP-013 | English academy package intake | PARTIAL | workbook/components/deadline model exists; recurring academy-life workflow incomplete. |
| RSP-014 | Learning Master core decomposition | PARTIAL | subject profiles, Learning Unit generation, load/recovery metadata exist. |
| RSP-015 | Grade/semester/unit curriculum mapping | PARTIAL | official registry and Unit Mapping Evidence are materially populated for Korean/Social/Math/Science 5–6 band; English unit mapping remains an explicit GAP and textbook-specific matching stays evidence-gated. |
| RSP-016 | Korean subject learning intelligence | PARTIAL | subject profile + official standard/unit evidence exist; detailed assignment-specific teaching strategy remains incomplete. |
| RSP-017 | Math learning intelligence | PARTIAL | concept/apply/error profile + official standard/unit evidence exist; detailed assignment-specific strategy and adaptation remain incomplete. |
| RSP-018 | Science learning intelligence | PARTIAL | dedicated science profile + official standard/unit evidence exist; deep assignment-specific pedagogy remains incomplete. |
| RSP-019 | Social studies learning intelligence | PARTIAL | dedicated concept-linkage profile + official standard/unit evidence exist; deep assignment-specific pedagogy remains incomplete. |
| RSP-020 | English learning intelligence | PARTIAL | vocabulary/listening/recording/writing profiles exist; academy-specific adaptive loop incomplete. |
| RSP-021 | Hanja / calculation learning intelligence | PARTIAL | recall/fluency profiles exist; detailed progression and outcome tuning incomplete. |
| RSP-022 | Piano learning intelligence | SKELETON | section-practice/record/compare model exists; difficulty/content database not bound. |
| RSP-023 | Specialist memory/adaptive advisory | PARTIAL | Hide memory summary feedback exists; long-term evidence-based adaptation is not product-complete. |
| RSP-024 | Fixed life schedule data model | PARTIAL | commitments/buffers exist; recurrence/exception behavior is not a complete timetable product. |
| RSP-025 | Recurring weekly timetable | SKELETON | recurrence field exists but no complete recurring timetable engine/UI. |
| RSP-026 | School/academy/travel/meal/prep/rest timetable | SKELETON | can be represented as commitments/buffers, but complete lifestyle timetable setup is missing. |
| RSP-027 | English-academy-day morning vocab rule | NOT_IMPLEMENTED | no automatic recurring rule found in current product code. |
| RSP-028 | Weekly timetable UI | SKELETON | seven-day strip + item list; not a real weekly time-grid timetable. |
| RSP-029 | Daily timetable UI | SKELETON | ordered route/list; not a time-axis daily schedule. |
| RSP-030 | Availability-window derivation | PARTIAL | profiles, commitments, buffers and open-window derivation exist. |
| RSP-031 | Planner Learning Unit allocation | PARTIAL | allocation logic exists; complete real-life scheduling behavior remains incomplete. |
| RSP-032 | Planner automatic reallocation | PARTIAL | carry-over replan exists; broad schedule-change/exception replanning is incomplete. |
| RSP-033 | Calendar exceptions / holiday / makeup class | NOT_IMPLEMENTED | no complete product workflow identified. |
| RSP-034 | Parent Planner administration | PARTIAL | basic schedule/admin forms exist; high-quality family management UX incomplete. |
| RSP-035 | TODAY projection | PARTIAL | dated TODO projection exists; full day-plan experience is incomplete. |
| RSP-036 | Mission setup | PARTIAL | selectable TODAY items and session setup exist; still tied to incomplete upstream Planner. |
| RSP-037 | One session / multi-task / lap runtime | FUNCTIONAL | core browser runtime contract is implemented and tested. |
| RSP-038 | Per-task result / wrap-up | PARTIAL | state contract works; voice/support UX and complete child flow need refinement. |
| RSP-039 | Result/history/calendar | PARTIAL | records exist; learning-oriented reporting/parent insight is incomplete. |
| RSP-040 | Ready ↔ Hide & Seek continuity | PARTIAL | contract/path implemented; actual production/device roundtrip remains unverified. |
| RSP-041 | Ready ↔ Snap & Pop continuity | PARTIAL | contract/path exists; shared expedition/product integration remains incomplete. |
| RSP-042 | Expedition-member projection | PARTIAL | Ready has presentation; upstream Snap & Pop rule system is still a separate evolving workstream. |
| RSP-043 | Local-first snapshots/outbox | PARTIAL | browser IndexedDB/outbox/conflict logic exists. |
| RSP-044 | Real online sync | SKELETON | adapter contract exists; complete account/cloud product behavior is not verified. |
| RSP-045 | Family login/linking | SKELETON | API client contract exists; production family onboarding is not complete. |
| RSP-046 | PWA offline/cache/update UX | PARTIAL | service worker exists; device update/install behavior not verified. |
| RSP-047 | Accessibility/mobile layout | PARTIAL | browser tests exist; broad device/keyboard/safe-area quality not complete. |
| RSP-048 | Physical-device behavior | NOT_IMPLEMENTED | product is not ready for device verification because material product features remain incomplete. |
| RSP-049 | Production deployment/provenance | NOT_IMPLEMENTED | intentionally blocked. |
| RSP-050 | Whole-product regression / release readiness | NOT_IMPLEMENTED | cannot be claimed until material feature inventory reaches FUNCTIONAL/VERIFIED scope. |
| RSP-051 | Talent weekly package lifecycle | PARTIAL | six-book FACT intake exists, but full weekly package lifecycle and ordinary parent workflow are incomplete. |
| RSP-052 | Talent six separate book capture groups | PARTIAL | book-level records exist; capture grouping/UX for cover-range-answer per book is incomplete. |
| RSP-053 | Talent activity-load based distribution | PARTIAL | Learning Unit/load metadata exists; real weekly distribution experience is incomplete. |
| RSP-054 | Parent daytime grading → next-study first correction | SKELETON | carry/result concepts exist; explicit grading-to-next-correction product loop is not complete. |
| RSP-055 | English workbook reusable reference | PARTIAL | workbook reference model exists; lifecycle/UX across weeks remains incomplete. |
| RSP-056 | English next-academy homework confirmation | PARTIAL | NEXT_ACADEMY boundary and hold states exist; after-academy confirmation workflow is incomplete. |
| RSP-057 | English weekday print homework | PARTIAL | data model supports weekday_prints; planner/product treatment as independent learning units needs completion. |
| RSP-058 | English full assignment fact visibility for parent/child | PARTIAL | projections exist; polished whole-assignment vs TODAY distinction remains incomplete. |
| RSP-059 | Sudden school homework/event intake | PARTIAL | child event/fact APIs exist; complete school-day UX and downstream replan are incomplete. |
| RSP-060 | Household account → family member profiles | NOT_IMPLEMENTED | current role/session contract is not the intended household/member profile architecture. |
| RSP-061 | Child iPad member routing | NOT_IMPLEMENTED | no complete device/member binding or default child profile routing. |
| RSP-062 | Parent-device support workflow | NOT_IMPLEMENTED | capture/confirm/grading/support across authenticated family devices is not product-complete. |
| RSP-063 | Young-child Ready/Snap flow | NOT_IMPLEMENTED | adopted idea only; no voice-first six-year-old product mode implemented. |
| RSP-064 | Piano teacher reference model | SKELETON | piano profile exists; song/bars/hand/demo/tempo/instruction reference workflow is not complete. |
| RSP-065 | Piano record/compare/repeat learning loop | NOT_IMPLEMENTED | no complete teacher-reference vs child-recording comparison product loop. |
| RSP-066 | Focus visual direction final implementation | PARTIAL | current focus/session works, but confirmed visual/interaction direction has not been fully reconciled. |
| RSP-067 | Guide peek/talk/guide/hide behavior | SKELETON | expedition member visuals exist; governed contextual behavior loop is incomplete. |
| RSP-068 | BGM essential; integration | PARTIAL | BGM mechanics exist; complete preserved essential;/device behavior is not re-established in current product truth. |
| RSP-069 | Adaptive plan-vs-actual learning | PARTIAL | observations/advisories exist; child-specific long-term estimate learning is incomplete. |
| RSP-070 | No-silent-loss source disposition UX | PARTIAL | evidence disposition model exists; ordinary parent review experience is incomplete. |

## Current product-completeness conclusion

The repository contains meaningful subsystem code, but the product itself is still in active implementation.
The prior P1–P5 labels describe selected technical closure slices, not the percentage of the complete Ready & Set product.

Do NOT derive a whole-product implementation percentage from CI test count or the number of CLOSED C2S atoms.

A numeric product implementation percentage remains UNRESOLVED until this inventory is expanded against recovered historical requirements and each material feature is assigned a weight and evidence state. Google Drive recovery has now confirmed additional Talent, English, grading/correction, household/member-profile, young-child and Piano requirements; these are included in RSP-051–070.

## Immediate implementation priority

1. REAL TIMETABLE: recurring weekly lifestyle schedule + exceptions + time-axis WEEK/DAY.
2. PLANNER: timetable-aware allocation/reallocation + TODAY integration.
3. CAPTURE/OCR: continuous shooting → temp save → batch analyze → review/correct/retake → FACT.
4. LEARNING ENGINE: grade/unit/subject mappings + subject-specific strategy depth.
5. PARENT UX: capture/confirm/timetable/planner/exception management.
6. CHILD EXECUTION: TODAY → Mission → Session → Result integrated with completed upstream data.
7. Only after the above material scope is FUNCTIONAL should device/release candidate gates reopen.
