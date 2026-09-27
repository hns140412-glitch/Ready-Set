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
  if(intent.adaptive_plan.add_checkpoint!==true)
   return {ok:true,scheduled:false,reason:'NO_CENTRAL_CHECKPOINT_INTENT'};
  if(!planner||typeof planner.candidateWindowsByDate!=='function'||
     typeof planner.upsertDatedTodo!=='function'||
     typeof planner.snapshot!=='function')
   return {ok:false,reason:'PLANNER_RUNTIME_REQUIRED'};
  const provenanceBase={family_id:receipt.family_id,member_id:receipt.member_id,
   subject:scope.subject,concept_skill_target:scope.concept_skill_target,
   basis_kind:basisKind,verified_receipt_id:evidenceReceipt||null,
   observation_basis_digest_sha256:observation?observationDigest:null};
  const matches=t=>t?.source==='PLANNER_CENTRAL_LEARNING_CHECKPOINT'&&
   Object.entries(provenanceBase).every(([k,v])=>t.provenance?.[k]===v);
  const existing=(planner.snapshot()?.dated_todos||[]).find(matches);
  const sequence=[
   ...(intent.adaptive_plan.unit_span_policy==='REDUCE'?['SHORT_LEARNING_UNIT']:[]),
   ...(intent.adaptive_plan.add_retrieval_checkpoint===true?['RETRIEVAL_CHECKPOINT']:['CONCEPT_CHECKPOINT']),
   ...(intent.adaptive_plan.assistance_policy==='FADE_GRADUALLY'?['ASSISTANCE_FADING']:[])
  ];
  const types=intent.adaptive_plan.add_retrieval_checkpoint===true?['RETRIEVAL']:['CHECKPOINT'];
  if(existing){
   if(JSON.stringify(existing.activity_sequence||[])!==JSON.stringify(sequence))
    return {ok:false,reason:'CENTRAL_CHECKPOINT_REPLAY_CONFLICT'};
   return {ok:true,scheduled:true,reused:true,todo:existing};
  }
  const dates=[...new Set((candidate_dates||[]).map(clean).filter(d=>
   /^\d{4}-\d{2}-\d{2}$/.test(d)))];
  if(!dates.length)return {ok:false,reason:'PLANNER_CANDIDATE_DATES_REQUIRED'};
  const windows=planner.candidateWindowsByDate(dates)||{};
  const date=dates.find(d=>Array.isArray(windows[d])&&windows[d].length>0);
  if(!date)return {ok:false,reason:'NO_CONFIRMED_PLANNER_WINDOW'};
  const todo=planner.upsertDatedTodo({
   date,label:clean(label)||'중앙 학습 점검',
   source:'PLANNER_CENTRAL_LEARNING_CHECKPOINT',
   source_actor:'READY_SET_PLANNER',state:'PLANNED',
   activity_types:types,activity_sequence:sequence,
   review_policy:{authority:'TAKY_LEARNING_ENGINE_CORE',
    decision_contract:'TAKY_RUNTIME_DECISION_CONTRACT_V1',intent_only:true,
    evidence_basis_kind:basisKind,observation_is_verified_proof:false},
   provenance:{kind:'CENTRAL_PEDAGOGICAL_CHECKPOINT',...provenanceBase,
    central_intents:(intent.actions||[]).map(x=>clean(x.intent)).filter(Boolean),
    target_learning_ids:Array.isArray(intent.adaptive_plan.target_learning_ids)
     ?intent.adaptive_plan.target_learning_ids.filter(clean):[],
    schedule_authority:'READY_SET_PLANNER'}
  });
  if(!todo||!clean(todo.todo_id)||todo.date!==date)
   return {ok:false,reason:'PLANNER_DATED_CHECKPOINT_NOT_CONFIRMED'};
  return {ok:true,scheduled:true,todo};
 }
 const api=Object.freeze({VERSION,planAccepted});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(typeof window!=='undefined')window.ReadyCentralIntentToPlannerV01=api;
})();
