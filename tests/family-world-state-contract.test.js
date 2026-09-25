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

let s=World.blank('C1');
let r=core.applyOperation(s,{type:'SET_PRIMARY_COMPANION',character_id:'crew.core.dubi'});
assert.equal(r.ok,true);s=r.state;
assert.equal(s.primary_companion_id,'crew.core.dubi');

r=core.applyOperation(s,{type:'RAW_PRESENCE'});
assert.equal(r.ok,true);
assert.equal(r.state.relationships.length,0);

r=core.applyOperation(s,{type:'SET_PRESENCE',character_id:'crew.core.dubi',state:'WITH_EXPLORER'});
assert.equal(r.ok,true);s=r.state;
assert.equal(s.crew_presence[0].state,'WITH_EXPLORER');
assert.equal(s.relationships.length,0);

r=core.applyOperation(s,{type:'RECORD_MEANINGFUL_EPISODE',character_id:'crew.core.dubi',memory_ref:'memory:explicit',source_event_id:'E1'});
assert.equal(r.ok,true);
assert.equal(r.state.relationships[0].meaningful_episode_count,1);

const src=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','ready-world-state-v01.js'),'utf8');
assert(src.includes("detail.payload?.meaningful_episode===true"));
assert(src.includes("detail.payload?.memory_ref"));
assert(!src.includes("source_event_type==='TASK_COMPLETED'&&"),'task completion alone must not create affinity');
console.log('READY_FAMILY_WORLD_STATE_CONTRACT_PASS');
