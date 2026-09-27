(() => {
  'use strict';
  // Explicit observation handoff only. No token minting, transport ACK, policy
  // decision, or Planner scheduling is inferred from a completed Ready task.
  const VERSION='READY_CENTRAL_OBSERVATION_HANDOFF_V1';
  const clean=x=>typeof x==='string'?x.trim():'';
  function fromOutcome(row,{session,event_id,occurred_at,subject,concept_skill_target}={}){
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
      member_id,family_id:session.family_id,subject,concept_skill_target,
      source_task_id:row.task_id,observation_only:true,global_mastery_claim:false,
      memory_summary:structuredClone(row.specialistResult.memorySummary)
    };
    return {ok:true,observation:{event_id,occurred_at,member_id,payload},
      source_app:'ready-set',type:'READY_LEARNING_OBSERVATION',
      authority:'OBSERVATION_ONLY_NOT_CENTRAL_DECISION'};
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
  // Prevalidate all eligible completed Hide outcomes before enqueueing any.
  // The outbox may still fail mid-batch; report exact partial state for retry.
  async function enqueueBatch(outcomes,contextForRow,{pipeline}={}){
    if(!Array.isArray(outcomes)||typeof contextForRow!=='function')
      return {ok:false,reason:'EXPLICIT_BATCH_CONTEXT_REQUIRED',results:[]};
    if(!pipeline||typeof pipeline.enqueueReadyObservation!=='function')
      return {ok:false,reason:'CENTRAL_PIPELINE_REQUIRED',results:[]};
    const prepared=[],seen=new Map();
    for(const row of outcomes){
      if(row?.state!=='COMPLETED'||row?.specialistResult?.sourceApp!=='hide-seek')continue;
      const context=contextForRow(row);
      const mapped=fromOutcome(row,context);
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
  const api=Object.freeze({VERSION,fromOutcome,enqueueOutcome,enqueueBatch});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.ReadyCentralObservationHandoffV01=api;
})();
