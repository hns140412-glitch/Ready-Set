const {test,expect}=require('@playwright/test');

test('central child-scoped checkpoint is hidden from sibling and anonymous Ready UI',async({page})=>{
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
 const setup=await page.evaluate(()=>{
  const p=window.ReadySetPlanner;
  const now=new Date(),date=now.getFullYear()+'-'+
   String(now.getMonth()+1).padStart(2,'0')+'-'+
   String(now.getDate()).padStart(2,'0');
  for(const child of ['A','B'])p.upsertDatedTodo({
   todo_id:'central-ui-'+child,date,label:'중앙 회상 점검 '+child,
   source:'PLANNER_CENTRAL_LEARNING_CHECKPOINT',state:'PLANNED',
   provenance:{family_id:'F1',member_id:child}
  });
  p.upsertDatedTodo({todo_id:'local-ui',date,label:'일반 로컬 과제',
   source:'PLANNER_ALLOCATION',state:'PLANNED'});
  return {modules:!!window.ReadyCentralLearningRoundtripV01&&!!window.TakyCentralEvidence};
 });
 expect(setup.modules).toBe(true);
 await page.evaluate(()=>window.nav('planner'));
 await expect(page.locator('#plannerWeekDetail')).toContainText('일반 로컬 과제');
 await expect(page.locator('#plannerWeekDetail')).not.toContainText('중앙 회상 점검 A');
 await expect(page.locator('#plannerWeekDetail')).not.toContainText('중앙 회상 점검 B');
 await page.evaluate(()=>window.nav('mission'));
 await expect(page.locator('#plannerTodayList')).not.toContainText('중앙 회상 점검 A');
 await page.evaluate(()=>{
  window.__centralUiFixtureScope={authenticated:true,family_id:'F1',selected_member_id:'A'};
  window.__centralUiFixtureHost=window.ReadyCentralLearningRoundtripV01.installBrowserHost({
   eventTarget:window,
   roundtrip:{run:async()=>({ok:false,reason:'TEST_ONLY_NOT_A_LIVE_CENTRAL_SESSION'})},
   resolveRecordOptions:()=>({}),
   activeScopeProvider:()=>window.__centralUiFixtureScope
  });
 });
 await page.evaluate(()=>window.nav('planner'));
 await expect(page.locator('#plannerWeekDetail')).toContainText('중앙 회상 점검 A');
 await expect(page.locator('#plannerWeekDetail')).not.toContainText('중앙 회상 점검 B');
 await page.evaluate(()=>window.nav('mission'));
 await expect(page.locator('#plannerTodayList')).toContainText('중앙 회상 점검 A');
 await expect(page.locator('#plannerTodayList')).not.toContainText('중앙 회상 점검 B');
 await page.evaluate(()=>{window.__centralUiFixtureScope.selected_member_id='B'});
 await page.evaluate(()=>window.nav('planner'));
 await expect(page.locator('#plannerWeekDetail')).toContainText('중앙 회상 점검 B');
 await expect(page.locator('#plannerWeekDetail')).not.toContainText('중앙 회상 점검 A');
 await page.evaluate(()=>{window.__centralUiFixtureScope.authenticated=false});
 await page.evaluate(()=>window.nav('mission'));
 await expect(page.locator('#plannerTodayList')).not.toContainText('중앙 회상 점검 A');
 await expect(page.locator('#plannerTodayList')).not.toContainText('중앙 회상 점검 B');
 await page.evaluate(()=>window.__centralUiFixtureHost.detach());
});

test('central carry-over including legacy row is hidden from sibling and anonymous Planner snapshot',async({page})=>{
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
 const created=await page.evaluate(()=>{
  const p=window.ReadySetPlanner;
  const day=new Date(),date=day.getFullYear()+'-'+
   String(day.getMonth()+1).padStart(2,'0')+'-'+
   String(day.getDate()).padStart(2,'0');
  function partial(id,source,member){
   const t=p.upsertDatedTodo({todo_id:id,date,label:id,source,
    state:'PLANNED',review_policy:source==='PLANNER_CENTRAL_LEARNING_CHECKPOINT'
     ?{authority:'TAKY_LEARNING_ENGINE_CORE'}:null,
    provenance:member?{family_id:'F1',member_id:member,
     schedule_authority:'READY_SET_PLANNER'}:null});
   p.recordTaskState({todo_id:t.todo_id,ready_state:'IN_PROGRESS',
    session_id:'session-'+id,task_id:'task-'+id});
   p.recordSessionOutcome({todo_id:t.todo_id,ready_state:'PARTIAL',
    actual_ms:30000,session_id:'session-'+id,task_id:'task-'+id});
  }
  partial('central-carry-a','PLANNER_CENTRAL_LEARNING_CHECKPOINT','A');
  partial('central-carry-b','PLANNER_CENTRAL_LEARNING_CHECKPOINT','B');
  partial('central-carry-legacy','PLANNER_CENTRAL_LEARNING_CHECKPOINT','A');
  partial('local-carry','PLANNER_ALLOCATION');
  const raw=JSON.parse(localStorage.getItem('readyset_planner_v1'));
  const legacy=raw.carry_over_queue.find(x=>x.source_todo_id==='central-carry-legacy');
  delete legacy.source_todo_source;delete legacy.central_scope;
  localStorage.setItem('readyset_planner_v1',JSON.stringify(raw));
  return {anonymous:window.plannerSnapshot().carry_over_queue.map(x=>x.source_todo_id)};
 });
 expect(created.anonymous).toEqual(['local-carry']);
 const seen=await page.evaluate(()=>{
  window.__carryScope={authenticated:true,family_id:'F1',selected_member_id:'A'};
  const host=window.ReadyCentralLearningRoundtripV01.installBrowserHost({
   eventTarget:window,activeScopeProvider:()=>window.__carryScope,
   roundtrip:{run:async()=>({ok:false,reason:'TEST_ONLY_NO_LIVE_CENTRAL_ACCOUNT'})},
   resolveRecordOptions:()=>({})
  });
  const take=()=>window.plannerSnapshot().carry_over_queue.map(x=>x.source_todo_id);
  const a=take();
  window.__carryScope.selected_member_id='B';const b=take();
  window.__carryScope.authenticated=false;const absent=take();
  host.detach();
  return {a,b,absent};
 });
 expect(seen.a).toEqual(['central-carry-a','central-carry-legacy','local-carry']);
 expect(seen.b).toEqual(['central-carry-b','local-carry']);
 expect(seen.absent).toEqual(['local-carry']);
});
