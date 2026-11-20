const {test,expect}=require('@playwright/test');
test('DATED TODO to TODAY to Mission to Session preserves todo and learning unit ids',async({page})=>{
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
  const seeded=await page.evaluate(()=>{
    const today=new Date().toLocaleDateString('sv-SE'),end=new Date();end.setDate(end.getDate()+7);
    const books=window.ReadyAssignmentDomainV2.TALENT_BOOKS.map((subject,i)=>({subject,source_range:`u${i}`}));
    const pkg=window.ReadyAssignments.upsertTalentPackage({actor:'PARENT',source_date:today,deadline_boundary:end.toLocaleDateString('sv-SE'),books});
    const id=pkg.fact_ids[0];window.ReadyAssignments.confirmFact(id,{actor:'PARENT'});const run=window.ReadyIntegrationV1.processAssignment(id,{candidate_dates:[today]});
    return run.todos[0];
  });
  await page.locator('[data-nav="mission"]').first().click();
  await page.locator(`[data-todo-id="${seeded.todo_id}"]`).click();
  await page.locator('#startBtn').click();
  const chain=await page.evaluate(()=>({link:state.activeSession.plannerLinks[0],task:window.ReadySetRev07.contract().tasks[0]}));
  expect(chain.link.todo_id).toBe(seeded.todo_id);expect(chain.task.planner_todo_id).toBe(seeded.todo_id);
  expect(chain.task.learning_unit_id).toBe(seeded.learning_unit_id);
});
