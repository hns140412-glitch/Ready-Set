(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.TakyApprovedAssetResolver=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SHA=/^[a-f0-9]{64}$/i;
  function resolve(pointer,registry,expectedVisualId){
    if(typeof pointer!=='string'||!pointer.trim())return {ok:false,reason:'POINTER_MISSING'};
    const assets=Array.isArray(registry?.assets)?registry.assets:null;
    if(!assets)return {ok:false,reason:'REGISTRY_INVALID'};
    const row=assets.find(x=>x&&x.asset_pointer===pointer);
    if(!row)return {ok:false,reason:'POINTER_NOT_FOUND'};
    if(row.approval_status!=='APPROVED')return {ok:false,reason:'ASSET_NOT_APPROVED'};
    if(expectedVisualId&&String(row.visual_id)!==String(expectedVisualId))return {ok:false,reason:'VISUAL_ID_MISMATCH'};
    if(!SHA.test(String(row.sha256||'')))return {ok:false,reason:'ASSET_SHA_INVALID'};
    if(typeof row.runtime_url!=='string'||!row.runtime_url.trim())return {ok:false,reason:'RUNTIME_URL_MISSING'};
    return Object.freeze({
      ok:true,
      asset_pointer:pointer,
      asset_id:row.asset_id||null,
      visual_id:row.visual_id,
      sha256:row.sha256,
      url:row.runtime_url,
      approval_status:'APPROVED',
      producer_pointer:row.producer_pointer||null,
      generation_allowed:false
    });
  }
  function resolveAssignments(bindingPlan,registry,pointerMap={}){
    if(!bindingPlan||bindingPlan.ok!==true)return {ok:false,reason:'BINDING_PLAN_INVALID'};
    const out={};
    for(const a of bindingPlan.assignments||[]){
      const pointer=pointerMap[a.slot_id];
      const resolved=resolve(pointer,registry,a.visual_id);
      if(!resolved.ok)return {ok:false,reason:resolved.reason,slot_id:a.slot_id};
      out[a.slot_id]=resolved;
    }
    return {ok:true,approved_assets:out};
  }
  return Object.freeze({resolve,resolveAssignments,generatesArt:false,acceptsUnapproved:false});
});
