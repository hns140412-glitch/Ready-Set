'use strict';

const assert=require('node:assert/strict');
const Router=require('../src/integrations/specialist-router-runtime.js');
const Handoff=require('../src/integrations/specialist-handoff-contract.js');
const Evidence=require('../src/learning/evidence-ontology-runtime.js');

const plannerLink={
  todo_id:'todo_eng_1',
  label:'영어 · 단어와 문장',
  subject:'영어',
  matched_domain:'표현',
  method_variant:null,
  learning_unit_id:'unit_eng_1',
  analysis_id:'analysis_eng_1',
  assignment_id:'assignment_eng_1',
  activity_types:['RECALL','WRITING'],
  activity_sequence:['INPUT','BIDIRECTIONAL_RECALL','COMPREHEND','PRODUCE','SELF_REVIEW'],
  concept_skill_target:'단어 회상 후 자기 문장 표현',
  cognitive_load_profile:['RETRIEVAL_LOAD','LANGUAGE_PRODUCTION'],
  divisible_boundary:'LEARNING_ACTIVITY_BOUNDARY',
  confidence:0.8,
  unresolved_flags:[]
};

const plan=Router.classify(plannerLink);
assert.deepEqual(plan.handoff_queue,['hide-seek','snap-pop']);
assert.equal(Router.nextSpecialist(plan,[]),'hide-seek');
assert.equal(Router.canLaunch(plan,'snap-pop',[]),false);

const task={...plannerLink,route_plan:plan,completed_specialists:[],learning_evidence:[]};
const hideReturn=Handoff.normalizeReturnEvent({
  event_id:'hide_evt_1',
  source:'hide-seek',
  event_type:'TASK_COMPLETED',
  payload:{
    sourceApp:'hide-seek',
    taskState:'COMPLETED',
    taskContext:{session_id:'session_1',task_id:'task_1',lap_id:'lap_1'},
    memorySummary:{
      authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
      averageMemoryStrength:71,
      prioritySemantics:'ADVISORY_SIGNAL_NOT_DATE',
      reviewPolicyOwner:'READY_LEARNING_ENGINE',
      scheduleOwner:'READY_SET_PLANNER',
      reviewAdvisories:[]
    }
  }
});
assert.equal(Handoff.authorized(task,hideReturn.from_app),true);
const hideEvidence=Evidence.specialistEvidence({
  task,from_app:hideReturn.from_app,task_state:hideReturn.task_state,payload:hideReturn.payload,event_id:hideReturn.event_id
});
task.learning_evidence=Evidence.append(task.learning_evidence,hideEvidence);
task.completed_specialists.push('hide-seek');
assert.equal(Router.nextSpecialist(plan,task.completed_specialists),'snap-pop');

const snapContext=Handoff.learningContext(task);
assert.equal(snapContext.learning_unit_id,'unit_eng_1');
assert.equal(snapContext.subject,'영어');
assert.deepEqual(snapContext.activity_types,['RECALL','WRITING']);

const snapEvidence=Evidence.specialistEvidence({
  task,from_app:'snap-pop',task_state:'COMPLETED',event_id:'snap_evt_1',
  payload:{child_authored:true,landmark:'forest',step:3}
});
task.learning_evidence=Evidence.append(task.learning_evidence,snapEvidence);
task.completed_specialists.push('snap-pop');

assert.equal(Router.nextSpecialist(plan,task.completed_specialists),null);
assert.deepEqual(task.learning_evidence.map(x=>x.evidence_type),[
  'MEMORY_RETRIEVAL_EVIDENCE',
  'LEARNER_PRODUCTION_EVIDENCE'
]);
assert.deepEqual(task.completed_specialists,['hide-seek','snap-pop']);

const plannerOutcome={
  learning_evidence:task.learning_evidence.slice(-120),
  completed_specialists:[...new Set(task.completed_specialists)],
  evidence_types:[...new Set(task.learning_evidence.map(x=>x.evidence_type))]
};
assert.deepEqual(plannerOutcome.evidence_types,[
  'MEMORY_RETRIEVAL_EVIDENCE',
  'LEARNER_PRODUCTION_EVIDENCE'
]);

console.log('LEARNING_ROUTING_ROUNDTRIP_PASS');
