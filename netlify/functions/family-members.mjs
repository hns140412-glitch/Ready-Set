import { admin, getUser } from '@netlify/identity';
import core from './ready-family-auth-core.js';

const { familySessionFromIdentityUser, membershipFor } = core;

export default async function handler(req){
  if(req.method!=='GET')return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  const actor=await getUser();
  const current=familySessionFromIdentityUser(actor||{});
  if(!current.ok)return Response.json({ok:false,reason:current.reason},{status:current.status});
  const users=await admin.listUsers({page:1,perPage:1000});
  const members=users.map(user=>({user,membership:membershipFor(user)}))
    .filter(x=>x.membership?.family_id===current.session.family_id&&x.membership.status==='ACTIVE')
    .map(x=>({
      account_id:x.membership.account_id,
      member_id:x.membership.account_id,
      role:x.membership.role,
      relationship:x.membership.relationship,
      email:String(x.user.email||''),
      name:String(x.user.name||x.user.userMetadata?.full_name||'')
    }));
  return Response.json({ok:true,family_id:current.session.family_id,members});
}
export const config={path:'/api/family/members'};
