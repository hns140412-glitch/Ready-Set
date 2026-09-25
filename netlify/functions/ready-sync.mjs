import { getDeployStore, getStore } from '@netlify/blobs';
import { admin, getUser } from '@netlify/identity';
import syncCore from './ready-sync-core.js';
import familyCore from './ready-family-auth-core.js';
import registryCore from './family-member-registry-core.js';

const { createSyncService } = syncCore;
const { familySessionFromIdentityUser } = familyCore;

function blobStore(){
  const context=globalThis.Netlify?.context?.deploy?.context;
  return context==='production'
    ? getStore('ready-set-sync-v1',{consistency:'strong'})
    : getDeployStore('ready-set-sync-v1');
}

export default async function handler(req){
  const path=new URL(req.url).pathname;

  if(req.method==='GET'&&path.endsWith('/health')){
    const user=await getUser();
    const mapped=user?familySessionFromIdentityUser(user):null;
    return Response.json({
      ok:true,
      service:'ready-set-sync',
      contract:'HTTP_JSON_V1',
      persistence:'REMOTE_STORE',
      authentication:user?'IDENTITY_SESSION':'UNAUTHENTICATED',
      family_scope:mapped?.ok?'RESOLVED':'UNRESOLVED'
    },{status:200,headers:{'Cache-Control':'no-store'}});
  }

  if(req.method==='POST'&&path.endsWith('/events')){
    const user=await getUser();
    if(!user) return Response.json({ok:false,reason:'UNAUTHENTICATED'},{status:401});
    const mapped=familySessionFromIdentityUser(user);
    if(!mapped.ok) return Response.json({ok:false,reason:mapped.reason},{status:mapped.status});

    let body={};
    try{ body=await req.json(); }
    catch{ return Response.json({ok:false,reason:'INVALID_JSON'},{status:400}); }

    const headerKey=req.headers.get('idempotency-key');
    if(headerKey&&!body.idempotency_key)body.idempotency_key=headerKey;

    const requestedMemberId=String(body?.scope_identity?.member_id||mapped.session.member_id||'').trim();
    let targetMemberId=mapped.session.member_id;
    if(requestedMemberId&&requestedMemberId!==mapped.session.member_id){
      if(mapped.session.role!=='PARENT'){
        return Response.json({ok:false,reason:'MEMBER_SCOPE_NOT_ALLOWED'},{status:403});
      }
      const users=await admin.listUsers({page:1,perPage:1000});
      const visible=registryCore.registryForSession(mapped.session,users||[]);
      const allowed=visible.ok&&visible.registry.members.some(m=>m.member_id===requestedMemberId&&m.role==='CHILD');
      if(!allowed)return Response.json({ok:false,reason:'TARGET_MEMBER_NOT_IN_FAMILY'},{status:403});
      targetMemberId=requestedMemberId;
    }

    const store=blobStore();
    const service=createSyncService({
      get:key=>store.get(key),
      set:(key,value)=>store.set(key,value)
    },{
      namespace:mapped.session.family_id,
      member_id:targetMemberId,
      actor_member_id:mapped.session.member_id,
      actor_role:mapped.session.role
    });
    body.actor_member_id=mapped.session.member_id;
    const result=await service.putEvent(body);
    return Response.json(result.body,{status:result.status,headers:{'Cache-Control':'no-store'}});
  }

  return Response.json({ok:false,reason:'NOT_FOUND'},{status:404});
}

export const config={path:['/api/ready-sync/health','/api/ready-sync/events']};
