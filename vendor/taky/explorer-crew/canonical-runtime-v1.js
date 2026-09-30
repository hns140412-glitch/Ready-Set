(function(root,factory){
  'use strict';
  const api=factory(
    root?.TakyExplorerCrewRuntime,
    root?.TakyExplorerCrewRelationAffinity,
    root?.TakyExplorerCrewSharedMemory,
    root?.TakyExplorerCrewStateStore,
    root?.TakyExplorerCrewPersonalityBehavior,
    root?.TakyExplorerCrewDialoguePersonality,
    root?.TakyExplorerCrewRuntimePolicyAdapter,
    root?.TakyExplorerCrewAssetRenderAdapter,
    root?.TakyExplorerCrewRuntimeLogAdapter
  );
  if(typeof module!=='undefined'&&module.exports){
    module.exports=factory(
      require('./runtime-v1.js'),
      require('./relation-affinity-v1.js'),
      require('./shared-memory-episode-v1.js'),
      require('./state-store-v1.js'),
      require('./personality-behavior-v1.js'),
      require('./dialogue-personality-v1.js'),
      require('./runtime-policy-adapter-v1.js'),
      require('./asset-render-adapter-v1.js'),
      require('./runtime-log-adapter-v1.js')
    );
  }else if(root)root.TakyExplorerCrewCanonicalRuntime=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(runtimeApi,relationApi,memoryApi,stateStoreApi,personalityBehavior,dialoguePersonality,runtimePolicyAdapter,assetRenderAdapter,runtimeLogAdapter){
  'use strict';
  const VERSION='EXPLORER_CREW_CANONICAL_RUNTIME_V1';

  function createState(characterIds=[]){
    return {
      relation:relationApi.initial(characterIds),
      memory:memoryApi.initial()
    };
  }

  function clone(x){return JSON.parse(JSON.stringify(x));}

  function reconcileCharacters(state,characterIds=[]){
    const out=clone(state);
    const defaults=relationApi.initial(characterIds);
    if(!out.relation?.members)out.relation=defaults;
    else{
      for(const id of characterIds){
        if(!out.relation.members[id])out.relation.members[id]=defaults.members[id];
      }
    }
    return out;
  }

  function relationSnapshot(state){
    return relationApi.snapshot(state.relation);
  }

  function memorySnapshot(state){
    return memoryApi.snapshot(state.memory);
  }

  function createRuntime({characterIds=[],behavior,arbitrate,dialogue,scene,asset,render,validate,storage=null,source_app='UNKNOWN',companionGatePolicy=null}={}){
    const loaded=stateStoreApi?.load?.(storage);
    let storeRevision=loaded?.revision||0;
    let state=(loaded?.state?.relation&&loaded?.state?.memory)?reconcileCharacters(loaded.state,characterIds):createState(characterIds);

    const engines={
      encounter:async context=>({
        candidates:[...(context.character_pool||characterIds)],
        first_encounter_candidates:(context.character_pool||characterIds).filter(id=>
          state.relation.members[id]?.relation_state==='UNSEEN'
        )
      }),
      relation:async()=>relationSnapshot(state),
      memory:async(context,_encounter,rel)=>{
        const id=context.current_main_character_id;
        if(!id)return null;
        const rows=memoryApi.recallCandidates(state.memory,{
          character_id:id,
          app_id:context.app_id,
          scene_id:context.scene_id,
          limit:1
        });
        return rows[0]||null;
      },
      crew:async context=>({
        primary_interactor_id:context.current_main_character_id||null,
        ambient_character_ids:Object.freeze(
          (context.active_crew||[]).filter(id=>id!==context.current_main_character_id).slice(0,2)
        )
      }),
      behavior:behavior|| (async(context,crew)=>{
        const id=crew.primary_interactor_id||crew.ambient_character_ids[0]||characterIds[0];
        const rel=state.relation.members[id]?.relation_state||'UNSEEN';
        const base=personalityBehavior?.decide?.(id,{
          ...context,
          focus_state:context.focus_state==='FOCUS_ACTIVE'?'FOCUS':context.focus_state
        })||{
          behavior_state:context.focus_state==='FOCUS_ACTIVE'?'AMBIENT':'OBSERVE',
          ambient_action:context.focus_state==='FOCUS_ACTIVE'?'READ_BOOK':null,
          interaction_mode:'SILENT',hint_level:'H0'
        };
        return {
          ...base,
          character_id:id,
          role:crew.primary_interactor_id===id?'MAIN':'AMBIENT',
          relation_state:rel
        };
      }),
      arbitrate:arbitrate|| (async(c,a,crewPlan)=>runtimePolicyAdapter?.arbitrate?runtimePolicyAdapter.arbitrate(c,a,crewPlan):a),
      dialogue:dialogue|| (async(context,a)=>{
        let intent=null;
        if(a.interaction_mode==='GUIDE')intent='HINT';
        else if(a.interaction_mode==='TALK'&&['PEEK','OBSERVE','TALK','THINK','IDEA'].includes(a.behavior_state))intent='ASK';
        else if(['REACTION','COMPLETE'].includes(a.behavior_state))intent='ACKNOWLEDGE';
        const resolved=dialoguePersonality?.resolve?.({
          character_id:a.character_id,
          intent,
          scene_id:context.scene_id,
          interaction_mode:a.interaction_mode
        })||{text:null};
        return {text:resolved.text||null,intent,source:resolved.source||null,style_group:resolved.style_group||null};
      }),
      scene:scene|| (async(_c,a)=>({
        appearance_mode:a.behavior_state==='AMBIENT'?'AMBIENT_BACKGROUND':'SIDE_COMPANION',
        preferred_anchor:'right-safe'
      })),
      asset:asset|| (async(c,a,s)=>assetRenderAdapter?.resolve?assetRenderAdapter.resolve(c,a,s):({
        character_id:a.character_id,
        visual_id:a.character_id,
        source_sha:'',
        asset_status:'MISSING_ASSET',
        body_asset:null,
        face_asset:null,
        render_anchor:s.preferred_anchor,
        fallback_used:false,
        missing_requirements:['ASSET_RENDER_ADAPTER_UNAVAILABLE']
      })),
      render:render|| (async(c,payload)=>assetRenderAdapter?.render?assetRenderAdapter.render(c,payload):({rendered:false,blocked:true,reason:'ASSET_RENDER_ADAPTER_UNAVAILABLE'})),
      update:async(context,{interaction})=>{
        let relationChanged=false,memoryChanged=false;
        const evt=interaction?.relation_event;
        if(evt?.character_id&&evt?.type){
          if(evt.type==='FIRST_MET'){
            state.relation=relationApi.recordFirstEncounter(state.relation,evt.character_id,evt.at);
            state.relation=relationApi.completeFirstEncounter(state.relation,evt.character_id,evt.at);
            relationChanged=true;
          }else if(['REENCOUNTERED','SHARED_ACTIVITY','HELP_REQUEST_COMPLETED','STORY_EVENT_SHARED','CHAPTER_SHARED','SPECIAL_EVENT_SHARED'].includes(evt.type)){
            const currentMember=state.relation.members?.[evt.character_id]||null;
            const gate=typeof companionGatePolicy==='function'
              ? (companionGatePolicy({context,event:evt,member:currentMember,state:relationSnapshot(state)})||{})
              : {};
            state.relation=relationApi.applyMeaningfulEvent(state.relation,evt.character_id,{
              type:evt.type,event_id:evt.event_id,at:evt.at
            },gate);
            relationChanged=true;
          }else if(evt.type==='COMPANION_SELECTED'){
            state.relation=relationApi.selectCompanion(state.relation,evt.character_id,evt.at);
            relationChanged=true;
          }else if(evt.type==='MAIN_SELECTED'||evt.type==='MAIN_CHANGED'){
            state.relation=relationApi.selectMain(state.relation,evt.character_id,evt.at);
            relationChanged=true;
          }
        }
        const mem=interaction?.memory_event;
        if(mem){
          state.memory=memoryApi.addMemory(state.memory,mem);
          memoryChanged=true;
        }
        let persistence={ok:true,skipped:true,revision:storeRevision};
        if((relationChanged||memoryChanged)&&stateStoreApi?.save&&storage){
          const saved=stateStoreApi.save(storage,state,{source_app,expected_revision:storeRevision});
          if(saved.ok){storeRevision=saved.envelope.revision;persistence={ok:true,skipped:false,revision:storeRevision};}
          else persistence={ok:false,skipped:false,reason:saved.reason,current_revision:saved.current?.revision??null};
        }
        return {
          relation_changed:relationChanged,
          memory_changed:memoryChanged,
          relation:relationSnapshot(state),
          memory:memorySnapshot(state),
          persistence
        };
      },
      validate:validate|| (async()=>({status:'PASS'})),
      summarize:runtimeLogAdapter?.summarize
    };

    const runtime=runtimeApi.createRuntime(engines);
    return Object.freeze({
      VERSION,
      cycle:runtime.cycle,
      getState:()=>Object.freeze({
        relation:relationSnapshot(state),
        memory:memorySnapshot(state),
        store_revision:storeRevision
      }),
      reload:()=>{
        const latest=stateStoreApi?.load?.(storage);
        if(latest?.state?.relation&&latest?.state?.memory){state=reconcileCharacters(latest.state,characterIds);storeRevision=latest.revision||0;}
        return Object.freeze({relation:relationSnapshot(state),memory:memorySnapshot(state),store_revision:storeRevision});
      },
      reset:()=>{state=createState(characterIds);storeRevision=0;}
    });
  }

  return Object.freeze({VERSION,createState,createRuntime});
});
