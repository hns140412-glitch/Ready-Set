(function(root,factory){
  'use strict';
  const api=factory(root?.TakyExplorerCrewBrowserHost);
  if(typeof module!=='undefined'&&module.exports){
    module.exports=factory(require('./browser-host-v1.js'));
  }else if(root)root.TakyExplorerCrewSystemV2=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(browserHost){
  'use strict';
  const VERSION='EXPLORER_CREW_SYSTEM_V2';
  const ALL_CREW=Object.freeze([...(browserHost?.ALL_CREW||[])]);
  const cleanId=id=>ALL_CREW.includes(id)?id:null;
  const cleanIds=ids=>Object.freeze([...new Set((Array.isArray(ids)?ids:[]).filter(cleanId))]);

  function create({app_id,storage,locationHref,replaceUrl}={}){
    if(!browserHost?.create)throw new Error('CANONICAL_BROWSER_HOST_REQUIRED');
    if(!app_id)throw new Error('APP_ID_REQUIRED');
    const host=browserHost.create({app_id,storage,locationHref,replaceUrl});

    function snapshot(){return host.reload();}
    function context(input={}){
      const state=snapshot();
      const active=cleanIds(input.active_crew);
      const requested=cleanId(input.current_main_character_id);
      const canonicalMain=cleanId(state?.relation?.main_character_id);
      const current=requested||canonicalMain||active[0]||null;
      return Object.freeze({
        ...input,
        app_id,
        character_pool:Object.freeze([...ALL_CREW]),
        active_crew:active,
        current_main_character_id:current
      });
    }

    async function run(input={}){
      return host.runtime.cycle(context(input));
    }

    async function dispatch({interaction_result,character_id,scene_id='APP_INTERACTION',...rest}={}){
      if(!interaction_result)throw new Error('EXPLICIT_INTERACTION_RESULT_REQUIRED');
      const id=cleanId(character_id)||cleanId(interaction_result?.relation_event?.character_id)||
        cleanId(interaction_result?.memory_event?.character_id)||null;
      return run({
        ...rest,
        scene_id,
        active_crew:id?[id]:[],
        current_main_character_id:id,
        interaction_result
      });
    }

    async function renderPlan({character_id,scene_id='APP_RENDER',delivery_mode='NONE',...rest}={}){
      const id=cleanId(character_id)||cleanId(snapshot()?.relation?.main_character_id);
      if(!id)return Object.freeze({ok:false,reason:'CHARACTER_REQUIRED',render_plan:null});
      const result=await run({
        ...rest,
        scene_id,
        active_crew:[id],
        current_main_character_id:id,
        delivery_mode
      });

      const rendered=result?.output?.rendered||{};
      const plan=rendered?.render_plan||null;
      return Object.freeze({
        ok:rendered?.blocked!==true&&rendered?.plan_ready===true&&!!plan,
        reason:rendered?.reason||null,
        render_plan:plan,
        result
      });
    }

    return Object.freeze({
      VERSION,
      app_id,
      roster:ALL_CREW,
      runtime:host.runtime,
      snapshot,
      reload:host.reload,
      consumeUrl:host.consumeUrl,
      consumeHandoff:host.consumeUrl,
      encodeEventForUrl:host.encodeEventForUrl,
      storyStatus:host.storyStatus,
      unlockStoryGate:host.unlockStoryGate,
      lockStoryGate:host.lockStoryGate,
      run,
      dispatch,
      renderPlan,
      ownership:Object.freeze({
        runtime:'CANONICAL_ONLY',
        relation:'CANONICAL_ONLY',
        memory:'CANONICAL_ONLY',
        behavior:'CANONICAL_ONLY',
        asset:'CANONICAL_ONLY',
        legacy:'INPUT_MIGRATION_ONLY'
      })
    });
  }

  return Object.freeze({VERSION,ALL_CREW,create});
});
