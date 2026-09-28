(function(root){'use strict';
// USER-ACCEPTED INTERIM SHARE ART — 2026-09-28
// Purpose: apply the approved-enough high-detail concept now, while keeping it replaceable.
// These are environmental scene assets only. Dynamic copy, runtime numbers, profile/Visual ID avatar
// and Guide reaction remain rendered by the share card runtime.
const scenes=Object.freeze({
  drop:Object.freeze({
    pre:Object.freeze({
      path:'./assets/share/interim-drop-pre.jpg',
      visual_id:'READY_SHARE_INTERIM_DROP_PRE_20260928',
      review_status:'APPROVED_INTERIM_USER_ACCEPTED'
    }),
    result:Object.freeze({
      path:'./assets/share/interim-drop-result.jpg',
      visual_id:'READY_SHARE_INTERIM_DROP_RESULT_20260928',
      review_status:'APPROVED_INTERIM_USER_ACCEPTED'
    })
  }),
  sail:Object.freeze({
    pre:Object.freeze({
      path:'./assets/share/interim-sail-pre.jpg',
      visual_id:'READY_SHARE_INTERIM_SAIL_PRE_20260928',
      review_status:'APPROVED_INTERIM_USER_ACCEPTED'
    }),
    result:Object.freeze({
      path:'./assets/share/interim-sail-result.jpg',
      visual_id:'READY_SHARE_INTERIM_SAIL_RESULT_20260928',
      review_status:'APPROVED_INTERIM_USER_ACCEPTED'
    })
  })
});
function scene(theme,kind){
  const entry=scenes[theme]?.[kind]||null;
  return entry?.review_status&&entry.review_status.startsWith('APPROVED')&&entry.path&&entry.visual_id?entry.path:null;
}
root.ReadyShareVisualAssets=Object.freeze({version:'READY_SHARE_VISUAL_GATE_V02_INTERIM',scenes,scene});
})(typeof globalThis!=='undefined'?globalThis:this);
