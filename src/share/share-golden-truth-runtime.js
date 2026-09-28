(function(root){
'use strict';
// Share Golden: data/read-only projection. No share-owned schedule, theme or reward store.
const STATES=new Set(['COMPLETED','PARTIAL','DEFERRED','WAITING_FOR_PARENT','BLOCKED']);
function clean(v){return String(v??'').trim();}
function timeMs(v){return Number.isFinite(v)&&v>=0?v:null;}
function themeOf(profile={},legacyShare={}){
  const current=profile.theme;
  if(current==='drop'||current==='sail')return current;
  // Read-only migration for historical installations; the next Profile save owns it.
  return legacyShare.theme==='sail'?'sail':'drop';
}
function stableTasks(rows=[]){
  const seen=new Set();
  return (Array.isArray(rows)?rows:[]).map(r=>typeof r==='string'?clean(r):clean(r?.label))
    .filter(x=>x&&!seen.has(x)&&seen.add(x));
}
function avatarOf(profile={},projectionApi){
  if(profile.shareAvatar!==true)return Object.freeze({shared:false,asset:null,reason:'SHARE_OPT_IN_OFF'});
  const projection=profile.characterVisualIdProjection||profile.visualProjection||null;
  if(!projection)return Object.freeze({shared:false,asset:null,reason:'LOCKED_VISUAL_ID_NOT_BOUND'});
  const permitted=projectionApi?.assertConsumable?.(projection,{requireDerivatives:true});
  if(!permitted?.ok)return Object.freeze({shared:false,asset:null,reason:permitted?.reason||'VISUAL_ID_NOT_APPROVED'});
  if(projection.member_scope&&profile.member_scope&&projection.member_scope!==profile.member_scope)
    return Object.freeze({shared:false,asset:null,reason:'MEMBER_SCOPE_MISMATCH'});
  return Object.freeze({shared:true,visual_id:projection.visual_id,asset:projection.assets.avatar_square,reason:null});
}
function copyFor({kind,theme,status,taskCount,doneCount,deltaMs,recordingDone,guideName}){
  const name=clean(guideName)||'탐험대';
  if(kind==='pre'){
    const title=theme==='sail'?'오늘의 할 일을 찾아 항해해볼까?':'오늘의 할 일을 발견하러 가볼까?';
    return {title,sub:'오늘의 섬으로 출발할 준비',reaction:name+'와 함께 오늘의 탐험을 시작해요.'};
  }
  let title='',reaction='';
  if(doneCount===taskCount&&taskCount>0){
    title=theme==='sail'?'멋진 항해였어요!':'오늘의 할 일이 도착했어요!';
    reaction=deltaMs!==null&&deltaMs<=-120000?'정해둔 시간보다 먼저 마쳤네. 다음 탐험도 함께하자!':
      recordingDone?'녹음도 남겼네. 함께 한 걸음을 기록했어.':'끝까지 해낸 오늘의 탐험을 기록했어.';
  }else if(status==='WAITING_FOR_PARENT'){title='도움이 필요한 곳을 찾았어요';reaction='부모님과 확인할 지점을 잘 남겼어.';}
  else if(status==='BLOCKED'){title='막힌 곳도 탐험의 단서야';reaction='어디서 멈췄는지 함께 확인해 보자.';}
  else if(status==='DEFERRED'){title='다음 탐험으로 이어가요';reaction='이어갈 일이 남아 있어. 다음에 다시 만나자.';}
  else{title='오늘의 탐험을 기록했어요';reaction='끝낸 부분과 남은 부분을 그대로 기록했어.';}
  return {title,sub:'오늘의 섬 · 탐험 기록',reaction:name+' · '+reaction};
}
function project(input={}){
  const kind=input.kind==='pre'?'pre':'result';
  const profile=input.profile||{},theme=themeOf(profile,input.legacyShare||{});
  const avatar=avatarOf(profile,input.projectionApi);
  const guide=input.guide||{};
  const now=input.now instanceof Date?input.now:new Date();
  if(kind==='pre'){
    const labels=stableTasks(input.currentTasks||[]);
    if(!labels.length)return {ok:false,reason:'PRE_SHARE_TASK_CONTEXT_MISSING'};
    const targetMs=timeMs(input.targetMs);
    if(targetMs===null)return {ok:false,reason:'PRE_SHARE_TARGET_MISSING'};
    return {ok:true,kind,theme,avatar,guide:{name:clean(guide.name)||null,type:clean(guide.type)||null},
      tasks:labels.map(label=>({label})),doneCount:null,total:labels.length,
      targetMs,focusMs:null,stars:null,recordingDone:false,guestType:null,
      date:now.toISOString().slice(0,10),
      copy:copyFor({kind,theme,taskCount:labels.length,guideName:guide.name})};
  }
  const r=input.record||null;
  if(!r)return {ok:false,reason:'RESULT_RECORD_MISSING'};
  const rows=Array.isArray(r.taskOutcomes)?r.taskOutcomes:[];
  if(!rows.length||rows.some(x=>!x||!STATES.has(x.state)||!clean(x.label)))
    return {ok:false,reason:'VERIFIED_PER_TASK_OUTCOMES_MISSING'};
  const ids=new Set();
  if(rows.some(x=>{const id=clean(x.task_id);if(!id||ids.has(id))return true;ids.add(id);return false;}))
    return {ok:false,reason:'SHARE_TASK_IDENTITY_CONFLICT'};
  const tasks=rows.map(x=>({task_id:x.task_id,label:clean(x.label),state:x.state}));
  const doneCount=tasks.filter(x=>x.state==='COMPLETED').length,total=tasks.length;
  const focusMs=timeMs(r.focusMs),targetMs=timeMs(r.targetMs);
  if(focusMs===null||targetMs===null)return {ok:false,reason:'RESULT_TIME_EVIDENCE_MISSING'};
  const states=[...new Set(tasks.map(x=>x.state))];
  const status=states.length===1?states[0]:'MIXED';
  if(r.outcomeState&&r.outcomeState!==status)return {ok:false,reason:'RESULT_STATE_CONFLICT'};
  // Stars must come from an actual reviewed award receipt; never derive from task count.
  const receipt=r.awardReceipt||null;
  const stars=receipt?.verified===true&&Number.isSafeInteger(receipt.awarded_stars)&&receipt.awarded_stars>=0?
    receipt.awarded_stars:null;
  const deltaMs=timeMs(r.deltaMs)===null?(Number.isFinite(r.deltaMs)?r.deltaMs:focusMs-targetMs):r.deltaMs;
  return {ok:true,kind,theme,avatar,guide:{name:clean(guide.name)||null,type:clean(guide.type)||null},
    tasks,doneCount,total,status,focusMs,targetMs,deltaMs,stars,
    recordingDone:!!(r.recordingDone&&r.recordingRef?.audio_id),
    guestType:r.recordingDone&&r.recordingRef?.audio_id?clean(r.guestType)||null:null,
    date:Number.isFinite(r.endAt)?new Date(r.endAt).toISOString().slice(0,10):null,
    copy:copyFor({kind,theme,status,taskCount:total,doneCount,deltaMs,
      recordingDone:!!(r.recordingDone&&r.recordingRef?.audio_id),guideName:guide.name})};
}
const api=Object.freeze({version:'READY_SHARE_GOLDEN_TRUTH_V01',themeOf,project,copyFor});
root.ReadyShareGoldenTruth=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
