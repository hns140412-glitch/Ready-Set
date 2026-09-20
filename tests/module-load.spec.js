const {test,expect}=require('@playwright/test');
test('integration modules load in browser order',async({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const loaded=await page.evaluate(()=>({
    family:!!window.ReadyFamilySession,
    local:!!window.ReadySetLocalFirst,domain:!!window.ReadyAssignmentDomainV2,
    assignments:!!window.ReadyAssignments,subjectMaster:!!window.ReadySubjectMasterV01,learningReference:!!window.ReadyLearningReferenceV01,learning:!!window.ReadyLearningMasterV01,
    planner:!!window.ReadySetPlanner,integration:!!window.ReadyIntegrationV1
  }));
  expect(Object.values(loaded).every(Boolean)).toBeTruthy();
});
