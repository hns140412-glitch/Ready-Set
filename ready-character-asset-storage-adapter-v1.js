(() => {
'use strict';
if (window.ReadyCharacterAssetStorageAdapterV1) return;

const VERSION='2026.09.30-character-asset-storage-v1';
let provider=null;

function registerProvider(next){
  if(!next||typeof next.storeMaster!=='function'||typeof next.resolveRead!=='function')throw new Error('CHARACTER_ASSET_PROVIDER_INVALID');
  provider=next;
  return {provider_id:String(next.id||'custom'),version:VERSION};
}

function isPrivateRef(ref){return /^taky-character:[^:]+:[^:]+:[^:]+:[^:]+$/.test(String(ref||''));}

async function sha256Hex(blob){
  const buf=await blob.arrayBuffer();
  const digest=await crypto.subtle.digest('SHA-256',buf);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

async function sourceToBlob(sourceRef,fetchImpl=fetch){
  if(sourceRef instanceof Blob)return sourceRef;
  const ref=String(sourceRef||'');
  if(!ref)throw new Error('CHARACTER_MASTER_SOURCE_REQUIRED');
  const res=await fetchImpl(ref,{cache:'no-store'});
  if(!res.ok)throw new Error('CHARACTER_MASTER_SOURCE_FETCH_FAILED');
  return await res.blob();
}

function registerHttpProvider({baseUrl,getToken,getFamilyId,fetchImpl=fetch}={}){
  const base=new URL(String(baseUrl||''),globalThis.location?.href||'http://localhost/');
  const local=['localhost','127.0.0.1'].includes(base.hostname);
  if((!local&&base.protocol!=='https:')||typeof getToken!=='function'||typeof getFamilyId!=='function'||typeof fetchImpl!=='function')throw new Error('CHARACTER_ASSET_HTTP_PROVIDER_INVALID');
  const endpoint=new URL('/api/family/character-asset',base).href;
  const call=async payload=>{
    const token=String(await getToken()||''),family_id=String(await getFamilyId()||'');
    if(!token||!family_id)throw new Error('CHARACTER_ASSET_AUTH_CONTEXT_REQUIRED');
    const res=await fetchImpl(endpoint,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+token},body:JSON.stringify({family_id,...payload})});
    const body=await res.json().catch(()=>({ok:false,reason:'INVALID_CHARACTER_ASSET_RESPONSE'}));
    if(!res.ok||body.ok===false)throw Object.assign(new Error(body.reason||('CHARACTER_ASSET_HTTP_'+res.status)),{status:res.status,body});
    return body;
  };
  return registerProvider({
    id:'central-family-character-asset-http-v1',
    async storeMaster({member_id,character_id,asset_version,source_ref}){
      const blob=await sourceToBlob(source_ref,fetchImpl);
      if(blob.size<1||blob.size>8*1024*1024)throw new Error('CHARACTER_MASTER_SIZE_INVALID');
      const content_type=['image/png','image/webp','image/jpeg'].includes(blob.type)?blob.type:'image/webp';
      const sha256=await sha256Hex(blob);
      const create=await call({action:'CREATE_UPLOAD',member_id,character_id,content_type,byte_size:blob.size,sha256,asset_version});
      const upload=await fetchImpl(create.upload_url,{method:'PUT',headers:{'content-type':content_type},body:blob});
      if(!upload.ok)throw new Error('CHARACTER_MASTER_BINARY_UPLOAD_FAILED');
      const committed=await call({action:'COMMIT_UPLOAD',member_id,character_id,asset_ref:create.asset_ref,upload_id:create.upload_id,sha256});
      return {asset_ref:create.asset_ref,sha256,etag:committed.etag||null};
    },
    async resolveRead({member_id,character_id,asset_ref}){
      const body=await call({action:'RESOLVE_READ',member_id,character_id,asset_ref});
      return {read_url:body.read_url,expires_at:body.expires_at||null};
    }
  });
}

async function storeMaster(input){
  if(isPrivateRef(input?.source_ref))return {asset_ref:String(input.source_ref),sha256:input.sha256||null,already_private:true};
  if(!provider)throw Object.assign(new Error('CHARACTER_ASSET_PROVIDER_UNAVAILABLE'),{code:'CHARACTER_ASSET_PROVIDER_UNAVAILABLE'});
  return provider.storeMaster(input);
}

async function resolveRead(input){
  if(!provider)throw Object.assign(new Error('CHARACTER_ASSET_PROVIDER_UNAVAILABLE'),{code:'CHARACTER_ASSET_PROVIDER_UNAVAILABLE'});
  return provider.resolveRead(input);
}

window.ReadyCharacterAssetStorageAdapterV1={
  version:VERSION,
  registerProvider,
  registerHttpProvider,
  status:()=>({available:!!provider,provider_id:provider?String(provider.id||'custom'):null}),
  isPrivateRef,
  storeMaster,
  resolveRead
};
})();