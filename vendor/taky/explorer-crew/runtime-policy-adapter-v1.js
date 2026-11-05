(function(root,factory){
  'use strict';
  const api=factory(
    root?.TakyExplorerCrewSemanticCompat,
    root?.CrewRuntimePolicy
  );
  if(typeof module!=='undefined'&&module.exports){
    module.exports=factory(
      require('./semantic-command-compat-v1.js'),
      require('./runtime-policy-pr10-v1.js')
    );
  }else if(root)root.TakyExplorerCrewRuntimePolicyAdapter=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(compat,policy){
  'use strict';
  const VERSION='EXPLORER_CREW_RUNTIME_POLICY_ADAPTER_V1';

  function result(action,status,extra={}){
    return Object.freeze({
      ...action,
      runtime_policy:Object.freeze({
        status,
        ...extra
      })
    });
  }

  function inferDelivery(context={},action={}){
    const explicit=String(context.delivery_mode||'').trim();
    if(explicit)return explicit;
    if(action.interaction_mode==='SILENT'||action.interaction_mode==='LISTEN')return 'NONE';
    return null;
  }

  async function arbitrate(context={},action={},crewPlan={}){
    const delivery=inferDelivery(context,action);
    if(!delivery){
      return result(action,'NOT_APPLIED_DELIVERY_MODE_REQUIRED',{
        reason:'ACTIVE_INTERACTION_DELIVERY_MODE_NOT_EXPLICIT'
      });
    }

    const converted=compat?.toPr10?.(action,delivery);
    if(!converted?.ok){
      return result(action,'NOT_APPLIED_CONTRACT_GAP',{
        reason:converted?.reason||'SEMANTIC_COMPAT_FAILED',
        delivery_mode:delivery
      });
    }

    const decision=policy?.evaluate?.({
      command:converted.pr10_command,
      budget:context.runtime_policy_budget,
      usage:context.runtime_policy_usage,
      occupied_slots:context.occupied_slots,
      recent_action_keys:context.recent_action_keys,
      recent_dialogue_intents:context.recent_dialogue_intents,
      child_response_state:context.child_response_state,
      help_request_state:context.help_request_state,
      preferred_slot:context.preferred_scene_slot,
      default_cooldown_after:context.default_cooldown_after
    });

    if(!decision){
      return result(action,'NOT_APPLIED_POLICY_UNAVAILABLE',{
        reason:'RUNTIME_POLICY_DECISION_MISSING',
        delivery_mode:delivery
      });
    }

    return result(action,decision.ok?'APPLIED':'BLOCKED',{
      reason:decision.reason||null,
      rejected_reasons:decision.rejected_reasons||[],
      scene_slot:decision.scene_slot||null,
      dialogue_intent:decision.dialogue_intent||null,
      interruptibility:decision.interruptibility||null,
      cooldown_key:decision.cooldown_key||null,
      cooldown_after:decision.cooldown_after,
      reaction_budget:decision.reaction_budget||null,
      selection_reason:decision.selection_reason||null,
      delivery_mode:delivery,
      semantic_interaction_mode:converted.semantic_interaction_mode,
      crew_primary_interactor_id:crewPlan?.primary_interactor_id||null
    });
  }

  return Object.freeze({VERSION,inferDelivery,arbitrate});
});
