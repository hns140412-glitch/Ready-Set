'use strict';

function clean(value){ return String(value ?? '').trim(); }

function createSyncService(store,options={}){
  if(!store || typeof store.get !== 'function' || typeof store.set !== 'function'){
    throw new Error('store with get/set required');
  }
  const namespace=clean(options.namespace);
  if(!namespace) throw new Error('namespace required');

  async function health(){
    return {ok:true,service:'ready-set-sync',contract:'HTTP_JSON_V1',persistence:'REMOTE_STORE'};
  }

  async function putEvent(input={}){
    const eventId=clean(input.event_id);
    const idempotencyKey=clean(input.idempotency_key || eventId);
    const digest=clean(input.digest);
    if(!eventId || !idempotencyKey || !digest){
      return {status:400,body:{ok:false,reason:'INVALID_EVENT'}};
    }

    const scope=clean(input.scope)||'unknown';
    const memberScoped=/^member:[^:]+:.+$/.test(scope);
    const key=memberScoped
      ? 'families/'+encodeURIComponent(namespace)+'/scopes/'+encodeURIComponent(scope)+'/events/'+encodeURIComponent(idempotencyKey)
      : 'families/'+encodeURIComponent(namespace)+'/events/'+encodeURIComponent(idempotencyKey);
    const existing=await store.get(key);
    if(existing){
      const current=typeof existing==='string' ? JSON.parse(existing) : existing;
      if(current.event_id===eventId && current.digest===digest){
        return {status:200,body:{ok:true,idempotent:true,remote_version:current.remote_version}};
      }
      return {
        status:409,
        body:{
          ok:false,
          reason:'REMOTE_CONFLICT',
          remote_version:current.remote_version,
          remote_payload:current.payload ?? null
        }
      };
    }

    const record={
      event_id:eventId,
      idempotency_key:idempotencyKey,
      scope,
      digest,
      payload:input.payload ?? null,
      created_at:input.created_at || null,
      updated_at:input.updated_at || null,
      client:input.client || null,
      remote_version:1,
      family_namespace:namespace,
      accepted_at:new Date().toISOString()
    };
    await store.set(key,JSON.stringify(record));
    return {status:200,body:{ok:true,idempotent:false,remote_version:record.remote_version}};
  }

  return {health,putEvent};
}

module.exports={createSyncService};
