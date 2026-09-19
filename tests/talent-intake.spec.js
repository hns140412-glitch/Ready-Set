const {test,expect}=require('@playwright/test');
test('Parent Talent intake creates six confirmed facts and zero TODOs',async({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.locator('[data-nav="planner"]').first().click();
  await page.locator('[data-nav="planner-admin"]').click();
  const dates=await page.evaluate(()=>{const a=new Date(),b=new Date();b.setDate(b.getDate()+7);const f=d=>d.toLocaleDateString('sv-SE');return{source:f(a),deadline:f(b)}});
  await page.locator('#talentSourceDate').fill(dates.source);await page.locator('#talentDeadline').fill(dates.deadline);
  const rows=page.locator('[data-talent-book]');expect(await rows.count()).toBe(6);
  for(let i=0;i<6;i++)await rows.nth(i).locator('[data-range]').fill(`범위 ${i+1}`);
  await page.locator('#saveTalentFactsBtn').click();
  const result=await page.evaluate(()=>({domain:window.ReadyAssignments.load(),planner:window.ReadySetPlanner.snapshot()}));
  expect(Object.values(result.domain.assignmentFacts).filter(x=>x.source_type==='TALENT_BOOK_ASSIGNMENT')).toHaveLength(6);
  expect(Object.values(result.domain.assignmentFacts).every(x=>x.confirmation_state==='FACT_CONFIRMED')).toBeTruthy();
  expect(result.planner.dated_todos).toHaveLength(0);
});
