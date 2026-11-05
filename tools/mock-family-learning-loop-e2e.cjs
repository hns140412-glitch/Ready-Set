const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('D:/Git PWA/Play Camp/node_modules/playwright-core');

const READY='http://127.0.0.1:4310/';
const HIDE='http://127.0.0.1:4311/';
const readyUrl=new URL(READY);
readyUrl.searchParams.set('role','parent');
readyUrl.searchParams.set('hide_target',HIDE);

const outDir='D:/Git PWA/READY-WEBAPP-20261006/artifacts/mock-family-loop-20261010';
fs.mkdirSync(outDir,{recursive:true});
const result={pass:false,scenario:'PARENT FACT -> PLANNER -> CHILD READY -> HIDE 4 MODES -> READY COMPLETED -> REPLAN',steps:{},gaps:[],errors:[]};

function today(){return new Date().toLocaleDateString('sv-SE')}
function plus(n){const d=new Date(today()+'T12:00:00');d.setDate(d.getDate()+n);return d.toLocaleDateString('sv-SE')}
async function shot(page,name){await page.screenshot({path:outDir+'/'+name+'.png',fullPage:true}).catch(()=>{})}

(async()=>{
 console.log('STAGE 00 START');
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});
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
     operator:{role:'GUARDIAN'},legalName:'목업 보호자',nickname:'별이',familyRole:'CHILD',
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
   set('#rsfEnglishWorkbook','Hide 목업 단어');
   set('#rsfEnglishRange','apple 1개');
   set('#rsfEnglishNext',deadline);
   set('#rsfEnglishInstruction','apple 뜻과 회상까지');
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
 assert.equal(focus.view,'focus');assert.equal(focus.plannerStatus,'IN_PROGRESS');assert.equal(focus.contract?.state,'ACTIVE');assert.equal(focus.contract?.suggested_app,'hide-seek');
 result.steps.ready_child_focus=focus; console.log('STAGE 06 READY_FOCUS');
 await shot(page,'02-child-ready-focus');

 console.log('STAGE 07 BEFORE_HIDE_ROUTE');
 // 5) actual UI route into Hide
 await page.evaluate(()=>ReadySetRev07.launchSpecialist('hide-seek'));
 for(let i=0;i<60&&new URL(page.url()).port!=='4311';i++)await page.waitForTimeout(100);
 assert.equal(new URL(page.url()).port,'4311','did not enter Hide');
 await page.waitForFunction(()=>window.HideTermDecoderV1?.state==='BOUND'&&!!window.HideSeekBridge?.context,{timeout:15000});
 await page.waitForFunction(()=>document.documentElement.dataset.hideLearningTermLoader==='BOUND',{timeout:12000});
 const hideContext=await page.evaluate(()=>HideSeekBridge.context());
 assert.equal(hideContext.session_id,focus.contract.session_id);
 assert.equal(hideContext.task_id,focus.contract.task_id);
 result.steps.hide_context={session_id:hideContext.session_id,task_id:hideContext.task_id,lap_id:hideContext.lap_id}; console.log('STAGE 08 HIDE_BOUND');

 // 6) mock one real term and execute all 4 actual UI modes
 const reg=await page.evaluate(()=>HideTermDecoderV1.registerCards([{
   id:'mock-apple',term:'apple',meaning:'사과',subject:'ENGLISH',
   components:[{text:'apple',meaning:'사과'}],
   conceptLinks:['과일','먹거리','식물'],
   concept:{summary:'사과는 나무에서 열리는 과일이다.',relations:['사과는 과일의 한 종류다.']},
   recall_contexts:['빨간 과일을 떠올려 봐']
 }],{replace:true,engineOwned:true,projection:{school_stage:'E5',subject:'ENGLISH',grade_context:{state:'RESOLVED',school_stage:'E5',base_band:'UPPER_ELEMENTARY',effective_band:'UPPER_ELEMENTARY',evidence_step:0}}}));
 assert.ok(reg.accepted>=1);

 // TRACE
 await page.evaluate(()=>HideTermDecoderV1.open('TRACE'));
 await page.waitForSelector('#termTraceReveal',{state:'attached',timeout:8000});
 await page.click('#termTraceReveal');
 await page.click('[data-trace-result="SELF_KNOWN"]');
 // LINK
 await page.evaluate(()=>HideTermDecoderV1.open('LINK'));
 await page.waitForSelector('[data-link-index][data-correct="1"]',{state:'attached',timeout:8000});
 await page.click('[data-link-index][data-correct="1"]');
 // CORE
 await page.evaluate(()=>HideTermDecoderV1.open('CORE'));
 await page.waitForSelector('[data-core-index][data-correct="1"]',{state:'attached',timeout:8000});
 await page.click('[data-core-index][data-correct="1"]');
 // RECALL
 await page.evaluate(()=>HideTermDecoderV1.open('RECALL'));
 await page.waitForSelector('[data-recall-index][data-correct="1"]',{state:'attached',timeout:8000});
 await page.click('[data-recall-index][data-correct="1"]');

 const hideEvidence=await page.evaluate(()=>{
   const s=HideTermDecoderV1.snapshot();
   return {count:s.evidenceCount,modes:[...new Set((s.evidence||[]).map(x=>x.mode))],last:(s.evidence||[]).slice(-4).map(x=>({mode:x.mode,result:x.result,term:x.term||x.term_id}))};
 });
 for(const m of ['TRACE','LINK','CORE','RECALL'])assert.ok(hideEvidence.modes.includes(m),'missing '+m);
 assert.ok(hideEvidence.count>=4);
 result.steps.hide_learning_evidence=hideEvidence; console.log('STAGE 09 HIDE_EVIDENCE');
 await shot(page,'03-hide-four-modes');

 console.log('STAGE 10 BEFORE_RETURN');
 // 7) actual Hide return -> Ready
 await page.evaluate((count)=>HideSeekBridge.returnToBase('COMPLETED',{mock:true,evidence_count:count,modes:['TRACE','LINK','CORE','RECALL']}),hideEvidence.count);
 for(let i=0;i<80&&new URL(page.url()).port!=='4310';i++)await page.waitForTimeout(100);
 assert.equal(new URL(page.url()).port,'4310','did not return Ready');
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
 assert.ok(after.recordCount>=1,'READY_RECORD_NOT_CREATED_AFTER_SESSION_END');
 assert.ok(after.historyText.includes('영어'),'READY_HISTORY_UI_MISSING_SPECIALIST_COMPLETION');
 result.steps.ready_after_hide={beforeEnd,afterEnd:after}; console.log('STAGE 11 READY_RETURNED_AND_RECORDED');
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