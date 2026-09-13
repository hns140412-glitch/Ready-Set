(() => {
  'use strict';
  const VERSION='2026.09.09-planner-selection-bridge-v1';
  const PLANNER_KEY='readyset_planner_v1';
  const CORE_KEY='readyset_state';
  const today=()=>new Date().toLocaleDateString('sv-SE');
  const read=(key,fallback={})=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}};
  const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  function bindPlannerTask(id,selected){
    const planner=read(PLANNER_KEY,{});
    const day=planner.days?.[today()];
    if(!day)return false;
    const task=(day.tasks||[]).find(t=>String(t.id)===String(id));
    if(!task)return false;
    const core=read(CORE_KEY,{});
    if(selected){
      day.tasks=(day.tasks||[]).map(t=>({...t,selected:String(t.id)===String(id)}));
      core.g13PlannerTask={id:task.id,date:today(),status:task.status||'PLANNED',confirmationState:task.confirmationState||task.allocationState||null};
      core.tasks=[[task.title||task.subject,task.volume||task.unitLabel||task.note].filter(Boolean).join(' · ')];
      core.selected=[];
      core.activeSession=null;
    }else{
      day.tasks=(day.tasks||[]).map(t=>String(t.id)===String(id)?{...t,selected:false}:t);
      if(String(core.g13PlannerTask?.id)===String(id)){
        delete core.g13PlannerTask;
        core.tasks=[];
        core.selected=[];
        core.activeSession=null;
      }
    }
    write(PLANNER_KEY,planner);write(CORE_KEY,core);
    return true;
  }
  document.addEventListener('change',e=>{
    const ch=e.target.closest?.('[data-rsf-select]');
    if(!ch)return;
    if(bindPlannerTask(ch.dataset.rsfSelect,ch.checked)) location.reload();
  });
  window.ReadyPlannerSelectionBridgeV1={version:VERSION,bindPlannerTask,validate:()=>({version:VERSION,stablePlannerId:true,coreBridge:true,reloadAfterSelection:true})};
  document.documentElement.dataset.readyPlannerSelectionBridge=VERSION;
})();