(() => {
  'use strict';
  const VERSION='0.2.0';
  const World=globalThis.TakyWorldState;
  if(!World?.normalize||!World?.apply||!World?.empty)throw new Error('READY_WORLD_STATE_CONTRACT_UNAVAILABLE');

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
  function eventId(prefix='world'){return prefix+':'+Date.now()+':'+Math.random().toString(36).slice(2,10)}

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

  async function mutateEvent(event={}){
    const id=targetMemberId();
    if(!id||!canWrite())return {ok:false,reason:'WORLD_STATE_WRITE_CHILD_ONLY',state:current()};
    const normalizedEvent={
      ...event,
      event_id:String(event.event_id||eventId(event.type||'world')),
      occurred_at:event.occurred_at||new Date().toISOString()
    };
    const local=World.apply(current(),normalizedEvent);
    if(!local.ok)return {ok:false,reason:local.reason,state:current()};
    const res=await fetch('/api/family/world-state?member_id='+encodeURIComponent(id),{
      method:'PATCH',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      credentials:'same-origin',
      body:JSON.stringify({event:normalizedEvent})
    });
    const body=await res.json().catch(()=>({}));
    if(!res.ok||!body?.state)return {ok:false,reason:body?.reason||('WORLD_STATE_UPDATE_HTTP_'+res.status),state:current()};
    state=World.normalize(body.state);publish();return {ok:true,state:current(),reason:body.reason||'UPDATED'};
  }

  async function syncPrimaryCompanion(){
    const primary=globalThis.ReadyCrewRegistry?.primary?.();
    if(!primary||!canWrite())return {ok:false,reason:'NO_WRITABLE_PRIMARY_COMPANION',state:current()};
    if(current().crew?.[primary.character_id]?.state==='MAIN_COMPANION')return {ok:true,reason:'ALREADY_SYNCED',state:current()};
    return mutateEvent({type:'SET_MAIN_COMPANION',character_id:primary.character_id});
  }

  async function setCrewState(character_id,stateName,location_ref=null){
    if(!character_id)return {ok:false,reason:'CHARACTER_ID_REQUIRED',state:current()};
    return mutateEvent({type:'CREW_STATE_SET',character_id,state:stateName,location_ref});
  }

  async function startSpecialEvent(character_id,location_ref=null){
    if(!character_id)return {ok:false,reason:'CHARACTER_ID_REQUIRED',state:current()};
    return mutateEvent({type:'SPECIAL_EVENT_STARTED',character_id,location_ref});
  }

  async function recordReturnReunion(character_id){
    if(!character_id)return {ok:false,reason:'CHARACTER_ID_REQUIRED',state:current()};
    return mutateEvent({type:'RETURN_REUNION_RECORDED',character_id});
  }

  window.ReadyWorldState=Object.freeze({
    version:VERSION,
    current,
    hydrate,
    canWrite,
    mutateEvent,
    syncPrimaryCompanion,
    setCrewState,
    startSpecialEvent,
    recordReturnReunion,
    targetMemberId
  });

  window.addEventListener('readyset-family-session',()=>hydrate().catch(()=>{}));
  window.addEventListener('readyset-family-registry',()=>hydrate().catch(()=>{}));
  window.addEventListener('readyset-crew-registry',()=>{
    hydrate().then(()=>syncPrimaryCompanion()).catch(()=>{});
  });

  // Generic app/exploration events never mutate canonical world state.
  // World mutations require explicit TAKY_WORLD_STATE_V1 events through methods above.

  hydrate().catch(()=>{});
})();