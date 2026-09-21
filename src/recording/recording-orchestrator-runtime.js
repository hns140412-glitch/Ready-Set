(function(root){
  'use strict';

  function create(options={}){
    const recordingService=options.recordingService;
    const mediaDevices=options.mediaDevices||root.navigator?.mediaDevices||null;
    const MediaRecorderCtor=options.MediaRecorderCtor||root.MediaRecorder||null;
    const now=options.now||Date.now;
    if(!recordingService)throw new Error('RECORDING_ORCHESTRATOR_DEPENDENCY_MISSING');

    let recorder=null,stream=null,chunks=[],startedAt=0,ticker=null,currentBlob=null;

    function isRecording(){return recorder?.state==='recording'}
    function currentAudio(){return currentBlob}
    function clearAudio(){currentBlob=null}

    async function start({onTick,onStop}={}){
      if(isRecording())return {ok:false,reason:'ALREADY_RECORDING'};
      if(!mediaDevices?.getUserMedia||!MediaRecorderCtor)return {ok:false,reason:'UNSUPPORTED'};
      try{
        stream=await mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
        const mime=recordingService.chooseMime(MediaRecorderCtor);
        recorder=new MediaRecorderCtor(stream,mime?{mimeType:mime}:undefined);
        chunks=[];currentBlob=null;
        recorder.ondataavailable=event=>{if(event.data?.size)chunks.push(event.data)};
        recorder.onstop=()=>{
          clearInterval(ticker);ticker=null;
          stream?.getTracks?.().forEach(track=>track.stop());
          const type=recorder?.mimeType||chunks[0]?.type||'audio/webm';
          currentBlob=new Blob(chunks,{type});
          const durationMs=Math.max(0,now()-startedAt);
          onStop?.({blob:currentBlob,type,durationMs});
        };
        recorder.start(250);
        startedAt=now();
        if(typeof onTick==='function')ticker=setInterval(()=>onTick(Math.max(0,now()-startedAt)),250);
        return {ok:true,mime};
      }catch(error){
        clearInterval(ticker);ticker=null;
        stream?.getTracks?.().forEach(track=>track.stop());
        recorder=null;stream=null;chunks=[];
        return {
          ok:false,
          reason:error?.name==='NotAllowedError'?'MIC_PERMISSION_DENIED':'START_FAILED',
          error_name:error?.name||''
        };
      }
    }

    function stop(){
      if(!isRecording())return {ok:false,reason:'NOT_RECORDING'};
      recorder.stop();
      return {ok:true};
    }

    return Object.freeze({start,stop,isRecording,currentAudio,clearAudio});
  }

  root.ReadyRebuildRecordingOrchestrator=Object.freeze({
    version:'READY_REBUILD_RECORDING_ORCHESTRATOR_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
