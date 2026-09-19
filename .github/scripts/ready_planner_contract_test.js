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
