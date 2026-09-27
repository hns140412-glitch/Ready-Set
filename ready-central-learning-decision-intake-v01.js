(() => {
 'use strict';
 const VERSION='READY_CENTRAL_LEARNING_DECISION_INTAKE_V1';
 const clean=x=>typeof x==='string'?x.trim():'';
 // A transport ingest ACK is never a pedagogical decision. The central
 // runtime decision is intent-only and cannot allocate Planner dates.
 function accept(result,{family_id,member_id,subject,concept_skill_target}={}){
  if(result?.ok!==true||result.authority!=='TAKY_LEARNING_ENGINE_CORE'||
     result.engine_runtime!=='TAKY_LEARNING_ENGINE_RUNTIME_V1'||
     result.decision?.ok!==true||
     result.decision.authority!=='LEARNING_DECISION_INTENT_ONLY'||
     result.decision.decision_contract!=='TAKY_RUNTIME_DECISION_CONTRACT_V1'||
     result.decision.consumer_contract?.planner!=='OWNS_DATED_ALLOCATION')
   return {ok:false,reason:'CENTRAL_RUNTIME_DECISION_REQUIRED'};
  const scope=result.scope||{},ds=result.decision.scope||{};
  if(!clean(family_id)||!clean(member_id)||!clean(subject)||!clean(concept_skill_target)||
     scope.family_id!==family_id||scope.member_id!==member_id||
     scope.subject!==subject||scope.concept_skill_target!==concept_skill_target||
     JSON.stringify(ds)!==JSON.stringify(scope))
   return {ok:false,reason:'CENTRAL_DECISION_SCOPE_MISMATCH'};
  if(result.decision.execution_status!=='PEDAGOGICAL_ACTION_AVAILABLE')
   return {ok:false,reason:'CENTRAL_DECISION_HOLD'};
  const forbidden=new Set(['schedule_date','planner_date','due_at','due_date','deadline']);
  function leaks(v){
   if(!v||typeof v!=='object')return false;
   return Object.entries(v).some(([k,x])=>forbidden.has(k)||leaks(x));
  }
  if(leaks(result)||!Array.isArray(result.decision.pedagogical_actions))
   return {ok:false,reason:'CENTRAL_DECISION_AUTHORITY_LEAK'};
  return {ok:true,authority:'CENTRAL_PEDAGOGICAL_INTENT_ONLY',
   actions:structuredClone(result.decision.pedagogical_actions),
   adaptive_plan:structuredClone(result.decision.adaptive_plan),
   scope:structuredClone(scope),trace:structuredClone(result.trace||{})};
 }
 const api=Object.freeze({VERSION,accept});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(typeof window!=='undefined')window.ReadyCentralLearningDecisionIntakeV01=api;
})();
