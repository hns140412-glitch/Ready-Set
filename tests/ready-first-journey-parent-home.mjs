import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createServer} from './visual-qa/server.mjs';

const {chromium}=await import(process.argv[2]?pathToFileURL(process.argv[2]).href:'playwright');
const server=createServer();
await new Promise(resolve=>server.listen(4177,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({headless:true,timeout:15000,...(process.argv[3]?{executablePath:process.argv[3]}:{})});
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});
  let apiCalls=0;
  await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.pathname.startsWith('/api/'))apiCalls++;
    if(url.origin!=='http://127.0.0.1:4177'||url.pathname.startsWith('/api/'))return route.abort();
    return route.continue();
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',dialog=>dialog.dismiss());

  await page.goto('http://127.0.0.1:4177/__visual/?state=onboarding-photo',{waitUntil:'load',timeout:15000});
  await page.waitForFunction(()=>window.ReadyIdentityV1&&document.documentElement.dataset.readyStageLoader);
  await page.locator('#gal').setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
  await page.waitForFunction(()=>!document.querySelector('#readyFirstRun #next')?.disabled);
  await page.locator('#readyFirstRun #next').tap();
  await page.waitForSelector('#readyCharacterCandidateMount .takyConsult',{timeout:12000});
  assert.equal(await page.evaluate(()=>ReadyIdentityV1.get().onboardingStep),'CHARACTER');

  await page.locator('[data-taky-choice="FEEL_BRIGHT"]').tap();
  await page.locator('[data-taky-confirm]').tap();
  await page.locator('[data-taky-choice="LOOK_ACTIVE"]').tap();
  await page.locator('[data-taky-confirm]').tap();
  await page.waitForSelector('[data-taky-generate]',{timeout:8000});
  assert.equal(await page.evaluate(()=>ReadyIdentityV1.get().characterMoodDirections.selections.length),3);
  assert.match(await page.evaluate(()=>ReadyIdentityV1.get().characterMoodDirections.selections[2].tileKey),/^AUTO_/);

  await page.waitForSelector('#rofCharacterDefer',{timeout:8000});
  await page.locator('#rofCharacterDefer').tap();
  await page.waitForSelector('#rofExplorerNext',{timeout:8000});
  assert.equal(await page.evaluate(()=>ReadyIdentityV1.get().onboardingStep),'EXPLORER');
  await page.locator('button[data-guide="lumi"]').tap();
  await page.locator('#rofExplorerNext').tap();
  await page.waitForSelector('#rofFinish',{timeout:8000});
  assert.equal(await page.evaluate(()=>ReadyIdentityV1.get().onboardingStep),'THEME');
  await page.locator('button[data-theme="TODAYS_ISLAND"]').tap();

  // The finish action intentionally reloads to the derived parent role. Keep completed
  // identity and local-first state instead of letting the disposable PHOTO fixture reseed.
  await page.addInitScript(()=>{
    const clear=Storage.prototype.clear,set=Storage.prototype.setItem;
    Storage.prototype.clear=function(){};
    Storage.prototype.setItem=function(k,v){if(k!=='readyset_identity_v1')return set.call(this,k,v)};
    document.addEventListener('DOMContentLoaded',()=>{Storage.prototype.clear=clear;Storage.prototype.setItem=set},{once:true});
  });
  await page.locator('#rofFinish').tap();
  await page.waitForLoadState('load',{timeout:12000});
  await page.waitForFunction(()=>window.ReadyIdentityV1?.isReady?.()===true,{timeout:12000});
  await page.waitForSelector('#readyParentSetupHub',{timeout:12000});

  const outcome=await page.evaluate(()=>({
    identity:ReadyIdentityV1.get(),
    role:window.ReadyRoleContextV1?.current?.(),
    hub:!!document.querySelector('#readyParentSetupHub'),
    schedule:!!document.querySelector('#readyParentSetupHub [data-rps-schedule]'),
    homework:!!document.querySelector('#readyParentSetupHub [data-rps-homework]')
  }));
  assert.equal(outcome.identity.status,'READY');
  assert.equal(outcome.identity.characterSetupState,'DEFERRED_NO_COST');
  assert.equal(outcome.identity.explorerId,'lumi');
  assert.equal(outcome.identity.journeyTheme,'TODAYS_ISLAND');
  assert.equal(outcome.role,'parent');
  assert.equal(outcome.hub,true);
  assert.equal(outcome.schedule,true);
  assert.equal(outcome.homework,true);

  // Parent home → timetable → explicit STUDY_OPPORTUNITY through the actual editor UI.
  await page.locator('#readyParentSetupHub [data-rps-schedule]').tap();
  await page.waitForSelector('#rpsScheduleActions [data-edit-schedule]',{timeout:8000});
  await page.locator('#rpsScheduleActions [data-edit-schedule]').tap();
  await page.waitForSelector('#rpsScheduleDialog[open]',{timeout:8000});
  const calendar=await page.evaluate(()=>({
    today:new Date().toLocaleDateString('sv-SE'),
    weekday:new Date(`${new Date().toLocaleDateString('sv-SE')}T12:00:00`).getDay()
  }));
  const scheduleDialog=page.locator('#rpsScheduleDialog');
  await scheduleDialog.locator('input[name="title"]').fill('오늘 학습 가능');
  await scheduleDialog.locator('input[name="subject"]').fill('수학');
  await scheduleDialog.locator('input[name="date"]').fill(calendar.today);
  await scheduleDialog.locator('select[name="weekday"]').selectOption(String(calendar.weekday));
  await scheduleDialog.locator('input[name="start"]').fill('13:00');
  await scheduleDialog.locator('input[name="end"]').fill('14:00');
  await scheduleDialog.locator('select[name="kind"]').selectOption('STUDY_OPPORTUNITY');
  await scheduleDialog.locator('button.save').tap();
  await page.waitForFunction(()=>window.ReadyFoundationControlV1?.load?.().profiles?.some(p=>p.state==='ACTIVE'&&(p.events||[]).some(e=>e.kind==='STUDY_OPPORTUNITY')),{timeout:8000});

  // Parent home homework entry remains first-class: navigate through the actual homework action.
  await page.evaluate(()=>window.ReadyBaseRuntimeV1?.nav?.('home'));
  await page.waitForSelector('#readyParentSetupHub [data-rps-homework]',{timeout:8000});
  await page.locator('#readyParentSetupHub [data-rps-homework]').tap();
  await page.waitForFunction(()=>!!(document.querySelector('#rscCaptureRoot')||document.querySelector('#rsfParent')||document.querySelector('#assignmentIntakeRoot')),{timeout:10000});

  // Use the product's reviewed manual FACT commit contract; no AI/API call is allowed here.
  const factResult=await page.evaluate(()=>{
    const today=new Date().toLocaleDateString('sv-SE');
    const fact={id:`e2e_fact_${Date.now()}`,title:'수학 숙제',subject:'수학',volume:'10~15쪽',deadline:today,source:'MANUAL'};
    const C=window.ReadyFoundationControlV1;
    C.capture('ADD',{id:fact.id,path:'MANUAL',fact});
    C.capture('ANALYZE');
    C.capture('RESULT',{retakeIds:[]});
    C.capture('COMMIT',{reviewed:true,facts:[fact]});
    return {id:fact.id,today};
  });
  await page.waitForFunction(({id,today})=>{
    const C=window.ReadyFoundationControlV1;
    const state=C?.load?.();
    const committed=(state?.assignments||[]).some(a=>a.id===id);
    const planner=JSON.parse(localStorage.getItem('readyset_planner_v1')||'{"days":{}}');
    const todayTasks=planner.days?.[today]?.tasks||[];
    return committed&&todayTasks.some(t=>t.authority==='PLANNER/MAIN'&&t.projection==='TODAY_TASK'&&t.sourceAssignmentId===id);
  },factResult,{timeout:12000});

  const parentRoundtrip=await page.evaluate(({id,today})=>{
    const state=ReadyFoundationControlV1.load();
    const planner=JSON.parse(localStorage.getItem('readyset_planner_v1')||'{"days":{}}');
    const tasks=planner.days?.[today]?.tasks||[];
    return {
      studyOpportunity:state.profiles.some(p=>(p.events||[]).some(e=>e.kind==='STUDY_OPPORTUNITY')),
      factCommitted:(state.assignments||[]).some(a=>a.id===id),
      plannerCandidate:(state.plans.at(-1)?.candidates||[]).some(t=>t.sourceAssignmentId===id),
      todayTask:tasks.some(t=>t.authority==='PLANNER/MAIN'&&t.projection==='TODAY_TASK'&&t.sourceAssignmentId===id)
    };
  },factResult);
  assert.deepEqual(parentRoundtrip,{studyOpportunity:true,factCommitted:true,plannerCandidate:true,todayTask:true});

  // Parent → child role reload. The live child UI is Today's Island; governed tasks surface as island pins.
  await page.evaluate(()=>window.ReadyRoleContextV1.switchRole('child',{reload:true}));
  await page.waitForLoadState('load',{timeout:12000});
  await page.waitForFunction(()=>window.ReadyRoleContextV1?.current?.()==='child'&&window.ReadyHomeHomeworkMVPV1&&window.ReadyWorldShellV1,{timeout:12000});
  await page.waitForFunction(()=>window.ReadyHomeHomeworkMVPV1.tasks().length>0,{timeout:10000});
  await page.evaluate(()=>window.ReadyWorldShellV1?.render?.());
  await page.waitForSelector('#worldStage .worldTaskPin',{timeout:10000});
  const childOutcome=await page.evaluate(({id})=>({
    role:ReadyRoleContextV1.current(),
    parentHub:!!document.querySelector('#readyParentSetupHub'),
    taskCount:ReadyHomeHomeworkMVPV1.tasks().length,
    sourceTask:ReadyHomeHomeworkMVPV1.tasks().some(t=>t.task_id.includes(id)||t.title==='수학 숙제'||t.subject==='수학'),
    worldPins:document.querySelectorAll('#worldStage .worldTaskPin').length,
    pinText:[...document.querySelectorAll('#worldStage .worldTaskPin')].map(x=>x.textContent||'').join(' ')
  }),factResult);
  assert.equal(childOutcome.role,'child');
  assert.equal(childOutcome.parentHub,false);
  assert.ok(childOutcome.taskCount>0);
  assert.equal(childOutcome.sourceTask,true);
  assert.ok(childOutcome.worldPins>0);
  assert.match(childOutcome.pinText,/수학|10~15|발견하기/);

  // Tap the actual island task pin. This is the child-facing start/select action and must persist the governed task.
  await page.locator('#worldStage .worldTaskPin').first().tap();
  await page.waitForLoadState('load',{timeout:12000});
  await page.waitForFunction(({id,today})=>{
    const planner=JSON.parse(localStorage.getItem('readyset_planner_v1')||'{"days":{}}');
    const tasks=planner.days?.[today]?.tasks||[];
    const selected=tasks.find(t=>t.selected===true);
    const core=JSON.parse(localStorage.getItem('readyset_state')||'{}');
    return !!selected&&selected.sourceAssignmentId===id&&String(core.g13PlannerTask?.id)===String(selected.id);
  },factResult,{timeout:12000});

  assert.equal(apiCalls,0);
  assert.deepEqual(errors,[]);
  console.log('PASS: First Journey → parent STUDY_OPPORTUNITY → reviewed homework FACT → Planner TODAY_TASK → child island pin selection; API calls 0');
  await context.close();
} finally {
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}