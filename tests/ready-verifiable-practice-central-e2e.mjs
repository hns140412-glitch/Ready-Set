import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const TAKY='D:/Git PWA/TAKY';
const Evidence=require(TAKY+'/LEARNING/transport/central-learning-http-endpoint.js');
const {LocalJsonStrongStore}=require(TAKY+'/LEARNING/transport/local-json-strong-store.js');
const ServerVerifier=require(TAKY+'/LEARNING/verification/server-specialist-verifier.js');

const clientSrc=fs.readFileSync('taky-learning-evidence-client-v1.js','utf8');
const producerSrc=fs.readFileSync('ready-verifiable-practice-evidence-v1.js','utf8');

function storage(){
  const m=new Map();
  return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};
}
function sandbox(fetchImpl){
  const listeners={},localStorage=storage(),sessionStorage=storage();
  const window={
    window:null,localStorage,sessionStorage,
    addEventListener(n,f){(listeners[n]??=[]).push(f)},
    dispatchEvent(e){for(const f of listeners[e.type]||[])f(e);return true},
    ReadyIdentityV1:{get:()=>({userId:'CHILD_A'})},
    TAKY_FAMILY_RUNTIME:{
      apiBaseUrl:'https://central.test',
      getToken:async()=> 'validated-bearer-token-001',
      getFamilyId:async()=> 'F1',
      fetchImpl
    },
    state:{activeSession:{rev07:{session_id:'S1',goal_id:'G1',active_task_id:'T1',active_lap_id:'L1'}}}
  };
  window.window=window;
  const context={window,localStorage,sessionStorage,URL,URLSearchParams,Date,JSON,Set,Map,Math,console,
    location:{search:'',href:'https://ready.test/',origin:'https://ready.test',pathname:'/'},
    document:{readyState:'complete',visibilityState:'visible',addEventListener(){},},
    CustomEvent:class{constructor(type,opt={}){this.type=type;this.detail=opt.detail}},
    Event:class{constructor(type){this.type=type}},setTimeout:()=>0,clearTimeout(){},structuredClone:global.structuredClone};
  context.globalThis=context;return context;
}
async function drain(client){
  for(let i=0;i<20;i++){
    const out=await client.flush();
    if(client.pending().length===0)return out;
  }
  return null;
}

const dir=await fsp.mkdtemp(path.join(os.tmpdir(),'ready-practice-e2e-'));
try{
  const store=await new LocalJsonStrongStore(dir).init();
  const principal={authenticated:true,principal_id:'PARENT',identity_provider:'TEST',
    families:[{family_id:'F1',self_member_id:'PARENT',authorized_member_ids:['CHILD_A']}]};
  const verifier=ServerVerifier.create({
    resolveReference:async s=>({
      authority:'SERVER_OWNED_LEARNING_REFERENCE',
      reference_id:'REF:'+s.learning_target_id,
      source_app:s.source_app,
      subject:s.subject,
      concept_skill_target:s.concept_skill_target,
      learning_target_id:s.learning_target_id,
      verifier_type:s.verifier_type,
      verifier_version:'REF_V1',
      match_rule:'CASEFOLD_TRIM',
      expected_values:['apple']
    }),
    resolveHumanReview:async()=>null
  });
  const endpoint=Evidence.create({store,verifyBearerToken:async()=>principal,verifySpecialistEvidence:verifier});
  const fetchImpl=async(url,opt)=>{
    const r=await endpoint.handle({method:opt.method,path:new URL(url).pathname,headers:opt.headers,body:opt.body});
    return {ok:r.status>=200&&r.status<300,status:r.status,json:async()=>JSON.parse(r.body)};
  };

  const ctx=sandbox(fetchImpl);
  vm.createContext(ctx);
  vm.runInContext(clientSrc,ctx,{filename:'taky-learning-evidence-client-v1.js'});
  vm.runInContext(producerSrc,ctx,{filename:'ready-verifiable-practice-evidence-v1.js'});

  const denied=ctx.window.ReadyVerifiablePracticeEvidenceV1.recordExactAnswer({
    subject:'English',concept_skill_target:'vocabulary',learning_target_id:'word:apple',
    response_value:'APPLE',expected_value:'apple'
  });
  assert.equal(denied.ok,false,'client must reject trusted answer material');

  const made=ctx.window.ReadyVerifiablePracticeEvidenceV1.recordExactAnswer({
    subject:'English',concept_skill_target:'vocabulary',learning_target_id:'word:apple',
    response_value:'APPLE',instrument_version:'READY_VOCAB_EXACT_V1'
  });
  assert.equal(made.ok,true,JSON.stringify(made));
  assert.equal(made.event.type,'PRACTICE_RESPONSE_RESULT');
  assert.equal(made.event.payload.evidence_type,'STRUCTURED_PRACTICE_EVIDENCE');
  assert.equal(JSON.stringify(made.event).includes('expected_values'),false);
  assert.equal(JSON.stringify(made.event).includes('correct_answer'),false);

  await new Promise(resolve=>globalThis.setTimeout(resolve,20));
  const flush=await drain(ctx.window.TakyLearningEvidenceClientV1);
  const client=ctx.window.TakyLearningEvidenceClientV1;
  assert.equal(client.pending().length,0,JSON.stringify(flush));
  assert(client.acked().includes('ready-set:'+made.event.event_id),'central ACK ledger must retain the Ready practice event');

  const stored=await store.getWithMetadata('families/F1/members/CHILD_A/learning-engine/state-v1',{type:'json',consistency:'strong'});
  assert(stored?.data,'durable learner state required');
  const verified=Object.values(stored.data.scope_receipts||{}).flatMap(x=>x.canonical_evidence||[])
    .find(x=>x.source_app==='ready-set'&&x.evidence_type==='STRUCTURED_PRACTICE_EVIDENCE');
  assert(verified,'Ready verified practice evidence required');
  assert.equal(verified.verified_outcome,1);
  assert.equal(verified.member_id,'CHILD_A');

  console.log('READY_VERIFIABLE_PRACTICE_CENTRAL_E2E_PASS');
  console.log(JSON.stringify({
    client_answer_reference_exposure:false,
    raw_response_only:true,
    server_owned_reference:true,
    verified_outcome:verified.verified_outcome,
    member_id:verified.member_id,
    durable:true
  }));
} finally {
  await fsp.rm(dir,{recursive:true,force:true,maxRetries:8,retryDelay:75});
}
