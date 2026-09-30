(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.TakyExplorerCrewStoryGate=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='EXPLORER_CREW_STORY_GATE_V1';
  const STORAGE_KEY='taky_explorer_crew_story_gate_v1';

  function clone(x){return JSON.parse(JSON.stringify(x));}
  function empty(){return {version:VERSION,revision:0,characters:{}}}
  function load(storage){
    try{
      const raw=storage?.getItem?.(STORAGE_KEY);
      if(!raw)return empty();
      const x=JSON.parse(raw);
      return x?.version===VERSION&&x.characters?x:empty();
    }catch{return empty()}
  }
  function status(storage,character_id){
    const x=load(storage);
    const row=x.characters?.[character_id]||null;
    return Object.freeze({
      character_id,
      unlocked:row?.state==='UNLOCKED',
      state:row?.state||'LOCKED',
      story_gate_id:row?.story_gate_id||null,
      evidence_ref:row?.evidence_ref||null,
      unlocked_at:row?.unlocked_at||null,
      revision:x.revision||0
    });
  }

  function unlock(storage,{character_id,story_gate_id,evidence_ref,at}={}){
    if(!character_id||!story_gate_id||!evidence_ref)throw new Error('STORY_GATE_EVIDENCE_REQUIRED');
    const current=load(storage),next=clone(current);
    const tick=(typeof at==='string'&&!Number.isNaN(Date.parse(at)))?at:new Date().toISOString();
    next.revision=(current.revision||0)+1;
    next.characters[character_id]={
      character_id,state:'UNLOCKED',story_gate_id,evidence_ref,unlocked_at:tick,updated_at:tick
    };
    storage?.setItem?.(STORAGE_KEY,JSON.stringify(next));
    return status(storage,character_id);
  }
  function lock(storage,{character_id,reason='RESET',at}={}){
    if(!character_id)throw new Error('STORY_GATE_CHARACTER_REQUIRED');
    const current=load(storage),next=clone(current);
    const tick=(typeof at==='string'&&!Number.isNaN(Date.parse(at)))?at:new Date().toISOString();
    next.revision=(current.revision||0)+1;
    next.characters[character_id]={
      character_id,state:'LOCKED',story_gate_id:null,evidence_ref:reason,unlocked_at:null,updated_at:tick
    };
    storage?.setItem?.(STORAGE_KEY,JSON.stringify(next));
    return status(storage,character_id);
  }
  return Object.freeze({VERSION,STORAGE_KEY,load,status,unlock,lock});
});
