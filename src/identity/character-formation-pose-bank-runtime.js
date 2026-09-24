(function(root){
  'use strict';

  const VERSION='CHARACTER_FORMATION_POSE_BANK_V02_SPRITE';
  const CORE6=Object.freeze(['dubi','lori','ink','nova','take','zero']);
  const ALLOWED=Object.freeze(['standing','seated']);
  const SPRITE_URL='./assets/character-formation/crew/core6-pose-sprite-64.webp';
  const SPRITE_GEOMETRY=Object.freeze({columns:6,rows:2,cellWidth:64,cellHeight:64,width:384,height:128});
  const TRANSPARENT_PIXEL='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

  function normalizeId(value){
    const id=String(value||'').toLowerCase();
    return CORE6.includes(id)?id:null;
  }

  function descriptor(id,pose='standing'){
    const key=normalizeId(id);
    const kind=ALLOWED.includes(pose)?pose:'standing';
    if(!key)return null;
    const col=CORE6.indexOf(key);
    const row=kind==='seated'?1:0;
    return Object.freeze({
      id:key,
      pose:kind,
      sprite:SPRITE_URL,
      col,row,
      xPercent:col*20,
      yPercent:row*100
    });
  }

  function clearSpriteStyle(img){
    if(!img)return;
    img.style.removeProperty('background-image');
    img.style.removeProperty('background-size');
    img.style.removeProperty('background-position');
    img.style.removeProperty('background-repeat');
    img.style.removeProperty('background-origin');
    img.style.removeProperty('background-clip');
  }

  function bindImage(img,id,pose='standing'){
    if(!img)return false;
    const d=descriptor(id,pose);
    if(!d)return false;

    // Keep the previous manifest-bound canonical URL so it can be restored immediately.
    const fallback=img.dataset.cfPoseFallbackSrc||img.currentSrc||img.src||'';
    if(fallback&&!fallback.startsWith('data:image/gif;base64,'))img.dataset.cfPoseFallbackSrc=fallback;

    img.src=TRANSPARENT_PIXEL;
    img.style.backgroundImage='url("'+SPRITE_URL+'")';
    img.style.backgroundSize='600% 200%';
    img.style.backgroundPosition=d.xPercent+'% '+d.yPercent+'%';
    img.style.backgroundRepeat='no-repeat';
    img.style.backgroundOrigin='content-box';
    img.style.backgroundClip='content-box';
    img.dataset.cfPoseBank='bound';
    img.dataset.cfPose=pose;
    img.dataset.cfPoseCrew=d.id;
    img.dataset.cfPoseSprite=SPRITE_URL;
    return true;
  }

  function restoreFallback(img){
    if(!img)return false;
    const fallback=img.dataset.cfPoseFallbackSrc;
    if(!fallback)return false;
    clearSpriteStyle(img);
    img.src=fallback;
    delete img.dataset.cfPoseBank;
    delete img.dataset.cfPose;
    delete img.dataset.cfPoseCrew;
    delete img.dataset.cfPoseSprite;
    return true;
  }

  function status(){
    const available={};
    for(const id of CORE6){
      available[id]=Object.freeze({standing:true,seated:true});
    }
    return Object.freeze({
      version:VERSION,
      identityAuthority:'CORE6_CANONICAL_VISUAL_ID',
      changesIdentity:false,
      runtimeAsset:'REPO_SPRITE_BINARY',
      spriteUrl:SPRITE_URL,
      spriteGeometry:SPRITE_GEOMETRY,
      available:Object.freeze(available)
    });
  }

  root.CharacterFormationPoseBank=Object.freeze({
    version:VERSION,
    CORE6,
    SPRITE_URL,
    SPRITE_GEOMETRY,
    descriptor,
    bindImage,
    restoreFallback,
    status
  });
})(typeof globalThis!=='undefined'?globalThis:this);
