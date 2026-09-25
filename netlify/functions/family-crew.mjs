import { admin, getUser } from '@netlify/identity';
import authCore from './ready-family-auth-core.js';
import memberCore from './family-member-registry-core.js';
import crewCore from './family-crew-core.js';

export default async function handler(req){
  if(req.method!=='GET')return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  const actorUser=await getUser();
  const actor=authCore.familySessionFromIdentityUser(actorUser||{});
  if(!actor.ok)return Response.json({ok:false,reason:actor.reason},{status:actor.status||401});

  const url=new URL(req.url);
  const targetId=String(url.searchParams.get('member_id')||actor.session.member_id||'').trim();
  const users=await admin.listUsers({page:1,perPage:1000});
  const family=memberCore.registryForSession(actor.session,users||[]);
  if(!family.ok)return Response.json({ok:false,reason:family.reason},{status:family.status||403});
  const allowed=crewCore.canRead(actor.session,targetId,family.registry.members);
  if(!allowed.ok)return Response.json({ok:false,reason:allowed.reason},{status:allowed.status||403});
  const target=users.find(x=>String(x.id||'')===targetId);
  if(!target)return Response.json({ok:false,reason:'TARGET_MEMBER_NOT_FOUND'},{status:404});
  return Response.json({ok:true,crew:crewCore.crewFromUser(target)});
}
export const config={path:'/api/family/crew'};
