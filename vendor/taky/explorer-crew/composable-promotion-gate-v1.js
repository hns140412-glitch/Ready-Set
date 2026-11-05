(function(root,factory){
'use strict';
const api=factory(root?.TakyExplorerCrewComposableManifest,root?.CrewAssetEngine);
if(typeof module!=='undefined'&&module.exports)module.exports=factory(require('./composable-asset-manifest-pr10-v1.js'),require('./asset-engine-pr10-v1.js'));
else if(root)root.TakyExplorerCrewComposablePromotionGate=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(manifest,assetEngine){
'use strict';
const VERSION='EXPLORER_CREW_COMPOSABLE_PROMOTION_GATE_V1';
const GROUPS=Object.freeze(['MASTER_FULL','PROFILE','PUPPET_BODY','FACE_STATES','ACTION_PARTS','PEEK_MASK','DEPTH_SHADOW']);
const ACTIONS=assetEngine?.actionRequirements||Object.freeze({});
const MOTION_STATUS='BLOCKED_NO_APPROVED_MOTION_SPEC';
function assets(group){return Array.isArray(group?.assets)?group.assets:[]}
function approvedAsset(group,key,id,{canvasLocked=false}={}){
  return assets(group).find(a=>a?.key===key&&a?.approved===true&&a?.visual_id===id&&typeof a?.path==='string'&&a.path&&typeof a?.sha256==='string'&&/^[a-f0-9]{64}$/i.test(a.sha256)&&typeof a?.approval_ref==='string'&&a.approval_ref&&(!canvasLocked||a.canvas_locked===true))||null;
}
function approvedShared(key){
  const a=manifest?.shared_assets?.[key];
  return !!a&&a.approved===true&&a.shared===true&&a.canvas_locked===true&&typeof a.path==='string'&&a.path&&typeof a.sha256==='string'&&/^[a-f0-9]{64}$/i.test(a.sha256)&&typeof a.approval_ref==='string'&&a.approval_ref;
}
function row(id){return manifest?.members?.[id]||manifest?.pending_members?.[id]||null}
function sourceReady(m){return !!m&&((m.source_sha_verified===true&&typeof m.source_sha256==='string'&&/^[a-f0-9]{64}$/i.test(m.source_sha256))||(m.individual_source_verified===true&&typeof m.individual_source_sha256==='string'&&/^[a-f0-9]{64}$/i.test(m.individual_source_sha256)))}
function groupStatus(m){
  const out={};for(const g of GROUPS){const rec=m?.groups?.[g];out[g]=Object.freeze({state:String(rec?.state||'MISSING'),approved:/^APPROVED_/.test(String(rec?.state||'')),asset_count:assets(rec).length});}
  return Object.freeze(out);
}
function staticReady(id,m){return sourceReady(m)&&!!approvedAsset(m?.groups?.PROFILE,'static_cutout',id)}
function baseComposableReady(id,m){
  return sourceReady(m)&&!!approvedAsset(m?.groups?.PUPPET_BODY,'FIELD_NEUTRAL',id,{canvasLocked:true})&&!!approvedAsset(m?.groups?.FACE_STATES,'neutral',id,{canvasLocked:true})&&!!approvedAsset(m?.groups?.DEPTH_SHADOW,'field_default',id,{canvasLocked:true});
}
function actionStatus(id,m,baseReady){
  const out={};
  for(const [action,spec] of Object.entries(ACTIONS)){
    const missing=[];
    if(!baseReady)missing.push('BASE_COMPOSABLE');
    if(!approvedAsset(m?.groups?.FACE_STATES,spec.face,id,{canvasLocked:true}))missing.push('FACE_STATES:'+spec.face);
    if(spec.part&&!approvedAsset(m?.groups?.ACTION_PARTS,spec.part,id,{canvasLocked:true}))missing.push('ACTION_PARTS:'+spec.part);
    for(const eq of spec.equipment||[]){if(!approvedShared(eq))missing.push('SHARED_EQUIPMENT:'+eq);}
    out[action]=Object.freeze({ready:missing.length===0,missing:Object.freeze(missing)});
  }
  return Object.freeze(out);
}
function evaluate(id){
  const m=row(id);if(!m)return Object.freeze({id,status:'MISSING_MEMBER',production_ready:false});
  const groups=groupStatus(m),static_ready=staticReady(id,m),base_ready=baseComposableReady(id,m),actions=actionStatus(id,m,base_ready);
  const allActionsReady=Object.values(actions).length>0&&Object.values(actions).every(x=>x.ready===true);
  const groupsApproved=GROUPS.every(g=>groups[g].approved===true);
  const production_ready=sourceReady(m)&&groupsApproved&&base_ready&&allActionsReady&&m.production_eligible===true&&m.runtime_fallback_eligible===true;
  const blockers=[];
  if(!sourceReady(m))blockers.push('SOURCE_NOT_VERIFIED');
  if(!static_ready)blockers.push('STATIC_PROFILE_NOT_READY');
  if(!base_ready)blockers.push('BASE_COMPOSABLE_NOT_READY');
  if(!allActionsReady)blockers.push('ACTION_SET_NOT_READY');
  if(!groupsApproved)blockers.push('ALL_GROUPS_NOT_APPROVED');
  if(m.runtime_fallback_eligible!==true)blockers.push('RUNTIME_FALLBACK_NOT_ELIGIBLE');
  if(m.production_eligible!==true)blockers.push('PRODUCTION_NOT_ELIGIBLE');
  blockers.push(MOTION_STATUS);
  return Object.freeze({
    id,source_ready:sourceReady(m),static_ready,base_composable_ready:base_ready,
    action_ready:actions,all_actions_ready:allActionsReady,groups,production_ready:false,
    promotion_status:production_ready?'BLOCKED_MOTION_GATE_PENDING_RELEASE':'BLOCKED',
    motion_status:MOTION_STATUS,release_pass:false,root_registry_activation:false,
    blockers:Object.freeze(blockers),generated_art_allowed:false,name_based_generation_allowed:false
  });
}
function audit(){
  const ids=[...Object.keys(manifest?.members||{}),...Object.keys(manifest?.pending_members||{})];
  const results=Object.freeze(ids.map(evaluate));
  return Object.freeze({
    version:VERSION,total:ids.length,static_ready:results.filter(x=>x.static_ready).length,
    base_composable_ready:results.filter(x=>x.base_composable_ready).length,
    all_actions_ready:results.filter(x=>x.all_actions_ready).length,
    production_ready:0,motion_ready:0,release_pass:0,results
  });
}
return Object.freeze({VERSION,requiredGroups:GROUPS,actions:ACTIONS,evaluate,audit,motionStatus:MOTION_STATUS});
});