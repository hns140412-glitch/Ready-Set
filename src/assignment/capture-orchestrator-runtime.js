(function(root){
  'use strict';

  function create(options={}){
    const captureApi=options.captureApi||root.ReadyCaptureV01||null;
    if(!captureApi)throw new Error('CAPTURE_ORCHESTRATOR_DEPENDENCY_MISSING');

    async function loadReview(){
      const session=await captureApi.currentReviewSession?.();
      if(!session)return {session:null,groups:[],items:[]};
      const [groups,items]=await Promise.all([
        captureApi.groupSummary(session.capture_session_id),
        captureApi.listItems(session.capture_session_id)
      ]);
      const enriched=[];
      for(const item of items||[]){
        const preview_url=await captureApi.previewUrl(item.capture_item_id);
        enriched.push({...item,preview_url});
      }
      return {session,groups:groups||[],items:enriched};
    }

    async function addFiles(files,{group_key,kind}={}){
      if(!files?.length)return [];
      await captureApi.setCaptureTarget(group_key,kind);
      return captureApi.addFiles(files,{group_key,kind});
    }

    function setTarget(groupKey,kind){return captureApi.setCaptureTarget?.(groupKey,kind)}
    function resolveDisposition(captureItemId,payload){return captureApi.resolveCaptureItemDisposition?.(captureItemId,payload)}
    function removeItem(captureItemId){return captureApi.removeItem?.(captureItemId)}
    function requestAnalysis(){return captureApi.requestAnalysis?.()}

    return Object.freeze({loadReview,addFiles,setTarget,resolveDisposition,removeItem,requestAnalysis});
  }

  root.ReadyRebuildCaptureOrchestrator=Object.freeze({
    version:'READY_REBUILD_CAPTURE_ORCHESTRATOR_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
