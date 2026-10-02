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

  await page.locator('[data-nav="mission"]:visible').first().click();
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

  await page.locator('[data-nav="mission"]:visible').first().click();
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
  const carryObservations=evidence.observations.filter(x=>x.behavior_code==='CARRY_OVER_COMPLETE');
  expect(carryObservations).toHaveLength(1);
  expect(carryObservations[0]).toMatchObject({
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

  await page.locator('[data-nav="mission"]:visible').first().click();
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

  await page.locator('[data-nav="mission"]:visible').first().click();
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
      api.recordScheduledBreakReturn({contract,sessionId:'s4',breakRef:'break1',scheduledReturnAt:new Date(Date.now()+10*60*1000).toISOString(),resumeActionRef:'resume4'}),
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


test('Ready scheduled break UI emits BREAK_RETURN only inside an explicit REST buffer', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  const seeded=await page.evaluate((today)=>{
    const now=new Date();
    const hhmm=d=>`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    const start=new Date(now.getTime()-60000);
    const end=new Date(now.getTime()+10*60000);
    window.ReadySetPlanner.upsertScheduleBuffer({
      buffer_id:'badge_rest_now',kind:'REST',mode:'ABSOLUTE',date:today,
      start:hhmm(start),end:hhmm(end),confirmed:true,source:'PARENT_CONFIRMED'
    });
    return window.ReadySetPlanner.upsertDatedTodo({
      todo_id:'badge_break_todo',date:today,label:'휴식 복귀 탐험',
      source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
    });
  },todayKey());
  expect(seeded?.todo_id).toBe('badge_break_todo');
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="badge_break_todo"]').click();
  await page.locator('#startBtn').click();
  await page.locator('#pauseBtn').click();
  await page.locator('#scheduledBreakBtn').click();
  await page.locator('#resumeFromSheetBtn').click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='BREAK_RETURN')).toHaveLength(1);
  expect(evidence.filter(x=>x.behavior_code==='SELF_RETURN')).toHaveLength(0);
});

test('Ready five-minute break UI does not award TIMER_RETURN before timer expiry', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'badge_timer_todo',date:today,label:'5분 휴식 탐험',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="badge_timer_todo"]').click();
  await page.locator('#startBtn').click();
  await page.locator('#pauseBtn').click();
  await page.locator('#fiveMinuteBreakBtn').click();
  await page.locator('#resumeFromSheetBtn').click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='TIMER_RETURN')).toHaveLength(0);
  expect(evidence.filter(x=>x.behavior_code==='SELF_RETURN')).toHaveLength(0);
});


test('Ready records MICRO_TASK_COMPLETE only from an explicitly marked completed task before meal start', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'badge_micro_todo',date:today,label:'작은 마무리',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED',small_task:true
  }),todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="badge_micro_todo"]').click();
  await page.locator('#startBtn').click();
  await page.locator('#completeBtn').click();
  const taskId=await page.evaluate(()=>window.ReadySetRev07.contract().tasks[0].task_id);
  await page.locator(`[data-wrap-state="COMPLETED"][data-task-id="${taskId}"]`).click();
  await page.locator('#rev07ConfirmEnd').click();
  await page.locator('#resultView [data-nav="home"]').click();
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('#mealStartBtn').click();
  const obs=await page.evaluate(()=>window.__READY_SET_STATE__?.records?.[0]?.rev07?.badge_source_observations||[]);
  const direct=await page.evaluate(()=>{
    const raw=JSON.parse(localStorage.getItem('readyset_state')||'{}');
    return raw.records?.[0]?.rev07?.badge_source_observations||[];
  });
  expect(direct.filter(x=>x.source_contract_id==='READY_PRE_MEAL_MICRO_COMPLETE_V1')).toHaveLength(1);
  expect(direct.filter(x=>x.source_contract_id==='READY_EXPLICIT_MICRO_TASK_COMPLETE_V1')).toHaveLength(1);
});

test('Ready emits POST_MEAL_RESTART only after explicit meal start/end then child session start', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'badge_meal_prior',date:today,label:'식사 전 탐험',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="badge_meal_prior"]').click();
  await page.locator('#startBtn').click();
  await page.locator('#completeBtn').click();
  const taskId=await page.evaluate(()=>window.ReadySetRev07.contract().tasks[0].task_id);
  await page.locator(`[data-wrap-state="COMPLETED"][data-task-id="${taskId}"]`).click();
  await page.locator('#rev07ConfirmEnd').click();
  await page.locator('#resultView [data-nav="home"]').click();
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('#mealStartBtn').click();
  await page.locator('#mealEndBtn').click();
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'badge_meal_after',date:today,label:'식사 후 탐험',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),todayKey());
  await page.locator('[data-nav="home"]:visible').first().click();
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="badge_meal_after"]').click();
  await page.locator('#startBtn').click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='POST_MEAL_RESTART')).toHaveLength(1);
});

test('Ready emits SELF_START_IN_FREE_WINDOW only after explicit free-window choice', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>{
    const now=new Date();
    const hhmm=d=>`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    window.ReadySetPlanner.upsertDailyAvailabilityWindow({
      availability_id:'badge_free_now',date:today,
      start:hhmm(new Date(now.getTime()-60000)),
      end:hhmm(new Date(now.getTime()+10*60000)),
      confirmed:true,source:'TEST_CONFIRMED'
    });
    window.ReadySetPlanner.upsertDatedTodo({
      todo_id:'badge_free_todo',date:today,label:'빈시간 탐험',
      source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
    });
  },todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="badge_free_todo"]').click();
  await page.locator('#freeWindowStartBtn').click();
  await page.locator('#startBtn').click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='SELF_START_IN_FREE_WINDOW')).toHaveLength(1);
});


