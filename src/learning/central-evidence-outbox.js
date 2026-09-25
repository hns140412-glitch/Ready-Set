(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.ReadyCentralEvidenceOutbox=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='READY_CENTRAL_EVIDENCE_OUTBOX_V1';
  const STORAGE_KEY='ready_central_evidence_outbox_v1';
  const clean=v=>String(v??'').trim();

  function load(storage=globalThis.localStorage){
    try{
      const parsed=JSON.parse(storage?.getItem?.(STORAGE_KEY)||'[]');
      return Array.isArray(parsed)?parsed:[];
    }catch{return []}
  }

  function save(rows,storage=globalThis.localStorage){
    storage?.setItem?.(STORAGE_KEY,JSON.stringify(Array.isArray(rows)?rows:[]));
    return rows;
  }

  function packetId(input={}){
    const eventId=clean(input?.event?.event_id||input?.evidence?.event_id);
    const source=clean(input.source_app||input?.event?.source||input?.event?.app||input?.evidence?.source_app);
    if(!eventId||!source)return null;
    return source+':'+eventId;
  }

  function enqueue(input={},storage=globalThis.localStorage){
    const id=packetId(input);
    if(!id)return {ok:false,reason:'PACKET_IDENTITY_REQUIRED'};
    const rows=load(storage);
    const existing=rows.find(x=>x.packet_id===id);
    if(existing)return {ok:true,packet:existing,deduplicated:true,rows};

    const packet={
      packet_id:id,
      packet_version:VERSION,
      created_at:clean(input.created_at)||new Date().toISOString(),
      source_app:clean(input.source_app||input?.event?.source||input?.event?.app||input?.evidence?.source_app),
      event:input.event?JSON.parse(JSON.stringify(input.event)):null,
      evidence:input.evidence?JSON.parse(JSON.stringify(input.evidence)):null,
      context:input.context?JSON.parse(JSON.stringify(input.context)): {},
      verification_input:input.verification_input?JSON.parse(JSON.stringify(input.verification_input)):null,
      transport_state:'PENDING_CENTRAL_INGEST',
      acknowledged_receipt_id:null,
      acknowledgement_kind:null,
      acknowledged_at:null
    };
    rows.push(packet);
    save(rows.slice(-500),storage);
    try{root?.dispatchEvent?.(new CustomEvent('ready-central-evidence-pending',{detail:{packet_id:id}}));}catch{}
    return {ok:true,packet,deduplicated:false,rows:load(storage)};
  }

  function pending(storage=globalThis.localStorage){
    return load(storage).filter(x=>x.transport_state!=='ACKNOWLEDGED');
  }

  function acknowledge(packet_id,receipt_id,at=null,storage=globalThis.localStorage){
    const id=clean(packet_id),receipt=clean(receipt_id);
    if(!id||!receipt)return {ok:false,reason:'ACK_METADATA_REQUIRED'};
    const acknowledgementKind=receipt.startsWith('real-evidence:')
      ?'REAL_EVIDENCE_RECEIPT'
      :receipt.startsWith('observation:')
        ?'OBSERVATION_INGEST_RECEIPT'
        :null;
    if(!acknowledgementKind)return {ok:false,reason:'ACK_RECEIPT_KIND_INVALID'};
    const rows=load(storage);
    const row=rows.find(x=>x.packet_id===id);
    if(!row)return {ok:false,reason:'PACKET_NOT_FOUND'};
    row.transport_state='ACKNOWLEDGED';
    row.acknowledged_receipt_id=receipt;
    row.acknowledgement_kind=acknowledgementKind;
    row.acknowledged_at=clean(at)||new Date().toISOString();
    save(rows,storage);
    return {ok:true,packet:row};
  }

  function purgeAcknowledged(storage=globalThis.localStorage){
    const rows=load(storage);
    const kept=rows.filter(x=>x.transport_state!=='ACKNOWLEDGED');
    save(kept,storage);
    return {ok:true,purged_count:rows.length-kept.length,remaining_count:kept.length};
  }

  function selfValidate(rows=[]){
    const issues=[];
    const ids=new Set();
    for(const row of rows||[]){
      if(row.packet_version!==VERSION)issues.push('VERSION_INVALID');
      if(!clean(row.packet_id))issues.push('PACKET_ID_REQUIRED');
      if(ids.has(row.packet_id))issues.push('DUPLICATE_PACKET_ID');
      ids.add(row.packet_id);
      if(!['PENDING_CENTRAL_INGEST','ACKNOWLEDGED'].includes(row.transport_state))issues.push('TRANSPORT_STATE_INVALID');
      if(row.transport_state==='ACKNOWLEDGED'&&!clean(row.acknowledged_receipt_id))issues.push('ACK_RECEIPT_REQUIRED');
      if(row.transport_state==='ACKNOWLEDGED'&&!['REAL_EVIDENCE_RECEIPT','OBSERVATION_INGEST_RECEIPT'].includes(row.acknowledgement_kind))issues.push('ACK_KIND_INVALID');
    }
    return {ok:issues.length===0,issues};
  }

  return Object.freeze({VERSION,STORAGE_KEY,load,enqueue,pending,acknowledge,purgeAcknowledged,selfValidate});
});
