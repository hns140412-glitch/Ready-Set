import { admin, getUser, verifyRequestOrigin } from '@netlify/identity';
import authCore from './ready-family-auth-core.js';
import registryCore from './family-member-registry-core.js';

export default async function handler(req){
  if(req.method!=='PATCH')return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  try{verifyRequestOrigin(req)}catch{return Response.json({ok:false,reason:'ORIGIN_REJECTED'},{status:403})}

  const actorUser=await getUser();
  const actor=authCore.familySessionFromIdentityUser(actorUser||{});
  if(!actor.ok)return Response.json({ok:false,reason:actor.reason},{status:actor.status||401});

  let body={}; try{body=await req.json()}catch{return Response.json({ok:false,reason:'INVALID_JSON'},{status:400})}
  const targetId=String(body.member_id||actor.session.member_id||'').trim();
  const allowed=registryCore.canEditProfile(actor.session,targetId);
  if(!allowed.ok)return Response.json({ok:false,reason:allowed.reason},{status:allowed.status||403});

  const patch=registryCore.sanitizeProfilePatch(body.profile||{});
  if(!patch.ok)return Response.json({ok:false,reason:patch.reason},{status:400});

  const users=await admin.listUsers({page:1,perPage:1000});
  const target=users.find(x=>String(x.id||'')===targetId);
  const member=target?registryCore.memberFromIdentityUser(target,actor.session.family_id):null;
  if(!target||!member)return Response.json({ok:false,reason:'TARGET_MEMBER_NOT_IN_FAMILY'},{status:404});

  const nextMetadata={...(target.appMetadata||{}),family_profile:patch.profile};
  const updated=await admin.updateUser(target.id,{app_metadata:nextMetadata});
  const updatedMember=registryCore.memberFromIdentityUser(updated,actor.session.family_id);
  return Response.json({ok:true,member:updatedMember});
}
export const config={path:'/api/family/profile'};
