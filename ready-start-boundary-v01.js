(function(){
  'use strict';
  const VERSION='READY_START_BOUNDARY_V01';
  const clean=(v,max=180)=>String(v??'').trim().slice(0,max);
  const iso=()=>new Date().toISOString();
  const timers=new Map();
  function state(){
    const raw=localStorage.getItem('ready_start_boundary_v01');
    try{return raw?JSON.parse(raw):{promptCycles:{},alarms:{}}}catch{return {promptCycles:{},alarms:{}}}
  }
  function save(s){localStorage.setItem('ready_start_boundary_v01',JSON.stringify(s));return s}
  function openPromptCycle({taskRef,cycleRef}={}){
    const task=clean(taskRef),cycle=clean(cycleRef)||`ready-prompt-cycle:${task}:${Date.now()}`;
    if(!task)return null;
    const s=state(),current=s.promptCycles[task];
    if(current&&current.cycleRef===cycle)return current;
    s.promptCycles[task]={cycleRef:cycle,taskRef:task,openedAt:iso(),firstPromptAt:null,firstPromptEventRef:null};
    save(s); return s.promptCycles[task];
  }
  function recordPrompt({taskRef,promptEventRef,promptKind='EXTERNAL_REQUEST'}={}){
    const task=clean(taskRef),eventRef=clean(promptEventRef),kind=clean(promptKind,80);
    if(!task||!eventRef)return null;
    const s=state(),cur=s.promptCycles[task]||openPromptCycle({taskRef:task});
    const next=state(),cycle=next.promptCycles[task];
    if(!cycle.firstPromptAt){cycle.firstPromptAt=iso();cycle.firstPromptEventRef=eventRef;cycle.firstPromptKind=kind;save(next)}
    return cycle;
  }
  function promptStatus(taskRef){return state().promptCycles[clean(taskRef)]||null}
  function fireAlarm(alarmRef){
    const ref=clean(alarmRef),s=state(),a=s.alarms[ref]; if(!a||a.firedAt)return a||null;
    a.firedAt=iso(); a.fireEventRef=`ready-alarm-fired:${ref}`; save(s);
    window.dispatchEvent(new CustomEvent('ready-alarm-fired',{detail:{...a}})); return a;
  }
  function arm(ref,alarmAt){
    if(timers.has(ref))clearTimeout(timers.get(ref));
    const delay=Math.max(0,Date.parse(alarmAt)-Date.now());
    if(delay<=2147483647)timers.set(ref,setTimeout(()=>{timers.delete(ref);fireAlarm(ref)},delay));
  }
  function scheduleAlarm({taskRef,alarmRef,alarmAt,delayMs}={}){
    const task=clean(taskRef),target=alarmAt?new Date(alarmAt):new Date(Date.now()+Math.max(50,Number(delayMs)||0));
    if(!task||Number.isNaN(target.getTime()))return null;
    const ref=clean(alarmRef)||`ready-start-alarm:${task}:${target.toISOString()}`;
    const s=state(),existing=s.alarms[ref];
    if(existing){if(!existing.firedAt)arm(ref,existing.alarmAt);return existing}
    s.alarms[ref]={alarmRef:ref,taskRef:task,scheduledAt:iso(),alarmAt:target.toISOString(),firedAt:null,fireEventRef:null};
    save(s); arm(ref,target.toISOString()); return s.alarms[ref];
  }
  function currentAlarm(taskRef){
    const task=clean(taskRef);
    return Object.values(state().alarms).filter(a=>a.taskRef===task)
      .sort((a,b)=>Date.parse(b.alarmAt)-Date.parse(a.alarmAt))[0]||null;
  }
  for(const a of Object.values(state().alarms)){if(!a.firedAt){if(Date.parse(a.alarmAt)<=Date.now())fireAlarm(a.alarmRef);else arm(a.alarmRef,a.alarmAt)}}
  window.addEventListener('ready-external-prompt',event=>recordPrompt(event.detail||{}));
  window.ReadyStartBoundaryV01=Object.freeze({VERSION,openPromptCycle,recordPrompt,promptStatus,scheduleAlarm,fireAlarm,currentAlarm});
})();