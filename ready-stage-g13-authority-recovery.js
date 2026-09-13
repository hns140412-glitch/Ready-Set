(() => {
  'use strict';
  const VERSION='2026.09.09-stage-g1.3-session-bridge-only';
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
    if(!t)return false;
    const s=readCore();
    const label=[taskLabel(t),taskDetail(t)].filter(Boolean).join(' · ');
    s.selected=[];
    s.tasks=[label];
    s.activeSession=null;
    s.g13PlannerTask={id:t.id,date:TODAY(),status:t.status||'PLANNED',confirmationState:t.confirmationState||t.allocationState||null};
    writeCore(s);
    return true;
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
  window.ReadyStageG13={version:VERSION,render,syncCoreMission,resumePending,validate:()=>({version:VERSION,plannerDate:TODAY(),pendingSessionBridge:true,timeIsSecondary:true,timeSaveRewardRemoved:true,presentationOverlay:false,mutationObserver:false,titleMatchingBridge:false})};
  document.documentElement.dataset.readyStageG13=VERSION;
})();