'use strict';
const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const Orchestrator=require('../ready-central-learning-roundtrip-v01.js');
const Planner=require('../ready-planner-v01.js');
const source=fs.readFileSync(path.join(__dirname,'../vendor/taky-central-evidence-v1.js'),'utf8');
const browser={crypto:webcrypto,TextEncoder,structuredClone,URL,console};
browser.globalThis=browser;
vm.runInNewContext(source,browser,{timeout:2000});
assert.equal(typeof browser.TakyCentralEvidence.pipeline.create,'function');

function store(){
 let version=0,data={entries:[]};
 return {async read(){return {version,data:structuredClone(data)}},
 async compareAndSwap(expected,next){
  if(version!==expected)return false;
  version++;data=structuredClone(next);return true;},
 async close(){}};
}
const scope={family_id:'F1',member_id:'CHILD_A',subject:'english',
 concept_skill_target:'vocabulary'};
const coreScope={member_id:'CHILD_A',subject:'english',
 concept_skill_target:'vocabulary'};
const session={authenticated:true,family_id:'F1',selected_member_id:'CHILD_A'};
const adaptive={ok:true,adaptive_plan_contract:'TAKY_ADAPTIVE_PLAN_INTENT_V1',
 authority:'LEARNING_ADAPTIVE_PLAN_INTENT_ONLY',scope:coreScope,
 unit_span_policy:'KEEP',add_checkpoint:true,add_retrieval_checkpoint:true,
 assistance_policy:'UNCHANGED',target_learning_ids:[]};
const runtime={ok:true,authority:'TAKY_LEARNING_ENGINE_CORE',
 engine_runtime:'TAKY_LEARNING_ENGINE_RUNTIME_V1',scope:coreScope,
 decision:{ok:true,authority:'LEARNING_DECISION_INTENT_ONLY',
 decision_contract:'TAKY_RUNTIME_DECISION_CONTRACT_V1',scope:coreScope,
 consumer_contract:{planner:'OWNS_DATED_ALLOCATION'},
 execution_status:'PEDAGOGICAL_ACTION_AVAILABLE',
 pedagogical_actions:[{intent:'RETRIEVAL_CHECKPOINT',priority:'HIGH'}],
 adaptive_plan:adaptive},
 trace:{verified_receipt_id:'real-evidence:server-r1',verified_evidence_count:1,
 evidence_ids:['prior-server-verified-e1']}};
let decisionRuntime=runtime,member='CHILD_A',evidenceResponses=0,seenObservation=null;
let evidenceDown=false,changeMemberOnDecision=false;
const fetchImpl=async(url,opts)=>{
 if(url.endsWith('/api/learning/evidence')){
  evidenceResponses++;
  const packet=JSON.parse(opts.body);
  seenObservation=packet.event.payload;
  if(evidenceDown)return {status:503,json:async()=>({ok:false})};
  return {status:200,json:async()=>({ok:true,storage_confirmed:true,
   acknowledgement_kind:'OBSERVATION_INGEST_RECEIPT',
   receipt_id:'observation:durably-saved-1',duplicate:false,
   receipt_scope:{family_id:packet.context.family_id,member_id:packet.context.member_id},
   source_app:packet.source_app,packet_id:packet.packet_id,event_id:packet.event.event_id})};
 }
 if(url.endsWith('/api/learning/decision')){
  if(changeMemberOnDecision)member='CHILD_B';
  return {status:200,json:async()=>({ok:true,authenticated_server_response:true,
   decision_response_version:'TAKY_CENTRAL_LEARNING_DECISION_HTTP_V1',
   receipt_scope:{family_id:'F1',member_id:'CHILD_A'},
   source:'SERVER_DURABLE_VERIFIED_EVIDENCE_ONLY',
   observation_only_excluded:true,runtime_result:decisionRuntime})};
 }
 throw Error('UNEXPECTED_HTTP_URL:'+url);
};
const sessionProvider=async()=>({...session,selected_member_id:member});
const plannerStorage=new Map();
const planner=Planner.createPlanner({getItem:k=>plannerStorage.get(k)||null,
 setItem:(k,v)=>plannerStorage.set(k,v)});
planner.upsertDailyAvailabilityWindow({date:'2026-09-30',start:'16:00',
 end:'17:00',source:'PARENT_CONFIRMED',confirmed:true});
const row={state:'COMPLETED',task_id:'task-1',
 specialistResult:{sourceApp:'hide-seek',taskState:'COMPLETED',
  memorySummary:{authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
   prioritySemantics:'ADVISORY_SIGNAL_NOT_DATE',
   averageMemoryStrength:41,reviewAdvisories:[{lexicalId:'word-a'}]}}};
