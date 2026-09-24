(function(root){
  'use strict';

  const VERSION='CHARACTER_EXPLORATION_SIGNATURE_ITEM_V01';

  const ITEMS=Object.freeze({
    CAMERA:Object.freeze({
      id:'CAMERA',label:'카메라',short:'세상을 기록하는 탐험가',
      prompt:'one compact premium explorer camera carried naturally at chest or side level; never covering the face',
      face_policy:'NEVER_OBSTRUCT_FACE'
    }),
    COMPASS:Object.freeze({
      id:'COMPASS',label:'나침반',short:'길을 찾아가는 탐험가',
      prompt:'one small explorer compass worn or held away from the face; understated and practical',
      face_policy:'NEVER_OBSTRUCT_FACE'
    }),
    FIELD_NOTEBOOK:Object.freeze({
      id:'FIELD_NOTEBOOK',label:'탐험 노트',short:'생각을 정리하는 탐험가',
      prompt:'one small field notebook held naturally below chest level or tucked into travel gear; no visible text',
      face_policy:'NEVER_OBSTRUCT_FACE'
    }),
    BINOCULARS:Object.freeze({
      id:'BINOCULARS',label:'쌍안경',short:'더 멀리 보는 탐험가',
      prompt:'one compact pair of explorer binoculars carried at chest or side level; never covering the eyes or face',
      face_policy:'NEVER_OBSTRUCT_FACE'
    }),
    WATER_BOTTLE:Object.freeze({
      id:'WATER_BOTTLE',label:'물병',short:'언제나 준비된 탐험가',
      prompt:'one compact explorer water bottle attached to or carried with travel gear; clean silhouette, no logo',
      face_policy:'BODY_ONLY'
    })
  });

  const OFFERED=Object.freeze(['CAMERA','COMPASS','FIELD_NOTEBOOK','BINOCULARS','WATER_BOTTLE']);

  function item(id){
    const x=ITEMS[String(id||'').toUpperCase()];
    if(!x)throw new Error('CHARACTER_SIGNATURE_ITEM_UNKNOWN');
    return Object.freeze({...x});
  }

  function suggest(){
    return OFFERED.map(item);
  }

  function createState(){
    return {
      contract_version:VERSION,
      rule:'EXACTLY_ONE_SIGNATURE_ITEM',
      max_visible_signature_items:1,
      identity_priority:'IDENTITY_OVER_ITEM',
      status:'ITEM_SELECTION',
      offered:[...OFFERED],
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
    OFFERED,
    item,
    suggest,
    createState,
    select,
    generationContract
  });

  root.CharacterExplorationSignatureItem=api;
})(typeof globalThis!=='undefined'?globalThis:this);
