'use strict';
const assert=require('node:assert/strict');
const {createBadgeReadService,decodeSigningKey,BINDING_CONTRACT}=require('../netlify/functions/badge-reader-server-core.js');
const catalog=require('../netlify/functions/badge-gate-catalog-v1.js');

class MemoryStore{
  constructor(){this.map=new Map;this.rev=0}
  async getWithMetadata(key){
    const x=this.map.get(key);return x?{data:x.data,etag:x.etag}:null;
  }
  async set(key,value,condition={}){
    const cur=this.map.get(key);
    if(condition.onlyIfNew&&cur)return {modified:false};
    if(condition.onlyIfMatch&&cur?.etag!==condition.onlyIfMatch)return {modified:false};
    const etag='"etag-'+(++this.rev)+'"';this.map.set(key,{data:value,etag});
    return {modified:true,etag};
  }
}
const b64=Buffer.alloc(32,7).toString('base64');
assert.equal(decodeSigningKey(''),null);
assert.equal(decodeSigningKey(Buffer.alloc(8).toString('base64')),null);
assert.equal(decodeSigningKey(b64).length,32);

const users=[
 {id:'CHILD_A',appMetadata:{roles:['CHILD'],family_id:'FAMILY_A'}},
 {id:'CHILD_B',appMetadata:{roles:['CHILD'],family_id:'FAMILY_B'}},
 {id:'PARENT_A',appMetadata:{roles:['PARENT'],family_id:'FAMILY_A'}}
];

(async()=>{
  const service=createBadgeReadService({
    currentUser:users[0],listUsers:async()=>users,store:new MemoryStore(),
    signingKeyBase64:b64,catalog
  });
  assert.equal(service.ok,true);

  const locked=await service.progress({badge_id:'BDG-DRAFT-009'});
  assert.equal(locked.ok,true);
  assert.equal(locked.contract,'TAKY_FAMILY_BADGE_READ_V1');
  assert.equal(locked.child_id,'CHILD_A');
  assert.equal(locked.ownership_state,'LOCKED');
  assert.equal(locked.verified_awards,0);

  const own=await service.bindings({badge_ids:['BDG-DRAFT-009','BDG-DRAFT-047']});
  assert.equal(own.ok,true);
  assert.equal(own.contract,BINDING_CONTRACT);
  assert.equal(own.bindings.length,2);
  assert.equal(own.bindings.every(x=>x.approved===false&&x.runtime_active===false),true);

  const forged=await service.progress({badge_id:'BDG-DRAFT-009',child_id:'CHILD_B'});
  assert.equal(forged.ok,false);
  assert.equal(forged.reason,'CHILD_MAY_ONLY_READ_OWN_BADGES');

  const noKey=createBadgeReadService({
    currentUser:users[0],listUsers:async()=>users,store:new MemoryStore(),
    signingKeyBase64:null,catalog
  });
  const unavailable=await noKey.progress({badge_id:'BDG-DRAFT-009'});
  assert.equal(unavailable.ok,false);
  assert.equal(unavailable.reason,'BADGE_LEDGER_SIGNING_KEY_NOT_CONFIGURED');

  const parent=createBadgeReadService({
    currentUser:users[2],listUsers:async()=>users,store:new MemoryStore(),
    signingKeyBase64:b64,catalog
  });
  assert.equal((await parent.bindings({badge_ids:['BDG-DRAFT-009'],child_id:'CHILD_A'})).ok,true);
  assert.equal((await parent.bindings({badge_ids:['BDG-DRAFT-009'],child_id:'CHILD_B'})).ok,false);

  console.log('authenticated badge reader server: ok');
})().catch(e=>{console.error(e);process.exitCode=1});