(function(root){
  'use strict';

  function create(options={}){
    const query=options.query||((s)=>root.document.querySelector(s));
    const getState=options.getState||(()=>({}));
    const save=options.save||(()=>{});
    const view=options.view;
    const runtime=options.runtime;
    const service=options.service;
    const guideTypes=options.guideTypes||{};
    const guideData=options.guideData||(()=>({}));
    const sessionTimes=options.sessionTimes||(()=>({}));
    const applyGuide=options.applyGuide||(()=>{});
    const pauseBgm=options.pauseBgm||(()=>Promise.resolve());
    const resumeBgm=options.resumeBgm||(()=>Promise.resolve());
    const nav=options.nav||(()=>{});
    const toast=options.toast||(()=>{});
    const nowDate=options.nowDate||(()=>new Date());
    const random=options.random||Math.random;
    let guestType='pico';
    let bound=false;
    let saving=false;
    if(!view||!runtime||!service)throw new Error('RECORDING_CONTROLLER_DEPENDENCY_MISSING');

    function renderContext(){
      view.renderContext({
        sessionTimes,
        state:getState(),
        guideData:guideData()
      });
    }

    function openIntro(){
      applyGuide(query('#recIntroGuide'));
      const intro=query('#recIntro');if(intro)intro.hidden=false;
    }

    function closeIntro(){
      const intro=query('#recIntro');if(intro)intro.hidden=true;
    }

    async function enterRecording(){
      const session=getState().activeSession;
      if(!session)return {ok:false,reason:'NO_ACTIVE_SESSION'};
      if(session.pausedAt){toast('일시정지를 해제하고 녹음해 주세요.');return {ok:false,reason:'SESSION_PAUSED'};}
      const contract=session.rev07;
      const task=contract?.tasks?.find(item=>item.task_id===contract.active_task_id);
      if(contract&&!(task?.activity_types||[]).includes('RECORDING')){
        toast('현재 탐험의 녹음 과제가 아니에요.');
        return {ok:false,reason:'RECORDING_NOT_ELIGIBLE'};
      }
      closeIntro();
      await pauseBgm(); // REC = BGM mute, never session pause/finish.
      nav('recording');
      return {ok:true};
    }

    async function backToFocus(){
      const state=getState();
      if(saving)return {ok:false,reason:'SAVE_IN_PROGRESS'};
      if(runtime.isRecording()){toast('녹음을 먼저 끝내주세요.');return {ok:false,reason:'RECORDING_ACTIVE'};}
      if(runtime.currentAudio()){
        if(!root.confirm?.('아직 저장하지 않은 녹음이 있습니다. 녹음을 버리고 타이머로 돌아갈까요?'))
          return {ok:false,reason:'UNSAVED_AUDIO'};
        runtime.clearAudio();
      }
      view.clearPreview();
      nav('focus');
      if(state.activeSession?.sound!=='OFF')await resumeBgm(state.activeSession.sound);
      return {ok:true};
    }

    function chooseGuest(){
      const state=getState();
      const all=Object.keys(guideTypes).filter(x=>x!==state.guide.type);
      const recent=new Set((state.guestHistory||[]).slice(-1));
      let pool=all.filter(x=>!recent.has(x));
      if(!pool.length)pool=all;
      guestType=pool[Math.floor(random()*pool.length)]||all[0]||'pico';
      state.guestHistory=[...(state.guestHistory||[]),guestType].slice(-4);
      save();
      return guestType;
    }

    function finishRecording({blob,type,durationMs,error}={}){
      if(error||!blob?.size){
        view.resetReview({guideName:getState().guide.name});
        toast(error==='RECORDING_DEVICE_ERROR'?'녹음 장치 오류가 발생했어요. 다시 시도해 주세요.':'녹음된 소리가 없어 저장하지 않았어요. 다시 시도해 주세요.');
        return {ok:false,reason:error||'EMPTY_AUDIO'};
      }
      const state=getState();
      chooseGuest();
      view.renderReview({
        audioBlob:blob,
        mainGuideType:state.guide.type,
        guestGuideType:guestType,
        mainGuideName:state.guide.name,
        guestGuideName:guideTypes[guestType]?.defaultName||guestType,
        formatNote:service.formatNote(type)
      });
      state.recordingMeta={mime:type,durationMs,guestType};
      save();
      return {ok:true,guestType};
    }

    async function startRecording(){
      if(!getState().activeSession)return {ok:false,reason:'NO_ACTIVE_SESSION'};
      if(getState().activeSession.pausedAt)return {ok:false,reason:'SESSION_PAUSED'};
      if(saving)return {ok:false,reason:'SAVE_IN_PROGRESS'};
      if(runtime.currentAudio()){toast('먼저 재녹음을 선택해 주세요.');return {ok:false,reason:'REVIEW_NOT_RESOLVED'};}
      await pauseBgm();
      const started=await runtime.start({
        onTick:ms=>{
          view.renderClock(ms);
          renderContext();
        },
        onStop:finishRecording
      });
      if(!started.ok){
        view.setRecordingActive(false);
        const message=started.reason==='UNSUPPORTED'
          ?'이 브라우저는 마이크 녹음을 지원하지 않습니다.'
          :started.reason==='MIC_PERMISSION_DENIED'
            ?'마이크 권한이 필요합니다.'
            :'녹음을 시작할 수 없습니다.';
        toast(message);
        return started;
      }
      view.setRecordingActive(true);
      return started;
    }

    async function toggleRecording(){
      if(runtime.isRecording()){runtime.stop();return {ok:true,action:'STOP_REQUESTED'};}
      return startRecording();
    }

    function rerecord(){
      if(saving||runtime.isRecording())return {ok:false,reason:'RECORDING_BUSY'};
      runtime.clearAudio();
      view.resetReview({guideName:getState().guide.name});
      return {ok:true};
    }

    async function saveRecording(){
      const state=getState();
      const session=state.activeSession;
      if(saving)return {ok:false,reason:'SAVE_IN_PROGRESS'};
      if(!session)return {ok:false,reason:'NO_ACTIVE_SESSION'};
      const currentAudio=runtime.currentAudio();
      if(!currentAudio?.size){toast('유효한 녹음이 없어 저장하지 않았어요.');return {ok:false,reason:'EMPTY_AUDIO'};}
      const sessionId=session.id;
      const type=currentAudio.type||'audio/webm';
      const filename=service.filenameFor({profileName:state.profile.name||'Judy',date:nowDate(),type});
      const button=query('#saveRecordingBtn');
      saving=true;
      if(button)button.disabled=true;
      let stored;
      try{
        stored=await service.storeAudio(currentAudio,filename,type);
      }catch(error){
        toast('녹음을 저장하지 못했어요. 녹음을 유지했으니 다시 시도해 주세요.');
        return {ok:false,reason:'AUDIO_STORAGE_FAILED',error_name:error?.name||''};
      }finally{
        saving=false;
        if(button)button.disabled=false;
      }
      if(!stored?.id){toast('녹음 저장 확인에 실패했어요.');return {ok:false,reason:'AUDIO_STORAGE_UNCONFIRMED'};}
      if(getState().activeSession?.id!==sessionId){
        toast('학습 세션이 변경되어 녹음을 자동 연결하지 않았어요.');
        return {ok:false,reason:'SESSION_CHANGED'};
      }
      const old={recordingDone:session.recordingDone,guestType:session.guestType,recordingMime:session.recordingMime,recordingRef:session.recordingRef};
      session.recordingDone=true;
      session.guestType=guestType;
      session.recordingMime=type;
      session.recordingRef={
        audio_id:stored.id,
        task_id:session.rev07?.active_task_id||null,
        name:stored.name||filename,
        type:stored.type||type,
        created_at:stored.createdAt||nowDate().getTime(),
        size:Number(stored.size)||Number(currentAudio.size)||0,
        duration_ms:Number(state.recordingMeta?.durationMs)||null
      };
      let saved;
      try{saved=save();}catch(error){saved={ok:false,reason:error?.name||'STATE_WRITE_FAILED'};}
      if(saved?.ok===false){
        Object.assign(session,old);
        toast('세션 기록 저장에 실패했어요. 녹음을 유지했으니 다시 시도해 주세요.');
        return {ok:false,reason:'SESSION_RECORD_SAVE_FAILED'};
      }
      runtime.clearAudio();
      view.clearPreview();
      toast(`녹음 저장 완료 · ${filename}`);
      setTimeout(async()=>{
        nav('focus'); // same session / same task; no implicit timer pause.
        if(getState().activeSession?.id===sessionId&&getState().activeSession.sound!=='OFF')
          await resumeBgm(getState().activeSession.sound);
      },450);
      return {ok:true,filename,type,recordingRef:session.recordingRef};
    }

    function bind(){
      if(bound)return false;
      bound=true;
      query('#recBtn')?.addEventListener('click',openIntro);
      query('#cancelRecordBtn')?.addEventListener('click',closeIntro);
      query('#goRecordBtn')?.addEventListener('click',enterRecording);
      query('#recordBackBtn')?.addEventListener('click',backToFocus);
      query('#recordAction')?.addEventListener('click',toggleRecording);
      query('#rerecordBtn')?.addEventListener('click',rerecord);
      query('#saveRecordingBtn')?.addEventListener('click',saveRecording);
      return true;
    }

    return Object.freeze({
      bind,renderContext,openIntro,closeIntro,enterRecording,backToFocus,startRecording,toggleRecording,rerecord,saveRecording,finishRecording,chooseGuest
    });
  }

  root.ReadyRebuildRecordingController=Object.freeze({
    version:'READY_REBUILD_RECORDING_CONTROLLER_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
