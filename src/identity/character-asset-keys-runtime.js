(function(root){
  'use strict';

  const VERSION='READY_CHARACTER_ASSET_KEYS_V01';

  function clean(value,label){
    const v=String(value||'').trim();
    if(!v)throw new Error(label+'_REQUIRED');
    if(!/^[A-Za-z0-9._-]+$/.test(v))throw new Error(label+'_UNSAFE');
    return v;
  }

  function base(memberScope,visualId){
    return clean(memberScope,'MEMBER_SCOPE')+'/'+clean(visualId,'VISUAL_ID');
  }

  function keys(memberScope,visualId){
    const b=base(memberScope,visualId);
    return Object.freeze({
      source:b+'/source/source.jpg',
      sourceMeta:b+'/source/meta.json',
      candidateA:b+'/candidates/A.webp',
      candidateB:b+'/candidates/B.webp',
      candidateC:b+'/candidates/C.webp',
      selected:b+'/selected/selected.webp',
      corrected:b+'/selected/corrected.webp',
      masterFront:b+'/master/front.webp',
      masterPortrait:b+'/master/portrait.webp',
      masterAvatar:b+'/master/avatar-square.webp',
      masterMeta:b+'/master/meta.json',
      job:b+'/job/state.json'
    });
  }

  root.ReadyCharacterAssetKeys=Object.freeze({version:VERSION,keys});
})(typeof globalThis!=='undefined'?globalThis:this);
