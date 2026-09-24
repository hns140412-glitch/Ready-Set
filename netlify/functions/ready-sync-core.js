'use strict';

function clean(value){ return String(value ?? '').trim(); }

function parseMemberScope(scope){
  const match=/^member:([^:]+):(.+)$/.exec(clean(scope));
  if(!match)return null;
  let memberId=match[1];
  try{memberId=decodeURIComponent(memberId);}catch{}
  return {member_id:clean(memberId),scope:clean(match[2])};
}
function parseFamilyScope(scope){
  const match=/^family:([^:]+):(.+)$/.exec(clean(scope));
  if(!match)return null;
  let familyId=match[1];
  try{familyId=decodeURIComponent(familyId);}catch{}
  return {family_id:clean(familyId),scope:clean(match[2])};
}

function createSyncService(store,options={}){
  if(!store || typeof store.get !== 'function' || typeof store.set !== 'function'){
    throw new Error('store with get/set required');
  }
  const namespace=clean(options.namespace);
  const authenticatedMemberId=clean(options.member_id);
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
    const parsedMemberScope=parseMemberScope(scope);
    const parsedFamilyScope=parseFamilyScope(scope);
    if(authenticatedMemberId){
      if(parsedMemberScope&&parsedMemberScope.member_id!==authenticatedMemberId){
        return {status:403,body:{ok:false,reason:'MEMBER_SCOPE_FORBIDDEN'}};
      }
      if(parsedFamilyScope&&parsedFamilyScope.family_id!==namespace){
        return {status:403,body:{ok:false,reason:'FAMILY_SCOPE_FORBIDDEN'}};
      }
      if(!parsedMemberScope&&!parsedFamilyScope){
        return {status:400,body:{ok:false,reason:'SCOPED_EVENT_REQUIRED'}};
      }
    }

    const scoped=!!parsedMemberScope||!!parsedFamilyScope;
    const key=scoped
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
      member_id:parsedMemberScope?.member_id||null,
      family_id:parsedFamilyScope?.family_id||namespace,
      accepted_at:new Date().toISOString()
    };
    await store.set(key,JSON.stringify(record));
    return {status:200,body:{ok:true,idempotent:false,remote_version:record.remote_version}};
  }

  return {health,putEvent};
}

module.exports={createSyncService,parseMemberScope,parseFamilyScope};
