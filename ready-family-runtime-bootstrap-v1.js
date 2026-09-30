(() => {
'use strict';
if (window.ReadyFamilyRuntimeBootstrapV1) return;
const VERSION='2026.09.30-family-runtime-bootstrap-v2';

function runtimeConfig(){
  const r=window.TAKY_FAMILY_RUNTIME;
  if(!r||typeof r!=='object')return null;
  if(typeof r.getToken!=='function'||typeof r.getFamilyId!=='function'||!r.apiBaseUrl)return null;
  return r;
}
async function syncCharacter(){
  const identity=window.ReadyIdentityV1?.get?.();
  const memberId=identity?.userId||null;
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
async function boot(){
  const r=runtimeConfig();
  if(!r){
    document.documentElement.dataset.familyRuntime='UNBOUND';
    return {state:'UNBOUND',reason:'TAKY_FAMILY_RUNTIME_REQUIRED'};
  }
  const args={baseUrl:r.apiBaseUrl,getToken:r.getToken,getFamilyId:r.getFamilyId,fetchImpl:r.fetchImpl||fetch};
  const profile=window.ReadyFamilyCharacterProfileAdapterV1;
  const asset=window.ReadyCharacterAssetStorageAdapterV1;
  if(!profile?.registerHttpProvider||!asset?.registerHttpProvider){
    document.documentElement.dataset.familyRuntime='ADAPTER_MISSING';
    return {state:'ADAPTER_MISSING'};
  }
  profile.registerHttpProvider(args);
  asset.registerHttpProvider(args);
  document.documentElement.dataset.familyRuntime='BOUND';
  try{return {state:'BOUND',character:await syncCharacter()}}catch(error){
    document.documentElement.dataset.readyCharacterRuntime='RESOLVE_FAILED';
    return {state:'BOUND',character:{state:'FAILED',error:String(error?.code||error?.message||error)}};
  }
}
window.ReadyFamilyRuntimeBootstrapV1={version:VERSION,boot,syncCharacter,status:()=>({family:document.documentElement.dataset.familyRuntime||'NOT_BOOTED',character:document.documentElement.dataset.readyCharacterRuntime||'NOT_RESOLVED'})};
window.addEventListener('taky-central-auth-ready',()=>void boot());
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void boot(),{once:true});else void boot();
})();