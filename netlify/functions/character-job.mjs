import { normalizeSignatureItem } from './character-signature-item-core.mjs';
import { getDeployStore, getStore } from '@netlify/blobs';
import { getUser } from '@netlify/identity';
import { mapCharacterSession } from './character-family-session-adapter.mjs';

const VALID_SOURCES=['USER_SELECTION_1','USER_SELECTION_2','SYSTEM_AUTO_CONTRAST'];
const IDENTITY_CONTRACT_VERSION='CHARACTER_VISUAL_IDENTITY_CONSISTENCY_V01';

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
async function session(){
  const user=await getUser();
  if(!user)return {ok:false,status:401,reason:'UNAUTHENTICATED'};
  const mapped=mapCharacterSession(user);
  if(!mapped.ok)return mapped;
  if(mapped.session.role!=='CHILD')return {ok:false,status:403,reason:'CHILD_ROLE_REQUIRED'};
  return mapped;
}
function validateIdentityContract(contract){
  if(!contract||contract.contract_version!==IDENTITY_CONTRACT_VERSION){
    return {ok:false,reason:'IDENTITY_CONTRACT_INVALID'};
  }
  if(contract.identity_authority!=='SOURCE_PHOTO')return {ok:false,reason:'IDENTITY_AUTHORITY_INVALID'};
  if(contract.candidate_rule!=='SAME_CHILD_DIFFERENT_DIRECTION')return {ok:false,reason:'IDENTITY_CANDIDATE_RULE_INVALID'};
  if(!Array.isArray(contract.candidates)||contract.candidates.length!==3)return {ok:false,reason:'IDENTITY_CANDIDATE_CONTRACT_INVALID'};
  const slots=contract.candidates.map(x=>String(x?.slot||'')).join('|');
  if(slots!=='A|B|C')return {ok:false,reason:'IDENTITY_CANDIDATE_SLOTS_INVALID'};
  return {ok:true};
}

function validateDirections(directions){
  if(!Array.isArray(directions)||directions.length!==3)return {ok:false,reason:'THREE_DIRECTIONS_REQUIRED'};
  const sources=directions.map(x=>String(x?.source||''));
  if(sources.join('|')!==VALID_SOURCES.join('|'))return {ok:false,reason:'DIRECTION_PROVENANCE_INVALID'};
  const ids=directions.map(x=>String(x?.direction_id||'').trim());
  if(ids.some(x=>!x)||new Set(ids).size!==3)return {ok:false,reason:'DIRECTIONS_MUST_BE_DISTINCT'};
  if(directions.map(x=>String(x?.slot||'')).join('|')!=='A|B|C')return {ok:false,reason:'CANDIDATE_SLOTS_INVALID'};
  return {ok:true,ids};
}

export default async function handler(req){
  const mapped=await session();
  if(!mapped.ok)return Response.json({ok:false,reason:mapped.reason},{status:mapped.status});
  const memberId=clean(mapped.session.member_id,'MEMBER_ID');
  const store=storeFor();

  if(req.method==='GET'){
    const url=new URL(req.url);
    let visualId;
    try{visualId=clean(url.searchParams.get('visual_id'),'VISUAL_ID')}catch(err){return Response.json({ok:false,reason:err.message},{status:400})}
    const key=memberId+'/'+visualId+'/job/state.json';
    const raw=await store.get(key);
    if(!raw)return Response.json({ok:false,reason:'CHARACTER_JOB_NOT_FOUND'},{status:404});
    let job;try{job=JSON.parse(raw)}catch{return Response.json({ok:false,reason:'CHARACTER_JOB_CORRUPT'},{status:500})}
    return Response.json({ok:true,job},{status:200,headers:{'Cache-Control':'no-store'}});
  }

  if(req.method!=='POST')return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  let body={};try{body=await req.json()}catch{return Response.json({ok:false,reason:'INVALID_JSON'},{status:400})}

  let visualId;
  try{visualId=clean(body.visual_id,'VISUAL_ID')}catch(err){return Response.json({ok:false,reason:err.message},{status:400})}
  const sourceHash=String(body.source_hash||'').trim();
  if(!sourceHash)return Response.json({ok:false,reason:'SOURCE_HASH_REQUIRED'},{status:400});
  const checked=validateDirections(body.directions);
  if(!checked.ok)return Response.json({ok:false,reason:checked.reason},{status:400});
  const identityChecked=validateIdentityContract(body.identity_contract);
  if(!identityChecked.ok)return Response.json({ok:false,reason:identityChecked.reason},{status:400});
  const signatureChecked=normalizeSignatureItem(body.signature_item);
  if(!signatureChecked.ok)return Response.json({ok:false,reason:signatureChecked.reason},{status:400});

  const prefix=memberId+'/'+visualId;
  const sourceMetaRaw=await store.get(prefix+'/source/meta.json');
  if(!sourceMetaRaw)return Response.json({ok:false,reason:'SOURCE_NOT_UPLOADED'},{status:409});
  let sourceMeta;try{sourceMeta=JSON.parse(sourceMetaRaw)}catch{return Response.json({ok:false,reason:'SOURCE_META_CORRUPT'},{status:500})}
  if(sourceMeta.source_hash!==sourceHash)return Response.json({ok:false,reason:'SOURCE_HASH_MISMATCH'},{status:409});

  const created=new Date().toISOString();
  const job={
    contract_version:'CHARACTER_VISUAL_ID_GENERATION_JOB_V01',
    identity_contract:body.identity_contract,
    signature_item:signatureChecked.item,
    job_id:'charjob_'+visualId+'_'+sourceHash.slice(0,12),
    family_id:mapped.session.family_id,
    member_id:memberId,
    visual_id:visualId,
    source_hash:sourceHash,
    source_key:sourceMeta.source_key,
    status:paidGenerationEnabled()?'QUEUED':'QUEUED_PROVIDER_LOCKED',
    directions:body.directions,
    provider_generation_enabled:paidGenerationEnabled(),
    created_at:created,
    updated_at:created,
    trace:[
      {at:created,event:'REMOTE_JOB_REGISTERED',status:paidGenerationEnabled()?'QUEUED':'QUEUED_PROVIDER_LOCKED'},
      {at:created,event:'SIGNATURE_ITEM_LOCKED_FOR_CANDIDATES',item_id:signatureChecked.item.id,status:paidGenerationEnabled()?'QUEUED':'QUEUED_PROVIDER_LOCKED'}
    ]
  };
  await store.set(prefix+'/job/state.json',JSON.stringify(job));

  return Response.json({
    ok:true,
    job,
    next:job.provider_generation_enabled?'GENERATION_ADAPTER_PENDING':'PROVIDER_LOCKED'
  },{status:201,headers:{'Cache-Control':'no-store'}});
}

export const config={path:'/api/character/job'};
