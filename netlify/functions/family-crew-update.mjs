import { admin, getUser, verifyRequestOrigin } from '@netlify/identity';
import authCore from './ready-family-auth-core.js';
import crewCore from './family-crew-core.js';

export default async function handler(req){
  if(req.method!=='PATCH')return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  try{verifyRequestOrigin(req)}catch{return Response.json({ok:false,reason:'ORIGIN_REJECTED'},{status:403})}
  const actorUser=await getUser();
  const actor=authCore.familySessionFromIdentityUser(actorUser||{});
  if(!actor.ok)return Response.json({ok:false,reason:actor.reason},{status:actor.status||401});

  let body={}; try{body=await req.json()}catch{return Response.json({ok:false,reason:'INVALID_JSON'},{status:400})}
  const targetId=String(body.member_id||actor.session.member_id||'').trim();
  const allowed=crewCore.canWrite(actor.session,targetId);
  if(!allowed.ok)return Response.json({ok:false,reason:allowed.reason},{status:allowed.status||403});

  const target=await admin.getUser(targetId);
  if(!target)return Response.json({ok:false,reason:'TARGET_MEMBER_NOT_FOUND'},{status:404});
  const current=crewCore.crewFromUser(target);
  const patched=crewCore.applyPatch(current,body);
  if(!patched.ok)return Response.json({ok:false,reason:patched.reason},{status:400});
  const nextMetadata={...(target.appMetadata||{}),exploration_crew:patched.registry};
  const updated=await admin.updateUser(target.id,{app_metadata:nextMetadata});
  return Response.json({ok:true,crew:crewCore.crewFromUser(updated)});
}
export const config={path:'/api/family/crew/update'};
