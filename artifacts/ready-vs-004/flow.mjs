// READY-VS-004 browser flow (mobile 390x844, local only, synthetic fixture data):
// parent Home -> schedule editor (explicit STUDY_OPPORTUNITY) -> English homework FACT -> Foundation/Planner TODAY_TASK
// -> role switch -> child Home -> 숙제 시작 -> Focus -> reload, no duplicate projection.
// The harness only seeds a VS-003-ready identity; every schedule/FACT/Planner write goes through production UI handlers.
import {launch, sleep} from '../ready-vs-001/cdp.mjs';
const base = process.argv[2] || 'http://localhost:8104/';
const out = new URL('./', import.meta.url);
const shot = (b, n) => b.shot(new URL(`${n}.png`, out));
const b = await launch({port:9344});
const log = async (label, fn) => { const v = await fn(); console.log(label, JSON.stringify(v)); return v; };
const NL = 'String.fromCharCode(10)';
const state = () => b.evaluate(`(()=>{const t=new Date().toLocaleDateString('sv-SE');const p=JSON.parse(localStorage.getItem('readyset_planner_v1')||'{}');const f=JSON.parse(localStorage.getItem('ready_foundation_v1')||'{}');const facts=Object.values(p.assignmentFacts||{});const all=Object.entries(p.days||{}).flatMap(([d,x])=>(x.tasks||[]).map(k=>({...k,_day:d})));const ids=all.map(k=>k.id);return {today:t,role:localStorage.getItem('readyset_active_role_v1'),opportunities:(f.profiles||[]).flatMap(x=>x.events||[]).filter(e=>e.kind==='STUDY_OPPORTUNITY').map(e=>({title:e.title,weekday:e.weekday,start:e.start,end:e.end,source:e.source})),englishFacts:facts.filter(x=>x.sourceType==='ENGLISH_ACADEMY_PACKAGE').map(x=>({assignmentId:x.assignmentId,confirmationState:x.confirmationState,plannerState:x.plannerState,range:x.range,nextAcademy:x.nextAcademy,deadlineBoundary:x.deadlineBoundary,lifecycle:x.lifecycle})),todayTasks:(p.days?.[t]?.tasks||[]).map(k=>({id:k.id,title:k.title,volume:k.volume,status:k.status,sourceAssignmentId:k.sourceAssignmentId,sourceUnitId:k.sourceUnitId,projection:k.projection,authority:k.authority,localDate:k.localDate,deadline:k.deadline})),allPlannerTaskCount:all.length,duplicateIds:ids.filter((x,i)=>ids.indexOf(x)!==i),lastPlan:f.plans?.at(-1)&&{candidates:f.plans.at(-1).candidates.length,unresolved:f.plans.at(-1).unresolved},planCount:(f.plans||[]).length}})()`);
const parentHome = () => b.evaluate(`(()=>{const v=e=>!!e&&e.getBoundingClientRect().height>0;const hub=document.getElementById('readyParentSetupHub');return {role:document.documentElement.dataset.readyRole,view:document.querySelector('.view.active')?.dataset.view,hubVisible:v(hub),chips:[...(hub?.querySelectorAll('.rps-chip')||[])].map(x=>x.innerText),childPrimary:!!document.getElementById('readyHomeworkPrimary'),today:[...document.querySelectorAll('#homeTodayTodoList .readyHomeworkTask')].map(x=>x.innerText.split(${NL}).join(' / ')),todayButtons:document.querySelectorAll('#homeTodayTodoList button').length,roleSwitch:document.getElementById('rpsRoleSwitch')?.innerText}})()`);
const childHome = () => b.evaluate(`(()=>{const c=window.ReadySetRev07?.contract?.();return {role:document.documentElement.dataset.readyRole,url:location.search,view:document.querySelector('.view.active')?.dataset.view,hub:!!document.getElementById('readyParentSetupHub'),primary:document.getElementById('readyHomeworkPrimary')?.innerText.split(${NL}).join(' | '),today:[...document.querySelectorAll('#homeTodayTodoList .readyHomeworkTask')].map(x=>x.innerText.split(${NL}).join(' / ')),session:c&&{state:c.session_state,active:c.active_task_id,tasks:c.tasks.map(t=>t.label+':'+t.state+':laps='+t.laps.length)},focusMission:document.getElementById('focusMission')?.innerText,lap:document.getElementById('focusLapClock')?.innerText.split(${NL}).join(' | '),timerText:document.getElementById('timerText')?.innerText,roleSwitch:document.getElementById('rpsRoleSwitch')?.innerText}})()`);
const click = sel => b.evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)throw new Error('MISSING '+${JSON.stringify(sel)});e.click();return true})()`);
try {
  await b.goto(base);
  // 1. VS-003-ready identity produced through the real first-run UI (blank state -> guardian -> no-cost defer -> parent Home).
  await b.evaluate(`localStorage.clear();sessionStorage.clear();true`);
  await b.goto(base); await sleep(2500);
  await click('#rofIntroStart'); await sleep(700);
  await click('#guardianMode'); await sleep(500);
  await b.evaluate(`(()=>{const r=document.getElementById('readyFirstRun'),$=s=>r.querySelector(s),set=(e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))};set($('#n'),'김테스트');set($('#nn'),'별이');set($('#bd'),'2016-05-01');const sg=$('#sg');set(sg,[...sg.options].find(o=>o.value)?.value);$('#f').requestSubmit();return true})()`);
  await sleep(700);
  // Synthetic local photo fixture (canvas), not camera evidence.
  await b.evaluate(`(async()=>{const c=document.createElement('canvas');c.width=320;c.height=400;const x=c.getContext('2d');x.fillStyle='#9bd';x.fillRect(0,0,320,400);const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.9));const dt=new DataTransfer();dt.items.add(new File([blob],'synthetic-fixture.jpg',{type:'image/jpeg'}));const g=document.querySelector('#readyFirstRun #gal');g.files=dt.files;g.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
  await sleep(1500);
  await click('#readyFirstRun #next'); await sleep(2000);
  await click('#rofCharacterDefer'); await sleep(800);
  await click('[data-guide="pico"]'); await sleep(200);
  await click('#rofExplorerNext'); await sleep(800);
  await click('[data-theme="FOREST_TRAIL"]'); await sleep(200);
  await click('#rofFinish'); await sleep(4000);
  await log('00_IDENTITY', () => b.evaluate(`(()=>{const i=JSON.parse(localStorage.getItem('readyset_identity_v1')||'{}');return {status:i.status,setupMode:i.setupMode,characterSetupState:i.characterSetupState,characterVisualId:i.characterVisualId??null,activeRole:localStorage.getItem('readyset_active_role_v1')}})()`));
  const s0 = await log('01_STATE', state); await log('01_PARENT_HOME', parentHome); await shot(b, '01-parent-home');
  const today = s0.today;
  const nextAcademy = await b.evaluate(`(()=>{const d=new Date('${today}T12:00:00');d.setDate(d.getDate()+2);return d.toLocaleDateString('sv-SE')})()`);
  const weekday = await b.evaluate(`new Date('${today}T12:00:00').getDay()`);
  console.log('FIXTURE_DATES', JSON.stringify({today, weekday, nextAcademy, note:'nextAcademy=today+2 -> planning deadline today+1; opportunity only on today weekday'}));

  // 2. Schedule editor: explicit STUDY_OPPORTUNITY for today's weekday.
  await click('#readyParentSetupHub [data-rps-schedule]'); await sleep(800);
  await click('#rpsScheduleActions [data-edit-schedule]'); await sleep(500);
  await b.evaluate(`(()=>{const f=document.querySelector('#rpsScheduleDialog form'),e=f.elements;e.title.value='집 공부 시간 (fixture)';e.subject.value='영어';e.date.value='${today}';e.weekday.value='${weekday}';e.start.value='16:00';e.end.value='17:00';e.kind.value='STUDY_OPPORTUNITY';return true})()`);
  await shot(b, '02a-schedule-editor-filled');
  await b.evaluate(`document.querySelector('#rpsScheduleDialog form').requestSubmit()`); await sleep(900);
  await log('02_SCHEDULE_SAVED', () => b.evaluate(`({toast:document.getElementById('toast')?.hidden===false?document.getElementById('toast').innerText:null,dialogOpen:!!document.getElementById('rpsScheduleDialog'),alert:document.querySelector('#rpsScheduleDialog [role=alert]')?.innerText||null,view:document.querySelector('.view.active')?.dataset.view,daily:document.getElementById('dailyScheduleList')?.innerText.split(${NL}).join(' / ')})`));
  await log('02_STATE', state); await shot(b, '02b-schedule-saved');

  // 3. Homework input (existing Stage-F parent English form).
  await click('#scheduleView [data-nav="home"]'); await sleep(800);
  await click('#readyParentSetupHub [data-rps-homework]'); await sleep(1200);
  await b.evaluate(`(()=>{const r=document.getElementById('rsfParent');const set=(s,v)=>{const e=r.querySelector(s);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))};set('#rsfEnglishWorkbook','Fixture Reader');set('#rsfEnglishRange','p.32~35');set('#rsfEnglishNext','${nextAcademy}');r.querySelector('#rsfEnglishRange').scrollIntoView({block:'center'});return true})()`);
  await sleep(300);
  await log('03_ENGLISH_INPUT', () => b.evaluate(`({view:document.querySelector('.view.active')?.dataset.view,workbook:document.getElementById('rsfEnglishWorkbook').value,range:document.getElementById('rsfEnglishRange').value,next:document.getElementById('rsfEnglishNext').value})`));
  await shot(b, '03-english-input');
  await click('#rsfEnglishFactSave'); await sleep(1200);
  const s4 = await log('04_STATE_AFTER_SAVE', state);
  await log('04_FACT_SURFACE', () => b.evaluate(`(()=>{const r=document.getElementById('rsfParent');return {toast:document.getElementById('toast')?.hidden===false?document.getElementById('toast').innerText:null,factCard:r?.innerText.split(${NL}).filter(l=>/영어|FACT|확정|p\\.32/.test(l)).slice(0,8)}})()`));
  await b.evaluate(`document.getElementById('rsfEnglishFactSave').scrollIntoView({block:'center'})`); await sleep(200);
  await shot(b, '04-after-save');

  // 5. Parent Home reflects allocation (status only).
  await b.evaluate(`window.ReadyBaseRuntimeV1?.nav?window.ReadyBaseRuntimeV1.nav('home'):document.querySelector('[data-nav="home"]').click()`); await sleep(1000);
  await log('05_PARENT_HOME', parentHome); await b.evaluate(`document.getElementById('readyParentSetupHub')?.scrollIntoView({block:'start'})`); await sleep(200);
  await shot(b, '05-parent-home-allocation');

  // 6. Existing role switch -> child.
  await click('#rpsRoleSwitch'); await sleep(3500);
  await log('06_CHILD_HOME', childHome); const s6 = await log('06_STATE', state); await shot(b, '06-child-home');

  // 11a. Reload before starting.
  await b.goto(await b.evaluate('location.href')); await sleep(3000);
  await log('07_CHILD_RELOAD_BEFORE_START', childHome); const s7 = await log('07_STATE', state); await shot(b, '07-child-home-reload');

  // 10. Start without choosing a timer.
  await click('#readyHomeworkPrimary'); await sleep(500);
  if (await b.evaluate(`!!document.getElementById('readyHomeworkPicker')&&!document.getElementById('readyHomeworkPicker').hidden`)) { await shot(b, '08a-picker'); await click('#readyHomeworkPicker [data-homework-task]'); }
  await sleep(1500);
  await log('08_FOCUS', childHome); await log('08_STATE', state); await shot(b, '08-child-focus');

  // 11b. Return Home and reload.
  await b.evaluate(`window.ReadyBaseRuntimeV1?.nav?window.ReadyBaseRuntimeV1.nav('home'):null`); await sleep(800);
  await log('09_CHILD_HOME_DURING_SESSION', childHome); await shot(b, '09-child-home-during-session');
  await b.goto(await b.evaluate('location.href')); await sleep(3000);
  await log('10_CHILD_RELOAD_AFTER_START', childHome); const s10 = await log('10_STATE', state); await shot(b, '10-child-home-reload-after-start');

  // Parent-side reconcile/render after child start must not duplicate.
  await b.goto(base + '?role=parent'); await sleep(3000);
  await b.evaluate(`window.ReadyStageG14?.reconcile?.();window.ReadyParentSetupHubV1?.render?.();true`); await sleep(500);
  await log('11_PARENT_RELOAD', parentHome); const s11 = await log('11_STATE', state); await shot(b, '11-parent-home-reload');

  const counts = [s4, s6, s7, s10, s11].map(s => s.todayTasks.length);
  console.log('TODAY_TASK_COUNTS', JSON.stringify(counts), 'DUPLICATES', JSON.stringify([s4, s6, s7, s10, s11].flatMap(s => s.duplicateIds)));
  console.log('errors', JSON.stringify(b.errors));
} finally { b.close(); }
