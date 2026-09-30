(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.TakyAppScenePolicy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const POLICY=Object.freeze({
    schema:'TAKY_APP_SCENE_POLICY_ADAPTER_V1',
    app_id:'READY_SET',
    policy_id:'READY_SCENE_POLICY_V1',
    max_visible:2,
    max_speaking:1,
    role_priority:Object.freeze(['CHAPTER_OWNER','MAIN','GUEST','ACTING_CREW','AMBIENT']),
    asset_generation_allowed:false,
    unapproved_member_policy:'EXCLUDE',
    design_gate_required:true,
    runtime_eligibility_required:true,
    fallback_scope:'SAME_CHARACTER_APPROVED_ONLY'
  });
  function policy(){return POLICY;}
  function bind(scene={}){
    return Object.freeze({
      ...scene,
      scene_policy_id:POLICY.policy_id,
      max_visible:POLICY.max_visible,
      max_speaking:POLICY.max_speaking,
      role_priority:POLICY.role_priority,
      runtime_eligibility_required:true,
      asset_generation_allowed:false,
      design_gate_required:true
    });
  }
  return Object.freeze({
    POLICY,policy,bind,
    choosesCharacters:false,
    selectsAssets:false,
    generatesArt:false
  });
});
