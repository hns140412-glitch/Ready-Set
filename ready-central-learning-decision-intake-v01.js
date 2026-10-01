(() => {
 'use strict';
 const VERSION='READY_CENTRAL_LEARNING_DECISION_INTAKE_V1';
 const clean=x=>typeof x==='string'?x.trim():'';
 // A transport ingest ACK is never a pedagogical decision. The central
 // runtime decision is intent-only and cannot allocate Planner dates.
 function accept(result,{family_id,member_id,subject,concept_skill_target,receipt_scope}={}){
  if(result?.ok!==true||result.authority!=='TAKY_LEARNING_ENGINE_CORE'||
     result.engine_runtime!=='TAKY_LEARNING_ENGINE_RUNTIME_V1'||
     result.decision?.ok!==true||
     result.decision.authority!=='LEARNING_DECISION_INTENT_ONLY'||
     result.decision.decision_contract!=='TAKY_RUNTIME_DECISION_CONTRACT_V1'||
     result.decision.consumer_contract?.planner!=='OWNS_DATED_ALLOCATION')
   return {ok:false,reason:'CENTRAL_RUNTIME_DECISION_REQUIRED'};
  const scope=result.scope||{},ds=result.decision.scope||{};
  // The central learner-state core scopes member/subject/skill, not family.
  // Family binding must therefore come from a separately trusted server
  // response envelope, never from an invented result.scope.family_id.
  if(!clean(family_id)||!clean(member_id)||!clean(subject)||!clean(concept_skill_target)||
     receipt_scope?.family_id!==family_id||receipt_scope?.member_id!==member_id||
     scope.member_id!==member_id||
     scope.subject!==clean(subject).toLowerCase()||
     scope.concept_skill_target!==clean(concept_skill_target).toLowerCase()||
     JSON.stringify(ds)!==JSON.stringify(scope))
   return {ok:false,reason:'CENTRAL_DECISION_SCOPE_MISMATCH'};
  const plan=result.decision.adaptive_plan||{};
  if(plan.ok!==true||
     plan.authority!=='LEARNING_ADAPTIVE_PLAN_INTENT_ONLY'||
     plan.adaptive_plan_contract!=='TAKY_ADAPTIVE_PLAN_INTENT_V1'||
     JSON.stringify(plan.scope)!==JSON.stringify(scope))
   return {ok:false,reason:'CENTRAL_ADAPTIVE_PLAN_SCOPE_INVALID'};
  if(result.decision.execution_status!=='PEDAGOGICAL_ACTION_AVAILABLE')
   return {ok:false,reason:'CENTRAL_DECISION_HOLD'};
  const forbidden=new Set(['schedule_date','planner_date','due_at','due_date','deadline']);
  function leaks(v){
   if(!v||typeof v!=='object')return false;
   return Object.entries(v).some(([k,x])=>forbidden.has(k)||leaks(x));
  }
  if(leaks(result)||!Array.isArray(result.decision.pedagogical_actions))
   return {ok:false,reason:'CENTRAL_DECISION_AUTHORITY_LEAK'};
  const growth=result.growth_next_step||null;
  if(growth){
   const gc=growth.growth_control||{};
   if(growth.authority!=='LEARNING_ENGINE_GROWTH_INTENT_ONLY'||
      growth.guards?.planner_owns_dates!==true||
      !['SUPPORT_BUILD','BUILD_CONNECT','STRETCH_TRANSFER'].includes(gc.learning_intensity)||
      !/^L[1-5]_/.test(clean(gc.expression_level))||
      !Number.isInteger(gc.question_depth)||gc.question_depth<1||gc.question_depth>5)
    return {ok:false,reason:'CENTRAL_GROWTH_INTENT_INVALID'};
  }
  const trace=result.trace||{};
  if(trace.governed_activity_refs!==undefined||
     trace.governed_activity_policy_ids!==undefined){
   const refs=trace.governed_activity_refs,policies=trace.governed_activity_policy_ids;
   const validRefs=Array.isArray(refs)&&refs.length>0&&refs.length<=24&&
    refs.every(x=>!!clean(x))&&new Set(refs.map(clean)).size===refs.length;
   const validPolicies=Array.isArray(policies)&&policies.length>0&&policies.length<=8&&
    policies.every(x=>clean(x)==='P-F07-READY')&&
    new Set(policies.map(clean)).size===policies.length;
   if(!validRefs||!validPolicies)
    return {ok:false,reason:'CENTRAL_GOVERNED_ACTIVITY_REFERENCE_INVALID'};
  }
  return {ok:true,authority:'CENTRAL_PEDAGOGICAL_INTENT_ONLY',
   actions:structuredClone(result.decision.pedagogical_actions),
   adaptive_plan:structuredClone(result.decision.adaptive_plan),
   growth_next_step:growth?structuredClone(growth):null,
   scope:structuredClone(scope),receipt_scope:{family_id,member_id},
   trace:structuredClone(result.trace||{})};
 }
 // A host-supplied authenticated decision provider must bind its envelope to
 // the selected member both before and after the asynchronous request.
 async function receive({sessionProvider,decisionProvider,subject,concept_skill_target}={}){
  if(typeof sessionProvider!=='function'||typeof decisionProvider!=='function')
   return {ok:false,reason:'TRUSTED_CENTRAL_DECISION_PROVIDER_REQUIRED'};
  const before=await sessionProvider();
  if(before?.authenticated!==true||!clean(before.family_id)||!clean(before.selected_member_id))
   return {ok:false,reason:'ACTIVE_CENTRAL_SESSION_REQUIRED'};
  const response=await decisionProvider({family_id:before.family_id,
   member_id:before.selected_member_id,subject,concept_skill_target});
  const after=await sessionProvider();
  if(after?.authenticated!==true||after.family_id!==before.family_id||
     after.selected_member_id!==before.selected_member_id)
   return {ok:false,reason:'CENTRAL_DECISION_SESSION_CHANGED'};
  if(response?.ok===false)return {ok:false,reason:response.reason||'CENTRAL_DECISION_UNAVAILABLE'};
  if(response?.authenticated_server_response!==true)
   return {ok:false,reason:'AUTHENTICATED_CENTRAL_RESPONSE_REQUIRED'};
  return accept(response.runtime_result,{family_id:before.family_id,
   member_id:before.selected_member_id,subject,concept_skill_target,
   receipt_scope:response.receipt_scope});
 }
 const api=Object.freeze({VERSION,accept,receive});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(typeof window!=='undefined')window.ReadyCentralLearningDecisionIntakeV01=api;
})();
