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
async function childSession(){
  const user=await getUser();
  if(!user)return {ok:false,status:401,reason:'UNAUTHENTICATED'};
  const mapped=familySessionFromIdentityUser(user);
  if(!mapped.ok)return mapped;
  if(mapped.session.role!=='CHILD')return {ok:false,status:403,reason:'CHILD_ROLE_REQUIRED'};
  return mapped;
}

export default async function handler(req){
  if(req.method!=='POST')return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  const mapped=await childSession();
  if(!mapped.ok)return Response.json({ok:false,reason:mapped.reason},{status:mapped.status});

  let body={};try{body=await req.json()}catch{return Response.json({ok:false,reason:'INVALID_JSON'},{status:400})}
  let visualId;
  try{visualId=clean(body.visual_id,'VISUAL_ID')}catch(err){return Response.json({ok:false,reason:err.message},{status:400})}
  const action=String(body.action||'').toUpperCase();
  const memberId=clean(mapped.session.member_id,'MEMBER_ID');
  const prefix=memberId+'/'+visualId;
  const store=storeFor();
  const key=prefix+'/job/state.json';
  const job=await store.get(key,{type:'json'});
  if(!job)return Response.json({ok:false,reason:'CHARACTER_JOB_NOT_FOUND'},{status:404});

  if(action==='SELECT_CANDIDATE'){
    const slot=String(body.slot||'').toUpperCase();
    if(!['A','B','C'].includes(slot))return Response.json({ok:false,reason:'CANDIDATE_SLOT_INVALID'},{status:400});
    if(job.status!=='READY_FOR_SELECTION'&&job.status!=='SELECTED'){
      return Response.json({ok:false,reason:'CANDIDATES_NOT_READY',status:job.status},{status:409});
    }
    const asset=job.candidate_assets?.[slot];
    if(!asset?.asset_key)return Response.json({ok:false,reason:'CANDIDATE_ASSET_MISSING'},{status:409});
    job.selected_slot=slot;
    job.selected_asset={...asset,slot};
    job.status='SELECTED';
    job.updated_at=new Date().toISOString();
    job.trace=[...(job.trace||[]),{at:job.updated_at,event:'CANDIDATE_SELECTED',slot,status:'SELECTED'}];
    await store.set(key,JSON.stringify(job));
    return Response.json({ok:true,job},{status:200,headers:{'Cache-Control':'no-store'}});
  }

  return Response.json({ok:false,reason:'CHARACTER_ACTION_UNSUPPORTED'},{status:400});
}

export const config={path:'/api/character/action'};
