const assert=require('assert');
const fs=require('fs');
const path=require('path');
const release=require('../vendor/taky/release-contract.js');
const pwa=require('../vendor/taky/pwa-update-state.js');

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