test('Ready emits PRIORITIZE_HARD when the child explicitly chooses the hardest available task first', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>{
    const p=window.ReadySetPlanner;
    p.upsertDatedTodo({todo_id:'hard_first_h',date:today,label:'어려운 과제',source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED',difficulty:5});
    p.upsertDatedTodo({todo_id:'hard_first_e',date:today,label:'쉬운 과제',source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED',difficulty:2});
  },todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="hard_first_h"]').click();
  await page.locator('[data-todo-id="hard_first_e"]').click();
  await page.locator('#startBtn').click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='PRIORITIZE_HARD')).toHaveLength(1);
});

test('Ready emits WARM_START when the child explicitly chooses the easiest available task first', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>{
    const p=window.ReadySetPlanner;
    p.upsertDatedTodo({todo_id:'easy_first_h',date:today,label:'어려운 과제',source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED',difficulty:5});
    p.upsertDatedTodo({todo_id:'easy_first_e',date:today,label:'쉬운 과제',source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED',difficulty:2});
  },todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="easy_first_e"]').click();
  await page.locator('[data-todo-id="easy_first_h"]').click();
  await page.locator('#startBtn').click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='WARM_START')).toHaveLength(1);
});


test('Ready emits SELF_PLANNED_SEQUENCE only after explicit child order confirmation', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>{
    const p=window.ReadySetPlanner;
    p.upsertDatedTodo({todo_id:'sequence_a',date:today,label:'첫 과제',source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'});
    p.upsertDatedTodo({todo_id:'sequence_b',date:today,label:'둘째 과제',source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'});
  },todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="sequence_b"]').click();
  await page.locator('[data-todo-id="sequence_a"]').click();
  await page.locator('#confirmTaskOrderBtn').click();
  await page.locator('#startBtn').click();
  const contract=await page.evaluate(()=>window.ReadySetRev07.contract());
  const planned=contract.badge_source_observations.find(x=>x.behavior_code==='SELF_PLANNED_SEQUENCE');
  expect(planned).toBeTruthy();
  expect(planned.payload.orderedTaskRefs).toEqual(['sequence_b','sequence_a']);
  expect(contract.tasks[0].planner_todo_id).toBe('sequence_b');
});


test('Ready emits VOLUNTARY_EXTRA_AFTER_REQUIRED_COMPLETE only after required work is explicitly completed', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>{
    const p=window.ReadySetPlanner;
    p.upsertDatedTodo({
      todo_id:'required_done',date:today,label:'필수 과제',
      source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED',required_today:true
    });
    p.recordTaskState({todo_id:'required_done',ready_state:'IN_PROGRESS',session_id:'required_session',task_id:'required_task'});
    p.recordTaskState({todo_id:'required_done',ready_state:'COMPLETED',session_id:'required_session',task_id:'required_task'});
    p.upsertDatedTodo({
      todo_id:'optional_extra',date:today,label:'추가 과제',
      source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED',required_today:false
    });
  },todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="optional_extra"]').click();
  await page.locator('#startBtn').click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='VOLUNTARY_EXTRA_AFTER_REQUIRED_COMPLETE')).toHaveLength(1);
});


test('Ready emits MICRO_TASK_COMPLETE from explicit Planner small-task metadata on completion', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'micro_only',date:today,label:'작은 과제',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED',small_task:true
  }),todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="micro_only"]').click();
  await page.locator('#startBtn').click();
  await page.locator('#completeBtn').click();
  const taskId=await page.evaluate(()=>window.ReadySetRev07.contract().tasks[0].task_id);
  await page.locator(`[data-wrap-state="COMPLETED"][data-task-id="${taskId}"]`).click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.source_contract_id==='READY_EXPLICIT_MICRO_TASK_COMPLETE_V1')).toHaveLength(1);
});

