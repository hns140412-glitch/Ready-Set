(function(root){
  'use strict';

  const CANDIDATES=Object.freeze([
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm'
  ]);

  function chooseMime(MediaRecorderCtor=root.MediaRecorder){
    if(!MediaRecorderCtor)return '';
    return CANDIDATES.find(m=>MediaRecorderCtor.isTypeSupported?.(m))||'';
  }

  function extensionFor(type=''){
    return /audio\/(mp4|m4a)/.test(type)?'m4a':'webm';
  }

  function safeBaseName(name='Judy'){
    return String(name||'Judy').replace(/[\\/:*?"<>|]/g,'_');
  }

  function filenameFor({profileName='Judy',date=new Date(),type='audio/webm'}={}){
    const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');
    return `${safeBaseName(profileName)}'s grammar recording ${y} ${m} ${d}.${extensionFor(type)}`;
  }

  function formatNote(type=''){
    return /audio\/(mp4|m4a)/.test(type)
      ?'실제 MP4/M4A 계열 오디오로 저장할 수 있는 브라우저입니다.'
      :'이 브라우저의 원본 녹음 포맷은 WebM입니다. .m4a로 이름만 바꾸지 않으며, M4A 제출이 필요하면 별도 변환 계층이 필요합니다.';
  }

  function storeAudio(blob,name,type,{indexedDBImpl=root.indexedDB,now=Date.now}={}){
    return new Promise((resolve,reject)=>{
      const req=indexedDBImpl.open('readyset_audio',1);
      req.onupgradeneeded=()=>{
        if(!req.result.objectStoreNames.contains('audio'))req.result.createObjectStore('audio',{keyPath:'id'});
      };
      req.onerror=()=>reject(req.error);
      req.onsuccess=()=>{
        const tx=req.result.transaction('audio','readwrite');
        tx.objectStore('audio').put({id:`a_${now()}`,name,type,blob,createdAt:now()});
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error);
      };
    });
  }

  root.ReadyRebuildRecordingService=Object.freeze({
    version:'READY_REBUILD_RECORDING_SERVICE_V01',
    CANDIDATES,
    chooseMime,
    extensionFor,
    safeBaseName,
    filenameFor,
    formatNote,
    storeAudio
  });
})(typeof globalThis!=='undefined'?globalThis:this);
