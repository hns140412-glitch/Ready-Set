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
function applyOperation(stateInput,operation={}){
  let state=World.normalize(stateInput);
  const type=clean(operation.type).toUpperCase();
  if(type==='SET_PRIMARY_COMPANION'){
    const id=clean(operation.character_id);
    if(!id)return {ok:false,reason:'CHARACTER_ID_REQUIRED',state};
    return {ok:true,state:World.normalize({...state,primary_companion_id:id,revision:state.revision+1})};
  }
  if(type==='SET_PRESENCE')return World.setPresence(state,operation);
  if(type==='RECORD_MEANINGFUL_EPISODE')return World.recordMeaningfulEpisode(state,operation);
  if(type==='SET_ENCOUNTER')return World.setEncounter(state,operation);
  if(type==='RAW_PRESENCE')return World.recordRawPresence(state);
  return {ok:false,reason:'WORLD_STATE_OPERATION_UNSUPPORTED',state};
}
module.exports={keyFor,canRead,canWrite,applyOperation};