test('Ready emits VOLUNTARY_NEXT_TASK_CONTINUE only when child starts a next task after completing the prior one', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>{
    const p=window.ReadySetPlanner;
    p.upsertDatedTodo({todo_id:'flow_a',date:today,label:'첫 과제',source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'});
    p.upsertDatedTodo({todo_id:'flow_b',date:today,label:'다음 과제',source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'});
  },todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="flow_a"]').click();
  await page.locator('[data-todo-id="flow_b"]').click();
  await page.locator('#startBtn').click();
  const tasks=await page.evaluate(()=>window.ReadySetRev07.contract().tasks);
  await page.evaluate((id)=>window.ReadySetRev07.setTaskState(id,'COMPLETED','READY_UI'),tasks[0].task_id);
  await page.locator(`[data-rev07-task="${tasks[1].task_id}"]`).click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='VOLUNTARY_NEXT_TASK_CONTINUE')).toHaveLength(1);
});


test('Ready emits START_DESPITE_CONDITION only after explicit child condition-aware start choice', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'condition_start_todo',date:today,label:'가능한 만큼 시작',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="condition_start_todo"]').click();
  await page.locator('#conditionStartBtn').click();
  await page.locator('#startBtn').click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='START_DESPITE_CONDITION')).toHaveLength(1);
});


test('Ready emits PERSIST_TO_COMPLETE only after explicit blocked-but-continue action then completion', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'persist_todo',date:today,label:'끝까지 해볼 과제',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="persist_todo"]').click();
  await page.locator('#startBtn').click();
  await page.locator('#radioBtn').click();
  await page.locator('[data-radio-action="PERSIST"]').click();
  await page.locator('#completeBtn').click();
  const taskId=await page.evaluate(()=>window.ReadySetRev07.contract().tasks[0].task_id);
  await page.locator(`[data-wrap-state="COMPLETED"][data-task-id="${taskId}"]`).click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='PERSIST_TO_COMPLETE')).toHaveLength(1);
});


test('Ready child chunking and plan adaptation producers fail closed without explicit evidence', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  const result=await page.evaluate(()=>{
    const api=window.ReadyBadgeSourceObservationV01;
    const contract={badge_source_observations:[]};
    const chunk=api.recordChildChunkedTask({
      contract,sessionId:'chunk_s',taskRef:'task_big',
      childChunkRefs:['chunk_1','chunk_2'],chunkConfirmActionRef:'confirm_chunks',
      completedChunkRefs:['chunk_1','chunk_2']
    });
    const adapt=api.recordChildPlanAdaptation({
      contract,sessionId:'adapt_s',scheduleChangeRef:'schedule_change_1',
      priorPlanRef:'plan_before',childReplanActionRef:'child_replan_1',
      newPlanRef:'plan_after',performedTaskRef:'task_after'
    });
    const blockedChunk=api.recordChildChunkedTask({
      contract,sessionId:'bad_chunk',taskRef:'task_big',
      childChunkRefs:['chunk_1','chunk_2'],chunkConfirmActionRef:'confirm_chunks',
      completedChunkRefs:['chunk_1']
    });
    const blockedAdapt=api.recordChildPlanAdaptation({
      contract,sessionId:'bad_adapt',priorPlanRef:'plan_before',
      childReplanActionRef:'child_replan_1',newPlanRef:'plan_after',performedTaskRef:'task_after'
    });
    return {chunk,adapt,blockedChunk,blockedAdapt,observations:contract.badge_source_observations};
  });
  expect(result.chunk).toMatchObject({behavior_code:'CHILD_CHUNKED_TASK_COMPLETE',source_contract_id:'READY_CHILD_CHUNKED_TASK_V1'});
  expect(result.adapt).toMatchObject({behavior_code:'CHILD_PLAN_ADAPTATION',source_contract_id:'READY_CHILD_REPLAN_AFTER_CHANGE_V1'});
  expect(result.blockedChunk).toBeNull();
  expect(result.blockedAdapt).toBeNull();
  expect(result.observations).toHaveLength(2);
});


