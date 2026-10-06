// READY-VS-002: parent Home = setup/input/confirm surface; Planner assignments status-only; child Home keeps 숙제 시작.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const uiSource = fs.readFileSync('ready-home-homework-ui-v1.js', 'utf8');
const hubSource = fs.readFileSync('ready-parent-setup-hub-v1.js', 'utf8');

function element() {
  return {textContent:'', innerHTML:'', closest:() => null, querySelectorAll:() => [],
    querySelector(selector) {
      if (selector !== '#readyHomeworkPrimary' || !this.innerHTML.includes('id="readyHomeworkPrimary"')) return null;
      return {remove:() => { this.innerHTML = this.innerHTML.replace(/<button id="readyHomeworkPrimary"[\s\S]*?<\/button>/, ''); }};
    }};
}

function harness(role, {activeSession = null, actionsHtml = ''} = {}) {
  const nodes = {baseActions:element(), homeTodayTodoList:element(), baseHomeTitle:element(), baseHomeLead:element(), baseTodayTitle:element()};
  nodes.baseActions.innerHTML = actionsHtml;
  const tasks = [
    {task_id:'hw_math_1', title:'수학 익힘책', subject:'수학', volume:'24~25쪽', status:'PLANNED'},
    {task_id:'hw_kor_1', title:'받아쓰기 연습', subject:'국어', volume:'', status:'COMPLETED'}
  ];
  const core = {
    reportRole:() => role === 'parent' ? 'PARENT_REPORTED' : 'CHILD_REPORTED',
    model:() => ({gate:'READY_HOME', start_mode:activeSession ? 'RESUME' : 'DIRECT', primary_action:activeSession ? '숙제 이어서 하기' : '숙제 시작', task_count:1, tasks:[tasks[0]], resume:activeSession ? {label:'수학 익힘책', done:1, total:2} : null}),
    tasks:() => tasks, activeSession:() => activeSession, resolveCanonicalTaskId:id => id
  };
  const context = vm.createContext({console, URLSearchParams, location:{search:`?role=${role}`},
    addEventListener() {}, ReadyHomeHomeworkMVPV1:core,
    document:{readyState:'complete', documentElement:{dataset:{}}, head:{appendChild() {}}, addEventListener() {}, createElement:() => ({}),
      getElementById:id => nodes[id] || null, querySelector:() => null}});
  context.window = context;
  vm.runInContext(uiSource, context);
  return {nodes, context};
}

// Parent: parent-oriented copy, base-native parent actions preserved, stale child CTA removed, status-only Planner list.
const parentActions = '<button data-nav="mission"><b>숙제 입력 · 확인</b></button><button id="readyHomeworkPrimary"><b>숙제 시작</b></button>';
const parent = harness('parent', {actionsHtml:parentActions});
assert.equal(parent.nodes.baseHomeTitle.textContent, '시간표와 숙제를 먼저 준비해요');
assert.match(parent.nodes.baseHomeLead.textContent, /오늘 배정 2개 · 남은 1개/);
assert.match(parent.nodes.baseHomeLead.textContent, /실행은 아이 화면에서/);
assert.ok(!parent.nodes.baseActions.innerHTML.includes('readyHomeworkPrimary'), 'no child start/resume CTA in parent mode');
assert.match(parent.nodes.baseActions.innerHTML, /숙제 입력 · 확인/, 'parent homework input action is kept');
const parentTodo = parent.nodes.homeTodayTodoList.innerHTML;
assert.ok(!parentTodo.includes('data-quick-start'), 'no [data-quick-start] execution in parent mode');
assert.ok(!parentTodo.includes('<button'), 'Planner assignments are status-only');
assert.match(parentTodo, /수학 익힘책[\s\S]*아직 시작 전/);
assert.match(parentTodo, /받아쓰기 연습[\s\S]*완료/);
assert.ok(!/숙제 시작|이어서/.test(parent.nodes.baseActions.innerHTML + parentTodo + parent.nodes.baseHomeLead.textContent));

// Parent with an active child session: still no resume CTA.
const parentActive = harness('parent', {activeSession:{session_state:'ACTIVE', tasks:[]}});
assert.ok(!parentActive.nodes.baseActions.innerHTML.includes('readyHomeworkPrimary'));
assert.ok(!parentActive.nodes.homeTodayTodoList.innerHTML.includes('data-quick-start'));

// Child regression (READY-VS-001): dominant 숙제 시작 + quick-start remain.
const child = harness('child');
assert.match(child.nodes.baseActions.innerHTML, /id="readyHomeworkPrimary"[\s\S]*숙제 시작/);
assert.match(child.nodes.homeTodayTodoList.innerHTML, /data-quick-start="hw_math_1"/);
assert.match(child.nodes.baseHomeTitle.textContent, /오늘 뭐부터 탐험할까/);
const childResume = harness('child', {activeSession:{session_state:'ACTIVE', tasks:[{task_id:'hw_math_1', state:'PENDING'}]}});
assert.match(childResume.nodes.baseActions.innerHTML, /숙제 이어서 하기/);

// Setup hub: survives the Stage D world hold by mounting on the base home; actions reach schedule editor + homework input.
assert.match(fs.readFileSync('ready-stage-d.js', 'utf8'), /home\.querySelector\('#worldStage'\)\?\.remove\(\)/, 'world hold still removes #worldStage');
assert.match(hubSource, /host=world\|\|\$\('#homeView \.homeMain'\)/);
assert.match(hubSource, /host\.insertBefore\(hub,\$\('#baseActions'\)\)/);
assert.match(hubSource, /data-rps-schedule\]'\)\.onclick=\(\)=>\{nav\('schedule'\)/);
assert.match(hubSource, /data-edit-schedule\]'\)\.onclick=openScheduleEditor/);
assert.match(hubSource, /data-rps-homework\]'\)\.onclick=goHomework/);
assert.match(hubSource, /function goHomework\(\)\{nav\('mission'\)[\s\S]*#rscCaptureRoot/);
console.log('PASS: READY-VS-002 parent home = setup hub + status-only Planner; child home keeps 숙제 시작');
