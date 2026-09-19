(() => {
  'use strict';
  const DB_NAME='readyset_local_v1', DB_VERSION=1;
  const SCOPE_KEYS={planner:'readyset_planner_v1',app_state:'readyset_state'};
  let dbPromise=null;
  const now=()=>new Date().toISOString();
  const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)};
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

  async function capture(scope,payload,options={}){
    const db=await openDb();
    const text=typeof payload==='string'?payload:JSON.stringify(payload);
    const digest=hash(text), updated_at=now(), id='evt_'+scope+'_'+digest;
    const tx=db.transaction(['snapshots','outbox'],'readwrite');
    tx.objectStore('snapshots').put({scope,payload:text,digest,updated_at});
    const outbox=tx.objectStore('outbox');
    const existing=await request(outbox.get(id));
    if(options.enqueue!==false && !existing) outbox.put({
      id,scope,digest,payload:text,status:'PENDING',attempts:0,
      next_retry_at:null,created_at:updated_at,updated_at
    });
    return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve({scope,digest});tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});
  }

  async function all(store){
    const db=await openDb(); const tx=db.transaction(store,'readonly');
    const rows=await request(tx.objectStore(store).getAll());
    return rows;
  }

  async function put(store,row){
    const db=await openDb(); const tx=db.transaction(store,'readwrite'); tx.objectStore(store).put(row);
    return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve(row);tx.onerror=()=>reject(tx.error)});
  }

  
  async function get(store,id){
    const db=await openDb(); const tx=db.transaction(store,'readonly');
    return request(tx.objectStore(store).get(id));
  }

  async function recoverMissingScopes(){
    const rows=await all('snapshots');
    let recovered=0;
    for(const row of rows){
      const key=SCOPE_KEYS[row.scope];
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
    const outbox=await get('outbox',conflict.outbox_id);
    if(!outbox) return {ok:false,reason:'OUTBOX_NOT_FOUND'};
    if(resolution==='KEEP_LOCAL'){
      outbox.status='PENDING';
      outbox.attempts=0;
      outbox.next_retry_at=null;
      outbox.updated_at=now();
      await put('outbox',outbox);
    } else if(resolution==='ACCEPT_REMOTE'){
      const key=SCOPE_KEYS[conflict.scope];
      const remote=typeof conflict.remote_payload==='string'
        ? conflict.remote_payload
        : JSON.stringify(conflict.remote_payload??null);
      if(key) localStorage.setItem(key,remote);
      await capture(conflict.scope,remote,{enqueue:false});
      outbox.status='SUPERSEDED';
      outbox.updated_at=now();
      await put('outbox',outbox);
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
    const rows=(await all('outbox')).filter(x=>['PENDING','RETRY'].includes(x.status) && (!x.next_retry_at || x.next_retry_at<=now()));
    if(!adapter?.send) return {ok:false,reason:'NO_SYNC_ADAPTER',pending:rows.length};
    let sent=0,conflicts=0;
    for(const row of rows){
      try{
        const result=await adapter.send({...row,idempotency_key:row.id});
        if(result?.conflict){
          row.status='CONFLICT';row.updated_at=now();await put('outbox',row);
          await put('conflicts',{id:'conflict_'+row.id,outbox_id:row.id,scope:row.scope,local_payload:row.payload,remote_payload:result.remote_payload??null,status:'OPEN',created_at:now()});
          conflicts++;continue;
        }
        if(result?.ok===false) throw new Error(result.reason||'SYNC_FAILED');
        row.status='SENT';row.sent_at=now();row.updated_at=row.sent_at;await put('outbox',row);sent++;
      }catch(error){
        row.attempts=(row.attempts||0)+1;row.status='RETRY';row.last_error=String(error?.message||error);
        row.next_retry_at=new Date(Date.now()+Math.min(3600000,1000*(2**Math.min(row.attempts,10)))).toISOString();
        row.updated_at=now();await put('outbox',row);
      }
    }
    return {ok:true,sent,conflicts,pending:(await all('outbox')).filter(x=>x.status!=='SENT').length};
  }

  window.addEventListener('online',()=>flush().catch(()=>{}));
  window.ReadySetLocalFirst=Object.freeze({
    version:'0.2.0',
    mode:'INDEXEDDB_RECOVERY_WITH_OUTBOX',
    capture:(scope,payload)=>capture(scope,payload),
    recoverMissingScopes,
    resolveConflict,
    outbox:()=>all('outbox'),
    conflicts:()=>all('conflicts'),
    snapshots:()=>all('snapshots'),
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