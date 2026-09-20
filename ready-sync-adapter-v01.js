(() => {
  'use strict';
  const STORAGE_KEY='readyset_sync_config_v1';
  const now=()=>new Date().toISOString();
  let runtime={state:'LOCAL_ONLY',last_check_at:null,last_error:null};

  function readConfig(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      const c=raw?JSON.parse(raw):{};
      return {enabled:!!c.enabled,endpoint:String(c.endpoint||'').trim().replace(/\/$/,'')};
    }catch{return {enabled:false,endpoint:''}}
  }
  function writeConfig(next){
    const current=readConfig();
    const merged={...current,...next};
    if(!merged.endpoint) merged.enabled=false;
    localStorage.setItem(STORAGE_KEY,JSON.stringify(merged));
    runtime={state:merged.enabled?'UNKNOWN':'LOCAL_ONLY',last_check_at:null,last_error:null};
    window.dispatchEvent(new CustomEvent('readyset-sync-status',{detail:status()}));
    return merged;
  }
  function status(){
    const config=readConfig();
    return Object.freeze({
      version:'0.1.0',
      configured:!!config.endpoint,
      enabled:!!config.enabled,
      endpoint:config.endpoint||null,
      state:!config.enabled?'LOCAL_ONLY':runtime.state,
      last_check_at:runtime.last_check_at,
      last_error:runtime.last_error
    });
  }
  async function health(){
    const config=readConfig();
    if(!config.enabled||!config.endpoint){
      runtime={state:'LOCAL_ONLY',last_check_at:now(),last_error:null};
      window.dispatchEvent(new CustomEvent('readyset-sync-status',{detail:status()}));
      return {ok:false,reason:'SYNC_NOT_CONFIGURED',status:status()};
    }
    try{
      const res=await fetch(config.endpoint+'/health',{method:'GET',headers:{Accept:'application/json'},cache:'no-store'});
      if(!res.ok) throw new Error('HEALTH_HTTP_'+res.status);
      const body=await res.json().catch(()=>({}));
      if(body?.ok===false) throw new Error(body.reason||'HEALTH_REJECTED');
      runtime={state:'CONNECTED',last_check_at:now(),last_error:null};
      window.dispatchEvent(new CustomEvent('readyset-sync-status',{detail:status()}));
      return {ok:true,status:status(),remote:body};
    }catch(error){
      runtime={state:'ERROR',last_check_at:now(),last_error:String(error?.message||error)};
      window.dispatchEvent(new CustomEvent('readyset-sync-status',{detail:status()}));
      return {ok:false,reason:runtime.last_error,status:status()};
    }
  }
  async function send(event){
    const config=readConfig();
    if(!config.enabled||!config.endpoint) return {ok:false,reason:'SYNC_NOT_CONFIGURED'};
    const payload={
      event_id:event.id,
      idempotency_key:event.idempotency_key||event.id,
      scope:event.scope,
      digest:event.digest,
      payload:event.payload,
      created_at:event.created_at,
      updated_at:event.updated_at,
      client:{app:'Ready & Set',adapter_version:'0.1.0'}
    };
    const authorization=window.ReadyFamilySession?.authorizationHeader?.();
    if(!authorization) return {ok:false,reason:'AUTH_SESSION_REQUIRED'};
    const res=await fetch(config.endpoint+'/events',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Accept':'application/json',
        'Idempotency-Key':payload.idempotency_key,
        'Authorization':authorization
      },
      body:JSON.stringify(payload)
    });
    const body=await res.json().catch(()=>({}));
    if(res.status===409){
      runtime={state:'CONNECTED',last_check_at:now(),last_error:null};
      return {ok:false,conflict:true,remote_payload:body.remote_payload??null,reason:body.reason||'REMOTE_CONFLICT'};
    }
    if(!res.ok||body?.ok===false){
      const reason=body?.reason||('SYNC_HTTP_'+res.status);
      runtime={state:'ERROR',last_check_at:now(),last_error:reason};
      window.dispatchEvent(new CustomEvent('readyset-sync-status',{detail:status()}));
      return {ok:false,reason};
    }
    runtime={state:'CONNECTED',last_check_at:now(),last_error:null};
    window.dispatchEvent(new CustomEvent('readyset-sync-status',{detail:status()}));
    return {ok:true,remote_version:body.remote_version??null};
  }

  window.ReadySetSyncAdapter=Object.freeze({
    version:'0.1.0',
    contract:'HTTP_JSON_V1',
    configure:({endpoint,enabled=true}={})=>writeConfig({endpoint:String(endpoint||'').trim(),enabled:!!enabled}),
    disable:()=>writeConfig({enabled:false}),
    status,
    health,
    send
  });
})();