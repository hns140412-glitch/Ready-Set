(() => {
'use strict';
const F=window.ReadyFoundationV1,KEY='ready_foundation_v1';
const today=()=>new Date().toLocaleDateString('sv-SE');
const datePlus=(base,n)=>{const d=new Date(`${base}T12:00:00`);d.setDate(d.getDate()+n);return d.toLocaleDateString('sv-SE')};
const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''));
const empty=()=>({mode:'STANDALONE',profiles:[],overrides:[],sourceStatus:{},assignments:[],units:[],batches:[],conditionEvidence:{},plans:[]});
const load=()=>{const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw):empty()};
const save=s=>{localStorage.setItem(KEY,JSON.stringify(s));window.dispatchEvent(new Event('ready-foundation-change'));return s};
const activeRole=()=>window.ReadyRoleContextV1?.current?.()||(document.documentElement.dataset.readyRole==='PARENT'?'parent':new URLSearchParams(location.search).get('role'));
const parent=()=>{if(activeRole()!=='parent')throw Error('PARENT_ROLE_REQUIRED')};
const cycleBoundarySources=new Set(['TALENT_BOOK_ASSIGNMENT','ENGLISH_ACADEMY_PACKAGE','SCIENCE_ACADEMY_HOMEWORK']);
const planningDeadline=f=>{const d=f.deadlineBoundary||f.deadline||null;if(!validDate(d))return null;return cycleBoundarySources.has(f.sourceType)?datePlus(d,-1):d};
const assignmentFacts=()=>{const p=JSON.parse(localStorage.getItem('readyset_planner_v1')||'{}');return Object.values(p.assignmentFacts||{}).filter(f=>f.confirmationState==='FACT_CONFIRMED'&&f.lifecycle!=='ARCHIVED').map(f=>({id:f.assignmentId,title:f.title||(f.talentSubject?`재능 · ${f.talentSubject}`:f.subject)||'숙제',subject:f.subject||f.talentSubject||'숙제',volume:f.range||'',deadline:planningDeadline(f),source:'LEGACY_CONFIRMED_FACT',sourceType:f.sourceType||null,boundary:f.deadlineBoundary||null}))};
const TALENT_LOAD={'연산':[1,1],'한자':[1,1],'국어':[2,2],'사회':[2,2],'수학':[3,3],'생각하는 피자':[3,3]};
const ENGLISH_LOAD={WORKBOOK_RANGE:[2,2],PRINT:[2,2],vocabulary:[1,1],listening:[1,1],recording:[2,2],writing:[3,3],other:[2,2]};
function legacyConfirmedFacts(){const p=JSON.parse(localStorage.getItem('readyset_planner_v1')||'{}');return Object.values(p.assignmentFacts||{}).filter(f=>f.confirmationState==='FACT_CONFIRMED'&&f.lifecycle!=='ARCHIVED')}
function makeUnit(id,assignmentId,label,loads=[2,2],kind='GENERAL'){return{id,assignment_id:assignmentId,label:String(label||'숙제 단위'),authority:'LEARNING/SUBJECT',cognitiveLoad:Number(loads[0]),activityLoad:Number(loads[1]),kind}}
function planningUnits(){
 const out=[];
 for(const f of legacyConfirmedFacts()){
  const deadline=planningDeadline(f);if(!deadline||deadline<today())continue;
  if(f.sourceType==='TALENT_BOOK_ASSIGNMENT'){
   if(String(f.range||'').trim())out.push(makeUnit(`foundation-unit:${f.assignmentId}:range`,f.assignmentId,f.range,TALENT_LOAD[f.talentSubject]||[2,2],'TALENT_BOOK_RANGE'));
   continue;
  }
  if(f.sourceType==='ENGLISH_ACADEMY_PACKAGE'){
   if(String(f.range||'').trim())out.push(makeUnit(`foundation-unit:${f.assignmentId}:workbook`,f.assignmentId,f.range,ENGLISH_LOAD.WORKBOOK_RANGE,'WORKBOOK_RANGE'));
   for(const [k,v] of Object.entries(f.printUnits||{}))if(String(v||'').trim())out.push(makeUnit(`foundation-unit:${f.assignmentId}:print:${k}`,f.assignmentId,`${k} 프린트 · ${v}`,ENGLISH_LOAD.PRINT,'PRINT'));
   for(const [k,v] of Object.entries(f.components||{}))if(String(v||'').trim())out.push(makeUnit(`foundation-unit:${f.assignmentId}:component:${k}`,f.assignmentId,`${k} · ${v}`,ENGLISH_LOAD[k]||ENGLISH_LOAD.other,k));
   continue;
  }
  const label=String(f.range||f.title||f.subject||'').trim();if(label)out.push(makeUnit(`foundation-unit:${f.assignmentId}:main`,f.assignmentId,label,[2,2],f.sourceType||'GENERAL'));
 }
 const s=load();
 for(const a of s.assignments||[]){
  if(!a?.id||!validDate(a.deadline)||a.deadline<today())continue;
  if(out.some(u=>u.assignment_id===a.id))continue;
  out.push(makeUnit(`foundation-unit:${a.id}:manual`,a.id,a.volume||a.title||'숙제',[2,2],'MANUAL_CONFIRMED'));
 }
 return out;
}
function planningDates(assignments){
 const ds=assignments.map(a=>a.deadline).filter(d=>validDate(d)&&d>=today()).sort();if(!ds.length)return[];
 const max=ds.at(-1),out=[];for(let d=today(),i=0;d<=max&&i<62;d=datePlus(d,1),i++)out.push(d);return out;
}
const service={load,assignmentFacts,
 importBaseline(authority){const s=load();if(s.baselineImported)return;s.baselineImported=true;if(!s.profiles.length){s.mode='HYBRID';s.profiles.push(F.profile({id:'legacy-confirmed-baseline',revision:1,state:'ACTIVE',effective_from:authority.capturedAt.slice(0,10),effective_to:null,provenance:{source:'NOTION_SNAPSHOT',capturedAt:authority.capturedAt},events:authority.rows.map((r,i)=>F.normalize('NOTION',{id:'baseline:'+i,key:r.activity+':'+r.weekday,title:r.activity,weekday:['일','월','화','수','목','금','토'].indexOf(r.weekday),start:r.start,end:r.end,parent_editable:true,planner_movable:false}))}))}save(s)},
 saveProfile(input){parent();const s=load(),p=F.profile(input);if(s.profiles.some(x=>x.id===p.id)){s.profiles=F.revise(s.profiles,p.id,p.effective_from,p)}else s.profiles.push(p);save(s);if(s.lastPlannerInput)service.prepare({...s.lastPlannerInput,from:today()});return s},
 saveOverride(o){parent();const s=save(F.override(load(),o));if(s.lastPlannerInput)service.prepare({...s.lastPlannerInput,from:today()});return s},
 support(evidence){parent();const s=load();s.conditionEvidence[today()]={requestedRest:evidence.requestedRest===true};save(s);if(s.lastPlannerInput)service.prepare({...s.lastPlannerInput,from:today()});return s},
 capture(action,payload){parent();const s=load();let b=s.batches.at(-1);if(!b||b.state==='COMMITTED'){b={id:'batch:'+Date.now(),state:'CAPTURING',items:[]};s.batches.push(b)}b=F.capture(b,action,payload);s.batches[s.batches.length-1]=b;if(b.state==='COMMITTED')s.assignments.push(...b.facts);save(s);if(b.state==='COMMITTED')setTimeout(()=>service.prepareConfirmedFacts(),0);return b},
 prepare(input){const s=load();if(input.from<today())throw Error('PAST_PLAN_WRITE_FORBIDDEN');const result=F.plan({...input,state:s,assignments:[...assignmentFacts(),...s.assignments],conditionEvidence:s.conditionEvidence});s.lastPlannerInput=JSON.parse(JSON.stringify(input));s.plans.push({createdAt:new Date().toISOString(),...result});save(s);
 // Publish only Planner projections. Existing facts, past dates and execution evidence stay intact.
 const p=JSON.parse(localStorage.getItem('readyset_planner_v1')||'{"days":{}}');p.days=p.days||{};
 const protectedIds=new Set();
 for(const [d,day] of Object.entries(p.days)){for(const t of day.tasks||[])if(d<input.from||t.status!=='PLANNED'||t.selected||t.learningReports?.length)protectedIds.add(t.id)}
 for(const [d,day] of Object.entries(p.days))if(d>=input.from)day.tasks=(day.tasks||[]).filter(t=>t.authority!=='PLANNER/MAIN'||t.projection!=='TODAY_TASK'||protectedIds.has(t.id));
 for(const t of result.candidates){if(protectedIds.has(t.id))continue;const day=p.days[t.localDate]||(p.days[t.localDate]={localDate:t.localDate,tasks:[]});day.tasks.push(t)}
 localStorage.setItem('readyset_planner_v1',JSON.stringify(p));window.ReadyHomeHomeworkUIV1?.render?.();window.ReadyStageD?.renderPlanner?.();window.ReadyStageF?.render?.();return result},
 todayTasks(){return load().plans.at(-1)?.candidates.filter(t=>t.localDate===today())||[]}
};
service.prepareConfirmedFacts=()=>{const assignments=[...assignmentFacts(),...(load().assignments||[])].filter(a=>validDate(a.deadline)&&a.deadline>=today()),units=planningUnits(),dates=planningDates(assignments);if(!assignments.length||!units.length||!dates.length)return{ok:false,reason:'NO_CONFIRMED_FACT_UNITS',candidates:[],unresolved:[]};const result=service.prepare({from:today(),dates,units,carryOver:[],actualHistory:[]});return{...result,ok:result.candidates.length>0,reason:result.candidates.length?null:(result.unresolved[0]?.reason||'NO_PLANNER_CANDIDATE'),assignmentCount:assignments.length,unitCount:units.length}};
function allocationSummary(plan,legacy){if(plan?.candidates?.length)return{ok:true,authority:'FOUNDATION_PLANNER',count:plan.candidates.length,unresolved:plan.unresolved||[]};return{ok:false,authority:'FOUNDATION_PLANNER',reason:plan?.reason||plan?.unresolved?.[0]?.reason||legacy?.reason||'NO_PLANNER_CANDIDATE',unresolved:plan?.unresolved||[]}}
function installAssignmentBridge(){
 const A=window.ReadyAssignmentModel;if(!A||A.__foundationPlannerBridge)return false;
 const original={upsertTalentPackage:A.upsertTalentPackage?.bind(A),upsertEnglishPackage:A.upsertEnglishPackage?.bind(A),confirmFact:A.confirmFact?.bind(A)};
 if(!original.upsertTalentPackage||!original.upsertEnglishPackage||!original.confirmFact)return false;
 const W=Object.freeze({...A,__foundationPlannerBridge:true,
  upsertTalentPackage(args={}){const r=original.upsertTalentPackage(args),plan=service.prepareConfirmedFacts();return{...r,legacyAllocation:r?.allocation||null,foundationPlan:plan,allocation:allocationSummary(plan,r?.allocation)}},
  upsertEnglishPackage(args={}){const r=original.upsertEnglishPackage(args),plan=service.prepareConfirmedFacts();return{...r,legacyAllocation:r?.allocation||null,foundationPlan:plan,allocation:allocationSummary(plan,r?.allocation)}},
  confirmFact(id,actor='PARENT'){const r=original.confirmFact(id,actor),plan=service.prepareConfirmedFacts();return r&&typeof r==='object'?{...r,foundationPlan:plan}:r}
 });
 window.ReadyAssignmentModel=W;return true;
}
function bridgeBoot(attempt=0){if(installAssignmentBridge())return;if(attempt<120)setTimeout(()=>bridgeBoot(attempt+1),25)}
window.ReadyFoundationControlV1=Object.freeze(service);bridgeBoot();
function dialog(title,html,submit){const d=document.createElement('dialog');d.innerHTML='<form><h2></h2>'+html+'<p role="alert"></p><button type="submit">저장</button> <button type="button" data-close>닫기</button></form>';d.querySelector('h2').textContent=title;document.body.append(d);d.querySelector('[data-close]').onclick=()=>d.close();d.onclose=()=>d.remove();d.querySelector('form').onsubmit=e=>{e.preventDefault();try{submit(new FormData(e.target));d.close()}catch(err){d.querySelector('[role="alert"]').textContent=err.message}};d.showModal();return d}
function schedule(){const d=dialog('일정 관리','<p>적용일부터 새 기준을 사용합니다. 과거 일정은 보존됩니다.</p><label>일정 이름 <input name="title" required></label><label>과목 <input name="subject"></label><label>적용 날짜 <input name="date" type="date" required></label><label>요일 (일=0, 토=6) <input name="weekday" type="number" min="0" max="6" required></label><label>시작 <input name="start" type="time" required></label><label>끝 <input name="end" type="time" required></label><label>종류 <select name="kind"><option value="FIXED">확정 일정</option><option value="STUDY_OPPORTUNITY">확인된 학습 가능 구간</option></select></label><label><input name="once" type="checkbox">하루만 변경</label>',v=>{const chosen=scheduleChoices.find(x=>x.value===v.get('existing'));const id=chosen?.event.id||v.get('title'),event={id,key:chosen?.event.key||id,title:v.get('title'),subject:v.get('subject'),weekday:Number(v.get('weekday')),start:v.get('start'),end:v.get('end'),kind:v.get('kind'),parent_editable:true,planner_movable:false,source:'LOCAL'};if(v.has('once'))service.saveOverride({id:id+v.get('date'),key:event.key,date:v.get('date'),event});else service.saveProfile({id:chosen?.profile.id||id,revision:1,state:'ACTIVE',effective_from:v.get('date'),effective_to:chosen?.profile.effective_to||null,provenance:{source:'PARENT_INPUT'},events:chosen?chosen.profile.events.map(e=>e.id===chosen.event.id?event:e):[event]})});
 const scheduleChoices=load().profiles.filter(p=>p.state==='ACTIVE'&&(!p.effective_to||p.effective_to>today())).flatMap(profile=>profile.events.map(event=>({value:profile.id+':'+profile.revision+':'+event.id,profile,event})));
 const label=document.createElement('label');label.textContent='변경할 기존 일정 ';const select=document.createElement('select');select.name='existing';const fresh=document.createElement('option');fresh.value='';fresh.textContent='새 일정';select.append(fresh);
 for(const choice of scheduleChoices){const option=document.createElement('option');option.value=choice.value;option.textContent=choice.event.title+' ('+choice.event.start+', r'+choice.profile.revision+')';select.append(option)}label.append(select);d.querySelector('form').prepend(label);
 select.onchange=()=>{const c=scheduleChoices.find(x=>x.value===select.value);if(!c)return;const fields=d.querySelector('form').elements;for(const key of ['title','subject','weekday','start','end','kind'])fields[key].value=c.event[key]??'';fields.date.value=today()};
}

