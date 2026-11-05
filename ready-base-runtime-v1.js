const READY_BASE_RUNTIME_VERSION='2026.09.14-base-runtime-v1.6';
const READY_CORE_KEY='readyset_state',READY_PLANNER_KEY='readyset_planner_v1',READY_TODAY=()=>new Date().toLocaleDateString('sv-SE');
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));
const readyInitial={schemaVersion:5,profile:{name:'',photo:'',style:'editorial',shareAvatar:false},guide:{type:'lumi',name:'루미',voice:'warm'},selected:[],tasks:[],targetMin:null,sound:'집중 피아노',records:[],activeSession:null};
function readyRead(k,f={}){try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch{return f}}function readyMigrate(x){const v={...structuredClone(readyInitial),...(x||{})};v.profile={...readyInitial.profile,...(x?.profile||{})};v.guide={...readyInitial.guide,...(x?.guide||{})};v.records=Array.isArray(v.records)?v.records:[];v.selected=Array.isArray(v.selected)?v.selected:[];v.tasks=Array.isArray(v.tasks)?v.tasks:[];if(v.targetMin===25&&!x?.baseTimerExplicit)v.targetMin=null;return v}var state=readyMigrate(readyRead(READY_CORE_KEY,null));function save(){localStorage.setItem(READY_CORE_KEY,JSON.stringify(state))}
function readyToast(m){const t=$('#toast');if(!t)return;t.textContent=m;t.hidden=false;clearTimeout(t._tm);t._tm=setTimeout(()=>t.hidden=true,2200)}function readyNav(n){$$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===n));window.scrollTo(0,0);if(n==='home')window.ReadyBaseNativeV2?.render?.();if(n==='mission')readyRenderMission();if(n==='focus')readyRenderFocus();if(n==='history')readyRenderHistory();if(n==='calendar')readyRenderCalendar();if(n==='result')readyRenderResult()}
function readyTodayTasks(){const p=readyRead(READY_PLANNER_KEY,{});return p.days?.[READY_TODAY()]?.tasks||[]}function readySelectedPlannerTask(){const a=readyTodayTasks(),s=a.find(t=>t.selected&&t.status!=='COMPLETED');if(s)return s;const id=state.g13PlannerTask?.id;if(!id)return null;const fallback=a.find(t=>String(t.id)===String(id)&&t.status!=='COMPLETED');return fallback||null}
function readyUserTaskTitle(t){return String(t?.title||t?.subject||'할 일').trim()}function readyUserTaskDetail(t){return String(t?.volume||t?.unitLabel||'').trim()}function readyUserTaskLabel(t){return [readyUserTaskTitle(t),readyUserTaskDetail(t)].filter(Boolean).join(' · ')}
function readySyncSelectedTask(){const p=readySelectedPlannerTask();if(!p){delete state.g13PlannerTask;state.tasks=[];state.selected=[];save();return null}state.g13PlannerTask={id:p.id,date:READY_TODAY(),status:p.status||'PLANNED',confirmationState:p.confirmationState||p.allocationState||null};state.tasks=[readyUserTaskLabel(p)];state.selected=[];save();return p}function readyTaskLabel(){const p=readySelectedPlannerTask();if(p)return readyUserTaskLabel(p);return state.activeSession?.taskLabel||state.tasks?.[0]||state.selected?.[0]||''}
function readyRenderMission(){const p=readySyncSelectedTask(),c=$('#todayPlannerCard');if(c)c.innerHTML=p?`<div class="baseTask"><span><b>${escapeHtml(readyUserTaskTitle(p))}</b><small>${escapeHtml(readyUserTaskDetail(p)||'분량/단위 확인 필요')}</small></span><em>${escapeHtml(p.status==='IN_PROGRESS'?'진행 중':p.status==='COMPLETED'?'완료':'아직 시작 전')}</em></div>`:`<div class="baseEmpty">오늘 선택된 Planner 할 일이 없어요.</div>`;const x=$('#missionPreviewText');if(x)x.textContent=p?readyUserTaskLabel(p):'Planner 할 일을 선택해 주세요.';$$('[data-minutes]').forEach(b=>b.classList.toggle('on',state.targetMin!=null&&String(state.targetMin)===b.dataset.minutes));const custom=$('#customMinutes');if(custom)custom.value=state.targetMin||''}
function readyFmt(ms){if(ms==null)return'--:--';const s=Math.max(0,Math.floor(ms/1000));return`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
// Ported from legacy app.js (removed in 0a71e23): crew guide portrait, user avatar, live analog clock.
// Focus/record/result screens use the Explorer Crew guide system (core6 + guide-07..24).
const READY_CREW_CORE6={dubi:'두비',lori:'로리',ink:'잉크',nova:'노바',take:'테이크',zero:'제로'},READY_CREW_DEFAULT='dubi';
function readyIsCrewId(id){return Object.prototype.hasOwnProperty.call(READY_CREW_CORE6,id)||/^guide-(0[7-9]|1\d|2[0-4])$/.test(id)}
function readyCrewGuide(id){const i=readyRead('readyset_identity_v1',{});let name='';if(id==null){id=String(state.guide?.id||i.explorerId||'');name=String(state.guide?.id===id&&state.guide?.name?state.guide.name:i.explorerId===id?i.explorerName||'':'')}id=String(id||'');const fallback=!readyIsCrewId(id);if(fallback){id=READY_CREW_DEFAULT;name=''}return{id,name:name||READY_CREW_CORE6[id]||'탐험대원',src:`./characters/ui_cutouts/${id}.png`,fallback}}
function readyApplyCrew(el,guide=readyCrewGuide()){if(!el)return;el.classList.remove('lumi','pico','mori');el.classList.add('crewPortrait');el.dataset.crew=guide.id;el.dataset.crewFallback=guide.fallback?'true':'false';el.style.backgroundImage=`url("${guide.src}")`;el.setAttribute('role','img');el.setAttribute('aria-label',guide.name)}
function readyApplyUserAvatar(el){if(!el)return;const i=readyRead('readyset_identity_v1',{}),ref=window.ReadyCharacterRuntimeAssetRef||(!i.characterVisualId&&!state.profile?.characterVisualId?state.profile?.photo:'')||'';if(ref){el.textContent='';el.style.backgroundImage=`url("${ref}")`;el.style.backgroundSize='cover';el.style.backgroundPosition='center'}else{el.style.backgroundImage='none';el.textContent=String(i.nickname||state.profile?.name||'R').trim().slice(0,1).toUpperCase()}}
function readyTickClock(d=new Date()){const set=(id,deg)=>{const el=document.getElementById(id);if(el)el.style.transform=`rotate(${deg}deg)`};set('secondHand',d.getSeconds()*6);set('minuteHand',d.getMinutes()*6+d.getSeconds()*.1);set('hourHand',(d.getHours()%12)*30+d.getMinutes()*.5)}
let readyTicker=null;function readyRenderFocus(){const s=state.activeSession;if(!s)return;const tm=readySessionTimes(),label=s.taskLabel||readyTaskLabel();if($('#focusMission'))$('#focusMission').textContent=label||'오늘의 할 일';if($('#remainingTime'))$('#remainingTime').textContent=tm.remaining==null?'자유 집중':readyFmt(tm.remaining);if($('#targetTime'))$('#targetTime').textContent=s.targetMs==null?'선택 안 함':readyFmt(s.targetMs);if($('#focusElapsed'))$('#focusElapsed').textContent=readyFmt(tm.focus);if($('#issueElapsed'))$('#issueElapsed').textContent=readyFmt(tm.paused);if($('#startClock'))$('#startClock').textContent=new Date(s.startAt).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false});if($('#pauseBtn'))$('#pauseBtn').textContent=s.pausedAt?'다시 시작':'잠깐 멈춤';readyApplyCrew($('#focusGuideMini'));readyTickClock();window.ReadySetRev07?.render?.()}
function readyStart(){if(state.activeSession){readyRecoverContinuity(true);return}const p=readySyncSelectedTask();if(!p){readyToast('먼저 오늘의 Planner 할 일을 선택해 주세요.');return}const now=Date.now(),label=readyUserTaskLabel(p);state.tasks=[label];state.selected=[];state.activeSession={id:`s_${now}`,startAt:now,targetMs:state.targetMin?state.targetMin*60000:null,pausedAt:null,pausedMs:0,selected:[],tasks:[label],taskLabel:label,sound:state.sound||'집중 피아노',plannerTaskId:p.id};save();window.ReadySetRev07?.ensure?.();readySetPlannerStatus(p.id,'IN_PROGRESS');readyNav('focus');clearInterval(readyTicker);readyTicker=setInterval(readyRenderFocus,1000);readyRenderFocus();window.ReadyFocusToolsV1?.render?.()}function readyPause(){const s=state.activeSession;if(!s)return;readySetInterruption('PAUSE',!s.pausedAt);readyRenderFocus()}

function readySetPlannerStatus(id,status,selected){const p=readyRead(READY_PLANNER_KEY,{}),d=p.days?.[READY_TODAY()];if(!d)return;d.tasks=(d.tasks||[]).map(t=>String(t.id)===String(id)?{...t,status,...(selected===undefined?{}:{selected})}:t);localStorage.setItem(READY_PLANNER_KEY,JSON.stringify(p));window.dispatchEvent(new Event('ready-planner-local-change'))}
function readyActivatePlannerTask(id){const p=readyRead(READY_PLANNER_KEY,{}),day=p.days?.[READY_TODAY()];if(!day)return false;const target=(day.tasks||[]).find(t=>String(t.id??t.task_id)===String(id));if(!target||target.status==='COMPLETED')return false;day.tasks=day.tasks.map(t=>({...t,selected:String(t.id??t.task_id)===String(id),status:String(t.id??t.task_id)===String(id)?'IN_PROGRESS':t.status}));localStorage.setItem(READY_PLANNER_KEY,JSON.stringify(p));window.dispatchEvent(new Event('ready-planner-local-change'));state.g13PlannerTask={id:String(id),date:READY_TODAY(),status:'IN_PROGRESS'};save();return true}
function readyPublishPlannerResult(plannerTaskId,result,{focusMs=0,pausedMs=0,source='READY_SESSION',sessionId=null}={}){if(!plannerTaskId)return null;const p=readyRead(READY_PLANNER_KEY,{});let found=null;for(const [localDate,day] of Object.entries(p.days||{})){const task=(day.tasks||[]).find(t=>String(t.id??t.task_id)===String(plannerTaskId));if(!task)continue;const status=result==='COMPLETED'?'COMPLETED':result==='PARTIAL'?'PARTIAL':result==='DEFERRED'?'DEFERRED':result==='WAITING_FOR_PARENT'?'WAITING_FOR_PARENT':result==='BLOCKED'?'BLOCKED':null;if(!status)return null;task.status=status;task.selected=false;task.learningReports=Array.isArray(task.learningReports)?task.learningReports:[];const eventId=`session_${sessionId||Date.now()}_${plannerTaskId}_${status}`;if(!task.learningReports.some(r=>r.eventId===eventId))task.learningReports.push({eventId,source,reportedAt:new Date().toISOString(),actualWorkDate:READY_TODAY(),resultState:status,learningVerification:'NOT_VERIFIED_BY_LEARNING_ENGINE',evidenceScope:'SESSION_ACTIVITY_ONLY',focusMs:Math.max(0,Number(focusMs)||0),pausedMs:Math.max(0,Number(pausedMs)||0),sessionId:sessionId||null});if(status==='COMPLETED')task.learningProgress={plannedQuantity:100,completedQuantity:100,remainingQuantity:0,unit:'SESSION_RESULT',evidenceScope:'ACTIVITY_QUANTITY_NOT_MASTERY'};found={task,localDate};break}localStorage.setItem(READY_PLANNER_KEY,JSON.stringify(p));window.dispatchEvent(new Event('ready-homework-refresh'));return found}
function readyComplete(){
 const s=state.activeSession;if(!s)return;
 const tasks=s.rev07?.tasks||[],plannerTaskId=s.plannerTaskId||state.g13PlannerTask?.id||null;
 if(tasks.some(t=>t.state==='PENDING'))return;
 const binding=s.homeworkTaskMap?.find(entry=>String(entry.planner_id)===String(plannerTaskId));
 const canonical=tasks.find(t=>t.task_id===binding?.canonical_task_id)||(tasks.length===1?tasks[0]:null);
 const plannerTask=Object.values(readyRead(READY_PLANNER_KEY,{}).days||{}).flatMap(day=>day.tasks||[]).find(t=>String(t.id??t.task_id)===String(plannerTaskId));
 const report=s.id?[...(plannerTask?.learningReports||[])].reverse().find(r=>r.sessionId===s.id&&r.resultState):null;
 const multi=tasks.length>1;const result=multi?(tasks.every(t=>t.state==='COMPLETED')?'COMPLETED':tasks.some(t=>t.state==='BLOCKED')?'BLOCKED':tasks.some(t=>t.state==='WAITING_FOR_PARENT')?'WAITING_FOR_PARENT':tasks.some(t=>t.state==='PARTIAL')?'PARTIAL':'DEFERRED'):(canonical?.state||report?.resultState||'COMPLETED');
 if(!['COMPLETED','PARTIAL','DEFERRED','BLOCKED','WAITING_FOR_PARENT'].includes(result))return;
 const tm=readySessionTimes(),endAt=Date.now(),label=s.taskLabel||readyTaskLabel();s.endAt=endAt;s.completed=result==='COMPLETED';
 const r={id:`r_${endAt}`,date:READY_TODAY(),completedAt:new Date(endAt).toISOString(),plannerTaskId,label:multi?`오늘 과제 ${tasks.length}개`:label,tasks:multi?tasks.map(t=>({task_id:t.task_id,label:t.label,status:t.state,suggested_app:t.suggested_app})):undefined,focusMs:tm.focus,pausedMs:tm.paused,issueMs:tm.issue,systemWaitMs:tm.systemWait,targetMs:s.targetMs??null,status:result};
 state.records=[r,...(state.records||[])].slice(0,500);
 // Wrap-up/specialist publication already carries the authoritative result and provenance.
 if(!multi&&r.plannerTaskId&&report?.resultState!==result)readyPublishPlannerResult(r.plannerTaskId,result,{focusMs:r.focusMs,pausedMs:r.pausedMs,source:'READY_SESSION',sessionId:s.id});
 delete state.g13PlannerTask;state.tasks=[];state.selected=[];state.activeSession=null;save();clearInterval(readyTicker);readyNav('result')
}
const READY_RESULT_STATES={COMPLETED:'완료',PARTIAL:'일부 남음',DEFERRED:'다음에',BLOCKED:'막힘',WAITING_FOR_PARENT:'부모 도움 필요'};
const READY_SOURCE_LABELS={'hide-seek':'Hide & Seek','snap-pop':'Snap & Pop','play-camp':'Play Camp','ready-set':'Ready & Set'};
function readyResultRows(record) {
 const tasks=Array.isArray(record?.tasks)?record.tasks.filter(x=>x&&typeof x==='object'):[];
 if(!tasks.length)return [{label:record?.label||'오늘의 탐험',status:record?.status||'DEFERRED',source:'Ready & Set'}];
 return tasks.map(task=>({
  label:String(task.label||'학습 활동'),
  status:String(task.status||'DEFERRED'),
  source:READY_SOURCE_LABELS[task.suggested_app]||'Ready & Set'
 }));
}
async function readyShareSessionResult(){
 const record=state.records?.[0];
 if(!record){readyToast('공유할 탐험 기록이 없습니다.');return;}
 try{
  const canvas=document.createElement('canvas');
  canvas.width=900;canvas.height=1180;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('CANVAS_NOT_AVAILABLE');
  const panel=ctx.createLinearGradient(0,0,0,1180);
  panel.addColorStop(0,'#f7b296');panel.addColorStop(1,'#ffe6d8');
  ctx.fillStyle=panel;ctx.fillRect(0,0,900,1180);
  ctx.fillStyle='#fffaf5';ctx.beginPath();ctx.roundRect(50,56,800,1068,35);ctx.fill();
  ctx.textBaseline='top';ctx.textAlign='left';
  ctx.fillStyle='#342820';ctx.font='900 46px system-ui';
  ctx.fillText('Ready & Set',92,105);
  ctx.font='800 34px system-ui';ctx.fillText('오늘의 탐험 기록',92,188);
  const rows=readyResultRows(record);
  const complete=rows.filter(x=>x.status==='COMPLETED').length;
  ctx.font='700 23px system-ui';ctx.fillStyle='#755d4c';
  ctx.fillText(`${rows.length}개 활동 중 ${complete}개 완료 · ${String(record.date||READY_TODAY())}`,92,251);
  const shown=rows.slice(0,5),itemHeight=Math.min(142,Math.floor(660/Math.max(1,shown.length)));
  for(let i=0;i<shown.length;i++){
   const task=shown[i],y=326+i*itemHeight;
   ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(91,y,718,itemHeight-12,19);ctx.fill();
   ctx.strokeStyle='#e9d9cc';ctx.lineWidth=1;ctx.stroke();
   ctx.fillStyle='#886b55';ctx.font='750 19px system-ui';ctx.fillText(task.source.slice(0,34),115,y+15);
   ctx.fillStyle='#342820';ctx.font='750 24px system-ui';
   const label=task.label.length>27?task.label.slice(0,26)+'…':task.label;
   ctx.fillText(label,115,y+52,575);
   ctx.fillStyle=task.status==='COMPLETED'?'#356746':'#846442';ctx.font='850 21px system-ui';
   ctx.fillText(READY_RESULT_STATES[task.status]||'기록됨',695,y+54,93);
  }
  if(rows.length>shown.length){ctx.fillStyle='#755d4c';ctx.font='700 20px system-ui';ctx.fillText(`외 ${rows.length-shown.length}개 활동`,105,1005)}
  ctx.fillStyle='#755d4c';ctx.font='700 21px system-ui';
  ctx.fillText(`집중 ${readyFmt(record.focusMs)} · ${READY_RESULT_STATES[record.status]||'기록됨'}`,100,1070);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob||blob.size<1000)throw new Error('PNG_EXPORT_FAILED');
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`Ready_Set_result_${String(record.date||READY_TODAY())}.png`;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  readyToast('탐험 결과 이미지를 저장했어요.');
 }catch(error){
  console.error('READY_SHARE_CARD_FAILED',error);
  readyToast('공유 카드 생성에 실패했습니다.');
 }
}
function readyRenderResult(){
 const r=state.records?.[0];if(!r)return;
 const rows=readyResultRows(r),statusLabel=READY_RESULT_STATES[r.status]||'기록됨';
 readyApplyUserAvatar($('#resultAvatar'));readyApplyCrew($('#resultGuidePortrait'));const guest=$('#resultGuestPortrait');if(guest)guest.hidden=true;
 const taskRoot=$('#resultTasks');
 if(taskRoot)taskRoot.innerHTML=rows.map((task,index)=>
  `<article class="ready-result-task" role="listitem" data-result-task="${index+1}" data-result-state="${escapeHtml(task.status)}"><div><span class="ready-result-task__source">${escapeHtml(task.source)}</span><b>${escapeHtml(task.label)}</b></div><em>${escapeHtml(READY_RESULT_STATES[task.status]||'기록됨')}</em></article>`
 ).join('');
 if(taskRoot)taskRoot.setAttribute('role','list');
 const completed=rows.filter(task=>task.status==='COMPLETED').length;
 const headline=$('#resultHeadline');
 if(headline)headline.textContent=rows.length>1?`오늘 ${rows.length}개 탐험 · ${completed}개 완료`:'오늘의 탐험 기록';
 const desc=$('#resultLine');
 if(desc)desc.textContent=rows.length>1?'앱별 학습 결과를 모았어요. 이 기기에 기록된 내용을 확인하세요.':'오늘 어떻게 해냈는지를 기록해요.';
 if($('#resultTarget'))$('#resultTarget').textContent=r.targetMs==null?'선택 안 함':readyFmt(r.targetMs);
 if($('#resultFocus'))$('#resultFocus').textContent=readyFmt(r.focusMs);
 if($('#resultDelta'))$('#resultDelta').textContent=statusLabel;
 if($('#deltaLabel'))$('#deltaLabel').textContent='상태';
}
function readyRenderHistory(){
 const root=$('#historyList');if(!root)return;
 const records=state.records||[];
 root.innerHTML=records.length?records.map(r=>{
  const rows=readyResultRows(r),complete=rows.filter(x=>x.status==='COMPLETED').length;
  const detail=rows.length>1
   ?`<ul class="ready-history-tasks">${rows.map(t=>`<li>${escapeHtml(t.source)} · ${escapeHtml(t.label)} <strong>${escapeHtml(READY_RESULT_STATES[t.status]||'기록됨')}</strong></li>`).join('')}</ul>`
   :'';
  return `<article class="baseTask ready-history-entry"><div><b>${escapeHtml(r.label||'탐험')}</b><small>${escapeHtml(r.date||'')} · 집중 ${readyFmt(r.focusMs)} ${rows.length>1?`· ${complete}/${rows.length}개 완료`:''}</small>${detail}</div><em>${escapeHtml(READY_RESULT_STATES[r.status]||'기록됨')}</em></article>`;
 }).join(''):'<div class="baseEmpty">아직 완료한 탐험 기록이 없어요.</div>';
}function readyRenderCalendar(){const root=$('#calendarList');if(!root)return;const a=state.records||[];root.innerHTML=a.length?a.map(r=>`<article class="baseTask"><span><b>${escapeHtml(r.date||'')}</b><small>${escapeHtml(r.label||'탐험')}</small></span><em>완료</em></article>`).join(''):'<div class="baseEmpty">아직 탐험 일지가 없어요.</div>'}
function readyBind(){document.addEventListener('click',e=>{const nav=e.target.closest('[data-nav]');if(nav){e.preventDefault();readyNav(nav.dataset.nav);return}const m=e.target.closest('[data-minutes]');if(m){e.preventDefault();if(m.dataset.minutes==='custom'){const w=$('#customTimeWrap');if(w)w.hidden=false;return}state.targetMin=Number(m.dataset.minutes);state.baseTimerExplicit=true;save();readyRenderMission();return}});document.addEventListener('change',e=>{if(e.target.closest?.('[data-rsf-select]'))setTimeout(readyRenderMission,0)});const custom=$('#customMinutes');if(custom)custom.addEventListener('change',e=>{const raw=Number(e.target.value),v=Number.isFinite(raw)&&raw>0?Math.max(1,Math.min(180,raw)):null;state.targetMin=v;state.baseTimerExplicit=!!v;save();readyRenderMission()});if($('#shareResultBtn'))$('#shareResultBtn').addEventListener('click',()=>void readyShareSessionResult());if($('#startBtn'))$('#startBtn').addEventListener('click',readyStart);if($('#pauseBtn'))$('#pauseBtn').addEventListener('click',readyPause);if($('#completeBtn'))$('#completeBtn').onclick=()=>window.ReadySetRev07?window.ReadySetRev07.openWrapUp():readyComplete();readyRenderMission();readyRenderHistory();readyRenderCalendar();readyRecoverContinuity(true,true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',readyBind,{once:true});else readyBind();
window.ReadyBaseRuntimeV1={version:READY_BASE_RUNTIME_VERSION,nav:readyNav,start:readyStart,complete:readyComplete,publishPlannerResult:readyPublishPlannerResult,activatePlannerTask:readyActivatePlannerTask,renderMission:readyRenderMission,renderFocus:readyRenderFocus,selectedPlannerTask:readySelectedPlannerTask,syncSelectedTask:readySyncSelectedTask,validate:()=>({version:READY_BASE_RUNTIME_VERSION,nativeRuntime:true,legacyAppJsRequired:false,plannerIdBinding:true,plannerSelectedIsAuthority:true,completionWritesPlanner:true,completionWritesLearningHistory:true,completedTaskNotActive:true,completedLabelFrozen:true,internalMetadataHidden:true,resultStatusSingle:true,historyPreserved:true,timeOptional:true})};
if(typeof globalThis.nav!=='function')globalThis.nav=readyNav;
if(typeof globalThis.renderMission!=='function')globalThis.renderMission=readyRenderMission;
if(typeof globalThis.renderFocus!=='function')globalThis.renderFocus=readyRenderFocus;
if(typeof globalThis.completeSession!=='function')globalThis.completeSession=readyComplete;
if(typeof globalThis.playBgm!=='function')globalThis.playBgm=()=>{};
document.documentElement.dataset.readyBaseRuntime=READY_BASE_RUNTIME_VERSION;
// Continuity metadata belongs to the existing activeSession, never a second store.
function readyContinuity(s=state.activeSession){
 if(!s)return null;
 if(!s.continuity)s.continuity={version:1,owner:'ready-set',provenance:'READY_RUNTIME',intervals:[],legacyExcludedMs:Number(s.pausedMs??s.issueMs??0),legacyIssueMs:Number(s.issueMs||0),legacySystemWaitMs:Number(s.systemWaitMs||0)};
 const c=s.continuity;
 if(s.pausedAt&&!c.intervals.some(i=>i.kind==='PAUSE'&&i.endAt==null))c.intervals.push({kind:'PAUSE',startAt:s.pausedAt,endAt:null,reason:s.pauseReason||''});
 return c;
}
function readySetInterruption(kind,active,reason=''){
 const s=state.activeSession;if(!s||!['PAUSE','ISSUE','SYSTEM_WAIT'].includes(kind))return false;
 const c=readyContinuity(s),open=c.intervals.find(i=>i.kind===kind&&i.endAt==null),now=Date.now();
 if(active===!!open)return false;
 if(active)c.intervals.push({kind,startAt:now,endAt:null,reason});else open.endAt=now;
 if(kind==='PAUSE'){s.pausedAt=active?now:null;s.pauseReason=reason}
 if(kind==='ISSUE')s.issueState=active?{reason,startAt:now}:null;
 if(kind==='SYSTEM_WAIT')s.systemWaitState=active?{reason,startAt:now}:null;
 const tm=readySessionTimes();s.pausedMs=tm.paused;s.issueMs=tm.issue;s.systemWaitMs=tm.systemWait;save();return true;
}
function readySessionTimes(at){
 const s=state.activeSession;if(!s)return{focus:0,paused:0,issue:0,systemWait:0,remaining:state.targetMin?state.targetMin*60000:null};
 const c=readyContinuity(s),now=at??s.endAt??Date.now(),start=Number(s.startAt),elapsed=Math.max(0,now-start);
 const duration=kinds=>{const ranges=c.intervals.filter(i=>kinds.includes(i.kind)).map(i=>[Math.max(start,i.startAt),Math.min(now,i.endAt??now)]).filter(r=>r[1]>r[0]).sort((a,b)=>a[0]-b[0]);let total=0,end=start;for(const [a,b] of ranges){total+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b)}return total};
 const paused=c.legacyExcludedMs+duration(['PAUSE','ISSUE']),issue=c.legacyIssueMs+duration(['ISSUE']),systemWait=c.legacySystemWaitMs+duration(['SYSTEM_WAIT']);
 const excluded=c.legacyExcludedMs+c.legacySystemWaitMs+duration(['PAUSE','ISSUE','SYSTEM_WAIT']),focus=Math.max(0,elapsed-excluded);
 return{focus,paused,issue,systemWait,remaining:s.targetMs==null?null:s.targetMs-focus};
}
function readyRecoverContinuity(openFocus=false,freshBoot=false){
 const s=state.activeSession;if(!s||s.completed||s.rev07?.session_state==='ENDED')return false;
 readyContinuity(s);
 // A new JS context cannot continue an old recording-save promise. End its wait,
 // without claiming the audio was saved or changing any child Issue/pause.
 if(freshBoot&&s.systemWaitState?.reason==='RECORDING_SAVE'){readySetInterruption('SYSTEM_WAIT',false);s.recordingSaveRecovery='INTERRUPTED_UNVERIFIED'}
 window.ReadySetRev07?.ensure?.();
 if(s.rev07)s.rev07.active_app='ready-set';
 save();if(readyTicker==null)readyTicker=setInterval(readyRenderFocus,1000);
 if(openFocus)readyNav('focus');else readyRenderFocus();return true;
}
window.addEventListener('pageshow',()=>readyRecoverContinuity(true));
window.addEventListener('focus',()=>readyRecoverContinuity());
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')readyRecoverContinuity();else if(state.activeSession)save()});
window.addEventListener('pagehide',()=>{if(state.activeSession)save()});
Object.assign(window.ReadyBaseRuntimeV1,{crewGuide:readyCrewGuide,applyCrew:readyApplyCrew,applyUserAvatar:readyApplyUserAvatar,tickClock:readyTickClock,crewCore6:Object.keys(READY_CREW_CORE6),times:readySessionTimes,recover:readyRecoverContinuity,setInterruption:readySetInterruption});
