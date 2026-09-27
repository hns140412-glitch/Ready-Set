(() => {
 'use strict';
 const VERSION='READY_CENTRAL_HIDE_DIRECTIVE_V1';
 const clean=x=>typeof x==='string'?x.trim():'';
 function forPlannerTodo(todo,taskId,{boundScope}={}){
  const p=todo?.provenance||{},policy=todo?.review_policy||{};
  if(todo?.source!=='PLANNER_CENTRAL_LEARNING_CHECKPOINT'||
     p.kind!=='CENTRAL_PEDAGOGICAL_CHECKPOINT'||
     p.schedule_authority!=='READY_SET_PLANNER'||
     policy.authority!=='TAKY_LEARNING_ENGINE_CORE'||
     policy.decision_contract!=='TAKY_RUNTIME_DECISION_CONTRACT_V1'||
     policy.intent_only!==true||policy.observation_is_verified_proof!==false)
   return null;
  if(!clean(boundScope?.family_id)||!clean(boundScope?.member_id)||
     p.family_id!==boundScope.family_id||p.member_id!==boundScope.member_id||
     !clean(taskId)||!clean(todo.todo_id)||!/^\d{4}-\d{2}-\d{2}$/.test(clean(todo.date)))
   return null;
  if(!['OBSERVATION_ADVISORY_ONLY','VERIFIED_ONLY','VERIFIED_WITH_OBSERVATION_ADVISORY']
    .includes(p.basis_kind)||policy.evidence_basis_kind!==p.basis_kind)
   return null;
  const lexicalIds=[...new Set((Array.isArray(p.target_learning_ids)?p.target_learning_ids:[])
    .map(clean).filter(Boolean))].slice(0,24);
  if(!lexicalIds.length)return null;
  // This is a bounded UI task scope, not a credential or learning receipt.
  return Object.freeze({authority:'EXPLICIT_CENTRAL_PLANNER_REVIEW_DIRECTIVE',
   reviewPolicyOwner:'TAKY_LEARNING_ENGINE_CORE',scheduleOwner:'READY_SET_PLANNER',
   lexicalIds,directiveId:'central-hide:'+clean(todo.todo_id),
   taskId:clean(taskId),scheduledDate:todo.date,basisKind:p.basis_kind,
   observationIsVerifiedProof:false});
 }
 const api=Object.freeze({VERSION,forPlannerTodo});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(typeof window!=='undefined')window.ReadyCentralHideDirectiveV01=api;
})();
