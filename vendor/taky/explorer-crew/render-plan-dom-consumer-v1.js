(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.TakyExplorerCrewRenderPlanDomConsumer=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='EXPLORER_CREW_RENDER_PLAN_DOM_CONSUMER_V2';
  const SHA=/^[a-f0-9]{64}$/i;
  const STATIC_PATH=/^characters\/ui_cutouts\/[a-z0-9_-]+\.png$/i;
  const ROLES=new Set(['DEPTH','BODY','FACE','ACTION_PART','EQUIPMENT','MASK']);
  function safeAssetPath(src){
    if(typeof src!=='string'||!src.endsWith('.png')||src.startsWith('/')||src.includes('\\')||src.includes(':'))return false;
    const parts=src.split('/');if(parts.some(x=>!x||x==='.'||x==='..'))return false;
    return ['characters','equipment','shared'].includes(parts[0]);
  }
  function invariant(plan){
    return !!plan&&plan.semantic_preserved===true&&plan.relation_mutation===false&&plan.affinity_mutation===false;
  }
  function projectStatic(plan){
    if(!plan||plan.kind!=='STATIC_APPROVED_COMPAT'||typeof plan.character_id!=='string'||!plan.character_id)return null;
    if(!STATIC_PATH.test(String(plan.asset||''))||!SHA.test(String(plan.asset_sha||''))||!invariant(plan))return null;
    return Object.freeze({mode:'STATIC',character_id:plan.character_id,src:plan.asset,asset_sha:plan.asset_sha,kind:plan.kind});
  }
  function projectComposable(plan){
    if(!plan||plan.schema!=='CREW_COMPOSABLE_RENDER_PLAN_V1'||plan.kind!=='COMPOSABLE_APPROVED'||plan.layout_contract!=='SOURCE_CANVAS_LOCKED_V1'||plan.layout_ready!==true)return null;
    if(typeof plan.character_id!=='string'||!plan.character_id||!invariant(plan)||!Array.isArray(plan.layers)||plan.layers.length<3)return null;
    const layers=[];const counts={DEPTH:0,BODY:0,FACE:0,ACTION_PART:0,EQUIPMENT:0,MASK:0};
    for(const x of plan.layers){
      if(!x||!ROLES.has(x.role)||!safeAssetPath(x.src)||!SHA.test(String(x.sha256||''))||x.canvas_locked!==true||!Number.isInteger(x.z_index))return null;
      if(x.shared!==true&&x.visual_id!==plan.character_id)return null;
      if(x.shared===true&&x.role!=='EQUIPMENT')return null;
      counts[x.role]++;
      layers.push(Object.freeze({role:x.role,src:x.src,sha256:x.sha256,visual_id:x.visual_id||null,shared:x.shared===true,z_index:x.z_index}));
    }
    if(counts.DEPTH!==1||counts.BODY!==1||counts.FACE!==1||counts.MASK>1)return null;
    return Object.freeze({mode:'COMPOSABLE',character_id:plan.character_id,kind:plan.kind,layers:Object.freeze(layers),fallback:plan.fallback===true});
  }
  function project(plan){return projectStatic(plan)||projectComposable(plan)}
  function markStatic(el,p){el.dataset.explorerCrewVisualId=p.character_id;el.dataset.explorerCrewAssetSha=p.asset_sha;el.dataset.explorerCrewRenderPlan=p.kind;}
  function markComposite(el,p){el.dataset.explorerCrewVisualId=p.character_id;el.dataset.explorerCrewRenderPlan=p.kind;el.dataset.explorerCrewLayerCount=String(p.layers.length);}
  function applyImage(el,plan,{alt}={}){
    const p=projectStatic(plan);if(!el||!p)return false;el.hidden=false;el.src=p.src;if(typeof alt==='string')el.alt=alt;markStatic(el,p);return true;
  }
  function applyBackground(el,plan){
    const p=projectStatic(plan);if(!el||!p)return false;el.hidden=false;el.style.backgroundImage='url("'+p.src.replace(/"/g,'')+'")';markStatic(el,p);return true;
  }
  function mountComposable(el,plan){
    const p=projectComposable(plan);if(!el||!p)return false;
    const doc=el.ownerDocument||(typeof document!=='undefined'?document:null);if(!doc)return false;
    const prior=el.querySelector?.('[data-explorer-crew-composable-root]');if(prior)prior.remove();
    const root=doc.createElement('span');root.dataset.explorerCrewComposableRoot='true';root.dataset.visualId=p.character_id;
    root.style.position='relative';root.style.display='block';root.style.width='100%';root.style.height='100%';
    for(const layer of p.layers){
      const img=doc.createElement('img');img.src=layer.src;img.alt='';img.setAttribute('aria-hidden','true');
      img.dataset.layerRole=layer.role;img.dataset.assetSha=layer.sha256;
      img.style.position='absolute';img.style.inset='0';img.style.width='100%';img.style.height='100%';img.style.objectFit='contain';img.style.zIndex=String(layer.z_index);img.style.pointerEvents='none';
      root.appendChild(img);
    }
    el.hidden=false;if(!el.style.position)el.style.position='relative';el.style.overflow='hidden';el.appendChild(root);markComposite(el,p);return true;
  }
  function clearImage(el){if(!el)return false;if(el.dataset?.explorerCrewVisualId){el.removeAttribute('src');el.hidden=true;delete el.dataset.explorerCrewVisualId;delete el.dataset.explorerCrewAssetSha;delete el.dataset.explorerCrewRenderPlan;}return true;}
  function clearBackground(el){if(!el)return false;if(el.dataset?.explorerCrewVisualId){el.style.backgroundImage='none';el.hidden=true;delete el.dataset.explorerCrewVisualId;delete el.dataset.explorerCrewAssetSha;delete el.dataset.explorerCrewRenderPlan;}return true;}
  function clearComposable(el){if(!el)return false;el.querySelector?.('[data-explorer-crew-composable-root]')?.remove();delete el.dataset.explorerCrewLayerCount;delete el.dataset.explorerCrewVisualId;delete el.dataset.explorerCrewRenderPlan;return true;}
  return Object.freeze({VERSION,project,projectStatic,projectComposable,applyImage,applyBackground,mountComposable,clearImage,clearBackground,clearComposable,behaviorOwner:false,assetResolver:false,semanticOwner:false,relationWrite:false,affinityWrite:false,memoryWrite:false});
});