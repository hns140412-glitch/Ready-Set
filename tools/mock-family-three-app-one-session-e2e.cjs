const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');

const READY='http://127.0.0.1:4340/';
const HIDE='http://127.0.0.1:4341/';
const SNAP='http://127.0.0.1:4342/';
const PLAY='http://127.0.0.1:4343/';
const outDir='D:/Git PWA/READY-WEBAPP-20261006/artifacts/mock-family-three-app-one-session-20261010';
fs.mkdirSync(outDir,{recursive:true});
const result={pass:false,scenario:'ONE READY SESSION -> HIDE -> SNAP -> PLAY CAMP -> ONE HISTORY RECORD',steps:{},gaps:[],errors:[]};

function today(){return new Date().toLocaleDateString('sv-SE')}
async function waitPort(page,port,label){
  for(let i=0;i<100&&new URL(page.url()).port!==String(port);i++)await page.waitForTimeout(100);
  assert.equal(new URL(page.url()).port,String(port),label);
}
async function shot(page,name){await page.screenshot({path:outDir+'/'+name+'.png',fullPage:true}).catch(()=>{})}

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});

  await context.addInitScript(()=>{
    if(location.port!=='4343') return;
    const child='mock-child-full';
    const profile={
      familyMemberId:child,displayName:'별이',presentationBand:'EARLY_EXPLORER',interests:[],
      boundary:{explorerId:'explorer-mock',islandId:'island-mock',basecampId:'basecamp-mock',activeCrewIds:['dubi']},
      intro:{stage:'MAIN_ISLAND_READY',selectedCrewIds:['dubi'],visualId:null,visualIdentity:null,packedItemIds:[],departureMode:'SAIL',islandName:'목업섬',basecampName:'목업캠프'},
      recentExperiences:[],creations:[]
    };
    localStorage.setItem('taky-play-camp-explorer-profile-v1:'+encodeURIComponent(child),JSON.stringify(profile));
    sessionStorage.setItem('play_camp_family_scope_session_v1','FAMILY_MOCK');
    window.__mockPlayEvidenceCount=0;
    window.TAKY_FAMILY_RUNTIME={
      apiBaseUrl:location.origin+'/',
      getToken:()=> 'mock-token-abcdefghijklmnop',
      getFamilyId:()=> 'FAMILY_MOCK',
      fetchImpl:async(input,init={})=>{
        const url=String(input);
        const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
        if(url.includes('/api/learning/evidence')){
          window.__mockPlayEvidenceCount=(window.__mockPlayEvidenceCount||0)+1;
          const packet=JSON.parse(String(init.body||'{}'));
          return json({ok:true,acknowledgement_kind:'OBSERVATION_INGEST_RECEIPT',packet_id:packet.packet_id,event_id:packet.event?.event_id,storage_confirmed:true});
        }
        if(url.includes('/api/learning/decision')) return json({ok:false,reason:'MOCK_DECISION_NOT_REQUIRED'},503);
        return fetch(input,init);
      }
    };
  });

  const page=await context.newPage();
  page.on('pageerror',e=>result.errors.push('PAGE:'+String(e)));
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))result.errors.push('HTTP_'+r.status()+':'+r.url())});

  const u=new URL(READY);
  u.searchParams.set('role','child');
  u.searchParams.set('hide_target',HIDE);
  u.searchParams.set('snap_target',SNAP);
  u.searchParams.set('play_camp_target',PLAY);
  await page.goto(u.href,{waitUntil:'domcontentloaded',timeout:12000});
  await page.evaluate(()=>{
    localStorage.clear();sessionStorage.clear();
    localStorage.setItem('readyset_active_role_v1','child');
    localStorage.setItem('readyset_identity_v1',JSON.stringify({
      schemaVersion:5,status:'READY',onboardingStep:'DONE',setupMode:'GUARDIAN_FOR_CHILD',
      operator:{role:'GUARDIAN'},userId:'mock-child-full',legalName:'목업 보호자',nickname:'별이',familyRole:'CHILD',
      schoolStage:'E5',birthDate:'2015-05-01',explorerId:'dubi',explorerName:'두비',
      journeyTheme:'TODAYS_ISLAND',characterSetupState:'DEFERRED_NO_COST',characterVisualId:null
    }));
    const t=new Date().toLocaleDateString('sv-SE');
    const tasks=[
      {id:'mock-hide-task',task_id:'mock-hide-task',subject:'영어',title:'영어',volume:'apple 단어 1개',deadline:t,status:'PLANNED',authority:'PLANNER/MAIN',source:'MOCK'},
      {id:'mock-snap-task',task_id:'mock-snap-task',subject:'영어',title:'영어',volume:'문장 표현 1개',deadline:t,status:'PLANNED',authority:'PLANNER/MAIN',source:'MOCK'},
      {id:'mock-play-task',task_id:'mock-play-task',subject:'영어',title:'영어',volume:'CVC 소리 1개',deadline:t,status:'PLANNED',authority:'PLANNER/MAIN',source:'MOCK'}
    ];
    localStorage.setItem('readyset_planner_v1',JSON.stringify({version:1,days:{[t]:{localDate:t,tasks}}}));
  });
  await page.goto(u.href,{waitUntil:'domcontentloaded',timeout:12000});
  await page.waitForFunction(()=>window.ReadyRoleContextV1?.current?.()==='child'&&window.ReadyHomeHomeworkMVPV1?.tasks?.().length===3,{timeout:12000});

  const start=await page.evaluate(()=>{
    const all=ReadyHomeHomeworkMVPV1.tasks();
    const session=ReadyHomeHomeworkMVPV1.createSession(all.find(x=>x.task_id==='mock-hide-task'));
    ReadyBaseRuntimeV1.nav('focus');
    return {
      homework:all.map(x=>({id:x.task_id,label:[x.title,x.volume].filter(Boolean).join(' · ')})),
      session_id:session.session_id,
      tasks:session.tasks.map(x=>({id:x.task_id,label:x.label,state:x.state,suggested_app:x.suggested_app}))
    };
  });
  assert.equal(start.tasks.length,3);
  assert.deepEqual(start.tasks.map(x=>x.suggested_app),['hide-seek','snap-pop','play-camp']);
  result.steps.session_start=start;
  await shot(page,'01-ready-three-tasks');

  // HIDE
  await page.evaluate(()=>ReadySetRev07.launchSpecialist('hide-seek'));
  await waitPort(page,4341,'HIDE_ROUTE_FAILED');
  await page.waitForFunction(()=>window.HideTermDecoderV1?.state==='BOUND'&&window.HideSeekBridge?.context?.()?.session_id,{timeout:15000});
  await page.waitForFunction(()=>document.documentElement.dataset.hideLearningTermLoader==='BOUND',{timeout:12000});
  await page.evaluate(()=>HideTermDecoderV1.registerCards([{
    id:'mock-apple',term:'apple',meaning:'사과',subject:'ENGLISH',
    components:[{text:'apple',meaning:'사과'}],
    conceptLinks:['과일','먹거리','식물'],
    concept:{summary:'사과는 나무에서 열리는 과일이다.',relations:['사과는 과일의 한 종류다.']},
    recall_contexts:['빨간 과일을 떠올려 봐']
  }],{replace:true,engineOwned:true,projection:{school_stage:'E5',subject:'ENGLISH',grade_context:{state:'RESOLVED',school_stage:'E5',base_band:'UPPER_ELEMENTARY',effective_band:'UPPER_ELEMENTARY',evidence_step:0}}}));
  await page.evaluate(()=>HideTermDecoderV1.open('TRACE'));
  await page.click('#termTraceReveal'); await page.click('[data-trace-result="SELF_KNOWN"]');
  await page.evaluate(()=>HideTermDecoderV1.open('LINK')); await page.click('[data-link-index][data-correct="1"]');
  await page.evaluate(()=>HideTermDecoderV1.open('CORE')); await page.click('[data-core-index][data-correct="1"]');
  await page.evaluate(()=>HideTermDecoderV1.open('RECALL')); await page.click('[data-recall-index][data-correct="1"]');
  const hideEvidence=await page.evaluate(()=>{const s=HideTermDecoderV1.snapshot();return{count:s.evidenceCount,modes:[...new Set((s.evidence||[]).map(x=>x.mode))],ctx:HideSeekBridge.context()}});
  assert.ok(['TRACE','LINK','CORE','RECALL'].every(x=>hideEvidence.modes.includes(x)));
  await page.evaluate((count)=>HideSeekBridge.returnToBase('COMPLETED',{mock:true,evidence_count:count}),hideEvidence.count);
  await waitPort(page,4340,'HIDE_RETURN_FAILED');
  await page.waitForFunction(()=>window.ReadySetRev07?.contract?.()?.active_app==='ready-set',{timeout:12000});
  let afterHide=await page.evaluate(()=>ReadySetRev07.contract());
  assert.equal(afterHide.tasks[0].state,'COMPLETED');
  assert.equal(afterHide.tasks[1].state,'PENDING');
  result.steps.hide={evidence:hideEvidence.count,task_state:afterHide.tasks[0].state};

  // NEXT SNAP
  await page.evaluate(()=>ReadyHomeHomeworkMVPV1.resumeSession('mock-snap-task'));
  await page.waitForFunction(()=>ReadySetRev07.contract()?.tasks?.find(x=>x.label.includes('문장 표현'))?.laps?.some(l=>!l.ended_at),{timeout:8000});
  await page.evaluate(()=>ReadySetRev07.launchSpecialist('snap-pop'));
  await waitPort(page,4342,'SNAP_ROUTE_FAILED');
  await page.waitForFunction(()=>window.SnapPopBridge?.context?.()?.session_id&&document.querySelectorAll('#landmarks .landmark').length>0,{timeout:15000});
  await page.click('#landmarks .landmark'); await page.click('#startBtn');
  const answers=['첫 특징을 적었어.','앞 생각과 이유를 연결했어.','마지막 문장으로 정리했어.'];
  for(const answer of answers){await page.fill('#answer',answer);await page.click('#nextBtn');await page.waitForTimeout(250)}
  await page.waitForFunction(()=>window.SnapPopBridge?.context?.()?.task_completed===true,{timeout:8000});
  const snapEvidence=await page.evaluate(async()=>({records:(await get('records')||[]).length,gems:Object.values(await get('gems')||{}).reduce((a,n)=>a+Number(n||0),0),ctx:SnapPopBridge.context()}));
  assert.ok(snapEvidence.records>=1&&snapEvidence.gems>=1);
  await page.click('#snapBaseCampChip');
  await waitPort(page,4340,'SNAP_RETURN_FAILED');
  await page.waitForFunction(()=>window.ReadySetRev07?.contract?.()?.active_app==='ready-set',{timeout:12000});
  let afterSnap=await page.evaluate(()=>ReadySetRev07.contract());
  assert.equal(afterSnap.tasks[0].state,'COMPLETED');assert.equal(afterSnap.tasks[1].state,'COMPLETED');assert.equal(afterSnap.tasks[2].state,'PENDING');
  result.steps.snap={records:snapEvidence.records,gems:snapEvidence.gems,task_state:afterSnap.tasks[1].state};

  // NEXT PLAY CAMP
  await page.evaluate(()=>ReadyHomeHomeworkMVPV1.resumeSession('mock-play-task'));
  await page.waitForFunction(()=>ReadySetRev07.contract()?.tasks?.find(x=>x.label.includes('CVC'))?.laps?.some(l=>!l.ended_at),{timeout:8000});
  await page.evaluate(()=>ReadySetRev07.launchSpecialist('play-camp'));
  await waitPort(page,4343,'PLAY_ROUTE_FAILED');
  await page.waitForFunction(()=>window.PlayCampReadyBridge?.linked?.()===true&&document.querySelectorAll('.camp-zone-button').length>0,{timeout:18000});
  await page.locator('.camp-zone-button').filter({hasText:'English'}).first().click();
  await page.waitForSelector('.english-sound-scene',{state:'visible',timeout:10000});
  const stones=page.locator('.phoneme-stone');assert.equal(await stones.count(),3);
  for(let i=0;i<3;i++)await stones.nth(i).click();
  await page.click('.english-blend');
  await page.waitForFunction(()=>window.PlayCampReadyBridge?.context?.()?.task_completed===true&&Number(window.__mockPlayEvidenceCount||0)>=1,{timeout:10000});
  const playEvidence=await page.evaluate(()=>({count:Number(window.__mockPlayEvidenceCount||0),ctx:PlayCampReadyBridge.context(),word:document.querySelector('.english-reveal strong')?.textContent||''}));
  assert.equal(playEvidence.ctx.completion_state,'BLEND_SEQUENCE_COMPLETED');
  await page.click('#playCampReadyReturn');
  await waitPort(page,4340,'PLAY_RETURN_FAILED');
  await page.waitForFunction(()=>window.ReadySetRev07?.contract?.()?.active_app==='ready-set',{timeout:12000});
  const allDone=await page.evaluate(()=>{
    const c=ReadySetRev07.contract();
    const planner=JSON.parse(localStorage.getItem('readyset_planner_v1')||'{}');
    const day=planner.days?.[new Date().toLocaleDateString('sv-SE')];
    return {contract:c,planner:(day?.tasks||[]).map(t=>({id:t.id,status:t.status,reports:t.learningReports||[]}))};
  });
  assert.deepEqual(allDone.contract.tasks.map(x=>x.state),['COMPLETED','COMPLETED','COMPLETED']);
  assert.deepEqual(allDone.planner.map(x=>x.status),['COMPLETED','COMPLETED','COMPLETED']);
  assert.ok(allDone.contract.tasks.every(x=>x.laps.length===1&&x.laps[0].ended_at&&x.laps[0].result_state==='COMPLETED'),'THREE_TASK_LAPS_NOT_CLOSED');
  result.steps.play_camp={evidence:playEvidence.count,word:playEvidence.word,task_state:allDone.contract.tasks[2].state};
  result.steps.all_tasks_completed={contract:allDone.contract.tasks.map(x=>({label:x.label,state:x.state,suggested_app:x.suggested_app,lap_result:x.laps[0]?.result_state})),planner:allDone.planner.map(x=>({id:x.id,status:x.status}))};

  // END ONE SESSION
  await page.evaluate(()=>ReadyHomeHomeworkMVPV1.endSession());
  await page.waitForFunction(()=>!!document.getElementById('rev07ConfirmEnd')&&!document.getElementById('rev07ConfirmEnd').disabled,{timeout:8000});
  await page.evaluate(()=>document.getElementById('rev07ConfirmEnd').click());
  await page.waitForTimeout(800);
  const final=await page.evaluate(()=>{
    const core=JSON.parse(localStorage.getItem('readyset_state')||'{}');
    ReadyBaseRuntimeV1.nav('history');
    return {
      records:core.records||[],
      historyText:document.getElementById('historyList')?.innerText||'',
      activeSession:core.activeSession||null
    };
  });
  assert.equal(final.records.length,1);
  assert.deepEqual(final.records[0].tasks.map(x=>x.state),['COMPLETED','COMPLETED','COMPLETED']);
  assert.equal(final.activeSession,null);
  assert.ok(final.historyText.includes('COMPLETED'));
  result.steps.final={recordCount:final.records.length,tasks:final.records[0].tasks,historyText:final.historyText};

  result.pass=true;
  fs.writeFileSync(outDir+'/mock-result.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
  await shot(page,'04-one-session-complete');
  await context.close();await browser.close();
})().catch(async e=>{
  result.errors.push(String(e?.stack||e));
  fs.writeFileSync(outDir+'/mock-result.json',JSON.stringify(result,null,2));
  console.error(e);
  process.exit(1);
});