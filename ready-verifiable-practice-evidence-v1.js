/* TAKY Ready exact-answer evidence producer; the server alone verifies correctness. */
(() => {
'use strict';
if(window.ReadyVerifiablePracticeEvidenceV1)return;
const VERSION='2026.10.13-ready-verifiable-practice-evidence-v1';
const clean=x=>String(x??'').trim();
function recordExactAnswer({subject,concept_skill_target,learning_target_id,response_value,instrument_version}={}){
 const hostSession=typeof state!=='undefined'?state?.activeSession:window.state?.activeSession;
 if(!window.ReadySetRev07?.contract?.()||!hostSession)
   return {ok:false,reason:'READY_SESSION_REQUIRED'};
 const identity=window.ReadyIdentityV1?.get?.()||{};
 const memberId=clean(identity.memberId||identity.userId);
 const scope={subject:clean(subject),concept_skill_target:clean(concept_skill_target),learning_target_id:clean(learning_target_id)};
 if(!memberId||Object.values(scope).some(v=>!v)||!clean(instrument_version))
   return {ok:false,reason:'VERIFIABLE_PRACTICE_SCOPE_REQUIRED'};
 if(typeof response_value!=='string'&&typeof response_value!=='number')
   return {ok:false,reason:'RAW_RESPONSE_REQUIRED'};
 const response=String(response_value);
 if(!response.trim()||response.length>4000)return {ok:false,reason:'RAW_RESPONSE_INVALID'};
 const contract=window.ReadySetRev07.contract();
 const event={
  event_id:'ready_practice_'+Date.now()+'_'+Math.random().toString(36).slice(2,10),
  app:'ready-set',type:'PRACTICE_RESPONSE_RESULT',at:new Date().toISOString(),
  child_id:memberId,session_id:contract.session_id,
  task_id:contract.active_task_id||null,
  payload:{
   evidence_type:'STRUCTURED_PRACTICE_EVIDENCE',
   instrument_version:clean(instrument_version),
   learning_scope:scope,
   verification_observation:{response_value:response}
  }
 };
 // No client-side verified outcome, answer key, score-to-mastery claim or
 // unsourced learning receipt. Existing shared outbox handles offline retry.
 const queued=window.TakyLearningEvidenceClientV1?.enqueue?.(event);
 if(!queued?.ok)return {ok:false,reason:queued?.reason||'CENTRAL_EVIDENCE_QUEUE_UNAVAILABLE'};
 try{window.dispatchEvent(new CustomEvent('taky-learning-event',{detail:event}))}catch{}
 return {ok:true,event,queue_state:queued};
}
window.ReadyVerifiablePracticeEvidenceV1=Object.freeze({version:VERSION,recordExactAnswer});
})();
