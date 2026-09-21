const assert=require('assert');
const plannerModule=require('../ready-planner-v01.js');

function storage(){
  const m=new Map();
  return {
    getItem:key=>m.has(key)?m.get(key):null,
    setItem:(key,value)=>m.set(key,String(value)),
    removeItem:key=>m.delete(key)
  };
}

const planner=plannerModule.createPlanner(storage());
const a=planner.upsertDatedTodo({
  date:'2026-09-21',label:'A',source:'PLANNER_V2_ALLOCATION',source_actor:'PLANNER_MAIN'
});
const b=planner.upsertDatedTodo({
  date:'2026-09-21',label:'B',source:'PLANNER_V2_ALLOCATION',source_actor:'PLANNER_MAIN'
});

const first=planner.recordTaskState({
  todo_id:a.todo_id,ready_state:'IN_PROGRESS',session_id:'session-1',task_id:'task-a'
});
assert.strictEqual(first.state,'IN_PROGRESS');

const second=planner.recordTaskState({
  todo_id:b.todo_id,ready_state:'IN_PROGRESS',session_id:'session-1',task_id:'task-b'
});
assert.strictEqual(second.state,'IN_PROGRESS');

let snapshot=planner.snapshot();
let active=snapshot.dated_todos.filter(x=>x.state==='IN_PROGRESS');
assert.strictEqual(active.length,1,'exactly one Planner task may be IN_PROGRESS');
assert.strictEqual(active[0].todo_id,b.todo_id);
assert.strictEqual(snapshot.dated_todos.find(x=>x.todo_id===a.todo_id).state,'PLANNED');

const c=planner.upsertDatedTodo({
  date:'2026-09-21',label:'C',source:'PLANNER_V2_ALLOCATION',source_actor:'PLANNER_MAIN'
});
const foreign=planner.recordTaskState({
  todo_id:c.todo_id,ready_state:'IN_PROGRESS',session_id:'session-2',task_id:'task-c'
});
assert.strictEqual(foreign.ok,false);
assert.strictEqual(foreign.reason,'ACTIVE_TASK_OWNERSHIP_CONFLICT');

snapshot=planner.snapshot();
active=snapshot.dated_todos.filter(x=>x.state==='IN_PROGRESS');
assert.strictEqual(active.length,1);
assert.strictEqual(active[0].todo_id,b.todo_id);

console.log('PASS Ready Planner atomic single-IN_PROGRESS invariant');
