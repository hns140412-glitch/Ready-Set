(() => {
  'use strict';

  const VERSION='0.1.0';
  const DB_NAME='readyset_capture_v1';
  const DB_VERSION=1;
  const SESSION_STORE='sessions';
  const ITEM_STORE='items';
  const ACTIVE_SESSION_KEY='readyset_active_capture_session';

  const now=()=>new Date().toISOString();
  const id=p=>p+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
  const clean=v=>String(v??'').trim();

  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(SESSION_STORE)){
          const s=db.createObjectStore(SESSION_STORE,{keyPath:'capture_session_id'});
          s.createIndex('status','status',{unique:false});
          s.createIndex('updated_at','updated_at',{unique:false});
        }
        if(!db.objectStoreNames.contains(ITEM_STORE)){
          const s=db.createObjectStore(ITEM_STORE,{keyPath:'capture_item_id'});
          s.createIndex('capture_session_id','capture_session_id',{unique:false});
          s.createIndex('group_key','group_key',{unique:false});
          s.createIndex('created_at','created_at',{unique:false});
        }
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('capture db open failed'));
    });
  }

  async function tx(storeName,mode,fn){
    const db=await openDb();
    try{
      return await new Promise((resolve,reject)=>{
        const t=db.transaction(storeName,mode);
        const store=t.objectStore(storeName);
        let out;
        try{out=fn(store,t)}catch(e){reject(e);return}
        t.oncomplete=()=>resolve(out);
        t.onerror=()=>reject(t.error||new Error('capture transaction failed'));
        t.onabort=()=>reject(t.error||new Error('capture transaction aborted'));
      });
    }finally{
      db.close();
    }
  }

  async function getByKey(storeName,key){
    const db=await openDb();
    try{
      return await new Promise((resolve,reject)=>{
        const req=db.transaction(storeName,'readonly').objectStore(storeName).get(key);
        req.onsuccess=()=>resolve(req.result||null);
        req.onerror=()=>reject(req.error);
      });
    }finally{db.close()}
  }

  async function put(storeName,value){
    return tx(storeName,'readwrite',store=>{store.put(value);return value});
  }

  async function remove(storeName,key){
    return tx(storeName,'readwrite',store=>{store.delete(key);return true});
  }

  async function listByIndex(storeName,indexName,value){
    const db=await openDb();
    try{
      return await new Promise((resolve,reject)=>{
        const store=db.transaction(storeName,'readonly').objectStore(storeName);
        const index=store.index(indexName);
        const req=index.getAll(IDBKeyRange.only(value));
        req.onsuccess=()=>resolve(req.result||[]);
        req.onerror=()=>reject(req.error);
      });
    }finally{db.close()}
  }

  async function createSession(input={}){
    const existingId=localStorage.getItem(ACTIVE_SESSION_KEY);
    if(existingId){
      const existing=await getByKey(SESSION_STORE,existingId);
      if(existing&&existing.status==='TEMP_CAPTURE')return existing;
    }
    const session={
      capture_session_id:id('capture'),
      status:'TEMP_CAPTURE',
      source_surface:clean(input.source_surface)||'PARENT_HOMEWORK_INTAKE',
      owner_role:'PARENT',
      current_group_key:clean(input.group_key)||'TALENT:연산',
      current_kind:clean(input.kind)||'RANGE',
      analysis_state:'NOT_REQUESTED',
      analysis_adapter:null,
      created_at:now(),
      updated_at:now(),
      completed_at:null
    };
    await put(SESSION_STORE,session);
    localStorage.setItem(ACTIVE_SESSION_KEY,session.capture_session_id);
    return session;
  }

  async function activeSession(){
    const id=localStorage.getItem(ACTIVE_SESSION_KEY);
    if(!id)return null;
    return getByKey(SESSION_STORE,id);
  }

  async function updateSession(patch={}){
    const session=await activeSession()||await createSession();
    const next={...session,...patch,updated_at:now()};
    await put(SESSION_STORE,next);
    return next;
  }

  async function setCaptureTarget(groupKey,kind){
    return updateSession({
      current_group_key:clean(groupKey)||'TALENT:연산',
      current_kind:clean(kind)||'RANGE'
    });
  }

  async function addFiles(files,input={}){
    const session=await activeSession()||await createSession(input);
    if(session.status!=='TEMP_CAPTURE')throw new Error('capture session is closed');
    const groupKey=clean(input.group_key)||session.current_group_key||'TALENT:연산';
    const kind=clean(input.kind)||session.current_kind||'RANGE';
    const list=Array.from(files||[]).filter(Boolean);
    const created=[];
    for(const file of list){
      const item={
        capture_item_id:id('capture_item'),
        capture_session_id:session.capture_session_id,
        group_key:groupKey,
        kind,
        visibility:kind==='ANSWER_REFERENCE'?'PARENT_ONLY':'FAMILY',
        file_name:clean(file.name)||'capture.jpg',
        mime_type:clean(file.type)||'image/jpeg',
        size:Number(file.size)||0,
        blob:file,
        state:'TEMP_SAVED',
        ocr_state:'NOT_REQUESTED',
        classification_state:'GROUP_LOCKED_BY_PARENT',
        created_at:now(),
        updated_at:now()
      };
      await put(ITEM_STORE,item);
      created.push({...item,blob:undefined});
    }
    await updateSession({current_group_key:groupKey,current_kind:kind});
    return created;
  }

  async function listItems(sessionId){
    const id=clean(sessionId)||(await activeSession())?.capture_session_id;
    if(!id)return [];
    const items=await listByIndex(ITEM_STORE,'capture_session_id',id);
    return items.sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)));
  }

  async function getItem(itemId){
    return getByKey(ITEM_STORE,itemId);
  }

  async function removeItem(itemId){
    return remove(ITEM_STORE,itemId);
  }

  async function previewUrl(itemId){
    const item=await getItem(itemId);
    if(!item?.blob)return null;
    return URL.createObjectURL(item.blob);
  }

  function artifactDescriptor(item){
    return {
      artifact_id:'artifact_'+item.capture_item_id,
      kind:item.kind==='ANSWER_REFERENCE'?'ANSWER_REFERENCE':'SOURCE',
      visibility:item.visibility,
      source:{
        kind:'LOCAL_CAPTURE',
        capture_session_id:item.capture_session_id,
        capture_item_id:item.capture_item_id,
        group_key:item.group_key,
        capture_kind:item.kind,
        mime_type:item.mime_type,
        file_name:item.file_name,
        size:item.size
      },
      captured_at:item.created_at
    };
  }

  async function artifactsForGroup(groupKey){
    const session=await activeSession();
    if(!session)return [];
    const items=(await listItems(session.capture_session_id)).filter(x=>x.group_key===groupKey);
    return items.map(artifactDescriptor);
  }

  async function groupSummary(){
    const session=await activeSession();
    if(!session)return [];
    const items=await listItems(session.capture_session_id);
    const map=new Map();
    for(const item of items){
      const row=map.get(item.group_key)||{group_key:item.group_key,total:0,kinds:{},answer_count:0};
      row.total++;
      row.kinds[item.kind]=(row.kinds[item.kind]||0)+1;
      if(item.visibility==='PARENT_ONLY')row.answer_count++;
      map.set(item.group_key,row);
    }
    return [...map.values()];
  }

  async function requestAnalysis(){
    const session=await activeSession();
    if(!session)return {ok:false,reason:'NO_CAPTURE_SESSION'};
    const items=await listItems(session.capture_session_id);
    if(!items.length)return {ok:false,reason:'NO_CAPTURE_ITEMS'};

    const adapter=globalThis.ReadyCaptureAnalysisAdapter;
    if(!adapter||typeof adapter.analyze!=='function'){
      const next={
        ...session,
        status:'CAPTURE_LOCKED',
        analysis_state:'WAITING_ANALYSIS_ADAPTER',
        analysis_adapter:null,
        completed_at:now(),
        updated_at:now()
      };
      await put(SESSION_STORE,next);
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      return {
        ok:true,
        queued:true,
        analysis_state:next.analysis_state,
        capture_session_id:next.capture_session_id,
        item_count:items.length,
        groups:await groupSummaryForSession(next.capture_session_id)
      };
    }

    const next={...session,status:'CAPTURE_LOCKED',analysis_state:'ANALYSIS_REQUESTED',analysis_adapter:adapter.version||'UNKNOWN',completed_at:now(),updated_at:now()};
    await put(SESSION_STORE,next);
    const manifest=items.map(x=>({
      capture_item_id:x.capture_item_id,
      group_key:x.group_key,
      kind:x.kind,
      visibility:x.visibility,
      mime_type:x.mime_type,
      file_name:x.file_name,
      size:x.size
    }));
    const result=await adapter.analyze({session:next,manifest,getBlob:async itemId=>(await getItem(itemId))?.blob||null});
    const done={...next,analysis_state:result?.ok?'ANALYSIS_COMPLETE':'ANALYSIS_FAILED',analysis_result:result||null,updated_at:now()};
    await put(SESSION_STORE,done);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    return {ok:!!result?.ok,capture_session_id:done.capture_session_id,analysis_state:done.analysis_state,result};
  }

  async function groupSummaryForSession(sessionId){
    const items=await listItems(sessionId);
    const map=new Map();
    for(const item of items){
      const row=map.get(item.group_key)||{group_key:item.group_key,total:0,kinds:{}};
      row.total++;
      row.kinds[item.kind]=(row.kinds[item.kind]||0)+1;
      map.set(item.group_key,row);
    }
    return [...map.values()];
  }

  async function latestSession(){
    const db=await openDb();
    try{
      return await new Promise((resolve,reject)=>{
        const store=db.transaction(SESSION_STORE,'readonly').objectStore(SESSION_STORE);
        const req=store.getAll();
        req.onsuccess=()=>{
          const all=(req.result||[]).sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)));
          resolve(all[0]||null);
        };
        req.onerror=()=>reject(req.error);
      });
    }finally{db.close()}
  }

  window.ReadyCaptureV01=Object.freeze({
    version:VERSION,
    createSession,
    activeSession,
    latestSession,
    setCaptureTarget,
    addFiles,
    listItems,
    getItem,
    removeItem,
    previewUrl,
    artifactDescriptor,
    artifactsForGroup,
    groupSummary,
    requestAnalysis
  });
})();
