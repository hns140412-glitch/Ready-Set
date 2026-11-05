(() => {
'use strict';

if(window.ReadyVerifiablePracticeEvidenceV1)return;

const VERSION='2026.10.07-ready-verifiable-practice-evidence-v1';
const clean=v=>typeof v==='string'?v.trim():'';
const scalar=v=>['string','number','boolean'].includes(typeof v)?v:null;
const forbidden=new Set(['expected_value','expected_values','answer_key','correct_answer','verification_candidate','verified_outcome']);

function recordExactAnswer(input={}){
  for(const key of forbidden){
    if(Object.prototype.hasOwnProperty.call(input,key))
      return {ok:false,reason:'CLIENT_MUST_NOT_RECEIVE_TRUSTED_ANSWER_REFERENCE'};
  }
  const identity=window.ReadyIdentityV1?.get?.()||{};
  const memberId=clean(input.member_id||identity.userId);
  const subject=clean(input.subject);
  const concept=clean(input.concept_skill_target);
  const target=clean(input.learning_target_id);
  const instrument=clean(input.instrument_version||'READY_STRUCTURED_PRACTICE_V1');
  const responseValue=scalar(input.response_value);
  if(!memberId)return {ok:false,reason:'MEMBER_SCOPE_REQUIRED'};
  if(!subject)return {ok:false,reason:'SUBJECT_SCOPE_REQUIRED'};
  if(!concept)return {ok:false,reason:'CONCEPT_SKILL_SCOPE_REQUIRED'};
  if(!target)return {ok:false,reason:'LEARNING_TARGET_REQUIRED'};
  if(responseValue===null)return {ok:false,reason:'SCALAR_RESPONSE_REQUIRED'};
  const session=window.state?.activeSession?.rev07||{};
  const event={
    event_id:'ready_practice_'+Date.now()+'_'+Math.random().toString(36).slice(2,8),
    type:'PRACTICE_RESPONSE_RESULT',
    app:'ready-set',
    at:new Date().toISOString(),
    session_id:clean(input.session_id||session.session_id)||null,
    goal_id:clean(input.goal_id||session.goal_id)||null,
    task_id:clean(input.task_id||session.active_task_id)||null,
    lap_id:clean(input.lap_id||session.active_lap_id)||null,
    child_id:memberId,
    payload:{
      evidence_type:'STRUCTURED_PRACTICE_EVIDENCE',
      instrument_version:instrument,
      verification_observation:{response_value:responseValue},
      learning_scope:{
        member_id:memberId,
        subject,
        concept_skill_target:concept,
        learning_target_id:target
      }
    }
  };
  try{
    window.dispatchEvent(new CustomEvent('taky-learning-event',{detail:event}));
  }catch{
    return {ok:false,reason:'LEARNING_EVENT_DISPATCH_UNAVAILABLE'};
  }
  return {ok:true,event};
}

window.ReadyVerifiablePracticeEvidenceV1=Object.freeze({
  version:VERSION,
  recordExactAnswer
});
})();