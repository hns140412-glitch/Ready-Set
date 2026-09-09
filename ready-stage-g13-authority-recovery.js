(() => {
  'use strict';
  const VERSION='2026.09.09-stage-g1.3-authority-recovery';
  const TODAY=()=>new Date().toLocaleDateString('sv-SE');
  const PENDING_KEY='ready_g13_pending_task';
  const CORE_KEY='readyset_state';

  function readCore(){try{return JSON.parse(localStorage.getItem(CORE_KEY)||'null')||{}}catch{return {}}}
  function writeCore(v){localStorage.setItem(CORE_KEY,JSON.stringify(v))}
  function plannerTask(id){
    const p=window.ReadyAssignmentModel?.load?.()||{};
    return (p.days?.[TODAY()]?.tasks||[]).find(t=>String(t.id)===String(id))||null;
  }
  function taskLabel(t){return t?.title||t?.subject||'오늘의 할 일'}
  function taskDetail(t){return t?.volume||t?.unitLabel||t?.note||''}
  function syncCoreMission(t){
    const s=readCore();
    const label=[taskLabel(t),taskDetail(t)].filter(Boolean).join(' · ');
    s.selected=[];
    s.tasks=[label];
    s.activeSession=null;
    s.g13PlannerTask={id:t.id,date:TODAY(),status:t.status||'PLANNED',confirmationState:t.confirmationState||t.allocationState||null};
    writeCore(s);
  }
  function bindHomeTasks(){
    document.querySelectorAll('#homeTodayTodoList .g12-home-task').forEach(btn=>{
      if(btn.dataset.g13Bound)return;btn.dataset.g13Bound='1';
      if(btn.tagName!=='BUTTON')return;
      btn.addEventListener('click',e=>{
        const title=btn.querySelector('b')?.textContent?.trim();
        const tasks=window.ReadyStageG12?.getTodayTasks?.()||[];
        const t=tasks.find(x=>(x.title||x.subject||'할 일')===title);
        if(!t)return;
        e.preventDefault();e.stopImmediatePropagation();
        syncCoreMission(t);
        sessionStorage.setItem(PENDING_KEY,String(t.id));
        location.reload();
      },true);
    });
  }
  function resumePending(){
    const id=sessionStorage.getItem(PENDING_KEY);if(!id)return;
    sessionStorage.removeItem(PENDING_KEY);
    const t=plannerTask(id);if(!t)return;
    setTimeout(()=>document.querySelector('#homeView [data-nav="mission"]')?.click(),80);
  }
  function recoverCopy(){
    const heading=[...document.querySelectorAll('#missionView h1,#missionView h2,#missionView h3')].find(x=>/목표 시간/.test(x.textContent||''));
    if(heading)heading.textContent='3. 집중 타이머를 정해볼까요? (선택)';
    document.querySelectorAll('#missionView p,#missionView small').forEach(el=>{
      if(/목표 시간/.test(el.textContent||'')&&/정하/.test(el.textContent||''))el.textContent='시간은 숙제 분량을 정하는 기준이 아니라, 이번 탐험을 돌아보기 위한 보조 기록이에요.';
    });
    document.querySelectorAll('[data-guide],#homeGuideName').forEach(()=>{});
    document.querySelectorAll('body *').forEach(el=>{
      if(el.children.length)return;
      const t=(el.textContent||'').trim();
      if(t==='MY GUIDE')el.textContent='MY EXPLORER';
      if(t==='길잡이')el.textContent='탐험대';
    });
  }
  function recoverResultSemantics(){
    const label=document.getElementById('deltaLabel');
    if(label&&/TIME SAVE|차이/.test(label.textContent||''))label.textContent='목표와 차이';
    const headline=document.getElementById('resultHeadline');
    const line=document.getElementById('resultLine');
    if(headline&&/시계|계산대로|오늘 좀 했습니다/.test(headline.textContent||''))headline.textContent='오늘의 탐험 기록';
    if(line&&/시계|늦었습니다/.test(line.textContent||''))line.textContent='빠르거나 오래 걸린 것보다, 오늘 어떻게 해냈는지를 기록해요.';
  }
  function annotateUnconfirmed(){
    const tasks=window.ReadyStageG12?.getTodayTasks?.()||[];
    document.querySelectorAll('#homeTodayTodoList .g12-home-task').forEach(btn=>{
      const title=btn.querySelector('b')?.textContent?.trim();const t=tasks.find(x=>(x.title||x.subject||'할 일')===title);if(!t)return;
      const uncertain=(t.confirmationState&&t.confirmationState!=='FACT_CONFIRMED')||String(t.allocationState||'').includes('PROVISIONAL')||t.origin==='CHILD_ADDED';
      if(uncertain){btn.dataset.g13Unconfirmed='1';const small=btn.querySelector('small');if(small&&!/확인/.test(small.textContent))small.textContent=`${small.textContent} · 확인 필요`;}
    });
  }
  function render(){bindHomeTasks();annotateUnconfirmed();recoverCopy();recoverResultSemantics()}
  const observer=new MutationObserver(()=>render());observer.observe(document.body,{subtree:true,childList:true});
  render();resumePending();
  window.ReadyStageG13={version:VERSION,render,validate:()=>({version:VERSION,plannerDate:TODAY(),pendingSessionBridge:true,timeIsSecondary:true,timeSaveRewardRemoved:true})};
  document.documentElement.dataset.readyStageG13=VERSION;
})();