test('Ready FAST_COMPLETE_WITH_CHECK requires explicit review and <= 70 percent of Planner estimate', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  const direct=await page.evaluate(()=>{
    const api=window.ReadyBadgeSourceObservationV01;
    const contract={badge_source_observations:[]};
    const pass=api.recordFastCompleteWithCheck({
      contract,sessionId:'fast_ok',taskRef:'task_ok',
      plannedMinutes:10,actualMinutes:7,checkActionRef:'check_ok',completionEventRef:'done_ok'
    });
    const tooSlow=api.recordFastCompleteWithCheck({
      contract,sessionId:'fast_no',taskRef:'task_no',
      plannedMinutes:10,actualMinutes:8,checkActionRef:'check_no',completionEventRef:'done_no'
    });
    const noCheck=api.recordFastCompleteWithCheck({
      contract,sessionId:'fast_missing',taskRef:'task_missing',
      plannedMinutes:10,actualMinutes:5,completionEventRef:'done_missing'
    });
    return {pass,tooSlow,noCheck,observations:contract.badge_source_observations};
  });
  expect(direct.pass).toMatchObject({
    behavior_code:'FAST_COMPLETE_WITH_CHECK',
    source_contract_id:'READY_FAST_COMPLETE_WITH_CHECK_V1',
    payload:{thresholdRatio:0.7,plannedMinutes:10,actualMinutes:7}
  });
  expect(direct.tooSlow).toBeNull();
  expect(direct.noCheck).toBeNull();
  expect(direct.observations).toHaveLength(1);
});

test('Ready UI emits FAST_COMPLETE_WITH_CHECK after explicit review on a fast completed estimated task', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'fast_checked_todo',date:today,label:'빠른 검토 과제',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED',estimated_minutes:10
  }),todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="fast_checked_todo"]').click();
  await page.locator('#startBtn').click();
  await page.locator('#radioBtn').click();
  await page.locator('[data-radio-action="REVIEW"]').click();
  await page.locator('#completeBtn').click();
  const taskId=await page.evaluate(()=>window.ReadySetRev07.contract().tasks[0].task_id);
  await page.locator(`[data-wrap-state="COMPLETED"][data-task-id="${taskId}"]`).click();
  await page.locator('#rev07ConfirmEnd').click();
  const evidence=await page.evaluate(()=>{
    const raw=JSON.parse(localStorage.getItem('readyset_state')||'{}');
    return raw.records?.[0]?.rev07?.badge_source_observations||[];
  });
  expect(evidence.filter(x=>x.behavior_code==='FAST_COMPLETE_WITH_CHECK')).toHaveLength(1);
});


test('Ready emits CHILD_CHUNKED_TASK_COMPLETE only after child-defined chunks are all marked complete', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'chunk_ui_todo',date:today,label:'큰 과제',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="chunk_ui_todo"]').click();
  await page.locator('#startBtn').click();
  await page.locator('#radioBtn').click();
  await page.locator('[data-radio-action="CHUNK"]').click();
  await page.locator('#chunkInput1').fill('앞부분');
  await page.locator('#chunkInput2').fill('뒷부분');
  await page.locator('#saveChunkPlanBtn').click();
  const chunkButtons=page.locator('#chunkProgress [data-chunk-index]');
  await expect(chunkButtons).toHaveCount(2);
  await chunkButtons.nth(0).click();
  await chunkButtons.nth(1).click();
  await page.locator('#completeBtn').click();
  const taskId=await page.evaluate(()=>window.ReadySetRev07.contract().tasks[0].task_id);
  await page.locator(`[data-wrap-state="COMPLETED"][data-task-id="${taskId}"]`).click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='CHILD_CHUNKED_TASK_COMPLETE')).toHaveLength(1);
});


test('Ready emits CHILD_PLAN_ADAPTATION only after schedule change, changed child plan, and actual start', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>{
    const p=window.ReadySetPlanner;
    p.upsertScheduleCommitment({
      commitment_id:'replan_change_1',title:'갑작스러운 일정',category:'OTHER',
      start_at:`${today}T18:00:00`,end_at:`${today}T19:00:00`,source:'TEST'
    });
    p.upsertDatedTodo({todo_id:'replan_a',date:today,label:'A 과제',source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'});
    p.upsertDatedTodo({todo_id:'replan_b',date:today,label:'B 과제',source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'});
  },todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="replan_a"]').click();
  await page.locator('[data-todo-id="replan_b"]').click();
  await page.locator('#replanAfterChangeBtn').click();
  await page.locator('[data-todo-id="replan_a"]').click();
  await page.locator('[data-todo-id="replan_a"]').click();
  await page.locator('#confirmTaskOrderBtn').click();
  await page.locator('#startBtn').click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='CHILD_PLAN_ADAPTATION')).toHaveLength(1);
});


test('Ready radio records reread and reflection as explicit child evidence only', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({todo_id:'radio_todo',date:today,label:'무전기 과제',source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'}),todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="radio_todo"]').click();
  await page.locator('#startBtn').click();
  await page.locator('#radioBtn').click();
  await page.locator('[data-radio-action="REREAD"]').click();
  await page.locator('#radioBtn').click();
  await page.locator('[data-radio-action="REFLECT"]').click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='REREAD_CHECK')).toHaveLength(1);
  expect(evidence.filter(x=>x.behavior_code==='REFLECT_BEFORE_PROCEED')).toHaveLength(1);
});

