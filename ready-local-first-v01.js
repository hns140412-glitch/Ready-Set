(() => {
  'use strict';

  const EventEnvelope=globalThis.TakyEventEnvelope;
  const LocalQueue=globalThis.TakyLocalQueue;
  if(!EventEnvelope?.create || !LocalQueue?.create) throw new Error('READY_SHARED_EVENT_QUEUE_UNAVAILABLE');

  const DB_NAME='readyset_local_v1', DB_VERSION=1;
  const SCOPE_KEYS={planner:'readyset_planner_v1',app_state:'readyset_state',assignments:'readyset_assignments_v2'};
  const memberScope=()=>globalThis.ReadyMemberScope||null;
  function scopedScope(scope){return memberScope()?.syncScope?.(scope)||scope}
  function parsedScope(scope){return memberScope()?.parseSyncScope?.(scope)||{member_id:null,scope};}
  function activeMemberId(){return memberScope()?.memberId?.()||null;}
  function belongsToActiveMember(scope){
    const parsed=parsedScope(scope);
    const active=activeMemberId();
    return active?parsed.member_id===active:parsed.member_id==null;
  }
  function localStorageKeyForScope(scope){
    const parsed=parsedScope(scope);
    const base=SCOPE_KEYS[parsed.scope];if(!base)return null;
    return parsed.member_id?`${base}::member::${encodeURIComponent(parsed.member_id)}`:base;
  }
  const SHARED_STATES=new Set(['PENDING','IN_FLIGHT','RETRY','ACKED','DEAD_LETTER','SUPERSEDED']);
  let dbPromise=null;
  const now=()=>new Date().toISOString();
  const request=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});

  function openDb(){
    if(dbPromise) return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const r=indexedDB.open(DB_NAME,DB_VERSION);
      r.onupgradeneeded=()=>{
        const db=r.result;
        if(!db.objectStoreNames.contains('snapshots')) db.createObjectStore('snapshots',{keyPath:'scope'});
        if(!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox',{keyPath:'id'});
        if(!db.objectStoreNames.contains('conflicts')) db.createObjectStore('conflicts',{keyPath:'id'});
      };
      r.onsuccess=()=>resolve(r.result);
      r.onerror=()=>reject(r.error);
    });
    return dbPromise;
  }

  async function all(store){
    const db=await openDb(); const tx=db.transaction(store,'readonly');
    return request(tx.objectStore(store).getAll());
  }

  async function get(store,id){
    const db=await openDb(); const tx=db.transaction(store,'readonly');
    return request(tx.objectStore(store).get(id));
  }

  async function scopedRows(store){
    return (await all(store)).filter(row=>belongsToActiveMember(row.scope));
  }

  async function put(store,row){
    const db=await openDb(); const tx=db.transaction(store,'readwrite'); tx.objectStore(store).put(row);
    return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve(row);tx.onerror=()=>reject(tx.error)});
  }

  function toStoredQueue(shared,{scope,digest,payload,envelope,domain_conflict=null}={}){
    return {
      id:shared.event_id,
      event_id:shared.event_id,
      idempotency_key:shared.idempotency_key,
      queue_version:shared.queue_version,
      status:shared.status,
      attempts:shared.attempts,
      max_attempts:shared.max_attempts,
      next_retry_at:shared.next_retry_at,
      last_error:shared.last_error,
      ack_token:shared.ack_token,
      remote_version:shared.remote_version,
      created_at:shared.created_at,
      updated_at:shared.updated_at,
      acked_at:shared.acked_at||null,
      scope:scope??null,
      digest:digest??null,
      payload:payload??null,
      envelope:envelope??null,
      domain_conflict
    };
  }

  function fromStoredQueue(row){
    if(!row) return null;
    const status=SHARED_STATES.has(row.status)?row.status:'PENDING';
    return {
      queue_version:1,
      event_id:String(row.event_id||row.id||''),
      idempotency_key:String(row.idempotency_key||row.event_id||row.id||''),
      status,
      attempts:Number.isInteger(row.attempts)?row.attempts:0,
      max_attempts:Number.isInteger(row.max_attempts)&&row.max_attempts>0?row.max_attempts:5,
      next_retry_at:row.next_retry_at||null,
      last_error:row.last_error||null,
      ack_token:row.ack_token||null,
      remote_version:row.remote_version||null,
      created_at:row.created_at||row.updated_at||now(),
      updated_at:row.updated_at||row.created_at||now()
    };
  }

  function domainFields(row){
    return {
      scope:row.scope,
      digest:row.digest,
      payload:row.payload,
      envelope:row.envelope||null,
      domain_conflict:row.domain_conflict||null
    };
  }

  async function capture(scope,payload,options={}){
    const db=await openDb();
    const effectiveScope=scopedScope(scope);
    const text=typeof payload==='string'?payload:JSON.stringify(payload);
    const digest=EventEnvelope.digest(text);
    const updated_at=now();
    const envelope=EventEnvelope.create({
      source:'ready-set',
      event_type:'READY_SCOPE_SNAPSHOT_CAPTURED',
      occurred_at:updated_at,
      payload:{scope:effectiveScope,digest,payload:text}
    });
    const shared=LocalQueue.create({
      event_id:envelope.event_id,
      idempotency_key:envelope.idempotency_key,
      created_at:updated_at,
      max_attempts:5,
      metadata:{source:'ready-set'}
    });

    const tx=db.transaction(['snapshots','outbox'],'readwrite');
    tx.objectStore('snapshots').put({scope:effectiveScope,payload:text,digest,updated_at});
    if(options.enqueue!==false){
      tx.objectStore('outbox').put(toStoredQueue(shared,{scope:effectiveScope,digest,payload:text,envelope}));
    }
    return new Promise((resolve,reject)=>{
      tx.oncomplete=()=>resolve({scope:effectiveScope,digest,event_id:envelope.event_id});
      tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
    });
  }

  async function recoverMissingScopes(){
    const rows=(await all('snapshots')).filter(row=>belongsToActiveMember(row.scope));
    let recovered=0;
    for(const row of rows){
      const key=localStorageKeyForScope(row.scope);
      if(!key) continue;
      if(localStorage.getItem(key)==null && row.payload!=null){
        localStorage.setItem(key,row.payload);
        recovered++;
      }
    }
    return {ok:true,recovered,reload_required:recovered>0};
  }

  async function resolveConflict(conflictId,resolution){
    const conflict=await get('conflicts',conflictId);
    if(!conflict || conflict.status!=='OPEN') return {ok:false,reason:'CONFLICT_NOT_FOUND'};
    if(!belongsToActiveMember(conflict.scope)) return {ok:false,reason:'MEMBER_SCOPE_FORBIDDEN'};
    const outbox=await get('outbox',conflict.outbox_id);
    if(!outbox) return {ok:false,reason:'OUTBOX_NOT_FOUND'};

    if(resolution==='KEEP_LOCAL'){
      const base=LocalQueue.create({
        event_id:outbox.event_id||outbox.id,
        idempotency_key:outbox.idempotency_key||outbox.event_id||outbox.id,
        created_at:outbox.created_at||now(),
        max_attempts:outbox.max_attempts||5
      });
      await put('outbox',toStoredQueue(base,{...domainFields(outbox),domain_conflict:null}));
    } else if(resolution==='ACCEPT_REMOTE'){
      const key=localStorageKeyForScope(conflict.scope);
      const remote=typeof conflict.remote_payload==='string'
        ? conflict.remote_payload
        : JSON.stringify(conflict.remote_payload??null);
      if(key) localStorage.setItem(key,remote);
      await capture(conflict.scope,remote,{enqueue:false});
      const superseded=LocalQueue.markSuperseded(fromStoredQueue(outbox),now());
      if(!superseded.ok) return {ok:false,reason:superseded.reason};
      await put('outbox',toStoredQueue(superseded.row,{...domainFields(outbox),domain_conflict:null}));
    } else {
      return {ok:false,reason:'INVALID_RESOLUTION'};
    }

    conflict.status='RESOLVED';
    conflict.resolution=resolution;
    conflict.resolved_at=now();
    await put('conflicts',conflict);
    return {ok:true,resolution,reload_required:resolution==='ACCEPT_REMOTE'};
  }

  async function flush(){
    const adapter=window.ReadySetSyncAdapter;
    const rows=(await all('outbox')).filter(row=>{
      if(!belongsToActiveMember(row.scope)) return false;
      if(row.domain_conflict==='OPEN') return false;
      const q=fromStoredQueue(row);
      return LocalQueue.canAttempt(q,Date.now());
    });
    if(!adapter?.send) return {ok:false,reason:'NO_SYNC_ADAPTER',pending:rows.length};
    const adapterStatus=adapter.status?.();
    if(adapterStatus && (!adapterStatus.configured || !adapterStatus.enabled)){
      return {ok:false,reason:'SYNC_NOT_CONFIGURED',pending:rows.length};
    }

    let sent=0,conflicts=0,dead_letters=0;
    for(const row of rows){
      const inflight=LocalQueue.markInFlight(fromStoredQueue(row),Date.now());
      if(!inflight.ok) continue;
      let working=toStoredQueue(inflight.row,domainFields(row));
      await put('outbox',working);

      try{
        const result=await adapter.send(working);
        if(result?.conflict){
          working={...working,status:'PENDING',domain_conflict:'OPEN',updated_at:now()};
          await put('outbox',working);
          await put('conflicts',{
            id:'conflict_'+working.id,
            outbox_id:working.id,
            scope:working.scope,
            local_payload:working.payload,
            remote_payload:result.remote_payload??null,
            status:'OPEN',
            created_at:now()
          });
          conflicts++;
          continue;
        }
        if(result?.ok===false) throw new Error(result.reason||'SYNC_FAILED');

        const acked=LocalQueue.markAcked(fromStoredQueue(working),{
          ack_token:result.ack_token??null,
          remote_version:result.remote_version??null,
          now:Date.now()
        });
        if(!acked.ok) throw new Error(acked.reason||'ACK_FAILED');
        await put('outbox',toStoredQueue(acked.row,domainFields(working)));
        sent++;
      }catch(error){
        const retried=LocalQueue.markRetry(fromStoredQueue(working),error?.message||error,Date.now(),{base_ms:1000,max_ms:3600000});
        if(!retried.ok) continue;
        await put('outbox',toStoredQueue(retried.row,domainFields(working)));
        if(retried.row.status==='DEAD_LETTER') dead_letters++;
      }
    }

    const remaining=(await all('outbox')).filter(row=>belongsToActiveMember(row.scope));
    return {
      ok:true,
      sent,
      conflicts,
      dead_letters,
      pending:remaining.filter(x=>['PENDING','IN_FLIGHT','RETRY'].includes(x.status)||x.domain_conflict==='OPEN').length
    };
  }

  window.addEventListener('online',()=>flush().catch(()=>{}));
  window.ReadySetLocalFirst=Object.freeze({
    version:'0.3.0',
    mode:'INDEXEDDB_RECOVERY_WITH_SHARED_EVENT_QUEUE',
    capabilities:Object.freeze(['CAP-EVENT-ENVELOPE-001','CAP-LOCAL-QUEUE-001']),
    capture:(scope,payload)=>capture(scope,payload),
    recoverMissingScopes,
    resolveConflict,
    outbox:()=>scopedRows('outbox'),
    conflicts:()=>scopedRows('conflicts'),
    snapshots:()=>scopedRows('snapshots'),
    flush
  });

  openDb().then(recoverMissingScopes).then(result=>{
    if(result.reload_required && !sessionStorage.getItem('readyset_recovery_reload')){
      sessionStorage.setItem('readyset_recovery_reload','1');
      location.reload();
    } else {
      sessionStorage.removeItem('readyset_recovery_reload');
    }
  }).catch(()=>{});
})();
