(function(root){
  'use strict';

  const VERSION='CHARACTER_VISUAL_ID_MASTER_V01';

  function assertSlot(slot){
    const s=String(slot||'').toUpperCase();
    if(!['A','B','C'].includes(s))throw new Error('CHARACTER_CANDIDATE_SLOT_INVALID');
    return s;
  }

  function create({visual_id,source_hash,candidates}={}){
    if(!visual_id||!source_hash)throw new Error('CHARACTER_MASTER_IDENTITY_REQUIRED');
    if(!Array.isArray(candidates)||candidates.length!==3)throw new Error('CHARACTER_MASTER_THREE_CANDIDATES_REQUIRED');
    const slots=candidates.map(x=>assertSlot(x.slot)).join('|');
    if(slots!=='A|B|C')throw new Error('CHARACTER_MASTER_CANDIDATE_ORDER_INVALID');
    return {
      contract_version:VERSION,
      visual_id:String(visual_id),
      source_hash:String(source_hash),
      state:'CANDIDATES_READY',
      candidates:candidates.map(x=>({
        slot:assertSlot(x.slot),
        direction_id:String(x.direction_id||''),
        source:String(x.source||''),
        asset_key:x.asset_key||null,
        asset_url:x.asset_url||null,
        asset_hash:x.asset_hash||null
      })),
      selected_slot:null,
      selected_asset:null,
      correction:{status:'NONE',revision:0,instruction:null,asset:null},
      master:null,
      trace:[{event:'CANDIDATES_READY'}]
    };
  }

  function select(model,slot){
    if(model.state!=='CANDIDATES_READY'&&model.state!=='SELECTED')throw new Error('CHARACTER_MASTER_NOT_SELECTABLE');
    const s=assertSlot(slot);
    const candidate=model.candidates.find(x=>x.slot===s);
    if(!candidate)throw new Error('CHARACTER_MASTER_CANDIDATE_MISSING');
    if(!candidate.asset_key&&!candidate.asset_url)throw new Error('CHARACTER_MASTER_CANDIDATE_ASSET_MISSING');
    return {
      ...model,
      state:'SELECTED',
      selected_slot:s,
      selected_asset:{...candidate},
      correction:{status:'NONE',revision:model.correction?.revision||0,instruction:null,asset:null},
      trace:[...(model.trace||[]),{event:'CANDIDATE_SELECTED',slot:s}]
    };
  }

  function requestCorrection(model,instruction){
    if(model.state!=='SELECTED'&&model.state!=='CORRECTED')throw new Error('CHARACTER_MASTER_SELECTION_REQUIRED');
    const text=String(instruction||'').trim();
    if(!text)throw new Error('CHARACTER_CORRECTION_INSTRUCTION_REQUIRED');
    return {
      ...model,
      state:'CORRECTION_PENDING',
      correction:{
        status:'PENDING',
        revision:(model.correction?.revision||0)+1,
        instruction:text,
        asset:null
      },
      trace:[...(model.trace||[]),{event:'LIKENESS_CORRECTION_REQUESTED',revision:(model.correction?.revision||0)+1}]
    };
  }

  function applyCorrection(model,{asset_key=null,asset_url=null,asset_hash=null}={}){
    if(model.state!=='CORRECTION_PENDING')throw new Error('CHARACTER_CORRECTION_NOT_PENDING');
    if(!asset_key&&!asset_url)throw new Error('CHARACTER_CORRECTION_ASSET_REQUIRED');
    return {
      ...model,
      state:'CORRECTED',
      correction:{
        ...model.correction,
        status:'APPLIED',
        asset:{asset_key,asset_url,asset_hash}
      },
      trace:[...(model.trace||[]),{event:'LIKENESS_CORRECTION_APPLIED',revision:model.correction.revision}]
    };
  }

  function lockIdentity(model,{locked_at=new Date().toISOString()}={}){
    if(!['SELECTED','CORRECTED'].includes(model.state))throw new Error('CHARACTER_MASTER_NOT_LOCKABLE');
    const identityAsset=model.state==='CORRECTED'?model.correction?.asset:model.selected_asset;
    if(!identityAsset)throw new Error('CHARACTER_MASTER_IDENTITY_ASSET_REQUIRED');
    return {
      ...model,
      state:'VISUAL_ID_LOCKED',
      master:{
        visual_id:model.visual_id,
        source_hash:model.source_hash,
        selected_slot:model.selected_slot,
        identity_asset:identityAsset,
        assets:{
          full_character:identityAsset.asset_key||identityAsset.asset_url||null,
          portrait_card:null,
          avatar_square:null
        },
        derivative_state:'DERIVATIVES_PENDING',
        locked_at
      },
      trace:[...(model.trace||[]),{event:'VISUAL_ID_LOCKED',at:locked_at}]
    };
  }

  function attachDerivedAssets(model,{avatar_square,portrait_card,full_character,updated_at=new Date().toISOString()}={}){
    if(model.state!=='VISUAL_ID_LOCKED'&&model.state!=='MASTER_ASSETS_READY')throw new Error('CHARACTER_VISUAL_ID_LOCK_REQUIRED');
    if(!avatar_square||!portrait_card)throw new Error('CHARACTER_DERIVATIVE_ASSETS_REQUIRED');
    const full=full_character||model.master?.assets?.full_character||null;
    if(!full)throw new Error('CHARACTER_FULL_ASSET_REQUIRED');
    return {
      ...model,
      state:'MASTER_ASSETS_READY',
      master:{
        ...model.master,
        assets:{avatar_square,portrait_card,full_character:full},
        derivative_state:'READY',
        derivatives_updated_at:updated_at
      },
      trace:[...(model.trace||[]),{event:'CHARACTER_DERIVATIVE_ASSETS_READY',at:updated_at}]
    };
  }

  const api=Object.freeze({
    version:VERSION,
    owner:'CHARACTER_VISUAL_ID',
    create,
    select,
    requestCorrection,
    applyCorrection,
    lockIdentity,
    attachDerivedAssets,
    lock:lockIdentity
  });
  root.CharacterVisualIdMaster=api;
  root.ReadyCharacterMaster=api;
})(typeof globalThis!=='undefined'?globalThis:this);
