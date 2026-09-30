(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root&&typeof window!=='undefined'){
    root.ReadyCentralBrowserBootstrapV01=api;
    const start=()=>api.installFromWindow(root).catch(error=>{
      root.ReadyCentralBootstrapStatus=Object.freeze({
        state:'DISABLED_BOOTSTRAP_ERROR',
        reason:String(error?.message||error)
      });
    });
    if(typeof document!=='undefined'&&document.readyState==='loading')
      document.addEventListener('DOMContentLoaded',start,{once:true});
    else Promise.resolve().then(start);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='READY_CENTRAL_BROWSER_BOOTSTRAP_V1';
  const clean=x=>typeof x==='string'?x.trim():'';
  const setStatus=(w,state,extra={})=>{
    const value=Object.freeze({version:VERSION,state,...extra});
    w.ReadyCentralBootstrapStatus=value;
    try{w.dispatchEvent?.(new CustomEvent('readyset-central-bootstrap-status',{detail:value}))}catch{}
    return value;
  };
  function dateKey(d){
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),
      day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  function candidateDates(days=14,now=new Date()){
    const out=[];
    for(let i=0;i<days;i++){
      const d=new Date(now);
      d.setDate(now.getDate()+i);
      out.push(dateKey(d));
    }
    return out;
  }
  function activityScope(record){
    const rows=Array.isArray(record?.task_outcomes)?record.task_outcomes:[];
    const scopes=[];
    for(const row of rows){
      const p=row?.centralCheckpoint?.provenance;
      const subject=clean(p?.subject).toLowerCase();
      const target=clean(p?.concept_skill_target).toLowerCase();
      if(subject&&target)scopes.push({subject,concept_skill_target:target});
    }
    const unique=[...new Map(scopes.map(x=>[x.subject+'|'+x.concept_skill_target,x])).values()];
    if(unique.length!==1)throw Error(unique.length?'CENTRAL_MIXED_SCOPE_SESSION_UNSUPPORTED':'CENTRAL_ACTIVITY_SCOPE_REQUIRED');
    return unique[0];
  }
  async function selectedMemberId(ready,authHost){
    if(typeof authHost.selectedMemberId==='function')
      return clean(await authHost.selectedMemberId());
    return String(ready?.role||'').toUpperCase()==='CHILD'?clean(ready?.member_id):'';
  }
  async function installFromWindow(w){
    if(!w||typeof w!=='object')return {ok:false,reason:'WINDOW_REQUIRED'};
    if(w.ReadyCentralLearningHost){
      setStatus(w,'ALREADY_INSTALLED');
      return {ok:true,reason:'ALREADY_INSTALLED',host:w.ReadyCentralLearningHost};
    }
    const cfg=w.TIMEATTACK_CONFIG||{};
    const evidenceEndpointUrl=clean(cfg.CENTRAL_EVIDENCE_ENDPOINT);
    const decisionEndpointUrl=clean(cfg.CENTRAL_DECISION_ENDPOINT);
    if(!evidenceEndpointUrl||!decisionEndpointUrl){
      setStatus(w,'DISABLED_CONFIG_REQUIRED',{reason:'CENTRAL_ENDPOINT_CONFIG_REQUIRED'});
      return {ok:false,reason:'CENTRAL_ENDPOINT_CONFIG_REQUIRED'};
    }
    const authHost=w.ReadyCentralAuthHost;
    if(typeof authHost?.currentSession!=='function'||typeof authHost?.accessToken!=='function'){
      setStatus(w,'DISABLED_AUTH_HOST_REQUIRED',{reason:'CENTRAL_AUTH_HOST_REQUIRED'});
      return {ok:false,reason:'CENTRAL_AUTH_HOST_REQUIRED'};
    }
    const Session=w.ReadyCentralEvidenceSessionV01;
    const Roundtrip=w.ReadyCentralLearningRoundtripV01;
    const planner=w.ReadySetPlanner;
    if(typeof Session?.resolve!=='function'||typeof Roundtrip?.create!=='function'||
       typeof Roundtrip?.optionsFromPersistedRecord!=='function'||
       typeof Roundtrip?.installBrowserHost!=='function'||!planner){
      setStatus(w,'DISABLED_RUNTIME_MODULES_REQUIRED',{reason:'CENTRAL_RUNTIME_MODULES_REQUIRED'});
      return {ok:false,reason:'CENTRAL_RUNTIME_MODULES_REQUIRED'};
    }
    let cachedScope=null;
    const sessionProvider=async()=>{
      const ready=w.ReadyFamilySession?.current?.();
      let central,member;
      try{
        central=await authHost.currentSession();
        member=await selectedMemberId(ready,authHost);
      }catch{
        cachedScope=null;
        return {authenticated:false};
      }
      const resolved=Session.resolve({readySession:ready,centralSession:central,selectedMemberId:member});
      cachedScope=resolved?.ok===true?resolved.session:null;
      return cachedScope||{authenticated:false};
    };
    const tokenProvider=async()=>{
      const token=clean(await authHost.accessToken());
      if(!token)throw Error('CENTRAL_ACCESS_TOKEN_REQUIRED');
      return token;
    };
    let roundtrip;
    try{
      roundtrip=Roundtrip.create({
        sessionProvider,tokenProvider,fetchImpl:w.fetch?.bind(w),
        indexedDB:w.indexedDB,dbName:'ready-central-evidence-v1',
        evidenceEndpointUrl,decisionEndpointUrl,
        cryptoProvider:w.crypto,clock:()=>Date.now()
      });
    }catch(error){
      setStatus(w,'DISABLED_CONFIG_INVALID',{reason:String(error?.message||error)});
      return {ok:false,reason:String(error?.message||error)};
    }
    const resolveRecordOptions=record=>{
      const scope=activityScope(record);
      const resolved=Roundtrip.optionsFromPersistedRecord(record,{
        subject:scope.subject,
        concept_skill_target:scope.concept_skill_target,
        planner,
        candidate_dates:candidateDates(14)
      });
      if(resolved?.ok!==true)throw Error(resolved?.reason||'CENTRAL_RECORD_OPTIONS_INVALID');
      return resolved.options;
    };
    await sessionProvider();
    let host;
    try{
      host=Roundtrip.installBrowserHost({
        eventTarget:w,roundtrip,resolveRecordOptions,
        activeScopeProvider:()=>cachedScope,
        onResult:payload=>setStatus(w,'INSTALLED',{
          active_scope:cachedScope?{...cachedScope}:null,
          last_result:{session_id:payload?.session_id||null,ok:payload?.result?.ok===true,
            reason:payload?.result?.reason||null,stage:payload?.result?.stage||null}
        })
      });
    }catch(error){
      setStatus(w,'DISABLED_HOST_INSTALL_FAILED',{reason:String(error?.message||error)});
      return {ok:false,reason:String(error?.message||error)};
    }
    const refresh=()=>Promise.resolve(sessionProvider()).then(scope=>
      setStatus(w,'INSTALLED',{active_scope:scope?.authenticated===true?{...scope}:null}))
      .catch(()=>setStatus(w,'INSTALLED',{active_scope:null}));
    w.addEventListener?.('readyset-family-session',refresh);
    setStatus(w,'INSTALLED',{active_scope:cachedScope?{...cachedScope}:null});
    return {ok:true,host,roundtrip,refresh};
  }
  return Object.freeze({VERSION,candidateDates,activityScope,installFromWindow});
});