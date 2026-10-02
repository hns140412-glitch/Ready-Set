(() => {
  'use strict';

  const VERSION='READY_BADGE_SOURCE_OBSERVATION_V1';
  const CONTRACT='TAKY_BADGE_SOURCE_OBSERVATION_V1';
  const ALLOWED_FAMILIES=new Set([
    'SELF_START','TIME_CREATION','EXTRA_TASK','FOCUS','RETURN_RECOVERY',
    'HELP_REQUEST','ERROR_DISCOVERY','RETRY','DEEP_THINKING','ISSUE_DURATION',
    'SELF_EXPLANATION','PLAN_ADAPTATION','SPECIAL_BEHAVIOR','WRITING_EXPLORATION',
    'GOAL_COMPLETE','SELF_CHOICE','SELF_PLANNING','HELP_USE','ERROR_CORRECTION',
    'ERROR_ANALYSIS','BREAKTHROUGH','CONCEPT_UNDERSTANDING','SELF_REGULATION',
    'STRATEGY_SWITCH','IMPROVEMENT'
  ]);
  const FORBIDDEN_KEYS=new Set([
    'score','grade','mastery','masteryLevel','mastery_level','ability','abilityLabel','ability_label',
    'intelligence','trait','characterTrait','character_trait','aiInference','ai_inference',
    'modelInference','model_inference','confidence','elapsedMs','elapsed_ms','silenceMs','silence_ms'
  ]);

  const clean=(value,max=180)=>typeof value==='string'?value.trim().slice(0,max):'';

  function hasForbiddenKeyDeep(value,depth=0){
    if(depth>4||value===null||typeof value!=='object')return false;
    if(Array.isArray(value))return value.some(x=>hasForbiddenKeyDeep(x,depth+1));
    for(const [key,item] of Object.entries(value)){
      if(FORBIDDEN_KEYS.has(key))return true;
      if(hasForbiddenKeyDeep(item,depth+1))return true;
    }
    return false;
  }

  function cleanPayload(payload={}){
    if(!payload||typeof payload!=='object'||Array.isArray(payload))return {};
    if(hasForbiddenKeyDeep(payload))throw new Error('READY_BADGE_SOURCE_WEAK_PROXY_FORBIDDEN');
    const out={};
    for(const [key,value] of Object.entries(payload).slice(0,24)){
      if(value===null||typeof value==='boolean'||Number.isFinite(value))out[key]=value;
      else if(typeof value==='string')out[key]=clean(value,180);
      else if(Array.isArray(value))out[key]=value.filter(x=>typeof x==='string').map(x=>clean(x,100)).slice(0,12);
    }
    return out;
  }

  function normalize(input={}){
    const eventId=clean(input.event_id||input.eventId,160);
    const family=clean(input.event_family||input.eventFamily,80).toUpperCase();
    const behaviorCode=clean(input.behavior_code||input.behaviorCode,120).toUpperCase();
    const sourceContractId=clean(input.source_contract_id||input.sourceContractId,140);
    const evidenceRef=clean(input.evidence_ref||input.evidenceRef,220);
    if(!eventId)throw new Error('READY_BADGE_SOURCE_EVENT_ID_REQUIRED');
    if(!ALLOWED_FAMILIES.has(family))throw new Error('READY_BADGE_SOURCE_FAMILY_INVALID');
    if(!behaviorCode)throw new Error('READY_BADGE_SOURCE_BEHAVIOR_CODE_REQUIRED');
    if(!sourceContractId)throw new Error('READY_BADGE_SOURCE_CONTRACT_REQUIRED');
    if(!evidenceRef)throw new Error('READY_BADGE_SOURCE_EVIDENCE_REF_REQUIRED');
    if(input.explicit_child_action!==true&&input.explicitChildAction!==true)
      throw new Error('READY_BADGE_SOURCE_EXPLICIT_CHILD_ACTION_REQUIRED');

    return Object.freeze({
      contract_version:CONTRACT,
      event_id:eventId,
      app_id:'READY_SET',
      event_family:family,
      behavior_code:behaviorCode,
      occurred_at:clean(input.occurred_at||input.occurredAt||input.at,80)||new Date().toISOString(),
      source_contract_id:sourceContractId,
      evidence_ref:evidenceRef,
      explicit_child_action:true,
      payload:cleanPayload(input.payload||{}),
      disposition:'OBSERVATION_ONLY',
      badge_award_authorized:false,
      economy_mutation_authorized:false,
      catalog_activation_allowed:false
    });
  }

  function record(contract,input={}){
    if(!contract||typeof contract!=='object')return null;
    const observation=normalize(input);
    const ledger=Array.isArray(contract.badge_source_observations)?contract.badge_source_observations:[];
    const existing=ledger.find(x=>x?.event_id===observation.event_id);
    if(existing)return existing;
    contract.badge_source_observations=[observation,...ledger].slice(0,500);
    try{window.dispatchEvent(new CustomEvent('ready-badge-source-observation',{detail:observation}))}catch{}
    return observation;
  }

  function recordTaskChoice({contract,sessionId,fromTask,toTask,at}={}){
    const session=clean(sessionId,160);
    const toId=clean(toTask?.task_id,160);
    if(!contract||!session||!toId)return null;
    const eventId=`ready_badge_choice_${session}`;
    return record(contract,{
      event_id:eventId,
      event_family:'SELF_CHOICE',
      behavior_code:'SELF_CHOICE',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_EXPLICIT_TASK_SWITCH_V1',
      evidence_ref:`ready-task-choice:${session}`,
      explicit_child_action:true,
      payload:{
        sessionId:session,
        fromTaskId:clean(fromTask?.task_id,160)||'',
        toTaskId:toId,
        toPlannerTodoId:clean(toTask?.planner_todo_id,160)||''
      }
    });
  }

  function recordPauseReturn({contract,sessionId,pauseStartedAt,resumeSource,at}={}){
    const session=clean(sessionId,160);
    const source=clean(resumeSource,80);
    const pauseAt=Number(pauseStartedAt);
    if(!contract||!session||!Number.isFinite(pauseAt)||
       !['FOCUS_PAUSE_BUTTON','PAUSE_SHEET_BUTTON'].includes(source))return null;
    const eventId=`ready_badge_return_${session}_${pauseAt}`;
    return record(contract,{
      event_id:eventId,
      event_family:'RETURN_RECOVERY',
      behavior_code:'SELF_RETURN',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_EXPLICIT_PAUSE_RETURN_V1',
      evidence_ref:`ready-pause-return:${session}:${pauseAt}`,
      explicit_child_action:true,
      payload:{
        sessionId:session,
        pauseEventRef:`ready-pause:${session}:${pauseAt}`,
        resumeSource:source
      }
    });
  }

  function recordSelfCheckCompletion({contract,sessionId,tasks,at}={}){
    const session=clean(sessionId,160);
    const list=Array.isArray(tasks)?tasks:[];
    if(!contract||!session||!list.length||list.some(t=>t?.state==='PENDING'))return null;
    const eventId=`ready_badge_selfcheck_${session}`;
    return record(contract,{
      event_id:eventId,
      event_family:'GOAL_COMPLETE',
      behavior_code:'SELF_CHECK_COMPLETE',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_WRAP_UP_SELF_CHECK_V1',
      evidence_ref:`ready-wrap-self-check:${session}`,
      explicit_child_action:true,
      payload:{
        sessionId:session,
        resolvedTaskIds:list.map(t=>clean(t?.task_id,160)).filter(Boolean),
        resolvedStates:list.map(t=>clean(t?.state,80)).filter(Boolean)
      }
    });
  }

  function recordCarryOverCompletion({contract,sessionId,task,plannerTodo,completionSource,at}={}){
    const source=clean(completionSource,80);
    if(!['WRAP_UP','VOICE_WRAP_UP'].includes(source))return null;
    const session=clean(sessionId,160);
    const taskId=clean(task?.task_id,160);
    const todoId=clean(plannerTodo?.todo_id,160);
    const carryOverId=clean(plannerTodo?.carry_over_id||plannerTodo?.provenance?.carry_over_id,160);
    const sourceTodoId=clean(plannerTodo?.provenance?.source_todo_id,160);
    const isCarry=plannerTodo?.source==='PLANNER_V2_CARRY_OVER'||!!carryOverId;
    if(!contract||!session||!taskId||!todoId||!isCarry)return null;
    const eventId=`ready_badge_carry_${session}_${taskId}_${todoId}`;
    return record(contract,{
      event_id:eventId,
      event_family:'GOAL_COMPLETE',
      behavior_code:'CARRY_OVER_COMPLETE',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_CARRY_OVER_COMPLETION_V1',
      evidence_ref:`ready-carry-complete:${session}:${todoId}`,
      explicit_child_action:true,
      payload:{
        sessionId:session,
        taskId,
        plannerTodoId:todoId,
        carryOverId,
        sourceTodoId,
        completionSource:source
      }
    });
  }

  window.ReadyBadgeSourceObservationV01=Object.freeze({
    VERSION,CONTRACT,
    families:Object.freeze([...ALLOWED_FAMILIES]),
    normalize,record,recordTaskChoice,recordCarryOverCompletion,recordSelfCheckCompletion,recordPauseReturn,hasForbiddenKeyDeep
  });
})();