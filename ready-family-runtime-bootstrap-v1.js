(() => {
'use strict';
if (window.ReadyFamilyRuntimeBootstrapV1) return;
const VERSION='2026.10.09-family-runtime-bootstrap-v3';
const clean=v=>typeof v==='string'?v.trim():'';

function runtimeConfig(){
  const r=window.TAKY_FAMILY_RUNTIME;
  if(!r||typeof r!=='object')return null;
  if(typeof r.getToken!=='function'||typeof r.getFamilyId!=='function'||!r.apiBaseUrl)return null;
  return r;
}

function allowedMemberSet(session){
  return new Set([
    clean(session?.self_member_id),
    ...(Array.isArray(session?.authorized_member_ids)?session.authorized_member_ids.map(clean):[])
  ].filter(Boolean));
}

function resolveMemberBinding(identity,session){
  const allowed=allowedMemberSet(session);
  const explicit=clean(identity?.memberId);
  if(explicit){
    if(!allowed.has(explicit))return {ok:false,state:'MEMBER_NOT_AUTHORIZED'};
    return {ok:true,member_id:explicit,source:'EXPLICIT_STABLE_MEMBER'};
  }
  const legacy=clean(identity?.userId);
  if(legacy&&allowed.has(legacy))
    return {ok:true,member_id:legacy,source:'LEGACY_ALREADY_STABLE'};
  const self=clean(session?.self_member_id);
  if(identity?.setupMode==='SELF'&&self&&allowed.has(self))
    return {ok:true,member_id:self,source:'SELF_MEMBER'};
  if(identity?.setupMode==='GUARDIAN_FOR_CHILD'){
    const children=[...allowed].filter(id=>id!==self);
    if(children.length===1)return {ok:true,member_id:children[0],source:'ONLY_AUTHORIZED_CHILD'};
    if(children.length>1)return {ok:false,state:'MEMBER_SELECTION_REQUIRED',candidates:children};
  }
  return {ok:false,state:'MEMBER_BINDING_REQUIRED'};
}

function localProjection(identity,memberId,version){
  const display=clean(window.ReadyIdentityV1?.displayName?.(identity))||clean(identity?.nickname)||clean(identity?.legalName);
  return {
    member_id:memberId,
    profile_version:version,
    display_name:display,
    legal_name:clean(identity?.legalName),
    nickname:clean(identity?.nickname),
    family_role:clean(identity?.familyRole).toUpperCase()||'OTHER',
    birth_date:clean(identity?.birthDate),
    school_stage:clean(identity?.schoolStage).toUpperCase(),
    share_name_mode:clean(identity?.shareNameMode).toUpperCase()||'NAME_NICKNAME',
    status:'CONFIRMED',
    updated_at:new Date().toISOString()
  };
}

function localProfileReady(identity){
  return !!(clean(identity?.legalName)&&clean(identity?.nickname)&&clean(identity?.familyRole)&&
    clean(identity?.birthDate)&&clean(identity?.schoolStage));
}

function sameShared(identity,profile){
  return clean(identity?.legalName)===clean(profile?.legal_name)&&
    clean(identity?.nickname)===clean(profile?.nickname)&&
    clean(identity?.familyRole).toUpperCase()===clean(profile?.family_role).toUpperCase()&&
    clean(identity?.birthDate)===clean(profile?.birth_date)&&
    clean(identity?.schoolStage).toUpperCase()===clean(profile?.school_stage).toUpperCase()&&
    clean(identity?.shareNameMode).toUpperCase()===clean(profile?.share_name_mode).toUpperCase();
}

function applyCentralProfile(profile){
  if(!profile||!window.ReadyIdentityV1?.patch)return null;
  const current=window.ReadyIdentityV1.get?.()||{};
  const patch={
    memberId:clean(profile.member_id),
    profileVersion:Number(profile.profile_version)||1,
    legalName:clean(profile.legal_name)||current.legalName,
    nickname:clean(profile.nickname)||current.nickname,
    familyRole:clean(profile.family_role)||current.familyRole,
    birthDate:clean(profile.birth_date)||current.birthDate,
    schoolStage:clean(profile.school_stage)||current.schoolStage,
    shareNameMode:clean(profile.share_name_mode)||current.shareNameMode
  };
  const next=window.ReadyIdentityV1.patch(patch);
  try{window.ReadyIdentityV1.syncCore?.(next)}catch{}
  try{window.ReadyIdentityV1.render?.()}catch{}
  try{window.dispatchEvent(new CustomEvent('taky-ready-member-profile',{detail:{member_id:patch.memberId,source:'TAKY_CENTRAL'}}))}catch{}
  return next;
}

async function memberContext(){
  const r=runtimeConfig();
  if(!r)return {ok:false,state:'TAKY_FAMILY_RUNTIME_REQUIRED'};
  const session=typeof r.currentSession==='function'?await r.currentSession():await window.TakyFamilyAuthRuntimeV1?.currentSession?.();
  if(!session)return {ok:false,state:'TAKY_CENTRAL_SESSION_REQUIRED'};
  const identity=window.ReadyIdentityV1?.get?.();
  if(!identity)return {ok:false,state:'READY_IDENTITY_REQUIRED'};
  const binding=resolveMemberBinding(identity,session);
  if(!binding.ok)return {...binding,identity,session};
  return {ok:true,identity,session,member_id:binding.member_id,binding_source:binding.source};
}

async function syncMemberProfile(){
  const adapter=window.ReadyFamilyMemberProfileAdapterV1;
  if(!adapter?.resolve||!adapter?.publish)return {state:'ADAPTER_MISSING'};
  const ctx=await memberContext();
  if(!ctx.ok){
    document.documentElement.dataset.readyMemberProfile=ctx.state;
    return ctx;
  }
  const identity=ctx.identity;
  if(clean(identity.memberId)!==ctx.member_id)window.ReadyIdentityV1.patch({memberId:ctx.member_id});
  const resolved=await adapter.resolve(ctx.member_id);
  if(resolved?.projection){
    applyCentralProfile(resolved.projection);
    document.documentElement.dataset.readyMemberProfile='CENTRAL_BOUND';
    return {state:'CENTRAL_BOUND',member_id:ctx.member_id,source:resolved.source};
  }
  if(!localProfileReady(identity)){
    document.documentElement.dataset.readyMemberProfile='LOCAL_PROFILE_INCOMPLETE';
    return {state:'LOCAL_PROFILE_INCOMPLETE',member_id:ctx.member_id};
  }
  const version=Math.max(1,Number(identity.profileVersion)||1);
  const published=await adapter.publish(localProjection(identity,ctx.member_id,version));
  const projection=published?.projection;
  if(projection)applyCentralProfile(projection);
  document.documentElement.dataset.readyMemberProfile='CENTRAL_PUBLISHED';
  return {state:'CENTRAL_PUBLISHED',member_id:ctx.member_id};
}

async function publishLocalMemberProfile(){
  const adapter=window.ReadyFamilyMemberProfileAdapterV1;
  if(!adapter?.resolve||!adapter?.publish)return {state:'ADAPTER_MISSING'};
  const ctx=await memberContext();
  if(!ctx.ok){
    document.documentElement.dataset.readyMemberProfile=ctx.state;
    return ctx;
  }
  const identity=window.ReadyIdentityV1.get();
  if(!localProfileReady(identity))return {state:'LOCAL_PROFILE_INCOMPLETE',member_id:ctx.member_id};
  const remote=await adapter.resolve(ctx.member_id);
  if(remote?.projection&&sameShared(identity,remote.projection)){
    applyCentralProfile(remote.projection);
    document.documentElement.dataset.readyMemberProfile='CENTRAL_BOUND';
    return {state:'CENTRAL_BOUND',member_id:ctx.member_id,unchanged:true};
  }
  const version=Math.max(Number(identity.profileVersion)||0,Number(remote?.projection?.profile_version)||0)+1;
  try{
    const published=await adapter.publish(localProjection(identity,ctx.member_id,version));
    if(published?.projection)applyCentralProfile(published.projection);
    document.documentElement.dataset.readyMemberProfile='CENTRAL_PUBLISHED';
    return {state:'CENTRAL_PUBLISHED',member_id:ctx.member_id,profile_version:version};
  }catch(error){
    if(error?.status===409){
      const latest=await adapter.resolve(ctx.member_id);
      if(latest?.projection){applyCentralProfile(latest.projection);return {state:'CENTRAL_CONFLICT_REBOUND',member_id:ctx.member_id};}
    }
    throw error;
  }
}

async function syncCharacter(){
  const identity=window.ReadyIdentityV1?.get?.();
  const memberId=clean(identity?.memberId)||clean(identity?.userId);
  if(!memberId)return {state:'NO_MEMBER'};
  const profile=window.ReadyFamilyCharacterProfileAdapterV1;
  const asset=window.ReadyCharacterAssetStorageAdapterV1;
  if(!profile?.resolve||!asset?.resolveRead)return {state:'ADAPTER_MISSING'};
  const resolved=await profile.resolve(memberId);
  const p=resolved?.projection;
  if(!p)return {state:'NO_PROFILE'};
  const read=await asset.resolveRead({member_id:p.member_id,character_id:p.character_id,asset_ref:p.master_asset_ref});
  const runtimeRef=read?.read_url||null;
  if(!runtimeRef)return {state:'POINTER_ONLY',character_id:p.character_id};
  window.ReadyCharacterRuntimeAssetRef=runtimeRef;
  window.ReadyCharacterRuntimeProjection=Object.freeze({...p,master_private_ref:p.master_asset_ref,master_asset_ref:runtimeRef});
  document.documentElement.dataset.readyCharacterRuntime='SIGNED_READ';
  try{window.dispatchEvent(new CustomEvent('taky-ready-character-runtime',{detail:{...window.ReadyCharacterRuntimeProjection}}))}catch{}
  return {state:'BOUND',character_id:p.character_id,source:resolved.source};
}

async function selectMember(memberId){
  const r=runtimeConfig();
  if(!r)throw new Error('TAKY_FAMILY_RUNTIME_REQUIRED');
  const session=typeof r.currentSession==='function'?await r.currentSession():await window.TakyFamilyAuthRuntimeV1?.currentSession?.();
  const id=clean(memberId);
  if(!allowedMemberSet(session).has(id))throw new Error('READY_MEMBER_NOT_AUTHORIZED');
  window.ReadyIdentityV1?.patch?.({memberId:id});
  const profile=await syncMemberProfile();
  // The browser legacy planner cache is not member-scoped. Rebind the
  // active planner keys only after the central session validates this member.
  await window.ReadyFamilyPlannerSyncV1?.sync?.();
  return profile;
}

async function boot(){
  const r=runtimeConfig();
  if(!r){
    document.documentElement.dataset.familyRuntime='UNBOUND';
    return {state:'UNBOUND',reason:'TAKY_FAMILY_RUNTIME_REQUIRED'};
  }
  const args={baseUrl:r.apiBaseUrl,getToken:r.getToken,getFamilyId:r.getFamilyId,fetchImpl:r.fetchImpl||fetch};
  const memberProfile=window.ReadyFamilyMemberProfileAdapterV1;
  const characterProfile=window.ReadyFamilyCharacterProfileAdapterV1;
  const asset=window.ReadyCharacterAssetStorageAdapterV1;
  if(!memberProfile?.registerHttpProvider||!characterProfile?.registerHttpProvider||!asset?.registerHttpProvider){
    document.documentElement.dataset.familyRuntime='ADAPTER_MISSING';
    return {state:'ADAPTER_MISSING'};
  }
  memberProfile.registerHttpProvider(args);
  characterProfile.registerHttpProvider(args);
  asset.registerHttpProvider(args);
  document.documentElement.dataset.familyRuntime='BOUND';
  let member;
  try{member=await syncMemberProfile();}
  catch(error){member={state:'FAILED',error:String(error?.code||error?.message||error)};document.documentElement.dataset.readyMemberProfile='RESOLVE_FAILED';}
  let character;
  try{character=await syncCharacter();}
  catch(error){character={state:'FAILED',error:String(error?.code||error?.message||error)};document.documentElement.dataset.readyCharacterRuntime='RESOLVE_FAILED';}
  return {state:'BOUND',member,character};
}

window.ReadyFamilyRuntimeBootstrapV1={
  version:VERSION,boot,syncMemberProfile,publishLocalMemberProfile,selectMember,syncCharacter,
  resolveMemberBinding,
  status:()=>({
    family:document.documentElement.dataset.familyRuntime||'NOT_BOOTED',
    member:document.documentElement.dataset.readyMemberProfile||'NOT_RESOLVED',
    character:document.documentElement.dataset.readyCharacterRuntime||'NOT_RESOLVED'
  })
};
window.addEventListener('taky-central-auth-ready',()=>void boot());
window.addEventListener('ready-member-profile-local-commit',()=>void publishLocalMemberProfile().catch(()=>{document.documentElement.dataset.readyMemberProfile='PUBLISH_FAILED'}));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void boot(),{once:true});else void boot();
})();
