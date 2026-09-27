const {test,expect}=require('@playwright/test');

test('actual Ready persisted completion event preserves learner selected at session start',async({page})=>{
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
 const result=await page.evaluate(async()=>{
  window.__centralFixture={authenticated:true,family_id:'F1',selected_member_id:'A'};
  const captured=[];
  window.addEventListener('readyset-learning-outcomes-ready',event=>
   captured.push(event.detail));
  const host=window.ReadyCentralLearningRoundtripV01.installBrowserHost({
   eventTarget:window,
   activeScopeProvider:()=>window.__centralFixture,
   roundtrip:{run:async()=>({ok:false,reason:'TEST_ONLY_NO_LIVE_CENTRAL_ACCOUNT'})},
   resolveRecordOptions:()=>({})
  });
  const row=id=>({state:'COMPLETED',task_id:id,
   specialistResult:{sourceApp:'hide-seek',taskState:'COMPLETED',
    memorySummary:{authority:'SPECIALIST_MEMORY_ADVISORY_ONLY',
     prioritySemantics:'ADVISORY_SIGNAL_NOT_DATE',reviewAdvisories:[]}}});
  const session=(id,bound)=>({
   id,startAt:Date.now()-3000,targetMs:3000,
   pausedAt:null,issueMs:0,completed:false,
   selected:[],tasks:[],plannerLinks:[],sound:'OFF',
   recordingDone:false,centralLearningScope:bound
  });
  state.activeSession=session('session-A',{family_id:'F1',member_id:'A'});
  const first=window.completeSessionFromTaskOutcomes([row('task-A')]);
  const actual=JSON.parse(localStorage.getItem('readyset_state')).records[0];
  window.__centralFixture.selected_member_id='B';
  state.activeSession=session('session-after-switch',{family_id:'F1',member_id:'A'});
  const changed=window.completeSessionFromTaskOutcomes([row('task-cross-child')]);
  state.activeSession=session('session-legacy',null);
  const unbound=window.completeSessionFromTaskOutcomes([row('task-legacy')]);
  await Promise.resolve();
  host.detach();
  return {
   firstBound:first.taskOutcomes[0].member_id,
   firstFamily:first.taskOutcomes[0].family_id,
   actualBound:actual.taskOutcomes[0].member_id,
   eventCount:captured.length,
   eventId:captured[0]?.session_id,
   eventBound:captured[0]?.central_learning_scope?.member_id,
   eventTask:captured[0]?.task_outcomes?.[0]?.task_id,
   changedHasScope:Object.hasOwn(changed.taskOutcomes[0],'member_id'),
   legacyHasScope:Object.hasOwn(unbound.taskOutcomes[0],'member_id')
  };
 });
 expect(result).toEqual({
  firstBound:'A',firstFamily:'F1',actualBound:'A',
  eventCount:1,eventId:'session-A',eventBound:'A',eventTask:'task-A',
  changedHasScope:false,legacyHasScope:false
 });
});

test('completed central Planner checkpoint is persisted and dispatched as unverified child feedback',async({page})=>{
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
 const actual=await page.evaluate(()=>{
  const scope={authenticated:true,family_id:'F1',selected_member_id:'A'};
  const captured=[];
  window.addEventListener('readyset-learning-outcomes-ready',e=>captured.push(e.detail));
  const host=window.ReadyCentralLearningRoundtripV01.installBrowserHost({
   eventTarget:window,activeScopeProvider:()=>scope,
   roundtrip:{run:async()=>({ok:false,reason:'TEST_ONLY_NO_LIVE_CENTRAL_ACCOUNT'})},
   resolveRecordOptions:()=>({})
  });
  const p=window.ReadySetPlanner;
  const todo=p.upsertDatedTodo({todo_id:'central-feedback-fixture',date:'2026-09-27',
   label:'중앙 회상 점검',source:'PLANNER_CENTRAL_LEARNING_CHECKPOINT',
   review_policy:{authority:'TAKY_LEARNING_ENGINE_CORE',intent_only:true},
   provenance:{family_id:'F1',member_id:'A',subject:'english',
    concept_skill_target:'vocabulary',schedule_authority:'READY_SET_PLANNER'},
   state:'PLANNED'});
  const start=p.recordTaskState({todo_id:todo.todo_id,ready_state:'IN_PROGRESS',
   session_id:'central-completion',task_id:'central-task'});
  const finished=p.recordSessionOutcome({todo_id:todo.todo_id,
   ready_state:'PARTIAL',actual_ms:120000,session_id:'central-completion',
   task_id:'central-task'});
  state.activeSession={id:'central-completion',startAt:Date.now()-3000,
   targetMs:3000,pausedAt:null,issueMs:0,completed:false,selected:[],tasks:[],
   plannerLinks:[],sound:'OFF',recordingDone:false,
   centralLearningScope:{family_id:'F1',member_id:'A'}};
  const rec=window.completeSessionFromTaskOutcomes([{
   task_id:'central-task',planner_todo_id:todo.todo_id,state:'PARTIAL',
   actual_ms:120000,plannerOutcome:finished
  }]);
  host.detach();
  return {start,finished,
   persisted:rec.taskOutcomes[0].centralCheckpoint,
   eventCount:captured.length,eventRow:captured[0]?.task_outcomes?.[0],
   state:rec.taskOutcomes[0].state};
 });
 expect(actual.start.state).toBe('IN_PROGRESS');
 expect(actual.finished.ok).toBe(true);
 expect(actual.state).toBe('PARTIAL');
 expect(actual.eventCount).toBe(1);
 expect(actual.persisted.source).toBe('PLANNER_CENTRAL_LEARNING_CHECKPOINT');
 expect(actual.eventRow.centralCheckpoint.provenance).toMatchObject({
  family_id:'F1',member_id:'A',schedule_authority:'READY_SET_PLANNER'});
 expect(actual.eventRow.specialistResult).toBeUndefined();
 expect(actual.eventRow.memoryReviewFeedback).toBeUndefined();
});
