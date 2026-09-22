const VERSION='CHARACTER_EXPLORATION_SIGNATURE_ITEM_V01';

const CATALOG=Object.freeze({
  MAGNIFIER:Object.freeze({id:'MAGNIFIER',label:'돋보기',face_policy:'NEVER_OBSTRUCT_FACE',prompt:'one small explorer magnifier carried at the side or held below the face; never covering the eyes or face'}),
  EXPLORER_HAT:Object.freeze({id:'EXPLORER_HAT',label:'탐험 모자',face_policy:'KEEP_FACE_AND_HAIR_CUES_VISIBLE',prompt:'one simple premium explorer hat with a modest brim; keep the face and recognizable hairstyle cues visible'}),
  ROUND_GLASSES:Object.freeze({id:'ROUND_GLASSES',label:'얇은 안경',face_policy:'EYES_FULLY_VISIBLE',prompt:'one pair of thin clear-lens round glasses; subtle frame, eyes fully visible, no tinted or oversized lenses'}),
  COMPASS:Object.freeze({id:'COMPASS',label:'나침반',face_policy:'NEVER_OBSTRUCT_FACE',prompt:'one small explorer compass worn or held away from the face; understated and practical'}),
  MINI_FIELD_BAG:Object.freeze({id:'MINI_FIELD_BAG',label:'미니 필드백',face_policy:'BODY_ONLY',prompt:'one small crossbody field bag with a clean silhouette; compact, not oversized, no logos'}),
  FIELD_NOTEBOOK:Object.freeze({id:'FIELD_NOTEBOOK',label:'탐험 노트',face_policy:'NEVER_OBSTRUCT_FACE',prompt:'one small field notebook held naturally below chest level or tucked into the field bag; no visible text'})
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
