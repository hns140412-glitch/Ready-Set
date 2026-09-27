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
  const api=Object.freeze({VERSION,fromOutcome,enqueueOutcome});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.ReadyCentralObservationHandoffV01=api;
})();
