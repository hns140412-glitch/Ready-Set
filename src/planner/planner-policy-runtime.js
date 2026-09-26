(function(root){
  'use strict';

  const TODO_STATES=Object.freeze([
    'PLANNED','IN_PROGRESS','COMPLETED','PARTIAL','DEFERRED','WAITING_FOR_PARENT','BLOCKED','SUPERSEDED'
  ]);
  const READY_TO_TODO=Object.freeze({
    PENDING:'PLANNED',
    COMPLETED:'COMPLETED',
    PARTIAL:'PARTIAL',
    DEFERRED:'DEFERRED',
    WAITING_FOR_PARENT:'WAITING_FOR_PARENT',
    BLOCKED:'BLOCKED'
  });

  function mapReadyState(state){
    const raw=String(state||'').trim();
    const mapped=READY_TO_TODO[raw]||raw;
    return TODO_STATES.includes(mapped)?mapped:null;
  }

  function validateSessionOwnership(todo,sessionId){
    if(!todo)return {ok:false,reason:'TODO_NOT_FOUND'};
    const incoming=String(sessionId||'').trim()||null;
    if(todo.active_session_id&&incoming&&todo.active_session_id!==incoming){
      return {ok:false,reason:'SESSION_OWNERSHIP_CONFLICT',active_session_id:todo.active_session_id};
    }
    return {ok:true};
  }

  function canFinishTodo(todo){
    if(!todo)return false;
    return todo.state==='IN_PROGRESS'||['PARTIAL','DEFERRED','WAITING_FOR_PARENT','BLOCKED'].includes(todo.state);
  }

  function carryPolicyForState(state){
    const s=String(state||'').trim();
    return Object.freeze({
      state:s,
      carryEligible:['PARTIAL','DEFERRED'].includes(s),
      resolutionRequired:['BLOCKED','WAITING_FOR_PARENT'].includes(s),
      resolvesOpenCarry:s==='COMPLETED'
    });
  }

  function carryEscalation({nextDepth=0,deadline=null,targetDate=null,maxAutoDepth=3}={}){
    const depth=Math.max(0,Number(nextDepth)||0);
    const maxDepth=Math.max(1,Number(maxAutoDepth)||3);
    const exceeded=!!deadline&&!!targetDate&&String(targetDate)>String(deadline);
    let near=false;
    if(deadline&&targetDate){
      const d=new Date(String(deadline)+'T12:00:00');
      d.setDate(d.getDate()-1);
      const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
      near=String(targetDate)>=`${y}-${m}-${day}`;
    }
    if(exceeded)return {required:true,reason:'DEADLINE_EXCEEDED'};
    if(depth>maxDepth)return {required:true,reason:'REPEATED_CARRY_LIMIT'};
    if(near&&depth>=maxDepth)return {required:true,reason:'REPEATED_CARRY_NEAR_DEADLINE'};
    return {required:false,reason:null};
  }

  root.ReadyRebuildPlannerPolicy=Object.freeze({
    version:'READY_REBUILD_PLANNER_POLICY_V01',
    TODO_STATES,
    READY_TO_TODO,
    mapReadyState,
    validateSessionOwnership,
    canFinishTodo,
    carryPolicyForState,
    carryEscalation
  });
})(typeof globalThis!=='undefined'?globalThis:this);
