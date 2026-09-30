const assert=require('node:assert/strict');
const planner=require('../ready-character-ui-binding-planner-v1.js');
const reg=require('../ready-character-binding-registry-v1.js').registry();
const primary=reg.slots[0];
const vm={ok:true,app_id:reg.app_id,scene_id:'s',asset_generation_allowed:false,
characters:[{character_id:'A',visual_id:'VID-A',presence_role:primary.allowed_presence_roles[0],
 action:'IDLE',dialogue_level:'SHORT',runtime_eligible:true}]};
const out=planner.plan(vm,primary.surface);
assert.equal(out.ok,true);
assert.equal(out.assignments[0].selector,primary.selector);
assert.equal(out.dom_mutation_allowed,false);
assert.equal(out.asset_generation_allowed,false);
assert.equal(planner.mutatesDOM,false);
assert.equal(planner.selectsAssetPath,false);
assert.equal(planner.generatesArt,false);
assert.equal(planner.plan({...vm,app_id:'OTHER'},primary.surface).ok,false);
console.log(JSON.stringify({gate:'CHARACTER_UI_BINDING_PLANNER',app:reg.app_id,pass:true},null,2));

const policy=require('../ready-surface-scene-policy-v1.js').derive();
const surf=primary.surface;
const lim=policy.surfaces[surf].max_visible;
const tooMany={...vm,characters:Array.from({length:lim+1},(_,i)=>({...vm.characters[0],character_id:'X'+i}))};
const blocked=planner.plan(tooMany,surf);
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'SURFACE_POLICY_LIMIT_EXCEEDED');
