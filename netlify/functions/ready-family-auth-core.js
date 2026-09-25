'use strict';

const FamilyContext=require('../../vendor/taky/family-context.js');

function clean(v){return String(v??'').trim();}
function upper(v){return clean(v).toUpperCase();}
function normalizedRoles(user={}){
  const src=Array.isArray(user.roles)?user.roles:
    Array.isArray(user.appMetadata?.roles)?user.appMetadata.roles:
    Array.isArray(user.app_metadata?.roles)?user.app_metadata.roles:[];
  return [...new Set(src.map(upper).filter(Boolean))];
}
function familyIdFor(user={}){
  const explicit=clean(user.appMetadata?.family_id||user.app_metadata?.family_id);
  if(explicit)return explicit;
  const roles=normalizedRoles(user);
  const id=clean(user.id);
  if(id&&roles.includes('PARENT'))return 'family_'+id;
  return null;
}
function roleFor(user={}){
  const roles=normalizedRoles(user);
  const parent=roles.includes('PARENT'),child=roles.includes('CHILD');
  if(parent===child)return null;
  return parent?'PARENT':'CHILD';
}
function familySessionFromIdentityUser(user={}){
  const id=clean(user.id),role=roleFor(user),familyId=familyIdFor(user);
  if(!id)return {ok:false,status:401,reason:'IDENTITY_USER_REQUIRED'};
  if(!role)return {ok:false,status:403,reason:'IDENTITY_ROLE_INVALID'};
  if(!familyId)return {ok:false,status:403,reason:'FAMILY_MEMBERSHIP_REQUIRED'};
  const checked=FamilyContext.validate({
    authenticated:true,
    family_id:familyId,
    member_id:id,
    role,
    session_id:'netlify_identity_'+id,
    auth_provider:'NETLIFY_IDENTITY',
    source:'NETLIFY_IDENTITY'
  });
  if(!checked.ok)return {ok:false,status:403,reason:checked.issues[0]||'FAMILY_CONTEXT_INVALID'};
  return {
    ok:true,
    session:{
      ...checked.context,
      email:clean(user.email)||null,
      name:clean(user.name)||clean(user.userMetadata?.full_name)||null
    }
  };
}
function canLinkChild(parentUser,targetUser){
  const parent=familySessionFromIdentityUser(parentUser);
  if(!parent.ok||parent.session.role!=='PARENT')return {ok:false,status:403,reason:'PARENT_ROLE_REQUIRED'};
  const targetRoles=normalizedRoles(targetUser);
  if(targetRoles.includes('PARENT'))return {ok:false,status:409,reason:'TARGET_IS_PARENT'};
  const existing=clean(targetUser.appMetadata?.family_id||targetUser.app_metadata?.family_id);
  if(existing&&existing!==parent.session.family_id)return {ok:false,status:409,reason:'TARGET_ALREADY_IN_OTHER_FAMILY'};
  return {ok:true,family_id:parent.session.family_id};
}
module.exports={normalizedRoles,familyIdFor,roleFor,familySessionFromIdentityUser,canLinkChild};
