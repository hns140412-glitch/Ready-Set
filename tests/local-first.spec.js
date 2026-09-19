const { test, expect } = require('@playwright/test');

test('local-first sidecar mirrors planner/app state and keeps outbox pending without adapter', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });

  const version = await page.evaluate(() => window.ReadySetLocalFirst?.version || null);
  expect(version).toBe('0.2.0');

  await page.evaluate(() => {
    window.ReadySetPlanner.upsertDatedTodo({
      todo_id:'lf_todo_1',
      date:new Date().toISOString().slice(0,10),
      label:'Local First E2E',
      source:'E2E',
      state:'PLANNED'
    });
  });

  await page.locator('[data-nav="mission"]').first().click();
  await page.locator('#taskInput').fill('앱 상태 미러');
  await page.locator('#addTaskBtn').click();

  await expect.poll(async () => page.evaluate(async () => {
    const rows = await window.ReadySetLocalFirst.snapshots();
    return rows.map(x => x.scope).sort();
  })).toEqual(['assignments','planner']);

  const outbox = await page.evaluate(async () => window.ReadySetLocalFirst.outbox());
  expect(outbox.some(x => x.scope === 'planner' && x.status === 'PENDING')).toBeTruthy();
  expect(outbox.some(x => x.scope === 'assignments' && x.status === 'PENDING')).toBeTruthy();
  // SUPERSEDED_BY_CURRENT_TRUTH: manual child input is an Assignment Fact, not Ready app_state task creation.

  const flush = await page.evaluate(async () => window.ReadySetLocalFirst.flush());
  expect(flush.ok).toBeFalsy();
  expect(['NO_SYNC_ADAPTER','SYNC_NOT_CONFIGURED']).toContain(flush.reason);
  expect(flush.pending).toBeGreaterThan(0);

  const conflicts = await page.evaluate(async () => window.ReadySetLocalFirst.conflicts());
  expect(conflicts).toEqual([]);
});

test('recovers localStorage from IndexedDB snapshot after local data loss', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  expect(await page.evaluate(() => window.ReadySetLocalFirst?.version)).toBe('0.2.0');

  await page.evaluate(() => {
    window.ReadySetPlanner.upsertDatedTodo({
      todo_id:'recover_todo_1',
      date:new Date().toISOString().slice(0,10),
      label:'복구 검증',
      source:'E2E',
      state:'PLANNED'
    });
  });

  await expect.poll(async () => page.evaluate(async () => {
    const rows=await window.ReadySetLocalFirst.snapshots();
    return rows.some(x=>x.scope==='planner' && x.payload.includes('recover_todo_1'));
  })).toBeTruthy();

  await page.evaluate(() => localStorage.removeItem('readyset_planner_v1'));
  await page.reload({ waitUntil:'domcontentloaded' });
  await page.waitForFunction(() => !!window.ReadySetPlanner);

  const recovered = await page.evaluate(() => window.ReadySetPlanner.snapshot().dated_todos.some(x=>x.todo_id==='recover_todo_1'));
  expect(recovered).toBeTruthy();
});

test('captures sync conflict and resolves KEEP_LOCAL and ACCEPT_REMOTE explicitly', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });

  await page.evaluate(() => {
    window.ReadySetPlanner.upsertDatedTodo({
      todo_id:'conflict_todo_1',
      date:new Date().toISOString().slice(0,10),
      label:'충돌 검증',
      source:'E2E',
      state:'PLANNED'
    });
  });

  await expect.poll(async () => page.evaluate(async () => (await window.ReadySetLocalFirst.outbox()).some(x=>x.scope==='planner' && x.status==='PENDING'))).toBeTruthy();

  await page.evaluate(() => {
    window.ReadySetSyncAdapter={
      send: async row => row.scope==='planner'
        ? {conflict:true,remote_payload:{schema_version:1,dated_todos:[{todo_id:'remote_todo',date:'2099-01-01',label:'REMOTE',state:'PLANNED'}]}}
        : {ok:true}
    };
  });
  const flushed=await page.evaluate(() => window.ReadySetLocalFirst.flush());
  expect(flushed.conflicts).toBeGreaterThan(0);

  const conflictId=await page.evaluate(async () => {
    const c=(await window.ReadySetLocalFirst.conflicts()).find(x=>x.scope==='planner' && x.status==='OPEN');
    return c?.id||null;
  });
  expect(conflictId).toBeTruthy();

  const kept=await page.evaluate(id => window.ReadySetLocalFirst.resolveConflict(id,'KEEP_LOCAL'), conflictId);
  expect(kept.ok).toBeTruthy();
  expect(kept.reload_required).toBeFalsy();

  await page.evaluate(() => {
    window.ReadySetSyncAdapter={send:async()=>({conflict:true,remote_payload:{schema_version:1,dated_todos:[{todo_id:'remote_todo_2',date:'2099-01-02',label:'REMOTE2',state:'PLANNED'}]}})};
  });
  await page.evaluate(() => window.ReadySetLocalFirst.flush());
  const secondId=await page.evaluate(async () => {
    const open=(await window.ReadySetLocalFirst.conflicts()).filter(x=>x.scope==='planner' && x.status==='OPEN');
    return open.at(-1)?.id||null;
  });
  expect(secondId).toBeTruthy();

  const accepted=await page.evaluate(id => window.ReadySetLocalFirst.resolveConflict(id,'ACCEPT_REMOTE'), secondId);
  expect(accepted.ok).toBeTruthy();
  expect(accepted.reload_required).toBeTruthy();

  const raw=await page.evaluate(() => localStorage.getItem('readyset_planner_v1'));
  expect(raw).toContain('remote_todo_2');
});
