'use strict';
const assert=require('node:assert/strict');
const O=require('../src/learning/central-evidence-outbox.js');

function memoryStorage(){
  const m=new Map();
  return {
    getItem:k=>m.has(k)?m.get(k):null,
    setItem:(k,v)=>m.set(k,String(v)),
    removeItem:k=>m.delete(k)
  };
}
const storage=memoryStorage();
const input={
  source_app:'hide-seek',
  created_at:'2026-09-25T12:00:00.000Z',
  event:{
    source:'hide-seek',
    event_id:'h1',
    occurred_at:'2026-09-25T12:00:00.000Z',
    event_type:'SPECIALIST_RESULT',
    payload:{verification_candidate:{verifier_type:'RETRIEVAL_EXACT_MATCH'}}
  },
  evidence:{event_id:'h1',source_app:'hide-seek'},
  context:{member_id:'A',subject:'영어',concept_skill_target:'vocabulary'}
};
const first=O.enqueue(input,storage);
assert.equal(first.ok,true);
assert.equal(first.deduplicated,false);
assert.equal(O.pending(storage).length,1);
assert.equal(O.pending(storage)[0].event.payload.verification_candidate.verifier_type,'RETRIEVAL_EXACT_MATCH');

const dup=O.enqueue(input,storage);
assert.equal(dup.ok,true);
assert.equal(dup.deduplicated,true);
assert.equal(O.load(storage).length,1);

const premature=O.purgeAcknowledged(storage);
assert.equal(premature.purged_count,0);
assert.equal(premature.remaining_count,1);

const ack=O.acknowledge(first.packet.packet_id,'real-evidence:abc','2026-09-25T12:01:00.000Z',storage);
assert.equal(ack.ok,true);
assert.equal(O.pending(storage).length,0);
assert.equal(O.load(storage).length,1);
assert.equal(O.selfValidate(O.load(storage)).ok,true);

const purged=O.purgeAcknowledged(storage);
assert.equal(purged.purged_count,1);
assert.equal(O.load(storage).length,0);

console.log('READY_CENTRAL_EVIDENCE_OUTBOX_PASS');
