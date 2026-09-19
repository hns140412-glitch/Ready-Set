const { test, expect } = require('@playwright/test');

test('homework template materializes into TODAY and Mission automatically', async ({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const today=await page.evaluate(()=>{
    const d=new Date(), y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
  });
  const dow=await page.evaluate(()=>new Date().getDay());

  const result=await page.evaluate(({today,dow})=>{
    const t=window.ReadySetPlanner.upsertHomeworkTemplate({
      template_id:'mat_today',
      title:'영어 단어 복습',
      subject:'영어',
      estimated_minutes:20,
      preferred_days:[dow],
      confirmation_state:'CONFIRMED'
    });
    const m=window.ReadySetPlanner.materializeDate(today);
    const snap=window.ReadySetPlanner.snapshot();
    const todos=snap.dated_todos.filter(x=>x.date===today&&x.template_id===t.template_id);
    return {m,todos};
  },{today,dow});

  expect(result.m.created).toHaveLength(1);
  expect(result.todos).toHaveLength(1);
  expect(result.todos[0].source).toBe('PLANNER_TEMPLATE');
  expect(result.todos[0].estimated_minutes).toBe(20);

  const second=await page.evaluate(today=>window.ReadySetPlanner.materializeDate(today),today);
  expect(second.created).toHaveLength(0);

  await page.locator('[data-nav="mission"]').first().click();
  await expect(page.locator('#plannerTodaySection')).toBeVisible();
  await expect(page.locator('#plannerTodayList')).toContainText('영어 단어 복습');
  await expect(page.locator('#plannerTodayList')).toContainText('약 20분');
});

test('materialization respects weekday and propagates safe template edits', async ({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  const data=await page.evaluate(()=>{
    const d=new Date(), y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0');
    const today=`${y}-${m}-${dd}`, dow=d.getDay(), other=(dow+1)%7;
    window.ReadySetPlanner.upsertHomeworkTemplate({
      template_id:'mat_skip',title:'다른 요일 숙제',estimated_minutes:15,preferred_days:[other],confirmation_state:'CONFIRMED'
    });
    window.ReadySetPlanner.upsertHomeworkTemplate({
      template_id:'mat_edit',title:'수학 연산 20문제',estimated_minutes:25,preferred_days:[dow],confirmation_state:'CONFIRMED'
    });
    const first=window.ReadySetPlanner.materializeDate(today);
    window.ReadySetPlanner.upsertHomeworkTemplate({
      template_id:'mat_edit',title:'수학 연산 30문제',estimated_minutes:30,preferred_days:[dow],confirmation_state:'CONFIRMED'
    });
    const second=window.ReadySetPlanner.materializeDate(today);
    const snap=window.ReadySetPlanner.snapshot();
    return {
      today,first,second,
      skipped:snap.dated_todos.filter(x=>x.template_id==='mat_skip'&&x.date===today),
      edited:snap.dated_todos.filter(x=>x.template_id==='mat_edit'&&x.date===today)
    };
  });

  expect(data.skipped).toHaveLength(0);
  expect(data.edited).toHaveLength(1);
  expect(data.edited[0].label).toBe('수학 연산 30문제');
  expect(data.edited[0].estimated_minutes).toBe(30);
  expect(data.second.updated).toContain(data.edited[0].todo_id);
});

test('admin save immediately creates eligible TODAY todo without extra user step', async ({page})=>{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.locator('[data-nav="planner"]').first().click();
  await page.locator('[data-nav="planner-admin"]').click();
  const dow=await page.evaluate(()=>new Date().getDay());
  await page.locator('#templateTitle').fill('재능 학습지');
  await page.locator('#templateSubject').fill('재능');
  await page.locator('#templateMinutes').fill('18');
  await page.locator(`[data-weekday="${dow}"]`).click();
  await page.locator('#saveTemplateBtn').click();

  const todo=await page.evaluate(()=>{
    const today=window.ReadySetPlanner.todayProjection();
    return today.find(x=>x.label==='재능 학습지')||null;
  });
  expect(todo).toBeTruthy();
  expect(todo.estimated_minutes).toBe(18);

  await page.locator('#plannerAdminView [data-nav="planner"]').click();
  await page.locator('[data-nav="mission"]').first().click();
  await expect(page.locator('#plannerTodayList')).toContainText('재능 학습지');
});