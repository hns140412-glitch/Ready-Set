(function(root){'use strict';
// VISUAL GATE: A standalone layered/illustrated share scene must be reviewed.
// Golden reference boards are NOT standalone background assets. No Canvas
// geometric fallback, screenshots, generated character or silent auto-approval.
const scenes=Object.freeze({
  drop:Object.freeze({
    pre:Object.freeze({path:null,visual_id:null,review_status:'OPEN_APPROVED_SCENE_MISSING'}),
    result:Object.freeze({path:null,visual_id:null,review_status:'OPEN_APPROVED_SCENE_MISSING'})
  }),
  sail:Object.freeze({
    pre:Object.freeze({path:null,visual_id:null,review_status:'OPEN_APPROVED_SCENE_MISSING'}),
    result:Object.freeze({path:null,visual_id:null,review_status:'OPEN_APPROVED_SCENE_MISSING'})
  })
});
function scene(theme,kind){
  const entry=scenes[theme]?.[kind]||null;
  return entry?.review_status==='APPROVED'&&entry.path&&entry.visual_id?entry.path:null;
}
root.ReadyShareVisualAssets=Object.freeze({version:'READY_SHARE_VISUAL_GATE_V01',scenes,scene});
})(typeof globalThis!=='undefined'?globalThis:this);
