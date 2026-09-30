(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.TakyCharacterRegistryState=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY='taky.character.registry.state.v1';
  function initial(){return Object.freeze({active:null,candidate:null,rollback:null});}
  function sanitize(x){
    if(!x||typeof x!=='object')return initial();
    const clean=p=>p&&typeof p==='object'&&typeof p.pointer==='string'&&p.pointer?{
      pointer:p.pointer,version:Number.isInteger(p.version)?p.version:0,content_sha256:String(p.content_sha256||'')
    }:null;
    return Object.freeze({active:clean(x.active),candidate:clean(x.candidate),rollback:clean(x.rollback)});
  }
  function stage(state,candidate){
    const s=sanitize(state);
    if(!candidate||typeof candidate.pointer!=='string'||!candidate.pointer)return {ok:false,reason:'CANDIDATE_INVALID',state:s};
    const c={pointer:candidate.pointer,version:Number(candidate.version||0),content_sha256:String(candidate.content_sha256||'')};
    if(s.active&&c.version<s.active.version)return {ok:false,reason:'REGISTRY_DOWNGRADE_FORBIDDEN',state:s};
    if(s.active&&c.version===s.active.version&&c.content_sha256!==s.active.content_sha256)return {ok:false,reason:'SAME_VERSION_CONTENT_DRIFT',state:s};
    return {ok:true,state:Object.freeze({...s,candidate:Object.freeze(c)})};
  }
  function promote(state,validation){
    const s=sanitize(state);
    if(!s.candidate)return {ok:false,reason:'NO_CANDIDATE',state:s};
    if(!validation||validation.pass!==true)return {ok:true,action:'KEEP_ACTIVE',state:Object.freeze({...s,candidate:null})};
    return {ok:true,action:'PROMOTE',state:Object.freeze({active:s.candidate,candidate:null,rollback:s.active})};
  }
  function rollback(state){
    const s=sanitize(state);
    if(!s.rollback)return {ok:false,reason:'NO_ROLLBACK',state:s};
    return {ok:true,action:'ROLLBACK',state:Object.freeze({active:s.rollback,candidate:null,rollback:s.active})};
  }
  function load(storage){
    try{return sanitize(JSON.parse(storage.getItem(KEY)||'null'));}catch{return initial();}
  }
  function save(storage,state){storage.setItem(KEY,JSON.stringify(sanitize(state)));return true;}
  return Object.freeze({KEY,initial,sanitize,stage,promote,rollback,load,save,automaticPromotion:false});
});
