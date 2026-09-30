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

assert.equal(consumer.AUTHORITY.commit,'55547a7c4c859a1aae700405fdba4a302a2c20d3');
assert.equal(consumer.AUTHORITY.contract_version,'CREW_PIPELINE_V1');
assert.equal(consumer.AUTHORITY.manifest_version,'CREW_COMPOSABLE_MANIFEST_V1');
assert.equal(consumer.AUTHORITY.runtime_schema_version,'CREW_RUNTIME_TRACE_V1');
assert.equal(consumer.ownership.relationWrite,false);
assert.equal(consumer.ownership.affinityWrite,false);
assert.equal(consumer.ownership.memoryWrite,false);
assert.equal(consumer.ownership.behaviorOwner,false);
assert.equal(consumer.ownership.assetResolver,false);
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
assert.equal(result.projection.relation_write,false);
assert.equal(result.projection.affinity_write,false);
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
assert.equal(host.dataset.explorerCrewRelationWrite,'false');
assert.equal(host.dataset.explorerCrewBehaviorOwner,'false');
assert.equal(host.dataset.explorerCrewAssetResolver,'false');

assert.equal(s.getItem('taky_explorer_crew_canonical_v1'),null,'Ready consumer must never create canonical relation store');

console.log('PASS: Ready consumes shared Exploration Crew authority as a read-only projection');
