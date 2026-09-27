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
 await page.locator('[data-nav="planner"]').first().click();
 await expect(page.locator('#plannerWeekDetail')).toContainText('일반 로컬 과제');
 await expect(page.locator('#plannerWeekDetail')).not.toContainText('중앙 회상 점검 A');
 await expect(page.locator('#plannerWeekDetail')).not.toContainText('중앙 회상 점검 B');
 await page.locator('[data-nav="mission"]').first().click();
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
 await page.locator('[data-nav="planner"]').first().click();
 await expect(page.locator('#plannerWeekDetail')).toContainText('중앙 회상 점검 A');
 await expect(page.locator('#plannerWeekDetail')).not.toContainText('중앙 회상 점검 B');
 await page.locator('[data-nav="mission"]').first().click();
 await expect(page.locator('#plannerTodayList')).toContainText('중앙 회상 점검 A');
 await expect(page.locator('#plannerTodayList')).not.toContainText('중앙 회상 점검 B');
 await page.evaluate(()=>{window.__centralUiFixtureScope.selected_member_id='B'});
 await page.locator('[data-nav="planner"]').first().click();
 await expect(page.locator('#plannerWeekDetail')).toContainText('중앙 회상 점검 B');
 await expect(page.locator('#plannerWeekDetail')).not.toContainText('중앙 회상 점검 A');
 await page.evaluate(()=>{window.__centralUiFixtureScope.authenticated=false});
 await page.locator('[data-nav="mission"]').first().click();
 await expect(page.locator('#plannerTodayList')).not.toContainText('중앙 회상 점검 A');
 await expect(page.locator('#plannerTodayList')).not.toContainText('중앙 회상 점검 B');
 await page.evaluate(()=>window.__centralUiFixtureHost.detach());
});
