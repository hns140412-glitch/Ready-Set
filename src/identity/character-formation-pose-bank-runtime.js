(function(root){
  'use strict';

  const VERSION='CHARACTER_FORMATION_POSE_BANK_V03';
  const CORE6=Object.freeze(['dubi','lori','ink','nova','take','zero']);
  const POSES=Object.freeze(['standing','seated']);
  const CELL=64;
  const COLS=6;
  const ROWS=2;
  const SPRITE_PATH='./assets/character-formation/crew/core6-pose-sprite-64.webp';
  const cache=new Map();
  let spritePromise=null;

  function normalizeId(v){
    const id=String(v||'').toLowerCase();
    return CORE6.includes(id)?id:null;
  }

  function loadSprite(){
    if(spritePromise)return spritePromise;
    spritePromise=new Promise(resolve=>{
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=()=>resolve(null);
      img.src=SPRITE_PATH;
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
    if(sprite.naturalWidth!==CELL*COLS||sprite.naturalHeight!==CELL*ROWS)return null;
    const col=CORE6.indexOf(key);
    const row=kind==='seated'?1:0;
    const canvas=document.createElement('canvas');
    canvas.width=CELL;
    canvas.height=CELL;
    const ctx=canvas.getContext('2d',{alpha:true});
    if(!ctx)return null;
    ctx.clearRect(0,0,CELL,CELL);
    ctx.drawImage(sprite,col*CELL,row*CELL,CELL,CELL,0,0,CELL,CELL);
    const uri=canvas.toDataURL('image/webp',.94);
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
      img.dataset.cfPoseSource='repo-sprite-64';
    }).catch(()=>{});
    return true;
  }

  function status(){
    return Object.freeze({
      version:VERSION,
      identityAuthority:'CORE6_CANONICAL_VISUAL_ID',
      changesIdentity:false,
      materialization:'REPOSITORY_WEBP_SPRITE_FILE',
      spritePath:SPRITE_PATH,
      spriteCells:12,
      cellSize:CELL
    });
  }

  root.CharacterFormationPoseBank=Object.freeze({
    version:VERSION,CORE6,POSES,CELL,COLS,ROWS,SPRITE_PATH,
    extract,bindImage,status
  });
})(typeof globalThis!=='undefined'?globalThis:this);
