(function(root){
  'use strict';
  // Planner child art comes from the locked Character Master projection only.
  // It must never use a raw source photo, placeholder explorer or a Crew image.
  const VERSION='READY_PLANNER_CHILD_VISUAL_CONSUMER_V01';
  function create(options={}){
    const query=options.query||((s)=>root.document?.querySelector(s));
    const getState=options.getState||(()=>({}));
    const contract=options.contract||root.CharacterVisualIdProjection;
    const imageFactory=options.imageFactory||(()=>new root.Image());
    const image=query('#plannerChildVisual');
    const shell=query('#plannerChildVisualSlot');
    let token=0;
    const clean=s=>String(s??'').trim();
    function source(){
      const p=getState()?.profile||{};
      if(!contract?.fromMaster||!contract?.assertConsumable)return {ok:false,reason:'CHARACTER_PROJECTION_CONTRACT_MISSING'};
      const projection=contract.fromMaster({
        master:p.characterMasterRemote,
        localMaster:p.characterMaster,
        visual_id:p.visualId,
        member_scope:getState()?.memberScope||null,
        characterMasterSheet:p.characterMasterSheet
      });
      const allowed=contract.assertConsumable(projection,{requireDerivatives:true});
      if(!allowed?.ok)return {ok:false,reason:allowed?.reason||'CHILD_VISUAL_NOT_APPROVED'};
      const ref=clean(projection.assets?.full_character);
      if(!ref||!(/^(https?:\/\/|\/|\.\/|data:image\/(?:png|webp|jpeg);base64,)/i.test(ref)))
        return {ok:false,reason:'CHILD_FULL_CHARACTER_ASSET_REFERENCE_INVALID'};
      if(projection.source_provenance?.raw_source_exposed!==false)
        return {ok:false,reason:'RAW_CHILD_SOURCE_PRIVACY_INVALID'};
      return {ok:true,visual_id:projection.visual_id,asset:ref,member_scope:projection.member_scope};
    }
    function clear(reason){
      if(shell){shell.hidden=true;shell.dataset.childVisualState=reason;}
      if(image){
        image.hidden=true;
        image.removeAttribute?.('src');
        image.removeAttribute?.('data-visual-id');
      }
      return {ok:false,reason};
    }
    async function render(){
      const mine=++token;
      if(!image||!shell)return {ok:false,reason:'CHILD_SCENE_SLOT_MISSING'};
      const v=source();
      if(!v.ok)return clear(v.reason);
      shell.hidden=true;image.hidden=true;
      const loaded=await new Promise(resolve=>{
        const probe=imageFactory();
        probe.onload=()=>resolve(true);
        probe.onerror=()=>resolve(false);
        probe.src=v.asset;
      });
      if(mine!==token)return {ok:false,reason:'STALE_CHILD_VISUAL_RENDER'};
      const fresh=source();
      if(!loaded||!fresh.ok||fresh.visual_id!==v.visual_id||fresh.asset!==v.asset)
        return clear(loaded?'CHILD_VISUAL_PROJECTION_CHANGED':'CHILD_VISUAL_ASSET_LOAD_FAILED');
      image.src=v.asset;
      image.dataset.visualId=v.visual_id;
      image.hidden=false;
      shell.hidden=false;
      shell.dataset.childVisualState='LOCKED_MASTER_FULL_CHARACTER_BOUND';
      return {ok:true,visual_id:v.visual_id};
    }
    return Object.freeze({version:VERSION,source,render});
  }
  root.ReadyPlannerChildVisualConsumer=Object.freeze({version:VERSION,create});
})(typeof globalThis!=='undefined'?globalThis:this);
