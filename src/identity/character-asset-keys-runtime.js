(function(root){
  'use strict';

  const VERSION='CHARACTER_VISUAL_ID_ASSET_KEYS_V01';

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
      masterIdentity:b+'/master/identity.webp',
      masterFull:b+'/master/full-character.webp',
      masterPortrait:b+'/master/portrait-card.webp',
      masterAvatar:b+'/master/avatar-square.webp',
      masterMeta:b+'/master/meta.json',
      job:b+'/job/state.json'
    });
  }

  const api=Object.freeze({version:VERSION,owner:'CHARACTER_VISUAL_ID',keys});
  root.CharacterVisualIdAssetKeys=api;
  root.ReadyCharacterAssetKeys=api;
})(typeof globalThis!=='undefined'?globalThis:this);
