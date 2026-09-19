#!/usr/bin/env node
const assert=require('assert');
const plannerCore=require('../../ready-planner-v01.js');
const domainCore=require('../../ready-assignment-domain-v2.js');
const learning=require('../../ready-learning-master-v01.js');
class MemoryStorage{constructor(){this.m=new Map()}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}}
const planner=plannerCore.createPlanner(new MemoryStorage()),domain=domainCore.createDomain(new MemoryStorage());
planner.upsertScheduleCommitment({title:'영어학원',start_at:'2026-09-21T17:00:00',end_at:'2026-09-21T18:30:00',confirmed:true});
const books=domainCore.TALENT_BOOKS.map((subject,i)=>({subject,source_range:`unit ${i}`}));
const pkg=domain.upsertTalentPackage({actor:'PARENT',source_date:'2026-09-20',deadline_boundary:'2026-09-27',books});
for(const assignmentId of pkg.fact_ids)domain.confirmFact(assignmentId,{actor:'PARENT'});
let state=domain.load(),interpreted=learning.interpretInto(state,pkg.fact_ids[0]);domain.save(state);
const run=planner.allocateLearningUnits({assignment_id:pkg.fact_ids[0],domain_state:state,candidate_dates:['2026-09-20','2026-09-21','2026-09-27']});
assert.strictEqual(run.ok,true);
assert.strictEqual(run.primary_basis,'LEARNING_UNIT_ACTIVITY_LOAD');
assert.strictEqual(run.proposals[0].date,'2026-09-20','confirmed Schedule Commitment must influence date choice');
assert.strictEqual(run.proposals[0].date!=='2026-09-27',true);
const committed=planner.commitLearningAllocation(run.allocation_run_id);assert.strictEqual(committed.created.length,1);
const todo=committed.created[0];for(const key of ['assignment_id','analysis_id','learning_unit_id','template_id','allocation_run_id','todo_id'])assert(todo[key],key);
assert.strictEqual(todo.estimated_minutes,null);
assert.deepStrictEqual(planner.linkOrCreateTodayItems(['not-a-todo'],{date:'2026-09-20'}),[]);
assert.strictEqual(planner.linkTodayItems([todo.todo_id],{date:'2026-09-20'})[0].learning_unit_id,todo.learning_unit_id);
planner.recordTaskState({todo_id:todo.todo_id,ready_state:'PARTIAL',session_id:'s1',task_id:'t1'});
planner.recordSessionOutcome({todo_id:todo.todo_id,ready_state:'PARTIAL',actual_ms:60000,session_id:'s1',task_id:'t1'});
const snap=planner.snapshot();for(const row of [snap.progress_events[0],snap.execution_observations[0],snap.carry_over_queue[0]])assert.strictEqual(row.learning_unit_id,todo.learning_unit_id);
const replanned=planner.replanCarryOver({carry_over_id:snap.carry_over_queue[0].carry_over_id,date:'2026-09-22'});assert(replanned.ok);assert.strictEqual(replanned.todo.assignment_id,todo.assignment_id);
assert.throws(()=>planner.upsertDatedTodo({label:'forbidden',source:'READY_MANUAL'}),/authority/);
console.log(JSON.stringify({pass:true,planner_v2:true,identity_chain:true,legacy_minute_fit:'SUPERSEDED_BY_CURRENT_TRUTH'}));
