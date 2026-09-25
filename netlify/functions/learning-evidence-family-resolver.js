'use strict';

const familyCore=require('./ready-family-auth-core.js');
const {familySessionFromIdentityUser,membershipFor}=familyCore;

function resolveEvidenceIdentity(actor={},users=[]){
  const current=familySessionFromIdentityUser(actor||{});
  if(!current.ok)return current;

  const session=current.session;
  const activeMembers=(Array.isArray(users)?users:[])
    .map(user=>({user,membership:membershipFor(user)}))
    .filter(x=>x.membership?.family_id===session.family_id&&x.membership.status==='ACTIVE')
    .map(x=>x.membership.account_id)
    .filter(Boolean);

  const authorized=session.role==='PARENT'
    ? [...new Set([session.member_id,...activeMembers].filter(Boolean))]
    : [session.member_id].filter(Boolean);

  return {
    ok:true,
    identity:{
      authenticated:true,
      family_id:session.family_id,
      actor_member_id:session.member_id,
      actor_role:session.role,
      authorized_member_ids:authorized,
      source:'READY_FAMILY_MEMBERSHIP'
    }
  };
}

module.exports={resolveEvidenceIdentity};
