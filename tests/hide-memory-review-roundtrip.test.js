const assert=require('assert');
const review=require('../ready-hide-memory-review-v01.js');
const {createPlanner}=require('../ready-planner-v01.js');

function memoryStorage(){const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}}

const packet={
  authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
  reviewPolicyOwner:'READY_LEARNING_ENGINE',
  scheduleOwner:'READY_SET_PLANNER',
  prioritySemantics:'ADVISORY_SIGNAL_NOT_DATE',
  reviewAdvisories:[
    {lexicalId:'word-a',nextReviewPriority:90,reason:'recovery',advisoryOnly:true,evidenceBasis:'HIDE_MEMORY_EVIDENCE',needsUnassistedRecall:true,recoveryStatus:'NEEDS_UNASSISTED_RECALL',memoryStrength:42},
    {lexicalId:'word-b',nextReviewPriority:70,reason:'confusion',advisoryOnly:true,evidenceBasis:'HIDE_MEMORY_EVIDENCE',needsUnassistedRecall:false,recoveryStatus:'UNPROVEN',memoryStrength:61},
    {lexicalId:'stable-word',nextReviewPriority:10,reason:'stable',advisoryOnly:true,evidenceBasis:'HIDE_MEMORY_EVIDENCE'}
  ]
};

const interpreted=review.interpretHideMemorySummary(packet);
assert.equal(interpreted.ok,true);
assert.equal(interpreted.decision.authority,'READY_LEARNING_ENGINE_REVIEW_POLICY');
assert.equal(interpreted.decision.authorityScope,'LOCAL_FALLBACK_ONLY');
assert.equal(interpreted.decision.centralLearningOwner,'TAKY_LEARNING_ENGINE_CORE');
assert.equal(interpreted.decision.growthControlAuthority,false);
assert.equal(interpreted.decision.learnerStateAuthority,false);
assert.equal(interpreted.decision.centralOverrideRequired,true);
assert.equal(interpreted.decision.policyState,'REVIEW_REQUIRED');
assert.deepEqual(interpreted.decision.lexicalIds,['word-a','word-b']);
assert.equal(interpreted.decision.date,null);
assert.equal(interpreted.decision.todoId,null);
assert.equal('scheduledDate' in interpreted.decision,false);

const planner=createPlanner(memoryStorage());
planner.upsertDailyAvailabilityWindow({date:'2026-09-22',start:'16:00',end:'17:00',confirmed:true,source:'PARENT_CONFIRMED'});
const centralPreferred=review.planReview(interpreted.decision,planner,{
 candidate_dates:['2026-09-22'],central_learning_available:true
});
assert.equal(centralPreferred.ok,false);
assert.equal(centralPreferred.reason,'CENTRAL_LEARNING_ENGINE_TAKES_PRECEDENCE');
assert.equal(planner.snapshot().dated_todos.length,0);
const planned=review.planReview(interpreted.decision,planner,{candidate_dates:['2026-09-22','2026-09-23'],learning_unit_id:'unit-language-memory'});
assert.equal(planned.ok,true);
assert.equal(planned.todo.date,'2026-09-22');
assert.equal(planned.todo.source,'PLANNER_SPECIALIST_MEMORY_REVIEW');
assert.equal(planned.directive.authority,'EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE');
assert.equal(planned.directive.reviewPolicyOwner,'READY_LEARNING_ENGINE');
assert.equal(planned.directive.scheduleOwner,'READY_SET_PLANNER');
assert.deepEqual(planned.directive.lexicalIds,['word-a','word-b']);
assert.equal(planned.directive.taskId,planned.todo.todo_id);
assert.equal(planned.directive.scheduledDate,'2026-09-22');

assert.equal(review.directiveForPlannerTodo({...planned.todo,date:null},'task-review-1'),null);
assert.equal(review.directiveForPlannerTodo({...planned.todo,todo_id:null},'task-review-1'),null);
const badPlanner={
  candidateWindowsByDate:()=>({'2026-09-22':[{start:'16:00',end:'17:00'}]}),
  upsertDatedTodo:()=>({todo_id:'todo-wrong-date',date:'2026-09-23'})
};
assert.deepEqual(review.planReview(interpreted.decision,badPlanner,{candidate_dates:['2026-09-22']}),
  {ok:false,reason:'PLANNER_DATED_TODO_NOT_CONFIRMED'});
