const {test,expect}=require('@playwright/test');

test('Parent active child selection scopes Planner by learner while preserving actor identity',async({page})=>{
  await page.addInitScript(()=>{
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

  await page.route('**/api/family/members',async route=>{
    await route.fulfill({
      status:200,
      contentType:'application/json',
      body:JSON.stringify({ok:true,registry:{
        family_id:'TEST_FAMILY',
        revision:1,
        members:[
          {family_id:'TEST_FAMILY',member_id:'TEST_PARENT',role:'PARENT',profile:{display_name:'Parent'}},
          {family_id:'TEST_FAMILY',member_id:'CHILD_A',role:'CHILD',profile:{display_name:'Child A'}},
          {family_id:'TEST_FAMILY',member_id:'CHILD_B',role:'CHILD',profile:{display_name:'Child B'}}
        ]
      }})
    });
  });

  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await expect.poll(()=>page.evaluate(()=>window.ReadyFamilyRegistry?.children?.().length||0)).toBe(2);

  await page.evaluate(()=>window.ReadyFamilyRegistry.selectActiveChild('CHILD_A'));
  await page.evaluate(()=>window.ReadySetPlanner.upsertScheduleCommitment({title:'A piano',source:'TEST'}));
  await expect.poll(()=>page.evaluate(async()=>{
    const rows=await window.ReadySetLocalFirst.snapshots();
    return rows.some(x=>x.scope==='planner'&&x.scope_key?.includes('/member/CHILD_A/')&&x.actor_member_id==='TEST_PARENT');
  })).toBeTruthy();
  expect(await page.evaluate(()=>window.ReadySetPlanner.snapshot().schedule_commitments.map(x=>x.title))).toEqual(['A piano']);

  await page.evaluate(()=>window.ReadyFamilyRegistry.selectActiveChild('CHILD_B'));
  expect(await page.evaluate(()=>window.ReadySetPlanner.snapshot().schedule_commitments.length)).toBe(0);
  await page.evaluate(()=>window.ReadySetPlanner.upsertScheduleCommitment({title:'B science',source:'TEST'}));
  expect(await page.evaluate(()=>window.ReadySetPlanner.snapshot().schedule_commitments.map(x=>x.title))).toEqual(['B science']);

  await page.evaluate(()=>window.ReadyFamilyRegistry.selectActiveChild('CHILD_A'));
  expect(await page.evaluate(()=>window.ReadySetPlanner.snapshot().schedule_commitments.map(x=>x.title))).toEqual(['A piano']);

  const scopes=await page.evaluate(async()=>({
    planner:window.ReadySetLocalFirst.storageKey('planner'),
    app:window.ReadySetLocalFirst.storageKey('app_state')
  }));
  expect(scopes.planner).toContain('/member/CHILD_A');
  expect(scopes.app).toContain('/member/TEST_PARENT');
});
