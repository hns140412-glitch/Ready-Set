(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.TakyExplorerCrewSharedMemory=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='EXPLORER_CREW_SHARED_MEMORY_EPISODE_V1';
  const MEMORY_TYPES=Object.freeze([
    'FIRST_ENCOUNTER','REENCOUNTER','SHARED_ACTIVITY','HELP_REQUEST',
    'HELP_COMPLETED','CHILD_EXPRESSION','STORY_EVENT','CHAPTER_EVENT',
    'SPECIAL_EVENT','COMPANION_SELECTED','MAIN_SELECTED','MAIN_CHANGED',
    'MEANINGFUL_SUCCESS','FUNNY_MOMENT','DISCOVERY','PROMISE_OR_PLAN',
    'RETURN_AFTER_ABSENCE','APP_CROSSOVER_EVENT'
  ]);
  const IMPORTANCE=Object.freeze(['LOW','MEDIUM','HIGH','CANONICAL_EPISODE']);
  const EPISODE_STATES=Object.freeze(['OPEN','ACTIVE','COMPLETE','ARCHIVED']);

  const clean=v=>typeof v==='string'?v.trim():'';
  const now=()=>new Date().toISOString();
  const iso=v=>typeof v==='string'&&!Number.isNaN(Date.parse(v))?v:null;

  function initial(){
    return {version:VERSION,memories:{},episodes:{}};
  }

  function cloneLedger(ledger){
    return JSON.parse(JSON.stringify(ledger||initial()));
  }

  function normalizeParticipants(rows=[]){
    return [...new Set((Array.isArray(rows)?rows:[]).map(clean).filter(Boolean))];
  }

  function addMemory(ledger,input={}){
    const out=cloneLedger(ledger);
    const memory_id=clean(input.memory_id);
    const character_id=clean(input.character_id);
    const event_type=clean(input.event_type);
    const timestamp=iso(input.timestamp||now());
    if(!memory_id)throw new Error('MEMORY_ID_REQUIRED');
    if(out.memories[memory_id])return out;
    if(!character_id)throw new Error('MEMORY_CHARACTER_REQUIRED');
    if(!MEMORY_TYPES.includes(event_type))throw new Error('MEMORY_EVENT_INVALID');
    if(!timestamp)throw new Error('MEMORY_DATE_REQUIRED');
    const factual_summary=clean(input.factual_summary);
    if(!factual_summary)throw new Error('MEMORY_FACT_REQUIRED');
    const participants=normalizeParticipants(input.participants);
    if(!participants.includes(character_id))participants.push(character_id);
    out.memories[memory_id]={
      memory_id,character_id,event_type,
      source_app:clean(input.source_app)||'UNKNOWN',
      scene_id:clean(input.scene_id)||null,
      chapter_id:clean(input.chapter_id)||null,
      timestamp,
      participants,
      factual_summary,
      child_expression_summary:clean(input.child_expression_summary)||null,
      emotional_tone:clean(input.emotional_tone)||null,
      importance:IMPORTANCE.includes(input.importance)?input.importance:'MEDIUM',
      relation_relevance:input.relation_relevance!==false,
      callback_allowed:input.callback_allowed!==false,
      expiry_policy:clean(input.expiry_policy)||'PERSIST',
      source_trace_id:clean(input.source_trace_id)||null
    };
    return out;
  }
  function createEpisode(ledger,input={}){
    const out=cloneLedger(ledger);
    const episode_id=clean(input.episode_id);
    if(!episode_id)throw new Error('EPISODE_ID_REQUIRED');
    if(out.episodes[episode_id])return out;
    const memory_ids=[...new Set((input.memory_ids||[]).map(clean).filter(id=>out.memories[id]))];
    if(memory_ids.length===0)throw new Error('EPISODE_MEMORY_REQUIRED');
    out.episodes[episode_id]={
      episode_id,
      title:clean(input.title)||episode_id,
      participating_characters:normalizeParticipants(input.participating_characters),
      start_event:clean(input.start_event)||out.memories[memory_ids[0]].event_type,
      memory_ids,
      episode_state:EPISODE_STATES.includes(input.episode_state)?input.episode_state:'OPEN',
      callback_hooks:Array.isArray(input.callback_hooks)?[...new Set(input.callback_hooks.map(clean).filter(Boolean))]:[],
      relation_effect_reference:clean(input.relation_effect_reference)||null,
      app_scope:Array.isArray(input.app_scope)?[...new Set(input.app_scope.map(clean).filter(Boolean))]:[],
      canonical_status:clean(input.canonical_status)||'ACTIVE'
    };
    return out;
  }

  function completeEpisode(ledger,episode_id){
    const out=cloneLedger(ledger);
    const ep=out.episodes?.[episode_id];
    if(!ep)throw new Error('EPISODE_NOT_FOUND');
    ep.episode_state='COMPLETE';
    return out;
  }

  function recallCandidates(ledger,{character_id,app_id,scene_id,limit=1}={}){
    const id=clean(character_id);
    if(!id)return [];
    return Object.values(ledger?.memories||{})
      .filter(m=>m.character_id===id&&m.callback_allowed===true&&m.participants.includes(id))
      .filter(m=>!app_id||m.source_app===app_id||m.event_type==='APP_CROSSOVER_EVENT'||m.importance==='CANONICAL_EPISODE')
      .filter(m=>!scene_id||!m.scene_id||m.scene_id===scene_id||m.importance==='CANONICAL_EPISODE')
      .sort((a,b)=>String(b.timestamp).localeCompare(String(a.timestamp)))
      .slice(0,Math.max(0,Math.min(3,Number(limit)||1)))
      .map(m=>Object.freeze({...m,participants:Object.freeze([...m.participants])}));
  }

  function snapshot(ledger){
    const out=cloneLedger(ledger);
    return Object.freeze({
      version:VERSION,
      memories:Object.freeze(Object.fromEntries(Object.entries(out.memories||{}).map(([k,v])=>[k,Object.freeze(v)]))),
      episodes:Object.freeze(Object.fromEntries(Object.entries(out.episodes||{}).map(([k,v])=>[k,Object.freeze(v)])))
    });
  }

  return Object.freeze({
    VERSION,MEMORY_TYPES,IMPORTANCE,EPISODE_STATES,
    initial,addMemory,createEpisode,completeEpisode,recallCandidates,snapshot
  });
});
