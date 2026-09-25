'use strict';
const assert=require('node:assert/strict');
const Registry=require('../vendor/taky/family-member-registry.js');
const core=require('../netlify/functions/family-member-registry-core.js');

const users=[
  {id:'parent_1',roles:['PARENT'],appMetadata:{roles:['PARENT'],family_profile:{display_name:'보호자'}}},
  {id:'child_a',roles:['CHILD'],appMetadata:{roles:['CHILD'],family_id:'family_parent_1',family_profile:{display_name:'아이A',avatar_ref:'drive:avatar:a'}}},
  {id:'child_b',roles:['CHILD'],appMetadata:{roles:['CHILD'],family_id:'family_parent_1',family_profile:{display_name:'아이B'}}},
  {id:'other',roles:['CHILD'],appMetadata:{roles:['CHILD'],family_id:'family_other',family_profile:{display_name:'다른가족'}}}
];

const parentSession={authenticated:true,family_id:'family_parent_1',member_id:'parent_1',role:'PARENT',session_id:'S1'};
const parentReg=core.registryForSession(parentSession,users);
assert.equal(parentReg.ok,true);
assert.equal(parentReg.registry.members.length,3);
assert.equal(Registry.children(parentReg.registry).length,2);
assert.equal(parentReg.registry.members.some(m=>m.member_id==='other'),false);

const childSession={authenticated:true,family_id:'family_parent_1',member_id:'child_a',role:'CHILD',session_id:'S2'};
const childReg=core.registryForSession(childSession,users);
assert.equal(childReg.ok,true);
assert.deepEqual(childReg.registry.members.map(m=>m.member_id),['child_a']);

assert.equal(core.canEditProfile(childSession,'child_a').ok,true);
assert.equal(core.canEditProfile(childSession,'child_b').ok,false);
assert.equal(core.canEditProfile(parentSession,'child_b').ok,true);

assert.equal(core.sanitizeProfilePatch({display_name:'새 이름',avatar_ref:'drive:avatar:new'}).ok,true);
assert.equal(core.sanitizeProfilePatch({display_name:'아이',avatar_ref:'data:image/png;base64,abc'}).ok,false);

const child=parentReg.registry.members.find(m=>m.member_id==='child_a');
assert.deepEqual(Registry.minimalProjection(child),{member_id:'child_a',display_name:'아이A',avatar_ref:'drive:avatar:a'});

const runtime=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','ready-runtime-v07.js'),'utf8');
assert(runtime.includes('actor_member_id: family.member_id || null'));
assert(runtime.includes("family.role === 'PARENT' ? window.ReadyFamilyRegistry?.activeChild?.() : null"));
assert(runtime.includes("if (!executionContext.member_id) return"));
assert(runtime.includes("member_display_name"));

console.log('READY_FAMILY_MEMBER_REGISTRY_PASS');
