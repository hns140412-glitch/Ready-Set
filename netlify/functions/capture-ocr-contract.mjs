// Pure server-side metadata validation for the existing family capture route.
// This does not select a provider, assert OCR accuracy or confirm assignment FACT.
const IMAGE_MIME=new Set(['image/jpeg','image/png','image/webp','image/heic','image/heif']);
const clean=v=>typeof v==='string'?v.trim():'';
const fail=(reason,details=null)=>({ok:false,reason,...(details?{details}:{})});

export function validateCaptureEnvelope({request_id,manifest,vision_manifest,max_images=24}={}){
  const rid=clean(request_id);
  if(!rid||rid.length>160||!/^[a-zA-Z0-9_-]+$/.test(rid))return fail('VISION_REQUEST_ID_REQUIRED');
  if(!Array.isArray(manifest)||!Array.isArray(vision_manifest)||!manifest.length||
     manifest.length!==vision_manifest.length)return fail('VISION_MANIFEST_MISMATCH');
  const ids=new Set(),analyzable=[];
  for(let i=0;i<manifest.length;i++){
    const source=manifest[i],vision=vision_manifest[i];
    const id=clean(source?.capture_item_id),group=clean(source?.group_key),kind=clean(source?.kind);
    const mime=clean(source?.mime_type).toLowerCase();
    if(!id||!group||!kind||ids.has(id))return fail('INVALID_CAPTURE_SOURCE');
    ids.add(id);
    if(clean(vision?.source_id)!==id||clean(vision?.mime_type).toLowerCase()!==mime){
      return fail('VISION_MANIFEST_MISMATCH');
    }
    const shouldAnalyze=kind!=='ANSWER_REFERENCE'&&IMAGE_MIME.has(mime);
    if(vision?.analyzable!==shouldAnalyze)return fail('VISION_MANIFEST_MISMATCH');
    if(kind!=='ANSWER_REFERENCE'&&!shouldAnalyze)return fail('UNSUPPORTED_CAPTURE_SOURCE');
    if(shouldAnalyze)analyzable.push({capture_item_id:id,group_key:group,kind,mime_type:mime});
  }
  if(!analyzable.length)return fail('NO_ANALYZABLE_IMAGES');
  if(analyzable.length>max_images)return fail('CAPTURE_IMAGE_LIMIT_EXCEEDED');
  return {ok:true,request_id:rid,analyzable,analyzable_ids:analyzable.map(x=>x.capture_item_id)};
}

export function validateUploadedImageKeys(keys,analyzable_ids){
  const allowed=new Set((analyzable_ids||[]).map(x=>'image__'+x));
  for(const key of keys||[]){
    if(key.startsWith('image__')&&!allowed.has(key))return fail('UNEXPECTED_IMAGE_FILE');
  }
  return {ok:true};
}

export function validateReadyDrafts(drafts,analyzable){
  if(!Array.isArray(drafts))return fail('ANALYSIS_OUTPUT_INVALID_DRAFTS');
  const byId=new Map((analyzable||[]).map(x=>[x.capture_item_id,x.group_key]));
  const normalized=[];
  for(const draft of drafts){
    const group=clean(draft?.group_key);
    const evidence=draft?.evidence_item_ids;
    if(!group||!Array.isArray(evidence)||!evidence.length)return fail('ANALYSIS_EVIDENCE_INVALID');
    const unique=new Set(evidence);
    if(unique.size!==evidence.length||
       evidence.some(id=>!byId.has(id)||byId.get(id)!==group)){
      return fail('ANALYSIS_EVIDENCE_INVALID');
    }
    if(typeof draft.confidence!=='number'||!Number.isFinite(draft.confidence)){
      return fail('ANALYSIS_CONFIDENCE_INVALID');
    }
    normalized.push({
      ...draft,
      confidence:Math.max(0,Math.min(1,draft.confidence)),
      evidence_item_ids:[...evidence],
      warnings:Array.isArray(draft.warnings)?draft.warnings.map(String):[]
    });
  }
  return {ok:true,drafts:normalized};
}
