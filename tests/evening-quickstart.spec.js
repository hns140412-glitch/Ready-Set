const { test, expect } = require('@playwright/test');

test('evening preview: local provisional task -> week/day -> existing Focus session', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/evening.html', {waitUntil:'load'});
  const app = page.frameLocator('#readyEveningApp');
  await expect(app.locator('#eveningQuickStart')).toBeAttached();
  await app.locator('.commandCard [data-nav="planner"]').click();
  await expect(app.locator('#plannerWeekPanel')).toBeVisible();
  await expect(app.locator('[data-planner-tab="day"]')).toBeVisible();

  await app.locator('#eveningTaskTitle').fill('오늘 영어 단어 복습');
  const date=await app.locator('#eveningTaskDate').inputValue();
  await app.locator('#eveningStartTask').click();

  await expect(app.locator('#missionView')).toHaveClass(/active/);
  await expect(app.locator('#missionPreviewText')).toContainText('오늘 영어 단어 복습');
  await app.locator('[data-minutes="10"]').click();
  await app.locator('#startBtn').click();
  await expect(app.locator('#focusView')).toHaveClass(/active/);
  await expect(app.locator('#focusMission')).toContainText('오늘 영어 단어 복습');

  const snap=await app.locator('body').evaluate(() => {
    const p=window.ReadySetPlanner.snapshot();
    const t=p.dated_todos.find(x=>x.label==='오늘 영어 단어 복습');
    return {t,session:JSON.parse(localStorage.getItem('readyset_state')||'{}').activeSession};
  });
  expect(snap.t.date).toBe(date);
  expect(snap.t.source).toBe('LOCAL_QUICK_START_PROVISIONAL');
  expect(snap.t.provenance.fact_confirmed).toBe(false);
  expect(snap.t.assignment_id).toBeNull();
  expect(snap.t.state).toBe('IN_PROGRESS');
  expect(snap.session).toBeTruthy();
});

test('evening preview: temporary fixed time is visibly unconfirmed; invalid time does not save', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/evening.html',{waitUntil:'load'});
  const app=page.frameLocator('#readyEveningApp');
  await app.locator('.commandCard [data-nav="planner"]').click();
  await app.locator('.eveningQuickSchedule summary').click();
  await app.locator('#eveningScheduleTitle').fill('영어학원');
  await app.locator('#eveningScheduleStart').fill('21:00');
  await app.locator('#eveningScheduleEnd').fill('20:00');
  await app.locator('#eveningAddSchedule').click();
  await expect(app.locator('#eveningQuickStatus')).toContainText('확인해');
  let count=await app.locator('body').evaluate(() => window.ReadySetPlanner.snapshot().schedule_commitments.length);
  expect(count).toBe(0);
  await app.locator('#eveningScheduleStart').fill('20:00');
  await app.locator('#eveningScheduleEnd').fill('21:00');
  await app.locator('#eveningAddSchedule').click();
  await expect(app.locator('#plannerWeekDetail')).toContainText('영어학원');
  await expect(app.locator('#plannerWeekDetail')).toContainText('미확정');
  const saved=await app.locator('body').evaluate(() => window.ReadySetPlanner.snapshot().schedule_commitments);
  expect(saved).toHaveLength(1);
  expect(saved[0].confirmed).toBe(false);
  expect(saved[0].source).toBe('LOCAL_QUICK_START_PROVISIONAL');
  await page.reload();
  await app.locator('.commandCard [data-nav="planner"]').click();
  await expect(app.locator('#plannerWeekDetail')).toContainText('영어학원');
});
