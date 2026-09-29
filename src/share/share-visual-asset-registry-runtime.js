(function(root){'use strict';
// The image layer kit was generated in a separate container as an explicitly
// user-approved INTERIM share design (2026-09-28). Binary files are NOT in this
// GitHub tree yet; a ref must not be elevated until those bytes are present.
const dir='./assets/share-card/scenes/';
const scenes=Object.freeze({
  drop:Object.freeze({
    pre:Object.freeze({path:dir+'drop-pre.webp',visual_id:'READY-SHARE-DROP-PRE-20260928-INTERIM',review_status:'ASSET_PACKAGE_READY_REPO_BINDING_OPEN'}),
    result:Object.freeze({path:dir+'drop-result.webp',visual_id:'READY-SHARE-DROP-RESULT-20260928-INTERIM',review_status:'ASSET_PACKAGE_READY_REPO_BINDING_OPEN'})
  }),
  sail:Object.freeze({
    pre:Object.freeze({path:dir+'sail-pre.webp',visual_id:'READY-SHARE-SAIL-PRE-20260928-INTERIM',review_status:'ASSET_PACKAGE_READY_REPO_BINDING_OPEN'}),
    result:Object.freeze({path:dir+'sail-result.webp',visual_id:'READY-SHARE-SAIL-RESULT-20260928-INTERIM',review_status:'ASSET_PACKAGE_READY_REPO_BINDING_OPEN'})
  })
});
function scene(theme,kind){const x=scenes[theme]?.[kind];
  return x&&['APPROVED','INTERIM_ACCEPTED'].includes(x.review_status)&&x.path&&x.visual_id?x.path:null;
}
function layers(theme,kind){
  if(!scene(theme,kind))return null;
  const key=theme+'-'+kind,dir='./assets/share-card/layers/'+key+'/';
  return Object.freeze({sky:dir+'sky.png',world:dir+'world.png',foreground:dir+'foreground.png'});
}
root.ReadyShareVisualAssets=Object.freeze({version:'READY_SHARE_VISUAL_GATE_V03',scenes,scene,layers});
})(typeof globalThis!=='undefined'?globalThis:this);
