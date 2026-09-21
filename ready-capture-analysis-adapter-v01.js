(() => {
  'use strict';

  const VERSION='0.2.0';
  const ENDPOINT='/api/capture/analyze';

  async function analyze(input={}){
    const session=input.session||{};
    const manifest=Array.isArray(input.manifest)?input.manifest:[];
    const getBlob=input.getBlob;
    if(!session.capture_session_id)return {ok:false,reason:'CAPTURE_SESSION_REQUIRED'};
    if(!manifest.length)return {ok:false,reason:'EMPTY_MANIFEST'};
    if(typeof getBlob!=='function')return {ok:false,reason:'BLOB_RESOLVER_REQUIRED'};

    const form=new FormData();
    const analysisDomain=String(input.analysis_domain||session.analysis_domain||'READY_ASSIGNMENT_FACT').trim()||'READY_ASSIGNMENT_FACT';
    form.set('capture_session_id',session.capture_session_id);
    form.set('analysis_domain',analysisDomain);
    form.set('manifest',JSON.stringify(manifest));

    let attached=0;
    for(const item of manifest){
      if(item.kind==='ANSWER_REFERENCE')continue;
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

    return {
      ok:true,
      provider:body.provider||'UNKNOWN',
      model:body.model||null,
      family_id:body.family_id||null,
      analysis_domain:body.analysis_domain||result.analysis_domain||analysisDomain,
      analysis_version:result.analysis_version||'CAPTURE_OCR_V1',
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