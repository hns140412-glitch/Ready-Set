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
    "slot_id": "home-primary",
    "surface": "home",
    "selector": "#homeGuidePortrait",
    "text_selector": "#homeGuideLine",
    "allowed_presence_roles": [
      "MAIN",
      "CHAPTER_OWNER"
    ],
    "approved_only": true,
    "design_gate_required": true,
    "allow_generation": false
  },
  {
    "slot_id": "focus-primary",
    "surface": "focus",
    "selector": "#focusGuideMini",
    "allowed_presence_roles": [
      "MAIN",
      "CHAPTER_OWNER"
    ],
    "approved_only": true,
    "design_gate_required": true,
    "allow_generation": false
  },
  {
    "slot_id": "record-primary",
    "surface": "record",
    "selector": "#recordGuidePortrait",
    "text_selector": "#guideDialogue",
    "allowed_presence_roles": [
      "MAIN",
      "CHAPTER_OWNER"
    ],
    "approved_only": true,
    "design_gate_required": true,
    "allow_generation": false
  },
  {
    "slot_id": "record-duo-main",
    "surface": "record-review",
    "selector": "#duoMainGuide",
    "text_selector": "#duoText",
    "allowed_presence_roles": [
      "MAIN",
      "CHAPTER_OWNER"
    ],
    "approved_only": true,
    "design_gate_required": true,
    "allow_generation": false
  },
  {
    "slot_id": "record-duo-guest",
    "surface": "record-review",
    "selector": "#duoGuestGuide",
    "allowed_presence_roles": [
      "GUEST",
      "ACTING_CREW"
    ],
    "approved_only": true,
    "design_gate_required": true,
    "allow_generation": false
  },
  {
    "slot_id": "result-primary",
    "surface": "result",
    "selector": "#resultGuidePortrait",
    "text_selector": "#resultLine",
    "allowed_presence_roles": [
      "MAIN",
      "CHAPTER_OWNER"
    ],
    "approved_only": true,
    "design_gate_required": true,
    "allow_generation": false
  },
  {
    "slot_id": "result-guest",
    "surface": "result",
    "selector": "#resultGuestPortrait",
    "allowed_presence_roles": [
      "GUEST",
      "ACTING_CREW"
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
