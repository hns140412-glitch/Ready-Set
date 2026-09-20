(() => {
  'use strict';

  const VERSION='0.2.0';
  const ROLES=new Set(['CHILD','PARENT']);
  let sessionRevision=0;
  let session={
    state:'ANONYMOUS_LOCAL',
    authenticated:false,
    family_id:null,
    member_id:null,
    role:'CHILD',
    session_id:null,
    issued_at:null,
    expires_at:null,
    source:'LOCAL_DEFAULT'
  };

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function nowMs(){return Date.now();}
  function isExpired(s){
    if(!s.expires_at)return false;
    const t=Date.parse(s.expires_at);
    return Number.isFinite(t)&&t<=nowMs();
  }
  function normalize(input={}){
    const role=String(input.role||'').trim().toUpperCase();
    const authenticated=input.authenticated===true;
    const familyId=String(input.family_id||'').trim()||null;
    const memberId=String(input.member_id||'').trim()||null;
    const sessionId=String(input.session_id||'').trim()||null;
    const validRole=ROLES.has(role)?role:null;
    const candidate={
      state:authenticated?'AUTHENTICATED':'ANONYMOUS_LOCAL',
      authenticated,
      family_id:familyId,
      member_id:memberId,
      role:validRole||'CHILD',
      session_id:sessionId,
      issued_at:input.issued_at||null,
      expires_at:input.expires_at||null,
      source:String(input.source||'AUTH_BOOTSTRAP')
    };
    if(authenticated&&(!familyId||!memberId||!sessionId||!validRole)) return null;
    if(isExpired(candidate)) return null;
    return candidate;
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
    session={
      state:'ANONYMOUS_LOCAL',authenticated:false,family_id:null,member_id:null,role:'CHILD',
      session_id:null,issued_at:null,expires_at:null,source:'LOCAL_DEFAULT'
    };
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
  function isParent(){const s=current();return s.authenticated===true&&s.role==='PARENT';}
  function isChild(){const s=current();return s.role==='CHILD';}
  function requireRole(required){
    const want=String(required||'').toUpperCase();
    const s=current();
    if(want==='CHILD' && s.role==='CHILD') return {ok:true,session:s};
    if(want==='PARENT' && isParent()) return {ok:true,session:s};
    return {ok:false,reason:want==='PARENT'?'PARENT_AUTH_REQUIRED':'ROLE_NOT_ALLOWED',session:s};
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