'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Scope=require('../vendor/taky/storage-scope.js');
const Planner=require('../ready-planner-v01.js');
const Assignments=require('../ready-assignment-domain-v2.js');

const data=new Map();
const storage={
  getItem:k=>data.has(k)?data.get(k):null,
  setItem:(k,v)=>data.set(k,String(v)),
  removeItem:k=>data.delete(k)
};
const legacy={planner:'readyset_planner_v1',assignments:'readyset_assignments_v2',app_state:'readyset_state'};
let current={authenticated:true,family_id:'FAMILY_1',member_id:'CHILD_A'};
global.ReadySetLocalFirst={
  storageKey(scope){return Scope.storageKey(scope,legacy[scope],current)},
  capture(){return Promise.resolve({ok:true})}
};

const planner=Planner.createPlanner(storage);
planner.upsertScheduleCommitment({title:'A piano',source:'READY_LOCAL'});
assert.equal(planner.snapshot().schedule_commitments.length,1);

current={authenticated:true,family_id:'FAMILY_1',member_id:'CHILD_B'};
assert.equal(planner.snapshot().schedule_commitments.length,0,'CHILD_B must not see CHILD_A planner state');
planner.upsertScheduleCommitment({title:'B science',source:'READY_LOCAL'});
assert.equal(planner.snapshot().schedule_commitments[0].title,'B science');

current={authenticated:true,family_id:'FAMILY_1',member_id:'CHILD_A'};
assert.equal(planner.snapshot().schedule_commitments[0].title,'A piano','CHILD_A planner state must survive member switch');

const domain=Assignments.createDomain(storage);
domain.upsertWorkbookRef({name:'A workbook',subject:'영어'});
assert.equal(Object.values(domain.load().workbookRefs).length,1);

current={authenticated:true,family_id:'FAMILY_1',member_id:'CHILD_B'};
assert.equal(Object.values(domain.load().workbookRefs).length,0,'CHILD_B must not see CHILD_A assignment state');
domain.upsertWorkbookRef({name:'B workbook',subject:'과학'});

current={authenticated:true,family_id:'FAMILY_1',member_id:'CHILD_A'};
assert.equal(Object.values(domain.load().workbookRefs)[0].name,'A workbook','CHILD_A assignment state must survive member switch');

const localFirst=fs.readFileSync(require('node:path').join(__dirname,'..','ready-local-first-v01.js'),'utf8');
const freezeAt=localFirst.indexOf('const session_at_capture=familySession()');
const awaitAt=localFirst.indexOf('const db=await openDb()',freezeAt);
assert(freezeAt>=0&&awaitAt>freezeAt,'capture scope must be frozen before first await');
assert(localFirst.includes('const scope_key=scopedScope(logical_scope,session_at_capture)'));
assert(localFirst.includes("ignored_other_members++"));
assert(localFirst.includes("scope_identity"));

current={authenticated:false};
assert.equal(Scope.storageKey('app_state','readyset_state',current),'readyset_state','anonymous local mode keeps legacy key');

console.log('READY_FAMILY_MEMBER_SCOPE_ISOLATION_PASS');
