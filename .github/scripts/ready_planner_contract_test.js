#!/usr/bin/env node
const assert=require('assert');
const core=require('../../ready-planner-v01.js');

class MemoryStorage{
  constructor(){this.map=new Map();}
  getItem(k){return this.map.has(k)?this.map.get(k):null;}
  setItem(k,v){this.map.set(k,String(v));}
  removeItem(k){this.map.delete(k);}
}

const storage=new MemoryStorage();
const planner=core.createPlanner(storage);

const commitment=planner.upsertScheduleCommitment({
  title:'영어학원',
  category:'ACADEMY',
  start_at:'2026-09-19T17:00:00+09:00',
  end_at:'2026-09-19T19:00:00+09:00',
  confirmed:true,
  planner_movable:false,
  parent_editable:true,
  source:'FIXTURE'
});
assert(commitment.commitment_id);

const template=planner.upsertHomeworkTemplate({
  title:'영어 단어 복습',
  subject:'영어',
  assignment_cycle:'ACADEMY_DAY',
  learning_units:[{kind:'VOCAB_SET',count:1}],
  provenance:{source:'FIXTURE'}
});
assert(template.template_id);

const links=planner.linkOrCreateTodayItems(['영어 단어 복습','수학 연산 20문제'],{
  date:'2026-09-19',
  source:'READY_MANUAL',
  source_actor:'READY_USER'
});
assert.strictEqual(links.length,2);
assert.strictEqual(planner.today('2026-09-19').length,2);

// Duplicate intake must reuse the same open dated TODO, not multiply it.
const links2=planner.linkOrCreateTodayItems(['영어 단어 복습'],{
  date:'2026-09-19',
  source:'READY_MANUAL',
  source_actor:'READY_USER'
});
assert.strictEqual(links2[0].todo_id,links[0].todo_id);

planner.recordTaskState({
  todo_id:links[0].todo_id,
  ready_state:'COMPLETED',
  session_id:'session-fixture',
  task_id:'task-fixture',
  at:'2026-09-19T20:00:00+09:00'
});
assert.strictEqual(planner.today('2026-09-19').length,1);

// Same state event is idempotent.
planner.recordTaskState({
  todo_id:links[0].todo_id,
  ready_state:'COMPLETED',
  session_id:'session-fixture',
  task_id:'task-fixture',
  at:'2026-09-19T20:01:00+09:00'
});


const planningCommitment=planner.upsertScheduleCommitment({
  title:'태권도',
  category:'ACADEMY',
  start_at:'2026-09-20T17:00:00+09:00',
  end_at:'2026-09-20T18:00:00+09:00',
  confirmed:true,
  planner_movable:false,
  source:'FIXTURE'
});
assert(planningCommitment.commitment_id);

const vocab=planner.upsertHomeworkTemplate({
  title:'영어 단어 복습',
  subject:'영어',
  estimated_minutes:20,
  deadline_date:'2026-09-20',
  allocation_priority:10,
  required_today:true,
  provenance:{source:'FIXTURE'}
});
const math=planner.upsertHomeworkTemplate({
  title:'수학 연산',
  subject:'수학',
  estimated_minutes:25,
  deadline_date:'2026-09-22',
  allocation_priority:20,
  provenance:{source:'FIXTURE'}
});
const reading=planner.upsertHomeworkTemplate({
  title:'독서',
  subject:'국어',
  estimated_minutes:30,
  deadline_date:'2026-09-25',
  allocation_priority:30,
  provenance:{source:'FIXTURE'}
});

