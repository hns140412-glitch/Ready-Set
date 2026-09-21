(function(root){
  'use strict';

  function create(options={}){
    const getState=options.getState||(()=>({}));
    const save=options.save||(()=>{});
    const pauseBgm=options.pauseBgm||(()=>Promise.resolve());
    const sessionTimes=options.sessionTimes||(()=>({focus:0,issue:0,remaining:0}));
    const sessionService=options.sessionService;
    const sessionDomain=options.sessionDomain;
    const planner=options.planner||(()=>root.ReadySetPlanner);
    const nav=options.nav||(()=>{});
    const toast=options.toast||(()=>{});
    const now=options.now||(()=>Date.now());
    if(!sessionService||!sessionDomain)throw new Error('SESSION_COMPLETION_CONTROLLER_DEPENDENCY_MISSING');

    function finishRecord({outcomeState='COMPLETED',plannerOutcomes=[],taskOutcomes=[]}={}){
      const state=getState();
      const session=state.activeSession;
      if(!session)return null;
      pauseBgm();
      if(session.pausedAt){
        session.issueMs+=now()-session.pausedAt;
        session.pausedAt=null;
      }
      session.endAt=now();
      session.completed=true;
      const times=sessionTimes();
      const endedTodoIds=new Set((plannerOutcomes||[]).filter(item=>item?.ok).map(item=>item.todo_id));
      if(endedTodoIds.size){
        state.selectedTodoIds=(state.selectedTodoIds||[]).filter(id=>!endedTodoIds.has(id));
      }
      const record={
        ...session,
        focusMs:times.focus,
        issueMs:times.issue,
        deltaMs:times.focus-session.targetMs,
        outcomeState,
        plannerOutcomes,
        taskOutcomes
      };
      state.records=[record,...(state.records||[])].slice(0,200);
      state.activeSession=null;
      state.lastResult=record;
      save();
      nav('result');
      return record;
    }

    function completeFromTaskOutcomes(taskOutcomes=[]){
      const rows=Array.isArray(taskOutcomes)?taskOutcomes.filter(item=>item&&item.state):[];
      if(!rows.length)return null;
      const unique=[...new Set(rows.map(item=>item.state))];
      const outcomeState=unique.length===1?unique[0]:'MIXED';
      const plannerOutcomes=rows.map(item=>item.plannerOutcome).filter(Boolean);
      return finishRecord({outcomeState,plannerOutcomes,taskOutcomes:rows});
    }

    function complete(outcomeState='COMPLETED'){
      const state=getState();
      const session=state.activeSession;
      if(!session)return null;
      pauseBgm();
      if(session.pausedAt){
        session.issueMs+=now()-session.pausedAt;
        session.pausedAt=null;
      }
      session.endAt=now();
      session.completed=true;
      const times=sessionTimes();
      const outcome=sessionService.outcome({
        sessionDomain,
        planner:planner(),
        session,
        focusMs:times.focus,
        outcomeState,
        endAt:session.endAt
      });
      if(!outcome.ok){
        toast('작전 결과를 Planner에 반영하지 못했어요.');
        return null;
      }
      return finishRecord({
        outcomeState,
        plannerOutcomes:outcome.plannerOutcomes,
        taskOutcomes:[]
      });
    }

    return Object.freeze({finishRecord,completeFromTaskOutcomes,complete});
  }

  root.ReadyRebuildSessionCompletionController=Object.freeze({
    version:'READY_REBUILD_SESSION_COMPLETION_CONTROLLER_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
