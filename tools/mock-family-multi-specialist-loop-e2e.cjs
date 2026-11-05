const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');

const READY='http://127.0.0.1:4340/';
const HIDE='http://127.0.0.1:4311/';
const SNAP='http://127.0.0.1:4321/';
const PLAY='http://127.0.0.1:4331/';
const readyUrl=new URL(READY);
readyUrl.searchParams.set('role','child');
readyUrl.searchParams.set('hide_target',HIDE);
readyUrl.searchParams.set('snap_target',SNAP);
readyUrl.searchParams.set('play_camp_target',PLAY);

const outDir='D:/Git PWA/READY-WEBAPP-20261006/artifacts/mock-family-multi-specialist-loop-20261010';
fs.mkdirSync(outDir,{recursive:true});
const result={pass:false,scenario:'ONE READY SESSION -> HIDE -> SNAP -> PLAY CAMP -> ONE READY RECORD',steps:{},gaps:[],errors:[]};
const today=()=>new Date().toLocaleDateString('sv-SE');
async function shot(page,name){await page.screenshot({path:outDir+'/'+name+'.png',fullPage:true}).catch(()=>{})}

function playInit(){
  if(location.port!=='4331')return;
  const child='mock-child-multi';
  const profile={
    familyMemberId:child,displayName:'별이',presentationBand:'EARLY_EXPLORER',interests:[],
    boundary:{explorerId:'explorer-mock',islandId:'island-mock',basecampId:'basecamp-mock',activeCrewIds:['dubi']},
    intro:{stage:'MAIN_ISLAND_READY',selectedCrewIds:['dubi'],visualId:null,visualIdentity:null,packedItemIds:[],departureMode:'SAIL',islandName:'목업섬',basecampName:'목업캠프'},
    recentExperiences:[],creations:[]
  };
  localStorage.setItem('taky-play-camp-explorer-profile-v1:'+encodeURIComponent(child),JSON.stringify(profile));
  sessionStorage.setItem('play_camp_family_scope_session_v1','FAMILY_MULTI_MOCK');
  window.__mockPlayEvidenceCount=0;
  window.TAKY_FAMILY_RUNTIME={
    apiBaseUrl:location.origin+'/',
    getToken:()=> 'mock-token-abcdefghijklmnop',
    getFamilyId:()=> 'FAMILY_MULTI_MOCK',
    fetchImpl:async(input,init={})=>{
      const url=String(input);
      const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
      if(url.includes('/api/learning/evidence')){
        window.__mockPlayEvidenceCount=(window.__mockPlayEvidenceCount||0)+1;
        const packet=JSON.parse(String(init.body||'{}'));
        return json({ok:true,acknowledgement_kind:'OBSERVATION_INGEST_RECEIPT',packet_id:packet.packet_id,event_id:packet.event?.event_id,storage_confirmed:true});
      }
      if(url.includes('/api/learning/decision'))return json({ok:false,reason:'MOCK_DECISION_NOT_REQUIRED'},503);
      return fetch(input,init);
    }
  };
}

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});
  await context.addInitScript(playInit);
  const page=await context.newPage();
  page.on('pageerror',e=>result.errors.push('PAGE:'+String(e)));
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))result.errors.push('HTTP_'+r.status()+':'+r.url())});

  console.log('STAGE 01 READY_BOOT');
  await page.goto(readyUrl.href,{waitUntil:'domcontentloaded',timeout:12000});
  await page.evaluate((date)=>{
    localStorage.clear();sessionStorage.clear();
    localStorage.setItem('readyset_active_role_v1','child');
    localStorage.setItem('readyset_identity_v1',JSON.stringify({
      schemaVersion:5,status:'READY',onboardingStep:'DONE',setupMode:'GUARDIAN_FOR_CHILD',
      operator:{role:'CHILD'},userId:'mock-child-multi',legalName:'목업 아이',nickname:'별이',familyRole:'CHILD',
      schoolStage:'E5',birthDate:'2015-05-01',explorerId:'dubi',explorerName:'두비',
      journeyTheme:'TODAYS_ISLAND',characterSetupState:'DEFERRED_NO_COST',characterVisualId:null
    }));
    localStorage.setItem('readyset_planner_v1',JSON.stringify({
      version:1,days:{[date]:{localDate:date,tasks:[
        {id:'planner-hide',task_id:'planner-hide',title:'영어',subject:'영어',volume:'apple 1개',status:'PLANNED',selected:true,required:true,authority:'PLANNER/MAIN'},
        {id:'planner-snap',task_id:'planner-snap',title:'영어',subject:'영어',volume:'문장 표현 1개',status:'PLANNED',selected:false,required:true,authority:'PLANNER/MAIN'},
        {id:'planner-play',task_id:'planner-play',title:'영어',subject:'영어',volume:'CVC 소리 1개',status:'PLANNED',selected:false,required:true,authority:'PLANNER/MAIN'}
      ]}}
    }));
  },today());
  await page.goto(readyUrl.href,{waitUntil:'domcontentloaded',timeout:12000});
  await page.waitForFunction(()=>window.ReadyHomeHomeworkMVPV1?.tasks?.().length===3&&window.ReadySetRev07,{timeout:12000});

  const session=await page.evaluate(()=>{
    const tasks=ReadyHomeHomeworkMVPV1.tasks();
    const c=ReadyHomeHomeworkMVPV1.createSession(tasks[0]);
    ReadyBaseRuntimeV1.nav('focus');
    return c;
  });
  assert.equal(session.tasks.length,3);
  assert.deepEqual(session.tasks.map(t=>t.suggested_app),['hide-seek','snap-pop','play-camp']);
  result.steps.session_created={session_id:session.session_id,tasks:session.tasks.map(t=>({id:t.task_id,label:t.label,suggested_app:t.suggested_app,state:t.state}))};
  await shot(page,'01-ready-three-tasks');
  console.log('STAGE 02 THREE_TASK_SESSION');

  // HIDE
  await page.evaluate(()=>ReadySetRev07.launchSpecialist('hide-seek'));
  await page.waitForFunction(()=>location.port==='4311'&&window.HideTermDecoderV1?.state==='BOUND'&&window.HideSeekBridge?.context?.()?.session_id,{timeout:15000});
  await page.waitForFunction(()=>document.documentElement.dataset.hideLearningTermLoader==='BOUND',{timeout:12000});
  await page.evaluate(()=>HideTermDecoderV1.registerCards([{
    id:'mock-apple',term:'apple',meaning:'사과',subject:'ENGLISH',
    components:[{text:'apple',meaning:'사과'}],conceptLinks:['과일','먹거리'],
    concept:{summary:'사과는 과일이다.',relations:['사과는 과일의 한 종류다.']}
  }],{replace:true,engineOwned:true,projection:{school_stage:'E5',subject:'ENGLISH',grade_context:{state:'RESOLVED',school_stage:'E5',base_band:'UPPER_ELEMENTARY',effective_band:'UPPER_ELEMENTARY',evidence_step:0}}}));
  await page.evaluate(()=>HideTermDecoderV1.open('TRACE'));
  await page.click('#termTraceReveal');
  await page.click('[data-trace-result="SELF_KNOWN"]');
  const hideEvidence=await page.evaluate(()=>HideTermDecoderV1.snapshot());
  assert.ok(hideEvidence.evidenceCount>=1);
  await page.evaluate((n)=>HideSeekBridge.returnToBase('COMPLETED',{mock:true,evidence_count:n}),hideEvidence.evidenceCount);
  await page.waitForFunction(()=>location.port==='4340'&&window.ReadySetRev07?.contract?.()?.active_app==='ready-set',{timeout:15000});
  const afterHide=await page.evaluate(()=>{
    const p=JSON.parse(localStorage.getItem('readyset_planner_v1'));
    const c=ReadySetRev07.contract();
    return {planner:p.days[new Date().toLocaleDateString('sv-SE')].tasks.map(t=>({id:t.id,status:t.status,reports:t.learningReports||[]})),contract:c};
  });
  assert.equal(afterHide.planner.find(t=>t.id==='planner-hide').status,'COMPLETED');
  assert.equal(afterHide.planner.find(t=>t.id==='planner-hide').reports.at(-1)?.source,'hide-seek');
  result.steps.hide_completed={planner:afterHide.planner.find(t=>t.id==='planner-hide'),task:afterHide.contract.tasks[0]};
  console.log('STAGE 03 HIDE_DONE');

  // SNAP
  const snapStart=await page.evaluate(()=>{
    const c=ReadySetRev07.contract(),next=c.tasks[1];
    ReadySetRev07.switchTask(next.task_id);
    const p=JSON.parse(localStorage.getItem('readyset_planner_v1'));
    const status=p.days[new Date().toLocaleDateString('sv-SE')].tasks.find(t=>t.id==='planner-snap')?.status;
    const after=ReadySetRev07.contract();
    ReadySetRev07.launchSpecialist('snap-pop');
    return {plannerStatusAtStart:status,lap_id:after.active_lap_id};
  });
  assert.equal(snapStart.plannerStatusAtStart,'IN_PROGRESS','SECOND_TASK_PLANNER_NOT_IN_PROGRESS');
  await page.waitForFunction(()=>location.port==='4321'&&window.SnapPopBridge?.context?.()?.session_id&&document.querySelectorAll('#landmarks .landmark').length>0,{timeout:15000});
  await page.click('#landmarks .landmark');
  await page.waitForFunction(()=>!document.getElementById('selection').hidden,{timeout:8000});
  await page.click('#startBtn');
  for(const answer of ['첫 생각','이유를 연결한 생각','내 문장으로 정리']){
    await page.fill('#answer',answer);await page.click('#nextBtn');await page.waitForTimeout(300);
  }
  await page.waitForFunction(()=>window.SnapPopBridge?.context?.()?.task_completed===true,{timeout:8000});
  await page.click('#snapBaseCampChip');
  await page.waitForFunction(()=>location.port==='4340'&&window.ReadySetRev07?.contract?.()?.active_app==='ready-set',{timeout:15000});
  const afterSnap=await page.evaluate(()=>{
    const p=JSON.parse(localStorage.getItem('readyset_planner_v1'));
    const c=ReadySetRev07.contract();
    return {planner:p.days[new Date().toLocaleDateString('sv-SE')].tasks.map(t=>({id:t.id,status:t.status,reports:t.learningReports||[]})),contract:c};
  });
  assert.equal(afterSnap.planner.find(t=>t.id==='planner-snap').status,'COMPLETED');
  assert.equal(afterSnap.planner.find(t=>t.id==='planner-snap').reports.at(-1)?.source,'snap-pop');
  result.steps.snap_completed={plannerStatusAtStart:snapStart.plannerStatusAtStart,planner:afterSnap.planner.find(t=>t.id==='planner-snap'),task:afterSnap.contract.tasks[1]};
  console.log('STAGE 04 SNAP_DONE');

  // PLAY CAMP
  const playStart=await page.evaluate(()=>{
    const c=ReadySetRev07.contract(),next=c.tasks[2];
    ReadySetRev07.switchTask(next.task_id);
    const p=JSON.parse(localStorage.getItem('readyset_planner_v1'));
    const status=p.days[new Date().toLocaleDateString('sv-SE')].tasks.find(t=>t.id==='planner-play')?.status;
    const after=ReadySetRev07.contract();
    ReadySetRev07.launchSpecialist('play-camp');
    return {plannerStatusAtStart:status,lap_id:after.active_lap_id};
  });
  assert.equal(playStart.plannerStatusAtStart,'IN_PROGRESS','THIRD_TASK_PLANNER_NOT_IN_PROGRESS');
  await page.waitForFunction(()=>location.port==='4331'&&window.PlayCampReadyBridge?.linked?.()===true&&document.querySelectorAll('.camp-zone-button').length>0,{timeout:18000});
  await page.locator('.camp-zone-button').filter({hasText:'English'}).first().click();
  await page.waitForSelector('.english-sound-scene',{state:'visible',timeout:10000});
  const stones=page.locator('.phoneme-stone');assert.equal(await stones.count(),3);
  for(let i=0;i<3;i++)await stones.nth(i).click();
  await page.click('.english-blend');
  await page.waitForFunction(()=>window.PlayCampReadyBridge?.context?.()?.task_completed===true&&Number(window.__mockPlayEvidenceCount||0)>=1,{timeout:10000});
  await page.click('#playCampReadyReturn');
  await page.waitForFunction(()=>location.port==='4340'&&window.ReadySetRev07?.contract?.()?.active_app==='ready-set',{timeout:15000});
  const afterPlay=await page.evaluate(()=>{
    const p=JSON.parse(localStorage.getItem('readyset_planner_v1'));
    const c=ReadySetRev07.contract();
    return {planner:p.days[new Date().toLocaleDateString('sv-SE')].tasks.map(t=>({id:t.id,status:t.status,reports:t.learningReports||[]})),contract:c};
  });
  assert.equal(afterPlay.planner.find(t=>t.id==='planner-play').status,'COMPLETED');
  assert.equal(afterPlay.planner.find(t=>t.id==='planner-play').reports.at(-1)?.source,'play-camp');
  assert.ok(afterPlay.contract.tasks.every(t=>t.state==='COMPLETED'));
  result.steps.play_completed={plannerStatusAtStart:playStart.plannerStatusAtStart,planner:afterPlay.planner.find(t=>t.id==='planner-play'),task:afterPlay.contract.tasks[2]};
  await shot(page,'02-all-three-completed');
  console.log('STAGE 05 PLAY_DONE');

  // one Ready session -> one record
  await page.evaluate(()=>ReadyHomeHomeworkMVPV1.endSession());
  await page.waitForFunction(()=>!!document.getElementById('rev07ConfirmEnd')&&!document.getElementById('rev07ConfirmEnd').disabled,{timeout:8000});
  await page.evaluate(()=>document.getElementById('rev07ConfirmEnd').click());
  await page.waitForTimeout(700);
  const final=await page.evaluate(()=>{
    const p=JSON.parse(localStorage.getItem('readyset_planner_v1'));
    const core=JSON.parse(localStorage.getItem('readyset_state')||'{}');
    return {
      planner:p.days[new Date().toLocaleDateString('sv-SE')].tasks.map(t=>({id:t.id,status:t.status,source:t.learningReports?.at(-1)?.source||null})),
      activeSession:core.activeSession||null,
      recordCount:(core.records||[]).length,
      record:(core.records||[])[0]||null
    };
  });
  assert.ok(final.planner.every(t=>t.status==='COMPLETED'));
  assert.deepEqual(final.planner.map(t=>t.source),['hide-seek','snap-pop','play-camp']);
  assert.equal(final.activeSession,null);
  assert.equal(final.recordCount,1);
  assert.equal(final.record.tasks.length,3);
  assert.ok(final.record.tasks.every(t=>t.state==='COMPLETED'));
  assert.equal(final.record.label,'오늘 과제 3개');
  result.steps.final=final;
  result.pass=true;
  fs.writeFileSync(outDir+'/mock-result.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
  await context.close();await browser.close();
})().catch(async e=>{
  result.errors.push(String(e?.stack||e));
  fs.writeFileSync(outDir+'/mock-result.json',JSON.stringify(result,null,2));
  console.error(e);
  process.exit(1);
});