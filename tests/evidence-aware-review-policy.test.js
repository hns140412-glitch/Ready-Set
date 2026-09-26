'use strict';

const assert=require('node:assert/strict');

global.window=global;
global.document={documentElement:{dataset:{}}};
global.ReadyAssignments={};
global.ReadySetPlanner={};
require('../ready-learning-master-v01.js');

const LM=global.ReadyLearningMasterV01;
assert.ok(LM);

const fact={
  assignment_id:'adaptive_math',
  confirmation_state:'FACT_CONFIRMED',
  deadline_state:'DATE_CONFIRMED',
  deadline_boundary:'2026-09-30',
  source_type:'TALENT_BOOK_ASSIGNMENT',
  book_subject:'수학',
  subject:'수학',
  source_range:'1~20번',
  teacher_instruction:'분수 관계를 이해하고 설명하기',
  fact_revision:1,
  claims:[]
};

const signal={
  authority:'ESCALATION_ADVISORY_ONLY',
  states:['PARTIAL','PARTIAL','DEFERRED'],
  carry_over_depth:3,
  deadline_date:'2026-09-30',
  specialist_evidence:{
    authority:'READY_EVIDENCE_INTERPRETATION_ONLY',
    memory_evidence_count:1,
    production_evidence_count:0,
    max_memory_review_priority:88,
    min_memory_strength:42,
    child_authored_production_count:0,
    can_influence:['RECOVERY_INTENSITY','CHECKPOINT_SELECTION','UNIT_SPAN'],
    cannot_influence:['SCHEDULE_DATE','PLANNER_DATE']
  },
  cannot_influence:['ASSIGNMENT_FACT','SOURCE_RANGE','DEADLINE','FACT_CONFIRMATION','SCHEDULE_DATE','PLANNER_DATE']
};

const reviewed=LM.interpretFact(fact,{
  actor:'LEARNING_MASTER_ESCALATION_REVIEW',
  escalation_review_signal:signal,
  review_reason:'REPEATED_PARTIAL'
});

assert.ok(reviewed.analysis.adaptive_review_policy);
assert.equal(reviewed.analysis.adaptive_review_policy.authority,'ADAPTIVE_REVIEW_ONLY');
assert.equal(reviewed.analysis.adaptive_review_policy.reduce_unit_span,true);
assert.equal(reviewed.analysis.adaptive_review_policy.max_span,3);
assert.equal(reviewed.analysis.adaptive_review_policy.add_retrieval_checkpoint,true);
assert.equal(reviewed.analysis.adaptive_review_policy.recovery_floor,'HIGH');

assert.equal(reviewed.learning_units.length,7,'1~20 math items should split into max 3 after adaptive review');
for(const unit of reviewed.learning_units){
  assert.ok(unit.range_descriptor.count<=3);
  assert.ok(unit.activity_sequence.includes('RETRIEVAL_CHECKPOINT'));
  assert.ok(unit.activity_sequence.includes('SHORT_CHECKPOINT'));
  assert.equal(unit.activity_load.recovery_need,'HIGH');
  assert.equal(unit.analysis_provenance.adaptive_review_policy.authority,'ADAPTIVE_REVIEW_ONLY');
  assert.equal('date' in unit,false);
  assert.equal('schedule_date' in unit,false);
  assert.equal('planner_date' in unit,false);
  assert.equal('deadline_date' in unit,false);
}
assert.equal(fact.deadline_boundary,'2026-09-30','adaptive learning review must not mutate assignment deadline');
assert.equal(fact.source_range,'1~20번','adaptive learning review must not mutate source fact range');

const baseline=LM.interpretFact(fact,{actor:'SYSTEM'});
assert.ok(baseline.learning_units.length<reviewed.learning_units.length,'adaptive review should only increase granularity when evidence requires it');
assert.equal(baseline.learning_units.some(x=>x.activity_sequence.includes('RETRIEVAL_CHECKPOINT')),false);

console.log('EVIDENCE_AWARE_REVIEW_POLICY_PASS');