const noTodoPlanner={...badPlanner,upsertDatedTodo:()=>null};
assert.deepEqual(review.planReview(interpreted.decision,noTodoPlanner,{candidate_dates:['2026-09-22']}),
  {ok:false,reason:'PLANNER_DATED_TODO_NOT_CONFIRMED'});

const noWindow=review.planReview(interpreted.decision,createPlanner(memoryStorage()),{candidate_dates:['2026-09-22']});
assert.equal(noWindow.ok,false);
assert.equal(noWindow.reason,'NO_CONFIRMED_REVIEW_WINDOW');

const forged=review.interpretHideMemorySummary({...packet,authority:'HIDE_SCHEDULER'});
assert.equal(forged.ok,false);



const directiveFromTodo=review.directiveForPlannerTodo(planned.todo,'task-review-1');
assert.equal(directiveFromTodo.authority,'EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE');
assert.equal(directiveFromTodo.taskId,'task-review-1');
assert.deepEqual(directiveFromTodo.lexicalIds,['word-a','word-b']);

const normalizedResult=review.normalizeHideSpecialistResult({
  resultContract:'HIDE_SPECIALIST_RESULT_V2',
  runtime:'V2',
  activeMissionId:'mission-1',
  missionStatus:'COMPLETED',
  taskState:'COMPLETED',
  learningPhase:'COMPLETE',
  trailMastery:100,
  memorySummary:packet
});
assert.equal(normalizedResult.sourceApp,'hide-seek');
assert.equal(normalizedResult.resultContract,'HIDE_SPECIALIST_RESULT_V2');
assert.equal(normalizedResult.activeMissionId,'mission-1');
assert.equal(normalizedResult.missionStatus,'COMPLETED');
assert.equal(normalizedResult.activeSheetId,null);
assert.equal(normalizedResult.trailMastery,100);
assert.equal(normalizedResult.memorySummary.authority,'SPECIALIST_MEMORY_ADVISORY_ONLY');

const normalizedReturnEvent=review.normalizeHideV2ReturnEvent({
  envelope_version:1,
  event_id:'evt-hide-v2-1',
  event_type:'TASK_COMPLETED',
  source:'hide-seek',
  occurred_at:'2026-09-21T12:00:00.000Z',
  idempotency_key:'evt-hide-v2-1',
  payload_digest:'fixture',
  payload:{
    resultContract:'HIDE_SPECIALIST_RESULT_V2',
    runtime:'V2',
    taskContext:{session_id:'ready-session-1',task_id:'task-review-1',lap_id:'lap-1'},
    activeMissionId:'mission-1',
    missionStatus:'COMPLETED',
    taskState:'COMPLETED',
    learningPhase:'COMPLETE',
    trailMastery:100,
    memorySummary:{
      authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
      reviewPolicyOwner:'READY_LEARNING_ENGINE',
      scheduleOwner:'READY_SET_PLANNER',
      prioritySemantics:'ADVISORY_SIGNAL_NOT_DATE',
      reviewAdvisories:[]
    }
  }
});
assert.equal(review.normalizeHideV2ReturnEvent({
  source:'hide-seek',event_type:'TASK_COMPLETED',event_id:'event-conflict',
  payload:{resultContract:'HIDE_SPECIALIST_RESULT_V2',runtime:'V2',
    taskState:'PARTIAL',taskContext:{session_id:'s',task_id:'t',lap_id:'l'},
    memorySummary:{authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
      reviewPolicyOwner:'READY_LEARNING_ENGINE',scheduleOwner:'READY_SET_PLANNER'}}
}),null);
assert.equal(review.normalizeHideV2ReturnEvent({
  source:'hide-seek',event_type:'TASK_COMPLETED',event_id:'event-no-lap',
  payload:{resultContract:'HIDE_SPECIALIST_RESULT_V2',runtime:'V2',
    taskState:'COMPLETED',taskContext:{session_id:'s',task_id:'t'},
    memorySummary:{authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
      reviewPolicyOwner:'READY_LEARNING_ENGINE',scheduleOwner:'READY_SET_PLANNER'}}
}),null);
assert.equal(normalizedReturnEvent.session_id,'ready-session-1');
assert.equal(normalizedReturnEvent.task_id,'task-review-1');
assert.equal(normalizedReturnEvent.lap_id,'lap-1');
assert.equal(normalizedReturnEvent.task_state,'COMPLETED');
const partialReturn=review.normalizeHideV2ReturnEvent({
 event_id:'evt-hide-v2-partial',event_type:'TASK_PARTIAL',source:'hide-seek',
 payload:{...normalizedReturnEvent.result_payload,
  taskState:'PARTIAL',learningPhase:'FIRST_FIND'}
});
assert.equal(partialReturn.task_state,'PARTIAL');
assert.equal(partialReturn.task_id,'task-review-1');
assert.equal(review.normalizeHideV2ReturnEvent({
 event_id:'evt-hide-v2-state-mismatch',event_type:'TASK_COMPLETED',source:'hide-seek',
 payload:{...normalizedReturnEvent.result_payload,taskState:'PARTIAL'}
}),null);
assert.equal(review.normalizeHideV2ReturnEvent({
 event_id:'evt-hide-v2-event-mismatch',event_type:'TASK_PARTIAL',source:'hide-seek',
 payload:{...normalizedReturnEvent.result_payload,taskState:'COMPLETED'}
}),null);

