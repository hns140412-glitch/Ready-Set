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
  basis_kind:'VERIFIED_ONLY',evidence_ids:['server-e1']}};
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
assert.equal(planner.todayProjection('2026-09-30').length,0);
assert.equal(planner.linkTodayItems([planned.todo.todo_id],{date:'2026-09-30'}).length,0);
assert.equal(planner.todayProjection('2026-09-30',{central_scope:{
 ...activeSession,selected_member_id:'CHILD_B'}}).length,0);
assert.equal(planner.linkTodayItems([planned.todo.todo_id],{date:'2026-09-30',
 central_scope:{...activeSession,selected_member_id:'CHILD_B'}}).length,0);
assert.equal(planner.todayProjection('2026-09-30',{central_scope:activeSession}).length,1);
const linked=planner.linkTodayItems([planned.todo.todo_id],{date:'2026-09-30',
 central_scope:activeSession});
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
 'SERVER_SCOPED_DECISION_BASIS_REQUIRED');
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
const advisoryDigest='a'.repeat(64);
const advisoryRuntime={...runtime,
 decision:{...runtime.decision,pedagogical_actions:[{
  intent:'RETRIEVAL_CHECKPOINT',priority:'HIGH',basis:['HIDE_MEMORY_ADVISORY_ONLY']}]},
 trace:{verified_receipt_id:null,verified_evidence_count:0,
  basis_kind:'OBSERVATION_ADVISORY_ONLY',
  observation_review_evidence_count:1,
  observation_review_evidence_ids:['ready-observation-2'],
  observation_review_digest_sha256:advisoryDigest}};
const advisoryIntent=Intake.accept(advisoryRuntime,context);
assert.equal(advisoryIntent.ok,true);
const advisoryTodo=Bridge.planAccepted(advisoryIntent,planner,{activeSession,
 candidate_dates:['2026-09-30']});
assert.equal(advisoryTodo.ok,true,JSON.stringify(advisoryTodo));
assert.equal(advisoryTodo.todo.provenance.verified_receipt_id,null);
assert.equal(advisoryTodo.todo.provenance.basis_kind,'OBSERVATION_ADVISORY_ONLY');
assert.equal(advisoryTodo.todo.provenance.observation_basis_digest_sha256,advisoryDigest);
assert.equal(advisoryTodo.todo.review_policy.observation_is_verified_proof,false);
assert.equal(Bridge.planAccepted(advisoryIntent,planner,{activeSession,
 candidate_dates:[]}).reused,true);
assert.equal(planner.snapshot().dated_todos.length,2);
assert.equal(Bridge.planAccepted({...advisoryIntent,actions:[]},planner,{
 activeSession,candidate_dates:['2026-09-30']}).reason,
 'SERVER_SCOPED_DECISION_BASIS_REQUIRED');
assert.equal(Bridge.planAccepted({...advisoryIntent,trace:{
 ...advisoryIntent.trace,observation_review_digest_sha256:'bad'}},planner,{
 activeSession,candidate_dates:['2026-09-30']}).reason,
 'SERVER_SCOPED_DECISION_BASIS_REQUIRED');
const taskStarted=planner.recordTaskState({todo_id:planned.todo.todo_id,
 ready_state:'IN_PROGRESS',session_id:'central-s1',task_id:'central-t1'});
assert.equal(taskStarted.state,'IN_PROGRESS');
const taskEnded=planner.recordSessionOutcome({todo_id:planned.todo.todo_id,
 ready_state:'PARTIAL',session_id:'central-s1',task_id:'central-t1',actual_ms:50000});
assert.equal(taskEnded.ok,true);
const oldReceipt=Bridge.planAccepted(intent,planner,{activeSession,candidate_dates:['2026-09-30']});
assert.equal(oldReceipt.ok,false);
assert.equal(oldReceipt.reason,'CENTRAL_CHECKPOINT_REQUIRES_NEW_EVIDENCE');
assert.equal(planner.snapshot().dated_todos.length,2);
const priorCarry=planner.snapshot().carry_over_queue.find(x=>
 x.source_todo_id===planned.todo.todo_id);
assert.equal(priorCarry.status,'OPEN');
const refreshed={...intent,trace:{...intent.trace,
 verified_receipt_id:'real-evidence:server-r2',verified_evidence_count:2}};
const next=Bridge.planAccepted(refreshed,planner,{
 activeSession,candidate_dates:['2026-09-30']});
assert.equal(next.ok,true,JSON.stringify(next));
assert.equal(next.reused,undefined);
assert.equal(next.previous_carry_reconciled.length,1);
assert.equal(next.previous_carry_reconciled[0],priorCarry.carry_over_id);
assert.equal(planner.snapshot().dated_todos.length,3);
const resolvedCarry=planner.snapshot().carry_over_queue.find(x=>
 x.carry_over_id===priorCarry.carry_over_id);
assert.equal(resolvedCarry.status,'RESOLVED');
assert.equal(resolvedCarry.resolution,'SUPERSEDED_BY_FRESH_CENTRAL_DECISION');
assert.equal(resolvedCarry.rescheduled_todo_id,next.todo.todo_id);
assert.equal(next.todo.date,'2026-09-30');
assert.equal(Bridge.planAccepted(refreshed,planner,{activeSession,
 candidate_dates:['2026-09-30']}).reused,true);
console.log('READY_CENTRAL_INTENT_PLANNER_PASS: verified server intent -> Planner available date -> linked Ready activity, scope/isolation, replay and HOLD');
