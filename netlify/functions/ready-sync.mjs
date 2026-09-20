import { getDeployStore, getStore } from '@netlify/blobs';
import { getUser } from '@netlify/identity';
import syncCore from './ready-sync-core.js';
import familyCore from './ready-family-auth-core.js';

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

    const store=blobStore();
    const service=createSyncService({
      get:key=>store.get(key),
      set:(key,value)=>store.set(key,value)
    },{namespace:mapped.session.family_id});
    const result=await service.putEvent(body);
    return Response.json(result.body,{status:result.status,headers:{'Cache-Control':'no-store'}});
  }

  return Response.json({ok:false,reason:'NOT_FOUND'},{status:404});
}

export const config={path:['/api/ready-sync/health','/api/ready-sync/events']};
