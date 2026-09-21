(() => {
  'use strict';

  const VERSION='0.2.0';
  const VisionIngest=globalThis.TakyVisionIngest;
  const ENDPOINT='/api/capture/analyze';

  async function analyze(input={}){
    const session=input.session||{};
    const manifest=Array.isArray(input.manifest)?input.manifest:[];
    const getBlob=input.getBlob;
    if(!session.capture_session_id)return {ok:false,reason:'CAPTURE_SESSION_REQUIRED'};
    if(!manifest.length)return {ok:false,reason:'EMPTY_MANIFEST'};
    if(typeof getBlob!=='function')return {ok:false,reason:'BLOB_RESOLVER_REQUIRED'};
    if(!VisionIngest?.buildRequest||!VisionIngest?.normalizeResult||!VisionIngest?.validateEvidence){
      return {ok:false,reason:'SHARED_VISION_INGEST_UNAVAILABLE'};
    }

    const sharedManifest=manifest.map(item=>({
      source_id:item.capture_item_id,
      mime_type:item.mime_type,
      file_name:item.file_name,
      size:item.size,
      exclude_from_analysis:item.kind==='ANSWER_REFERENCE',
      metadata:{
        group_key:item.group_key||null,
        kind:item.kind||null,
        visibility:item.visibility||null
      }
    }));
    const ingest=VisionIngest.buildRequest({
      source:'ready-set:capture-analysis',
      manifest:sharedManifest,
      metadata:{capture_session_id:session.capture_session_id}
    });
    if(!ingest.ok)return {ok:false,reason:ingest.reason||'VISION_INGEST_REQUEST_INVALID',errors:ingest.errors||null};

    const analyzable=new Set(ingest.request.analyzable_source_ids);
    const form=new FormData();
    form.set('capture_session_id',session.capture_session_id);
    form.set('manifest',JSON.stringify(manifest));
    form.set('vision_ingest_request_id',ingest.request.request_id);
    form.set('vision_ingest_manifest',JSON.stringify(ingest.request.manifest));

    let attached=0;
    for(const item of manifest){
      if(!analyzable.has(item.capture_item_id))continue;
      const blob=await getBlob(item.capture_item_id);
      if(!blob)continue;
      const name=item.file_name||(`${item.capture_item_id}.jpg`);
      form.append('image__'+item.capture_item_id,blob,name);
      attached++;
    }
    if(!attached)return {ok:false,reason:'NO_ANALYZABLE_IMAGES'};

    let res;
    try{
      res=await fetch(ENDPOINT,{
        method:'POST',
        body:form,
        credentials:'same-origin',
        headers:{'Accept':'application/json'}
      });
    }catch(error){
      return {ok:false,reason:'ANALYSIS_NETWORK_ERROR',message:String(error?.message||error)};
    }

    const body=await res.json().catch(()=>({}));
    if(!res.ok){
      return {
        ok:false,
        reason:body?.reason||('ANALYSIS_HTTP_'+res.status),
        status:res.status,
        provider_status:body?.provider_status||null,
        provider_type:body?.provider_type||null
      };
    }

    const result=body?.result;
    if(!result||!Array.isArray(result.drafts)){
      return {ok:false,reason:'ANALYSIS_RESULT_INVALID'};
    }

    const normalized=VisionIngest.normalizeResult({
      request_id:ingest.request.request_id,
      provider:body.provider||'UNKNOWN',
      model:body.model||null,
      items:result.drafts.map((draft,index)=>({
        result_id:draft.review_draft_id||(`draft_${index}`),
        evidence_source_ids:Array.isArray(draft.evidence_item_ids)?draft.evidence_item_ids:[],
        provider_payload:draft
      }))
    });
    if(!normalized.ok)return {ok:false,reason:normalized.reason||'VISION_INGEST_RESULT_INVALID'};
    const evidence=VisionIngest.validateEvidence(
      normalized.result,
      ingest.request.manifest.map(x=>x.source_id)
    );
    if(!evidence.ok){
      return {ok:false,reason:'ANALYSIS_EVIDENCE_INVALID',unknown_evidence:evidence.unknown};
    }

    return {
      ok:true,
      provider:body.provider||'UNKNOWN',
      model:body.model||null,
      family_id:body.family_id||null,
      analysis_version:result.analysis_version||'CAPTURE_OCR_V1',
      vision_ingest_request_id:ingest.request.request_id,
      vision_ingest_version:normalized.result.ingest_version,
      evidence_valid:true,
      drafts:result.drafts,
      received_at:new Date().toISOString()
    };
  }

  window.ReadyCaptureAnalysisAdapter=Object.freeze({
    version:VERSION,
    endpoint:ENDPOINT,
    analyze
  });
})();