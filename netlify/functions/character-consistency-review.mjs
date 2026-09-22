import { getDeployStore, getStore } from '@netlify/blobs';
import { getUser } from '@netlify/identity';
import { mapCharacterSession } from './character-family-session-adapter.mjs';
import { ensure as ensureConsistencyGate, applyVisual } from './character-consistency-core.mjs';


function storeFor(){
  const context=globalThis.Netlify?.context?.deploy?.context;
  return context==='production'
    ? getStore('character-visual-id-assets-v1',{consistency:'strong'})
    : getDeployStore('character-visual-id-assets-v1');
}
function clean(v,label){
  const s=String(v||'').trim();
  if(!s||!/^[A-Za-z0-9._-]+$/.test(s))throw new Error(label+'_INVALID');
  return s;
}
function reviewEnabled(){
  return String(process.env.CHARACTER_VISUAL_ID_PAID_REVIEW||'').toLowerCase()==='true';
}
function imageDataUrl(bytes,mime='image/webp'){
  return 'data:'+mime+';base64,'+Buffer.from(bytes).toString('base64');
}
function textOutput(raw){
  if(typeof raw?.output_text==='string')return raw.output_text;
  for(const item of raw?.output||[]){
    for(const content of item?.content||[]){
      if(typeof content?.text==='string')return content.text;
    }
  }
  return '';
}

const REVIEW_SCHEMA={
  type:'object',
  additionalProperties:false,
  properties:{
    source_identity_match:{type:'boolean'},
    candidate_identity_consistent:{type:'boolean'},
    direction_distinctness:{type:'boolean'},
    face_unobstructed:{type:'boolean'},
    sensitive_trait_change_detected:{type:'boolean'},
    summary:{type:'string'},
    candidates:{
      type:'array',
      minItems:3,
      maxItems:3,
      items:{
        type:'object',
        additionalProperties:false,
        properties:{
          slot:{type:'string',enum:['A','B','C']},
          same_child_identity:{type:'boolean'},
          direction_readable:{type:'boolean'},
          face_unobstructed:{type:'boolean'},
          identity_drift_risk:{type:'string',enum:['LOW','MEDIUM','HIGH']},
          note:{type:'string'}
        },
        required:['slot','same_child_identity','direction_readable','face_unobstructed','identity_drift_risk','note']
      }
    }
  },
  required:[
    'source_identity_match',
    'candidate_identity_consistent',
    'direction_distinctness',
    'face_unobstructed',
    'sensitive_trait_change_detected',
    'summary',
    'candidates'
  ]
};

