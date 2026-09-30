const assert=require('node:assert/strict');
const bridge=require('../ready-character-scene-bridge-v1.js');
const plan={pass:true,scene_id:'bridge-test',generation_allowed:false,asset_selection_allowed:false,
  foreground_character_id:'A',speaking_order:['A'],visible_order:['A'],
  characters:[{character_id:'A',visual_id:'VID-A',presence_role:'MAIN',relationship_state:'KNOWN',
    action:'IDLE',dialogue_level:'SHORT',required_roles:['BODY','FACE'],runtime_eligible:true}]};
const out=bridge.accept(plan);
assert.equal(out.ok,true);
assert.equal(out.view_model.scene_id,'bridge-test');
assert.equal(out.view_model.asset_generation_allowed,false);
assert.equal(bridge.mutatesUI,false);
assert.equal(bridge.mutatesProductionState,false);
assert.equal(bridge.generatesArt,false);
assert.equal(bridge.accept({...plan,generation_allowed:true}).ok,false);
console.log(JSON.stringify({gate:'CHARACTER_SCENE_EVENT_BRIDGE',pass:true},null,2));
