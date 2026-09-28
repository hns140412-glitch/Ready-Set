/* Layered interim share bridge: activate only with all four scene binaries and
 * src/views/share-card-v3-runtime.js physically present. No share theme/crew picker.
 */
(function(root){'use strict';
  function mount(){
    const base=root.ReadySetShare;
    if(!base?.projectShare||!root.ReadyLayeredShareCard)
      return Object.freeze({ok:false,reason:'SHARE_LAYERED_DEPENDENCIES_MISSING'});
    const card=root.ReadyLayeredShareCard.create({
      projectShare:kind=>base.projectShare(kind),
      assetRoot:'./assets/share-card/',
      getCrewAsset:id=>'./assets/character-formation/crew/'+id+'-locked-visual-id.webp',
      toast:message=>root.toast?.(message)||console.warn('Ready Share:',message)
    });
    for(const [selector,kind] of [['#preShareBtn','pre'],['#missionShareBtn','pre'],['#shareResultBtn','result']]){
      const el=document.querySelector(selector);
      if(el)el.onclick=()=>card.share(kind);
    }
    root.ReadySetShareV3=Object.freeze({
      version:card.version,
      projectShare:base.projectShare,
      prepare:card.prepare,
      share:card.share,
      render:card.render,
      delivery:'NATIVE_OS_ONLY'
    });
    return Object.freeze({ok:true,version:card.version});
  }
  root.ReadyShareV3Bridge=Object.freeze({mount});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})(typeof globalThis!=='undefined'?globalThis:this);
