(() => {
  'use strict';

  const VERSION='0.3.0';
  const ROLES=new Set(['CHILD','PARENT']);
  let sessionRevision=0;
  let session={
    state:'ANONYMOUS_LOCAL',
    authenticated:false,
    account_id:null,
    family_id:null,
    membership_id:null,
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
    const accountId=String(input.account_id||input.member_id||'').trim()||null;
    const familyId=String(input.family_id||'').trim()||null;
    const membershipId=String(input.membership_id||'').trim()||null;
    const memberId=String(input.member_id||'').trim()||null;
    const sessionId=String(input.session_id||'').trim()||null;
    const validRole=ROLES.has(role)?role:null;
    const candidate={
      state:authenticated?(familyId&&validRole?'AUTHENTICATED':'AUTHENTICATED_UNBOUND'):'ANONYMOUS_LOCAL',
      authenticated,
      account_id:accountId,
      family_id:familyId,
      membership_id:membershipId,
      member_id:memberId,
      role:authenticated?validRole:(validRole||'CHILD'),
      session_id:sessionId,
      issued_at:input.issued_at||null,
      expires_at:input.expires_at||null,
      relationship:String(input.relationship||'').trim().toUpperCase()||null,
      membership_status:String(input.membership_status||'').trim().toUpperCase()||null,
      auth_provider:String(input.auth_provider||'').trim().toUpperCase()||null,
      source:String(input.source||'AUTH_BOOTSTRAP')
    };
    if(authenticated&&(!accountId||!memberId||!sessionId)) return null;
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

  function googleLogin(){
    const identity=globalThis.ReadyNetlifyIdentity;
    if(!identity?.loginGoogle)return {ok:false,reason:'IDENTITY_BROWSER_RUNTIME_MISSING'};
    return identity.loginGoogle();
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

  async function familyMembers(){
    try{
      const res=await fetch('/api/family/members',{method:'GET',headers:{Accept:'application/json'},cache:'no-store',credentials:'same-origin'});
      const body=await res.json().catch(()=>({}));
      return res.ok?body:{ok:false,reason:body?.reason||('FAMILY_MEMBERS_HTTP_'+res.status)};
    }catch(error){return {ok:false,reason:String(error?.message||error)};}
  }

  async function createFamily(relationship='GUARDIAN'){
    const result=await postAuth('/api/family/create',{relationship:String(relationship||'GUARDIAN').trim().toUpperCase()});
    if(result.ok&&result.session)return applyBootstrap({...result.session,source:'FAMILY_CREATE'});
    return result;
  }

  async function linkChild(email){
    return postAuth('/api/family/link-child',{email:String(email||'').trim()});
  }

  async function linkGuardian(email,relationship='GUARDIAN'){
    return postAuth('/api/family/link-guardian',{email:String(email||'').trim(),relationship:String(relationship||'GUARDIAN').trim().toUpperCase()});
  }

  function clear(){
    session={
      state:'ANONYMOUS_LOCAL',authenticated:false,account_id:null,family_id:null,membership_id:null,member_id:null,role:'CHILD',
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
  function isChild(){const s=current();return s.state==='ANONYMOUS_LOCAL'||(s.state==='AUTHENTICATED'&&s.role==='CHILD');}
  function requireRole(required){
    const want=String(required||'').toUpperCase();
    const s=current();
    if(want==='CHILD' && isChild()) return {ok:true,session:s};
    if(want==='PARENT' && isParent()) return {ok:true,session:s};
    return {ok:false,reason:want==='PARENT'?'PARENT_AUTH_REQUIRED':'ROLE_NOT_ALLOWED',session:s};
  }
  window.addEventListener('readyset-identity-callback',()=>{hydrate().catch(()=>{});});
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
    googleLogin,
    login,
    signup,
    logout,
    familyMembers,
    createFamily,
    linkChild,
    linkGuardian,
    clear
  });

  if(!(bootstrapAllowed&&bootstrap&&typeof bootstrap==='object')) hydrate().catch(()=>{});
})();