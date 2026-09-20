const {test,expect}=require('@playwright/test');

test('anonymous local session is CHILD and cannot enter Parent/Admin',async({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const session=await page.evaluate(()=>window.ReadyFamilySession.current());
  expect(session.authenticated).toBeFalsy();
  expect(session.role).toBe('CHILD');

  await page.locator('[data-nav="planner"]').first().click();
  const adminButton=page.locator('[data-nav="planner-admin"]').first();
  await expect(adminButton).toBeHidden();

  const out=await page.evaluate(()=>{
    let error='';
    try{
      window.ReadyAssignments.upsertTalentPackage({
        actor:'PARENT',
        source_date:'2026-09-20',
        deadline_boundary:'2026-09-27',
        books:window.ReadyAssignmentDomainV2.TALENT_BOOKS.map(subject=>({subject,source_range:'r'}))
      });
    }catch(e){error=e.message}
    return {error,count:Object.keys(window.ReadyAssignments.load().assignmentFacts).length};
  });
  expect(out.error).toContain('PARENT_AUTH_REQUIRED');
  expect(out.count).toBe(0);
});

test('authenticated Parent bootstrap unlocks Parent authority only for that session',async({page})=>{
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
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const session=await page.evaluate(()=>window.ReadyFamilySession.current());
  expect(session.authenticated).toBeTruthy();
  expect(session.role).toBe('PARENT');
  expect(session.family_id).toBe('TEST_FAMILY');

  await page.locator('[data-nav="planner"]').first().click();
  const adminButton=page.locator('[data-nav="planner-admin"]').first();
  await expect(adminButton).toBeVisible();
  await adminButton.click();
  await expect(page.locator('#plannerAdminView')).toHaveClass(/active/);

  const out=await page.evaluate(()=>{
    const pkg=window.ReadyAssignments.upsertTalentPackage({
      actor:'PARENT',
      source_date:'2026-09-20',
      deadline_boundary:'2026-09-27',
      books:window.ReadyAssignmentDomainV2.TALENT_BOOKS.map(subject=>({subject,source_range:'r'}))
    });
    return {facts:pkg.fact_ids.length,projection:window.ReadyAssignments.project('PARENT')};
  });
  expect(out.facts).toBe(6);
  expect(out.projection.role).toBe('PARENT');
});

test('authenticated family session can use same-origin remote sync without browser bearer token',async({page})=>{
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
  let authorization=null;
  await page.route('**/api/ready-sync/events',async route=>{
    authorization=route.request().headers()['authorization']||null;
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,remote_version:1})});
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const status=await page.evaluate(()=>window.ReadySetSyncAdapter.status());
  expect(status.enabled).toBeTruthy();
  expect(status.endpoint).toBe('/api/ready-sync');
  const result=await page.evaluate(()=>window.ReadySetSyncAdapter.send({
    id:'evt_auth_boundary',
    scope:'planner',
    digest:'x',
    payload:'{}'
  }));
  expect(result).toEqual({ok:true,remote_version:1});
  expect(authorization).toBeNull();
});
