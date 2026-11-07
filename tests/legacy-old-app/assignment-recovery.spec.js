const {test,expect}=require('@playwright/test');
test('assignment aggregate recovers from IndexedDB snapshot',async({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.evaluate(()=>window.ReadyAssignments.addEventFact({assignment_id:'recover_fact',actor:'CHILD',title:'준비물 확인'}));
  await expect.poll(()=>page.evaluate(async()=>(await window.ReadySetLocalFirst.snapshots()).some(x=>x.scope==='assignments'))).toBeTruthy();
  await page.evaluate(()=>localStorage.removeItem('readyset_assignments_v2'));
  const recovered=await page.evaluate(()=>window.ReadySetLocalFirst.recoverMissingScopes());
  expect(recovered.recovered).toBeGreaterThan(0);
  expect(await page.evaluate(()=>!!window.ReadyAssignments.load().assignmentFacts.recover_fact)).toBeTruthy();
});
