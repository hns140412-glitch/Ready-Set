const {test,expect}=require('@playwright/test');

async function setup(page){
 await page.addInitScript(()=>{
  window.__READY_AUTH_BOOTSTRAP__={
   authenticated:true,family_id:'TEST_FAMILY',member_id:'TEST_PARENT',role:'PARENT',
   session_id:'TEST_PARENT_SESSION',expires_at:'2099-01-01T00:00:00.000Z',
   source:'TEST_ONLY'
  };
 });
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
 const setup=await page.evaluate(async()=>{
  const scope={authenticated:true,family_id:'F1',selected_member_id:'CHILD_A'};
  window.__snapFixtureScope=scope;
  window.__snapCentralHost=window.ReadyCentralLearningRoundtripV01.installBrowserHost({
   eventTarget:window,activeScopeProvider:()=>scope,
   roundtrip:{run:async()=>({ok:false,reason:'TEST_ONLY_NO_LIVE_CENTRAL_ACCOUNT'})},
   resolveRecordOptions:()=>({})
  });
  const today=new Date().toLocaleDateString('sv-SE');
  const end=new Date();end.setDate(end.getDate()+7);
  const deadline=end.toLocaleDateString('sv-SE');
  window.ReadySetPlanner.upsertDailyAvailabilityWindow({
   date:today,start:'16:00',end:'17:00',source:'PARENT_CONFIRMED',confirmed:true
  });
  const books=window.ReadyAssignmentDomainV2.TALENT_BOOKS.map((subject,i)=>({
   subject,source_range:`unit ${i}`
  }));
  const pkg=window.ReadyAssignments.upsertTalentPackage({
   actor:'PARENT',source_date:today,deadline_boundary:deadline,books
  });
  for(const id of pkg.fact_ids)window.ReadyAssignments.confirmFact(id,{actor:'PARENT'});
  const accepted=window.ReadyIntegrationV1.processAssignment(pkg.fact_ids[0],
   {candidate_dates:[today]});
  const todo=window.ReadySetPlanner.snapshot().dated_todos.find(x=>
   x.assignment_id===pkg.fact_ids[0]&&x.source==='PLANNER_V2_ALLOCATION');
  if(!accepted.ok||!todo||todo.date!==today)
   return {ok:false,accepted,todo};
  const unit=window.ReadyAssignments.load().learningUnits[todo.learning_unit_id];
  state.selectedTodoIds=[todo.todo_id];state.targetMin=1;save();
  document.getElementById('startBtn').click();
  return {ok:true,todo_id:todo.todo_id,
   subject:unit.subject,skill:unit.concept_skill_target,
   target:unit.learning_unit_id};
 });
 expect(setup.ok).toBe(true);
 await expect.poll(()=>page.evaluate(()=>window.ReadySetRev07.contract()?.tasks?.length)).toBe(1);
 return setup;
}

const snapUrl='https://cheerful-pothos-d1c3ee.netlify.app/';

test('Real confirmed assignment→Learning Master→Planner→Ready sends exact selected-child Snap target, not label inference',async({page})=>{
 const data=await setup(page);
 await page.route(snapUrl+'**',route=>route.abort());
 const request=page.waitForRequest(r=>r.url().startsWith(snapUrl+'?'));
 const launched=await page.evaluate(()=>window.ReadySetRev07.launchSpecialist('snap-pop'));
 expect(launched).toBe(true);
 const url=new URL((await request).url());
 expect(url.searchParams.get('child_id')).toBe('CHILD_A');
 expect(url.searchParams.get('subject')).toBe(data.subject);
 expect(url.searchParams.get('concept_skill_target')).toBe(data.skill);
 expect(url.searchParams.get('learning_target_id')).toBe(data.target);
 expect(url.searchParams.get('return_target')).toBe('http://127.0.0.1:4173/');
 expect(url.searchParams.get('from_app')).toBe('ready-set');
 expect(url.searchParams.get('task_id')).toBeTruthy();
 expect(url.searchParams.get('lap_id')).toBeTruthy();
 expect(url.searchParams.has('verification_receipt')).toBe(false);
 expect(url.searchParams.has('family_id')).toBe(false); // server owns family authorization
});

test('Changed selected child blocks Snap navigation and preserves the ongoing Ready task',async({page})=>{
 await setup(page);
 const result=await page.evaluate(()=>{
  const before=window.ReadySetRev07.contract();
  window.__snapFixtureScope.selected_member_id='CHILD_B';
  const launched=window.ReadySetRev07.launchSpecialist('snap-pop');
  const after=window.ReadySetRev07.contract();
  return {launched,beforeActive:before.active_app,afterActive:after.active_app,
   unchangedLap:before.active_lap_id===after.active_lap_id,
   event:after.events.at(-1)?.payload};
 });
 expect(result.launched).toBe(false);
 expect(result.beforeActive).toBe('ready-set');
 expect(result.afterActive).toBe('ready-set');
 expect(result.unchangedLap).toBe(true);
 expect(result.event.reason).toBe('READY_SNAP_SELECTED_MEMBER_CHANGED');
});

test('Stale assignment revision retains local Snap route but omits all attributed learning scope',async({page})=>{
 await setup(page);
 await page.evaluate(()=>{
  const todo=window.ReadySetPlanner.snapshot().dated_todos.find(t=>
   t.todo_id===window.ReadySetRev07.contract().tasks[0].planner_todo_id);
  const d=window.ReadyAssignments.load();
  d.assignmentFacts[todo.assignment_id].fact_revision+=1;
  d.assignmentFacts[todo.assignment_id].planner_revision_pending=true;
  window.ReadyAssignments.save(d);
 });
 await page.route(snapUrl+'**',route=>route.abort());
 const request=page.waitForRequest(r=>r.url().startsWith(snapUrl+'?'));
 const launched=await page.evaluate(()=>window.ReadySetRev07.launchSpecialist('snap-pop'));
 expect(launched).toBe(true);
 const url=new URL((await request).url());
 for(const key of ['child_id','subject','concept_skill_target','learning_target_id'])
  expect(url.searchParams.has(key)).toBe(false);
 expect(url.searchParams.get('task_id')).toBeTruthy();
});
