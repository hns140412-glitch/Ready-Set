(function(root,factory){
  'use strict';
  const api=factory(
    root?.TakyExplorerCrewComposableManifest,
    root?.CrewManifestRegistry,
    root?.CrewAssetEngine,
    root?.CrewUIRenderer,
    root?.TakyExplorerCrewComposablePromotionGate
  );
  if(typeof module!=='undefined'&&module.exports){
    module.exports=factory(
      require('./composable-asset-manifest-pr10-v1.js'),
      require('./manifest-registry-pr10-v1.js'),
      require('./asset-engine-pr10-v1.js'),
      require('./ui-renderer-pr10-v1.js'),
      require('./composable-promotion-gate-v1.js')
    );
  }else if(root)root.TakyExplorerCrewAssetRenderAdapter=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(manifest,manifestRegistry,assetEngine,uiRenderer,promotionGate){
  'use strict';
  const VERSION='EXPLORER_CREW_ASSET_RENDER_ADAPTER_V1';
  const registry=manifestRegistry?.create?.(manifest)||null;

  function manifestRow(id){
    return manifest?.members?.[id]||manifest?.pending_members?.[id]||null;
  }

  function approvedStaticProfile(id){
    const row=manifest?.members?.[id];
    const assets=row?.groups?.PROFILE?.assets||[];
    return assets.find(a=>
      a?.key==='static_cutout' &&
      a?.approved===true &&
      a?.visual_id===id &&
      typeof a?.path==='string' && a.path &&
      typeof a?.sha256==='string' && a.sha256
    )||null;
  }

  function missingRequirements(row){
    if(!row)return ['MANIFEST_CHARACTER_ENTRY_MISSING'];
    const out=[];
    if(row.source_sha_verified!==true&&row.individual_source_verified!==true)out.push('INDIVIDUAL_SOURCE_NOT_VERIFIED');
    if(row.runtime_fallback_eligible!==true)out.push('RUNTIME_FALLBACK_NOT_ELIGIBLE');
    for(const [group,rec] of Object.entries(row.groups||{})){
      if(!/^APPROVED_/.test(String(rec?.state||'')))out.push(group+':'+String(rec?.state||'OPEN'));
    }
    return out;
  }

  async function resolve(_context={},action={},sceneCommand={}){
    const id=action.character_id;
    const row=manifestRow(id);
    const promotion=promotionGate?.evaluate?.(id)||null;
    const rec=registry?.member?.(id)||null;
    const composition=rec?assetEngine?.resolve?.(action,registry):null;

    if(rec&&composition){
      return Object.freeze({
        character_id:id,
        visual_id:id,
        source_sha:rec.source_sha,
        asset_status:composition.fallback===true?'READY_WITH_FALLBACK':'READY',
        body_asset:composition.body?.src||null,
        face_asset:composition.face?.src||null,
        render_anchor:sceneCommand.preferred_anchor||action.runtime_policy?.scene_slot||null,
        fallback_used:composition.fallback===true,
        generated:false,
        composition,
        semantic_action:action,
        manifest_version:manifest?.manifest_version||null,
        runtime_schema_version:manifest?.runtime_schema_version||null,
        composable_promotion:promotion,
        missing_requirements:Object.freeze([])
      });
    }

    const staticProfile=approvedStaticProfile(id);
    if(staticProfile&&row?.source_sha_verified===true&&row?.source_sha256){
      return Object.freeze({
        character_id:id,
        visual_id:id,
        source_sha:row.source_sha256,
        asset_status:'READY_WITH_FALLBACK',
        body_asset:staticProfile.path,
        face_asset:null,
        render_anchor:sceneCommand.preferred_anchor||action.runtime_policy?.scene_slot||null,
        fallback_used:true,
        generated:false,
        static_asset:staticProfile.path,
        static_asset_sha:staticProfile.sha256,
        static_approval_ref:staticProfile.approval_ref||row.approval_ref||null,
        composition:null,
        semantic_action:action,
        manifest_version:manifest?.manifest_version||null,
        runtime_schema_version:manifest?.runtime_schema_version||null,
        composable_promotion:promotion,
        missing_requirements:Object.freeze(missingRequirements(row))
      });
    }

    return Object.freeze({
      character_id:id||null,
      visual_id:id||null,
      source_sha:row?.source_sha_verified===true?row.source_sha256||'':'',
      asset_status:row?'BLOCKED_BY_SHA':'MISSING_ASSET',
      body_asset:null,
      face_asset:null,
      render_anchor:sceneCommand.preferred_anchor||action.runtime_policy?.scene_slot||null,
      fallback_used:false,
      generated:false,
      composition:null,
      semantic_action:action,
      manifest_version:manifest?.manifest_version||null,
      runtime_schema_version:manifest?.runtime_schema_version||null,
      composable_promotion:promotion,
      missing_requirements:Object.freeze(missingRequirements(row))
    });
  }

  async function render(_context={},payload={}){
    const visual=payload.visual||{};
    if(/^BLOCKED_|^MISSING_/.test(String(visual.asset_status||''))){
      return Object.freeze({
        rendered:false,
        blocked:true,
        reason:visual.asset_status||'ASSET_BLOCKED',
        missing_requirements:visual.missing_requirements||[]
      });
    }

    if(visual.composition&&visual.semantic_action){
      const plan=uiRenderer?.renderPlan?.(visual.semantic_action,visual.composition)||null;
      return Object.freeze({
        rendered:false,
        blocked:false,
        plan_ready:!!plan,
        render_plan:plan,
        reason:plan?'COMPOSABLE_RENDER_PLAN_READY_UI_CONSUMER_PENDING':'COMPOSABLE_RENDER_PLAN_INVALID',
        static_fallback:false
      });
    }

    if(visual.static_asset){
      return Object.freeze({
        rendered:false,
        blocked:false,
        plan_ready:true,
        render_plan:Object.freeze({
          kind:'STATIC_APPROVED_COMPAT',
          character_id:visual.character_id,
          asset:visual.static_asset,
          asset_sha:visual.static_asset_sha,
          anchor:visual.render_anchor||null,
          semantic_preserved:true,
          relation_mutation:false,
          affinity_mutation:false
        }),
        reason:'STATIC_PRESENTER_COMPATIBILITY_REQUIRED',
        static_fallback:true
      });
    }

    return Object.freeze({rendered:false,blocked:true,reason:'NO_RENDERABLE_ASSET'});
  }

  return Object.freeze({
    VERSION,
    manifestVersion:manifest?.manifest_version||null,
    runtimeSchemaVersion:manifest?.runtime_schema_version||null,
    registryReady:!!registry,
    resolve,
    render,
    approvedStaticProfile
  });
});
