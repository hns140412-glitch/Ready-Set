# Ready & Set — Stage G1.1 Regression Review

Date: 2026-09-08 KST
Target: staging only
Base commit: `9cb11c58233f0e6f155c9356ca5a8771a639107c`
Production/main: unchanged
Central TAKY canonical: unchanged

## Why G1.1 exists

A post-commit source review of Stage G1 found two promotion-blocking regression risks and two provenance/state quality gaps.

### 1. Talent source Tuesday accidentally became an execution candidate

Stage G1 correctly removed `NEXT_TUE` as a normal allocation slot, but its new generic Talent window began at `sourceDate` itself. When the weekly assignment is captured on the Tuesday teacher cycle day, that made the source Tuesday eligible.

Correction:
- non-finished generated Talent tasks on Tuesday are migrated off Tuesday;
- provisional weekly execution candidates start after the source Tuesday;
- normal weekly candidate days remain Wednesday through Saturday;
- next Tuesday remains the deadline/cycle boundary, not a task slot.

This remains provisional because full life-schedule/commitment integration is not yet implemented.

### 2. Hidden intake fields could be blanked after re-render

Stage G1 parent UI stored English weekday prints/components/instruction and Talent instruction/answer-reference notes, but several fields were not rehydrated into the rebuilt DOM. A second save could therefore overwrite stored facts with empty values.

Correction:
- hydrate existing Talent instruction/reference-note values after each parent render;
- hydrate existing English print/component/instruction values after each parent render;
- preserve previously stored hidden values when an all-empty rerender payload is received.

### 3. Workbook-only English registration could look confirmed

A parent save containing only the reusable workbook reference could mark the current homework fact `FACT_CONFIRMED` even when no actual range/print/component/instruction existed.

Correction:
- reusable workbook registration remains valid;
- current academy-cycle homework stays `HOMEWORK_CONFIRMATION_PENDING` until at least one substantive homework fact exists.

### 4. Multi-source provenance

Claims already retained actor history, but the top-level provenance label could remain single-source after child+parent participation.

Correction:
- derive `sourceActors` from claims;
- use `MULTI_SOURCE` when more than one actor contributes;
- keep factual conflict behavior as `CONFIRMATION_REQUIRED`.

## Validation gates added

The staging loader now requires:
- Stage E/F base model present;
- Stage G1.1 wrapper present;
- no active generated Talent task on a Tuesday;
- no reintroduction of minute-capacity authority or `NEXT_TUE` normal-slot semantics.

## Still unverified

- rendered browser behavior on Netlify preview
- actual iPhone behavior
- authenticated family-role routing
- final schedule-aware allocation using the real timetable
- subject-master deep learning-unit decomposition
- camera/OCR durable capture runtime
- Production

`SOURCE FIXED ≠ DEVICE VERIFIED`.
