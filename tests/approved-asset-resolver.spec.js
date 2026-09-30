const assert=require('node:assert/strict');
const r=require('../ready-approved-asset-resolver-v1.js');
const REG={assets:[{asset_pointer:'P1',asset_id:'A',visual_id:'VID-A',approval_status:'APPROVED',
 sha256:'a'.repeat(64),runtime_url:'assets/a.png',producer_pointer:'GUIDE:1'}]};
let x=r.resolve('P1',REG,'VID-A');
assert.equal(x.ok,true);assert.equal(x.generation_allowed,false);
assert.equal(r.resolve('P1',REG,'VID-B').reason,'VISUAL_ID_MISMATCH');
assert.equal(r.resolve('MISS',REG,'VID-A').reason,'POINTER_NOT_FOUND');
const HOLD={assets:[{...REG.assets[0],approval_status:'HOLD'}]};
assert.equal(r.resolve('P1',HOLD,'VID-A').reason,'ASSET_NOT_APPROVED');
const plan={ok:true,assignments:[{slot_id:'s',visual_id:'VID-A'}]};
const y=r.resolveAssignments(plan,REG,{s:'P1'});
assert.equal(y.ok,true);assert.equal(y.approved_assets.s.url,'assets/a.png');
assert.equal(r.generatesArt,false);assert.equal(r.acceptsUnapproved,false);
console.log(JSON.stringify({gate:'APPROVED_ASSET_RESOLVER',pass:true},null,2));
