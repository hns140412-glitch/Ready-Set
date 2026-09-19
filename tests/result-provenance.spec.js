const {test,expect}=require('@playwright/test');
test('PARTIAL result preserves upstream IDs through progress observation and carry',async({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const seeded=await page.evaluate(()=>{
    const today=new Date().toLocaleDateString('sv-SE'),end=new Date();end.setDate(end.getDate()+7);
    const books=window.ReadyAssignmentDomainV2.TALENT_BOOKS.map((subject,i)=>({subject,source_range:`u${i}`}));
    const pkg=window.ReadyAssignments.upsertTalentPackage({actor:'PARENT',source_date:today,deadline_boundary:end.toLocaleDateString('sv-SE'),books});const id=pkg.fact_ids[0];
    window.ReadyAssignments.confirmFact(id,{actor:'PARENT'});return window.ReadyIntegrationV1.processAssignment(id,{candidate_dates:[today]}).todos[0];
  });
  await page.locator('[data-nav="mission"]').first().click();await page.locator(`[data-todo-id="${seeded.todo_id}"]`).click();await page.locator('#startBtn').click();
  await page.locator('#completeBtn').click();const taskId=await page.evaluate(()=>window.ReadySetRev07.contract().tasks[0].task_id);
  await page.locator(`[data-wrap-state="PARTIAL"][data-task-id="${taskId}"]`).click();await page.locator('#rev07ConfirmEnd').click();
  const x=await page.evaluate(()=>{const s=window.ReadySetPlanner.snapshot();return{p:s.progress_events.at(-1),o:s.execution_observations.at(-1),c:s.carry_over_queue.at(-1)}});
  for(const row of [x.p,x.o,x.c]){expect(row.todo_id||row.source_todo_id).toBe(seeded.todo_id);expect(row.assignment_id).toBe(seeded.assignment_id);expect(row.analysis_id).toBe(seeded.analysis_id);expect(row.learning_unit_id).toBe(seeded.learning_unit_id)}
});
