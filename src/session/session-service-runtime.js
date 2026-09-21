(function(root){
  'use strict';
  function start(input={}){
    const domain=input.sessionDomain;
    const planner=input.planner;
    if(!domain||!planner)return {ok:false,reason:'SESSION_SERVICE_DEPENDENCY_MISSING'};
    const selectedTodoIds=Array.isArray(input.selectedTodoIds)?input.selectedTodoIds:[];
    const pre=domain.preStartGuard({activeSession:input.activeSession,selectedTodoIds});
    if(!pre.ok)return pre;
    const links=planner.linkTodayItems?.(selectedTodoIds,{allowed_states:['PLANNED']})||[];
    const linkGuard=domain.plannerStartGuard(links);
    if(!linkGuard.ok)return linkGuard;
    const first=links[0];
    const started=planner.recordTaskState?.({
      todo_id:first.todo_id,
      ready_state:'IN_PROGRESS',
      session_id:input.sessionId,
      task_id:first.learning_unit_id||first.todo_id,
      at:new Date(input.now).toISOString()
    });
    if(started?.state!=='IN_PROGRESS'){
      return {ok:false,reason:started?.reason||'FIRST_TODO_START_FAILED',planner_result:started||null};
    }
    const session=domain.createSession({
      sessionId:input.sessionId,
      now:input.now,
      targetMin:input.targetMin,
      plannerLinks:links,
      sound:input.sound
    });
    return {ok:true,session,plannerLinks:links,firstPlannerResult:started};
  }
  function outcome(input={}){
    const domain=input.sessionDomain;
    const planner=input.planner;
    const session=input.session;
    if(!domain||!planner||!session)return {ok:false,reason:'SESSION_OUTCOME_DEPENDENCY_MISSING'};
    const attribution=domain.attribution(session,input.focusMs||0);
    const outcomes=[];
    for(const link of attribution.links){
      const result=planner.recordSessionOutcome?.({
        todo_id:link.todo_id,
        ready_state:input.outcomeState,
        actual_ms:attribution.attributedMs,
        session_total_actual_ms:input.focusMs||0,
        session_task_count:attribution.taskCount,
        time_attribution:attribution.timeAttribution,
        session_id:session.id,
        task_id:link.learning_unit_id||link.todo_id,
        at:new Date(input.endAt).toISOString()
      });
      if(result)outcomes.push(result);
    }
    return {ok:true,plannerOutcomes:outcomes,attribution};
  }
  root.ReadyRebuildSessionService=Object.freeze({
    version:'READY_REBUILD_SESSION_SERVICE_V01',
    start,
    outcome
  });
})(typeof globalThis!=='undefined'?globalThis:this);
