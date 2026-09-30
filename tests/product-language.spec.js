const { test, expect } = require('@playwright/test');

test('Ready product identity stays Base Camp / exploration and legacy Time Attack branding is absent', async ({ page, request }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });

  await expect(page.locator('.brand')).toHaveText('Ready & Set');
  await expect(page.locator('.heroCopy')).toContainText('BASE CAMP');
  await expect(page.locator('.heroCopy')).toContainText('오늘의');
  await expect(page.locator('.heroCopy')).toContainText('탐험 준비');

  const bodyText=await page.locator('body').innerText();
  expect(bodyText).not.toContain('타임어택');
  expect(bodyText).not.toContain('FOCUS MODE');
  expect(bodyText).not.toContain('FOCUS CHALLENGE');

  await page.locator('[data-nav="mission"]').first().click();
  await expect(page.locator('#missionView h1')).toHaveText('오늘의 작전 설정');
  await expect(page.locator('#startBtn')).toHaveText('작전 START');

  const manifestHref=await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBe('./manifest.webmanifest');
  const legacyManifest=await request.get('http://127.0.0.1:4173/manifest.json');
  expect(legacyManifest.status()).toBe(404);
});
