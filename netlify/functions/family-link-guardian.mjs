import { admin, getUser, verifyRequestOrigin } from '@netlify/identity';
import core from './ready-family-auth-core.js';

const { familySessionFromIdentityUser } = core;

export default async function handler(req){
  if(req.method!=='POST') return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  try{ verifyRequestOrigin(req); }
  catch{ return Response.json({ok:false,reason:'ORIGIN_REJECTED'},{status:403}); }

  const actor=await getUser();
  const parent=familySessionFromIdentityUser(actor||{});
  if(!parent.ok||parent.session.role!=='PARENT') return Response.json({ok:false,reason:'PARENT_ROLE_REQUIRED'},{status:403});

  let body={};
  try{ body=await req.json(); }
  catch{ return Response.json({ok:false,reason:'INVALID_JSON'},{status:400}); }
  const email=String(body.email||'').trim().toLowerCase();
  const relationship=String(body.relationship||'GUARDIAN').trim().toUpperCase()||'GUARDIAN';
  if(!email) return Response.json({ok:false,reason:'GUARDIAN_EMAIL_REQUIRED'},{status:400});

  const users=await admin.listUsers({page:1,perPage:1000});
  const target=users.find(x=>String(x.email||'').trim().toLowerCase()===email);
  if(!target) return Response.json({ok:false,reason:'GUARDIAN_ACCOUNT_NOT_FOUND'},{status:404});
  if(target.id===parent.session.member_id) return Response.json({ok:false,reason:'SELF_LINK_NOT_ALLOWED'},{status:409});

  const existing=String(target.appMetadata?.family_id||'').trim();
  if(existing&&existing!==parent.session.family_id)return Response.json({ok:false,reason:'TARGET_ALREADY_IN_OTHER_FAMILY'},{status:409});

  const nextMetadata={
    ...(target.appMetadata||{}),
    roles:['GUARDIAN'],
    family_id:parent.session.family_id,
    membership_id:String(target.appMetadata?.membership_id||'membership_'+target.id+'_'+parent.session.family_id),
    relationship,
    membership_status:'ACTIVE'
  };
  const updated=await admin.updateUser(target.id,{app_metadata:nextMetadata});
  return Response.json({ok:true,guardian:{id:updated.id,email:updated.email||email,role:'GUARDIAN',family_id:parent.session.family_id,relationship}});
}
export const config={path:'/api/family/link-guardian'};
