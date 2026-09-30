(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.TakyExplorerCrewStateStore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='EXPLORER_CREW_STATE_STORE_V1';
  const STORAGE_KEY='taky_explorer_crew_canonical_v1';

  function clone(x){return JSON.parse(JSON.stringify(x));}
  function validEnvelope(x){
    return !!(x&&typeof x==='object'&&!Array.isArray(x)&&x.version===VERSION&&x.state&&x.state.relation&&x.state.memory);
  }
  function empty(){
    return {
      version:VERSION,
      updated_at:null,
      revision:0,
      source_app:null,
      state:{relation:null,memory:null}
    };
  }
  function load(storage){
    try{
      const raw=storage?.getItem?.(STORAGE_KEY);
      if(!raw)return empty();
      const parsed=JSON.parse(raw);
      return validEnvelope(parsed)?parsed:empty();
    }catch{return empty()}
  }
  function save(storage,state,{source_app='UNKNOWN',expected_revision=null}={}){
    const current=load(storage);
    if(expected_revision!=null&&current.revision!==expected_revision){
      return {ok:false,reason:'REVISION_CONFLICT',current};
    }
    const next={
      version:VERSION,
      updated_at:new Date().toISOString(),
      revision:(current.revision||0)+1,
      source_app,
      state:clone(state)
    };
    storage?.setItem?.(STORAGE_KEY,JSON.stringify(next));
    return {ok:true,envelope:next};
  }
  function subscribe(win,handler){
    if(!win?.addEventListener)return ()=>{};
    const fn=e=>{if(e.key===STORAGE_KEY)handler(load(win.localStorage),e)};
    win.addEventListener('storage',fn);
    return ()=>win.removeEventListener?.('storage',fn);
  }
  return Object.freeze({VERSION,STORAGE_KEY,empty,load,save,subscribe});
});
