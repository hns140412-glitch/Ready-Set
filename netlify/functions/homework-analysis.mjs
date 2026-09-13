const MODEL=process.env.READY_HOMEWORK_ANALYSIS_MODEL||'gpt-5.6-luna';
const ANALYSIS_ENABLED=process.env.READY_HOMEWORK_ANALYSIS_ENABLED==='true';
const MAX_IMAGES=4;
const MAX_BODY_CHARS=6_000_000;
const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const trace=(requestId,stage,extra={})=>console.log(JSON.stringify({component:'homework-analysis',requestId,stage,...extra}));

const schema={
  type:'object',additionalProperties:false,
  properties:{
    subject:{type:'string'},
    observedRange:{type:['string','null']},
    teacherInstruction:{type:['string','null']},
    answerReferenceNote:{type:['string','null']},
    homeworkType:{type:['string','null']},
    confidence:{type:'string',enum:['HIGH','MEDIUM','LOW']},
    needsRecapture:{type:'boolean'},
    recaptureReason:{type:['string','null']}
  },
  required:['subject','observedRange','teacherInstruction','answerReferenceNote','homeworkType','confidence','needsRecapture','recaptureReason']
};

function validateBody(body){
  if(body?.confirmCost!==true)throw Object.assign(new Error('COST_CONFIRMATION_REQUIRED'),{status:409});
  if(typeof body.subject!=='string'||!body.subject.trim())throw Object.assign(new Error('SUBJECT_REQUIRED'),{status:400});
  if(!Array.isArray(body.images)||!body.images.length)throw Object.assign(new Error('IMAGES_REQUIRED'),{status:400});
  if(body.images.length>MAX_IMAGES)throw Object.assign(new Error('TOO_MANY_IMAGES'),{status:413});
  for(const x of body.images){
    if(!['COVER','RANGE','INSTRUCTION','ANSWER_REFERENCE'].includes(x?.captureKind))throw Object.assign(new Error('INVALID_CAPTURE_KIND'),{status:400});
    if(!/^data:image\/(?:png|jpeg|webp);base64,/.test(String(x?.dataUrl||'')))throw Object.assign(new Error('INVALID_IMAGE_DATA'),{status:400});
  }
}

function buildInput(body){
  const text=`Analyze photographed Korean elementary homework source pages for Ready & Set. Subject/book: ${body.subject}.\n\nExtract only facts visibly supported by the images. Do NOT invent missing page ranges, teacher instructions, answer references, dates, difficulty, estimated minutes, or daily allocation. Page/range text should preserve the visible source notation as closely as practical. Teacher instructions should be concise but faithful. Answer/reference information is parent-only metadata and must never be turned into child-facing answer content. If the important range/instruction is cropped, blurred, ambiguous, or conflicting, set needsRecapture=true and explain exactly what should be photographed again. If unknown, use null. The result is an extraction candidate awaiting parent confirmation, not a confirmed assignment fact.`;
  const content=[{type:'input_text',text}];
  for(const x of body.images){content.push({type:'input_text',text:`Image type: ${x.captureKind}`});content.push({type:'input_image',image_url:x.dataUrl,detail:'high'})}
  return [{role:'user',content}];
}

export default async(req)=>{
  const requestId=req.headers.get('x-ready-request-id')||crypto.randomUUID();
  if(req.method!=='POST')return json(405,{ok:false,requestId,error:'METHOD_NOT_ALLOWED'});
  if(!ANALYSIS_ENABLED)return json(423,{ok:false,requestId,code:'HOMEWORK_ANALYSIS_DISABLED',error:'숙제 사진 분석은 아직 관리자 승인 전이에요.',message:'사진 원본은 기기에 안전하게 보관되고 분석 대기 상태로 유지됩니다.'});
  if(!process.env.OPENAI_API_KEY)return json(503,{ok:false,requestId,error:'ANALYSIS_PROVIDER_NOT_CONFIGURED'});
  let raw;try{raw=await req.text()}catch{return json(400,{ok:false,requestId,error:'INVALID_BODY'})}
  if(raw.length>MAX_BODY_CHARS)return json(413,{ok:false,requestId,error:'REQUEST_TOO_LARGE'});
  let body;try{body=JSON.parse(raw);validateBody(body)}catch(e){return json(e.status||400,{ok:false,requestId,error:e.message||'INVALID_REQUEST'})}
  trace(requestId,'provider-start',{subject:body.subject,imageCount:body.images.length,model:MODEL});
  try{
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({model:MODEL,store:false,input:buildInput(body),text:{format:{type:'json_schema',name:'ready_homework_capture',strict:true,schema}},max_output_tokens:900})});
    const data=await r.json();
    if(!r.ok){trace(requestId,'provider-error',{status:r.status});return json(r.status,{ok:false,requestId,error:'PROVIDER_ERROR',providerStatus:r.status,message:data?.error?.message||'Homework analysis failed'})}
    const outputText=data?.output_text||data?.output?.flatMap(x=>x?.content||[]).find(x=>x?.type==='output_text')?.text;
    if(!outputText)throw new Error('ANALYSIS_OUTPUT_MISSING');
    const result=JSON.parse(outputText);
    trace(requestId,'provider-complete',{subject:body.subject,confidence:result.confidence,needsRecapture:result.needsRecapture});
    return json(200,{ok:true,requestId,provider:'OPENAI',model:MODEL,state:'ANALYZED_PENDING_PARENT_CONFIRMATION',result});
  }catch(e){trace(requestId,'function-error',{message:String(e?.message||e)});return json(500,{ok:false,requestId,error:'ANALYSIS_ADAPTER_FAILURE',message:String(e?.message||e)})}
};

export const config={path:'/api/homework-analysis'};
