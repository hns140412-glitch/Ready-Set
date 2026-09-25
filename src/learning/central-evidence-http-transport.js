(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.TakyLearningEvidenceTransport=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='READY_LEARNING_EVIDENCE_HTTP_TRANSPORT_V1';
  const ENDPOINT='/api/learning-evidence/ingest';

  async function ingest(packet={}){
    let response;
    try{
      response=await fetch(ENDPOINT,{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        credentials:'same-origin',
        cache:'no-store',
        body:JSON.stringify(packet)
      });
    }catch(error){
      return {ok:false,reason:'NETWORK_ERROR',retryable:true};
    }

    const body=await response.json().catch(()=>({}));
    if(!response.ok){
      return {
        ok:false,
        reason:body?.reason||('HTTP_'+response.status),
        status:response.status,
        retryable:response.status===409||response.status===429||response.status>=500
      };
    }
    if(body?.ok!==true||!body?.receipt_id){
      return {ok:false,reason:'CENTRAL_ACK_INVALID',retryable:true};
    }
    return {
      ok:true,
      receipt_id:body.receipt_id,
      acknowledgement_kind:body.acknowledgement_kind||null,
      readiness:body.readiness||null,
      transport:body.transport||null,
      acknowledged_at:new Date().toISOString()
    };
  }

  function status(){
    return Object.freeze({
      version:VERSION,
      endpoint:ENDPOINT,
      credentials:'same-origin',
      deployment_authority:false
    });
  }

  return Object.freeze({VERSION,ENDPOINT,ingest,status});
});
