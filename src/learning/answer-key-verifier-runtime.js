(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.ReadyAnswerKeyVerifier=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

const clean=v=>String(v??'').trim();

function normalizeAnswer(v){
  if(v===null||v===undefined)return '';
  return clean(String(v)).normalize('NFKC').toLowerCase();
}

function exactMatch({event_id,member_id,subject,concept_skill_target,response,answer_key,answer_key_ref,verifier_version='READY_ANSWER_KEY_V1'}={}){
  const issues=[];
  for(const [k,v] of Object.entries({event_id,member_id,subject,concept_skill_target,answer_key_ref})){
    if(!clean(v))issues.push('MISSING_'+k.toUpperCase());
  }
  const expected=normalizeAnswer(answer_key);
  const actual=normalizeAnswer(response);
  if(!expected)issues.push('ANSWER_KEY_EMPTY');
  if(issues.length)return {ok:false,reason:'ANSWER_KEY_VERIFICATION_INVALID',issues};
  return {
    ok:true,
    verification_candidate:{
      verifier_type:'ANSWER_KEY_EXACT',
      verifier_version,
      basis:'DETERMINISTIC_LOCAL_MATCH',
      outcome:actual===expected?1:0,
      reference_id:clean(answer_key_ref),
      target_semantics:'STRUCTURED_EXACT_RESPONSE'
    }
  };
}

  return Object.freeze({normalizeAnswer,exactMatch});
});