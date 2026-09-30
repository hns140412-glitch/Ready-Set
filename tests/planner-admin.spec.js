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

  await page.locator('#bufferKind').selectOption('TRAVEL');
  await page.locator('#bufferTitle').fill('영어학원 이동');
  await page.locator('#bufferMode').selectOption('AROUND_COMMITMENT');
  const linkedCommitmentId=await page.locator('#bufferLinkedCommitment option').first().getAttribute('value');
  await page.locator('#bufferLinkedCommitment').selectOption(linkedCommitmentId);
  await page.locator('#bufferSide').selectOption('BEFORE');
  await page.locator('#bufferMinutes').fill('20');
  await page.locator('#saveBufferBtn').click();
  await expect(page.locator('#bufferAdminList')).toContainText('영어학원 이동');
  const todayBuffers=await page.evaluate(date=>window.ReadySetPlanner.scheduleBuffersByDate(date).map(x=>({kind:x.kind,title:x.title,side:x.side,minutes:x.minutes})),today);
  expect(todayBuffers).toEqual([{kind:'TRAVEL',title:'영어학원 이동',side:'BEFORE',minutes:20}]);

  await page.locator('#bufferClearBtn').click();
  await page.locator('#bufferKind').selectOption('MEAL');
  await page.locator('#bufferTitle').fill('저녁 식사');
  await page.locator('#bufferMode').selectOption('ABSOLUTE');
  await page.locator('#bufferDate').fill(today);
  await page.locator('#bufferStart').fill('19:00');
  await page.locator('#bufferEnd').fill('19:30');
  await page.locator('#saveBufferBtn').click();
  await expect(page.locator('#bufferAdminList')).toContainText('저녁 식사');
  expect(await page.evaluate(date=>window.ReadySetPlanner.scheduleBuffersByDate(date).map(x=>x.kind).sort(),today)).toEqual(['MEAL','TRAVEL']);

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

  await page.locator('#scheduleVoiceText').fill('겨울방학 12월 24일부터 2027년 2월 28일까지');
  await page.locator('#scheduleVoicePreviewBtn').click();
  await expect(page.locator('#scheduleVoicePreview')).toContainText('겨울방학');
  await page.locator('#scheduleVoiceApplyBtn').click();
  const periodNames=await page.evaluate(()=>window.ReadySetPlanner.snapshot().schedule_periods.map(x=>x.name).sort());
  expect(periodNames).toEqual(['겨울방학','여름방학']);
  // SUPERSEDED_BY_CURRENT_TRUTH: Parent no longer sets minutes, preferred days, required_today, or DATED TODO.
});
