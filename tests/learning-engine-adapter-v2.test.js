'use strict';
const assert=require('node:assert/strict');
const A=require('../src/learning/learning-engine-adapter-v2.js');

const decision={
  ok:true,
  decision_contract:'TAKY_RUNTIME_DECISION_CONTRACT_V1',
  authority:'LEARNING_DECISION_INTENT_ONLY',
  scope:{member_id:'A',subject:'영어',concept_skill_target:'vocabulary'},
  blockers:[],
  pedagogical_actions:[
    {intent:'TARGETED_RECOVERY_PRACTICE',priority:'HIGH',basis:['UNRESOLVED_RECOVERY'],targets:['word:a']},
    {intent:'RETRIEVAL_CHECKPOINT',priority:'HIGH',basis:['RETENTION_AT_RISK']}
  ],
  execution_status:'PEDAGOGICAL_ACTION_AVAILABLE',
  consumer_contract:{
    ready:'MAY_TRANSLATE_INTENT_TO_EXECUTION_PLAN',
    planner:'OWNS_DATED_ALLOCATION',
    specialist:'OWNS_INTERACTION_EXECUTION_AND_EVIDENCE'
  }
};

const out=A.translate(decision,{
  assignment_id:'a1',
  analysis_id:'an1',
  learning_decision_ref:'decision:001',
  scheduling_constraints:{recurring_days:['MON','WED','FRI']}
});
assert.equal(out.ok,true);
assert.equal(out.authority,'READY_EXECUTION_ADAPTER_ONLY');
assert.equal(out.execution_status,'READY_FOR_PLANNER_ALLOCATION');
assert.equal(out.execution_hints.length,2);
assert.equal(out.specialist_routing_intent,'MEMORY_SPECIALIST_PREFERRED');
assert.equal(out.planner_request.planner_owns_dates,true);
assert.equal(out.planner_request.scheduling_constraints.recurring_days[0],'MON');
assert.equal(A.selfValidate(out).ok,true);
assert.equal(out.cannot_influence.includes('LEARNER_MODEL'),true);

const hold=A.translate({
  ...decision,
  blockers:[{code:'INSTRUMENT_CHANGE_HOLD',priority:'HIGH'}],
  execution_status:'HOLD_FOR_MORE_RELIABLE_INTERPRETATION',
  pedagogical_actions:[]
});
assert.equal(hold.ok,true);
assert.equal(hold.execution_status,'HOLD');
assert.deepEqual(hold.hold_reason,['INSTRUMENT_CHANGE_HOLD']);
assert.equal(hold.planner_request,null);
assert.equal(A.selfValidate(hold).ok,true);

const leaked=A.translate({...decision,schedule_date:'2026-10-01'});
assert.equal(leaked.ok,false);
assert.equal(leaked.issues.includes('SCHEDULE_AUTHORITY_LEAK'),true);

const wrong=A.translate({...decision,authority:'READY_LEARNING_ENGINE'});
assert.equal(wrong.ok,false);
assert.equal(wrong.issues.includes('DECISION_AUTHORITY_INVALID'),true);

console.log('READY_LEARNING_ENGINE_ADAPTER_V2_PASS');
