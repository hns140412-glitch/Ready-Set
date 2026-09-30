(() => {
 'use strict';
 const VERSION='READY_CENTRAL_LEARNING_DECISION_HTTP_CLIENT_V1';
 const clean=x=>typeof x==='string'?x.trim():'';
 const EXPECTED='TAKY_CENTRAL_LEARNING_DECISION_HTTP_V1';
 function create({endpointUrl,fetchImpl,tokenProvider}={}){
  let endpoint;
  try{
   endpoint=new URL(endpointUrl);
   if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||
      endpoint.search||endpoint.hash||endpoint.pathname!=='/api/learning/decision')
    throw Error('INVALID_ENDPOINT');
  }catch{throw Error('EXPLICIT_HTTPS_CENTRAL_DECISION_ENDPOINT_REQUIRED')}
  if(typeof fetchImpl!=='function'||typeof tokenProvider!=='function')
   throw Error('CENTRAL_FETCH_AND_TOKEN_PROVIDERS_REQUIRED');
  async function request({family_id,member_id,subject,concept_skill_target}={}){
   if([family_id,member_id,subject,concept_skill_target].some(x=>!clean(x)))
    return {ok:false,reason:'EXPLICIT_DECISION_SCOPE_REQUIRED'};
   const normalizedScope={family_id:clean(family_id),member_id:clean(member_id),
    subject:clean(subject).toLowerCase(),
    concept_skill_target:clean(concept_skill_target).toLowerCase()};
   let token;
   try{token=await tokenProvider()}catch{
    return {ok:false,reason:'CENTRAL_DECISION_TOKEN_UNAVAILABLE'};}
   if(!clean(token)||token.length>8192)
    return {ok:false,reason:'CENTRAL_DECISION_TOKEN_REQUIRED'};
   let response,body;
   try{
    response=await fetchImpl(endpoint.href,{
     method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json',
      Authorization:'Bearer '+token},credentials:'omit',redirect:'error',
     cache:'no-store',body:JSON.stringify(normalizedScope)
    });
    body=await response.json();
   }catch{return {ok:false,reason:'CENTRAL_DECISION_HTTP_UNAVAILABLE'};}
   if(response.status!==200||body?.ok!==true)
    return {ok:false,reason:response.status===401||response.status===403
     ?'CENTRAL_DECISION_AUTHORIZATION_REQUIRED':'CENTRAL_DECISION_HTTP_'+response.status};
   const trace=body?.runtime_result?.trace||{};
   const verifiedOnly=body?.source==='SERVER_DURABLE_VERIFIED_EVIDENCE_ONLY'&&
     body?.observation_only_excluded===true;
   const observational=body?.source==='SERVER_DURABLE_AUTHENTICATED_ADVISORY_AND_VERIFIED_EVIDENCE'&&
     body?.observation_only_excluded===false&&
     Number.isInteger(trace.observation_review_evidence_count)&&
     trace.observation_review_evidence_count>0&&
     /^[a-f0-9]{64}$/.test(trace.observation_review_digest_sha256||'')&&
     ['OBSERVATION_ADVISORY_ONLY','VERIFIED_WITH_OBSERVATION_ADVISORY'].includes(trace.basis_kind);
   if(body?.decision_response_version!==EXPECTED||
      body.authenticated_server_response!==true||
      body.observation_proof_promotion!==false||
      !(verifiedOnly||observational)||
      body.receipt_scope?.family_id!==family_id||
      body.receipt_scope?.member_id!==member_id)
    return {ok:false,reason:'CENTRAL_DECISION_RESPONSE_CONTRACT_INVALID'};
   return body;
  }
  return Object.freeze({VERSION,request});
 }
 const api=Object.freeze({VERSION,create});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(typeof window!=='undefined')window.ReadyCentralLearningDecisionHttpV01=api;
})();
