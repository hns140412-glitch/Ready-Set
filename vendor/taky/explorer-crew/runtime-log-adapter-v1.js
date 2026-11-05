(function(root,factory){
  'use strict';
  const api=factory(
    root?.TakyExplorerCrewSemanticCompat,
    root?.CrewRuntimeLog
  );
  if(typeof module!=='undefined'&&module.exports){
    module.exports=factory(
      require('./semantic-command-compat-v1.js'),
      require('./runtime-log-pr10-v1.js')
    );
  }else if(root)root.TakyExplorerCrewRuntimeLogAdapter=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(compat,pr10Log){
  'use strict';
  const VERSION='EXPLORER_CREW_RUNTIME_TRACE_V2';

  const row=(trace,key)=>{
    const hit=(trace||[]).find(x=>Array.isArray(x)&&x[0]===key);
    return hit?hit[1]:null;
  };

  function normalizePolicy(action){
    const p=action?.runtime_policy;
    if(!p)return null;
    return {
      ok:p.status==='APPLIED',
      reason:p.reason||null,
      rejected_reasons:[...(p.rejected_reasons||[])],
      scene_slot:p.scene_slot||null,
      dialogue_intent:p.dialogue_intent||null,
      interruptibility:p.interruptibility||null,
      cooldown_key:p.cooldown_key||null,
      cooldown_after:p.cooldown_after??null,
      selection_reason:p.selection_reason||null,
      reaction_budget:p.reaction_budget||null
    };
  }

  async function summarize(context={},data={}){
    const trace=data.trace||[];
    const behavior=row(trace,'BEHAVIOR');
    const action=row(trace,'ARBITRATION')||behavior;
    const asset=row(trace,'ASSET');
    const rendered=row(trace,'RENDER');
    const stateUpdate=data.stateUpdate||row(trace,'STATE_UPDATE');
    const delivery=action?.runtime_policy?.delivery_mode||
      (action?.interaction_mode==='SILENT'||action?.interaction_mode==='LISTEN'?'NONE':context.delivery_mode||null);
    const converted=delivery?compat?.toPr10?.(action,delivery):null;
    const policyDecision=normalizePolicy(action);
    const pr10Trace=converted?.ok&&pr10Log?.record?pr10Log.record({
      command:converted.pr10_command,
      assetPlan:asset?.composition||null,
      renderPlan:rendered?.render_plan||null,
      policyDecision,
      fallback_reason:asset?.fallback_used===true?'STATIC_OR_SAME_CHARACTER_FALLBACK':null,
      trigger_event:context.interaction_result||null,
      context_snapshot:{
        app_id:context.app_id||null,
        scene_id:context.scene_id||null,
        focus_state:context.focus_state||null,
        child_state:context.child_state||null
      }
    }):null;

    return Object.freeze({
      schema:VERSION,
      status:data.report?.status||'UNKNOWN',
      app_id:context.app_id||null,
      scene_id:context.scene_id||null,
      semantic_action:action||null,
      behavior_decision:behavior||null,
      delivery_mode:delivery,
      pr10_compat:Object.freeze({
        ok:converted?.ok===true,
        reason:converted?.ok===true?null:(converted?.reason||'DELIVERY_OR_COMPATIBILITY_NOT_AVAILABLE')
      }),
      runtime_policy:action?.runtime_policy||null,
      asset:Object.freeze({
        status:asset?.asset_status||null,
        visual_id:asset?.visual_id||null,
        source_sha:asset?.source_sha||null,
        fallback_used:asset?.fallback_used===true,
        static_asset:asset?.static_asset||null,
        composition_ready:!!asset?.composition,
        composable_promotion:asset?.composable_promotion?Object.freeze({
          static_ready:asset.composable_promotion.static_ready===true,
          base_composable_ready:asset.composable_promotion.base_composable_ready===true,
          all_actions_ready:asset.composable_promotion.all_actions_ready===true,
          production_ready:asset.composable_promotion.production_ready===true,
          motion_status:asset.composable_promotion.motion_status||null,
          release_pass:asset.composable_promotion.release_pass===true,
          blockers:Object.freeze([...(asset.composable_promotion.blockers||[])])
        }):null,
        missing_requirements:Object.freeze([...(asset?.missing_requirements||[])])
      }),
      renderer:Object.freeze({
        rendered:rendered?.rendered===true,
        blocked:rendered?.blocked===true,
        plan_ready:rendered?.plan_ready===true,
        reason:rendered?.reason||null,
        static_fallback:rendered?.static_fallback===true
      }),
      state_update:Object.freeze({
        relation_changed:stateUpdate?.relation_changed===true,
        memory_changed:stateUpdate?.memory_changed===true,
        persistence_ok:stateUpdate?.persistence?.ok!==false
      }),
      pr10_trace:pr10Trace,
      invariants:Object.freeze({
        relation_not_owned_by_asset:true,
        memory_not_owned_by_asset:true,
        runtime_policy_not_behavior_owner:true,
        motion_ready_does_not_imply_release:true
      })
    });
  }

  return Object.freeze({VERSION,summarize});
});
