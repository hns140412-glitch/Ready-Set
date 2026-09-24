const {test,expect}=require('@playwright/test');

test('weekly and daily planner distinguish family schedule child schedule and missions',async({page})=>{
  await page.addInitScript(()=>{
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,account_id:'CHILD_SCOPE_UI',family_id:'FAMILY_SCOPE_UI',membership_id:'M_CHILD',
      member_id:'CHILD_SCOPE_UI',role:'CHILD',session_id:'SESSION_SCOPE_UI',
      expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'
    };
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.evaluate(()=>{
    const p=window.ReadySetPlanner;
    p.upsertScheduleCommitment({
      commitment_id:'fam_ui',title:'가족 일정',
      start_at:'2026-09-24T10:00:00',end_at:'2026-09-24T11:00:00',
      confirmed:true,audience_scope:'FAMILY_ALL',source:'READY_LOCAL'
    });
    p.upsertScheduleCommitment({
      commitment_id:'child_ui',title:'내 영어학원',
      start_at:'2026-09-24T16:00:00',end_at:'2026-09-24T18:00:00',
      confirmed:true,audience_scope:'MEMBER',target_member_id:'CHILD_SCOPE_UI',source:'READY_LOCAL'
    });
    p.upsertDatedTodo({
      todo_id:'todo_ui',date:'2026-09-24',label:'영어 단어 복습',
      source:'PLANNER_ALLOCATION',state:'PLANNED'
    });
  });

  await page.locator('[data-nav="planner"]').first().click();
  await page.locator('[data-planner-date="2026-09-24"]').click();

  const family=page.locator('#plannerWeekDetail .plannerWeekItem.familySchedule');
  const child=page.locator('#plannerWeekDetail .plannerWeekItem.childSchedule');
  await expect(family).toContainText('가족 일정');
  await expect(child).toContainText('내 영어학원');
  await expect(child).toContainText('내 일정');
  await expect(page.locator('#plannerWeekDetail .plannerWeekItem:not(.fixed)')).toContainText('영어 단어 복습');

  await page.locator('[data-planner-tab="day"]').click();
  await expect(page.locator('#plannerDayTimeline .plannerRouteItem.familySchedule')).toContainText('FAMILY SCHEDULE');
  await expect(page.locator('#plannerDayTimeline .plannerRouteItem.childSchedule')).toContainText('MY SCHEDULE');
  await expect(page.locator('#plannerDayTimeline .plannerRouteItem.missionItem')).toContainText('영어 단어 복습');
  await expect(page.locator('#plannerDayCount')).toHaveText('탐험 1 · 일정 2');
});
