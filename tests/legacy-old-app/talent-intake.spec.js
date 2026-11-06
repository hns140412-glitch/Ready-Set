const {test,expect}=require('@playwright/test');
test('Parent Talent intake creates six confirmed/interpreted facts and Planner TODOs',async({page})=>{
  await page.addInitScript(() => {
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,
      family_id:'TEST_FAMILY',
      member_id:'TEST_PARENT',
      role:'PARENT',
      session_id:'TEST_SESSION',
      expires_at:'2099-01-01T00:00:00.000Z',
      source:'TEST_ONLY'
    };
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.locator('[data-nav="planner"]').first().click();
  await page.locator('[data-nav="planner-admin"]').click();
  const dates=await page.evaluate(()=>{const a=new Date(),b=new Date();b.setDate(b.getDate()+7);const f=d=>d.toLocaleDateString('sv-SE');return{source:f(a),deadline:f(b)}});
  await page.locator('#talentSourceDate').fill(dates.source);await page.locator('#talentDeadline').fill(dates.deadline);
  const rows=page.locator('[data-talent-book]');expect(await rows.count()).toBe(6);
  for(let i=0;i<6;i++)await rows.nth(i).locator('[data-range]').fill(`범위 ${i+1}`);
  await page.locator('#saveTalentFactsBtn').click();
  await page.waitForFunction(() => {
    const domain=window.ReadyAssignments?.load?.();
    const facts=Object.values(domain?.assignmentFacts||{}).filter(x=>x.source_type==='TALENT_BOOK_ASSIGNMENT');
    return facts.length===6 && facts.every(x=>x.confirmation_state==='FACT_CONFIRMED'&&x.analysis_state==='INTERPRETED');
  });
  const result=await page.evaluate(()=>({domain:window.ReadyAssignments.load(),planner:window.ReadySetPlanner.snapshot()}));
  const facts=Object.values(result.domain.assignmentFacts).filter(x=>x.source_type==='TALENT_BOOK_ASSIGNMENT');
  expect(facts).toHaveLength(6);
  expect(facts.every(x=>x.confirmation_state==='FACT_CONFIRMED')).toBeTruthy();
  expect(facts.every(x=>x.analysis_state==='INTERPRETED')).toBeTruthy();
  expect(result.planner.dated_todos.length).toBeGreaterThan(0);
  expect(result.planner.dated_todos.every(x=>x.assignment_id&&x.analysis_id&&x.learning_unit_id&&x.todo_id)).toBeTruthy();
});
