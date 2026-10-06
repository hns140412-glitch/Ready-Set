// READY-VS-003 regression copy of artifacts/ready-vs-002/parent-flow.mjs with a COMPLETE (deferred-character) identity seed; first-run now owns incomplete identities.
// READY-VS-002 browser flow: parent Home (setup hub, status-only Planner) -> schedule editor / homework input (mobile 390x844).
import {launch, sleep} from '../ready-vs-001/cdp.mjs';
const base = (process.argv[2] || 'http://localhost:8098/') + '?role=parent';
const out = new URL('./', import.meta.url);
const shot = (b, n) => b.shot(new URL(`vs002-parent-${n}.png`, out));
const b = await launch({port:9346});
const home = () => b.evaluate(`(()=>{const v=e=>!!e&&e.getBoundingClientRect().height>0;const hub=document.getElementById('readyParentSetupHub');const home=document.getElementById('homeView');return {view:document.querySelector('.view.active')?.dataset.view, title:document.getElementById('baseHomeTitle')?.innerText, lead:document.getElementById('baseHomeLead')?.innerText, hubVisible:v(hub), hubHost:hub?.parentElement?.className, scheduleAction:v(hub?.querySelector('[data-rps-schedule]')), homeworkAction:v(hub?.querySelector('[data-rps-homework]')), baseActions:document.getElementById('baseActions')?.innerText.split(String.fromCharCode(10)).join(' | '), childPrimary:!!document.getElementById('readyHomeworkPrimary'), quickStart:document.querySelectorAll('[data-quick-start]').length, homeText_숙제시작:home.innerText.includes('숙제 시작'), homeText_이어서:home.innerText.includes('이어서'), today:[...document.querySelectorAll('#homeTodayTodoList .readyHomeworkTask')].map(x=>x.innerText.split(String.fromCharCode(10)).join(' / ')), todayButtons:document.querySelectorAll('#homeTodayTodoList button').length}})()`);
const log = async (label, fn) => console.log(label, JSON.stringify(await fn()));
try {
  await b.goto(base);
  const today = await b.evaluate(`new Date().toLocaleDateString('sv-SE')`);
  await b.evaluate(`localStorage.clear();localStorage.setItem('readyset_active_role_v1','parent');localStorage.setItem('readyset_identity_v1',JSON.stringify({schemaVersion:5,status:'READY',onboardingStep:'DONE',setupMode:'GUARDIAN_FOR_CHILD',legalName:'김테스트',nickname:'별이',familyRole:'CHILD',schoolStage:'E4',birthDate:'2016-05-01',explorerId:'lumi',explorerName:'루미',journeyTheme:'TODAYS_ISLAND',characterSetupState:'DEFERRED_NO_COST',characterVisualId:null}));localStorage.setItem('readyset_planner_v1',JSON.stringify({version:1,days:{'${today}':{localDate:'${today}',tasks:[{id:'p1',task_id:'hw_math_1',subject:'수학',title:'수학 익힘책',volume:'24~25쪽',status:'PLANNED'},{id:'p2',task_id:'hw_kor_1',subject:'국어',title:'받아쓰기 연습',volume:'',status:'COMPLETED'}]}}}));true`);
  await b.goto(base); await sleep(3000);
  await log('PARENT_HOME', home); await shot(b, '01-home');
  await b.evaluate(`document.getElementById('readyParentSetupHub').scrollIntoView({block:'start'})`); await sleep(200);
  await shot(b, '02-home-hub');
  await b.evaluate(`document.querySelector('#readyParentSetupHub [data-rps-schedule]').click()`); await sleep(800);
  await log('SCHEDULE', () => b.evaluate(`({view:document.querySelector('.view.active')?.dataset.view, editAction:!!document.querySelector('#scheduleView #rpsScheduleActions [data-edit-schedule]')})`));
  await shot(b, '03-schedule');
  await b.evaluate(`document.querySelector('#rpsScheduleActions [data-edit-schedule]').click()`); await sleep(500);
  await log('SCHEDULE_EDITOR', () => b.evaluate(`({open:!!document.getElementById('rpsScheduleDialog')?.open, heading:document.querySelector('#rpsScheduleDialog h2')?.innerText})`));
  await shot(b, '04-schedule-editor');
  await b.evaluate(`document.querySelector('#rpsScheduleDialog .close').click()`); await sleep(300);
  await b.evaluate(`document.querySelector('#scheduleView [data-nav="home"]').click()`); await sleep(800);
  await log('BACK_HOME', home);
  await b.evaluate(`document.querySelector('#readyParentSetupHub [data-rps-homework]').click()`); await sleep(1200);
  await log('HOMEWORK', () => b.evaluate(`(()=>{const t=document.querySelector('#rscCaptureRoot')||document.querySelector('#rsfParent')||document.querySelector('#assignmentIntakeRoot');return {view:document.querySelector('.view.active')?.dataset.view, inputSurface:t?.id||null, inputVisible:!!t&&t.getBoundingClientRect().height>0, missionStartButtons:[...document.querySelectorAll('#missionView button')].filter(x=>/숙제 시작|시작하기/.test(x.innerText)).map(x=>x.innerText)}})()`));
  await shot(b, '05-homework-input');
  await b.goto(base); await sleep(3000);
  await log('PARENT_RELOAD', home); await shot(b, '06-home-reload');
  console.log('errors', JSON.stringify(b.errors));
} finally { b.close(); }
