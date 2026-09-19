(() => {
  'use strict';
  const VERSION='2026.09.19-stage-g1.3-exploration-multiselect';
  const TODAY=()=>new Date().toLocaleDateString('sv-SE');
  const PENDING_KEY='ready_g13_pending_task';
  const CORE_KEY='readyset_state';

  function readCore(){try{return JSON.parse(localStorage.getItem(CORE_KEY)||'null')||{}}catch{return {}}}
  function writeCore(v){localStorage.setItem(CORE_KEY,JSON.stringify(v))}
  function plannerDay(){
    const p=window.ReadyAssignmentModel?.load?.()||{};
    return p.days?.[TODAY()]||null;
  }
  function plannerTask(id){
    return (plannerDay()?.tasks||[]).find(t=>String(t.id)===String(id))||null;
  }
  function taskLabel(t){return t?.title||t?.subject||'오늘의 할 일'}
  function taskDetail(t){return t?.volume||t?.unitLabel||t?.note||''}
  function syncCoreMission(t){
    const day=plannerDay();if(!day)return false;
    const s=readCore();if(s.activeSession)return false;
    if(t&&t.status!=='COMPLETED')t.selected=true;
    const chosen=(day.tasks||[]).filter(x=>x.selected&&x.status!=='COMPLETED');
    s.selected=[];
    s.tasks=chosen.map(x=>[taskLabel(x),taskDetail(x)].filter(Boolean).join(' · '));
    s.g13PlannerTasks=chosen.map(x=>({id:x.id,date:TODAY(),status:x.status||'PLANNED',confirmationState:x.confirmationState||x.allocationState||null}));
    if(s.g13PlannerTasks[0])s.g13PlannerTask=s.g13PlannerTasks[0];else delete s.g13PlannerTask;
    writeCore(s);
    return chosen.length>0;
  }
  function resumePending(){
    const id=sessionStorage.getItem(PENDING_KEY);if(!id)return false;
    sessionStorage.removeItem(PENDING_KEY);
    const t=plannerTask(id);if(!t)return false;
    syncCoreMission(t);
    const mission=document.getElementById('missionView');
    if(mission){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v===mission));window.scrollTo(0,0);}
    return true;
  }
  function render(){return true}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',resumePending,{once:true});else resumePending();
  window.ReadyStageG13={version:VERSION,render,syncCoreMission,resumePending,validate:()=>({version:VERSION,plannerDate:TODAY(),pendingSessionBridge:true,multiTaskCoreSync:true,activeSessionNeverCleared:true,timeIsSecondary:true,timeSaveRewardRemoved:true,presentationOverlay:false,mutationObserver:false,titleMatchingBridge:false})};
  document.documentElement.dataset.readyStageG13=VERSION;
})();