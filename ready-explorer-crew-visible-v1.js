(() => {
'use strict';
if (window.ReadyExplorerCrewVisibleV1) return;

const VERSION='READY_EXPLORER_CREW_VISIBLE_V1';
const inboundCrewEvent=new URLSearchParams(location.search).get('crew_event')||'';
window.ReadyExplorerCrewInboundCrewEvent=inboundCrewEvent;

const authority=window.ReadyExplorerCrewAuthorityConsumer;
const dom=window.TakyExplorerCrewRenderPlanDomConsumer;
const personality=window.TakyExplorerCrewPersonalityRegistry;
const appConsumer=(()=>{try{
  return window.TakyExplorerCrewAppConsumerV2?.create?.({
    app_id:'ready-set',
    storage:localStorage,
    locationHref:location.href,
    replaceUrl:u=>history.replaceState(null,'',u)
  })||null;
}catch(error){
  console.warn('Ready Explorer Crew consumer unavailable',error);
  return null;
}})();

const TURNAROUND_FRONT_APPROVED=Object.freeze({
  'guide-07':Object.freeze({src:'characters/ui_cutouts/guide-07.png',sha:'159b0bba1f39cf95c90f091eecf5296233c510a0c1d63bd1bb51927752008f99'}),
  'guide-08':Object.freeze({src:'characters/ui_cutouts/guide-08.png',sha:'183433f836aa89ba5016c05c51a772f5059bb7709a999702cf778d390efec816'}),
  'guide-09':Object.freeze({src:'characters/ui_cutouts/guide-09.png',sha:'6a1f62673f67b02cd50debb480c9f76d679d35a320a997c6e70e15ea087ea5e2'}),
  'guide-10':Object.freeze({src:'characters/ui_cutouts/guide-10.png',sha:'38b7624f5d4f205acfd1173c4de09469467217ad9750face3d0211ac1b860eb7'}),
  'guide-11':Object.freeze({src:'characters/ui_cutouts/guide-11.png',sha:'6d898a6c990bd0895d75c5d007b95fbdd1189e1912b8e5bacb10bc4e4d083510'}),
  'guide-12':Object.freeze({src:'characters/ui_cutouts/guide-12.png',sha:'5f00543ab9570a83f62bc7159eab772b372d7ecb1f19f150697098c5e830b014'}),
  'guide-13':Object.freeze({src:'characters/ui_cutouts/guide-13.png',sha:'b91916c58a4497fee82122e092fb083e7bcffb8e5fe8992add7e4dc9124f61ef'}),
  'guide-14':Object.freeze({src:'characters/ui_cutouts/guide-14.png',sha:'62c04c2cd83bd737c40f56b987c99434ef152301620daf96d81213416752001f'}),
  'guide-15':Object.freeze({src:'characters/ui_cutouts/guide-15.png',sha:'437bc370493b466edd1aa17ec182f3285dafd58536d414715334f5bd273f4903'}),
  'guide-16':Object.freeze({src:'characters/ui_cutouts/guide-16.png',sha:'766176a65ddce66199b14d91782c8f9c83839a40bbe43db31b5cbe0190e79c97'}),
  'guide-17':Object.freeze({src:'characters/ui_cutouts/guide-17.png',sha:'2493c8450d61863cab28bbccfbbfca38a32c601a496a1eb74156045c4aeb484c'}),
  'guide-18':Object.freeze({src:'characters/ui_cutouts/guide-18.png',sha:'cfee3ce8cd707d95441d578f086852f1246d01a59625925388554d1adaf68ffb'}),
  'guide-19':Object.freeze({src:'characters/ui_cutouts/guide-19.png',sha:'e220e05d0e4adfe53d7e5c0fc0d3e9041a2311b1bb66d75b27354accf1a79a33'}),
  'guide-20':Object.freeze({src:'characters/ui_cutouts/guide-20.png',sha:'2326e79a94a21024a188a4a125494f4a3b186a3bd2fdf685a5f809caad79c2b8'}),
  'guide-21':Object.freeze({src:'characters/ui_cutouts/guide-21.png',sha:'901fd4d30f581e4bb0c2a6918952149bf6a2cfda43ae1ccf67db1e7e03a4dd64'}),
  'guide-22':Object.freeze({src:'characters/ui_cutouts/guide-22.png',sha:'18ad95072887c218899f59b1a13a0678c61d618423da0314c9c8b195a27330d7'}),
  'guide-23':Object.freeze({src:'characters/ui_cutouts/guide-23.png',sha:'e926fadffd67dc5967f6639d12ffb635d7bf9ca4972565bcd000d2b1aa97712d'}),
  'guide-24':Object.freeze({src:'characters/ui_cutouts/guide-24.png',sha:'4cca9b946de0b59d743b67c55ff26049e99f2b113c77c8444f05e81344bd31b2'})
});
function turnaroundFrontPlan(id){
  const a=TURNAROUND_FRONT_APPROVED[id];
  return a?Object.freeze({kind:'STATIC_APPROVED_COMPAT',character_id:id,asset:a.src,asset_sha:a.sha,semantic_preserved:true,relation_mutation:false,affinity_mutation:false,source_kind:'TURNAROUND_FRONT_APPROVED'}):null;
}

const portraitIds=[
  'baseExplorerPortrait',
  'focusGuideMini',
  'settingsGuidePortrait',
  'recordGuidePortrait',
  'duoMainGuide',
  'resultGuidePortrait'
];

function projection(){
  if(!authority)return {status:'UNAVAILABLE',character_id:null};
  authority.consumeCanonicalStore?.(localStorage);
  if(inboundCrewEvent){
    authority.consumeHandoffUrl?.(location.href,{
      storage:localStorage,
      replaceUrl:u=>history.replaceState(null,'',u)
    });
  }
  return authority.snapshot?.(localStorage)||{status:'UNBOUND',character_id:null};
}

function clearPortrait(el){
  if(!el||!dom)return;
  dom.clearBackground?.(el);
  dom.clearComposable?.(el);
  delete el.dataset.crewRenderStatus;
}

async function render(){
  const p=projection();
  authority?.syncHost?.(document.documentElement,p);
  const portraits=portraitIds.map(id=>document.getElementById(id)).filter(Boolean);
  portraits.forEach(el=>authority?.syncHost?.(el,p));

  if(p.status!=='BOUND'||!p.character_id||!appConsumer||!dom){
    document.documentElement.dataset.readyExplorerCrewVisual=p.character_id?'CANONICAL_VISUAL_UNAVAILABLE':'UNBOUND';
    return {ok:false,status:p.status,character_id:p.character_id||null};
  }

  const profile=personality?.get?.(p.character_id);
  const canonicalName=profile?.name_ko||profile?.display_name||p.character_id;
  const name=document.getElementById('baseExplorerName');
  if(name)name.textContent=canonicalName;

  let visible=0;
  for(const el of portraits){
    clearPortrait(el);
    const sync=await appConsumer.sync({
      host:el,
      character_id:p.character_id,
      scene_id:el.id==='focusGuideMini'?'READY_FOCUS':'READY_HOME',
      render:true
    });
    const plan=sync?.render_plan||null;
    let ok=false;
    if(plan?.kind==='STATIC_APPROVED_COMPAT'){
      ok=dom.applyBackground?.(el,plan)===true;
      if(ok)el.dataset.crewRenderStatus='STATIC';
    }else if(plan?.kind==='COMPOSABLE_APPROVED'){
      ok=dom.mountComposable?.(el,plan)===true;
      if(ok)el.dataset.crewRenderStatus='COMPOSABLE';
    }
    if(!ok){
      const fallback=turnaroundFrontPlan(p.character_id);
      ok=dom.applyBackground?.(el,fallback)===true;
      if(ok)el.dataset.crewRenderStatus='TURNAROUND_FRONT_APPROVED';
    }
    if(ok)visible++;
  }
  document.documentElement.dataset.readyExplorerCrewVisual=visible?'RENDERED':'CANONICAL_VISUAL_UNAVAILABLE';
  document.documentElement.dataset.readyExplorerCrewVisibleCount=String(visible);
  return {ok:visible>0,status:p.status,character_id:p.character_id,visible_count:visible};
}

function boot(){
  void render();
  window.addEventListener('load',()=>void render(),{once:true});
  window.addEventListener('pageshow',()=>void render());
  window.addEventListener('storage',event=>{
    if(event.key===authority?.PROJECTION_KEY||event.key===authority?.CANONICAL_STATE_KEY)void render();
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();

window.ReadyExplorerCrewVisibleV1=Object.freeze({
  version:VERSION,
  projection,
  render,
  inboundCrewEvent:()=>inboundCrewEvent
});
})();