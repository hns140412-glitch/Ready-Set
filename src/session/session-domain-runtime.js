(function(root){
  'use strict';

  function preStartGuard({activeSession,selectedTodoIds=[]}={}){
    if(activeSession)return {ok:false,reason:'SESSION_ALREADY_ACTIVE'};
    if(!Array.isArray(selectedTodoIds)||selectedTodoIds.length===0)return {ok:false,reason:'NO_SELECTED_TODO'};
    return {ok:true};
  }

  function plannerStartGuard(plannerLinks=[]){
    if(!Array.isArray(plannerLinks)||plannerLinks.length===0)return {ok:false,reason:'NO_STARTABLE_PLANNER_TODO'};
    return {ok:true};
  }

  function startGuard(input={}){
    const pre=preStartGuard(input);if(!pre.ok)return pre;
    return plannerStartGuard(input.plannerLinks);
  }

  function createSession({sessionId,now,targetMin,plannerLinks=[],sound='OFF'}={}){
    if(!sessionId)throw new Error('SESSION_ID_REQUIRED');
    if(!Number.isFinite(now))throw new Error('SESSION_START_TIME_REQUIRED');
    const links=Array.isArray(plannerLinks)?plannerLinks:[];
    return {
      id:sessionId,
      startAt:now,
      targetMs:Math.max(1,Number(targetMin)||25)*60000,
      pausedAt:null,
      issueMs:0,
      completed:false,
      selected:[],
      tasks:links.map(x=>x?.label).filter(Boolean),
      plannerLinks:[...links],
      sound:sound||'OFF',
      recordingDone:false
    };
  }

  function times(session,{now=Date.now(),fallbackTargetMin=25}={}){
    if(!session)return {focus:0,issue:0,remaining:Math.max(1,Number(fallbackTargetMin)||25)*60000};
    const end=session.completed?session.endAt:now;
    const currentPause=session.pausedAt?end-session.pausedAt:0;
    const issue=(session.issueMs||0)+currentPause;
    const elapsed=Math.max(0,end-session.startAt);
    const focus=Math.max(0,elapsed-issue);
    return {focus,issue,remaining:session.targetMs-focus};
  }

  function attribution(session,focusMs){
    const links=Array.isArray(session?.plannerLinks)?session.plannerLinks.filter(x=>x?.todo_id):[];
    const taskCount=Math.max(1,links.length);
    const attributedMs=links.length?Math.floor(Math.max(0,focusMs||0)/taskCount):0;
    return {
      links,
      taskCount,
      attributedMs,
      timeAttribution:links.length>1?'EQUAL_SHARE_SESSION_OBSERVATION':'DIRECT_TASK_OBSERVATION'
    };
  }

  root.ReadyRebuildSessionDomain=Object.freeze({
    version:'READY_REBUILD_SESSION_DOMAIN_V01',
    preStartGuard,
    plannerStartGuard,
    startGuard,
    createSession,
    times,
    attribution
  });
})(typeof globalThis!=='undefined'?globalThis:this);
