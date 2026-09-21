(function(root){
  'use strict';

  function create(options={}){
    const query=options.query||((s)=>root.document.querySelector(s));
    const queryAll=options.queryAll||((s)=>[...root.document.querySelectorAll(s)]);
    const getState=options.getState||(()=>({}));
    const save=options.save||(()=>{});
    const sessionService=options.sessionService;
    const sessionDomain=options.sessionDomain;
    const planner=options.planner||(()=>root.ReadySetPlanner);
    const nav=options.nav||(()=>{});
    const toast=options.toast||(()=>{});
    const renderMission=options.renderMission||(()=>{});
    const renderFocus=options.renderFocus||(()=>{});
    const renderSettings=options.renderSettings||(()=>{});
    const playBgm=options.playBgm||(()=>Promise.resolve());
    const pauseBgm=options.pauseBgm||(()=>Promise.resolve());
    const resumeBgm=options.resumeBgm||(()=>Promise.resolve());
    const completeSession=options.completeSession||(()=>null);
    const now=options.now||(()=>Date.now());
    let previewTimer=null;
    let bound=false;
    if(!sessionService||!sessionDomain)throw new Error('MISSION_FOCUS_CONTROLLER_DEPENDENCY_MISSING');

    function activeSession(){return getState().activeSession||null;}

    function openSound(){
      const state=getState();
      const sheet=query('#soundSheet');
      queryAll('[data-sheet-sound]').forEach(button=>{
        const active=button.dataset.sheetSound===state.sound;
        button.classList.toggle('on',active);
        button.setAttribute('aria-pressed',active?'true':'false');
      });
      if(sheet){
        sheet.hidden=false;
        queueMicrotask(()=>{(sheet.querySelector('[data-sheet-sound].on')||sheet.querySelector('[data-close-sound],[data-sheet-sound]'))?.focus({preventScroll:true})});
      }
    }

    async function closeSound(){
      const state=getState();
      const sheet=query('#soundSheet'); if(sheet)sheet.hidden=true;
      if(!state.activeSession)await pauseBgm();
    }

    async function chooseSound(button){
      const state=getState();
      const sound=button.dataset.sheetSound;
      state.sound=sound;
      if(state.activeSession)state.activeSession.sound=sound;
      save();
      queryAll('[data-sheet-sound]').forEach(item=>item.classList.toggle('on',item===button));
      const name=query('#soundName'); if(name)name.textContent=sound;
      renderSettings();
      if(sound==='OFF')await pauseBgm();
      else{
        clearTimeout(previewTimer);
        await playBgm(sound,{preview:!state.activeSession});
        if(!state.activeSession)previewTimer=setTimeout(()=>pauseBgm(),5000);
      }
      renderFocus();
    }

    async function startMission(){
      const state=getState();
      const ts=now();
      const started=sessionService.start({
        sessionDomain,
        planner:planner(),
        activeSession:state.activeSession,
        selectedTodoIds:state.selectedTodoIds,
        sessionId:`s_${ts}`,
        now:ts,
        targetMin:state.targetMin,
        sound:state.sound
      });
      if(!started.ok){
        if(started.reason==='SESSION_ALREADY_ACTIVE'){toast('이미 진행 중인 작전이 있어요. 먼저 진행 중인 작전으로 돌아가 주세요.');nav('focus');return started;}
        if(started.reason==='NO_SELECTED_TODO'){toast('먼저 Planner가 준비한 오늘의 탐험을 선택해 주세요.');return started;}
        if(started.reason==='NO_STARTABLE_PLANNER_TODO'){toast('지금 시작할 수 있는 Planner TODO가 없어요. TODAY를 다시 확인해 주세요.');return started;}
        toast('다른 세션에서 이미 진행 중인 할 일이 있어 시작하지 않았어요.');
        renderMission();
        return started;
      }
      state.activeSession=started.session;
      save();
      root.dispatchEvent?.(new CustomEvent('readyset-session-started',{detail:{session_id:started.session?.id||null}}));
      nav('focus');
      if(state.sound!=='OFF')await resumeBgm(state.sound);
      return started;
    }

    async function pauseOrResume(){
      const state=getState(),session=state.activeSession;
      if(!session)return {ok:false,reason:'NO_ACTIVE_SESSION'};
      if(session.pausedAt)return resumePausedSession();
      session.pausedAt=now();
      session.pauseReason='';
      await pauseBgm();
      save();
      renderFocus();
      const sheet=query('#pauseSheet'); if(sheet)sheet.hidden=false;
      return {ok:true,state:'PAUSED'};
    }

    async function resumePausedSession(){
      const state=getState(),session=state.activeSession;
      if(!session||!session.pausedAt)return {ok:false,reason:'NOT_PAUSED'};
      session.issueMs+=(now()-session.pausedAt);
      session.pausedAt=null;
      save();
      const sheet=query('#pauseSheet'); if(sheet)sheet.hidden=true;
      renderFocus();
      if(session.sound!=='OFF')await resumeBgm(session.sound);
      return {ok:true,state:'IN_PROGRESS'};
    }

    function setPauseReason(button){
      const state=getState(),session=state.activeSession;
      if(!session)return false;
      session.pauseReason=button.dataset.pauseReason;
      session.pauseEvents=session.pauseEvents||[];
      session.pauseEvents.push({reason:session.pauseReason,at:now()});
      queryAll('[data-pause-reason]').forEach(item=>item.classList.toggle('on',item===button));
      save();
      return true;
    }

    function openOutcome(){
      const modal=query('#outcomeModal');if(modal)modal.hidden=false;
    }
    function closeOutcome(){
      const modal=query('#outcomeModal');if(modal)modal.hidden=true;
    }
    function chooseOutcome(button){
      const stateValue=button.dataset.outcomeState;
      closeOutcome();
      return completeSession(stateValue);
    }

    function bind(){
      if(bound)return false;
      bound=true;
      query('#soundBtn')?.addEventListener('click',openSound);
      query('#focusSoundBtn')?.addEventListener('click',openSound);
      query('#changeBgm')?.addEventListener('click',openSound);
      queryAll('[data-close-sound]').forEach(button=>button.addEventListener('click',closeSound));
      queryAll('[data-sheet-sound]').forEach(button=>button.addEventListener('click',()=>chooseSound(button)));
      query('#startBtn')?.addEventListener('click',startMission);
      query('#pauseBtn')?.addEventListener('click',pauseOrResume);
      queryAll('[data-pause-reason]').forEach(button=>button.addEventListener('click',()=>setPauseReason(button)));
      queryAll('[data-close-pause]').forEach(button=>button.addEventListener('click',()=>{const sheet=query('#pauseSheet');if(sheet)sheet.hidden=true;}));
      query('#resumeFromSheetBtn')?.addEventListener('click',resumePausedSession);
      query('#completeBtn')?.addEventListener('click',openOutcome);
      queryAll('[data-outcome-state]').forEach(button=>button.addEventListener('click',()=>chooseOutcome(button)));
      queryAll('[data-close-outcome]').forEach(button=>button.addEventListener('click',closeOutcome));
      return true;
    }

    return Object.freeze({
      bind,openSound,closeSound,chooseSound,startMission,pauseOrResume,resumePausedSession,setPauseReason,openOutcome,closeOutcome,chooseOutcome
    });
  }

  root.ReadyRebuildMissionFocusController=Object.freeze({
    version:'READY_REBUILD_MISSION_FOCUS_CONTROLLER_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
