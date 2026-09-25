# READY ↔ LEARNING ENGINE ADAPTER CURRENT — 2026-09-25

STATE: CURRENT
SCOPE: Ready & Set adapter/host boundary for independent Learning Engine Core
AUTHORITY: TAKY OS/LEARNING_ENGINE_CORE.md + Learning OS + Ready project contract

## 1. Identity correction

Ready & Set is NOT the Learning Engine.
Ready is a consumer/adapter/host that:
- sends confirmed assignment/execution evidence into Learning Engine Core;
- consumes pedagogical intent / learning-unit interpretation;
- combines those outputs with Ready/Planner execution surfaces;
- returns execution observations back to the learning domain.

## 2. Ready-owned

- family/planner execution projection
- dated TODO materialization
- Ready session runtime
- task result / carry-over
- Ready-specific capture and execution UI
- evidence transport/provenance adapter

## 3. Learning Engine Core-owned

- learner skill state
- concept/skill scoped adaptive history interpretation
- uncertainty / evidence sufficiency
- memory/mastery/retention signals
- pedagogical strategy / review need
- estimator/model provenance

Core authority: hns140412-glitch/TAKY:OS/LEARNING_ENGINE_CORE.md

## 4. Transitional code classification

Current Ready code still contains historical embedded Core logic. Physical location does not equal semantic ownership.

- ready-learning-master-v01.js = TRANSITIONAL_EMBEDDED_CORE_LOGIC
- ready-integration-v1.js = MIXED_ADAPTER_ORCHESTRATION + TRANSITIONAL_CORE_DERIVATION
- src/learning/evidence-ontology-runtime.js = READY_EVIDENCE_ADAPTER
- ready-planner-v01.js = READY/PLANNER AUTHORITY
- ready-runtime-v07.js = READY SESSION RUNTIME

Extraction rule:
Do not duplicate these algorithms into a second engine. Move/refactor only after the independent Core contract and adapter regression suite are stable.

## 5. Hard boundaries

- Ready must not become learner-model authority.
- Planner date authority must not enter Learning Engine Core.
- Learning Engine review need must not become a direct due date.
- Specialist app score must not become universal mastery without Core interpretation.
- Ready runtime/session state must not become long-term learner state.

## 6. Current adapter evidence improvements

Ready evidence ontology V03 preserves:
- member_id when available
- concept_skill_target
- instrument_version
- interaction_mode
- assistance / assisted
- attempt_count
- response_latency_ms
- observed_at

These fields are evidence provenance, not mastery claims.

## 7. Migration OPEN

1. replace Ready-local learnerAdaptiveProfile authority with Core V2 adapter call;
2. extract/adapt Learning Master stateful learner-model pieces without moving Planner/date semantics;
3. preserve existing Runtime E2E and family/session behavior;
4. compare old Adaptive V1 vs Core V2 on replay evidence before promotion;
5. do not deploy/merge until migration gate is explicitly opened.

END

## 8. Adapter V2 runtime migration

Implemented:
- src/learning/learning-engine-adapter-v2.js
- Ready consumes TAKY Runtime Decision Contract only when authority = LEARNING_DECISION_INTENT_ONLY.
- Ready translates pedagogical actions into execution hints.
- Planner remains owner of all dated allocation.
- Ready adapter cannot influence learner model, assignment facts, deadline or calendar dates.
- ready-integration-v1.js exposes applyLearningEngineDecision().
- existing embedded adaptive logic is explicitly marked LEGACY_COMPATIBILITY.

Core-decision migration now active:
- processAssignment accepts independent Core Runtime Decision Contract via Adapter V2.
- reviewLearningEvidence bypasses learnerAdaptiveProfile / memoryConcern when a Core decision is supplied.
- reviewEscalatedCarryOver bypasses direct ReadyLearningMaster reinterpretation when a Core decision is supplied.
- Planner preserves Core execution hints as metadata only; dated allocation authority remains Planner.
- Ready execution routing authority is READY_EXECUTION_ROUTING, not READY_LEARNING_ENGINE_ROUTING.

Remaining HOLD:
- legacy learnerAdaptiveProfile / memoryConcern / direct ReadyLearningMaster reinterpretation remains only for calls that do not yet supply a Core decision.
- remove that compatibility path only after all callers are migrated and replay/runtime regression stays green.
- do not deploy/merge until migration gate is explicitly opened.

END

## 9. Core Adaptive Plan Intent

Central authority:
- TAKY/LEARNING/pedagogy/adaptive-plan-contract.js
- TAKY/LEARNING/runtime/decision-contract.js

The Core decision now carries:
- unit_span_policy
- add_checkpoint
- add_retrieval_checkpoint
- recovery_floor
- assistance_policy
- target_learning_ids
- rationale/provenance

Ready behavior:
- ReadyLearningEngineAdapterV2 validates and preserves the Core adaptive plan.
- ready-learning-master-v01.js applies the plan to subject-specific unit generation.
- ReadyLearningMaster no longer needs to infer memory concern when a Core decision is supplied.
- Ready subject interpretation may translate REDUCE into the subject profile's concrete max-span, but may not invent a new learner-state reason.
- Planner preserves the adaptive plan as provenance only and does not use it as date authority.
- reviewLearningEvidence and reviewEscalatedCarryOver invalidate stale Planner outputs before Core-driven reanalysis.

Runtime migration:
- core-adaptive-plan-integration.spec.js validates Core plan -> Ready reanalysis -> Planner TODO.
- adaptive-learning-loop.spec.js migrated to Core decision path.
- recurring-adaptive-memory-loop.spec.js migrated to Core decision path.
- legacy learnerAdaptiveProfile / memoryConcern remains compatibility-only for callers that do not yet provide a Core decision.

Remaining compatibility HOLD:
- identify/migrate any residual branch callers that invoke learning evidence review without Core decision.
- keep legacy fallback until final runtime/replay closure proves no required behavior depends on it.
- production/merge/Netlify remain HOLD.

END
