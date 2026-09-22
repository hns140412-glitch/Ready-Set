(function(root){
  'use strict';

  const VERSION='CHARACTER_VISUAL_ID_PROJECTION_V01';

  function clean(v){return String(v??'').trim();}

  function assetRef(value){
    const v=clean(value);
    return v||null;
  }

  function fromMaster(input={}){
    const master=input.master||input.characterMasterRemote||null;
    const local=input.localMaster||input.characterMaster||null;
    const visualId=clean(master?.visual_id||local?.master?.visual_id||input.visual_id);
    if(!visualId)return null;

    const remoteAssets=master?.assets||{};
    const localAssets=local?.master?.assets||{};
    const full=assetRef(remoteAssets.full_character||localAssets.full_character);
    const portrait=assetRef(remoteAssets.portrait_card||localAssets.portrait_card);
    const avatar=assetRef(remoteAssets.avatar_square||localAssets.avatar_square);
    const locked=!!(master?.locked_at||local?.master?.locked_at);
    const derivativesReady=!!(full&&portrait&&avatar);
    const assurance=master?.consistency_gate||local?.master?.consistency_gate||null;

    return Object.freeze({
      contract_version:VERSION,
      visual_id:visualId,
      member_scope:clean(input.member_scope)||null,
      identity_version:Number(input.identity_version||1),
      status:derivativesReady?'MASTER_ASSETS_READY':locked?'VISUAL_ID_LOCKED':'NOT_READY',
      assets:Object.freeze({
        full_character:full,
        portrait_card:portrait,
        avatar_square:avatar
      }),
      master_sheet:assetRef(input.master_sheet||input.characterMasterSheet?.asset_key||input.characterMasterSheet?.asset_url),
      source_provenance:Object.freeze({
        source_hash:clean(master?.source_hash||local?.master?.source_hash||input.source_hash)||null,
        character_core_version:clean(input.character_core_version)||'CHARACTER_VISUAL_ID_CORE_V01'
      }),
      assurance:assurance?Object.freeze({
        structural_state:clean(assurance.structural_state||assurance.structural?.state)||'NOT_RUN',
        visual_state:clean(assurance.visual_state||assurance.visual?.state)||'NOT_RUN',
        human_state:clean(assurance.human_state||assurance.human_confirmation?.state)||'NOT_RUN',
        final_state:clean(assurance.final_state)||'PENDING'
      }):null,
      capabilities:Object.freeze({
        identity_locked:locked,
        derivatives_ready:derivativesReady,
        master_sheet_ready:!!(input.master_sheet||input.characterMasterSheet)
      })
    });
  }

  function assertConsumable(projection,{requireDerivatives=false}={}){
    if(!projection)return {ok:false,reason:'CHARACTER_VISUAL_ID_PROJECTION_MISSING'};
    if(projection.contract_version!==VERSION)return {ok:false,reason:'CHARACTER_VISUAL_ID_CONTRACT_VERSION_UNSUPPORTED'};
    if(!projection.visual_id)return {ok:false,reason:'CHARACTER_VISUAL_ID_MISSING'};
    if(!projection.capabilities?.identity_locked)return {ok:false,reason:'CHARACTER_VISUAL_ID_NOT_LOCKED'};
    if(!projection.assurance||projection.assurance.final_state!=='PASS'){
      return {ok:false,reason:'CHARACTER_VISUAL_ID_ASSURANCE_NOT_PASS'};
    }
    if(requireDerivatives&&!projection.capabilities?.derivatives_ready){
      return {ok:false,reason:'CHARACTER_VISUAL_ID_DERIVATIVES_NOT_READY'};
    }
    return {ok:true};
  }

  const api=Object.freeze({
    version:VERSION,
    owner:'CHARACTER_VISUAL_ID',
    fromMaster,
    assertConsumable
  });

  root.CharacterVisualIdProjection=api;
})(typeof globalThis!=='undefined'?globalThis:this);
