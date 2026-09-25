'use strict';

const Registry=require('../../vendor/taky/family-member-registry.js');
const FamilyContext=require('../../vendor/taky/family-context.js');

function clean(v){return String(v??'').trim();}
function rolesOf(user={}){
  const src=Array.isArray(user.roles)?user.roles:Array.isArray(user.appMetadata?.roles)?user.appMetadata.roles:Array.isArray(user.app_metadata?.roles)?user.app_metadata.roles:[];
  return [...new Set(src.map(x=>clean(x).toUpperCase()).filter(Boolean))];
}
function roleOf(user={}){
  const roles=rolesOf(user),parent=roles.includes('PARENT'),child=roles.includes('CHILD');
  if(parent===child)return null;
  return parent?'PARENT':'CHILD';
}
function familyOf(user={}){
  return clean(user.appMetadata?.family_id||user.app_metadata?.family_id)||null;
}
function profileOf(user={}){
  const raw=user.appMetadata?.family_profile||user.app_metadata?.family_profile||{};
  return Registry.normalizeProfile({
    display_name:raw.display_name||user.userMetadata?.full_name||user.name||null,
    avatar_ref:raw.avatar_ref||null,
    profile_version:Number.isInteger(raw.profile_version)?raw.profile_version:1,
    updated_at:raw.updated_at||null
  });
}
function memberFromIdentityUser(user={},familyId=null){
  const role=roleOf(user),memberId=clean(user.id),family_id=familyOf(user)||(role==='PARENT'&&memberId?'family_'+memberId:null);
  const checked=Registry.validateMember({family_id,member_id:memberId,role,profile:profileOf(user)});
  if(!checked.ok)return null;
  if(familyId&&checked.member.family_id!==familyId)return null;
  return checked.member;
}
function registryForSession(session={},users=[]){
  const checked=FamilyContext.validate(session);
  if(!checked.ok)return {ok:false,status:401,reason:checked.issues[0]||'FAMILY_CONTEXT_INVALID'};
  const c=checked.context;
  const familyMembers=(Array.isArray(users)?users:[]).map(u=>memberFromIdentityUser(u,c.family_id)).filter(Boolean);
  const self=familyMembers.find(m=>m.member_id===c.member_id);
  if(!self)return {ok:false,status:403,reason:'MEMBER_NOT_IN_FAMILY'};
  const visible=c.role==='PARENT'?familyMembers:[self];
  return {ok:true,registry:Registry.normalizeRegistry({family_id:c.family_id,members:visible,revision:1})};
}
function canEditProfile(actorSession={},targetMemberId){
  const checked=FamilyContext.validate(actorSession);
  if(!checked.ok)return {ok:false,status:401,reason:'FAMILY_CONTEXT_INVALID'};
  const c=checked.context,target=clean(targetMemberId);
  if(!target)return {ok:false,status:400,reason:'TARGET_MEMBER_REQUIRED'};
  if(c.member_id===target)return {ok:true};
  if(c.role==='PARENT')return {ok:true};
  return {ok:false,status:403,reason:'PROFILE_EDIT_NOT_ALLOWED'};
}
function sanitizeProfilePatch(input={}){
  const display_name=clean(input.display_name);
  const avatar_ref=clean(input.avatar_ref);
  if(display_name.length>40)return {ok:false,reason:'DISPLAY_NAME_TOO_LONG'};
  if(avatar_ref.length>512)return {ok:false,reason:'AVATAR_REF_TOO_LONG'};
  if(/^data:/i.test(avatar_ref))return {ok:false,reason:'INLINE_AVATAR_NOT_ALLOWED'};
  return {ok:true,profile:{display_name:display_name||null,avatar_ref:avatar_ref||null,profile_version:1,updated_at:new Date().toISOString()}};
}
module.exports={rolesOf,roleOf,familyOf,profileOf,memberFromIdentityUser,registryForSession,canEditProfile,sanitizeProfilePatch};
