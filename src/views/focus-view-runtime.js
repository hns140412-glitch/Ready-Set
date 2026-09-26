(function(root){
  'use strict';
  function create(options={}){
    const q=options.query||((s)=>document.querySelector(s));
    const learningStepLabel=options.learningStepLabel||((x)=>String(x||''));
    const fmt=options.formatTime||((x)=>String(x||0));
    const applyGuide=options.applyGuide||(()=>{});
    const updateBgmStatus=options.updateBgmStatus||(()=>{});

    function model(session){
      if(!session)return null;
      const labels=[...(session.selected||[]),...(session.tasks||[])];
      const steps=[...new Set((session.plannerLinks||[]).flatMap(x=>Array.isArray(x.activity_sequence)?x.activity_sequence:[]))];
      const recording=(session.selected||[]).includes('영어 · 문장 녹음') ||
        (session.plannerLinks||[]).some(x=>(x.activity_types||[]).includes('RECORDING'));
      return Object.freeze({
        mission:labels.join(' · ')||'오늘의 작전',
        learningGuide:steps.length?steps.map(learningStepLabel).join(' → '):'오늘 할 순서를 따라가요.',
        recordingAvailable:recording,
        targetText:fmt(session.targetMs),
        startClock:new Date(session.startAt).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false})
      });
    }

    function render(session){
      const m=model(session);
      if(!m)return {ok:false,reason:'NO_ACTIVE_SESSION'};
      const mission=q('#focusMission'); if(mission)mission.textContent=m.mission;
      const guide=q('#focusLearningGuide'); if(guide)guide.textContent=m.learningGuide;
      const rec=q('#recBtn'); if(rec)rec.hidden=!m.recordingAvailable;
      const target=q('#targetTime'); if(target)target.textContent=m.targetText;
      const start=q('#startClock'); if(start)start.textContent=m.startClock;
      applyGuide(q('#focusGuideMini'));
      updateBgmStatus();
      return {ok:true,model:m};
    }

    function renderTick(session,times,now=new Date()){
      if(!session)return {ok:false,reason:'NO_ACTIVE_SESSION'};
      const remain=q('#remainingTime'); if(remain)remain.textContent=times.remaining>=0?fmt(times.remaining):'+'+fmt(-times.remaining);
      const focus=q('#focusElapsed'); if(focus)focus.textContent=fmt(times.focus);
      const issue=q('#issueElapsed'); if(issue)issue.textContent=fmt(times.issue);
      const pause=q('#pauseBtn'); if(pause)pause.textContent=session.pausedAt?'다시, 작전 속으로':'잠깐 멈춤';
      const second=q('#secondHand'); if(second)second.style.transform=`rotate(${now.getSeconds()*6}deg)`;
      const minute=q('#minuteHand'); if(minute)minute.style.transform=`rotate(${now.getMinutes()*6+now.getSeconds()*.1}deg)`;
      const hour=q('#hourHand'); if(hour)hour.style.transform=`rotate(${((now.getHours()%12)*30)+now.getMinutes()*.5}deg)`;
      return {ok:true};
    }

    return Object.freeze({model,render,renderTick});
  }

  root.ReadyRebuildFocusView=Object.freeze({
    version:'READY_REBUILD_FOCUS_VIEW_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
