(() => {
  'use strict';
  // Ready Netlify Identity is not a central Google OIDC credential.
  // This adapter only checks explicit server-issued linkage; it never mints a token.
  const VERSION='READY_CENTRAL_EVIDENCE_SESSION_V1';
  const clean=x=>typeof x==='string'?x.trim():'';
  function resolve({readySession,centralSession,selectedMemberId}={}){
    if(readySession?.authenticated!==true)
      return {ok:false,reason:'READY_AUTHENTICATION_REQUIRED'};
    if(centralSession?.authenticated!==true ||
       centralSession?.issuer!=='GOOGLE_OIDC_VERIFIED_SERVER' ||
       !clean(centralSession.family_id) || !clean(centralSession.subject))
      return {ok:false,reason:'INDEPENDENT_CENTRAL_IDENTITY_REQUIRED'};
    if(readySession.family_id!==centralSession.family_id)
      return {ok:false,reason:'FAMILY_IDENTITY_LINK_NOT_CONFIRMED'};
    const member=clean(selectedMemberId);
    if(!member || !Array.isArray(centralSession.authorized_member_ids) ||
       !centralSession.authorized_member_ids.includes(member))
      return {ok:false,reason:'CENTRAL_SELECTED_MEMBER_GRANT_REQUIRED'};
    if(!clean(centralSession.expires_at) ||
       !Number.isFinite(Date.parse(centralSession.expires_at)) ||
       Date.parse(centralSession.expires_at)<=Date.now())
      return {ok:false,reason:'CENTRAL_SESSION_EXPIRED'};
    return {ok:true,session:Object.freeze({
      authenticated:true,family_id:centralSession.family_id,
      selected_member_id:member
    })};
  }
  window.ReadyCentralEvidenceSessionV01=Object.freeze({VERSION,resolve});
})();
