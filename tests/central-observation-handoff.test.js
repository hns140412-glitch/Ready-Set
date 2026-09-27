const assert=require('node:assert/strict');
const H=require('../ready-central-observation-handoff-v01.js');
const session={authenticated:true,family_id:'family-fixture',selected_member_id:'child-A'};
const row={state:'COMPLETED',task_id:'ready-task-1',specialistResult:{
 sourceApp:'hide-seek',taskState:'COMPLETED',memorySummary:{
 authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',reviewAdvisories:[{lexicalId:'word-a'}]}}};
const context={session,event_id:'ready-observation-1',occurred_at:'2026-09-27T01:00:00Z',
 subject:'english',concept_skill_target:'vocabulary'};
const good=H.fromOutcome(row,context);
assert.equal(good.ok,true);
assert.equal(good.observation.payload.member_id,'child-A');
assert.equal(good.observation.payload.observation_only,true);
assert.equal(good.observation.payload.global_mastery_claim,false);
assert.equal(good.authority,'OBSERVATION_ONLY_NOT_CENTRAL_DECISION');
assert.equal('planner_date' in good.observation.payload,false);
assert.equal('memoryReviewFeedback' in good.observation.payload,false);
assert.equal(H.fromOutcome({...row,state:'PARTIAL'},context).ok,false);
assert.equal(H.fromOutcome({...row,specialistResult:{...row.specialistResult,taskState:'PARTIAL'}},context).ok,false);
assert.equal(H.fromOutcome(row,{...context,session:{...session,authenticated:false}}).ok,false);
assert.equal(H.fromOutcome(row,{...context,concept_skill_target:''}).ok,false);
assert.equal(H.fromOutcome(row,{...context,event_id:''}).ok,false);
const copy=H.fromOutcome(row,context);copy.observation.payload.memory_summary.reviewAdvisories[0].lexicalId='mutated';
assert.equal(row.specialistResult.memorySummary.reviewAdvisories[0].lexicalId,'word-a');
console.log('READY_CENTRAL_OBSERVATION_HANDOFF_PASS');
