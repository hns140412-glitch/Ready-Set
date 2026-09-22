(function(root){
  'use strict';

  const VERSION='CHARACTER_EXPLORATION_SIGNATURE_ITEM_V01';

  const ITEMS=Object.freeze({
    MAGNIFIER:Object.freeze({
      id:'MAGNIFIER',label:'돋보기',short:'발견을 좋아하는 탐험가',
      prompt:'one small explorer magnifier carried at the side or held below the face; never covering the eyes or face',
      face_policy:'NEVER_OBSTRUCT_FACE',
      affinities:['CURIOUS','IMAGINATIVE','FOCUSED']
    }),
    EXPLORER_HAT:Object.freeze({
      id:'EXPLORER_HAT',label:'탐험 모자',short:'어디든 떠날 준비가 된 탐험가',
      prompt:'one simple premium explorer hat with a modest brim; keep the face and recognizable hairstyle cues visible',
      face_policy:'KEEP_FACE_AND_HAIR_CUES_VISIBLE',
      affinities:['LIVELY','BOLD','WARM']
    }),
    ROUND_GLASSES:Object.freeze({
      id:'ROUND_GLASSES',label:'얇은 안경',short:'꼼꼼히 관찰하는 탐험가',
      prompt:'one pair of thin clear-lens round glasses; subtle frame, eyes fully visible, no tinted or oversized lenses',
      face_policy:'EYES_FULLY_VISIBLE',
      affinities:['FOCUSED','WARM','IMAGINATIVE']
    }),
    COMPASS:Object.freeze({
      id:'COMPASS',label:'나침반',short:'방향을 찾아가는 탐험가',
      prompt:'one small explorer compass worn or held away from the face; understated and practical',
      face_policy:'NEVER_OBSTRUCT_FACE',
      affinities:['BOLD','CURIOUS','LIVELY']
    }),
    MINI_FIELD_BAG:Object.freeze({
      id:'MINI_FIELD_BAG',label:'미니 필드백',short:'준비물을 챙기는 탐험가',
      prompt:'one small crossbody field bag with a clean silhouette; compact, not oversized, no logos',
      face_policy:'BODY_ONLY',
      affinities:['LIVELY','WARM','BOLD']
    }),
    FIELD_NOTEBOOK:Object.freeze({
      id:'FIELD_NOTEBOOK',label:'탐험 노트',short:'발견을 기록하는 탐험가',
      prompt:'one small field notebook held naturally below chest level or tucked into the field bag; no visible text',
      face_policy:'NEVER_OBSTRUCT_FACE',
      affinities:['FOCUSED','CURIOUS','IMAGINATIVE']
    })
  });

  function item(id){
    const x=ITEMS[String(id||'').toUpperCase()];
    if(!x)throw new Error('CHARACTER_SIGNATURE_ITEM_UNKNOWN');
    return Object.freeze({...x,affinities:[...x.affinities]});
  }

  function suggest(directionIds=[]){
    const dirs=[...new Set((directionIds||[]).map(x=>String(x||'').toUpperCase()).filter(Boolean))];
    return Object.values(ITEMS)
      .map(x=>({
        item:x,
        score:x.affinities.reduce((sum,d)=>sum+(dirs.includes(d)?1:0),0)
      }))
      .sort((a,b)=>b.score-a.score||a.item.id.localeCompare(b.item.id))
      .slice(0,3)
      .map(x=>item(x.item.id));
  }

  function createState(directionIds=[]){
    return {
      contract_version:VERSION,
      rule:'EXACTLY_ONE_SIGNATURE_ITEM',
      max_visible_signature_items:1,
      identity_priority:'IDENTITY_OVER_ITEM',
      status:'ITEM_SELECTION',
      offered:suggest(directionIds).map(x=>x.id),
      selected:null
    };
  }

  function select(state,itemId){
    if(state?.status!=='ITEM_SELECTION')throw new Error('CHARACTER_SIGNATURE_ITEM_SELECTION_CLOSED');
    const id=String(itemId||'').toUpperCase();
    if(!state.offered?.includes(id))throw new Error('CHARACTER_SIGNATURE_ITEM_NOT_OFFERED');
    return {
      ...state,
      status:'ITEM_SELECTED',
      selected:item(id)
    };
  }

  function generationContract(selected){
    const x=item(selected?.id||selected);
    return Object.freeze({
      contract_version:VERSION,
      selected:Object.freeze({
        id:x.id,
        label:x.label,
        prompt:x.prompt,
        face_policy:x.face_policy
      }),
      candidate_rule:'SAME_ITEM_ACROSS_A_B_C',
      correction_rule:'PRESERVE_SIGNATURE_ITEM',
      max_visible_signature_items:1,
      identity_priority:'IDENTITY_OVER_ITEM'
    });
  }

  const api=Object.freeze({
    version:VERSION,
    owner:'CHARACTER_VISUAL_ID',
    ITEMS,
    item,
    suggest,
    createState,
    select,
    generationContract
  });

  root.CharacterExplorationSignatureItem=api;
})(typeof globalThis!=='undefined'?globalThis:this);
