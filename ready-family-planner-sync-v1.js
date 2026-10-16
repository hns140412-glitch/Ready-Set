/* Ready data persistence adapter; Planner and Learning Core retain their existing semantic authority. */
(() => {
'use strict';
if (window.ReadyFamilyPlannerSyncV1) return;
const VERSION='2026.10.13-durable-planner-sync-v1';
const TYPE='PLANNER_SNAPSHOT', ID='ready-planner-current-v1';
const MARK='ready_planner_sync_scope_v1', ARCHIVE='ready_planner_local_preservation_v1';
const scopedCacheKey=scope=>'ready_planner_member_cache_v1_'+encodeURIComponent(scope);
const PKEY='readyset_planner_v1', FKEY='ready_foundation_v1', CORE_KEY='readyset_state';
let working=false, scheduled=null, quiet=false, state='WAITING_FOR_CENTRAL_AUTH', conflict=null;
const text=v=>String(v??'').trim();
function localObj(k) {
 const raw=localStorage.getItem(k);
 if(!raw) return {};
 const parsed=JSON.parse(raw);
 if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)) throw Error('PLANNER_LOCAL_RECORD_INVALID');
 return parsed;
}
function snapshot(){return {planner:localObj(PKEY),foundation:localObj(FKEY)};}
function hasData(s){
 const p=s.planner||{},f=s.foundation||{};
 // Boot-time empty day and imported canonical timetable are NOT learner edits.
 const tasks=Object.values(p.days||{}).some(d=>(d?.tasks||[]).length>0||String(d?.scheduleNote||'').trim());
 const manualProfiles=(f.profiles||[]).some(x=>x?.provenance?.source!=='NOTION_SNAPSHOT'&&x?.id!=='legacy-confirmed-baseline');
 return !!(Object.keys(p.assignmentFacts||{}).length||Object.keys(p.assignmentPackages||{}).length||
  (p.progressEvents||[]).length||tasks||(f.assignments||[]).length||(f.overrides||[]).length||
  (f.batches||[]).some(x=>x?.state==='COMMITTED')||manualProfiles||(f.plans||[]).some(x=>(x?.candidates||[]).length>0));
}
async function digest(s) {
 if(!globalThis.crypto?.subtle) throw Error('SECURE_DIGEST_UNAVAILABLE');
 const bytes=new TextEncoder().encode(JSON.stringify(s));
 const hash=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
}
function marker(){try{return JSON.parse(localStorage.getItem(MARK)||'null')}catch{return null;}}
function storeMarker(m){localStorage.setItem(MARK,JSON.stringify(m));}
function status(next,detail=null) {
 state=next; conflict=detail;
 document.documentElement.dataset.readyPlannerSync=next;
 try{window.dispatchEvent(new CustomEvent('ready-planner-sync-state',{detail:{state,detail}}));}catch{}
 showNotice();
 return {state,detail};
}
function noticeContainer(){
 if(!document.body||!document.createElement)return null;
 let n=document.getElementById('readyPlannerSyncNotice');
 if(!n){n=document.createElement('aside');n.id='readyPlannerSyncNotice';n.setAttribute('role','status');
 n.style.cssText='position:fixed;bottom:calc(76px + env(safe-area-inset-bottom,0px));left:12px;right:12px;z-index:1205;max-width:560px;margin:auto;padding:12px 14px;border-radius:14px;background:#19394a;color:#fff;box-shadow:0 8px 28px #0003;font:600 13px/1.5 system-ui';
 document.body.appendChild(n);}return n;
}
function showNotice(){
 const required=['LOCAL_OWNERSHIP_REVIEW_REQUIRED','REMOTE_AND_LOCAL_CONFLICT','CONFLICT_REVIEW_REQUIRED','UNBOUND_LOCAL_OWNER'];
 const old=document.getElementById('readyPlannerSyncNotice');
 if(!required.includes(state)){if(old)old.hidden=true;return;}
 const n=noticeContainer();if(!n)return;
 n.hidden=false;
 n.textContent= state==='LOCAL_OWNERSHIP_REVIEW_REQUIRED'?'이 기기에 저장된 숙제·일정이 있습니다. 로그인한 학습자의 서버 기록으로 저장할지 확인해 주세요.':'다른 기기에서 숙제·일정이 변경되었습니다. 기록을 보존하고 사용할 버전을 선택해 주세요.';
 if(state==='CONFLICT_REVIEW_REQUIRED'||state==='REMOTE_AND_LOCAL_CONFLICT'){
  for(const [action,label] of [
   ['USE_SERVER','서버 기록 사용'],
   ['KEEP_LOCAL','이 기기 기록 사용']
  ]){
   const b=document.createElement('button');b.textContent=label;
   b.style.cssText='margin:8px 7px 0 0;border:0;border-radius:10px;padding:8px 12px;font-weight:700;background:#cff0ff;color:#14394d';
   b.onclick=()=>void resolveConflict(action).catch(()=>status('SYNC_RETRY_REQUIRED'));
   n.appendChild(b);
  }
 }
 if(state==='LOCAL_OWNERSHIP_REVIEW_REQUIRED'){
  const b=document.createElement('button');b.textContent='이 학습자 기록으로 저장';b.style.cssText='display:block;margin-top:8px;border:0;border-radius:10px;padding:8px 12px;font-weight:700;background:#cff0ff;color:#14394d';b.onclick=()=>void approveLocalImport().catch(()=>status('SYNC_RETRY_REQUIRED'));n.appendChild(b);
 }
}
function backupLocal(scope,s){
 const arr=JSON.parse(localStorage.getItem(ARCHIVE)||'[]');
 const next=Array.isArray(arr)?arr:[];
 next.push({scope,created_at:new Date().toISOString(),snapshot:s});
 localStorage.setItem(ARCHIVE,JSON.stringify(next.slice(-6)));
}
function hydrate(s){
 let core=null;try{core=JSON.parse(localStorage.getItem('readyset_state')||'null')}catch{}
 if(core?.activeSession) return false;
 if(!s||typeof s.planner!=='object'||typeof s.foundation!=='object')throw Error('REMOTE_PLANNER_PAYLOAD_INVALID');
 quiet=true;
 try{
  localStorage.setItem(PKEY,JSON.stringify(s.planner));
  localStorage.setItem(FKEY,JSON.stringify(s.foundation));
 }finally{quiet=false;}
 try{window.dispatchEvent(new Event('ready-foundation-change'));}catch{}
 try{window.dispatchEvent(new Event('ready-planner-remote-restored'));}catch{}
 for(const fn of [window.ReadyHomeHomeworkUIV1?.render,window.ReadyStageD?.renderPlanner,window.ReadyStageF?.render]){
  try{fn?.()}catch{}
 }
 return true;
}
async function context(){
 const r=window.TAKY_FAMILY_RUNTIME;
 const bootstrap=window.ReadyFamilyRuntimeBootstrapV1;
 if(!r?.apiBaseUrl||typeof r.getToken!=='function'||typeof r.currentSession!=='function'||!bootstrap?.resolveMemberBinding)return null;
 const session=await r.currentSession();
 const identity=window.ReadyIdentityV1?.get?.();
 if(!identity)return null;
 const binding=bootstrap.resolveMemberBinding(identity,session);
 if(!binding.ok)return null;
 const family_id=text(session.family_id),member_id=text(binding.member_id);
 if(!family_id||!member_id) return null;
 const apiBase=new URL(r.apiBaseUrl,location.href);
 if(apiBase.protocol!=='https:'&&!['127.0.0.1','localhost'].includes(apiBase.hostname))throw Error('PLANNER_SECURE_BACKEND_REQUIRED');
 return {family_id,member_id,scope:family_id+'/'+member_id,apiBase,token:await r.getToken(),fetchImpl:r.fetchImpl||fetch};
}
async function remoteGet(c){
 const q=new URLSearchParams({family_id:c.family_id,member_id:c.member_id,record_type:TYPE,record_id:ID});
 const url=new URL('/api/family/user-data',c.apiBase);url.search=q.toString();
 const res=await c.fetchImpl(url.href,{method:'GET',headers:{authorization:'Bearer '+c.token}});
 if(res.status===404)return {missing:true};
 const body=await res.json();
 if(!res.ok||body.ok!==true)throw Error('PLANNER_REMOTE_READ_'+res.status);
 if(body.record?.family_id!==c.family_id||body.record?.member_id!==c.member_id||body.record?.record_type!==TYPE||body.record?.record_id!==ID)throw Error('PLANNER_REMOTE_SCOPE_MISMATCH');
 return {record:body.record,etag:body.etag};
}
async function remoteWrite(c,s,etag){
 const record={family_id:c.family_id,member_id:c.member_id,record_type:TYPE,record_id:ID,
  source_app:'ready-set',status:'CONFIRMED',recorded_at:new Date().toISOString(),
  payload:{planner:s.planner,foundation:s.foundation}};
 const res=await c.fetchImpl(new URL('/api/family/user-data',c.apiBase).href,{
  method:'POST',headers:{authorization:'Bearer '+c.token,'content-type':'application/json'},
  body:JSON.stringify({record,...(etag?{expected_etag:etag}:{})})
 });
 const body=await res.json().catch(()=>({}));
 if(res.status===409)return {conflict:true};
 if(!res.ok||body.storage_confirmed!==true||!text(body.etag))throw Error('PLANNER_REMOTE_WRITE_UNCONFIRMED_'+res.status);
 return {etag:body.etag};
}
async function sync(){
 if(working)return {state:'ALREADY_RUNNING'};
 working=true;
 let switchedScope=false;
 try{
  const c=await context();
  if(!c)return status('CENTRAL_AUTH_UNAVAILABLE');
  let previous=marker(), s=snapshot(), hash=await digest(s);
  if(previous?.scope && previous.scope!==c.scope){
    // Do not transfer a running learner session across members.
    let core=null;try{core=JSON.parse(localStorage.getItem(CORE_KEY)||'null')}catch{}
    if(core?.activeSession)return status('ACTIVE_SESSION_SWITCH_BLOCKED');
    // This browser stores legacy keys without member scope. Preserve the old
    // member's complete unsynced state before switching the active keys.
    let nextCache=null;
    try{
      const raw=localStorage.getItem(scopedCacheKey(c.scope));
      nextCache=raw?JSON.parse(raw):null;
      if(nextCache && (nextCache.marker?.scope!==c.scope ||
        typeof nextCache.snapshot?.planner!=='object'||typeof nextCache.snapshot?.foundation!=='object'))
        throw Error('SCOPED_CACHE_INVALID');
      localStorage.setItem(scopedCacheKey(previous.scope),JSON.stringify({marker:previous,snapshot:s,core:localStorage.getItem(CORE_KEY)}));
    }catch(error){return status('LOCAL_SCOPE_PRESERVATION_FAILED',{reason:String(error?.message||error)});}
    quiet=true;
    try{
      localStorage.setItem(PKEY,JSON.stringify(nextCache?.snapshot?.planner||{}));
      localStorage.setItem(FKEY,JSON.stringify(nextCache?.snapshot?.foundation||{}));
      localStorage.setItem(CORE_KEY,nextCache?.core||'{}');
      if(nextCache?.marker)storeMarker(nextCache.marker);
      else localStorage.removeItem(MARK);
    }finally{quiet=false;}
    switchedScope=true;
    previous=marker();s=snapshot();hash=await digest(s);
    try{window.dispatchEvent(new Event('ready-planner-remote-restored'));}catch{}
  }
  const remote=await remoteGet(c);
  if(!previous){
   if(hasData(s))return status('LOCAL_OWNERSHIP_REVIEW_REQUIRED');
   if(remote.record){
    const payload=remote.record.payload;
    if(!hydrate(payload))return status('ACTIVE_SESSION_RESTORE_DEFERRED');
    const remoteHash=await digest(payload);
    storeMarker({scope:c.scope,etag:remote.etag,ack_sha256:remoteHash});
    return status('SERVER_RESTORED');
   }
   storeMarker({scope:c.scope,etag:null,ack_sha256:hash});
   return status('SYNC_READY');
  }
  if(hash!==previous.ack_sha256){
   if((remote.etag||null)!==(previous.etag||null)){
    // POST may have been durably committed before the network response was lost.
    // Accept exactly the same server payload as an ACK; never overwrite a
    // different server revision without user confirmation.
    if(remote.record && await digest(remote.record.payload)===hash){
      storeMarker({scope:c.scope,etag:remote.etag,ack_sha256:hash});
      return status('SERVER_ACK_RECOVERED');
    }
    return status('CONFLICT_REVIEW_REQUIRED',{reason:'REMOTE_VERSION_CHANGED'});
   }
   const result=await remoteWrite(c,s,previous.etag);
   if(result.conflict)return status('CONFLICT_REVIEW_REQUIRED',{reason:'SERVER_ETAG_CONFLICT'});
   const currentHash=await digest(snapshot());
   storeMarker({scope:c.scope,etag:result.etag,ack_sha256:hash});
   if(currentHash!==hash)schedule();
   return status('SERVER_ACKNOWLEDGED');
  }
  if(remote.record&&remote.etag!==previous.etag){
   const payload=remote.record.payload;
   if(!hydrate(payload))return status('ACTIVE_SESSION_RESTORE_DEFERRED');
   storeMarker({scope:c.scope,etag:remote.etag,ack_sha256:await digest(payload)});
   return status('SERVER_RESTORED');
  }
  if(remote.missing&&previous.etag)return status('CONFLICT_REVIEW_REQUIRED',{reason:'SERVER_RECORD_MISSING'});
  return status('SYNCED');
 }catch(error){return status('SYNC_RETRY_REQUIRED',{reason:String(error?.message||error)})}
 finally{working=false;if(switchedScope){try{location.reload?.()}catch{}}}
}
async function resolveConflict(action){
 if(!['USE_SERVER','KEEP_LOCAL'].includes(action))
  return status('CONFLICT_REVIEW_REQUIRED',{reason:'RECOVERY_ACTION_REQUIRED'});
 if(working)return status('ALREADY_RUNNING');
 working=true;
 try{
  const c=await context();
  if(!c)return status('CENTRAL_AUTH_UNAVAILABLE');
  const prior=marker(),s=snapshot(),digestBefore=await digest(s);
  if(prior?.scope && prior.scope!==c.scope)return status('UNBOUND_LOCAL_OWNER');
  const remote=await remoteGet(c);
  if(!remote.record)return status('CONFLICT_REVIEW_REQUIRED',{reason:'SERVER_RECORD_UNAVAILABLE'});
  if(await digest(snapshot())!==digestBefore)
   return status('CONFLICT_REVIEW_REQUIRED',{reason:'LOCAL_RECORD_CHANGED_DURING_REVIEW'});
  if(action==='USE_SERVER'){
   backupLocal(c.scope,s);
   if(!hydrate(remote.record.payload))return status('ACTIVE_SESSION_RESTORE_DEFERRED');
   storeMarker({scope:c.scope,etag:remote.etag,
    ack_sha256:await digest(remote.record.payload)});
   return status('SERVER_RESTORED');
  }
  // User has explicitly selected this device's record; ETag still prevents
  // destroying another update that arrived while the decision was being made.
  backupLocal(c.scope,s);
  const posted=await remoteWrite(c,s,remote.etag);
  if(posted.conflict)return status('CONFLICT_REVIEW_REQUIRED',{reason:'CONCURRENT_UPDATE_DURING_REVIEW'});
  storeMarker({scope:c.scope,etag:posted.etag,ack_sha256:digestBefore});
  if(await digest(snapshot())!==digestBefore)schedule();
  return status('SERVER_ACKNOWLEDGED');
 }catch(error){return status('SYNC_RETRY_REQUIRED',{reason:String(error?.message||error)})}
 finally{working=false;}
}
async function approveLocalImport(){
 if(working)return status('ALREADY_RUNNING');
 const c=await context();if(!c)return status('CENTRAL_AUTH_UNAVAILABLE');
 const previous=marker();if(previous?.scope && previous.scope!==c.scope)return status('UNBOUND_LOCAL_OWNER');
 const s=snapshot();if(!hasData(s))return sync();
 const remote=await remoteGet(c);
 if(remote.record)return status('REMOTE_AND_LOCAL_CONFLICT');
 backupLocal(c.scope,s);
 const result=await remoteWrite(c,s,null);
 if(result.conflict)return status('REMOTE_AND_LOCAL_CONFLICT');
 storeMarker({scope:c.scope,etag:result.etag,ack_sha256:await digest(s)});
 return status('SERVER_ACKNOWLEDGED');
}
function schedule(){
 if(quiet||scheduled)return;
 scheduled=setTimeout(()=>{scheduled=null;void sync();},450);
}
window.ReadyFamilyPlannerSyncV1=Object.freeze({version:VERSION,sync,approveLocalImport,resolveConflict,status:()=>({state,detail:conflict}),schedule});
window.addEventListener('ready-planner-local-change',schedule);
window.addEventListener('ready-foundation-change',schedule);
window.addEventListener('taky-central-auth-ready',()=>void sync());
window.addEventListener('online',()=>void sync());
window.addEventListener('pageshow',()=>void sync());
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void sync();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void sync(),{once:true});
else void sync();
})();
