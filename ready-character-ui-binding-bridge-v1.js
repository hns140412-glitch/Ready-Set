(function(root,factory){
  const api=factory(
    typeof module!=='undefined'&&module.exports?require('./ready-character-ui-binding-planner-v1.js'):root.TakyCharacterUIBindingPlanner
  );
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root){
    root.TakyCharacterUIBindingBridge=api;
    if(root.addEventListener&&root.CustomEvent){
      root.addEventListener('taky:character-view-model',function(event){
        const detail=event&&event.detail;
        const result=api.accept(detail,detail&&detail.surface);
        if(result.skipped===true) return;
        root.dispatchEvent(new root.CustomEvent(
          result.ok?'taky:character-ui-binding-plan':'taky:character-ui-binding-rejected',
          {detail:result.ok?result.plan:result}
        ));
      });
    }
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(planner){
  'use strict';
  function accept(viewModel,surface){
    if(viewModel&&viewModel.semantic_only===true)return {ok:true,skipped:true,reason:'SEMANTIC_ONLY_NO_VISUAL_BINDING'};
    if(!planner||typeof planner.plan!=='function')return {ok:false,reason:'BINDING_PLANNER_UNAVAILABLE'};
    const plan=planner.plan(viewModel,surface||null);
    if(!plan||plan.ok!==true)return {ok:false,reason:plan?.reason||'BINDING_PLAN_REJECTED'};
    return {ok:true,plan:Object.freeze({...plan,dom_mutation_allowed:false,asset_generation_allowed:false})};
  }
  return Object.freeze({
    version:'TAKY_CHARACTER_UI_BINDING_EVENT_BRIDGE_V1',
    accept,
    inputEvent:'taky:character-view-model',
    outputEvent:'taky:character-ui-binding-plan',
    rejectEvent:'taky:character-ui-binding-rejected',
    mutatesDOM:false,
    mutatesProductionState:false,
    generatesArt:false
  });
});
