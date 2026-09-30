const assert=require('node:assert/strict');
const runtime=require('../ready-crew-live-runtime-v1.js');
const consumer=require('../ready-crew-dialogue-consumer-v1.js');
const c=runtime.legacyCharacter('guide',{utterance:'실제 근거가 있는 말',action:'IDLE',dialogue:'SHORT'});
const plan=runtime.build({sceneId:'home',surface:'home',characters:[c]});
assert.equal(plan.semantic_only,true);assert.equal(plan.generation_allowed,false);assert.equal(plan.asset_selection_allowed,false);assert.equal(c.runtime_eligible,false);
const target={textContent:''};
const doc={querySelector:s=>s===consumer.SURFACES['home']?target:null};
const vm={ok:true,semantic_only:true,app_id:'READY_SET',scene_id:'home',surface:'home',speaking_order:[c.character_id],characters:[c]};
const out=consumer.apply(vm,doc);assert.equal(out.ok,true);assert.equal(target.textContent,'실제 근거가 있는 말');assert.equal(consumer.changesVisualAsset,false);
console.log(JSON.stringify({gate:'LIVE_CREW_SEMANTIC_RUNTIME',app:'READY_SET',pass:true},null,2));

const silent={...c,dialogue_level:'SILENT',voice_allowed:false,utterance:'조용히 보여주는 안내'};
const silentTarget={textContent:''};
const silentDoc={querySelector:s=>s===consumer.SURFACES['home']?silentTarget:null};
const silentVm={ok:true,semantic_only:true,app_id:'READY_SET',scene_id:'home',surface:'home',speaking_order:[],characters:[silent]};
const silentOut=consumer.apply(silentVm,silentDoc);
assert.equal(silentOut.ok,true);assert.equal(silentOut.delivery_mode,'TEXT_ONLY');assert.equal(silentOut.voice_allowed,false);assert.equal(silentTarget.textContent,'조용히 보여주는 안내');
