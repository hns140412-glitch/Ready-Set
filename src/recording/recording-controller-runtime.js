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
      closeIntro();
      await pauseBgm();
      nav('recording');
    }

    async function backToFocus(){
      const state=getState();
      if(runtime.isRecording()){toast('녹음을 먼저 끝내주세요.');return {ok:false,reason:'RECORDING_ACTIVE'};}
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

    function finishRecording({blob,type,durationMs}={}){
      if(!blob)return {ok:false,reason:'NO_BLOB'};
      const state=getState();
      chooseGuest();
      view.renderReview({
        audioUrl:URL.createObjectURL(blob),
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
      await pauseBgm();
      const started=await runtime.start({
        onTick:ms=>{
          view.renderClock(ms);
          renderContext();
        },
        onStop:finishRecording
      });
      if(!started.ok){
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
      runtime.clearAudio();
      view.resetReview({guideName:getState().guide.name});
    }

    async function saveRecording(){
      const state=getState();
      const currentAudio=runtime.currentAudio();
      if(!currentAudio)return {ok:false,reason:'NO_AUDIO'};
      const type=currentAudio.type||'audio/webm';
      const filename=service.filenameFor({profileName:state.profile.name||'Judy',date:nowDate(),type});
      await service.storeAudio(currentAudio,filename,type);
      if(state.activeSession){
        state.activeSession.recordingDone=true;
        state.activeSession.guestType=guestType;
        state.activeSession.recordingMime=type;
      }
      save();
      toast(`저장 완료 · ${filename}`);
      setTimeout(async()=>{
        nav('focus');
        if(getState().activeSession?.sound!=='OFF')await resumeBgm(getState().activeSession.sound);
      },450);
      return {ok:true,filename,type};
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
