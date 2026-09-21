export const TODO_STATES = Object.freeze([
  'PLANNED','IN_PROGRESS','COMPLETED','PARTIAL','DEFERRED','WAITING_FOR_PARENT','BLOCKED','SUPERSEDED'
]);
export const READY_TO_TODO = Object.freeze({
  PENDING:'PLANNED',
  COMPLETED:'COMPLETED',
  PARTIAL:'PARTIAL',
  DEFERRED:'DEFERRED',
  WAITING_FOR_PARENT:'WAITING_FOR_PARENT',
  BLOCKED:'BLOCKED'
});
export function mapReadyState(state){
  const raw=String(state||'').trim();
  const mapped=READY_TO_TODO[raw]||raw;
  return TODO_STATES.includes(mapped)?mapped:null;
}
export function validateSessionOwnership(todo,sessionId){
  if(!todo)return {ok:false,reason:'TODO_NOT_FOUND'};
  const incoming=String(sessionId||'').trim()||null;
  if(todo.active_session_id&&incoming&&todo.active_session_id!==incoming){
    return {ok:false,reason:'SESSION_OWNERSHIP_CONFLICT',active_session_id:todo.active_session_id};
  }
  return {ok:true};
}
export function canFinishTodo(todo){
  if(!todo)return false;
  return todo.state==='IN_PROGRESS'||['PARTIAL','DEFERRED','WAITING_FOR_PARENT','BLOCKED'].includes(todo.state);
}
