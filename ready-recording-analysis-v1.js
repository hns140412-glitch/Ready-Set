(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.ReadyRecordingAnalysisV1=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function validate(result){
    const e=[];
    if(!result||typeof result!=='object')return ['RESULT_MISSING'];
    if(result.verified!==true)e.push('VERIFIED_REQUIRED');
    if(!String(result.evidence_ref||'').trim())e.push('EVIDENCE_REF_REQUIRED');
    if(!String(result.provider||'').trim())e.push('PROVIDER_REQUIRED');
    if(!Array.isArray(result.strengths))e.push('STRENGTHS_REQUIRED');
    if(result.next_hint!=null&&typeof result.next_hint!=='string')e.push('NEXT_HINT_INVALID');
    if(result.confidence!=null&&(typeof result.confidence!=='number'||result.confidence<0||result.confidence>1))e.push('CONFIDENCE_INVALID');
    return e;
  }
  async function analyze({blob,context={},provider}={}){
    if(!blob)return {ok:false,status:'AUDIO_MISSING'};
    const p=provider||(typeof globalThis!=='undefined'?globalThis.ReadyRecordingAnalysisProvider:null);
    if(!p||typeof p.analyze!=='function')return {ok:false,status:'PROVIDER_UNAVAILABLE'};
    try{
      const raw=await p.analyze({blob,context});
      const errors=validate(raw);
      if(errors.length)return {ok:false,status:'UNVERIFIED_RESULT',detected:errors};
      return {ok:true,status:'VERIFIED',analysis:Object.freeze({
        verified:true,evidence_ref:String(raw.evidence_ref),provider:String(raw.provider),
        strengths:Object.freeze(raw.strengths.filter(Boolean).map(String)),
        next_hint:raw.next_hint?String(raw.next_hint):null,
        confidence:raw.confidence??null,
        transcript:raw.transcript?String(raw.transcript):null,
        reference_text:raw.reference_text?String(raw.reference_text):null
      })};
    }catch(error){
      return {ok:false,status:'PROVIDER_ERROR',error:String(error?.message||error)};
    }
  }
  return Object.freeze({validate,analyze,guessingAllowed:false});
});
