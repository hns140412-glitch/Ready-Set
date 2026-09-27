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
   const expected=new Set(batch.results.map(x=>'ready-set:ready-set:'+x.event_id));
   let entries=[];
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
   if(expected.size){
    entries=await pipeline.listActive('ready-set');
    if(![...expected].every(key=>entries.some(x=>x.key===key&&x.status==='ACKED'&&
      ['OBSERVATION_INGEST_RECEIPT','REAL_EVIDENCE_RECEIPT'].includes(x.receipt?.kind))))
     return {ok:false,reason:'CENTRAL_EVIDENCE_ACK_PENDING',stage:'CENTRAL_ACK',batch};
   }
   const after=await sessionProvider();
   if(!same(before,after))
    return {ok:false,reason:'CENTRAL_ROUNDTRIP_SESSION_CHANGED',stage:'CENTRAL_ACK'};
   const intent=await Intake.receive({sessionProvider,
    decisionProvider:client.request,subject,concept_skill_target});
   if(!intent.ok)return {ok:false,reason:intent.reason,stage:'CENTRAL_DECISION',
    observation_acknowledged:true};
   const active=await sessionProvider();
   if(!same(before,active))
    return {ok:false,reason:'CENTRAL_ROUNDTRIP_SESSION_CHANGED',stage:'PLANNER'};
   const planned=PlannerIntent.planAccepted(intent,planner,{
    activeSession:active,candidate_dates});
   return {...planned,stage:planned.ok?'READY_EXECUTION_READY':'PLANNER',
    observation_acknowledged:true,central_intent_authority:intent.authority};
  }
  return Object.freeze({VERSION,run,close:()=>pipeline.close?.()});
 }
 return Object.freeze({VERSION,create});
});
