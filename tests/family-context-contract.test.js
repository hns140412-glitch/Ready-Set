'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Family=require('../vendor/taky/family-context.js');
const authCore=require('../netlify/functions/ready-family-auth-core.js');

const anon=Family.normalize({});
assert.equal(anon.auth_state,'ANONYMOUS_LOCAL');
assert.equal(Family.requireRole(anon,'PARENT').reason,'PARENT_AUTH_REQUIRED');

const mapped=authCore.familySessionFromIdentityUser({
  id:'child_a',
  email:'child@example.test',
  roles:['CHILD'],
  appMetadata:{roles:['CHILD'],family_id:'family_1'}
});
assert.equal(mapped.ok,true);
assert.equal(mapped.session.family_context_contract,'TAKY_FAMILY_CONTEXT_V1');
assert.equal(mapped.session.auth_provider,'NETLIFY_IDENTITY');
assert.equal(mapped.session.family_id,'family_1');
assert.equal(mapped.session.member_id,'child_a');
assert.equal(mapped.session.role,'CHILD');

const ready=fs.readFileSync(require('node:path').join(__dirname,'..','ready-family-session-v01.js'),'utf8');
assert(ready.includes('const FamilyContext=globalThis.TakyFamilyContext'));
assert(ready.includes('FamilyContext.validate(input)'));
assert(ready.includes("FamilyContext.requireRole(current(),'PARENT')"));
assert(!ready.includes("const ROLES=new Set(['CHILD','PARENT'])"),'Ready must not redefine family roles');

const bridge=fs.readFileSync(require('node:path').join(__dirname,'..','ready-runtime-v07.js'),'utf8');
assert(bridge.includes('family_id'));
assert(bridge.includes('member_id'));
assert(!bridge.includes("url.searchParams.set('role'"),'specialist launch must not export role authority');
assert(!bridge.includes("url.searchParams.set('auth_provider'"),'specialist launch must not export auth provider');

console.log('READY_FAMILY_CONTEXT_CONTRACT_PASS');
