(function(root,factory){
 const api=factory(
  typeof module!=='undefined'&&module.exports?require('./ready-central-observation-handoff-v01.js'):root?.ReadyCentralObservationHandoffV01,
  typeof module!=='undefined'&&module.exports?require('./ready-central-learning-decision-intake-v01.js'):root?.ReadyCentralLearningDecisionIntakeV01,
  typeof module!=='undefined'&&module.exports?require('./ready-central-learning-decision-http-v01.js'):root?.ReadyCentralLearningDecisionHttpV01,
  typeof module!=='undefined'&&module.exports?require('./ready-central-intent-to-planner-v01.js'):root?.ReadyCentralIntentToPlannerV01
 );
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root&&typeof window!=='undefined')root.ReadyCentralLearningRoundtripV01=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Handoff,Intake,Http,PlannerIntent){
 'use strict';
 const VERSION='READY_CENTRAL_LEARNING_ROUNDTRIP_V1';
 const clean=x=>typeof x==='string'?x.trim():'';
 const same=(a,b)=>a?.authenticated===true&&b?.authenticated===true&&
  a.family_id===b.family_id&&a.selected_member_id===b.selected_member_id;
 function create({sessionProvider,tokenProvider,fetchImpl,indexedDB,dbName,
  evidenceEndpointUrl,decisionEndpointUrl,cryptoProvider,
  centralPipelineFactory,storageAdapter,clock,decisionClientFactory}={}){
  if(typeof sessionProvider!=='function'||typeof tokenProvider!=='function'||
     typeof fetchImpl!=='function')
   throw Error('EXPLICIT_TRUSTED_CENTRAL_HOST_REQUIRED');
  const pipeFactory=centralPipelineFactory||
   globalThis.TakyCentralEvidence?.pipeline?.create;
  if(typeof pipeFactory!=='function')throw Error('AUDITED_CENTRAL_PIPELINE_BUNDLE_REQUIRED');
  const pipeline=pipeFactory({sessionProvider,tokenProvider,fetchImpl,indexedDB,dbName,
   storageAdapter,cryptoProvider,clock,endpointUrl:evidenceEndpointUrl});
  const client=(decisionClientFactory||Http.create)({
   endpointUrl:decisionEndpointUrl,fetchImpl,tokenProvider});
  if(!pipeline||typeof pipeline.enqueueReadyObservation!=='function'||
     typeof pipeline.flushOne!=='function'||typeof pipeline.listActive!=='function'||
     typeof client?.request!=='function')
   throw Error('CENTRAL_PIPELINE_AND_DECISION_CLIENT_REQUIRED');
  async function run({outcomes,observationContextForRow,subject,
   concept_skill_target,planner,candidate_dates,owner='ready-central-roundtrip',
   maxFlushAttempts=30}={}){
   if(typeof observationContextForRow!=='function'||!clean(subject)||
      !clean(concept_skill_target)||!clean(owner)||
      !Number.isInteger(maxFlushAttempts)||maxFlushAttempts<1||maxFlushAttempts>100)
    return {ok:false,reason:'EXPLICIT_ROUNDTRIP_INPUT_REQUIRED'};
   const before=await sessionProvider();
   if(before?.authenticated!==true||!clean(before.family_id)||
      !clean(before.selected_member_id))
    return {ok:false,reason:'ACTIVE_CENTRAL_SESSION_REQUIRED'};
   const contextForRow=row=>{
    const supplied=observationContextForRow(row)||{};
    if(clean(supplied.subject).toLowerCase()!==clean(subject).toLowerCase()||
       clean(supplied.concept_skill_target).toLowerCase()!==clean(concept_skill_target).toLowerCase())
     return {...supplied,subject:'',session:before};
    return {...supplied,session:before};
   };
   const batch=await Handoff.enqueueBatch(outcomes,contextForRow,{pipeline});
   if(!batch.ok)return {...batch,stage:'OBSERVATION_OUTBOX'};
   if(!batch.results.length)
    return {ok:true,scheduled:false,reason:'NO_COMPLETED_HIDE_OBSERVATIONS',
     stage:'OBSERVATION_OUTBOX'};
   const expected=new Set(batch.results.map(x=>'ready-set:ready-set:'+x.event_id));
   let entries=[];
   try{
    for(let attempt=0;attempt<maxFlushAttempts;attempt++){
     entries=await pipeline.listActive('ready-set');
     if([...expected].every(key=>entries.some(x=>x.key===key&&x.status==='ACKED'&&
       ['OBSERVATION_INGEST_RECEIPT','REAL_EVIDENCE_RECEIPT'].includes(x.receipt?.kind))))
       break;
     if(entries.some(x=>expected.has(x.key)&&x.status==='BLOCKED'))
      return {ok:false,reason:'CENTRAL_EVIDENCE_OUTBOX_BLOCKED',stage:'CENTRAL_ACK',batch};
     const flush=await pipeline.flushOne('ready-set',owner);
     if(!flush?.processed)break;
    }
    entries=await pipeline.listActive('ready-set');
   }catch{
    return {ok:false,reason:'CENTRAL_EVIDENCE_OUTBOX_UNAVAILABLE',
     stage:'CENTRAL_ACK',batch};
   }
   if(![...expected].every(key=>entries.some(x=>x.key===key&&x.status==='ACKED'&&
       ['OBSERVATION_INGEST_RECEIPT','REAL_EVIDENCE_RECEIPT'].includes(x.receipt?.kind))))
    return {ok:false,reason:'CENTRAL_EVIDENCE_ACK_PENDING',stage:'CENTRAL_ACK',batch};
   const after=await sessionProvider();
   if(!same(before,after))
    return {ok:false,reason:'CENTRAL_ROUNDTRIP_SESSION_CHANGED',stage:'CENTRAL_ACK'};
   const actionableHide=Handoff.expandOutcomes(outcomes).some(row=>
     row?.centralFeedbackKind==='HIDE_MEMORY'&&row?.state==='COMPLETED'&&
     row?.specialistResult?.sourceApp==='hide-seek');
   if(!actionableHide)
    return {ok:true,scheduled:false,
      reason:'READY_EXECUTION_FACTS_RECORDED_NO_CENTRAL_PEDAGOGICAL_ACTION',
      stage:'CENTRAL_ACK',observation_acknowledged:true,
      authority:'CENTRAL_OBSERVATION_ONLY_NO_PEDAGOGICAL_DECISION'};
   const intent=await Intake.receive({sessionProvider,
    decisionProvider:client.request,subject,concept_skill_target});
   if(!intent.ok)return {ok:false,reason:intent.reason,stage:'CENTRAL_DECISION',
    observation_acknowledged:true};
   // A durable low-confidence advisory cannot be replayed as the answer to an
   // unrelated newly completed task. Verified historical state is separate.
   if(['OBSERVATION_ADVISORY_ONLY','VERIFIED_WITH_OBSERVATION_ADVISORY']
       .includes(intent.trace?.basis_kind)){
    const observed=new Set(intent.trace?.observation_review_evidence_ids||[]);
    if(!batch.results.some(x=>observed.has(x.event_id)))
     return {ok:false,reason:'CENTRAL_ADVISORY_NOT_LINKED_TO_CURRENT_OBSERVATION',
      stage:'CENTRAL_DECISION',observation_acknowledged:true};
   }
   const active=await sessionProvider();
   if(!same(before,active))
    return {ok:false,reason:'CENTRAL_ROUNDTRIP_SESSION_CHANGED',stage:'PLANNER'};
   const planned=PlannerIntent.planAccepted(intent,planner,{
    activeSession:active,candidate_dates});
   return {...planned,stage:planned.ok?'READY_EXECUTION_READY':'PLANNER',
    observation_acknowledged:true,central_intent_authority:intent.authority};
  }
  async function recordExecutionFriction({
   candidate,owner='ready-central-friction',maxFlushAttempts=30
  }={}){
   if(!candidate||!clean(owner)||!Number.isInteger(maxFlushAttempts)||
      maxFlushAttempts<1||maxFlushAttempts>100)
    return {ok:false,reason:'EXPLICIT_FRICTION_RECORD_INPUT_REQUIRED'};
   const before=await sessionProvider();
   if(before?.authenticated!==true||!clean(before.family_id)||
      !clean(before.selected_member_id))
    return {ok:false,reason:'ACTIVE_CENTRAL_SESSION_REQUIRED'};
   const queued=await Handoff.enqueueExecutionFriction(candidate,{session:before,pipeline});
   if(!queued.ok)return {...queued,stage:'OBSERVATION_OUTBOX'};
   const expected='ready-set:ready-set:'+clean(candidate.event_id);
   let entries=[];
   try{
    for(let attempt=0;attempt<maxFlushAttempts;attempt++){
     entries=await pipeline.listActive('ready-set');
     if(entries.some(x=>x.key===expected&&x.status==='ACKED'&&
       ['OBSERVATION_INGEST_RECEIPT','REAL_EVIDENCE_RECEIPT'].includes(x.receipt?.kind)))
      break;
     if(entries.some(x=>x.key===expected&&x.status==='BLOCKED'))
      return {ok:false,reason:'CENTRAL_EVIDENCE_OUTBOX_BLOCKED',stage:'CENTRAL_ACK'};
     const flush=await pipeline.flushOne('ready-set',owner);
     if(!flush?.processed)break;
    }
    entries=await pipeline.listActive('ready-set');
   }catch{
    return {ok:false,reason:'CENTRAL_EVIDENCE_OUTBOX_UNAVAILABLE',stage:'CENTRAL_ACK'};
   }
   if(!entries.some(x=>x.key===expected&&x.status==='ACKED'&&
      ['OBSERVATION_INGEST_RECEIPT','REAL_EVIDENCE_RECEIPT'].includes(x.receipt?.kind)))
    return {ok:false,reason:'CENTRAL_EVIDENCE_ACK_PENDING',stage:'CENTRAL_ACK'};
   const after=await sessionProvider();
   if(!same(before,after))
    return {ok:false,reason:'CENTRAL_ROUNDTRIP_SESSION_CHANGED',stage:'CENTRAL_ACK'};
   return {
    ok:true,scheduled:false,
    reason:'EXECUTION_FRICTION_RECORDED_DIAGNOSTIC_EVIDENCE_PENDING',
    stage:'CENTRAL_ACK',observation_acknowledged:true,
    authority:'CENTRAL_OBSERVATION_ONLY_NO_PEDAGOGICAL_DECISION'
   };
  }
  return Object.freeze({VERSION,run,recordExecutionFriction,close:()=>pipeline.close?.()});
 }
 // Rehydrate a previously persisted Ready record without fabricating a new
 // event time or silently rebinding a legacy unscoped child outcome.
 function optionsFromPersistedRecord(record,{subject,concept_skill_target,planner,
  candidate_dates,maxFlushAttempts}={}){
  const sessionId=clean(record?.session_id||record?.id);
  const occurredAt=clean(record?.completed_at)||
   (Number.isFinite(record?.endAt)?new Date(record.endAt).toISOString():'');
  const bound=record?.central_learning_scope||record?.centralLearningScope;
  const outcomes=record?.task_outcomes||record?.taskOutcomes;
  if(!sessionId||!Number.isFinite(Date.parse(occurredAt))||
     !clean(bound?.family_id)||!clean(bound?.member_id)||
     !clean(subject)||!clean(concept_skill_target)||!Array.isArray(outcomes))
   return {ok:false,reason:'PERSISTED_CENTRAL_RECORD_SCOPE_REQUIRED'};
  const relevant=Handoff.expandOutcomes(outcomes);
  if(relevant.some(row=>!clean(row.task_id)||row.family_id!==bound.family_id||
     row.member_id!==bound.member_id))
   return {ok:false,reason:'PERSISTED_CENTRAL_OUTCOME_SCOPE_MISMATCH'};
  return {ok:true,options:{outcomes:relevant,subject,concept_skill_target,planner,
   candidate_dates,maxFlushAttempts,observationContextForRow:row=>({
    event_id:'ready:'+sessionId+':'+row.task_id+
      (row.centralFeedbackKind==='READY_EXECUTION_FACT'
        ?':execution:'+String(row.state||'UNKNOWN').toLowerCase()
        :row.centralFeedbackKind==='CENTRAL_CHECKPOINT_PROGRESS'
          ?':checkpoint:'+String(row.state||'UNKNOWN').toLowerCase()
          :''),

    occurred_at:occurredAt,
    session_id:sessionId,
    subject,concept_skill_target
   })}};
 }
 // Explicit attachment: the page emits this only after persisting a
 // completed session. No listener is installed without a trusted host.
 function attachReadySession({eventTarget,roundtrip,resolveRecordOptions,onResult}={}){
  if(typeof eventTarget?.addEventListener!=='function'||
     typeof eventTarget?.removeEventListener!=='function'||
     typeof roundtrip?.run!=='function'||
     typeof resolveRecordOptions!=='function'||
     typeof onResult!=='function')
   throw Error('EXPLICIT_READY_CENTRAL_EVENT_HOST_REQUIRED');
  let attached=true;
  const handler=event=>{
   const record=event?.detail;
   if(!attached||!clean(record?.session_id)||!Array.isArray(record?.task_outcomes))
    return;
   Promise.resolve().then(()=>resolveRecordOptions(record))
    .then(options=>roundtrip.run({...options,outcomes:record.task_outcomes}))
    .then(result=>{if(attached)onResult({session_id:record.session_id,result})})
    .catch(()=>{if(attached)onResult({session_id:record.session_id,
      result:{ok:false,reason:'CENTRAL_ROUNDTRIP_HOST_UNAVAILABLE'}})});
  };
  eventTarget.addEventListener('readyset-learning-outcomes-ready',handler);
  return Object.freeze({detach(){
   attached=false;eventTarget.removeEventListener('readyset-learning-outcomes-ready',handler);
  }});
 }
 function attachReadyFriction({eventTarget,roundtrip,onResult}={}){
  if(typeof eventTarget?.addEventListener!=='function'||
     typeof eventTarget?.removeEventListener!=='function'||
     typeof roundtrip?.recordExecutionFriction!=='function'||
     typeof onResult!=='function')
   throw Error('EXPLICIT_READY_FRICTION_CENTRAL_HOST_REQUIRED');
  let attached=true;
  const handler=event=>{
   const candidate=event?.detail;
   if(!attached||candidate?.authority!=='READY_EXECUTION_FRICTION_OBSERVATION_ONLY')
    return;
   Promise.resolve()
    .then(()=>roundtrip.recordExecutionFriction({candidate}))
    .then(result=>{if(attached)onResult({friction_event_id:candidate.event_id,result})})
    .catch(()=>{if(attached)onResult({friction_event_id:candidate.event_id,
      result:{ok:false,reason:'CENTRAL_FRICTION_HOST_UNAVAILABLE'}})});
  };
  eventTarget.addEventListener('readyset-learning-friction-observation-ready',handler);
  return Object.freeze({detach(){
   attached=false;
   eventTarget.removeEventListener('readyset-learning-friction-observation-ready',handler);
  }});
 }

 // Registration is opt-in. It only bridges a separately configured host's
 // authenticated central session and credentials; Ready cannot mint these.
 function installBrowserHost({eventTarget,roundtrip,resolveRecordOptions,
  activeScopeProvider,onResult}={}){
  if(typeof window==='undefined'||typeof activeScopeProvider!=='function')
   throw Error('EXPLICIT_BROWSER_CENTRAL_SCOPE_HOST_REQUIRED');
  if(window.ReadyCentralLearningHost)
   throw Error('CENTRAL_BROWSER_HOST_ALREADY_INSTALLED');
  const target=eventTarget||window;
  const handler=payload=>{
   if(typeof onResult==='function')onResult(payload);
   target.dispatchEvent(new CustomEvent('readyset-central-roundtrip-result',{
    detail:payload
   }));
  };
  const attached=attachReadySession({eventTarget:target,roundtrip,
   resolveRecordOptions,onResult:handler});
  const frictionAttached=typeof roundtrip?.recordExecutionFriction==='function'
   ?attachReadyFriction({eventTarget:target,roundtrip,onResult:handler})
   :Object.freeze({detach(){}});
  const host=Object.freeze({
   activeScope(){
    const scope=activeScopeProvider();
    if(scope?.authenticated!==true||!clean(scope.family_id)||
       !clean(scope.selected_member_id))return null;
    return {authenticated:true,family_id:scope.family_id,
     selected_member_id:scope.selected_member_id};
   },
   detach(){
    attached.detach();
    frictionAttached.detach();
    if(window.ReadyCentralLearningHost===host)
     delete window.ReadyCentralLearningHost;
   }
  });
  window.ReadyCentralLearningHost=host;
  return host;
 }
 return Object.freeze({VERSION,create,optionsFromPersistedRecord,
  attachReadySession,attachReadyFriction,installBrowserHost});
});
