(function(root){'use strict';
/* TAKY: accepted interim illustrated environments, not a static mock/crop.
 * Never open production share with missing/unverified binary layers. No child art inside scenery.
 * scene-installed.json is emitted with the actual scene bytes by the build/installer. */
const dir='./assets/share-card/scenes/';
const expected=Object.freeze({
 'drop-pre':'80f0f35ec7cd',
 'drop-result':'52722e5a6eac',
 'sail-pre':'e88366d9db4e',
 'sail-result':'d85d1e1d5718'
});
const scenes=Object.freeze({
 drop:Object.freeze({
  pre:Object.freeze({path:dir+'drop-pre.webp',visual_id:'READY-SHARE-DROP-PRE-20260929-INTERIM',review_status:'ACCEPTED_INTERIM_BINARY_VERIFY_REQUIRED'}),
  result:Object.freeze({path:dir+'drop-result.webp',visual_id:'READY-SHARE-DROP-RESULT-20260929-INTERIM',review_status:'ACCEPTED_INTERIM_BINARY_VERIFY_REQUIRED'})
 }),
 sail:Object.freeze({
  pre:Object.freeze({path:dir+'sail-pre.webp',visual_id:'READY-SHARE-SAIL-PRE-20260929-INTERIM',review_status:'ACCEPTED_INTERIM_BINARY_VERIFY_REQUIRED'}),
  result:Object.freeze({path:dir+'sail-result.webp',visual_id:'READY-SHARE-SAIL-RESULT-20260929-INTERIM',review_status:'ACCEPTED_INTERIM_BINARY_VERIFY_REQUIRED'})
 })
});
const verified=new Set();
let lastStatus='NOT_INSTALLED',pending=null;
async function sha256(blob){const buffer=await blob.arrayBuffer();const hash=await crypto.subtle.digest('SHA-256',buffer);return [...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('');}
async function bootstrap(){
 if(pending)return pending;
 pending=(async()=>{
  try{
   if(!root.crypto?.subtle)throw Error('SECURE_CONTEXT_REQUIRED');
   const manifestRes=await fetch('./assets/share-card/scene-installed.json',{cache:'no-store'});
   if(!manifestRes.ok)throw Error('SCENE_MANIFEST_NOT_INSTALLED');
   const manifest=await manifestRes.json();
   if(manifest.version!=='READY_SHARE_LAYERS_20260929'||manifest.acceptance!=='USER_ACCEPTED_INTERIM')throw Error('SCENE_MANIFEST_AUTHORITY_MISMATCH');
   for(const key of Object.keys(expected)){
    const record=(manifest.scenes||[]).find(x=>x.key===key);
    if(!record||record.scene!=='assets/share-card/scenes/'+key+'.webp'||!record.sha256?.startsWith(expected[key]))throw Error('SCENE_MANIFEST_MISMATCH:'+key);
    const response=await fetch(dir+key+'.webp',{cache:'no-store'});
    if(!response.ok)throw Error('SCENE_FILE_MISSING:'+key);
    const blob=await response.blob();
    const actual=await sha256(blob);
    if(actual!==record.sha256)throw Error('SCENE_HASH_MISMATCH:'+key);
    verified.add(key);
   }
   lastStatus='INTERIM_ASSETS_VERIFIED';return {ok:true,status:lastStatus,count:verified.size};
  }catch(e){verified.clear();lastStatus=e.message||'SCENE_VERIFICATION_FAILED';return {ok:false,reason:lastStatus};}
 })();
 return pending;
}
function scene(theme,kind){const key=theme+'-'+kind,entry=scenes[theme]?.[kind];return verified.has(key)?entry?.path||null:null;}
root.ReadyShareVisualAssets=Object.freeze({version:'READY_SHARE_VISUAL_GATE_V03',scenes,scene,bootstrap,status:()=>lastStatus,verified:()=>verified.size});
bootstrap();
})(typeof globalThis!=='undefined'?globalThis:this);
