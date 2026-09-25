'use strict';

function clean(value){ return String(value ?? '').trim(); }

function createSyncService(store,options={}){
  if(!store || typeof store.get !== 'function' || typeof store.set !== 'function'){
    throw new Error('store with get/set required');
  }
  const namespace=clean(options.namespace);
  const memberId=clean(options.member_id);
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

    const key='families/'+encodeURIComponent(namespace)+'/events/'+encodeURIComponent(idempotencyKey);
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

    const clientScopeIdentity=input.scope_identity&&typeof input.scope_identity==='object'?input.scope_identity:{};
    if(clean(clientScopeIdentity.family_id)&&clean(clientScopeIdentity.family_id)!==namespace){
      return {status:403,body:{ok:false,reason:'FAMILY_SCOPE_MISMATCH'}};
    }
    if(memberId&&clean(clientScopeIdentity.member_id)&&clean(clientScopeIdentity.member_id)!==memberId){
      return {status:403,body:{ok:false,reason:'MEMBER_SCOPE_MISMATCH'}};
    }

    const record={
      event_id:eventId,
      idempotency_key:idempotencyKey,
      scope:clean(input.scope)||'unknown',
      logical_scope:clean(input.logical_scope||input.scope)||'unknown',
      scope_key:clean(input.scope_key)||null,
      scope_identity:{family_id:namespace,member_id:memberId||null},
      digest,
      payload:input.payload ?? null,
      created_at:input.created_at || null,
      updated_at:input.updated_at || null,
      client:input.client || null,
      remote_version:1,
      family_namespace:namespace,
      member_id:memberId||null,
      accepted_at:new Date().toISOString()
    };
    await store.set(key,JSON.stringify(record));
    return {status:200,body:{ok:true,idempotent:false,remote_version:record.remote_version}};
  }

  return {health,putEvent};
}

module.exports={createSyncService};
