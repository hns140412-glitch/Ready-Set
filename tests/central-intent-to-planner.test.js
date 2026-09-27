'use strict';
const assert=require('node:assert/strict');
const Intake=require('../ready-central-learning-decision-intake-v01.js');
const Bridge=require('../ready-central-intent-to-planner-v01.js');
const Planner=require('../ready-planner-v01.js');
const values=new Map();
const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
const planner=Planner.createPlanner(storage);
const coreScope={member_id:'CHILD_A',subject:'english',
 concept_skill_target:'vocabulary'};
const context={family_id:'F1',member_id:'CHILD_A',subject:'english',
 concept_skill_target:'vocabulary',
 receipt_scope:{family_id:'F1',member_id:'CHILD_A'}};
const activeSession={authenticated:true,family_id:'F1',selected_member_id:'CHILD_A'};
const adaptive_plan={ok:true,adaptive_plan_contract:'TAKY_ADAPTIVE_PLAN_INTENT_V1',
 authority:'LEARNING_ADAPTIVE_PLAN_INTENT_ONLY',scope:coreScope,
 unit_span_policy:'REDUCE',add_checkpoint:true,add_retrieval_checkpoint:true,
 recovery_floor:'HIGH',assistance_policy:'FADE_GRADUALLY',
 target_learning_ids:['word:a']};
const runtime={ok:true,authority:'TAKY_LEARNING_ENGINE_CORE',
 engine_runtime:'TAKY_LEARNING_ENGINE_RUNTIME_V1',scope:coreScope,
 decision:{ok:true,authority:'LEARNING_DECISION_INTENT_ONLY',
  decision_contract:'TAKY_RUNTIME_DECISION_CONTRACT_V1',scope:coreScope,
  consumer_contract:{planner:'OWNS_DATED_ALLOCATION'},
  execution_status:'PEDAGOGICAL_ACTION_AVAILABLE',
  pedagogical_actions:[{intent:'TARGETED_RECOVERY_PRACTICE',priority:'HIGH'}],
  adaptive_plan},
 trace:{verified_receipt_id:'real-evidence:server-r1',verified_evidence_count:1,
  evidence_ids:['server-e1']}};
const intent=Intake.accept(runtime,context);
assert.equal(intent.ok,true);
assert.equal(Bridge.planAccepted(intent,planner,{activeSession,candidate_dates:['2026-09-30']})
 .reason,'NO_CONFIRMED_PLANNER_WINDOW');
assert.equal(planner.snapshot().dated_todos.length,0);
planner.upsertDailyAvailabilityWindow({date:'2026-09-30',start:'16:00',end:'17:00',
 confirmed:true,source:'PARENT_CONFIRMED'});
const planned=Bridge.planAccepted(intent,planner,{activeSession,candidate_dates:['2026-09-30']});
assert.equal(planned.ok,true,JSON.stringify(planned));
assert.equal(planned.scheduled,true);
assert.equal(planned.todo.date,'2026-09-30');
assert.equal(planned.todo.source,'PLANNER_CENTRAL_LEARNING_CHECKPOINT');
assert.deepEqual(planned.todo.activity_sequence,
 ['SHORT_LEARNING_UNIT','RETRIEVAL_CHECKPOINT','ASSISTANCE_FADING']);
assert.equal(planned.todo.provenance.verified_receipt_id,'real-evidence:server-r1');
assert.equal(planned.todo.provenance.schedule_authority,'READY_SET_PLANNER');
const linked=planner.linkTodayItems([planned.todo.todo_id],{date:'2026-09-30'});
assert.equal(linked.length,1);
assert.deepEqual(linked[0].activity_sequence,planned.todo.activity_sequence);
assert.equal(linked[0].review_policy.authority,'TAKY_LEARNING_ENGINE_CORE');
const replay=Bridge.planAccepted(intent,planner,{activeSession,candidate_dates:[]});
assert.equal(replay.ok,true);
assert.equal(replay.reused,true);
assert.equal(planner.snapshot().dated_todos.length,1);
assert.equal(Bridge.planAccepted(intent,planner,{activeSession:{...activeSession,
 selected_member_id:'CHILD_B'},candidate_dates:['2026-09-30']}).reason,
 'ACTIVE_CENTRAL_PLANNER_SCOPE_REQUIRED');
assert.equal(Bridge.planAccepted({...intent,trace:{}},planner,{
 activeSession,candidate_dates:['2026-09-30']}).reason,
 'SERVER_VERIFIED_DECISION_BASIS_REQUIRED');
assert.equal(Bridge.planAccepted({...intent,adaptive_plan:{...intent.adaptive_plan,
 unit_span_policy:'KEEP'}},planner,{activeSession,candidate_dates:['2026-09-30']})
 .reason,'CENTRAL_CHECKPOINT_REPLAY_CONFLICT');
const observation=Intake.accept({...runtime,
 decision:{...runtime.decision,execution_status:'HOLD_FOR_MORE_RELIABLE_INTERPRETATION'}},
 context);
assert.equal(observation.ok,false);
assert.equal(Bridge.planAccepted(observation,planner,{activeSession,
 candidate_dates:['2026-09-30']}).reason,'CENTRAL_ADAPTIVE_INTENT_REQUIRED');
const noCheckpoint={...intent,adaptive_plan:{...intent.adaptive_plan,
 add_checkpoint:false,add_retrieval_checkpoint:false}};
assert.equal(Bridge.planAccepted(noCheckpoint,planner,{activeSession,
 candidate_dates:['2026-09-30']}).scheduled,false);
console.log('READY_CENTRAL_INTENT_PLANNER_PASS: verified server intent -> Planner available date -> linked Ready activity, scope/isolation, replay and HOLD');
