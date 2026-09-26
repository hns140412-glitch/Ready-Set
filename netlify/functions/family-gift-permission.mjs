import { getUser } from '@netlify/identity';
import core from './ready-family-auth-core.js';

const { familySessionFromIdentityUser, authorizeFamilyGiverFromIdentityUser }=core;

// Read-only: checks the CURRENT server-verified Identity account's capability.
// The response cannot be used to authorize a subsequent mutation; the gift
// handler must independently re-resolve the authenticated Identity user.
export default async function handler(req){
  if(req.method!=='GET')
    return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  let user;
  try{user=await getUser();}
  catch{return Response.json({ok:false,reason:'IDENTITY_UNAVAILABLE'},{status:503,headers:{'Cache-Control':'no-store'}});}
  if(!user)return Response.json({ok:false,reason:'UNAUTHENTICATED'},{status:401,headers:{'Cache-Control':'no-store'}});
  const mapped=familySessionFromIdentityUser(user);
  if(!mapped.ok)return Response.json({ok:false,reason:mapped.reason},{status:mapped.status,headers:{'Cache-Control':'no-store'}});
  const session=mapped.session;
  const permission=authorizeFamilyGiverFromIdentityUser(user,{
    family_id:session.family_id,giver_member_id:session.member_id,
    action:'VIEW_GIFT_OPTIONS',target_child_id:null
  });
  return Response.json({
    ok:true,contract:'TAKY_READY_FAMILY_GIFT_CAPABILITY_READ_V1',
    family_id:session.family_id,member_id:session.member_id,
    family_relation:session.family_relation,
    can_give_praise_gifts:permission.allowed===true
  },{status:200,headers:{'Cache-Control':'no-store'}});
}
export const config={path:'/api/family/gift-permission'};
