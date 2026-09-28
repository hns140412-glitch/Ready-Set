(function(root){
  'use strict';

  function create(options={}){
    const q=options.query||((s)=>document.querySelector(s));
    const formatTime=options.formatTime||((x)=>String(x||0));
    const applyAvatar=options.applyAvatar||(()=>{});
    const applyGuide=options.applyGuide||(()=>{});
    let previewUrl=null;

    function clearPreview(){
      const audio=q('#audioPreview');
      if(audio){audio.pause();audio.removeAttribute('src');audio.load?.();}
      if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}
    }

    function renderContext({sessionTimes,state,guideData}={}){
      const times=typeof sessionTimes==='function'?sessionTimes():{remaining:0};
      const timer=q('#recordTimerContext');
      if(timer)timer.textContent=times.remaining>=0?formatTime(times.remaining):'+'+formatTime(-times.remaining);
      applyAvatar(q('#recordAvatar'));
      applyGuide(q('#recordGuidePortrait'));
      applyGuide(q('#recIntroGuide'));
      const dialogue=q('#guideDialogue');
      if(dialogue)dialogue.textContent=`${state?.guide?.name||'길잡이'}: ${guideData?.intro||''}`;
    }

    function setRecordingActive(active){
      const action=q('#recordAction');
      const label=action?.querySelector('span');
      const state=q('#recordState');
      const wave=q('#waveform');
      action?.classList.toggle('recording',!!active);
      if(label)label.textContent=active?'녹음 끝내기':'녹음 시작';
      if(state)state.textContent=active?'RECORDING':'READY';
      wave?.classList.toggle('active',!!active);
    }

    function renderClock(ms){
      const clock=q('#recordClock');
      if(clock)clock.textContent=formatTime(ms);
    }

    function renderReview({audioBlob,mainGuideType,guestGuideType,mainGuideName,guestGuideName,formatNote}={}){
      clearPreview();
      setRecordingActive(false);
      const state=q('#recordState'); if(state)state.textContent='REVIEW';
      const preview=q('#audioPreview');
      if(preview&&audioBlob){previewUrl=URL.createObjectURL(audioBlob);preview.src=previewUrl;}
      const panel=q('#reviewPanel'); if(panel)panel.hidden=false;
      applyGuide(q('#duoMainGuide'),mainGuideType);
      applyGuide(q('#duoGuestGuide'),guestGuideType);
      const dialogue=q('#guideDialogue');
      if(dialogue)dialogue.textContent='잠깐만. 같이 들어줄 친구 좀 잡아올게!';
      const duo=q('#duoText');
      if(duo)duo.textContent=`${mainGuideName||'길잡이'}: 잡아왔다!  ·  ${guestGuideName||'친구'}: 좋아, 끝까지 들어보자. 지금은 자동 평가보다 녹음을 끝까지 완료한 사실을 먼저 확인할게.`;
      const note=q('#formatNote'); if(note)note.textContent=formatNote||'';
    }

    function resetReview({guideName}={}){
      clearPreview();
      setRecordingActive(false);
      const panel=q('#reviewPanel'); if(panel)panel.hidden=true;
      const clock=q('#recordClock'); if(clock)clock.textContent='00:00';
      const state=q('#recordState'); if(state)state.textContent='READY';
      const dialogue=q('#guideDialogue');
      if(dialogue)dialogue.textContent=`${guideName||'길잡이'}: 좋아, 이번엔 네 속도로 다시 해보자.`;
    }

    return Object.freeze({
      renderContext,
      clearPreview,
      setRecordingActive,
      renderClock,
      renderReview,
      resetReview
    });
  }

  root.ReadyRebuildRecordingView=Object.freeze({
    version:'READY_REBUILD_RECORDING_VIEW_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
