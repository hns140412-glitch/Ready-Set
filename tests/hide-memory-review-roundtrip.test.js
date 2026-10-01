'use strict';
const assert=require('assert');
const review=require('../ready-hide-memory-review-v01.js');
const {createPlanner}=require('../ready-planner-v01.js');

function memoryStorage(){
  const m=new Map();
  return {
    getItem:k=>m.has(k)?m.get(k):null,
    setItem:(k,v)=>m.set(k,String(v)),
    removeItem:k=>m.delete(k)
  };
}

const packet={
  authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
  reviewPolicyOwner:'READY_LEARNING_ENGINE',
  scheduleOwner:'READY_SET_PLANNER',
  prioritySemantics:'ADVISORY_SIGNAL_NOT_DATE',
  reviewAdvisories:[
    {lexicalId:'word-a',nextReviewPriority:90,reason:'recovery',advisoryOnly:true,
     evidenceBasis:'HIDE_MEMORY_EVIDENCE',needsUnassistedRecall:true,
     recoveryStatus:'NEEDS_UNASSISTED_RECALL',memoryStrength:42},
    {lexicalId:'word-b',nextReviewPriority:70,reason:'confusion',advisoryOnly:true,
     evidenceBasis:'HIDE_MEMORY_EVIDENCE',needsUnassistedRecall:false,
     recoveryStatus:'UNPROVEN',memoryStrength:61},
    {lexicalId:'stable-word',nextReviewPriority:10,reason:'stable',advisoryOnly:true,
     evidenceBasis:'HIDE_MEMORY_EVIDENCE'}
  ]
};

const interpreted=review.interpretHideMemorySummary(packet);
assert.equal(interpreted.ok,true);
assert.equal(interpreted.decision.authority,'READY_LOCAL_MEMORY_REVIEW_ADVISORY_ONLY');
assert.equal(interpreted.decision.reviewPolicyOwner,'TAKY_LEARNING_ENGINE_CORE');
assert.equal(interpreted.decision.scheduleOwner,'READY_SET_PLANNER');
assert.equal(interpreted.decision.plannerMutationAuthorized,false);
assert.equal(interpreted.decision.policyState,'REVIEW_REQUIRED');
assert.deepEqual(interpreted.decision.lexicalIds,['word-a','word-b']);
assert.equal(interpreted.decision.guards.ready_local_review_policy_authority,false);
assert.equal(interpreted.decision.guards.central_learning_engine_required,true);

const planner=createPlanner(memoryStorage());
planner.upsertDailyAvailabilityWindow({
  date:'2026-09-22',start:'16:00',end:'17:00',
  confirmed:true,source:'PARENT_CONFIRMED'
});
const before=planner.snapshot().dated_todos.length;
const blocked=review.planReview(interpreted.decision,planner,{
  candidate_dates:['2026-09-22'],learning_unit_id:'unit-language-memory'
});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'CENTRAL_LEARNING_ENGINE_REVIEW_REQUIRED');
assert.equal(blocked.legacy_local_planning_disabled,true);
assert.equal(blocked.plannerMutationAttempted,false);
assert.equal(planner.snapshot().dated_todos.length,before);

// Historical already-scheduled local TODOs remain readable so old state can
// complete safely, but this module can no longer create them.
const legacyTodo=planner.upsertDatedTodo({
  date:'2026-09-22',
  label:'Legacy memory review',
  source:'PLANNER_SPECIALIST_MEMORY_REVIEW',
  source_actor:'READY_SET_PLANNER',
  provenance:{
    kind:'HIDE_MEMORY_REVIEW',
    review_policy_authority:'READY_LEARNING_ENGINE',
    schedule_authority:'READY_SET_PLANNER',
    lexical_ids:['word-a','word-b']
  },
  state:'PLANNED'
});
const legacyDirective=review.directiveForPlannerTodo(legacyTodo,'legacy-task');
assert.equal(legacyDirective.authority,'EXPLICIT_READY_PLANNER_REVIEW_DIRECTIVE');
assert.equal(legacyDirective.reviewPolicyOwner,'READY_LEARNING_ENGINE');
assert.deepEqual(legacyDirective.lexicalIds,['word-a','word-b']);

const normalized=review.normalizeHideSpecialistResult({
  resultContract:'HIDE_SPECIALIST_RESULT_V2',
  runtime:'V2',
  activeMissionId:'mission-1',
  missionStatus:'COMPLETED',
  taskState:'COMPLETED',
  learningPhase:'COMPLETE',
  trailMastery:100,
  memorySummary:packet
});
assert.equal(normalized.sourceApp,'hide-seek');
assert.equal(normalized.resultContract,'HIDE_SPECIALIST_RESULT_V2');
assert.equal(normalized.memorySummary.authority,'SPECIALIST_MEMORY_ADVISORY_ONLY');