assert.equal(normalizedReturnEvent.from_app,'hide-seek');
assert.equal(normalizedReturnEvent.event_id,'evt-hide-v2-1');
assert.equal(normalizedReturnEvent.result_payload.resultContract,'HIDE_SPECIALIST_RESULT_V2');
assert.equal(normalizedReturnEvent.result_payload.trailMastery,100);
const centralPayload={...normalizedReturnEvent.result_payload,
 reviewDirective:{authority:'EXPLICIT_CENTRAL_PLANNER_REVIEW_DIRECTIVE'},
 memorySummary:{...normalizedReturnEvent.result_payload.memorySummary,
  reviewPolicyOwner:'TAKY_LEARNING_ENGINE_CORE'}};
assert.equal(review.normalizeHideV2ReturnEvent({event_id:'central-owner-pass',
 source:'hide-seek',event_type:'TASK_COMPLETED',payload:centralPayload}).event_id,'central-owner-pass');
assert.equal(review.normalizeHideSpecialistResult({...centralPayload,
 memorySummary:{...centralPayload.memorySummary,reviewPolicyOwner:'READY_LEARNING_ENGINE'}}),null);
assert.equal(review.normalizeHideSpecialistResult({...normalizedReturnEvent.result_payload,
 memorySummary:{...normalizedReturnEvent.result_payload.memorySummary,
  reviewPolicyOwner:'TAKY_LEARNING_ENGINE_CORE'}}),null);
