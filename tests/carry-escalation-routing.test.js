'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'../ready-integration-v1.js'),'utf8');
const events=[];
const carry={
  carry_over_id:'carry-1',
  assignment_id:'assignment-1',
  escalation_level:'PARENT_LEARNING_MASTER_REVIEW',
  escalation_reason:'DEADLINE_EXCEEDED',
  state:'OPEN',
  next_carry_over_depth:4,
  deadline_date:'2026-10-02',
  escalated_at:'2026-10-02T01:00:00.000Z',
  updated_at:'2026-10-02T01:00:00.000Z'
};
const fact={
  assignment_id:'assignment-1',
  fact_revision:1,
  book_subject:'영어',
  teacher_instruction:'vocabulary'
};
class CustomEvent{
  constructor(type,options={}){this.type=type;this.detail=options.detail;}
}
const window={
  ReadyAssignments:{load:()=>({assignmentFacts:{'assignment-1':fact}})},
  ReadyLearningMasterV01:{PROFILE:{}},
  ReadySetPlanner:{
    carryOverCandidates:()=>[carry],
    learningHistory:()=>[
      {ready_state:'PARTIAL',actual_minutes:20},
      {ready_state:'DEFERRED',actual_minutes:22},
      {ready_state:'PARTIAL',actual_minutes:24},
      {ready_state:'BLOCKED',actual_minutes:25}
    ]
  },
  addEventListener(){},
  dispatchEvent(event){events.push(event);return true;}
};
const document={documentElement:{dataset:{}}};
const context={window,document,CustomEvent,structuredClone,console};
context.globalThis=context;
vm.runInNewContext(source,context,{timeout:2000});
const api=window.ReadyIntegrationV1;

const schedule=api.reviewEscalatedCarryOver('carry-1');
assert.equal(schedule.ok,false);
assert.equal(schedule.reason,'PLANNER_PARENT_RESOLUTION_REQUIRED');
assert.equal(schedule.resolution_owner,'READY_SET_PLANNER_AND_PARENT');
assert.equal(schedule.central_learning_evidence_candidate,null);
assert.equal(schedule.carry_preserved,true);
assert.equal(schedule.planner_mutation_performed,false);
assert.equal(events.length,0);

carry.escalation_reason='REPEATED_CARRY_LIMIT';
const friction=api.reviewEscalatedCarryOver('carry-1');
assert.equal(friction.ok,false);
assert.equal(friction.reason,'CENTRAL_LEARNING_ENGINE_REVIEW_REQUIRED');
assert.equal(friction.carry_preserved,true);
assert.equal(friction.planner_mutation_performed,false);
assert.equal(friction.local_reinterpretation_performed,false);
assert.equal(friction.classification.execution_friction,true);
assert.equal(friction.classification.schedule_pressure,false);
const candidate=friction.central_learning_evidence_candidate;
assert.equal(candidate.authority,'READY_EXECUTION_FRICTION_OBSERVATION_ONLY');
assert.equal(candidate.event_id,'ready-friction:carry-1:4');
assert.equal(candidate.observed_at,'2026-10-02T01:00:00.000Z');
assert.equal(candidate.observation_only,true);
assert.equal(candidate.global_mastery_claim,false);
assert.equal(Object.prototype.hasOwnProperty.call(candidate,'deadline_date'),false);
assert.equal(events.length,1);
assert.equal(events[0].type,'readyset-learning-friction-observation-ready');
assert.equal(events[0].detail.event_id,candidate.event_id);

console.log('READY_CARRY_ESCALATION_ROUTING_PASS');
