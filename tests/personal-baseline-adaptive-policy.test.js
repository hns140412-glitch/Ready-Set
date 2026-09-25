'use strict';
const assert=require('node:assert/strict');
global.window=global; global.document={documentElement:{dataset:{}}}; global.ReadyAssignments={}; global.ReadySetPlanner={};
require('../ready-learning-master-v01.js');
const LM=global.ReadyLearningMasterV01;
const fact={assignment_id:'personal_baseline_math',confirmation_state:'FACT_CONFIRMED',deadline_state:'DATE_CONFIRMED',deadline_boundary:'2026-10-01',source_type:'TALENT_BOOK_ASSIGNMENT',book_subject:'수학',subject:'수학',source_range:'1~12번',teacher_instruction:'문제 풀기',fact_revision:1,claims:[]};
const base={authority:'LEARNING_EVIDENCE_ADVISORY_ONLY',states:['COMPLETED','COMPLETED','COMPLETED'],specialist_evidence:{authority:'READY_EVIDENCE_INTERPRETATION_ONLY',max_memory_review_priority:50,min_memory_strength:65,child_authored_production_count:0},cannot_influence:['SCHEDULE_DATE','PLANNER_DATE']};
const declining=LM.interpretFact(fact,{actor:'TEST',evidence_review_signal:{...base,learner_adaptive_profile:{authority:'LEARNER_ADAPTIVE_PROFILE_ADVISORY_ONLY',memory_sample_count:3,baseline_memory_strength:81,latest_memory_strength:65,memory_delta:-16,trend:'DECLINING'}}});
const stable=LM.interpretFact(fact,{actor:'TEST',evidence_review_signal:{...base,learner_adaptive_profile:{authority:'LEARNER_ADAPTIVE_PROFILE_ADVISORY_ONLY',memory_sample_count:3,baseline_memory_strength:65,latest_memory_strength:65,memory_delta:0,trend:'STABLE'}}});
assert.equal(declining.analysis.adaptive_review_policy.add_retrieval_checkpoint,true);
assert.equal(declining.analysis.adaptive_review_policy.reduce_unit_span,true);
assert.equal(declining.analysis.adaptive_review_policy.recovery_floor,'HIGH');
assert.equal(stable.analysis.adaptive_review_policy.add_retrieval_checkpoint,false);
assert.equal(stable.analysis.adaptive_review_policy.reduce_unit_span,false);
assert.equal(declining.analysis.adaptive_review_policy.evidence.learner_adaptive_profile.trend,'DECLINING');
for(const u of declining.learning_units){assert.equal('schedule_date' in u,false);assert.equal('planner_date' in u,false);}
console.log('PERSONAL_BASELINE_ADAPTIVE_POLICY_PASS');
