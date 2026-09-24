(function(root){
  'use strict';

  const VERSION='CHARACTER_FORMATION_POSE_BANK_V02';
  const CORE6=Object.freeze(['dubi','lori','ink','nova','take','zero']);
  const POSES=Object.freeze(['standing','seated']);
  const CELL=48;
  const COLS=6;
  const ROWS=2;
  const cache=new Map();
  let spritePromise=null;

  function normalizeId(v){
    const id=String(v||'').toLowerCase();
    return CORE6.includes(id)?id:null;
  }

  function spriteDataUri(){
    const b64=String(root.__cfPoseSpriteB64||'');
    return b64.startsWith('UklGR')?('data:image/webp;base64,'+b64):null;
  }

  function loadSprite(){
    if(spritePromise)return spritePromise;
    const uri=spriteDataUri();
    if(!uri)return Promise.resolve(null);
    spritePromise=new Promise(resolve=>{
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=()=>resolve(null);
      img.src=uri;
    });
    return spritePromise;
  }

  async function extract(id,pose='standing'){
    const key=normalizeId(id);
    const kind=POSES.includes(pose)?pose:'standing';
    if(!key)return null;
    const cacheKey=key+':'+kind;
    if(cache.has(cacheKey))return cache.get(cacheKey);
    const sprite=await loadSprite();
    if(!sprite)return null;
    const col=CORE6.indexOf(key);
    const row=kind==='seated'?1:0;
    const canvas=document.createElement('canvas');
    canvas.width=CELL;
    canvas.height=CELL;
    const ctx=canvas.getContext('2d',{alpha:true});
    if(!ctx)return null;
    ctx.clearRect(0,0,CELL,CELL);
    ctx.drawImage(sprite,col*CELL,row*CELL,CELL,CELL,0,0,CELL,CELL);
    const uri=canvas.toDataURL('image/webp',.92);
    cache.set(cacheKey,uri);
    return uri;
  }

  function bindImage(img,id,pose='standing'){
    if(!img)return false;
    const key=normalizeId(id);
    if(!key)return false;
    extract(key,pose).then(uri=>{
      if(!uri)return;
      img.src=uri;
      img.dataset.cfPoseBank='bound';
      img.dataset.cfPose=pose;
      img.dataset.cfPoseCrew=key;
    }).catch(()=>{});
    return Boolean(spriteDataUri());
  }

  function status(){
    return Object.freeze({
      version:VERSION,
      identityAuthority:'CORE6_CANONICAL_VISUAL_ID',
      changesIdentity:false,
      materialization:'REPOSITORY_EMBEDDED_WEBP_SPRITE_2X6',
      spriteCells:12,
      cellSize:CELL,
      dataAvailable:Boolean(spriteDataUri())
    });
  }

  root.CharacterFormationPoseBank=Object.freeze({
    version:VERSION,CORE6,POSES,CELL,COLS,ROWS,
    spriteDataUri,extract,bindImage,status
  });
})(typeof globalThis!=='undefined'?globalThis:this);
