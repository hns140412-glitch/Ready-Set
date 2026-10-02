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
      event_id:`ready_badge_pre_meal_micro_${session}_${task}`,
      event_family:'GOAL_COMPLETE',
      behavior_code:'MICRO_TASK_COMPLETE',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_PRE_MEAL_MICRO_COMPLETE_V1',
      evidence_ref:`ready-pre-meal-micro:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,mealBufferRef:meal,smallTaskRef:small,completionEventRef:completion}
    });
  }

  function recordPostMealRestart({contract,sessionId,priorSessionRef,mealBufferRef,restartActionRef,at}={}){
    const session=clean(sessionId,160),prior=clean(priorSessionRef,180),meal=clean(mealBufferRef,180),action=clean(restartActionRef,180);
    if(!contract||!session||!prior||!meal||!action)return null;
    return record(contract,{
      event_id:`ready_badge_post_meal_restart_${session}_${prior}`,
      event_family:'RETURN_RECOVERY',
      behavior_code:'POST_MEAL_RESTART',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_POST_MEAL_RESTART_V1',
      evidence_ref:`ready-post-meal-restart:${session}:${prior}`,
      explicit_child_action:true,
      payload:{sessionId:session,priorSessionRef:prior,mealBufferRef:meal,restartActionRef:action}
    });
  }

  function recordFreeWindowSelfStart({contract,sessionId,openWindowRef,taskRef,childStartActionRef,at}={}){
    const session=clean(sessionId,160),windowRef=clean(openWindowRef,180),task=clean(taskRef,180),action=clean(childStartActionRef,180);
    if(!contract||!session||!windowRef||!task||!action)return null;
    return record(contract,{
      event_id:`ready_badge_free_window_start_${session}_${task}`,
      event_family:'TIME_CREATION',
      behavior_code:'SELF_START_IN_FREE_WINDOW',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_FREE_WINDOW_SELF_START_V1',
      evidence_ref:`ready-free-window-start:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,openWindowRef:windowRef,taskRef:task,childStartActionRef:action}
    });
  }

  function recordPreparationToStart({contract,sessionId,taskRef,checklistId,checkedItems,preparationConfirmActionRef,startedTaskRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),checklist=clean(checklistId,120),confirm=clean(preparationConfirmActionRef,180),started=clean(startedTaskRef,180);
    const items=Array.isArray(checkedItems)?checkedItems.map(x=>clean(x,100)).filter(Boolean):[];
    const required=['TASK_MATERIALS_READY','WORKSPACE_READY'];
    if(!contract||!session||!task||checklist!=='READY_PRESTART_CHECKLIST_V1'||!confirm||!started||started!==task||required.some(x=>!items.includes(x)))return null;
    return record(contract,{
      event_id:`ready_badge_preparation_complete_${session}_${task}`,
      event_family:'GOAL_COMPLETE',
      behavior_code:'PREPARATION_COMPLETE',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_PREPARATION_TO_START_V1',
      evidence_ref:`ready-preparation-complete:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,checklistId:checklist,checkedItems:required,preparationConfirmActionRef:confirm,startedTaskRef:started}
    });
  }

  function recordResponsiveStart({contract,sessionId,taskRef,promptEventRef,promptKind,childStartActionRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),prompt=clean(promptEventRef,180),kind=clean(promptKind,80),action=clean(childStartActionRef,180);
    if(!contract||!session||!task||!prompt||kind!=='MISSION_BRIEFING'||!action)return null;
    return record(contract,{
      event_id:`ready_badge_responsive_start_${session}_${task}`,
      event_family:'SELF_START',
      behavior_code:'RESPONSIVE_START',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_NAMED_PROMPT_RESPONSE_START_V1',
      evidence_ref:`ready-responsive-start:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,promptEventRef:prompt,promptKind:kind,childStartActionRef:action}
    });
  }

  function recordScheduledBreakReturn({contract,sessionId,breakRef,scheduledReturnAt,resumeActionRef,at}={}){
    const session=clean(sessionId,160),br=clean(breakRef,180),scheduled=clean(scheduledReturnAt,80),resume=clean(resumeActionRef,180);
    const resumedAt=clean(at,80)||new Date().toISOString();
    const scheduledMs=Date.parse(scheduled),resumedMs=Date.parse(resumedAt);
    if(!contract||!session||!br||!scheduled||!resume||!Number.isFinite(scheduledMs)||!Number.isFinite(resumedMs)||resumedMs>scheduledMs)return null;
    return record(contract,{
      event_id:`ready_badge_break_return_${session}_${br}`,
      event_family:'RETURN_RECOVERY',
      behavior_code:'BREAK_RETURN',
      occurred_at:resumedAt,
      source_contract_id:'READY_SCHEDULED_BREAK_RETURN_V1',
      evidence_ref:`ready-scheduled-break-return:${session}:${br}`,
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
      event_id:`ready_badge_timer_return_${session}_${timer}`,
      event_family:'RETURN_RECOVERY',
      behavior_code:'TIMER_RETURN',
      occurred_at:resumedAt,
      source_contract_id:'READY_BREAK_TIMER_RETURN_V1',
      evidence_ref:`ready-break-timer-return:${session}:${timer}`,
      explicit_child_action:true,
      payload:{sessionId:session,timerRef:timer,timerExpiredAt:expired,resumeActionRef:resume}
    });
  }










  function recordTaskRestart({contract,sessionId,taskRef,restartActionRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),action=clean(restartActionRef,180);
    if(!contract||!session||!task||!action)return null;
    return record(contract,{
      event_id:'ready_badge_task_restart_'+session+'_'+task,
      event_family:'RETURN_RECOVERY',
      behavior_code:'TASK_RESTART',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_EXPLICIT_TASK_RESTART_V1',
      evidence_ref:'ready-task-restart:'+session+':'+task,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,restartActionRef:action}
    });
  }

  function recordCarefulComplete({contract,sessionId,taskRef,plannedMinutes,actualMinutes,checkActionRef,completionEventRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),check=clean(checkActionRef,180),completion=clean(completionEventRef,180);
    const planned=Number(plannedMinutes),actual=Number(actualMinutes);
    if(!contract||!session||!task||!check||!completion||!Number.isFinite(planned)||planned<=0||!Number.isFinite(actual)||actual<=planned)return null;
    return record(contract,{
      event_id:'ready_badge_careful_complete_'+session+'_'+task,
      event_family:'GOAL_COMPLETE',
      behavior_code:'ACCURACY_COMPLETE',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_CAREFUL_OVERRUN_COMPLETE_V1',
      evidence_ref:'ready-careful-complete:'+session+':'+task,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,plannedMinutes:planned,actualMinutes:actual,checkActionRef:check,completionEventRef:completion}
    });
  }

  function recordFocusReturn({contract,sessionId,taskRef,returnActionRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),action=clean(returnActionRef,180);
    if(!contract||!session||!task||!action)return null;
    return record(contract,{
      event_id:'ready_badge_focus_return_'+session+'_'+task+'_'+action,
      event_family:'RETURN_RECOVERY',
      behavior_code:'FOCUS_RETURN',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_EXPLICIT_FOCUS_RETURN_V1',
      evidence_ref:'ready-focus-return:'+session+':'+task,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,returnActionRef:action}
    });
  }

  function recordMeaningfulOverrun({contract,sessionId,taskRef,plannedMinutes,actualMinutes,meaningArtifactRef,meaningText,completionEventRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),artifact=clean(meaningArtifactRef,180),note=clean(meaningText,180),completion=clean(completionEventRef,180);
    const planned=Number(plannedMinutes),actual=Number(actualMinutes);
    if(!contract||!session||!task||!artifact||!note||!completion||!Number.isFinite(planned)||planned<=0||!Number.isFinite(actual)||actual<=planned)return null;
    return record(contract,{
      event_id:'ready_badge_meaningful_overrun_'+session+'_'+task,
      event_family:'ISSUE_DURATION',
      behavior_code:'MEANINGFUL_OVERRUN',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_CHILD_MEANINGFUL_OVERRUN_V1',
      evidence_ref:'ready-meaningful-overrun:'+session+':'+task,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,plannedMinutes:planned,actualMinutes:actual,meaningArtifactRef:artifact,meaningText:note,completionEventRef:completion}
    });
  }

  function recordRootCause({contract,sessionId,taskRef,causeArtifactRef,causeText,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),artifact=clean(causeArtifactRef,180),note=clean(causeText,180);
    if(!contract||!session||!task||!artifact||!note)return null;
    return record(contract,{
      event_id:`ready_badge_root_cause_${session}_${task}_${artifact}`,
      event_family:'ERROR_ANALYSIS',
      behavior_code:'ROOT_CAUSE',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_CHILD_ROOT_CAUSE_V1',
      evidence_ref:`ready-root-cause:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,causeArtifactRef:artifact,causeText:note}
    });
  }

  function recordConceptUnderstanding({contract,sessionId,taskRef,explanationArtifactRef,explanationText,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),artifact=clean(explanationArtifactRef,180),note=clean(explanationText,180);
    if(!contract||!session||!task||!artifact||!note)return null;
    return record(contract,{
      event_id:`ready_badge_concept_${session}_${task}_${artifact}`,
      event_family:'CONCEPT_UNDERSTANDING',
      behavior_code:'CONCEPT_UNDERSTANDING',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_CHILD_CONCEPT_EXPLANATION_V1',
      evidence_ref:`ready-concept-understanding:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,explanationArtifactRef:artifact,explanationText:note}
    });
  }

  function recordSelfExplanation({contract,sessionId,taskRef,explanationArtifactRef,explanationText,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),artifact=clean(explanationArtifactRef,180),note=clean(explanationText,180);
    if(!contract||!session||!task||!artifact||!note)return null;
    return record(contract,{
      event_id:`ready_badge_self_explain_${session}_${task}_${artifact}`,
      event_family:'SELF_EXPLANATION',
      behavior_code:'SELF_EXPLANATION',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_CHILD_SELF_EXPLANATION_V1',
      evidence_ref:`ready-self-explanation:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,explanationArtifactRef:artifact,explanationText:note}
    });
  }

  function recordStrategySwitch({contract,sessionId,taskRef,fromStrategy,toStrategy,switchActionRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),from=clean(fromStrategy,100),to=clean(toStrategy,100),action=clean(switchActionRef,180);
    if(!contract||!session||!task||!from||!to||from===to||!action)return null;
    return record(contract,{
      event_id:`ready_badge_strategy_switch_${session}_${task}_${action}`,
      event_family:'STRATEGY_SWITCH',
      behavior_code:'STRATEGY_SWITCH',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_CHILD_STRATEGY_SWITCH_V1',
      evidence_ref:`ready-strategy-switch:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,fromStrategy:from,toStrategy:to,switchActionRef:action}
    });
  }

  function recordBlockResolved({contract,sessionId,taskRef,strategySwitchActionRef,completionEventRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),strategy=clean(strategySwitchActionRef,180),completion=clean(completionEventRef,180);
    if(!contract||!session||!task||!strategy||!completion)return null;
    return record(contract,{
      event_id:`ready_badge_block_resolved_${session}_${task}_${strategy}`,
      event_family:'BREAKTHROUGH',
      behavior_code:'BLOCK_RESOLVED',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_CHILD_STRATEGY_TO_COMPLETION_V1',
      evidence_ref:`ready-block-resolved:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,strategySwitchActionRef:strategy,completionEventRef:completion}
    });
  }

  function recordDistractionResistance({contract,sessionId,taskRef,resistanceActionRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),action=clean(resistanceActionRef,180);
    if(!contract||!session||!task||!action)return null;
    return record(contract,{
      event_id:`ready_badge_distraction_${session}_${task}_${action}`,
      event_family:'SELF_REGULATION',
      behavior_code:'DISTRACTION_RESISTANCE',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_EXPLICIT_DISTRACTION_RESISTANCE_V1',
      evidence_ref:`ready-distraction-resistance:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,resistanceActionRef:action}
    });
  }

  function recordSelfNoticeReturn({contract,sessionId,taskRef,noticeActionRef,returnActionRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),notice=clean(noticeActionRef,180),returned=clean(returnActionRef,180);
    if(!contract||!session||!task||!notice||!returned)return null;
    return record(contract,{
      event_id:`ready_badge_self_notice_return_${session}_${task}_${notice}`,
      event_family:'RETURN_RECOVERY',
      behavior_code:'SELF_NOTICE_RETURN',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_EXPLICIT_SELF_NOTICE_RETURN_V1',
      evidence_ref:`ready-self-notice-return:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,noticeActionRef:notice,returnActionRef:returned}
    });
  }

  function recordSingleTaskFocus({contract,sessionId,taskRef,focusCommitActionRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),action=clean(focusCommitActionRef,180);
    if(!contract||!session||!task||!action)return null;
    return record(contract,{
      event_id:`ready_badge_single_task_focus_${session}_${task}_${action}`,
      event_family:'FOCUS',
      behavior_code:'SINGLE_TASK_FOCUS',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_EXPLICIT_SINGLE_TASK_FOCUS_V1',
      evidence_ref:`ready-single-task-focus:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,focusCommitActionRef:action}
    });
  }

  function recordSustainedFocusCompletion({contract,sessionId,taskRef,focusCommitEventRef,completionEventRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),focus=clean(focusCommitEventRef,180),completion=clean(completionEventRef,180);
    if(!contract||!session||!task||!focus||!completion)return null;
    return record(contract,{
      event_id:`ready_badge_sustained_focus_${session}_${task}`,
      event_family:'FOCUS',
      behavior_code:'LONG_FOCUS',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_CHILD_SUSTAINED_FOCUS_V1',
      evidence_ref:`ready-sustained-focus:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,focusCommitEventRef:focus,completionEventRef:completion}
    });
  }

  function recordQuietImmersionCompletion({contract,sessionId,taskRef,quietModeActionRef,completionEventRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),quiet=clean(quietModeActionRef,180),completion=clean(completionEventRef,180);
    if(!contract||!session||!task||!quiet||!completion)return null;
    return record(contract,{
      event_id:`ready_badge_quiet_immersion_${session}_${task}`,
      event_family:'FOCUS',
      behavior_code:'QUIET_IMMERSION',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_CHILD_QUIET_IMMERSION_V1',
      evidence_ref:`ready-quiet-immersion:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,quietModeActionRef:quiet,completionEventRef:completion}
    });
  }

  function recordRereadCheck({contract,sessionId,taskRef,rereadActionRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),action=clean(rereadActionRef,180);
    if(!contract||!session||!task||!action)return null;
    return record(contract,{
      event_id:`ready_badge_reread_${session}_${task}_${action}`,
      event_family:'SELF_REGULATION',
      behavior_code:'REREAD_CHECK',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_EXPLICIT_REREAD_CHECK_V1',
      evidence_ref:`ready-reread-check:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,rereadActionRef:action}
    });
  }

  function recordReflectBeforeProceed({contract,sessionId,taskRef,reflectionActionRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),action=clean(reflectionActionRef,180);
    if(!contract||!session||!task||!action)return null;
    return record(contract,{
      event_id:`ready_badge_reflect_${session}_${task}_${action}`,
      event_family:'SELF_REGULATION',
      behavior_code:'REFLECT_BEFORE_PROCEED',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_EXPLICIT_REFLECTION_V1',
      evidence_ref:`ready-reflect-before-proceed:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,reflectionActionRef:action}
    });
  }

  function recordStopAtRightTime({contract,sessionId,taskRef,stopActionRef,sessionEndRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),action=clean(stopActionRef,180),ended=clean(sessionEndRef,180);
    if(!contract||!session||!task||!action||!ended)return null;
    return record(contract,{
      event_id:`ready_badge_stop_right_${session}_${task}`,
      event_family:'SELF_REGULATION',
      behavior_code:'STOP_AT_RIGHT_TIME',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_EXPLICIT_STOP_AT_RIGHT_TIME_V1',
      evidence_ref:`ready-stop-at-right-time:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,stopActionRef:action,sessionEndRef:ended}
    });
  }

  function recordFastCompleteWithCheck({contract,sessionId,taskRef,plannedMinutes,actualMinutes,checkActionRef,completionEventRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),check=clean(checkActionRef,180),completion=clean(completionEventRef,180);
    const planned=Number(plannedMinutes),actual=Number(actualMinutes);
    if(!contract||!session||!task||!check||!completion||!Number.isFinite(planned)||planned<=0||!Number.isFinite(actual)||actual<0)return null;
    if(actual>planned*0.7)return null;
    return record(contract,{
      event_id:`ready_badge_fast_checked_${session}_${task}`,
      event_family:'GOAL_COMPLETE',
      behavior_code:'FAST_COMPLETE_WITH_CHECK',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_FAST_COMPLETE_WITH_CHECK_V1',
      evidence_ref:`ready-fast-checked:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,plannedMinutes:planned,actualMinutes:actual,checkActionRef:check,completionEventRef:completion,thresholdRatio:0.7}
    });
  }

  function recordChildChunkedTask({contract,sessionId,taskRef,childChunkRefs,chunkConfirmActionRef,completedChunkRefs,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),confirm=clean(chunkConfirmActionRef,180);
    const chunks=Array.isArray(childChunkRefs)?childChunkRefs.map(x=>clean(x,160)).filter(Boolean):[];
    const completed=Array.isArray(completedChunkRefs)?completedChunkRefs.map(x=>clean(x,160)).filter(Boolean):[];
    if(!contract||!session||!task||chunks.length<2||!confirm||completed.length!==chunks.length||chunks.some(x=>!completed.includes(x)))return null;
    return record(contract,{
      event_id:`ready_badge_chunked_${session}_${task}`,
      event_family:'GOAL_COMPLETE',
      behavior_code:'CHILD_CHUNKED_TASK_COMPLETE',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_CHILD_CHUNKED_TASK_V1',
      evidence_ref:`ready-child-chunked:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,childChunkRefs:chunks,chunkConfirmActionRef:confirm,completedChunkRefs:completed}
    });
  }

  function recordChildPlanAdaptation({contract,sessionId,scheduleChangeRef,priorPlanRef,childReplanActionRef,newPlanRef,performedTaskRef,at}={}){
    const session=clean(sessionId,160),change=clean(scheduleChangeRef,180),prior=clean(priorPlanRef,180),action=clean(childReplanActionRef,180),plan=clean(newPlanRef,180),performed=clean(performedTaskRef,180);
    if(!contract||!session||!change||!prior||!action||!plan||!performed)return null;
    return record(contract,{
      event_id:`ready_badge_plan_adapt_${session}_${performed}`,
      event_family:'PLAN_ADAPTATION',
      behavior_code:'CHILD_PLAN_ADAPTATION',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_CHILD_REPLAN_AFTER_CHANGE_V1',
      evidence_ref:`ready-child-plan-adaptation:${session}:${performed}`,
      explicit_child_action:true,
      payload:{sessionId:session,scheduleChangeRef:change,priorPlanRef:prior,childReplanActionRef:action,newPlanRef:plan,performedTaskRef:performed}
    });
  }

  function recordPersistToComplete({contract,sessionId,taskRef,blockedEvidenceRef,continueActionRef,completionEventRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),blocked=clean(blockedEvidenceRef,180),continued=clean(continueActionRef,180),completed=clean(completionEventRef,180);
    if(!contract||!session||!task||!blocked||!continued||!completed)return null;
    return record(contract,{
      event_id:`ready_badge_persist_complete_${session}_${task}`,
      event_family:'GOAL_COMPLETE',
      behavior_code:'PERSIST_TO_COMPLETE',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_PERSIST_TO_COMPLETE_V1',
      evidence_ref:`ready-persist-complete:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,blockedEvidenceRef:blocked,continueActionRef:continued,completionEventRef:completed}
    });
  }

  function recordStartDespiteCondition({contract,sessionId,conditionEvidenceRef,childStartActionRef,startedTaskRef,at}={}){
    const session=clean(sessionId,160),condition=clean(conditionEvidenceRef,180),action=clean(childStartActionRef,180),started=clean(startedTaskRef,180);
    if(!contract||!session||!condition||!action||!started)return null;
    return record(contract,{
      event_id:`ready_badge_condition_start_${session}_${started}`,
      event_family:'SELF_START',
      behavior_code:'START_DESPITE_CONDITION',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_START_DESPITE_CONDITION_V1',
      evidence_ref:`ready-condition-start:${session}:${started}`,
      explicit_child_action:true,
      payload:{sessionId:session,conditionEvidenceRef:condition,childStartActionRef:action,startedTaskRef:started}
    });
  }

  function recordVoluntaryFlowContinuation({contract,sessionId,previousTaskRef,previousCompletionEventRef,nextTaskRef,nextChoiceActionRef,startedTaskRef,at}={}){
    const session=clean(sessionId,160),previous=clean(previousTaskRef,180),completed=clean(previousCompletionEventRef,180);
    const next=clean(nextTaskRef,180),choice=clean(nextChoiceActionRef,180),started=clean(startedTaskRef,180);
    if(!contract||!session||!previous||!completed||!next||!choice||!started||next!==started||previous===next)return null;
    return record(contract,{
      event_id:`ready_badge_flow_continue_${session}_${previous}_${next}`,
      event_family:'SELF_CHOICE',
      behavior_code:'VOLUNTARY_NEXT_TASK_CONTINUE',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_VOLUNTARY_FLOW_CONTINUATION_V1',
      evidence_ref:`ready-flow-continue:${session}:${previous}:${next}`,
      explicit_child_action:true,
      payload:{sessionId:session,previousTaskRef:previous,previousCompletionEventRef:completed,nextTaskRef:next,nextChoiceActionRef:choice,startedTaskRef:started}
    });
  }

  function recordExplicitMicroTaskComplete({contract,sessionId,taskRef,smallTaskRef,completionEventRef,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),small=clean(smallTaskRef,180),completion=clean(completionEventRef,180);
    if(!contract||!session||!task||!small||!completion)return null;
    return record(contract,{
      event_id:`ready_badge_micro_complete_${session}_${task}`,
      event_family:'GOAL_COMPLETE',
      behavior_code:'MICRO_TASK_COMPLETE',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_EXPLICIT_MICRO_TASK_COMPLETE_V1',
      evidence_ref:`ready-micro-complete:${session}:${task}`,
      explicit_child_action:true,
      payload:{sessionId:session,taskRef:task,smallTaskRef:small,completionEventRef:completion}
    });
  }

  function recordVoluntaryExtraAfterRequiredComplete({contract,sessionId,requiredSetRef,requiredCompleteEventRefs,selectedExtraTaskRef,extraChoiceRef,startedTaskRef,at}={}){
    const session=clean(sessionId,160),required=clean(requiredSetRef,180),selected=clean(selectedExtraTaskRef,180),choice=clean(extraChoiceRef,180),started=clean(startedTaskRef,180);
    const completed=Array.isArray(requiredCompleteEventRefs)?requiredCompleteEventRefs.map(x=>clean(x,180)).filter(Boolean):[];
    if(!contract||!session||!required||!completed.length||!selected||!choice||!started||selected!==started)return null;
    return record(contract,{
      event_id:`ready_badge_extra_after_required_${session}_${selected}`,
      event_family:'EXTRA_TASK',
      behavior_code:'VOLUNTARY_EXTRA_AFTER_REQUIRED_COMPLETE',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_VOLUNTARY_EXTRA_CHOICE_V1',
      evidence_ref:`ready-extra-after-required:${session}:${selected}`,
      explicit_child_action:true,
      payload:{sessionId:session,requiredSetRef:required,requiredCompleteEventRefs:completed,selectedExtraTaskRef:selected,extraChoiceRef:choice,startedTaskRef:started}
    });
  }

  function recordChildSequencePlan({contract,sessionId,choiceSetRef,orderedTaskRefs,sequenceConfirmActionRef,startedTaskRef,at}={}){
    const session=clean(sessionId,160),choiceSet=clean(choiceSetRef,180),confirm=clean(sequenceConfirmActionRef,180),started=clean(startedTaskRef,180);
    const ordered=Array.isArray(orderedTaskRefs)?orderedTaskRefs.map(x=>clean(x,160)).filter(Boolean):[];
    if(!contract||!session||!choiceSet||ordered.length<2||!confirm||!started||ordered[0]!==started)return null;
    return record(contract,{
      event_id:`ready_badge_sequence_${session}_${choiceSet}`,
      event_family:'SELF_PLANNING',
      behavior_code:'SELF_PLANNED_SEQUENCE',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_CHILD_SEQUENCE_PLAN_V1',
      evidence_ref:`ready-child-sequence:${session}:${choiceSet}`,
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
      event_id:`ready_badge_priority_${session}_${choiceMode}_${selected}`,
      event_family:'SELF_CHOICE',
      behavior_code:choiceMode==='HARD_FIRST'?'PRIORITIZE_HARD':'WARM_START',
      occurred_at:at||new Date().toISOString(),
      source_contract_id:'READY_CHILD_PRIORITY_CHOICE_V1',
      evidence_ref:`ready-child-priority:${session}:${selected}`,
      explicit_child_action:true,
      payload:{sessionId:session,choiceSetRef:choiceSet,selectedTaskRef:selected,childSelectionOrder:order,difficulty:level,startedTaskRef:started,mode:choiceMode}
    });
  }


  function recordEarlyStart({contract,sessionId,taskRef,boundaryRef,boundaryAt,childStartActionRef,startedAt,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),boundary=clean(boundaryRef,180),action=clean(childStartActionRef,180);
    const boundaryMs=Date.parse(clean(boundaryAt,80)),startIso=clean(startedAt,80)||clean(at,80)||new Date().toISOString(),startMs=Date.parse(startIso);
    if(!contract||!session||!task||!boundary||!action||!Number.isFinite(boundaryMs)||!Number.isFinite(startMs)||startMs>boundaryMs)return null;
    return record(contract,{event_id:`ready_badge_early_start_${session}_${task}`,event_family:'SELF_START',behavior_code:'EARLY_START',occurred_at:startIso,source_contract_id:'READY_EARLY_START_BOUNDARY_V1',evidence_ref:`ready-early-start:${session}:${task}`,explicit_child_action:true,payload:{sessionId:session,taskRef:task,boundaryRef:boundary,boundaryAt:clean(boundaryAt,80),childStartActionRef:action}});
  }
  function recordChildExtraTimeExecution({contract,sessionId,taskRef,extraSlotRef,slotStartAt,slotEndAt,childCreateActionRef,startedTaskRef,startedAt,at}={}){
    const session=clean(sessionId,160),task=clean(taskRef,180),slot=clean(extraSlotRef,180),action=clean(childCreateActionRef,180),started=clean(startedTaskRef,180);
    const startIso=clean(startedAt,80)||clean(at,80)||new Date().toISOString(),a=Date.parse(clean(slotStartAt,80)),b=Date.parse(clean(slotEndAt,80)),x=Date.parse(startIso);
    if(!contract||!session||!task||!slot||!action||started!==task||!Number.isFinite(a)||!Number.isFinite(b)||!Number.isFinite(x)||x<a||x>b)return null;
    return record(contract,{event_id:`ready_badge_extra_time_${session}_${task}`,event_family:'TIME_CREATION',behavior_code:'TIME_CREATION_EXTRA',occurred_at:startIso,source_contract_id:'READY_CHILD_EXTRA_TIME_EXECUTION_V1',evidence_ref:`ready-child-extra-time:${session}:${task}`,explicit_child_action:true,payload:{sessionId:session,taskRef:task,extraSlotRef:slot,slotStartAt:clean(slotStartAt,80),slotEndAt:clean(slotEndAt,80),childCreateActionRef:action,startedTaskRef:started}});
  }

  window.ReadyBadgeSourceObservationV01=Object.freeze({
    VERSION,CONTRACT,
    families:Object.freeze([...ALLOWED_FAMILIES]),
    normalize,record,recordTaskChoice,recordCarryOverCompletion,recordSelfCheckCompletion,recordPauseReturn,recordPreMealMicroComplete,recordPostMealRestart,recordFreeWindowSelfStart,recordPreparationToStart,recordResponsiveStart,recordScheduledBreakReturn,recordBreakTimerReturn,recordTaskRestart,recordCarefulComplete,recordFocusReturn,recordMeaningfulOverrun,recordRootCause,recordConceptUnderstanding,recordSelfExplanation,recordStrategySwitch,recordBlockResolved,recordDistractionResistance,recordSelfNoticeReturn,recordSingleTaskFocus,recordSustainedFocusCompletion,recordQuietImmersionCompletion,recordRereadCheck,recordReflectBeforeProceed,recordStopAtRightTime,recordFastCompleteWithCheck,recordChildChunkedTask,recordChildPlanAdaptation,recordPersistToComplete,recordStartDespiteCondition,recordVoluntaryFlowContinuation,recordExplicitMicroTaskComplete,recordVoluntaryExtraAfterRequiredComplete,recordChildSequencePlan,recordChildPriorityChoice,recordEarlyStart,recordChildExtraTimeExecution,hasForbiddenKeyDeep
  });
})();