const normalizedEvent=review.normalizeHideV2ReturnEvent({
  event_id:'evt-hide-v2-1',
  event_type:'TASK_COMPLETED',
  source:'hide-seek',
  payload:{
    resultContract:'HIDE_SPECIALIST_RESULT_V2',
    runtime:'V2',
    taskContext:{session_id:'ready-session-1',task_id:'legacy-task',lap_id:'lap-1'},
    activeMissionId:'mission-1',
    missionStatus:'COMPLETED',
    taskState:'COMPLETED',
    learningPhase:'COMPLETE',
    trailMastery:100,
    memorySummary:packet
  }
});
assert.equal(normalizedEvent.session_id,'ready-session-1');
assert.equal(normalizedEvent.task_id,'legacy-task');
assert.equal(normalizedEvent.task_state,'COMPLETED');

// Central directives use TAKY Learning Engine as review owner and remain valid.
const centralPayload={
  ...normalizedEvent.result_payload,
  reviewDirective:{authority:'EXPLICIT_CENTRAL_PLANNER_REVIEW_DIRECTIVE'},
  memorySummary:{
    ...normalizedEvent.result_payload.memorySummary,
    reviewPolicyOwner:'TAKY_LEARNING_ENGINE_CORE'
  }
};
assert.equal(review.normalizeHideV2ReturnEvent({
  event_id:'central-owner-pass',source:'hide-seek',
  event_type:'TASK_COMPLETED',payload:centralPayload
}).event_id,'central-owner-pass');

// Local follow-up is observation-only: no Planner mutation.
const followupPlanner=createPlanner(memoryStorage());
followupPlanner.upsertDailyAvailabilityWindow({
  date:'2026-09-24',start:'16:00',end:'17:00',
  confirmed:true,source:'PARENT_CONFIRMED'
});
const countBefore=followupPlanner.snapshot().dated_todos.length;
const followup=review.nextReviewFromSpecialistResult({
  resultContract:'HIDE_SPECIALIST_RESULT_V2',runtime:'V2',
  taskState:'COMPLETED',memorySummary:packet
},followupPlanner,{candidate_dates:['2026-09-24']});
assert.equal(followup.ok,true);
assert.equal(followup.scheduled,false);
assert.equal(followup.reason,'CENTRAL_LEARNING_ENGINE_REVIEW_REQUIRED');
assert.equal(followup.plannerMutationAttempted,false);
assert.equal(followupPlanner.snapshot().dated_todos.length,countBefore);

const outcomePlanner=createPlanner(memoryStorage());
outcomePlanner.upsertDailyAvailabilityWindow({
  date:'2026-09-25',start:'16:00',end:'17:00',
  confirmed:true,source:'PARENT_CONFIRMED'
});
const outcomeBefore=outcomePlanner.snapshot().dated_todos.length;
const feedback=review.planFromReadyOutcomes([{
  state:'COMPLETED',
  task_id:'completed-hide-task',
  specialistResult:normalized,
  memoryReviewFeedback:interpreted
}],outcomePlanner,{candidate_dates:['2026-09-25']});
assert.equal(feedback.ok,true);
assert.equal(feedback.reason,'CENTRAL_LEARNING_ENGINE_REVIEW_REQUIRED');
assert.equal(feedback.plannerMutationAttempted,false);
assert.deepEqual(feedback.observation_task_ids,['completed-hide-task']);
assert.deepEqual(feedback.scheduled,[]);
assert.equal(outcomePlanner.snapshot().dated_todos.length,outcomeBefore);

assert.equal(review.interpretHideMemorySummary({
  ...packet,authority:'HIDE_SCHEDULER'
}).ok,false);
assert.equal(review.nextReviewFromSpecialistResult({
  memorySummary:{authority:'FORGED'}
},outcomePlanner).reason,'VALID_HIDE_SPECIALIST_RESULT_REQUIRED');

const fs=require('fs');
const runtime=fs.readFileSync(require('path').join(__dirname,'..','ready-runtime-v07.js'),'utf8');
assert(runtime.includes('normalizeHideV2ReturnEvent'));
assert(runtime.includes('specialistResult:task.specialist_result||null'));
assert(runtime.includes('memoryReviewFeedback:task.state===\'COMPLETED\' && !task.central_checkpoint'));
assert(runtime.includes('completeSessionFromTaskOutcomes(taskOutcomes)'));

console.log('PASS: Hide memory advisory -> Ready observation compatibility; central Learning Engine owns review policy and Planner mutation');
