(function(root,factory){
  'use strict';
  const api=factory(root?.TakyExplorerCrewPersonalityRegistry,root?.TakyExplorerCrewBehaviorPatterns);
  if(typeof module!=='undefined'&&module.exports){
    module.exports=factory(require('./personality-registry-v2.js'),require('./behavior-patterns-v1.js'));
  }else if(root)root.TakyExplorerCrewPersonalityBehavior=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(registry,patterns){
  'use strict';
  const VERSION='EXPLORER_CREW_PERSONALITY_BEHAVIOR_V1';
  const FOCUS_SAFE=new Set(['READ_BOOK','READ_MAP','WRITE_NOTE','CHECK_COMPASS','USE_MAGNIFIER','REST','IDLE']);

  function chooseAmbient(character_id,{focus=false}={}){
    const p=registry?.get?.(character_id);
    const pref=p?.behavior_bias?.preferred_ambient_actions||[];
    const valid=(patterns?.AMBIENT_ACTIONS||[]);
    for(const action of pref){
      if(!valid.includes(action))continue;
      if(focus&&!FOCUS_SAFE.has(action))continue;
      return action;
    }
    return focus?'READ_BOOK':'IDLE';
  }

  function decide(character_id,context={}){
    const base=patterns.decide(context);
    if(base.behavior_state!=='AMBIENT')return Object.freeze({...base,character_id});
    return Object.freeze({
      ...base,
      character_id,
      ambient_action:chooseAmbient(character_id,{focus:context.focus_state==='FOCUS'||context.focus_state==='FOCUS_ACTIVE'}),
      personality_source:registry?.get?.(character_id)?.keywords_provenance||null
    });
  }

  return Object.freeze({VERSION,chooseAmbient,decide});
});
