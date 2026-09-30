const assert=require('node:assert/strict');
const bridge=require('../ready-character-ui-binding-bridge-v1.js');
const vm={ok:true,app_id:require('../ready-character-binding-registry-v1.js').registry().app_id,
 scene_id:'x',surface:'home',asset_generation_allowed:false,
 characters:[{character_id:'A',visual_id:'VID-A',presence_role:'MAIN',action:'IDLE',dialogue_level:'SHORT',runtime_eligible:true}]};
const out=bridge.accept(vm,'home');
assert.equal(out.ok,true);
assert.equal(out.plan.dom_mutation_allowed,false);
assert.equal(out.plan.asset_generation_allowed,false);
assert.equal(bridge.mutatesDOM,false);
assert.equal(bridge.mutatesProductionState,false);
assert.equal(bridge.generatesArt,false);
console.log(JSON.stringify({gate:'CHARACTER_UI_BINDING_EVENT_BRIDGE',pass:true},null,2));
