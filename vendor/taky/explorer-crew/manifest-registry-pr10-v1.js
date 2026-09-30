(function(root,factory){
'use strict';const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.CrewManifestRegistry=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const REQUIRED_GROUPS=['MASTER_FULL','PROFILE','PUPPET_BODY','FACE_STATES','ACTION_PARTS','PEEK_MASK','DEPTH_SHADOW'];
function validAsset(a,id){
 return !!a&&a.approved===true&&a.visual_id===id&&typeof a.path==='string'&&a.path&&typeof a.sha256==='string'&&a.sha256&&typeof a.approval_ref==='string'&&a.approval_ref;
}
function indexAssets(group,id){
 const out={};
 for(const a of group?.assets||[]){if(validAsset(a,id)&&typeof a.key==='string'&&a.key)out[a.key]={...a,src:a.path};}
 return out;
}
function create(manifest){
 if(!manifest||manifest.schema!=='TAKY_CREW_COMPOSABLE_ASSET_MANIFEST_V1')return null;
 if(!Array.isArray(manifest.asset_groups)||REQUIRED_GROUPS.some(g=>!manifest.asset_groups.includes(g)))return null;
 function member(id){
  const m=manifest.members?.[id];
  if(!m||m.visual_id!==id||m.source_sha_verified!==true||!m.source_sha256||!m.approval_ref)return null;
  if(m.runtime_fallback_eligible!==true)return null;
  const body=indexAssets(m.groups?.PUPPET_BODY,id);
  const faces=indexAssets(m.groups?.FACE_STATES,id);
  const action_parts=indexAssets(m.groups?.ACTION_PARTS,id);
  const masks=indexAssets(m.groups?.PEEK_MASK,id);
  const depth=indexAssets(m.groups?.DEPTH_SHADOW,id);
  if(!body.FIELD_NEUTRAL||!faces.neutral||!depth.field_default)return null;
  return Object.freeze({
   visual_id:id,source_sha:m.source_sha256,source_sha_verified:true,approval_ref:m.approval_ref,
   body:Object.freeze(body),faces:Object.freeze(faces),action_parts:Object.freeze(action_parts),
   masks:Object.freeze(masks),depth:Object.freeze(depth)
  });
 }
 function sharedEquipment(key){
  const a=manifest.shared_assets?.[key];
  if(!a||a.approved!==true||a.shared!==true||typeof a.path!=='string'||!a.path)return null;
  return Object.freeze({...a,src:a.path});
 }
 return Object.freeze({member,sharedEquipment,manifestVersion:manifest.manifest_version,runtimeSchemaVersion:manifest.runtime_schema_version});
}
return Object.freeze({version:'CREW_MANIFEST_REGISTRY_V1',create});
});
