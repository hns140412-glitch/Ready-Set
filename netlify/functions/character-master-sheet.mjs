import { getDeployStore, getStore } from '@netlify/blobs';
import { getUser } from '@netlify/identity';
import familyCore from './ready-family-auth-core.js';

const { familySessionFromIdentityUser }=familyCore;

function storeFor(){
  const context=globalThis.Netlify?.context?.deploy?.context;
  return context==='production'
    ? getStore('ready-character-assets-v1',{consistency:'strong'})
    : getDeployStore('ready-character-assets-v1');
}
function clean(v,label){
  const s=String(v||'').trim();
  if(!s||!/^[A-Za-z0-9._-]+$/.test(s))throw new Error(label+'_INVALID');
  return s;
}

export default async function handler(req){
  if(req.method!=='POST')return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  const user=await getUser();
  if(!user)return Response.json({ok:false,reason:'UNAUTHENTICATED'},{status:401});
  const mapped=familySessionFromIdentityUser(user);
  if(!mapped.ok)return Response.json({ok:false,reason:mapped.reason},{status:mapped.status});
  if(mapped.session.role!=='CHILD')return Response.json({ok:false,reason:'CHILD_ROLE_REQUIRED'},{status:403});
  if(String(process.env.READY_CHARACTER_PAID_GENERATION||'').toLowerCase()!=='true'){
    return Response.json({ok:false,reason:'CHARACTER_GENERATION_PROVIDER_LOCKED',gate:'READY_CHARACTER_PAID_GENERATION'},{status:423});
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
  if(!['VISUAL_ID_LOCKED','MASTER_ASSETS_READY'].includes(job.status)){
    return Response.json({ok:false,reason:'VISUAL_ID_LOCK_REQUIRED',status:job.status},{status:409});
  }
  if(job.master_sheet?.asset_key){
    return Response.json({ok:true,job,already_ready:true,asset_url:'/api/character/asset?visual_id='+encodeURIComponent(visualId)+'&slot=MASTER_SHEET'},{status:200});
  }

  const sourceMeta=await store.get(prefix+'/source/meta.json',{type:'json'});
  const identity=job.corrected_asset||job.selected_asset;
  if(!sourceMeta?.source_key||!identity?.asset_key)return Response.json({ok:false,reason:'MASTER_INPUT_ASSET_MISSING'},{status:409});
  const source=await store.get(sourceMeta.source_key,{type:'arrayBuffer'});
  const selected=await store.get(identity.asset_key,{type:'arrayBuffer'});
  if(!source||!selected)return Response.json({ok:false,reason:'MASTER_INPUT_ASSET_MISSING'},{status:409});

  const form=new FormData();
  form.append('image[]',new Blob([source],{type:sourceMeta.mime||'image/jpeg'}),'identity-source.jpg');
  form.append('image[]',new Blob([selected],{type:'image/webp'}),'locked-character.webp');
  form.append('model',String(process.env.READY_CHARACTER_IMAGE_MODEL||'gpt-image-2.5-sunburst'));
  form.append('prompt',[
    'Create a clean character master turnaround sheet for the same child exploration character.',
    'Reference image 1 is the highest-authority real identity source. Reference image 2 is the locked final character design.',
    'Preserve the exact same character identity, face, hairstyle cues, age impression, proportions, clothing language, palette and accessories.',
    'Show a consistent full-body front view, three-quarter front view, side view, back view and three-quarter back view, plus a small set of natural facial expressions.',
    'Use one neutral clean board-like background with generous spacing.',
    'Do not redesign the character. Do not introduce new costume variants.',
    'No text, labels, logos, UI, emoji or watermark. This is a visual consistency master asset.'
  ].join(' '));
  form.append('size',String(process.env.READY_CHARACTER_MASTER_SIZE||'1536x1024'));
  form.append('quality',String(process.env.READY_CHARACTER_MASTER_QUALITY||'high'));
  form.append('output_format','webp');
  form.append('output_compression','90');

  const upstream=await fetch('https://api.openai.com/v1/images/edits',{
    method:'POST',
    headers:{Authorization:'Bearer '+apiKey},
    body:form
  });
  const raw=await upstream.json().catch(()=>null);
  if(!upstream.ok){
    return Response.json({ok:false,reason:'MASTER_SHEET_PROVIDER_ERROR',provider_status:upstream.status,provider_type:raw?.error?.type||null},{status:502});
  }
  const b64=raw?.data?.[0]?.b64_json;
  if(!b64)return Response.json({ok:false,reason:'MASTER_SHEET_OUTPUT_MISSING'},{status:502});
  const bytes=Buffer.from(b64,'base64');
  const assetKey=prefix+'/master/character-master-sheet.webp';
  await store.set(assetKey,bytes);

  job.master_sheet={asset_key:assetKey,mime:'image/webp',bytes:bytes.length};
  job.status='MASTER_ASSETS_READY';
  job.updated_at=new Date().toISOString();
  job.trace=[...(job.trace||[]),{at:job.updated_at,event:'CHARACTER_MASTER_SHEET_READY',status:'MASTER_ASSETS_READY'}];
  await store.set(jobKey,JSON.stringify(job));

  return Response.json({
    ok:true,
    job,
    asset_url:'/api/character/asset?visual_id='+encodeURIComponent(visualId)+'&slot=MASTER_SHEET'
  },{status:201,headers:{'Cache-Control':'no-store'}});
}

export const config={path:'/api/character/master-sheet'};
