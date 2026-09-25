const {test,expect}=require('@playwright/test');

test('adaptive Ready review fails closed without independent Core decision',async({page})=>{
  await page.addInitScript(()=>{window.__READY_AUTH_BOOTSTRAP__={authenticated:true,family_id:'TEST_FAMILY',member_id:'TEST_PARENT',role:'PARENT',session_id:'TEST_SESSION',expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'};});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const out=await page.evaluate(()=>({
    evidence:window.ReadyIntegrationV1.reviewLearningEvidence('any-assignment',{}),
    carry:window.ReadyIntegrationV1.reviewEscalatedCarryOver('any-carry',{})
  }));
  expect(out.evidence.ok).toBe(false);
  expect(out.evidence.reason).toBe('LEARNING_DECISION_REQUIRED');
  expect(out.evidence.legacy_learning_logic_used).toBe(false);
  expect(out.evidence.compatibility_path_available).toBe(true);
  expect(out.carry.ok).toBe(false);
  expect(out.carry.reason).toBe('LEARNING_DECISION_REQUIRED');
  expect(out.carry.legacy_learning_logic_used).toBe(false);
  expect(out.carry.compatibility_path_available).toBe(true);
});
