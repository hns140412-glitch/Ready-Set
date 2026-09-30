const assert=require('node:assert/strict');
const r=require('../ready-character-binding-registry-v1.js');
const reg=r.registry();
assert.equal(reg.schema,'TAKY_UI_BINDING_CONTRACT_V1');
assert.equal(reg.app_id,'READY_SET');
assert.ok(Array.isArray(reg.slots)&&reg.slots.length>0);
for(const s of reg.slots){
  assert.equal(s.approved_only,true);
  assert.equal(s.design_gate_required,true);
  assert.equal(s.allow_generation,false);
  assert.ok(Array.isArray(s.allowed_presence_roles)&&s.allowed_presence_roles.length>0);
}
assert.equal(r.createsNewUISlot,false);
assert.equal(r.generatesArt,false);
console.log(JSON.stringify({gate:'CHARACTER_BINDING_REGISTRY',app:reg.app_id,slots:reg.slots.length,pass:true},null,2));
