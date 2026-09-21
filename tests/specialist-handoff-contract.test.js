'use strict';

const assert=require('node:assert/strict');
const Router=require('../src/integrations/specialist-router-runtime.js');
const Handoff=require('../src/integrations/specialist-handoff-contract.js');

const snapTask={
  learning_unit_id:'unit_1',
  analysis_id:'analysis_1',
  assignment_id:'assignment_1',
  subject:'영어',
  concept_skill_target:'영어 표현',
  activity_types:['WRITING'],
  activity_sequence:['COMPREHEND','PRODUCE'],
  cognitive_load_profile:['LANGUAGE_PRODUCTION'],
  divisible_boundary:'WRITING_PROMPT',
  confidence:0.82,
  unresolved_flags:[],
  route_plan:Router.classify({
    subject:'영어',
    activity_types:['WRITING'],
    activity_sequence:['COMPREHEND','PRODUCE']
  })
};

assert.deepEqual(snapTask.route_plan.allowed_specialists,['snap-pop']);
assert.equal(Handoff.authorized(snapTask,'snap-pop'),true);
assert.equal(Handoff.authorized(snapTask,'hide-seek'),false);

const encoded=Handoff.encodeLearningContext(snapTask);
const decoded=JSON.parse(Buffer.from(encoded,'base64url').toString('utf8'));
assert.equal(decoded.contract_version,'READY_LEARNING_CONTEXT_V1');
assert.equal(decoded.learning_unit_id,'unit_1');
assert.equal(decoded.subject,'영어');
assert.deepEqual(decoded.activity_types,['WRITING']);
assert.equal(decoded.provenance.engine,'READY_LEARNING_ENGINE');

const hideTask={
  task_id:'task_hide',
  route_plan:Router.classify({
    subject:'한자',
    activity_sequence:['FORM','SOUND','CORE_MEANING','RECALL']
  })
};
assert.equal(Handoff.authorized(hideTask,'hide-seek'),true);
assert.equal(Handoff.authorized(hideTask,'snap-pop'),false);

const hideV2Envelope={
  event_id:'evt_hide_1',
  source:'hide-seek',
  event_type:'TASK_COMPLETED',
  payload:{
    sourceApp:'hide-seek',
    taskState:'COMPLETED',
    taskContext:{session_id:'s1',task_id:'task_hide',lap_id:'lap1'},
    memorySummary:{authority:'SPECIALIST_MEMORY_ADVISORY_ONLY'}
  }
};
const normalized=Handoff.normalizeReturnEvent(hideV2Envelope);
assert.equal(normalized.from_app,'hide-seek');
assert.equal(normalized.session_id,'s1');
assert.equal(normalized.task_id,'task_hide');
assert.equal(normalized.task_state,'COMPLETED');
assert.equal(normalized.payload.memorySummary.authority,'SPECIALIST_MEMORY_ADVISORY_ONLY');

const spoofed={...hideV2Envelope,source:'snap-pop',payload:{...hideV2Envelope.payload,sourceApp:'snap-pop'}};
const spoofedNormalized=Handoff.normalizeReturnEvent(spoofed);
assert.equal(spoofedNormalized.from_app,'snap-pop');
assert.equal(Handoff.authorized(hideTask,spoofedNormalized.from_app),false);

console.log('SPECIALIST_HANDOFF_CONTRACT_PASS');