const allocation=planner.allocateToday({
  date:'2026-09-20',
  candidate_windows:[
    {start:'16:30',end:'18:30'},
    {start:'19:30',end:'20:30'}
  ],
  max_minutes:60,
  condition_evidence:{state:'OK',source:'EXPLICIT_FIXTURE'}
});
assert.strictEqual(allocation.ok,true);
// 16:30-17:00 + 18:00-18:30 + 19:30-20:30 = 120 min capacity,
// but explicit max_minutes=60 prevents "free time exists = must study".
assert.strictEqual(allocation.available_minutes,120);
assert.strictEqual(allocation.max_minutes,60);
assert.deepStrictEqual(
  allocation.proposals.filter(x=>x.decision==='PROPOSE').map(x=>x.template_id),
  [vocab.template_id,math.template_id]
);
assert(!allocation.proposals.some(x=>x.template_id===reading.template_id&&x.decision==='PROPOSE'));

const committed=planner.commitAllocation(
  allocation.allocation_run_id,
  allocation.proposals.filter(x=>x.decision==='PROPOSE').map(x=>x.template_id)
);
assert.strictEqual(committed.ok,true);
assert.strictEqual(committed.created.length,2);
assert.strictEqual(planner.today('2026-09-20').length,2);
assert.strictEqual(planner.todayProjection('2026-09-20').length,2);
assert(planner.todayProjection('2026-09-20').every(x=>x.planner_owned===true));

// Ready execution intake must reuse Planner-created dated TODO instead of creating a duplicate.
const executionReuse=planner.linkOrCreateTodayItems(['영어 단어 복습'],{
  date:'2026-09-20',
  source:'READY_MANUAL',
  source_actor:'READY_USER'
});
assert.strictEqual(executionReuse[0].todo_id,committed.created.find(x=>x.label==='영어 단어 복습').todo_id);
assert.strictEqual(planner.today('2026-09-20').length,2);


const science=planner.upsertHomeworkTemplate({
  title:'과학 숙제',
  subject:'과학',
  estimated_minutes:20,
  deadline_date:'2026-09-21',
  allocation_priority:5,
  required_today:true,
  provenance:{source:'FIXTURE'}
});
const tight=planner.allocateToday({
  date:'2026-09-21',
  candidate_windows:[{start:'20:30',end:'21:00'}],
  max_minutes:10
});
assert.strictEqual(tight.ok,true);
const requiredOverflow=tight.proposals.find(x=>x.template_id===science.template_id);
assert(requiredOverflow);
assert.strictEqual(requiredOverflow.decision,'REQUIRES_REPLAN');

const noWindow=planner.allocateToday({date:'2026-09-21',candidate_windows:[]});
assert.strictEqual(noWindow.ok,false);
assert.strictEqual(noWindow.reason,'NO_CANDIDATE_WINDOWS');


const carryTemplate=planner.upsertHomeworkTemplate({
  title:'사회 정리',
  subject:'사회',
  estimated_minutes:25,
  deadline_date:'2026-09-20',
  allocation_priority:15,
  provenance:{source:'FIXTURE'}
});
const carryTodo=planner.upsertDatedTodo({
  date:'2026-09-20',
  label:'사회 정리',
  template_id:carryTemplate.template_id,
  source:'PLANNER_ALLOCATION',
  source_actor:'PLANNER_MAIN',
  estimated_minutes:25
});
const carryOutcome=planner.recordSessionOutcome({
  todo_id:carryTodo.todo_id,
  ready_state:'PARTIAL',
  actual_ms:38*60*1000,
  session_id:'session-carry',
  task_id:'task-carry',
  at:'2026-09-20T21:00:00+09:00'
});
assert.strictEqual(carryOutcome.ok,true);
assert.strictEqual(carryOutcome.actual_minutes,38);
assert.strictEqual(planner.carryOverCandidates().length,1);
const evidence=planner.recentEstimateEvidence(carryTemplate.template_id);
assert.strictEqual(evidence.sample_count,1);
assert.strictEqual(evidence.median_actual_minutes,38);
assert.strictEqual(evidence.authority,'OBSERVATION_ONLY');

