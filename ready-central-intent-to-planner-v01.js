(() => {
 'use strict';
 const VERSION='READY_CENTRAL_INTENT_TO_PLANNER_V1';
 const clean=x=>typeof x==='string'?x.trim():'';
 function planAccepted(intent,planner,{activeSession,candidate_dates,label}={}){
  if(intent?.ok!==true||intent.authority!=='CENTRAL_PEDAGOGICAL_INTENT_ONLY'||
     intent.adaptive_plan?.ok!==true||
     intent.adaptive_plan.authority!=='LEARNING_ADAPTIVE_PLAN_INTENT_ONLY'||
     intent.adaptive_plan.adaptive_plan_contract!=='TAKY_ADAPTIVE_PLAN_INTENT_V1')
   return {ok:false,reason:'CENTRAL_ADAPTIVE_INTENT_REQUIRED'};
  const scope=intent.scope||{},receipt=intent.receipt_scope||{};
  if(activeSession?.authenticated!==true||!clean(receipt.family_id)||
     activeSession.family_id!==receipt.family_id||
     activeSession.selected_member_id!==receipt.member_id||
     scope.member_id!==receipt.member_id||!clean(scope.subject)||
     !clean(scope.concept_skill_target))
   return {ok:false,reason:'ACTIVE_CENTRAL_PLANNER_SCOPE_REQUIRED'};
  const trace=intent.trace||{};
  const evidenceReceipt=clean(trace.verified_receipt_id);
  const verified=!!evidenceReceipt&&Number.isInteger(trace.verified_evidence_count)&&
    trace.verified_evidence_count>0;
  const observationDigest=clean(trace.observation_review_digest_sha256);
  const observation=Number.isInteger(trace.observation_review_evidence_count)&&
    trace.observation_review_evidence_count>0&&
    Array.isArray(trace.observation_review_evidence_ids)&&
    trace.observation_review_evidence_ids.length===trace.observation_review_evidence_count&&
    /^[a-f0-9]{64}$/.test(observationDigest)&&
    (intent.actions||[]).some(x=>x.intent==='RETRIEVAL_CHECKPOINT'&&
      (Array.isArray(x.basis)?x.basis:[x.basis]).includes('HIDE_MEMORY_ADVISORY_ONLY'));
  const basisKind=verified
    ?(observation?'VERIFIED_WITH_OBSERVATION_ADVISORY':'VERIFIED_ONLY')
    :(observation?'OBSERVATION_ADVISORY_ONLY':null);
  if(!basisKind||trace.basis_kind!==basisKind)
   return {ok:false,reason:'SERVER_SCOPED_DECISION_BASIS_REQUIRED'};
  const activityRefs=Array.isArray(trace.governed_activity_refs)
   ?trace.governed_activity_refs.map(clean).filter(Boolean):[];
  const activityPolicies=Array.isArray(trace.governed_activity_policy_ids)
   ?trace.governed_activity_policy_ids.map(clean).filter(Boolean):[];
  if(activityRefs.length>24||new Set(activityRefs).size!==activityRefs.length||
     activityPolicies.length>8||new Set(activityPolicies).size!==activityPolicies.length||
     (activityRefs.length>0&&!activityPolicies.includes('P-F07-READY'))||
     (activityPolicies.length>0&&activityRefs.length===0)||
     activityPolicies.some(x=>x!=='P-F07-READY'))
   return {ok:false,reason:'SERVER_GOVERNED_ACTIVITY_REFERENCE_REQUIRED'};
  const activityRefsKey=JSON.stringify(activityRefs);
  if(intent.adaptive_plan.add_checkpoint!==true)
   return {ok:true,scheduled:false,reason:'NO_CENTRAL_CHECKPOINT_INTENT'};
  if(!planner||typeof planner.candidateWindowsByDate!=='function'||
     typeof planner.upsertDatedTodo!=='function'||
     typeof planner.snapshot!=='function'||
     typeof planner.reconcileCentralCheckpointCarries!=='function')
   return {ok:false,reason:'PLANNER_RUNTIME_REQUIRED'};
  const provenanceBase={family_id:receipt.family_id,member_id:receipt.member_id,
   subject:scope.subject,concept_skill_target:scope.concept_skill_target,
   basis_kind:basisKind,verified_receipt_id:evidenceReceipt||null,
   observation_basis_digest_sha256:observation?observationDigest:null};
  const matches=t=>t?.source==='PLANNER_CENTRAL_LEARNING_CHECKPOINT'&&
   Object.entries(provenanceBase).every(([k,v])=>t.provenance?.[k]===v);
  const prior=(planner.snapshot()?.dated_todos||[]).filter(matches);
  const refsMatch=t=>(clean(t?.provenance?.governed_activity_refs_key)||'[]')===activityRefsKey;
  const activePrior=prior.find(x=>['PLANNED','IN_PROGRESS'].includes(x.state));
  if(activePrior&&!refsMatch(activePrior))
   return {ok:false,reason:'CENTRAL_CHECKPOINT_REPLAY_CONFLICT'};
  const existing=activePrior&&refsMatch(activePrior)?activePrior:null;
  if(!existing&&prior.length)
   return {ok:false,reason:'CENTRAL_CHECKPOINT_REQUIRES_NEW_EVIDENCE',
     previous_todo_id:prior.at(-1).todo_id};
  const sequence=[
   ...(intent.adaptive_plan.unit_span_policy==='REDUCE'?['SHORT_LEARNING_UNIT']:[]),
   ...(intent.adaptive_plan.add_retrieval_checkpoint===true?['RETRIEVAL_CHECKPOINT']:['CONCEPT_CHECKPOINT']),
   ...(intent.adaptive_plan.assistance_policy==='FADE_GRADUALLY'?['ASSISTANCE_FADING']:[])
  ];
  const types=intent.adaptive_plan.add_retrieval_checkpoint===true?['RETRIEVAL']:['CHECKPOINT'];
  const reconcile=todo=>planner.reconcileCentralCheckpointCarries({
   new_todo_id:todo.todo_id,family_id:receipt.family_id,member_id:receipt.member_id,
   subject:scope.subject,concept_skill_target:scope.concept_skill_target
  });
  if(existing){
   if(JSON.stringify(existing.activity_sequence||[])!==JSON.stringify(sequence))
    return {ok:false,reason:'CENTRAL_CHECKPOINT_REPLAY_CONFLICT'};
   const reconciled=reconcile(existing);
   if(!reconciled?.ok)return {ok:false,reason:'CENTRAL_CARRY_RECONCILIATION_FAILED'};
   return {ok:true,scheduled:true,reused:true,todo:existing,
    previous_carry_reconciled:reconciled.resolved};
  }
  const dates=[...new Set((candidate_dates||[]).map(clean).filter(d=>
   /^\d{4}-\d{2}-\d{2}$/.test(d)))];
  if(!dates.length)return {ok:false,reason:'PLANNER_CANDIDATE_DATES_REQUIRED'};
  const windows=planner.candidateWindowsByDate(dates)||{};
  const date=dates.find(d=>Array.isArray(windows[d])&&windows[d].length>0);
  if(!date)return {ok:false,reason:'NO_CONFIRMED_PLANNER_WINDOW'};
  const reviewTargets=Array.isArray(intent.adaptive_plan.target_learning_ids)
    ?[...new Set(intent.adaptive_plan.target_learning_ids.map(clean).filter(Boolean))].slice(0,24):[];
  const learningOutput=intent.learning_output||null;
  const quantityIntent=learningOutput?.recommended_quantity||null;
  if(learningOutput&&(
     learningOutput.authority!=='TAKY_LEARNING_ENGINE_CORE'||
     learningOutput.date_authority!==false||
     learningOutput.allocated_quantity_authority!==false||
     quantityIntent?.authority!=='LEARNING_ENGINE_QUANTITY_INTENT_ONLY'||
     quantityIntent?.planner_must_materialize!==true||
     quantityIntent?.allocated_quantity!==null))
    return {ok:false,reason:'CENTRAL_LEARNING_OUTPUT_INVALID'};
  const requestedTargets=Array.isArray(quantityIntent?.target_ids)
    ?[...new Set(quantityIntent.target_ids.map(clean).filter(Boolean))].slice(0,24):[];
  const allocationTargets=requestedTargets.length?requestedTargets:reviewTargets;
  const growth=intent.growth_next_step||null;
  const growthControl=growth?.growth_control||null;
  if(growth&&(
     growth.authority!=='LEARNING_ENGINE_GROWTH_INTENT_ONLY'||
     growth.guards?.planner_owns_dates!==true))
   return {ok:false,reason:'CENTRAL_GROWTH_INTENT_INVALID'};
  const plannerAllocation={
    authority:'READY_SET_PLANNER_ALLOCATION',
    date,
    quantity_kind:allocationTargets.length?'LEARNING_TARGET_COUNT':'CHECKPOINT_COUNT',
    quantity:allocationTargets.length||1,
    allocated_learning_target_ids:[...allocationTargets],
    allocation_basis:allocationTargets.length
      ?'LEARNING_QUANTITY_INTENT_MATERIALIZED_BY_PLANNER'
      :'CENTRAL_CHECKPOINT_INTENT',
    source_quantity_intent:quantityIntent?{
      authority:quantityIntent.authority,
      target_count_hint:quantityIntent.target_count_hint??null,
      quantity_band:quantityIntent.quantity_band||null,
      planner_must_materialize:true
    }:null,
    learning_intensity:growthControl?.learning_intensity||null,
    expression_level:growthControl?.expression_level||null,
    question_depth:Number.isInteger(growthControl?.question_depth)?growthControl.question_depth:null,
    pedagogical_intent_owner:'TAKY_LEARNING_ENGINE_CORE',
    date_and_quantity_owner:'READY_SET_PLANNER',
    learning_engine_date_authority:false,
    learning_engine_quantity_authority:false
  };
  const subjectLabel=['english','영어'].includes(scope.subject)?'영어':
    ['korean','국어'].includes(scope.subject)?'국어':
    ['math','수학'].includes(scope.subject)?'수학':scope.subject;
  const accessibleLabel=reviewTargets.length
    ?subjectLabel+' 다시 떠올리기 · '+reviewTargets.length+'개'
    :subjectLabel+' 학습 확인';
  const todo=planner.upsertDatedTodo({
   date,label:clean(label)||accessibleLabel,
   source:'PLANNER_CENTRAL_LEARNING_CHECKPOINT',
   source_actor:'READY_SET_PLANNER',state:'PLANNED',
   activity_types:types,activity_sequence:sequence,
   review_policy:{authority:'TAKY_LEARNING_ENGINE_CORE',
    decision_contract:'TAKY_RUNTIME_DECISION_CONTRACT_V1',intent_only:true,
    evidence_basis_kind:basisKind,observation_is_verified_proof:false},
   planner_allocation:plannerAllocation,
   specialist_growth_intent:growth?{
    authority:growth.authority,
    version:growth.version||null,
    support_phase:growth.support_phase||null,
    growth_control:growthControl?structuredClone(growthControl):null
   }:null,
   provenance:{kind:'CENTRAL_PEDAGOGICAL_CHECKPOINT',...provenanceBase,
    central_intents:(intent.actions||[]).map(x=>clean(x.intent)).filter(Boolean),
    target_learning_ids:allocationTargets,
    ...(activityRefs.length?{
     governed_activity_refs:[...activityRefs],
     governed_activity_policy_ids:[...activityPolicies],
     governed_activity_refs_key:activityRefsKey
    }:{}),
    schedule_authority:'READY_SET_PLANNER'}
  });
  if(!todo||!clean(todo.todo_id)||todo.date!==date)
   return {ok:false,reason:'PLANNER_DATED_CHECKPOINT_NOT_CONFIRMED'};
  const reconciled=reconcile(todo);
  if(!reconciled?.ok)return {ok:false,reason:'CENTRAL_CARRY_RECONCILIATION_FAILED',
    created_todo_id:todo.todo_id};
  return {ok:true,scheduled:true,todo,
   planner_allocation:structuredClone(plannerAllocation),
   previous_carry_reconciled:reconciled.resolved};
 }
 const api=Object.freeze({VERSION,planAccepted});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(typeof window!=='undefined')window.ReadyCentralIntentToPlannerV01=api;
})();
