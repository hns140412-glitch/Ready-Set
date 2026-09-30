(function(root){'use strict';
// User-accepted INTERIM share design. Canonical originals live in TAKY-ASSETS at
// 302b83244cd21dfdc8ccb11e12ec068ce82cb75e; this app tree holds exact SHA-matched
// deployment copies only. INTERIM_ACCEPTED is not final visual/release approval.
const dir='./assets/share-card/scenes/';
const scenes=Object.freeze({
  drop:Object.freeze({
    pre:Object.freeze({path:dir+'drop-pre.webp',visual_id:'READY-SHARE-DROP-PRE-20260928-INTERIM',review_status:'INTERIM_ACCEPTED'}),
    result:Object.freeze({path:dir+'drop-result.webp',visual_id:'READY-SHARE-DROP-RESULT-20260928-INTERIM',review_status:'INTERIM_ACCEPTED'})
  }),
  sail:Object.freeze({
    pre:Object.freeze({path:dir+'sail-pre.webp',visual_id:'READY-SHARE-SAIL-PRE-20260928-INTERIM',review_status:'INTERIM_ACCEPTED'}),
    result:Object.freeze({path:dir+'sail-result.webp',visual_id:'READY-SHARE-SAIL-RESULT-20260928-INTERIM',review_status:'INTERIM_ACCEPTED'})
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
