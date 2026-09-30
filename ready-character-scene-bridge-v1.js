(function(root,factory){
  const api=factory(
    typeof module!=='undefined'&&module.exports?require('./ready-character-runtime-adapter-v1.js'):root.TakyCharacterRuntimeAdapter
  );
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root){
    root.TakyCharacterSceneBridge=api;
    if(root.addEventListener&&root.CustomEvent){
      root.addEventListener('taky:character-scene-plan',function(event){
        const result=api.accept(event&&event.detail);
        if(result.ok){
          root.dispatchEvent(new root.CustomEvent('taky:character-view-model',{detail:result.view_model}));
        }else{
          root.dispatchEvent(new root.CustomEvent('taky:character-scene-rejected',{detail:result}));
        }
      });
    }
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(adapter){
  'use strict';
  function accept(plan){
    if(!adapter||typeof adapter.consume!=='function')return {ok:false,reason:'RUNTIME_ADAPTER_UNAVAILABLE'};
    const vm=adapter.consume(plan);
    if(!vm||vm.ok!==true)return {ok:false,reason:vm?.reason||'VIEW_MODEL_REJECTED'};
    return {ok:true,view_model:vm};
  }
  return Object.freeze({
    version:'TAKY_CHARACTER_SCENE_EVENT_BRIDGE_V1',
    accept,
    inputEvent:'taky:character-scene-plan',
    outputEvent:'taky:character-view-model',
    rejectEvent:'taky:character-scene-rejected',
    mutatesUI:false,
    mutatesProductionState:false,
    generatesArt:false
  });
});
