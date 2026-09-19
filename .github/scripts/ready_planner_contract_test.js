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

const tight=planner.allocateToday({
  date:'2026-09-21',
  candidate_windows:[{start:'20:30',end:'21:00'}],
  max_minutes:10
});
assert.strictEqual(tight.ok,true);
const requiredOverflow=tight.proposals.find(x=>x.template_id===vocab.template_id);
assert(requiredOverflow);
assert.strictEqual(requiredOverflow.decision,'REQUIRES_REPLAN');

const noWindow=planner.allocateToday({date:'2026-09-21',candidate_windows:[]});
assert.strictEqual(noWindow.ok,false);
assert.strictEqual(noWindow.reason,'NO_CANDIDATE_WINDOWS');

const snap=planner.snapshot();
assert.strictEqual(snap.progress_events.length,1);
assert.strictEqual(snap.storage_backend,'LOCALSTORAGE_COMPATIBILITY_SCAFFOLD');
assert.strictEqual(planner.validate().ok,true);

console.log(JSON.stringify({
  pass:true,
  schedule_commitments:snap.schedule_commitments.length,
  homework_templates:snap.homework_templates.length,
  dated_todos:snap.dated_todos.length,
  progress_events:snap.progress_events.length
}));
