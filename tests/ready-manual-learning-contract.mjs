import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const coreSource = fs.readFileSync('ready-home-homework-mvp-v1.js', 'utf8');
const runtimeSource = fs.readFileSync('ready-runtime-v07.js', 'utf8');
const store = new Map();
const state = {activeSession:null};
const context = vm.createContext({console, structuredClone, Date, Math, URL, URLSearchParams,
  location:{search:''}, state, save(){}, completeSession(){}, nav(){},
  localStorage:{getItem:key=>store.get(key), setItem:(key,value)=>store.set(key,value)},
  document:{documentElement:{dataset:{}}, getElementById:()=>null, querySelector:()=>null}
});
context.window = context;
// Expose real runtime operations while omitting browser-only boot wiring.
vm.runInContext(runtimeSource.slice(0, runtimeSource.lastIndexOf("  if (document.readyState")) + `
window.ReadySetRev07 = {contract:()=>state.activeSession?.rev07 || null, switchTask, setTaskState};
})();`, context);
context.ReadyBaseRuntimeV1 = {start(){ state.activeSession = {id:'real-session', startAt:Date.now(), tasks:[]}; }};
vm.runInContext(coreSource, context);
const api = context.ReadyHomeHomeworkMVPV1;
const day = new Date().toLocaleDateString('sv-SE');
const key = 'readyset_planner_v1';
store.set(key, JSON.stringify({days:{[day]:{tasks:[
  {id:'a',title:'Math',volume:'pages 2-9',status:'PLANNED',source:'PARENT'},
  {id:'b',title:'Reading',status:'PLANNED'},
  {id:'c',title:'Writing',status:'PLANNED'}
]}}}));
const task = id => JSON.parse(store.get(key)).days[day].tasks.find(t=>t.id===id);
const child = api.recordLearning('a',{completedQuantity:40,actualWorkDate:'2026-01-01'});
assert.equal(child.source,'CHILD_REPORTED');
assert.equal(child.actualWorkDate,'2026-01-01');
assert.ok(child.reportedAt.includes('T'));
assert.equal(task('a').status,'PARTIAL');
assert.equal(task('a').learningProgress.remainingQuantity,60);
assert.equal(state.activeSession,null);
assert.deepEqual([...store.keys()],[key]);
assert.equal(task('a').source,'PARENT');
assert.doesNotMatch(JSON.stringify(child),/elapsed|focus|session_id|lap_id|duration/);
assert.throws(()=>api.confirmLearning('a',child.reportId),/PARENT_ROLE/);
for (const quantity of [0,-1,101,NaN,Infinity,'50',40,20]) {
  assert.throws(()=>api.recordLearning('a',{completedQuantity:quantity}));
}
assert.throws(()=>api.recordLearning('missing',{completedQuantity:10}),/TODAY_TASK/);
assert.throws(()=>api.recordLearning('a',{completedQuantity:50,actualWorkDate:'2026-02-30'}),/WORK_DATE/);
context.location.search='?role=parent';
const confirmed = api.confirmLearning('a',child.reportId);
assert.equal(confirmed.source,'CHILD_REPORTED');
assert.equal(confirmed.confirmedBy,'PARENT_REPORTED');
assert.equal(api.confirmLearning('a',child.reportId).confirmedAt,confirmed.confirmedAt);
assert.equal(task('a').learningProgress.remainingQuantity,60);
const parent = api.recordLearning('a',{completedQuantity:100});
assert.equal(parent.source,'PARENT_REPORTED');
assert.equal(parent.actualWorkDate,null);
assert.equal(task('a').status,'COMPLETED');
assert.equal(task('a').learningProgress.remainingQuantity,0);
assert.equal(task('a').learningReports.length,2);
assert.ok(!api.tasks().some(t=>t.task_id==='a'));
vm.runInContext(coreSource,context);
assert.equal(context.ReadyHomeHomeworkMVPV1.tasks(true)[0].learningReports[0].source,'CHILD_REPORTED');
// Actual canonical session creation, switch, and result functions still operate.
const session = api.createSession(api.tasks()[0]);
assert.equal(session.session_id,'real-session');
assert.equal(session.tasks.length,2);
assert.equal(session.tasks[0].laps.length,1);
api.switchTask('c');
assert.equal(state.activeSession.rev07.tasks[0].laps[0].end_reason,'TASK_CHANGE');
api.finishTask('COMPLETED');
assert.equal(state.activeSession.rev07.tasks[1].state,'COMPLETED');
const event = state.activeSession.rev07.events.findLast(e=>e.type==='TASK_STATE_CHANGED');
assert.equal(event.payload.provenance,'SESSION_DERIVED');
assert.equal(event.payload.source,'READY_UI');
const before = JSON.stringify(state.activeSession);
api.recordLearning('b',{completedQuantity:25});
assert.equal(JSON.stringify(state.activeSession),before);
assert.equal(task('b').learningProgress.remainingQuantity,75);
assert.deepEqual([...store.keys()],[key]);
context.location.search='';
const completeChild = api.recordLearning('c',{completedQuantity:100});
context.location.search='?role=parent';
assert.equal(api.confirmLearning('c',completeChild.reportId).source,'CHILD_REPORTED');
assert.equal(JSON.stringify(state.activeSession),before);
const uiSource = fs.readFileSync('ready-home-homework-ui-v1.js','utf8');
assert.match(uiSource,/core.tasks\(true\)/);
assert.match(uiSource,/data-record-task/);
assert.match(uiSource,/data-confirm-task/);
assert.match(uiSource,/showModal\(\)/);
assert.match(uiSource,/remainingQuantity/);
const manual = coreSource.slice(coreSource.indexOf('  const reportRole'),coreSource.indexOf('  function confirmedCharacter'));
assert.doesNotMatch(manual,/setTaskState|createSession|startLap|elapsed_ms|focus_ms/);
assert.doesNotMatch(coreSource,/readyset_homework_session/);
console.log('PASS: manual provenance, parent confirmation, bounded quantities/dates, persistence, no invented time, single owner, real automatic session path');
