const { test, expect } = require('@playwright/test');

function todayKey(){
  const now=new Date();
  const y=now.getFullYear();
  const m=String(now.getMonth()+1).padStart(2,'0');
  const d=String(now.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

test('Ready emits one observation-only SELF_CHOICE source event for an explicit task switch', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  const seeded=await page.evaluate((today)=>{
    const p=window.ReadySetPlanner;
    const a=p.upsertDatedTodo({todo_id:'badge_choice_a',date:today,label:'첫 번째 선택',source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'});
    const b=p.upsertDatedTodo({todo_id:'badge_choice_b',date:today,label:'두 번째 선택',source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'});
    return {a,b};
  },todayKey());
  expect(seeded.a?.todo_id).toBe('badge_choice_a');
  expect(seeded.b?.todo_id).toBe('badge_choice_b');

  await page.locator('[data-nav="mission"]').first().click();
  await page.locator('[data-todo-id="badge_choice_a"]').click();
  await page.locator('[data-todo-id="badge_choice_b"]').click();
  await page.locator('#startBtn').click();
  await expect(page.locator('#focusView')).toHaveClass(/active/);

  const tasks=await page.evaluate(()=>window.ReadySetRev07.contract().tasks.map(x=>({task_id:x.task_id,planner_todo_id:x.planner_todo_id})));
  expect(tasks).toHaveLength(2);
  await page.locator(`[data-rev07-task="${tasks[1].task_id}"]`).click();

  const evidence=await page.evaluate(()=>{
    const c=window.ReadySetRev07.contract();
    return {
      active_task_id:c.active_task_id,
      observations:c.badge_source_observations||[]
    };
  });
  expect(evidence.active_task_id).toBe(tasks[1].task_id);
  expect(evidence.observations).toHaveLength(1);
  expect(evidence.observations[0]).toMatchObject({
    contract_version:'TAKY_BADGE_SOURCE_OBSERVATION_V1',
    app_id:'READY_SET',
    event_family:'SELF_CHOICE',
    behavior_code:'SELF_CHOICE',
    source_contract_id:'READY_EXPLICIT_TASK_SWITCH_V1',
    explicit_child_action:true,
    disposition:'OBSERVATION_ONLY',
    badge_award_authorized:false,
    economy_mutation_authorized:false,
    catalog_activation_allowed:false
  });
});

test('Ready emits CARRY_OVER_COMPLETE only from explicit child wrap-up on a carry-over todo', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  const seeded=await page.evaluate((today)=>{
    return window.ReadySetPlanner.upsertDatedTodo({
      todo_id:'badge_carry_todo',
      date:today,
      label:'어제 남은 탐험 마무리',
      source:'PLANNER_V2_CARRY_OVER',
      source_actor:'PLANNER_MAIN',
      state:'PLANNED',
      provenance:{
        carry_over_id:'carry_badge_1',
        source_todo_id:'carry_source_todo_1',
        root_todo_id:'carry_source_todo_1',
        carry_over_depth:1
      }
    });
  },todayKey());
  expect(seeded?.source).toBe('PLANNER_V2_CARRY_OVER');

  await page.locator('[data-nav="mission"]').first().click();
  await page.locator('[data-todo-id="badge_carry_todo"]').click();
  await page.locator('#startBtn').click();
  await expect(page.locator('#focusView')).toHaveClass(/active/);
  await page.evaluate(()=>{
    window.__readyBadgeSourceEvents=[];
    window.addEventListener('ready-badge-source-observation',event=>window.__readyBadgeSourceEvents.push(event.detail));
  });
  await page.locator('#completeBtn').click();
  await expect(page.locator('#readyRev07Wrap')).toBeVisible();

  const taskId=await page.evaluate(()=>window.ReadySetRev07.contract().tasks[0].task_id);
  await page.locator(`[data-wrap-state="COMPLETED"][data-task-id="${taskId}"]`).click();

  const evidence=await page.evaluate(()=>{
    const c=window.ReadySetRev07.contract();
    const todo=window.ReadySetPlanner.snapshot().dated_todos.find(x=>x.todo_id==='badge_carry_todo');
    return {todo,observations:c.badge_source_observations||[]};
  });
  expect(evidence.todo?.state).toBe('COMPLETED');
  expect(evidence.observations).toHaveLength(1);
  expect(evidence.observations[0]).toMatchObject({
    contract_version:'TAKY_BADGE_SOURCE_OBSERVATION_V1',
    app_id:'READY_SET',
    event_family:'GOAL_COMPLETE',
    behavior_code:'CARRY_OVER_COMPLETE',
    source_contract_id:'READY_CARRY_OVER_COMPLETION_V1',
    explicit_child_action:true,
    disposition:'OBSERVATION_ONLY',
    badge_award_authorized:false,
    economy_mutation_authorized:false,
    catalog_activation_allowed:false,
    payload:{
      plannerTodoId:'badge_carry_todo',
      carryOverId:'carry_badge_1',
      sourceTodoId:'carry_source_todo_1',
      completionSource:'WRAP_UP'
    }
  });

  await page.locator('#rev07ConfirmEnd').click();
  await expect(page.locator('#resultView')).toHaveClass(/active/);
  const emitted=await page.evaluate(()=>window.__readyBadgeSourceEvents||[]);
  const selfCheck=emitted.find(x=>x.behavior_code==='SELF_CHECK_COMPLETE');
  expect(selfCheck).toMatchObject({
    contract_version:'TAKY_BADGE_SOURCE_OBSERVATION_V1',
    app_id:'READY_SET',
    event_family:'GOAL_COMPLETE',
    behavior_code:'SELF_CHECK_COMPLETE',
    source_contract_id:'READY_WRAP_UP_SELF_CHECK_V1',
    explicit_child_action:true,
    disposition:'OBSERVATION_ONLY',
    badge_award_authorized:false,
    economy_mutation_authorized:false,
    catalog_activation_allowed:false
  });
  expect(selfCheck.payload.resolvedTaskIds).toContain(taskId);
  expect(selfCheck.payload.resolvedStates).toContain('COMPLETED');
});