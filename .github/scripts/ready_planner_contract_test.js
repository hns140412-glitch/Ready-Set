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

// Adaptive Planner V2: observations are evidence only; Planner proposes; human only confirms/rejects the fixed proposal.
const adaptiveTemplate=planner.upsertHomeworkTemplate({
  title:'적응형 수학 연산',
  allocation_priority:50
});
for(const [i,mins] of [30,35,40].entries()){
  const todo=planner.upsertDatedTodo({
    date:`2026-09-${23+i}`,
    label:'적응형 수학 연산',
    template_id:adaptiveTemplate.template_id,
    source:'PLANNER_V2_ALLOCATION',
    source_actor:'PLANNER_MAIN'
  });
  const sessionId=`adaptive-session-${i}`,taskId=`adaptive-task-${i}`;
  const started=planner.recordTaskState({
    todo_id:todo.todo_id,
    ready_state:'IN_PROGRESS',
    session_id:sessionId,
    task_id:taskId
  });
  assert.strictEqual(started.state,'IN_PROGRESS');
  const outcome=planner.recordSessionOutcome({
    todo_id:todo.todo_id,
    ready_state:'COMPLETED',
    actual_ms:mins*60*1000,
    session_id:sessionId,
    task_id:taskId
  });
  assert.strictEqual(outcome.ok,true);
}
assert.strictEqual(
  planner.snapshot().homework_templates.find(x=>x.template_id===adaptiveTemplate.template_id).planner_estimated_minutes,
  null
);
const adaptiveProposal=planner.proposeEstimateAdjustment(adaptiveTemplate.template_id,{
  min_samples:3,
  min_delta_minutes:5
});
assert.strictEqual(adaptiveProposal.ok,true);
assert.strictEqual(adaptiveProposal.proposal.status,'PENDING');
assert.strictEqual(adaptiveProposal.proposal.current_planner_estimated_minutes,null);
assert.strictEqual(adaptiveProposal.proposal.proposed_planner_estimated_minutes,35);
assert.strictEqual(adaptiveProposal.proposal.evidence.authority,'OBSERVATION_ONLY');
assert.strictEqual(adaptiveProposal.proposal.authority,'PLANNER_PROPOSAL_HUMAN_APPROVAL_REQUIRED');
assert.strictEqual(planner.pendingEstimateAdjustments().length,1);

const adaptiveProposalAgain=planner.proposeEstimateAdjustment(adaptiveTemplate.template_id,{
  min_samples:3,
  min_delta_minutes:5
});
assert.strictEqual(adaptiveProposalAgain.ok,true);
assert.strictEqual(adaptiveProposalAgain.reused,true);
assert.strictEqual(adaptiveProposalAgain.proposal.proposal_id,adaptiveProposal.proposal.proposal_id);

const confirmedAdaptive=planner.decideEstimateAdjustment(adaptiveProposal.proposal.proposal_id,{
  decision:'CONFIRM',
  actor:'PARENT'
});
assert.strictEqual(confirmedAdaptive.ok,true);
assert.strictEqual(confirmedAdaptive.proposal.status,'CONFIRMED');
assert.strictEqual(confirmedAdaptive.proposal.decision_role,'HUMAN_APPROVER');
assert.strictEqual(confirmedAdaptive.template.planner_estimated_minutes,35);
assert.strictEqual(planner.pendingEstimateAdjustments().length,0);

const rejectTemplate=planner.upsertHomeworkTemplate({
  title:'거절 검증 독서',
  planner_estimated_minutes:10,
  allocation_priority:60
});
for(const [i,mins] of [20,25,30].entries()){
  const todo=planner.upsertDatedTodo({
    date:`2026-09-${26+i}`,
    label:'거절 검증 독서',
    template_id:rejectTemplate.template_id,
    source:'PLANNER_V2_ALLOCATION',
    source_actor:'PLANNER_MAIN'
  });
  const sessionId=`reject-session-${i}`,taskId=`reject-task-${i}`;
  const started=planner.recordTaskState({
    todo_id:todo.todo_id,
    ready_state:'IN_PROGRESS',
    session_id:sessionId,
    task_id:taskId
  });
  assert.strictEqual(started.state,'IN_PROGRESS');
  planner.recordSessionOutcome({
    todo_id:todo.todo_id,
    ready_state:'COMPLETED',
    actual_ms:mins*60*1000,
    session_id:sessionId,
    task_id:taskId
  });
}
const rejectProposal=planner.proposeEstimateAdjustment(rejectTemplate.template_id,{
  min_samples:3,
  min_delta_minutes:5
});
assert.strictEqual(rejectProposal.ok,true);
assert.strictEqual(rejectProposal.proposal.proposed_planner_estimated_minutes,25);
const rejectedAdaptive=planner.decideEstimateAdjustment(rejectProposal.proposal.proposal_id,{
  decision:'REJECT',
  actor:'PARENT',
  note:'이번 주만 예외적으로 오래 걸림'
});
assert.strictEqual(rejectedAdaptive.ok,true);
assert.strictEqual(rejectedAdaptive.proposal.status,'REJECTED');
assert.strictEqual(rejectedAdaptive.template.planner_estimated_minutes,10);

console.log(JSON.stringify({pass:true,planner_v2:true,identity_chain:true,legacy_minute_fit:'SUPERSEDED_BY_CURRENT_TRUTH'}));
