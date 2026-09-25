'use strict';
const assert=require('node:assert/strict');
const Sync=require('../src/learning/central-evidence-sync-runtime.js');

function fakeOutbox(){
  const rows=[{packet_id:'hide-seek:h1'},{packet_id:'snap-pop:s1'}];
  return {
    rows,
    pending(){return this.rows.filter(x=>x.state!=='ACKNOWLEDGED')},
    acknowledge(id,receipt){
      const row=this.rows.find(x=>x.packet_id===id);
      if(!row)return {ok:false};
      row.state='ACKNOWLEDGED';
      row.receipt_id=receipt;
      return {ok:true,packet:row};
    }
  };
}

(async()=>{
  const noTransport=fakeOutbox();
  const missing=await Sync.drain({outbox:noTransport,transport:null});
  assert.equal(missing.ok,false);
  assert.equal(missing.reason,'CENTRAL_TRANSPORT_UNAVAILABLE');
  assert.equal(missing.pending_count,2);

  const failed=fakeOutbox();
  const failResult=await Sync.drain({
    outbox:failed,
    transport:{ingest:async()=>({ok:false,reason:'TEMPORARY_FAILURE'})}
  });
  assert.equal(failResult.ok,false);
  assert.equal(failResult.pending_count,2);
  assert.equal(failResult.results.every(x=>x.state==='RETAINED_PENDING'),true);

  const partial=fakeOutbox();
  let n=0;
  const partialResult=await Sync.drain({
    outbox:partial,
    transport:{ingest:async(packet)=>{
      n++;
      return n===1
        ? {ok:true,receipt_id:'real-evidence:abc',acknowledged_at:'2026-09-25T12:00:00.000Z'}
        : {ok:false,reason:'TEMPORARY_FAILURE'};
    }}
  });
  assert.equal(partialResult.ok,false);
  assert.equal(partialResult.results[0].state,'ACKNOWLEDGED');
  assert.equal(partialResult.results[1].state,'RETAINED_PENDING');
  assert.equal(partialResult.pending_count,1);
  assert.equal(partialResult.invariant,'NO_PACKET_REMOVED_WITHOUT_REAL_EVIDENCE_RECEIPT_ACK');

  const success=fakeOutbox();
  const successResult=await Sync.drain({
    outbox:success,
    transport:{ingest:async(packet)=>({ok:true,receipt_id:'real-evidence:'+packet.packet_id})}
  });
  assert.equal(successResult.ok,true);
  assert.equal(successResult.pending_count,0);
  assert.equal(successResult.results.every(x=>x.state==='ACKNOWLEDGED'),true);

  console.log('READY_CENTRAL_EVIDENCE_SYNC_PASS');
})().catch(err=>{console.error(err);process.exit(1)});
