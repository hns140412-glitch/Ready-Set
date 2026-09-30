(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.TakyCrewEvidenceRuntime=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY='taky.explorer.crew.evidence.v1';
  const STATES=new Set(['NOT_MET','KNOWN','FAMILIAR','TRUSTED']);
  const EVENTS=new Set(['FIRST_MEETING','SHARED_EPISODE','EXPLORATION_COMPLETE','HELP_ACCEPTED','COACHING_SHARED']);
  function empty(){return {schema:'TAKY_CREW_EVIDENCE_STORE_V1',episodes:[],committed_relationships:{}}}
  function load(storage){
    try{
      const x=JSON.parse(storage?.getItem?.(KEY)||'null');
      return x&&x.schema==='TAKY_CREW_EVIDENCE_STORE_V1'?x:empty();
    }catch{return empty()}
  }
  function save(storage,state){storage?.setItem?.(KEY,JSON.stringify(state));return state}
  function append(storage,event){
    if(!event||!EVENTS.has(event.type)||event.verified!==true||!event.evidence_ref||!event.character_id)
      return {ok:false,reason:'VERIFIED_EVIDENCE_REQUIRED'};
    const state=load(storage);
    if(state.episodes.some(x=>x.event_id===event.event_id&&event.event_id))return {ok:false,reason:'DUPLICATE_EVENT'};
    const row=Object.freeze({
      event_id:event.event_id||('READY_SET:'+Date.now()+':'+state.episodes.length),
      type:event.type,verified:true,evidence_ref:String(event.evidence_ref),
      character_id:String(event.character_id),source_app:'READY_SET',source:'READY_SET',
      occurred_at:event.occurred_at||new Date().toISOString(),at:event.occurred_at||new Date().toISOString(),
      context:event.context&&typeof event.context==='object'?event.context:{}
    });
    const next={...state,episodes:[...state.episodes,row]};
    save(storage,next);
    if(typeof globalThis!=='undefined'&&globalThis.dispatchEvent&&globalThis.CustomEvent)
      globalThis.dispatchEvent(new globalThis.CustomEvent('taky:crew-evidence',{detail:row}));
    return {ok:true,event:row,state:next};
  }
  function relationship(storage,characterId){
    const s=load(storage);return s.committed_relationships?.[characterId]?.state||'KNOWN';
  }
  function commitRelationship(storage,characterId,state,authorityRef){
    if(!characterId||!STATES.has(state))return {ok:false,reason:'RELATIONSHIP_STATE_INVALID'};
    if(!authorityRef)return {ok:false,reason:'AUTHORITY_REF_REQUIRED'};
    const s=load(storage);
    const next={...s,committed_relationships:{...s.committed_relationships,[characterId]:{state,authority_ref:String(authorityRef)}}};
    save(storage,next);
    return {ok:true,state};
  }
  if(typeof globalThis!=='undefined'&&globalThis.addEventListener){
    globalThis.addEventListener('taky:crew-relationship-commit',event=>{
      const d=event?.detail||{};
      if(d.target_app&&d.target_app!=='READY_SET')return;
      commitRelationship(globalThis.localStorage,d.character_id,d.state,d.authority_ref);
    });
  }
  return Object.freeze({KEY,empty,load,append,relationship,commitRelationship,automaticPromotion:false,automaticReward:false,automaticPower:false});
});
