(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.TakyCrewIdentityBridge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const APP='READY_SET';
  function legacy(localId){
    const id='LEGACY_'+APP+':'+String(localId||'guide');
    return Object.freeze({character_id:id,visual_id:id,status:'LEGACY_COMPAT_UNMAPPED',authority_ref:null,history_reset_allowed:false});
  }
  function resolve(localId,map){
    const source=map||(typeof globalThis!=='undefined'?globalThis.TAKY_CREW_IDENTITY_MAP:null)||{};
    const key=APP+':'+String(localId||'guide');
    const x=source[key];
    if(!x||x.approved!==true||!x.authority_ref||!x.character_id||!x.visual_id)return legacy(localId);
    return Object.freeze({character_id:String(x.character_id),visual_id:String(x.visual_id),status:'CANONICAL_APPROVED_MAPPING',authority_ref:String(x.authority_ref),history_reset_allowed:false});
  }
  return Object.freeze({APP,resolve,legacy,automaticMapping:false,historyResetAllowed:false});
});
