(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root){ root.TakyCrewDialogueConsumer=api; if(root.addEventListener) root.addEventListener('taky:character-view-model',event=>api.apply(event&&event.detail,root.document)); }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SURFACES=Object.freeze({"home":"#homeGuideLine","recording":"#guideDialogue","recording-review":"#duoText","result":"#resultLine"});
  function apply(vm={},doc){
    if(!vm||vm.ok!==true||vm.semantic_only!==true)return {ok:false,reason:'SEMANTIC_VIEW_MODEL_REQUIRED'};
    if(vm.app_id!=='READY_SET')return {ok:false,reason:'APP_MISMATCH'};
    const surface=vm.surface||vm.scene_id, selector=SURFACES[surface];
    if(!selector)return {ok:false,reason:'NO_DIALOGUE_SURFACE'};
    if(!doc||typeof doc.querySelector!=='function')return {ok:false,reason:'DOCUMENT_REQUIRED'};
    const speaking=Array.isArray(vm.speaking_order)?vm.speaking_order:[];
    const speaker=(vm.characters||[]).find(c=>speaking.includes(c.character_id)&&c.dialogue_level!=='SILENT')||(vm.characters||[]).find(c=>c.dialogue_level!=='SILENT');
    if(!speaker||!speaker.utterance)return {ok:false,reason:'NO_SPEAKING_UTTERANCE'};
    const el=doc.querySelector(selector); if(!el)return {ok:false,reason:'DIALOGUE_TARGET_MISSING',selector};
    el.textContent=speaker.utterance;
    return {ok:true,selector,character_id:speaker.character_id,dialogue_level:speaker.dialogue_level,action:speaker.action};
  }
  return Object.freeze({SURFACES,apply,changesVisualAsset:false,generatesArt:false});
});
