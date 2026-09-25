(function(root){
  'use strict';

  function create(options={}){
    const getState=options.getState||(()=>({}));
    const save=options.save||(()=>{});
    const planner=options.planner||(()=>root.ReadySetPlanner);
    const plannerQuery=options.plannerQuery;
    const localDateKey=options.localDateKey;
    const now=options.now||(()=>Date.now());
    if(!plannerQuery||!localDateKey)throw new Error('SESSION_RECOVERY_CONTROLLER_DEPENDENCY_MISSING');

    function reconcile(){
      const state=getState();
      const snap=plannerQuery.snapshot();
      const todayKey=localDateKey();
      const openToday=new Set((snap.dated_todos||[])
        .filter(item=>item.date===todayKey&&item.state==='PLANNED')
        .map(item=>item.todo_id));
      const beforeSelected=(state.selectedTodoIds||[]).length;
      state.selectedTodoIds=(state.selectedTodoIds||[]).filter(id=>openToday.has(id));

      const hadActiveSession=!!state.activeSession?.id;
      let resumed=false;
      if(hadActiveSession){
        let status=planner()?.sessionRuntimeStatus?.(state.activeSession.id)||null;
        const sessionIds=new Set((state.activeSession.plannerLinks||[]).map(item=>item.todo_id).filter(Boolean));
        let inProgress=(status?.in_progress||[]).filter(item=>sessionIds.has(item.todo_id));

        if(!inProgress.length&&sessionIds.size){
          const legacyInProgress=(snap.dated_todos||[]).filter(item=>sessionIds.has(item.todo_id)&&item.state==='IN_PROGRESS');
          for(const todo of legacyInProgress){
            planner()?.recordTaskState?.({
              todo_id:todo.todo_id,
              ready_state:'IN_PROGRESS',
              session_id:state.activeSession.id,
              task_id:todo.learning_unit_id||todo.todo_id,
              at:todo.started_at||new Date(state.activeSession.startAt||now()).toISOString()
            });
          }
          status=planner()?.sessionRuntimeStatus?.(state.activeSession.id)||null;
          inProgress=(status?.in_progress||[]).filter(item=>sessionIds.has(item.todo_id));
        }

        if(inProgress.length){
          resumed=true;
          const liveById=new Map(inProgress.map(item=>[item.todo_id,item]));
          state.activeSession.plannerLinks=(state.activeSession.plannerLinks||[])
            .filter(item=>liveById.has(item.todo_id))
            .map(item=>({...item,state:'IN_PROGRESS'}));
        }else{
          state.activeSession=null;
        }
      }

      const activeSessionCleared=hadActiveSession&&!state.activeSession;
      const changed=beforeSelected!==state.selectedTodoIds.length||activeSessionCleared||resumed;
      if(changed)save();
      return {resumed,changed};
    }

    return Object.freeze({reconcile});
  }

  root.ReadyRebuildSessionRecoveryController=Object.freeze({
    version:'READY_REBUILD_SESSION_RECOVERY_CONTROLLER_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