const context=row=>({event_id:'evt:'+row.task_id,
 occurred_at:'2026-09-27T01:00:00.000Z',subject:'english',
 concept_skill_target:'vocabulary'});
(async()=>{
 const runtimeHost=Orchestrator.create({
  sessionProvider,tokenProvider:async()=> 'verified-test-token-0001',fetchImpl,
  evidenceEndpointUrl:'https://central.example.test/api/learning/evidence',
  decisionEndpointUrl:'https://central.example.test/api/learning/decision',
  storageAdapter:store(),cryptoProvider:webcrypto,
  centralPipelineFactory:browser.TakyCentralEvidence.pipeline.create
 });
 const args={outcomes:[row],observationContextForRow:context,
  subject:'english',concept_skill_target:'vocabulary',planner,
  candidate_dates:['2026-09-30']};
 const result=await runtimeHost.run(args);
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.scheduled,true);
 assert.equal(result.observation_acknowledged,true);
 assert.equal(result.central_intent_authority,'CENTRAL_PEDAGOGICAL_INTENT_ONLY');
 assert.equal(result.todo.date,'2026-09-30');
 assert.deepEqual(result.todo.activity_sequence,['RETRIEVAL_CHECKPOINT']);
 assert.equal(seenObservation.forwarded_source_app,'hide-seek');
 assert.equal(seenObservation.memorySummary.reviewAdvisories[0].lexicalId,'word-a');
 assert.equal(seenObservation.global_mastery_claim,false);
 const reuse=await runtimeHost.run(args);
 assert.equal(reuse.ok,true);
 assert.equal(reuse.reused,true);
 assert.equal(evidenceResponses,1,'already ACKed observation must not send again');
 assert.equal(planner.snapshot().dated_todos.length,1);
 decisionRuntime={...runtime,decision:{...runtime.decision,
  execution_status:'HOLD_FOR_MORE_RELIABLE_INTERPRETATION'}};
 const held=await runtimeHost.run(args);
 assert.equal(held.ok,false);
 assert.equal(held.stage,'CENTRAL_DECISION');
 assert.equal(planner.snapshot().dated_todos.length,1);
 decisionRuntime=runtime;
 changeMemberOnDecision=true;
 const switched=await runtimeHost.run(args);
 assert.equal(switched.ok,false);
 assert.equal(switched.reason,'CENTRAL_DECISION_SESSION_CHANGED');
 changeMemberOnDecision=false;member='CHILD_A';
 evidenceDown=true;
 const pending=await runtimeHost.run({...args,outcomes:[{...row,task_id:'task-2'}],
  maxFlushAttempts:1});
 assert.equal(pending.ok,false);
 assert.equal(pending.stage,'CENTRAL_ACK');
 assert.equal(pending.reason,'CENTRAL_EVIDENCE_ACK_PENDING');
 assert.equal(planner.snapshot().dated_todos.length,1);
 await runtimeHost.close();
 const appSource=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
 assert(appSource.includes("new CustomEvent('readyset-learning-outcomes-ready'"));
 const listeners=new Map();
 const eventTarget={addEventListener:(key,fn)=>listeners.set(key,fn),
  removeEventListener:(key,fn)=>{if(listeners.get(key)===fn)listeners.delete(key)}};
 const delivered=new Promise(resolve=>{
  const attached=Orchestrator.attachReadySession({eventTarget,
   roundtrip:{run:async args=>{
    assert.equal(args.outcomes[0].task_id,'task-1');
    return {ok:true,stage:'READY_EXECUTION_READY'};
   }},
   resolveRecordOptions:record=>{
    assert.equal(record.session_id,'session-real-1');
    return {subject:'english',concept_skill_target:'vocabulary'};
   },
   onResult:result=>{attached.detach();resolve(result);}
  });
  listeners.get('readyset-learning-outcomes-ready')({detail:{
   session_id:'session-real-1',task_outcomes:[row]}});
 });
 const deliveredResult=await delivered;
 assert.equal(deliveredResult.result.ok,true);
 assert.equal(listeners.size,0);
 console.log('READY_CENTRAL_VERTICAL_SLICE_PASS: real vendored outbox enqueue/ACK, HTTPS LE decision intake, Planner confirmed TODO and Ready activity, replay/HOLD/member switch/HTTP retry');
})().catch(e=>{console.error(e);process.exitCode=1});
