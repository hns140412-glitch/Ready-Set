'use strict';
const assert=require('assert');
const Learning=require('../ready-learning-master-v01.js');
const MemoryReview=require('../ready-hide-memory-review-v01.js');

const escalation={
  authority:'ESCALATION_ADVISORY_ONLY',
  carry_over_id:'carry-1',
  carry_over_depth:4,
  states:['PARTIAL','DEFERRED','BLOCKED','PARTIAL'],
  actual_minutes:[20,22,25,24]
};

const fact={
  assignment_id:'math-1',
  source_type:'TALENT_BOOK_ASSIGNMENT',
  subject:'수학',
  book_subject:'수학',
  confirmation_state:'FACT_CONFIRMED',
  deadline_state:null,
  source_range:'1번~20번',
  teacher_instruction:'분수 계산',
  claims:[]
};

const base=Learning.interpretFact(fact);
const escalated=Learning.interpretFact(fact,{escalation_review_signal:escalation});

assert.equal(Learning.version,'0.6.0');
assert.equal(base.learning_units.length,4,'baseline 20 items / max span 6 should remain structural');
assert.equal(escalated.learning_units.length,4,'Ready local friction must not shrink learning units');
assert.equal(escalated.analysis.adaptive_review_policy,null);
assert.equal(escalated.analysis.legacy_adaptive_review_candidate.execution_authorized,false);
assert.equal(escalated.analysis.legacy_adaptive_review_candidate.central_learning_engine_required,true);
assert.equal(escalated.analysis.authority_contract.learner_state_owner,'TAKY_LEARNING_ENGINE_CORE');
assert.equal(escalated.analysis.authority_contract.pedagogical_adaptation_owner,'TAKY_LEARNING_ENGINE_CORE');
assert.equal(escalated.analysis.authority_contract.dated_allocation_owner,'READY_SET_PLANNER');
assert.equal(escalated.analysis.authority_contract.local_adaptive_review_execution_authorized,false);
assert(escalated.learning_units.every(x=>!x.activity_sequence.includes('SHORT_CHECKPOINT')));
assert.deepEqual(
  escalated.learning_units.map(x=>x.activity_load.recovery_need),
  base.learning_units.map(x=>x.activity_load.recovery_need),
  'Ready structural interpretation cannot raise recovery need from learner friction'
);

const memorySummary={
  authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
  reviewPolicyOwner:'READY_LEARNING_ENGINE',
  scheduleOwner:'READY_SET_PLANNER',
  prioritySemantics:'ADVISORY_SIGNAL_NOT_DATE',
  reviewAdvisories:[{
    advisoryOnly:true,
    evidenceBasis:'HIDE_MEMORY_EVIDENCE',
    lexicalId:'word:accept',
    nextReviewPriority:88,
    reason:'hint_dependency',
    recoveryStatus:'NEEDS_UNASSISTED_RECALL',
    needsUnassistedRecall:true,
    memoryStrength:42
  }]
};

const advisory=MemoryReview.interpretHideMemorySummary(memorySummary);
assert.equal(advisory.ok,true);
assert.equal(advisory.decision.authority,'READY_LOCAL_MEMORY_REVIEW_ADVISORY_ONLY');
assert.equal(advisory.decision.reviewPolicyOwner,'TAKY_LEARNING_ENGINE_CORE');
assert.equal(advisory.decision.plannerMutationAuthorized,false);

const fakePlanner={
  candidateWindowsByDate(){throw Error('local planner mutation must not be reached')},
  upsertDatedTodo(){throw Error('local planner mutation must not be reached')}
};
const blocked=MemoryReview.planReview(advisory.decision,fakePlanner,{candidate_dates:['2026-10-03']});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'CENTRAL_LEARNING_ENGINE_REVIEW_REQUIRED');
assert.equal(blocked.plannerMutationAttempted,false);

const normalizedPayload={
  resultContract:'HIDE_SPECIALIST_RESULT_V2',
  runtime:'V2',
  taskState:'COMPLETED',
  learningPhase:'WRAP',
  memorySummary
};
const next=MemoryReview.nextReviewFromSpecialistResult(normalizedPayload,fakePlanner,{});
assert.equal(next.ok,true);
assert.equal(next.scheduled,false);
assert.equal(next.reason,'CENTRAL_LEARNING_ENGINE_REVIEW_REQUIRED');
assert.equal(next.plannerMutationAttempted,false);

const batch=MemoryReview.planFromReadyOutcomes([{
  state:'COMPLETED',
  task_id:'task-1',
  specialistResult:{sourceApp:'hide-seek',taskState:'COMPLETED'}
}],fakePlanner,{});
assert.equal(batch.ok,true);
assert.equal(batch.scheduled.length,0);
assert.equal(batch.reason,'CENTRAL_LEARNING_ENGINE_REVIEW_REQUIRED');
assert.equal(batch.plannerMutationAttempted,false);

console.log('READY_LEARNING_AUTHORITY_BOUNDARY_PASS');
