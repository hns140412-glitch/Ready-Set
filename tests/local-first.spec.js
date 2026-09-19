const { test, expect } = require('@playwright/test');

test('local-first sidecar mirrors planner/app state and keeps outbox pending without adapter', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });

  const version = await page.evaluate(() => window.ReadySetLocalFirst?.version || null);
  expect(version).toBe('0.1.0');

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
  })).toEqual(['app_state','planner']);

  const outbox = await page.evaluate(async () => window.ReadySetLocalFirst.outbox());
  expect(outbox.some(x => x.scope === 'planner' && x.status === 'PENDING')).toBeTruthy();
  expect(outbox.some(x => x.scope === 'app_state' && x.status === 'PENDING')).toBeTruthy();

  const flush = await page.evaluate(async () => window.ReadySetLocalFirst.flush());
  expect(flush.ok).toBeFalsy();
  expect(flush.reason).toBe('NO_SYNC_ADAPTER');
  expect(flush.pending).toBeGreaterThan(0);

  const conflicts = await page.evaluate(async () => window.ReadySetLocalFirst.conflicts());
  expect(conflicts).toEqual([]);
});