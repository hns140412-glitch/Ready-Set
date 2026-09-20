const {test,expect}=require('@playwright/test');
test('English actor conflict and unverified academy block analysis/allocation/TODO',async({page})=>{
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
    window.ReadyFamilySession={...window.ReadyFamilySession,requireRole:()=>({ok:true,session:window.ReadyFamilySession.current()})};
    const ref=window.ReadyAssignments.upsertWorkbookRef({name:'Workbook'});
    window.ReadyAssignments.upsertEnglishAssignment({assignment_id:'eng_conflict',actor:'PARENT',workbook_ref_id:ref.workbook_ref_id,source_range:'p.1~5',next_academy:''});
    window.ReadyAssignments.upsertEnglishAssignment({assignment_id:'eng_conflict',actor:'CHILD',workbook_ref_id:ref.workbook_ref_id,source_range:'p.1~8',next_academy:''});
    const fact=window.ReadyAssignments.load().assignmentFacts.eng_conflict;
    let confirmError='';try{window.ReadyAssignments.confirmFact('eng_conflict',{actor:'PARENT'})}catch(e){confirmError=e.message}
    const run=window.ReadyIntegrationV1.processAssignment('eng_conflict');
    return {fact,confirmError,run,todos:window.ReadySetPlanner.snapshot().dated_todos};
  });
  expect(out.fact.confirmation_state).toBe('CONFIRMATION_REQUIRED');
  expect(out.confirmError).toContain('conflict');
  expect(out.run.ok).toBeFalsy();expect(out.todos).toHaveLength(0);
});
