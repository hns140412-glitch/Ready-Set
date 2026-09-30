(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.TakyCharacterDOMBinder=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SHA=/^[a-f0-9]{64}$/i;
  function prepare(bindingPlan={},approvedAssets={},designGate={}){
    if(!bindingPlan||bindingPlan.ok!==true)return {ok:false,reason:'BINDING_PLAN_INVALID',operations:[]};
    if(bindingPlan.dom_mutation_allowed!==false)return {ok:false,reason:'BINDING_PLAN_AUTHORITY_INVALID',operations:[]};
    if(!designGate||designGate.pass!==true||!SHA.test(String(designGate.receipt_sha256||'')))
      return {ok:false,reason:'DESIGN_GATE_RECEIPT_REQUIRED',operations:[]};
    const operations=[];
    for(const a of bindingPlan.assignments||[]){
      const asset=approvedAssets[a.slot_id];
      if(!asset||asset.approval_status!=='APPROVED')return {ok:false,reason:'APPROVED_ASSET_RECEIPT_REQUIRED',slot_id:a.slot_id,operations:[]};
      if(String(asset.visual_id)!==String(a.visual_id))return {ok:false,reason:'VISUAL_ID_ASSET_MISMATCH',slot_id:a.slot_id,operations:[]};
      if(!SHA.test(String(asset.sha256||'')))return {ok:false,reason:'ASSET_SHA_INVALID',slot_id:a.slot_id,operations:[]};
      if(typeof asset.url!=='string'||!asset.url.trim())return {ok:false,reason:'ASSET_URL_REQUIRED',slot_id:a.slot_id,operations:[]};
      operations.push(Object.freeze({
        slot_id:a.slot_id,selector:a.selector,character_id:a.character_id,visual_id:a.visual_id,
        asset_url:asset.url,asset_sha256:asset.sha256,
        asset_pointer:asset.asset_pointer||null
      }));
    }
    if(!operations.length)return {ok:false,reason:'NO_OPERATIONS',operations:[]};
    return Object.freeze({ok:true,operations:Object.freeze(operations),design_gate_receipt_sha256:designGate.receipt_sha256});
  }
  function apply(doc,prepared){
    if(!prepared||prepared.ok!==true)return {ok:false,reason:'PREPARED_BINDING_REQUIRED',mutated:0};
    if(!doc||typeof doc.querySelector!=='function')return {ok:false,reason:'DOCUMENT_REQUIRED',mutated:0};
    const resolved=[];
    for(const op of prepared.operations){
      const el=doc.querySelector(op.selector);
      if(!el)return {ok:false,reason:'BINDING_TARGET_MISSING',selector:op.selector,mutated:0};
      resolved.push([el,op]);
    }
    for(const [el,op] of resolved){
      if(String(el.tagName||'').toUpperCase()==='IMG') el.src=op.asset_url;
      else if(el.style) el.style.backgroundImage='url("'+String(op.asset_url).replace(/"/g,'%22')+'")';
      if(el.dataset){
        el.dataset.characterId=String(op.character_id||'');
        el.dataset.visualId=String(op.visual_id||'');
        el.dataset.assetSha256=String(op.asset_sha256||'');
      }
    }
    return {ok:true,mutated:resolved.length};
  }
  return Object.freeze({prepare,apply,automaticActivation:false,generatesArt:false,acceptsUnapprovedAsset:false});
});
