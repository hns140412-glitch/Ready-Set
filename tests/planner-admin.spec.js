const { test, expect } = require('@playwright/test');

test('parent/admin editor creates and edits fixed schedule + homework template', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });

  await page.locator('[data-nav="planner"]').first().click();
  await expect(page.locator('#plannerView')).toHaveClass(/active/);
  await page.locator('[data-nav="planner-admin"]').click();
  await expect(page.locator('#plannerAdminView')).toHaveClass(/active/);

  const today = await page.evaluate(() => {
    const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  });

  await page.locator('#scheduleTitle').fill('영어학원');
  await page.locator('#scheduleCategory').fill('영어');
  await page.locator('#scheduleDate').fill(today);
  await page.locator('#scheduleStart').fill('17:00');
  await page.locator('#scheduleEnd').fill('18:30');
  await page.locator('#saveScheduleBtn').click();

  await expect(page.locator('#scheduleAdminList')).toContainText('영어학원');
  const scheduleId = await page.evaluate(() => window.ReadySetPlanner.snapshot().schedule_commitments.find(x=>x.title==='영어학원')?.commitment_id || null);
  expect(scheduleId).toBeTruthy();

  await page.locator(`[data-edit-schedule="${scheduleId}"]`).click();
  await page.locator('#scheduleEnd').fill('18:45');
  await page.locator('#saveScheduleBtn').click();

  const schedule = await page.evaluate(id => window.ReadySetPlanner.snapshot().schedule_commitments.find(x=>x.commitment_id===id), scheduleId);
  expect(schedule.end_at).toContain('18:45:00');
  expect(schedule.source).toBe('PARENT_ADMIN_UI');

  await page.locator('#templateTitle').fill('영어 단어 복습');
  await page.locator('#templateSubject').fill('영어');
  await page.locator('#templateMinutes').fill('25');
  await page.locator('[data-weekday="1"]').click();
  await page.locator('[data-weekday="3"]').click();
  await page.locator('#saveTemplateBtn').click();

  await expect(page.locator('#templateAdminList')).toContainText('영어 단어 복습');
  const templateId = await page.evaluate(() => window.ReadySetPlanner.snapshot().homework_templates.find(x=>x.title==='영어 단어 복습')?.template_id || null);
  expect(templateId).toBeTruthy();

  await page.locator(`[data-edit-template="${templateId}"]`).click();
  await page.locator('#templateMinutes').fill('30');
  await page.locator('#templateRequiredToday').check();
  await page.locator('#saveTemplateBtn').click();

  const template = await page.evaluate(id => window.ReadySetPlanner.snapshot().homework_templates.find(x=>x.template_id===id), templateId);
  expect(template.estimated_minutes).toBe(30);
  expect(template.required_today).toBeTruthy();
  expect(template.preferred_days.sort()).toEqual([1,3]);

  await page.locator('[data-nav="planner"]').first().click();
  await expect(page.locator('#plannerWeekDetail')).toContainText('영어학원');

  await expect.poll(async () => page.evaluate(async () => {
    const outbox=await window.ReadySetLocalFirst.outbox();
    return outbox.some(x=>x.scope==='planner' && x.status==='PENDING');
  })).toBeTruthy();
});