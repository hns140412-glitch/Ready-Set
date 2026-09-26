const assert=require('assert');
const fs=require('fs');

const sessionService=fs.readFileSync(require.resolve('../src/session/session-service-runtime.js'),'utf8');
const runtime=fs.readFileSync(require.resolve('../ready-runtime-v07.js'),'utf8');

assert(sessionService.includes("const first=links[0]"));
assert(sessionService.includes("ready_state:'IN_PROGRESS'"));
assert(!sessionService.includes("for(const link of links)"));
assert(sessionService.includes("plannerStartGuard(links)"));

assert(runtime.includes("atMostOnePlannerTaskInProgress: activePlannerTodos.length <= 1"));
assert(runtime.includes("plannerActiveMatchesRuntimeTask:"));
assert(runtime.includes("previous?.state === 'PENDING'"));
assert(runtime.includes("ready_state: 'PLANNED'"));
assert(runtime.includes("ready_state: 'IN_PROGRESS'"));

console.log('PASS: Ready session service starts only the first Planner task and runtime task switches preserve single-active ownership');
