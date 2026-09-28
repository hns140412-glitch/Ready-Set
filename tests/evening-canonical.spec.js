const {test,expect}=require('@playwright/test');

test('evening entry starts at canonical WEEK and keeps real Planner navigation',async({page})=>{
  await page.goto('http://127.0.0.1:4173/evening.html',{waitUntil:'load'});
  const app=page.frameLocator('#readyEveningApp');
  await expect(app.locator('#plannerView')).toHaveClass(/active/);
  await expect(app.locator('#readyThreeScreenNav')).toBeVisible();
  await expect(app.locator('#plannerView .pageHeader h1')).toHaveText('이번 주 여정');
  await app.locator('[data-ready-screen="day"]').click();
  await expect(app.locator('#plannerDayPanel')).toBeVisible();
  await expect(app.locator('#plannerView .pageHeader h1')).toHaveText('오늘의 탐험길');
  await app.locator('[data-ready-screen="week"]').click();
  await expect(app.locator('#plannerWeekPanel')).toBeVisible();
  await app.locator('[data-ready-screen="timer"]').click();
  // Navigation alone is NOT authorized to create a session.
  await expect(app.locator('#missionView')).toHaveClass(/active/);
  const session=await app.locator('body').evaluate(()=>JSON.parse(localStorage.getItem('readyset_state')||'{}').activeSession||null);
  expect(session).toBeNull();
});

test('provisional task uses existing session and focus stage, without new timer store',async({page})=>{
  await page.goto('http://127.0.0.1:4173/evening.html',{waitUntil:'load'});
  const app=page.frameLocator('#readyEveningApp');
  await expect(app.locator('#eveningQuickStart')).toBeAttached();
  await app.locator('#eveningTaskTitle').fill('오늘 저녁 학습');
  await app.locator('#eveningStartTask').click();
  await expect(app.locator('#missionView')).toHaveClass(/active/);
  await app.locator('[data-minutes="10"]').click();
  await app.locator('#startBtn').click();
  await expect(app.locator('#focusView')).toHaveClass(/active/);
  await expect(app.locator('#focusView .focusTitle h1')).toHaveText('그냥! 지금 하면 돼!');
  await expect(app.locator('#readyThreeScreenNav')).toBeHidden();
  await expect(app.locator('#focusMission')).toContainText('오늘 저녁 학습');
});