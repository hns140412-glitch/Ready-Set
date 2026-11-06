const { test, expect } = require('@playwright/test');

test('sync adapter stays truthful when not configured', async ({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const s=await page.evaluate(()=>window.ReadySetSyncAdapter.status());
  expect(s.state).toBe('LOCAL_ONLY');
  expect(s.configured).toBeFalsy();

  const r=await page.evaluate(()=>window.ReadySetSyncAdapter.send({
    id:'evt_test',scope:'planner',digest:'abc',payload:'{}',created_at:new Date().toISOString(),updated_at:new Date().toISOString()
  }));
  expect(r).toEqual({ok:false,reason:'SYNC_NOT_CONFIGURED'});

  await page.locator('[data-nav="settings"]').first().click();
  await expect(page.locator('#syncStateBadge')).toHaveText('로컬 저장');
  await expect(page.locator('#syncStatusText')).toContainText('클라우드 동기화는 아직 연결되지 않았습니다');
});

test('HTTP sync adapter contract uses authenticated same-origin session and handles conflict', async ({page})=>{
  await page.addInitScript(()=>{
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,family_id:'TEST_FAMILY',member_id:'TEST_PARENT',role:'PARENT',
      session_id:'TEST_SESSION',expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'
    };
  });
  const seen=[];
  await page.route('**/sync-test/health',async route=>{
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,service:'mock-sync'})});
  });
  await page.route('**/sync-test/events',async route=>{
    const req=route.request();
    const body=JSON.parse(req.postData()||'{}');
    seen.push({body,idem:req.headers()['idempotency-key'],authorization:req.headers()['authorization']||null});
    if(body.event_id==='evt_conflict'){
      await route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({reason:'REMOTE_CONFLICT',remote_payload:'{"remote":true}'})});
    }else{
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,remote_version:7})});
    }
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.evaluate(()=>{
    window.ReadySetSyncAdapter.configure({endpoint:'http://127.0.0.1:4173/sync-test',enabled:true});
  });
  const health=await page.evaluate(()=>window.ReadySetSyncAdapter.health());
  expect(health.ok).toBeTruthy();
  expect(health.status.state).toBe('CONNECTED');

  const sent=await page.evaluate(()=>window.ReadySetSyncAdapter.send({
    id:'evt_ok',idempotency_key:'evt_ok',scope:'planner',digest:'abc',payload:'{"x":1}',
    created_at:'2026-09-20T00:00:00.000Z',updated_at:'2026-09-20T00:00:00.000Z'
  }));
  expect(sent).toEqual({ok:true,remote_version:7});

  const conflict=await page.evaluate(()=>window.ReadySetSyncAdapter.send({
    id:'evt_conflict',idempotency_key:'evt_conflict',scope:'app_state',digest:'def',payload:'{"x":2}',
    created_at:'2026-09-20T00:00:00.000Z',updated_at:'2026-09-20T00:00:00.000Z'
  }));
  expect(conflict.conflict).toBeTruthy();
  expect(conflict.remote_payload).toBe('{"remote":true}');
  expect(seen).toHaveLength(2);
  expect(seen[0].idem).toBe('evt_ok');
  expect(seen[0].body.client.adapter_version).toBe('0.3.0');
  expect(seen[0].authorization).toBeNull();
});

test('local-first outbox flush uses configured sync adapter only in authenticated family session', async ({page})=>{
  await page.addInitScript(()=>{
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,family_id:'TEST_FAMILY',member_id:'TEST_PARENT',role:'PARENT',
      session_id:'TEST_SESSION',expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'
    };
  });
  let count=0;
  await page.route('**/sync-flush/events',async route=>{
    count++;
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,remote_version:1})});
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.evaluate(async()=>{
    window.ReadySetSyncAdapter.configure({endpoint:'http://127.0.0.1:4173/sync-flush',enabled:true});
    await window.ReadySetLocalFirst.capture('planner',{probe:'sync-flush'});
  });
  const before=await page.evaluate(async()=> (await window.ReadySetLocalFirst.outbox()).filter(x=>x.status==='PENDING').length);
  expect(before).toBeGreaterThan(0);
  const result=await page.evaluate(()=>window.ReadySetLocalFirst.flush());
  expect(result.ok).toBeTruthy();
  expect(result.sent).toBeGreaterThan(0);
  expect(count).toBeGreaterThan(0);
});