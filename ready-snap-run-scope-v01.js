(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root&&typeof window!=='undefined')root.ReadySnapRunScopeV01=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clean=v=>String(v??'').trim();
 const fail=reason=>({ok:false,reason});
 // New execution attribution only. A selected central child does NOT become
 // historical owner of the older, possibly unscoped local assignment.
 function fromSource({activeScope,sessionScope,session,contract,task,lap,todo,domainState}={}){
  if(activeScope?.authenticated!==true||!clean(activeScope.family_id)||
     !clean(activeScope.selected_member_id)||!clean(sessionScope?.family_id)||
     !clean(sessionScope?.member_id)||activeScope.family_id!==sessionScope.family_id||
     activeScope.selected_member_id!==sessionScope.member_id)
   return fail('ACTIVE_CENTRAL_MEMBER_SCOPE_REQUIRED');
  if(!session||!contract||!task||!lap||
     clean(session.id)!==clean(contract.session_id)||
     clean(contract.active_task_id)!==clean(task.task_id)||
     clean(contract.active_lap_id)!==clean(lap.lap_id)||
     clean(lap.task_id)!==clean(task.task_id)||lap.ended_at||
     clean(task.planner_todo_id)!==clean(todo?.todo_id))
   return fail('EXACT_READY_RUN_REQUIRED');
  // The observation must be grounded in a confirmed assignment interpreted
  // by the actual Learning Master and scheduled by Planner. No label parsing,
  // no URL-supplied member/subject/target and no central Hide checkpoint reuse.
  if(todo?.source!=='PLANNER_V2_ALLOCATION'||
     !clean(todo.assignment_id)||!clean(todo.analysis_id)||
     !clean(todo.learning_unit_id)||!Number.isInteger(Number(todo.fact_revision))||
     Number(todo.fact_revision)<1)return fail('PLANNER_SOURCE_UNIT_REQUIRED');
  const fact=domainState?.assignmentFacts?.[todo.assignment_id];
  const unit=domainState?.learningUnits?.[todo.learning_unit_id];
  const analysis=domainState?.analyses?.[todo.analysis_id];
  if(!fact||!unit||!analysis||fact.assignment_id!==todo.assignment_id||
     unit.assignment_id!==todo.assignment_id||
     unit.analysis_id!==todo.analysis_id||
     clean(unit.learning_unit_id)!==clean(todo.learning_unit_id)||
     clean(analysis.analysis_id)!==clean(todo.analysis_id)||
     fact.current_analysis_id!==todo.analysis_id||
     fact.confirmation_state!=='FACT_CONFIRMED'||
     fact.analysis_state!=='INTERPRETED'||
     fact.planner_revision_pending===true||
     unit.state!=='INTERPRETED'||analysis.state==='SUPERSEDED'||
     Number(fact.fact_revision)!==Number(todo.fact_revision))
   return fail('CURRENT_CONFIRMED_UNIT_REQUIRED');
  const subject=clean(unit.subject),skill=clean(unit.concept_skill_target);
  if(!subject||!skill||clean(todo.subject)!==subject)
   return fail('SOURCE_SUBJECT_OR_SKILL_MISSING');
  return {ok:true,authority:'READY_SCOPED_SPECIALIST_CONTINUITY_ONLY',
   linked_run:{session_id:contract.session_id,task_id:task.task_id,
    lap_id:lap.lap_id,planner_todo_id:todo.todo_id},
   fields:{child_id:sessionScope.member_id,subject,
    concept_skill_target:skill,learning_target_id:unit.learning_unit_id},
   evidence_refs:{assignment_id:todo.assignment_id,analysis_id:todo.analysis_id,
    learning_unit_id:unit.learning_unit_id,fact_revision:Number(todo.fact_revision)},
   authenticated_receipt:false,historical_assignment_owner_asserted:false,
   global_mastery_claim:false};
 }
 return Object.freeze({VERSION:'READY_SNAP_RUN_SCOPE_V01',fromSource});
});