const assert=require('assert');
const consumer=require('../vendor/taky/explorer-crew/ready-authority-consumer-v1.js');

function storage(){
  const map=new Map();
  return {
    getItem:k=>map.has(k)?map.get(k):null,
    setItem:(k,v)=>map.set(k,String(v)),
    removeItem:k=>map.delete(k)
  };
}
function token(event){
  return Buffer.from(JSON.stringify({v:1,at:'2026-10-01T00:00:00.000Z',event}),'utf8').toString('base64url');
}

assert.equal(consumer.VERSION,'READY_EXPLORER_CREW_AUTHORITY_CONSUMER_V2');
assert.equal(consumer.SYSTEM_VERSION,'EXPLORER_CREW_SYSTEM_V2');
assert.equal(consumer.SYSTEM_BOUND,true);
assert.equal(consumer.AUTHORITY.commit,'bdc6aeb94aaf82dffbcee4f47c170110b7eff959');
assert.equal(consumer.AUTHORITY.contract_version,'CREW_PIPELINE_V1');
assert.equal(consumer.AUTHORITY.manifest_version,'CREW_COMPOSABLE_MANIFEST_V1');
assert.equal(consumer.AUTHORITY.runtime_schema_version,'CREW_RUNTIME_TRACE_V2');
assert.equal(consumer.AUTHORITY.runtime_system_version,'EXPLORER_CREW_SYSTEM_V2');
assert.equal(consumer.AUTHORITY.source_lock_version,'EXPLORER_CREW_V2_SOURCE_LOCK_20261001');
assert.equal(consumer.ownership.relationWrite,false);
assert.equal(consumer.ownership.affinityWrite,false);
assert.equal(consumer.ownership.memoryWrite,false);
assert.equal(consumer.ownership.behaviorOwner,false);
assert.equal(consumer.ownership.assetResolver,false);
assert.equal(consumer.ownership.runtimeOwner,false);
assert.equal(consumer.ownership.canonicalRuntime,'EXPLORER_CREW_SYSTEM_V2');
assert.equal(consumer.ownership.renderer,false);

const s=storage();
let result=consumer.consumeCanonicalEnvelope({
  updated_at:'2026-10-01T00:01:00.000Z',
  state:{relation:{
    main_character_id:'dubi',
    members:{dubi:{character_id:'dubi',relation_state:'MAIN_COMPANION'}}
  }}
},s);
assert.equal(result.ok,true);
assert.equal(result.consumed,true);
assert.equal(consumer.snapshot(s).character_id,'dubi');
assert.equal(consumer.snapshot(s).source,'CANONICAL_STATE_ENVELOPE');

const sameOrigin=storage();
sameOrigin.setItem(consumer.CANONICAL_STATE_KEY,JSON.stringify({
  version:'EXPLORER_CREW_STATE_STORE_V1',
  updated_at:'2026-10-01T00:01:30.000Z',
  revision:4,
  source_app:'snap-pop',
  state:{relation:{
    main_character_id:'ink',
    members:{ink:{character_id:'ink',relation_state:'MAIN_COMPANION'}}
  },memory:{}}
}));
result=consumer.consumeCanonicalStore(sameOrigin);
assert.equal(result.ok,true);
assert.equal(result.consumed,true);
assert.equal(consumer.snapshot(sameOrigin).character_id,'ink');

result=consumer.consumeCanonicalEnvelope({
  state:{relation:{
    main_character_id:'guide-25',
    members:{'guide-25':{character_id:'guide-25',relation_state:'MAIN_COMPANION'}}
  }}
},s);
assert.equal(result.ok,false);
assert.equal(result.reason,'CHARACTER_ID_NOT_COMPATIBLE');
assert.equal(consumer.snapshot(s).character_id,'dubi');

let cleaned=null;
const crewToken=token({
  event_id:'evt-main-zero',
  relation_event:{
    type:'MAIN_CHANGED',
    character_id:'zero',
    at:'2026-10-01T00:02:00.000Z'
  }
});
result=consumer.consumeHandoffUrl('https://ready.test/app?x=1&crew_event='+crewToken+'#keep',{
  storage:s,
  replaceUrl:url=>{cleaned=url}
});
assert.equal(result.ok,true);
assert.equal(result.consumed,true);
assert.equal(result.projection.character_id,'zero');
assert.equal(result.projection.relation_state,'MAIN_COMPANION');

const staleToken=token({
  relation_event:{
    type:'MAIN_CHANGED',
    character_id:'nova',
    at:'2026-09-30T23:59:00.000Z'
  }
});
const stale=consumer.consumeHandoffUrl('https://ready.test/?crew_event='+staleToken,{storage:s});
assert.equal(stale.ok,false);
assert.equal(stale.reason,'STALE_PROJECTION');
assert.equal(consumer.snapshot(s).character_id,'zero');
assert.equal(result.projection.relation_write,false);
assert.equal(result.projection.affinity_write,false);
assert.equal(result.projection.runtime_owner,false);
assert.equal(result.projection.system_version,'EXPLORER_CREW_SYSTEM_V2');
assert.equal(cleaned,'/app?x=1#keep');

const unsupported=token({
  relation_event:{
    type:'SHARED_ACTIVITY',
    character_id:'ink',
    at:'2026-10-01T00:03:00.000Z'
  }
});
result=consumer.consumeHandoffUrl('https://ready.test/?crew_event='+unsupported,{storage:s});
assert.equal(result.ok,false);
assert.equal(result.reason,'UNSUPPORTED_CREW_EVENT');
assert.equal(consumer.snapshot(s).character_id,'zero');

const host={dataset:{}};
assert.equal(consumer.syncHost(host,consumer.snapshot(s)),true);
assert.equal(host.dataset.explorerCrewCharacter,'zero');
assert.equal(host.dataset.explorerCrewRuntime,'CANONICAL_ONLY');
assert.equal(host.dataset.explorerCrewSystemVersion,'EXPLORER_CREW_SYSTEM_V2');
assert.equal(host.dataset.explorerCrewRuntimeOwner,'false');
assert.equal(host.dataset.explorerCrewSourceLock,'EXPLORER_CREW_V2_SOURCE_LOCK_20261001');
assert.equal(host.dataset.explorerCrewRelationWrite,'false');
assert.equal(host.dataset.explorerCrewBehaviorOwner,'false');
assert.equal(host.dataset.explorerCrewAssetResolver,'false');

assert.equal(s.getItem('taky_explorer_crew_canonical_v1'),null,'Ready consumer must never create canonical relation store');

console.log('PASS: Ready consumes shared Exploration Crew authority as a read-only projection');
