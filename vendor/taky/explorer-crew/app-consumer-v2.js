(function(root,factory){
  'use strict';
  const api=factory(root?.TakyExplorerCrewSystemV2);
  if(typeof module!=='undefined'&&module.exports){
    module.exports=factory(require('./system-v2.js'));
  }else if(root)root.TakyExplorerCrewAppConsumerV2=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(systemV2){
  'use strict';
  const VERSION='EXPLORER_CREW_APP_CONSUMER_V2';

  function create(options={}){
    const system=systemV2?.create?.(options);
    if(!system)throw new Error('EXPLORER_CREW_SYSTEM_V2_REQUIRED');

    function applyDataset(host,{status='READY',character_id='',render_plan=undefined}={}){
      if(!host?.dataset)return false;
      host.dataset.explorerCrewConsumer=VERSION;
      host.dataset.explorerCrewRuntime='CANONICAL_ONLY';
      host.dataset.explorerCrewStatus=String(status);
      host.dataset.explorerCrewCharacter=String(character_id||'');
      if(render_plan!==undefined)host.dataset.explorerCrewRenderPlan=String(render_plan?.kind||'');
      return true;
    }

    async function sync({host,character_id,scene_id='APP_SYNC',render=false}={}){
      const state=system.snapshot();
      const id=character_id||state?.relation?.main_character_id||'';
      let plan=undefined,status='READY';

      if(render&&id){
        const resolved=await system.renderPlan({character_id:id,scene_id});
        plan=resolved.render_plan||null;
        status=resolved.ok?'RENDER_PLAN_READY':'RENDER_PLAN_BLOCKED';
      }
      applyDataset(host,{status,character_id:id,render_plan:plan});
      return Object.freeze({
        ok:true,
        status,
        character_id:id,
        render_plan:plan,
        state,
        relationWrite:false,
        affinityWrite:false,
        memoryWrite:false
      });
    }

    async function dispatchInteraction(args={}){
      return system.dispatch(args);
    }

    return Object.freeze({
      VERSION,
      system,
      sync,
      dispatchInteraction,
      applyDataset,
      behaviorOwner:false,
      relationOwner:false,
      memoryOwner:false,
      assetResolver:false,
      runtimeOwner:false
    });
  }

  return Object.freeze({VERSION,create});
});
