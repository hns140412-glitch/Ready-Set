import { getStore } from '@netlify/blobs';
import { admin, getUser } from '@netlify/identity';
import resolver from './learning-evidence-family-resolver.js';
import kernel from '../../vendor/taky/learning-evidence-transport-kernel.js';

const { resolveEvidenceIdentity }=resolver;
const STORE_NAME='ready-learning-evidence-v1';

function scopedKey(packet={}){
  const family=String(packet?.context?.family_id||'').trim();
  const member=String(packet?.context?.member_id||'').trim();
  if(!family||!member)return null;
  return 'families/'+encodeURIComponent(family)+'/members/'+encodeURIComponent(member)+'/learning-engine/kernel-v1';
}

async function loadState(store,key){
  const current=await store.getWithMetadata(key,{type:'json'});
  if(!current?.data)return {exists:false,state:kernel.emptyState(),etag:null};
  return {exists:true,state:current.data,etag:current.etag||null};
}

async function persistState(store,key,state,current){
  return store.setJSON(key,state,current.exists?{onlyIfMatch:current.etag}:{onlyIfNew:true});
}

export default async function handler(req){
  if(req.method!=='POST')return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});

  const actor=await getUser();
  if(!actor)return Response.json({ok:false,reason:'UNAUTHENTICATED'},{status:401});

  const users=await admin.listUsers({page:1,perPage:1000});
  const resolved=resolveEvidenceIdentity(actor,users);
  if(!resolved.ok)return Response.json({ok:false,reason:resolved.reason},{status:resolved.status||403});

  let packet={};
  try{packet=await req.json();}
  catch{return Response.json({ok:false,reason:'INVALID_JSON'},{status:400});}

  const familyId=String(packet?.context?.family_id||'').trim();
  const memberId=String(packet?.context?.member_id||'').trim();
  if(familyId!==resolved.identity.family_id)return Response.json({ok:false,reason:'FAMILY_SCOPE_MISMATCH'},{status:403});
  if(!resolved.identity.authorized_member_ids.includes(memberId))return Response.json({ok:false,reason:'MEMBER_SCOPE_NOT_AUTHORIZED'},{status:403});

  const key=scopedKey(packet);
  if(!key)return Response.json({ok:false,reason:'FAMILY_MEMBER_SCOPE_REQUIRED'},{status:400});
  const store=getStore(STORE_NAME,{consistency:'strong'});

  for(let attempt=1;attempt<=4;attempt++){
    const current=await loadState(store,key);
    const result=kernel.ingest(current.state,packet);
    if(!result.ok)return Response.json(result,{status:400,headers:{'Cache-Control':'no-store'}});

    const write=await persistState(store,key,result.state,current);
    if(write?.modified!==false){
      return Response.json({
        ok:true,
        acknowledgement_kind:result.acknowledgement_kind,
        receipt_id:result.receipt_id,
        readiness:result.readiness||null,
        duplicate:result.duplicate===true,
        transport:{
          contract:'TAKY_LEARNING_EVIDENCE_TRANSPORT_KERNEL_V1',
          persistence:'NETLIFY_BLOBS_STRONG_CONSISTENCY',
          conditional_write:current.exists?'onlyIfMatch':'onlyIfNew',
          attempt
        }
      },{status:200,headers:{'Cache-Control':'no-store'}});
    }
  }

  return Response.json({ok:false,reason:'DURABLE_STORE_CONFLICT_RETRY_EXHAUSTED',retryable:true},{status:409,headers:{'Cache-Control':'no-store'}});
}

export const config={path:'/api/learning-evidence/ingest'};
