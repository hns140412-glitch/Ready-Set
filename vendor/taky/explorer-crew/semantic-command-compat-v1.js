(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.TakyExplorerCrewSemanticCompat=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='EXPLORER_CREW_SEMANTIC_COMPAT_V1';

  const LOCAL_INTERACTION=Object.freeze(['SILENT','TALK','LISTEN','GUIDE']);
  const DELIVERY=Object.freeze(['NONE','TEXT','VOICE','TEXT_AND_VOICE']);
  const PR10_BEHAVIOR=Object.freeze(['AMBIENT','OBSERVE','THINK','LISTEN','GUIDE','REACTION','COMPLETE','PEEK','HIDE']);
  const PR10_AMBIENT=Object.freeze(['READ_BOOK','READ_MAP','WRITE_NOTE','CHECK_COMPASS','ORGANIZE_BAG','USE_MAGNIFIER','USE_RADIO','REST']);

  function fail(reason,action){
    return Object.freeze({ok:false,reason,canonical_action:action||null,pr10_command:null});
  }

  function toPr10(action={},delivery_mode='NONE'){
    if(!LOCAL_INTERACTION.includes(action.interaction_mode))return fail('INVALID_LOCAL_INTERACTION_MODE',action);
    if(!DELIVERY.includes(delivery_mode))return fail('INVALID_DELIVERY_MODE',action);
    if(!PR10_BEHAVIOR.includes(action.behavior_state))return fail('PR10_UNSUPPORTED_BEHAVIOR_STATE:'+String(action.behavior_state||''),action);
    if(action.ambient_action!=null&&!PR10_AMBIENT.includes(action.ambient_action))return fail('PR10_UNSUPPORTED_AMBIENT_ACTION:'+String(action.ambient_action),action);

    if(action.interaction_mode==='SILENT'&&delivery_mode!=='NONE')return fail('SILENT_REQUIRES_NO_DELIVERY',action);
    if(action.interaction_mode!=='SILENT'&&action.interaction_mode!=='LISTEN'&&delivery_mode==='NONE')return fail('ACTIVE_INTERACTION_REQUIRES_DELIVERY_MODE',action);

    const prInteraction=delivery_mode==='NONE'?'SILENT':delivery_mode;
    const out={
      character_id:action.character_id,
      role:action.role,
      relation_state:action.relation_state,
      behavior_state:action.behavior_state,
      interaction_mode:prInteraction
    };
    for(const k of ['ambient_action','dialogue_intent','hint_level','target','gesture_intent','equipment_intent','enter_style','exit_style','priority','duration','cooldown_after']){
      if(action[k]!==undefined)out[k]=action[k];
    }

    return Object.freeze({
      ok:true,
      reason:null,
      canonical_action:Object.freeze({...action,delivery_mode}),
      pr10_command:Object.freeze(out),
      semantic_interaction_mode:action.interaction_mode,
      delivery_mode
    });
  }

  return Object.freeze({VERSION,LOCAL_INTERACTION,DELIVERY,PR10_BEHAVIOR,PR10_AMBIENT,toPr10});
});
