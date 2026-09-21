const { test, expect } = require('@playwright/test');

test('P3 Ready -> Hide/Snap -> Ready preserves runtime identity and continuous lap timing', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });

  await page.evaluate(() => {
    const now=new Date();
    const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    window.ReadySetPlanner.upsertDatedTodo({
      todo_id:'p3_today_1',
      date:today,
      label:'영어 단어 P3 왕복',
      source:'PLANNER_ALLOCATION',
      source_actor:'PLANNER_MAIN',
      estimated_minutes:10,
      state:'PLANNED'
    });
  });

  await page.locator('[data-nav="mission"]').first().click();
  await page.locator('#plannerTodayList [data-todo-id="p3_today_1"]').click();
  await page.locator('[data-minutes="10"]').click();
  await page.locator('#startBtn').click();
  await expect(page.locator('#focusView')).toHaveClass(/active/);

  const initial=await page.evaluate(() => {
    const c=window.ReadySetRev07.contract();
    const h=window.ReadySetRev07.buildSpecialistHandoff('hide-seek');
    const s=window.ReadySetRev07.buildSpecialistHandoff('snap-pop');
    return {c,h,s};
  });
  expect(initial.c.session_id).toBeTruthy();
  expect(initial.c.goal_id).toBeTruthy();
  expect(initial.c.active_task_id).toBe(initial.h.task_id);
  expect(initial.c.active_lap_id).toBe(initial.h.lap_id);

  for(const handoff of [initial.h,initial.s]){
    const u=new URL(handoff.url);
    expect(u.searchParams.get('session_id')).toBe(initial.c.session_id);
    expect(u.searchParams.get('goal_id')).toBe(initial.c.goal_id);
    expect(u.searchParams.get('task_id')).toBe(initial.c.active_task_id);
    expect(u.searchParams.get('lap_id')).toBe(initial.c.active_lap_id);
    expect(u.searchParams.get('return_target')).toBe(handoff.return_target);
  }

  const wrongGoal=await page.evaluate(({session,task,lap}) => window.ReadySetRev07.applyInboundResult({
    session_id:session,
    goal_id:'goal_wrong',
    task_id:task,
    lap_id:lap,
    task_state:'PARTIAL',
    from_app:'hide-seek',
    event_id:'p3_wrong_goal'
  }),{session:initial.c.session_id,task:initial.c.active_task_id,lap:initial.c.active_lap_id});
  expect(wrongGoal).toBeFalsy();

  await page.waitForTimeout(50);
  const partial=await page.evaluate(({session,goal,task,lap}) => {
    const ok=window.ReadySetRev07.applyInboundResult({
      session_id:session,goal_id:goal,task_id:task,lap_id:lap,
      task_state:'PARTIAL',from_app:'hide-seek',event_id:'p3_hide_partial'
    });
    return {ok,c:window.ReadySetRev07.contract()};
  },{session:initial.c.session_id,goal:initial.c.goal_id,task:initial.c.active_task_id,lap:initial.c.active_lap_id});
  expect(partial.ok).toBeTruthy();
  expect(partial.c.active_lap_id).toBe(initial.c.active_lap_id);
  expect(partial.c.tasks[0].state).toBe('PARTIAL');
  expect(partial.c.tasks[0].laps[0].ended_at).toBeNull();
  expect(partial.c.tasks[0].laps[0].started_ms).toBe(initial.c.tasks[0].laps[0].started_ms);

  await page.waitForTimeout(50);
  const completed=await page.evaluate(({session,goal,task,lap}) => {
    const ok=window.ReadySetRev07.applyInboundResult({
      session_id:session,goal_id:goal,task_id:task,lap_id:lap,
      task_state:'COMPLETED',from_app:'snap-pop',event_id:'p3_snap_complete'
    });
    return {ok,c:window.ReadySetRev07.contract(),valid:window.ReadySetRev07.validate()};
  },{session:initial.c.session_id,goal:initial.c.goal_id,task:initial.c.active_task_id,lap:initial.c.active_lap_id});
  expect(completed.ok).toBeTruthy();
  expect(completed.c.tasks[0].state).toBe('COMPLETED');
  expect(completed.c.active_lap_id).toBeNull();
  expect(completed.c.tasks[0].laps[0].ended_at).toBeTruthy();
  expect(completed.c.tasks[0].laps[0].elapsed_ms).toBeGreaterThanOrEqual(50);
  expect(completed.valid.ok).toBeTruthy();

  const events=completed.c.events;
  expect(events.some(e=>e.type==='APP_RETURN'&&e.payload.from==='hide-seek')).toBeTruthy();
  expect(events.some(e=>e.type==='APP_RETURN'&&e.payload.from==='snap-pop')).toBeTruthy();
});
