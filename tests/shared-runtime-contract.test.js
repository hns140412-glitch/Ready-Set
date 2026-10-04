const assert=require('assert');
const fs=require('fs');
const path=require('path');
const { execFileSync }=require('child_process');
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
const migrationDoc=fs.readFileSync(path.join(__dirname,'..','READY_SHARED_RUNTIME_MIGRATION_V01.md'),'utf8');
const runtimeV07=fs.readFileSync(path.join(__dirname,'..','ready-runtime-v07.js'),'utf8');

assert.equal(versionMirror.authoritativeSource,'ready-release-v01.js');
assert.equal(versionMirror.appVersion,descriptor.app_version);
assert.equal(versionMirror.runtimeVersion,descriptor.runtime_version);
assert.equal(Number(versionMirror.schemaVersion),Number(descriptor.data_schema_version));
assert.equal(Number(versionMirror.contractVersion),Number(descriptor.contract_version));
assert.equal(versionMirror.releaseId,descriptor.release_id);
assert.equal(versionMirror.masterRevision,descriptor.master_revision);
assert.equal(versionMirror.centralLearningBasis,descriptor.central_learning_basis);
assert.equal(versionMirror.sharedRuntimeBasis,descriptor.shared_runtime_basis);
assert.equal(versionMirror.releaseChannel,descriptor.release_channel);
assert.equal(versionMirror.releaseStatus,descriptor.release_state);
assert.equal(versionMirror.releaseIdPolicy,descriptor.release_id_policy);
assert.equal(versionMirror.buildIdentityPolicy,descriptor.build_identity_policy);
assert.equal(pkg.version,descriptor.app_version);
assert.equal(registry.product_version,descriptor.app_version);
assert.equal(registry.data_schema_version,descriptor.data_schema_version);
assert.equal(registry.build_identity.release_id,descriptor.release_id);
assert.equal(registry.active_authority.release_descriptor,'ready-release-v01.js');
assert.equal(registry.product_version_status,'ACTIVE_ALPHA_PRE_RELEASE__RELEASE_DESCRIPTOR_AUTHORITY');
assert.equal(registry.data_schema_change_status,'ACTIVE_SCHEMA_5__LOAD_MIGRATION_IMPLEMENTED');
assert.equal(registry.session_schema_status,'TRACKING_METADATA_ONLY__ACTIVE_RUNTIME_CONTRACT_REV_07__NOT_RELEASE_AUTHORITY');
assert.equal(registry.shared_runtime.migration_status,'READY_CONSUMER_MERGED_VERIFIED__DEVICE_PRODUCTION_PENDING');
assert(!migrationDoc.includes('CI + BROWSER RUNTIME VALIDATION PENDING'));
assert(migrationDoc.includes('CI + BROWSER RUNTIME VERIFIED'));
assert(!runtimeV07.includes('0.9.3-rc1'));
assert(!runtimeV07.includes('APP_VERSION 0.9.2'));

assert(sw.includes("const CACHE='ready-set:'+RELEASE.release_id"));
assert(!sw.includes(".then(()=>self.skipWaiting())"));
assert(sw.includes("event.data?.type==='APPLY_UPDATE'"));
assert(index.includes('./vendor/taky/release-contract.js'));
assert(index.includes('./vendor/taky/pwa-update-state.js'));
assert(index.includes('./vendor/taky/event-envelope.js'));
assert(index.includes('./vendor/taky/local-queue.js'));
assert(index.includes('./vendor/taky/vision-ingest.js'));
assert(index.includes('./vendor/taky/http-json.js'));
assert(index.includes('./vendor/taky/explorer-crew/ready-authority-consumer-v1.js'));
assert(index.includes('./config.js'));
assert(index.includes('./ready-release-v01.js'));
assert(index.includes('./ready-central-browser-bootstrap-v01.js'));
assert(index.includes('./ready-pwa-update-v01.js'));
assert(sw.includes("'./config.js'"));
assert(sw.includes("'./vendor/taky/explorer-crew/ready-authority-consumer-v1.js'"));
assert(sw.includes("'./ready-central-browser-bootstrap-v01.js'"));
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
assert.equal(visionIngest.validateForRequest(visionResult.result,visionReq.request).ok,true);
const excludedResult=visionIngest.normalizeResult({request_id:visionReq.request.request_id,items:[
  {evidence_source_ids:['answer-1'],provider_payload:{domain:'not-analyzable'}}
]});
assert.equal(visionIngest.validateForRequest(excludedResult.result,visionReq.request).ok,false);
assert.equal(visionIngest.validateForRequest(excludedResult.result,visionReq.request).unknown[0].source_id,'answer-1');
assert(captureAnalysis.includes("item.kind==='ANSWER_REFERENCE'"));
assert(captureAnalysis.includes('VisionIngest.buildRequest'));
assert(captureAnalysis.includes('VisionIngest.validateForRequest'));
assert(captureAnalysis.includes('ANALYSIS_REQUEST_BINDING_MISSING'));
assert(captureAnalysis.includes('ANALYSIS_REQUEST_BINDING_MISMATCH'));
assert(captureAnalysis.includes('ANALYSIS_EVIDENCE_INVALID'));
const serverCapture=fs.readFileSync(path.join(__dirname,'..','netlify/functions/capture-analyze.mjs'),'utf8');
assert(serverCapture.includes('validateCaptureEnvelope'));
assert(serverCapture.includes('validateUploadedImageKeys'));
assert(serverCapture.includes('validateReadyDrafts'));
assert(serverCapture.includes('vision_ingest_request_id:envelope.request_id'));
assert(serverCapture.includes('HIDE_VOCABULARY_UNSUPPORTED'));
execFileSync(process.execPath,['tests/capture-ocr-contract.test.mjs'],{
  cwd:path.join(__dirname,'..'),stdio:'inherit'
});
console.log('PASS: Ready consumes shared vision ingest mechanics while retaining Ready capture/FACT semantics');


assert.equal(httpJson.normalizeStatus(429,{retry_after:'2',now_ms:0}).category,'RATE_LIMITED');
assert.equal(httpJson.normalizeStatus(429,{retry_after:'2',now_ms:0}).retry_after_ms,2000);
assert(syncAdapter.includes('HttpJson.request'));
assert(syncAdapter.includes("credentials:'same-origin'"));
assert(syncAdapter.includes("res.status===409"));
assert(syncAdapter.includes("ReadyFamilySession"));
console.log('PASS: Ready consumes shared HTTP transport while retaining family auth and conflict semantics');
