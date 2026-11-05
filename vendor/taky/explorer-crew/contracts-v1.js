(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.TakyExplorerCrewContracts=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='EXPLORER_CREW_CONTRACTS_V1';
  const ROLES=Object.freeze([
    'MAIN','GUEST','AMBIENT','CHAPTER_OWNER','ACTING_CREW'
  ]);
  const RELATION_STATES=Object.freeze([
    'UNSEEN','FIRST_ENCOUNTER','KNOWN','AFFINITY_BUILDING',
    'COMPANION_AVAILABLE','COMPANION','MAIN_COMPANION'
  ]);
  const BEHAVIOR_STATES=Object.freeze([
    'AMBIENT','PEEK','OBSERVE','TALK','THINK','IDEA',
    'GUIDE','LISTEN','REACTION','COMPLETE','HIDE'
  ]);
  const AMBIENT_ACTIONS=Object.freeze([
    'READ_BOOK','READ_MAP','WRITE_NOTE','CHECK_COMPASS',
    'ORGANIZE_BAG','USE_MAGNIFIER','USE_RADIO','REST','IDLE'
  ]);
  const INTERACTION_MODES=Object.freeze(['SILENT','TALK','LISTEN','GUIDE']);
  const APPEARANCE_MODES=Object.freeze([
    'FULL_FIELD','SIDE_COMPANION','PEEK_EDGE','AMBIENT_BACKGROUND',
    'RADIO_ONLY','DUO','GROUP_AMBIENT'
  ]);
  const HINT_LEVELS=Object.freeze(['H0','H1','H2','H3']);
  const PIPELINE_ORDER=Object.freeze([
    'CONTEXT','ENCOUNTER','RELATION','MEMORY','CREW','BEHAVIOR',
    'ARBITRATION','DIALOGUE','SCENE','ASSET','RENDER',
    'INTERACTION','STATE_UPDATE','VALIDATION','SUMMARY'
  ]);

  const clean=v=>typeof v==='string'?v.trim():'';
  const oneOf=(v,list)=>list.includes(v);

  function validateSemanticAction(x={}){
    const errors=[];
    if(!clean(x.character_id))errors.push('CHARACTER_ID_REQUIRED');
    if(!oneOf(x.role,ROLES))errors.push('INVALID_ROLE');
    if(!oneOf(x.relation_state,RELATION_STATES))errors.push('INVALID_RELATION_STATE');
    if(!oneOf(x.behavior_state,BEHAVIOR_STATES))errors.push('INVALID_BEHAVIOR_STATE');
    if(!oneOf(x.interaction_mode,INTERACTION_MODES))errors.push('INVALID_INTERACTION_MODE');
    if(x.ambient_action!=null&&!oneOf(x.ambient_action,AMBIENT_ACTIONS))errors.push('INVALID_AMBIENT_ACTION');
    if(x.hint_level!=null&&!oneOf(x.hint_level,HINT_LEVELS))errors.push('INVALID_HINT_LEVEL');
    return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors)});
  }
  function validateSceneCommand(x={}){
    const errors=[];
    if(!oneOf(x.appearance_mode,APPEARANCE_MODES))errors.push('INVALID_APPEARANCE_MODE');
    if(x.preferred_anchor!=null&&!clean(x.preferred_anchor))errors.push('INVALID_ANCHOR');
    return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors)});
  }

  function validateResolvedVisual(x={}){
    const errors=[];
    if(!clean(x.character_id))errors.push('CHARACTER_ID_REQUIRED');
    if(!clean(x.visual_id))errors.push('VISUAL_ID_REQUIRED');
    if(!clean(x.source_sha))errors.push('SOURCE_SHA_REQUIRED');
    else if(/UNRESOLVED|PENDING|PLACEHOLDER|LEGACY_STATIC_CUTOUT_SOURCE_SHA/i.test(x.source_sha))errors.push('SOURCE_SHA_NOT_CANONICAL');
    if(!clean(x.asset_status))errors.push('ASSET_STATUS_REQUIRED');
    return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors)});
  }

  return Object.freeze({
    VERSION,ROLES,RELATION_STATES,BEHAVIOR_STATES,AMBIENT_ACTIONS,
    INTERACTION_MODES,APPEARANCE_MODES,HINT_LEVELS,PIPELINE_ORDER,
    validateSemanticAction,validateSceneCommand,validateResolvedVisual
  });
});