test('Ready radio STOP_AT_RIGHT_TIME is emitted only when the session actually ends', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({todo_id:'radio_stop_todo',date:today,label:'멈춤 판단 과제',source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'}),todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="radio_stop_todo"]').click();
  await page.locator('#startBtn').click();
  await page.locator('#radioBtn').click();
  await page.locator('[data-radio-action="STOP_RIGHT"]').click();
  let evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='STOP_AT_RIGHT_TIME')).toHaveLength(0);
  await page.locator('#completeBtn').click();
  const taskId=await page.evaluate(()=>window.ReadySetRev07.contract().tasks[0].task_id);
  await page.locator('[data-wrap-state="DEFERRED"][data-task-id="'+taskId+'"]').click();
  await page.locator('#rev07ConfirmEnd').click();
  evidence=await page.evaluate(()=>{const raw=JSON.parse(localStorage.getItem('readyset_state')||'{}');return raw.records?.[0]?.rev07?.badge_source_observations||[];});
  expect(evidence.filter(x=>x.behavior_code==='STOP_AT_RIGHT_TIME')).toHaveLength(1);
});


test('Ready radio note actions require explicit child text where semantics require it', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'radio_note_todo',date:today,label:'무전기 메모 과제',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="radio_note_todo"]').click();
  await page.locator('#startBtn').click();

  await page.locator('#radioBtn').click();
  await page.locator('#radioNote').fill('계산 순서를 반대로 봤어요');
  await page.locator('[data-radio-action="ROOT_CAUSE"]').click();

  await page.locator('#radioBtn').click();
  await page.locator('#radioNote').fill('분수는 같은 크기로 나눠진 조각이라는 뜻이에요');
  await page.locator('[data-radio-action="CONCEPT"]').click();

  await page.locator('#radioBtn').click();
  await page.locator('#radioNote').fill('식을 바로 세우기 → 그림으로 관계 보기');
  await page.locator('[data-radio-action="STRATEGY_SWITCH"]').click();

  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='ROOT_CAUSE')).toHaveLength(1);
  expect(evidence.filter(x=>x.behavior_code==='CONCEPT_UNDERSTANDING')).toHaveLength(1);
  expect(evidence.filter(x=>x.behavior_code==='STRATEGY_SWITCH')).toHaveLength(1);
});

test('Ready radio emits SINGLE_TASK_FOCUS only from explicit child focus commitment', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'single_focus_todo',date:today,label:'한 과제 집중',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="single_focus_todo"]').click();
  await page.locator('#startBtn').click();
  await page.locator('#radioBtn').click();
  await page.locator('[data-radio-action="SINGLE_FOCUS"]').click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='SINGLE_TASK_FOCUS')).toHaveLength(1);
  expect(evidence.find(x=>x.behavior_code==='SINGLE_TASK_FOCUS')).toMatchObject({
    event_family:'FOCUS',
    source_contract_id:'READY_EXPLICIT_SINGLE_TASK_FOCUS_V1',
    explicit_child_action:true
  });
});

test('Ready radio explicit self-regulation actions do not rely on elapsed time', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'radio_reg_todo',date:today,label:'자기조절 과제',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="radio_reg_todo"]').click();
  await page.locator('#startBtn').click();
  await page.locator('#radioBtn').click();
  await page.locator('[data-radio-action="DISTRACTION"]').click();
  await page.locator('#radioBtn').click();
  await page.locator('[data-radio-action="SELF_NOTICE_RETURN"]').click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='DISTRACTION_RESISTANCE')).toHaveLength(1);
  expect(evidence.filter(x=>x.behavior_code==='SELF_NOTICE_RETURN')).toHaveLength(1);
});


test('Ready careful completion requires explicit review and actual time over Planner estimate', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  const result=await page.evaluate(()=>{
    const api=window.ReadyBadgeSourceObservationV01;
    const contract={badge_source_observations:[]};
    const pass=api.recordCarefulComplete({
      contract,sessionId:'careful_ok',taskRef:'t1',plannedMinutes:10,actualMinutes:11,
      checkActionRef:'check1',completionEventRef:'done1'
    });
    const fail=api.recordCarefulComplete({
      contract,sessionId:'careful_no',taskRef:'t2',plannedMinutes:10,actualMinutes:9,
      checkActionRef:'check2',completionEventRef:'done2'
    });
    return {pass,fail,observations:contract.badge_source_observations};
  });
  expect(result.pass).toMatchObject({behavior_code:'ACCURACY_COMPLETE',source_contract_id:'READY_CAREFUL_OVERRUN_COMPLETE_V1'});
  expect(result.fail).toBeNull();
  expect(result.observations).toHaveLength(1);
});

