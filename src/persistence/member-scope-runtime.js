(function(root){
  'use strict';
  function clean(v){return String(v??'').trim();}
  function session(){
    return root.ReadyFamilySession?.current?.()||{authenticated:false,member_id:null,family_id:null,role:'CHILD'};
  }
  function memberId(){
    const s=session();
    return s.authenticated===true?clean(s.member_id)||null:null;
  }
  function storageKey(baseKey){
    const base=clean(baseKey);
    const id=memberId();
    return id?`${base}::member::${encodeURIComponent(id)}`:base;
  }
  function syncScope(scope){
    const base=clean(scope);
    const id=memberId();
    return id?`member:${encodeURIComponent(id)}:${base}`:base;
  }
  function parseSyncScope(value){
    const text=clean(value);
    const match=/^member:([^:]+):(.+)$/.exec(text);
    if(!match)return {member_id:null,scope:text};
    let id=match[1];
    try{id=decodeURIComponent(id)}catch{}
    return {member_id:id,scope:match[2]};
  }
  root.ReadyMemberScope=Object.freeze({
    version:'READY_MEMBER_SCOPE_V01',
    session,memberId,storageKey,syncScope,parseSyncScope
  });
})(typeof globalThis!=='undefined'?globalThis:this);
