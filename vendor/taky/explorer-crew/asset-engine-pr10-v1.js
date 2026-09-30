(function(root,factory){
'use strict';const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.CrewAssetEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAP=Object.freeze({
 READ_BOOK:{face:'neutral',part:'book_hand',equipment:['BOOK']},
 READ_MAP:{face:'neutral',part:'map_hands',equipment:['MAP']},
 WRITE_NOTE:{face:'think',part:'write_hand',equipment:['NOTEBOOK','PEN']},
 CHECK_COMPASS:{face:'observe',part:'compass_hand',equipment:['COMPASS']},
 ORGANIZE_BAG:{face:'neutral',part:'bag_hands',equipment:['BAG']},
 USE_MAGNIFIER:{face:'observe',part:'magnifier_hand',equipment:['MAGNIFIER']},
 USE_RADIO:{face:'listen',part:'radio_hand',equipment:['RADIO']},
 REST:{face:'neutral',part:null,equipment:[]}
});
function approved(item){return !!item&&item.approved===true&&typeof item.src==='string'&&item.src.length>0}
function same(item,id){return approved(item)&&item.visual_id===id}
function fallback(id,rec){
  const body=rec?.body?.FIELD_NEUTRAL,face=rec?.faces?.neutral,depth=rec?.depth?.field_default;
  if(!same(body,id)||!same(face,id)||!same(depth,id))return null;
  return Object.freeze({visual_id:id,body,face,action_parts:[],equipment:[],mask:null,depth,fallback:true,generated:false});
}
function resolve(command,registry){
  if(!command||typeof command.character_id!=='string'||!registry||typeof registry.member!=='function')return null;
  const id=command.character_id,rec=registry.member(id);
  if(!rec||rec.visual_id!==id||typeof rec.source_sha!=='string'||!rec.source_sha||rec.source_sha_verified!==true||!rec.approval_ref)return null;
  const baseFallback=fallback(id,rec); if(!baseFallback)return null;
  if(command.behavior_state!=='AMBIENT')return baseFallback;
  const spec=MAP[command.ambient_action]; if(!spec)return baseFallback;
  const body=rec.body?.FIELD_NEUTRAL,face=rec.faces?.[spec.face],part=spec.part?rec.action_parts?.[spec.part]:null,depth=rec.depth?.field_default;
  const equipment=spec.equipment.map(k=>registry.sharedEquipment?.(k)).filter(Boolean);
  const ok=same(body,id)&&same(face,id)&&same(depth,id)&&(!spec.part||same(part,id))&&
    equipment.length===spec.equipment.length&&equipment.every(x=>approved(x)&&x.shared===true);
  if(!ok)return baseFallback;
  return Object.freeze({visual_id:id,body,face,action_parts:part?[part]:[],equipment,mask:null,depth,fallback:false,generated:false});
}
return Object.freeze({version:'CREW_APPROVED_ASSET_ENGINE_V1',resolve,actionRequirements:MAP,automaticArtGeneration:false,nameBasedGeneration:false,fallback:'SAME_CHARACTER_FIELD_NEUTRAL'});
});