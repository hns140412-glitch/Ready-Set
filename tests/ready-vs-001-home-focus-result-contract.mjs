// READY-VS-001: Home -> 숙제 시작 -> Focus -> explicit result -> Home, one session / one active task / one active lap.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const coreSource = fs.readFileSync('ready-home-homework-mvp-v1.js', 'utf8');
const runtimeSource = fs.readFileSync('ready-runtime-v07.js', 'utf8');
const store = new Map();
const state = {activeSession:null, targetMin:null};
const context = vm.createContext({console, structuredClone, Date, Math, URL, URLSearchParams,
  location:{search:''}, state, save(){}, completeSession(){}, nav(){},
  localStorage:{getItem:key=>store.get(key), setItem:(key,value)=>store.set(key,value)},
  document:{documentElement:{dataset:{}}, getElementById:()=>null, querySelector:()=>null}
});
context.window = context;
const runtimeHarnessSource = runtimeSource.slice(0, runtimeSource.lastIndexOf("  if(document.readyState"));
vm.runInContext(runtimeHarnessSource + `
window.ReadySetRev07 = {contract:()=>state.activeSession?.rev07 || null, ensure:ensureContract, switchTask, setTaskState, finishActiveTask};
})();`, context);

const key = 'readyset_planner_v1';
const day = new Date().toLocaleDateString('sv-SE');
const planner = () => JSON.parse(store.get(key)).days[day].tasks;
const setPlannerStatus = (id, status) => {
  const data = JSON.parse(store.get(key));
  data.days[day].tasks = data.days[day].tasks.map(t => String(t.id) === String(id) ? {...t, status} : t);
  store.set(key, JSON.stringify(data));
};
// Mirrors readyStart(): eager contract creation and Planner IN_PROGRESS before Home seeds the task map.
context.ReadyBaseRuntimeV1 = {
  start(opts) {
    if (state.activeSession) return;
    const selected = planner().find(t => t.selected);
    const labels = opts?.taskLabels?.length ? opts.taskLabels : [selected.title];
    state.activeSession = {id:'s_vs001', startAt:Date.now(), targetMs:state.targetMin ? state.targetMin * 60000 : null, tasks:[...labels], taskLabel:labels[0], plannerTaskId:selected.id};
    context.ReadySetRev07.ensure();
    setPlannerStatus(selected.id, 'IN_PROGRESS');
  },
  publishPlannerResult(id, status) { setPlannerStatus(id, status); return {}; }
};
store.set('readyset_identity_v1', JSON.stringify({status:'READY', nickname:'별이'}));
store.set(key, JSON.stringify({version:1, days:{[day]:{tasks:[
  {id:'a', title:'수학 익힘책', volume:'24~25쪽', status:'PLANNED'},
  {id:'b', title:'받아쓰기 연습', status:'PLANNED'}
]}}}));
vm.runInContext(coreSource, context);
const api = context.ReadyHomeHomeworkMVPV1;

// Home: one dominant start action, no timer required.
let model = api.model();
assert.equal(model.gate, 'READY_HOME');
assert.equal(model.primary_action, '숙제 시작');
assert.equal(api.validate().timerOptional, true);

// 숙제 시작 -> Focus: one session seeded with every ready task, chosen task has the only open lap.
const session = api.createSession(api.tasks().find(t => t.task_id === 'b'));
assert.equal(session.session_state, 'ACTIVE');
assert.equal(state.activeSession.targetMs, null, 'start must not require a timer');
assert.deepEqual(session.tasks.map(t => t.label), ['받아쓰기 연습', '수학 익힘책 · 24~25쪽']);
assert.ok(state.activeSession.homeworkTaskMap.every(e => e.canonical_task_id), 'Planner ids bind to canonical tasks');
assert.equal(session.tasks[0].laps.length, 1);
assert.equal(session.tasks[1].laps.length, 0);
assert.throws(() => api.createSession(api.tasks()[0]), /SESSION_ALREADY_ACTIVE/, 'no duplicate session');

// Explicit result closes only the task lap; session stays ACTIVE while work is PENDING.
const first = context.ReadySetRev07.finishActiveTask('COMPLETED');
assert.equal(first.pending, 1);
const c1 = state.activeSession.rev07;
assert.equal(c1.session_state, 'ACTIVE');
assert.equal(c1.active_lap_id, null);
assert.equal(c1.tasks[0].laps[0].end_reason, 'TASK_COMPLETED');
assert.equal(planner().find(t => t.id === 'b').status, 'COMPLETED', 'result reaches Planner');
assert.equal(context.ReadySetRev07.finishActiveTask('PARTIAL'), null, 'no result without an open lap');

// Home reflects the result and offers resume of the same session.
model = api.model();
assert.equal(model.start_mode, 'RESUME');
assert.equal(model.primary_action, '숙제 이어서 하기');
assert.deepEqual({...model.resume}, {label:'수학 익힘책 · 24~25쪽', done:1, total:2});
assert.ok(!api.tasks().some(t => t.task_id === 'b'));

const resumed = api.resumeSession();
assert.equal(resumed.session_id, session.session_id, 'resume keeps the one session');
assert.equal(resumed.active_task_id, resumed.tasks[1].task_id);
assert.equal(resumed.tasks[1].laps.length, 1);
assert.equal(resumed.tasks.filter(t => t.laps.some(l => !l.ended_at)).length, 1, 'one active lap');
assert.equal(api.resumeSession().tasks[1].laps.length, 1, 'resume with an open lap does not restart it');

const last = context.ReadySetRev07.finishActiveTask('PARTIAL');
assert.equal(last.pending, 0);
assert.equal(planner().find(t => t.id === 'a').status, 'PARTIAL');
assert.throws(() => api.resumeSession(), /NO_PENDING_TASK/);
for (const bad of ['DONE', 'SKIPPED', '']) assert.equal(context.ReadySetRev07.finishActiveTask(bad), null);

// UI wiring: active session routes through resume; Focus ends the task, not the session.
const ui = fs.readFileSync('ready-home-homework-ui-v1.js', 'utf8');
assert.match(ui, /if \(sessionActive\(core\)\) core\.resumeSession/);
assert.match(ui, /start_mode === 'RESUME'/);
assert.match(runtimeSource, /end\.textContent='이 숙제 마치기';end\.onclick=openTaskFinish/);
assert.match(runtimeSource, /if\(done\.pending===0\)return finalizeSession\(\)/);
// Stage D world hold must not rewrite the observed class attribute unconditionally (observer recursion).
assert.match(fs.readFileSync('ready-stage-d.js', 'utf8'), /if\(home\.classList\.contains\('worldShell'\)\)home\.classList\.remove\('worldShell'\)/);
console.log('PASS: READY-VS-001 home -> start (no timer) -> focus lap -> explicit result -> home resume, single session');
