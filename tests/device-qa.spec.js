const {test,expect}=require('@playwright/test');

test('Device QA page seeds isolated TODAY data and exposes verification state',async({page})=>{
  await page.goto('http://127.0.0.1:4173/device-qa.html',{waitUntil:'load'});
  await page.locator('#seed').click();
  const seeded=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('readyset_planner_v1'));
    const todo=s.dated_todos.find(x=>x.todo_id==='DEVICE_QA_TODO_SCIENCE_01');
    return {todo,qa:JSON.parse(localStorage.getItem('readyset_device_qa_v1'))};
  });
  expect(seeded.todo).toBeTruthy();
  expect(seeded.todo.label).toContain('과학 지층과 화석');
  expect(seeded.todo.assignment_id).toBeTruthy();
  expect(seeded.todo.analysis_id).toBeTruthy();
  expect(seeded.todo.learning_unit_id).toBeTruthy();
  expect(seeded.todo.template_id).toBeTruthy();
  expect(seeded.todo.allocation_run_id).toBeTruthy();
  expect(seeded.qa.status).toBe('SEEDED');
  await page.locator('#clear').click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('readyset_planner_v1')).dated_todos.some(x=>x.todo_id==='DEVICE_QA_TODO_SCIENCE_01'))).toBeFalsy();
});