export default async function handler(req){
  if(req.method!=='POST')return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  const user=await getUser();
  if(!user)return Response.json({ok:false,reason:'UNAUTHENTICATED'},{status:401});
  const mapped=mapCharacterSession(user);
  if(!mapped.ok)return Response.json({ok:false,reason:mapped.reason},{status:mapped.status});
  if(mapped.session.role!=='CHILD')return Response.json({ok:false,reason:'CHILD_ROLE_REQUIRED'},{status:403});
  if(!reviewEnabled()){
    return Response.json({
      ok:false,
      reason:'CHARACTER_VISUAL_REVIEW_PROVIDER_LOCKED',
      gate:'CHARACTER_VISUAL_ID_PAID_REVIEW',
      next:'EXTERNAL_RESOURCE_GATE_REQUIRED'
    },{status:423,headers:{'Cache-Control':'no-store'}});
  }

  const apiKey=String(process.env.OPENAI_API_KEY||'').trim();
  const model=String(process.env.CHARACTER_VISUAL_ID_REVIEW_MODEL||'').trim();
  if(!apiKey)return Response.json({ok:false,reason:'VISUAL_REVIEW_PROVIDER_NOT_CONFIGURED'},{status:503});
  if(!model)return Response.json({ok:false,reason:'VISUAL_REVIEW_MODEL_NOT_CONFIGURED'},{status:503});

  let body={};try{body=await req.json()}catch{return Response.json({ok:false,reason:'INVALID_JSON'},{status:400})}
  let visualId;
  try{visualId=clean(body.visual_id,'VISUAL_ID')}catch(err){return Response.json({ok:false,reason:err.message},{status:400})}

  const memberId=clean(mapped.session.member_id,'MEMBER_ID');
  const prefix=memberId+'/'+visualId;
  const store=storeFor();
  const jobKey=prefix+'/job/state.json';
  const job=await store.get(jobKey,{type:'json'});
  if(!job)return Response.json({ok:false,reason:'CHARACTER_JOB_NOT_FOUND'},{status:404});
  if(job.status!=='READY_FOR_SELECTION'&&job.status!=='SELECTED'&&job.status!=='CORRECTED'){
    return Response.json({ok:false,reason:'CHARACTER_CANDIDATES_NOT_READY',status:job.status},{status:409});
  }

  const sourceMeta=await store.get(prefix+'/source/meta.json',{type:'json'});
  if(!sourceMeta?.source_key)return Response.json({ok:false,reason:'SOURCE_NOT_UPLOADED'},{status:409});
  const source=await store.get(sourceMeta.source_key,{type:'arrayBuffer'});
  const candidateBuffers={};
  for(const slot of ['A','B','C']){
    const asset=job.candidate_assets?.[slot];
    if(!asset?.asset_key)return Response.json({ok:false,reason:'CANDIDATE_ASSET_MISSING',slot},{status:409});
    candidateBuffers[slot]={
      bytes:await store.get(asset.asset_key,{type:'arrayBuffer'}),
      mime:asset.mime||'image/webp'
    };
    if(!candidateBuffers[slot].bytes)return Response.json({ok:false,reason:'CANDIDATE_ASSET_MISSING',slot},{status:409});
  }

  job.consistency_gate=ensureConsistencyGate(job);
  job.consistency_gate.visual={...job.consistency_gate.visual,state:'PENDING',evaluator:'OPENAI_RESPONSES'};
  job.updated_at=new Date().toISOString();
  job.trace=[...(job.trace||[]),{at:job.updated_at,event:'VISUAL_CONSISTENCY_REVIEW_STARTED',status:job.status}];
  await store.set(jobKey,JSON.stringify(job));

  const input=[
    {type:'input_text',text:[
      'Evaluate whether three generated character candidates preserve the same child identity as the source photo.',
      'Image order: source photo, candidate A, candidate B, candidate C.',
      'Do not identify the person. Do not infer sensitive traits.',
      'Evaluate only visual consistency needed for this product contract.',
      'All candidates should read as the same child while showing clearly different expression/pose/atmosphere directions.',
      'A PASS requires recognizable identity consistency, unobstructed face, readable direction differences, and no apparent sensitive-trait alteration.'
    ].join(' ')},
    {type:'input_image',image_url:imageDataUrl(source,sourceMeta.mime||'image/jpeg'),detail:'high'},
    {type:'input_image',image_url:imageDataUrl(candidateBuffers.A.bytes,candidateBuffers.A.mime),detail:'high'},
    {type:'input_image',image_url:imageDataUrl(candidateBuffers.B.bytes,candidateBuffers.B.mime),detail:'high'},
    {type:'input_image',image_url:imageDataUrl(candidateBuffers.C.bytes,candidateBuffers.C.mime),detail:'high'}
  ];

  const upstream=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},
    body:JSON.stringify({
      model,
      input:[{role:'user',content:input}],
      text:{
        format:{
          type:'json_schema',
          name:'character_visual_identity_review',
          strict:true,
          schema:REVIEW_SCHEMA
        }
      }
    })
  });
  const raw=await upstream.json().catch(()=>null);
  if(!upstream.ok){
    job.consistency_gate.visual={...job.consistency_gate.visual,state:'BLOCKED',notes:'PROVIDER_ERROR_'+upstream.status};
    job.updated_at=new Date().toISOString();
    job.trace=[...(job.trace||[]),{at:job.updated_at,event:'VISUAL_CONSISTENCY_REVIEW_BLOCKED',provider_status:upstream.status,status:job.status}];
    await store.set(jobKey,JSON.stringify(job));
    return Response.json({ok:false,reason:'VISUAL_REVIEW_PROVIDER_ERROR',provider_status:upstream.status},{status:502});
  }

  let evidence;
  try{evidence=JSON.parse(textOutput(raw))}catch{
    job.consistency_gate.visual={...job.consistency_gate.visual,state:'BLOCKED',notes:'STRUCTURED_OUTPUT_PARSE_FAILED'};
    job.updated_at=new Date().toISOString();
    await store.set(jobKey,JSON.stringify(job));
    return Response.json({ok:false,reason:'VISUAL_REVIEW_OUTPUT_INVALID'},{status:502});
  }

  job.consistency_gate=applyVisual(job,{
    evaluator:'OPENAI_RESPONSES:'+model,
    source_identity_match:evidence.source_identity_match,
    candidate_identity_consistent:evidence.candidate_identity_consistent,
    direction_distinctness:evidence.direction_distinctness,
    face_unobstructed:evidence.face_unobstructed,
    sensitive_trait_change_detected:evidence.sensitive_trait_change_detected,
    candidates:evidence.candidates,
    notes:evidence.summary
  });
  job.updated_at=new Date().toISOString();
  job.trace=[...(job.trace||[]),{
    at:job.updated_at,
    event:job.consistency_gate.visual.state==='PASS'?'VISUAL_CONSISTENCY_REVIEW_PASSED':'VISUAL_CONSISTENCY_REVIEW_FAILED',
    status:job.status
  }];
  await store.set(jobKey,JSON.stringify(job));

  return Response.json({
    ok:true,
    state:job.consistency_gate.visual.state,
    consistency_gate:job.consistency_gate,
    candidates:evidence.candidates
  },{status:200,headers:{'Cache-Control':'no-store'}});
}

export const config={path:'/api/character/consistency-review'};
