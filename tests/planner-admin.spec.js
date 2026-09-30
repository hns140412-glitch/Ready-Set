const { test, expect } = require('@playwright/test');

test('Schedule Commitment remains editable while legacy Parent allocation controls are superseded', async ({ page }) => {
  await page.addInitScript(() => {
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

  await page.locator('#schedulePeriodName').fill('여름방학');
  await page.locator('#schedulePeriodFrom').fill('2026-07-20');
  await page.locator('#schedulePeriodUntil').fill('2026-08-18');
  await page.locator('#saveSchedulePeriodBtn').click();
  await expect(page.locator('#schedulePeriodList')).toContainText('여름방학');

  await page.locator('#scheduleRecurring').check();
  await page.locator('#scheduleWeekday').selectOption('1');
  await page.locator('#scheduleTitle').fill('영어학원');
  await page.locator('#scheduleCategory').fill('영어');
  await page.locator('#scheduleStart').fill('16:00');
  await page.locator('#scheduleEnd').fill('18:00');
  await page.locator('#saveScheduleBtn').click();
  await expect(page.locator('#scheduleTileBoard')).toContainText('영어학원');
  expect(await page.evaluate(()=>window.ReadySetPlanner.scheduleCommitmentsByDate('2026-07-20').map(x=>x.title))).toEqual(['영어학원']);
  expect(await page.evaluate(()=>window.ReadySetPlanner.scheduleCommitmentsByDate('2026-08-19').length)).toBe(0);

  await page.locator('#scheduleVoiceText').fill('월수금 영어학원 오후 4시부터 오후 6시');
  await page.locator('#scheduleVoicePreviewBtn').click();
  await expect(page.locator('#scheduleVoicePreview')).toContainText('아직 저장되지 않음');
  await page.locator('#scheduleVoiceApplyBtn').click();
  expect(await page.evaluate(()=>window.ReadySetPlanner.snapshot().schedule_commitments.filter(x=>x.period_id&&x.title==='영어학원').length)).toBe(3);
  // SUPERSEDED_BY_CURRENT_TRUTH: Parent no longer sets minutes, preferred days, required_today, or DATED TODO.
});
