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


test('server session hydration establishes Parent identity without test bootstrap',async({page})=>{
  await page.route('**/api/auth/session',async route=>{
    await route.fulfill({
      status:200,
      contentType:'application/json',
      body:JSON.stringify({ok:true,session:{
        authenticated:true,
        family_id:'family_server_parent',
        member_id:'parent_server',
        role:'PARENT',
        session_id:'netlify_identity_parent_server',
        source:'NETLIFY_IDENTITY'
      }})
    });
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await expect.poll(()=>page.evaluate(()=>window.ReadyFamilySession.current().authenticated)).toBeTruthy();
  const session=await page.evaluate(()=>window.ReadyFamilySession.current());
  expect(session.role).toBe('PARENT');
  expect(session.family_id).toBe('family_server_parent');
  await page.locator('[data-nav="planner"]').first().click();
  await expect(page.locator('[data-nav="planner-admin"]').first()).toBeVisible();
});

test('settings login and logout update Family role through server API responses',async({page})=>{
  await page.route('**/api/auth/session',async route=>{
    await route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({ok:false,authenticated:false,reason:'UNAUTHENTICATED'})});
  });
  await page.route('**/api/auth/login',async route=>{
    const body=route.request().postDataJSON();
    expect(body.email).toBe('parent@example.test');
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,session:{
      authenticated:true,
      family_id:'family_login_parent',
      member_id:'parent_login',
      role:'PARENT',
      session_id:'netlify_identity_parent_login',
      source:'NETLIFY_IDENTITY'
    }})});
  });
  await page.route('**/api/auth/logout',async route=>{
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})});
  });

  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.locator('[data-nav="settings"]').first().click();
  await page.locator('#authEmailInput').fill('parent@example.test');
  await page.locator('#authPasswordInput').fill('test-password');
  await page.locator('#authLoginBtn').click();

  await expect(page.locator('#authStateBadge')).toHaveText('보호자');
  await expect(page.locator('#familyLinkChildSection')).toBeVisible();
  expect((await page.evaluate(()=>window.ReadyFamilySession.current())).role).toBe('PARENT');

  await page.locator('#authLogoutBtn').click();
  await expect(page.locator('#authStateBadge')).toHaveText('로컬 모드');
  expect((await page.evaluate(()=>window.ReadyFamilySession.current())).authenticated).toBeFalsy();
});

test('Parent can request linking an existing Child account through server family endpoint',async({page})=>{
  await page.addInitScript(()=>{
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,family_id:'TEST_FAMILY',member_id:'TEST_PARENT',role:'PARENT',
      session_id:'TEST_SESSION',expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'
    };
  });
  let linkedEmail='';
  await page.route('**/api/family/link-child',async route=>{
    linkedEmail=route.request().postDataJSON().email;
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,child:{email:linkedEmail,role:'CHILD',family_id:'TEST_FAMILY'}})});
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.locator('[data-nav="settings"]').first().click();
  await page.locator('#familyChildEmailInput').fill('child@example.test');
  const linkRequest=page.waitForRequest(req=>req.url().includes('/api/family/link-child')&&req.method()==='POST');
  await page.locator('#familyLinkChildBtn').click();
  await linkRequest;
  await expect.poll(()=>linkedEmail).toBe('child@example.test');
});


test('server-provisioned adult family relation stays outside Parent planner and Child role',async({page})=>{
  await page.route('**/api/auth/session',async route=>{
    await route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({ok:true,session:{
        authenticated:true,family_id:'FAMILY_X',member_id:'GRANDMA_X',
        role:'FAMILY_ADULT',family_relation:'GRANDPARENT',
        session_id:'netlify_identity_grandma_x',source:'NETLIFY_IDENTITY'
      }})});
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await expect.poll(()=>page.evaluate(()=>window.ReadyFamilySession.current().role)).toBe('FAMILY_ADULT');
  const state=await page.evaluate(()=>({
    parent:window.ReadyFamilySession.isParent(),
    child:window.ReadyFamilySession.isChild(),
    admin:window.ReadyFamilySession.requireRole('PARENT').ok,
    relation:window.ReadyFamilySession.current().family_relation
  }));
  expect(state).toEqual({parent:false,child:false,admin:false,relation:'GRANDPARENT'});
  await expect.poll(()=>page.evaluate(()=>window.ReadySetSyncAdapter.status().enabled)).toBeFalsy();
  const forbiddenSync=await page.evaluate(()=>window.ReadySetSyncAdapter.send({id:'forbidden-adult-event',scope:'planner',digest:'x',payload:'{}'}));
  expect(forbiddenSync.reason).toMatch(/SYNC_NOT_CONFIGURED|FAMILY_ADULT_READY_SYNC_NOT_AUTHORIZED/);
  await page.locator('[data-nav="planner"]').first().click();
  await expect(page.locator('[data-nav="planner-admin"]').first()).toBeHidden();
  await page.locator('#plannerView [data-nav="home"]').click();
  await page.locator('#homeView [data-nav="settings"]').first().click();
  await expect(page.locator('#authStateBadge')).toHaveText('가족 구성원');
  await expect(page.locator('#familyLinkChildSection')).toBeHidden();
});
