'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const root=__dirname;
const context={
  window:{addEventListener(){}},
  document:{
    readyState:'loading',
    addEventListener(){},
    documentElement:{dataset:{}}
  },
  location:{href:'https://ready.example.test/'},
  URL,fetch:async()=>{throw new Error('FETCH_NOT_EXPECTED')},
  CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail}},
  console,setTimeout,clearTimeout,Date,Math,JSON,Object,Array,Set,String,Number,Promise
};
context.globalThis=context;
context.window.window=context.window;
context.window.document=context.document;
context.window.location=context.location;
context.window.fetch=context.fetch;
vm.createContext(context);

for(const file of ['ready-family-member-profile-adapter-v1.js','ready-family-runtime-bootstrap-v1.js']){
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
}

const adapter=context.window.ReadyFamilyMemberProfileAdapterV1;
assert.ok(adapter);
adapter.registerProvider({
  async get(memberId){
    return {member_id:memberId,profile_version:2,display_name:'지우',legal_name:'김지우',nickname:'지우',family_role:'CHILD',birth_date:'2015-03-14',school_stage:'E5',share_name_mode:'NAME_NICKNAME',status:'CONFIRMED',updated_at:'2026-10-09T00:30:00.000Z'};
  },
  async publish(profile){return {projection:profile};}
});
(async()=>{
  const profile=await adapter.resolve('CHILD_A');
  assert.equal(profile.source,'TAKY_CENTRAL');
  assert.equal(profile.projection.member_id,'CHILD_A');
  assert.equal(profile.projection.school_stage,'E5');

  const bootstrap=context.window.ReadyFamilyRuntimeBootstrapV1;
  assert.ok(bootstrap);
  const session={self_member_id:'PARENT_A',authorized_member_ids:['PARENT_A','CHILD_A']};
  assert.equal(bootstrap.resolveMemberBinding({setupMode:'SELF'},session).member_id,'PARENT_A');
  assert.equal(bootstrap.resolveMemberBinding({setupMode:'GUARDIAN_FOR_CHILD'},session).member_id,'CHILD_A');
  assert.equal(bootstrap.resolveMemberBinding({memberId:'CHILD_A',setupMode:'GUARDIAN_FOR_CHILD'},session).source,'EXPLICIT_STABLE_MEMBER');
  assert.equal(bootstrap.resolveMemberBinding({memberId:'OTHER',setupMode:'GUARDIAN_FOR_CHILD'},session).state,'MEMBER_NOT_AUTHORIZED');

  const multi={self_member_id:'PARENT_A',authorized_member_ids:['PARENT_A','CHILD_A','CHILD_B']};
  const unresolved=bootstrap.resolveMemberBinding({setupMode:'GUARDIAN_FOR_CHILD'},multi);
  assert.equal(unresolved.ok,false);
  assert.equal(unresolved.state,'MEMBER_SELECTION_REQUIRED');
  assert.deepEqual([...unresolved.candidates],['CHILD_A','CHILD_B']);

  const identitySource=fs.readFileSync(path.join(root,'ready-onboarding-identity-v1.js'),'utf8');
  assert.match(identitySource,/memberId:null/);
  assert.match(identitySource,/ready-member-profile-local-commit/);
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.ok(html.indexOf('ready-family-member-profile-adapter-v1.js')<html.indexOf('ready-family-runtime-bootstrap-v1.js'));

  console.log('READY_SHARED_FAMILY_PROFILE_PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});


(async()=>{
  const bootstrap=context.window.ReadyFamilyRuntimeBootstrapV1;
  const adapter=context.window.ReadyFamilyMemberProfileAdapterV1;
  let published=null;
  adapter.registerProvider({
    async get(){return null;},
    async publish(profile){published={...profile};return {projection:profile};}
  });
  let current={
    setupMode:'GUARDIAN_FOR_CHILD',
    memberId:null,
    profileVersion:1,
    legalName:'테스트 아이',
    nickname:'탐험가',
    familyRole:'CHILD',
    birthDate:'2015-03-14',
    schoolStage:'E5',
    shareNameMode:'NAME_NICKNAME'
  };
  context.window.ReadyIdentityV1={
    get(){return {...current};},
    displayName(identity){return identity.nickname||identity.legalName;},
    patch(patch){current={...current,...patch};return {...current};},
    syncCore(){},
    render(){}
  };
  context.window.TAKY_FAMILY_RUNTIME={
    apiBaseUrl:'https://taky.example.test',
    async getToken(){return 'token';},
    async getFamilyId(){return 'F1';},
    async currentSession(){return {self_member_id:'PARENT_A',authorized_member_ids:['PARENT_A','CHILD_A']};}
  };
  const migrated=await bootstrap.syncMemberProfile();
  assert.equal(migrated.state,'CENTRAL_PUBLISHED');
  assert.equal(migrated.member_id,'CHILD_A');
  assert.equal(published.member_id,'CHILD_A');
  assert.equal(published.display_name,'탐험가');
  assert.equal(published.school_stage,'E5');
  assert.equal(current.memberId,'CHILD_A');
  assert.equal(context.document.documentElement.dataset.readyMemberProfile,'CENTRAL_PUBLISHED');
  console.log('READY_LOCAL_TO_CENTRAL_PROFILE_MIGRATION_PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
