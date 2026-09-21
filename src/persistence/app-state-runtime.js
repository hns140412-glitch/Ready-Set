(function(root){
  'use strict';

  function clone(x){return structuredClone(x)}
  function migrate(raw,initial){
    const x=raw&&typeof raw==='object'?clone(raw):{};
    if(!x.schemaVersion)x.schemaVersion=1;
    x.profile=x.profile||{};
    x.guide=x.guide||{};
    if(x.schemaVersion<5){
      x.profile={name:x.profile.name||'',photo:x.profile.photo||'',style:x.profile.style||'editorial',shareAvatar:!!x.profile.shareAvatar};
      x.guide={type:x.guide.type||'lumi',name:x.guide.name||'루미',voice:x.guide.voice||'warm'};
      x.guestHistory=Array.isArray(x.guestHistory)?x.guestHistory:[];
      x.records=x.records||[];
      x.selected=x.selected||[];
      x.tasks=x.tasks||[];
      x.selectedTodoIds=Array.isArray(x.selectedTodoIds)?x.selectedTodoIds:[];
      x.targetMin=x.targetMin||25;
      if(x.sound==='자연음')x.sound='자연 숲';
      x.sound=x.sound||'집중 피아노';
      x.schemaVersion=5;
    }
    return {
      ...clone(initial),
      ...x,
      profile:{...initial.profile,...x.profile},
      guide:{...initial.guide,...x.guide}
    };
  }

  function create(options={}){
    const key=options.storageKey||'readyset_state';
    const initial=clone(options.initial||{});
    const storage=options.storage||root.localStorage;
    const localFirst=options.localFirst||root.ReadySetLocalFirst||null;
    const safePoint=typeof options.safePoint==='function'?options.safePoint:(state=>!state?.activeSession);

    function load(){
      try{
        const raw=JSON.parse(storage.getItem(key)||'null');
        if(!raw)return clone(initial);
        return migrate(raw,initial);
      }catch{return clone(initial)}
    }

    function save(state){
      const payload=JSON.stringify(state);
      storage.setItem(key,payload);
      localFirst?.capture?.('app_state',payload).catch?.(()=>{});
      const isSafe=!!safePoint(state);
      root.dispatchEvent?.(new CustomEvent('readyset-state-saved',{detail:{pwa_safe_point:isSafe}}));
      if(isSafe)root.dispatchEvent?.(new CustomEvent('readyset-safe-point'));
      return {ok:true,payload,pwa_safe_point:isSafe};
    }

    return Object.freeze({load,save,migrate:(raw)=>migrate(raw,initial)});
  }

  root.ReadyRebuildAppPersistence=Object.freeze({
    version:'READY_REBUILD_APP_PERSISTENCE_V01',
    create,
    migrate
  });
})(typeof globalThis!=='undefined'?globalThis:this);
