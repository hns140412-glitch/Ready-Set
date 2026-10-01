const assert=require('node:assert/strict');
const H=require('../ready-central-observation-handoff-v01.js');
const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
for(const script of ['ready-central-evidence-session-v01.js','ready-central-observation-handoff-v01.js','ready-central-learning-decision-intake-v01.js'])
 assert(html.includes('src="./'+script+'"'));
const session={authenticated:true,family_id:'family-fixture',selected_member_id:'child-A'};
const row={state:'COMPLETED',session_id:'ready-session-1',task_id:'ready-task-1',
 lap_id:'lap-1',assignment_id:'assignment-1',
 started_at:'2026-09-27T00:40:00Z',ended_at:'2026-09-27T01:00:00Z',
 actual_minutes:20,performed_quantity:3,
 planner_allocation:{authority:'READY_SET_PLANNER_ALLOCATION',date:'2026-09-27',
  quantity:4,date_and_quantity_owner:'READY_SET_PLANNER'},
 specialistResult:{
 sourceApp:'hide-seek',taskState:'COMPLETED',memorySummary:{
 authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',reviewAdvisories:[{lexicalId:'word-a'}]}}};
const context={session,event_id:'ready-observation-1',occurred_at:'2026-09-27T01:00:00Z',
 session_id:'ready-session-1',subject:'english',concept_skill_target:'vocabulary'};
const good=H.fromOutcome(row,context);
assert.equal(good.ok,true);
assert.equal(good.observation.payload.member_id,'child-A');
assert.equal(good.observation.payload.observation_only,true);
assert.equal(good.observation.payload.global_mastery_claim,false);
assert.equal(good.observation.payload.evidence_type,'MEMORY_RETRIEVAL_EVIDENCE');
assert.equal(good.observation.payload.forwarded_source_app,'hide-seek');
assert.equal(good.observation.payload.instrument_version,'HIDE_SPECIALIST_RESULT_V1');
assert.equal(good.observation.payload.session_id,'ready-session-1');
assert.equal(good.observation.payload.task_id,'ready-task-1');
assert.equal(good.observation.payload.lap_id,'lap-1');
assert.equal(good.observation.payload.assignment_id,'assignment-1');
assert.equal(good.observation.payload.planner_allocation.authority,'READY_SET_PLANNER_ALLOCATION');
assert.equal(good.observation.payload.actual_minutes,20);
assert.equal(good.observation.payload.performed_quantity,3);
assert.equal(good.authority,'OBSERVATION_ONLY_NOT_CENTRAL_DECISION');
assert.equal('planner_date' in good.observation.payload,false);
assert.equal('memoryReviewFeedback' in good.observation.payload,false);
assert.equal(H.fromOutcome({...row,state:'PARTIAL'},context).ok,false);
assert.equal(H.fromOutcome({...row,specialistResult:{...row.specialistResult,taskState:'PARTIAL'}},context).ok,false);
assert.equal(H.fromOutcome(row,{...context,session:{...session,authenticated:false}}).ok,false);
assert.equal(H.fromOutcome(row,{...context,concept_skill_target:''}).ok,false);
assert.equal(H.fromOutcome(row,{...context,event_id:''}).ok,false);
assert.equal(H.fromOutcome(row,{...context,session_id:''}).ok,false);
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
const copy=H.fromOutcome(row,context);copy.observation.payload.memorySummary.reviewAdvisories[0].lexicalId='mutated';
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
 const frictionCandidate={
  authority:'READY_EXECUTION_FRICTION_OBSERVATION_ONLY',
  event_id:'friction-1',
  observed_at:'2026-09-27T02:00:00Z',
  assignment_id:'assignment-1',
  subject:'english',
  concept_skill_target:'vocabulary',
  carry_over_id:'carry-1',
  carry_over_depth:4,
  carry_over_state:'OPEN',
  escalation_reason:'REPEATED_CARRY_LIMIT',
  observation_count:4,
  states:['PARTIAL','DEFERRED','BLOCKED'],
  actual_minutes:[20,22,25],
  observation_only:true,
  global_mastery_claim:false
 };
 const mappedFriction=H.fromExecutionFriction(frictionCandidate,{session});
 assert.equal(mappedFriction.ok,true,JSON.stringify(mappedFriction));
 assert.equal(mappedFriction.observation.payload.evidence_scope_kind,'AGGREGATED_EXECUTION');
 assert.equal(mappedFriction.observation.payload.assignment_id,'assignment-1');
 assert.equal(mappedFriction.observation.payload.verified_performance,false);
 assert.equal(mappedFriction.authority,'EXECUTION_FRICTION_OBSERVATION_ONLY_NOT_PERFORMANCE');

 const checkpoint={state:'PARTIAL',session_id:'ready-session-1',task_id:'checkpoint-task-1',
  lap_id:'checkpoint-lap-1',planner_todo_id:'central-todo-1',family_id:session.family_id,
  member_id:session.selected_member_id,actual_ms:120000,
  centralCheckpoint:{todo_id:'central-todo-1',
   source:'PLANNER_CENTRAL_LEARNING_CHECKPOINT',
   review_policy:{authority:'TAKY_LEARNING_ENGINE_CORE'},
   planner_allocation:{authority:'READY_SET_PLANNER_ALLOCATION',
    date:'2026-09-27',quantity:1,date_and_quantity_owner:'READY_SET_PLANNER'},
   provenance:{family_id:session.family_id,member_id:session.selected_member_id,
    subject:'english',concept_skill_target:'vocabulary',
    schedule_authority:'READY_SET_PLANNER'}}};
 const mappedCheckpoint=H.fromCheckpointOutcome(checkpoint,{
  ...context,event_id:'checkpoint-result-1'});
 assert.equal(mappedCheckpoint.ok,true,JSON.stringify(mappedCheckpoint));
 assert.equal(mappedCheckpoint.observation.payload.evidence_type,'CHILD_SELF_REPORT');
 assert.equal(mappedCheckpoint.observation.payload.ready_state,'PARTIAL');
 assert.equal(mappedCheckpoint.observation.payload.actual_minutes,2);
 assert.equal(mappedCheckpoint.observation.payload.session_id,'ready-session-1');
 assert.equal(mappedCheckpoint.observation.payload.task_id,'checkpoint-task-1');
 assert.equal(mappedCheckpoint.observation.payload.planner_allocation.authority,
  'READY_SET_PLANNER_ALLOCATION');
 assert.equal(mappedCheckpoint.observation.payload.checkpoint_completion_is_verified_recall,false);
 assert.equal('verified_outcome' in mappedCheckpoint.observation.payload,false);
 const checkpointBatch=await H.enqueueBatch([checkpoint],
  r=>({...context,event_id:'checkpoint:'+r.task_id}),{pipeline:batchPipeline});
 assert.equal(checkpointBatch.ok,true);
 assert.equal(checkpointBatch.results.length,1);
 assert.equal(H.fromCheckpointOutcome({...checkpoint,member_id:'child-B'},context).reason,
  'CENTRAL_CHECKPOINT_MEMBER_SCOPE_MISMATCH');
 assert.equal(H.fromCheckpointOutcome({...checkpoint,centralCheckpoint:{
  ...checkpoint.centralCheckpoint,provenance:{...checkpoint.centralCheckpoint.provenance,
   subject:'math'}}},context).reason,'CENTRAL_CHECKPOINT_LEARNING_CONTEXT_REQUIRED');
 const dual={...checkpoint,state:'COMPLETED',specialistResult:row.specialistResult};
 const split=H.expandOutcomes([dual]);
 assert.deepEqual(split.map(x=>x.centralFeedbackKind),
  ['HIDE_MEMORY','CENTRAL_CHECKPOINT_PROGRESS']);
 let kinds=[];
 const splitBatch=await H.enqueueBatch([dual],r=>({...context,
  event_id:'dual:'+r.task_id+
   (r.centralFeedbackKind==='CENTRAL_CHECKPOINT_PROGRESS'?':checkpoint':'')}),
  {pipeline:{enqueueReadyObservation:async observation=>{
   kinds.push({id:observation.event_id,type:observation.payload.evidence_type});
   return {queued:true};
  }}});
 assert.equal(splitBatch.ok,true,JSON.stringify(splitBatch));
 assert.deepEqual(kinds,[
  {id:'dual:checkpoint-task-1',type:'MEMORY_RETRIEVAL_EVIDENCE'},
  {id:'dual:checkpoint-task-1:checkpoint',type:'CHILD_SELF_REPORT'}]);
 assert.equal(H.expandOutcomes(split).length,2);
 console.log('READY_CENTRAL_OBSERVATION_HANDOFF_PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
