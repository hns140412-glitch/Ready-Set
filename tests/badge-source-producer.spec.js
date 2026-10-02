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

test('Ready emits SELF_RETURN only from explicit pause then resume control', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  const seeded=await page.evaluate((today)=>{
    return window.ReadySetPlanner.upsertDatedTodo({
      todo_id:'badge_return_todo',
      date:today,
      label:'잠깐 쉬었다 돌아올 탐험',
      source:'PLANNER_ALLOCATION',
      source_actor:'PLANNER_MAIN',
      state:'PLANNED'
    });
  },todayKey());
  expect(seeded?.todo_id).toBe('badge_return_todo');

  await page.locator('[data-nav="mission"]').first().click();
  await page.locator('[data-todo-id="badge_return_todo"]').click();
  await page.locator('#startBtn').click();
  await expect(page.locator('#focusView')).toHaveClass(/active/);

  await page.locator('#pauseBtn').click();
  await expect(page.locator('#pauseSheet')).toBeVisible();
  const paused=await page.evaluate(()=>({pausedAt:window.__READY_SET_STATE__?.activeSession?.pausedAt||null}));
  // Runtime state is intentionally private; visible pause UI is the source-action gate.
  expect(await page.locator('#pauseBtn').textContent()).toContain('다시');

  await page.locator('#resumeFromSheetBtn').click();
  await expect(page.locator('#pauseSheet')).toBeHidden();

  const evidence=await page.evaluate(()=>{
    const c=window.ReadySetRev07.contract();
    return c.badge_source_observations||[];
  });
  const returned=evidence.find(x=>x.behavior_code==='SELF_RETURN');
  expect(returned).toMatchObject({
    contract_version:'TAKY_BADGE_SOURCE_OBSERVATION_V1',
    app_id:'READY_SET',
    event_family:'RETURN_RECOVERY',
    behavior_code:'SELF_RETURN',
    source_contract_id:'READY_EXPLICIT_PAUSE_RETURN_V1',
    explicit_child_action:true,
    disposition:'OBSERVATION_ONLY',
    badge_award_authorized:false,
    economy_mutation_authorized:false,
    catalog_activation_allowed:false,
    payload:{resumeSource:'PAUSE_SHEET_BUTTON'}
  });
  expect(evidence.filter(x=>x.behavior_code==='SELF_RETURN')).toHaveLength(1);
});


test('Ready maps explicit condition-adjustment pause to REST_AND_RETURN without duplicate SELF_RETURN', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>{
    window.ReadySetPlanner.upsertDatedTodo({
      todo_id:'badge_condition_return_todo',
      date:today,
      label:'컨디션 조절 후 돌아올 탐험',
      source:'PLANNER_ALLOCATION',
      source_actor:'PLANNER_MAIN',
      state:'PLANNED'
    });
  },todayKey());

  await page.locator('[data-nav="mission"]').first().click();
  await page.locator('[data-todo-id="badge_condition_return_todo"]').click();
  await page.locator('#startBtn').click();
  await expect(page.locator('#focusView')).toHaveClass(/active/);

  await page.locator('#pauseBtn').click();
  await expect(page.locator('#pauseSheet')).toBeVisible();
  await page.locator('[data-pause-reason="컨디션 조절"]').click();
  await page.locator('#resumeFromSheetBtn').click();
  await expect(page.locator('#pauseSheet')).toBeHidden();

  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  const rest=evidence.find(x=>x.behavior_code==='REST_AND_RETURN');
  expect(rest).toMatchObject({
    contract_version:'TAKY_BADGE_SOURCE_OBSERVATION_V1',
    app_id:'READY_SET',
    event_family:'RETURN_RECOVERY',
    behavior_code:'REST_AND_RETURN',
    source_contract_id:'READY_CONDITION_PAUSE_RETURN_V1',
    explicit_child_action:true,
    disposition:'OBSERVATION_ONLY',
    badge_award_authorized:false,
    economy_mutation_authorized:false,
    catalog_activation_allowed:false,
    payload:{
      pauseReason:'컨디션 조절',
      resumeSource:'PAUSE_SHEET_BUTTON'
    }
  });
  expect(evidence.filter(x=>x.behavior_code==='SELF_RETURN')).toHaveLength(0);
  expect(evidence.filter(x=>x.behavior_code==='REST_AND_RETURN')).toHaveLength(1);
});


