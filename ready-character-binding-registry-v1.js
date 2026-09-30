(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.TakyCharacterBindingRegistry=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const REGISTRY=Object.freeze({
    schema:'TAKY_UI_BINDING_CONTRACT_V1',
    app_id:'READY_SET',
    slots:Object.freeze([
  {
    "slot_id": "mission-guide",
    "surface": "existing mission/guide presentation",
    "allowed_presence_roles": [
      "MAIN",
      "CHAPTER_OWNER"
    ],
    "approved_only": true,
    "design_gate_required": true,
    "allow_generation": false
  },
  {
    "slot_id": "ambient-companion",
    "surface": "existing scene companion area",
    "allowed_presence_roles": [
      "GUEST",
      "ACTING_CREW",
      "AMBIENT"
    ],
    "approved_only": true,
    "design_gate_required": true,
    "allow_generation": false
  }
].map(x=>Object.freeze(x)))
  });
  function registry(){return REGISTRY;}
  return Object.freeze({REGISTRY,registry,createsNewUISlot:false,generatesArt:false});
});
