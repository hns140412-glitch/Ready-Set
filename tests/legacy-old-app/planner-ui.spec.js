const { test, expect } = require('@playwright/test');

test('planner week/day UI renders real planner entities and switches views', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });

  const seeded = await page.evaluate(() => {
    const p=window.ReadySetPlanner;
    const now=new Date();
    const y=now.getFullYear(),m=String(now.getMonth()+1).padStart(2,'0'),d=String(now.getDate()).padStart(2,'0');
    const today=`${y}-${m}-${d}`;
    p.upsertDatedTodo({todo_id:'planner_ui_todo',date:today,label:'주간 UI 검증 과제',source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',estimated_minutes:30,state:'PLANNED'});
    p.upsertScheduleCommitment({commitment_id:'planner_ui_fixed',title:'영어학원',start_at:today+'T17:00:00',end_at:today+'T18:30:00',confirmed:true,source:'E2E'});
    return {today};
  });
  expect(seeded.today).toBeTruthy();

  await page.locator('[data-nav="planner"]').first().click();
  await expect(page.locator('#plannerView')).toHaveClass(/active/);
  await expect(page.locator('#plannerWeekStrip')).toBeVisible();
  await expect(page.locator('#plannerWeekDetail')).toContainText('주간 UI 검증 과제');
  await expect(page.locator('#plannerWeekDetail')).toContainText('영어학원');

  await page.locator('[data-planner-tab="day"]').click();
  await expect(page.locator('#plannerDayPanel')).toBeVisible();
  await expect(page.locator('#plannerDayTimeline')).toContainText('주간 UI 검증 과제');
  await expect(page.locator('#plannerDayTimeline')).toContainText('영어학원');

  await page.locator('#plannerTodayJump').click();
  await expect(page.locator('[data-planner-tab="day"]')).toHaveClass(/on/);
  await expect(page.locator('#plannerDayCount')).not.toHaveText('0개');
});