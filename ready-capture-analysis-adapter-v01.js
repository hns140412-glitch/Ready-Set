(() => {
  'use strict';

  const VERSION='0.2.0';
  const VisionIngest=globalThis.TakyVisionIngest;
  const ENDPOINT='/api/capture/analyze';

  // iOS may supply a HEIC/HEIF original even when the capture input uses image/*.
  // Do not relabel those bytes as JPEG: decode in the browser, encode a *new*
  // JPEG analysis copy, and leave the IndexedDB original unchanged.
  async function convertHeicForAnalysis(original){
    if(typeof document==='undefined'||typeof Image==='undefined'||!URL?.createObjectURL){
      return {ok:false,reason:'HEIC_CONVERSION_UNAVAILABLE'};
    }
    const url=URL.createObjectURL(original);
    try{
      let image=null,bitmap=null;
      try{
        const element=new Image();
        await new Promise((resolve,reject)=>{
          element.onload=()=>resolve();
          element.onerror=()=>reject(new Error('IMAGE_ELEMENT_DECODE_UNSUPPORTED'));
          element.src=url;
        });
        image=element;
      }catch{
        // A second browser decoder is attempted before failing closed.
        if(typeof createImageBitmap==='function'){
          bitmap=await createImageBitmap(original).catch(()=>null);
          image=bitmap;
        }
      }
      if(!image)return {ok:false,reason:'HEIC_CONVERSION_UNAVAILABLE'};
      try{
        const w=Number(image.naturalWidth||image.width),h=Number(image.naturalHeight||image.height);
        if(!w||!h)return {ok:false,reason:'HEIC_CONVERSION_UNAVAILABLE'};
        const scale=Math.min(1,4096/Math.max(w,h));
        const canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round(w*scale));
        canvas.height=Math.max(1,Math.round(h*scale));
        const ctx=canvas.getContext('2d');
        if(!ctx)return {ok:false,reason:'HEIC_CONVERSION_UNAVAILABLE'};
        ctx.drawImage(image,0,0,canvas.width,canvas.height);
        const jpeg=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.94));
        if(!(jpeg instanceof Blob)||jpeg.type!=='image/jpeg'||!jpeg.size){
          return {ok:false,reason:'HEIC_CONVERSION_UNAVAILABLE'};
        }
        return {ok:true,blob:jpeg,width:canvas.width,height:canvas.height};
      }finally{
        bitmap?.close?.();
      }
    }catch{
      return {ok:false,reason:'HEIC_CONVERSION_UNAVAILABLE'};
    }finally{
      URL.revokeObjectURL(url);
    }
  }

  async function prepareSources(manifest,getBlob){
    const blobs=new Map(),effective=[],source_transforms=[];
    for(const item of manifest){
      if(item.kind==='ANSWER_REFERENCE'){effective.push(item);continue}
      const original=await getBlob(item.capture_item_id);
      if(!(original instanceof Blob)||!original.size){
        return {ok:false,reason:'CAPTURE_ORIGINAL_MISSING',capture_item_id:item.capture_item_id};
      }
      const mime=String(item.mime_type||original.type||'').toLowerCase();
      if(mime==='image/heic'||mime==='image/heif'){
        const converted=await convertHeicForAnalysis(original);
        if(!converted.ok){
          return {ok:false,reason:converted.reason,capture_item_id:item.capture_item_id,original_preserved:true};
        }
        blobs.set(item.capture_item_id,converted.blob);
        const name=String(item.file_name||item.capture_item_id).replace(/\.(heic|heif)$/i,'')+'.jpg';
        effective.push({...item,mime_type:'image/jpeg',file_name:name,size:converted.blob.size});
        source_transforms.push({
          capture_item_id:item.capture_item_id,original_mime_type:mime,
          analysis_mime_type:'image/jpeg',kind:'BROWSER_HEIC_TO_JPEG',
          original_bytes:original.size,analysis_bytes:converted.blob.size,
          analysis_width:converted.width,analysis_height:converted.height
        });
      }else if(['image/jpeg','image/png','image/webp'].includes(mime)){
        blobs.set(item.capture_item_id,original);
        effective.push({...item,mime_type:mime,size:original.size});
      }else{
        return {ok:false,reason:'OCR_IMAGE_FORMAT_UNSUPPORTED',capture_item_id:item.capture_item_id,original_preserved:true};
      }
    }
    return {ok:true,blobs,manifest:effective,source_transforms};
  }

  async function analyze(input={}){
    const session=input.session||{};
    const manifest=Array.isArray(input.manifest)?input.manifest:[];
    const getBlob=input.getBlob;
    if(!session.capture_session_id)return {ok:false,reason:'CAPTURE_SESSION_REQUIRED'};
    if(!manifest.length)return {ok:false,reason:'EMPTY_MANIFEST'};
    if(typeof getBlob!=='function')return {ok:false,reason:'BLOB_RESOLVER_REQUIRED'};
    if(!VisionIngest?.buildRequest||!VisionIngest?.normalizeResult||!VisionIngest?.validateForRequest){
      return {ok:false,reason:'SHARED_VISION_INGEST_UNAVAILABLE'};
    }

    const prepared=await prepareSources(manifest,getBlob);
    if(!prepared.ok)return prepared;
    const effectiveManifest=prepared.manifest;
    const sharedManifest=effectiveManifest.map(item=>({
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
    form.set('manifest',JSON.stringify(effectiveManifest));
    form.set('vision_ingest_request_id',ingest.request.request_id);
    form.set('vision_ingest_manifest',JSON.stringify(ingest.request.manifest));

    let attached=0;
    for(const item of effectiveManifest){
      if(!analyzable.has(item.capture_item_id))continue;
      const blob=prepared.blobs.get(item.capture_item_id);
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

    // The response must independently echo the request identity. Reusing our
    // outgoing request ID as the normalized response ID would not validate a roundtrip.
    const echoedRequestId=typeof body?.vision_ingest_request_id==='string'
      ?body.vision_ingest_request_id.trim():'';
    if(!echoedRequestId)return {ok:false,reason:'ANALYSIS_REQUEST_BINDING_MISSING'};
    if(echoedRequestId!==ingest.request.request_id){
      return {ok:false,reason:'ANALYSIS_REQUEST_BINDING_MISMATCH'};
    }
    const result=body?.result;
    if(!result||!Array.isArray(result.drafts)){
      return {ok:false,reason:'ANALYSIS_RESULT_INVALID'};
    }

    const normalized=VisionIngest.normalizeResult({
      request_id:echoedRequestId,
      provider:body.provider||'UNKNOWN',
      model:body.model||null,
      items:result.drafts.map((draft,index)=>({
        result_id:draft.review_draft_id||(`draft_${index}`),
        evidence_source_ids:Array.isArray(draft.evidence_item_ids)?draft.evidence_item_ids:[],
        provider_payload:draft
      }))
    });
    if(!normalized.ok)return {ok:false,reason:normalized.reason||'VISION_INGEST_RESULT_INVALID'};
    const evidence=VisionIngest.validateForRequest(normalized.result,ingest.request);
    if(!evidence.ok){
      return {
        ok:false,reason:'ANALYSIS_EVIDENCE_INVALID',
        unknown_evidence:evidence.unknown||[],
        missing_evidence:evidence.missing||[],
        duplicate_result_ids:evidence.duplicate_result_ids||[],
        invalid_confidence:evidence.invalid_confidence||[]
      };
    }

    return {
      ok:true,
      provider:body.provider||'UNKNOWN',
      model:body.model||null,
      family_id:body.family_id||null,
      analysis_version:result.analysis_version||'CAPTURE_OCR_V1',
      vision_ingest_request_id:echoedRequestId,
      vision_ingest_version:normalized.result.ingest_version,
      evidence_valid:true,
      source_transforms:prepared.source_transforms,
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