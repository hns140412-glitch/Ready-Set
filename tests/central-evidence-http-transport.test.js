'use strict';
const assert=require('node:assert/strict');
const T=require('../src/learning/central-evidence-http-transport.js');

(async()=>{
  const originalFetch=global.fetch;
  let seen=null;
  global.fetch=async(url,opts)=>{
    seen={url,opts};
    return {
      ok:true,status:200,
      async json(){return {
        ok:true,
        acknowledgement_kind:'REAL_EVIDENCE_RECEIPT',
        receipt_id:'real-evidence:abc',
        readiness:{verified_retrieval_target_count:3,remaining_to_30:27}
      }}
    };
  };
  const ok=await T.ingest({packet_id:'hide-seek:h1'});
  assert.equal(ok.ok,true);
  assert.equal(ok.receipt_id,'real-evidence:abc');
  assert.equal(seen.url,'/api/learning-evidence/ingest');
  assert.equal(seen.opts.credentials,'same-origin');
  assert.equal(seen.opts.method,'POST');
  assert.equal(T.status().deployment_authority,false);

  global.fetch=async()=>({ok:false,status:403,async json(){return {reason:'MEMBER_SCOPE_NOT_AUTHORIZED'}}});
  const denied=await T.ingest({packet_id:'hide-seek:h2'});
  assert.equal(denied.ok,false);
  assert.equal(denied.reason,'MEMBER_SCOPE_NOT_AUTHORIZED');
  assert.equal(denied.retryable,false);

  global.fetch=async()=>{throw new Error('offline')};
  const offline=await T.ingest({packet_id:'hide-seek:h3'});
  assert.equal(offline.ok,false);
  assert.equal(offline.retryable,true);

  global.fetch=originalFetch;
  console.log('READY_LEARNING_EVIDENCE_HTTP_TRANSPORT_PASS');
})().catch(e=>{console.error(e);process.exit(1)});
