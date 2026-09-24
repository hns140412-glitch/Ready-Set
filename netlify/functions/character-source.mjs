import { createHash } from 'node:crypto';
import { getDeployStore, getStore } from '@netlify/blobs';
import { getUser } from '@netlify/identity';
import { mapCharacterSession } from './character-family-session-adapter.mjs';

const MAX_BYTES=3*1024*1024;
const MIME_TO_EXT=new Map([['image/jpeg','jpg'],['image/png','png'],['image/webp','webp']]);

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
function parseDataUrl(value){
  const m=String(value||'').match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/);
  if(!m)return null;
  const bytes=Buffer.from(m[2].replace(/\s+/g,''),'base64');
  return {mime:m[1],bytes};
}
function hashDataUrl(dataUrl){
  return createHash('sha256').update(String(dataUrl)).digest('hex');
}

export default async function handler(req){
  if(req.method!=='POST')return Response.json({ok:false,reason:'METHOD_NOT_ALLOWED'},{status:405});
  const user=await getUser();
  if(!user)return Response.json({ok:false,reason:'UNAUTHENTICATED'},{status:401});
  const mapped=mapCharacterSession(user);
  if(!mapped.ok)return Response.json({ok:false,reason:mapped.reason},{status:mapped.status});
  if(mapped.session.role!=='CHILD')return Response.json({ok:false,reason:'CHILD_ROLE_REQUIRED'},{status:403});

  let body={};
  try{body=await req.json()}catch{return Response.json({ok:false,reason:'INVALID_JSON'},{status:400})}
  let visualId;
  try{visualId=clean(body.visual_id,'VISUAL_ID')}catch(err){return Response.json({ok:false,reason:err.message},{status:400})}
  const sourceHash=String(body.source_hash||'').trim();
  const parsed=parseDataUrl(body.data_url);
  if(!parsed)return Response.json({ok:false,reason:'INVALID_SOURCE_IMAGE'},{status:415});
  if(parsed.bytes.length>MAX_BYTES)return Response.json({ok:false,reason:'SOURCE_IMAGE_TOO_LARGE',limit:MAX_BYTES},{status:413});

  const computed=hashDataUrl(body.data_url);
  if(sourceHash&&computed!==sourceHash){
    return Response.json({ok:false,reason:'SOURCE_HASH_MISMATCH'},{status:409});
  }

  const memberId=clean(mapped.session.member_id,'MEMBER_ID');
  const ext=MIME_TO_EXT.get(parsed.mime)||'bin';
  const prefix=memberId+'/'+visualId;
  const sourceKey=prefix+'/source/source.'+ext;
  const metaKey=prefix+'/source/meta.json';
  const store=storeFor();
  await store.set(sourceKey,parsed.bytes);
  await store.set(metaKey,JSON.stringify({
    contract_version:'CHARACTER_VISUAL_ID_SOURCE_V01',
    family_id:mapped.session.family_id,
    member_id:memberId,
    visual_id:visualId,
    source_hash:computed,
    mime:parsed.mime,
    bytes:parsed.bytes.length,
    source_key:sourceKey,
    created_at:new Date().toISOString()
  }));

  return Response.json({
    ok:true,
    contract_version:'CHARACTER_VISUAL_ID_SOURCE_V01',
    visual_id:visualId,
    source_hash:computed,
    source_key:sourceKey,
    bytes:parsed.bytes.length,
    mime:parsed.mime
  },{status:201,headers:{'Cache-Control':'no-store'}});
}

export const config={path:'/api/character/source'};
