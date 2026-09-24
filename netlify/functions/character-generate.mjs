import { promptForSignatureItem } from './character-signature-item-core.mjs';
import { ensure as ensureConsistencyGate } from './character-consistency-core.mjs';
import { getDeployStore, getStore } from '@netlify/blobs';
import { getUser } from '@netlify/identity';
import { mapCharacterSession } from './character-family-session-adapter.mjs';

const SLOTS=['A','B','C'];

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
function directionPrompt(direction){
  const id=String(direction?.direction_id||'');
  const map={
    LIVELY:'energetic, brave and playful presence; lively posture and expression',
    CURIOUS:'curious explorer presence; discovery-focused gaze and adventurous readiness',
    WARM:'warm, gentle and friendly presence; soft approachable expression',
    BOLD:'confident, brave and self-assured explorer presence',
    FOCUSED:'calm, thoughtful and precise presence; composed intelligent mood',
    IMAGINATIVE:'imaginative, mysterious and story-rich explorer presence'
  };
  return map[id]||'balanced friendly explorer presence';
}
function promptFor(direction,signatureItem){
  return [
    'Edit the provided child photo into a premium high-density 2.5D editorial exploration character.',
    'Identity lock is the highest priority: preserve the same child, recognizable facial identity, face shape, hairstyle cues, age impression, and natural proportions.',
    'Do not turn the child into a different person. Do not infer or alter sensitive traits.',
    'This candidate direction is only an expression and styling direction, not a new identity.',
    'Direction: '+directionPrompt(direction)+'.',
    'Signature exploration item: '+promptForSignatureItem(signatureItem)+'.',
    'Use exactly this one signature exploration item across A/B/C; do not add a second signature prop.',
    'Use tasteful exploration clothing and subtle adventure details. Keep the face unobstructed.',
    'Full-body portrait, clean readable silhouette, premium family-learning-app quality.',
    'No text, logos, UI labels, emoji, or watermark in the image.',
    'Background should be simple and softly atmospheric so the character can later be normalized into runtime assets.'
  ].join(' ');
}
function nextExpected(job){
  const assets=job?.candidate_assets||{};
  if(!assets.A)return 'A';
  if(!assets.B)return 'B';
  if(!assets.C)return 'C';
  return null;
}

