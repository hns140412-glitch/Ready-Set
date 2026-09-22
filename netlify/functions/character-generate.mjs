import { getUser } from '@netlify/identity';
import familyCore from './ready-family-auth-core.js';

const { familySessionFromIdentityUser }=familyCore;

export default async function handler(req){
  if(req.method!=='POST')return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  const user=await getUser();
  if(!user)return Response.json({ok:false,reason:'UNAUTHENTICATED'},{status:401});
  const mapped=familySessionFromIdentityUser(user);
  if(!mapped.ok)return Response.json({ok:false,reason:mapped.reason},{status:mapped.status});
  if(mapped.session.role!=='CHILD')return Response.json({ok:false,reason:'CHILD_ROLE_REQUIRED'},{status:403});

  const enabled=String(process.env.READY_CHARACTER_PAID_GENERATION||'').toLowerCase()==='true';
  if(!enabled){
    return Response.json({
      ok:false,
      reason:'CHARACTER_GENERATION_PROVIDER_LOCKED',
      gate:'READY_CHARACTER_PAID_GENERATION',
      next:'EXTERNAL_RESOURCE_GATE_REQUIRED'
    },{status:423,headers:{'Cache-Control':'no-store'}});
  }

  return Response.json({
    ok:false,
    reason:'CHARACTER_GENERATION_ADAPTER_NOT_CONNECTED',
    next:'CONNECT_PROVIDER_AFTER_EXTERNAL_RESOURCE_GATE'
  },{status:501,headers:{'Cache-Control':'no-store'}});
}

export const config={path:'/api/character/generate'};
