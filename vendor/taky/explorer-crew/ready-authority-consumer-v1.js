(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else if(root)root.ReadyExplorerCrewAuthorityConsumer=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='READY_EXPLORER_CREW_AUTHORITY_CONSUMER_V1';
  const PROJECTION_KEY='ready_explorer_crew_authority_projection_v1';
  const CANONICAL_STATE_KEY='taky_explorer_crew_canonical_v1';
  const CREW_EVENT_PARAM='crew_event';
  const AUTHORITY=Object.freeze({
    repository:'hns140412-glitch/TAKY',
    commit:'55547a7c4c859a1aae700405fdba4a302a2c20d3',
    canonical_path:'OS/EXPLORATION_CREW_CANONICAL.md',
    relationship_path:'OS/GUIDE_CHARACTER_RELATIONSHIP.md',
    contract_version:'CREW_PIPELINE_V1',
    manifest_version:'CREW_COMPOSABLE_MANIFEST_V1',
    runtime_schema_version:'CREW_RUNTIME_TRACE_V1'
  });
  const IMPLEMENTATION_EVIDENCE=Object.freeze({
    repository:'hns140412-glitch/Snap-Pop',
    pr:10,
    canonical_verified_head:'8ea7b985eaf792e866e4d21d174eaac824a23567',
    later_working_head:'13083b4056b1532da1bc5ef4de259d21204a3243',
    role:'COMPATIBILITY_EVIDENCE_ONLY_NOT_READY_AUTHORITY'
  });
  const CORE6=new Set(['dubi','lori','ink','nova','take','zero']);
  const GUIDE_ID=/^guide-(0[7-9]|1[0-9]|2[0-4])$/;

  const clean=v=>typeof v==='string'?v.trim():'';
  const clone=x=>JSON.parse(JSON.stringify(x));

  function validCharacterId(id){
    const x=clean(id);
    return CORE6.has(x)||GUIDE_ID.test(x);
  }
  function validProjection(x){
    return !!(x&&x.version===VERSION&&validCharacterId(x.character_id)&&
      x.authority?.commit===AUTHORITY.commit&&x.authority?.contract_version===AUTHORITY.contract_version&&
      x.relation_write===false&&x.affinity_write===false&&x.behavior_owner===false&&x.asset_resolver===false);
  }
  function empty(){
    return Object.freeze({
      version:VERSION,
      status:'UNBOUND',
      character_id:null,
      relation_state:null,
      source:null,
      source_event_id:null,
      observed_at:null,
      authority:AUTHORITY,
      implementation_evidence:IMPLEMENTATION_EVIDENCE,
      relation_write:false,
      affinity_write:false,
      memory_write:false,
      behavior_owner:false,
      asset_resolver:false,
      renderer:false
    });
  }
  function load(storage){
    try{
      const parsed=JSON.parse(storage?.getItem?.(PROJECTION_KEY)||'null');
      return validProjection(parsed)?Object.freeze(parsed):empty();
    }catch{return empty()}
  }
  function persist(storage,input={}){
    const characterId=clean(input.character_id);
    if(!validCharacterId(characterId))return {ok:false,reason:'CHARACTER_ID_NOT_COMPATIBLE',projection:load(storage)};
    const incomingAt=clean(input.observed_at)||new Date().toISOString();
    const current=load(storage);
    if(current.status==='BOUND'&&current.observed_at){
      const prev=Date.parse(current.observed_at),nextAt=Date.parse(incomingAt);
      if(Number.isFinite(prev)&&Number.isFinite(nextAt)){
        if(nextAt<prev)return {ok:false,reason:'STALE_PROJECTION',projection:current};
        if(nextAt===prev&&current.character_id!==characterId)
          return {ok:false,reason:'PROJECTION_CONFLICT_SAME_TIME',projection:current};
      }
    }
    const next={
      version:VERSION,
      status:'BOUND',
      character_id:characterId,
      relation_state:clean(input.relation_state)||'MAIN_COMPANION',
      source:clean(input.source)||'CANONICAL_PROJECTION',
      source_event_id:clean(input.source_event_id)||null,
      observed_at:incomingAt,
      authority:AUTHORITY,
      implementation_evidence:IMPLEMENTATION_EVIDENCE,
      relation_write:false,
      affinity_write:false,
      memory_write:false,
      behavior_owner:false,
      asset_resolver:false,
      renderer:false
    };
    storage?.setItem?.(PROJECTION_KEY,JSON.stringify(next));
    return {ok:true,projection:Object.freeze(next)};
  }
  function consumeCanonicalEnvelope(envelope,storage){
    const relation=envelope?.state?.relation||envelope?.relation||null;
    const characterId=clean(relation?.main_character_id);
    const member=characterId?relation?.members?.[characterId]:null;
    if(!characterId)return {ok:true,consumed:false,reason:'NO_CANONICAL_MAIN',projection:load(storage)};
    if(!validCharacterId(characterId))return {ok:false,consumed:false,reason:'CHARACTER_ID_NOT_COMPATIBLE',projection:load(storage)};
    const relationState=clean(member?.relation_state)||'MAIN_COMPANION';
    if(relationState!=='MAIN_COMPANION')return {ok:false,consumed:false,reason:'MAIN_RELATION_STATE_REQUIRED',projection:load(storage)};
    const saved=persist(storage,{
      character_id:characterId,
      relation_state:relationState,
      source:'CANONICAL_STATE_ENVELOPE',
      observed_at:clean(envelope?.updated_at)||new Date().toISOString()
    });
    return {...saved,consumed:saved.ok};
  }
  function consumeCanonicalStore(storage){
    try{
      const raw=storage?.getItem?.(CANONICAL_STATE_KEY);
      if(!raw)return {ok:true,consumed:false,reason:'NO_LOCAL_CANONICAL_STATE',projection:load(storage)};
      const envelope=JSON.parse(raw);
      return consumeCanonicalEnvelope(envelope,storage);
    }catch{return {ok:false,consumed:false,reason:'INVALID_LOCAL_CANONICAL_STATE',projection:load(storage)}}
  }
  function b64urlDecode(text){
    if(typeof Buffer!=='undefined')return Buffer.from(text,'base64url').toString('utf8');
    const s=String(text||'').replace(/-/g,'+').replace(/_/g,'/');
    const pad=s+'='.repeat((4-s.length%4)%4);
    const binary=atob(pad),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  function unpack(token){
    try{
      const x=JSON.parse(b64urlDecode(token));
      return x?.v===1&&x.event?x:null;
    }catch{return null}
  }
  function consumeHandoffUrl(rawUrl,{storage,replaceUrl}={}){
    if(!rawUrl)return {ok:true,consumed:false,reason:'URL_REQUIRED',projection:load(storage)};
    let url;
    try{url=new URL(rawUrl,typeof location!=='undefined'?location.href:'http://localhost/')}
    catch{return {ok:false,consumed:false,reason:'INVALID_URL',projection:load(storage)}}
    const token=url.searchParams.get(CREW_EVENT_PARAM);
    if(!token)return {ok:true,consumed:false,reason:'NO_CREW_EVENT',projection:load(storage)};
    const packed=unpack(token);
    const event=packed?.event||null;
    const relationEvent=event?.relation_event||null;
    const type=clean(relationEvent?.type);
    const characterId=clean(relationEvent?.character_id);
    if(!['MAIN_SELECTED','MAIN_CHANGED'].includes(type)||!validCharacterId(characterId)){
      return {ok:false,consumed:false,reason:'UNSUPPORTED_CREW_EVENT',projection:load(storage)};
    }
    const saved=persist(storage,{
      character_id:characterId,
      relation_state:'MAIN_COMPANION',
      source:'CANONICAL_HANDOFF_EVENT',
      source_event_id:clean(relationEvent?.event_id)||clean(event?.event_id)||null,
      observed_at:clean(relationEvent?.at)||clean(event?.at)||clean(packed?.at)||new Date().toISOString()
    });
    if(saved.ok){
      url.searchParams.delete(CREW_EVENT_PARAM);
      const cleanUrl=url.pathname+(url.searchParams.toString()?'?'+url.searchParams.toString():'')+url.hash;
      if(typeof replaceUrl==='function')replaceUrl(cleanUrl);
    }
    return {...saved,consumed:saved.ok};
  }
  function syncHost(host,projection){
    const p=projection||empty();
    if(!host?.dataset)return false;
    host.dataset.explorerCrewAuthority=AUTHORITY.commit;
    host.dataset.explorerCrewContract=AUTHORITY.contract_version;
    host.dataset.explorerCrewManifest=AUTHORITY.manifest_version;
    host.dataset.explorerCrewRuntimeSchema=AUTHORITY.runtime_schema_version;
    host.dataset.explorerCrewStatus=p.status;
    if(p.character_id)host.dataset.explorerCrewCharacter=p.character_id;
    else delete host.dataset.explorerCrewCharacter;
    host.dataset.explorerCrewRelationWrite='false';
    host.dataset.explorerCrewAffinityWrite='false';
    host.dataset.explorerCrewBehaviorOwner='false';
    host.dataset.explorerCrewAssetResolver='false';
    return true;
  }
  function snapshot(storage){
    return load(storage);
  }

  return Object.freeze({
    VERSION,PROJECTION_KEY,CANONICAL_STATE_KEY,CREW_EVENT_PARAM,AUTHORITY,IMPLEMENTATION_EVIDENCE,
    validCharacterId,empty,snapshot,consumeCanonicalEnvelope,consumeCanonicalStore,consumeHandoffUrl,syncHost,
    ownership:Object.freeze({
      semantic:'CONSUMER_ONLY',
      relationWrite:false,
      affinityWrite:false,
      memoryWrite:false,
      behaviorOwner:false,
      assetResolver:false,
      renderer:false
    })
  });
});
