(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.TakyCrewLiveRuntime=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const APP='READY_SET';
  function legacyCharacter(id,opt={}){
    const role=opt.role||'MAIN', action=opt.action||'IDLE', dialogue=opt.dialogue||'SHORT';
    const identity=globalThis.TakyCrewIdentityBridge?.resolve?.(id)||{character_id:'LEGACY_'+APP+':'+String(id||'guide'),visual_id:'LEGACY_'+APP+':'+String(id||'guide')};
    const cid=identity.character_id, visualId=identity.visual_id;
    const relationshipState=opt.relationshipState||globalThis.TakyCrewEvidenceRuntime?.relationship?.(globalThis.localStorage,cid)||'KNOWN';
    return Object.freeze({character_id:cid,visual_id:visualId,presence_role:role,relationship_state:relationshipState,action,dialogue_level:dialogue,required_roles:[],runtime_eligible:false,utterance:String(opt.utterance||''),evidence_ref:opt.evidenceRef||null,intervention_reason:opt.reason||null});
  }
  function build(args={}){
    const list=Array.isArray(args.characters)?args.characters:[];
    return Object.freeze({pass:true,schema:'TAKY_CHARACTER_SCENE_PLAN_V1',target_app:APP,scene_id:args.sceneId||args.surface||'scene',surface:args.surface||null,semantic_only:true,generation_allowed:false,asset_selection_allowed:false,foreground_character_id:args.foregroundId||list[0]?.character_id||null,speaking_order:Object.freeze(Array.isArray(args.speakingOrder)?args.speakingOrder:list.filter(c=>c.dialogue_level!=='SILENT').map(c=>c.character_id)),visible_order:Object.freeze(Array.isArray(args.visibleOrder)?args.visibleOrder:list.map(c=>c.character_id)),characters:Object.freeze(list)});
  }
  function emit(args={}){
    const plan=build(args);
    if(typeof globalThis!=='undefined'&&globalThis.dispatchEvent&&globalThis.CustomEvent) globalThis.dispatchEvent(new globalThis.CustomEvent('taky:character-scene-plan',{detail:plan}));
    return plan;
  }
  return Object.freeze({APP,legacyCharacter,build,emit,semanticOnly:true,generatesArt:false,selectsAssets:false});
});
