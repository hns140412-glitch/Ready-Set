'use strict';
const World=require('../../vendor/taky/world-state.js');
const FamilyContext=require('../../vendor/taky/family-context.js');

function clean(v){return String(v??'').trim();}
function keyFor(familyId,memberId){
  const f=clean(familyId),m=clean(memberId);
  if(!f||!m)throw new Error('WORLD_STATE_SCOPE_REQUIRED');
  return 'families/'+encodeURIComponent(f)+'/members/'+encodeURIComponent(m)+'/world-state';
}
function canRead(actorSession,targetMemberId,familyMembers=[]){
  const checked=FamilyContext.validate(actorSession);
  if(!checked.ok)return {ok:false,status:401,reason:'FAMILY_CONTEXT_INVALID'};
  const c=checked.context,target=clean(targetMemberId);
  if(c.member_id===target)return {ok:true};
  if(c.role!=='PARENT')return {ok:false,status:403,reason:'WORLD_STATE_READ_NOT_ALLOWED'};
  const exists=(familyMembers||[]).some(m=>m.member_id===target&&m.role==='CHILD');
  return exists?{ok:true}:{ok:false,status:404,reason:'TARGET_MEMBER_NOT_IN_FAMILY'};
}
function canWrite(actorSession,targetMemberId){
  const checked=FamilyContext.validate(actorSession);
  if(!checked.ok)return {ok:false,status:401,reason:'FAMILY_CONTEXT_INVALID'};
  const c=checked.context,target=clean(targetMemberId);
  if(c.role!=='CHILD'||c.member_id!==target)return {ok:false,status:403,reason:'WORLD_STATE_WRITE_CHILD_ONLY'};
  return {ok:true};
}
function applyEvent(stateInput,event={}){
  return World.apply(World.normalize(stateInput),event);
}
module.exports={keyFor,canRead,canWrite,applyEvent};
