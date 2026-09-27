const assert=require('node:assert/strict');
const S=require('../ready-snap-run-scope-v01.js');
const baseline=()=>{
 const activeScope={authenticated:true,family_id:'F1',selected_member_id:'A'};
 const sessionScope={family_id:'F1',member_id:'A'};
 const session={id:'session-1'};
 const contract={session_id:'session-1',active_task_id:'task-1',active_lap_id:'lap-1'};
 const task={task_id:'task-1',planner_todo_id:'todo-1'};
 const lap={lap_id:'lap-1',task_id:'task-1',ended_at:null};
 const todo={todo_id:'todo-1',source:'PLANNER_V2_ALLOCATION',
  assignment_id:'fact-1',analysis_id:'analysis-1',learning_unit_id:'unit-1',
  fact_revision:2,subject:'영어'};
 const domainState={
  assignmentFacts:{'fact-1':{assignment_id:'fact-1',confirmation_state:'FACT_CONFIRMED',
    analysis_state:'INTERPRETED',planner_revision_pending:false,
    current_analysis_id:'analysis-1',fact_revision:2}},
  learningUnits:{'unit-1':{learning_unit_id:'unit-1',assignment_id:'fact-1',
    analysis_id:'analysis-1',subject:'영어',concept_skill_target:'영어 문장 표현',
    state:'INTERPRETED'}},
  analyses:{'analysis-1':{analysis_id:'analysis-1',state:'INTERPRETED'}}
 };
 return {activeScope,sessionScope,session,contract,task,lap,todo,domainState};
};
const good=S.fromSource(baseline());
assert.equal(good.ok,true);
assert.deepEqual(good.fields,{child_id:'A',subject:'영어',
 concept_skill_target:'영어 문장 표현',learning_target_id:'unit-1'});
assert.equal(good.authenticated_receipt,false);
assert.equal(good.historical_assignment_owner_asserted,false);
assert.equal(good.global_mastery_claim,false);

function reject(change,expected){
 const p=baseline();change(p);const r=S.fromSource(p);
 assert.equal(r.ok,false);assert.equal(r.reason,expected);
}
reject(x=>x.activeScope.selected_member_id='B','ACTIVE_CENTRAL_MEMBER_SCOPE_REQUIRED');
reject(x=>x.activeScope.authenticated=false,'ACTIVE_CENTRAL_MEMBER_SCOPE_REQUIRED');
reject(x=>x.sessionScope=null,'ACTIVE_CENTRAL_MEMBER_SCOPE_REQUIRED');
reject(x=>x.contract.active_lap_id='old-lap','EXACT_READY_RUN_REQUIRED');
reject(x=>x.lap.ended_at='2026-09-28T00:00:00Z','EXACT_READY_RUN_REQUIRED');
reject(x=>x.todo.source='PLANNER_CENTRAL_LEARNING_CHECKPOINT','PLANNER_SOURCE_UNIT_REQUIRED');
reject(x=>x.todo.learning_unit_id=null,'PLANNER_SOURCE_UNIT_REQUIRED');
reject(x=>x.todo.fact_revision=1,'CURRENT_CONFIRMED_UNIT_REQUIRED');
reject(x=>x.domainState.assignmentFacts['fact-1'].current_analysis_id='old','CURRENT_CONFIRMED_UNIT_REQUIRED');
reject(x=>x.domainState.assignmentFacts['fact-1'].planner_revision_pending=true,'CURRENT_CONFIRMED_UNIT_REQUIRED');
reject(x=>x.domainState.learningUnits['unit-1'].state='SUPERSEDED','CURRENT_CONFIRMED_UNIT_REQUIRED');
reject(x=>x.domainState.learningUnits['unit-1'].analysis_id='other','CURRENT_CONFIRMED_UNIT_REQUIRED');
reject(x=>x.domainState.learningUnits['unit-1'].subject='국어','SOURCE_SUBJECT_OR_SKILL_MISSING');
reject(x=>x.domainState.learningUnits['unit-1'].concept_skill_target='','SOURCE_SUBJECT_OR_SKILL_MISSING');
console.log('PASS Ready→Snap exact sourced learning unit, selected child, stale revision and run isolation');
