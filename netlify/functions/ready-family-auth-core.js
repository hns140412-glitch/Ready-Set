'use strict';

function clean(v){return String(v??'').trim();}
function upper(v){return clean(v).toUpperCase();}
function normalizedRoles(user={}){
  const src=Array.isArray(user.roles)&&user.roles.length?user.roles:
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
  // Existing Parent and Child authority remains unchanged. A separately
  // provisioned FAMILY_ADULT is never a Parent planner administrator or Child.
  const recognized=['PARENT','CHILD','FAMILY_ADULT'].filter(role=>roles.includes(role));
  return recognized.length===1?recognized[0]:null;
}
const ADULT_RELATIONS=new Set(['GRANDPARENT','GUARDIAN','AUNT_UNCLE','OTHER_ADULT_FAMILY']);
const CHILD_RELATIONS=new Set(['CHILD','SIBLING']);
function familyRelationshipFor(user={}){
  const role=roleFor(user);
  const metadata=user.appMetadata||user.app_metadata||{};
  const specified=upper(metadata.family_relation);
  if(role==='PARENT')return !specified||specified==='PARENT'?'PARENT':null;
  if(role==='CHILD')return !specified?'CHILD':CHILD_RELATIONS.has(specified)?specified:null;
  if(role==='FAMILY_ADULT')return ADULT_RELATIONS.has(specified)?specified:null;
  return null;
}
// A relationship is NOT a permission. Only authoritative app metadata may
// grant this capability; user-editable userMetadata is never consulted.
const FAMILY_PRAISE_GIFT='FAMILY_PRAISE_GIFT';
function giftCapabilitiesFor(user={}){
  const metadata=user.appMetadata||user.app_metadata||{};
  const values=Array.isArray(metadata.family_permissions)?metadata.family_permissions:[];
  return [...new Set(values.map(upper).filter(x=>x===FAMILY_PRAISE_GIFT))];
}
function authorizeFamilyGiverFromIdentityUser(user={},scope={}){
  const mapped=familySessionFromIdentityUser(user);
  const family=clean(scope.family_id),member=clean(scope.giver_member_id);
  const action=upper(scope.action);
  const target=scope.target_child_id===null?null:clean(scope.target_child_id);
  if(!mapped.ok||mapped.session.family_id!==family||mapped.session.member_id!==member||
      !['SEND_GIFT','VIEW_GIFT_OPTIONS'].includes(action)||
      (action==='SEND_GIFT'&&!target)||(action==='VIEW_GIFT_OPTIONS'&&target!==null))
    return {allowed:false,reason:'FAMILY_GIFT_SCOPE_INVALID'};
  if(!giftCapabilitiesFor(user).includes(FAMILY_PRAISE_GIFT))
    return {allowed:false,reason:'FAMILY_GIFT_PERMISSION_NOT_GRANTED'};
  return {allowed:true,membership_verified:true,permission:FAMILY_PRAISE_GIFT,
    family_id:family,giver_member_id:member,action,target_child_id:target};
}
function familySessionFromIdentityUser(user={}){
  const id=clean(user.id),role=roleFor(user),familyId=familyIdFor(user),relation=familyRelationshipFor(user);
  if(!id)return {ok:false,status:401,reason:'IDENTITY_USER_REQUIRED'};
  if(!role)return {ok:false,status:403,reason:'IDENTITY_ROLE_INVALID'};
  if(!relation)return {ok:false,status:403,reason:'FAMILY_RELATION_INVALID'};
  if(!familyId)return {ok:false,status:403,reason:'FAMILY_MEMBERSHIP_REQUIRED'};
  return {
    ok:true,
    session:{
      authenticated:true,
      family_id:familyId,
      member_id:id,
      role,
      family_relation:relation,
      session_id:'netlify_identity_'+id,
      source:'NETLIFY_IDENTITY',
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
  if(roleFor(targetUser)!=='CHILD'||!familyRelationshipFor(targetUser))
    return {ok:false,status:409,reason:'TARGET_NOT_CHILD_ROLE'};
  const existing=clean(targetUser.appMetadata?.family_id||targetUser.app_metadata?.family_id);
  if(existing&&existing!==parent.session.family_id)return {ok:false,status:409,reason:'TARGET_ALREADY_IN_OTHER_FAMILY'};
  return {ok:true,family_id:parent.session.family_id};
}
module.exports={normalizedRoles,familyIdFor,roleFor,familyRelationshipFor,giftCapabilitiesFor,
  authorizeFamilyGiverFromIdentityUser,familySessionFromIdentityUser,canLinkChild};
