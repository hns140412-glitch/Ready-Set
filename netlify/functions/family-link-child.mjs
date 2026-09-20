import { admin, getUser, verifyRequestOrigin } from '@netlify/identity';
import core from './ready-family-auth-core.js';

const { familySessionFromIdentityUser, canLinkChild } = core;

export default async function handler(req){
  if(req.method!=='POST') return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  try{ verifyRequestOrigin(req); }
  catch{ return Response.json({ok:false,reason:'ORIGIN_REJECTED'},{status:403}); }

  const parentUser=await getUser();
  const parent=familySessionFromIdentityUser(parentUser||{});
  if(!parent.ok||parent.session.role!=='PARENT') return Response.json({ok:false,reason:'PARENT_ROLE_REQUIRED'},{status:403});

  let body={};
  try{ body=await req.json(); }
  catch{ return Response.json({ok:false,reason:'INVALID_JSON'},{status:400}); }
  const email=String(body.email||'').trim().toLowerCase();
  if(!email) return Response.json({ok:false,reason:'CHILD_EMAIL_REQUIRED'},{status:400});

  const users=await admin.listUsers({page:1,perPage:1000});
  const target=users.find(x=>String(x.email||'').trim().toLowerCase()===email);
  if(!target) return Response.json({ok:false,reason:'CHILD_ACCOUNT_NOT_FOUND'},{status:404});
  if(target.id===parent.session.member_id) return Response.json({ok:false,reason:'SELF_LINK_NOT_ALLOWED'},{status:409});

  const allowed=canLinkChild(parentUser,target);
  if(!allowed.ok) return Response.json({ok:false,reason:allowed.reason},{status:allowed.status});

  const nextMetadata={
    ...(target.appMetadata||{}),
    roles:['CHILD'],
    family_id:allowed.family_id
  };
  const updated=await admin.updateUser(target.id,{app_metadata:nextMetadata});
  return Response.json({
    ok:true,
    child:{id:updated.id,email:updated.email||email,role:'CHILD',family_id:allowed.family_id}
  });
}
export const config={path:'/api/family/link-child'};
