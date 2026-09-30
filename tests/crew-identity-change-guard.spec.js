const assert=require('node:assert/strict');
const g=require('../vendor/taky/explorer-crew-identity-change-v1.js');
const before={
 guide:{name:'Old',voice:'warm',type:'a',id:'a',style:'curious'},
 records:[{id:1}],sessions:[{id:2}],recordingMeta:{id:3},memory:{x:4},activeSession:{id:5},
 crewIdentityHistory:[]
};
const next=g.apply(before,{name:'New',voice:'calm',type:'b',records:[]},{authority_ref:'USER_UI',at:'2026-09-30T12:00:00Z'});
assert.equal(next.guide.name,'New');assert.equal(next.guide.voice,'calm');assert.equal(next.guide.type,'b');
assert.deepEqual(next.records,before.records);assert.deepEqual(next.sessions,before.sessions);assert.deepEqual(next.recordingMeta,before.recordingMeta);assert.deepEqual(next.memory,before.memory);assert.deepEqual(next.activeSession,before.activeSession);
assert.equal(next.crewIdentityHistory.length,3);
assert.equal(g.historyResetAllowed,false);
console.log(JSON.stringify({gate:'CREW_IDENTITY_CHANGE_GUARD',app:'READY_SET',pass:true},null,2));
