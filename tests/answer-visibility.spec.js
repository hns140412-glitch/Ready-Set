const {test,expect}=require('@playwright/test');
test('ANSWER_REFERENCE is structurally excluded from Child projection',async({page})=>{
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
  const out=await page.evaluate(()=>{
    const books=window.ReadyAssignmentDomainV2.TALENT_BOOKS.map((subject,i)=>({subject,source_range:`r${i}`,answer_reference_ids:[`answer_${i}`]}));
    window.ReadyAssignments.upsertTalentPackage({actor:'PARENT',source_date:'2026-09-20',deadline_boundary:'2026-09-27',books});
    return {parent:window.ReadyAssignments.project('PARENT'),child:window.ReadyAssignments.project('CHILD')};
  });
  expect(out.parent.artifacts.filter(x=>x.kind==='ANSWER_REFERENCE')).toHaveLength(6);
  expect(out.child.artifacts.filter(x=>x.kind==='ANSWER_REFERENCE')).toHaveLength(0);
  expect(out.child.facts.flatMap(f=>f.claims||[]).flatMap(c=>c.value.answer_reference_ids||[])).toHaveLength(0);
});
