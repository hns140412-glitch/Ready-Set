(() => {
  'use strict';
  const VERSION='0.1.0';
  const World=globalThis.TakyWorldState;
  if(!World?.normalize)throw new Error('READY_WORLD_STATE_CONTRACT_UNAVAILABLE');

  let state=World.empty(null);
  let loading=null;

  function family(){return globalThis.ReadyFamilySession?.current?.()||{authenticated:false,role:'CHILD',member_id:null}}
  function targetMemberId(){
    const s=family();
    if(!s.authenticated)return null;
    if(s.role==='PARENT')return globalThis.ReadyFamilyRegistry?.activeChild?.()?.member_id||null;
    return s.member_id||null;
  }
  function current(){return World.normalize(state)}
  function canWrite(){
    const s=family(),id=targetMemberId();
    return !!(s.authenticated&&s.role==='CHILD'&&id&&id===s.member_id);
  }
  function publish(){window.dispatchEvent(new CustomEvent('readyset-world-state',{detail:current()}))}

  async function hydrate(){
    const id=targetMemberId();
    if(!id){state=World.empty(null);publish();return {ok:true,state:current(),reason:'NO_AUTHENTICATED_LEARNER'}}
    if(loading)return loading;
    loading=(async()=>{
      try{
        const res=await fetch('/api/family/world-state?member_id='+encodeURIComponent(id),{method:'GET',headers:{Accept:'application/json'},credentials:'same-origin',cache:'no-store'});
        const body=await res.json().catch(()=>({}));
        if(!res.ok||!body?.state)return {ok:false,reason:body?.reason||('WORLD_STATE_HTTP_'+res.status),state:current()};
        state=World.normalize(body.state);publish();return {ok:true,state:current()};
      }catch(error){
        return {ok:false,reason:String(error?.message||error),state:current()};
      }finally{loading=null}
    })();
    return loading;
  }

  async function mutate(operation={}){
    const id=targetMemberId();
    if(!id||!canWrite())return {ok:false,reason:'WORLD_STATE_WRITE_CHILD_ONLY',state:current()};
    const res=await fetch('/api/family/world-state?member_id='+encodeURIComponent(id),{
      method:'PATCH',headers:{'Content-Type':'application/json','Accept':'application/json'},credentials:'same-origin',
      body:JSON.stringify({operation})
    });
    const body=await res.json().catch(()=>({}));
    if(!res.ok||!body?.state)return {ok:false,reason:body?.reason||('WORLD_STATE_UPDATE_HTTP_'+res.status),state:current()};
    state=World.normalize(body.state);publish();return {ok:true,state:current(),reason:body.reason||'UPDATED'};
  }

  async function syncPrimaryCompanion(){
    const primary=globalThis.ReadyCrewRegistry?.primary?.();
    if(!primary||!canWrite())return {ok:false,reason:'NO_WRITABLE_PRIMARY_COMPANION',state:current()};
    if(current().primary_companion_id===primary.character_id)return {ok:true,reason:'ALREADY_SYNCED',state:current()};
    return mutate({type:'SET_PRIMARY_COMPANION',character_id:primary.character_id});
  }

  async function setPresence(character_id,presence,story_reason=null){
    if(!character_id)return {ok:false,reason:'CHARACTER_ID_REQUIRED',state:current()};
    return mutate({type:'SET_PRESENCE',character_id,state:presence,story_reason,since_at:new Date().toISOString()});
  }

  async function recordMeaningfulEpisode(input={}){
    // Callers must provide an explicit evidence-backed memory_ref.
    if(!input.memory_ref||!input.character_id)return {ok:false,reason:'MEANINGFUL_EPISODE_IDENTITY_REQUIRED',state:current()};
    return mutate({
      type:'RECORD_MEANINGFUL_EPISODE',
      character_id:input.character_id,
      memory_ref:input.memory_ref,
      source_event_id:input.source_event_id||null,
      occurred_at:input.occurred_at||new Date().toISOString()
    });
  }

  window.ReadyWorldState=Object.freeze({
    version:VERSION,current,hydrate,canWrite,syncPrimaryCompanion,setPresence,recordMeaningfulEpisode,targetMemberId
  });

  window.addEventListener('readyset-family-session',()=>hydrate().catch(()=>{}));
  window.addEventListener('readyset-family-registry',()=>hydrate().catch(()=>{}));
  window.addEventListener('readyset-crew-registry',()=>{
    hydrate().then(()=>syncPrimaryCompanion()).catch(()=>{});
  });
  window.addEventListener('taky-exploration-event',event=>{
    const detail=event.detail||{};
    if(!canWrite()||detail.member_id!==family().member_id)return;
    const primary=globalThis.ReadyCrewRegistry?.primary?.();
    if(!primary)return;
    if(detail.source_event_type==='APP_SWITCH'){
      setPresence(primary.character_id,'WITH_EXPLORER','APP_SWITCH').catch(()=>{});
    }
    // No affinity/episode mutation from elapsed time, raw entry, completion count, or inferred behavior.
    if(detail.payload?.meaningful_episode===true&&detail.payload?.memory_ref){
      recordMeaningfulEpisode({
        character_id:primary.character_id,
        memory_ref:detail.payload.memory_ref,
        source_event_id:detail.exploration_event_id||null,
        occurred_at:detail.occurred_at
      }).catch(()=>{});
    }
  });

  hydrate().catch(()=>{});
})();