test('Ready fail-closes seven minimal badge producer contracts and dedupes identical evidence', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  const result=await page.evaluate(()=>{
    const api=window.ReadyBadgeSourceObservationV01;
    const contract={badge_source_observations:[]};
    const good=[
      api.recordPreMealMicroComplete({contract,sessionId:'s1',taskRef:'t1',mealBufferRef:'meal1',smallTaskRef:'small1',completionEventRef:'done1'}),
      api.recordPostMealRestart({contract,sessionId:'s2',priorSessionRef:'prior1',mealBufferRef:'meal2',restartActionRef:'restart1'}),
      api.recordFreeWindowSelfStart({contract,sessionId:'s3',openWindowRef:'window1',taskRef:'t3',childStartActionRef:'start3'}),
      api.recordScheduledBreakReturn({contract,sessionId:'s4',breakRef:'break1',scheduledReturnAt:'2026-10-02T13:30:00+09:00',resumeActionRef:'resume4'}),
      api.recordBreakTimerReturn({contract,sessionId:'s5',timerRef:'timer5',timerExpiredAt:'2026-10-02T13:35:00+09:00',resumeActionRef:'resume5'}),
      api.recordChildPriorityChoice({contract,sessionId:'s6',choiceSetRef:'set6',selectedTaskRef:'hard6',childSelectionOrder:1,difficulty:5,startedTaskRef:'hard6',mode:'HARD_FIRST'}),
      api.recordChildPriorityChoice({contract,sessionId:'s7',choiceSetRef:'set7',selectedTaskRef:'easy7',childSelectionOrder:1,difficulty:1,startedTaskRef:'easy7',mode:'EASY_FIRST'})
    ];
    const blocked=[
      api.recordPreMealMicroComplete({contract,sessionId:'x1',taskRef:'t'}),
      api.recordPostMealRestart({contract,sessionId:'x2',priorSessionRef:'p'}),
      api.recordFreeWindowSelfStart({contract,sessionId:'x3',openWindowRef:'w',taskRef:'t'}),
      api.recordScheduledBreakReturn({contract,sessionId:'x4',breakRef:'b'}),
      api.recordBreakTimerReturn({contract,sessionId:'x5',timerRef:'timer'}),
      api.recordChildPriorityChoice({contract,sessionId:'x6',choiceSetRef:'set',selectedTaskRef:'t',childSelectionOrder:1,difficulty:5,startedTaskRef:'t',mode:'PLANNER_ORDER'})
    ];
    const duplicate=api.recordBreakTimerReturn({contract,sessionId:'s5',timerRef:'timer5',timerExpiredAt:'2026-10-02T13:35:00+09:00',resumeActionRef:'resume5'});
    return {
      good:good.map(x=>x&&({family:x.event_family,behavior:x.behavior_code,source:x.source_contract_id,explicit:x.explicit_child_action,award:x.badge_award_authorized})),
      blocked,
      duplicateEventId:duplicate?.event_id||null,
      observations:contract.badge_source_observations
    };
  });
  expect(result.good).toEqual([
    {family:'GOAL_COMPLETE',behavior:'MICRO_TASK_COMPLETE',source:'READY_PRE_MEAL_MICRO_COMPLETE_V1',explicit:true,award:false},
    {family:'RETURN_RECOVERY',behavior:'POST_MEAL_RESTART',source:'READY_POST_MEAL_RESTART_V1',explicit:true,award:false},
    {family:'TIME_CREATION',behavior:'SELF_START_IN_FREE_WINDOW',source:'READY_FREE_WINDOW_SELF_START_V1',explicit:true,award:false},
    {family:'RETURN_RECOVERY',behavior:'BREAK_RETURN',source:'READY_SCHEDULED_BREAK_RETURN_V1',explicit:true,award:false},
    {family:'RETURN_RECOVERY',behavior:'TIMER_RETURN',source:'READY_BREAK_TIMER_RETURN_V1',explicit:true,award:false},
    {family:'SELF_CHOICE',behavior:'PRIORITIZE_HARD',source:'READY_CHILD_PRIORITY_CHOICE_V1',explicit:true,award:false},
    {family:'SELF_CHOICE',behavior:'WARM_START',source:'READY_CHILD_PRIORITY_CHOICE_V1',explicit:true,award:false}
  ]);
  expect(result.blocked).toEqual([null,null,null,null,null,null]);
  expect(result.observations).toHaveLength(7);
  expect(result.observations.filter(x=>x.behavior_code==='TIMER_RETURN')).toHaveLength(1);
  expect(result.duplicateEventId).toBe(result.observations.find(x=>x.behavior_code==='TIMER_RETURN').event_id);
});


test('Ready preserves explicit child selection order instead of Planner order', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  const rows=await page.evaluate((today)=>{
    const p=window.ReadySetPlanner;
    p.upsertDatedTodo({todo_id:'choice_order_a',date:today,label:'A',source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED',order:1,difficulty:5});
    p.upsertDatedTodo({todo_id:'choice_order_b',date:today,label:'B',source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED',order:2,difficulty:1});
    return p.linkTodayItems(['choice_order_b','choice_order_a'],{allowed_states:['PLANNED']});
  },todayKey());
  expect(rows.map(x=>x.todo_id)).toEqual(['choice_order_b','choice_order_a']);
  expect(rows.map(x=>x.child_selection_order)).toEqual([1,2]);
});