const carryPlan=planner.allocateToday({
  date:'2026-09-21',
  candidate_windows:[{start:'18:00',end:'20:00'}],
  max_minutes:90
});
const carryProposal=carryPlan.proposals.find(x=>x.template_id===carryTemplate.template_id);
assert(carryProposal);
assert.strictEqual(carryProposal.decision,'PROPOSE');
assert.strictEqual(carryProposal.estimated_minutes,25);
assert.strictEqual(carryProposal.estimate_evidence.median_actual_minutes,38);
const carryCommit=planner.commitAllocation(carryPlan.allocation_run_id,[carryTemplate.template_id]);
assert.strictEqual(carryCommit.created.length,1);
assert(carryCommit.created[0].carry_over_id);

const blockedTemplate=planner.upsertHomeworkTemplate({
  title:'수학 질문 확인',
  subject:'수학',
  estimated_minutes:15,
  deadline_date:'2026-09-22',
  allocation_priority:3,
  provenance:{source:'FIXTURE'}
});
const blockedTodo=planner.upsertDatedTodo({
  date:'2026-09-21',
  label:'수학 질문 확인',
  template_id:blockedTemplate.template_id,
  source:'PLANNER_ALLOCATION',
  source_actor:'PLANNER_MAIN',
  estimated_minutes:15
});
planner.recordSessionOutcome({
  todo_id:blockedTodo.todo_id,
  ready_state:'WAITING_FOR_PARENT',
  actual_ms:10*60*1000,
  session_id:'session-blocked',
  task_id:'task-blocked'
});
const holdPlan=planner.allocateToday({
  date:'2026-09-22',
  candidate_windows:[{start:'19:00',end:'20:00'}],
  max_minutes:40
});
const hold=holdPlan.proposals.find(x=>x.template_id===blockedTemplate.template_id);
assert(hold);
assert.strictEqual(hold.decision,'HOLD');
assert.strictEqual(hold.reason,'CARRY_OVER_REQUIRES_RESOLUTION');

const blockedCarry=planner.carryOverCandidates().find(x=>x.template_id===blockedTemplate.template_id);
assert(blockedCarry);
const resolved=planner.resolveCarryOver(blockedCarry.carry_over_id,{resolution:'READY_FOR_REPLAN',actor:'PARENT'});
assert.strictEqual(resolved.ok,true);
const afterResolve=planner.allocateToday({
  date:'2026-09-22',
  candidate_windows:[{start:'19:00',end:'20:00'}],
  max_minutes:40
});
assert.strictEqual(afterResolve.proposals.find(x=>x.template_id===blockedTemplate.template_id).decision,'PROPOSE');


// Adaptive Planner must never mutate estimates from observations alone.
// It may propose from bounded evidence, but a human confirmation is required to apply it.
const adaptiveTemplate=planner.upsertHomeworkTemplate({
  title:'적응형 수학 연산',
  subject:'수학',
  estimated_minutes:20,
  allocation_priority:50,
  provenance:{source:'FIXTURE'}
});
for(const [i,mins] of [30,35,40].entries()){
  const todo=planner.upsertDatedTodo({
    date:`2026-09-${23+i}`,
    label:'적응형 수학 연산',
    template_id:adaptiveTemplate.template_id,
    source:'PLANNER_ALLOCATION',
    source_actor:'PLANNER_MAIN',
    estimated_minutes:20
  });
  const outcome=planner.recordSessionOutcome({
    todo_id:todo.todo_id,
    ready_state:'COMPLETED',
    actual_ms:mins*60*1000,
    session_id:`adaptive-session-${i}`,
    task_id:`adaptive-task-${i}`
  });
  assert.strictEqual(outcome.ok,true);
}
assert.strictEqual(
  planner.snapshot().homework_templates.find(x=>x.template_id===adaptiveTemplate.template_id).estimated_minutes,
  20
);

