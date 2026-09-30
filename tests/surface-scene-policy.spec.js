const assert=require('node:assert/strict');
const p=require('../ready-surface-scene-policy-v1.js');
const r=require('../ready-character-binding-registry-v1.js').registry();
const d=p.derive();
assert.equal(d.ok,true);
for(const [surface,policy] of Object.entries(d.surfaces)){
 const count=r.slots.filter(s=>s.surface===surface).length;
 assert.equal(policy.max_visible,count);
 assert.equal(policy.max_speaking,1);
 assert.equal(policy.asset_generation_allowed,false);
 assert.equal(policy.creates_ui_slots,false);
 assert.equal(policy.design_gate_required,true);
}
assert.equal(p.createsUISlots,false);
assert.equal(p.generatesArt,false);
assert.equal(p.forSurface('__missing__').ok,false);
console.log(JSON.stringify({gate:'SURFACE_SCENE_POLICY',app:d.app_id,surfaces:Object.keys(d.surfaces),pass:true},null,2));
