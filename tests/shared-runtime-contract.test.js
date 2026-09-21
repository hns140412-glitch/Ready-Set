const assert=require('assert');
const release=require('../vendor/taky/release-contract.js');
const pwa=require('../vendor/taky/pwa-update-state.js');

const descriptor={
  app_id:'ready-set',
  app_version:'1.0.0-alpha.1',
  runtime_version:'ready-runtime-v07',
  data_schema_version:5,
  contract_version:1,
  release_id:'ready-set-1.0.0-alpha.1-r1'
};

assert.equal(release.validateDescriptor(descriptor).ok,true);
assert.equal(release.checkCompatibility(descriptor,{...descriptor,release_id:'peer'}).state,'COMPATIBLE');

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

console.log('PASS: Ready consumes TAKY shared release/PWA primitives');
