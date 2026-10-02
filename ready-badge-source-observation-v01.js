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

  function recordPauseReturn({contract,sessionId,pauseStartedAt,pauseReason,resumeSource,at}={}){
    const session=clean(sessionId,160);
    const source=clean(resumeSource,80);
    const reason=clean(pauseReason,80);
    const pauseAt=Number(pauseStartedAt);
    if(!contract||!session||!Number.isFinite(pauseAt)||
       !['FOCUS_PAUSE_BUTTON','PAUSE_SHEET_BUTTON'].includes(source))return null;
    const conditionReturn=reason==='컨디션 조절';
    const behaviorCode=conditionReturn?'REST_AND_RETURN':'SELF_RETURN';
    const sourceContractId=conditionReturn?'READY_CONDITION_PAUSE_RETURN_V1':'READY_EXPLICIT_PAUSE_RETURN_V1';
    const eventId=`ready_badge_return_${session}_${pauseAt}`;
    return record(contract,{
      event_id:eventId,
      event_family:'RETURN_RECOVERY',
      behavior_code:behaviorCode,
      occurred_at:at||new Date().toISOString(),
      source_contract_id:sourceContractId,
      evidence_ref:`ready-pause-return:${session}:${pauseAt}`,
      explicit_child_action:true,
      payload:{
        sessionId:session,
        pauseEventRef:`ready-pause:${session}:${pauseAt}`,
        pauseReason:reason,
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


  function recordPreMealMicroComplete({contract,sessionId,taskRef,mealBufferRef,smallTaskRef,completionEventRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),meal=clean(mealBufferRef,180);
    const small=clean(smallTaskRef,180),completion=clean(completionEventRef,180);
    if(!contract||!session||!task||!meal||!small||!completion)return null;
    return record(contract,{
      event_id:\`ready_badge_pre_meal_micro_\${session}_\${task}\`,
      event_family:'GOAL_COMPLETE',
      behavior_code:'MICRO_TASK_COMPLETE',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_PRE_MEAL_MICRO_COMPLETE_V1',
      evidence_ref:\`ready-pre-meal-micro:\${session}:\${task}\`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,mealBufferRef:meal,smallTaskRef:small,completionEventRef:completion}
    });
  }

  function recordPostMealRestart({contract,sessionId,priorSessionRef,mealBufferRef,restartActionRef,at}={}){
    const session=clean(sessionId,160),prior=clean(priorSessionRef,180),meal=clean(mealBufferRef,180),action=clean(restartActionRef,180);
    if(!contract||!session||!prior||!meal||!action)return null;
    return record(contract,{
      event_id:\`ready_badge_post_meal_restart_\${session}_\${prior}\`,
      event_family:'RETURN_RECOVERY',
      behavior_code:'POST_MEAL_RESTART',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_POST_MEAL_RESTART_V1',
      evidence_ref:\`ready-post-meal-restart:\${session}:\${prior}\`,
      explicit_child_action:true,
      payload:{sessionId:session,priorSessionRef:prior,mealBufferRef:meal,restartActionRef:action}
    });
  }

  function recordFreeWindowSelfStart({contract,sessionId,openWindowRef,taskRef,childStartActionRef,at}={}){
    const session=clean(sessionId,160),windowRef=clean(openWindowRef,180),task=clean(taskRef,180),action=clean(childStartActionRef,180);
    if(!contract||!session||!windowRef||!task||!action)return null;
    return record(contract,{
      event_id:\`ready_badge_free_window_start_\${session}_\${task}\`,
      event_family:'TIME_CREATION',
      behavior_code:'SELF_START_IN_FREE_WINDOW',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_FREE_WINDOW_SELF_START_V1',
      evidence_ref:\`ready-free-window-start:\${session}:\${task}\`,
      explicit_child_action:true,
      payload:{sessionId:session,openWindowRef:windowRef,taskRef:task,childStartActionRef:action}
    });
  }

  function recordScheduledBreakReturn({contract,sessionId,breakRef,scheduledReturnAt,resumeActionRef,at}={}){
    const session=clean(sessionId,160),br=clean(breakRef,180),scheduled=clean(scheduledReturnAt,80),resume=clean(resumeActionRef,180);
    const resumedAt=clean(at,80)||new Date().toISOString();
    const scheduledMs=Date.parse(scheduled),resumedMs=Date.parse(resumedAt);
    if(!contract||!session||!br||!scheduled||!resume||!Number.isFinite(scheduledMs)||!Number.isFinite(resumedMs)||resumedMs>scheduledMs)return null;
    return record(contract,{
      event_id:\`ready_badge_break_return_\${session}_\${br}\`,
      event_family:'RETURN_RECOVERY',
      behavior_code:'BREAK_RETURN',
      occurred_at:resumedAt,
      source_contract_id:'READY_SCHEDULED_BREAK_RETURN_V1',
      evidence_ref:\`ready-scheduled-break-return:\${session}:\${br}\`,
      explicit_child_action:true,
      payload:{sessionId:session,breakRef:br,scheduledReturnAt:scheduled,resumeActionRef:resume}
    });
  }

  function recordBreakTimerReturn({contract,sessionId,timerRef,timerExpiredAt,resumeActionRef,at}={}){
    const session=clean(sessionId,160),timer=clean(timerRef,180),expired=clean(timerExpiredAt,80),resume=clean(resumeActionRef,180);
    const resumedAt=clean(at,80)||new Date().toISOString();
    const expiredMs=Date.parse(expired),resumedMs=Date.parse(resumedAt);
    if(!contract||!session||!timer||!expired||!resume||!Number.isFinite(expiredMs)||!Number.isFinite(resumedMs)||resumedMs<expiredMs)return null;
    return record(contract,{
      event_id:\`ready_badge_timer_return_\${session}_\${timer}\`,
      event_family:'RETURN_RECOVERY',
      behavior_code:'TIMER_RETURN',
      occurred_at:resumedAt,
      source_contract_id:'READY_BREAK_TIMER_RETURN_V1',
      evidence_ref:\`ready-break-timer-return:\${session}:\${timer}\`,
      explicit_child_action:true,
      payload:{sessionId:session,timerRef:timer,timerExpiredAt:expired,resumeActionRef:resume}
    });
  }



  function recordVoluntaryExtraAfterRequiredComplete({contract,sessionId,requiredSetRef,requiredCompleteEventRefs,selectedExtraTaskRef,extraChoiceRef,startedTaskRef,at}={}){
    const session=clean(sessionId,160),required=clean(requiredSetRef,180),selected=clean(selectedExtraTaskRef,180),choice=clean(extraChoiceRef,180),started=clean(startedTaskRef,180);
    const completed=Array.isArray(requiredCompleteEventRefs)?requiredCompleteEventRefs.map(x=>clean(x,180)).filter(Boolean):[];
    if(!contract||!session||!required||!completed.length||!selected||!choice||!started||selected!==started)return null;
    return record(contract,{
      event_id:\`ready_badge_extra_after_required_\${session}_\${selected}\`,
      event_family:'EXTRA_TASK',
      behavior_code:'VOLUNTARY_EXTRA_AFTER_REQUIRED_COMPLETE',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_VOLUNTARY_EXTRA_CHOICE_V1',
      evidence_ref:\`ready-extra-after-required:\${session}:\${selected}\`,
      explicit_child_action:true,
      payload:{sessionId:session,requiredSetRef:required,requiredCompleteEventRefs:completed,selectedExtraTaskRef:selected,extraChoiceRef:choice,startedTaskRef:started}
    });
  }

  function recordChildSequencePlan({contract,sessionId,choiceSetRef,orderedTaskRefs,sequenceConfirmActionRef,startedTaskRef,at}={}){
    const session=clean(sessionId,160),choiceSet=clean(choiceSetRef,180),confirm=clean(sequenceConfirmActionRef,180),started=clean(startedTaskRef,180);
    const ordered=Array.isArray(orderedTaskRefs)?orderedTaskRefs.map(x=>clean(x,160)).filter(Boolean):[];
    if(!contract||!session||!choiceSet||ordered.length<2||!confirm||!started||ordered[0]!==started)return null;
    return record(contract,{
      event_id:\`ready_badge_sequence_\${session}_\${choiceSet}\`,
      event_family:'SELF_PLANNING',
      behavior_code:'SELF_PLANNED_SEQUENCE',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_CHILD_SEQUENCE_PLAN_V1',
      evidence_ref:\`ready-child-sequence:\${session}:\${choiceSet}\`,
      explicit_child_action:true,
      payload:{sessionId:session,choiceSetRef:choiceSet,orderedTaskRefs:ordered,sequenceConfirmActionRef:confirm,startedTaskRef:started}
    });
  }

  function recordChildPriorityChoice({contract,sessionId,choiceSetRef,selectedTaskRef,childSelectionOrder,difficulty,startedTaskRef,mode,at}={}){
    const session=clean(sessionId,160),choiceSet=clean(choiceSetRef,180),selected=clean(selectedTaskRef,180),started=clean(startedTaskRef,180);
    const choiceMode=clean(mode,40).toUpperCase(),order=Number(childSelectionOrder),level=Number(difficulty);
    if(!contract||!session||!choiceSet||!selected||!started||!Number.isInteger(order)||order<1||!Number.isFinite(level))return null;
    if(!['HARD_FIRST','EASY_FIRST'].includes(choiceMode))return null;
    return record(contract,{
      event_id:\`ready_badge_priority_\${session}_\${choiceMode}_\${selected}\`,
      event_family:'SELF_CHOICE',
      behavior_code:choiceMode==='HARD_FIRST'?'PRIORITIZE_HARD':'WARM_START',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_CHILD_PRIORITY_CHOICE_V1',
      evidence_ref:\`ready-child-priority:\${session}:\${selected}\`,
      explicit_child_action:true,
      payload:{sessionId:session,choiceSetRef:choiceSet,selectedTaskRef:selected,childSelectionOrder:order,difficulty:level,startedTaskRef:started,mode:choiceMode}
    });
  }

  window.ReadyBadgeSourceObservationV01=Object.freeze({
    VERSION,CONTRACT,
    families:Object.freeze([...ALLOWED_FAMILIES]),
    normalize,record,recordTaskChoice,recordCarryOverCompletion,recordSelfCheckCompletion,recordPauseReturn,recordPreMealMicroComplete,recordPostMealRestart,recordFreeWindowSelfStart,recordScheduledBreakReturn,recordBreakTimerReturn,recordVoluntaryExtraAfterRequiredComplete,recordChildSequencePlan,recordChildPriorityChoice,hasForbiddenKeyDeep
  });
})();