(() => {
  'use strict';
  const STORAGE_KEY='readyset_sync_config_v1';
  const HttpJson=globalThis.TakyHttpJson;
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
      version:'0.3.0',
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
    if(!HttpJson?.request)return {ok:false,reason:'SHARED_HTTP_TRANSPORT_UNAVAILABLE',status:status()};
    const res=await HttpJson.request(config.endpoint+'/health',{
      method:'GET',
      headers:{Accept:'application/json'},
      cache:'no-store',
      credentials:'same-origin',
      timeout_ms:10000
    });
    const body=res.data||{};
    if(!res.ok||body?.ok===false){
      const reason=body?.reason||(res.status?('HEALTH_HTTP_'+res.status):(res.category||'HEALTH_NETWORK_ERROR'));
      runtime={state:'ERROR',last_check_at:now(),last_error:reason};
      window.dispatchEvent(new CustomEvent('readyset-sync-status',{detail:status()}));
      return {ok:false,reason,status:status(),transport_category:res.category,retry_after_ms:res.retry_after_ms??null};
    }
    runtime={state:'CONNECTED',last_check_at:now(),last_error:null};
    window.dispatchEvent(new CustomEvent('readyset-sync-status',{detail:status()}));
    return {ok:true,status:status(),remote:body};
  }
  async function send(event){
    const config=readConfig();
    if(!config.enabled||!config.endpoint) return {ok:false,reason:'SYNC_NOT_CONFIGURED'};
    const payload={
      event_id:event.event_id||event.id,
      idempotency_key:event.idempotency_key||event.event_id||event.id,
      scope:event.scope,
      logical_scope:event.logical_scope||null,
      scope_identity:event.scope_identity||null,
      digest:event.digest,
      payload:event.payload,
      created_at:event.created_at,
      updated_at:event.updated_at,
      client:{app:'Ready & Set',adapter_version:'0.3.0'}
    };
    const family=window.ReadyFamilySession?.current?.();
    if(!family?.authenticated) return {ok:false,reason:'AUTH_SESSION_REQUIRED'};
    if(!HttpJson?.request) return {ok:false,reason:'SHARED_HTTP_TRANSPORT_UNAVAILABLE'};
    const res=await HttpJson.request(config.endpoint+'/events',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Accept':'application/json',
        'Idempotency-Key':payload.idempotency_key
      },
      credentials:'same-origin',
      body:payload,
      timeout_ms:15000
    });
    const body=res.data||{};
    if(res.status===409){
      runtime={state:'CONNECTED',last_check_at:now(),last_error:null};
      return {ok:false,conflict:true,remote_payload:body.remote_payload??null,reason:body.reason||'REMOTE_CONFLICT'};
    }
    if(!res.ok||body?.ok===false){
      const reason=body?.reason||(res.status?('SYNC_HTTP_'+res.status):(res.category||'SYNC_NETWORK_ERROR'));
      runtime={state:'ERROR',last_check_at:now(),last_error:reason};
      window.dispatchEvent(new CustomEvent('readyset-sync-status',{detail:status()}));
      return {ok:false,reason,transport_category:res.category,retry_after_ms:res.retry_after_ms??null};
    }
    runtime={state:'CONNECTED',last_check_at:now(),last_error:null};
    window.dispatchEvent(new CustomEvent('readyset-sync-status',{detail:status()}));
    const result={ok:true,remote_version:body.remote_version??null};
    if(body.ack_token!=null) result.ack_token=body.ack_token;
    return result;
  }

  function bindFamilySession(){
    const family=window.ReadyFamilySession?.current?.();
    if(family?.authenticated){
      const cfg=readConfig();
      if(!cfg.endpoint||cfg.endpoint==='/api/ready-sync')writeConfig({endpoint:'/api/ready-sync',enabled:true});
    }else{
      const cfg=readConfig();
      if(cfg.endpoint==='/api/ready-sync')writeConfig({enabled:false});
    }
  }
  window.addEventListener('readyset-family-session',()=>bindFamilySession());
  queueMicrotask(()=>bindFamilySession());

  window.ReadySetSyncAdapter=Object.freeze({
    version:'0.2.0',
    contract:'HTTP_JSON_V1',
    configure:({endpoint,enabled=true}={})=>writeConfig({endpoint:String(endpoint||'').trim(),enabled:!!enabled}),
    disable:()=>writeConfig({enabled:false}),
    status,
    health,
    send
  });
})();