export default async function handler(req){
  if(req.method!=='POST')return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  const mapped=await childSession();
  if(!mapped.ok)return Response.json({ok:false,reason:mapped.reason},{status:mapped.status});

  if(!paidGenerationEnabled()){
    return Response.json({
      ok:false,
      reason:'CHARACTER_GENERATION_PROVIDER_LOCKED',
      gate:'CHARACTER_VISUAL_ID_PAID_GENERATION',
      next:'EXTERNAL_RESOURCE_GATE_REQUIRED'
    },{status:423,headers:{'Cache-Control':'no-store'}});
  }
  const apiKey=String(process.env.OPENAI_API_KEY||'').trim();
  if(!apiKey)return Response.json({ok:false,reason:'IMAGE_PROVIDER_NOT_CONFIGURED'},{status:503});

  let body={};try{body=await req.json()}catch{return Response.json({ok:false,reason:'INVALID_JSON'},{status:400})}
  let visualId,slot;
  try{
    visualId=clean(body.visual_id,'VISUAL_ID');
    slot=clean(body.slot,'SLOT').toUpperCase();
  }catch(err){return Response.json({ok:false,reason:err.message},{status:400})}
  if(!SLOTS.includes(slot))return Response.json({ok:false,reason:'CANDIDATE_SLOT_INVALID'},{status:400});

  const memberId=clean(mapped.session.member_id,'MEMBER_ID');
  const prefix=memberId+'/'+visualId;
  const store=storeFor();
  const jobKey=prefix+'/job/state.json';
  const job=await store.get(jobKey,{type:'json'});
  if(!job)return Response.json({ok:false,reason:'CHARACTER_JOB_NOT_FOUND'},{status:404});

  const expected=nextExpected(job);
  if(!expected)return Response.json({ok:false,reason:'CANDIDATES_ALREADY_COMPLETE'},{status:409});
  if(slot!==expected)return Response.json({ok:false,reason:'CANDIDATE_SLOT_OUT_OF_ORDER',expected_slot:expected},{status:409});

  const direction=(job.directions||[]).find(x=>x.slot===slot);
  if(!direction)return Response.json({ok:false,reason:'DIRECTION_FOR_SLOT_MISSING'},{status:409});

  const sourceMeta=await store.get(prefix+'/source/meta.json',{type:'json'});
  if(!sourceMeta?.source_key)return Response.json({ok:false,reason:'SOURCE_NOT_UPLOADED'},{status:409});
  const source=await store.get(sourceMeta.source_key,{type:'arrayBuffer'});
  if(!source)return Response.json({ok:false,reason:'SOURCE_ASSET_MISSING'},{status:409});

  job.status='GENERATING_'+slot;
  job.updated_at=new Date().toISOString();
  job.trace=[...(job.trace||[]),{at:job.updated_at,event:'CANDIDATE_GENERATION_STARTED',slot,status:job.status,identity_contract:job.identity_contract?.contract_version||null}];
  await store.set(jobKey,JSON.stringify(job));

  const form=new FormData();
  const sourceBlob=new Blob([source],{type:sourceMeta.mime||'image/jpeg'});
  form.append('image[]',sourceBlob,'source.'+(sourceMeta.mime==='image/webp'?'webp':sourceMeta.mime==='image/png'?'png':'jpg'));
  form.append('model',String(process.env.CHARACTER_VISUAL_ID_IMAGE_MODEL||process.env.READY_CHARACTER_IMAGE_MODEL||'gpt-image-2.5-sunburst'));
  form.append('prompt',promptFor(direction,job.signature_item));
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
    job.status='FAILED';
    job.error={slot,provider_status:upstream.status,provider_type:raw?.error?.type||null};
    job.updated_at=new Date().toISOString();
    job.trace=[...(job.trace||[]),{at:job.updated_at,event:'CANDIDATE_GENERATION_FAILED',slot,status:'FAILED'}];
    await store.set(jobKey,JSON.stringify(job));
    return Response.json({ok:false,reason:'IMAGE_PROVIDER_ERROR',slot,provider_status:upstream.status,provider_type:raw?.error?.type||null},{status:502});
  }

  const b64=raw?.data?.[0]?.b64_json;
  if(!b64){
    job.status='FAILED';
    job.error={slot,reason:'IMAGE_OUTPUT_MISSING'};
    job.updated_at=new Date().toISOString();
    await store.set(jobKey,JSON.stringify(job));
    return Response.json({ok:false,reason:'IMAGE_OUTPUT_MISSING',slot},{status:502});
  }

  const bytes=Buffer.from(b64,'base64');
  const assetKey=prefix+'/candidates/'+slot+'.webp';
  await store.set(assetKey,bytes);

  job.candidate_assets={...(job.candidate_assets||{}),[slot]:{
    asset_key:assetKey,
    mime:'image/webp',
    bytes:bytes.length,
    direction_id:direction.direction_id,
    source:direction.source,
    signature_item_id:job.signature_item?.id||null
  }};
  const next=nextExpected(job);
  job.status=next?'CANDIDATE_'+slot+'_READY':'READY_FOR_SELECTION';
  job.next_slot=next;
  if(!next)job.consistency_gate=ensureConsistencyGate(job);
  job.updated_at=new Date().toISOString();
  job.trace=[...(job.trace||[]),{at:job.updated_at,event:'CANDIDATE_GENERATION_COMPLETED',slot,status:job.status}];
  await store.set(jobKey,JSON.stringify(job));

  return Response.json({
    ok:true,
    slot,
    status:job.status,
    next_slot:next,
    asset_url:'/api/character/asset?visual_id='+encodeURIComponent(visualId)+'&slot='+slot
  },{status:201,headers:{'Cache-Control':'no-store'}});
}

export const config={path:'/api/character/generate'};
