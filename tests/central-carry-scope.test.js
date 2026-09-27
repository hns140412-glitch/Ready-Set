'use strict';
const assert=require('node:assert/strict');
const Planner=require('../ready-planner-v01.js');
const values=new Map();
const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
const planner=Planner.createPlanner(storage);
const a={authenticated:true,family_id:'F1',selected_member_id:'CHILD_A'};
const b={authenticated:true,family_id:'F1',selected_member_id:'CHILD_B'};
const todo=planner.upsertDatedTodo({todo_id:'central-carry-a',
 date:'2026-09-27',label:'회상 점검 A',
 source:'PLANNER_CENTRAL_LEARNING_CHECKPOINT',state:'PLANNED',
 review_policy:{authority:'TAKY_LEARNING_ENGINE_CORE'},
 provenance:{family_id:'F1',member_id:'CHILD_A',
  schedule_authority:'READY_SET_PLANNER'}});
const started=planner.recordTaskState({todo_id:todo.todo_id,
 ready_state:'IN_PROGRESS',session_id:'s1',task_id:'t1'});
assert.equal(started.state,'IN_PROGRESS');
const finished=planner.recordSessionOutcome({todo_id:todo.todo_id,
 ready_state:'PARTIAL',actual_ms:120000,session_id:'s1',task_id:'t1'});
assert.equal(finished.ok,true);
const carry=planner.snapshot().carry_over_queue.find(x=>x.source_todo_id===todo.todo_id);
assert.equal(carry.source_todo_source,'PLANNER_CENTRAL_LEARNING_CHECKPOINT');
assert.deepEqual(carry.central_scope,{family_id:'F1',member_id:'CHILD_A'});
assert.equal(planner.carryOverCandidates().length,0);
assert.equal(planner.carryOverCandidates({central_scope:b}).length,0);
assert.equal(planner.carryOverCandidates({central_scope:a}).length,1);
assert.equal(planner.replanReadyCarryOvers({date:'2026-09-28'}).attempted,0);
assert.equal(planner.replanCarryOver({carry_over_id:carry.carry_over_id,date:'2026-09-28'}).reason,
 'CENTRAL_CHECKPOINT_REQUIRES_FRESH_LEARNING_DECISION');
assert.equal(planner.resolveCarryOver(carry.carry_over_id,{resolution:'CANCEL'}).reason,
 'CENTRAL_CARRY_OVER_MEMBER_SCOPE_REQUIRED');
assert.equal(planner.resolveCarryOver(carry.carry_over_id,{
 resolution:'CANCEL',central_scope:b}).reason,'CENTRAL_CARRY_OVER_MEMBER_SCOPE_REQUIRED');
assert.equal(planner.resolveCarryOver(carry.carry_over_id,{
 resolution:'READY_FOR_REPLAN',central_scope:a}).reason,
 'CENTRAL_CHECKPOINT_REQUIRES_FRESH_LEARNING_DECISION');
assert.equal(planner.resolveCarryOver(carry.carry_over_id,{
 resolution:'CANCEL',central_scope:a}).ok,true);
assert.equal(planner.carryOverCandidates({central_scope:a}).length,0);
// Simulate an older stored carry-over before central_scope metadata existed.
const previous=planner.upsertDatedTodo({todo_id:'central-legacy-a',
 date:'2026-09-27',label:'이전 중앙 점검',
 source:'PLANNER_CENTRAL_LEARNING_CHECKPOINT',state:'PLANNED',
 review_policy:{authority:'TAKY_LEARNING_ENGINE_CORE'},
 provenance:{family_id:'F1',member_id:'CHILD_A',
  schedule_authority:'READY_SET_PLANNER'}});
planner.recordTaskState({todo_id:previous.todo_id,ready_state:'IN_PROGRESS',
 session_id:'sLegacy',task_id:'tLegacy'});
planner.recordSessionOutcome({todo_id:previous.todo_id,ready_state:'PARTIAL',
 actual_ms:10000,session_id:'sLegacy',task_id:'tLegacy'});
const raw=JSON.parse(values.get('readyset_planner_v1'));
const old=raw.carry_over_queue.find(x=>x.source_todo_id===previous.todo_id);
delete old.source_todo_source;delete old.central_scope;
values.set('readyset_planner_v1',JSON.stringify(raw));
assert.equal(planner.carryOverCandidates().length,0);
assert.equal(planner.carryOverCandidates({central_scope:b}).length,0);
assert.equal(planner.carryOverCandidates({central_scope:a}).length,1);
assert.equal(planner.replanReadyCarryOvers({date:'2026-09-28'}).attempted,0);
assert.equal(planner.replanCarryOver({carry_over_id:old.carry_over_id,
 date:'2026-09-28'}).reason,'CENTRAL_CHECKPOINT_REQUIRES_FRESH_LEARNING_DECISION');
assert.equal(planner.resolveCarryOver(old.carry_over_id,{
 resolution:'CANCEL',central_scope:b}).reason,'CENTRAL_CARRY_OVER_MEMBER_SCOPE_REQUIRED');
assert.equal(planner.resolveCarryOver(old.carry_over_id,{
 resolution:'CANCEL',central_scope:a}).ok,true);
// Ordinary local carry-over retains its established behavior.
const local=planner.upsertDatedTodo({todo_id:'regular',
 date:'2026-09-27',label:'일반 과제',source:'PLANNER_ALLOCATION',state:'PLANNED'});
planner.recordTaskState({todo_id:local.todo_id,ready_state:'IN_PROGRESS',
 session_id:'s2',task_id:'t2'});
planner.recordSessionOutcome({todo_id:local.todo_id,ready_state:'PARTIAL',
 actual_ms:60000,session_id:'s2',task_id:'t2'});
assert.equal(planner.carryOverCandidates().length,1);
const automatic=planner.replanReadyCarryOvers({date:'2026-09-28'});
assert.equal(automatic.attempted,1);
assert.equal(automatic.results[0].ok,true,JSON.stringify(automatic));
assert.equal(automatic.results[0].todo.source,'PLANNER_V2_CARRY_OVER');
const app=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app.js'),'utf8');
assert(app.includes("x.source_todo_source!=='PLANNER_CENTRAL_LEARNING_CHECKPOINT'"));
assert(app.includes('central_scope:centralPlannerScope()'));
console.log('READY_CENTRAL_CARRY_SCOPE_PASS: scoped partial feedback; central auto replan denied; sibling/anonymous concealment; local carry-over intact');
