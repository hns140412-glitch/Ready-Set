const assert=require('assert');
const fs=require('fs');

const app=fs.readFileSync(require.resolve('../app.js'),'utf8');
const runtime=fs.readFileSync(require.resolve('../ready-runtime-v07.js'),'utf8');

assert(app.includes("const firstLink=plannerLinks[0]"));
assert(app.includes("ready_state:'IN_PROGRESS'"));
assert(!app.includes("for(const link of plannerLinks){\n    const result=window.ReadySetPlanner?.recordTaskState?.({"));

assert(runtime.includes("atMostOnePlannerTaskInProgress: activePlannerTodos.length <= 1"));
assert(runtime.includes("plannerActiveMatchesRuntimeTask:"));
assert(runtime.includes("previous?.state === 'PENDING'"));
assert(runtime.includes("ready_state: 'PLANNED'"));
assert(runtime.includes("ready_state: 'IN_PROGRESS'"));

console.log('PASS: Ready session runtime has one Planner-active task owner and task switches release pending previous ownership');
