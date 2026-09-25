const assert=require('assert');
const fs=require('fs');
const path=require('path');
const release=require('../vendor/taky/release-contract.js');
const pwa=require('../vendor/taky/pwa-update-state.js');
const eventEnvelope=require('../vendor/taky/event-envelope.js');
const localQueue=require('../vendor/taky/local-queue.js');
const visionIngest=require('../vendor/taky/vision-ingest.js');
const httpJson=require('../vendor/taky/http-json.js');

delete globalThis.ReadySetReleaseDescriptor;
require('../ready-release-v01.js');
const descriptor=globalThis.ReadySetReleaseDescriptor;

assert.equal(release.validateDescriptor(descriptor).ok,true);
assert.equal(release.checkCompatibility(descriptor,{...descriptor,release_id:'peer'}).state,'COMPATIBLE');

const versionMirror=JSON.parse(fs.readFileSync(path.join(__dirname,'..','VERSION.json'),'utf8'));
const registry=JSON.parse(fs.readFileSync(path.join(__dirname,'..','READY_SET_VERSION_REGISTRY.json'),'utf8'));
const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'..','package.json'),'utf8'));
const sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
const index=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const localFirst=fs.readFileSync(path.join(__dirname,'..','ready-local-first-v01.js'),'utf8');
const syncAdapter=fs.readFileSync(path.join(__dirname,'..','ready-sync-adapter-v01.js'),'utf8');
const captureAnalysis=fs.readFileSync(path.join(__dirname,'..','ready-capture-analysis-adapter-v01.js'),'utf8');

assert.equal(versionMirror.authoritativeSource,'ready-release-v01.js');
assert.equal(versionMirror.appVersion,descriptor.app_version);
assert.equal(Number(versionMirror.schemaVersion),Number(descriptor.data_schema_version));
assert.equal(Number(versionMirror.contractVersion),Number(descriptor.contract_version));
assert.equal(versionMirror.releaseId,descriptor.release_id);
assert.equal(pkg.version,descriptor.app_version);
assert.equal(registry.product_version,descriptor.app_version);
assert.equal(registry.data_schema_version,descriptor.data_schema_version);
assert.equal(registry.build_identity.release_id,descriptor.release_id);
assert.equal(registry.active_authority.release_descriptor,'ready-release-v01.js');

assert(sw.includes("const CACHE='ready-set:'+RELEASE.release_id"));
assert(!sw.includes(".then(()=>self.skipWaiting())"));
assert(sw.includes("event.data?.type==='APPLY_UPDATE'"));
assert(index.includes('./vendor/taky/release-contract.js'));
assert(index.includes('./vendor/taky/pwa-update-state.js'));
assert(index.includes('./vendor/taky/event-envelope.js'));
assert(index.includes('./vendor/taky/local-queue.js'));
assert(index.includes('./vendor/taky/vision-ingest.js'));
assert(index.includes('./vendor/taky/http-json.js'));
assert(index.includes('./ready-release-v01.js'));
assert(index.includes('./ready-pwa-update-v01.js'));
assert(app.includes('globalThis.ReadySetReleaseDescriptor'));
assert(app.includes('globalThis.ReadySetPwaSafePoint=readyPwaSafePoint'));

let s='IDLE';
for(const [event,ctx,expected] of [
  ['DETECT',{},'UPDATE_DETECTED'],
  ['DOWNLOAD_COMPLETE',{},'DOWNLOADED_WAITING'],
  ['EVALUATE_SAFE_POINT',{safe_point:false},'DOWNLOADED_WAITING'],
  ['EVALUATE_SAFE_POINT',{safe_point:true},'SAFE_TO_ACTIVATE'],
  ['ACTIVATE',{},'ACTIVATING'],
  ['CONTROLLER_CHANGED',{},'RESTORING'],
  ['RESTORE_COMPLETE',{},'READY'],
  ['SETTLE',{},'IDLE'],
]){
  const r=pwa.transition(s,event,ctx);
  assert.equal(r.ok,true,event);
  assert.equal(r.state,expected,event);
  s=r.state;
}

const direct=pwa.transition('DOWNLOADED_WAITING','ACTIVATE',{safe_point:true});
assert.equal(direct.ok,false,'waiting worker must not activate without safe-point transition');

console.log('PASS: Ready consumes TAKY shared release/PWA primitives with one release identity');


const evA=eventEnvelope.create({source:'ready-set',event_type:'READY_SCOPE_SNAPSHOT_CAPTURED',payload:{scope:'planner',value:1}});
const evB=eventEnvelope.create({source:'ready-set',event_type:'READY_SCOPE_SNAPSHOT_CAPTURED',payload:{scope:'planner',value:1}});
assert.notEqual(evA.event_id,evB.event_id,'event identity must not be derived from equal payload digest');
assert.equal(evA.payload_digest,evB.payload_digest,'equal payloads should retain equal integrity digest');

