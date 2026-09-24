(function(root){
  'use strict';
  function clean(v){return String(v??'').trim();}
  function session(){
    return root.ReadyFamilySession?.current?.()||{authenticated:false,member_id:null,family_id:null,role:'CHILD'};
  }
  function familyId(){
    const s=session();
    return s.authenticated===true?clean(s.family_id)||null:null;
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
  function familyStorageKey(baseKey){
    const base=clean(baseKey);
    const id=familyId();
    return id?`${base}::family::${encodeURIComponent(id)}`:base;
  }
  function syncScope(scope){
    const base=clean(scope);
    const id=memberId();
    return id?`member:${encodeURIComponent(id)}:${base}`:base;
  }
  function familySyncScope(scope){
    const base=clean(scope);
    const id=familyId();
    return id?`family:${encodeURIComponent(id)}:${base}`:base;
  }
  function parseSyncScope(value){
    const text=clean(value);
    const member=/^member:([^:]+):(.+)$/.exec(text);
    if(member){
      let id=member[1];try{id=decodeURIComponent(id)}catch{}
      return {member_id:id,family_id:null,scope:member[2]};
    }
    const family=/^family:([^:]+):(.+)$/.exec(text);
    if(family){
      let id=family[1];try{id=decodeURIComponent(id)}catch{}
      return {member_id:null,family_id:id,scope:family[2]};
    }
    return {member_id:null,family_id:null,scope:text};
  }
  root.ReadyMemberScope=Object.freeze({
    version:'READY_MEMBER_SCOPE_V01',
    session,familyId,memberId,storageKey,familyStorageKey,syncScope,familySyncScope,parseSyncScope
  });
})(typeof globalThis!=='undefined'?globalThis:this);
