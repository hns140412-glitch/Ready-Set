(function(root,factory){
  'use strict';
  const api=factory(root?.TakyExplorerCrewCanonicalRuntime,root?.TakyExplorerCrewHandoff,root?.TakyExplorerCrewCompanionGatePolicy,root?.TakyExplorerCrewStoryGate);
  if(typeof module!=='undefined'&&module.exports){
    module.exports=factory(require('./canonical-runtime-v1.js'),require('./handoff-v1.js'),require('./companion-gate-policy-v1.js'),require('./story-gate-v1.js'));
  }else if(root)root.TakyExplorerCrewBrowserHost=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(runtimeApi,handoff,gatePolicyApi,storyGateApi){
  'use strict';
  const VERSION='EXPLORER_CREW_BROWSER_HOST_V1';
  const CORE6=Object.freeze(['dubi','lori','ink','nova','take','zero']);
  const EXPANSION18=Object.freeze(Array.from({length:18},(_,i)=>'guide-'+String(i+7).padStart(2,'0')));
  const ALL_CREW=Object.freeze([...CORE6,...EXPANSION18]);

  function create({app_id,storage,locationHref,replaceUrl}={}){
    const companionGatePolicy=gatePolicyApi?.evaluate?((args={})=>{
      const characterId=args?.event?.character_id||null;
      const explicit=args?.context?.companion_gate||{};
      const hasExplicitStory=Object.prototype.hasOwnProperty.call(explicit,'story_unlocked');
      const storyStatus=characterId&&storyGateApi?.status?storyGateApi.status(storage,characterId):null;
      const storyUnlocked=hasExplicitStory?explicit.story_unlocked===true:storyStatus?.unlocked===true;
      return gatePolicyApi.evaluate({
        ...args,
        context:{
          ...(args.context||{}),
          companion_gate:{...explicit,story_unlocked:storyUnlocked}
        }
      });
    }):null;
    const runtime=runtimeApi.createRuntime({
      characterIds:[...ALL_CREW],
      storage,
      source_app:app_id||'UNKNOWN',
      companionGatePolicy
    });

    async function consumeUrl(rawUrl=locationHref){
      if(!rawUrl)return {ok:true,consumed:false};
      const packed=handoff.readFromUrl(rawUrl);
      if(!packed?.event)return {ok:true,consumed:false};
      const event=packed.event;
      const storyEvent=event?.story_gate_event||null;
      const characterId=event?.relation_event?.character_id||event?.memory_event?.character_id||storyEvent?.character_id||runtime.getState().relation.main_character_id||CORE6[0];
      try{
        if(storyEvent?.character_id&&storyGateApi){
          if(storyEvent.type==='UNLOCK')storyGateApi.unlock(storage,{
            character_id:storyEvent.character_id,
            story_gate_id:storyEvent.story_gate_id,
            evidence_ref:storyEvent.evidence_ref,
            at:storyEvent.at
          });
          else if(storyEvent.type==='LOCK')storyGateApi.lock(storage,{
            character_id:storyEvent.character_id,
            reason:storyEvent.reason||'HANDOFF_LOCK',
            at:storyEvent.at
          });
        }
        const result=await runtime.cycle({
          app_id:app_id||'UNKNOWN',
          scene_id:'APP_HANDOFF',
          character_pool:[...ALL_CREW],
          active_crew:[characterId],
          current_main_character_id:runtime.getState().relation.main_character_id||characterId,
          focus_state:'IDLE',
          interaction_result:event
        });
        const clean=handoff.clearFromUrl(rawUrl);
        if(typeof replaceUrl==='function')replaceUrl(clean);
        return {ok:true,consumed:true,result,clean_url:clean};
      }catch(error){
        return {ok:false,consumed:false,error:String(error?.message||error)};
      }
    }

    function snapshot(){
      return runtime.getState();
    }

    function reload(){
      return runtime.reload();
    }

    function encodeEventForUrl(url,event){
      return handoff.appendToUrl(url,event);
    }

    function storyStatus(character_id){
      return storyGateApi?.status?storyGateApi.status(storage,character_id):null;
    }

    function unlockStoryGate({character_id,story_gate_id,evidence_ref,at}={}){
      if(!storyGateApi?.unlock)throw new Error('STORY_GATE_OWNER_UNAVAILABLE');
      return storyGateApi.unlock(storage,{character_id,story_gate_id,evidence_ref,at});
    }

    function lockStoryGate({character_id,reason,at}={}){
      if(!storyGateApi?.lock)throw new Error('STORY_GATE_OWNER_UNAVAILABLE');
      return storyGateApi.lock(storage,{character_id,reason,at});
    }

    return Object.freeze({VERSION,app_id,runtime,consumeUrl,snapshot,reload,encodeEventForUrl,storyStatus,unlockStoryGate,lockStoryGate});
  }

  return Object.freeze({VERSION,CORE6,EXPANSION18,ALL_CREW,create});
});
