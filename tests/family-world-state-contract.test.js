'use strict';
const assert=require('node:assert/strict');
const World=require('../vendor/taky/world-state.js');
const core=require('../netlify/functions/family-world-state-core.js');

const child={authenticated:true,family_id:'F1',member_id:'C1',role:'CHILD',session_id:'S1'};
const parent={authenticated:true,family_id:'F1',member_id:'P1',role:'PARENT',session_id:'S2'};
const members=[{family_id:'F1',member_id:'P1',role:'PARENT'},{family_id:'F1',member_id:'C1',role:'CHILD'}];

assert.equal(core.canRead(child,'C1',members).ok,true);
assert.equal(core.canRead(parent,'C1',members).ok,true);
assert.equal(core.canWrite(child,'C1').ok,true);
assert.equal(core.canWrite(parent,'C1').ok,false);

let s=World.empty('C1');
let r=core.applyEvent(s,{
  event_id:'W1',
  type:'SET_MAIN_COMPANION',
  character_id:'crew.core.dubi',
  occurred_at:'2026-09-26T00:00:00.000Z'
});
assert.equal(r.ok,true); s=r.world;
assert.equal(s.crew['crew.core.dubi'].state,'MAIN_COMPANION');

r=core.applyEvent(s,{
  event_id:'W2',
  type:'CREW_STATE_SET',
  character_id:'crew.core.lori',
  state:'AT_HUB',
  location_ref:'base-camp',
  occurred_at:'2026-09-26T00:01:00.000Z'
});
assert.equal(r.ok,true); s=r.world;
assert.equal(s.crew['crew.core.lori'].state,'AT_HUB');

r=core.applyEvent(s,{
  event_id:'W3',
  type:'SPECIAL_EVENT_STARTED',
  character_id:'crew.core.nova',
  location_ref:'special-zone',
  occurred_at:'2026-09-26T00:02:00.000Z'
});
assert.equal(r.ok,true); s=r.world;
assert.equal(s.crew['crew.core.nova'].state,'SPECIAL_EVENT');

r=core.applyEvent(s,{
  event_id:'W4',
  type:'RETURN_REUNION_RECORDED',
  character_id:'crew.core.nova',
  occurred_at:'2026-09-26T00:03:00.000Z'
});
assert.equal(r.ok,true); s=r.world;
assert.equal(s.events.length,4);
assert.equal(s.absence_penalty,false);
assert.equal(s.full_daily_simulation,false);

const duplicate=core.applyEvent(s,{
  event_id:'W4',
  type:'RETURN_REUNION_RECORDED',
  character_id:'crew.core.nova'
});
assert.equal(duplicate.ok,true);
assert.equal(duplicate.reason,'IDEMPOTENT_ALREADY_APPLIED');
assert.equal(duplicate.world.revision,s.revision);

const synthetic=World.canonicalFromSynthetic({member_id:'C1'});
assert.equal(synthetic.ok,false);
assert.equal(synthetic.reason,'SYNTHETIC_WORLD_STATE_NOT_CANONICAL');

console.log('READY_FAMILY_WORLD_STATE_CONTRACT_PASS');
