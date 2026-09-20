(() => {
  'use strict';

  const VERSION='0.1.0';
  const ROLES=new Set(['CHILD','PARENT']);
  let session={
    state:'ANONYMOUS_LOCAL',
    authenticated:false,
    family_id:null,
    member_id:null,
    role:'CHILD',
    session_id:null,
    access_token:null,
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
    const token=String(input.access_token||'').trim()||null;
    const validRole=ROLES.has(role)?role:null;
    const candidate={
      state:authenticated?'AUTHENTICATED':'ANONYMOUS_LOCAL',
      authenticated,
      family_id:familyId,
      member_id:memberId,
      role:validRole||'CHILD',
      session_id:sessionId,
      access_token:token,
      issued_at:input.issued_at||null,
      expires_at:input.expires_at||null,
      source:String(input.source||'AUTH_BOOTSTRAP')
    };
    if(authenticated&&(!familyId||!memberId||!sessionId||!validRole||!token)) return null;
    if(isExpired(candidate)) return null;
    return candidate;
  }

  function applyBootstrap(input={}){
    const next=normalize(input);
    if(!next||!next.authenticated) return {ok:false,reason:'INVALID_AUTH_BOOTSTRAP'};
    session=next;
    window.dispatchEvent(new CustomEvent('readyset-family-session',{detail:publicSession()}));
    return {ok:true,session:publicSession()};
  }

  function clear(){
    session={
      state:'ANONYMOUS_LOCAL',authenticated:false,family_id:null,member_id:null,role:'CHILD',
      session_id:null,access_token:null,issued_at:null,expires_at:null,source:'LOCAL_DEFAULT'
    };
    window.dispatchEvent(new CustomEvent('readyset-family-session',{detail:publicSession()}));
    return publicSession();
  }

  function publicSession(){
    const s=clone(session);
    delete s.access_token;
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
  function authorizationHeader(){
    if(!session.authenticated||!session.access_token||isExpired(session)) return null;
    return 'Bearer '+session.access_token;
  }

  const bootstrap=globalThis.__READY_AUTH_BOOTSTRAP__;
  if(bootstrap&&typeof bootstrap==='object') applyBootstrap(bootstrap);

  window.ReadyFamilySession=Object.freeze({
    version:VERSION,
    current,
    role,
    isParent,
    isChild,
    requireRole,
    authorizationHeader,
    clear
  });
})();