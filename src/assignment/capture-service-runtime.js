(function(root){
  'use strict';

  function parsePrints(value=''){
    const out={};
    for(const token of String(value).split(',')){
      const [day,...rest]=token.split(':');
      if(day?.trim()&&rest.join(':').trim())out[day.trim().toUpperCase()]=rest.join(':').trim();
    }
    return out;
  }

  function stableFactSignature(value){
    const sortObject=v=>{
      if(Array.isArray(v))return v.map(sortObject);
      if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,sortObject(v[k])]));
      return v;
    };
    return JSON.stringify(sortObject(value));
  }

  async function capturedRefs(captureApi,groupKey){
    const refs=await captureApi?.artifactsForGroup?.(groupKey)||[];
    return {
      source:refs.filter(x=>x.kind!=='ANSWER_REFERENCE'),
      answers:refs.filter(x=>x.kind==='ANSWER_REFERENCE')
    };
  }

  async function recordCaptureReview(captureApi,groupKey,reviewedValue,event='PARENT_REVIEWED'){
    if(!captureApi?.updateReviewDraft)return null;
    const session=await captureApi.currentReviewSession?.();
    const drafts=Array.isArray(session?.analysis_result?.drafts)?session.analysis_result.drafts:[];
    const draft=[...drafts].reverse().find(x=>x.group_key===groupKey);
    if(!draft?.review_draft_id)return null;
    await captureApi.updateReviewDraft(draft.review_draft_id,{
      actor:'PARENT',
      event,
      review_state:event==='FACT_CONFIRMED'?'FACT_CONFIRMED':'PARENT_REVIEWED',
      reviewed_value:reviewedValue,
      fields:Object.keys(reviewedValue||{})
    });
    return captureApi.reviewProvenanceForGroup?.(groupKey)||null;
  }

  function create(options={}){
    const captureApi=options.captureApi||root.ReadyCaptureV01||null;
    return Object.freeze({
      parsePrints,
      stableFactSignature,
      capturedRefs:(groupKey)=>capturedRefs(captureApi,groupKey),
      recordCaptureReview:(groupKey,reviewedValue,event)=>recordCaptureReview(captureApi,groupKey,reviewedValue,event)
    });
  }

  root.ReadyRebuildCaptureService=Object.freeze({
    version:'READY_REBUILD_CAPTURE_SERVICE_V01',
    create,
    parsePrints,
    stableFactSignature,
    capturedRefs,
    recordCaptureReview
  });
})(typeof globalThis!=='undefined'?globalThis:this);
