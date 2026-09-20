const {test,expect}=require('@playwright/test');

test('P2 Child FACT -> Parent confirm -> Learning Master -> Planner -> TODAY is authority-gated end to end',async({page})=>{
  await page.addInitScript(() => {
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,
      family_id:'TEST_FAMILY',
      member_id:'TEST_CHILD',
      role:'CHILD',
      session_id:'TEST_CHILD_SESSION',
      expires_at:'2099-01-01T00:00:00.000Z',
      source:'TEST_ONLY'
    };
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});

  await page.locator('[data-nav="mission"]').first().click();
  await page.locator('#taskInput').fill('사회 32~35쪽 읽고 문제 풀기');
  await page.locator('#addTaskBtn').click();

  const captured=await page.evaluate(()=>{
    const facts=Object.values(window.ReadyAssignments.load().assignmentFacts);
    return facts.find(x=>x.source_type==='GENERIC_CHILD_ASSIGNMENT')||null;
  });
  expect(captured).toBeTruthy();
  expect(captured.source_actor).toBe('CHILD');
  expect(captured.confirmation_state).not.toBe('FACT_CONFIRMED');
  expect(await page.evaluate(id=>window.ReadySetPlanner.snapshot().dated_todos.some(x=>x.assignment_id===id),captured.assignment_id)).toBeFalsy();

  const childConfirm=await page.evaluate(id=>{
    try{window.ReadyAssignments.confirmFact(id,{actor:'CHILD'});return {ok:true}}
    catch(error){return {ok:false,reason:error.message}}
  },captured.assignment_id);
  expect(childConfirm).toEqual({ok:false,reason:'PARENT_CONFIRMATION_REQUIRED'});

  await page.evaluate(()=>{
    window.ReadyFamilySession.requireRole=()=>({ok:true});
  });
  await page.locator('[data-nav="planner"]').first().click();
  await page.locator('[data-nav="planner-admin"]').click();

  const row=page.locator(`[data-child-fact-row="${captured.assignment_id}"]`);
  await expect(row).toBeVisible();
  await row.locator('[data-child-review-subject]').fill('사회');
  await row.locator('[data-child-review-range]').fill('32~35번');
  const deadline=await page.evaluate(()=>{const d=new Date();d.setDate(d.getDate()+1);return d.toLocaleDateString('sv-SE')});
  await row.locator('[data-child-review-deadline]').fill(deadline);
  await row.locator('[data-confirm-child-fact]').click();

  await page.waitForFunction(id=>{
    const s=window.ReadyAssignments.load(),f=s.assignmentFacts[id];
    return f?.confirmation_state==='FACT_CONFIRMED'&&f?.confirmed_by==='PARENT'&&f?.analysis_state==='INTERPRETED'&&
      window.ReadySetPlanner.todayProjection().some(x=>x.assignment_id===id&&x.analysis_id&&x.learning_unit_id&&x.todo_id);
  },captured.assignment_id);

  const closed=await page.evaluate(id=>{
    const s=window.ReadyAssignments.load(),f=s.assignmentFacts[id];
    const analysis=s.analyses[f.current_analysis_id];
    const today=window.ReadySetPlanner.todayProjection().filter(x=>x.assignment_id===id);
    return {fact:f,analysis,today};
  },captured.assignment_id);

  expect(closed.fact.confirmed_by).toBe('PARENT');
  expect(closed.fact.subject).toBe('사회');
  expect(closed.fact.source_range).toBe('32~35번');
  expect(closed.analysis.state).toBe('INTERPRETED');
  expect(closed.today.length).toBeGreaterThan(0);
  expect(closed.today.every(x=>x.assignment_id&&x.analysis_id&&x.learning_unit_id&&x.todo_id)).toBeTruthy();
});
