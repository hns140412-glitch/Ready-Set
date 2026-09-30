(function(root,factory){
  const api=factory(
    typeof module!=='undefined'&&module.exports?require('./ready-scene-policy-adapter-v1.js'):root.TakyAppScenePolicy
  );
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.TakyCharacterRuntimeAdapter=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(scenePolicy){
  'use strict';
  const APP='READY_SET';
  function consume(plan={}){
    if(!plan||plan.pass!==true)return {ok:false,reason:'SCENE_PLAN_INVALID'};
    if(plan.generation_allowed!==false)return {ok:false,reason:'GENERATION_PATH_FORBIDDEN'};
    if(plan.asset_selection_allowed!==false)return {ok:false,reason:'CENTRAL_PLAN_SELECTED_ASSET_DIRECTLY'};
    const bound=scenePolicy.bind({
      scene_id:plan.scene_id||null,
      foreground_character_id:plan.foreground_character_id||null,
      speaking_order:Array.isArray(plan.speaking_order)?[...plan.speaking_order]:[],
      visible_order:Array.isArray(plan.visible_order)?[...plan.visible_order]:[],
      characters:Array.isArray(plan.characters)?plan.characters.map(c=>({
        character_id:c.character_id,
        visual_id:c.visual_id,
        presence_role:c.presence_role,
        relationship_state:c.relationship_state,
        action:c.action,
        dialogue_level:c.dialogue_level,
        required_roles:Array.isArray(c.required_roles)?[...c.required_roles]:[],
        runtime_eligible:c.runtime_eligible===true
      })):[]
    });
    if(bound.characters.some(c=>!c.runtime_eligible))return {ok:false,reason:'INELIGIBLE_CHARACTER_IN_PLAN'};
    return Object.freeze({
      ok:true,
      app_id:APP,
      scene_policy_id:bound.scene_policy_id,
      scene_id:bound.scene_id,
      foreground_character_id:bound.foreground_character_id,
      speaking_order:Object.freeze(bound.speaking_order),
      visible_order:Object.freeze(bound.visible_order),
      characters:Object.freeze(bound.characters.map(Object.freeze)),
      max_visible:bound.max_visible,
      max_speaking:bound.max_speaking,
      design_gate_required:true,
      approved_asset_resolution_required:true,
      runtime_mutation_allowed:false,
      asset_generation_allowed:false
    });
  }
  return Object.freeze({APP,consume,mutatesProductionState:false,selectsAssetPath:false,generatesArt:false});
});
