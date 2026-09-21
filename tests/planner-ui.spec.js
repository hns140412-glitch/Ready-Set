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

test('planner explains assignment evidence without inventing hidden rationale', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'load' });
  await page.evaluate(()=>{
    const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');
    const today=y+'-'+m+'-'+dd;
    const p=window.ReadySetPlanner;
    p.upsertHomeworkTemplate({template_id:'reason_template',title:'설명 가능한 배정',subject:'수학',deadline_date:today,planner_estimated_minutes:25,confirmation_state:'CONFIRMED'});
    p.upsertDatedTodo({todo_id:'reason_todo',date:today,label:'설명 가능한 배정',template_id:'reason_template',source:'PLANNER_V2_ALLOCATION',state:'PLANNED'});
    const raw=JSON.parse(localStorage.getItem('readyset_planner_v1'));
    const todo=raw.dated_todos.find(x=>x.todo_id==='reason_todo');
    todo.free_window_evidence={known:true,total_free_minutes:120,largest_contiguous_minutes:120};
    localStorage.setItem('readyset_planner_v1',JSON.stringify(raw));
  });
  await page.locator('[data-nav="planner"]').first().click();
  await expect(page.locator('#plannerWeekDetail')).toContainText('확인된 학습 가능 시간');
  await expect(page.locator('#plannerWeekDetail')).toContainText('실제 수행시간 반영');
});


test('planner UI honors weekly schedule skip and replacement exceptions', async ({ page }) => {
  await page.addInitScript(() => {
    window.__READY_AUTH_BOOTSTRAP__={authenticated:true,family_id:'TEST_FAMILY',member_id:'TEST_PARENT',role:'PARENT',session_id:'TEST_SESSION',expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'};
  });
  await page.goto('http://127.0.0.1:4173/', {waitUntil:'load'});
  await page.evaluate(()=>{
    const p=window.ReadySetPlanner;
    p.upsertScheduleCommitment({commitment_id:'ui_weekly',title:'피아노',category:'피아노',recurrence:'WEEKLY',weekday:2,start:'16:00',end:'17:00',confirmed:true,source:'PARENT_ADMIN_UI'});
    p.upsertScheduleException({commitment_id:'ui_weekly',date:'2026-09-22',type:'SKIP',source:'PARENT_ADMIN_UI'});
    p.upsertScheduleException({commitment_id:'ui_weekly',date:'2026-09-29',type:'REPLACE',start:'18:00',end:'19:00',source:'PARENT_ADMIN_UI'});
  });
  const skipped=await page.evaluate(()=>window.ReadyRebuildPlannerView.itemsForDate('2026-09-22',window.ReadySetPlanner.snapshot(),{commitments:window.ReadySetPlanner.scheduleCommitmentsForDate('2026-09-22')}));
  const replaced=await page.evaluate(()=>window.ReadyRebuildPlannerView.itemsForDate('2026-09-29',window.ReadySetPlanner.snapshot(),{commitments:window.ReadySetPlanner.scheduleCommitmentsForDate('2026-09-29')}));
  expect(skipped.some(x=>x.label==='피아노')).toBeFalsy();
  const piano=replaced.find(x=>x.label==='피아노');
  expect(piano.time).toBe('18:00');
  expect(piano.meta).toContain('이번 주 변경');
});


test('planner shows evidence-backed morning daypart without inventing a clock time', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', {waitUntil:'load'});
  await page.evaluate(()=>{
    const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');
    const today=y+'-'+m+'-'+dd;
    const p=window.ReadySetPlanner;
    p.upsertDatedTodo({todo_id:'morning_vocab_ui',date:today,label:'영어 단어 복습',source:'PLANNER_V2_ALLOCATION',state:'PLANNED'});
    const raw=JSON.parse(localStorage.getItem('readyset_planner_v1'));
    const todo=raw.dated_todos.find(x=>x.todo_id==='morning_vocab_ui');
    todo.preferred_daypart='MORNING';
    todo.operating_rule='ENGLISH_ACADEMY_MORNING_VOCAB_REVIEW';
    localStorage.setItem('readyset_planner_v1',JSON.stringify(raw));
  });
  await page.locator('[data-nav="planner"]').first().click();
  await expect(page.locator('#plannerWeekDetail')).toContainText('아침');
  await expect(page.locator('#plannerWeekDetail')).toContainText('영어학원 날 아침 단어 복습');
  await page.locator('[data-planner-tab="day"]').click();
  await expect(page.locator('#plannerDayTimeline')).toContainText('아침 · MISSION');
});
