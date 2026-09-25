const {test,expect}=require('@playwright/test');
test('adaptive profile isolates member and subject evidence',async({page})=>{
  await page.addInitScript(()=>{window.__READY_AUTH_BOOTSTRAP__={authenticated:true,family_id:'F',member_id:'A',role:'CHILD',session_id:'S',expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'};});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const r=await page.evaluate(()=>{
    const row=(member,subject,n,id)=>({member_id:member,subject,at:'2026-09-24T07:00:00.000Z',ready_state:'COMPLETED',learning_evidence:[{evidence_id:id,evidence_type:'MEMORY_RETRIEVAL_EVIDENCE',memory:{average_strength:n,review_advisories:[]}}]});
    const all=[row('A','영어',82,'a1'),row('A','영어',80,'a2'),row('A','영어',65,'a3'),row('A','수학',20,'m1'),row('B','영어',10,'b1')];
    const opts={as_of:'2026-09-25T12:00:00.000Z'};
    return {
      ae:window.ReadyIntegrationV1.learnerAdaptiveProfile(all,{...opts,member_id:'A',subject:'영어'}),
      am:window.ReadyIntegrationV1.learnerAdaptiveProfile(all,{...opts,member_id:'A',subject:'수학'}),
      be:window.ReadyIntegrationV1.learnerAdaptiveProfile(all,{...opts,member_id:'B',subject:'영어'})
    };
  });
  expect(r.ae.memory_sample_count).toBe(3); expect(r.ae.trend).toBe('DECLINING'); expect(r.ae.baseline_memory_strength).toBe(81);
  expect(r.am.memory_sample_count).toBe(1); expect(r.am.trend).toBe('INSUFFICIENT_EVIDENCE');
  expect(r.be.memory_sample_count).toBe(1); expect(r.be.trend).toBe('INSUFFICIENT_EVIDENCE');
  expect(r.ae.member_scope).toBe('A'); expect(r.ae.subject_scope).toBe('영어');
});
