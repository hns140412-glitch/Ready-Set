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
function clean(v){
  const s=String(v||'').trim();
  return /^[A-Za-z0-9._-]+$/.test(s)?s:null;
}

export default async function handler(req){
  if(req.method!=='GET')return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  const user=await getUser();
  if(!user)return Response.json({ok:false,reason:'UNAUTHENTICATED'},{status:401});
  const mapped=familySessionFromIdentityUser(user);
  if(!mapped.ok)return Response.json({ok:false,reason:mapped.reason},{status:mapped.status});

  const url=new URL(req.url);
  const visualId=clean(url.searchParams.get('visual_id'));
  const slot=String(url.searchParams.get('slot')||'').toUpperCase();
  if(!visualId||!['A','B','C','SELECTED','CORRECTED','MASTER_AVATAR','MASTER_PORTRAIT','MASTER_FULL'].includes(slot)){
    return Response.json({ok:false,reason:'ASSET_REQUEST_INVALID'},{status:400});
  }

  const memberId=clean(mapped.session.member_id);
  if(!memberId)return Response.json({ok:false,reason:'MEMBER_ID_INVALID'},{status:403});
  const store=storeFor();
  const prefix=memberId+'/'+visualId;
  const job=await store.get(prefix+'/job/state.json',{type:'json'});
  if(!job)return Response.json({ok:false,reason:'CHARACTER_JOB_NOT_FOUND'},{status:404});

  let key=null,mime='image/webp';
  if(['A','B','C'].includes(slot))key=job.candidate_assets?.[slot]?.asset_key||null;
  else if(slot==='SELECTED')key=job.selected_asset?.asset_key||null;
  else if(slot==='CORRECTED')key=job.corrected_asset?.asset_key||null;
  else{
    const map={MASTER_AVATAR:'avatar_square',MASTER_PORTRAIT:'portrait_card',MASTER_FULL:'full_character'};
    key=job.master?.assets?.[map[slot]]||null;
  }
  if(!key)return Response.json({ok:false,reason:'CHARACTER_ASSET_NOT_READY'},{status:404});
  const data=await store.get(key,{type:'arrayBuffer'});
  if(!data)return Response.json({ok:false,reason:'CHARACTER_ASSET_MISSING'},{status:404});
  return new Response(data,{status:200,headers:{'Content-Type':mime,'Cache-Control':'private, max-age=60'}});
}

export const config={path:'/api/character/asset'};
