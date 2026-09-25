#!/usr/bin/env node
const assert=require('assert');

const events=[];
global.window={
  addEventListener(){},
  dispatchEvent(e){events.push(e)},
  ReadyAssignments:{load(){return {assignmentFacts:{}}}},
  ReadyLearningMasterV01:{},
  ReadySetPlanner:{}
};
global.document={documentElement:{dataset:{}}};
global.CustomEvent=class CustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail}};

require('../../ready-integration-v1.js');
const api=global.window.ReadyIntegrationV1;
assert(api);
const request=api.consumeLearningAction({
  child_id:'C1',
  runtime:{next_learning_action:{
    planner_allocation_allowed:true,
    action:'REVIEW_UNIT',
    skill_id:'VOCAB',
    intensity:'LOW',
    estimated_units:1
  }}
});
assert.strictEqual(request.schema,'TAKY_READY_LEARNING_ACTION_V1');
assert.strictEqual(request.accepted_for_planner,true);
assert.strictEqual(request.child_id,'C1');
assert.strictEqual(request.skill_id,'VOCAB');
assert.strictEqual(request.planner_date,null);
assert.strictEqual(request.preferred_date,null);
assert.strictEqual(request.guards.ready_planner_owns_date,true);
assert.strictEqual(request.guards.learning_engine_does_not_write_schedule,true);
assert.strictEqual(events[0].type,'taky-ready-learning-action');
assert.deepStrictEqual(events[0].detail,request);

const hold=api.consumeLearningAction({runtime:{next_learning_action:{planner_allocation_allowed:false,action:'NO_LEARNING_ACTION'}}});
assert.strictEqual(hold.accepted_for_planner,false);
assert.strictEqual(hold.planner_date,null);

console.log(JSON.stringify({pass:true,ready_planner_owns_date:true,learning_action_candidate_only:true}));
