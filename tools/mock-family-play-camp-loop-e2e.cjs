const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');

const READY='http://127.0.0.1:4330/';
const PLAY='http://127.0.0.1:4331/';
const readyUrl=new URL(READY);
readyUrl.searchParams.set('role','parent');
readyUrl.searchParams.set('play_camp_target',PLAY);

const outDir='D:/Git PWA/READY-WEBAPP-20261006/artifacts/mock-family-play-camp-loop-20261010';
fs.mkdirSync(outDir,{recursive:true});
const result={pass:false,scenario:'PARENT FACT -> PLANNER -> CHILD READY -> PLAY CAMP CVC -> READY COMPLETED -> REPLAN',steps:{},gaps:[],errors:[]};

function today(){return new Date().toLocaleDateString('sv-SE')}
function plus(n){const d=new Date(today()+'T12:00:00');d.setDate(d.getDate()+n);return d.toLocaleDateString('sv-SE')}
async function shot(page,name){await page.screenshot({path:outDir+'/'+name+'.png',fullPage:true}).catch(()=>{})}

(async()=>{
 console.log('STAGE 00 START');
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});
 await context.addInitScript(()=>{
   if(location.port!=='4331')return;
   const child='mock-child-play';
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
       if(url.includes('/api/learning/decision'))return json({ok:false,reason:'MOCK_DECISION_NOT_REQUIRED'},503);
       return fetch(input,init);
     }
   };
 });
 const page=await context.newPage();
 page.on('pageerror',e=>result.errors.push('PAGE:'+String(e)));
 page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))result.errors.push('HTTP_'+r.status()+':'+r.url())});

 console.log('STAGE 01 BROWSER_READY');
 // 1) parent identity + actual Ready boot
 await page.goto(readyUrl.href,{waitUntil:'domcontentloaded',timeout:12000});
 await page.evaluate(()=>{
   localStorage.clear();sessionStorage.clear();
   localStorage.setItem('readyset_active_role_v1','parent');
   localStorage.setItem('readyset_identity_v1',JSON.stringify({
     schemaVersion:5,status:'READY',onboardingStep:'DONE',setupMode:'GUARDIAN_FOR_CHILD',
     operator:{role:'GUARDIAN'},userId:'mock-child-play',legalName:'목업 보호자',nickname:'별이',familyRole:'CHILD',
     schoolStage:'E5',birthDate:'2015-05-01',explorerId:'dubi',explorerName:'두비',
     journeyTheme:'TODAYS_ISLAND',characterSetupState:'DEFERRED_NO_COST',characterVisualId:null
   }));
 });
 await page.goto(readyUrl.href,{waitUntil:'domcontentloaded',timeout:12000});
 await page.waitForFunction(()=>window.ReadyRoleContextV1?.current?.()==='parent'&&!!document.getElementById('readyParentSetupHub'),{timeout:12000});
 result.steps.parent_boot=true; console.log('STAGE 02 PARENT_BOOT');

 // 2) study opportunity via parent UI
 await page.click('#readyParentSetupHub [data-rps-schedule]');
 await page.waitForTimeout(400);
 await page.click('#rpsScheduleActions [data-edit-schedule]');
 await page.waitForTimeout(250);
 await page.evaluate(()=>{
   const d=document.getElementById('rpsScheduleDialog'),e=d.querySelector('form').elements,t=new Date().toLocaleDateString('sv-SE');
   e.title.value='목업 영어 학습시간';e.subject.value='영어';e.date.value=t;e.weekday.value=String(new Date(t+'T12:00:00').getDay());
   e.start.value='13:00';e.end.value='14:00';e.kind.value='STUDY_OPPORTUNITY';
 });
 await page.click('#rpsScheduleDialog .save');
 await page.waitForTimeout(600);

 // 3) parent English homework FACT via actual UI
 await page.evaluate(()=>{const h=document.querySelector('#scheduleView [data-nav="home"]');if(h)h.click();else ReadyBaseRuntimeV1.nav('home')});
 await page.waitForTimeout(350);
 await page.click('#readyParentSetupHub [data-rps-homework]');
 await page.waitForTimeout(700);
 await page.evaluate((deadline)=>{
   const set=(sel,v)=>{const el=document.querySelector(sel);el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))};
   set('#rsfEnglishWorkbook','Play Camp 영어 소리');
   set('#rsfEnglishRange','CVC 소리 1개');
   set('#rsfEnglishNext',deadline);
   set('#rsfEnglishInstruction','세 소리를 듣고 단어로 이어 보기');
 },plus(2));
 await page.click('#rsfEnglishFactSave');
 await page.waitForTimeout(1000);
 const planned=await page.evaluate(()=>{
   const t=new Date().toLocaleDateString('sv-SE');
   const fact=(ReadyAssignmentModel.assignmentView()||[]).find(x=>x.sourceType==='ENGLISH_ACADEMY_PACKAGE');
   const p=JSON.parse(localStorage.getItem('readyset_planner_v1')||'{"days":{}}');
   const task=(p.days?.[t]?.tasks||[]).find(x=>x.sourceAssignmentId===fact?.assignmentId&&x.authority==='PLANNER/MAIN');
   return {fact:fact&&{id:fact.assignmentId,state:fact.confirmationState},task:task&&{id:task.id,title:task.title,status:task.status,sourceUnitId:task.sourceUnitId}};
 });
 assert.equal(planned.fact?.state,'FACT_CONFIRMED');
 assert.ok(planned.task?.id&&planned.task?.sourceUnitId);
 result.steps.parent_fact_planner=planned; console.log('STAGE 03 PLANNER_CREATED');
 await shot(page,'01-parent-planned');

 console.log('STAGE 04 BEFORE_CHILD');
 // 4) child starts actual Ready task
 await page.evaluate(()=>{const h=document.querySelector('#missionView [data-nav="home"]');if(h)h.click();else ReadyBaseRuntimeV1.nav('home')});
 await page.waitForTimeout(400);
 await page.evaluate(()=>ReadyRoleContextV1.switchRole('child'));
 await page.waitForTimeout(2200);
 await page.waitForFunction(()=>ReadyRoleContextV1.current()==='child'&&window.ReadyHomeHomeworkMVPV1?.tasks?.().length>0,{timeout:10000});
 const started=await page.evaluate(()=>{
   const task=ReadyHomeHomeworkMVPV1.tasks()[0];
   const session=ReadyHomeHomeworkMVPV1.createSession(task);
   ReadyBaseRuntimeV1.nav('focus');
   return {planner_id:task.planner_id,homework_task_id:task.task_id,session_id:session.session_id,active_task_id:session.active_task_id};
 });
 result.steps.ready_session_started=started; console.log('STAGE 05 SESSION_STARTED');
 await page.waitForTimeout(900);
 const focus=await page.evaluate(()=>{
   const p=JSON.parse(localStorage.getItem('readyset_planner_v1')||'{"days":{}}');
   const task=Object.values(p.days||{}).flatMap(d=>d.tasks||[]).find(x=>x.sourceAssignmentId);
   const c=ReadySetRev07.contract();
   const activeTask=c?.tasks?.find(x=>x.task_id===c.active_task_id);
   return {view:document.querySelector('.view.active')?.dataset.view,plannerStatus:task?.status,contract:c&&{session_id:c.session_id,goal_id:c.goal_id,task_id:c.active_task_id,lap_id:c.active_lap_id,state:c.session_state,suggested_app:activeTask?.suggested_app}};
 });
 assert.equal(focus.view,'focus');assert.equal(focus.plannerStatus,'IN_PROGRESS');assert.equal(focus.contract?.state,'ACTIVE');assert.equal(focus.contract?.suggested_app,'play-camp');
 result.steps.ready_child_focus=focus; console.log('STAGE 06 READY_FOCUS');
 await shot(page,'02-child-ready-focus');

 console.log('STAGE 07 BEFORE_PLAY_ROUTE');
 // 5) canonical Ready route into Play Camp
 await page.evaluate(()=>ReadySetRev07.launchSpecialist('play-camp'));
 for(let i=0;i<100&&new URL(page.url()).port!=='4331';i++)await page.waitForTimeout(100);
 assert.equal(new URL(page.url()).port,'4331','did not enter Play Camp');
 await page.waitForFunction(()=>window.PlayCampReadyBridge?.linked?.()===true&&document.querySelectorAll('.camp-zone-button').length>0,{timeout:18000});
 const playContext=await page.evaluate(()=>PlayCampReadyBridge.context());
 assert.equal(playContext.session_id,focus.contract.session_id);
 assert.equal(playContext.task_id,focus.contract.task_id);
 assert.equal(playContext.lap_id,focus.contract.lap_id);
 assert.equal(playContext.child_id,'mock-child-play');
 result.steps.play_camp_context={session_id:playContext.session_id,task_id:playContext.task_id,lap_id:playContext.lap_id,child_id:playContext.child_id}; console.log('STAGE 08 PLAY_BOUND');

 // 6) actual Play Camp user flow: English zone -> three phonemes -> blend
 const englishZone=page.locator('.camp-zone-button').filter({hasText:'English'}).first();
 await englishZone.click();
 await page.waitForSelector('.english-sound-scene',{state:'visible',timeout:10000});
 const stones=page.locator('.phoneme-stone');
 assert.equal(await stones.count(),3);
 for(let i=0;i<3;i++)await stones.nth(i).click();
 await page.click('.english-blend');
 await page.waitForFunction(()=>document.querySelector('.english-reveal')?.classList.contains('is-visible'),{timeout:8000});
 await page.waitForFunction(()=>window.PlayCampReadyBridge?.context?.()?.task_completed===true,{timeout:8000});
 await page.waitForFunction(()=>Number(window.__mockPlayEvidenceCount||0)>=1,{timeout:8000});
 const playEvidence=await page.evaluate(()=>({
   evidenceCalls:Number(window.__mockPlayEvidenceCount||0),
   bridge:PlayCampReadyBridge.context(),
   returnLabel:document.getElementById('playCampReadyReturn')?.textContent||'',
   returnState:document.getElementById('playCampReadyReturn')?.dataset.taskState||'',
   word:document.querySelector('.english-reveal strong')?.textContent||''
 }));
 assert.ok(playEvidence.evidenceCalls>=1,'PLAY_CAMP_EVIDENCE_ACK_MISSING');
 assert.equal(playEvidence.bridge.task_completed,true);
 assert.equal(playEvidence.bridge.completion_state,'BLEND_SEQUENCE_COMPLETED');
 assert.equal(playEvidence.returnState,'COMPLETED');
 result.steps.play_camp_learning_evidence=playEvidence; console.log('STAGE 09 PLAY_COMPLETED');
 await shot(page,'03-play-camp-completed');

 console.log('STAGE 10 BEFORE_RETURN');
 await page.click('#playCampReadyReturn');
 for(let i=0;i<100&&new URL(page.url()).port!=='4330';i++)await page.waitForTimeout(100);
 assert.equal(new URL(page.url()).port,'4330','did not return Ready');
 await page.waitForFunction(()=>window.ReadySetRev07?.contract?.(),{timeout:12000});
 await page.waitForTimeout(800);

 const beforeEnd=await page.evaluate(()=>{
   const p=JSON.parse(localStorage.getItem('readyset_planner_v1')||'{"days":{}}');
   const tasks=Object.values(p.days||{}).flatMap(d=>d.tasks||[]);
   const task=tasks.find(x=>x.sourceAssignmentId);
   const hist=ReadyFoundationControlV1.actualHistory(ReadyFoundationControlV1.load().lastPlannerInput?.units||[]);
   const contract=ReadySetRev07.contract();
   return {
     planner:{id:task?.id,status:task?.status,reports:task?.learningReports||[]},
     actualHistory:hist.map(x=>({status:x.status,sourceAssignmentId:x.sourceAssignmentId,sourceUnitId:x.sourceUnitId})),
     contract:{active_app:contract?.active_app,task:contract?.tasks?.find(t=>t.task_id===contract.active_task_id),pending:contract?.tasks?.filter(t=>t.state==='PENDING').length}
   };
 });
 assert.equal(beforeEnd.planner.status,'COMPLETED');
 assert.ok(beforeEnd.planner.reports.some(r=>r.source==='play-camp'),'PLAY_CAMP_PLANNER_REPORT_MISSING');
 assert.ok(beforeEnd.actualHistory.some(x=>x.status==='COMPLETED'));
 assert.equal(beforeEnd.contract.active_app,'ready-set');
 assert.equal(beforeEnd.contract.task?.state,'COMPLETED');
 assert.equal(beforeEnd.contract.pending,0);

 await page.evaluate(()=>ReadyHomeHomeworkMVPV1.endSession());
 await page.waitForFunction(()=>!!document.getElementById('rev07ConfirmEnd')&&!document.getElementById('rev07ConfirmEnd').disabled,{timeout:8000});
 await page.evaluate(()=>document.getElementById('rev07ConfirmEnd').click());
 await page.waitForTimeout(700);
 const after=await page.evaluate(()=>{
   const p=JSON.parse(localStorage.getItem('readyset_planner_v1')||'{"days":{}}');
   const task=Object.values(p.days||{}).flatMap(d=>d.tasks||[]).find(x=>x.sourceAssignmentId);
   const core=JSON.parse(localStorage.getItem('readyset_state')||'{}');
   ReadyBaseRuntimeV1.nav('history');
   return {
     planner:{id:task?.id,status:task?.status,reports:task?.learningReports||[]},
     recordCount:(core.records||[]).length,
     latestRecord:(core.records||[])[0]||null,
     historyText:document.getElementById('historyList')?.innerText||''
   };
 });
 assert.equal(after.planner.status,'COMPLETED');
 assert.ok(after.recordCount>=1,'READY_RECORD_NOT_CREATED_AFTER_PLAY_CAMP');
 assert.ok(after.historyText.includes('영어'),'READY_HISTORY_UI_MISSING_PLAY_CAMP_COMPLETION');
 result.steps.ready_after_play_camp={beforeEnd,afterEnd:after}; console.log('STAGE 11 READY_RETURNED_AND_RECORDED');
 await shot(page,'04-ready-return-history');

 // 8) parent re-enters for schedule change; completed actual history must survive replan
 await page.evaluate(()=>ReadyRoleContextV1.switchRole('parent'));
 await page.waitForTimeout(1800);
 await page.waitForFunction(()=>ReadyRoleContextV1.current()==='parent'&&!!window.ReadyFoundationControlV1,{timeout:10000});
 const replan=await page.evaluate(()=>{
   const t=new Date().toLocaleDateString('sv-SE');
   ReadyFoundationControlV1.saveOverride({id:'mock-block',key:'mock-block',date:t,event:{id:'mock-block',key:'mock-block',title:'목업 완료 후 일정 변경',date:t,start:'12:30',end:'14:30',kind:'FIXED',parent_editable:true,planner_movable:false,source:'LOCAL'}});
   const p=JSON.parse(localStorage.getItem('readyset_planner_v1')||'{"days":{}}');
   const fact=(ReadyAssignmentModel.assignmentView()||[]).find(x=>x.sourceType==='ENGLISH_ACADEMY_PACKAGE');
   const same=Object.values(p.days||{}).flatMap(d=>d.tasks||[]).filter(x=>x.sourceAssignmentId===fact?.assignmentId);
   const hist=ReadyFoundationControlV1.actualHistory(ReadyFoundationControlV1.load().lastPlannerInput?.units||[]);
   return {completed:same.filter(x=>x.status==='COMPLETED').length,replanned:same.filter(x=>x.status==='PLANNED'&&x.authority==='PLANNER/MAIN').length,actualCompleted:hist.filter(x=>x.status==='COMPLETED').length,sourceTasks:same.map(x=>({id:x.id,status:x.status,reports:(x.learningReports||[]).length}))};
 });
 assert.equal(replan.completed,1);assert.equal(replan.replanned,0);assert.equal(replan.actualCompleted,1);
 result.steps.replan_preserves_actual=replan; console.log('STAGE 12 REPLAN_DONE');

 result.pass=true;
 fs.writeFileSync(outDir+'/mock-result.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
 await context.close();await browser.close();
})().catch(async e=>{
 result.errors.push(String(e?.stack||e));fs.writeFileSync(outDir+'/mock-result.json',JSON.stringify(result,null,2));console.error(e);process.exit(1);
});