test('Ready radio emits FOCUS_RETURN from explicit child return action', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'focus_return_todo',date:today,label:'집중 복귀 과제',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="focus_return_todo"]').click();
  await page.locator('#startBtn').click();
  await page.locator('#radioBtn').click();
  await page.locator('[data-radio-action="FOCUS_RETURN"]').click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='FOCUS_RETURN')).toHaveLength(1);
});

test('Ready meaningful overrun requires both explicit meaning text and actual overrun', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  const result=await page.evaluate(()=>{
    const api=window.ReadyBadgeSourceObservationV01;
    const contract={badge_source_observations:[]};
    const pass=api.recordMeaningfulOverrun({
      contract,sessionId:'over_ok',taskRef:'t1',plannedMinutes:10,actualMinutes:12,
      meaningArtifactRef:'meaning1',meaningText:'이 부분을 끝까지 이해하고 싶었어요',completionEventRef:'done1'
    });
    const fail=api.recordMeaningfulOverrun({
      contract,sessionId:'over_no',taskRef:'t2',plannedMinutes:10,actualMinutes:8,
      meaningArtifactRef:'meaning2',meaningText:'계속했어요',completionEventRef:'done2'
    });
    return {pass,fail,observations:contract.badge_source_observations};
  });
  expect(result.pass).toMatchObject({behavior_code:'MEANINGFUL_OVERRUN',source_contract_id:'READY_CHILD_MEANINGFUL_OVERRUN_V1'});
  expect(result.fail).toBeNull();
  expect(result.observations).toHaveLength(1);
});


test('Ready emits TASK_RESTART only from explicit child restart choice followed by start', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'restart_todo',date:today,label:'다시 시작 과제',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="restart_todo"]').click();
  await page.locator('#taskRestartStartBtn').click();
  await page.locator('#startBtn').click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='TASK_RESTART')).toHaveLength(1);
});


test('Ready BLOCK_RESOLVED first acquisition requires explicit strategy switch then same-task completion', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'block_resolved_todo',date:today,label:'막힘 해결 과제',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="block_resolved_todo"]').click();
  await page.locator('#startBtn').click();

  await page.locator('#radioBtn').click();
  await page.locator('#radioNote').fill('식으로 풀기 → 그림으로 보기');
  await page.locator('[data-radio-action="STRATEGY_SWITCH"]').click();

  await page.locator('#completeBtn').click();
  const taskId=await page.evaluate(()=>window.ReadySetRev07.contract().tasks[0].task_id);
  await page.locator(`[data-wrap-state="COMPLETED"][data-task-id="${taskId}"]`).click();

  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  const resolved=evidence.filter(x=>x.behavior_code==='BLOCK_RESOLVED');
  expect(resolved).toHaveLength(1);
  expect(resolved[0]).toMatchObject({
    event_family:'BREAKTHROUGH',
    source_contract_id:'READY_CHILD_STRATEGY_TO_COMPLETION_V1',
    explicit_child_action:true,
    disposition:'OBSERVATION_ONLY',
    badge_award_authorized:false,
    economy_mutation_authorized:false,
    catalog_activation_allowed:false
  });
});

test('Ready BLOCK_RESOLVED producer rejects missing strategy switch or completion', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  const out=await page.evaluate(()=>{
    const api=window.ReadyBadgeSourceObservationV01;
    const contract={badge_source_observations:[]};
    return {
      noStrategy:api.recordBlockResolved({
        contract,sessionId:'s1',taskRef:'t1',strategySwitchActionRef:'',completionEventRef:'done1'
      }),
      noCompletion:api.recordBlockResolved({
        contract,sessionId:'s1',taskRef:'t1',strategySwitchActionRef:'switch1',completionEventRef:''
      }),
      count:contract.badge_source_observations.length
    };
  });
  expect(out.noStrategy).toBeNull();
  expect(out.noCompletion).toBeNull();
  expect(out.count).toBe(0);
});


