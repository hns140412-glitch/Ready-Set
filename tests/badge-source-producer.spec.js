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


test('Ready scheduled break UI emits BREAK_RETURN only inside an explicit REST buffer', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  const seeded=await page.evaluate((today)=>{
    const now=new Date();
    const hhmm=d=>\`\${String(d.getHours()).padStart(2,'0')}:\${String(d.getMinutes()).padStart(2,'0')}\`;
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
  await page.locator('[data-nav="mission"]').first().click();
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
  await page.locator('[data-nav="mission"]').first().click();
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
  await page.locator('[data-nav="mission"]').first().click();
  await page.locator('[data-todo-id="badge_micro_todo"]').click();
  await page.locator('#startBtn').click();
  await page.locator('#completeBtn').click();
  const taskId=await page.evaluate(()=>window.ReadySetRev07.contract().tasks[0].task_id);
  await page.locator(\`[data-wrap-state="COMPLETED"][data-task-id="\${taskId}"]\`).click();
  await page.locator('#rev07ConfirmEnd').click();
  await page.locator('[data-nav="mission"]').first().click();
  await page.locator('#mealStartBtn').click();
  const obs=await page.evaluate(()=>window.__READY_SET_STATE__?.records?.[0]?.rev07?.badge_source_observations||[]);
  const direct=await page.evaluate(()=>{
    const raw=JSON.parse(localStorage.getItem('readyset_state')||'{}');
    return raw.records?.[0]?.rev07?.badge_source_observations||[];
  });
  expect(direct.filter(x=>x.behavior_code==='MICRO_TASK_COMPLETE')).toHaveLength(1);
});

test('Ready emits POST_MEAL_RESTART only after explicit meal start/end then child session start', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'badge_meal_prior',date:today,label:'식사 전 탐험',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),todayKey());
  await page.locator('[data-nav="mission"]').first().click();
  await page.locator('[data-todo-id="badge_meal_prior"]').click();
  await page.locator('#startBtn').click();
  await page.locator('#completeBtn').click();
  const taskId=await page.evaluate(()=>window.ReadySetRev07.contract().tasks[0].task_id);
  await page.locator(\`[data-wrap-state="COMPLETED"][data-task-id="\${taskId}"]\`).click();
  await page.locator('#rev07ConfirmEnd').click();
  await page.locator('[data-nav="mission"]').first().click();
  await page.locator('#mealStartBtn').click();
  await page.locator('#mealEndBtn').click();
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'badge_meal_after',date:today,label:'식사 후 탐험',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),todayKey());
  await page.locator('[data-todo-id="badge_meal_after"]').click();
  await page.locator('#startBtn').click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='POST_MEAL_RESTART')).toHaveLength(1);
});

test('Ready emits SELF_START_IN_FREE_WINDOW only after explicit free-window choice', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>{
    const now=new Date();
    const hhmm=d=>\`\${String(d.getHours()).padStart(2,'0')}:\${String(d.getMinutes()).padStart(2,'0')}\`;
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
  await page.locator('[data-nav="mission"]').first().click();
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
  await page.locator('[data-nav="mission"]').first().click();
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
  await page.locator('[data-nav="mission"]').first().click();
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
  await page.locator('[data-nav="mission"]').first().click();
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
  await page.locator('[data-nav="mission"]').first().click();
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
  await page.locator('[data-nav="mission"]').first().click();
  await page.locator('[data-todo-id="micro_only"]').click();
  await page.locator('#startBtn').click();
  await page.locator('#completeBtn').click();
  const taskId=await page.evaluate(()=>window.ReadySetRev07.contract().tasks[0].task_id);
  await page.locator(\`[data-wrap-state="COMPLETED"][data-task-id="\${taskId}"]\`).click();
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
  await page.locator('[data-nav="mission"]').first().click();
  await page.locator('[data-todo-id="flow_a"]').click();
  await page.locator('[data-todo-id="flow_b"]').click();
  await page.locator('#startBtn').click();
  const tasks=await page.evaluate(()=>window.ReadySetRev07.contract().tasks);
  await page.evaluate((id)=>window.ReadySetRev07.setTaskState(id,'COMPLETED','READY_UI'),tasks[0].task_id);
  await page.locator(\`[data-rev07-task="\${tasks[1].task_id}"]\`).click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='VOLUNTARY_NEXT_TASK_CONTINUE')).toHaveLength(1);
});


test('Ready emits START_DESPITE_CONDITION only after explicit child condition-aware start choice', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil:'domcontentloaded' });
  await page.evaluate((today)=>window.ReadySetPlanner.upsertDatedTodo({
    todo_id:'condition_start_todo',date:today,label:'가능한 만큼 시작',
    source:'PLANNER_ALLOCATION',source_actor:'PLANNER_MAIN',state:'PLANNED'
  }),todayKey());
  await page.locator('[data-nav="mission"]').first().click();
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
  await page.locator('[data-nav="mission"]').first().click();
  await page.locator('[data-todo-id="persist_todo"]').click();
  await page.locator('#startBtn').click();
  await page.locator('#persistBtn').click();
  await page.locator('#completeBtn').click();
  const taskId=await page.evaluate(()=>window.ReadySetRev07.contract().tasks[0].task_id);
  await page.locator(\`[data-wrap-state="COMPLETED"][data-task-id="\${taskId}"]\`).click();
  const evidence=await page.evaluate(()=>window.ReadySetRev07.contract().badge_source_observations||[]);
  expect(evidence.filter(x=>x.behavior_code==='PERSIST_TO_COMPLETE')).toHaveLength(1);
});
