'use strict';
const assert=require('node:assert/strict');
const Crew=require('../vendor/taky/crew-registry.js');
const core=require('../netlify/functions/family-crew-core.js');

const child={authenticated:true,family_id:'F1',member_id:'C1',role:'CHILD',session_id:'S1'};
const parent={authenticated:true,family_id:'F1',member_id:'P1',role:'PARENT',session_id:'S2'};
const familyMembers=[
  {family_id:'F1',member_id:'P1',role:'PARENT'},
  {family_id:'F1',member_id:'C1',role:'CHILD'}
];

assert.equal(core.canWrite(child,'C1').ok,true);
assert.equal(core.canWrite(parent,'C1').ok,false);
assert.equal(core.canRead(parent,'C1',familyMembers).ok,true);
assert.equal(core.canRead(child,'P1',familyMembers).ok,false);

let reg=Crew.defaultRegistry('C1');
assert.equal(reg.roster.length,6);
assert.deepEqual(reg.roster.map(x=>x.canonical_name),['두비','로리','잉크','노바','테이크','제로']);

let patched=core.applyPatch(reg,{primary_companion_id:'crew.core.nova'});
assert.equal(patched.ok,true);
assert.equal(Crew.primary(patched.registry).canonical_name,'노바');

patched=core.applyPatch(patched.registry,{rename:{character_id:'crew.core.nova',display_name:'노바별'}});
assert.equal(patched.ok,true);
assert.equal(Crew.primary(patched.registry).display_name,'노바별');
assert.equal(Crew.primary(patched.registry).name_history[0].name,'노바');

const runtime=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','ready-runtime-v07.js'),'utf8');
assert(runtime.includes('companion_id'));
assert(runtime.includes('companion_name'));
assert(runtime.includes('ReadyCrewRegistry?.primary?.()'));

console.log('READY_FAMILY_CREW_CONTRACT_PASS');
