const VERSION='CHARACTER_EXPLORATION_SIGNATURE_ITEM_V01';

const CATALOG=Object.freeze({
  CAMERA:Object.freeze({id:'CAMERA',label:'카메라',face_policy:'NEVER_OBSTRUCT_FACE',prompt:'one compact premium explorer camera carried naturally at chest or side level; never covering the face'}),
  COMPASS:Object.freeze({id:'COMPASS',label:'나침반',face_policy:'NEVER_OBSTRUCT_FACE',prompt:'one small explorer compass worn or held away from the face; understated and practical'}),
  FIELD_NOTEBOOK:Object.freeze({id:'FIELD_NOTEBOOK',label:'탐험 노트',face_policy:'NEVER_OBSTRUCT_FACE',prompt:'one small field notebook held naturally below chest level or tucked into travel gear; no visible text'}),
  BINOCULARS:Object.freeze({id:'BINOCULARS',label:'쌍안경',face_policy:'NEVER_OBSTRUCT_FACE',prompt:'one compact pair of explorer binoculars carried at chest or side level; never covering the eyes or face'}),
  WATER_BOTTLE:Object.freeze({id:'WATER_BOTTLE',label:'물병',face_policy:'BODY_ONLY',prompt:'one compact explorer water bottle attached to or carried with travel gear; clean silhouette, no logo'})
});

function normalizeSignatureItem(contract){
  if(!contract||contract.contract_version!==VERSION)return {ok:false,reason:'SIGNATURE_ITEM_CONTRACT_INVALID'};
  if(contract.candidate_rule!=='SAME_ITEM_ACROSS_A_B_C')return {ok:false,reason:'SIGNATURE_ITEM_CANDIDATE_RULE_INVALID'};
  if(Number(contract.max_visible_signature_items)!==1)return {ok:false,reason:'SIGNATURE_ITEM_COUNT_INVALID'};
  if(contract.identity_priority!=='IDENTITY_OVER_ITEM')return {ok:false,reason:'SIGNATURE_ITEM_IDENTITY_PRIORITY_INVALID'};
  const id=String(contract.selected?.id||'').toUpperCase();
  const item=CATALOG[id];
  if(!item)return {ok:false,reason:'SIGNATURE_ITEM_UNKNOWN'};
  return {
    ok:true,
    item:Object.freeze({
      contract_version:VERSION,
      id:item.id,
      label:item.label,
      face_policy:item.face_policy,
      prompt:item.prompt,
      candidate_rule:'SAME_ITEM_ACROSS_A_B_C',
      correction_rule:'PRESERVE_SIGNATURE_ITEM',
      max_visible_signature_items:1,
      identity_priority:'IDENTITY_OVER_ITEM'
    })
  };
}

function promptForSignatureItem(item){
  const x=CATALOG[String(item?.id||'').toUpperCase()];
  if(!x)throw new Error('SIGNATURE_ITEM_UNKNOWN');
  return x.prompt;
}

export { VERSION, CATALOG, normalizeSignatureItem, promptForSignatureItem };