test('Ready emits LONG_FOCUS only after explicit single-focus commitment and same-task completion', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  const today=todayKey();
  await page.evaluate((date)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'badge_long_focus_todo',date,label:'집중 이어가기',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),today);

  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="badge_long_focus_todo"]').click();
  await page.locator('#startBtn').click();
  await expect(page.locator('#focusView')).toHaveClass(/active/);

  await page.locator('#radioBtn').click();
  await page.locator('[data-radio-action="SINGLE_FOCUS"]').click();

  let observations=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(observations.filter(x=>x.behavior_code==='SINGLE_TASK_FOCUS')).toHaveLength(1);
  expect(observations.filter(x=>x.behavior_code==='LONG_FOCUS')).toHaveLength(0);

  await page.locator('#completeBtn').click();
  const taskId=await page.evaluate(()=>window.ReadySetRev07.contract().tasks[0].task_id);
  await page.locator(`[data-wrap-state="COMPLETED"][data-task-id="${taskId}"]`).click();
  await page.locator('#rev07ConfirmEnd').click();

  observations=await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('readyset_state')||'{}');
    return state.records?.[0]?.rev07?.badge_source_observations||[];
  });
  const longFocus=observations.filter(x=>x.behavior_code==='LONG_FOCUS');
  expect(longFocus).toHaveLength(1);
  expect(longFocus[0]).toMatchObject({
    contract_version:'TAKY_BADGE_SOURCE_OBSERVATION_V1',
    app_id:'READY_SET',
    event_family:'FOCUS',
    behavior_code:'LONG_FOCUS',
    source_contract_id:'READY_CHILD_SUSTAINED_FOCUS_V1',
    explicit_child_action:true,
    disposition:'OBSERVATION_ONLY',
    badge_award_authorized:false,
    economy_mutation_authorized:false,
    catalog_activation_allowed:false
  });
});


test('Ready emits QUIET_IMMERSION only after explicit quiet-mode selection and same-task completion', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'badge_quiet_immersion_todo',date:today,label:'조용히 몰입하기',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),todayKey());

  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="badge_quiet_immersion_todo"]').click();
  await page.locator('#startBtn').click();
  await page.locator('#radioBtn').click();
  await page.locator('[data-radio-action="QUIET_IMMERSION"]').click();

  let observations=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(observations.filter(x=>x.behavior_code==='QUIET_IMMERSION')).toHaveLength(0);

  await page.locator('#completeBtn').click();
  const taskId=await page.evaluate(()=>window.ReadySetRev07.contract().tasks[0].task_id);
  await page.locator(`[data-wrap-state="COMPLETED"][data-task-id="${taskId}"]`).click();
  await page.locator('#rev07ConfirmEnd').click();

  observations=await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('readyset_state')||'{}');
    return state.records?.[0]?.rev07?.badge_source_observations||[];
  });
  const rows=observations.filter(x=>x.behavior_code==='QUIET_IMMERSION');
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    contract_version:'TAKY_BADGE_SOURCE_OBSERVATION_V1',
    app_id:'READY_SET',
    event_family:'FOCUS',
    behavior_code:'QUIET_IMMERSION',
    source_contract_id:'READY_CHILD_QUIET_IMMERSION_V1',
    explicit_child_action:true,
    disposition:'OBSERVATION_ONLY',
    badge_award_authorized:false,
    economy_mutation_authorized:false,
    catalog_activation_allowed:false
  });
});


test('Ready emits RESPONSIVE_START only from named mission briefing linked to child start', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'badge_responsive_start_todo',date:today,label:'안내 받고 시작하기',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),todayKey());

  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="badge_responsive_start_todo"]').click();

  const prompt=await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('readyset_state')||'{}');
    return state.badgeSignals?.guidancePrompt||null;
  });
  expect(prompt).toMatchObject({
    taskRef:'badge_responsive_start_todo',
    promptKind:'MISSION_BRIEFING'
  });
  expect(prompt.promptEventRef).toContain('ready-mission-briefing:badge_responsive_start_todo:');

  await page.locator('#startBtn').click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  const rows=evidence.filter(x=>x.behavior_code==='RESPONSIVE_START');
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    contract_version:'TAKY_BADGE_SOURCE_OBSERVATION_V1',
    app_id:'READY_SET',
    event_family:'SELF_START',
    behavior_code:'RESPONSIVE_START',
    source_contract_id:'READY_NAMED_PROMPT_RESPONSE_START_V1',
    explicit_child_action:true,
    disposition:'OBSERVATION_ONLY',
    badge_award_authorized:false,
    economy_mutation_authorized:false,
    catalog_activation_allowed:false,
    payload:{
      taskRef:'badge_responsive_start_todo',
      promptKind:'MISSION_BRIEFING'
    }
  });
  expect(rows[0].payload.promptEventRef).toBe(prompt.promptEventRef);
});

test('Ready responsive start producer rejects missing named prompt linkage', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  const out=await page.evaluate(()=>{
    const api=window.ReadyBadgeSourceObservationV01;
    const contract={badge_source_observations:[]};
    return {
      noPrompt:api.recordResponsiveStart({
        contract,sessionId:'s1',taskRef:'t1',promptEventRef:'',promptKind:'MISSION_BRIEFING',childStartActionRef:'start1'
      }),
      wrongPrompt:api.recordResponsiveStart({
        contract,sessionId:'s1',taskRef:'t1',promptEventRef:'p1',promptKind:'CLOCK_INFERENCE',childStartActionRef:'start1'
      }),
      count:contract.badge_source_observations.length
    };
  });
  expect(out.noPrompt).toBeNull();
  expect(out.wrongPrompt).toBeNull();
  expect(out.count).toBe(0);
});


