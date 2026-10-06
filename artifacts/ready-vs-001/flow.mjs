// READY-VS-001 browser flow: Home -> 숙제 시작 -> Focus -> explicit result -> Home (mobile 390x844).
import {launch, sleep} from './cdp.mjs';
const ROLE = process.argv[3] || 'child';
const base = (process.argv[2] || 'http://localhost:8097/') + '?role=' + ROLE;
const out = new URL('./', import.meta.url);
const shot = (b, n) => b.shot(new URL(`${ROLE}-${n}.png`, out));
const b = await launch({port:9335});
const snap = () => b.evaluate(`(()=>{const c=window.ReadySetRev07?.contract?.();const day=JSON.parse(localStorage.getItem('readyset_planner_v1')||'{}').days?.[new Date().toLocaleDateString('sv-SE')];return {view:document.querySelector('.view.active')?.dataset.view, primary:document.getElementById('readyHomeworkPrimary')?.innerText.split(String.fromCharCode(10)).join(' | '), session:c&&{id:c.session_id,state:c.session_state,active:c.active_task_id,tasks:c.tasks.map(t=>t.label+':'+t.state+':laps='+t.laps.length)}, hostSessionId:window.state?.activeSession?.id||null, planner:day?.tasks?.map(t=>t.title+':'+t.status), history:(window.state?.history||[]).length, focusMission:document.getElementById('focusMission')?.innerText, lap:document.getElementById('focusLapClock')?.innerText.split(String.fromCharCode(10)).join(' | '), timerText:document.getElementById('timerText')?.innerText}})()`);
const log = async label => console.log(label, JSON.stringify(await snap()));
try {
  await b.goto(base);
  const today = await b.evaluate(`new Date().toLocaleDateString('sv-SE')`);
  await b.evaluate(`localStorage.clear();localStorage.setItem('readyset_active_role_v1','${ROLE}');localStorage.setItem('readyset_identity_v1',JSON.stringify({schemaVersion:5,status:'READY',onboardingStep:'DONE',setupMode:'GUARDIAN_FOR_CHILD',legalName:'김테스트',nickname:'별이',familyRole:'CHILD',schoolStage:'E4'}));localStorage.setItem('readyset_planner_v1',JSON.stringify({version:1,days:{'${today}':{localDate:'${today}',tasks:[{id:'p1',task_id:'hw_math_1',subject:'수학',title:'수학 익힘책',volume:'24~25쪽',status:'PLANNED'},{id:'p2',task_id:'hw_kor_1',subject:'국어',title:'받아쓰기 연습',volume:'',status:'PLANNED'}]}}}));true`);
  await b.goto(base); await sleep(2500);
  await log('HOME0'); await shot(b, '01-home');
  await b.evaluate(`document.getElementById('readyHomeworkPrimary').click()`); await sleep(400);
  const pickerOpen = await b.evaluate(`!!document.getElementById('readyHomeworkPicker')&&!document.getElementById('readyHomeworkPicker').hidden`);
  console.log('pickerOpen', pickerOpen);
  if (pickerOpen) { await shot(b, '02-picker'); await b.evaluate(`document.querySelector('#readyHomeworkPicker [data-homework-task]').click()`); }
  await sleep(1500);
  await log('FOCUS1'); await shot(b, '03-focus');
  await b.evaluate(`document.getElementById('completeBtn').click()`); await sleep(400);
  await shot(b, '04-result-choices');
  await b.evaluate(`document.querySelector('#readyTaskFinish [data-finish-state="COMPLETED"]').click()`); await sleep(1200);
  await log('HOME1'); await shot(b, '05-home-after-result');
  await b.evaluate(`document.getElementById('readyHomeworkPrimary').click()`); await sleep(400);
  if (await b.evaluate(`!!document.getElementById('readyHomeworkPicker')&&!document.getElementById('readyHomeworkPicker').hidden`)) await b.evaluate(`document.querySelector('#readyHomeworkPicker [data-homework-task]').click()`);
  await sleep(1500);
  await log('FOCUS2'); await shot(b, '06-focus-resume');
  await b.evaluate(`document.getElementById('completeBtn').click()`); await sleep(400);
  await b.evaluate(`document.querySelector('#readyTaskFinish [data-finish-state="PARTIAL"]').click()`); await sleep(1500);
  await log('END'); await shot(b, '07-result');
  await b.evaluate(`document.querySelector('#resultView [data-nav="home"].btn').click()`); await sleep(1000);
  await log('HOME_FINAL'); await shot(b, '08-home-final');
  await b.goto(base); await sleep(2500);
  await log('RELOAD'); await shot(b, '09-home-reload');
  console.log('errors', JSON.stringify(b.errors));
} finally { b.close(); }
