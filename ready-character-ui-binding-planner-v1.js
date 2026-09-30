(function(root,factory){
  const api=factory(
    typeof module!=='undefined'&&module.exports?require('./ready-character-binding-registry-v1.js'):root.TakyCharacterBindingRegistry
  );
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.TakyCharacterUIBindingPlanner=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(bindingRegistry){
  'use strict';
  function plan(viewModel={},surface){
    const reg=bindingRegistry&&bindingRegistry.registry?bindingRegistry.registry():null;
    if(!reg)return {ok:false,reason:'BINDING_REGISTRY_UNAVAILABLE'};
    if(!viewModel||viewModel.ok!==true)return {ok:false,reason:'VIEW_MODEL_INVALID'};
    if(viewModel.app_id!==reg.app_id)return {ok:false,reason:'APP_BINDING_MISMATCH'};
    if(viewModel.asset_generation_allowed!==false)return {ok:false,reason:'GENERATION_PATH_FORBIDDEN'};
    const candidates=Array.isArray(viewModel.characters)?viewModel.characters:[];
    const slots=(reg.slots||[]).filter(s=>!surface||s.surface===surface);
    const used=new Set(),assignments=[],rejected=[];
    for(const c of candidates){
      const slot=slots.find(s=>!used.has(s.slot_id)&&Array.isArray(s.allowed_presence_roles)&&s.allowed_presence_roles.includes(c.presence_role));
      if(!slot){rejected.push({character_id:c.character_id,reason:'NO_COMPATIBLE_SLOT'});continue;}
      if(c.runtime_eligible!==true){rejected.push({character_id:c.character_id,reason:'RUNTIME_INELIGIBLE'});continue;}
      used.add(slot.slot_id);
      assignments.push(Object.freeze({
        slot_id:slot.slot_id,surface:slot.surface,selector:slot.selector,
        name_selector:slot.name_selector||null,text_selector:slot.text_selector||null,
        character_id:c.character_id,visual_id:c.visual_id,presence_role:c.presence_role,
        action:c.action,dialogue_level:c.dialogue_level
      }));
    }
    if(assignments.length===0)return {ok:false,reason:'NO_BINDABLE_CHARACTER',rejected:Object.freeze(rejected)};
    return Object.freeze({
      ok:true,app_id:reg.app_id,scene_id:viewModel.scene_id||null,surface:surface||null,
      assignments:Object.freeze(assignments),rejected:Object.freeze(rejected),
      partial_binding:rejected.length>0,
      dom_mutation_allowed:false,asset_resolution_required:true,
      design_gate_required:true,asset_generation_allowed:false
    });
  }
  return Object.freeze({plan,mutatesDOM:false,selectsAssetPath:false,generatesArt:false});
});
