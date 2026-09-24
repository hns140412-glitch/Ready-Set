(function(root){
  'use strict';

  const VERSION='CHARACTER_FORMATION_POSE_BANK_V01';
  const CORE6=Object.freeze(['dubi','lori','ink','nova','take','zero']);
  const ALLOWED=Object.freeze(['standing','seated']);

  function normalizeId(value){
    const id=String(value||'').toLowerCase();
    return CORE6.includes(id)?id:null;
  }

  function source(){
    const data=root.CharacterFormationPoseBankData;
    return data&&typeof data==='object'?data:null;
  }

  function get(id,pose='standing'){
    const key=normalizeId(id);
    const kind=ALLOWED.includes(pose)?pose:'standing';
    if(!key)return null;
    const item=source()?.[key];
    const uri=item?.[kind];
    return typeof uri==='string'&&uri.startsWith('data:image/webp;base64,')?uri:null;
  }

  function bindImage(img,id,pose='standing'){
    if(!img)return false;
    const uri=get(id,pose);
    if(!uri)return false;
    img.src=uri;
    img.dataset.cfPoseBank='bound';
    img.dataset.cfPose=pose;
    img.dataset.cfPoseCrew=normalizeId(id)||'';
    return true;
  }

  function status(){
    const data=source();
    const available={};
    for(const id of CORE6){
      available[id]=Object.freeze({
        standing:Boolean(get(id,'standing')),
        seated:Boolean(get(id,'seated'))
      });
    }
    return Object.freeze({
      version:VERSION,
      identityAuthority:'CORE6_CANONICAL_VISUAL_ID',
      changesIdentity:false,
      dataAvailable:Boolean(data),
      available:Object.freeze(available)
    });
  }

  root.CharacterFormationPoseBank=Object.freeze({
    version:VERSION,
    CORE6,
    get,
    bindImage,
    status
  });
})(typeof globalThis!=='undefined'?globalThis:this);
