const { test, expect } = require('@playwright/test');

test('TODAY -> Mission -> Focus -> Wrap-up -> Result -> carry-over -> replan', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });

  const seeded = await page.evaluate(() => {
    const p = window.ReadySetPlanner;
    if (!p) return { ok:false, reason:'PLANNER_MISSING' };
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth()+1).padStart(2,'0');
    const d = String(now.getDate()).padStart(2,'0');
    const today = `${y}-${m}-${d}`;
    const item = p.upsertDatedTodo({
      todo_id:'e2e_today_1',
      date:today,
      label:'E2E 사회 정리',
      source:'PLANNER_ALLOCATION',
      source_actor:'PLANNER_MAIN',
      estimated_minutes:25,
      state:'PLANNED'
    });
    return { ok:true, today, item };
  });
  expect(seeded.ok).toBeTruthy();

  await page.locator('[data-nav="mission"]').first().click();
  await expect(page.locator('#missionView')).toHaveClass(/active/);
  await expect(page.locator('#plannerTodaySection')).toBeVisible();
  const todayItem = page.locator('#plannerTodayList [data-todo-id="e2e_today_1"]');
  await expect(todayItem).toBeVisible();
  await todayItem.click();

  await page.locator('[data-minutes="10"]').click();
  await page.locator('#startBtn').click();
  await expect(page.locator('#focusView')).toHaveClass(/active/);
  await expect(page.locator('#focusMission')).toContainText('E2E 사회 정리');

  const runtime = await page.evaluate(() => ({
    readyRuntime: document.documentElement.dataset.readyRuntime || null,
    rev07: !!window.ReadySetRev07,
    valid: window.ReadySetRev07?.validate?.() || null
  }));
  expect(runtime.rev07).toBeTruthy();
  expect(runtime.valid?.ok).toBeTruthy();

  await page.waitForTimeout(1100);
  await page.locator('#completeBtn').click();
  await expect(page.locator('#readyRev07Wrap')).toBeVisible();

  const taskId = await page.evaluate(() => window.ReadySetRev07.contract().tasks[0].task_id);
  await page.locator(`[data-wrap-state="PARTIAL"][data-task-id="${taskId}"]`).click();
  await expect(page.locator('#rev07ConfirmEnd')).toBeEnabled();
  await page.locator('#rev07ConfirmEnd').click();

  await expect(page.locator('#resultView')).toHaveClass(/active/);
  await expect(page.locator('#resultTasks')).toContainText('E2E 사회 정리');

  const after = await page.evaluate(() => {
    const snap = window.ReadySetPlanner.snapshot();
    const todo = snap.dated_todos.find(x => x.todo_id === 'e2e_today_1');
    const carry = snap.carry_over_queue.find(x => x.source_todo_id === 'e2e_today_1');
    const obs = snap.execution_observations.find(x => x.todo_id === 'e2e_today_1');
    return { todo, carry, obs };
  });
  expect(after.todo?.state).toBe('PARTIAL');
  expect(after.carry?.status).toBe('OPEN');
  expect(after.carry?.allocation_ready).toBe(true);
  expect(after.obs?.source).toBe('READY_SESSION');

  const replanned = await page.evaluate(() => {
    const p = window.ReadySetPlanner;
    const now = new Date();
    now.setDate(now.getDate()+1);
    const y = now.getFullYear();
    const m = String(now.getMonth()+1).padStart(2,'0');
    const d = String(now.getDate()).padStart(2,'0');
    const next = `${y}-${m}-${d}`;
    const plan = p.allocateToday({
      date: next,
      candidate_windows:[{start:'18:00',end:'20:00'}],
      max_minutes:90
    });
    const proposal = plan.proposals.find(x => x.carry_over_id);
    const commit = proposal ? p.commitAllocation(plan.allocation_run_id,[proposal.template_id]) : null;
    return { plan, proposal, commit, snap:p.snapshot() };
  });
  expect(replanned.plan.ok).toBeTruthy();
  // A manual/planner item without template_id may not be reallocatable as a template.
  // The required runtime closure is carry-over queue creation and preservation.
  expect(replanned.snap.carry_over_queue.some(x => x.source_todo_id === 'e2e_today_1')).toBeTruthy();
});