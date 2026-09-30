(function(root,factory){
  const api=factory(
    typeof module!=='undefined'&&module.exports?require('./ready-character-binding-registry-v1.js'):root.TakyCharacterBindingRegistry
  );
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.TakySurfaceScenePolicy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(bindingRegistry){
  'use strict';
  function derive(){
    const reg=bindingRegistry&&bindingRegistry.registry?bindingRegistry.registry():null;
    if(!reg||!Array.isArray(reg.slots))return {ok:false,reason:'BINDING_REGISTRY_INVALID'};
    const surfaces={};
    for(const s of reg.slots){
      if(!s.surface)return {ok:false,reason:'SURFACE_MISSING'};
      const b=surfaces[s.surface]||(surfaces[s.surface]={slot_ids:[],roles:new Set()});
      b.slot_ids.push(s.slot_id);
      for(const r of s.allowed_presence_roles||[]) b.roles.add(r);
    }
    const out={};
    for(const [surface,b] of Object.entries(surfaces)){
      out[surface]=Object.freeze({
        schema:'TAKY_SURFACE_SCENE_POLICY_V1',
        app_id:reg.app_id,
        surface,
        max_visible:b.slot_ids.length,
        max_speaking:1,
        slot_ids:Object.freeze([...b.slot_ids]),
        allowed_presence_roles:Object.freeze([...b.roles].sort()),
        asset_generation_allowed:false,
        creates_ui_slots:false,
        design_gate_required:true
      });
    }
    return Object.freeze({ok:true,app_id:reg.app_id,surfaces:Object.freeze(out)});
  }
  function forSurface(surface){
    const d=derive();
    if(!d.ok)return d;
    const p=d.surfaces[surface];
    return p?{ok:true,policy:p}:{ok:false,reason:'SURFACE_NOT_REGISTERED'};
  }
  return Object.freeze({derive,forSurface,createsUISlots:false,generatesArt:false});
});