assert.equal(review.normalizeHideSpecialistResult({
  resultContract:'HIDE_SPECIALIST_RESULT_V2',
  runtime:'V2',
  trailMastery:140,
  memorySummary:{authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',reviewPolicyOwner:'READY_LEARNING_ENGINE',scheduleOwner:'READY_SET_PLANNER'}
}).trailMastery,null);
assert.equal(review.normalizeHideV2ReturnEvent({source:'hide-seek',event_type:'TASK_COMPLETED',payload:{resultContract:'HIDE_SPECIALIST_RESULT_V2',runtime:'V2'}}),null);

assert.equal(review.normalizeHideSpecialistResult({
  memorySummary:{authority:'FORGED',reviewPolicyOwner:'READY_LEARNING_ENGINE',scheduleOwner:'READY_SET_PLANNER'}
}),null);

// Execute the second half of the loop: specialist result -> fresh advisory
// interpretation -> Planner-dated next task -> Ready directive.
const followupPlanner=createPlanner(memoryStorage());
followupPlanner.upsertDailyAvailabilityWindow({date:'2026-09-24',start:'16:00',end:'17:00',confirmed:true,source:'PARENT_CONFIRMED'});
const followup=review.nextReviewFromSpecialistResult({
 resultContract:'HIDE_SPECIALIST_RESULT_V2',runtime:'V2',taskState:'COMPLETED',
 memorySummary:packet
},followupPlanner,{candidate_dates:['2026-09-24'],learning_unit_id:'unit-language-memory'});
assert.equal(followup.ok,true);
assert.equal(followup.scheduled,true);
assert.equal(followup.todo.date,'2026-09-24');
assert.deepEqual(followup.directive.lexicalIds,['word-a','word-b']);
assert.deepEqual(review.directiveForPlannerTodo(followup.todo,'next-ready-task').lexicalIds,['word-a','word-b']);
const stableFollowup=review.nextReviewFromSpecialistResult({
 resultContract:'HIDE_SPECIALIST_RESULT_V2',runtime:'V2',
 memorySummary:{...packet,reviewAdvisories:[packet.reviewAdvisories[2]]}
},followupPlanner,{candidate_dates:['2026-09-24']});
assert.equal(stableFollowup.ok,true);
assert.equal(stableFollowup.scheduled,false);
assert.equal(stableFollowup.reason,'NO_REVIEW_NEEDED');
assert.equal(review.nextReviewFromSpecialistResult({
 resultContract:'HIDE_SPECIALIST_RESULT_V2',runtime:'V2',
 memorySummary:packet
},createPlanner(memoryStorage()),{candidate_dates:['2026-09-24']}).reason,'NO_CONFIRMED_REVIEW_WINDOW');
assert.equal(review.nextReviewFromSpecialistResult({memorySummary:{authority:'FORGED'}},followupPlanner,
 {candidate_dates:['2026-09-24']}).reason,'VALID_HIDE_SPECIALIST_RESULT_REQUIRED');

const outcomePlanner=createPlanner(memoryStorage());
outcomePlanner.upsertDailyAvailabilityWindow({date:'2026-09-25',start:'16:00',end:'17:00',confirmed:true,source:'PARENT_CONFIRMED'});
const outcomeFeedback=review.planFromReadyOutcomes([{
 state:'COMPLETED',task_id:'completed-hide-task',
 specialistResult:normalizedResult,
 memoryReviewFeedback:interpreted
}],outcomePlanner,{candidate_dates:['2026-09-25']});
assert.equal(outcomeFeedback.ok,true);
assert.equal(outcomeFeedback.scheduled.length,1);
assert.equal(outcomeFeedback.scheduled[0].todo.date,'2026-09-25');
assert.equal(outcomeFeedback.scheduled[0].source_task_id,'completed-hide-task');
const repeatFeedback=review.planFromReadyOutcomes([{
 state:'COMPLETED',task_id:'completed-hide-task',specialistResult:normalizedResult,memoryReviewFeedback:interpreted
}],outcomePlanner,{candidate_dates:['2026-09-25']});
assert.equal(repeatFeedback.ok,true);
assert.equal(repeatFeedback.scheduled[0].reused,true);
assert.equal(repeatFeedback.scheduled[0].todo.todo_id,outcomeFeedback.scheduled[0].todo.todo_id);
assert.equal(outcomePlanner.snapshot().dated_todos.length,1);
const replayWithoutAvailability=review.planFromReadyOutcomes([{
 state:'COMPLETED',task_id:'completed-hide-task',specialistResult:normalizedResult,memoryReviewFeedback:interpreted
}],outcomePlanner,{candidate_dates:[]});
assert.equal(replayWithoutAvailability.ok,true);
assert.equal(replayWithoutAvailability.scheduled[0].reused,true);
const conflictingFeedback=review.planFromReadyOutcomes([{
 state:'COMPLETED',task_id:'completed-hide-task',specialistResult:normalizedResult,
 memoryReviewFeedback:{ok:true,decision:{...interpreted.decision,lexicalIds:['different-lexical-id']}}
}],outcomePlanner,{candidate_dates:[]});
assert.equal(conflictingFeedback.ok,false);
assert.equal(conflictingFeedback.reason,'PERSISTED_REVIEW_FEEDBACK_MISMATCH');
const injectedFeedback=review.planFromReadyOutcomes([{
 state:'COMPLETED',task_id:'injected',specialistResult:normalizedResult,
 memoryReviewFeedback:{ok:true,decision:{...interpreted.decision,lexicalIds:['forged-word']}}
}],outcomePlanner,{candidate_dates:['2026-09-25']});
assert.equal(injectedFeedback.reason,'PERSISTED_REVIEW_FEEDBACK_MISMATCH');
assert.equal(outcomePlanner.snapshot().dated_todos.length,1);



assert.equal(review.planFromReadyOutcomes([{task_id:'ordinary',memoryReviewFeedback:interpreted}],
 outcomePlanner,{candidate_dates:['2026-09-25']}).scheduled.length,0);
assert.equal(review.planFromReadyOutcomes([{state:'COMPLETED',task_id:'hide',specialistResult:normalizedResult,
 memoryReviewFeedback:interpreted}],createPlanner(memoryStorage()),{candidate_dates:['2026-09-25']}).reason,
 'NO_CONFIRMED_REVIEW_WINDOW');

assert.equal(review.planFromReadyOutcomes([{state:'PARTIAL',task_id:'incomplete',
 specialistResult:normalizedResult,memoryReviewFeedback:interpreted}],outcomePlanner,
 {candidate_dates:['2026-09-25']}).scheduled.length,0);
assert.equal(review.planFromReadyOutcomes([{state:'COMPLETED',task_id:'forged',
 specialistResult:{...normalizedResult,taskState:'PARTIAL'},memoryReviewFeedback:interpreted}],
 outcomePlanner,{candidate_dates:['2026-09-25']}).scheduled.length,0);

const batchPlanner=createPlanner(memoryStorage());
batchPlanner.upsertDailyAvailabilityWindow({date:'2026-09-26',start:'16:00',end:'17:00',confirmed:true,source:'PARENT_CONFIRMED'});
const goodRow={state:'COMPLETED',task_id:'batch-good',specialistResult:normalizedResult,memoryReviewFeedback:interpreted};
const badRow={...goodRow,task_id:'batch-bad',
 memoryReviewFeedback:{ok:true,decision:{...interpreted.decision,lexicalIds:['injected']}}};
assert.equal(review.planFromReadyOutcomes([goodRow,badRow],batchPlanner,
 {candidate_dates:['2026-09-26']}).reason,'PERSISTED_REVIEW_FEEDBACK_MISMATCH');
assert.equal(batchPlanner.snapshot().dated_todos.length,0);
const duplicateBatch=review.planFromReadyOutcomes([goodRow,goodRow],batchPlanner,
 {candidate_dates:['2026-09-26']});
assert.equal(duplicateBatch.ok,true);
assert.equal(duplicateBatch.scheduled.length,1);
assert.equal(batchPlanner.snapshot().dated_todos.length,1);
assert.equal(review.planFromReadyOutcomes([goodRow,{...goodRow,
 memoryReviewFeedback:{ok:true,decision:{...interpreted.decision,lexicalIds:['injected']}}}],
 batchPlanner,{candidate_dates:['2026-09-26']}).reason,'PERSISTED_REVIEW_FEEDBACK_MISMATCH');

const centralExcluded=review.planFromReadyOutcomes([{
 ...goodRow,task_id:'central-follow-up',
 centralCheckpoint:{source:'PLANNER_CENTRAL_LEARNING_CHECKPOINT'}
}],batchPlanner,{candidate_dates:['2026-09-26']});
assert.equal(centralExcluded.ok,true);
assert.equal(centralExcluded.scheduled.length,0);
assert.equal(batchPlanner.snapshot().dated_todos.length,1);
const fs=require('fs');
const runtime=fs.readFileSync(require('path').join(__dirname,'..','ready-runtime-v07.js'),'utf8');
assert(runtime.includes("url.searchParams.set('review_directive',JSON.stringify(task.review_directive))"));
assert(runtime.includes("HIDE_V2_TARGET_REQUIRED"));
assert(runtime.includes("configuredHideV2Url"));
assert(runtime.includes("p.get('learning_event')"));
assert(runtime.includes("normalizeHideV2ReturnEvent"));
assert(runtime.includes('A review task cannot be completed by bare return URL parameters.'));
assert(runtime.includes('if(task.review_directive && normalized===\'COMPLETED\' && from_app!==\'hide-seek\') return false;'));
assert(runtime.includes('!event_id || !result_payload ||'));

assert(runtime.includes("result_payload: e.payload||null"));
assert(runtime.includes("task.specialist_result=task.central_checkpoint"));
assert(runtime.includes("specialistResult:task.specialist_result||null"));
assert(runtime.includes("memoryReviewFeedback:task.state==='COMPLETED' && !task.central_checkpoint"));
assert(runtime.includes("task.specialist_result?.sourceApp==='hide-seek'"));
assert(runtime.includes('task.specialist_result.memorySummary'));
assert(runtime.includes('completeSessionFromTaskOutcomes(taskOutcomes)'));


console.log('PASS: Hide memory advisory -> Ready policy -> Planner directive roundtrip');