function homework(){const d=dialog('숙제 입력·확인','<p>카메라: 빠른 촬영 → 로컬 임시 저장 → 즉시 다음 → 일괄 분석 → 필요한 사진만 재촬영 → 검토 후 확정. OCR 연결은 아직 준비 중입니다.</p><button type="button" data-camera>카메라 FACT 경로</button><p data-camera-status></p><h3>직접 입력 FACT 경로</h3><label>제목 <input name="title" required></label><label>과목 <input name="subject"></label><label>분량 <input name="volume"></label><label>마감 <input name="deadline" type="date"></label><label><input type="checkbox" name="reviewed" required>입력 사실을 검토하고 확정합니다</label>',v=>{const fact={id:'fact:'+Date.now(),title:v.get('title'),subject:v.get('subject'),volume:v.get('volume'),deadline:v.get('deadline')||null,source:'MANUAL'};service.capture('ADD',{id:fact.id,path:'MANUAL',fact});service.capture('ANALYZE');service.capture('RESULT',{retakeIds:[]});service.capture('COMMIT',{reviewed:v.has('reviewed'),facts:[fact]})});d.querySelector('[data-camera]').onclick=()=>{window.dispatchEvent(new CustomEvent('ready-capture-route',{detail:{path:'CAMERA',contract:'ReadyFoundationV1.capture',provider:'GAP',localTemporary:true}}));d.querySelector('[data-camera-status]').textContent='촬영 경로가 선택되었습니다. 실제 카메라/OCR 어댑터 연결은 GAP입니다.'}}
function mount(){if(activeRole()!=='parent')return;const host=document.querySelector('#missionView main');if(!host||document.getElementById('readyParentFoundation'))return;const section=document.createElement('section');section.id='readyParentFoundation';section.className='rsf-card';section.innerHTML='<h2>부모의 지원</h2><p>입력·확인·지원 — 학습 해석은 Learning, 날짜 배정은 Planner가 담당합니다.</p><button data-schedule>일정 관리</button> <button data-homework>숙제 입력·확인</button> <button data-support>학습 지원</button>';host.prepend(section);section.querySelector('[data-schedule]').onclick=schedule;section.querySelector('[data-homework]').onclick=homework;section.querySelector('[data-support]').onclick=()=>dialog('학습 지원','<p>자발적인 지원 요청만 기록합니다. 진단·감시·빠른 완료에 따른 숙제 증량은 하지 않습니다.</p><label><input name="rest" type="checkbox">오늘 휴식 지원 요청</label>',v=>service.support({requestedRest:v.has('rest')}))}
new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});mount();
})();
