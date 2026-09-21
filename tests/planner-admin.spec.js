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
  // SUPERSEDED_BY_CURRENT_TRUTH: Parent no longer sets minutes, preferred days, required_today, or DATED TODO.
});


test('Parent can create and approve adaptive estimate proposal from observed execution time', async ({ page }) => {
  await page.addInitScript(() => {
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,family_id:'TEST_FAMILY',member_id:'TEST_PARENT',role:'PARENT',
      session_id:'TEST_SESSION',expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'
    };
  });
  await page.goto('http://127.0.0.1:4173/', {waitUntil:'load'});
  await page.evaluate(()=>{
    const p=window.ReadySetPlanner;
    p.upsertHomeworkTemplate({
      template_id:'adaptive_template',title:'수학 연산 적응형',subject:'수학',
      planner_estimated_minutes:20,confirmation_state:'CONFIRMED'
    });
    const raw=JSON.parse(localStorage.getItem('readyset_planner_v1'));
    raw.execution_observations.push(
      {observation_id:'o1',observation_key:'a',template_id:'adaptive_template',actual_minutes:30,fact_revision:null},
      {observation_id:'o2',observation_key:'b',template_id:'adaptive_template',actual_minutes:35,fact_revision:null},
      {observation_id:'o3',observation_key:'c',template_id:'adaptive_template',actual_minutes:40,fact_revision:null}
    );
    localStorage.setItem('readyset_planner_v1',JSON.stringify(raw));
  });
  await page.locator('[data-nav="planner"]').first().click();
  await page.locator('[data-nav="planner-admin"]').click();
  await page.locator('#adaptiveEstimateRefreshBtn').click();
  await expect(page.locator('#adaptiveEstimateAdminList')).toContainText('수학 연산 적응형');
  await expect(page.locator('#adaptiveEstimateAdminList')).toContainText('35분');
  await page.locator('[data-estimate-confirm]').click();
  const value=await page.evaluate(()=>window.ReadySetPlanner.snapshot().homework_templates.find(x=>x.template_id==='adaptive_template')?.planner_estimated_minutes);
  expect(value).toBe(35);
});


test('Parent can approve weekly reflow without moving active or completed tasks', async ({ page }) => {
  await page.addInitScript(() => {
    window.__READY_AUTH_BOOTSTRAP__={
      authenticated:true,family_id:'TEST_FAMILY',member_id:'TEST_PARENT',role:'PARENT',
      session_id:'TEST_SESSION',expires_at:'2099-01-01T00:00:00.000Z',source:'TEST_ONLY'
    };
  });
  await page.goto('http://127.0.0.1:4173/', {waitUntil:'load'});
  const seeded=await page.evaluate(()=>{
    const p=window.ReadySetPlanner;
    const d=new Date(),fmt=x=>x.toLocaleDateString('sv-SE');
    const d0=fmt(d),d1=fmt(new Date(d.getFullYear(),d.getMonth(),d.getDate()+1));
    p.upsertDailyAvailabilityWindow({date:d0,start:'16:00',end:'17:00',confirmed:true,source:'TEST'});
    p.upsertDailyAvailabilityWindow({date:d1,start:'16:00',end:'20:00',confirmed:true,source:'TEST'});
    p.upsertHomeworkTemplate({template_id:'reflow_t',title:'주간 재배치 과제',planner_estimated_minutes:60,confirmation_state:'CONFIRMED'});
    p.upsertDatedTodo({todo_id:'reflow_move',date:d0,label:'주간 재배치 과제',template_id:'reflow_t',source:'PLANNER_V2_ALLOCATION',state:'PLANNED'});
    p.upsertDatedTodo({todo_id:'reflow_locked',date:d0,label:'진행 중 잠금',template_id:'reflow_t',source:'PLANNER_V2_ALLOCATION',state:'IN_PROGRESS'});
    return {d0,d1};
  });
  await page.locator('[data-nav="planner"]').first().click();
  await page.locator('[data-nav="planner-admin"]').click();
  await page.locator('#weeklyReflowPlanBtn').click();
  await expect(page.locator('#weeklyReflowAdminList')).toContainText('주간 재배치 과제');
  await page.locator('[data-reflow-confirm]').click();
  const out=await page.evaluate(()=>({
    moved:window.ReadySetPlanner.snapshot().dated_todos.find(x=>x.todo_id==='reflow_move'),
    locked:window.ReadySetPlanner.snapshot().dated_todos.find(x=>x.todo_id==='reflow_locked')
  }));
  expect(out.moved.date).toBe(seeded.d1);
  expect(out.locked.date).toBe(seeded.d0);
});
