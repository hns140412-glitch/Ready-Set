import { ensure as ensureConsistencyGate } from './character-consistency-core.mjs';
import { getDeployStore, getStore } from '@netlify/blobs';
import { getUser } from '@netlify/identity';
import { mapCharacterSession } from './character-family-session-adapter.mjs';


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

export default async function handler(req){
  if(req.method!=='POST')return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  const user=await getUser();
  if(!user)return Response.json({ok:false,reason:'UNAUTHENTICATED'},{status:401});
  const mapped=mapCharacterSession(user);
  if(!mapped.ok)return Response.json({ok:false,reason:mapped.reason},{status:mapped.status});
  if(mapped.session.role!=='CHILD')return Response.json({ok:false,reason:'CHILD_ROLE_REQUIRED'},{status:403});

  let body={};try{body=await req.json()}catch{return Response.json({ok:false,reason:'INVALID_JSON'},{status:400})}
  let visualId;
  try{visualId=clean(body.visual_id,'VISUAL_ID')}catch(err){return Response.json({ok:false,reason:err.message},{status:400})}

  const memberId=clean(mapped.session.member_id,'MEMBER_ID');
  const prefix=memberId+'/'+visualId;
  const store=storeFor();
  const jobKey=prefix+'/job/state.json';
  const job=await store.get(jobKey,{type:'json'});
  if(!job)return Response.json({ok:false,reason:'CHARACTER_JOB_NOT_FOUND'},{status:404});
  const identity=job.corrected_asset||job.selected_asset;
  if(!identity?.asset_key)return Response.json({ok:false,reason:'CHARACTER_SELECTION_REQUIRED'},{status:409});
  job.consistency_gate=ensureConsistencyGate(job);
  if(!job.consistency_gate.lock_allowed||job.consistency_gate.final_state!=='PASS'){
    return Response.json({
      ok:false,
      reason:'CHARACTER_CONSISTENCY_GATE_NOT_PASS',
      consistency_gate:job.consistency_gate
    },{status:409,headers:{'Cache-Control':'no-store'}});
  }

  const lockedAt=new Date().toISOString();
  const master={
    contract_version:'CHARACTER_VISUAL_ID_MASTER_V01',
    visual_id:visualId,
    family_id:mapped.session.family_id,
    member_id:memberId,
    source_hash:job.source_hash,
    selected_slot:job.selected_slot,
    identity_asset:identity,
    correction_revision:Number(job.correction_revision||0),
    consistency_gate:{
      contract_version:job.consistency_gate.contract_version,
      structural_state:job.consistency_gate.structural?.state||'NOT_RUN',
      visual_state:job.consistency_gate.visual?.state||'NOT_RUN',
      human_state:job.consistency_gate.human_confirmation?.state||'NOT_RUN',
      final_state:job.consistency_gate.final_state
    },
    assets:{
      full_character:identity.asset_key,
      portrait_card:null,
      avatar_square:null
    },
    derivative_state:'DERIVATIVES_PENDING',
    normalization_state:'IDENTITY_LOCKED__DERIVATIVES_PENDING',
    locked_at:lockedAt
  };
  await store.set(prefix+'/master/meta.json',JSON.stringify(master));

  const sourceMeta=await store.get(prefix+'/source/meta.json',{type:'json'});
  if(sourceMeta?.source_key){
    await store.delete(sourceMeta.source_key);
  }
  await store.delete(prefix+'/source/meta.json');
  master.source_retention='PURGED_AFTER_VISUAL_ID_LOCK';

  job.master=master;
  job.source_retention={
    state:'PURGED',
    at:lockedAt,
    policy:'PURGED_AFTER_VISUAL_ID_LOCK'
  };
  job.status='VISUAL_ID_LOCKED';
  job.updated_at=lockedAt;
  job.trace=[
    ...(job.trace||[]),
    {at:lockedAt,event:'VISUAL_ID_LOCKED',status:'VISUAL_ID_LOCKED'},
    {at:lockedAt,event:'SOURCE_PHOTO_PURGED',status:'VISUAL_ID_LOCKED'}
  ];
  await store.set(jobKey,JSON.stringify(job));

  return Response.json({ok:true,job,master},{status:201,headers:{'Cache-Control':'no-store'}});
}

export const config={path:'/api/character/master'};
