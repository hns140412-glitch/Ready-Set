const { test, expect } = require('@playwright/test');

test('P4 active UI uses exploration/base-camp/expedition-member language', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });

  const bodyText=(await page.locator('body').innerText()).replace(/\s+/g,' ');
  expect(bodyText).not.toContain('타임어택');
  expect(bodyText).not.toContain('FOCUS MODE');
  expect(bodyText).not.toContain('길잡이');
  expect(bodyText).not.toContain('작전');

  await expect(page.locator('#homeView')).toContainText('오늘의');
  await expect(page.locator('#homeView')).toContainText('탐험');
  await expect(page.locator('#homeView')).toContainText('MY CREW');
  await expect(page.locator('#homeView')).toContainText('탐험 시작 전, 응원 요청!');
  await expect(page.locator('#homeView')).toContainText('탐험 기록');

  await page.locator('[data-nav="mission"]').first().click();
  await expect(page.locator('#missionView')).toContainText('오늘 탐험 준비');
  await expect(page.locator('#startBtn')).toContainText('탐험 START');
  await expect(page.locator('#missionView')).toContainText('오늘의 탐험 미리보기');
  await expect(page.locator('#missionShareBtn')).toContainText('탐험 공유하기');

  await page.evaluate(() => nav('settings'));
  await expect(page.locator('#settingsView')).toContainText('내 탐험대원');
  await expect(page.locator('#settingsView')).toContainText('탐험대원 이름');
  await expect(page.locator('#settingsView')).toContainText('탐험대원 목소리');
});
