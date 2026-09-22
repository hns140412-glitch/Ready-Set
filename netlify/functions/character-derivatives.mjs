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
function parseImageDataUrl(value,label){
  const m=String(value||'').match(/^data:image\/(webp|png|jpeg);base64,([A-Za-z0-9+/=]+)$/);
  if(!m)throw new Error(label+'_INVALID');
  const bytes=Buffer.from(m[2],'base64');
  if(!bytes.length||bytes.length>5*1024*1024)throw new Error(label+'_SIZE_INVALID');
  const mime=m[1]==='jpeg'?'image/jpeg':'image/'+m[1];
  return {bytes,mime,ext:m[1]==='jpeg'?'jpg':m[1]};
}

export default async function handler(req){
  if(req.method!=='POST')return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  const user=await getUser();
  if(!user)return Response.json({ok:false,reason:'UNAUTHENTICATED'},{status:401});
  const mapped=mapCharacterSession(user);
  if(!mapped.ok)return Response.json({ok:false,reason:mapped.reason},{status:mapped.status});
  if(mapped.session.role!=='CHILD')return Response.json({ok:false,reason:'CHILD_ROLE_REQUIRED'},{status:403});

  let body={};try{body=await req.json()}catch{return Response.json({ok:false,reason:'INVALID_JSON'},{status:400})}
  let visualId,avatar,portrait;
  try{
    visualId=clean(body.visual_id,'VISUAL_ID');
    avatar=parseImageDataUrl(body.avatar_square_data_url,'AVATAR_SQUARE');
    portrait=parseImageDataUrl(body.portrait_card_data_url,'PORTRAIT_CARD');
  }catch(err){return Response.json({ok:false,reason:err.message},{status:400})}

  const memberId=clean(mapped.session.member_id,'MEMBER_ID');
  const prefix=memberId+'/'+visualId;
  const store=storeFor();
  const jobKey=prefix+'/job/state.json';
  const job=await store.get(jobKey,{type:'json'});
  if(!job)return Response.json({ok:false,reason:'CHARACTER_JOB_NOT_FOUND'},{status:404});
  if(!job.master?.identity_asset?.asset_key||!['VISUAL_ID_LOCKED','MASTER_ASSETS_READY'].includes(job.status)){
    return Response.json({ok:false,reason:'VISUAL_ID_LOCK_REQUIRED',status:job.status},{status:409});
  }

  const avatarKey=prefix+'/master/avatar-square.'+avatar.ext;
  const portraitKey=prefix+'/master/portrait-card.'+portrait.ext;
  await store.set(avatarKey,avatar.bytes);
  await store.set(portraitKey,portrait.bytes);

  const updatedAt=new Date().toISOString();
  job.master={
    ...job.master,
    assets:{
      ...(job.master.assets||{}),
      full_character:job.master.assets?.full_character||job.master.identity_asset.asset_key,
      avatar_square:avatarKey,
      portrait_card:portraitKey
    },
    derivative_state:'READY',
    derivatives_updated_at:updatedAt,
    derivative_contract:'CHARACTER_VISUAL_ID_DERIVATIVE_V01'
  };
  job.status='MASTER_ASSETS_READY';
  job.updated_at=updatedAt;
  job.trace=[...(job.trace||[]),{
    at:updatedAt,
    event:'CHARACTER_DERIVATIVE_ASSETS_READY',
    status:'MASTER_ASSETS_READY'
  }];
  await store.set(prefix+'/master/meta.json',JSON.stringify(job.master));
  await store.set(jobKey,JSON.stringify(job));

  return Response.json({
    ok:true,
    job,
    master:job.master,
    assets:{
      full_character:'/api/character/asset?visual_id='+encodeURIComponent(visualId)+'&slot=MASTER_FULL',
      portrait_card:'/api/character/asset?visual_id='+encodeURIComponent(visualId)+'&slot=MASTER_PORTRAIT',
      avatar_square:'/api/character/asset?visual_id='+encodeURIComponent(visualId)+'&slot=MASTER_AVATAR'
    }
  },{status:201,headers:{'Cache-Control':'no-store'}});
}

export const config={path:'/api/character/derivatives'};
