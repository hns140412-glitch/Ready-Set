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
assert.equal(interpreted.decision.policyState,'REVIEW_REQUIRED');
assert.deepEqual(interpreted.decision.lexicalIds,['word-a','word-b']);
assert.equal(interpreted.decision.date,null);
assert.equal(interpreted.decision.todoId,null);
assert.equal('scheduledDate' in interpreted.decision,false);

const planner=createPlanner(memoryStorage());
planner.upsertDailyAvailabilityWindow({date:'2026-09-22',start:'16:00',end:'17:00',confirmed:true,source:'PARENT_CONFIRMED'});
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
  activeSheetId:'sheet-1',
  sheetStatus:'COMPLETED',
  taskState:'COMPLETED',
  learningPhase:'final',
  trailMastery:88,
  memorySummary:{
    authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
    reviewPolicyOwner:'READY_LEARNING_ENGINE',
    scheduleOwner:'READY_SET_PLANNER',
    prioritySemantics:'ADVISORY_SIGNAL_NOT_DATE',
    reviewAdvisories:[{lexicalId:'word-a',advisoryOnly:true,evidenceBasis:'HIDE_MEMORY_EVIDENCE'}]
  }
});
assert.equal(normalizedResult.sourceApp,'hide-seek');
assert.equal(normalizedResult.trailMastery,88);
assert.equal(normalizedResult.memorySummary.authority,'SPECIALIST_MEMORY_ADVISORY_ONLY');

assert.equal(review.normalizeHideSpecialistResult({
  memorySummary:{authority:'FORGED',reviewPolicyOwner:'READY_LEARNING_ENGINE',scheduleOwner:'READY_SET_PLANNER'}
}),null);

const fs=require('fs');
const runtime=fs.readFileSync(require('path').join(__dirname,'..','ready-runtime-v07.js'),'utf8');
assert(runtime.includes("url.searchParams.set('review_directive',JSON.stringify(task.review_directive))"));
assert(runtime.includes("result_payload: e.payload||null"));
assert(runtime.includes("task.specialist_result=specialistResult"));
assert(runtime.includes("specialistResult:task.specialist_result||null"));

console.log('PASS: Hide memory advisory -> Ready policy -> Planner directive roundtrip');