const adaptiveProposal=planner.proposeEstimateAdjustment(adaptiveTemplate.template_id,{
  min_samples:3,
  min_delta_minutes:5
});
assert.strictEqual(adaptiveProposal.ok,true);
assert.strictEqual(adaptiveProposal.proposal.status,'PENDING');
assert.strictEqual(adaptiveProposal.proposal.current_estimated_minutes,20);
assert.strictEqual(adaptiveProposal.proposal.proposed_estimated_minutes,35);
assert.strictEqual(adaptiveProposal.proposal.authority,'HUMAN_CONFIRMATION_REQUIRED');
assert.strictEqual(planner.pendingEstimateAdjustments().length,1);

// A repeated proposal before decision must be idempotent.
const adaptiveProposalAgain=planner.proposeEstimateAdjustment(adaptiveTemplate.template_id,{
  min_samples:3,
  min_delta_minutes:5
});
assert.strictEqual(adaptiveProposalAgain.ok,true);
assert.strictEqual(adaptiveProposalAgain.reused,true);
assert.strictEqual(adaptiveProposalAgain.proposal.proposal_id,adaptiveProposal.proposal.proposal_id);

// Human confirmation applies the estimate.
const confirmedAdaptive=planner.decideEstimateAdjustment(adaptiveProposal.proposal.proposal_id,{
  decision:'CONFIRM',
  actor:'PARENT'
});
assert.strictEqual(confirmedAdaptive.ok,true);
assert.strictEqual(confirmedAdaptive.proposal.status,'CONFIRMED');
assert.strictEqual(confirmedAdaptive.template.estimated_minutes,35);
assert.strictEqual(planner.pendingEstimateAdjustments().length,0);

// Rejection must preserve the current estimate.
const rejectTemplate=planner.upsertHomeworkTemplate({
  title:'거절 검증 독서',
  subject:'국어',
  estimated_minutes:10,
  allocation_priority:60,
  provenance:{source:'FIXTURE'}
});
for(const [i,mins] of [20,25,30].entries()){
  const todo=planner.upsertDatedTodo({
    date:`2026-09-${26+i}`,
    label:'거절 검증 독서',
    template_id:rejectTemplate.template_id,
    source:'PLANNER_ALLOCATION',
    source_actor:'PLANNER_MAIN',
    estimated_minutes:10
  });
  planner.recordSessionOutcome({
    todo_id:todo.todo_id,
    ready_state:'COMPLETED',
    actual_ms:mins*60*1000,
    session_id:`reject-session-${i}`,
    task_id:`reject-task-${i}`
  });
}
const rejectProposal=planner.proposeEstimateAdjustment(rejectTemplate.template_id,{
  min_samples:3,
  min_delta_minutes:5
});
assert.strictEqual(rejectProposal.ok,true);
assert.strictEqual(rejectProposal.proposal.proposed_estimated_minutes,25);
const rejectedAdaptive=planner.decideEstimateAdjustment(rejectProposal.proposal.proposal_id,{
  decision:'REJECT',
  actor:'PARENT',
  note:'이번 주만 예외적으로 오래 걸림'
});
assert.strictEqual(rejectedAdaptive.ok,true);
assert.strictEqual(rejectedAdaptive.proposal.status,'REJECTED');
assert.strictEqual(rejectedAdaptive.template.estimated_minutes,10);

const snap=planner.snapshot();
assert.strictEqual(snap.progress_events.length,1);
assert.strictEqual(snap.storage_backend,'LOCALSTORAGE_COMPATIBILITY_SCAFFOLD');
assert.strictEqual(planner.validate().ok,true);

console.log(JSON.stringify({
  pass:true,
  schedule_commitments:snap.schedule_commitments.length,
  homework_templates:snap.homework_templates.length,
  dated_todos:snap.dated_todos.length,
  progress_events:snap.progress_events.length,
  execution_observations:snap.execution_observations.length,
  carry_over_queue:snap.carry_over_queue.length,
  adaptive_estimate_proposals:snap.adaptive_estimate_proposals.length
}));
