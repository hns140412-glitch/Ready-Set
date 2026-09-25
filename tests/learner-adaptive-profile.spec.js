const {test,expect}=require('@playwright/test');

test('learner adaptive profile distinguishes personal decline from stable baseline without taking schedule authority',async({page})=>{
  await page.addInitScript(()=>{window.__READY_AUTH_BOOTSTRAP__={authenticated:true,family_id:'TEST_FAMILY',member_id:'TEST_CHILD',role:'CHILD',session_id:'TEST_SESSION',expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'};});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const result=await page.evaluate(()=>{
    const ev=n=>({evidence_type:'MEMORY_RETRIEVAL_EVIDENCE',memory:{average_strength:n,review_advisories:[]}});
    const rows=a=>a.map((n,i)=>({ready_state:'COMPLETED',learning_evidence:[ev(n)],at:'2026-09-'+String(20+i).padStart(2,'0')+'T07:00:00.000Z'}));
    const declining=window.ReadyIntegrationV1.learnerAdaptiveProfile(rows([82,80,65]));
    const stable=window.ReadyIntegrationV1.learnerAdaptiveProfile(rows([65,64,65]));
    const insufficient=window.ReadyIntegrationV1.learnerAdaptiveProfile(rows([40,55]));
    return {declining,stable,insufficient};
  });
  expect(result.declining.trend).toBe('DECLINING');
  expect(result.declining.baseline_memory_strength).toBe(81);
  expect(result.declining.latest_memory_strength).toBe(65);
  expect(result.stable.trend).toBe('STABLE');
  expect(result.insufficient.trend).toBe('INSUFFICIENT_EVIDENCE');
  expect(result.declining.cannot_influence).toContain('SCHEDULE_DATE');
  expect(result.declining.cannot_influence).toContain('PLANNER_DATE');
});