let q=localQueue.create({event_id:evA.event_id,idempotency_key:evA.idempotency_key,max_attempts:2,created_at:'2026-09-21T00:00:00.000Z'});
q=localQueue.markInFlight(q,'2026-09-21T00:00:00.000Z').row;
q=localQueue.markRetry(q,'NETWORK','2026-09-21T00:00:00.000Z').row;
assert.equal(q.status,'RETRY');
q=localQueue.markInFlight(q,q.next_retry_at).row;
q=localQueue.markRetry(q,'NETWORK',q.updated_at).row;
assert.equal(q.status,'DEAD_LETTER','bounded retry must end in dead letter');

assert(localFirst.includes("CAP-EVENT-ENVELOPE-001"));
assert(localFirst.includes("CAP-LOCAL-QUEUE-001"));
assert(localFirst.includes("domain_conflict"));
assert(!localFirst.includes("id='evt_'+scope+'_'+digest"),'Ready must not derive event identity from state digest');
assert(syncAdapter.includes("event.event_id||event.id"),'sync adapter must accept shared immutable event identity');

console.log('PASS: Ready consumes shared event envelope/local queue mechanics without absorbing Ready conflict/auth semantics');


const visionReq=visionIngest.buildRequest({
  source:'ready-set:test',
  manifest:[
    {source_id:'src-1',mime_type:'image/jpeg'},
    {source_id:'answer-1',mime_type:'image/jpeg',exclude_from_analysis:true}
  ]
});
assert.equal(visionReq.ok,true);
assert.deepEqual([...visionReq.request.analyzable_source_ids],['src-1']);
const visionResult=visionIngest.normalizeResult({
  request_id:visionReq.request.request_id,
  items:[{evidence_source_ids:['src-1'],provider_payload:{domain:'opaque'}}]
});
assert.equal(visionResult.ok,true);
assert.equal(visionIngest.validateEvidence(visionResult.result,['src-1','answer-1']).ok,true);
assert(captureAnalysis.includes("item.kind==='ANSWER_REFERENCE'"));
assert(captureAnalysis.includes('VisionIngest.buildRequest'));
assert(captureAnalysis.includes('VisionIngest.validateEvidence'));
assert(captureAnalysis.includes('ANALYSIS_EVIDENCE_INVALID'));
console.log('PASS: Ready consumes shared vision ingest mechanics while retaining Ready capture/FACT semantics');


assert.equal(httpJson.normalizeStatus(429,{retry_after:'2',now_ms:0}).category,'RATE_LIMITED');
assert.equal(httpJson.normalizeStatus(429,{retry_after:'2',now_ms:0}).retry_after_ms,2000);
assert(syncAdapter.includes('HttpJson.request'));
assert(syncAdapter.includes("credentials:'same-origin'"));
assert(syncAdapter.includes("res.status===409"));
assert(syncAdapter.includes("ReadyFamilySession"));
console.log('PASS: Ready consumes shared HTTP transport while retaining family auth and conflict semantics');

const readyIndex=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const readyAnswerVerifier=fs.readFileSync(path.join(__dirname,'..','src','learning','answer-key-verifier-runtime.js'),'utf8');
assert(readyIndex.includes('./src/learning/answer-key-verifier-runtime.js'));
assert(readyAnswerVerifier.includes('ReadyAnswerKeyVerifier'));
assert(readyAnswerVerifier.includes('ANSWER_KEY_EXACT'));
assert(readyAnswerVerifier.includes('DETERMINISTIC_LOCAL_MATCH'));
console.log('PASS: Ready exposes deterministic answer-key verification producer without promoting completion to mastery');

const readyAdapterSource=fs.readFileSync(path.join(__dirname,'..','src','learning','learning-engine-adapter-v2.js'),'utf8');
const readyIntegrationSource=fs.readFileSync(path.join(__dirname,'..','ready-integration-v1.js'),'utf8');
assert(readyIndex.includes('./src/learning/learning-engine-adapter-v2.js'));
assert(readyAdapterSource.includes('READY_EXECUTION_ADAPTER_ONLY'));
assert(readyAdapterSource.includes('LEARNING_DECISION_INTENT_ONLY'));
assert(readyAdapterSource.includes('OWNS_DATED_ALLOCATION'));
assert(readyIntegrationSource.includes("legacy_learning_logic:'LEGACY_COMPATIBILITY'"));
assert(readyIntegrationSource.includes('applyLearningEngineDecision'));
console.log('PASS: Ready consumes independent Learning Engine decisions through adapter v2 and retains legacy logic only as compatibility path');
