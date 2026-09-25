'use strict';

const Crew=require('../../vendor/taky/crew-registry.js');
const FamilyContext=require('../../vendor/taky/family-context.js');

function clean(v){return String(v??'').trim();}
function crewFromUser(user={}){
  const meta=user.appMetadata?.exploration_crew||user.app_metadata?.exploration_crew||{};
  return Crew.normalizeRegistry({...meta,member_id:clean(user.id)});
}
function canRead(actorSession,targetMemberId,familyMembers=[]){
  const checked=FamilyContext.validate(actorSession);
  if(!checked.ok)return {ok:false,status:401,reason:'FAMILY_CONTEXT_INVALID'};
  const c=checked.context,target=clean(targetMemberId);
  if(c.member_id===target)return {ok:true};
  if(c.role!=='PARENT')return {ok:false,status:403,reason:'CREW_READ_NOT_ALLOWED'};
  const exists=(familyMembers||[]).some(m=>m.member_id===target&&m.role==='CHILD');
  return exists?{ok:true}:{ok:false,status:404,reason:'TARGET_MEMBER_NOT_IN_FAMILY'};
}
function canWrite(actorSession,targetMemberId){
  const checked=FamilyContext.validate(actorSession);
  if(!checked.ok)return {ok:false,status:401,reason:'FAMILY_CONTEXT_INVALID'};
  const c=checked.context,target=clean(targetMemberId);
  if(c.role!=='CHILD'||c.member_id!==target)return {ok:false,status:403,reason:'CREW_WRITE_CHILD_ONLY'};
  return {ok:true};
}
function applyPatch(registry,input={}){
  let next=Crew.normalizeRegistry(registry);
  if(input.primary_companion_id){
    const selected=Crew.selectPrimary(next,input.primary_companion_id);
    if(!selected.ok)return selected;
    next=selected.registry;
  }
  if(input.rename&&typeof input.rename==='object'){
    const renamed=Crew.rename(next,input.rename.character_id,input.rename.display_name);
    if(!renamed.ok)return renamed;
    next=renamed.registry;
  }
  return {ok:true,registry:next};
}
module.exports={crewFromUser,canRead,canWrite,applyPatch};
