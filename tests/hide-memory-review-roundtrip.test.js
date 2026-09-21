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

console.log('PASS: Hide memory advisory -> Ready policy -> Planner directive roundtrip');