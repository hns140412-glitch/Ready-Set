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
