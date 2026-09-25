(() => {
  'use strict';

  const VERSION='0.3.0';
  const FamilyContext=globalThis.TakyFamilyContext;
  if(!FamilyContext?.normalize || !FamilyContext?.requireRole) throw new Error('READY_FAMILY_CONTEXT_UNAVAILABLE');
  let sessionRevision=0;
  let session=FamilyContext.anonymousLocal({source:'LOCAL_DEFAULT'});

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function normalize(input={}){
    const checked=FamilyContext.validate(input);
    return checked.ok?checked.context:null;
  }

  function applyBootstrap(input={}){
    const next=normalize(input);
    if(!next||!next.authenticated) return {ok:false,reason:'INVALID_AUTH_BOOTSTRAP'};
    session=next;
    sessionRevision+=1;
    window.dispatchEvent(new CustomEvent('readyset-family-session',{detail:publicSession()}));
    return {ok:true,session:publicSession()};
  }

  async function hydrate(){
    const startedRevision=sessionRevision;
    try{
      const res=await fetch('/api/auth/session',{method:'GET',headers:{Accept:'application/json'},cache:'no-store',credentials:'same-origin'});
      const body=await res.json().catch(()=>({}));
      if(sessionRevision!==startedRevision){
        return {ok:true,reason:'HYDRATE_SUPERSEDED_BY_NEWER_SESSION',session:publicSession()};
      }
      if(!res.ok||!body?.session){clear();return {ok:false,reason:body?.reason||('AUTH_SESSION_HTTP_'+res.status),session:publicSession()};}
      return applyBootstrap({...body.session,source:'NETLIFY_IDENTITY_SESSION'});
    }catch(error){
      if(sessionRevision!==startedRevision){
        return {ok:true,reason:'HYDRATE_SUPERSEDED_BY_NEWER_SESSION',session:publicSession()};
      }
      return {ok:false,reason:String(error?.message||error),session:publicSession()};
    }
  }

  async function postAuth(path,payload){
    const res=await fetch(path,{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      credentials:'same-origin',
      body:JSON.stringify(payload||{})
    });
    const body=await res.json().catch(()=>({}));
    if(!res.ok)return {ok:false,reason:body?.reason||('AUTH_HTTP_'+res.status),status:res.status};
    return body;
  }

  async function login(input={}){
    const result=await postAuth('/api/auth/login',{email:String(input.email||'').trim(),password:String(input.password||'')});
    if(result.ok&&result.session)return applyBootstrap({...result.session,source:'NETLIFY_IDENTITY_LOGIN'});
    return result;
  }

  async function signup(input={}){
    return postAuth('/api/auth/signup',{email:String(input.email||'').trim(),password:String(input.password||''),name:String(input.name||'').trim()});
  }

  async function logout(){
    const result=await postAuth('/api/auth/logout',{});
    clear();
    return result;
  }

  async function linkChild(email){
    const result=await postAuth('/api/family/link-child',{email:String(email||'').trim()});
    return result;
  }

  function clear(){
    session=FamilyContext.anonymousLocal({source:'LOCAL_DEFAULT'});
    sessionRevision+=1;
    window.dispatchEvent(new CustomEvent('readyset-family-session',{detail:publicSession()}));
    return publicSession();
  }

  function publicSession(){
    const s=clone(session);
    return Object.freeze(s);
  }
  function current(){return publicSession();}
  function role(){return current().role;}
  function isParent(){return FamilyContext.requireRole(current(),'PARENT').ok===true;}
  function isChild(){return FamilyContext.requireRole(current(),'CHILD').ok===true;}
  function requireRole(required){
    const result=FamilyContext.requireRole(current(),required);
    return {ok:result.ok,reason:result.reason,session:current()};
  }
  const bootstrap=globalThis.__READY_AUTH_BOOTSTRAP__;
  const bootstrapAllowed=typeof location!=='undefined'&&['127.0.0.1','localhost'].includes(location.hostname);
  if(bootstrapAllowed&&bootstrap&&typeof bootstrap==='object') applyBootstrap(bootstrap);

  window.ReadyFamilySession=Object.freeze({
    version:VERSION,
    current,
    role,
    isParent,
    isChild,
    requireRole,
    hydrate,
    login,
    signup,
    logout,
    linkChild,
    clear
  });

  if(!(bootstrapAllowed&&bootstrap&&typeof bootstrap==='object')) hydrate().catch(()=>{});
})();