const { test, expect } = require('@playwright/test');

test('Schedule Commitment remains editable while legacy Parent allocation controls are superseded', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.locator('[data-nav="planner"]').first().click();
  await page.locator('[data-nav="planner-admin"]').click();
  const today=await page.evaluate(()=>new Date().toLocaleDateString('sv-SE'));
  await page.locator('#scheduleTitle').fill('영어학원');
  await page.locator('#scheduleCategory').fill('영어');
  await page.locator('#scheduleDate').fill(today);
  await page.locator('#scheduleStart').fill('17:00');
  await page.locator('#scheduleEnd').fill('18:30');
  await page.locator('#saveScheduleBtn').click();
  await expect(page.locator('#scheduleAdminList')).toContainText('영어학원');
  expect(await page.locator('#templateMinutes').count()).toBe(0);
  expect(await page.locator('#templateWeekdays').count()).toBe(0);
  expect(await page.locator('#templateRequiredToday').count()).toBe(0);
  await expect(page.locator('#parentHomeworkIntake')).toContainText('숙제 입력 · 확인');
  expect((await page.evaluate(()=>window.ReadySetPlanner.snapshot().dated_todos)).length).toBe(0);
  // SUPERSEDED_BY_CURRENT_TRUTH: Parent no longer sets minutes, preferred days, required_today, or DATED TODO.
});
