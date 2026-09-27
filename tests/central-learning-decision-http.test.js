'use strict';
const assert=require('node:assert/strict');
const Client=require('../ready-central-learning-decision-http-v01.js');
const Intake=require('../ready-central-learning-decision-intake-v01.js');
const scope={family_id:'F',member_id:'A',subject:'english',
 concept_skill_target:'vocabulary'};
const coreScope={member_id:'A',subject:'english',concept_skill_target:'vocabulary'};
const result={ok:true,authority:'TAKY_LEARNING_ENGINE_CORE',
 engine_runtime:'TAKY_LEARNING_ENGINE_RUNTIME_V1',scope:coreScope,
 decision:{ok:true,authority:'LEARNING_DECISION_INTENT_ONLY',
 decision_contract:'TAKY_RUNTIME_DECISION_CONTRACT_V1',scope:coreScope,
 consumer_contract:{planner:'OWNS_DATED_ALLOCATION'},
 execution_status:'PEDAGOGICAL_ACTION_AVAILABLE',
 pedagogical_actions:[{intent:'RECALL_RETRY',priority:'HIGH'}],
 adaptive_plan:{ok:true,authority:'LEARNING_ADAPTIVE_PLAN_INTENT_ONLY',
   adaptive_plan_contract:'TAKY_ADAPTIVE_PLAN_INTENT_V1',
   scope:{member_id:'A',subject:'english',concept_skill_target:'vocabulary'}}},
 trace:{evidence_ids:['server-e1'],verified_receipt_id:'server:r1',
  verified_evidence_count:1,basis_kind:'VERIFIED_ONLY'}};
const body={ok:true,authenticated_server_response:true,
 decision_response_version:'TAKY_CENTRAL_LEARNING_DECISION_HTTP_V1',
 receipt_scope:{family_id:'F',member_id:'A'},
 source:'SERVER_DURABLE_VERIFIED_EVIDENCE_ONLY',
 observation_only_excluded:true,observation_proof_promotion:false,runtime_result:result};
const url='https://central.example.test/api/learning/decision';
(async()=>{
 let seen=null;
 const client=Client.create({endpointUrl:url,tokenProvider:async()=> 'opaque-test-token-0001',
  fetchImpl:async (u,opts)=>{seen={u,opts};return {status:200,json:async()=>body}}});
 const received=await client.request(scope);
 assert.equal(received.ok,true);
 assert.equal(seen.u,url);
 assert.equal(seen.opts.method,'POST');
 assert.equal(seen.opts.credentials,'omit');
 assert.equal(seen.opts.redirect,'error');
 assert.equal(seen.opts.cache,'no-store');
 assert.equal(seen.opts.headers.Authorization,'Bearer opaque-test-token-0001');
 assert.deepEqual(JSON.parse(seen.opts.body),scope);
 const accepted=await Intake.receive({sessionProvider:async()=>({
  authenticated:true,family_id:'F',selected_member_id:'A'}),
  decisionProvider:client.request,subject:'english',concept_skill_target:'vocabulary'});
 assert.equal(accepted.ok,true);
 assert.equal(accepted.authority,'CENTRAL_PEDAGOGICAL_INTENT_ONLY');
 assert.equal(accepted.actions[0].intent,'RECALL_RETRY');
 for(const invalid of ['http://central.example.test/api/learning/decision',
  'https://central.example.test/api/learning/evidence',
  'https://central.example.test/api/learning/decision?debug=true'])
  assert.throws(()=>Client.create({endpointUrl:invalid,
   tokenProvider:async()=> 'x',fetchImpl:async()=>({})}),
   /EXPLICIT_HTTPS_CENTRAL_DECISION_ENDPOINT_REQUIRED/);
 const stub=b=>Client.create({endpointUrl:url,tokenProvider:async()=> 'opaque-token-001',
  fetchImpl:async()=>({status:200,json:async()=>b})});
 assert.equal((await stub({...body,receipt_scope:{family_id:'OTHER',member_id:'A'}}).request(scope))
  .reason,'CENTRAL_DECISION_RESPONSE_CONTRACT_INVALID');
 assert.equal((await stub({...body,source:'UNTRUSTED_BROWSER'}).request(scope))
  .reason,'CENTRAL_DECISION_RESPONSE_CONTRACT_INVALID');
 assert.equal((await stub({...body,observation_only_excluded:false}).request(scope))
  .reason,'CENTRAL_DECISION_RESPONSE_CONTRACT_INVALID');
 const advisory={...body,
  source:'SERVER_DURABLE_AUTHENTICATED_ADVISORY_AND_VERIFIED_EVIDENCE',
  observation_only_excluded:false,
  runtime_result:{...result,
   trace:{verified_receipt_id:null,verified_evidence_count:0,
    basis_kind:'OBSERVATION_ADVISORY_ONLY',
    observation_review_evidence_count:1,
    observation_review_digest_sha256:'a'.repeat(64)}}};
 assert.equal((await stub(advisory).request(scope)).ok,true);
 assert.equal((await stub({...advisory,observation_proof_promotion:true}).request(scope))
  .reason,'CENTRAL_DECISION_RESPONSE_CONTRACT_INVALID');
 assert.equal((await stub({...advisory,runtime_result:{...advisory.runtime_result,
  trace:{...advisory.runtime_result.trace,observation_review_digest_sha256:null}}}).request(scope))
  .reason,'CENTRAL_DECISION_RESPONSE_CONTRACT_INVALID');
 const unauthorized=Client.create({endpointUrl:url,tokenProvider:async()=> 'opaque-token-001',
  fetchImpl:async()=>({status:403,json:async()=>({ok:false})})});
 assert.equal((await unauthorized.request(scope)).reason,'CENTRAL_DECISION_AUTHORIZATION_REQUIRED');
 const noToken=Client.create({endpointUrl:url,tokenProvider:async()=> '',
  fetchImpl:async()=>{throw Error('must not call')}});
 assert.equal((await noToken.request(scope)).reason,'CENTRAL_DECISION_TOKEN_REQUIRED');
 console.log('READY_CENTRAL_DECISION_HTTP_CLIENT_PASS: HTTPS, authorized contract, scoped runtime intake, no ambient cookies, forged response denial');
})().catch(e=>{console.error(e);process.exitCode=1});
