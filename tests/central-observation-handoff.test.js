const assert=require('node:assert/strict');
const H=require('../ready-central-observation-handoff-v01.js');
const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
for(const script of ['ready-central-evidence-session-v01.js','ready-central-observation-handoff-v01.js','ready-central-learning-decision-intake-v01.js'])
 assert(html.includes('src="./'+script+'"'));
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
assert.equal(H.fromOutcome({...row,specialistResult:{...row.specialistResult,
 memorySummary:{...row.specialistResult.memorySummary,nested:{verification_receipt:{ok:true}}}}},context).reason,
 'SPECIALIST_SUMMARY_AUTHORITY_LEAK');
assert.equal(H.fromOutcome({...row,specialistResult:{...row.specialistResult,
 memorySummary:{...row.specialistResult.memorySummary,nested:{planner_date:'2026-09-27'}}}},context).reason,
 'SPECIALIST_SUMMARY_AUTHORITY_LEAK');
assert.equal(H.fromOutcome({...row,member_id:'child-B'},context).reason,'OUTCOME_MEMBER_SCOPE_MISMATCH');
assert.equal(H.fromOutcome({...row,specialistResult:{...row.specialistResult,child_id:'child-B'}},context).reason,'OUTCOME_MEMBER_SCOPE_MISMATCH');
assert.equal(H.fromOutcome({...row,family_id:'other-family'},context).reason,'OUTCOME_FAMILY_SCOPE_MISMATCH');
assert.equal(H.fromOutcome({...row,specialistResult:{...row.specialistResult,family_id:'other-family'}},context).reason,'OUTCOME_FAMILY_SCOPE_MISMATCH');
const copy=H.fromOutcome(row,context);copy.observation.payload.memory_summary.reviewAdvisories[0].lexicalId='mutated';
assert.equal(row.specialistResult.memorySummary.reviewAdvisories[0].lexicalId,'word-a');
(async()=>{
 let called=0;
 const pipeline={enqueueReadyObservation:async observation=>{
   called++;assert.equal(observation.payload.member_id,'child-A');
   assert.equal(observation.type,undefined);return {queued:true,duplicate:false};
 }};
 const enqueued=await H.enqueueOutcome(row,context,{pipeline});
 assert.equal(enqueued.ok,true);
 assert.equal(enqueued.queued.queued,true);
 assert.equal(enqueued.authority,'LOCAL_OUTBOX_ONLY_NOT_CENTRAL_ACK');
 assert.equal(called,1);
 assert.equal((await H.enqueueOutcome({...row,state:'PARTIAL'},context,{pipeline})).ok,false);
 assert.equal(called,1);
 assert.equal((await H.enqueueOutcome(row,context,{pipeline:{enqueueReadyObservation:async()=>({queued:false})}})).reason,
  'CENTRAL_OUTBOX_ENQUEUE_NOT_CONFIRMED');
 assert.equal((await H.enqueueOutcome(row,context,{pipeline:{enqueueReadyObservation:async()=>({duplicate:true})}})).ok,true);
 assert.equal((await H.enqueueOutcome(row,context)).reason,'CENTRAL_PIPELINE_REQUIRED');
 const batchContext=r=>({...context,event_id:'event:'+r.task_id});
 let batchCalls=0;
 const batchPipeline={enqueueReadyObservation:async()=>{batchCalls++;return {queued:true}}};
 const invalid={...row,task_id:'bad',member_id:'child-B'};
 const rejected=await H.enqueueBatch([row,invalid],batchContext,{pipeline:batchPipeline});
 assert.equal(rejected.reason,'OUTCOME_MEMBER_SCOPE_MISMATCH');
 assert.equal(batchCalls,0);
 const deduped=await H.enqueueBatch([row,row],batchContext,{pipeline:batchPipeline});
 assert.equal(deduped.ok,true);
 assert.equal(deduped.results.length,1);
 assert.equal(batchCalls,1);
 const conflict=await H.enqueueBatch([row,{...row,task_id:'other'}],
  r=>({...context,event_id:'same-event'}),{pipeline:batchPipeline});
 assert.equal(conflict.reason,'BATCH_OBSERVATION_ID_CONFLICT');
 assert.equal(batchCalls,1);
 let partialCalls=0;
 const partial=await H.enqueueBatch([row,{...row,task_id:'second'}],batchContext,
  {pipeline:{enqueueReadyObservation:async()=>++partialCalls===1?{queued:true}:{queued:false}}});
 assert.equal(partial.ok,false);
 assert.equal(partial.results.length,1);
 assert.equal(partial.failed_event_id,'event:second');
 console.log('READY_CENTRAL_OBSERVATION_HANDOFF_PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
