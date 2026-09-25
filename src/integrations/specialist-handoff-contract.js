(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.ReadySpecialistHandoffContract=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='READY_SPECIALIST_HANDOFF_V01';
  const clean=(v,max=240)=>String(v??'').trim().slice(0,max);
  const list=(v,max=16)=>Array.isArray(v)?v.map(x=>clean(x,100)).filter(Boolean).slice(0,max):[];

  function learningContext(task={}){
    return {
      contract_version:'READY_LEARNING_CONTEXT_V1',
      learning_unit_id:clean(task.learning_unit_id,120)||null,
      analysis_id:clean(task.analysis_id,120)||null,
      assignment_id:clean(task.assignment_id,120)||null,
      source_range:clean(task.source_range,160)||null,
      workbook_ref_id:clean(task.workbook_ref_id,120)||null,
      subject:clean(task.subject,80)||null,
      concept_skill_target:clean(task.concept_skill_target,180)||null,
      activity_types:list(task.activity_types,12),
      cognitive_load_profile:list(task.cognitive_load_profile,12),
      divisible_boundary:clean(task.divisible_boundary,80)||null,
      confidence:Number.isFinite(task.confidence)?Math.max(0,Math.min(1,task.confidence)):null,
      unresolved_flags:list(task.unresolved_flags,12),
      provenance:{
        engine:'TAKY_LEARNING_ENGINE_CORE',
        adapter:'READY_SPECIALIST_HANDOFF',
        version:VERSION,
        confirmation_state:'ROUTED'
      }
    };
  }

  function encodeLearningContext(task={}){
    const raw=JSON.stringify(learningContext(task));
    if(typeof Buffer!=='undefined') return Buffer.from(raw,'utf8').toString('base64url');
    const bytes=new TextEncoder().encode(raw);
    let binary=''; for(const b of bytes) binary+=String.fromCharCode(b);
    return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }

  function sourceApp(value){
    const v=clean(value,40);
    return ['hide-seek','snap-pop'].includes(v)?v:null;
  }

  function authorized(task={},app){
    const normalized=sourceApp(app); if(!normalized)return false;
    const allowed=Array.isArray(task.route_plan?.allowed_specialists)?task.route_plan.allowed_specialists:[];
    return allowed.includes(normalized);
  }

  function normalizeReturnEvent(raw){
    if(!raw||typeof raw!=='object')return null;
    const payload=raw.payload&&typeof raw.payload==='object'?raw.payload:{};
    const taskContext=payload.taskContext&&typeof payload.taskContext==='object'?payload.taskContext:{};
    const app=sourceApp(raw.app||raw.source||payload.sourceApp);
    const type=clean(raw.type||raw.event_type,60)||null;
    const taskState=clean(
      payload.taskState||
      (type==='TASK_COMPLETED'?'COMPLETED':type==='TASK_BLOCKED'?'BLOCKED':type==='TASK_PARTIAL'?'PARTIAL':type==='HELP_NEEDED'?'HELP_NEEDED':'')
    ,40)||null;
    return {
      event_id:clean(raw.event_id,160)||null,
      observed_at:clean(raw.occurred_at||raw.at||payload.observed_at||payload.at,80)||null,
      type,
      from_app:app,
      session_id:clean(raw.session_id||taskContext.session_id,160)||null,
      task_id:clean(raw.task_id||taskContext.task_id,160)||null,
      lap_id:clean(raw.lap_id||taskContext.lap_id,160)||null,
      task_state:taskState,
      payload
    };
  }

  return Object.freeze({version:VERSION,learningContext,encodeLearningContext,sourceApp,authorized,normalizeReturnEvent});
});
