const { test, expect } = require('@playwright/test');

test('PWA service worker controls app and supports offline reload with local state', async ({ page, context }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'load' });

  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.ready;
    return !!reg?.active;
  });

  await page.reload({ waitUntil:'domcontentloaded' });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);

  const pwa = await page.evaluate(async () => {
    const manifestLink=document.querySelector('link[rel="manifest"]')?.getAttribute('href');
    const reg=await navigator.serviceWorker.ready;
    return {
      controlled:!!navigator.serviceWorker.controller,
      scope:reg.scope,
      manifestLink,
      displayMode:matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
    };
  });
  expect(pwa.controlled).toBeTruthy();
  expect(pwa.manifestLink).toContain('manifest.webmanifest');

  await page.locator('[data-nav="mission"]').first().click();
  await page.locator('#missionView .missionFactInbox summary').click();
  await page.locator('#taskInput').fill('오프라인 복구 검증');
  await page.locator('#addTaskBtn').click();

  await expect.poll(async () => page.evaluate(async () => {
    const rows=await window.ReadySetLocalFirst.snapshots();
    return rows.some(x=>x.scope==='assignments' && x.payload.includes('오프라인 복구 검증'));
  })).toBeTruthy();

  await context.setOffline(true);
  await page.reload({ waitUntil:'domcontentloaded' });
  await expect(page.locator('#homeView')).toBeVisible();

  const restored=await page.evaluate(() => Object.values(window.ReadyAssignments.load().assignmentFacts).map(x=>x.claims?.at(-1)?.value?.title));
  expect(restored).toContain('오프라인 복구 검증');
  // SUPERSEDED_BY_CURRENT_TRUTH: manual child input persists as Assignment Fact, not a Ready-created task.

  const offlineAssets=await page.evaluate(() => ({
    runtime:!!window.ReadySetRev07,
    planner:!!window.ReadySetPlanner,
    localFirst:!!window.ReadySetLocalFirst,
    assignments:!!window.ReadyAssignments,
    learningMaster:!!window.ReadyLearningMasterV01
  }));
  expect(offlineAssets).toEqual({runtime:true,planner:true,localFirst:true,assignments:true,learningMaster:true});

  await context.setOffline(false);
});
