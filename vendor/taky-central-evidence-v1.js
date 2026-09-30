/* Generated from TAKY 52b70c5fa17cc75a7835302780b8b97d916218ff, LEARNING/transport/build-browser-evidence-bundle.js. Browser-only audited transport; host must inject verified identity and token. */
(function(root){'use strict';
const modules={"./scoped-evidence-outbox.js":function(module,exports,require){
'use strict';
/** Evidence-specific persistent outbox. The host supplies an atomic durable
 * read/CAS adapter; never share planner/app_state snapshot sync storage.
 * Queue entries are immutable packets, scoped to one family/member/app.
 * A successful central ACK is recorded only by a matching lease owner.
 */
const VERSION='TAKY_SCOPED_EVIDENCE_OUTBOX_V1';
const APPS=new Set(['ready-set','hide-seek','snap-pop']);
const clean=x=>typeof x==='string'?x.trim():'';
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
async function fingerprint(p,cryptoProvider){
 const bytes=new TextEncoder().encode(JSON.stringify(canonical(p)));
 const digest=await cryptoProvider.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
}
const scopeOf=p=>[p?.context?.family_id,p?.context?.member_id,p?.source_app];
const same=(a,b)=>a.every((v,i)=>v===b[i]);
const valid=p=>p&&APPS.has(p.source_app)&&clean(p.packet_id)&&
 clean(p.context?.family_id)&&clean(p.context?.member_id)&&
 clean(p.event?.event_id)&&p.event.source===p.source_app;
function create({storage,clock=Date.now,leaseMs=30000,cryptoProvider=globalThis.crypto}={}){
 if(typeof cryptoProvider?.randomUUID!=='function'||
    typeof cryptoProvider?.subtle?.digest!=='function')
  throw Error('BROWSER_WEB_CRYPTO_REQUIRED');
 if(typeof storage?.read!=='function'||typeof storage?.compareAndSwap!=='function')
  throw Error('ATOMIC_PERSISTENT_OUTBOX_ADAPTER_REQUIRED');
 if(typeof clock!=='function'||!Number.isInteger(leaseMs)||leaseMs<1000)
  throw Error('OUTBOX_CLOCK_AND_LEASE_REQUIRED');
 async function change(mutator){
  for(let n=0;n<32;n++){
   const r=await storage.read();
   if(!r||!Array.isArray(r.data?.entries))throw Error('OUTBOX_READ_INVALID');
   const next=structuredClone(r.data);
   const result=mutator(next);
   if(!result.write)return result.value;
   const committed=await storage.compareAndSwap(r.version,next);
   if(committed===true)return result.value;
  }
  throw Error('OUTBOX_CAS_RETRY_EXHAUSTED');
 }
 async function enqueue(packet){
  if(!valid(packet))throw Error('SCOPED_EVIDENCE_PACKET_REQUIRED');
  const immutable=structuredClone(packet),digest=await fingerprint(immutable,cryptoProvider);
  return change(s=>{
   const key=immutable.source_app+':'+immutable.packet_id;
   const old=s.entries.find(x=>x.key===key);
   if(old){
    if(old.digest!==digest||!same(old.scope,scopeOf(immutable)))
     throw Error('OUTBOX_PACKET_ID_CONTENT_CONFLICT');
    return {write:false,value:{queued:false,duplicate:true,status:old.status}};
   }
   s.entries.push({key,digest,scope:scopeOf(immutable),packet:immutable,
    status:'PENDING',lease:null,receipt:null,attempts:0});
   return {write:true,value:{queued:true,duplicate:false,status:'PENDING'}};
  });
 }
 async function claim(scope,owner){
  if(!Array.isArray(scope)||scope.length!==3||!scope.every(clean)||
   !APPS.has(scope[2])||!clean(owner))throw Error('OUTBOX_CLAIM_SCOPE_REQUIRED');
  return change(s=>{
   const row=s.entries.find(x=>same(x.scope,scope)&&
    (x.status==='PENDING'||(x.status==='IN_FLIGHT'&&x.lease?.until<=clock())));
   if(!row)return {write:false,value:null};
   row.status='IN_FLIGHT';row.lease={owner,until:clock()+leaseMs,nonce:cryptoProvider.randomUUID()};
   row.attempts++;
   return {write:true,value:{key:row.key,packet:structuredClone(row.packet),
    digest:row.digest,owner,nonce:row.lease.nonce,attempts:row.attempts}};
  });
 }
 async function settle(claimed,result){
  if(!claimed||!clean(claimed.owner))throw Error('OUTBOX_CLAIM_REQUIRED');
  return change(s=>{
   const row=s.entries.find(x=>x.key===claimed.key);
   if(!row||row.status!=='IN_FLIGHT'||row.lease?.owner!==claimed.owner||
    row.digest!==claimed.digest||row.lease?.nonce!==claimed.nonce||row.lease.until<=clock())
    return {write:false,value:{updated:false,reason:'STALE_OR_WRONG_LEASE'}};
   if(result?.ok===true){
    // sendPending() alone validates the authenticated central response;
    // the receipt must still be tied to this exact packet.
    if(!clean(result.ack_token)||!['REAL_EVIDENCE_RECEIPT',
      'OBSERVATION_INGEST_RECEIPT'].includes(result.acknowledgement_kind)||
      result.packet_id!==row.packet.packet_id||
      result.event_id!==row.packet.event.event_id)
     return {write:false,value:{updated:false,reason:'UNBOUND_ACK_DENIED'}};
    row.status='ACKED';row.receipt={
     receipt_id:result.ack_token,kind:result.acknowledgement_kind,
     observation_only:result.observation_only===true};
   }else{
    row.status=result?.retryable===false?'BLOCKED':'PENDING';
   }
   row.lease=null;
   return {write:true,value:{updated:true,status:row.status}};
  });
 }
 async function list(scope){
  const r=await storage.read();
  return r.data.entries.filter(x=>same(x.scope,scope)).map(x=>({
   key:x.key,status:x.status,attempts:x.attempts,receipt:x.receipt}));
 }
 return Object.freeze({VERSION,enqueue,claim,settle,list});
}
module.exports=Object.freeze({VERSION,create});

},
"./indexeddb-evidence-outbox-store.js":function(module,exports,require){
'use strict';
/**
 * Browser-only IndexedDB persistence for the evidence outbox.
 * A single readwrite transaction owns read/version-check/write. Never split
 * CAS across transactions or use localStorage for multi-tab concurrency.
 * Inject indexedDB from the PWA host; no DB opens at module import.
 */
const VERSION='TAKY_INDEXEDDB_EVIDENCE_OUTBOX_STORE_V1';
const DB='taky-central-learning-evidence-outbox-v1',STORE='queue';
function create({indexedDB,dbName=DB}={}){
 if(typeof indexedDB?.open!=='function'||typeof dbName!=='string'||!dbName)
  throw Error('BROWSER_INDEXEDDB_REQUIRED');
 let connection;
 function open(){
  if(connection)return connection;
  connection=new Promise((resolve,reject)=>{
   const req=indexedDB.open(dbName,1);
   req.onupgradeneeded=()=>{
    const db=req.result;
    if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);
   };
   req.onerror=()=>reject(req.error||Error('OUTBOX_IDB_OPEN_FAILED'));
   req.onsuccess=()=>{
    const db=req.result;
    db.onversionchange=()=>{db.close();connection=null};
    resolve(db);
   };
  }).catch(e=>{connection=null;throw e});
  return connection;
 }
 function transaction(mode,operate){
  return open().then(db=>new Promise((resolve,reject)=>{
   let result,finished=false;
   const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);
   tx.oncomplete=()=>{finished=true;resolve(result)};
   tx.onerror=()=>{if(!finished)reject(tx.error||Error('OUTBOX_IDB_TX_FAILED'))};
   tx.onabort=()=>{if(!finished)reject(tx.error||Error('OUTBOX_IDB_TX_ABORTED'))};
   try{operate(store,v=>{result=v})}catch(e){tx.abort();reject(e)}
  }));
 }
 return Object.freeze({
  version:VERSION,
  async read(){
   return transaction('readonly',(store,done)=>{
    const req=store.get('state');
    req.onsuccess=()=>{
     const row=req.result||{version:0,data:{entries:[]}};
     done(structuredClone(row));
    };
   });
  },
  async compareAndSwap(expected,next){
   if(!Number.isSafeInteger(expected)||expected<0||
      !Array.isArray(next?.entries))throw Error('OUTBOX_CAS_INPUT_INVALID');
   return transaction('readwrite',(store,done)=>{
    const req=store.get('state');
    req.onsuccess=()=>{
     const old=req.result||{version:0,data:{entries:[]}};
     if(old.version!==expected){done(false);return}
     store.put({version:expected+1,data:structuredClone(next)},'state');
     done(true);
    };
   });
  },
  async close(){
   if(connection){const db=await connection;db.close();connection=null}
  }
 });
}
module.exports=Object.freeze({VERSION,DB,STORE,create});

},
"./pwa-central-evidence-ack-client.js":function(module,exports,require){
'use strict';

/**
 * Evidence-only pending-outbox HTTP transport. Do not reuse Ready's
 * planner/app_state snapshot sync queue as Learning Engine evidence.
 * App queue ownership/persistence remains with each specialist PWA.
 * This adapter NEVER marks a queue entry ACKED itself; callers may do so
 * only after an authenticated, scope-matched, durable central receipt.
 */
const VERSION='TAKY_PWA_CENTRAL_EVIDENCE_ACK_CLIENT_V1';
const APPS=new Set(['ready-set','hide-seek','snap-pop']);
const RECEIPTS=new Set(['REAL_EVIDENCE_RECEIPT','OBSERVATION_INGEST_RECEIPT']);
const clean=x=>typeof x==='string'?x.trim():'';
const validPacket=p=>p&&APPS.has(p.source_app)&&clean(p.packet_id)&&
 clean(p?.context?.family_id)&&clean(p?.context?.member_id)&&
 clean(p?.event?.event_id)&&p?.event?.source===p.source_app;

function validateAck(packet,status,body={}){
 if(status!==200||body?.ok!==true||
    body.storage_confirmed!==true||
    !RECEIPTS.has(body.acknowledgement_kind)||
    !clean(body.receipt_id)||body.source_app!==packet.source_app||
    body.packet_id!==packet.packet_id||
    body.event_id!==packet.event.event_id||
    body.receipt_scope?.family_id!==packet.context.family_id||
    body.receipt_scope?.member_id!==packet.context.member_id||
    typeof body.duplicate!=='boolean')
   return {ok:false,reason:'CENTRAL_COMMITTED_ACK_SCOPE_INVALID'};
 return {ok:true,ack_token:body.receipt_id,
   packet_id:body.packet_id,event_id:body.event_id,
   acknowledgement_kind:body.acknowledgement_kind,duplicate:body.duplicate,
   observation_only:body.acknowledgement_kind==='OBSERVATION_INGEST_RECEIPT'};
}
function create({endpointUrl,fetchImpl,tokenProvider,sessionProvider}={}){
 let endpoint;
 try{
   endpoint=new URL(endpointUrl);
   if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||
      endpoint.search||endpoint.hash||endpoint.pathname!=='/api/learning/evidence')
     throw Error('INVALID');
 }catch{throw Error('EXPLICIT_CENTRAL_HTTPS_EVIDENCE_ENDPOINT_REQUIRED')}
 if(typeof fetchImpl!=='function'||typeof tokenProvider!=='function'||
    typeof sessionProvider!=='function')
   throw Error('PWA_TRUSTED_SESSION_FETCH_AND_TOKEN_PROVIDERS_REQUIRED');
 async function sendPending(packet){
   if(!validPacket(packet))return {ok:false,retryable:false,reason:'EVIDENCE_PACKET_REQUIRED'};
   const session=await sessionProvider();
   if(session?.authenticated!==true||
      session.family_id!==packet.context.family_id||
      session.selected_member_id!==packet.context.member_id)
     return {ok:false,retryable:false,reason:'ACTIVE_FAMILY_MEMBER_SCOPE_REQUIRED'};
   let token;
   try{token=await tokenProvider()}catch{return {ok:false,retryable:true,reason:'TOKEN_REFRESH_UNAVAILABLE'}}
   if(!clean(token)||token.length>8192)
     return {ok:false,retryable:false,reason:'AUTH_TOKEN_REQUIRED'};
   let response,body;
   try{
     response=await fetchImpl(endpoint.href,{
       method:'POST',headers:{
         'Content-Type':'application/json','Accept':'application/json',
         Authorization:'Bearer '+token
       },credentials:'omit',redirect:'error',cache:'no-store',
       body:JSON.stringify(packet)
     });
     body=await response.json();
   }catch{return {ok:false,retryable:true,reason:'CENTRAL_HTTP_OR_RESPONSE_UNAVAILABLE'}}
   if(response.status!==200){
     return {ok:false,retryable:response.status===429||response.status===503||
       response.status>=500,
       reason:response.status===401||response.status===403
         ?'CENTRAL_AUTHORIZATION_REQUIRED':'CENTRAL_HTTP_'+response.status};
   }
   const ack=validateAck(packet,response.status,body);
   if(!ack.ok)return {...ack,retryable:true};
   // A member/session change during a network await must not ACK a row
   // belonging to the previous selected learner, even with valid HTTP proof.
   let after;
   try{after=await sessionProvider()}catch{
     return {ok:false,retryable:true,reason:'SESSION_RECHECK_UNAVAILABLE'};
   }
   if(after?.authenticated!==true||
      after.family_id!==packet.context.family_id||
      after.selected_member_id!==packet.context.member_id)
     return {ok:false,retryable:true,reason:'SESSION_CHANGED_BEFORE_ACK'};
   return ack;
 }
 return Object.freeze({version:VERSION,sendPending});
}
module.exports=Object.freeze({VERSION,validateAck,create});

},
"./pwa-scoped-evidence-pipeline.js":function(module,exports,require){
'use strict';
/**
 * Evidence-only browser composition. No implicit event producer, login,
 * background polling, or Planner/app_state queue ownership.
 * The host must supply a trusted selected-member session and central token.
 */
const Outbox=require('./scoped-evidence-outbox.js');
const IndexedDB=require('./indexeddb-evidence-outbox-store.js');
const Client=require('./pwa-central-evidence-ack-client.js');
const Mapper=require('./specialist-observation-packet-mapper.js');
const Bridge=require('./specialist-bridge-event-adapter.js');
const VERSION='TAKY_PWA_SCOPED_EVIDENCE_PIPELINE_V1';
const clean=x=>typeof x==='string'?x.trim():'';
function create({indexedDB,dbName,storageAdapter=null,endpointUrl,fetchImpl,tokenProvider,
 sessionProvider,clock=Date.now,leaseMs=30000,cryptoProvider=globalThis.crypto}={}){
 const storage=storageAdapter||IndexedDB.create({indexedDB,dbName});
 if(typeof storage?.read!=='function'||typeof storage?.compareAndSwap!=='function'||
    typeof storage?.close!=='function')throw Error('PIPELINE_PERSISTENT_STORAGE_REQUIRED');
 const queue=Outbox.create({storage,clock,leaseMs,cryptoProvider});
 const client=Client.create({endpointUrl,fetchImpl,tokenProvider,sessionProvider});
 async function activeScope(source_app){
  const session=await sessionProvider();
  if(session?.authenticated!==true||!clean(session.family_id)||
   !clean(session.selected_member_id)||!['ready-set','hide-seek','snap-pop'].includes(source_app))
   throw Error('ACTIVE_SCOPED_SESSION_REQUIRED');
  return [session.family_id,session.selected_member_id,source_app];
 }
 async function enqueue(packet){
  const scope=await activeScope(packet?.source_app);
  if(packet?.context?.family_id!==scope[0]||packet?.context?.member_id!==scope[1])
   throw Error('EVIDENCE_ENQUEUE_SESSION_SCOPE_MISMATCH');
  return queue.enqueue(packet);
 }
 async function enqueueObservation(source_app,event){
  const session=await sessionProvider();
  const packet=Mapper.map({source_app,event,session});
  return enqueue(packet); // Recheck session after mapping; no cross-member enqueue.
 }
 async function enqueueBridge(source_app,raw){
  return enqueueObservation(source_app,Bridge.fromBridge(source_app,raw));
 }
 async function enqueueReadyObservation(explicitObservation){
  return enqueueObservation('ready-set',Bridge.readyObservation(explicitObservation));
 }
 async function flushOne(source_app,owner){
  const scope=await activeScope(source_app);
  if(!clean(owner))throw Error('EVIDENCE_FLUSH_OWNER_REQUIRED');
  const claimed=await queue.claim(scope,owner);
  if(!claimed)return {processed:false};
  let result;
  try{result=await client.sendPending(claimed.packet)}
  catch{result={ok:false,retryable:true,reason:'CENTRAL_CLIENT_UNAVAILABLE'}}
  const settled=await queue.settle(claimed,result);
  return {processed:true,settled:settled.updated===true,status:settled.status||null,
   reason:result.ok?'CENTRAL_ACK_VALIDATED':result.reason||'CENTRAL_SEND_FAILED'};
 }
 async function listActive(source_app){
  return queue.list(await activeScope(source_app));
 }
 return Object.freeze({version:VERSION,enqueue,enqueueObservation,enqueueBridge,enqueueReadyObservation,flushOne,listActive,close:storage.close});
}
module.exports=Object.freeze({VERSION,create});

},
"./specialist-observation-packet-mapper.js":function(module,exports,require){
'use strict';
/**
 * Explicit specialist observation mapping. Never infer authenticated scope
 * from child_id, localStorage, URL query, or an untrusted cross-frame event.
 * No rubric/reference issuer claims are made by this mapper.
 */
const VERSION='TAKY_SPECIALIST_OBSERVATION_PACKET_MAPPER_V1';
const TYPES=Object.freeze({
 'ready-set':'READY_LEARNING_OBSERVATION',
 'hide-seek':'LEARNING_MEMORY_SIGNAL',
 'snap-pop':'LEARNING_OUTCOME'
});
const clean=x=>typeof x==='string'?x.trim():'';
function map({source_app,event,session}={}){
 if(!Object.hasOwn(TYPES,source_app))throw Error('SPECIALIST_SOURCE_APP_REQUIRED');
 if(session?.authenticated!==true||!clean(session.family_id)||
  !clean(session.selected_member_id))throw Error('TRUSTED_SELECTED_MEMBER_SESSION_REQUIRED');
 if(!event||typeof event!=='object'||!clean(event.event_id)||
  !clean(event.occurred_at)||event.source_app!==source_app||
  event.type!==TYPES[source_app]||!event.payload||typeof event.payload!=='object')
  throw Error('SPECIALIST_OBSERVATION_EVENT_REQUIRED');
 const member=event.member_id||event.payload.member_id||event.payload.child_id;
 if(member!==session.selected_member_id)throw Error('SPECIALIST_EVENT_MEMBER_SCOPE_MISMATCH');
 // A matching top-level member must not mask a contradictory inner payload.
 for(const id of [event.payload.member_id,event.payload.child_id]){
  if(id!=null&&id!==member)throw Error('SPECIALIST_PAYLOAD_MEMBER_SCOPE_CONFLICT');
 }
 if((event.family_id&&event.family_id!==session.family_id)||
    (event.payload.family_id&&event.payload.family_id!==session.family_id))
  throw Error('SPECIALIST_EVENT_FAMILY_SCOPE_MISMATCH');
 const subject=clean(event.payload.subject);
 const skill=clean(event.payload.concept_skill_target);
 if(!subject||!skill)throw Error('SPECIALIST_LEARNING_SCOPE_REQUIRED');
 if(!Number.isFinite(Date.parse(event.occurred_at)))throw Error('SPECIALIST_OBSERVED_AT_INVALID');
 if(event.payload.global_mastery_claim===true||
  event.payload.auto_award===true||event.payload.planner_date!=null)
  throw Error('SPECIALIST_AUTHORITY_ESCALATION_DENIED');
 const packet={
  packet_id:source_app+':'+event.event_id,
  source_app,
  context:{family_id:session.family_id,member_id:session.selected_member_id,
   subject,concept_skill_target:skill,
   learning_target_id:clean(event.payload.learning_target_id)||null},
  event:{event_id:event.event_id,source:source_app,type:event.type,
   occurred_at:event.occurred_at,payload:structuredClone(event.payload)},
  evidence_policy:{observation_only:true,reference_issuance_claim:false,
   reviewer_approval_claim:false,planner_schedule_authority:false,
   auto_award:false}
 };
 return structuredClone(packet);
}
module.exports=Object.freeze({VERSION,TYPES,map});

},
"./specialist-bridge-event-adapter.js":function(module,exports,require){
'use strict';
/** Adapter for existing specialist EventEnvelope outputs, not a trust source. */
const VERSION='TAKY_SPECIALIST_BRIDGE_EVENT_ADAPTER_V1';
const TYPE={'hide-seek':'LEARNING_MEMORY_SIGNAL','snap-pop':'LEARNING_OUTCOME'};
const clean=x=>typeof x==='string'?x.trim():'';
function fromBridge(source_app,raw){
 if(!Object.hasOwn(TYPE,source_app)||!raw||raw.source!==source_app||
  raw.type!==TYPE[source_app]||raw.event_type!==TYPE[source_app]||
  !clean(raw.event_id)||!clean(raw.occurred_at)||!raw.payload||
  typeof raw.payload!=='object'||!clean(raw.payload.member_id))
  throw Error('EXACT_SPECIALIST_BRIDGE_EVENT_REQUIRED');
 if(!clean(raw.payload.subject)||!clean(raw.payload.concept_skill_target))
  throw Error('BRIDGE_LEARNING_SCOPE_MISSING_HOLD');
 if(source_app==='hide-seek'&&
   (raw.payload.observation_only!==true||raw.payload.global_mastery_claim!==false))
  throw Error('HIDE_OBSERVATION_ONLY_CONTRACT_REQUIRED');
 if(source_app==='snap-pop'&&
   (raw.payload.contextual_evidence_only!==true||raw.payload.global_mastery_claim!==false))
  throw Error('SNAP_CONTEXTUAL_ONLY_CONTRACT_REQUIRED');
 if(raw.child_id&&raw.child_id!==raw.payload.member_id)
  throw Error('BRIDGE_CHILD_PAYLOAD_SCOPE_CONFLICT');
 return {
  source_app,type:TYPE[source_app],event_id:raw.event_id,
  occurred_at:raw.occurred_at,member_id:raw.payload.member_id,
  payload:structuredClone(raw.payload)
 };
}
function readyObservation({event_id,occurred_at,member_id,payload}={}){
 if(!clean(event_id)||!clean(occurred_at)||!clean(member_id)||
  !payload||typeof payload!=='object'||payload.member_id!==member_id||
  payload.observation_only!==true||!clean(payload.subject)||
  !clean(payload.concept_skill_target))
  throw Error('READY_EXPLICIT_OBSERVATION_REQUIRED');
 return {source_app:'ready-set',type:'READY_LEARNING_OBSERVATION',
  event_id,occurred_at,member_id,payload:structuredClone(payload)};
}
module.exports=Object.freeze({VERSION,fromBridge,readyObservation});

}};const cache={};
function require(id){if(!Object.hasOwn(modules,id))throw Error('UNDECLARED_BROWSER_MODULE:'+id);if(!cache[id]){const module={exports:{}};cache[id]=module;modules[id](module,module.exports,require)}return cache[id].exports}
root.TakyCentralEvidence=Object.freeze({pipeline:require('./pwa-scoped-evidence-pipeline.js'),mapper:require('./specialist-observation-packet-mapper.js'),bridgeAdapter:require('./specialist-bridge-event-adapter.js')});
})(globalThis);
