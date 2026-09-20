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
  const clone=v=>JSON.parse(JSON.stringify(v));
  function draftId(sessionId,groupKey,index,runNo){
    return 'review_'+String(sessionId||'capture')+'_'+String(runNo||1)+'_'+String(index)+'_'+String(groupKey||'group').replace(/[^a-zA-Z0-9가-힣]+/g,'_');
  }
  function decorateAnalysisResult(session,result,manifest=[]){
    if(!result?.ok||!Array.isArray(result.drafts))return result||null;
    const runNo=Number(session.analysis_run_no||0)+1;
    const receivedAt=result.received_at||now();
    const drafts=result.drafts.map((draft,index)=>({
      ...draft,
      review_draft_id:draft.review_draft_id||draftId(session.capture_session_id,draft.group_key,index,runNo),
      draft_version:1,
      review_state:'UNREVIEWED',
      original_extraction:clone(draft),
      reviewed_value:null,
      review_events:[{event:'DRAFT_CREATED',at:receivedAt,actor:'ANALYSIS_ADAPTER'}]
    }));
    const evidence=new Set(drafts.flatMap(d=>Array.isArray(d.evidence_item_ids)?d.evidence_item_ids:[]));
    const capture_item_dispositions=(Array.isArray(manifest)?manifest:[]).map(item=>({
      capture_item_id:item.capture_item_id,
      group_key:item.group_key,
      capture_kind:item.kind,
      disposition:item.kind==='ANSWER_REFERENCE'
        ?'IGNORED_WITH_REASON'
        :evidence.has(item.capture_item_id)?'LINKED_TO_REVIEW_DRAFT':'UNRESOLVED',
      reason:item.kind==='ANSWER_REFERENCE'
        ?'ANSWER_REFERENCE_EXCLUDED_FROM_OCR'
        :evidence.has(item.capture_item_id)?null:'NO_DRAFT_EVIDENCE_LINK'
    }));
    return {
      ...result,
      analysis_run_no:runNo,
      drafts,
      capture_item_dispositions
    };
  }

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
      analysis_run_no:0,
      analysis_history:[],
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

  async function resolveSession(sessionId){
    if(clean(sessionId))return getByKey(SESSION_STORE,clean(sessionId));
    return (await activeSession())||(await latestSession());
  }

  async function artifactsForGroup(groupKey,sessionId){
    const session=await resolveSession(sessionId);
    if(!session)return [];
    const items=(await listItems(session.capture_session_id)).filter(x=>x.group_key===groupKey);
    return items.map(artifactDescriptor);
  }

  async function groupSummary(sessionId){
    const session=await resolveSession(sessionId);
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
    const session=(await activeSession())||(await latestSession());
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
    const priorHistory=Array.isArray(session.analysis_history)?session.analysis_history:[];
    const previous=session.analysis_result?.ok?{
      analysis_run_no:session.analysis_result.analysis_run_no||session.analysis_run_no||1,
      archived_at:now(),
      result:clone(session.analysis_result)
    }:null;
    const decorated=decorateAnalysisResult(session,result,manifest);
    const done={
      ...next,
      analysis_run_no:result?.ok?Number(session.analysis_run_no||0)+1:Number(session.analysis_run_no||0),
      analysis_history:previous?[...priorHistory,previous]:priorHistory,
      analysis_state:result?.ok?'ANALYSIS_COMPLETE':'ANALYSIS_FAILED',
      analysis_result:decorated||result||null,
      updated_at:now()
    };
    await put(SESSION_STORE,done);
    if(result?.ok) localStorage.removeItem(ACTIVE_SESSION_KEY);
    else localStorage.setItem(ACTIVE_SESSION_KEY,done.capture_session_id);
    return {ok:!!result?.ok,capture_session_id:done.capture_session_id,analysis_state:done.analysis_state,result};
  }

  async function updateReviewDraft(draftId,input={}){
    const session=(await activeSession())||(await latestSession());
    if(!session?.analysis_result?.drafts)return {ok:false,reason:'NO_REVIEW_DRAFT'};
    const drafts=session.analysis_result.drafts.map(d=>clone(d));
    const idx=drafts.findIndex(d=>d.review_draft_id===draftId);
    if(idx<0)return {ok:false,reason:'REVIEW_DRAFT_NOT_FOUND'};
    const draft=drafts[idx];
    const reviewedValue=clone(input.reviewed_value||{});
    draft.reviewed_value=reviewedValue;
    draft.draft_version=Number(draft.draft_version||1)+1;
    draft.review_state=clean(input.review_state)||'PARENT_REVIEWED';
    draft.review_events=Array.isArray(draft.review_events)?draft.review_events:[];
    draft.review_events.push({
      event:clean(input.event)||'PARENT_REVIEWED',
      actor:clean(input.actor)||'PARENT',
      at:now(),
      fields:Array.isArray(input.fields)?input.fields.map(clean).filter(Boolean):[]
    });
    drafts[idx]=draft;
    const next={...session,analysis_result:{...session.analysis_result,drafts},updated_at:now()};
    await put(SESSION_STORE,next);
    return {ok:true,draft:clone(draft),session:clone(next)};
  }

  async function reviewProvenanceForGroup(groupKey){
    const session=(await activeSession())||(await latestSession());
    const drafts=Array.isArray(session?.analysis_result?.drafts)?session.analysis_result.drafts:[];
    const rows=drafts.filter(d=>d.group_key===groupKey);
    if(!rows.length)return null;
    return {
      kind:'CAPTURE_REVIEW',
      capture_session_id:session.capture_session_id,
      analysis_run_no:session.analysis_result.analysis_run_no||session.analysis_run_no||null,
      analysis_adapter:session.analysis_adapter||null,
      provider:session.analysis_result.provider||null,
      model:session.analysis_result.model||null,
      capture_item_dispositions:clone(session.analysis_result.capture_item_dispositions||[]).filter(x=>x.group_key===groupKey),
      review_drafts:rows.map(d=>({
        review_draft_id:d.review_draft_id,
        draft_version:d.draft_version,
        review_state:d.review_state,
        confidence:d.confidence,
        evidence_item_ids:clone(d.evidence_item_ids||[]),
        original_extraction:clone(d.original_extraction||{}),
        reviewed_value:clone(d.reviewed_value||{}),
        review_events:clone(d.review_events||[])
      }))
    };
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
    requestAnalysis,
    updateReviewDraft,
    reviewProvenanceForGroup
  });
})();
