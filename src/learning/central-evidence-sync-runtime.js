(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.ReadyCentralEvidenceSync=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='READY_CENTRAL_EVIDENCE_SYNC_V1';
  let draining=false;

  function transport(input){
    return input||globalThis.TakyLearningEvidenceTransport||null;
  }

  async function drain({outbox=globalThis.ReadyCentralEvidenceOutbox,transport:providedTransport=null}={}){
    if(draining)return {ok:false,reason:'DRAIN_IN_PROGRESS'};
    if(!outbox?.pending||!outbox?.acknowledge)return {ok:false,reason:'OUTBOX_UNAVAILABLE'};
    const tx=transport(providedTransport);
    if(!tx?.ingest)return {ok:false,reason:'CENTRAL_TRANSPORT_UNAVAILABLE',pending_count:outbox.pending().length};

    draining=true;
    const results=[];
    try{
      for(const packet of outbox.pending()){
        try{
          const response=await tx.ingest(JSON.parse(JSON.stringify(packet)));
          const receiptId=response?.receipt_id||response?.real_evidence_receipt_id||response?.observation_ingest_receipt_id||null;
          const acknowledgementKind=response?.acknowledgement_kind||
            (String(receiptId||'').startsWith('real-evidence:')?'REAL_EVIDENCE_RECEIPT':
             String(receiptId||'').startsWith('observation:')?'OBSERVATION_INGEST_RECEIPT':null);
          const validAckKind=['REAL_EVIDENCE_RECEIPT','OBSERVATION_INGEST_RECEIPT'].includes(acknowledgementKind);
          if(response?.ok===true&&receiptId&&validAckKind){
            const ack=outbox.acknowledge(packet.packet_id,receiptId,response.acknowledged_at||new Date().toISOString());
            results.push({packet_id:packet.packet_id,ok:ack.ok,receipt_id:receiptId,acknowledgement_kind:acknowledgementKind,state:'ACKNOWLEDGED'});
          }else{
            results.push({packet_id:packet.packet_id,ok:false,state:'RETAINED_PENDING',reason:response?.reason||'CENTRAL_ACK_REQUIRED'});
          }
        }catch(error){
          results.push({packet_id:packet.packet_id,ok:false,state:'RETAINED_PENDING',reason:'TRANSPORT_ERROR'});
        }
      }
    }finally{
      draining=false;
    }
    return {
      ok:results.every(x=>x.ok),
      sync_version:VERSION,
      results,
      pending_count:outbox.pending().length,
      invariant:'NO_PACKET_REMOVED_WITHOUT_IMMUTABLE_CENTRAL_INGEST_ACK'
    };
  }

  function autoBoot(){
    if(typeof window==='undefined')return;
    const tryDrain=()=>drain().catch(()=>{});
    window.addEventListener('ready-central-evidence-pending',tryDrain);
    window.addEventListener('online',tryDrain);
    setTimeout(tryDrain,0);
  }

  return Object.freeze({VERSION,drain,autoBoot});
});
