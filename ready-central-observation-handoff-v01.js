(() => {
  'use strict';
  // Explicit observation handoff only. No token minting, transport ACK, policy
  // decision, or Planner scheduling is inferred from a completed Ready task.
  const VERSION='READY_CENTRAL_OBSERVATION_HANDOFF_V1';
  const clean=x=>typeof x==='string'?x.trim():'';
  function fromOutcome(row,{session,event_id,occurred_at,session_id,subject,concept_skill_target}={}){
    if(session?.authenticated!==true||!clean(session.family_id)||!clean(session.selected_member_id))
      return {ok:false,reason:'TRUSTED_SELECTED_MEMBER_SESSION_REQUIRED'};
    if(row?.state!=='COMPLETED'||!clean(row.task_id)||
       row.specialistResult?.sourceApp!=='hide-seek'||
       row.specialistResult?.taskState!=='COMPLETED'||
       row.specialistResult?.memorySummary?.authority!=='SPECIALIST_MEMORY_ADVISORY_ONLY')
      return {ok:false,reason:'COMPLETED_HIDE_EVIDENCE_REQUIRED'};
    if(!clean(event_id)||!clean(occurred_at)||!Number.isFinite(Date.parse(occurred_at))||
       !clean(subject)||!clean(concept_skill_target))
      return {ok:false,reason:'EXPLICIT_OBSERVATION_CONTEXT_REQUIRED'};
    // The specialist summary is observation data, not a carrier for
    // verification receipts, schedule decisions or global mastery claims.
    const forbidden=new Set(['verification_receipt','verification_candidate',
      'verified_outcome','planner_date','schedule_date','due_at','deadline',
      'global_mastery_claim','auto_award']);
    function leaks(value){
      if(!value||typeof value!=='object')return false;
      return Object.entries(value).some(([key,nested])=>forbidden.has(key)||leaks(nested));
    }
    if(leaks(row.specialistResult.memorySummary))
      return {ok:false,reason:'SPECIALIST_SUMMARY_AUTHORITY_LEAK'};
    const member_id=session.selected_member_id;
    // Do not let an explicitly scoped persisted outcome be rebound to a
    // different active child or family after an asynchronous account switch.
    for(const member of [row.member_id,row.selected_member_id,
      row.specialistResult.member_id,row.specialistResult.child_id]){
      if(member!=null&&member!==member_id)
        return {ok:false,reason:'OUTCOME_MEMBER_SCOPE_MISMATCH'};
    }
    for(const family of [row.family_id,row.specialistResult.family_id]){
      if(family!=null&&family!==session.family_id)
        return {ok:false,reason:'OUTCOME_FAMILY_SCOPE_MISMATCH'};
    }
    const payload={
      member_id,family_id:session.family_id,session_id:clean(session_id||row.session_id),
      task_id:row.task_id,lap_id:row.lap_id||null,assignment_id:row.assignment_id||null,
      subject,concept_skill_target,
      source_task_id:row.task_id,observation_only:true,global_mastery_claim:false,
      planner_allocation:row.planner_allocation?structuredClone(row.planner_allocation):null,
      started_at:row.started_at||null,ended_at:row.ended_at||null,
      actual_minutes:Number.isFinite(row.actual_minutes)?row.actual_minutes:
        Number.isFinite(row.actual_ms)?Math.round(row.actual_ms/60000):null,
      performed_quantity:Number.isFinite(row.performed_quantity)?row.performed_quantity:null,
      completion_state:row.state,
      blocked_reason:row.blocked_reason||null,
      parent_confirmation:row.parent_confirmation??null,
      evidence_type:'MEMORY_RETRIEVAL_EVIDENCE',
      instrument_version:clean(row.specialistResult.resultContract)||'HIDE_SPECIALIST_RESULT_V1',
      forwarded_source_app:'hide-seek',ready_state:'COMPLETED',
      memorySummary:structuredClone(row.specialistResult.memorySummary)
    };
    return {ok:true,observation:{event_id,occurred_at,member_id,payload},
      source_app:'ready-set',type:'READY_LEARNING_OBSERVATION',
      authority:'OBSERVATION_ONLY_NOT_CENTRAL_DECISION'};
  }
  // The next Ready checkpoint's completion is a self-report. It closes the
  // execution feedback loop without pretending to verify recall correctness.
  function fromCheckpointOutcome(row,{session,event_id,occurred_at,session_id,subject,
    concept_skill_target}={}){
    const todo=row?.centralCheckpoint,provenance=todo?.provenance||{};
    if(session?.authenticated!==true||!clean(session.family_id)||
       !clean(session.selected_member_id))
      return {ok:false,reason:'TRUSTED_SELECTED_MEMBER_SESSION_REQUIRED'};
    if(!['COMPLETED','PARTIAL','BLOCKED'].includes(row?.state)||
       !clean(row.task_id)||!clean(row.planner_todo_id)||
       todo?.source!=='PLANNER_CENTRAL_LEARNING_CHECKPOINT'||
       todo.todo_id!==row.planner_todo_id||
       todo.review_policy?.authority!=='TAKY_LEARNING_ENGINE_CORE'||
       provenance.schedule_authority!=='READY_SET_PLANNER')
      return {ok:false,reason:'CONFIRMED_CENTRAL_CHECKPOINT_OUTCOME_REQUIRED'};
    if(provenance.family_id!==session.family_id||
       provenance.member_id!==session.selected_member_id||
       row.family_id!==session.family_id||
       row.member_id!==session.selected_member_id)
      return {ok:false,reason:'CENTRAL_CHECKPOINT_MEMBER_SCOPE_MISMATCH'};
    if(!clean(subject)||!clean(concept_skill_target)||
       provenance.subject!==clean(subject).toLowerCase()||
       provenance.concept_skill_target!==clean(concept_skill_target).toLowerCase()||
       !clean(event_id)||!Number.isFinite(Date.parse(occurred_at||'')))
      return {ok:false,reason:'CENTRAL_CHECKPOINT_LEARNING_CONTEXT_REQUIRED'};
    const payload={family_id:session.family_id,
      member_id:session.selected_member_id,session_id:clean(session_id||row.session_id),
      task_id:row.task_id,lap_id:row.lap_id||null,assignment_id:row.assignment_id||null,
      subject,concept_skill_target,
      source_task_id:row.task_id,source_planner_todo_id:row.planner_todo_id,
      planner_allocation:todo.planner_allocation?structuredClone(todo.planner_allocation):null,
      started_at:row.started_at||null,ended_at:row.ended_at||null,
      performed_quantity:Number.isFinite(row.performed_quantity)?row.performed_quantity:null,
      completion_state:row.state,
      blocked_reason:row.blocked_reason||null,
      parent_confirmation:row.parent_confirmation??null,
      observation_only:true,global_mastery_claim:false,
      evidence_type:'CHILD_SELF_REPORT',
      instrument_version:'READY_CENTRAL_CHECKPOINT_V1',
      ready_state:row.state,
      actual_minutes:Number.isFinite(row.actual_ms)&&row.actual_ms>=0
        ?Math.round(row.actual_ms/60000):null,
      checkpoint_completion_is_verified_recall:false};
    return {ok:true,observation:{event_id,occurred_at,
      member_id:session.selected_member_id,payload},
      source_app:'ready-set',type:'READY_LEARNING_OBSERVATION',
      authority:'CHECKPOINT_PROGRESS_ONLY_NOT_VERIFIED_PERFORMANCE'};
  }
  function fromExecutionFriction(candidate={}, {session}={}){
    if(session?.authenticated!==true||!clean(session.family_id)||!clean(session.selected_member_id))
      return {ok:false,reason:'TRUSTED_SELECTED_MEMBER_SESSION_REQUIRED'};
    if(candidate?.authority!=='READY_EXECUTION_FRICTION_OBSERVATION_ONLY'||
       candidate?.observation_only!==true||candidate?.global_mastery_claim!==false)
      return {ok:false,reason:'READY_EXECUTION_FRICTION_OBSERVATION_REQUIRED'};
    if(!clean(candidate.event_id)||!clean(candidate.observed_at)||
       !Number.isFinite(Date.parse(candidate.observed_at))||
       !clean(candidate.assignment_id)||!clean(candidate.subject)||
       !clean(candidate.concept_skill_target))
      return {ok:false,reason:'READY_EXECUTION_FRICTION_SCOPE_REQUIRED'};
    if(['DEADLINE_EXCEEDED','REPEATED_CARRY_NEAR_DEADLINE']
       .includes(clean(candidate.escalation_reason)))
      return {ok:false,reason:'SCHEDULE_PRESSURE_IS_NOT_LEARNING_FRICTION'};
    const forbidden=new Set([
      'verification_receipt','verification_candidate','verified_outcome',
      'planner_date','schedule_date','due_at','deadline','deadline_date',
      'global_mastery_claim_true','auto_award'
    ]);
    function leaks(value){
      if(!value||typeof value!=='object')return false;
      return Object.entries(value).some(([key,nested])=>forbidden.has(key)||leaks(nested));
    }
    if(leaks(candidate))return {ok:false,reason:'READY_EXECUTION_FRICTION_AUTHORITY_LEAK'};

    const payload={
      family_id:session.family_id,
      member_id:session.selected_member_id,
      subject:clean(candidate.subject),
      concept_skill_target:clean(candidate.concept_skill_target),
      assignment_id:clean(candidate.assignment_id),
      evidence_scope_kind:'AGGREGATED_EXECUTION',
      source_carry_over_id:clean(candidate.carry_over_id)||null,
      carry_over_depth:Number.isFinite(Number(candidate.carry_over_depth))
        ?Math.max(0,Number(candidate.carry_over_depth)):null,
      carry_over_state:clean(candidate.carry_over_state)||null,
      escalation_reason:clean(candidate.escalation_reason)||'REPEATED_CARRY_LIMIT',
      observation_count:Number.isFinite(Number(candidate.observation_count))
        ?Math.max(0,Number(candidate.observation_count)):0,
      friction_states:Array.isArray(candidate.states)
        ?candidate.states.map(clean).filter(Boolean).slice(-12):[],
      actual_minutes:Array.isArray(candidate.actual_minutes)
        ?candidate.actual_minutes.filter(Number.isFinite).slice(-12):[],
      observation_only:true,
      global_mastery_claim:false,
      verified_performance:false,
      evidence_type:'READY_EXECUTION_FRICTION_OBSERVATION',
      instrument_version:'READY_CARRY_FRICTION_V1',
      forwarded_ready_friction_observation:true
    };
    return {
      ok:true,
      observation:{
        event_id:clean(candidate.event_id),
        occurred_at:clean(candidate.observed_at),
        member_id:session.selected_member_id,
        payload
      },
      source_app:'ready-set',
      type:'READY_LEARNING_OBSERVATION',
      authority:'EXECUTION_FRICTION_OBSERVATION_ONLY_NOT_PERFORMANCE'
    };
  }

  async function enqueueExecutionFriction(candidate,{session,pipeline}={}){
    if(!pipeline||typeof pipeline.enqueueReadyObservation!=='function')
      return {ok:false,reason:'CENTRAL_PIPELINE_REQUIRED'};
    const mapped=fromExecutionFriction(candidate,{session});
    if(!mapped.ok)return mapped;
    const queued=await pipeline.enqueueReadyObservation(mapped.observation);
    if(!queued||queued.queued!==true&&queued.duplicate!==true)
      return {ok:false,reason:'CENTRAL_OUTBOX_ENQUEUE_NOT_CONFIRMED',queued:queued||null};
    return {ok:true,queued,authority:'LOCAL_OUTBOX_ONLY_NOT_CENTRAL_ACK'};
  }

  async function enqueueOutcome(row,context,{pipeline}={}){
    if(!pipeline||typeof pipeline.enqueueReadyObservation!=='function')
      return {ok:false,reason:'CENTRAL_PIPELINE_REQUIRED'};
    const mapped=fromOutcome(row,context);
    if(!mapped.ok)return mapped;
    // The central pipeline owns authenticated scope re-check, durable queue
    // and transport ACK. Enqueue success is not central storage confirmation.
    const queued=await pipeline.enqueueReadyObservation(mapped.observation);
    if(!queued||queued.queued!==true&&queued.duplicate!==true)
      return {ok:false,reason:'CENTRAL_OUTBOX_ENQUEUE_NOT_CONFIRMED',queued:queued||null};
    return {ok:true,queued,authority:'LOCAL_OUTBOX_ONLY_NOT_CENTRAL_ACK'};
  }
  // One completed task may both return Hide memory and close a centrally
  // allocated checkpoint. Preserve both distinct observations on replay.
  function expandOutcomes(outcomes=[]){
    const expanded=[];
    for(const row of(Array.isArray(outcomes)?outcomes:[])){
      if(row?.centralFeedbackKind==='HIDE_MEMORY'||
         row?.centralFeedbackKind==='CENTRAL_CHECKPOINT_PROGRESS'){
        expanded.push(row);continue;
      }
      if(row?.state==='COMPLETED'&&
         row?.specialistResult?.sourceApp==='hide-seek')
        expanded.push({...row,centralFeedbackKind:'HIDE_MEMORY'});
      if(['COMPLETED','PARTIAL','BLOCKED'].includes(row?.state)&&
         row?.centralCheckpoint?.source==='PLANNER_CENTRAL_LEARNING_CHECKPOINT')
        expanded.push({...row,centralFeedbackKind:'CENTRAL_CHECKPOINT_PROGRESS'});
    }
    return expanded;
  }
  // Prevalidate all eligible completed Hide outcomes before enqueueing any.
  // The outbox may still fail mid-batch; report exact partial state for retry.
  async function enqueueBatch(outcomes,contextForRow,{pipeline}={}){
    if(!Array.isArray(outcomes)||typeof contextForRow!=='function')
      return {ok:false,reason:'EXPLICIT_BATCH_CONTEXT_REQUIRED',results:[]};
    if(!pipeline||typeof pipeline.enqueueReadyObservation!=='function')
      return {ok:false,reason:'CENTRAL_PIPELINE_REQUIRED',results:[]};
    const prepared=[],seen=new Map();
    for(const row of expandOutcomes(outcomes)){
      const isHide=row?.centralFeedbackKind==='HIDE_MEMORY'&&
        row?.state==='COMPLETED'&&row?.specialistResult?.sourceApp==='hide-seek';
      const isCheckpoint=row?.centralFeedbackKind==='CENTRAL_CHECKPOINT_PROGRESS'&&
        ['COMPLETED','PARTIAL','BLOCKED'].includes(row?.state)&&
        row?.centralCheckpoint?.source==='PLANNER_CENTRAL_LEARNING_CHECKPOINT';
      if(!isHide&&!isCheckpoint)continue;
      const context=contextForRow(row);
      const mapped=isCheckpoint?fromCheckpointOutcome(row,context):fromOutcome(row,context);
      if(!mapped.ok)return {ok:false,reason:mapped.reason,results:[]};
      const key=mapped.observation.event_id;
      const fingerprint=JSON.stringify(mapped.observation);
      if(seen.has(key)){
        if(seen.get(key)!==fingerprint)
          return {ok:false,reason:'BATCH_OBSERVATION_ID_CONFLICT',results:[]};
        continue;
      }
      seen.set(key,fingerprint);
      prepared.push(mapped.observation);
    }
    const results=[];
    for(const observation of prepared){
      let queued;
      try{queued=await pipeline.enqueueReadyObservation(observation)}
      catch(error){return {ok:false,reason:'CENTRAL_OUTBOX_ENQUEUE_FAILED',
        results,failed_event_id:observation.event_id};}
      if(!queued||queued.queued!==true&&queued.duplicate!==true)
        return {ok:false,reason:'CENTRAL_OUTBOX_ENQUEUE_NOT_CONFIRMED',
          results,failed_event_id:observation.event_id};
      results.push({event_id:observation.event_id,queued});
    }
    return {ok:true,results,authority:'LOCAL_OUTBOX_ONLY_NOT_CENTRAL_ACK'};
  }
  const api=Object.freeze({VERSION,fromOutcome,fromCheckpointOutcome,fromExecutionFriction,
    expandOutcomes,enqueueOutcome,enqueueExecutionFriction,enqueueBatch});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.ReadyCentralObservationHandoffV01=api;
})();