test('Ready emits PREPARATION_COMPLETE only after explicit checklist confirmation and same-task start', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'badge_preparation_todo',date:today,label:'준비하고 시작하기',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),todayKey());

  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="badge_preparation_todo"]').click();
  await page.locator('#preparationReadyBtn').click();

  const before=await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('readyset_state')||'{}');
    return state.badgeSignals?.preparationCompleteEvidence||null;
  });
  expect(before).toMatchObject({
    taskRef:'badge_preparation_todo',
    checklistId:'READY_PRESTART_CHECKLIST_V1',
    checkedItems:['TASK_MATERIALS_READY','WORKSPACE_READY']
  });

  await page.locator('#startBtn').click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  const rows=evidence.filter(x=>x.behavior_code==='PREPARATION_COMPLETE');
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    contract_version:'TAKY_BADGE_SOURCE_OBSERVATION_V1',
    app_id:'READY_SET',
    event_family:'GOAL_COMPLETE',
    behavior_code:'PREPARATION_COMPLETE',
    source_contract_id:'READY_PREPARATION_TO_START_V1',
    explicit_child_action:true,
    disposition:'OBSERVATION_ONLY',
    badge_award_authorized:false,
    economy_mutation_authorized:false,
    catalog_activation_allowed:false,
    payload:{
      taskRef:'badge_preparation_todo',
      checklistId:'READY_PRESTART_CHECKLIST_V1',
      checkedItems:['TASK_MATERIALS_READY','WORKSPACE_READY'],
      startedTaskRef:'badge_preparation_todo'
    }
  });
});

test('Ready preparation producer rejects incomplete checklist or different started task', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  const out=await page.evaluate(()=>{
    const api=window.ReadyBadgeSourceObservationV01;
    const contract={badge_source_observations:[]};
    const base={
      contract,sessionId:'s1',taskRef:'t1',checklistId:'READY_PRESTART_CHECKLIST_V1',
      preparationConfirmActionRef:'prep1',startedTaskRef:'t1'
    };
    return {
      incomplete:api.recordPreparationToStart({...base,checkedItems:['TASK_MATERIALS_READY']}),
      wrongTask:api.recordPreparationToStart({...base,checkedItems:['TASK_MATERIALS_READY','WORKSPACE_READY'],startedTaskRef:'t2'}),
      count:contract.badge_source_observations.length
    };
  });
  expect(out.incomplete).toBeNull();
  expect(out.wrongTask).toBeNull();
  expect(out.count).toBe(0);
});


test('Ready emits EARLY_START only from a trusted future Planner availability boundary plus explicit child start', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>{
    const now=new Date(), hhmm=d=>`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    const start=new Date(now.getTime()+10*60000), end=new Date(now.getTime()+40*60000);
    window.ReadySetPlanner.upsertDailyAvailabilityWindow({availability_id:'badge_early_boundary',date:today,start:hhmm(start),end:hhmm(end),confirmed:true,source:'PLANNER_CONFIRMED'});
    window.ReadySetPlanner.upsertDatedTodo({todo_id:'badge_early_todo',date:today,label:'조금 일찍 시작',source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'});
  },todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="badge_early_todo"]').click();
  await page.locator('#startBtn').click();
  const rows=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  const early=rows.filter(x=>x.behavior_code==='EARLY_START');
  expect(early).toHaveLength(1);
  expect(early[0]).toMatchObject({event_family:'SELF_START',source_contract_id:'READY_EARLY_START_BOUNDARY_V1',explicit_child_action:true,disposition:'OBSERVATION_ONLY',badge_award_authorized:false});
  expect(early[0].payload.boundaryRef).toContain('planner-availability:badge_early_boundary');
});


test('Ready emits TIME_CREATION_EXTRA only from child-created extra slot followed by same-task execution', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'badge_extra_time_todo',date:today,label:'내가 만든 10분',source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),todayKey());
  await page.locator('[data-nav="mission"]:visible').first().click();
  await page.locator('[data-todo-id="badge_extra_time_todo"]').click();
  await page.locator('#extraTimeStartBtn').click();
  await page.locator('#startBtn').click();
  const rows=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  const extra=rows.filter(x=>x.behavior_code==='TIME_CREATION_EXTRA');
  expect(extra).toHaveLength(1);
  expect(extra[0]).toMatchObject({event_family:'TIME_CREATION',source_contract_id:'READY_CHILD_EXTRA_TIME_EXECUTION_V1',explicit_child_action:true,disposition:'OBSERVATION_ONLY',badge_award_authorized:false});
  expect(extra[0].payload.taskRef).toBe('badge_extra_time_todo');
  expect(extra[0].payload.startedTaskRef).toBe('badge_extra_time_todo');
});
