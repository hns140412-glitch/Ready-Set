import { admin, getUser, verifyRequestOrigin } from '@netlify/identity';
import core from './ready-family-auth-core.js';

const { accountSessionFromIdentityUser, familySessionFromIdentityUser } = core;

export default async function handler(req){
  if(req.method!=='POST') return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  try{ verifyRequestOrigin(req); }
  catch{ return Response.json({ok:false,reason:'ORIGIN_REJECTED'},{status:403}); }

  const user=await getUser();
  if(!user) return Response.json({ok:false,reason:'UNAUTHENTICATED'},{status:401});
  const current=accountSessionFromIdentityUser(user);
  if(!current.ok) return Response.json({ok:false,reason:current.reason},{status:current.status});
  if(current.session.family_id) return Response.json({ok:false,reason:'FAMILY_ALREADY_BOUND'},{status:409});

  let body={};
  try{ body=await req.json(); }catch{}
  const relationship=String(body.relationship||'GUARDIAN').trim().toUpperCase()||'GUARDIAN';
  const familyId='family_'+crypto.randomUUID();
  const membershipId='membership_'+crypto.randomUUID();
  const nextMetadata={
    ...(user.appMetadata||{}),
    roles:['GUARDIAN'],
    family_id:familyId,
    membership_id:membershipId,
    relationship,
    membership_status:'ACTIVE',
    provider:String(user.provider||user.appMetadata?.provider||'google')
  };
  const updated=await admin.updateUser(user.id,{app_metadata:nextMetadata});
  const mapped=familySessionFromIdentityUser(updated);
  if(!mapped.ok)return Response.json({ok:false,reason:mapped.reason},{status:mapped.status});
  return Response.json({ok:true,family:{family_id:familyId},session:mapped.session},{status:201});
}
export const config={path:'/api/family/create'};
