const {test,expect}=require('@playwright/test');
test('Planner V2 accepts interpreted units and preserves full identity chain',async({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const out=await page.evaluate(()=>{
    const today=new Date().toLocaleDateString('sv-SE'),end=new Date();end.setDate(end.getDate()+7);const deadline=end.toLocaleDateString('sv-SE');
    const books=window.ReadyAssignmentDomainV2.TALENT_BOOKS.map((subject,i)=>({subject,source_range:`unit ${i}`}));
    const pkg=window.ReadyAssignments.upsertTalentPackage({actor:'PARENT',source_date:today,deadline_boundary:deadline,books});
    for(const id of pkg.fact_ids)window.ReadyAssignments.confirmFact(id,{actor:'PARENT'});
    const result=window.ReadyIntegrationV1.processAssignment(pkg.fact_ids[0],{candidate_dates:[today,deadline]});
    return {result,todo:window.ReadySetPlanner.snapshot().dated_todos[0],deadline};
  });
  expect(out.result.ok).toBeTruthy();
  for(const key of ['assignment_id','analysis_id','learning_unit_id','todo_id','template_id','allocation_run_id'])expect(out.todo[key]).toBeTruthy();
  expect(out.todo.date).not.toBe(out.deadline);
  expect(out.todo.estimated_minutes).toBeNull();
});
