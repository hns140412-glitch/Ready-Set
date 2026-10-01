'use strict';
const assert=require('assert');
const Learning=require('../ready-learning-master-v01.js');

const fact={
  assignment_id:'authority-1',
  source_type:'SCHOOL_EVENT',
  subject:'영어',
  confirmation_state:'FACT_CONFIRMED',
  source_range:'1~12',
  teacher_instruction:'단어를 읽고 뜻을 확인한 뒤 문장으로 써보기',
  claims:[]
};
const escalation={
  authority:'ESCALATION_ADVISORY_ONLY',
  carry_over_depth:4,
  states:['PARTIAL','PARTIAL','BLOCKED']
};
const out=Learning.interpretFact(fact,{escalation_review_signal:escalation});
assert.equal(out.analysis.adaptive_review_policy,null);
assert.equal(out.analysis.authority_contract.assignment_interpretation_owner,'READY_LEARNING_MASTER');
assert.equal(out.analysis.authority_contract.learner_state_owner,'TAKY_LEARNING_ENGINE_CORE');
assert.equal(out.analysis.authority_contract.pedagogical_adaptation_owner,'TAKY_LEARNING_ENGINE_CORE');
assert.equal(out.analysis.authority_contract.dated_allocation_owner,'READY_SET_PLANNER');
assert.equal(out.analysis.authority_contract.local_adaptive_review_execution_authorized,false);
assert.equal(out.analysis.legacy_adaptive_review_candidate.authority,
  'LEGACY_READY_ADAPTIVE_REVIEW_CANDIDATE_ONLY');
assert.equal(out.analysis.legacy_adaptive_review_candidate.execution_authorized,false);
assert.equal(out.analysis.legacy_adaptive_review_candidate.central_learning_engine_required,true);
assert.equal(out.learning_units[0].analysis_provenance.adaptive_review_policy,null);
assert.equal(out.learning_units[0].analysis_provenance
  .legacy_adaptive_review_candidate.execution_authorized,false);

// Escalation history must no longer shrink the assignment unit locally.
const base=Learning.interpretFact(fact);
assert.deepEqual(
 out.learning_units.map(x=>x.source_range),
 base.learning_units.map(x=>x.source_range)
);
assert.deepEqual(
 out.learning_units.map(x=>x.activity_sequence),
 base.learning_units.map(x=>x.activity_sequence)
);

console.log('READY_LEARNING_AUTHORITY_RECONCILE_PASS');
