import { getDeployStore, getStore } from '@netlify/blobs';
import { getUser } from '@netlify/identity';
import { mapCharacterSession } from './character-family-session-adapter.mjs';


function paidGenerationEnabled(){
  const raw=process.env.CHARACTER_VISUAL_ID_PAID_GENERATION ?? process.env.READY_CHARACTER_PAID_GENERATION;
  return String(raw||'').toLowerCase()==='true';
}

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
async function childSession(){
  const user=await getUser();
  if(!user)return {ok:false,status:401,reason:'UNAUTHENTICATED'};
  const mapped=mapCharacterSession(user);
  if(!mapped.ok)return mapped;
  if(mapped.session.role!=='CHILD')return {ok:false,status:403,reason:'CHILD_ROLE_REQUIRED'};
  return mapped;
}

export default async function handler(req){
  if(req.method!=='POST')return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  const mapped=await childSession();
  if(!mapped.ok)return Response.json({ok:false,reason:mapped.reason},{status:mapped.status});
  if(!paidGenerationEnabled()){
    return Response.json({ok:false,reason:'CHARACTER_GENERATION_PROVIDER_LOCKED',gate:'CHARACTER_VISUAL_ID_PAID_GENERATION'},{status:423});
  }
  const apiKey=String(process.env.OPENAI_API_KEY||'').trim();
  if(!apiKey)return Response.json({ok:false,reason:'IMAGE_PROVIDER_NOT_CONFIGURED'},{status:503});

  let body={};try{body=await req.json()}catch{return Response.json({ok:false,reason:'INVALID_JSON'},{status:400})}
  let visualId;
  try{visualId=clean(body.visual_id,'VISUAL_ID')}catch(err){return Response.json({ok:false,reason:err.message},{status:400})}

  const memberId=clean(mapped.session.member_id,'MEMBER_ID');
  const prefix=memberId+'/'+visualId;
  const store=storeFor();
  const jobKey=prefix+'/job/state.json';
  const job=await store.get(jobKey,{type:'json'});
  if(!job)return Response.json({ok:false,reason:'CHARACTER_JOB_NOT_FOUND'},{status:404});
  if(!job.selected_asset?.asset_key)return Response.json({ok:false,reason:'CHARACTER_SELECTION_REQUIRED'},{status:409});
  const sourceMeta=await store.get(prefix+'/source/meta.json',{type:'json'});
  if(!sourceMeta?.source_key)return Response.json({ok:false,reason:'SOURCE_NOT_UPLOADED'},{status:409});

  const source=await store.get(sourceMeta.source_key,{type:'arrayBuffer'});
  const selected=await store.get(job.selected_asset.asset_key,{type:'arrayBuffer'});
  if(!source||!selected)return Response.json({ok:false,reason:'CORRECTION_INPUT_ASSET_MISSING'},{status:409});

  job.status='CORRECTION_PENDING';
  job.correction_revision=Number(job.correction_revision||0)+1;
  job.updated_at=new Date().toISOString();
  job.trace=[...(job.trace||[]),{at:job.updated_at,event:'LIKENESS_CORRECTION_STARTED',revision:job.correction_revision,status:job.status}];
  await store.set(jobKey,JSON.stringify(job));

  const form=new FormData();
  form.append('image[]',new Blob([source],{type:sourceMeta.mime||'image/jpeg'}),'identity-source.jpg');
  form.append('image[]',new Blob([selected],{type:'image/webp'}),'selected-character.webp');
  form.append('model',String(process.env.CHARACTER_VISUAL_ID_IMAGE_MODEL||process.env.READY_CHARACTER_IMAGE_MODEL||'gpt-image-2.5-sunburst'));
  form.append('prompt',[
    'Edit the selected exploration character to more faithfully match the child in the first reference photo.',
    'Reference image 1 is the highest-authority identity source.',
    'Reference image 2 is the selected character style, clothing, pose language and exploration-art direction to preserve.',
    'Strengthen facial likeness, face shape, hairstyle cues, age impression and recognizable identity from image 1.',
    'Do not replace the child with another person and do not infer or alter sensitive traits.',
    'Preserve the chosen 2.5D editorial exploration character style and overall silhouette from image 2.',
    'No text, logos, UI labels, emoji or watermark.'
  ].join(' '));
  form.append('size',String(process.env.CHARACTER_VISUAL_ID_IMAGE_SIZE||process.env.READY_CHARACTER_IMAGE_SIZE||'1024x1536'));
  form.append('quality',String(process.env.CHARACTER_VISUAL_ID_IMAGE_QUALITY||process.env.READY_CHARACTER_IMAGE_QUALITY||'medium'));
  form.append('output_format','webp');
  form.append('output_compression','85');

  const upstream=await fetch('https://api.openai.com/v1/images/edits',{
    method:'POST',
    headers:{Authorization:'Bearer '+apiKey},
    body:form
  });
  const raw=await upstream.json().catch(()=>null);
  if(!upstream.ok){
    job.status='SELECTED';
    job.error={reason:'LIKENESS_CORRECTION_PROVIDER_ERROR',provider_status:upstream.status,provider_type:raw?.error?.type||null};
    job.updated_at=new Date().toISOString();
    job.trace=[...(job.trace||[]),{at:job.updated_at,event:'LIKENESS_CORRECTION_FAILED',revision:job.correction_revision,status:job.status}];
    await store.set(jobKey,JSON.stringify(job));
    return Response.json({ok:false,reason:'LIKENESS_CORRECTION_PROVIDER_ERROR',provider_status:upstream.status},{status:502});
  }

  const b64=raw?.data?.[0]?.b64_json;
  if(!b64){
    job.status='SELECTED';
    job.error={reason:'CORRECTION_OUTPUT_MISSING'};
    job.updated_at=new Date().toISOString();
    job.trace=[...(job.trace||[]),{at:job.updated_at,event:'LIKENESS_CORRECTION_OUTPUT_MISSING',revision:job.correction_revision,status:'SELECTED'}];
    await store.set(jobKey,JSON.stringify(job));
    return Response.json({ok:false,reason:'CORRECTION_OUTPUT_MISSING'},{status:502});
  }
  const bytes=Buffer.from(b64,'base64');
  const assetKey=prefix+'/selected/corrected-r'+job.correction_revision+'.webp';
  await store.set(assetKey,bytes);

  job.corrected_asset={asset_key:assetKey,mime:'image/webp',bytes:bytes.length,revision:job.correction_revision};
  if(job.consistency_gate){
    job.consistency_gate.visual={
      state:'NOT_RUN',evaluator:null,source_identity_match:null,candidate_identity_consistent:null,
      direction_distinctness:null,face_unobstructed:null,sensitive_trait_change_detected:null,
      notes:'RESET_AFTER_LIKENESS_CORRECTION'
    };
    job.consistency_gate.human_confirmation={
      state:'NOT_RUN',actor_scope:null,accepted_same_identity:null,selected_slot:job.selected_slot||null,
      notes:'RESET_AFTER_LIKENESS_CORRECTION'
    };
    job.consistency_gate.final_state='PENDING';
    job.consistency_gate.lock_allowed=false;
  }
  job.status='CORRECTED';
  job.error=null;
  job.updated_at=new Date().toISOString();
  job.trace=[...(job.trace||[]),{at:job.updated_at,event:'LIKENESS_CORRECTION_COMPLETED',revision:job.correction_revision,status:job.status}];
  await store.set(jobKey,JSON.stringify(job));

  return Response.json({
    ok:true,
    job,
    asset_url:'/api/character/asset?visual_id='+encodeURIComponent(visualId)+'&slot=CORRECTED'
  },{status:201,headers:{'Cache-Control':'no-store'}});
}

export const config={path:'/api/character/correct'};
