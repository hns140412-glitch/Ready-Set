'use strict';

function clean(v){return String(v??'').trim();}
function upper(v){return clean(v).toUpperCase();}
function normalizedRoles(user={}){
  const src=Array.isArray(user.roles)?user.roles:
    Array.isArray(user.appMetadata?.roles)?user.appMetadata.roles:
    Array.isArray(user.app_metadata?.roles)?user.app_metadata.roles:[];
  return [...new Set(src.map(upper).filter(Boolean))];
}
function accountIdFor(user={}){return clean(user.id)||null;}
function membershipFor(user={}){
  const md=user.appMetadata||user.app_metadata||{};
  const familyId=clean(md.family_id)||null;
  const membershipId=clean(md.membership_id)||(familyId&&user.id?`membership_${user.id}_${familyId}`:null);
  const relationship=upper(md.relationship)||null;
  const roles=normalizedRoles(user);
  const guardian=roles.includes('GUARDIAN')||roles.includes('PARENT');
  const child=roles.includes('CHILD');
  if(guardian===child)return null;
  const role=guardian?'GUARDIAN':'CHILD';
  return familyId?{
    membership_id:membershipId,
    family_id:familyId,
    account_id:accountIdFor(user),
    role,
    relationship:relationship||(role==='CHILD'?'CHILD':null),
    status:upper(md.membership_status)||'ACTIVE'
  }:null;
}
function familyIdFor(user={}){
  const m=membershipFor(user);
  if(m?.family_id)return m.family_id;
  // LEGACY COMPAT ONLY. New accounts must receive explicit FamilyMembership.
  const roles=normalizedRoles(user),id=accountIdFor(user);
  if(id&&(roles.includes('PARENT')||roles.includes('GUARDIAN')))return 'family_'+id;
  return null;
}
function roleFor(user={}){
  const m=membershipFor(user);
  if(m)return m.role==='GUARDIAN'?'PARENT':'CHILD';
  const roles=normalizedRoles(user);
  const parent=roles.includes('PARENT')||roles.includes('GUARDIAN'),child=roles.includes('CHILD');
  if(parent===child)return null;
  return parent?'PARENT':'CHILD';
}
function familySessionFromIdentityUser(user={}){
  const accountId=accountIdFor(user),membership=membershipFor(user);
  const role=membership?(membership.role==='GUARDIAN'?'PARENT':'CHILD'):roleFor(user);
  const familyId=membership?.family_id||familyIdFor(user);
  if(!accountId)return {ok:false,status:401,reason:'IDENTITY_USER_REQUIRED'};
  if(!role)return {ok:false,status:403,reason:'IDENTITY_ROLE_INVALID'};
  if(!familyId)return {ok:false,status:403,reason:'FAMILY_MEMBERSHIP_REQUIRED'};
  return {
    ok:true,
    session:{
      authenticated:true,
      account_id:accountId,
      family_id:familyId,
      membership_id:membership?.membership_id||null,
      member_id:accountId,
      role,
      relationship:membership?.relationship||null,
      membership_status:membership?.status||'LEGACY',
      session_id:'netlify_identity_'+accountId,
      source:'NETLIFY_IDENTITY',
      auth_provider:clean(user.appMetadata?.provider||user.app_metadata?.provider)||'NETLIFY_IDENTITY',
      email:clean(user.email)||null,
      name:clean(user.name)||clean(user.userMetadata?.full_name)||null
    }
  };
}
function canLinkChild(parentUser,targetUser){
  const parent=familySessionFromIdentityUser(parentUser);
  if(!parent.ok||parent.session.role!=='PARENT')return {ok:false,status:403,reason:'PARENT_ROLE_REQUIRED'};
  const targetRoles=normalizedRoles(targetUser);
  if(targetRoles.includes('PARENT')||targetRoles.includes('GUARDIAN'))return {ok:false,status:409,reason:'TARGET_IS_PARENT'};
  const targetMembership=membershipFor(targetUser);
  if(targetMembership&&targetMembership.family_id!==parent.session.family_id)return {ok:false,status:409,reason:'TARGET_ALREADY_IN_OTHER_FAMILY'};
  return {ok:true,family_id:parent.session.family_id};
}
module.exports={normalizedRoles,accountIdFor,membershipFor,familyIdFor,roleFor,familySessionFromIdentityUser,canLinkChild};
