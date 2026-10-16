(() => {
'use strict';
if (window.ReadyFamilyMemberProfileAdapterV1) return;

const VERSION='2026.10.09-family-member-profile-adapter-v1';
let provider=null;
const clean=v=>typeof v==='string'?v.trim():'';

function normalize(input){
  if(!input||typeof input!=='object')throw new Error('FAMILY_MEMBER_PROFILE_REQUIRED');
  const out={
    member_id:clean(input.member_id),
    profile_version:Number(input.profile_version||1),
    display_name:clean(input.display_name),
    legal_name:clean(input.legal_name),
    nickname:clean(input.nickname),
    family_role:clean(input.family_role).toUpperCase(),
    birth_date:clean(input.birth_date),
    school_stage:clean(input.school_stage).toUpperCase(),
    share_name_mode:clean(input.share_name_mode).toUpperCase()||'NAME_NICKNAME',
    status:clean(input.status).toUpperCase()||'CONFIRMED',
    updated_at:clean(input.updated_at)||new Date().toISOString()
  };
  if(!out.member_id||!Number.isInteger(out.profile_version)||out.profile_version<1||!out.display_name)
    throw new Error('FAMILY_MEMBER_PROFILE_INCOMPLETE');
  return out;
}

function registerProvider(next){
  if(!next||typeof next.publish!=='function'||typeof next.get!=='function')
    throw new Error('FAMILY_MEMBER_PROFILE_PROVIDER_INVALID');
  provider=next;
  return {provider_id:String(next.id||'custom'),version:VERSION};
}

function registerHttpProvider({baseUrl,getToken,getFamilyId,fetchImpl=fetch}={}){
  const base=new URL(String(baseUrl||''),globalThis.location?.href||'http://localhost/');
  const local=['localhost','127.0.0.1'].includes(base.hostname);
  if((!local&&base.protocol!=='https:')||typeof getToken!=='function'||typeof getFamilyId!=='function'||typeof fetchImpl!=='function')
    throw new Error('FAMILY_MEMBER_PROFILE_HTTP_PROVIDER_INVALID');
  const endpoint=new URL('/api/family/member-profile',base).href;
  const call=async payload=>{
    const token=clean(await getToken());
    const family_id=clean(await getFamilyId());
    if(!token||!family_id)throw new Error('FAMILY_MEMBER_PROFILE_AUTH_CONTEXT_REQUIRED');
    const res=await fetchImpl(endpoint,{
      method:'POST',
      headers:{'content-type':'application/json','authorization':'Bearer '+token},
      body:JSON.stringify({family_id,...payload})
    });
    const body=await res.json().catch(()=>({ok:false,reason:'INVALID_MEMBER_PROFILE_RESPONSE'}));
    if(!res.ok||body.ok===false)
      throw Object.assign(new Error(body.reason||('MEMBER_PROFILE_HTTP_'+res.status)),{status:res.status,body});
    return body;
  };
  return registerProvider({
    id:'taky-family-member-profile-http-v1',
    publish:async projection=>call({action:'PUBLISH',member_id:projection.member_id,projection}),
    get:async member_id=>{
      const body=await call({action:'GET',member_id});
      return body.found?body.projection:null;
    }
  });
}

async function resolve(memberId){
  const id=clean(memberId);
  if(!id)throw new Error('FAMILY_MEMBER_ID_REQUIRED');
  if(!provider)return {source:'NONE',projection:null};
  const remote=await provider.get(id);
  if(!remote)return {source:'NONE',projection:null};
  const projection=normalize(remote);
  if(projection.member_id!==id)throw new Error('FAMILY_MEMBER_PROFILE_SCOPE_MISMATCH');
  return {source:'TAKY_CENTRAL',projection};
}

async function publish(projection){
  const cleanProjection=normalize(projection);
  if(!provider)return {state:'PENDING_PROVIDER',projection:cleanProjection};
  const result=await provider.publish(cleanProjection);
  return {state:'PUBLISHED',projection:normalize(result?.projection||cleanProjection),provider_result:result||null};
}

window.ReadyFamilyMemberProfileAdapterV1={
  version:VERSION,
  registerProvider,
  registerHttpProvider,
  resolve,
  publish,
  status:()=>({provider_available:!!provider,version:VERSION})
};
})();
